#!/bin/bash
MYDIR=`dirname $0`
export AWS_SDK_LOAD_CONFIG=1
export AWS_REGION=us-east-1
export AWS_PROFILE=samanage-sandbox
export AWS_DEFAULT_VPC=`aws ec2 describe-vpcs --filters='{"Name":"isDefault","Values":["true"]}' --output text --query 'Vpcs[0].VpcId'`
export AWS_DEFAULT_VPC_SUBNETS=`aws ec2 describe-subnets --filters='{"Name":"vpc-id","Values":["'$AWS_DEFAULT_VPC'"]}' --output text --query 'Subnets[*].SubnetId' |  sed 's/\t/,/g'`
export | grep AWS | sed 's/^.*AWS/AWS/g'
#
HOST_IP=`ifconfig | grep 192.168.1 | head -1 | sed 's/ net.*$//;s/^.* 192/192/'`
FUNC=`basename "$1"`
DIR_PARAMS="--dir packages/$FUNC"
ALL_PARAMS="$DIR_PARAMS --profile=$AWS_PROFILE --debug=yes"
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
