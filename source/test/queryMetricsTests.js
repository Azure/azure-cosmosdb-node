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

var QueryMetrics = require("../lib/queryMetrics/queryMetrics.js");
var QueryPreparationTimes = require("../lib/queryMetrics/queryPreparationTimes.js");
var RuntimeExecutionTimes = require("../lib/queryMetrics/runtimeExecutionTimes.js");
var ClientSideMetrics = require("../lib/queryMetrics/clientSideMetrics.js");
var TimeSpan = require("../lib/queryMetrics/timeSpan.js");
var Constants = require("../lib/constants.js");
var assert = require("assert");

describe("QueryMetrics", function () {
    // Properties
    var totalQueryExecutionTime = TimeSpan.fromMilliseconds(33.67);
    var queryCompilationTime = TimeSpan.fromMilliseconds(0.06);
    var logicalPlanBuildTime = TimeSpan.fromMilliseconds(0.02);
    var physicalPlanBuildTime = TimeSpan.fromMilliseconds(0.10);
    var queryOptimizationTime = TimeSpan.fromMilliseconds(0.01);
    var vmExecutionTime = TimeSpan.fromMilliseconds(32.56);
    var indexLookupTime = TimeSpan.fromMilliseconds(0.36);
    var documentLoadTime = TimeSpan.fromMilliseconds(9.58);
    var systemFunctionExecutionTime = TimeSpan.fromMilliseconds(0.05);
    var userDefinedFunctionExecutionTime = TimeSpan.fromMilliseconds(0.07);
    var documentWriteTime = TimeSpan.fromMilliseconds(18.10);
    var retrievedDocumentCount = 2000;
    var retrievedDocumentSize = 1125600;
    var outputDocumentCount = 2000;
    var outputDocumentSize = 1125600;
    var indexUtilizationRatio = 1.00;
    var requestCharge = 42;
    
    var delimitedString = "totalExecutionTimeInMs=33.67;queryCompileTimeInMs=0.06;queryLogicalPlanBuildTimeInMs=0.02;queryPhysicalPlanBuildTimeInMs=0.10;queryOptimizationTimeInMs=0.01;VMExecutionTimeInMs=32.56;indexLookupTimeInMs=0.36;documentLoadTimeInMs=9.58;systemFunctionExecuteTimeInMs=0.05;userFunctionExecuteTimeInMs=0.07;retrievedDocumentCount=2000;retrievedDocumentSize=1125600;outputDocumentCount=2000;outputDocumentSize=1125600;writeOutputTimeInMs=18.10;indexUtilizationRatio=1.00";
    
    var queryEngineExecutionTime = TimeSpan.zero;
    queryEngineExecutionTime = queryEngineExecutionTime.add(vmExecutionTime);
    queryEngineExecutionTime = queryEngineExecutionTime.subtract(indexLookupTime);
    queryEngineExecutionTime = queryEngineExecutionTime.subtract(documentLoadTime);
    queryEngineExecutionTime = queryEngineExecutionTime.subtract(documentWriteTime);
    
    // Base line query metrics
    var queryMetrics = new QueryMetrics(
        retrievedDocumentCount,
        retrievedDocumentSize,
        outputDocumentCount,
        outputDocumentSize,
        indexUtilizationRatio * retrievedDocumentCount,
        totalQueryExecutionTime,
        new QueryPreparationTimes(queryCompilationTime, logicalPlanBuildTime, physicalPlanBuildTime, queryOptimizationTime),
        indexLookupTime,
        documentLoadTime, 
        vmExecutionTime,
        new RuntimeExecutionTimes(queryEngineExecutionTime, systemFunctionExecutionTime, userDefinedFunctionExecutionTime),
        documentWriteTime,
        new ClientSideMetrics(requestCharge));

    var assertQueryMetricsEquality = function (queryMetrics1, queryMetrics2) {
        assert.deepEqual(queryMetrics1._getIndexHitRatio(), queryMetrics2._getIndexHitRatio());
        assert.deepEqual(queryMetrics1._getOutputDocumentCount(), queryMetrics2._getOutputDocumentCount());
        assert.deepEqual(queryMetrics1._getOutputDocumentSize(), queryMetrics2._getOutputDocumentSize());
        assert.deepEqual(queryMetrics1._getRetrievedDocumentCount(), queryMetrics2._getRetrievedDocumentCount());
        assert.deepEqual(queryMetrics1._getRetrievedDocumentSize(), queryMetrics2._getRetrievedDocumentSize());
        assert.deepEqual(queryMetrics1._getTotalQueryExecutionTime(), queryMetrics2._getTotalQueryExecutionTime());
        
        assert.deepEqual(queryMetrics1._getDocumentLoadTime(), queryMetrics2._getDocumentLoadTime());
        assert.deepEqual(queryMetrics1._getDocumentWriteTime(), queryMetrics2._getDocumentWriteTime());
        assert.deepEqual(queryMetrics1._getIndexLookupTime(), queryMetrics2._getIndexLookupTime());
        assert.deepEqual(queryMetrics1._getVMExecutionTime(), queryMetrics2._getVMExecutionTime());
        
        assert.deepEqual(queryMetrics1._getQueryPreparationTimes()._getLogicalPlanBuildTime(), queryMetrics2._getQueryPreparationTimes()._getLogicalPlanBuildTime());
        assert.deepEqual(queryMetrics1._getQueryPreparationTimes()._getPhysicalPlanBuildTime(), queryMetrics2._getQueryPreparationTimes()._getPhysicalPlanBuildTime());
        assert.deepEqual(queryMetrics1._getQueryPreparationTimes()._getQueryCompilationTime(), queryMetrics2._getQueryPreparationTimes()._getQueryCompilationTime());
        assert.deepEqual(queryMetrics1._getQueryPreparationTimes()._getQueryOptimizationTime(), queryMetrics2._getQueryPreparationTimes()._getQueryOptimizationTime());
        
        assert.deepEqual(queryMetrics1._getRuntimeExecutionTimes()._getQueryEngineExecutionTime(), queryMetrics2._getRuntimeExecutionTimes()._getQueryEngineExecutionTime());
        assert.deepEqual(queryMetrics1._getRuntimeExecutionTimes()._getSystemFunctionExecutionTime(), queryMetrics2._getRuntimeExecutionTimes()._getSystemFunctionExecutionTime());
        assert.deepEqual(queryMetrics1._getRuntimeExecutionTimes()._getUserDefinedFunctionExecutionTime(), queryMetrics2._getRuntimeExecutionTimes()._getUserDefinedFunctionExecutionTime());
        
        assert.deepEqual(queryMetrics1._getClientSideMetrics()._getRequestCharge(), queryMetrics2._getClientSideMetrics()._getRequestCharge());
    };

    it("Can Be Cloned", function () {
        var queryMetrics2 = new QueryMetrics(
            queryMetrics._getRetrievedDocumentCount(),
            queryMetrics._getRetrievedDocumentSize(),
            queryMetrics._getOutputDocumentCount(),
            queryMetrics._getOutputDocumentSize(),
            queryMetrics._getIndexHitDocumentCount(),
            queryMetrics._getTotalQueryExecutionTime(),
            queryMetrics._getQueryPreparationTimes(),
            queryMetrics._getIndexLookupTime(),
            queryMetrics._getDocumentLoadTime(),
            queryMetrics._getVMExecutionTime(),
            queryMetrics._getRuntimeExecutionTimes(),
            queryMetrics._getDocumentWriteTime(),
            queryMetrics._getClientSideMetrics());

        assertQueryMetricsEquality(queryMetrics, queryMetrics2);
    });

    it("Should Add Two Query Metrics", function () {
        var doubleQueryMetrics = queryMetrics.add(queryMetrics);
        
        var doubleRetrievedDocumentCount = retrievedDocumentCount * 2;
        var doubleRetrievedDocumentSize = retrievedDocumentSize * 2;
        var doubleOutputDocumentCount = outputDocumentCount * 2;
        var doubleOutputDocumentSize = outputDocumentSize * 2;
        var doubleIndexHitCount = indexUtilizationRatio * retrievedDocumentCount * 2;
        var doubleTotalQueryExecutionTime = TimeSpan.fromMilliseconds(totalQueryExecutionTime.totalMilliseconds() * 2);
        var doubleQueryCompilationTime = TimeSpan.fromMilliseconds(queryCompilationTime.totalMilliseconds() * 2);
        var doubleLogicalPlanBuildTime = TimeSpan.fromMilliseconds(logicalPlanBuildTime.totalMilliseconds() * 2);
        var doublePhysicalPlanBuildTime = TimeSpan.fromMilliseconds(physicalPlanBuildTime.totalMilliseconds() * 2);
        var doubleQueryOptimizationTime = TimeSpan.fromMilliseconds(queryCompilationTime.totalMilliseconds() * 2);
        var doubleIndexLookupTime = TimeSpan.fromMilliseconds(indexLookupTime.totalMilliseconds() * 2);
        var doubleDocumentLoadTime = TimeSpan.fromMilliseconds(documentLoadTime.totalMilliseconds() * 2);
        var doubleVMExecutionTime = TimeSpan.fromMilliseconds(vmExecutionTime.totalMilliseconds() * 2);
        var doubleQueryOptimizationTime = TimeSpan.fromMilliseconds(queryOptimizationTime.totalMilliseconds() * 2);
        var doubleQueryEngineExecutionTime = TimeSpan.fromMilliseconds(queryEngineExecutionTime.totalMilliseconds() * 2);
        var doubleSystemFunctionExecutionTime = TimeSpan.fromMilliseconds(systemFunctionExecutionTime.totalMilliseconds() * 2);
        var doubleUserDefinedFunctionExecutionTime = TimeSpan.fromMilliseconds(userDefinedFunctionExecutionTime.totalMilliseconds() * 2);
        var doubleDocumentWriteTime = TimeSpan.fromMilliseconds(documentWriteTime.totalMilliseconds() * 2);
        var doubleRequestCharge = requestCharge * 2;

        var expectedQueryMetrics = new QueryMetrics(
            doubleRetrievedDocumentCount,
            doubleRetrievedDocumentSize,
            doubleOutputDocumentCount,
            doubleOutputDocumentSize,
            doubleIndexHitCount,
            doubleTotalQueryExecutionTime,
            new QueryPreparationTimes(doubleQueryCompilationTime, doubleLogicalPlanBuildTime, doublePhysicalPlanBuildTime, doubleQueryOptimizationTime),
            doubleIndexLookupTime,
            doubleDocumentLoadTime, 
            doubleVMExecutionTime,
            new RuntimeExecutionTimes(doubleQueryEngineExecutionTime, doubleSystemFunctionExecutionTime, doubleUserDefinedFunctionExecutionTime),
            doubleDocumentWriteTime,
            new ClientSideMetrics(doubleRequestCharge));
        
        assertQueryMetricsEquality(doubleQueryMetrics, expectedQueryMetrics);

        var queryMetricsFromCreateArray = QueryMetrics.createFromArray([queryMetrics, queryMetrics]);

        assertQueryMetricsEquality(queryMetricsFromCreateArray, expectedQueryMetrics);
    });

    it("Can Be Create From Delimited String", function () {
        var queryMetricsFromDelimitedString = QueryMetrics.createFromDelimitedString(delimitedString, new ClientSideMetrics(requestCharge));

        assertQueryMetricsEquality(queryMetricsFromDelimitedString, queryMetrics);
    });

    it("Can Be Converted To A Delimited String", function () {
        var delimitedStringFromMetrics = queryMetrics._toDelimitedString();
        var queryMetricsFromDelimitedString = QueryMetrics.createFromDelimitedString(delimitedStringFromMetrics, new ClientSideMetrics(requestCharge));

        assertQueryMetricsEquality(queryMetrics, queryMetricsFromDelimitedString);
    });
});
