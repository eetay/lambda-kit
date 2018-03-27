#!/bin/bash
AWS_SDK_LOAD_CONFIG=1
AWS_REGION=us-east-1
PROFILE=samanage-sandbox
FUNC="$1"
#LOG_PARAMS="--log-file ./output.log"
FUNCROOT=packages/$FUNC
if [ ! -f $FUNCROOT/index.js ]; then
  echo "Wrong folder $FUNCROOT"
  exit 1
fi
STDPARAMS="-v $FUNCROOT -t sam/template.yaml --profile=$PROFILE"
COMMAND="sam local invoke $FUNC -v $FUNCROOT $STDPARAMS ${@:2} --parameter-values CodeUri=$FUNCROOT"
COMMAND="sam local start-api $STDPARAMS ${@:2}"
echo "Executing: $COMMAND"
$COMMAND
