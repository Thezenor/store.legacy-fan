import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthNav } from '@/components/auth/auth-nav';
import { Wordmark } from '@/components/brand/wordmark';
import { MainNav } from '@/components/brand/main-nav';
import { LocaleSwitcher } from '@/components/brand/locale-switcher';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { getBool } from '@/lib/commerce/settings';
import { getAdminSession } from '@/lib/admin';
import '../globals.css';
// Fuentes de marca auto-alojadas: Cinzel (display, capitales grabadas) + Spectral (texto)
import '@fontsource/spectral/300.css';
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/500.css';
import '@fontsource/spectral/600.css';
import '@fontsource/spectral/400-italic.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
// Inter para el menú superior (UI)
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

// Fuentes: stack del sistema vía variables CSS (definidas en globals.css).
// TODO(Fase 1): auto-alojar Inter + Cormorant Garamond con next/font/local
// (requiere red limpia o el CA corporativo instalado para descargar los .woff2).

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: { default: t('siteName'), template: `%s · ${t('siteName')}` },
    description: 'Legacy Fan — coleccionismo premium en metales preciosos.',
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://store.legacy-fan.com'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'common' });
  const messages = await getMessages();
  const session = await auth();
  const adminInfo = session?.user?.id ? await getAdminSession() : null;
  const isAdmin = !!adminInfo;
  // Modo mantenimiento (doc 09): si está activo, solo los admin ven la web.
  const maintenance = await getBool('system.maintenance_mode');
  const showMaintenance = maintenance && !isAdmin;

  return (
    // Modo oscuro por defecto: sin clase `.light` en el render inicial.
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {showMaintenance ? (
            <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
              <Wordmark />
              <h1 className="mt-8 font-display text-3xl uppercase text-foreground">En mantenimiento</h1>
              <p className="mt-3 max-w-md text-sm text-muted">
                Estamos preparando algo especial. Vuelve en unos minutos.
              </p>
            </div>
          ) : (
          <>
          <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
            <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between gap-3 px-4 sm:gap-5 sm:px-6">
              <Link href="/" aria-label={t('siteName')} className="flex-none">
                <Wordmark />
              </Link>
              <MainNav
                menuLabel={t('menu')}
                items={[
                  {
                    kind: 'menu',
                    label: t('navClub'),
                    basePath: '/club',
                    children: [
                      { href: '/club/prime', label: 'Prime' },
                      { href: '/club/prestige', label: 'Prestige' },
                      { href: '/club', label: t('comparePlans') },
                    ],
                  },
                  { kind: 'link', href: '/colecciones', label: t('navColecciones') },
                  { kind: 'external', href: 'https://legacy-fan.com/punto-de-venta/', label: t('navPuntoVenta') },
                  { kind: 'external', href: 'https://legacy-fan.com/distribuidores/', label: t('navDistribuidor') },
                  { kind: 'external', href: 'https://legacy-fan.com/founders-inversion/', label: t('navFounders') },
                  { kind: 'external', href: 'https://legacy-fan.com/trabaja-con-nosotros/', label: t('navTrabaja') },
                ]}
              />
              <div className="flex flex-none items-center gap-2 sm:gap-4">
                <AuthNav
                  isLoggedIn={!!session?.user?.id}
                  isAdmin={isAdmin}
                  accountLabel={t('account')}
                  adminLabel={t('adminPanel')}
                  loginLabel={t('login')}
                  logoutLabel={t('logout')}
                />
                <LocaleSwitcher />
                <ThemeToggle label={t('toggleTheme')} />
              </div>
            </div>
          </header>
          <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            {children}
          </main>
          <footer className="border-t border-border px-4 py-12 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="hairline-gold mb-8" />
              <div className="flex flex-col items-center gap-4 text-center">
                <Wordmark />
                <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
                  <Link href="/legal/terms" className="hover:text-foreground">{t('legalTerms')}</Link>
                  <Link href="/legal/privacy" className="hover:text-foreground">{t('legalPrivacy')}</Link>
                  <Link href="/legal/cookies" className="hover:text-foreground">{t('legalCookies')}</Link>
                </nav>
                <p className="max-w-2xl text-xs leading-relaxed text-faint">
                  {/* Disclaimer obligatorio (doc 15) */}
                  <DisclaimerText locale={locale} />
                </p>
                <p className="text-[11px] tracking-wide text-faint">
                  © 2026 Legacy Fan · 8 The Green STE R, Dover DE 19901 · info@legacy-fan.com
                </p>
              </div>
            </div>
          </footer>
          </>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

async function DisclaimerText({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  return <>{t('disclaimer')}</>;
}
