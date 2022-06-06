import '../../css/frontend/style.css';

import ReactDOM from 'react-dom';
// or import { useState } from 'react';
import { useState } from '@wordpress/element';

const App = () => {
	const [state] = useState(1);

	return <p>This is a react app {state}</p>;
};

ReactDOM.render(<App />, document.getElementById('root'));
