/*globals console, require */
var util    = require('util');
var slice   = Array.prototype.slice;
var methods = 'log,info,warn,error,dir,assert'.split(',');
var stack   = function getStackTrace () {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack) {
        return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
};
var line = function getLineNumber () {
    return stack()[3].getLineNumber();
};
var fname = function getFunctionName () {
    return stack()[3].getFunctionName() || 'main';
};
var log = console.log;
module.exports = function (console, name) {
    "use strict";
    if (console.__modified__) {
        return;
    }
    ['log','info','warn','error','dir','assert'].forEach(function override(method) {
        var original = console[method];
        console[method] = function () {
            var args = slice.call(arguments);
            var now = new Date();
            var pid = process.pid;
            return original.apply(this, ['[%s] %s - %s:%s - %s:%s -', now, method.toUpperCase(), name, pid, fname(), line() ].concat(args));
        }.bind(console);
    });
    console.__modified__ = true;
};
