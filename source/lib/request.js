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

var Documents = require("./documents")
  , Constants = require("./constants")
  , https = require("https")
  , tunnel = require('tunnel')
  , url = require("url")
  , querystring = require("querystring")
  // Dedicated Agent for socket pooling
  , keepAliveAgent = createPoolingAgent();

//----------------------------------------------------------------------------
// Utility methods
//
function createPoolingAgent() {
    var proxy = process.env.http_proxy || process.env.https_proxy;
    var options = { keepAlive: true, maxSockets: Infinity };
    return proxy ? createProxyAgent(options, proxy) : new https.Agent(options);
};

function createProxyAgent(options, proxy) {
    var proxyUrl = url.parse(proxy);
    
    options.proxy = {
        host: proxyUrl.hostname,
        port: proxyUrl.port
    };
    
    return proxyUrl.protocol.toLowerCase() === "https:" ?
        tunnel.httpsOverHttps(options) :
        tunnel.httpsOverHttp(options);
};

function bodyFromData(data) {
    if (data.pipe) return data;
    if (Buffer.isBuffer(data)) return data;
    if (typeof data === "string") return data;
    if (typeof data === "object") return JSON.stringify(data);
    return undefined;
}

function parse(urlString) { return url.parse(urlString); }

function createRequestObject(connectionPolicy, requestOptions, callback){
    function onTimeout() {
        httpsRequest.abort();
    }

    var isMedia = ( requestOptions.path.indexOf("media") > -1 );

    var httpsRequest = https.request(requestOptions, function(response) {
        // In case of media response, return the stream to the user and the user will need to handle reading the stream.
        if (isMedia && connectionPolicy.MediaReadMode === Documents.MediaReadMode.Streamed) {
            callback(undefined, response, response.headers);
            return;
        }

        var data = "";
        response.on("data", function(chunk) {
            data += chunk;
        });
        response.on("end", function() {
            if (response.statusCode >= 400) {
                callback({code: response.statusCode, body: data}, undefined, response.headers);
                return;
            }

            var result;
            try {
                if (isMedia) {
                    result = data;
                } else {
                    result = data.length > 0 ? JSON.parse(data) : undefined;
                }
            } catch (exception) {
                callback(exception);
                return;
            }

            callback(undefined, result, response.headers);
        });
    });

    httpsRequest.once("socket", function(socket) {
        if (isMedia) {
            socket.setTimeout(connectionPolicy.MediaRequestTimeout);
        } else {
            socket.setTimeout(connectionPolicy.RequestTimeout);
        }

        socket.once("timeout", onTimeout);

        httpsRequest.once("response", function () {
          socket.removeListener("timeout", onTimeout);
        });
    });

    httpsRequest.once("error", callback);
    return httpsRequest;
}

var RequestHandler = {
    /**
     *  Creates the request object, call the passed callback when the response is retrieved.
     * @param {object} connectionPolicy - an instance of ConectionPolicy that has the connection configs.
     * @param {string} method - the http request method ( 'get', 'post', 'put', .. etc ).
     * @param {String} url - The base url for the endpoint.
     * @param {string} path - the path of the requesed resource.
     * @param {Object} data - the request body. It can be either string, buffer, stream or undefined.
     * @param {Object} queryParams - query parameters for the request.
     * @param {Object} headers - specific headers for the request.
     * @param {function} callback - the callback that will be called when the response is retrieved and processed.
    */
    request: function (connectionPolicy, method, url, path, data, queryParams, headers, callback) {
        var body;

        if (data) {
            body = bodyFromData(data);
            if (!body) return callback({ message: "parameter data must be a javascript object, string, Buffer, or stream" });
        }

        var buffer;
        var stream;
        if (body) {
            if (Buffer.isBuffer(body)) {
                buffer = body;
            } else if (body.pipe) {
                // it is a stream
                stream = body;
            } else if (typeof body === "string") {
                buffer = new Buffer(body, "utf8");
            } else {
                callback({ message: "body must be string, Buffer, or stream" });
            }
        }

        var requestOptions = parse(url);
        requestOptions.method = method;
        requestOptions.path = path;
        requestOptions.headers = headers;
        requestOptions.agent = keepAliveAgent;
        requestOptions.secureProtocol = "TLSv1_client_method";

        if (queryParams) {
            requestOptions.path += "?" + querystring.stringify(queryParams);
        }

        if (buffer) {
            requestOptions.headers[Constants.HttpHeaders.ContentLength] = buffer.length;
            var httpsRequest = createRequestObject(connectionPolicy, requestOptions, callback);
            httpsRequest.write(buffer);
            httpsRequest.end();
        } else if (stream) {
            var httpsRequest = createRequestObject(connectionPolicy, requestOptions, callback);
            stream.pipe(httpsRequest);
        } else {
            var httpsRequest = createRequestObject(connectionPolicy, requestOptions, callback);
            httpsRequest.end();
        }
    }
};

if (typeof exports !== "undefined") {
    module.exports = RequestHandler;
}