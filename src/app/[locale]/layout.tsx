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
import { CookieConsent } from '@/components/cookie-consent';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { getBool } from '@/lib/commerce/settings';
import { getAdminSession } from '@/lib/admin';
import { appUrl } from '@/lib/app-url';
import '../globals.css';
// Fuentes de marca auto-alojadas: Cinzel (display, capitales grabadas) + Spectral (texto)
import '@fontsource/spectral/400.css';
import '@fontsource/spectral/500.css';
import '@fontsource/spectral/600.css';
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
  const description = 'Legacy Fan — coleccionismo premium en metales preciosos.';
  return {
    title: { default: t('siteName'), template: `%s · ${t('siteName')}` },
    description,
    metadataBase: new URL(appUrl()),
    openGraph: {
      title: t('siteName'),
      description,
      siteName: t('siteName'),
      type: 'website',
      images: [{ url: '/brand/og-image.jpg', width: 1200, height: 630, alt: 'Legacy Fan Club' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('siteName'),
      description,
      images: ['/brand/og-image.jpg'],
    },
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

  // En paralelo: este layout corre en TODAS las páginas (antes 5 awaits en serie).
  const [t, messages, session, maintenance] = await Promise.all([
    getTranslations({ locale, namespace: 'common' }),
    getMessages(),
    auth(),
    getBool('system.maintenance_mode'),
  ]);
  const adminInfo = session?.user?.id ? await getAdminSession() : null;
  const isAdmin = !!adminInfo;
  // Modo mantenimiento (doc 09): si está activo, solo los admin ven la web.
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
          <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md md:border-transparent md:bg-[#070707] md:backdrop-blur-none">
            <div className="mx-auto flex h-[74px] max-w-6xl items-center justify-between gap-3 px-4 sm:gap-5 sm:px-6 md:h-[122px] md:px-[30px]">
              {/* Logo → web corporativa (no al store). En escritorio, 60px como en legacy-fan.com */}
              <a href="https://legacy-fan.com/" aria-label={t('siteName')} className="flex-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo.webp" alt="Legacy Fan" width={200} height={60} className="h-9 w-auto sm:h-10 md:h-[60px]" />
              </a>
              <MainNav
                menuLabel={t('menu')}
                mobileExtra={
                  <>
                    <LocaleSwitcher />
                    <AuthNav
                      isLoggedIn={!!session?.user?.id}
                      isAdmin={isAdmin}
                      accountLabel={t('account')}
                      adminLabel={t('adminPanel')}
                      loginLabel={t('login')}
                      logoutLabel={t('logout')}
                    />
                    <ThemeToggle label={t('toggleTheme')} />
                  </>
                }
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
                  { kind: 'external', href: 'https://legacy-fan.com/colecciones/', label: t('navColecciones') },
                  { kind: 'external', href: locale === 'en' ? 'https://legacy-fan.com/en/distributors-retail/' : 'https://legacy-fan.com/distribuidores-puntos-de-venta/', label: t('navDistribuidor') },
                  { kind: 'external', href: 'https://legacy-fan.com/founders-inversion/', label: t('navFounders') },
                  { kind: 'external', href: 'https://legacy-fan.com/trabaja-con-nosotros/', label: t('navTrabaja') },
                ]}
              />
              {/* Cluster derecho: en móvil va dentro del menú hamburguesa (evita
                  desbordes); en escritorio se muestra aquí. */}
              <div className="hidden flex-none items-center gap-2 md:flex sm:gap-4">
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
          <footer className="border-t border-border bg-[#070707] px-4 py-12 text-[#cccccc] sm:px-6">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 h-px bg-[#65bd7d]/40" />
              <div className="flex flex-col items-center gap-4 text-center">
                <a href="https://legacy-fan.com/" aria-label={t('siteName')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/logo.webp" alt="Legacy Fan" width={200} height={60} className="h-10 w-auto" />
                </a>
                <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#cccccc]/80">
                  <Link href="/legal/terms" className="hover:text-[#65bd7d]">{t('legalTerms')}</Link>
                  <Link href="/legal/privacy" className="hover:text-[#65bd7d]">{t('legalPrivacy')}</Link>
                  <Link href="/legal/cookies" className="hover:text-[#65bd7d]">{t('legalCookies')}</Link>
                  <Link href="/legal/returns" className="hover:text-[#65bd7d]">{t('legalReturns')}</Link>
                  <Link href="/legal/membership" className="hover:text-[#65bd7d]">{t('legalMembership')}</Link>
                  <Link href="/legal/aviso-legal" className="hover:text-[#65bd7d]">{t('legalNotice')}</Link>
                </nav>
                <p className="max-w-2xl text-xs leading-relaxed text-faint">
                  {/* Disclaimer obligatorio (doc 15) */}
                  <DisclaimerText locale={locale} />
                </p>
                <p className="text-[11px] tracking-wide text-faint">
                  © 2026 Legacy Fan LLC · 8 The Green STE R, Dover, DE 19901 · info@legacy-fan.com
                </p>
              </div>
            </div>
          </footer>
          <CookieConsent />
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
