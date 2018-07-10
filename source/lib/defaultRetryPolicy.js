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
    StatusCodes = require("./statusCodes").StatusCodes;

//SCRIPT START
/**
     * This class implements the default connection retry policy for requests.
     * @property {int} currentRetryAttemptCount           - Current retry attempt count.
*/
var DefaultRetryPolicy = Base.defineClass(
    /**
     * @constructor ResourceThrottleRetryPolicy
     * @param {string} operationType - The type of operation being performed.
    */
    function (operationType) {
        this._maxRetryAttemptCount = 10;
        this.currentRetryAttemptCount = 0;
        this.retryAfterInMilliseconds = 1000
        this.operationType = operationType;

        //Windows Socket Error Codes
        this.WindowsInterruptedFunctionCall = 10004;
        this.WindowsFileHandleNotValid = 10009;
        this.WindowsPermissionDenied = 10013;
        this.WindowsBadAddress = 10014;
        this.WindowsInvalidArgumnet = 10022;
        this.WindowsResourceTemporarilyUnavailable = 10035;
        this.WindowsOperationNowInProgress = 10036;
        this.WindowsAddressAlreadyInUse = 10048;
        this.WindowsConnectionResetByPeer = 10054;
        this.WindowsCannotSendAfterSocketShutdown = 10058;
        this.WindowsConnectionTimedOut = 10060;
        this.WindowsConnectionRefused = 10061;
        this.WindowsNameTooLong = 10063;
        this.WindowsHostIsDown = 10064;
        this.WindowsNoRouteTohost = 10065;

        //Linux Error Codes
        this.LinuxConnectionReset = StatusCodes.ConnectionReset;

        this.CONNECTION_ERROR_CODES = [
            this.WindowsInterruptedFunctionCall,
            this.WindowsFileHandleNotValid,
            this.WindowsPermissionDenied,
            this.WindowsBadAddress,
            this.WindowsInvalidArgumnet,
            this.WindowsResourceTemporarilyUnavailable,
            this.WindowsOperationNowInProgress,
            this.WindowsAddressAlreadyInUse,
            this.WindowsConnectionResetByPeer,
            this.WindowsCannotSendAfterSocketShutdown,
            this.WindowsConnectionTimedOut,
            this.WindowsConnectionRefused,
            this.WindowsNameTooLong,
            this.WindowsHostIsDown,
            this.WindowsNoRouteTohost,
            this.LinuxConnectionReset
        ]
    },
    {
        /**
         * Determines whether the request should be retried or not.
         * @param {object} err - Error returned by the request.
         * @param {function} callback - The callback function which takes bool argument which specifies whether the request will be retried or not.
        */
        shouldRetry: function (err, callback) {
            if (err) {
                if ((this.currentRetryAttemptCount < this._maxRetryAttemptCount) &&
                    this.needs_retry(err.code)) {
                    this.currentRetryAttemptCount++;
                    return callback(true);
                }
            }
            return callback(false);
        },

        needs_retry: function (code) {
                if ((this.operationType == "read" || this.operationType == "query") &&
                    (this.CONNECTION_ERROR_CODES.indexOf(code) != -1))
                    return true;
                else
                    return false;
        }
    }
);
//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = DefaultRetryPolicy;
}
