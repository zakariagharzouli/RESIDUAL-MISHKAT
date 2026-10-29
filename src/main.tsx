import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// L'app a démarré : le filet de sécurité d'index.html n'a rien à faire
(window as unknown as { __mishkatBooted?: boolean }).__mishkatBooted = true;
try { sessionStorage.removeItem('mishkat_recovered'); } catch { /* stockage indisponible */ }

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('SW registered: ', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                const updateEvent = new CustomEvent('mishkatUpdateAvailable', { detail: { waiting: newWorker } });
                window.dispatchEvent(updateEvent);
              }
            });
          }
        });

        // Cherche une nouvelle version chaque heure et à chaque retour sur l'app
        setInterval(() => { registration.update().catch(() => {}); }, 60 * 60 * 1000);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') registration.update().catch(() => {});
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
