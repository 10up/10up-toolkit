// Style imports
declare module '*.css' {
	const classes: { readonly [key: string]: string };
	export default classes;
}
declare module '*.scss' {
	const classes: { readonly [key: string]: string };
	export default classes;
}
declare module '*.sass' {
	const classes: { readonly [key: string]: string };
	export default classes;
}

// Image imports
declare module '*.svg' {
	import type { FC, SVGProps } from 'react';
	const ReactComponent: FC<SVGProps<SVGSVGElement>>;
	export default ReactComponent;
}
declare module '*.png' {
	const src: string;
	export default src;
}
declare module '*.jpg' {
	const src: string;
	export default src;
}
declare module '*.jpeg' {
	const src: string;
	export default src;
}
declare module '*.gif' {
	const src: string;
	export default src;
}
declare module '*.webp' {
	const src: string;
	export default src;
}
declare module '*.avif' {
	const src: string;
	export default src;
}
