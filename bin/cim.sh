#!/bin/bash
AWS_SDK_LOAD_CONFIG=1
AWS_REGION=us-east-1
FUNC="$1"
DIR_PARAMS="--dir packages/$FUNC"
ALL_PARAMS="$DIR_PARAMS --profile=samanage-sandbox --debug=yes"
CIM="../cim/bin/cim"
SCRIPT=`basename $0`
case $SCRIPT in
stack-show.sh)
  COMMAND="$CIM stack-show $ALL_PARAMS ${@:2}"
  ;;
stack-up.sh)
  COMMAND="$CIM stack-up $ALL_PARAMS ${@:2}"
  ;;
publish.sh)
  COMMAND="$CIM lambda-publish $ALL_PARAMS ${@:2}"
  ;;
stack-delete.sh)
  COMMAND="$CIM stack-delete $ALL_PARAMS ${@:2}"
  ;;
deploy.sh)
  COMMAND="$CIM lambda-deploy $ALL_PARAMS ${@:2}"
  ;;
esac
echo "Executing: $COMMAND"
$COMMAND
