"use strict";

var lib = require("../lib/"),
    assert = require("assert"),
    testConfig = require("./_testConfig"),
    Constants = lib.Constants,
    DocumentDBClient = lib.DocumentClient,
    UriFactory = lib.UriFactory;

var host = testConfig.host;
var masterKey = testConfig.masterKey;

var doc = { "id": "myId", "pk": "pk" }

describe("ResourceLink Trimming of leading and trailing slashes", function () {
    var client = new DocumentDBClient(host, { masterKey: masterKey });
    var databaseId = "testDatabase";
    var collectionId = "testCollection";

    var deleteDatabases = function (done) {
        client.readDatabases().toArray(function (err, databases) {
            if (err) {
                console.log("error occured reading databases", err);
                return done();
            }

            var index = databases.length;
            if (index === 0) {
                return done();
            }

            databases.forEach(function (database) {
                index--;
                if (database.id === databaseId) {
                    client.deleteDatabase(database._self, function (err, db) {
                    });
                }
                if (index === 0) {
                    return done();
                }
            });
        });
    }

    var testFirstAndLastSlashesTrimmedForQueryString = function (document, done) {
        var databaseBody = { id: databaseId };

        client.createDatabase(databaseBody, function (dbCreateErr, database) {

            assert.equal(dbCreateErr, undefined);
            var collectionDefinition = {"id": collectionId, "partitionKey": {"paths": ["/pk"],"kind": "Hash"}}
            var collectionOptions = { "offerThroughput": 10100 }

            client.createCollection(database._self, collectionDefinition, collectionOptions, function (createCollErr, createdCollection) {

                assert.equal(createCollErr, undefined);

                client.createDocument(createdCollection._self, document, function (err, doc) {
                    if (err) {
                        return done(err)
                    }
                    assert.equal(err, undefined);
                    var collectionLink = "/dbs/" + databaseId + "/colls/" + collectionId + "/"
                    var query = "SELECT * from " + collectionId
                    var queryOptions = { "partitionKey": "pk" }
                    var queryIterator = client.queryDocuments(collectionLink, query, queryOptions);

                    queryIterator.toArray(function (error, result) {
                        assert.equal(error, undefined);
                        assert.equal(result[0]["id"], "myId");
                        done();
                    });
                });
            });
        });
    }

    afterEach(function (done) { deleteDatabases(done) });
    beforeEach(function (done) { deleteDatabases(done) });

    it("validate correct execution of query using named collection link with leading and trailing slashes", function (done) {
        testFirstAndLastSlashesTrimmedForQueryString(doc, done);
    });
});

describe("Test Query Metrics On Single Partition Collection", function () {
    var client = new DocumentDBClient(host, { masterKey: masterKey });
    var databaseId = "testDatabase2";
    var collectionId = "testCollection";
    
    var deleteDatabases = function (done) {
        client.readDatabases().toArray(function (err, databases) {
            if (err) {
                console.log("error occured reading databases", err);
                return done();
            }
            
            var index = databases.length;
            if (index === 0) {
                return done();
            }
            
            databases.forEach(function (database) {
                index--;
                if (database.id === databaseId) {
                    client.deleteDatabase(database._self, function (err, db) {
                    });
                }
                if (index === 0) {
                    return done();
                }
            });
        });
    }
    
    var testQueryMetricsOnSinglePartition = function (document, done) {
        var databaseBody = { id: databaseId };
        
        client.createDatabase(databaseBody, function (dbCreateErr, database) {
            
            assert.equal(dbCreateErr, undefined);
            var collectionDefinition = { "id": collectionId }
            var collectionOptions = { "offerThroughput": 4000 }
            
            client.createCollection(database._self, collectionDefinition, collectionOptions, function (createCollErr, createdCollection) {
                
                assert.equal(createCollErr, undefined);
                
                client.createDocument(createdCollection._self, document, function (err, doc) {
                    if (err) {
                        return done(err)
                    }
                    assert.equal(err, undefined);
                    var collectionLink = "/dbs/" + databaseId + "/colls/" + collectionId + "/"
                    var query = "SELECT * from " + collectionId
                    var queryOptions = { populateQueryMetrics: true }
                    var queryIterator = client.queryDocuments(collectionLink, query, queryOptions);
                    
                    var executeNextCallback = function (err, results, headers) {
                        assert.equal(err, undefined, "Query should not return an error");
                        if (results === undefined) {
                            // no more results
                            return done();
                        }
                        
                        assert.notEqual(headers[Constants.HttpHeaders.QueryMetrics]["0"], null);
                        return queryIterator.executeNext(executeNextCallback);
                    };
                    
                    queryIterator.executeNext(executeNextCallback);
                });
            });
        });
    }
    
    afterEach(function (done) { deleteDatabases(done) });
    beforeEach(function (done) { deleteDatabases(done) });
    
    it("validate that query metrics are correct for a single partition query", function (done) {
        testQueryMetricsOnSinglePartition(doc, done);
    });
});
