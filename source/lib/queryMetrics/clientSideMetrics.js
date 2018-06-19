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
    , QueryMetricsUtils = require("./queryMetricsUtils.js");

//SCRIPT START
var ClientSideMetrics = Base.defineClass(
    function (requestCharge) {
        // Constructor
        if (!QueryMetricsUtils.isNumeric(requestCharge)) {
            throw "requestCharge is not a numeric type";
        }
        
        this._requestCharge = requestCharge;
    },

    {
        // Instance Members
        
        /**
        * Gets the RequestCharge
        * @memberof ClientSideMetrics
        * @instance
        * @ignore
        */
        _getRequestCharge: function () {
            return this._requestCharge;
        },
        
        /**
        * Adds one or more ClientSideMetrics to a copy of this instance and returns the result.
        * @memberof ClientSideMetrics
        * @instance
        */
        add: function () {
            if (arguments == null || arguments.Length === 0) {
                throw "arguments was null or empty";
            }
            
            var clientSideMetricsArray = [];
            var args;
            if (Array.isArray(arguments[0])) {
                // Arguments was just a single array.
                args = arguments[0];
            } else {
                // Arugments was flat var args (arg0, arg1, ..)
                args = arguments;
            }
            
            clientSideMetricsArray.push(this);
            
            for (var i = 0; i < args.length; i++) {
                clientSideMetricsArray.push(args[i]);
            }
            
            var requestCharge = 0;
            for (var i = 0; i < clientSideMetricsArray.length; i++) {
                var clientSideMetrics = clientSideMetricsArray[i];
                
                if (clientSideMetrics == null) {
                    throw "clientSideMetrics has null or undefined item(s)";
                }

                requestCharge += clientSideMetrics._requestCharge;
            }
            
            return new ClientSideMetrics(requestCharge);
        },
    },

    {
        // Static Members
    }
);

var zero = new ClientSideMetrics(0);
        
var createFromArray = function (clientSideMetricsArray) {
    if (clientSideMetricsArray == null) {
        throw "clientSideMetricsArray is null or undefined item(s)";
    }

    return zero.add(clientSideMetricsArray);
};

//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = ClientSideMetrics;
    ClientSideMetrics.zero = zero;
    ClientSideMetrics.createFromArray = createFromArray;
}