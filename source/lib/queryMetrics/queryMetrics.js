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
    , QueryPreparationTimes = require("./queryPreparationTimes.js")
    , RuntimeExecutionTimes = require("./runtimeExecutionTimes.js")
    , ClientSideMetrics = require("./clientSideMetrics.js")
    , QueryMetricsUtils = require("./queryMetricsUtils.js");

//SCRIPT START
var QueryMetrics = Base.defineClass(
    function (
        retrievedDocumentCount,
        retrievedDocumentSize,
        outputDocumentCount,
        outputDocumentSize,
        indexHitDocumentCount,
        totalQueryExecutionTime,
        queryPreparationTimes,
        indexLookupTime,
        documentLoadTime, 
        vmExecutionTime,
        runtimeExecutionTimes,
        documentWriteTime,
        clientSideMetrics) {
        // Constructor

        if (!QueryMetricsUtils.isNumeric(retrievedDocumentCount)) {
            throw "retrievedDocumentCount is not a numeric type";
        }
        
        if (!QueryMetricsUtils.isNumeric(retrievedDocumentSize)) {
            throw "retrievedDocumentSize is not a numeric type";
        }
        
        if (!QueryMetricsUtils.isNumeric(outputDocumentCount)) {
            throw "outputDocumentCount is not a numeric type";
        }
        
        if (!QueryMetricsUtils.isNumeric(indexHitDocumentCount)) {
            throw "indexHitDocumentCount is not a numeric type";
        }
        
        if (totalQueryExecutionTime == null) {
            throw "totalQueryExecutionTime is null or undefined";
        }

        if (queryPreparationTimes == null) {
            throw "queryPreparationTimes is null or undefined";
        }
        
        if (documentLoadTime == null) {
            throw "documentLoadTime is null or undefined";
        }
        
        if (vmExecutionTime == null) {
            throw "vmExecutionTime is null or undefined";
        }
        
        if (runtimeExecutionTimes == null) {
            throw "runtimeExecutionTimes is null or undefined";
        }
        
        if (documentWriteTime == null) {
            throw "documentWriteTime is null or undefined";
        }
        
        if (clientSideMetrics == null) {
            throw "clientSideMetrics is null or undefined";
        }
        
        this._retrievedDocumentCount = retrievedDocumentCount;
        this._retrievedDocumentSize = retrievedDocumentSize;
        this._outputDocumentCount = outputDocumentCount;
        this._outputDocumentSize = outputDocumentSize;
        this._indexHitDocumentCount = indexHitDocumentCount;
        this._totalQueryExecutionTime = totalQueryExecutionTime;
        this._queryPreparationTimes = queryPreparationTimes;
        this._indexLookupTime = indexLookupTime;
        this._documentLoadTime = documentLoadTime;
        this._vmExecutionTime = vmExecutionTime;
        this._runtimeExecutionTimes = runtimeExecutionTimes;
        this._documentWriteTime = documentWriteTime;
        this._clientSideMetrics = clientSideMetrics;
    },

    {
        // Instance Members
        
        /**
        * Gets the RetrievedDocumentCount
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getRetrievedDocumentCount: function () {
            return this._retrievedDocumentCount;
        },
        
        /**
        * Gets the RetrievedDocumentSize
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getRetrievedDocumentSize: function () {
            return this._retrievedDocumentSize;
        },
        
        /**
        * Gets the OutputDocumentCount
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getOutputDocumentCount: function () {
            return this._outputDocumentCount;
        },
        
        /**
        * Gets the OutputDocumentSize
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getOutputDocumentSize: function () {
            return this._outputDocumentSize;
        },
        
        /**
        * Gets the IndexHitDocumentCount
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getIndexHitDocumentCount: function () {
            return this._indexHitDocumentCount;
        },
        
        /**
        * Gets the IndexHitRatio
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getIndexHitRatio: function () {
            return this._retrievedDocumentCount === 0 ? 1 : this._indexHitDocumentCount / this._retrievedDocumentCount;
        },
        
        /**
        * Gets the TotalQueryExecutionTime
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getTotalQueryExecutionTime: function () {
            return this._totalQueryExecutionTime;
        },
        
        /**
        * Gets the QueryPreparationTimes
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getQueryPreparationTimes: function () {
            return this._queryPreparationTimes;
        },
        
        /**
        * Gets the IndexLookupTime
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getIndexLookupTime: function () {
            return this._indexLookupTime;
        },
        
        /**
        * Gets the DocumentLoadTime
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getDocumentLoadTime: function () {
            return this._documentLoadTime;
        },
        
        /**
        * Gets the VmExecutionTime
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getVMExecutionTime: function () {
            return this._vmExecutionTime;
        },
        
        /**
        * Gets the RuntimeExecutionTimes
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getRuntimeExecutionTimes: function () {
            return this._runtimeExecutionTimes;
        },
        
        /**
        * Gets the DocumentWriteTime
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getDocumentWriteTime: function () {
            return this._documentWriteTime;
        },
        
        /**
        * Gets the ClientSideMetrics
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _getClientSideMetrics: function () {
            return this._clientSideMetrics;
        },
        
        /**
        * returns a new QueryMetrics instance that is the addition of this and the arguments.
        * @memberof QueryMetrics
        * @instance
        */
        add: function () {
            if (arguments == null || arguments.length === 0) {
                throw "arguments was null or empty";
            }
            
            var queryMetricsArray = [];
            var args;
            if (Array.isArray(arguments[0])) {
                // Arguments was just a single array.
                args = arguments[0];
            } else {
                // Arugments was flat var args (arg0, arg1, ..)
                args = arguments;
            }
            
            queryMetricsArray.push(this);
            
            for (var i = 0; i < args.length; i++) {
                queryMetricsArray.push(args[i]);
            }
            
            var retrievedDocumentCount = 0;
            var retrievedDocumentSize = 0;
            var outputDocumentCount = 0;
            var outputDocumentSize = 0;
            var indexHitDocumentCount = 0;
            var totalQueryExecutionTime = TimeSpan.zero;
            var queryPreparationTimesArray = [];
            var indexLookupTime = TimeSpan.zero;
            var documentLoadTime = TimeSpan.zero;
            var vmExecutionTime = TimeSpan.zero;
            var runtimeExecutionTimesArray = [];
            var documentWriteTime = TimeSpan.zero;
            var clientSideQueryMetricsArray = [];
            
            for (var i = 0; i < queryMetricsArray.length; i++) {
                var queryMetrics = queryMetricsArray[i];
                
                if (queryMetrics == null) {
                    throw "queryMetricsArray has null or undefined item(s)";
                }
                
                retrievedDocumentCount += queryMetrics._retrievedDocumentCount;
                retrievedDocumentSize += queryMetrics._retrievedDocumentSize;
                outputDocumentCount += queryMetrics._outputDocumentCount;
                outputDocumentSize += queryMetrics._outputDocumentSize;
                indexHitDocumentCount += queryMetrics._indexHitDocumentCount;
                totalQueryExecutionTime = totalQueryExecutionTime.add(queryMetrics._totalQueryExecutionTime);
                queryPreparationTimesArray.push(queryMetrics._queryPreparationTimes);
                indexLookupTime = indexLookupTime.add(queryMetrics._indexLookupTime);
                documentLoadTime = documentLoadTime.add(queryMetrics._documentLoadTime);
                vmExecutionTime = vmExecutionTime.add(queryMetrics._vmExecutionTime);
                runtimeExecutionTimesArray.push(queryMetrics._runtimeExecutionTimes);
                documentWriteTime = documentWriteTime.add(queryMetrics._documentWriteTime);
                clientSideQueryMetricsArray.push(queryMetrics._clientSideMetrics);
            }
            
            return new QueryMetrics(
                retrievedDocumentCount,
                retrievedDocumentSize,
                outputDocumentCount,
                outputDocumentSize,
                indexHitDocumentCount,
                totalQueryExecutionTime,
                QueryPreparationTimes.createFromArray(queryPreparationTimesArray),
                indexLookupTime,
                documentLoadTime,
                vmExecutionTime,
                RuntimeExecutionTimes.createFromArray(runtimeExecutionTimesArray),
                documentWriteTime,
                ClientSideMetrics.createFromArray(clientSideQueryMetricsArray));
        },
        
        /**
        * Output the QueryMetrics as a delimited string.
        * @memberof QueryMetrics
        * @instance
        * @ignore
        */
        _toDelimitedString: function () {
            return QueryMetricsConstants.RetrievedDocumentCount + "=" + this._retrievedDocumentCount + ";" 
                + QueryMetricsConstants.RetrievedDocumentSize + "=" + this._retrievedDocumentSize + ";" 
                + QueryMetricsConstants.OutputDocumentCount + "=" + this._outputDocumentCount + ";" 
                + QueryMetricsConstants.OutputDocumentSize + "=" + this._outputDocumentSize + ";" 
                + QueryMetricsConstants.IndexHitRatio + "=" + this._getIndexHitRatio() + ";" 
                + QueryMetricsConstants.TotalQueryExecutionTimeInMs + "=" + this._totalQueryExecutionTime.totalMilliseconds() + ";" 
                + this._queryPreparationTimes._toDelimitedString() + ";" 
                + QueryMetricsConstants.IndexLookupTimeInMs + "=" + this._indexLookupTime.totalMilliseconds() + ";" 
                + QueryMetricsConstants.DocumentLoadTimeInMs + "=" + this._documentLoadTime.totalMilliseconds() + ";" 
                + QueryMetricsConstants.VMExecutionTimeInMs + "=" + this._vmExecutionTime.totalMilliseconds() + ";" 
                + this._runtimeExecutionTimes._toDelimitedString() + ";" 
                + QueryMetricsConstants.DocumentWriteTimeInMs + "=" + this._documentWriteTime.totalMilliseconds();
        }
    },

    {
        // Static Members
    }
);
var zero = new QueryMetrics(0, 0, 0, 0, 0, TimeSpan.zero, QueryPreparationTimes.zero, TimeSpan.zero, TimeSpan.zero, TimeSpan.zero, RuntimeExecutionTimes.zero, TimeSpan.zero, ClientSideMetrics.zero);

