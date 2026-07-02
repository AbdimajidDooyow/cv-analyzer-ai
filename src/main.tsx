import {StrictMode} from 'react';
import App from './App.tsx';
import './index.css';

(async () => {
  const { createRoot } = (await import('react-dom/client')) as unknown as {
    createRoot: (container: Element | DocumentFragment) => {
      render: (children: React.ReactNode) => void;
    };
  };

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
})();
