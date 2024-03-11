import '../../css/frontend/style.css';
import { createRoot } from 'react-dom/client';
// or import { useState } from 'react';
import { useState } from '@wordpress/element';

const App = () => {
	const [state] = useState(1);

	return <p>This is a react app {state}</p>;
};

const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App />);
