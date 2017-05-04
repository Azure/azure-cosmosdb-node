/*
The MIT License (MIT)
Copyright (c) 2014 Microsoft Corporation

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
    , DefaultQueryExecutionContext = require("./defaultQueryExecutionContext")
    , endpointComponent = require('./endpointComponent')
    , assert = require("assert")
    , QueryExecutionInfoParser = require("./partitionedQueryExecutionContextInfoParser");

//SCRIPT START
var PipelinedQueryExecutionContext = Base.defineClass(
    /**
     * Provides the PipelinedQueryExecutionContext. It piplelines top and orderby execution context if necessary
     * @constructor PipelinedQueryExecutionContext
     * @param {DocumentClient} documentclient        - The service endpoint to use to create the client.
     * @param {FeedOptions} [options]                - Represents the feed options.
     * @param {object} partitionedQueryExecutionInfo  - PartitionedQueryExecutionInfo
     * @ignore
     */
    function (documentclient, options, executionContext, partitionedQueryExecutionInfo) {
        this.documentclient = documentclient;
        this.options = options;
        this.partitionedQueryExecutionInfo = partitionedQueryExecutionInfo;
        this.endpoint = executionContext;
        this.pageSize = options["maxItemCount"];
        if (this.pageSize === undefined) {
            this.pageSize = PipelinedQueryExecutionContext.DEFAULT_PAGE_SIZE;
        }
        var orderBy = QueryExecutionInfoParser.parseOrderBy(partitionedQueryExecutionInfo);
        if (Array.isArray(orderBy) && orderBy.length > 0) {
            this.endpoint = new endpointComponent.OrderByEndpointComponent(this.endpoint);
        }

        var aggregates = QueryExecutionInfoParser.parseAggregates(partitionedQueryExecutionInfo);
        if (Array.isArray(aggregates) && aggregates.length > 0) {
            this.endpoint = new endpointComponent.AggregateEndpointComponent(this.endpoint, aggregates);
        }

        var top = QueryExecutionInfoParser.parseTop(partitionedQueryExecutionInfo);
        if (typeof (top) === 'number') {
            this.endpoint = new endpointComponent.TopEndpointComponent(this.endpoint, top);
        }
    },
    {
        nextItem: function (callback) {
            return this.endpoint.nextItem(callback);
        },

        current: function (callback) {
            return this.endpoint.current(callback);
        },

        hasMoreResults: function (callback) {
            return this.endpoint.hasMoreResults(callback);
        },

        fetchMore: function (callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                self._fetchMoreTempBufferedResults = [];
                self._fetchMoreLastResHeaders = undefined;
                self._fetchMoreImplementation().then(resolve, reject);
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function fetchMoreSuccess(fetchMoreHash) {
                        callback(fetchMoreHash.error, fetchMoreHash.items, fetchMoreHash.headers);
                    },
                    function fetchMoreFailure(fetchMoreHash) {
                        callback(fetchMoreHash.error, fetchMoreHash.items, fetchMoreHash.headers);
                    }
                );
            }
        },

        _fetchMoreImplementation: function (callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                var counter = 0;

                self.endpoint.nextItem().then(
                    function (response) {
                        // concatinate the results and fetch more
                        self._fetchMoreLastResHeaders = response.headers;
                        if (response.items === undefined) {
                            // no more results
                            if (self._fetchMoreTempBufferedResults.length === 0) {
                                resolve({ error: undefined, items: undefined, headers: self._fetchMoreLastResHeaders });
                            } else {
                                var temp = self._fetchMoreTempBufferedResults;
                                self._fetchMoreTempBufferedResults = [];
                                resolve({ error: undefined, items: temp, headers: self._fetchMoreLastResHeaders });
                            }
                        } else {
                            self._fetchMoreTempBufferedResults = self._fetchMoreTempBufferedResults.concat(response.items);

                            if (self.pageSize <= self._fetchMoreTempBufferedResults.length) {
                                // fetched enough results
                                var temp = self._fetchMoreTempBufferedResults;
                                self._fetchMoreTempBufferedResults = [];

                                resolve({ error: undefined, items: temp, headers: self._fetchMoreLastResHeaders });
                            } else {
                                self._fetchMoreImplementation().then(resolve, reject);
                            }
                        }
                    },
                    function (rejection) {
                        reject({ error: rejection.error, items: undefined, headers: rejection.headers });
                    }
                );
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function _fetchMoreImplementationSuccess(_fetchMoreImplementationHash) {
                        callback(_fetchMoreImplementationHash.error, _fetchMoreImplementationHash.items, _fetchMoreImplementationHash.headers);
                    },
                    function _fetchMoreImplementationFailure(_fetchMoreImplementationHash) {
                        callback(_fetchMoreImplementationHash.error, _fetchMoreImplementationHash.items, _fetchMoreImplementationHash.headers);
                    }
                );
            }
        },
    },
    {
        DEFAULT_PAGE_SIZE: 1000
    }
);
//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = PipelinedQueryExecutionContext;
}
