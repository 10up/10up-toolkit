import Accordion from './accordion';

export { Accordion };

export default Accordion;

if (typeof window.TenUp !== 'object') {
	window.TenUp = {};
}

window.TenUp.Accordion = Accordion;
// for backwards compat
window.TenUp.accordion = Accordion;
