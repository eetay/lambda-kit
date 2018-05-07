/*
* Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
*
*     http://aws.amazon.com/apache2.0/
*
* or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
console.log('Loading extra new function');
var AuthPolicy = require('./src/AuthPolicy.js');
var jwt = require('jsonwebtoken');

/* Output from an Amazon API Gateway Lambda Authorizer
https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-lambda-authorizer-output.html
--------------------------------
{
  "principalId": "yyyyyyyy", // The principal user identification associated with the token sent by the client.
  "policyDocument": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "execute-api:Invoke",
        "Effect": "Allow|Deny",
        "Resource": "arn:aws:execute-api:{regionId}:{accountId}:{appId}/{stage}/{httpVerb}/[{resource}/[child-resources]]"
      }
    ]
  },
  "context": {
    "stringKey": "value",
    "numberKey": "1",
    "booleanKey": "true"
  },
  "usageIdentifierKey": "{api-key}"
}
---------------------------------*/
const KEYS=[
  'APuQmrUSup7Eh5JlMm8TQe1yUgwGhZy4eaJEiy0g',
  'tEy7OuNOzi9QWT8CMh0Mn97Wevmm650R8s6IXKsX'
]

const EETAY_USER_ID = '410895836b87a5d6d9e9d35daad82f09d670525333562b85aeb5abbc9335dba9';

function decodeAuthToken(token, success, failure) {
  try {
    // token format is "Bearer <something>:<jwt>"
    jwt_info = jwt.decode(token.split(':')[1]) // unverified info (we don't have the secret)
    console.log('decoded api gateway authz info: ', jwt_info.api_key_name, jwt_info.api_key_authz)
    success(jwt_info.api_key_authz);
    /*
    apiGateway.getApiKeys(
      {nameQuery: jwt_info.api_key_name, includeValues: true},
      function(err, data) {
        if (err) {
          console.log(err, err.stack); // an error occurred
          failure(err);
        }
        else {
          console.log(data.items[0].value);
          success(data.items[0].value);
        }
      }
    );
    */
  }
  catch (e) {
    console.log('decodeAuthToken', e);
    failure(e);
  }
}

console.log('Loading extra new function');

exports.handler = function(event, context, callback) {
    console.log('Event: ' + JSON.stringify(event));
    console.log('Client token: ' + event.authorizationToken);
    console.log('Method ARN: ' + event.methodArn);

    // you can send a 401 Unauthorized response to the client by failing like so:
    // callback("Unauthorized", null);

    // if the token is valid, a policy must be generated which will allow or deny access to the client

    // if access is denied, the client will receive a 403 Access Denied response
    // if access is allowed, API Gateway will proceed with the backend integration configured on the method that was called

    var principalId = 'user|'+ EETAY_USER_ID;

    // build apiOptions for the AuthPolicy
    var apiOptions = {};
    var tmp = event.methodArn.split(':');
    var apiGatewayArnTmp = tmp[5].split('/');
    var awsAccountId = tmp[4];
    apiOptions.region = tmp[3];
    apiOptions.restApiId = apiGatewayArnTmp[0];
    apiOptions.stage = apiGatewayArnTmp[1];
    var method = apiGatewayArnTmp[2];
    var resource = '/'; // root resource
    if (apiGatewayArnTmp[3]) {
        resource += apiGatewayArnTmp.slice(3, apiGatewayArnTmp.length).join('/');
    }

    // this function must generate a policy that is associated with the recognized principal user identifier.
    // depending on your use case, you might store policies in a DB, or generate them on the fly

    // keep in mind, the policy is cached for 5 minutes by default (TTL is configurable in the authorizer)
    // and will apply to subsequent calls to any method/resource in the RestApi
    // made with the same token

    // the example policy below denies access to all resources in the RestApi
    var policy = new AuthPolicy(principalId, awsAccountId, apiOptions);
    policy.allowAllMethods();
    // policy.allowMethod(AuthPolicy.HttpVerb.GET, "/users/username");

    // finally, build the policy
    var authResponse = policy.build();

    // new! -- add additional key-value pairs
    // these are made available by APIGW like so: $context.authorizer.<key>
    // additional context is cached
    authResponse.context = {
        key : 'value', // $context.authorizer.key -> value
        number : 1,
        bool: true
    };
    // authResponse.context.arr = ['foo']; <- this is invalid, APIGW will not accept it
    // authResponse.context.obj = {'foo':'bar'}; <- also invalid
    
    decodeAuthToken(
      event.authorizationToken, 
      function(key) {
        authResponse.usageIdentifierKey = key;
        console.log('Responding with: ' + JSON.stringify(authResponse));
        callback(null, authResponse);
      }, 
      function (err) {
        callback("Unauthorized", null);
      }
    );
};
