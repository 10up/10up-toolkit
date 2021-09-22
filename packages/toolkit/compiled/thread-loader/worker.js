/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 586:
/***/ ((module) => {

"use strict";


module.exports = parseJson
function parseJson (txt, reviver, context) {
  context = context || 20
  try {
    return JSON.parse(txt, reviver)
  } catch (e) {
    if (typeof txt !== 'string') {
      const isEmptyArray = Array.isArray(txt) && txt.length === 0
      const errorMessage = 'Cannot parse ' +
      (isEmptyArray ? 'an empty array' : String(txt))
      throw new TypeError(errorMessage)
    }
    const syntaxErr = e.message.match(/^Unexpected token.*position\s+(\d+)/i)
    const errIdx = syntaxErr
    ? +syntaxErr[1]
    : e.message.match(/^Unexpected end of JSON.*/i)
    ? txt.length - 1
    : null
    if (errIdx != null) {
      const start = errIdx <= context
      ? 0
      : errIdx - context
      const end = errIdx + context >= txt.length
      ? txt.length
      : errIdx + context
      e.message += ` while parsing near '${
        start === 0 ? '' : '...'
      }${txt.slice(start, end)}${
        end === txt.length ? '' : '...'
      }'`
    } else {
      e.message += ` while parsing '${txt.slice(0, context * 2)}'`
    }
    throw e
  }
}


/***/ }),

