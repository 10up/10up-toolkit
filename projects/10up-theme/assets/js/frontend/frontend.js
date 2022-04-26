import '../../css/frontend/style.css';
// eslint-disable-next-line
import ReactDOM from 'react-dom';
// eslint-disable-next-line
import { useState } from '@wordpress/element';

const App = () => {
	const [state] = useState(1);

	return <p>This is a react app {state}</p>;
};

ReactDOM.render(<App />, document.getElementById('root'));
