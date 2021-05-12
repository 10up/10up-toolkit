# 10up Accordion component

[View official documentation for this package](https://baseline.10up.com/component/accordion)

## Installation

`npm install --save @10up/component-accordion`

## Usage

#### CSS Imports

`@import url("@10up/component-accordion");`

The styles can be imported into your existing codebase by using PostCSS imports, or by including the standalone CSS file in your project.

#### JavaScript

Create a new instance by supplying the selector to use for the accordion and an object containing any necessary callback functions.

```javascript
import Accordion from '@10up/component-accordion';

new Accordion( '.accordion', {
	onCreate: function() {
		console.log( 'onCreate callback' );
	},
	onOpen: function( { link, content, heading } ) {
		console.log( 'onOpen callback' );
	},
	onClose: function( { link, content, heading } ) {
		console.log( 'onClose callback' );
	},
	onToggle: function( { link, content, heading } ) {
		console.log( 'onToggle callback' );
	}
} );
```

## Demo

Example implementations at: https://baseline.10up.com/component/accordion/

## Support Level

**Active:** 10up is actively working on this, and we expect to continue work for the foreseeable future including keeping tested up to the most recent version of WordPress.  Bug reports, feature requests, questions, and pull requests are welcome.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" width="850"></a>