/***/ 37:
/***/ ((module) => {

"use strict";


class LoadingLoaderError extends Error {
	constructor(message) {
		super(message);
		this.name = "LoaderRunnerError";
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = LoadingLoaderError;


/***/ }),

/***/ 791:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var fs = __nccwpck_require__(747);
var readFile = fs.readFile.bind(fs);
var loadLoader = __nccwpck_require__(966);

function utf8BufferToString(buf) {
	var str = buf.toString("utf-8");
	if(str.charCodeAt(0) === 0xFEFF) {
		return str.substr(1);
	} else {
		return str;
	}
}

const PATH_QUERY_FRAGMENT_REGEXP = /^((?:\0.|[^?#\0])*)(\?(?:\0.|[^#\0])*)?(#.*)?$/;

/**
 * @param {string} str the path with query and fragment
 * @returns {{ path: string, query: string, fragment: string }} parsed parts
 */
function parsePathQueryFragment(str) {
	var match = PATH_QUERY_FRAGMENT_REGEXP.exec(str);
	return {
		path: match[1].replace(/\0(.)/g, "$1"),
		query: match[2] ? match[2].replace(/\0(.)/g, "$1") : "",
		fragment: match[3] || ""
	};
}

function dirname(path) {
	if(path === "/") return "/";
	var i = path.lastIndexOf("/");
	var j = path.lastIndexOf("\\");
	var i2 = path.indexOf("/");
	var j2 = path.indexOf("\\");
	var idx = i > j ? i : j;
	var idx2 = i > j ? i2 : j2;
	if(idx < 0) return path;
	if(idx === idx2) return path.substr(0, idx + 1);
	return path.substr(0, idx);
}

function createLoaderObject(loader) {
	var obj = {
		path: null,
		query: null,
		fragment: null,
		options: null,
		ident: null,
		normal: null,
		pitch: null,
		raw: null,
		data: null,
		pitchExecuted: false,
		normalExecuted: false
	};
	Object.defineProperty(obj, "request", {
		enumerable: true,
		get: function() {
			return obj.path.replace(/#/g, "\0#") + obj.query.replace(/#/g, "\0#") + obj.fragment;
		},
		set: function(value) {
			if(typeof value === "string") {
				var splittedRequest = parsePathQueryFragment(value);
				obj.path = splittedRequest.path;
				obj.query = splittedRequest.query;
				obj.fragment = splittedRequest.fragment;
				obj.options = undefined;
				obj.ident = undefined;
			} else {
				if(!value.loader)
					throw new Error("request should be a string or object with loader and options (" + JSON.stringify(value) + ")");
				obj.path = value.loader;
				obj.fragment = value.fragment || "";
				obj.type = value.type;
				obj.options = value.options;
				obj.ident = value.ident;
				if(obj.options === null)
					obj.query = "";
				else if(obj.options === undefined)
					obj.query = "";
				else if(typeof obj.options === "string")
					obj.query = "?" + obj.options;
				else if(obj.ident)
					obj.query = "??" + obj.ident;
				else if(typeof obj.options === "object" && obj.options.ident)
					obj.query = "??" + obj.options.ident;
				else
					obj.query = "?" + JSON.stringify(obj.options);
			}
		}
	});
	obj.request = loader;
	if(Object.preventExtensions) {
		Object.preventExtensions(obj);
	}
	return obj;
}

function runSyncOrAsync(fn, context, args, callback) {
	var isSync = true;
	var isDone = false;
	var isError = false; // internal error
	var reportedError = false;
	context.async = function async() {
		if(isDone) {
			if(reportedError) return; // ignore
			throw new Error("async(): The callback was already called.");
		}
		isSync = false;
		return innerCallback;
	};
	var innerCallback = context.callback = function() {
		if(isDone) {
			if(reportedError) return; // ignore
			throw new Error("callback(): The callback was already called.");
		}
		isDone = true;
		isSync = false;
		try {
			callback.apply(null, arguments);
		} catch(e) {
			isError = true;
			throw e;
		}
	};
	try {
		var result = (function LOADER_EXECUTION() {
			return fn.apply(context, args);
		}());
		if(isSync) {
			isDone = true;
			if(result === undefined)
				return callback();
			if(result && typeof result === "object" && typeof result.then === "function") {
				return result.then(function(r) {
					callback(null, r);
				}, callback);
			}
			return callback(null, result);
		}
	} catch(e) {
		if(isError) throw e;
		if(isDone) {
			// loader is already "done", so we cannot use the callback function
			// for better debugging we print the error on the console
			if(typeof e === "object" && e.stack) console.error(e.stack);
			else console.error(e);
			return;
		}
		isDone = true;
		reportedError = true;
		callback(e);
	}

}

function convertArgs(args, raw) {
	if(!raw && Buffer.isBuffer(args[0]))
		args[0] = utf8BufferToString(args[0]);
	else if(raw && typeof args[0] === "string")
		args[0] = Buffer.from(args[0], "utf-8");
}

function iteratePitchingLoaders(options, loaderContext, callback) {
	// abort after last loader
	if(loaderContext.loaderIndex >= loaderContext.loaders.length)
		return processResource(options, loaderContext, callback);

	var currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];

	// iterate
	if(currentLoaderObject.pitchExecuted) {
		loaderContext.loaderIndex++;
		return iteratePitchingLoaders(options, loaderContext, callback);
	}

	// load loader module
	loadLoader(currentLoaderObject, function(err) {
		if(err) {
			loaderContext.cacheable(false);
			return callback(err);
		}
		var fn = currentLoaderObject.pitch;
		currentLoaderObject.pitchExecuted = true;
		if(!fn) return iteratePitchingLoaders(options, loaderContext, callback);

		runSyncOrAsync(
			fn,
			loaderContext, [loaderContext.remainingRequest, loaderContext.previousRequest, currentLoaderObject.data = {}],
			function(err) {
				if(err) return callback(err);
				var args = Array.prototype.slice.call(arguments, 1);
				// Determine whether to continue the pitching process based on
				// argument values (as opposed to argument presence) in order
				// to support synchronous and asynchronous usages.
				var hasArg = args.some(function(value) {
					return value !== undefined;
				});
				if(hasArg) {
					loaderContext.loaderIndex--;
					iterateNormalLoaders(options, loaderContext, args, callback);
				} else {
					iteratePitchingLoaders(options, loaderContext, callback);
				}
			}
		);
	});
}

function processResource(options, loaderContext, callback) {
	// set loader index to last loader
	loaderContext.loaderIndex = loaderContext.loaders.length - 1;

	var resourcePath = loaderContext.resourcePath;
	if(resourcePath) {
		options.processResource(loaderContext, resourcePath, function(err, buffer) {
			if(err) return callback(err);
			options.resourceBuffer = buffer;
			iterateNormalLoaders(options, loaderContext, [buffer], callback);
		});
	} else {
		iterateNormalLoaders(options, loaderContext, [null], callback);
	}
}

function iterateNormalLoaders(options, loaderContext, args, callback) {
	if(loaderContext.loaderIndex < 0)
		return callback(null, args);

	var currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];

	// iterate
	if(currentLoaderObject.normalExecuted) {
		loaderContext.loaderIndex--;
		return iterateNormalLoaders(options, loaderContext, args, callback);
	}

	var fn = currentLoaderObject.normal;
	currentLoaderObject.normalExecuted = true;
	if(!fn) {
		return iterateNormalLoaders(options, loaderContext, args, callback);
	}

	convertArgs(args, currentLoaderObject.raw);

	runSyncOrAsync(fn, loaderContext, args, function(err) {
		if(err) return callback(err);

		var args = Array.prototype.slice.call(arguments, 1);
		iterateNormalLoaders(options, loaderContext, args, callback);
	});
}

exports.getContext = function getContext(resource) {
	var path = parsePathQueryFragment(resource).path;
	return dirname(path);
};

exports.runLoaders = function runLoaders(options, callback) {
	// read options
	var resource = options.resource || "";
	var loaders = options.loaders || [];
	var loaderContext = options.context || {};
	var processResource = options.processResource || ((readResource, context, resource, callback) => {
		context.addDependency(resource);
		readResource(resource, callback);
	}).bind(null, options.readResource || readFile);

	//
	var splittedResource = resource && parsePathQueryFragment(resource);
	var resourcePath = splittedResource ? splittedResource.path : undefined;
	var resourceQuery = splittedResource ? splittedResource.query : undefined;
	var resourceFragment = splittedResource ? splittedResource.fragment : undefined;
	var contextDirectory = resourcePath ? dirname(resourcePath) : null;

	// execution state
	var requestCacheable = true;
	var fileDependencies = [];
	var contextDependencies = [];
	var missingDependencies = [];

	// prepare loader objects
	loaders = loaders.map(createLoaderObject);

	loaderContext.context = contextDirectory;
	loaderContext.loaderIndex = 0;
	loaderContext.loaders = loaders;
	loaderContext.resourcePath = resourcePath;
	loaderContext.resourceQuery = resourceQuery;
	loaderContext.resourceFragment = resourceFragment;
	loaderContext.async = null;
	loaderContext.callback = null;
	loaderContext.cacheable = function cacheable(flag) {
		if(flag === false) {
			requestCacheable = false;
		}
	};
	loaderContext.dependency = loaderContext.addDependency = function addDependency(file) {
		fileDependencies.push(file);
	};
	loaderContext.addContextDependency = function addContextDependency(context) {
		contextDependencies.push(context);
	};
	loaderContext.addMissingDependency = function addMissingDependency(context) {
		missingDependencies.push(context);
	};
	loaderContext.getDependencies = function getDependencies() {
		return fileDependencies.slice();
	};
	loaderContext.getContextDependencies = function getContextDependencies() {
		return contextDependencies.slice();
	};
	loaderContext.getMissingDependencies = function getMissingDependencies() {
		return missingDependencies.slice();
	};
	loaderContext.clearDependencies = function clearDependencies() {
		fileDependencies.length = 0;
		contextDependencies.length = 0;
		missingDependencies.length = 0;
		requestCacheable = true;
	};
	Object.defineProperty(loaderContext, "resource", {
		enumerable: true,
		get: function() {
			if(loaderContext.resourcePath === undefined)
				return undefined;
			return loaderContext.resourcePath.replace(/#/g, "\0#") + loaderContext.resourceQuery.replace(/#/g, "\0#") + loaderContext.resourceFragment;
		},
		set: function(value) {
			var splittedResource = value && parsePathQueryFragment(value);
			loaderContext.resourcePath = splittedResource ? splittedResource.path : undefined;
			loaderContext.resourceQuery = splittedResource ? splittedResource.query : undefined;
			loaderContext.resourceFragment = splittedResource ? splittedResource.fragment : undefined;
		}
	});
	Object.defineProperty(loaderContext, "request", {
		enumerable: true,
		get: function() {
			return loaderContext.loaders.map(function(o) {
				return o.request;
			}).concat(loaderContext.resource || "").join("!");
		}
	});
	Object.defineProperty(loaderContext, "remainingRequest", {
		enumerable: true,
		get: function() {
			if(loaderContext.loaderIndex >= loaderContext.loaders.length - 1 && !loaderContext.resource)
				return "";
			return loaderContext.loaders.slice(loaderContext.loaderIndex + 1).map(function(o) {
				return o.request;
			}).concat(loaderContext.resource || "").join("!");
		}
	});
	Object.defineProperty(loaderContext, "currentRequest", {
		enumerable: true,
		get: function() {
			return loaderContext.loaders.slice(loaderContext.loaderIndex).map(function(o) {
				return o.request;
			}).concat(loaderContext.resource || "").join("!");
		}
	});
	Object.defineProperty(loaderContext, "previousRequest", {
		enumerable: true,
		get: function() {
			return loaderContext.loaders.slice(0, loaderContext.loaderIndex).map(function(o) {
				return o.request;
			}).join("!");
		}
	});
	Object.defineProperty(loaderContext, "query", {
		enumerable: true,
		get: function() {
			var entry = loaderContext.loaders[loaderContext.loaderIndex];
			return entry.options && typeof entry.options === "object" ? entry.options : entry.query;
		}
	});
	Object.defineProperty(loaderContext, "data", {
		enumerable: true,
		get: function() {
			return loaderContext.loaders[loaderContext.loaderIndex].data;
		}
	});

	// finish loader context
	if(Object.preventExtensions) {
		Object.preventExtensions(loaderContext);
	}

	var processOptions = {
		resourceBuffer: null,
		processResource: processResource
	};
	iteratePitchingLoaders(processOptions, loaderContext, function(err, result) {
		if(err) {
			return callback(err, {
				cacheable: requestCacheable,
				fileDependencies: fileDependencies,
				contextDependencies: contextDependencies,
				missingDependencies: missingDependencies
			});
		}
		callback(null, {
			result: result,
			resourceBuffer: processOptions.resourceBuffer,
			cacheable: requestCacheable,
			fileDependencies: fileDependencies,
			contextDependencies: contextDependencies,
			missingDependencies: missingDependencies
		});
	});
};


/***/ }),

/***/ 966:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var LoaderLoadingError = __nccwpck_require__(37);
var url;

module.exports = function loadLoader(loader, callback) {
	if(loader.type === "module") {
		try {
			if(url === undefined) url = __nccwpck_require__(835);
			var loaderUrl = url.pathToFileURL(loader.path);
			var modulePromise = eval("import(" + JSON.stringify(loaderUrl.toString()) + ")");
			modulePromise.then(function(module) {
				handleResult(loader, module, callback);
			}, callback);
			return;
		} catch(e) {
			callback(e);
		}
	} else {
		try {
			var module = require(loader.path);
		} catch(e) {
			// it is possible for node to choke on a require if the FD descriptor
			// limit has been reached. give it a chance to recover.
			if(e instanceof Error && e.code === "EMFILE") {
				var retry = loadLoader.bind(null, loader, callback);
				if(typeof setImmediate === "function") {
					// node >= 0.9.0
					return setImmediate(retry);
				} else {
					// node < 0.9.0
					return process.nextTick(retry);
				}
			}
			return callback(e);
		}
		return handleResult(loader, module, callback);
	}
};

function handleResult(loader, module, callback) {
	if(typeof module !== "function" && typeof module !== "object") {
		return callback(new LoaderLoadingError(
			"Module '" + loader.path + "' is not a loader (export function or es6 module)"
		));
	}
	loader.normal = typeof module === "function" ? module : module.default;
	loader.pitch = module.pitch;
	loader.raw = module.raw;
	if(typeof loader.normal !== "function" && typeof loader.pitch !== "function") {
		return callback(new LoaderLoadingError(
			"Module '" + loader.path + "' is not a loader (must have normal or pitch function)"
		));
	}
	callback();
}


/***/ }),

/***/ 117:
/***/ (function(__unused_webpack_module, exports) {

(function(global, factory) {
  /*jshint -W030 */
  'use strict';
   true
    ? factory(exports)
    : 0;
})(this, function(exports) {
  'use strict';

  var noop = function noop() {};
  var throwError = function throwError() {
    throw new Error('Callback was already called.');
  };

  var DEFAULT_TIMES = 5;
  var DEFAULT_INTERVAL = 0;

  var obj = 'object';
  var func = 'function';
  var isArray = Array.isArray;
  var nativeKeys = Object.keys;
  var nativePush = Array.prototype.push;
  var iteratorSymbol = typeof Symbol === func && Symbol.iterator;

  var nextTick, asyncNextTick, asyncSetImmediate;
  createImmediate();

  /**
   * @memberof async
   * @namespace each
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.each(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done();
   *   }, num * 10);
   * };
   * async.each(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.each(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done();
   *   }, num * 10);
   * };
   * async.each(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   * @example
   *
   * // break
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num !== 2);
   *   }, num * 10);
   * };
   * async.each(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 2]
   * });
   *
   */
  var each = createEach(arrayEach, baseEach, symbolEach);

  /**
   * @memberof async
   * @namespace map
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.map(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var map = createMap(arrayEachIndex, baseEachIndex, symbolEachIndex, true);

  /**
   * @memberof async
   * @namespace mapValues
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValues(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var mapValues = createMap(arrayEachIndex, baseEachKey, symbolEachKey, false);

  /**
   * @memberof async
   * @namespace filter
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filter(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var filter = createFilter(arrayEachIndexValue, baseEachIndexValue, symbolEachIndexValue, true);

  /**
   * @memberof async
   * @namespace filterSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  var filterSeries = createFilterSeries(true);

  /**
   * @memberof async
   * @namespace filterLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.filterLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var filterLimit = createFilterLimit(true);

  /**
   * @memberof async
   * @namespace reject
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(array, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(array, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.reject(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var reject = createFilter(arrayEachIndexValue, baseEachIndexValue, symbolEachIndexValue, false);

  /**
   * @memberof async
   * @namespace rejectSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectSeries(array, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectSeries(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectSeries(object, iterator, function(err, res) {
   *   console.log(res); // [2];
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  var rejectSeries = createFilterSeries(false);

  /**
   * @memberof async
   * @namespace rejectLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.rejectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [4, 2]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var rejectLimit = createFilterLimit(false);

  /**
   * @memberof async
   * @namespace detect
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detect(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  var detect = createDetect(arrayEachValue, baseEachValue, symbolEachValue, true);

  /**
   * @memberof async
   * @namespace detectSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(array, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectSeries(object, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  var detectSeries = createDetectSeries(true);

  /**
   * @memberof async
   * @namespace detectLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.detectLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // 1
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  var detectLimit = createDetectLimit(true);

  /**
   * @memberof async
   * @namespace every
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 0], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.every(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 'a'], [2, 'c']]
   * });
   *
   */
  var every = createEvery(arrayEachValue, baseEachValue, symbolEachValue);

  /**
   * @memberof async
   * @namespace everySeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(array, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everySeries(object, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 'a'], [3, 'b'] [2, 'c']]
   * });
   *
   */
  var everySeries = createEverySeries();

  /**
   * @memberof async
   * @namespace everyLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 5, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [1, 3, 5, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.everyLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // false
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e']]
   * });
   *
   */
  var everyLimit = createEveryLimit();

  /**
   * @memberof async
   * @namespace pick
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [[0, 1], [2, 2], [3, 1], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pick(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b'], [4, 'd']]
   * });
   *
   */
  var pick = createPick(arrayEachIndexValue, baseEachKeyValue, symbolEachKeyValue, true);

  /**
   * @memberof async
   * @namespace pickSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3 }
   *   console.log(order); // [[0, 1], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c'], [4, 'd']]
   * });
   *
   */
  var pickSeries = createPickSeries(true);

  /**
   * @memberof async
   * @namespace pickLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.pickLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3 }
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var pickLimit = createPickLimit(true);

  /**
   * @memberof async
   * @namespace omit
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [[0, 1], [2, 2], [3, 1], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omit(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b'], [4, 'd']]
   * });
   *
   */
  var omit = createPick(arrayEachIndexValue, baseEachKeyValue, symbolEachKeyValue, false);

  /**
   * @memberof async
   * @namespace omitSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2, 4];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '2': 2, '3': 4 }
   *   console.log(order); // [[0, 1], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitSeries(object, iterator, function(err, res) {
   *   console.log(res); // { c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c'], [4, 'd']]
   * });
   *
   */
  var omitSeries = createPickSeries(false);

  /**
   * @memberof async
   * @namespace omitLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '3': 4, '4': 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '3': 4, '4': 2 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { d: 4, e: 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.omitLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { d: 4, e: 2 }
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  var omitLimit = createPickLimit(false);

  /**
   * @memberof async
   * @namespace transform
   * @param {Array|Object} collection
   * @param {Array|Object|Function} [accumulator]
   * @param {Function} [iterator]
   * @param {Function} [callback]
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num)
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4]
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // array with index and accumulator
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     result[index] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, {}, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2, '3': 4 }
   *   console.log(order); // [[1, 0], [2, 2], [3, 1], [4, 3]]
   * });
   *
   * @example
   *
   * // object with accumulator
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, [], iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4]
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     result[key] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transform(collection, iterator, function(err, res) {
   *   console.log(res); //  { a: 1, b: 3, c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b'], [4, 'd']]
   * });
   *
   */
  var transform = createTransform(arrayEachResult, baseEachResult, symbolEachResult);

  /**
   * @memberof async
   * @namespace sortBy
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBy(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var sortBy = createSortBy(arrayEachIndexValue, baseEachIndexValue, symbolEachIndexValue);

  /**
   * @memberof async
   * @namespace concat
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3];
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 0], [2, 2], [3, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [1, 2, 3]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concat(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 'a'], [2, 'c'], [3, 'b']]
   * });
   *
   */
  var concat = createConcat(arrayEachIndex, baseEachIndex, symbolEachIndex);

  /**
   * @memberof async
   * @namespace groupBy
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [4.2, 6.1, 6.4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [[4.2, 0], [6.1, 2], [6.4, 1]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [4.2, 6.1, 6.4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBy(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.1, 6.4] }
   *   console.log(order); // [[4.2, 'a'], [6.1, 'c'], [6.4, 'b']]
   * });
   *
   */
  var groupBy = createGroupBy(arrayEachValue, baseEachValue, symbolEachValue);

  /**
   * @memberof async
   * @namespace parallel
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(1);
   *      done(null, 1);
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(2);
   *      done(null, 2);
   *    }, 30);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(3);
   *      done(null, 3);
   *    }, 40);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(4);
   *      done(null, 4);
   *    }, 20);
   *  }
   * ];
   * async.parallel(tasks, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4];
   *   console.log(order); // [1, 4, 2, 3]
   * });
   *
   * @example
   *
   * var order = [];
   * var tasks = {
   *   'a': function(done) {
   *     setTimeout(function() {
   *       order.push(1);
   *       done(null, 1);
   *     }, 10);
   *   },
   *   'b': function(done) {
   *     setTimeout(function() {
   *       order.push(2);
   *       done(null, 2);
   *     }, 30);
   *   },
   *   'c': function(done) {
   *     setTimeout(function() {
   *       order.push(3);
   *       done(null, 3);
   *     }, 40);
   *   },
   *   'd': function(done) {
   *     setTimeout(function() {
   *       order.push(4);
   *       done(null, 4);
   *     }, 20);
   *   }
   * };
   * async.parallel(tasks, function(err, res) {
   *   console.log(res); // { a: 1, b: 2, c: 3, d:4 }
   *   console.log(order); // [1, 4, 2, 3]
   * });
   *
   */
  var parallel = createParallel(arrayEachFunc, baseEachFunc);

  /**
   * @memberof async
   * @namespace applyEach
   */
  var applyEach = createApplyEach(map);

  /**
   * @memberof async
   * @namespace applyEachSeries
   */
  var applyEachSeries = createApplyEach(mapSeries);

  /**
   * @memberof async
   * @namespace log
   */
  var log = createLogger('log');

  /**
   * @memberof async
   * @namespace dir
   */
  var dir = createLogger('dir');

  /**
   * @version 2.6.2
   * @namespace async
   */
  var index = {
    VERSION: '2.6.2',

    // Collections
    each: each,
    eachSeries: eachSeries,
    eachLimit: eachLimit,
    forEach: each,
    forEachSeries: eachSeries,
    forEachLimit: eachLimit,
    eachOf: each,
    eachOfSeries: eachSeries,
    eachOfLimit: eachLimit,
    forEachOf: each,
    forEachOfSeries: eachSeries,
    forEachOfLimit: eachLimit,
    map: map,
    mapSeries: mapSeries,
    mapLimit: mapLimit,
    mapValues: mapValues,
    mapValuesSeries: mapValuesSeries,
    mapValuesLimit: mapValuesLimit,
    filter: filter,
    filterSeries: filterSeries,
    filterLimit: filterLimit,
    select: filter,
    selectSeries: filterSeries,
    selectLimit: filterLimit,
    reject: reject,
    rejectSeries: rejectSeries,
    rejectLimit: rejectLimit,
    detect: detect,
    detectSeries: detectSeries,
    detectLimit: detectLimit,
    find: detect,
    findSeries: detectSeries,
    findLimit: detectLimit,
    pick: pick,
    pickSeries: pickSeries,
    pickLimit: pickLimit,
    omit: omit,
    omitSeries: omitSeries,
    omitLimit: omitLimit,
    reduce: reduce,
    inject: reduce,
    foldl: reduce,
    reduceRight: reduceRight,
    foldr: reduceRight,
    transform: transform,
    transformSeries: transformSeries,
    transformLimit: transformLimit,
    sortBy: sortBy,
    sortBySeries: sortBySeries,
    sortByLimit: sortByLimit,
    some: some,
    someSeries: someSeries,
    someLimit: someLimit,
    any: some,
    anySeries: someSeries,
    anyLimit: someLimit,
    every: every,
    everySeries: everySeries,
    everyLimit: everyLimit,
    all: every,
    allSeries: everySeries,
    allLimit: everyLimit,
    concat: concat,
    concatSeries: concatSeries,
    concatLimit: concatLimit,
    groupBy: groupBy,
    groupBySeries: groupBySeries,
    groupByLimit: groupByLimit,

    // Control Flow
    parallel: parallel,
    series: series,
    parallelLimit: parallelLimit,
    tryEach: tryEach,
    waterfall: waterfall,
    angelFall: angelFall,
    angelfall: angelFall,
    whilst: whilst,
    doWhilst: doWhilst,
    until: until,
    doUntil: doUntil,
    during: during,
    doDuring: doDuring,
    forever: forever,
    compose: compose,
    seq: seq,
    applyEach: applyEach,
    applyEachSeries: applyEachSeries,
    queue: queue,
    priorityQueue: priorityQueue,
    cargo: cargo,
    auto: auto,
    autoInject: autoInject,
    retry: retry,
    retryable: retryable,
    iterator: iterator,
    times: times,
    timesSeries: timesSeries,
    timesLimit: timesLimit,
    race: race,

    // Utils
    apply: apply,
    nextTick: asyncNextTick,
    setImmediate: asyncSetImmediate,
    memoize: memoize,
    unmemoize: unmemoize,
    ensureAsync: ensureAsync,
    constant: constant,
    asyncify: asyncify,
    wrapSync: asyncify,
    log: log,
    dir: dir,
    reflect: reflect,
    reflectAll: reflectAll,
    timeout: timeout,
    createLogger: createLogger,

    // Mode
    safe: safe,
    fast: fast
  };

  exports['default'] = index;
  baseEachSync(
    index,
    function(func, key) {
      exports[key] = func;
    },
    nativeKeys(index)
  );

  /**
   * @private
   */
  function createImmediate(safeMode) {
    var delay = function delay(fn) {
      var args = slice(arguments, 1);
      setTimeout(function() {
        fn.apply(null, args);
      });
    };
    asyncSetImmediate = typeof setImmediate === func ? setImmediate : delay;
    if (typeof process === obj && typeof process.nextTick === func) {
      nextTick = /^v0.10/.test(process.version) ? asyncSetImmediate : process.nextTick;
      asyncNextTick = /^v0/.test(process.version) ? asyncSetImmediate : process.nextTick;
    } else {
      asyncNextTick = nextTick = asyncSetImmediate;
    }
    if (safeMode === false) {
      nextTick = function(cb) {
        cb();
      };
    }
  }

  /* sync functions based on lodash */

  /**
   * Converts `arguments` to an array.
   *
   * @private
   * @param {Array} array = The array to slice.
   */
  function createArray(array) {
    var index = -1;
    var size = array.length;
    var result = Array(size);

    while (++index < size) {
      result[index] = array[index];
    }
    return result;
  }

  /**
   * Create an array from `start`
   *
   * @private
   * @param {Array} array - The array to slice.
   * @param {number} start - The start position.
   */
  function slice(array, start) {
    var end = array.length;
    var index = -1;
    var size = end - start;
    if (size <= 0) {
      return [];
    }
    var result = Array(size);

    while (++index < size) {
      result[index] = array[index + start];
    }
    return result;
  }

  /**
   * @private
   * @param {Object} object
   */
  function objectClone(object) {
    var keys = nativeKeys(object);
    var size = keys.length;
    var index = -1;
    var result = {};

    while (++index < size) {
      var key = keys[index];
      result[key] = object[key];
    }
    return result;
  }

  /**
   * Create an array with all falsey values removed.
   *
   * @private
   * @param {Array} array - The array to compact.
   */
  function compact(array) {
    var index = -1;
    var size = array.length;
    var result = [];

    while (++index < size) {
      var value = array[index];
      if (value) {
        result[result.length] = value;
      }
    }
    return result;
  }

  /**
   * Create an array of reverse sequence.
   *
   * @private
   * @param {Array} array - The array to reverse.
   */
  function reverse(array) {
    var index = -1;
    var size = array.length;
    var result = Array(size);
    var resIndex = size;

    while (++index < size) {
      result[--resIndex] = array[index];
    }
    return result;
  }

  /**
   * Checks if key exists in object property.
   *
   * @private
   * @param {Object} object - The object to inspect.
   * @param {string} key - The key to check.
   */
  function has(object, key) {
    return object.hasOwnProperty(key);
  }

  /**
   * Check if target exists in array.
   * @private
   * @param {Array} array
   * @param {*} target
   */
  function notInclude(array, target) {
    var index = -1;
    var size = array.length;

    while (++index < size) {
      if (array[index] === target) {
        return false;
      }
    }
    return true;
  }

  /**
   * @private
   * @param {Array} array - The array to iterate over.
   * @param {Function} iterator - The function invoked per iteration.
   */
  function arrayEachSync(array, iterator) {
    var index = -1;
    var size = array.length;

    while (++index < size) {
      iterator(array[index], index);
    }
    return array;
  }

  /**
   * @private
   * @param {Object} object - The object to iterate over.
   * @param {Function} iterator - The function invoked per iteration.
   * @param {Array} keys
   */
  function baseEachSync(object, iterator, keys) {
    var index = -1;
    var size = keys.length;

    while (++index < size) {
      var key = keys[index];
      iterator(object[key], key);
    }
    return object;
  }

  /**
   * @private
   * @param {number} n
   * @param {Function} iterator
   */
  function timesSync(n, iterator) {
    var index = -1;
    while (++index < n) {
      iterator(index);
    }
  }

  /**
   * @private
   * @param {Array} array
   * @param {number[]} criteria
   */
  function sortByCriteria(array, criteria) {
    var l = array.length;
    var indices = Array(l);
    var i;
    for (i = 0; i < l; i++) {
      indices[i] = i;
    }
    quickSort(criteria, 0, l - 1, indices);
    var result = Array(l);
    for (var n = 0; n < l; n++) {
      i = indices[n];
      result[n] = i === undefined ? array[n] : array[i];
    }
    return result;
  }

  function partition(array, i, j, mid, indices) {
    var l = i;
    var r = j;
    while (l <= r) {
      i = l;
      while (l < r && array[l] < mid) {
        l++;
      }
      while (r >= i && array[r] >= mid) {
        r--;
      }
      if (l > r) {
        break;
      }
      swap(array, indices, l++, r--);
    }
    return l;
  }

  function swap(array, indices, l, r) {
    var n = array[l];
    array[l] = array[r];
    array[r] = n;
    var i = indices[l];
    indices[l] = indices[r];
    indices[r] = i;
  }

  function quickSort(array, i, j, indices) {
    if (i === j) {
      return;
    }
    var k = i;
    while (++k <= j && array[i] === array[k]) {
      var l = k - 1;
      if (indices[l] > indices[k]) {
        var index = indices[l];
        indices[l] = indices[k];
        indices[k] = index;
      }
    }
    if (k > j) {
      return;
    }
    var p = array[i] > array[k] ? i : k;
    k = partition(array, i, j, array[p], indices);
    quickSort(array, i, k - 1, indices);
    quickSort(array, k, j, indices);
  }

  /**
   * @Private
   */
  function makeConcatResult(array) {
    var result = [];
    arrayEachSync(array, function(value) {
      if (value === noop) {
        return;
      }
      if (isArray(value)) {
        nativePush.apply(result, value);
      } else {
        result.push(value);
      }
    });
    return result;
  }

  /* async functions */

  /**
   * @private
   */
  function arrayEach(array, iterator, callback) {
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        iterator(array[index], index, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(array[index], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function baseEach(object, iterator, callback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], key, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(object[keys[index]], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function symbolEach(collection, iterator, callback) {
    var iter = collection[iteratorSymbol]();
    var index = 0;
    var item;
    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        iterator(item.value, index++, onlyOnce(callback));
      }
    } else {
      while ((item = iter.next()).done === false) {
        index++;
        iterator(item.value, onlyOnce(callback));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachResult(array, result, iterator, callback) {
    var index = -1;
    var size = array.length;

    if (iterator.length === 4) {
      while (++index < size) {
        iterator(result, array[index], index, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(result, array[index], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function baseEachResult(object, result, iterator, callback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 4) {
      while (++index < size) {
        key = keys[index];
        iterator(result, object[key], key, onlyOnce(callback));
      }
    } else {
      while (++index < size) {
        iterator(result, object[keys[index]], onlyOnce(callback));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachResult(collection, result, iterator, callback) {
    var item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 4) {
      while ((item = iter.next()).done === false) {
        iterator(result, item.value, index++, onlyOnce(callback));
      }
    } else {
      while ((item = iter.next()).done === false) {
        index++;
        iterator(result, item.value, onlyOnce(callback));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachFunc(array, createCallback) {
    var index = -1;
    var size = array.length;

    while (++index < size) {
      array[index](createCallback(index));
    }
  }

  /**
   * @private
   */
  function baseEachFunc(object, createCallback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    while (++index < size) {
      key = keys[index];
      object[key](createCallback(key));
    }
  }

  /**
   * @private
   */
  function arrayEachIndex(array, iterator, createCallback) {
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        iterator(array[index], index, createCallback(index));
      }
    } else {
      while (++index < size) {
        iterator(array[index], createCallback(index));
      }
    }
  }

  /**
   * @private
   */
  function baseEachIndex(object, iterator, createCallback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], key, createCallback(index));
      }
    } else {
      while (++index < size) {
        iterator(object[keys[index]], createCallback(index));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachIndex(collection, iterator, createCallback) {
    var item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        iterator(item.value, index, createCallback(index++));
      }
    } else {
      while ((item = iter.next()).done === false) {
        iterator(item.value, createCallback(index++));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function baseEachKey(object, iterator, createCallback, keys) {
    var key;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], key, createCallback(key));
      }
    } else {
      while (++index < size) {
        key = keys[index];
        iterator(object[key], createCallback(key));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachKey(collection, iterator, createCallback) {
    var item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        iterator(item.value, index, createCallback(index++));
      }
    } else {
      while ((item = iter.next()).done === false) {
        iterator(item.value, createCallback(index++));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachValue(array, iterator, createCallback) {
    var value;
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        value = array[index];
        iterator(value, index, createCallback(value));
      }
    } else {
      while (++index < size) {
        value = array[index];
        iterator(value, createCallback(value));
      }
    }
  }

  /**
   * @private
   */
  function baseEachValue(object, iterator, createCallback, keys) {
    var key, value;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, key, createCallback(value));
      }
    } else {
      while (++index < size) {
        value = object[keys[index]];
        iterator(value, createCallback(value));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachValue(collection, iterator, createCallback) {
    var value, item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, index++, createCallback(value));
      }
    } else {
      while ((item = iter.next()).done === false) {
        index++;
        value = item.value;
        iterator(value, createCallback(value));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function arrayEachIndexValue(array, iterator, createCallback) {
    var value;
    var index = -1;
    var size = array.length;

    if (iterator.length === 3) {
      while (++index < size) {
        value = array[index];
        iterator(value, index, createCallback(index, value));
      }
    } else {
      while (++index < size) {
        value = array[index];
        iterator(value, createCallback(index, value));
      }
    }
  }

  /**
   * @private
   */
  function baseEachIndexValue(object, iterator, createCallback, keys) {
    var key, value;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, key, createCallback(index, value));
      }
    } else {
      while (++index < size) {
        value = object[keys[index]];
        iterator(value, createCallback(index, value));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachIndexValue(collection, iterator, createCallback) {
    var value, item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, index, createCallback(index++, value));
      }
    } else {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, createCallback(index++, value));
      }
    }
    return index;
  }

  /**
   * @private
   */
  function baseEachKeyValue(object, iterator, createCallback, keys) {
    var key, value;
    var index = -1;
    var size = keys.length;

    if (iterator.length === 3) {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, key, createCallback(key, value));
      }
    } else {
      while (++index < size) {
        key = keys[index];
        value = object[key];
        iterator(value, createCallback(key, value));
      }
    }
  }

  /**
   * @private
   */
  function symbolEachKeyValue(collection, iterator, createCallback) {
    var value, item;
    var index = 0;
    var iter = collection[iteratorSymbol]();

    if (iterator.length === 3) {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, index, createCallback(index++, value));
      }
    } else {
      while ((item = iter.next()).done === false) {
        value = item.value;
        iterator(value, createCallback(index++, value));
      }
    }
    return index;
  }

  /**
   * @private
   * @param {Function} func
   */
  function onlyOnce(func) {
    return function(err, res) {
      var fn = func;
      func = throwError;
      fn(err, res);
    };
  }

  /**
   * @private
   * @param {Function} func
   */
  function once(func) {
    return function(err, res) {
      var fn = func;
      func = noop;
      fn(err, res);
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   */
  function createEach(arrayEach, baseEach, symbolEach) {
    return function each(collection, iterator, callback) {
      callback = once(callback || noop);
      var size, keys;
      var completed = 0;
      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, done);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, done);
        size && size === completed && callback(null);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, done, keys);
      }
      if (!size) {
        callback(null);
      }

      function done(err, bool) {
        if (err) {
          callback = once(callback);
          callback(err);
        } else if (++completed === size) {
          callback(null);
        } else if (bool === false) {
          callback = once(callback);
          callback(null);
        }
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createMap(arrayEach, baseEach, symbolEach, useArray) {
    var init, clone;
    if (useArray) {
      init = Array;
      clone = createArray;
    } else {
      init = function() {
        return {};
      };
      clone = objectClone;
    }

    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = init(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        // TODO: size could be changed
        result = init(0);
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        result = init(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, init());
      }

      function createCallback(key) {
        return function done(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            callback = once(callback);
            callback(err, clone(result));
            return;
          }
          result[key] = res;
          key = null;
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   * @param {boolean} bool
   */
  function createFilter(arrayEach, baseEach, symbolEach, bool) {
    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = Array(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        result = [];
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, compact(result));
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        result = Array(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        return callback(null, []);
      }

      function createCallback(index, value) {
        return function done(err, res) {
          if (index === null) {
            throwError();
          }
          if (err) {
            index = null;
            callback = once(callback);
            callback(err);
            return;
          }
          if (!!res === bool) {
            result[index] = value;
          }
          index = null;
          if (++completed === size) {
            callback(null, compact(result));
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createFilterSeries(bool) {
    return function(collection, iterator, callback) {
      callback = onlyOnce(callback || noop);
      var size, key, value, keys, iter, item, iterate;
      var sync = false;
      var completed = 0;
      var result = [];

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size) {
        return callback(null, []);
      }
      iterate();

      function arrayIterator() {
        value = collection[completed];
        iterator(value, done);
      }

      function arrayIteratorWithIndex() {
        value = collection[completed];
        iterator(value, completed, done);
      }

      function symbolIterator() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, done);
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, completed, done);
      }

      function objectIterator() {
        key = keys[completed];
        value = collection[key];
        iterator(value, done);
      }

      function objectIteratorWithKey() {
        key = keys[completed];
        value = collection[key];
        iterator(value, key, done);
      }

      function done(err, res) {
        if (err) {
          callback(err);
          return;
        }
        if (!!res === bool) {
          result[result.length] = value;
        }
        if (++completed === size) {
          iterate = throwError;
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createFilterLimit(bool) {
    return function(collection, limit, iterator, callback) {
      callback = callback || noop;
      var size, index, key, value, keys, iter, item, iterate, result;
      var sync = false;
      var started = 0;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        result = [];
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size || isNaN(limit) || limit < 1) {
        return callback(null, []);
      }
      result = result || Array(size);
      timesSync(limit > size ? size : limit, iterate);

      function arrayIterator() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, createCallback(value, index));
        }
      }

      function arrayIteratorWithIndex() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, index, createCallback(value, index));
        }
      }

      function symbolIterator() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, compact(result));
        }
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, started, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, compact(result));
        }
      }

      function objectIterator() {
        index = started++;
        if (index < size) {
          value = collection[keys[index]];
          iterator(value, createCallback(value, index));
        }
      }

      function objectIteratorWithKey() {
        index = started++;
        if (index < size) {
          key = keys[index];
          value = collection[key];
          iterator(value, key, createCallback(value, index));
        }
      }

      function createCallback(value, index) {
        return function(err, res) {
          if (index === null) {
            throwError();
          }
          if (err) {
            index = null;
            iterate = noop;
            callback = once(callback);
            callback(err);
            return;
          }
          if (!!res === bool) {
            result[index] = value;
          }
          index = null;
          if (++completed === size) {
            callback = onlyOnce(callback);
            callback(null, compact(result));
          } else if (sync) {
            nextTick(iterate);
          } else {
            sync = true;
            iterate();
          }
          sync = false;
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace eachSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachSeries(object, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'b']]
   * });
   *
   * @example
   *
   * // break
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num !== 3);
   *   }, num * 10);
   * };
   * async.eachSeries(array, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3]
   * });
   */
  function eachSeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null);
    }
    iterate();

    function arrayIterator() {
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      iterator(collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, bool) {
      if (err) {
        callback(err);
      } else if (++completed === size || bool === false) {
        iterate = throwError;
        callback(null);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace eachLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done();
   *   }, num * 10);
   * };
   * async.eachLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   * @example
   *
   * // break
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num !== 5);
   *   }, num * 10);
   * };
   * async.eachLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // undefined
   *   console.log(order); // [1, 3, 5]
   * });
   *
   */
  function eachLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, keys, iter, item, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    } else {
      return callback(null);
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        iterator(collection[started++], done);
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(collection[index], index, done);
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        started++;
        iterator(item.value, done);
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started++, done);
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null);
      }
    }

    function objectIterator() {
      if (started < size) {
        iterator(collection[keys[started++]], done);
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], key, done);
      }
    }

    function done(err, bool) {
      if (err || bool === false) {
        iterate = noop;
        callback = once(callback);
        callback(err);
      } else if (++completed === size) {
        iterator = noop;
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(null);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace mapSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function mapSeries(collection, iterator, callback) {
    callback = callback || noop;
    var size, key, keys, iter, item, result, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      result = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, []);
    }
    result = result || Array(size);
    iterate();

    function arrayIterator() {
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      iterator(collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, createArray(result));
        return;
      }
      result[completed] = res;
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
        callback = throwError;
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace mapLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 5, 3, 4, 2]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function mapLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, keys, iter, item, result, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      result = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    result = result || Array(size);
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        iterator(collection[index], createCallback(index));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(collection[index], index, createCallback(index));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      index = started++;
      if (index < size) {
        iterator(collection[keys[index]], createCallback(index));
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], key, createCallback(index));
      }
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        if (err) {
          index = null;
          iterate = noop;
          callback = once(callback);
          callback(err, createArray(result));
          return;
        }
        result[index] = res;
        index = null;
        if (++completed === size) {
          iterate = throwError;
          callback(null, result);
          callback = throwError;
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace mapValuesSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(array, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2 }
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesSeries(object, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 3, c: 2 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function mapValuesSeries(collection, iterator, callback) {
    callback = callback || noop;
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var result = {};
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      key = completed;
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      key = completed;
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      key = completed;
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      key = completed;
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      key = keys[completed];
      iterator(collection[key], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, objectClone(result));
        return;
      }
      result[key] = res;
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
        callback = throwError;
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace mapValuesLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3, d: 4, e: 2 }
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.mapValuesLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3, d: 4, e: 2 }
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function mapValuesLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, keys, iter, item, iterate;
    var sync = false;
    var result = {};
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, result);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        iterator(collection[index], createCallback(index));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(collection[index], index, createCallback(index));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], createCallback(key));
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(collection[key], key, createCallback(key));
      }
    }

    function createCallback(key) {
      return function(err, res) {
        if (key === null) {
          throwError();
        }
        if (err) {
          key = null;
          iterate = noop;
          callback = once(callback);
          callback(err, objectClone(result));
          return;
        }
        result[key] = res;
        key = null;
        if (++completed === size) {
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   * @param {boolean} bool
   */
  function createDetect(arrayEach, baseEach, symbolEach, bool) {
    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null);
      }

      function createCallback(value) {
        var called = false;
        return function done(err, res) {
          if (called) {
            throwError();
          }
          called = true;
          if (err) {
            callback = once(callback);
            callback(err);
          } else if (!!res === bool) {
            callback = once(callback);
            callback(null, value);
          } else if (++completed === size) {
            callback(null);
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createDetectSeries(bool) {
    return function(collection, iterator, callback) {
      callback = onlyOnce(callback || noop);
      var size, key, value, keys, iter, item, iterate;
      var sync = false;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size) {
        return callback(null);
      }
      iterate();

      function arrayIterator() {
        value = collection[completed];
        iterator(value, done);
      }

      function arrayIteratorWithIndex() {
        value = collection[completed];
        iterator(value, completed, done);
      }

      function symbolIterator() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null) : iterator(value, done);
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        value = item.value;
        item.done ? callback(null) : iterator(value, completed, done);
      }

      function objectIterator() {
        value = collection[keys[completed]];
        iterator(value, done);
      }

      function objectIteratorWithKey() {
        key = keys[completed];
        value = collection[key];
        iterator(value, key, done);
      }

      function done(err, res) {
        if (err) {
          callback(err);
        } else if (!!res === bool) {
          iterate = throwError;
          callback(null, value);
        } else if (++completed === size) {
          iterate = throwError;
          callback(null);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createDetectLimit(bool) {
    return function(collection, limit, iterator, callback) {
      callback = callback || noop;
      var size, index, key, value, keys, iter, item, iterate;
      var sync = false;
      var started = 0;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size || isNaN(limit) || limit < 1) {
        return callback(null);
      }
      timesSync(limit > size ? size : limit, iterate);

      function arrayIterator() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, createCallback(value));
        }
      }

      function arrayIteratorWithIndex() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, index, createCallback(value));
        }
      }

      function symbolIterator() {
        item = iter.next();
        if (item.done === false) {
          started++;
          value = item.value;
          iterator(value, createCallback(value));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null);
        }
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, started++, createCallback(value));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null);
        }
      }

      function objectIterator() {
        index = started++;
        if (index < size) {
          value = collection[keys[index]];
          iterator(value, createCallback(value));
        }
      }

      function objectIteratorWithKey() {
        if (started < size) {
          key = keys[started++];
          value = collection[key];
          iterator(value, key, createCallback(value));
        }
      }

      function createCallback(value) {
        var called = false;
        return function(err, res) {
          if (called) {
            throwError();
          }
          called = true;
          if (err) {
            iterate = noop;
            callback = once(callback);
            callback(err);
          } else if (!!res === bool) {
            iterate = noop;
            callback = once(callback);
            callback(null, value);
          } else if (++completed === size) {
            callback(null);
          } else if (sync) {
            nextTick(iterate);
          } else {
            sync = true;
            iterate();
          }
          sync = false;
        };
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   * @param {boolean} bool
   */
  function createPick(arrayEach, baseEach, symbolEach, bool) {
    return function(collection, iterator, callback) {
      callback = callback || noop;
      var size, keys;
      var completed = 0;
      var result = {};

      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        return callback(null, {});
      }

      function createCallback(key, value) {
        return function done(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            callback = once(callback);
            callback(err, objectClone(result));
            return;
          }
          if (!!res === bool) {
            result[key] = value;
          }
          key = null;
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createPickSeries(bool) {
    return function(collection, iterator, callback) {
      callback = onlyOnce(callback || noop);
      var size, key, value, keys, iter, item, iterate;
      var sync = false;
      var result = {};
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size) {
        return callback(null, {});
      }
      iterate();

      function arrayIterator() {
        key = completed;
        value = collection[completed];
        iterator(value, done);
      }

      function arrayIteratorWithIndex() {
        key = completed;
        value = collection[completed];
        iterator(value, completed, done);
      }

      function symbolIterator() {
        key = completed;
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, done);
      }

      function symbolIteratorWithKey() {
        key = completed;
        item = iter.next();
        value = item.value;
        item.done ? callback(null, result) : iterator(value, key, done);
      }

      function objectIterator() {
        key = keys[completed];
        value = collection[key];
        iterator(value, done);
      }

      function objectIteratorWithKey() {
        key = keys[completed];
        value = collection[key];
        iterator(value, key, done);
      }

      function done(err, res) {
        if (err) {
          callback(err, result);
          return;
        }
        if (!!res === bool) {
          result[key] = value;
        }
        if (++completed === size) {
          iterate = throwError;
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      }
    };
  }

  /**
   * @private
   * @param {boolean} bool
   */
  function createPickLimit(bool) {
    return function(collection, limit, iterator, callback) {
      callback = callback || noop;
      var size, index, key, value, keys, iter, item, iterate;
      var sync = false;
      var result = {};
      var started = 0;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = Infinity;
        iter = collection[iteratorSymbol]();
        iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
      }
      if (!size || isNaN(limit) || limit < 1) {
        return callback(null, {});
      }
      timesSync(limit > size ? size : limit, iterate);

      function arrayIterator() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, createCallback(value, index));
        }
      }

      function arrayIteratorWithIndex() {
        index = started++;
        if (index < size) {
          value = collection[index];
          iterator(value, index, createCallback(value, index));
        }
      }

      function symbolIterator() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, result);
        }
      }

      function symbolIteratorWithKey() {
        item = iter.next();
        if (item.done === false) {
          value = item.value;
          iterator(value, started, createCallback(value, started++));
        } else if (completed === started && iterator !== noop) {
          iterator = noop;
          callback(null, result);
        }
      }

      function objectIterator() {
        if (started < size) {
          key = keys[started++];
          value = collection[key];
          iterator(value, createCallback(value, key));
        }
      }

      function objectIteratorWithKey() {
        if (started < size) {
          key = keys[started++];
          value = collection[key];
          iterator(value, key, createCallback(value, key));
        }
      }

      function createCallback(value, key) {
        return function(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            iterate = noop;
            callback = once(callback);
            callback(err, objectClone(result));
            return;
          }
          if (!!res === bool) {
            result[key] = value;
          }
          key = null;
          if (++completed === size) {
            iterate = throwError;
            callback = onlyOnce(callback);
            callback(null, result);
          } else if (sync) {
            nextTick(iterate);
          } else {
            sync = true;
            iterate();
          }
          sync = false;
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace reduce
   * @param {Array|Object} collection
   * @param {*} result
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, '', iterator, function(err, res) {
   *   console.log(res); // '1324'
   *   console.log(order); // [[1, 0], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, '', iterator, function(err, res) {
   *   console.log(res); // '1324'
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduce(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'b'], [4, 'd']]
   * });
   *
   */
  function reduce(collection, result, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 4 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate(result);

    function arrayIterator(result) {
      iterator(result, collection[completed], done);
    }

    function arrayIteratorWithIndex(result) {
      iterator(result, collection[completed], completed, done);
    }

    function symbolIterator(result) {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, done);
    }

    function symbolIteratorWithKey(result) {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, completed, done);
    }

    function objectIterator(result) {
      iterator(result, collection[keys[completed]], done);
    }

    function objectIteratorWithKey(result) {
      key = keys[completed];
      iterator(result, collection[key], key, done);
    }

    function done(err, result) {
      if (err) {
        callback(err, result);
      } else if (++completed === size) {
        iterator = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(function() {
          iterate(result);
        });
      } else {
        sync = true;
        iterate(result);
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace reduceRight
   * @param {Array|Object} collection
   * @param {*} result
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [4, 2, 3, 1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, '', iterator, function(err, res) {
   *   console.log(res); // '4231'
   *   console.log(order); // [[4, 3], [2, 2], [3, 1], [1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, '', iterator, function(err, res) {
   *   console.log(res); // '4231'
   *   console.log(order); // [4, 2, 3, 1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, result + num);
   *   }, num * 10);
   * };
   * async.reduceRight(collection, 0, iterator, function(err, res) {
   *   console.log(res); // 10
   *   console.log(order); // [[4, 3], [2, 2], [3, 1], [1, 0]]
   * });
   *
   */
  function reduceRight(collection, result, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var resIndex, index, key, keys, iter, item, col, iterate;
    var sync = false;

    if (isArray(collection)) {
      resIndex = collection.length;
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      col = [];
      iter = collection[iteratorSymbol]();
      index = -1;
      while ((item = iter.next()).done === false) {
        col[++index] = item.value;
      }
      collection = col;
      resIndex = col.length;
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      resIndex = keys.length;
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!resIndex) {
      return callback(null, result);
    }
    iterate(result);

    function arrayIterator(result) {
      iterator(result, collection[--resIndex], done);
    }

    function arrayIteratorWithIndex(result) {
      iterator(result, collection[--resIndex], resIndex, done);
    }

    function objectIterator(result) {
      iterator(result, collection[keys[--resIndex]], done);
    }

    function objectIteratorWithKey(result) {
      key = keys[--resIndex];
      iterator(result, collection[key], key, done);
    }

    function done(err, result) {
      if (err) {
        callback(err, result);
      } else if (resIndex === 0) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(function() {
          iterate(result);
        });
      } else {
        sync = true;
        iterate(result);
      }
      sync = false;
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createTransform(arrayEach, baseEach, symbolEach) {
    return function transform(collection, accumulator, iterator, callback) {
      if (arguments.length === 3) {
        callback = iterator;
        iterator = accumulator;
        accumulator = undefined;
      }
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = accumulator !== undefined ? accumulator : [];
        arrayEach(collection, result, iterator, done);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        result = accumulator !== undefined ? accumulator : {};
        size = symbolEach(collection, result, iterator, done);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        keys = nativeKeys(collection);
        size = keys.length;
        result = accumulator !== undefined ? accumulator : {};
        baseEach(collection, result, iterator, done, keys);
      }
      if (!size) {
        callback(null, accumulator !== undefined ? accumulator : result || {});
      }

      function done(err, bool) {
        if (err) {
          callback = once(callback);
          callback(err, isArray(result) ? createArray(result) : objectClone(result));
        } else if (++completed === size) {
          callback(null, result);
        } else if (bool === false) {
          callback = once(callback);
          callback(null, isArray(result) ? createArray(result) : objectClone(result));
        }
      }
    };
  }

  /**
   * @memberof async
   * @namespace transformSeries
   * @param {Array|Object} collection
   * @param {Array|Object|Function} [accumulator]
   * @param {Function} [iterator]
   * @param {Function} [callback]
   * @example
   *
   * // array
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num)
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2, 4]
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // array with index and accumulator
   * var order = [];
   * var collection = [1, 3, 2, 4];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     result[index] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, {}, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 3, '2': 2, '3': 4 }
   *   console.log(order); // [[1, 0], [3, 1], [2, 2], [4, 3]]
   * });
   *
   * @example
   *
   * // object with accumulator
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, [], iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2, 4]
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2, d: 4 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     result[key] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transformSeries(collection, iterator, function(err, res) {
   *   console.log(res); //  { a: 1, b: 3, c: 2, d: 4 }
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'b'], [4, 'd']]
   * });
   *
   */
  function transformSeries(collection, accumulator, iterator, callback) {
    if (arguments.length === 3) {
      callback = iterator;
      iterator = accumulator;
      accumulator = undefined;
    }
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate, result;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      result = accumulator !== undefined ? accumulator : [];
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, accumulator !== undefined ? accumulator : result || {});
    }
    iterate();

    function arrayIterator() {
      iterator(result, collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(result, collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(result, item.value, completed, done);
    }

    function objectIterator() {
      iterator(result, collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(result, collection[key], key, done);
    }

    function done(err, bool) {
      if (err) {
        callback(err, result);
      } else if (++completed === size || bool === false) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace transformLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Array|Object|Function} [accumulator]
   * @param {Function} [iterator]
   * @param {Function} [callback]
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index and accumulator
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(result, num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     result[index] = key;
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(array, 2, {}, iterator, function(err, res) {
   *   console.log(res); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object with accumulator
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(result, num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     result.push(num);
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(object, 2, [], iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(result, num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     result[key] = num;
   *     done();
   *   }, num * 10);
   * };
   * async.transformLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { a: 1, b: 5, c: 3, d: 4, e: 2 };
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function transformLimit(collection, limit, accumulator, iterator, callback) {
    if (arguments.length === 4) {
      callback = iterator;
      iterator = accumulator;
      accumulator = undefined;
    }
    callback = callback || noop;
    var size, index, key, keys, iter, item, iterate, result;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      result = accumulator !== undefined ? accumulator : [];
      iterate = iterator.length === 4 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      result = accumulator !== undefined ? accumulator : {};
      iterate = iterator.length === 4 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, accumulator !== undefined ? accumulator : result || {});
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        iterator(result, collection[index], onlyOnce(done));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        iterator(result, collection[index], index, onlyOnce(done));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        started++;
        iterator(result, item.value, onlyOnce(done));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(result, item.value, started++, onlyOnce(done));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      index = started++;
      if (index < size) {
        iterator(result, collection[keys[index]], onlyOnce(done));
      }
    }

    function objectIteratorWithKey() {
      index = started++;
      if (index < size) {
        key = keys[index];
        iterator(result, collection[key], key, onlyOnce(done));
      }
    }

    function done(err, bool) {
      if (err || bool === false) {
        iterate = noop;
        callback(err || null, isArray(result) ? createArray(result) : objectClone(result));
        callback = noop;
      } else if (++completed === size) {
        iterator = noop;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @private
   * @param {function} arrayEach
   * @param {function} baseEach
   * @param {function} symbolEach
   */
  function createSortBy(arrayEach, baseEach, symbolEach) {
    return function sortBy(collection, iterator, callback) {
      callback = callback || noop;
      var size, array, criteria;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        array = Array(size);
        criteria = Array(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        array = [];
        criteria = [];
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, sortByCriteria(array, criteria));
      } else if (typeof collection === obj) {
        var keys = nativeKeys(collection);
        size = keys.length;
        array = Array(size);
        criteria = Array(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, []);
      }

      function createCallback(index, value) {
        var called = false;
        array[index] = value;
        return function done(err, criterion) {
          if (called) {
            throwError();
          }
          called = true;
          criteria[index] = criterion;
          if (err) {
            callback = once(callback);
            callback(err);
          } else if (++completed === size) {
            callback(null, sortByCriteria(array, criteria));
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace sortBySeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortBySeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function sortBySeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, value, keys, iter, item, array, criteria, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      array = collection;
      criteria = Array(size);
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      array = [];
      criteria = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      array = Array(size);
      criteria = Array(size);
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, []);
    }
    iterate();

    function arrayIterator() {
      value = collection[completed];
      iterator(value, done);
    }

    function arrayIteratorWithIndex() {
      value = collection[completed];
      iterator(value, completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done) {
        return callback(null, sortByCriteria(array, criteria));
      }
      value = item.value;
      array[completed] = value;
      iterator(value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done) {
        return callback(null, sortByCriteria(array, criteria));
      }
      value = item.value;
      array[completed] = value;
      iterator(value, completed, done);
    }

    function objectIterator() {
      value = collection[keys[completed]];
      array[completed] = value;
      iterator(value, done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      value = collection[key];
      array[completed] = value;
      iterator(value, key, done);
    }

    function done(err, criterion) {
      criteria[completed] = criterion;
      if (err) {
        callback(err);
      } else if (++completed === size) {
        iterate = throwError;
        callback(null, sortByCriteria(array, criteria));
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace sortByLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.sortByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4, 5]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function sortByLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, value, array, keys, iter, item, criteria, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      array = collection;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      array = [];
      criteria = [];
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      array = Array(size);
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    criteria = criteria || Array(size);
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        value = collection[started];
        iterator(value, createCallback(value, started++));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        value = collection[index];
        iterator(value, index, createCallback(value, index));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        value = item.value;
        array[started] = value;
        iterator(value, createCallback(value, started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, sortByCriteria(array, criteria));
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        value = item.value;
        array[started] = value;
        iterator(value, started, createCallback(value, started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, sortByCriteria(array, criteria));
      }
    }

    function objectIterator() {
      if (started < size) {
        value = collection[keys[started]];
        array[started] = value;
        iterator(value, createCallback(value, started++));
      }
    }

    function objectIteratorWithKey() {
      if (started < size) {
        key = keys[started];
        value = collection[key];
        array[started] = value;
        iterator(value, key, createCallback(value, started++));
      }
    }

    function createCallback(value, index) {
      var called = false;
      return function(err, criterion) {
        if (called) {
          throwError();
        }
        called = true;
        criteria[index] = criterion;
        if (err) {
          iterate = noop;
          callback(err);
          callback = noop;
        } else if (++completed === size) {
          callback(null, sortByCriteria(array, criteria));
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace some
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.some(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  function some(collection, iterator, callback) {
    callback = callback || noop;
    detect(collection, iterator, done);

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, !!res);
    }
  }

  /**
   * @memberof async
   * @namespace someSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(array, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someSeries(object, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  function someSeries(collection, iterator, callback) {
    callback = callback || noop;
    detectSeries(collection, iterator, done);

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, !!res);
    }
  }

  /**
   * @memberof async
   * @namespace someLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 0]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num % 2);
   *   }, num * 10);
   * };
   * async.someLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // true
   *   console.log(order); // [[1, 'a']]
   * });
   *
   */
  function someLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    detectLimit(collection, limit, iterator, done);

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      callback(null, !!res);
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createEvery(arrayEach, baseEach, symbolEach) {
    var deny = createDetect(arrayEach, baseEach, symbolEach, false);

    return function every(collection, iterator, callback) {
      callback = callback || noop;
      deny(collection, iterator, done);

      function done(err, res) {
        if (err) {
          return callback(err);
        }
        callback(null, !res);
      }
    };
  }

  /**
   * @private
   */
  function createEverySeries() {
    var denySeries = createDetectSeries(false);

    return function everySeries(collection, iterator, callback) {
      callback = callback || noop;
      denySeries(collection, iterator, done);

      function done(err, res) {
        if (err) {
          return callback(err);
        }
        callback(null, !res);
      }
    };
  }

  /**
   * @private
   */
  function createEveryLimit() {
    var denyLimit = createDetectLimit(false);

    return function everyLimit(collection, limit, iterator, callback) {
      callback = callback || noop;
      denyLimit(collection, limit, iterator, done);

      function done(err, res) {
        if (err) {
          return callback(err);
        }
        callback(null, !res);
      }
    };
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createConcat(arrayEach, baseEach, symbolEach) {
    return function concat(collection, iterator, callback) {
      callback = callback || noop;
      var size, result;
      var completed = 0;

      if (isArray(collection)) {
        size = collection.length;
        result = Array(size);
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        result = [];
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        var keys = nativeKeys(collection);
        size = keys.length;
        result = Array(size);
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, []);
      }

      function createCallback(index) {
        return function done(err, res) {
          if (index === null) {
            throwError();
          }
          if (err) {
            index = null;
            callback = once(callback);
            arrayEachSync(result, function(array, index) {
              if (array === undefined) {
                result[index] = noop;
              }
            });
            callback(err, makeConcatResult(result));
            return;
          }
          switch (arguments.length) {
            case 0:
            case 1:
              result[index] = noop;
              break;
            case 2:
              result[index] = res;
              break;
            default:
              result[index] = slice(arguments, 1);
              break;
          }
          index = null;
          if (++completed === size) {
            callback(null, makeConcatResult(result));
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace concatSeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2];
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 3, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(array, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 0], [3, 1], [2, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [1, 3, 2]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 3, c: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatSeries(object, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 2]
   *   console.log(order); // [[1, 'a'], [3, 'b'], [2, 'c']]
   * });
   *
   */
  function concatSeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, keys, iter, item, iterate;
    var sync = false;
    var result = [];
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      iterator(collection[completed], done);
    }

    function arrayIteratorWithIndex() {
      iterator(collection[completed], completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      item.done ? callback(null, result) : iterator(item.value, completed, done);
    }

    function objectIterator() {
      iterator(collection[keys[completed]], done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      iterator(collection[key], key, done);
    }

    function done(err, array) {
      if (isArray(array)) {
        nativePush.apply(result, array);
      } else if (arguments.length >= 2) {
        nativePush.apply(result, slice(arguments, 1));
      }
      if (err) {
        callback(err, result);
      } else if (++completed === size) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace concatLimit
   * @param {Array|Object} collection
   * @param {number} limit - limit >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1, 5, 3, 4, 2];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.cocnatLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [[1, 0], [3, 2], [5, 1], [2, 4], [4, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, [num]);
   *   }, num * 10);
   * };
   * async.concatLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [1, 3, 5, 2, 4]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, num);
   *   }, num * 10);
   * };
   * async.cocnatLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // [1, 3, 5, 2, 4]
   *   console.log(order); // [[1, 'a'], [3, 'c'], [5, 'b'], [2, 'e'], [4, 'd']]
   * });
   *
   */
  function concatLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, key, iter, item, iterate, result;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      result = [];
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      var keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    result = result || Array(size);
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        iterator(collection[started], createCallback(started++));
      }
    }

    function arrayIteratorWithIndex() {
      if (started < size) {
        iterator(collection[started], started, createCallback(started++));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, makeConcatResult(result));
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        iterator(item.value, started, createCallback(started++));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, makeConcatResult(result));
      }
    }

    function objectIterator() {
      if (started < size) {
        iterator(collection[keys[started]], createCallback(started++));
      }
    }

    function objectIteratorWithKey() {
      if (started < size) {
        key = keys[started];
        iterator(collection[key], key, createCallback(started++));
      }
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        if (err) {
          index = null;
          iterate = noop;
          callback = once(callback);
          arrayEachSync(result, function(array, index) {
            if (array === undefined) {
              result[index] = noop;
            }
          });
          callback(err, makeConcatResult(result));
          return;
        }
        switch (arguments.length) {
          case 0:
          case 1:
            result[index] = noop;
            break;
          case 2:
            result[index] = res;
            break;
          default:
            result[index] = slice(arguments, 1);
            break;
        }
        index = null;
        if (++completed === size) {
          iterate = throwError;
          callback(null, makeConcatResult(result));
          callback = throwError;
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   * @param {Function} symbolEach
   */
  function createGroupBy(arrayEach, baseEach, symbolEach) {
    return function groupBy(collection, iterator, callback) {
      callback = callback || noop;
      var size;
      var completed = 0;
      var result = {};

      if (isArray(collection)) {
        size = collection.length;
        arrayEach(collection, iterator, createCallback);
      } else if (!collection) {
      } else if (iteratorSymbol && collection[iteratorSymbol]) {
        size = symbolEach(collection, iterator, createCallback);
        size && size === completed && callback(null, result);
      } else if (typeof collection === obj) {
        var keys = nativeKeys(collection);
        size = keys.length;
        baseEach(collection, iterator, createCallback, keys);
      }
      if (!size) {
        callback(null, {});
      }

      function createCallback(value) {
        var called = false;
        return function done(err, key) {
          if (called) {
            throwError();
          }
          called = true;
          if (err) {
            callback = once(callback);
            callback(err, objectClone(result));
            return;
          }
          var array = result[key];
          if (!array) {
            result[key] = [value];
          } else {
            array.push(value);
          }
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace groupBySeries
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [4.2, 6.4, 6.1]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [4.2, 6.4, 6.1];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(array, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [[4.2, 0], [6.4, 1], [6.1, 2]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [4.2, 6.4, 6.1]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 4.2, b: 6.4, c: 6.1 };
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupBySeries(object, iterator, function(err, res) {
   *   console.log(res); // { '4': [4.2], '6': [6.4, 6.1] }
   *   console.log(order); // [[4.2, 'a'], [6.4, 'b'], [6.1, 'c']]
   * });
   *
   */
  function groupBySeries(collection, iterator, callback) {
    callback = onlyOnce(callback || noop);
    var size, key, value, keys, iter, item, iterate;
    var sync = false;
    var completed = 0;
    var result = {};

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      value = collection[completed];
      iterator(value, done);
    }

    function arrayIteratorWithIndex() {
      value = collection[completed];
      iterator(value, completed, done);
    }

    function symbolIterator() {
      item = iter.next();
      value = item.value;
      item.done ? callback(null, result) : iterator(value, done);
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      value = item.value;
      item.done ? callback(null, result) : iterator(value, completed, done);
    }

    function objectIterator() {
      value = collection[keys[completed]];
      iterator(value, done);
    }

    function objectIteratorWithKey() {
      key = keys[completed];
      value = collection[key];
      iterator(value, key, done);
    }

    function done(err, key) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, objectClone(result));
        return;
      }
      var array = result[key];
      if (!array) {
        result[key] = [value];
      } else {
        array.push(value);
      }
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace groupByLimit
   * @param {Array|Object} collection
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * // array
   * var order = [];
   * var array = [1.1, 5.9, 3.2, 3.9, 2.1];
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [1.1, 3.2, 5.9, 2.1, 3.9]
   * });
   *
   * @example
   *
   * // array with index
   * var order = [];
   * var array = [1.1, 5.9, 3.2, 3.9, 2.1];
   * var iterator = function(num, index, done) {
   *   setTimeout(function() {
   *     order.push([num, index]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(array, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [[1.1, 0], [3.2, 2], [5.9, 1], [2.1, 4], [3.9, 3]]
   * });
   *
   * @example
   *
   * // object
   * var order = [];
   * var object = { a: 1.1, b: 5.9, c: 3.2, d: 3.9, e: 2.1 }
   * var iterator = function(num, done) {
   *   setTimeout(function() {
   *     order.push(num);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [1.1, 3.2, 5.9, 2.1, 3.9]
   * });
   *
   * @example
   *
   * // object with key
   * var order = [];
   * var object = { a: 1.1, b: 5.9, c: 3.2, d: 3.9, e: 2.1 }
   * var iterator = function(num, key, done) {
   *   setTimeout(function() {
   *     order.push([num, key]);
   *     done(null, Math.floor(num));
   *   }, num * 10);
   * };
   * async.groupByLimit(object, 2, iterator, function(err, res) {
   *   console.log(res); // { '1': [1.1], '3': [3.2, 3.9], '5': [5.9], '2': [2.1] }
   *   console.log(order); // [[1.1, 'a'], [3.2, 'c'], [5.9, 'b'], [2.1, 'e'], [3.9, 'd']]
   * });
   *
   */
  function groupByLimit(collection, limit, iterator, callback) {
    callback = callback || noop;
    var size, index, key, value, keys, iter, item, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;
    var result = {};

    if (isArray(collection)) {
      size = collection.length;
      iterate = iterator.length === 3 ? arrayIteratorWithIndex : arrayIterator;
    } else if (!collection) {
    } else if (iteratorSymbol && collection[iteratorSymbol]) {
      size = Infinity;
      iter = collection[iteratorSymbol]();
      iterate = iterator.length === 3 ? symbolIteratorWithKey : symbolIterator;
    } else if (typeof collection === obj) {
      keys = nativeKeys(collection);
      size = keys.length;
      iterate = iterator.length === 3 ? objectIteratorWithKey : objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, result);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      if (started < size) {
        value = collection[started++];
        iterator(value, createCallback(value));
      }
    }

    function arrayIteratorWithIndex() {
      index = started++;
      if (index < size) {
        value = collection[index];
        iterator(value, index, createCallback(value));
      }
    }

    function symbolIterator() {
      item = iter.next();
      if (item.done === false) {
        started++;
        value = item.value;
        iterator(value, createCallback(value));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function symbolIteratorWithKey() {
      item = iter.next();
      if (item.done === false) {
        value = item.value;
        iterator(value, started++, createCallback(value));
      } else if (completed === started && iterator !== noop) {
        iterator = noop;
        callback(null, result);
      }
    }

    function objectIterator() {
      if (started < size) {
        value = collection[keys[started++]];
        iterator(value, createCallback(value));
      }
    }

    function objectIteratorWithKey() {
      if (started < size) {
        key = keys[started++];
        value = collection[key];
        iterator(value, key, createCallback(value));
      }
    }

    function createCallback(value) {
      var called = false;
      return function(err, key) {
        if (called) {
          throwError();
        }
        called = true;
        if (err) {
          iterate = noop;
          callback = once(callback);
          callback(err, objectClone(result));
          return;
        }
        var array = result[key];
        if (!array) {
          result[key] = [value];
        } else {
          array.push(value);
        }
        if (++completed === size) {
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @private
   * @param {Function} arrayEach
   * @param {Function} baseEach
   */
  function createParallel(arrayEach, baseEach) {
    return function parallel(tasks, callback) {
      callback = callback || noop;
      var size, keys, result;
      var completed = 0;

      if (isArray(tasks)) {
        size = tasks.length;
        result = Array(size);
        arrayEach(tasks, createCallback);
      } else if (tasks && typeof tasks === obj) {
        keys = nativeKeys(tasks);
        size = keys.length;
        result = {};
        baseEach(tasks, createCallback, keys);
      }
      if (!size) {
        callback(null, result);
      }

      function createCallback(key) {
        return function(err, res) {
          if (key === null) {
            throwError();
          }
          if (err) {
            key = null;
            callback = once(callback);
            callback(err, result);
            return;
          }
          result[key] = arguments.length <= 2 ? res : slice(arguments, 1);
          key = null;
          if (++completed === size) {
            callback(null, result);
          }
        };
      }
    };
  }

  /**
   * @memberof async
   * @namespace series
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(1);
   *      done(null, 1);
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(2);
   *      done(null, 2);
   *    }, 30);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(3);
   *      done(null, 3);
   *    }, 40);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(4);
   *      done(null, 4);
   *    }, 20);
   *  }
   * ];
   * async.series(tasks, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4];
   *   console.log(order); // [1, 2, 3, 4]
   * });
   *
   * @example
   *
   * var order = [];
   * var tasks = {
   *   'a': function(done) {
   *     setTimeout(function() {
   *       order.push(1);
   *       done(null, 1);
   *     }, 10);
   *   },
   *   'b': function(done) {
   *     setTimeout(function() {
   *       order.push(2);
   *       done(null, 2);
   *     }, 30);
   *   },
   *   'c': function(done) {
   *     setTimeout(function() {
   *       order.push(3);
   *       done(null, 3);
   *     }, 40);
   *   },
   *   'd': function(done) {
   *     setTimeout(function() {
   *       order.push(4);
   *       done(null, 4);
   *     }, 20);
   *   }
   * };
   * async.series(tasks, function(err, res) {
   *   console.log(res); // { a: 1, b: 2, c: 3, d:4 }
   *   console.log(order); // [1, 4, 2, 3]
   * });
   *
   */
  function series(tasks, callback) {
    callback = callback || noop;
    var size, key, keys, result, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(tasks)) {
      size = tasks.length;
      result = Array(size);
      iterate = arrayIterator;
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      result = {};
      iterate = objectIterator;
    } else {
      return callback(null);
    }
    if (!size) {
      return callback(null, result);
    }
    iterate();

    function arrayIterator() {
      key = completed;
      tasks[completed](done);
    }

    function objectIterator() {
      key = keys[completed];
      tasks[key](done);
    }

    function done(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err, result);
        return;
      }
      result[key] = arguments.length <= 2 ? res : slice(arguments, 1);
      if (++completed === size) {
        iterate = throwError;
        callback(null, result);
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace parallelLimit
   * @param {Array|Object} tasks - functions
   * @param {number} limit - limit >= 1
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(1);
   *      done(null, 1);
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(2);
   *      done(null, 2);
   *    }, 50);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(3);
   *      done(null, 3);
   *    }, 30);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      order.push(4);
   *      done(null, 4);
   *    }, 40);
   *  }
   * ];
   * async.parallelLimit(tasks, 2, function(err, res) {
   *   console.log(res); // [1, 2, 3, 4];
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   * @example
   *
   * var order = [];
   * var tasks = {
   *   'a': function(done) {
   *     setTimeout(function() {
   *       order.push(1);
   *       done(null, 1);
   *     }, 10);
   *   },
   *   'b': function(done) {
   *     setTimeout(function() {
   *       order.push(2);
   *       done(null, 2);
   *     }, 50);
   *   },
   *   'c': function(done) {
   *     setTimeout(function() {
   *       order.push(3);
   *       done(null, 3);
   *     }, 20);
   *   },
   *   'd': function(done) {
   *     setTimeout(function() {
   *       order.push(4);
   *       done(null, 4);
   *     }, 40);
   *   }
   * };
   * async.parallelLimit(tasks, 2, function(err, res) {
   *   console.log(res); // { a: 1, b: 2, c: 3, d:4 }
   *   console.log(order); // [1, 3, 2, 4]
   * });
   *
   */
  function parallelLimit(tasks, limit, callback) {
    callback = callback || noop;
    var size, index, key, keys, result, iterate;
    var sync = false;
    var started = 0;
    var completed = 0;

    if (isArray(tasks)) {
      size = tasks.length;
      result = Array(size);
      iterate = arrayIterator;
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      result = {};
      iterate = objectIterator;
    }
    if (!size || isNaN(limit) || limit < 1) {
      return callback(null, result);
    }
    timesSync(limit > size ? size : limit, iterate);

    function arrayIterator() {
      index = started++;
      if (index < size) {
        tasks[index](createCallback(index));
      }
    }

    function objectIterator() {
      if (started < size) {
        key = keys[started++];
        tasks[key](createCallback(key));
      }
    }

    function createCallback(key) {
      return function(err, res) {
        if (key === null) {
          throwError();
        }
        if (err) {
          key = null;
          iterate = noop;
          callback = once(callback);
          callback(err, result);
          return;
        }
        result[key] = arguments.length <= 2 ? res : slice(arguments, 1);
        key = null;
        if (++completed === size) {
          callback(null, result);
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace tryEach
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      done(new Error('error'));
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      done(null, 2);
   *    }, 10);
   *  }
   * ];
   * async.tryEach(tasks, function(err, res) {
   *   console.log(res); // 2
   * });
   *
   * @example
   *
   * var tasks = [
   *  function(done) {
   *    setTimeout(function() {
   *      done(new Error('error1'));
   *    }, 10);
   *  },
   *  function(done) {
   *    setTimeout(function() {
   *      done(new Error('error2');
   *    }, 10);
   *  }
   * ];
   * async.tryEach(tasks, function(err, res) {
   *   console.log(err); // error2
   *   console.log(res); // undefined
   * });
   *
   */
  function tryEach(tasks, callback) {
    callback = callback || noop;
    var size, keys, iterate;
    var sync = false;
    var completed = 0;

    if (isArray(tasks)) {
      size = tasks.length;
      iterate = arrayIterator;
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      iterate = objectIterator;
    }
    if (!size) {
      return callback(null);
    }
    iterate();

    function arrayIterator() {
      tasks[completed](done);
    }

    function objectIterator() {
      tasks[keys[completed]](done);
    }

    function done(err, res) {
      if (!err) {
        if (arguments.length <= 2) {
          callback(null, res);
        } else {
          callback(null, slice(arguments, 1));
        }
      } else if (++completed === size) {
        callback(err);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * check for waterfall tasks
   * @private
   * @param {Array} tasks
   * @param {Function} callback
   * @return {boolean}
   */
  function checkWaterfallTasks(tasks, callback) {
    if (!isArray(tasks)) {
      callback(new Error('First argument to waterfall must be an array of functions'));
      return false;
    }
    if (tasks.length === 0) {
      callback(null);
      return false;
    }
    return true;
  }

  /**
   * check for waterfall tasks
   * @private
   * @param {function} func
   * @param {Array|Object} args - arguments
   * @return {function} next
   */
  function waterfallIterator(func, args, next) {
    switch (args.length) {
      case 0:
      case 1:
        return func(next);
      case 2:
        return func(args[1], next);
      case 3:
        return func(args[1], args[2], next);
      case 4:
        return func(args[1], args[2], args[3], next);
      case 5:
        return func(args[1], args[2], args[3], args[4], next);
      case 6:
        return func(args[1], args[2], args[3], args[4], args[5], next);
      default:
        args = slice(args, 1);
        args.push(next);
        return func.apply(null, args);
    }
  }

  /**
   * @memberof async
   * @namespace waterfall
   * @param {Array} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *   function(next) {
   *     setTimeout(function() {
   *       order.push(1);
   *       next(null, 1);
   *     }, 10);
   *   },
   *   function(arg1, next) {
   *     setTimeout(function() {
   *       order.push(2);
   *       next(null, 1, 2);
   *     }, 30);
   *   },
   *   function(arg1, arg2, next) {
   *     setTimeout(function() {
   *       order.push(3);
   *       next(null, 3);
   *     }, 20);
   *   },
   *   function(arg1, next) {
   *     setTimeout(function() {
   *       order.push(4);
   *       next(null, 1, 2, 3, 4);
   *     }, 40);
   *   }
   * ];
   * async.waterfall(tasks, function(err, arg1, arg2, arg3, arg4) {
   *   console.log(arg1, arg2, arg3, arg4); // 1 2 3 4
   * });
   *
   */
  function waterfall(tasks, callback) {
    callback = callback || noop;
    if (!checkWaterfallTasks(tasks, callback)) {
      return;
    }
    var func, args, done, sync;
    var completed = 0;
    var size = tasks.length;
    waterfallIterator(tasks[0], [], createCallback(0));

    function iterate() {
      waterfallIterator(func, args, createCallback(func));
    }

    function createCallback(index) {
      return function next(err, res) {
        if (index === undefined) {
          callback = noop;
          throwError();
        }
        index = undefined;
        if (err) {
          done = callback;
          callback = throwError;
          done(err);
          return;
        }
        if (++completed === size) {
          done = callback;
          callback = throwError;
          if (arguments.length <= 2) {
            done(err, res);
          } else {
            done.apply(null, createArray(arguments));
          }
          return;
        }
        if (sync) {
          args = arguments;
          func = tasks[completed] || throwError;
          nextTick(iterate);
        } else {
          sync = true;
          waterfallIterator(tasks[completed] || throwError, arguments, createCallback(completed));
        }
        sync = false;
      };
    }
  }

  /**
   * `angelFall` is like `waterfall` and inject callback to last argument of next task.
   *
   * @memberof async
   * @namespace angelFall
   * @param {Array} tasks - functions
   * @param {Function} callback
   * @example
   *
   * var order = [];
   * var tasks = [
   *   function(next) {
   *     setTimeout(function() {
   *       order.push(1);
   *       next(null, 1);
   *     }, 10);
   *   },
   *   function(arg1, empty, next) {
   *     setTimeout(function() {
   *       order.push(2);
   *       next(null, 1, 2);
   *     }, 30);
   *   },
   *   function(next) {
   *     setTimeout(function() {
   *       order.push(3);
   *       next(null, 3);
   *     }, 20);
   *   },
   *   function(arg1, empty1, empty2, empty3, next) {
   *     setTimeout(function() {
   *       order.push(4);
   *       next(null, 1, 2, 3, 4);
   *     }, 40);
   *   }
   * ];
   * async.angelFall(tasks, function(err, arg1, arg2, arg3, arg4) {
   *   console.log(arg1, arg2, arg3, arg4); // 1 2 3 4
   * });
   *
   */
  function angelFall(tasks, callback) {
    callback = callback || noop;
    if (!checkWaterfallTasks(tasks, callback)) {
      return;
    }
    var completed = 0;
    var sync = false;
    var size = tasks.length;
    var func = tasks[completed];
    var args = [];
    var iterate = function() {
      switch (func.length) {
        case 0:
          try {
            next(null, func());
          } catch (e) {
            next(e);
          }
          return;
        case 1:
          return func(next);
        case 2:
          return func(args[1], next);
        case 3:
          return func(args[1], args[2], next);
        case 4:
          return func(args[1], args[2], args[3], next);
        case 5:
          return func(args[1], args[2], args[3], args[4], next);
        default:
          args = slice(args, 1);
          args[func.length - 1] = next;
          return func.apply(null, args);
      }
    };
    iterate();

    function next(err, res) {
      if (err) {
        iterate = throwError;
        callback = onlyOnce(callback);
        callback(err);
        return;
      }
      if (++completed === size) {
        iterate = throwError;
        var done = callback;
        callback = throwError;
        if (arguments.length === 2) {
          done(err, res);
        } else {
          done.apply(null, createArray(arguments));
        }
        return;
      }
      func = tasks[completed];
      args = arguments;
      if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace whilst
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function whilst(test, iterator, callback) {
    callback = callback || noop;
    var sync = false;
    if (test()) {
      iterate();
    } else {
      callback(null);
    }

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace doWhilst
   * @param {Function} iterator
   * @param {Function} test
   * @param {Function} callback
   */
  function doWhilst(iterator, test, callback) {
    callback = callback || noop;
    var sync = false;
    next();

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace until
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function until(test, iterator, callback) {
    callback = callback || noop;
    var sync = false;
    if (!test()) {
      iterate();
    } else {
      callback(null);
    }

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (!test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (!test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace doUntil
   * @param {Function} iterator
   * @param {Function} test
   * @param {Function} callback
   */
  function doUntil(iterator, test, callback) {
    callback = callback || noop;
    var sync = false;
    next();

    function iterate() {
      if (sync) {
        nextTick(next);
      } else {
        sync = true;
        iterator(done);
      }
      sync = false;
    }

    function next() {
      iterator(done);
    }

    function done(err, arg) {
      if (err) {
        return callback(err);
      }
      if (arguments.length <= 2) {
        if (!test(arg)) {
          iterate();
        } else {
          callback(null, arg);
        }
        return;
      }
      arg = slice(arguments, 1);
      if (!test.apply(null, arg)) {
        iterate();
      } else {
        callback.apply(null, [null].concat(arg));
      }
    }
  }

  /**
   * @memberof async
   * @namespace during
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function during(test, iterator, callback) {
    callback = callback || noop;
    _test();

    function _test() {
      test(iterate);
    }

    function iterate(err, truth) {
      if (err) {
        return callback(err);
      }
      if (truth) {
        iterator(done);
      } else {
        callback(null);
      }
    }

    function done(err) {
      if (err) {
        return callback(err);
      }
      _test();
    }
  }

  /**
   * @memberof async
   * @namespace doDuring
   * @param {Function} test
   * @param {Function} iterator
   * @param {Function} callback
   */
  function doDuring(iterator, test, callback) {
    callback = callback || noop;
    iterate(null, true);

    function iterate(err, truth) {
      if (err) {
        return callback(err);
      }
      if (truth) {
        iterator(done);
      } else {
        callback(null);
      }
    }

    function done(err, res) {
      if (err) {
        return callback(err);
      }
      switch (arguments.length) {
        case 0:
        case 1:
          test(iterate);
          break;
        case 2:
          test(res, iterate);
          break;
        default:
          var args = slice(arguments, 1);
          args.push(iterate);
          test.apply(null, args);
          break;
      }
    }
  }

  /**
   * @memberof async
   * @namespace forever
   */
  function forever(iterator, callback) {
    var sync = false;
    iterate();

    function iterate() {
      iterator(next);
    }

    function next(err) {
      if (err) {
        if (callback) {
          return callback(err);
        }
        throw err;
      }
      if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace compose
   */
  function compose() {
    return seq.apply(null, reverse(arguments));
  }

  /**
   * @memberof async
   * @namespace seq
   */
  function seq(/* functions... */) {
    var fns = createArray(arguments);

    return function() {
      var self = this;
      var args = createArray(arguments);
      var callback = args[args.length - 1];
      if (typeof callback === func) {
        args.pop();
      } else {
        callback = noop;
      }
      reduce(fns, args, iterator, done);

      function iterator(newargs, fn, callback) {
        var func = function(err) {
          var nextargs = slice(arguments, 1);
          callback(err, nextargs);
        };
        newargs.push(func);
        fn.apply(self, newargs);
      }

      function done(err, res) {
        res = isArray(res) ? res : [res];
        res.unshift(err);
        callback.apply(self, res);
      }
    };
  }

  function createApplyEach(func) {
    return function applyEach(fns /* arguments */) {
      var go = function() {
        var self = this;
        var args = createArray(arguments);
        var callback = args.pop() || noop;
        return func(fns, iterator, callback);

        function iterator(fn, done) {
          fn.apply(self, args.concat([done]));
        }
      };
      if (arguments.length > 1) {
        var args = slice(arguments, 1);
        return go.apply(this, args);
      } else {
        return go;
      }
    };
  }

  /**
   * @see https://github.com/caolan/async/blob/master/lib/internal/DoublyLinkedList.js
   */
  function DLL() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  DLL.prototype._removeLink = function(node) {
    var prev = node.prev;
    var next = node.next;
    if (prev) {
      prev.next = next;
    } else {
      this.head = next;
    }
    if (next) {
      next.prev = prev;
    } else {
      this.tail = prev;
    }
    node.prev = null;
    node.next = null;
    this.length--;
    return node;
  };

  DLL.prototype.empty = DLL;

  DLL.prototype._setInitial = function(node) {
    this.length = 1;
    this.head = this.tail = node;
  };

  DLL.prototype.insertBefore = function(node, newNode) {
    newNode.prev = node.prev;
    newNode.next = node;
    if (node.prev) {
      node.prev.next = newNode;
    } else {
      this.head = newNode;
    }
    node.prev = newNode;
    this.length++;
  };

  DLL.prototype.unshift = function(node) {
    if (this.head) {
      this.insertBefore(this.head, node);
    } else {
      this._setInitial(node);
    }
  };

  DLL.prototype.push = function(node) {
    var tail = this.tail;
    if (tail) {
      node.prev = tail;
      node.next = tail.next;
      this.tail = node;
      tail.next = node;
      this.length++;
    } else {
      this._setInitial(node);
    }
  };

  DLL.prototype.shift = function() {
    return this.head && this._removeLink(this.head);
  };

  DLL.prototype.splice = function(end) {
    var task;
    var tasks = [];
    while (end-- && (task = this.shift())) {
      tasks.push(task);
    }
    return tasks;
  };

  DLL.prototype.remove = function(test) {
    var node = this.head;
    while (node) {
      if (test(node)) {
        this._removeLink(node);
      }
      node = node.next;
    }
    return this;
  };

  /**
   * @private
   */
  function baseQueue(isQueue, worker, concurrency, payload) {
    if (concurrency === undefined) {
      concurrency = 1;
    } else if (isNaN(concurrency) || concurrency < 1) {
      throw new Error('Concurrency must not be zero');
    }

    var workers = 0;
    var workersList = [];
    var _callback, _unshift;

    var q = {
      _tasks: new DLL(),
      concurrency: concurrency,
      payload: payload,
      saturated: noop,
      unsaturated: noop,
      buffer: concurrency / 4,
      empty: noop,
      drain: noop,
      error: noop,
      started: false,
      paused: false,
      push: push,
      kill: kill,
      unshift: unshift,
      remove: remove,
      process: isQueue ? runQueue : runCargo,
      length: getLength,
      running: running,
      workersList: getWorkersList,
      idle: idle,
      pause: pause,
      resume: resume,
      _worker: worker
    };
    return q;

    function push(tasks, callback) {
      _insert(tasks, callback);
    }

    function unshift(tasks, callback) {
      _insert(tasks, callback, true);
    }

    function _exec(task) {
      var item = {
        data: task,
        callback: _callback
      };
      if (_unshift) {
        q._tasks.unshift(item);
      } else {
        q._tasks.push(item);
      }
      nextTick(q.process);
    }

    function _insert(tasks, callback, unshift) {
      if (callback == null) {
        callback = noop;
      } else if (typeof callback !== 'function') {
        throw new Error('task callback must be a function');
      }
      q.started = true;
      var _tasks = isArray(tasks) ? tasks : [tasks];

      if (tasks === undefined || !_tasks.length) {
        if (q.idle()) {
          nextTick(q.drain);
        }
        return;
      }

      _unshift = unshift;
      _callback = callback;
      arrayEachSync(_tasks, _exec);
      // Avoid leaking the callback
      _callback = undefined;
    }

    function kill() {
      q.drain = noop;
      q._tasks.empty();
    }

    function _next(q, tasks) {
      var called = false;
      return function done(err, res) {
        if (called) {
          throwError();
        }
        called = true;

        workers--;
        var task;
        var index = -1;
        var size = workersList.length;
        var taskIndex = -1;
        var taskSize = tasks.length;
        var useApply = arguments.length > 2;
        var args = useApply && createArray(arguments);
        while (++taskIndex < taskSize) {
          task = tasks[taskIndex];
          while (++index < size) {
            if (workersList[index] === task) {
              if (index === 0) {
                workersList.shift();
              } else {
                workersList.splice(index, 1);
              }
              index = size;
              size--;
            }
          }
          index = -1;
          if (useApply) {
            task.callback.apply(task, args);
          } else {
            task.callback(err, res);
          }
          if (err) {
            q.error(err, task.data);
          }
        }

        if (workers <= q.concurrency - q.buffer) {
          q.unsaturated();
        }

        if (q._tasks.length + workers === 0) {
          q.drain();
        }
        q.process();
      };
    }

    function runQueue() {
      while (!q.paused && workers < q.concurrency && q._tasks.length) {
        var task = q._tasks.shift();
        workers++;
        workersList.push(task);
        if (q._tasks.length === 0) {
          q.empty();
        }
        if (workers === q.concurrency) {
          q.saturated();
        }
        var done = _next(q, [task]);
        worker(task.data, done);
      }
    }

    function runCargo() {
      while (!q.paused && workers < q.concurrency && q._tasks.length) {
        var tasks = q._tasks.splice(q.payload || q._tasks.length);
        var index = -1;
        var size = tasks.length;
        var data = Array(size);
        while (++index < size) {
          data[index] = tasks[index].data;
        }
        workers++;
        nativePush.apply(workersList, tasks);
        if (q._tasks.length === 0) {
          q.empty();
        }
        if (workers === q.concurrency) {
          q.saturated();
        }
        var done = _next(q, tasks);
        worker(data, done);
      }
    }

    function getLength() {
      return q._tasks.length;
    }

    function running() {
      return workers;
    }

    function getWorkersList() {
      return workersList;
    }

    function idle() {
      return q.length() + workers === 0;
    }

    function pause() {
      q.paused = true;
    }

    function _resume() {
      nextTick(q.process);
    }

    function resume() {
      if (q.paused === false) {
        return;
      }
      q.paused = false;
      var count = q.concurrency < q._tasks.length ? q.concurrency : q._tasks.length;
      timesSync(count, _resume);
    }

    /**
     * @param {Function} test
     */
    function remove(test) {
      q._tasks.remove(test);
    }
  }

  /**
   * @memberof async
   * @namespace queue
   */
  function queue(worker, concurrency) {
    return baseQueue(true, worker, concurrency);
  }

  /**
   * @memberof async
   * @namespace priorityQueue
   */
  function priorityQueue(worker, concurrency) {
    var q = baseQueue(true, worker, concurrency);
    q.push = push;
    delete q.unshift;
    return q;

    function push(tasks, priority, callback) {
      q.started = true;
      priority = priority || 0;
      var _tasks = isArray(tasks) ? tasks : [tasks];
      var taskSize = _tasks.length;

      if (tasks === undefined || taskSize === 0) {
        if (q.idle()) {
          nextTick(q.drain);
        }
        return;
      }

      callback = typeof callback === func ? callback : noop;
      var nextNode = q._tasks.head;
      while (nextNode && priority >= nextNode.priority) {
        nextNode = nextNode.next;
      }
      while (taskSize--) {
        var item = {
          data: _tasks[taskSize],
          priority: priority,
          callback: callback
        };
        if (nextNode) {
          q._tasks.insertBefore(nextNode, item);
        } else {
          q._tasks.push(item);
        }
        nextTick(q.process);
      }
    }
  }

  /**
   * @memberof async
   * @namespace cargo
   */
  function cargo(worker, payload) {
    return baseQueue(false, worker, 1, payload);
  }

  /**
   * @memberof async
   * @namespace auto
   * @param {Object} tasks
   * @param {number} [concurrency]
   * @param {Function} [callback]
   */
  function auto(tasks, concurrency, callback) {
    if (typeof concurrency === func) {
      callback = concurrency;
      concurrency = null;
    }
    var keys = nativeKeys(tasks);
    var rest = keys.length;
    var results = {};
    if (rest === 0) {
      return callback(null, results);
    }
    var runningTasks = 0;
    var readyTasks = new DLL();
    var listeners = Object.create(null);
    callback = onlyOnce(callback || noop);
    concurrency = concurrency || rest;

    baseEachSync(tasks, iterator, keys);
    proceedQueue();

    function iterator(task, key) {
      // no dependencies
      var _task, _taskSize;
      if (!isArray(task)) {
        _task = task;
        _taskSize = 0;
        readyTasks.push([_task, _taskSize, done]);
        return;
      }
      var dependencySize = task.length - 1;
      _task = task[dependencySize];
      _taskSize = dependencySize;
      if (dependencySize === 0) {
        readyTasks.push([_task, _taskSize, done]);
        return;
      }
      // dependencies
      var index = -1;
      while (++index < dependencySize) {
        var dependencyName = task[index];
        if (notInclude(keys, dependencyName)) {
          var msg =
            'async.auto task `' +
            key +
            '` has non-existent dependency `' +
            dependencyName +
            '` in ' +
            task.join(', ');
          throw new Error(msg);
        }
        var taskListeners = listeners[dependencyName];
        if (!taskListeners) {
          taskListeners = listeners[dependencyName] = [];
        }
        taskListeners.push(taskListener);
      }

      function done(err, arg) {
        if (key === null) {
          throwError();
        }
        arg = arguments.length <= 2 ? arg : slice(arguments, 1);
        if (err) {
          rest = 0;
          runningTasks = 0;
          readyTasks.length = 0;
          var safeResults = objectClone(results);
          safeResults[key] = arg;
          key = null;
          var _callback = callback;
          callback = noop;
          _callback(err, safeResults);
          return;
        }
        runningTasks--;
        rest--;
        results[key] = arg;
        taskComplete(key);
        key = null;
      }

      function taskListener() {
        if (--dependencySize === 0) {
          readyTasks.push([_task, _taskSize, done]);
        }
      }
    }

    function proceedQueue() {
      if (readyTasks.length === 0 && runningTasks === 0) {
        if (rest !== 0) {
          throw new Error('async.auto task has cyclic dependencies');
        }
        return callback(null, results);
      }
      while (readyTasks.length && runningTasks < concurrency && callback !== noop) {
        runningTasks++;
        var array = readyTasks.shift();
        if (array[1] === 0) {
          array[0](array[2]);
        } else {
          array[0](results, array[2]);
        }
      }
    }

    function taskComplete(key) {
      var taskListeners = listeners[key] || [];
      arrayEachSync(taskListeners, function(task) {
        task();
      });
      proceedQueue();
    }
  }

  var FN_ARGS = /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m;
  var FN_ARG_SPLIT = /,/;
  var FN_ARG = /(=.+)?(\s*)$/;
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;

  /**
   * parse function arguments for `autoInject`
   *
   * @private
   */
  function parseParams(func) {
    func = func.toString().replace(STRIP_COMMENTS, '');
    func = func.match(FN_ARGS)[2].replace(' ', '');
    func = func ? func.split(FN_ARG_SPLIT) : [];
    func = func.map(function(arg) {
      return arg.replace(FN_ARG, '').trim();
    });
    return func;
  }

  /**
   * @memberof async
   * @namespace autoInject
   * @param {Object} tasks
   * @param {number} [concurrency]
   * @param {Function} [callback]
   */
  function autoInject(tasks, concurrency, callback) {
    var newTasks = {};
    baseEachSync(tasks, iterator, nativeKeys(tasks));
    auto(newTasks, concurrency, callback);

    function iterator(task, key) {
      var params;
      var taskLength = task.length;

      if (isArray(task)) {
        if (taskLength === 0) {
          throw new Error('autoInject task functions require explicit parameters.');
        }
        params = createArray(task);
        taskLength = params.length - 1;
        task = params[taskLength];
        if (taskLength === 0) {
          newTasks[key] = task;
          return;
        }
      } else if (taskLength === 1) {
        newTasks[key] = task;
        return;
      } else {
        params = parseParams(task);
        if (taskLength === 0 && params.length === 0) {
          throw new Error('autoInject task functions require explicit parameters.');
        }
        taskLength = params.length - 1;
      }
      params[taskLength] = newTask;
      newTasks[key] = params;

      function newTask(results, done) {
        switch (taskLength) {
          case 1:
            task(results[params[0]], done);
            break;
          case 2:
            task(results[params[0]], results[params[1]], done);
            break;
          case 3:
            task(results[params[0]], results[params[1]], results[params[2]], done);
            break;
          default:
            var i = -1;
            while (++i < taskLength) {
              params[i] = results[params[i]];
            }
            params[i] = done;
            task.apply(null, params);
            break;
        }
      }
    }
  }

  /**
   * @memberof async
   * @namespace retry
   * @param {integer|Object|Function} opts
   * @param {Function} [task]
   * @param {Function} [callback]
   */
  function retry(opts, task, callback) {
    var times, intervalFunc, errorFilter;
    var count = 0;
    if (arguments.length < 3 && typeof opts === func) {
      callback = task || noop;
      task = opts;
      opts = null;
      times = DEFAULT_TIMES;
    } else {
      callback = callback || noop;
      switch (typeof opts) {
        case 'object':
          if (typeof opts.errorFilter === func) {
            errorFilter = opts.errorFilter;
          }
          var interval = opts.interval;
          switch (typeof interval) {
            case func:
              intervalFunc = interval;
              break;
            case 'string':
            case 'number':
              interval = +interval;
              intervalFunc = interval
                ? function() {
                    return interval;
                  }
                : function() {
                    return DEFAULT_INTERVAL;
                  };
              break;
          }
          times = +opts.times || DEFAULT_TIMES;
          break;
        case 'number':
          times = opts || DEFAULT_TIMES;
          break;
        case 'string':
          times = +opts || DEFAULT_TIMES;
          break;
        default:
          throw new Error('Invalid arguments for async.retry');
      }
    }
    if (typeof task !== 'function') {
      throw new Error('Invalid arguments for async.retry');
    }

    if (intervalFunc) {
      task(intervalCallback);
    } else {
      task(simpleCallback);
    }

    function simpleIterator() {
      task(simpleCallback);
    }

    function simpleCallback(err, res) {
      if (++count === times || !err || (errorFilter && !errorFilter(err))) {
        if (arguments.length <= 2) {
          return callback(err, res);
        }
        var args = createArray(arguments);
        return callback.apply(null, args);
      }
      simpleIterator();
    }

    function intervalIterator() {
      task(intervalCallback);
    }

    function intervalCallback(err, res) {
      if (++count === times || !err || (errorFilter && !errorFilter(err))) {
        if (arguments.length <= 2) {
          return callback(err, res);
        }
        var args = createArray(arguments);
        return callback.apply(null, args);
      }
      setTimeout(intervalIterator, intervalFunc(count));
    }
  }

  function retryable(opts, task) {
    if (!task) {
      task = opts;
      opts = null;
    }
    return done;

    function done() {
      var taskFn;
      var args = createArray(arguments);
      var lastIndex = args.length - 1;
      var callback = args[lastIndex];
      switch (task.length) {
        case 1:
          taskFn = task1;
          break;
        case 2:
          taskFn = task2;
          break;
        case 3:
          taskFn = task3;
          break;
        default:
          taskFn = task4;
      }
      if (opts) {
        retry(opts, taskFn, callback);
      } else {
        retry(taskFn, callback);
      }

      function task1(done) {
        task(done);
      }

      function task2(done) {
        task(args[0], done);
      }

      function task3(done) {
        task(args[0], args[1], done);
      }

      function task4(callback) {
        args[lastIndex] = callback;
        task.apply(null, args);
      }
    }
  }

  /**
   * @memberof async
   * @namespace iterator
   */
  function iterator(tasks) {
    var size = 0;
    var keys = [];
    if (isArray(tasks)) {
      size = tasks.length;
    } else {
      keys = nativeKeys(tasks);
      size = keys.length;
    }
    return makeCallback(0);

    function makeCallback(index) {
      var fn = function() {
        if (size) {
          var key = keys[index] || index;
          tasks[key].apply(null, createArray(arguments));
        }
        return fn.next();
      };
      fn.next = function() {
        return index < size - 1 ? makeCallback(index + 1) : null;
      };
      return fn;
    }
  }

  /**
   * @memberof async
   * @namespace apply
   */
  function apply(func) {
    switch (arguments.length) {
      case 0:
      case 1:
        return func;
      case 2:
        return func.bind(null, arguments[1]);
      case 3:
        return func.bind(null, arguments[1], arguments[2]);
      case 4:
        return func.bind(null, arguments[1], arguments[2], arguments[3]);
      case 5:
        return func.bind(null, arguments[1], arguments[2], arguments[3], arguments[4]);
      default:
        var size = arguments.length;
        var index = 0;
        var args = Array(size);
        args[index] = null;
        while (++index < size) {
          args[index] = arguments[index];
        }
        return func.bind.apply(func, args);
    }
  }

  /**
   * @memberof async
   * @namespace timeout
   * @param {Function} func
   * @param {number} millisec
   * @param {*} info
   */
  function timeout(func, millisec, info) {
    var callback, timer;
    return wrappedFunc;

    function wrappedFunc() {
      timer = setTimeout(timeoutCallback, millisec);
      var args = createArray(arguments);
      var lastIndex = args.length - 1;
      callback = args[lastIndex];
      args[lastIndex] = injectedCallback;
      simpleApply(func, args);
    }

    function timeoutCallback() {
      var name = func.name || 'anonymous';
      var err = new Error('Callback function "' + name + '" timed out.');
      err.code = 'ETIMEDOUT';
      if (info) {
        err.info = info;
      }
      timer = null;
      callback(err);
    }

    function injectedCallback() {
      if (timer !== null) {
        simpleApply(callback, createArray(arguments));
        clearTimeout(timer);
      }
    }

    function simpleApply(func, args) {
      switch (args.length) {
        case 0:
          func();
          break;
        case 1:
          func(args[0]);
          break;
        case 2:
          func(args[0], args[1]);
          break;
        default:
          func.apply(null, args);
          break;
      }
    }
  }

  /**
   * @memberof async
   * @namespace times
   * @param {number} n - n >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * var iterator = function(n, done) {
   *   done(null, n);
   * };
   * async.times(4, iterator, function(err, res) {
   *   console.log(res); // [0, 1, 2, 3];
   * });
   *
   */
  function times(n, iterator, callback) {
    callback = callback || noop;
    n = +n;
    if (isNaN(n) || n < 1) {
      return callback(null, []);
    }
    var result = Array(n);
    timesSync(n, iterate);

    function iterate(num) {
      iterator(num, createCallback(num));
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        result[index] = res;
        index = null;
        if (err) {
          callback(err);
          callback = noop;
        } else if (--n === 0) {
          callback(null, result);
        }
      };
    }
  }

  /**
   * @memberof async
   * @namespace timesSeries
   * @param {number} n - n >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * var iterator = function(n, done) {
   *   done(null, n);
   * };
   * async.timesSeries(4, iterator, function(err, res) {
   *   console.log(res); // [0, 1, 2, 3];
   * });
   *
   */
  function timesSeries(n, iterator, callback) {
    callback = callback || noop;
    n = +n;
    if (isNaN(n) || n < 1) {
      return callback(null, []);
    }
    var result = Array(n);
    var sync = false;
    var completed = 0;
    iterate();

    function iterate() {
      iterator(completed, done);
    }

    function done(err, res) {
      result[completed] = res;
      if (err) {
        callback(err);
        callback = throwError;
      } else if (++completed >= n) {
        callback(null, result);
        callback = throwError;
      } else if (sync) {
        nextTick(iterate);
      } else {
        sync = true;
        iterate();
      }
      sync = false;
    }
  }

  /**
   * @memberof async
   * @namespace timesLimit
   * @param {number} n - n >= 1
   * @param {number} limit - n >= 1
   * @param {Function} iterator
   * @param {Function} callback
   * @example
   *
   * var iterator = function(n, done) {
   *   done(null, n);
   * };
   * async.timesLimit(4, 2, iterator, function(err, res) {
   *   console.log(res); // [0, 1, 2, 3];
   * });
   *
   */
  function timesLimit(n, limit, iterator, callback) {
    callback = callback || noop;
    n = +n;
    if (isNaN(n) || n < 1 || isNaN(limit) || limit < 1) {
      return callback(null, []);
    }
    var result = Array(n);
    var sync = false;
    var started = 0;
    var completed = 0;
    timesSync(limit > n ? n : limit, iterate);

    function iterate() {
      var index = started++;
      if (index < n) {
        iterator(index, createCallback(index));
      }
    }

    function createCallback(index) {
      return function(err, res) {
        if (index === null) {
          throwError();
        }
        result[index] = res;
        index = null;
        if (err) {
          callback(err);
          callback = noop;
        } else if (++completed >= n) {
          callback(null, result);
          callback = throwError;
        } else if (sync) {
          nextTick(iterate);
        } else {
          sync = true;
          iterate();
        }
        sync = false;
      };
    }
  }

  /**
   * @memberof async
   * @namespace race
   * @param {Array|Object} tasks - functions
   * @param {Function} callback
   * @example
   *
   * // array
   * var called = 0;
   * var tasks = [
   *   function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '1');
   *     }, 30);
   *   },
   *   function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '2');
   *     }, 20);
   *   },
   *   function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '3');
   *     }, 10);
   *   }
   * ];
   * async.race(tasks, function(err, res) {
   *   console.log(res); // '3'
   *   console.log(called); // 1
   *   setTimeout(function() {
   *     console.log(called); // 3
   *   }, 50);
   * });
   *
   * @example
   *
   * // object
   * var called = 0;
   * var tasks = {
   *   'test1': function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '1');
   *     }, 30);
   *   },
   *   'test2': function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '2');
   *     }, 20);
   *   },
   *   'test3': function(done) {
   *     setTimeout(function() {
   *       called++;
   *       done(null, '3');
   *     }, 10);
   *   }
   * };
   * async.race(tasks, function(err, res) {
   *   console.log(res); // '3'
   *   console.log(called); // 1
   *   setTimeout(function() {
   *     console.log(called); // 3
   *     done();
   *   }, 50);
   * });
   *
   */
  function race(tasks, callback) {
    callback = once(callback || noop);
    var size, keys;
    var index = -1;
    if (isArray(tasks)) {
      size = tasks.length;
      while (++index < size) {
        tasks[index](callback);
      }
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      size = keys.length;
      while (++index < size) {
        tasks[keys[index]](callback);
      }
    } else {
      return callback(new TypeError('First argument to race must be a collection of functions'));
    }
    if (!size) {
      callback(null);
    }
  }

  /**
   * @memberof async
   * @namespace memoize
   */
  function memoize(fn, hasher) {
    hasher =
      hasher ||
      function(hash) {
        return hash;
      };

    var memo = {};
    var queues = {};
    var memoized = function() {
      var args = createArray(arguments);
      var callback = args.pop();
      var key = hasher.apply(null, args);
      if (has(memo, key)) {
        nextTick(function() {
          callback.apply(null, memo[key]);
        });
        return;
      }
      if (has(queues, key)) {
        return queues[key].push(callback);
      }

      queues[key] = [callback];
      args.push(done);
      fn.apply(null, args);

      function done(err) {
        var args = createArray(arguments);
        if (!err) {
          memo[key] = args;
        }
        var q = queues[key];
        delete queues[key];

        var i = -1;
        var size = q.length;
        while (++i < size) {
          q[i].apply(null, args);
        }
      }
    };
    memoized.memo = memo;
    memoized.unmemoized = fn;
    return memoized;
  }

  /**
   * @memberof async
   * @namespace unmemoize
   */
  function unmemoize(fn) {
    return function() {
      return (fn.unmemoized || fn).apply(null, arguments);
    };
  }

  /**
   * @memberof async
   * @namespace ensureAsync
   */
  function ensureAsync(fn) {
    return function(/* ...args, callback */) {
      var args = createArray(arguments);
      var lastIndex = args.length - 1;
      var callback = args[lastIndex];
      var sync = true;
      args[lastIndex] = done;
      fn.apply(this, args);
      sync = false;

      function done() {
        var innerArgs = createArray(arguments);
        if (sync) {
          nextTick(function() {
            callback.apply(null, innerArgs);
          });
        } else {
          callback.apply(null, innerArgs);
        }
      }
    };
  }

  /**
   * @memberof async
   * @namespace constant
   */
  function constant(/* values... */) {
    var args = [null].concat(createArray(arguments));
    return function(callback) {
      callback = arguments[arguments.length - 1];
      callback.apply(this, args);
    };
  }

  function asyncify(fn) {
    return function(/* args..., callback */) {
      var args = createArray(arguments);
      var callback = args.pop();
      var result;
      try {
        result = fn.apply(this, args);
      } catch (e) {
        return callback(e);
      }
      if (result && typeof result.then === func) {
        result.then(
          function(value) {
            invokeCallback(callback, null, value);
          },
          function(err) {
            invokeCallback(callback, err && err.message ? err : new Error(err));
          }
        );
      } else {
        callback(null, result);
      }
    };
  }

  function invokeCallback(callback, err, value) {
    try {
      callback(err, value);
    } catch (e) {
      nextTick(rethrow, e);
    }
  }

  function rethrow(error) {
    throw error;
  }

  /**
   * @memberof async
   * @namespace reflect
   * @param {Function} func
   * @return {Function}
   */
  function reflect(func) {
    return function(/* args..., callback */) {
      var callback;
      switch (arguments.length) {
        case 1:
          callback = arguments[0];
          return func(done);
        case 2:
          callback = arguments[1];
          return func(arguments[0], done);
        default:
          var args = createArray(arguments);
          var lastIndex = args.length - 1;
          callback = args[lastIndex];
          args[lastIndex] = done;
          func.apply(this, args);
      }

      function done(err, res) {
        if (err) {
          return callback(null, {
            error: err
          });
        }
        if (arguments.length > 2) {
          res = slice(arguments, 1);
        }
        callback(null, {
          value: res
        });
      }
    };
  }

  /**
   * @memberof async
   * @namespace reflectAll
   * @param {Array[]|Object} tasks
   * @return {Function}
   */
  function reflectAll(tasks) {
    var newTasks, keys;
    if (isArray(tasks)) {
      newTasks = Array(tasks.length);
      arrayEachSync(tasks, iterate);
    } else if (tasks && typeof tasks === obj) {
      keys = nativeKeys(tasks);
      newTasks = {};
      baseEachSync(tasks, iterate, keys);
    }
    return newTasks;

    function iterate(func, key) {
      newTasks[key] = reflect(func);
    }
  }

  /**
   * @memberof async
   * @namespace createLogger
   */
  function createLogger(name) {
    return function(fn) {
      var args = slice(arguments, 1);
      args.push(done);
      fn.apply(null, args);
    };

    function done(err) {
      if (typeof console === obj) {
        if (err) {
          if (console.error) {
            console.error(err);
          }
          return;
        }
        if (console[name]) {
          var args = slice(arguments, 1);
          arrayEachSync(args, function(arg) {
            console[name](arg);
          });
        }
      }
    }
  }

  /**
   * @memberof async
   * @namespace safe
   */
  function safe() {
    createImmediate();
    return exports;
  }

  /**
   * @memberof async
   * @namespace fast
   */
  function fast() {
    createImmediate(false);
    return exports;
  }
});


/***/ }),

/***/ 605:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


module.exports = __nccwpck_require__(117).queue;


/***/ }),

/***/ 301:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = readBuffer;

function readBuffer(pipe, length, callback) {
  if (length === 0) {
    callback(null, Buffer.alloc(0));
    return;
  }

  let remainingLength = length;
  const buffers = [];

  const readChunk = () => {
    const onChunk = arg => {
      let chunk = arg;
      let overflow;

      if (chunk.length > remainingLength) {
        overflow = chunk.slice(remainingLength);
        chunk = chunk.slice(0, remainingLength);
        remainingLength = 0;
      } else {
        remainingLength -= chunk.length;
      }

      buffers.push(chunk);

      if (remainingLength === 0) {
        pipe.removeListener('data', onChunk);
        pipe.pause();

        if (overflow) {
          pipe.unshift(overflow);
        }

        callback(null, Buffer.concat(buffers, length));
      }
    };

    pipe.on('data', onChunk);
    pipe.resume();
  };

  readChunk();
}

/***/ }),

/***/ 378:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.replacer = replacer;
exports.reviver = reviver;

function replacer(_key, value) {
  if (value instanceof RegExp) {
    return {
      __serialized_type: 'RegExp',
      source: value.source,
      flags: value.flags
    };
  }

  return value;
}

function reviver(_key, value) {
  if (typeof value === 'object' && value !== null) {
    // eslint-disable-next-line no-underscore-dangle
    if (value.__serialized_type === 'RegExp') {
      return new RegExp(value.source, value.flags);
    }
  }

  return value;
}

/***/ }),

/***/ 339:
/***/ ((module) => {

"use strict";
module.exports = require("../../compiled/schema-utils");

/***/ }),

/***/ 747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 282:
/***/ ((module) => {

"use strict";
module.exports = require("module");

/***/ }),

/***/ 191:
/***/ ((module) => {

"use strict";
module.exports = require("querystring");

/***/ }),

/***/ 835:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";


var _fs = _interopRequireDefault(__nccwpck_require__(747));

var _module = _interopRequireDefault(__nccwpck_require__(282));

var _querystring = _interopRequireDefault(__nccwpck_require__(191));

var _loaderRunner = _interopRequireDefault(__nccwpck_require__(791));

var _queue = _interopRequireDefault(__nccwpck_require__(605));

var _jsonParseBetterErrors = _interopRequireDefault(__nccwpck_require__(586));

var _schemaUtils = __nccwpck_require__(339);

var _readBuffer = _interopRequireDefault(__nccwpck_require__(301));

var _serializer = __nccwpck_require__(378);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-console */
const writePipe = _fs.default.createWriteStream(null, {
  fd: 3
});

const readPipe = _fs.default.createReadStream(null, {
  fd: 4
});

writePipe.on('finish', onTerminateWrite);
readPipe.on('end', onTerminateRead);
writePipe.on('close', onTerminateWrite);
readPipe.on('close', onTerminateRead);
readPipe.on('error', onError);
writePipe.on('error', onError);
const PARALLEL_JOBS = +process.argv[2] || 20;
let terminated = false;
let nextQuestionId = 0;
const callbackMap = Object.create(null);

function onError(error) {
  console.error(error);
}

function onTerminateRead() {
  terminateRead();
}

function onTerminateWrite() {
  terminateWrite();
}

function writePipeWrite(...args) {
  if (!terminated) {
    writePipe.write(...args);
  }
}

function writePipeCork() {
  if (!terminated) {
    writePipe.cork();
  }
}

function writePipeUncork() {
  if (!terminated) {
    writePipe.uncork();
  }
}

function terminateRead() {
  terminated = true;
  readPipe.removeAllListeners();
}

function terminateWrite() {
  terminated = true;
  writePipe.removeAllListeners();
}

function terminate() {
  terminateRead();
  terminateWrite();
}

function toErrorObj(err) {
  return {
    message: err.message,
    details: err.details,
    stack: err.stack,
    hideStack: err.hideStack
  };
}

function toNativeError(obj) {
  if (!obj) return null;
  const err = new Error(obj.message);
  err.details = obj.details;
  err.missing = obj.missing;
  return err;
}

function writeJson(data) {
  writePipeCork();
  process.nextTick(() => {
    writePipeUncork();
  });
  const lengthBuffer = Buffer.alloc(4);
  const messageBuffer = Buffer.from(JSON.stringify(data, _serializer.replacer), 'utf-8');
  lengthBuffer.writeInt32BE(messageBuffer.length, 0);
  writePipeWrite(lengthBuffer);
  writePipeWrite(messageBuffer);
}

const queue = (0, _queue.default)(({
  id,
  data
}, taskCallback) => {
  try {
    const resolveWithOptions = (context, request, callback, options) => {
      callbackMap[nextQuestionId] = callback;
      writeJson({
        type: 'resolve',
        id,
        questionId: nextQuestionId,
        context,
        request,
        options
      });
      nextQuestionId += 1;
    };

    const buildDependencies = [];

    _loaderRunner.default.runLoaders({
      loaders: data.loaders,
      resource: data.resource,
      readResource: _fs.default.readFile.bind(_fs.default),
      context: {
        version: 2,
        fs: _fs.default,
        loadModule: (request, callback) => {
          callbackMap[nextQuestionId] = (error, result) => callback(error, ...result);

          writeJson({
            type: 'loadModule',
            id,
            questionId: nextQuestionId,
            request
          });
          nextQuestionId += 1;
        },
        resolve: (context, request, callback) => {
          resolveWithOptions(context, request, callback);
        },
        // eslint-disable-next-line consistent-return
        getResolve: options => (context, request, callback) => {
          if (callback) {
            resolveWithOptions(context, request, callback, options);
          } else {
            return new Promise((resolve, reject) => {
              resolveWithOptions(context, request, (err, result) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
              }, options);
            });
          }
        },

        // Not an arrow function because it uses this
        getOptions(schema) {
          // loaders, loaderIndex will be defined by runLoaders
          const loader = this.loaders[this.loaderIndex]; // Verbatim copy from
          // https://github.com/webpack/webpack/blob/v5.31.2/lib/NormalModule.js#L471-L508
          // except eslint/prettier differences
          // -- unfortunate result of getOptions being synchronous functions.

          let {
            options
          } = loader;

          if (typeof options === 'string') {
            if (options.substr(0, 1) === '{' && options.substr(-1) === '}') {
              try {
                options = (0, _jsonParseBetterErrors.default)(options);
              } catch (e) {
                throw new Error(`Cannot parse string options: ${e.message}`);
              }
            } else {
              options = _querystring.default.parse(options, '&', '=', {
                maxKeys: 0
              });
            }
          } // eslint-disable-next-line no-undefined


          if (options === null || options === undefined) {
            options = {};
          }

          if (schema) {
            let name = 'Loader';
            let baseDataPath = 'options';
            let match; // eslint-disable-next-line no-cond-assign

            if (schema.title && (match = /^(.+) (.+)$/.exec(schema.title))) {
              [, name, baseDataPath] = match;
            }

            (0, _schemaUtils.validate)(schema, options, {
              name,
              baseDataPath
            });
          }

          return options;
        },

        emitWarning: warning => {
          writeJson({
            type: 'emitWarning',
            id,
            data: toErrorObj(warning)
          });
        },
        emitError: error => {
          writeJson({
            type: 'emitError',
            id,
            data: toErrorObj(error)
          });
        },
        exec: (code, filename) => {
          const module = new _module.default(filename, void 0);
          module.paths = _module.default._nodeModulePaths((void 0).context); // eslint-disable-line no-underscore-dangle

          module.filename = filename;

          module._compile(code, filename); // eslint-disable-line no-underscore-dangle


          return module.exports;
        },
        addBuildDependency: filename => {
          buildDependencies.push(filename);
        },
        options: {
          context: data.optionsContext
        },
        webpack: true,
        'thread-loader': true,
        sourceMap: data.sourceMap,
        target: data.target,
        minimize: data.minimize,
        resourceQuery: data.resourceQuery,
        rootContext: data.rootContext
      }
    }, (err, lrResult) => {
      const {
        result,
        cacheable,
        fileDependencies,
        contextDependencies,
        missingDependencies
      } = lrResult;
      const buffersToSend = [];
      const convertedResult = Array.isArray(result) && result.map(item => {
        const isBuffer = Buffer.isBuffer(item);

        if (isBuffer) {
          buffersToSend.push(item);
          return {
            buffer: true
          };
        }

        if (typeof item === 'string') {
          const stringBuffer = Buffer.from(item, 'utf-8');
          buffersToSend.push(stringBuffer);
          return {
            buffer: true,
            string: true
          };
        }

        return {
          data: item
        };
      });
      writeJson({
        type: 'job',
        id,
        error: err && toErrorObj(err),
        result: {
          result: convertedResult,
          cacheable,
          fileDependencies,
          contextDependencies,
          missingDependencies,
          buildDependencies
        },
        data: buffersToSend.map(buffer => buffer.length)
      });
      buffersToSend.forEach(buffer => {
        writePipeWrite(buffer);
      });
      setImmediate(taskCallback);
    });
  } catch (e) {
    writeJson({
      type: 'job',
      id,
      error: toErrorObj(e)
    });
    taskCallback();
  }
}, PARALLEL_JOBS);

function dispose() {
  terminate();
  queue.kill();
  process.exit(0);
}

function onMessage(message) {
  try {
    const {
      type,
      id
    } = message;

    switch (type) {
      case 'job':
        {
          queue.push(message);
          break;
        }

      case 'result':
        {
          const {
            error,
            result
          } = message;
          const callback = callbackMap[id];

          if (callback) {
            const nativeError = toNativeError(error);
            callback(nativeError, result);
          } else {
            console.error(`Worker got unexpected result id ${id}`);
          }

          delete callbackMap[id];
          break;
        }

      case 'warmup':
        {
          const {
            requires
          } = message; // load modules into process

          requires.forEach(r => require(r)); // eslint-disable-line import/no-dynamic-require, global-require

          break;
        }

      default:
        {
          console.error(`Worker got unexpected job type ${type}`);
          break;
        }
    }
  } catch (e) {
    console.error(`Error in worker ${e}`);
  }
}

function readNextMessage() {
  (0, _readBuffer.default)(readPipe, 4, (lengthReadError, lengthBuffer) => {
    if (lengthReadError) {
      console.error(`Failed to communicate with main process (read length) ${lengthReadError}`);
      return;
    }

    const length = lengthBuffer.length && lengthBuffer.readInt32BE(0);

    if (length === 0) {
      // worker should dispose and exit
      dispose();
      return;
    }

    (0, _readBuffer.default)(readPipe, length, (messageError, messageBuffer) => {
      if (terminated) {
        return;
      }

      if (messageError) {
        console.error(`Failed to communicate with main process (read message) ${messageError}`);
        return;
      }

      const messageString = messageBuffer.toString('utf-8');
      const message = JSON.parse(messageString, _serializer.reviver);
      onMessage(message);
      setImmediate(() => readNextMessage());
    });
  });
} // start reading messages from main process


readNextMessage();
})();

module.exports = __webpack_exports__;
/******/ })()
;