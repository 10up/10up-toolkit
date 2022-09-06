const now = new Date();

export function isToolkitTranspilingThis(): string {
	return `[${now.getDate()}] Yes - Toolkit is transpiling this!`;
}
