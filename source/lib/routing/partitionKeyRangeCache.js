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
    , CollectionRoutingMap = require("./inMemoryCollectionRoutingMap");

var CollectionRoutingMapFactory = CollectionRoutingMap.CollectionRoutingMapFactory;

//SCRIPT START
var PartitionKeyRangeCache = Base.defineClass(
    
    /**
     * Represents a PartitionKeyRangeCache. PartitionKeyRangeCache provides list of effective partition key ranges for a collection.
     * This implementation loads and caches the collection routing map per collection on demand.
     * @constructor PartitionKeyRangeCache
     * @param {object} documentclient                - The documentclient object.
     * @ignore
     */
    function (documentclient) {
        this.documentclient = documentclient;
        this.collectionRoutingMapByCollectionId = {};
        this.sem = require("semaphore")(1);
    },
    {
        /**
         * Finds or Instantiates the requested Collection Routing Map and invokes callback
         * @param {callback} callback                - Function to execute for the collection routing map. the function takes two parameters error, collectionRoutingMap.
         * @param {string} collectionLink            - Requested collectionLink
         * @ignore
         */
        _onCollectionRoutingMap: function (callback, collectionLink) {
            var self = this;
            var promise = new Promise(function (resolve, reject) {
                var isNameBased = Base.isLinkNameBased(collectionLink);
                var collectionId = self.documentclient.getIdFromLink(collectionLink, isNameBased);

                var collectionRoutingMap = self.collectionRoutingMapByCollectionId[collectionId];
                if (collectionRoutingMap === undefined) {
                    // attempt to consturct collection routing map
                    var semaphorizedFuncCollectionMapInstantiator = function () {
                        var collectionRoutingMap = self.collectionRoutingMapByCollectionId[collectionId];
                        if (collectionRoutingMap === undefined) {
                            var partitionKeyRangesIterator = self.documentclient.readPartitionKeyRanges(collectionLink);
                            partitionKeyRangesIterator.toArray().then(
                                function (response) {
                                    collectionRoutingMap = CollectionRoutingMapFactory.createCompleteRoutingMap(
                                        response.items.map(function (r) { return [r, true]; }),
                                        collectionId);

                                    self.collectionRoutingMapByCollectionId[collectionId] = collectionRoutingMap;
                                    self.sem.leave();
                                    resolve({ error: undefined, collectionRoutingMap: collectionRoutingMap });
                                },
                                function (rejection) {
                                    reject({ error: rejection.error, collectionRoutingMap: undefined });
                                }
                            );
                        } else {
                            // sanity gaurd 
                            self.sem.leave();
                            resolve({ error: undefined, collectionRoutingMap: collectionRoutingMap.getOverlappingRanges(partitionKeyRanges) });
                        }
                    };

                    // We want only one attempt to construct collectionRoutingMap so we pass the consturction in the semaphore take
                    self.sem.take(semaphorizedFuncCollectionMapInstantiator);
                } else {
                    resolve({ error: undefined, collectionRoutingMap: collectionRoutingMap });
                }
            });
            if (!callback) {
                return promise;
            } else {
                promise.then(
                    function _onCollectionRoutingMapSuccess(_onCollectionRoutingMapHash) {
                        callback(_onCollectionRoutingMapHash.error, _onCollectionRoutingMapHash.collectionRoutingMap);
                    },
                    function _onCollectionRoutingMapFailure(_onCollectionRoutingMapHash) {
                        callback(_onCollectionRoutingMapHash.error, _onCollectionRoutingMapHash.collectionRoutingMap);
                    }
                );
            }
        }, 

        /**
         * Given the query ranges and a collection, invokes the callback on the list of overlapping partition key ranges
         * @param {callback} callback - Function execute on the overlapping partition key ranges result, takes two parameters error, partition key ranges
         * @param collectionLink
         * @param queryRanges
         * @ignore
         */
        getOverlappingRanges: function (callback, collectionLink, queryRanges) {
            this._onCollectionRoutingMap(function (err, collectionRoutingMap) {
                if (err) {
                    return callback(err, undefined);
                }
                return callback(undefined, collectionRoutingMap.getOverlappingRanges(queryRanges));
            }, collectionLink);
        }
    }
);
//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = PartitionKeyRangeCache;
}