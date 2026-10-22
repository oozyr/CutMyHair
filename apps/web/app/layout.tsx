import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CutMyHair Dashboard',
  description: 'Barber management dashboard for CutMyHair',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/Lato-Regular.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Lato-Bold.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      </head>
      <body style={{ margin: 0, fontFamily: "'Lato', 'Helvetica Neue', Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
