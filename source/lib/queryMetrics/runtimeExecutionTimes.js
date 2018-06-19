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
    , TimeSpan = require("./timeSpan.js")
    , QueryMetricsConstants = require("./queryMetricsConstants.js")
    , QueryMetricsUtils = require("./queryMetricsUtils.js");


//SCRIPT START
var RuntimeExecutionTimes = Base.defineClass(
    function (queryEngineExecutionTime, systemFunctionExecutionTime, userDefinedFunctionExecutionTime) {
        // Constructor

        if (queryEngineExecutionTime == null) {
            throw "queryEngineExecutionTime is null or undefined";
        }
        
        if (systemFunctionExecutionTime == null) {
            throw "systemFunctionExecutionTime is null or undefined";
        }
        
        if (userDefinedFunctionExecutionTime == null) {
            throw "userDefinedFunctionExecutionTime is null or undefined";
        }
        
        this._queryEngineExecutionTime = queryEngineExecutionTime;
        this._systemFunctionExecutionTime = systemFunctionExecutionTime;
        this._userDefinedFunctionExecutionTime = userDefinedFunctionExecutionTime;
    },

    {
        // Instance Members
        
        /**
        * Gets the QueryEngineExecutionTime
        * @memberof RuntimeExecutionTimes
        * @instance
        * @ignore
        */
        _getQueryEngineExecutionTime: function () {
            return this._queryEngineExecutionTime;
        },
        
        /**
        * Gets the SystemFunctionExecutionTime
        * @memberof RuntimeExecutionTimes
        * @instance
        * @ignore
        */
        _getSystemFunctionExecutionTime: function () {
            return this._systemFunctionExecutionTime;
        },
        
        /**
        * Gets the UserDefinedFunctionExecutionTime
        * @memberof RuntimeExecutionTimes
        * @instance
        * @ignore
        */
        _getUserDefinedFunctionExecutionTime: function () {
            return this._userDefinedFunctionExecutionTime;
        },
        
        /**
        * returns a new RuntimeExecutionTimes instance that is the addition of this and the arguments.
        * @memberof RuntimeExecutionTimes
        * @instance
        * @ignore
        */
        add: function () {
            if (arguments == null || arguments.Length === 0) {
                throw "arguments was null or empty";
            }
            
            var runtimeExecutionTimesArray = [];
            var args;
            if (Array.isArray(arguments[0])) {
                // Arguments was just a single array.
                args = arguments[0];
            } else {
                // Arugments was flat var args (arg0, arg1, ..)
                args = arguments;
            }
            
            runtimeExecutionTimesArray.push(this);
            
            for (var i = 0; i < args.length; i++) {
                runtimeExecutionTimesArray.push(args[i]);
            }
            
            var queryEngineExecutionTime = TimeSpan.zero;
            var systemFunctionExecutionTime = TimeSpan.zero;
            var userDefinedFunctionExecutionTime = TimeSpan.zero;
            
            for (var i = 0; i < runtimeExecutionTimesArray.length; i++) {
                var runtimeExecutionTimes = runtimeExecutionTimesArray[i];
                
                if (runtimeExecutionTimes == null) {
                    throw "runtimeExecutionTimes has null or undefined item(s)";
                }
                
                queryEngineExecutionTime = queryEngineExecutionTime.add(runtimeExecutionTimes._queryEngineExecutionTime);
                systemFunctionExecutionTime = systemFunctionExecutionTime.add(runtimeExecutionTimes._systemFunctionExecutionTime);
                userDefinedFunctionExecutionTime = userDefinedFunctionExecutionTime.add(runtimeExecutionTimes._userDefinedFunctionExecutionTime);
            }
            
            return new RuntimeExecutionTimes(
                queryEngineExecutionTime,
                systemFunctionExecutionTime,
                userDefinedFunctionExecutionTime);
        },
        
        /**
        * Output the RuntimeExecutionTimes as a delimited string.
        * @memberof RuntimeExecutionTimes
        * @instance
        * @ignore
        */
        _toDelimitedString: function () {
            return QueryMetricsConstants.SystemFunctionExecuteTimeInMs + "=" + this._systemFunctionExecutionTime.totalMilliseconds() + ";" 
                + QueryMetricsConstants.UserDefinedFunctionExecutionTimeInMs + "=" + this._userDefinedFunctionExecutionTime.totalMilliseconds();
        },
    },

    {
        // Static Members
    }
);

var zero = new RuntimeExecutionTimes(TimeSpan.zero, TimeSpan.zero, TimeSpan.zero);

/**
* Returns a new instance of the RuntimeExecutionTimes class that is the aggregation of an array of RuntimeExecutionTimes.
* @memberof RuntimeExecutionTimes
* @instance
*/
var createFromArray = function (runtimeExecutionTimesArray) {
    if (runtimeExecutionTimesArray == null) {
        throw "runtimeExecutionTimesArray is null or undefined item(s)";
    }
    
    return zero.add(runtimeExecutionTimesArray);
};

/**
* Returns a new instance of the RuntimeExecutionTimes class this is deserialized from a delimited string.
* @memberof RuntimeExecutionTimes
* @instance
*/
var createFromDelimitedString = function (delimitedString) {
    var metrics = QueryMetricsUtils.parseDelimitedString(delimitedString);
    
    var vmExecutionTime = QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.VMExecutionTimeInMs);
    var indexLookupTime = QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.IndexLookupTimeInMs);
    var documentLoadTime = QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentLoadTimeInMs);
    var documentWriteTime = QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentWriteTimeInMs);
    
    var queryEngineExecutionTime = TimeSpan.zero;
    queryEngineExecutionTime = queryEngineExecutionTime.add(vmExecutionTime);
    queryEngineExecutionTime = queryEngineExecutionTime.subtract(indexLookupTime);
    queryEngineExecutionTime = queryEngineExecutionTime.subtract(documentLoadTime);
    queryEngineExecutionTime = queryEngineExecutionTime.subtract(documentWriteTime);
    return new RuntimeExecutionTimes(
        queryEngineExecutionTime,
        QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.SystemFunctionExecuteTimeInMs),
        QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.UserDefinedFunctionExecutionTimeInMs));
};

//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = RuntimeExecutionTimes;
    RuntimeExecutionTimes.zero = zero;
    RuntimeExecutionTimes.createFromArray = createFromArray;
    RuntimeExecutionTimes.createFromDelimitedString = createFromDelimitedString;
}