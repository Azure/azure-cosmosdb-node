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
    , aggregators = require('./aggregators');

//SCRIPT START
var OrderByEndpointComponent = Base.defineClass(

    /**
     * Represents an endpoint in handling an order by query. For each processed orderby result it returns 'payload' item of the result
     * @constructor OrderByEndpointComponent
     * @param {object} executionContext              - Underlying Execution Context
     * @ignore
     */
    function (executionContext) {
        this.executionContext = executionContext;
    },
    {
         /**
         * Execute a provided function on the next element in the OrderByEndpointComponent.
         * @memberof OrderByEndpointComponent
         * @instance
         * @param {callback} callback - Function to execute for each element. the function takes two parameters error, element.
         */
        nextItem: function (callback) {
            var promise = new Promise(function (resolve, reject) {
                self.executionContext.nextItem().then(
                    function (response) {
                        if (response.item === undefined) {
                            resolve(response);
                        } else {
                            resolve({error:undefined, item:response.item["payload"], response.headers});
                        }
                    },
                    reject
                );
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function nextItemSuccess(nextItemHash) {
                        callback(nextItemHash.error, nextItemHash.item: nextItemHash.headers);
                    },
                    function nextItemFailure(nextItemHash) {
                        callback(nextItemHash.error, nextItemHash.item: nextItemHash.headers);
                    }
                );
            }
        },

        /**
         * Retrieve the current element on the OrderByEndpointComponent.
         * @memberof OrderByEndpointComponent
         * @instance
         * @param {callback} callback - Function to execute for the current element. the function takes two parameters error, element.
         */
        current: function(callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                self.executionContext.current().then(
                    function (response) {
                        if (response.item === undefined) {
                            resolve(response);
                        } else {
                            resolve({ error: undefined, item: response.item["payload"], headers: response.headers });
                        }
                    },
                    reject
                );
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
         * Determine if there are still remaining resources to processs.
         * @memberof OrderByEndpointComponent
         * @instance
         * @returns {Boolean} true if there is other elements to process in the OrderByEndpointComponent.
         */
        hasMoreResults: function () {
            return this.executionContext.hasMoreResults();
        },
    }
);

var TopEndpointComponent = Base.defineClass(
    /**
     * Represents an endpoint in handling top query. It only returns as many results as top arg specified.
     * @constructor TopEndpointComponent
     * @param { object } executionContext - Underlying Execution Context
     * @ignore
     */
    function (executionContext, topCount) {
        this.executionContext = executionContext;
        this.topCount = topCount;
    },
    {

        /**
        * Execute a provided function on the next element in the TopEndpointComponent.
        * @memberof TopEndpointComponent
        * @instance
        * @param {callback} callback - Function to execute for each element. the function takes two parameters error, element.
        */
        nextItem: function (callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                if (self.topCount <= 0) {
                    resolve({ error: undefined, item: undefined, headers: undefined });
                } else {
                    self.topCount--;
                    self.executionContext.nextItem()
                        .then(resolve, reject);
                }
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function nextItemSuccess(nextItemHash) {
                        callback(nextItemHash.error, nextItemHash.item, nextItemHash.headers);
                    },
                    function nextItemFailure(nextItemHash) {
                        callback(nextItemHash.error, nextItemHash.item, nextItemHash.headers);
                    }
                );
            }
       },

        /**
         * Retrieve the current element on the TopEndpointComponent.
         * @memberof TopEndpointComponent
         * @instance
         * @param {callback} callback - Function to execute for the current element. the function takes two parameters error, element.
         */
        current: function (callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                if (self.topCount <= 0) {
                    resolve({ error: undefined, item: undefined, headers: undefined });
                } else {
                    self.executionContext.current().then(resolve, reject);
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
         * Determine if there are still remaining resources to processs.
         * @memberof TopEndpointComponent
         * @instance
         * @returns {Boolean} true if there is other elements to process in the TopEndpointComponent.
         */
        hasMoreResults: function () {
            return (this.topCount > 0 && this.executionContext.hasMoreResults());
        },
    }
);

var AggregateEndpointComponent = Base.defineClass(
    /**
     * Represents an endpoint in handling aggregate queries.
     * @constructor AggregateEndpointComponent
     * @param { object } executionContext - Underlying Execution Context
     * @ignore
     */
    function (executionContext, aggregateOperators) {
        this.executionContext = executionContext;
        this.localAggregators = [];
        var that = this;
        aggregateOperators.forEach(function (aggregateOperator) {
            switch (aggregateOperator) {
                case 'Average':
                    that.localAggregators.push(new aggregators.AverageAggregator());
                    break;
                case 'Count':
                    that.localAggregators.push(new aggregators.CountAggregator());
                    break;
                case 'Max':
                    that.localAggregators.push(new aggregators.MaxAggregator());
                    break;
                case 'Min':
                    that.localAggregators.push(new aggregators.MinAggregator());
                    break;
                case 'Sum':
                    that.localAggregators.push(new aggregators.SumAggregator());
                    break;
            }
        });
    },
    {
        /**
        * Populate the aggregated values
        * @ignore 
        */
        _getAggregateResult: function (callback) {
            this.toArrayTempResources = [];
            this.aggregateValues = [];
            this.aggregateValuesIndex = -1;
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                self._getQueryResults().then(
                    function (response) {
                        response.items.forEach(function (resource) {
                            self.localAggregators.forEach(function (aggregator) {
                                var itemValue = undefined;
                                // Get the value of the first property if it exists
                                if (resource && Object.keys(resource).length > 0) {
                                    var key = Object.keys(resource)[0];
                                    itemValue = resource[key];
                                }
                                aggregator.aggregate(itemValue);
                            });
                        });

                        // Get the aggregated results
                        self.localAggregators.forEach(function (aggregator) {
                            self.aggregateValues.push(aggregator.getResult());
                        });

                        resolve({ error: undefined, items: self.aggregateValues });
                    },
                    function (rejection) {
                        reject({ error: rejection.error, items: undefined });
                    }
                );
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function _getAggregateResultSuccess(_getAggregateResultHash) {
                        callback(_getAggregateResultHash.error, _getAggregateResultHash.items);
                    },
                    function _getAggregateResultFailure(_getAggregateResultHash) {
                        callback(_getAggregateResultHash.error, _getAggregateResultHash.items);
                    }
                );
            }
       },

        /**
        * Get the results of queries from all partitions
        * @ignore 
        */
        _getQueryResults: function (callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                this.executionContext.nextItem().then(
                    function (response) {
                        if (response.item === undefined) {
                            // no more results
                            resolve({ error: undefined, items: self.toArrayTempResources });
                        } else {
                            self.toArrayTempResources = self.toArrayTempResources.concat(response.item);
                            self._getQueryResults().then(resolve, reject);
                        }
                    },
                    function (rejection) {
                        reject(rejection.error, undefined);
                    }
                );
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function _getQueryResultsSuccess(_getQueryResultsHash) {
                        callback(_getQueryResultsHash.error, _getQueryResultsHash.items);
                    },
                    function _getQueryResultsFailure(_getQueryResultsHash) {
                        callback(_getQueryResultsHash.error, _getQueryResultsHash.items);
                    }
                );
            }
        },

        /**
        * Execute a provided function on the next element in the AggregateEndpointComponent.
        * @memberof AggregateEndpointComponent
        * @instance
        * @param {callback} callback - Function to execute for each element. the function takes two parameters error, element.
        */
        nextItem: function (callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                var _nextItem = function (err, resources) {
                    if (err || self.aggregateValues.length <= 0) {
                        reject({ error: undefined, item: undefined });
                    } else {
                        var resource = self.aggregateValuesIndex < self.aggregateValues.length
                            ? self.aggregateValues[++self.aggregateValuesIndex]
                            : undefined;

                        resolve({ error: undefined, item: resource });
                    }
                };

                if (self.aggregateValues == undefined) {
                    self._getAggregateResult().then(
                        function (response) {
                            _nextItem(response.error, response.items);
                        },
                        function (rejection) {
                            _nextItem(rejection.error, rejection.items);
                        }
                    );
                }
                else {
                    _nextItem(undefined, self.aggregateValues);
                }
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function nextItemSuccess(nextItemHash) {
                        callback(nextItemHash.error, nextItemHash.item);
                    },
                    function nextItemFailure(nextItemHash) {
                        callback(nextItemHash.error, nextItemHash.item);
                    }
                );
            }
        },

        /**
         * Retrieve the current element on the AggregateEndpointComponent.
         * @memberof AggregateEndpointComponent
         * @instance
         * @param {callback} callback - Function to execute for the current element. the function takes two parameters error, element.
         */
        current: function (callback) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                if (self.aggregateValues == undefined) {
                    self._getAggregateResult().then(
                        function (response) {
                            resolve({ error: undefined, item: self.aggregateValues[self.aggregateValuesIndex] });
                        }
                    );
                } else {
                    resolve({ error: undefined, item: self.aggregateValues[self.aggregateValuesIndex] });
                }
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function currentSuccess(currentHash) {
                        callback(currentHash.error, currentHash.item);
                    },
                    function currentFailure(currentHash) {
                        callback(currentHash.error, currentHash.item);
                    }
                );
            }
        },

        /**
         * Determine if there are still remaining resources to processs.
         * @memberof AggregateEndpointComponent
         * @instance
         * @returns {Boolean} true if there is other elements to process in the AggregateEndpointComponent.
         */
        hasMoreResults: function () {
            return this.aggregateValues != null && this.aggregateValuesIndex < this.aggregateValues.length - 1;
        }
    }
);
//SCRIPT END

if (typeof exports !== "undefined") {
    exports.OrderByEndpointComponent = OrderByEndpointComponent;
    exports.TopEndpointComponent = TopEndpointComponent;
    exports.AggregateEndpointComponent = AggregateEndpointComponent;
}