import { setRequestLocale } from 'next-intl/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/commerce/money';
import { appUrl } from '@/lib/app-url';
import { getAmbassadorConfig } from '@/lib/ambassador/config';
import {
  reactivateOwnCodeAction,
  updateOwnAmbassadorAction,
  requestAmbassadorPayoutAction,
} from '@/lib/ambassador/actions';
import { Link } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

const inp = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-foreground';
const fmtDate = (d: Date | null) => (d ? new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(d) : '—');
const STATE: Record<string, [string, string]> = {
  RESERVADA: ['Reservada', 'Reserved'], PAGADA: ['Pagada', 'Paid'], EN_RETENCION: ['En retención', 'On hold'],
  VALIDADA: ['Validada', 'Validated'], LIQUIDADA: ['Liquidada', 'Settled'], REVERTIDA: ['Revertida', 'Reversed'],
  CANCELADA: ['Cancelada', 'Cancelled'], EN_REVISION: ['En revisión', 'Under review'],
};

export default async function EmbajadorPanel({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const session = await requireUser(locale);
  const es = locale === 'es';
  const L = (a: string, b: string) => (es ? a : b);

  const amb = await prisma.ambassador.findUnique({ where: { userId: session.user.id } });
  if (!amb) {
    return (
      <section className="mx-auto max-w-xl py-10 text-center">
        <h1 className="font-display text-2xl text-foreground">{L('Panel de embajador', 'Ambassador dashboard')}</h1>
        <p className="mt-3 text-muted">{L('Tu cuenta no está asociada a ningún código de embajador.', 'Your account is not linked to any ambassador code.')}</p>
        <Link href="/account" className="mt-4 inline-block text-gold hover:underline">{L('Ir a mi cuenta', 'Go to my account')} →</Link>
      </section>
    );
  }

  const [signups, cfg] = await Promise.all([
    prisma.ambassadorSignup.findMany({ where: { ambassadorId: amb.id }, orderBy: { createdAt: 'desc' } }),
    getAmbassadorConfig(),
  ]);

  // Saldo por divisa y estado (nunca se mezclan EUR y USD).
  const bal = (cur: 'EUR' | 'USD', state: string) =>
    signups.filter((s) => s.currency === cur && s.state === state).reduce((a, s) => a + s.rewardCents, 0);
  const currencies: ('EUR' | 'USD')[] = ['EUR', 'USD'];
  const lapsed = amb.reactivateBy ? new Date(amb.reactivateBy).getTime() < Date.now() : false;
  const refLink = `${appUrl()}/club?ref=${amb.code}`;

  const banner = sp.saved === 'reactivated' ? L('Código reactivado. Vuelves a devengar.', 'Code reactivated. You earn again.')
    : sp.saved === 'requested' ? L('Solicitud de cobro registrada. Te pagaremos el próximo día 1 o 15.', 'Payout requested. We will pay on the next 1st or 15th.')
    : sp.saved ? L('Datos guardados.', 'Saved.')
    : null;
  const errMsg = sp.error === 'threshold' ? L('Necesitas superar el umbral para solicitar el cobro.', 'You must exceed the threshold to request payout.')
    : sp.error === 'fiscal' ? L('Completa tus datos fiscales antes de solicitar el cobro.', 'Complete your tax details before requesting payout.')
    : sp.error ? L('No se pudo completar la operación.', 'Could not complete the operation.')
    : null;

  return (
    <section className="mx-auto max-w-3xl animate-fade-in">
      <p className="eyebrow text-gold-light">{L('Programa de Embajadores', 'Ambassador Program')}</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-metal-gold">{amb.name}</h1>
      <p className="mt-1 text-muted">{L('Tu código', 'Your code')}: <span className="serial text-gold-light">{amb.code}</span></p>

      {banner ? <p className="mt-4 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm alert-success">{banner}</p> : null}
      {errMsg ? <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm alert-error">{errMsg}</p> : null}

      {lapsed ? (
        <div className="mt-4 rounded-card border border-amber-500/40 bg-amber-500/5 p-4">
          <p className="text-sm text-foreground">{L('Tu código necesita reactivarse para seguir generándote ingresos.', 'Your code needs reactivation to keep earning.')}</p>
          <form action={reactivateOwnCodeAction} className="mt-2">
            <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">{L('Reactivar código', 'Reactivate code')}</button>
          </form>
        </div>
      ) : null}

      {/* Enlace de referido */}
      <div className="mt-6 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-foreground">{L('Tu enlace', 'Your link')}</h2>
        <input readOnly value={refLink} className={`mt-2 ${inp} font-mono text-sm`} />
        <p className="mt-1 text-xs text-muted">{L('Compártelo: el código se aplica solo al llegar al alta.', 'Share it: the code is applied at sign-up.')}</p>
      </div>

      {/* Saldo por divisa y estado */}
      <div className="mt-6 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-foreground">{L('Tu saldo', 'Your balance')}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-faint"><tr><th className="py-2">{L('Divisa', 'Currency')}</th><th>{L('En retención', 'On hold')}</th><th>{L('Validado', 'Validated')}</th><th>{L('Liquidado', 'Settled')}</th><th></th></tr></thead>
            <tbody>
              {currencies.map((c) => {
                const validated = bal(c, 'VALIDADA');
                const canRequest = validated >= cfg.payoutThresholdCents;
                return (
                  <tr key={c} className="border-t border-border/60">
                    <td className="py-2 text-foreground">{c}</td>
                    <td className="text-muted">{formatMoney(bal(c, 'EN_RETENCION'), c, locale)}</td>
                    <td className="text-metal-gold">{formatMoney(validated, c, locale)}</td>
                    <td className="text-muted">{formatMoney(bal(c, 'LIQUIDADA'), c, locale)}</td>
                    <td>
                      {canRequest ? (
                        <form action={requestAmbassadorPayoutAction}>
                          <input type="hidden" name="currency" value={c} />
                          <button className="border border-gold/40 px-2 py-1 text-[11px] uppercase text-gold-light hover:bg-surface-elevated">{L('Solicitar cobro', 'Request payout')}</button>
                        </form>
                      ) : (
                        <span className="text-[11px] text-faint">{L('mín.', 'min.')} {formatMoney(cfg.payoutThresholdCents, c, locale)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">{L('El saldo se puede gastar como crédito en la web en cualquier momento; el cobro se solicita al superar el mínimo.', 'Credit is spendable anytime on the site; cash payout can be requested once over the minimum.')}</p>
      </div>

      {/* Datos fiscales y método de cobro */}
      <div className="mt-6 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-foreground">{L('Datos de cobro', 'Payout details')}</h2>
        <p className="mt-1 text-xs text-muted">{L('Sin datos fiscales completos no hay liquidación.', 'Settlement is impossible without complete tax details.')}</p>
        <form action={updateOwnAmbassadorAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block"><span className="text-xs text-muted">{L('Nombre fiscal / razón social', 'Tax name')}</span><input name="fiscalName" defaultValue={amb.fiscalName ?? ''} className={`mt-1 ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">NIF / VAT / TIN</span><input name="fiscalId" defaultValue={amb.fiscalId ?? ''} className={`mt-1 ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">{L('Dirección fiscal', 'Tax address')}</span><input name="fiscalAddress" defaultValue={amb.fiscalAddress ?? ''} className={`mt-1 ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">{L('País (ISO)', 'Country (ISO)')}</span><input name="fiscalCountry" defaultValue={amb.fiscalCountry ?? ''} className={`mt-1 ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">{L('Método de cobro', 'Payout method')}</span>
            <select name="payoutMethod" defaultValue={amb.payoutMethod ?? ''} className={`mt-1 ${inp}`}>
              <option value="">—</option>
              <option value="PAYPAL">PayPal</option>
              <option value="TRANSFERENCIA">{L('Transferencia', 'Bank transfer')}</option>
              <option value="CREDITO">{L('Crédito en tienda (+20%)', 'Store credit (+20%)')}</option>
            </select></label>
          <div className="sm:col-span-2">
            <button className="bevel bg-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">{L('Guardar', 'Save')}</button>
          </div>
        </form>
      </div>

      {/* Mis altas (anonimizadas) */}
      <div className="mt-6 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-foreground">{L('Tus altas', 'Your sign-ups')}</h2>
        {signups.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{L('Aún no tienes altas.', 'No sign-ups yet.')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-border/50 text-sm">
            {signups.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-muted">{fmtDate(s.createdAt)} · {s.plan ?? '—'} · {s.currency}</span>
                <span className="text-foreground">{(STATE[s.state] ?? [s.state, s.state])[es ? 0 : 1]}{s.rewardCents ? ` · ${formatMoney(s.rewardCents, s.currency, locale)}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-faint">{L('Autofacturas: disponibles próximamente.', 'Self-billed invoices: coming soon.')}</p>
    </section>
  );
}
