#!/bin/bash
AWS_SDK_LOAD_CONFIG=1
AWS_REGION=us-east-1
PROFILE=samanage-sandbox
SCRIPT=`basename $0`
FUNC="$1"
if [ -z "$FUNC" ]; then
  echo "Usage: $SCRIPT <lambda-name> "
  exit 1
fi
#LOG_PARAMS="--log-file ./output.log"
FUNCROOT=packages/$FUNC
yarn --cwd $FUNCROOT
if [ ! -f $FUNCROOT/index.js ]; then
  echo "Wrong folder $FUNCROOT"
  exit 1
fi
STDPARAMS="-v $FUNCROOT -t sam/template.yaml --profile=$PROFILE"

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
