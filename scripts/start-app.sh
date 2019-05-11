#!/bin/bash
PID=$(cat process.pid)

if ps -p $PID > /dev/null
then
  echo "$PID is running even though it should have failed... exiting"
  # TODO Send failure message to API
  exit 0
fi

echo "Load environment variables"
set -a
. ./.env
set +a

echo "Starting new process"
node dist/bundle.js &
echo $! >process.pid &

CURRENT_DIAGRAM_HASH=$(cat CURRENT-DIAGRAM)
NEW_DIAGRAM_HASH=$(cat dist/diagram.bpmn.sha256)

if [ $CURRENT_DIAGRAM_HASH == $NEW_DIAGRAM_HASH ];
then
  echo "No new release found... exiting"
  exit 0
fi

sleep 5

echo "Deploy new BPMN diagram..."
DEPLOY_RESULT=`curl --silent -X POST \
  http://localhost:3000/deploy \
  -H "Authorization: $AUTH_TOKEN"`
echo $DEPLOY_RESULT
