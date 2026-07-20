import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#00C896" />
        <meta name="description" content="Calorfy — nutrición pensada para Latinoamérica." />
        <title>Calorfy</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
  body { background: #eaf4f0; }
  #root { min-height: 100vh; max-width: 560px; margin: 0 auto; background: #fff; box-shadow: 0 0 48px rgba(0, 70, 52, 0.12); }
  @media (max-width: 560px) { #root { box-shadow: none; } }
`;
