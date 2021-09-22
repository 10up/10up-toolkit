/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 422:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

/**
 * External dependencies
 */
const { createHash } = __nccwpck_require__( 417 );
const path = __nccwpck_require__( 622 );
const webpack = __nccwpck_require__( 555 );
// In webpack 5 there is a `webpack.sources` field but for webpack 4 we have to fallback to the `webpack-sources` package.
const { RawSource } = webpack.sources || __nccwpck_require__( 635 );
const json2php = __nccwpck_require__( 318 );
const isWebpack4 = webpack.version.startsWith( '4.' );

/**
 * Internal dependencies
 */
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = __nccwpck_require__( 943 );

class DependencyExtractionWebpackPlugin {
	constructor( options ) {
		this.options = Object.assign(
			{
				combineAssets: false,
				combinedOutputFile: null,
				injectPolyfill: false,
				outputFormat: 'php',
				useDefaults: true,
			},
			options
		);

		/*
		 * Track requests that are externalized.
		 *
		 * Because we don't have a closed set of dependencies, we need to track what has
		 * been externalized so we can recognize them in a later phase when the dependency
		 * lists are generated.
		 */
		this.externalizedDeps = new Set();

		// Offload externalization work to the ExternalsPlugin.
		this.externalsPlugin = new webpack.ExternalsPlugin(
			'window',
			isWebpack4
				? this.externalizeWpDeps.bind( this )
				: this.externalizeWpDepsV5.bind( this )
		);
	}

	externalizeWpDeps( _context, request, callback ) {
		let externalRequest;

		// Handle via options.requestToExternal first
		if ( typeof this.options.requestToExternal === 'function' ) {
			externalRequest = this.options.requestToExternal( request );
		}

		// Cascade to default if unhandled and enabled
		if (
			typeof externalRequest === 'undefined' &&
			this.options.useDefaults
		) {
			externalRequest = defaultRequestToExternal( request );
		}

		if ( externalRequest ) {
			this.externalizedDeps.add( request );

			return callback( null, externalRequest );
		}

		return callback();
	}

	externalizeWpDepsV5( { context, request }, callback ) {
		return this.externalizeWpDeps( context, request, callback );
	}

	mapRequestToDependency( request ) {
		// Handle via options.requestToHandle first
		if ( typeof this.options.requestToHandle === 'function' ) {
			const scriptDependency = this.options.requestToHandle( request );
			if ( scriptDependency ) {
				return scriptDependency;
			}
		}

		// Cascade to default if enabled
		if ( this.options.useDefaults ) {
			const scriptDependency = defaultRequestToHandle( request );
			if ( scriptDependency ) {
				return scriptDependency;
			}
		}

		// Fall back to the request name
		return request;
	}

	stringify( asset ) {
		if ( this.options.outputFormat === 'php' ) {
			return `<?php return ${ json2php(
				JSON.parse( JSON.stringify( asset ) )
			) };`;
		}

		return JSON.stringify( asset );
	}

	apply( compiler ) {
		this.externalsPlugin.apply( compiler );

		if ( isWebpack4 ) {
			compiler.hooks.emit.tap( this.constructor.name, ( compilation ) =>
				this.addAssets( compilation, compiler )
			);
		} else {
			compiler.hooks.thisCompilation.tap(
				this.constructor.name,
				( compilation ) => {
					compilation.hooks.processAssets.tap(
						{
							name: this.constructor.name,
							stage:
								compiler.webpack.Compilation
									.PROCESS_ASSETS_STAGE_ADDITIONAL,
						},
						() => this.addAssets( compilation, compiler )
					);
				}
			);
		}
	}

	addAssets( compilation, compiler ) {
		const {
			combineAssets,
			combinedOutputFile,
			injectPolyfill,
			outputFormat,
		} = this.options;

		const combinedAssetsData = {};

		// Process each entry point independently.
		for ( const [
			entrypointName,
			entrypoint,
		] of compilation.entrypoints.entries() ) {
			const entrypointExternalizedWpDeps = new Set();
			if ( injectPolyfill ) {
				entrypointExternalizedWpDeps.add( 'wp-polyfill' );
			}

			const processModule = ( { userRequest } ) => {
				if ( this.externalizedDeps.has( userRequest ) ) {
					const scriptDependency = this.mapRequestToDependency(
						userRequest
					);
					entrypointExternalizedWpDeps.add( scriptDependency );
				}
			};

			// Search for externalized modules in all chunks.
			for ( const chunk of entrypoint.chunks ) {
				const modulesIterable = isWebpack4
					? chunk.modulesIterable
					: compilation.chunkGraph.getChunkModules( chunk );
				for ( const chunkModule of modulesIterable ) {
					processModule( chunkModule );
					// loop through submodules of ConcatenatedModule
					if ( chunkModule.modules ) {
						for ( const concatModule of chunkModule.modules ) {
							processModule( concatModule );
						}
					}
				}
			}

			const runtimeChunk = entrypoint.getRuntimeChunk();

			const assetData = {
				// Get a sorted array so we can produce a stable, stringified representation.
				dependencies: Array.from( entrypointExternalizedWpDeps ).sort(),
				version: runtimeChunk.hash,
			};

			const assetString = this.stringify( assetData );

			// Determine a filename for the asset file.
			const [ filename, query ] = entrypointName.split( '?', 2 );
			const buildFilename = compilation.getPath(
				compiler.options.output.filename,
				{
					chunk: runtimeChunk,
					filename,
					query,
					basename: basename( filename ),
					contentHash: createHash( 'md4' )
						.update( assetString )
						.digest( 'hex' ),
				}
			);

			if ( combineAssets ) {
				combinedAssetsData[ buildFilename ] = assetData;
				continue;
			}

			const assetFilename = buildFilename.replace(
				/\.js$/i,
				'.asset.' + ( outputFormat === 'php' ? 'php' : 'json' )
			);

			// Add source and file into compilation for webpack to output.
			compilation.assets[ assetFilename ] = new RawSource( assetString );
			runtimeChunk.files[ isWebpack4 ? 'push' : 'add' ]( assetFilename );
		}

		if ( combineAssets ) {
			// Assert the `string` type for output path.
			// The type indicates the option may be `undefined`.
			// However, at this point in compilation, webpack has filled the options in if
			// they were not provided.
			const outputFolder = /** @type {{path:string}} */ ( compiler.options
				.output ).path;

			const assetsFilePath = path.resolve(
				outputFolder,
				combinedOutputFile ||
					'assets.' + ( outputFormat === 'php' ? 'php' : 'json' )
			);
			const assetsFilename = path.relative(
				outputFolder,
				assetsFilePath
			);

			// Add source into compilation for webpack to output.
			compilation.assets[ assetsFilename ] = new RawSource(
				this.stringify( combinedAssetsData )
			);
		}
	}
}

