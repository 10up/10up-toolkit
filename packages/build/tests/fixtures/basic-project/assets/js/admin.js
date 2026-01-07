/**
 * Admin script for testing
 */
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import React from 'react';

console.log('Admin loaded', registerBlockType, __, React);

export default function Admin() {
	return <div>Admin Component</div>;
}
