#!/bin/bash
echo "Checking docker status"
DOCKER_STATUS=`docker-machine status`
if [ "$DOCKER_STATUS" != "Running" ]; then
  echo "docker-machine status: ${DOCKER_STATUS}. Start it first"
  exit 1
fi
AWS_SDK_LOAD_CONFIG=1
AWS_REGION=us-east-1
PROFILE=samanage-sandbox
SCRIPT=`basename $0`
FUNC=`basename "$1"`
if [ -z "$FUNC" ]; then
  echo "Usage: $SCRIPT <lambda-name> "
  exit 1
fi
LOG_PARAMS="--log-file ./output.log"
FUNCROOT=packages/$FUNC
yarn --cwd $FUNCROOT
if [ ! -f $FUNCROOT/index.js ]; then
  echo "Wrong folder $FUNCROOT"
  exit 1
fi
STDPARAMS="-v $FUNCROOT -t sam/template.yaml --profile=$PROFILE --skip-pull-image"

case $SCRIPT in
start-api.sh)
  COMMAND="sam local start-api $STDPARAMS ${@:2}"
  ;;
*)
  COMMAND="sam local invoke $FUNC -v $FUNCROOT $STDPARAMS ${@:2} --parameter-values CodeUri=$FUNCROOT"
  ;;
esac

echo "Executing: $COMMAND"
$COMMAND
