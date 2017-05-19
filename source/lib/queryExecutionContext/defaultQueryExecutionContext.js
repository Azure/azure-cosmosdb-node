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

//SCRIPT START
var DefaultQueryExecutionContext = Base.defineClass(
    /**
     * Provides the basic Query Execution Context. This wraps the internal logic query execution using provided fetch functions
     * @constructor DefaultQueryExecutionContext
     * @param {DocumentClient} documentclient        - The service endpoint to use to create the client.
     * @param {SqlQuerySpec | string} query          - A SQL query.
     * @param {FeedOptions} [options]                - Represents the feed options.
     * @param {callback | callback[]} fetchFunctions - A function to retrieve each page of data. An array of functions may be used to query more than one partition.
     * @ignore
     */
    function(documentclient, query, options, fetchFunctions){
        this.documentclient = documentclient;
        this.query = query;
        this.resources = [];
        this.currentIndex = 0;
        this.currentPartitionIndex = 0;
        this.fetchFunctions = (Array.isArray(fetchFunctions)) ? fetchFunctions : [fetchFunctions];
        this.options = options || {};
        this.continuation = this.options.continuation || null;
        this.state = DefaultQueryExecutionContext.STATES.start;
    },
    {
        /**
         * Execute a provided callback on the next element in the execution context.
         * @memberof DefaultQueryExecutionContext
         * @instance
         * @param {callback} callback - Function to execute for each element. the function takes two parameters error, element.
         */
        nextItem: function (callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                self.current().then(
                    function (response) {
                        ++self.currentIndex;
                        resolve({ error: response.error, item: response.item, headers: reponse.headers });
                    },
                    function (rejection) {
                        ++self.currentIndex;
                        reject({ error: rejection.error, item: rejection.item, headers: rejection.headers });
                    }
                );
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function nextItemSuccess(nextItemHash) {
                        callback(nextItemHash.error, nextItemHash.items, nextItemHash.headers);
                    },
                    function nextItemFailure(nextItemHash) {
                        callback(nextItemHash.error, nextItemHash.items, nextItemHash.headers);
                    }
                );
            }
        },

        /**
         * Retrieve the current element on the execution context.
         * @memberof DefaultQueryExecutionContext
         * @instance
         * @param {callback} callback - Function to execute for the current element. the function takes two parameters error, element.
         */
        current: function(callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                if (self.currentIndex < self.resources.length) {
                    resolve({ error:undefined, item: self.resources[self.currentIndex], headers: undefined });
                }

                if (self._canFetchMore()) {
                    self.fetchMore().then(
                        function (response) {
                            self.resources = response.resources;
                            if (self.resources.length === 0) {
                                if (!self.continuation && self.currentPartitionIndex >= self.fetchFunctions.length) {
                                    self.state = DefaultQueryExecutionContext.STATES.ended;
                                    resolve({ error: undefined, item: undefined, headers: response.headers });
                                } else {
                                    self.current().then(resolve, reject);
                                }
                            }
                            resolve({ error: undefined, item: self.resources[self.currentIndex], headers: response.headers });
                        },
                        function (rejection) {
                            reject({ error: rejection.error, item: undefined, headers: rejection.headers });
                        }
                    );
                } else {
                    self.state = DefaultQueryExecutionContext.STATES.ended;
                    resolve({ error: undefined, item: undefined, headers: undefined });
                }
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function currentSuccess(currentHash) {
                        callback(currentHash.error, currentHash.item, currentHash.headers);
                    },
                    function currentFailure(currentHash) {
                        callback(currentHash.error, currentHash.item, currentHash.headers);
                    }
                );
            }
        },

        /**
         * Determine if there are still remaining resources to processs based on the value of the continuation token or the elements remaining on the current batch in the execution context.
         * @memberof DefaultQueryExecutionContext
         * @instance
         * @returns {Boolean} true if there is other elements to process in the DefaultQueryExecutionContext.
         */
        hasMoreResults: function () {
            return this.state === DefaultQueryExecutionContext.STATES.start || this.continuation !== undefined || this.currentIndex < this.resources.length || this.currentPartitionIndex < this.fetchFunctions.length;
        },

        /**
         * Fetches the next batch of the feed and pass them as an array to a callback
         * @memberof DefaultQueryExecutionContext
         * @instance
         * @param {callback} callback - Function execute on the feed response, takes two parameters error, resourcesList
         */
        fetchMore: function (callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                if (self.currentPartitionIndex >= self.fetchFunctions.length) {
                    resolve({ error: undefined, items: undefined, headers: undefined });
                } else {
                    // Keep to the original continuation and to restore the value after fetchFunction call
                    var originalContinuation = self.options.continuation;
                    self.options.continuation = self.continuation;

                    // Return undefined if there is no more results
                    if (self.currentPartitionIndex >= self.fetchFunctions.length) {
                        resolve({ error: undefined, items: undefined, headers: undefined });
                    } else {
                        var fetchFunction = self.fetchFunctions[self.currentPartitionIndex];
                        fetchFunction(self.options, function (err, resources, responseHeaders) {
                            if (err) {
                                self.state = DefaultQueryExecutionContext.STATES.ended;
                                reject({ error: err, items: undefined, headers: responseHeaders });
                            } else {
                                self.continuation = responseHeaders[Constants.HttpHeaders.Continuation];
                                if (!self.continuation) {
                                    ++self.currentPartitionIndex;
                                }

                                self.state = DefaultQueryExecutionContext.STATES.inProgress;
                                self.currentIndex = 0;
                                self.options.continuation = originalContinuation;
                                resolve({ error: undefined, items: resources, headers: responseHeaders });
                            }
                        });
                    }
                }
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
        
        _canFetchMore: function () {
            var res = (this.state === DefaultQueryExecutionContext.STATES.start
                || (this.continuation && this.state === DefaultQueryExecutionContext.STATES.inProgress)
                || (this.currentPartitionIndex < this.fetchFunctions.length
                    && this.state === DefaultQueryExecutionContext.STATES.inProgress));
            return res;
        }
    }, {

        STATES:  Object.freeze({ start: "start", inProgress: "inProgress", ended: "ended" })
    }
);

//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = DefaultQueryExecutionContext;
}
