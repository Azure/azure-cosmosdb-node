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

var Base = require("../base")
    , Constants = require("../constants");

var zero = require("../queryMetrics/queryMetrics").zero;

//SCRIPT START
var HeaderUtils = Base.defineClass(
    undefined, undefined,
    {
        getRequestChargeIfAny: function (headers) {
            if (typeof (headers) == 'number') {
                return headers;
            } else if (typeof (headers) == 'string') {
                return parseFloat(headers);
            }
            
            if (headers) {
                var rc = headers[Constants.HttpHeaders.RequestCharge];
                if (rc) {
                    return parseFloat(rc);
                } else {
                    return 0;
                }
            } else {
                return 0;
            }
        },
        
        getInitialHeader: function () {
            if(!zero) {
                // QueryMetrics.zero is undefined when the file loads, for some reason (maybe a circular dependency?)
                // Adding this as a hack...
                zero = require("../queryMetrics/queryMetrics").zero;
            }
            var headers = {};
            headers[Constants.HttpHeaders.RequestCharge] = 0;
            headers[Constants.HttpHeaders.QueryMetrics] = {0: zero};
            return headers;
        },
        
        mergeHeaders: function (headers, toBeMergedHeaders) {
            if (headers[Constants.HttpHeaders.RequestCharge] == undefined) {
                headers[Constants.HttpHeaders.RequestCharge] = 0;
            }
            
            if (headers[Constants.HttpHeaders.QueryMetrics] == undefined) {
                headers[Constants.HttpHeaders.QueryMetrics] = {0: zero};
            }
            
            if (!toBeMergedHeaders) {
                return;
            }
            
            headers[Constants.HttpHeaders.RequestCharge] += this.getRequestChargeIfAny(toBeMergedHeaders);
            if (toBeMergedHeaders[Constants.HttpHeaders.IsRUPerMinuteUsed]) {
                headers[Constants.HttpHeaders.IsRUPerMinuteUsed] = toBeMergedHeaders[Constants.HttpHeaders.IsRUPerMinuteUsed];
            }
            
            if (Constants.HttpHeaders.QueryMetrics in toBeMergedHeaders) {
                var headerQueryMetrics = headers[Constants.HttpHeaders.QueryMetrics];
                var toBeMergedHeaderQueryMetrics = toBeMergedHeaders[Constants.HttpHeaders.QueryMetrics];
                
                for (var partitionId in toBeMergedHeaderQueryMetrics) {
                    if (partitionId in headerQueryMetrics) {
                        var combinedQueryMetrics = headerQueryMetrics[partitionId].add(toBeMergedHeaderQueryMetrics[partitionId]);
                        headerQueryMetrics[partitionId] = combinedQueryMetrics;
                    }
                    else {
                        headerQueryMetrics[partitionId] = toBeMergedHeaderQueryMetrics[partitionId];
                    }
                }
            }
        }
    }
);
//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = HeaderUtils;
}