import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {createHead, UnheadProvider} from '@unhead/react/client';
import App from './App.tsx';
import {CookieConsentProvider} from './context/CookieConsentContext';
import './index.css';

const head = createHead();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UnheadProvider head={head}>
      <CookieConsentProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CookieConsentProvider>
    </UnheadProvider>
  </StrictMode>,
);
