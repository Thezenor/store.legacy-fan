import type { Metadata } from 'next';
import '../globals.css';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/600.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';

export const metadata: Metadata = {
  title: 'Verificación de socio · Legacy Fan',
  robots: { index: false, follow: false },
};

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
