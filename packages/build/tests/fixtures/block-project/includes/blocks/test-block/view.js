/**
 * Test block view script
 */
import domReady from '@wordpress/dom-ready';

domReady(() => {
	const blocks = document.querySelectorAll('.wp-block-test-test-block');
	blocks.forEach((block) => {
		block.addEventListener('click', () => {
			console.log('Block clicked');
		});
	});
});
