﻿/*
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

var lib = require("../lib/"),
    assert = require("assert"),
    testConfig = require("./_testConfig"),
    sinon = require("sinon"),
    Base = require("../lib/base"),
    Constants = lib.Constants,
    DocumentDBClient = lib.DocumentClient;

var host = testConfig.host;
var masterKey = testConfig.masterKey;

describe("Session Token", function () {
    var client = new DocumentDBClient(host, { masterKey: masterKey }, null, 'Session');
    var databaseId = "sessionTestDB";
    var collectionId = "sessionTestColl";
    var collectionLink = "dbs/" + databaseId + "/colls/" + collectionId;

    var databaseBody = { id: databaseId };
    var collectionDefinition = { 'id': collectionId, 'partitionKey': { 'paths': ['/id'], 'kind': 'Hash' } };
    var collectionOptions = { 'offerThroughput': 25100 };

    var deleteDatabases = function (done) {

        client.queryDatabases("SELECT * FROM root r WHERE r.id='" + databaseId + "'").toArray(function (err, databases) {
            if (err || databases.length == 0) {
                return done();
            }

            client.deleteCollection(collectionLink, function(err, db){
                client.deleteDatabase("dbs/" + databaseId, function (err, db) {
                    return done();
                });
            });
        });
    };

    var getToken = function (tokens) {
        var newToken = {};
        for (var coll in tokens) {
            for (var k in tokens[coll]) {
                newToken[k] = tokens[coll][k];
            }
            return newToken;
        }
    };

    var getIndex = function (tokens, index1) {
        var keys = Object.keys(tokens);
        if (typeof index1 == 'undefined')
            return keys[0]
        else
            return keys[1];
    }

    describe("wire format checks", function() {
        var getSpy;
        var postSpy;
        var putSpy;
        var deleteSpy;

        beforeEach(function() {
            getSpy = sinon.spy(client, 'get');
            postSpy = sinon.spy(client, 'post');
            putSpy = sinon.spy(client, 'put');
            deleteSpy = sinon.spy(client, 'delete');
        });

        afterEach(function() {
            getSpy.restore();
            postSpy.restore();
            deleteSpy.restore();
            putSpy.restore();
        });

        it("validate session tokens for sequence of opearations", function (done) {
            var index1;
            var index2;
    
            client.createDatabase(databaseBody, function (err, database) {
                assert.equal(err, undefined, "error creating database");
    
                client.createCollection(database._self, collectionDefinition, collectionOptions, function (err, createdCollection) {
                    assert.equal(err, undefined, "error creating collection");
                    assert.equal(postSpy.lastCall.args[3][Constants.HttpHeaders.SessionToken], undefined);
                    assert.deepEqual(client.sessionContainer.collectionResourceIdToSessionTokens, {});
    
                    client.createDocument(collectionLink, { "id": "1" }, function (err, document1) {
                        assert.equal(err, undefined, "error creating document 1");
                        assert.equal(postSpy.lastCall.args[3][Constants.HttpHeaders.SessionToken], undefined);
    
                        var tokens = getToken(client.sessionContainer.collectionResourceIdToSessionTokens);
                        index1 = getIndex(tokens);
                        assert.notEqual(tokens[index1], undefined);
                        var firstPartitionLSN = tokens[index1];
    
                        client.createDocument(collectionLink, { "id": "2" }, function (err, document2) {
                            assert.equal(err, undefined, "error creating document 2");
                            assert.equal(postSpy.lastCall.args[3][Constants.HttpHeaders.SessionToken], client.sessionContainer.getCombinedSessionToken(tokens));
    
                            tokens = getToken(client.sessionContainer.collectionResourceIdToSessionTokens);
                            index2 = getIndex(tokens, index1);
                            assert.equal(tokens[index1], firstPartitionLSN);
                            assert.notEqual(tokens[index2], undefined);
                            var secondPartitionLSN = tokens[index2];
    
                            client.readDocument(document1._self, { 'partitionKey': '1' }, function (err, document1) {
                                assert.equal(err, undefined, "error reading document 1");
                                assert.equal(getSpy.lastCall.args[2][Constants.HttpHeaders.SessionToken], client.sessionContainer.getCombinedSessionToken(tokens));
                                tokens = getToken(client.sessionContainer.collectionResourceIdToSessionTokens);
                                assert.equal(tokens[index1], firstPartitionLSN);
                                assert.equal(tokens[index2], secondPartitionLSN);
    
                                client.upsertDocument(createdCollection._self, { "id": "1", "operation": "upsert" }, { 'partitionKey': '1' }, function (err, document1) {
                                    assert.equal(err, undefined, "error upserting document 1");
                                    assert.equal(postSpy.lastCall.args[3][Constants.HttpHeaders.SessionToken], client.sessionContainer.getCombinedSessionToken(tokens));
                                    tokens = getToken(client.sessionContainer.collectionResourceIdToSessionTokens);
                                    assert.equal(tokens[index1], (Number(firstPartitionLSN) + 1).toString());
                                    assert.equal(tokens[index2], secondPartitionLSN);
                                    firstPartitionLSN = tokens[index1];
    
                                    client.deleteDocument(document2._self, { 'partitionKey': '2' }, function (err, document2) {
                                        assert.equal(err, undefined, "error deleting document 2");
                                        assert.equal(deleteSpy.lastCall.args[2][Constants.HttpHeaders.SessionToken], client.sessionContainer.getCombinedSessionToken(tokens));
                                        tokens = getToken(client.sessionContainer.collectionResourceIdToSessionTokens);
                                        assert.equal(tokens[index1], firstPartitionLSN);
                                        assert.equal(tokens[index2], (Number(secondPartitionLSN) + 1).toString());
                                        secondPartitionLSN = tokens[index2];
    
                                        client.replaceDocument(document1._self, { "id": "1", "operation": "replace" }, { 'partitionKey': '1' }, function (err, document1) {
                                            assert.equal(err, undefined, "error replacing document 1");
                                            assert.equal(putSpy.lastCall.args[3][Constants.HttpHeaders.SessionToken], client.sessionContainer.getCombinedSessionToken(tokens));
                                            tokens = getToken(client.sessionContainer.collectionResourceIdToSessionTokens);
                                            assert.equal(tokens[index1], (Number(firstPartitionLSN) + 1).toString());
                                            assert.equal(tokens[index2], secondPartitionLSN);
                                            firstPartitionLSN = tokens[index1];
    
                                            var query = "SELECT * from " + collectionId
                                            var queryOptions = { 'partitionKey': '1' }
                                            var queryIterator = client.queryDocuments(collectionLink, query, queryOptions);
    
                                            queryIterator.toArray(function (error, result) {
                                                assert.equal(error, undefined);
                                                assert.equal(postSpy.lastCall.args[3][Constants.HttpHeaders.SessionToken], client.sessionContainer.getCombinedSessionToken(tokens));
                                                tokens = getToken(client.sessionContainer.collectionResourceIdToSessionTokens);
                                                assert.equal(tokens[index1], firstPartitionLSN);
                                                assert.equal(tokens[index2], secondPartitionLSN);
    
    
                                                client.deleteCollection(createdCollection._self, function (err, result) {
                                                    assert.equal(err, undefined, "error deleting collection");
                                                    assert.equal(deleteSpy.lastCall.args[2][Constants.HttpHeaders.SessionToken], undefined);
                                                    assert.deepEqual(client.sessionContainer.collectionResourceIdToSessionTokens, {});
    
                                                    done();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    describe("Public surface area tests", function() {
        it("validate 'lsn not caught up' error for higher lsn and clearing session token", function (done) {

            client.createDatabase(databaseBody, function (err, database) {
                assert.equal(err, undefined, "error creating database");

                var increaseLSN = function (oldTokens) {
                    for (var coll in oldTokens) {
                        for (var token in oldTokens[coll]) {
                            var newVal = (Number(oldTokens[coll][token]) + 2000).toString();
                            return token + ":" + newVal;
                        }
                    }
                }

                client.createCollection(database._self, collectionDefinition, collectionOptions, function (err, createdCollection) {
                    assert.equal(err, undefined, "error creating collection");
                    client.createDocument(collectionLink, { "id": "1" }, function (err, document1) {
                        var callbackSpy = sinon.spy(function (path, reqHeaders) {
                            var oldTokens = client.sessionContainer.collectionResourceIdToSessionTokens;
                            reqHeaders[Constants.HttpHeaders.SessionToken] = increaseLSN(oldTokens);
                        });

                        var applySessionTokenStub = sinon.stub(client, 'applySessionToken').callsFake(callbackSpy);
                        client.readDocument(collectionLink + "/docs/1", { 'partitionKey': '1' }, function (err, document1) {
                            assert.equal(err.substatus, 1002, "Substatus should indicate the LSN didn't catchup.");
                            assert.equal(callbackSpy.callCount, 1);
                            assert.equal(Base._trimSlashes(callbackSpy.lastCall.args[0]), collectionLink + "/docs/1");
                            applySessionTokenStub.restore();

                            client.readDocument(collectionLink + "/docs/1", { 'partitionKey': '1' }, function (err, document1) {
                                assert.equal(err, undefined, "error creating collection");
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("validate session container update on 'Not found' with 'undefined' status code for non master resource", function (done) {
            var client2 = new DocumentDBClient(host, { masterKey: masterKey }, null, 'Session');
            client.createDatabase(databaseBody, function (err, database) {
                assert.equal(err, undefined, "error creating database");

                client.createCollection(database._self, collectionDefinition, collectionOptions, function (err, createdCollection) {
                    assert.equal(err, undefined, "error creating collection");

                    client.createDocument(createdCollection._self, { "id": "1"}, function (err, createdDocument, headers) {
                        assert.equal(err, undefined, "error creating document");
                        var requestOptions = { 'partitionKey': '1' };

                        client2.deleteDocument(createdDocument._self, requestOptions, function (err, document2, headers) {
                            assert.equal(err, undefined, "error deleting document");
                            var setSessionTokenSpy = sinon.spy(client.sessionContainer, 'setSessionToken');

                            client.readDocument(createdDocument._self, requestOptions, function (err, readDocument, headers) {
                                assert.equal(readDocument, undefined, "document should not be read");
                                assert.equal(err.code, 404, "expecting 404 (Not found)");
                                assert.equal(err.substatus, undefined, "expecting substatus code to be undefined");
                                assert.equal(setSessionTokenSpy.callCount, 1, "unexpected number of calls to sesSessionToken");
                                setSessionTokenSpy.restore();
                                done();
                            });
                        });
                    });
                });
            });
        });

        it("validate that a client does not have session token of a collection created by another client", function (done) {

            var client2 = new DocumentDBClient(host, { masterKey: masterKey }, null, 'Session');
            client.createDatabase(databaseBody, function (err, database) {
                assert.equal(err, undefined, "error creating database");

                client.createCollection(database._self, collectionDefinition, collectionOptions, function (err, createdCollection) {
                    assert.equal(err, undefined, "error creating collection");

                    client.readCollection(createdCollection._self, function (err, collection) {
                        assert.equal(err, undefined, "error reading collection");

                        client2.deleteCollection(createdCollection._self, function (err, collection) {
                            assert.equal(err, undefined, "error deleting collection");

                            client2.createCollection(database._self, collectionDefinition, collectionOptions, function (err, createdCollection) {
                                assert.equal(err, undefined, "error creating collection");

                                client2.readCollection(createdCollection._self, function (err, collection) {
                                    assert.equal(err, undefined, "error reading collection");
                                    assert.equal(client.getSessionToken(collection._self), "");
                                    assert.notEqual(client2.getSessionToken(collection._self), "");
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });

        it("validate that session token is removed for master resource requests", function (done) {
            var getSpy = sinon.spy(client, 'get');
            client.createDatabase(databaseBody, function (err, database) {
                assert.equal(err, undefined, "error creating database");

                client.createCollection(database._self, collectionDefinition, collectionOptions, function (err, createdCollection) {
                    assert.equal(err, undefined, "error creating collection");

                    client.createDocument(createdCollection._self, { "id": "1" }, function (err, createdDocument) {
                        assert.equal(err, undefined, "error creating document");

                        client.readDocument(createdDocument._self, { 'partitionKey': '1' }, function (err, readDocument) {
                            console.log(err)
                            assert.equal(err, undefined, "error reading document");
                            assert.notEqual(getSpy.lastCall.args[2][Constants.HttpHeaders.SessionToken], undefined);

                            client.readCollection(createdCollection._self, function (err, readCollection) {
                                assert.equal(err, undefined, "error reading collection");
                                assert.equal(getSpy.lastCall.args[2][Constants.HttpHeaders.SessionToken], undefined);

                                client.readDocument(createdDocument._self, { 'partitionKey': '1' }, function (err, readDocument) {
                                    assert.equal(err, undefined, "error reading document");
                                    assert.notEqual(getSpy.lastCall.args[2][Constants.HttpHeaders.SessionToken], undefined);
                                    getSpy.restore();
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    afterEach(function (done) { deleteDatabases(done) });
    beforeEach(function (done) { deleteDatabases(done) });

});

