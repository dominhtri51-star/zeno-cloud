import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// Configure StatusBar for Android / Native Fullscreen ergonomics
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  try {
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#0d1117' }).catch(() => {});
  } catch (e) {
    console.warn('[Native] StatusBar init exception:', e);
  }
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
      },
      (err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      }
    );
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
