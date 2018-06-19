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

//SCRIPT START

// Ported this implementation to javascript: https://referencesource.microsoft.com/#mscorlib/system/timespan.cs,83e476c1ae112117
var ticksPerMillisecond = 10000;
var millisecondsPerTick = 1.0 / ticksPerMillisecond;

var ticksPerSecond = ticksPerMillisecond * 1000;   // 10,000,000
var secondsPerTick = 1.0 / ticksPerSecond;         // 0.0001

var ticksPerMinute = ticksPerSecond * 60;         // 600,000,000
var minutesPerTick = 1.0 / ticksPerMinute; // 1.6666666666667e-9

var ticksPerHour = ticksPerMinute * 60;        // 36,000,000,000
var hoursPerTick = 1.0 / ticksPerHour; // 2.77777777777777778e-11

var ticksPerDay = ticksPerHour * 24;          // 864,000,000,000
var daysPerTick = 1.0 / ticksPerDay; // 1.1574074074074074074e-12

var millisPerSecond = 1000;
var millisPerMinute = millisPerSecond * 60; //     60,000
var millisPerHour = millisPerMinute * 60;   //  3,600,000
var millisPerDay = millisPerHour * 24;      // 86,400,000

var maxSeconds = Number.MAX_SAFE_INTEGER / ticksPerSecond;
var minSeconds = Number.MIN_SAFE_INTEGER / ticksPerSecond;

var maxMilliSeconds = Number.MAX_SAFE_INTEGER / ticksPerMillisecond;
var minMilliSeconds = Number.MIN_SAFE_INTEGER / ticksPerMillisecond;

var ticksPerTenthSecond = ticksPerMillisecond * 100;
/**
 * Represents a time interval.
 *
 * @constructor TimeSpan
 * @param {number} days                 - Number of days.
 * @param {number} hours                - Number of hours.
 * @param {number} minutes              - Number of minutes.
 * @param {number} seconds              - Number of seconds.
 * @param {number} milliseconds         - Number of milliseconds.
 * @ignore
 */
