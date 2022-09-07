// test for selector: 'WithStatement'
let a, x, y;
const r = 10;

with (Math) {
	a = PI * r * r;
	x = r * cos(PI);
	y = r * sin(PI / 2);
}
