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
var QueryPreparationTimes = Base.defineClass(
    function (queryCompilationTime, logicalPlanBuildTime, physicalPlanBuildTime, queryOptimizationTime) {
        if (queryCompilationTime == null) {
            throw "queryCompilationTime is null or undefined";
        }
        
        if (logicalPlanBuildTime == null) {
            throw "logicalPlanBuildTime is null or undefined";
        }
        
        if (physicalPlanBuildTime == null) {
            throw "physicalPlanBuildTime is null or undefined";
        }
        
        if (queryOptimizationTime == null) {
            throw "queryOptimizationTime is null or undefined";
        }
        
        // Constructor
        this._queryCompilationTime = queryCompilationTime;
        this._logicalPlanBuildTime = logicalPlanBuildTime;
        this._physicalPlanBuildTime = physicalPlanBuildTime;
        this._queryOptimizationTime = queryOptimizationTime;
    },

    {
        // Instance Members
        
        /**
        * Gets the QueryCompilationTime
        * @memberof QueryPreparationTimes
        * @instance
        * @ignore
        */
        _getQueryCompilationTime: function () {
            return this._queryCompilationTime;
        },
        
        /**
        * Gets the LogicalPlanBuildTime
        * @memberof QueryPreparationTimes
        * @instance
        * @ignore
        */
        _getLogicalPlanBuildTime: function () {
            return this._logicalPlanBuildTime;
        },
        
        /**
        * Gets the PhysicalPlanBuildTime
        * @memberof QueryPreparationTimes
        * @instance
        * @ignore
        */
        _getPhysicalPlanBuildTime: function () {
            return this._physicalPlanBuildTime;
        },
        
        /**
        * Gets the QueryOptimizationTime
        * @memberof QueryPreparationTimes
        * @instance
        * @ignore
        */
        _getQueryOptimizationTime: function () {
            return this._queryOptimizationTime;
        },
        
        /**
        * returns a new QueryPreparationTimes instance that is the addition of this and the arguments.
        * @memberof QueryPreparationTimes
        * @instance
        * @ignore
        */
        add: function () {
            if (arguments == null || arguments.Length === 0) {
                throw "arguments was null or empty";
            }
            
            var queryPreparationTimesArray = [];
            var args;
            if (Array.isArray(arguments[0])) {
                // Arguments was just a single array.
                args = arguments[0];
            } else {
                // Arugments was flat var args (arg0, arg1, ..)
                args = arguments;
            }
            
            queryPreparationTimesArray.push(this);
            
            for (var i = 0; i < args.length; i++) {
                queryPreparationTimesArray.push(args[i]);
            }
            
            var queryCompilationTime = TimeSpan.zero;
            var logicalPlanBuildTime = TimeSpan.zero;
            var physicalPlanBuildTime = TimeSpan.zero;
            var queryOptimizationTime = TimeSpan.zero;
            
            for (var i = 0; i < queryPreparationTimesArray.length; i++) {
                var queryPreparationTimes = queryPreparationTimesArray[i];
                
                if (queryPreparationTimes == null) {
                    throw "queryPreparationTimesArray has null or undefined item(s)";
                }
                
                queryCompilationTime = queryCompilationTime.add(queryPreparationTimes._queryCompilationTime);
                logicalPlanBuildTime = logicalPlanBuildTime.add(queryPreparationTimes._logicalPlanBuildTime);
                physicalPlanBuildTime = physicalPlanBuildTime.add(queryPreparationTimes._physicalPlanBuildTime);
                queryOptimizationTime = queryOptimizationTime.add(queryPreparationTimes._queryOptimizationTime);
            }
            
            return new QueryPreparationTimes(
                queryCompilationTime,
                logicalPlanBuildTime,
                physicalPlanBuildTime,
                queryOptimizationTime);
        },
        
        /**
        * Output the QueryPreparationTimes as a delimited string.
        * @memberof QueryPreparationTimes
        * @instance
        * @ignore
        */
        _toDelimitedString: function () {
            return QueryMetricsConstants.QueryCompileTimeInMs + "=" + this._queryCompilationTime.totalMilliseconds() + ";" 
                + QueryMetricsConstants.LogicalPlanBuildTimeInMs + "=" + this._logicalPlanBuildTime.totalMilliseconds() + ";" 
                + QueryMetricsConstants.PhysicalPlanBuildTimeInMs + "=" + this._physicalPlanBuildTime.totalMilliseconds() + ";" 
                + QueryMetricsConstants.QueryOptimizationTimeInMs + "=" + this._queryOptimizationTime.totalMilliseconds();
        },
    },

    {
        // Static Members
    }
);

var zero = new QueryPreparationTimes(TimeSpan.zero, TimeSpan.zero, TimeSpan.zero, TimeSpan.zero);

/**
* Returns a new instance of the QueryPreparationTimes class that is the aggregation of an array of QueryPreparationTimes.
* @memberof QueryMetrics
* @instance
*/
var createFromArray = function (queryPreparationTimesArray) {
    if (queryPreparationTimesArray == null) {
        throw "queryPreparationTimesArray is null or undefined item(s)";
    }
    
    return zero.add(queryPreparationTimesArray);
};

/**
* Returns a new instance of the QueryPreparationTimes class this is deserialized from a delimited string.
* @memberof QueryMetrics
* @instance
*/
var createFromDelimitedString = function (delimitedString) {
    var metrics = QueryMetricsUtils.parseDelimitedString(delimitedString);
    
    return new QueryPreparationTimes(
        QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.QueryCompileTimeInMs),
        QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.LogicalPlanBuildTimeInMs),
        QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.PhysicalPlanBuildTimeInMs),
        QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.QueryOptimizationTimeInMs));
};

//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = QueryPreparationTimes;
    QueryPreparationTimes.zero = zero;
    QueryPreparationTimes.createFromArray = createFromArray;
    QueryPreparationTimes.createFromDelimitedString = createFromDelimitedString;
}