import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#062A22" />
        <meta name="description" content="Calorfy — nutrición real, con contexto latinoamericano." />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <title>Calorfy</title>
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
  :root { color-scheme: light; --page-bg: #eaf4f0; --app-bg: #f3f7f5; --app-shadow: rgba(0, 70, 52, 0.12); }
  :root[data-theme='dark'] { color-scheme: dark; --page-bg: #07110e; --app-bg: #0b1713; --app-shadow: rgba(0, 0, 0, 0.4); }
  html, body { width: 100%; height: 100%; min-height: 100%; margin: 0; overflow: hidden; background: var(--page-bg); }
  body { overscroll-behavior: none; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
  #root {
    width: 100%;
    height: 100%;
    min-height: 0;
    max-width: 560px;
    margin: 0 auto;
    overflow: hidden;
    background: var(--app-bg);
    box-shadow: 0 0 48px var(--app-shadow);
  }
  @supports (height: 100dvh) {
    html, body, #root { height: 100dvh; }
  }
  @media (max-width: 560px) { #root { box-shadow: none; } }
`;

const initialThemeScript = `
  (function () {
    try {
      var stored = window.localStorage.getItem('darkMode');
      var dark = stored === null
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : stored === 'true';
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', dark ? '#0B1713' : '#F3F7F5');
    } catch (_) {}
  })();
`;
