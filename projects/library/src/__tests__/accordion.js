import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { render, injectCSS } from '../../test-utiils';
import { Accordion } from '..';

let globalContainer;
let style;

beforeEach(() => {
	const { container } = render(`
	<div class="accordion accordion--parent">
			<button class="accordion-header" type="button">Accordion Header 1</button>
			<div class="accordion-content" data-testid="accordion-content-1">
				<h2 class="accordion-label">Accordion Heading</h2>
				<p>here the content of 1st tab <a href="#">link</a></p>
			</div> <!-- //.accordion-content -->

			<button class="accordion-header" type="button">Accordion Header 2</button>
			<div class="accordion-content" data-testid="accordion-content-2">
				<h2 class="accordion-label">Parent Accordion Heading</h2>
				<p>here the content of 2nd tab <a href="#">link</a></p>
			</div> <!-- //.accordion-content -->

			<button class="accordion-header" type="button">Accordion Header with Nested Accordion</button>
			<div class="accordion-content" data-testid="accordion-content-nested">
				<div class="accordion">
					<button class="accordion-header" type="button">Nested Accordion Header</button>
					<div class="accordion-content">
						<h2 class="accordion-label">Nested Accordion Heading</h2>
						<p>here the content of 1st tab <a href="#">link</a></p>
					</div> <!-- //.accordion-content -->

					<button class="accordion-header" type="button">Nested Accordion Header</button>
					<div class="accordion-content">
						<h2 class="accordion-label">Nested Accordion Heading</h2>
						<p>here the content of 2nd tab <a href="#">link</a></p>
					</div> <!-- //.accordion-content -->
				</div> <!-- //.accordion -->
			</div> <!-- //.accordion-content -->

			<button class="accordion-header" type="button">Accordion Header</button>
			<div class="accordion-content">
				<h2 class="accordion-label">Accordion Heading</h2>
				<p>here the content of 4th tab <a href="#">link</a></p>
			</div> <!-- //.accordion-content -->

		</div> <!-- //.accordion -->

		<div class="accordion">
			<button class="accordion-header" type="button">Accordion Header</button>
			<div class="accordion-content">
				<h2 class="accordion-label">Accordion Heading</h2>
				<p>here the content of 1st tab <a href="#">link</a></p>
			</div> <!-- //.accordion-content -->

			<button class="accordion-header" type="button">Accordion Header</button>
			<div class="accordion-content">
				<h2 class="accordion-label">Accordion Heading</h2>
				<p>here the content of 2nd tab <a href="#">link</a></p>
			</div> <!-- //.accordion-content -->

			<button class="accordion-header" type="button">Accordion Header</button>
			<div class="accordion-content">
				<h2 class="accordion-label">Accordion Heading</h2>
				<p>here the content of 3rd tab <a href="#">link</a></p>
			</div> <!-- //.accordion-content -->

			<button class="accordion-header" type="button">Accordion Header</button>
			<div class="accordion-content">
				<h2 class="accordion-label">Accordion Heading</h2>
				<p>here the content of 4th tab <a href="#">link</a></p>
			</div> <!-- //.accordion-content -->
		</div> <!-- //.accordion -->
	`);

	globalContainer = container;
	style = injectCSS(`${__dirname}/../../dist/index.css`);
});

afterEach(() => {
	document.body.removeChild(globalContainer);
	document.body.removeChild(style);
});

test('accordion functions trigger', () => {
	const onCreate = jest.fn();
	const onOpen = jest.fn();
	const onClose = jest.fn();
	const onToggle = jest.fn();

	// eslint-disable-next-line no-new
	new Accordion('.accordion', {
		onCreate,
		onOpen,
		onToggle,
		onClose,
	});

	expect(onCreate).toHaveBeenCalledTimes(1);
	expect(onOpen).not.toHaveBeenCalled();
	expect(onToggle).not.toHaveBeenCalled();
	expect(onClose).not.toHaveBeenCalled();

	const header1 = screen.getByText('Accordion Header 1');
	const header2 = screen.getByText('Accordion Header 2');
	userEvent.click(header1);
	expect(onOpen).toHaveBeenCalledTimes(1);

	userEvent.click(header2);
	expect(onOpen).toHaveBeenCalledTimes(2);

	// close header 2
	userEvent.click(header2);
	expect(onClose).toHaveBeenCalledTimes(1);
	expect(onOpen).toHaveBeenCalledTimes(2);
	// open again
	userEvent.click(header2);
	expect(onOpen).toHaveBeenCalledTimes(3);

	expect(onToggle).toHaveBeenCalledTimes(4);
});

test('destroying accordion works', async () => {
	const originalMarkup = document.querySelector('.accordion').innerHTML;
	const header1 = screen.getByText('Accordion Header 1');
	const onOpen = jest.fn();
	const accordion = new Accordion('.accordion', {
		onOpen,
	});

	accordion.destroy();

	userEvent.click(header1);
	expect(onOpen).not.toHaveBeenCalled();

	expect(originalMarkup).toEqual(document.querySelector('.accordion').innerHTML);
});