/**
* Returns a new instance of the QueryMetrics class that is the aggregation of an array of query metrics.
* @memberof QueryMetrics
* @instance
*/
var createFromArray = function (queryMetricsArray) {
    if (queryMetricsArray == null) {
        throw "queryMetricsArray is null or undefined item(s)";
    }
    
    return zero.add(queryMetricsArray);
};

/**
* Returns a new instance of the QueryMetrics class this is deserialized from a delimited string.
* @memberof QueryMetrics
* @instance
*/
var createFromDelimitedString = function (delimitedString, clientSideMetrics) {
    var metrics = QueryMetricsUtils.parseDelimitedString(delimitedString);
    
    var indexHitRatio = metrics[QueryMetricsConstants.IndexHitRatio] || 0;
    var retrievedDocumentCount = metrics[QueryMetricsConstants.RetrievedDocumentCount] || 0;
    var indexHitCount = indexHitRatio * retrievedDocumentCount;
    var outputDocumentCount = metrics[QueryMetricsConstants.OutputDocumentCount] || 0;
    var outputDocumentSize = metrics[QueryMetricsConstants.OutputDocumentSize] || 0;
    var retrievedDocumentSize = metrics[QueryMetricsConstants.RetrievedDocumentSize] || 0;
    var totalQueryExecutionTime = QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.TotalQueryExecutionTimeInMs);
    return new QueryMetrics(
        retrievedDocumentCount,
        retrievedDocumentSize,
        outputDocumentCount,
        outputDocumentSize,
        indexHitCount,
        totalQueryExecutionTime,
        QueryPreparationTimes.createFromDelimitedString(delimitedString),
        QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.IndexLookupTimeInMs),
        QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentLoadTimeInMs),
        QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.VMExecutionTimeInMs),
        RuntimeExecutionTimes.createFromDelimitedString(delimitedString),
        QueryMetricsUtils.timeSpanFromMetrics(metrics, QueryMetricsConstants.DocumentWriteTimeInMs),
        clientSideMetrics || ClientSideMetrics.zero);
};

//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = QueryMetrics;
    QueryMetrics.zero = zero;
    QueryMetrics.createFromArray = createFromArray;
    QueryMetrics.createFromDelimitedString = createFromDelimitedString;
}