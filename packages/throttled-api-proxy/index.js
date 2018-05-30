/*
* Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
*
*     http://aws.amazon.com/apache2.0/
*
* or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/
console.log('Loading authorizer function');
var AuthPolicy = require('./src/AuthPolicy.js');
var Redis = require('ioredis');

const logger = {
  log: function() {
    console.log('DEBUG:', ...arguments)
  }
}

Redis.Promise.onPossiblyUnhandledRejection(function (error) {
  // error.command.name is the command name
  // error.command.args is the command arguments
  logger.log(error);
});

function parse_auth_token(authorizationToken) {
  try {
    return {
      token: authorizationToken.split('Bearer')[1].trim(),
      user: null, //TODO: base64 decode
      jwt_token: null //TODO
    }
  } catch (e) {
    throw 'Failed to parse authorization token: ' + authorizationToken;
  }
}
const EETAY_USER_ID = '410895836b87a5d6d9e9d35daad82f09d670525333562b85aeb5abbc9335dba9';

exports.handler = function(event, context, callback) {
    logger.log('Event: ' + JSON.stringify(event));
    logger.log('Client token: ' + event.authorizationToken);
    logger.log('Method ARN: ' + event.methodArn);

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

    var denyAccess = function (err) {
      logger.log('Responding with: Unauthroized');
      callback("Unauthorized: " + err, null);
    }

    var grantAccess = function(auth_info_stringified) {
      var auth_info = JSON.parse(auth_info_stringified);
      logger.log(auth_info);
      authResponse.usageIdentifierKey = auth_info.apikey;
      logger.log('Responding with:', authResponse);
      callback(null, authResponse);
    }

    var redis_address = process.env.SessionCacheHost;
    logger.log('redis_address: ', redis_address);
    var redis = new Redis({
      connectTimeout: 2000,
      reconnectOnError: function (err) { denyAccess(err); return false; },
      host: redis_address,
      port: 6379
    });


    try {
      if (event.type != 'TOKEN') throw ('Wrong event type: ' + event.type)
      var token_info = parse_auth_token(event.authorizationToken);
      logger.log(token_info);
      redis.get('api_tokens:' + token_info.token).timeout(2000).then(grantAccess).catch(denyAccess);
    } catch (e) {
      denyAccess(e);
    }
    context.callbackWaitsForEmptyEventLoop = false
};
