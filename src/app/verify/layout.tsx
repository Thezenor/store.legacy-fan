import type { Metadata } from 'next';
import '../globals.css';
import '@fontsource/antic-didone/400.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';

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
