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
    , TimeSpan = require("./timeSpan.js");

//SCRIPT START
var QueryMetricsUtils = Base.defineClass(
    function ()
    {
        // Pure static class so no constructor
    },

    {
        // Pure static class so no Instance Members
    },

    {
        // Static Members

        parseDelimitedString: function (delimitedString) {
            if (delimitedString == null) {
                throw "delimitedString is null or undefined";
            }

            var metrics = {};

            var headerAttributes = delimitedString.split(";");
            for (var i = 0; i < headerAttributes.length; i++) {
                var attributeKeyValue = headerAttributes[i].split("=");
                
                if (attributeKeyValue.length != 2) {
                    throw "recieved a malformed delimited string";
                }

                var attributeKey = attributeKeyValue[0];
                var attributeValue = parseFloat(attributeKeyValue[1]);

                metrics[attributeKey] = attributeValue;
            }

            return metrics;
        },

        timeSpanFromMetrics: function (metrics, key) {
            if (key in metrics) {
                return new TimeSpan.fromMilliseconds(metrics[key]);
            }

            return TimeSpan.zero;
        },

        isNumeric: function (input) {
            return !isNaN(parseFloat(input)) && isFinite(input);
        },
    }
);

//SCRIPT END

if (typeof exports !== "undefined") {
    module.exports = QueryMetricsUtils;
}