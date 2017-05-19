/*
The MIT License (MIT)
Copyright (c) 2017 Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

"use strict";

var Base = require("./base"),
    Constants = require("./constants"),
    EndpointDiscoveryRetryPolicy = require("./endpointDiscoveryRetryPolicy"),
    ResourceThrottleRetryPolicy = require("./resourceThrottleRetryPolicy");

//SCRIPT START
var RetryUtility = {
    /**
    * Executes the retry policy for the created request object.
    * @param {object} globalEndpointManager - an instance of GlobalEndpointManager class.
    * @param {object} body - a dictionary containing 'buffer' and 'stream' keys to hold corresponding buffer or stream body, null otherwise.
    * @param {function} createRequestObjectStub - stub function that creates the request object.
    * @param {object} connectionPolicy - an instance of ConnectionPolicy that has the connection configs.
    * @param {RequestOptions} requestOptions - The request options.
    * @param {function} callback - the callback that will be called when the request is finished executing.
    */
    execute: function (globalEndpointManager, body, createRequestObjectFunc, connectionPolicy, requestOptions, callback) {
        var self = this;
        var endpointDiscoveryRetryPolicy = new EndpointDiscoveryRetryPolicy(globalEndpointManager);
        var resourceThrottleRetryPolicy = new ResourceThrottleRetryPolicy(connectionPolicy.RetryOptions.MaxRetryAttemptCount, 
                                                connectionPolicy.RetryOptions.FixedRetryIntervalInMilliseconds,
                                                connectionPolicy.RetryOptions.MaxWaitTimeInSeconds);

        var promise = new Promise(function (resolve, reject) {
            self.apply(body, createRequestObjectFunc, connectionPolicy, requestOptions, endpointDiscoveryRetryPolicy, resourceThrottleRetryPolicy).then(resolve, reject);
        });
        if (!callback) {
            return promise;
        } else {
            promise.then(
                //TODO
                function executeSuccess(executeHash) {
                    callback(executeHash.error);
                },
                function executeFailure(executeHash) {
                    callback(executeHash.error);
                }
            );
        }
    },
    
    /**
    * Applies the retry policy for the created request object.
    * @param {object} body - a dictionary containing 'buffer' and 'stream' keys to hold corresponding buffer or stream body, null otherwise.
    * @param {function} createRequestObjectFunc - function that creates the request object.
    * @param {object} connectionPolicy - an instance of ConnectionPolicy that has the connection configs.
    * @param {RequestOptions} requestOptions - The request options.
    * @param {EndpointDiscoveryRetryPolicy} endpointDiscoveryRetryPolicy - The endpoint discovery retry policy instance.
    * @param {ResourceThrottleRetryPolicy} resourceThrottleRetryPolicy - The resource throttle retry policy instance.
    * @param {function} callback - the callback that will be called when the response is retrieved and processed.
    */
    apply: function (body, createRequestObjectFunc, connectionPolicy, requestOptions, endpointDiscoveryRetryPolicy, resourceThrottleRetryPolicy, callback) {
        var self = this;
        var promise = new Promise(function (resolve, reject) {
            var httpsRequest = createRequestObjectFunc(connectionPolicy, requestOptions, function (err, httpResponse, headers) {
                if (err) {
                    var retryPolicy = null;
                    headers = headers || {};
                    if (err.code === EndpointDiscoveryRetryPolicy.FORBIDDEN_STATUS_CODE && err.substatus === EndpointDiscoveryRetryPolicy.WRITE_FORBIDDEN_SUB_STATUS_CODE) {
                        retryPolicy = endpointDiscoveryRetryPolicy;
                    } else if (err.code === ResourceThrottleRetryPolicy.THROTTLE_STATUS_CODE) {
                        retryPolicy = resourceThrottleRetryPolicy;
                    }
                    if (retryPolicy) {
                        retryPolicy.shouldRetry(err).then(
                            function (shouldRetry) {
                                setTimeout(function () {
                                    self.apply(body, createRequestObjectFunc, connectionPolicy, requestOptions, endpointDiscoveryRetryPolicy, resourceThrottleRetryPolicy).then(resolve, reject);
                                }, retryPolicy.retryAfterInMilliseconds);
                            },
                            function (shouldRetry) {
                                headers[Constants.ThrottleRetryCount] = resourceThrottleRetryPolicy.currentRetryAttemptCount;
                                headers[Constants.ThrottleRetryWaitTimeInMs] = resourceThrottleRetryPolicy.cummulativeWaitTimeinMilliseconds;
                                //TODO reject?
                                reject({ error: err, response: httpResponse, headers: headers });
                            }
                        );
                    }
                    //TODO else?
                } else {
                    headers[Constants.ThrottleRetryCount] = resourceThrottleRetryPolicy.currentRetryAttemptCount;
                    headers[Constants.ThrottleRetryWaitTimeInMs] = resourceThrottleRetryPolicy.cummulativeWaitTimeinMilliseconds;
                    resolve({ error: err, response: httpResponse, headers: headers });
                }
            });
        
            if (httpsRequest) {
                if (body["stream"] !== null) {
                    body["stream"].pipe(httpsRequest);
                } else if (body["buffer"] !== null) {
                    httpsRequest.write(body["buffer"]);
                    httpsRequest.end();
                } else {
                    httpsRequest.end();
                }
            }
        });
        if (!callback) {
            return promise;
        } else {
            promise.then(
                function applySuccess(applyHash) {
                    callback(applyHash.error, applyHash.response, applyHash.headers);
                },
                function applyFailure(applyHash) {
                    callback(applyHash.error, applyHash.response, applyHash.headers);
                }
            );
        }
    }
}
//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = RetryUtility;
}