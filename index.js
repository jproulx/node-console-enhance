/*globals require, exports, process */
/**
 * A custom console replacement for logging. Simply enable and use the console
 * as you would normally, but now with additional details that can aid
 * debugging
 *
 * @author  Jesse Proulx <github@jproulx.net>
 */
"use strict";
var util     = require('util');
var console  = require('console');
var path     = require('path');
var methods  = 'info,log,warn,error'.split(',');
var format   = '[{date}] {label} - {name}:{pid} - {filename}:{function}:{line} - {parameters}';
var original = console.Console.prototype;
var tokens   = {
    'date'     : function () { return new Date(); },
    'pid'      : process.pid,
    'filename' : function (stack) { return path.relative(process.cwd(), stack.getFileName()); },
    'line'     : function (stack) { return stack.getLineNumber(); },
    'function'        : function (stack) { return stack.getFunctionName() || 'main'; }
};
/**
 * Returns a callsite at the correct position
 *
 * @private
 * @param   {Function}  context     The constructor function to mask irrelevant callsites
 * @return  {Object}
 */
function getStackTrace (context) {
    var original = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err, context || getStackTrace);
    var stack = err.stack;
    Error.prepareStackTrace = original;
    return stack[0];
}
/**
 * Format a log line according to the format config and the current tokens
 *
 * @private
 * @param   {String}    parameters
 * @param   {String}    name
 * @param   {String}    method
 * @param   {Function}  context
 * @return  {String}
 */
function formatLogLine (parameters, name, method, context) {
    tokens.label = method.toUpperCase() + new Array(8 - method.length).join(' ');
    tokens.name  = name;
    tokens.parameters = parameters;
    var stack  = getStackTrace(context);
    var output = format;
    for (var token in tokens) {
        var value = tokens[token];
        if (typeof tokens[token] == 'function') {
            value = tokens[token].call(console, stack);
        }
        output = output.replace('{' + token + '}', value);
    }
    return output;
}
/**
 * Set up a custom token
 *
 * @public
 * @param   {String}    name    Token name
 * @param   {Mixed}     value   Token value, can also be a function that returns a value, which will be called at runtime
 */
exports.token = function (name, value) {
    tokens[name] = value;
};
/**
 * Set up a custom log format
 *
 * @public
 * @param   {String}    replacement     The log line format. Tokens are identified with the format "{tokenName}"
 */
exports.format = function (replacement) {
    format = replacement;
};
/**
 * Enables custom logging
 *
 * @public
 * @param   {String}    name    Identify the custom logger
 * @param   {String}    level   Optional minimum log level
 */
exports.enable = function (name, level) {
    var index = methods.indexOf(level);
    console.trace = function () {
        var error = new Error();
        error.name = 'Trace';
        error.message = util.format.apply(this, arguments);
        Error.captureStackTrace(error, this.trace);
        var output = util.format(error.stack);
        original.error.call(this, formatLogLine(output, name, 'trace', this.trace));
    }.bind(console);
    console.dir = function (object) {
        var output = util.inspect(object, {
            customInspect: false
        });
        original.log.call(this, formatLogLine(output, name, 'dir', this.dir));
    }.bind(console);
    console.timeEnd = function (label) {
        var time = this._times[label];
        if (!time) {
            throw new Error('No such label: ' + label);
        }
        var duration = Date.now() - time;
        original.log.call(this, formatLogLine(util.format('%s: %dms', label, duration), name, 'timeEnd', this.timeEnd));
    }.bind(console);
    methods.forEach(function override(method) {
        console[method] = function () {
            var parameters = util.format.apply(this, arguments);
            if (methods.indexOf(method) >= index) {
                return original[method].call(this, formatLogLine(parameters, name, method, this[method]));
            }
        }.bind(console);
    });
};
/**
 * Disables custom logging by resetting the console methods to the prototype versions
 *
 * @public
 */
exports.disable = function () {
    for (var method in console) {
        if (typeof console[method] == 'function' && method != 'Console') {
            console[method] = original[method].bind(console);
        }
    }
};