var TimeSpan = Base.defineClass(
    function (days, hours, minutes, seconds, milliseconds) {
        // Constructor
        if (!Number.isInteger(days)) {
            throw "days is not an integer";
        }
        
        if (!Number.isInteger(hours)) {
            throw "hours is not an integer";
        }
        
        if (!Number.isInteger(minutes)) {
            throw "minutes is not an integer";
        }
        
        if (!Number.isInteger(seconds)) {
            throw "seconds is not an integer";
        }
        
        if (!Number.isInteger(milliseconds)) {
            throw "milliseconds is not an integer";
        }
        
        var totalMilliSeconds = (days * 3600 * 24 + hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
        if (totalMilliSeconds > maxMilliSeconds || totalMilliSeconds < minMilliSeconds) {
            throw "Total number of milliseconds was either too large or too small";
        }

        this._ticks = totalMilliSeconds * ticksPerMillisecond;
    },

    {
        // Instance Members
        
        /**
        * Returns a new TimeSpan object whose value is the sum of the specified TimeSpan object and this instance.
        * @param {TimeSpan} ts              - The time interval to add.
        * @memberof TimeSpan
        * @instance
        */
        add: function (ts) {
            if (additionDoesOverflow(this._ticks, ts._ticks)) {
                throw "Adding the two timestamps causes an overflow."
            }
            
            var results = this._ticks + ts._ticks;
            return TimeSpan.fromTicks(results);
        },
        
        /**
        * Returns a new TimeSpan object whose value is the difference of the specified TimeSpan object and this instance.
        * @param {TimeSpan} ts              - The time interval to subtract.
        * @memberof TimeSpan
        * @instance
        */
        subtract: function (ts) {
            if (subtractionDoesUnderflow(this._ticks, ts._ticks)) {
                throw "Subtracting the two timestamps causes an underflow."
            }
            
            var results = this._ticks - ts._ticks;
            return TimeSpan.fromTicks(results);
        },
        
        /**
        * Compares this instance to a specified object and returns an integer that indicates whether this instance is shorter than, equal to, or longer than the specified object.
        * @param {TimeSpan} value              - The time interval to add.
        * @memberof TimeSpan
        * @instance
        */
        compareTo: function (value) {
            if (value == null) {
                return 1;
            }
            
            if (!TimeSpan._isTimeSpan(value)) {
                throw "Argument must be a TimeSpan object";
            }
            
            return compare(this, value);
        },
        
        /**
        * Returns a new TimeSpan object whose value is the absolute value of the current TimeSpan object.
        * @memberof TimeSpan
        * @instance
        */
        duration: function () {
            return TimeSpan.fromTicks(this._ticks >= 0 ? this._ticks : -this._ticks);
        },
        
        /**
        * Returns a value indicating whether this instance is equal to a specified object.
        * @memberof TimeSpan
        * @param {TimeSpan} value              - The time interval to check for equality.
        * @instance
        */
        equals: function (value) {
            if (TimeSpan._isTimeSpan(value)) {
                return this._ticks == value._ticks
            }

            return false;
        },
        
        /**
        * Returns a new TimeSpan object whose value is the negated value of this instance.
        * @memberof TimeSpan
        * @param {TimeSpan} value              - The time interval to check for equality.
        * @instance
        */
        negate: function () {
            return TimeSpan.fromTicks(-this._ticks);
        },

        days: function () {
            return Math.floor(this._ticks / ticksPerDay);
        },

        hours: function () {
            return Math.floor(this._ticks / ticksPerHour);
        },

        milliseconds: function (){
            return Math.floor(this._ticks / ticksPerMillisecond);
        },

        seconds: function () {
            return Math.floor(this._ticks / ticksPerSecond);
        },

        ticks: function () {
            return this._ticks;
        },

        totalDays: function () {
            return this._ticks * daysPerTick;
        },

        totalHours: function () {
            return this._ticks * hoursPerTick;
        },

        totalMilliseconds: function () {
            return this._ticks * millisecondsPerTick;
        },

        totalMinutes: function () {
            return this._ticks * minutesPerTick;
        },

        totalSeconds: function () {
            return this._ticks * secondsPerTick;
        },
    },

    {
        // Static Members
        
    }
);

var fromTicks = function (value) {
    var timeSpan = new TimeSpan(0, 0, 0, 0, 0);
    timeSpan._ticks = value;
    return timeSpan;
};

var zero = new TimeSpan(0, 0, 0, 0, 0);
var maxValue = fromTicks(Number.MAX_SAFE_INTEGER);
var minValue = fromTicks(Number.MIN_SAFE_INTEGER);

var isTimeSpan = function (timespan) {
    return '_ticks' in timespan;
};

var additionDoesOverflow = function (a, b) {
    var c = a + b;
    return a !== c - b || b !== c - a;
};

var subtractionDoesUnderflow = function (a, b) {
    var c = a - b;
    return a !== c + b || b !== a - c;
};

var compare = function (t1, t2) {
    if (t1._ticks > t2._ticks) return 1;
    if (t1._ticks < t2._ticks) return -1;
    return 0;
}

var interval = function (value, scale) {
    if (isNaN(value)) {
        throw "value must be a number";
    }
    
    var milliseconds = value * scale;
    if ((milliseconds > maxMilliSeconds) || milliseconds < minMilliSeconds) {
        throw "timespan too long";
    }
    
    return TimeSpan.fromTicks(Math.floor(milliseconds * ticksPerMillisecond));
};

var fromMilliseconds = function (value) {
    return interval(value, 1);
};

var fromSeconds = function (value) {
    return interval(value, millisPerSecond);
};

var fromMinutes = function (value) {
    return interval(value, millisPerMinute);
};

var fromHours = function (value) {
    return interval(value, millisPerHour);
};

var fromDays = function (value) {
    return interval(value, millisPerDay);
};

//SCRIPT END
if (typeof exports !== "undefined") {
    module.exports = TimeSpan;
    // Fields
    TimeSpan.maxValue = maxValue;
    TimeSpan.minValue = minValue;
    TimeSpan.ticksPerDay = ticksPerDay;
    TimeSpan.ticksPerHour = ticksPerHour;
    TimeSpan.ticksPerMillisecond = ticksPerMillisecond;
    TimeSpan.ticksPerMinute = ticksPerMinute;
    TimeSpan.ticksPerSecond = ticksPerSecond;
    TimeSpan.zero = zero;
    // Methods
    TimeSpan.compare = compare;
    TimeSpan.fromDays = fromDays;
    TimeSpan.fromHours = fromHours;
    TimeSpan.fromMilliseconds = fromMilliseconds;
    TimeSpan.fromMinutes = fromMinutes;
    TimeSpan.fromSeconds = fromSeconds;
    TimeSpan.fromTicks = fromTicks;
}