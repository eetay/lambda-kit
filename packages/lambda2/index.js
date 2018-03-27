'use strict';
var AWS_REGION = process.env.AWS_REGION;
var LAMBDA1 = process.env.LAMBDA1;
console.log('#### region=', AWS_REGION);
console.log('#### lambda1=', LAMBDA1);

var aws = require('aws-sdk');
var cloudformation = new aws.CloudFormation();

var params = {
  LogicalResourceId: 'LambdaFunction', /* required */
  StackName: 'lambda1' /* required */
};
cloudformation.describeStackResource(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log('########',data);           // successful response
});

exports.handler = function(event, context, callback) {
  var lambda = new aws.Lambda({region: AWS_REGION});
  lambda.invoke({
    FunctionName: 'arn:aws:lambda:us-east-1:632658757968:function:lambda1-LambdaFunction-1X15BVMX6VCDQ',
    Payload: JSON.stringify(event, null, 2)
    //InvocationType: 'Event'
  }, function(error, data) {
    if (error) {
      console.log('##### Have error', error);
      //context.log('error', error);
    }
    else if(data.Payload){
     console.log('##### Have payload', data.Payload);
     //context.succeed(data.Payload)
    }
    else {
      console.log('##### No Payload');
      //context.done('no data Payload returned');
    }
  });

  console.log('##### Finishing lambda2');
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      message: `lambda2!`,
      event: event
    }),
  });
}