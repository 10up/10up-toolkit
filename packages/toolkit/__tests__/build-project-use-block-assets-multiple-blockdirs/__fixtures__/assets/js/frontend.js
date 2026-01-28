/* eslint-disable*/
import '../css/frontend.css';
import * as React from 'react';
import ReactDOM from 'react-dom';
import { useState } from 'react';

const App = () => {
	const [state] = useState(1);

	return <p>This is a react app {state}</p>;
};

ReactDOM.render(<App />, document.getElementById('root'));

