import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { RootRoutes } from './RootRoutes.tsx';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const tree = (
  <BrowserRouter>
    <RootRoutes />
  </BrowserRouter>
);

createRoot(document.getElementById('root')!).render(
  googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider> : tree
);
  