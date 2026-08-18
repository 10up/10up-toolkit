/**
 * Generates a PHP manifest file containing all block.json metadata.
 * This enables use of WordPress's Block Metadata Collections API for improved performance.
 *
 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
 */

const fs = require('fs');
const path = require('path');
const { sync: glob } = require('fast-glob');
const json2php = require('json2php');

class BuildBlocksManifestPlugin {
	constructor(options = {}) {
		this.options = {
			outputPath: options.outputPath || path.resolve(process.cwd(), 'dist'),
			outputFile: options.outputFile || 'blocks-manifest.php',
		};
	}

	apply(compiler) {
		compiler.hooks.done.tap('BuildBlocksManifestPlugin', ({ compilation }) => {
			const logger = compilation.getLogger('BuildBlocksManifestPlugin');

			try {
				const blocksDir = path.resolve(this.options.outputPath, 'blocks');

				// Check if blocks directory exists
				if (!fs.existsSync(blocksDir)) {
					logger.warn(
						`Blocks directory not found at ${blocksDir}. Skipping manifest generation.`,
					);
					return;
				}

				// Find all block.json files in the dist/blocks directory
				const blockJsonFiles = glob(`${blocksDir.replace(/\\/g, '/')}/**/block.json`, {
					absolute: true,
				});

				if (blockJsonFiles.length === 0) {
					logger.warn(
						`No block.json files found in ${blocksDir}. Skipping manifest generation.`,
					);
					return;
				}

				const blocks = {};

				// Read and parse each block.json file
				blockJsonFiles.forEach((file) => {
					try {
						const blockJson = JSON.parse(fs.readFileSync(file, 'utf8'));
						const directoryName = path.basename(path.dirname(file));
						blocks[directoryName] = blockJson;
					} catch (error) {
						logger.warn(`Failed to parse block.json at ${file}: ${error.message}`);
					}
				});

				if (Object.keys(blocks).length === 0) {
					logger.warn('No valid block.json files found. Skipping manifest generation.');
					return;
				}

				// Generate PHP content
				const printer = json2php.make({ linebreak: '\n', indent: '\t' });
				const phpContent = `<?php
// This file is generated. Do not modify it manually.
return ${printer(blocks)};
`;

				// Write the manifest file
				const manifestPath = path.resolve(this.options.outputPath, this.options.outputFile);
				fs.writeFileSync(manifestPath, phpContent);

				logger.info(
					`Block metadata manifest generated at: ${manifestPath} (${Object.keys(blocks).length} blocks)`,
				);
			} catch (error) {
				logger.error(`Failed to generate block metadata manifest: ${error.message}`);
			}
		});
	}
}

module.exports = BuildBlocksManifestPlugin;
