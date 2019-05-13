#!/bin/bash
REPO_URL="marinp1/medication-reminder"
LATEST_RELEASE=`curl --silent "https://api.github.com/repos/$REPO_URL/releases/latest"`
RELEASE_NAME=`jq -r '.tag_name' <<< $LATEST_RELEASE`
UPDATE_NOTES=`jq -r '.body' <<< $LATEST_RELEASE`
CREATION_DATE=`jq -r '.created_at' <<< $LATEST_RELEASE`
CURRENT_RELEASE=$(cat CURRENT-RELEASE)

if [ "$CURRENT_RELEASE" == "$RELEASE_NAME" ] && [ "$1" != "-F" ];
then
  echo "No new release found... exiting"
  exit 0
fi

DOWNLOAD_LINK=`jq -r '.assets[].browser_download_url | select(endswith(".tar.gz"))' <<< $LATEST_RELEASE`
wget -N $DOWNLOAD_LINK -O $RELEASE_NAME.tar.gz

echo "Killing current process"
PID=$(cat process.pid)
kill $PID

sleep 5

if ps -p $PID > /dev/null
then
  echo "$PID is running even though it should have failed... exiting"
  # TODO Send failure message to API
  exit 0
fi

rm process.pid

echo "Removing existing distribution and unpacking new release"
rm -rf dist/
tar -xvzf $RELEASE_NAME.tar.gz

echo "Load environment variables"
set -a
. ./.env
set +a

echo "Install node modules"
cd dist/
npm install --only=prod
cd ..

echo "Starting new process"
node dist/bundle.js &
echo $! >process.pid

rm $RELEASE_NAME.tar.gz

# Update RELEASE information
echo -n $RELEASE_NAME > CURRENT-RELEASE

sleep 5

CURRENT_DIAGRAM_HASH=$(cat CURRENT-DIAGRAM)
NEW_DIAGRAM_HASH=$(cat dist/diagram.bpmn.sha256)

DIAGRAM_UPDATE=false

if [ "$CURRENT_DIAGRAM_HASH" != "$NEW_DIAGRAM_HASH" ];
then
  echo "Deploy new BPMN diagram..."
  DEPLOY_RESULT=`curl --silent -X POST \
    http://localhost:3000/deploy \
    -H "Authorization: $AUTH_TOKEN"`
  echo $DEPLOY_RESULT

  # Update DIAGRAM HASH information
  echo -n $NEW_DIAGRAM_HASH > CURRENT-DIAGRAM
  DIAGRAM_UPDATE=true
fi

# Send update message to API
DEPLOY_RESULT=`curl --silent -X POST \
  http://localhost:3000/update-notes \
  -H "Authorization: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
	"date": "'"$CREATION_DATE"'",
	"oldVersion": "'"${CURRENT_RELEASE:1}"'",
	"newVersion": "'"${RELEASE_NAME:1}"'",
	"updateNotes": "'"$UPDATE_NOTES"'",
	"diagramUpdate": '$DIAGRAM_UPDATE'
}'` 

echo $DEPLOY_RESULT
