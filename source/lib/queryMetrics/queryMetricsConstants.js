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

var Base = require("../base");

//SCRIPT START
var QueryMetricsConstants = {
    // Static Members
    
    // QueryMetrics
    RetrievedDocumentCount : "retrievedDocumentCount",
    RetrievedDocumentSize : "retrievedDocumentSize",
    OutputDocumentCount : "outputDocumentCount",
    OutputDocumentSize : "outputDocumentSize",
    IndexHitRatio : "indexUtilizationRatio",
    IndexHitDocumentCount : "indexHitDocumentCount",
    TotalQueryExecutionTimeInMs : "totalExecutionTimeInMs",
    
    // QueryPreparationTimes
    QueryCompileTimeInMs : "queryCompileTimeInMs",
    LogicalPlanBuildTimeInMs : "queryLogicalPlanBuildTimeInMs",
    PhysicalPlanBuildTimeInMs : "queryPhysicalPlanBuildTimeInMs",
    QueryOptimizationTimeInMs : "queryOptimizationTimeInMs",
    
    // QueryTimes
    IndexLookupTimeInMs : "indexLookupTimeInMs",
    DocumentLoadTimeInMs : "documentLoadTimeInMs",
    VMExecutionTimeInMs : "VMExecutionTimeInMs",
    DocumentWriteTimeInMs : "writeOutputTimeInMs",
    
    // RuntimeExecutionTimes
    QueryEngineTimes : "queryEngineTimes",
    SystemFunctionExecuteTimeInMs : "systemFunctionExecuteTimeInMs",
    UserDefinedFunctionExecutionTimeInMs : "userFunctionExecuteTimeInMs",
    
    // QueryMetrics Text
    RetrievedDocumentCountText : "Retrieved Document Count",
    RetrievedDocumentSizeText : "Retrieved Document Size",
    OutputDocumentCountText : "Output Document Count",
    OutputDocumentSizeText : "Output Document Size",
    IndexUtilizationText : "Index Utilization",
    TotalQueryExecutionTimeText : "Total Query Execution Time",
    
    // QueryPreparationTimes Text
    QueryPreparationTimesText : "Query Preparation Times",
    QueryCompileTimeText : "Query Compilation Time",
    LogicalPlanBuildTimeText : "Logical Plan Build Time",
    PhysicalPlanBuildTimeText : "Physical Plan Build Time",
    QueryOptimizationTimeText : "Query Optimization Time",
    
    // QueryTimes Text
    QueryEngineTimesText : "Query Engine Times",
    IndexLookupTimeText : "Index Lookup Time",
    DocumentLoadTimeText : "Document Load Time",
    WriteOutputTimeText : "Document Write Time",
    
    // RuntimeExecutionTimes Text
    RuntimeExecutionTimesText : "Runtime Execution Times",
    TotalExecutionTimeText : "Query Engine Execution Time",
    SystemFunctionExecuteTimeText : "System Function Execution Time",
    UserDefinedFunctionExecutionTimeText : "User-defined Function Execution Time",
    
    // ClientSideQueryMetrics Text
    ClientSideQueryMetricsText : "Client Side Metrics",
    RetriesText : "Retry Count",
    RequestChargeText : "Request Charge",
    FetchExecutionRangesText : "Partition Execution Timeline",
    SchedulingMetricsText : "Scheduling Metrics",
};

//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = QueryMetricsConstants;
}