function basename( name ) {
	if ( ! name.includes( '/' ) ) {
		return name;
	}
	return name.substr( name.lastIndexOf( '/' ) + 1 );
}

module.exports = DependencyExtractionWebpackPlugin;


/***/ }),

/***/ 943:
/***/ ((module) => {

const WORDPRESS_NAMESPACE = '@wordpress/';
const BUNDLED_PACKAGES = [ '@wordpress/icons', '@wordpress/interface' ];

/**
 * Default request to global transformation
 *
 * Transform @wordpress dependencies:
 * - request `@wordpress/api-fetch` becomes `[ 'wp', 'apiFetch' ]`
 * - request `@wordpress/i18n` becomes `[ 'wp', 'i18n' ]`
 *
 * @param {string} request Module request (the module name in `import from`) to be transformed
 * @return {string|string[]|undefined} The resulting external definition. Return `undefined`
 *   to ignore the request. Return `string|string[]` to map the request to an external.
 */
function defaultRequestToExternal( request ) {
	switch ( request ) {
		case 'moment':
			return request;

		case '@babel/runtime/regenerator':
			return 'regeneratorRuntime';

		case 'lodash':
		case 'lodash-es':
			return 'lodash';

		case 'jquery':
			return 'jQuery';

		case 'react':
			return 'React';

		case 'react-dom':
			return 'ReactDOM';
	}

	if ( BUNDLED_PACKAGES.includes( request ) ) {
		return undefined;
	}

	if ( request.startsWith( WORDPRESS_NAMESPACE ) ) {
		return [
			'wp',
			camelCaseDash( request.substring( WORDPRESS_NAMESPACE.length ) ),
		];
	}
}

/**
 * Default request to WordPress script handle transformation
 *
 * Transform @wordpress dependencies:
 * - request `@wordpress/i18n` becomes `wp-i18n`
 * - request `@wordpress/escape-html` becomes `wp-escape-html`
 *
 * @param {string} request Module request (the module name in `import from`) to be transformed
 * @return {string|undefined} WordPress script handle to map the request to. Return `undefined`
 *   to use the same name as the module.
 */
function defaultRequestToHandle( request ) {
	switch ( request ) {
		case '@babel/runtime/regenerator':
			return 'wp-polyfill';

		case 'lodash-es':
			return 'lodash';
	}

	if ( request.startsWith( WORDPRESS_NAMESPACE ) ) {
		return 'wp-' + request.substring( WORDPRESS_NAMESPACE.length );
	}
}

/**
 * Given a string, returns a new string with dash separators converted to
 * camelCase equivalent. This is not as aggressive as `_.camelCase` in
 * converting to uppercase, where Lodash will also capitalize letters
 * following numbers.
 *
 * @param {string} string Input dash-delimited string.
 * @return {string} Camel-cased string.
 */
function camelCaseDash( string ) {
	return string.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}

module.exports = {
	camelCaseDash,
	defaultRequestToExternal,
	defaultRequestToHandle,
};


/***/ }),

/***/ 318:
/***/ (function(module) {

// Generated by CoffeeScript 1.6.3
(function() {
  var json2php;

  json2php = function(obj) {
    var i, result;
    switch (Object.prototype.toString.call(obj)) {
      case '[object Null]':
        result = 'null';
        break;
      case '[object Undefined]':
        result = 'null';
        break;
      case '[object String]':
        result = "'" + obj.replace(/\\/g, '\\\\').replace(/\'/g, "\\'") + "'";
        break;
      case '[object Number]':
        result = obj.toString();
        break;
      case '[object Array]':
        result = 'array(' + obj.map(json2php).join(', ') + ')';
        break;
      case '[object Object]':
        result = [];
        for (i in obj) {
          if (obj.hasOwnProperty(i)) {
            result.push(json2php(i) + " => " + json2php(obj[i]));
          }
        }
        result = "array(" + result.join(", ") + ")";
        break;
      default:
        result = 'null';
    }
    return result;
  };

  if ( true && module.exports) {
    module.exports = json2php;
    global.json2php = json2php;
  }

}).call(this);


/***/ }),

/***/ 555:
/***/ ((module) => {

"use strict";
module.exports = require("../../compiled/webpack");

/***/ }),

/***/ 635:
/***/ ((module) => {

"use strict";
module.exports = require("../../compiled/webpack-sources");

/***/ }),

/***/ 417:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 622:
/***/ ((module) => {

"use strict";
module.exports = require("path");

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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(422);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;