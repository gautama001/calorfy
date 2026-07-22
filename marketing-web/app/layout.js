import './globals.css';

export const metadata = {
  metadataBase: new URL('https://calorfy.com'),
  title: {
    default: 'Calorfy — Nutrición que entiende tu contexto',
    template: '%s — Calorfy',
  },
  description: 'Registro nutricional preciso, alimentos de Latinoamérica y acompañamiento profesional conectado.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://calorfy.com',
    siteName: 'Calorfy',
    title: 'Calorfy — Nutrición que entiende tu contexto',
    description: 'Alimentos reales, progreso claro y profesionales conectados.',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Calorfy — Nutrición que entiende tu contexto' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calorfy — Nutrición que entiende tu contexto',
    description: 'Alimentos reales, progreso claro y profesionales conectados.',
    images: ['/og.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#071b16',
};

export default function RootLayout({ children }) {
  return <html lang="es"><body>{children}</body></html>;
}
