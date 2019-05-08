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

sleep 5

echo "Deploy BPMN diagram"
DEPLOY_RESULT=`curl --silent -X POST \
  http://localhost:3000/deploy \
  -H "Authorization: $AUTH_TOKEN"`
echo $DEPLOY_RESULT