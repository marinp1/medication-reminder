#!/bin/bash
REPO_URL="marinp1/medication-reminder"
LATEST_RELEASE=`curl --silent "https://api.github.com/repos/$REPO_URL/releases/latest"`
RELEASE_NAME=`jq -r '.name' <<< $LATEST_RELEASE`
CURRENT_RELEASE=$(cat CURRENT-RELEASE)

if [ $CURRENT_RELEASE == $RELEASE_NAME ];
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

sleep 5

echo "Deploy BPMN diagram"
DEPLOY_RESULT=`curl --silent -X POST \
  http://localhost:3000/deploy \
  -H "Authorization: $AUTH_TOKEN"`
echo $DEPLOY_RESULT

# TODO Send update message to API
