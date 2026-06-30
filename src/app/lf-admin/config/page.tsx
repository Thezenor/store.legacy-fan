import { prisma } from '@/lib/prisma';
import { saveConfigAction, uploadUpsellCoinImageAction } from '@/lib/admin-actions';
import { GatewayConfig } from '@/components/admin/gateway-config';
import { getClubPricing } from '@/lib/commerce';

const inp = 'mt-1 rounded border border-border bg-background px-2 py-1.5 text-foreground';

export default async function AdminConfig() {
  const rows = await prisma.systemSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const v = (k: string) => map.get(k);
  const num = (k: string) => Number(v(k) ?? 0);
  const money = (k: string) => (num(k) / 100).toFixed(2);
  const bool = (k: string) => Boolean(v(k));
  const str = (k: string) => String(v(k) ?? '');

  // Estado de los planes de suscripción por club/divisa, según la FASE actual
  // (el precio del plan depende de la fase; cada fase/precio tiene su plan).
  const subPlanInfo: Record<
    string,
    { phaseKey: string; phaseName: string; price: string; sandbox: string; live: string; sandboxErr: string; liveErr: string }
  > = {};
  for (const club of ['PRIME', 'PRESTIGE'] as const) {
    for (const cur of ['EUR', 'USD'] as const) {
      const pricing = await getClubPricing(club, cur);
      const phaseKey = pricing?.phaseKey ?? 'NA';
      const cents = pricing?.priceCents ?? 0;
      subPlanInfo[`${club}.${cur}`] = {
        phaseKey,
        phaseName: pricing?.phaseName ?? '',
        price: pricing?.priceFormatted ?? '—',
        sandbox: str(`paypal.sandbox.plan.${club}.${cur}.${phaseKey}.${cents}`),
        live: str(`paypal.live.plan.${club}.${cur}.${phaseKey}.${cents}`),
        sandboxErr: str(`paypal.sandbox.plan_error.${club}.${cur}`),
        liveErr: str(`paypal.live.plan_error.${club}.${cur}`),
      };
    }
  }
  const dateVal = (k: string) => {
    const d = v(k);
    return d ? new Date(String(d)).toISOString().slice(0, 10) : '';
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-lg text-gold-light">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-4">{children}</div>
    </section>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Configuración del sistema</h1>
      <p className="mt-1 text-sm text-muted">Datos de empresa, fiscal, lanzamiento, pasarelas, reserva y puntos.</p>

      <form action={saveConfigAction} className="mt-6 space-y-4">
        <Group title="Empresa y fiscal">
          <Field label="Nombre de empresa"><input name="fiscal.company_name" defaultValue={str('fiscal.company_name')} className={`${inp} w-56`} /></Field>
          <Field label="País base (ISO)"><input name="fiscal.base_country" defaultValue={str('fiscal.base_country')} className={`${inp} w-24`} /></Field>
          <Field label="Moneda principal"><select name="fiscal.base_currency" defaultValue={str('fiscal.base_currency') || 'EUR'} className={`${inp}`}><option>EUR</option><option>USD</option></select></Field>
          <Field label="Serie de factura"><input name="fiscal.invoice_series" defaultValue={str('fiscal.invoice_series')} className={`${inp} w-24`} /></Field>
        </Group>

        <Group title="Lanzamiento">
          <Field label="Fecha de lanzamiento"><input type="date" name="launch.date" defaultValue={dateVal('launch.date')} className={inp} /></Field>
        </Group>

        <Group title="Sistema · modo de pago global">
          <Field label="Modo (test/live)"><select name="payments.mode" defaultValue={str('payments.mode') || 'test'} className={inp}><option value="test">test</option><option value="live">live</option></select></Field>
          <Field label="Modelo de cobro"><select name="billing.mode" defaultValue={str('billing.mode') || 'one_time'} className={inp}><option value="one_time">Pago único (anual manual)</option><option value="subscription">Suscripción (renovación automática)</option></select></Field>
        </Group>

        <Group title="Reserva">
          <Field label="Importe EUR"><input name="reservation.amount.eur" type="number" step="0.01" defaultValue={money('reservation.amount.eur')} className={`${inp} w-28`} /></Field>
          <Field label="Importe USD"><input name="reservation.amount.usd" type="number" step="0.01" defaultValue={money('reservation.amount.usd')} className={`${inp} w-28`} /></Field>
          <Field label="Días de gracia tras lanzamiento"><input name="reservation.grace_days_after_launch" type="number" defaultValue={num('reservation.grace_days_after_launch')} className={`${inp} w-24`} /></Field>
          <Field label="Reembolsable hasta (horas antes)"><input name="reservation.refundable_hours_before_launch" type="number" defaultValue={num('reservation.refundable_hours_before_launch')} className={`${inp} w-24`} /></Field>
        </Group>

        <Group title="Puntos y upsell">
          <Field label="Ratio puntos/€"><input name="points.ratio_per_currency_unit" type="number" defaultValue={num('points.ratio_per_currency_unit')} className={`${inp} w-24`} /></Field>
          <Field label="Caducidad (años)"><input name="points.expiry_years" type="number" defaultValue={num('points.expiry_years')} className={`${inp} w-24`} /></Field>
          <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="upsell.second_coin.enabled_prime" defaultChecked={bool('upsell.second_coin.enabled_prime')} /> Upsell 2ª moneda en Prime</label>
          <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="upsell.second_coin.enabled_prestige" defaultChecked={bool('upsell.second_coin.enabled_prestige')} /> Upsell 2ª moneda en Prestige</label>
        </Group>

        <Group title="Upsell 2ª moneda (Prestige) · nombres y precios">
          <Field label="Nombre moneda A"><input name="upsell.coin.a.name" defaultValue={str('upsell.coin.a.name')} className={`${inp} w-44`} /></Field>
          <Field label="Nombre moneda B"><input name="upsell.coin.b.name" defaultValue={str('upsell.coin.b.name')} className={`${inp} w-44`} /></Field>
          <Field label="2ª moneda — precio EUR"><input name="upsell.second_coin.price_eur" type="number" step="0.01" defaultValue={money('upsell.second_coin.price_eur')} className={`${inp} w-28`} /></Field>
          <Field label="2ª moneda — precio USD"><input name="upsell.second_coin.price_usd" type="number" step="0.01" defaultValue={money('upsell.second_coin.price_usd')} className={`${inp} w-28`} /></Field>
          <Field label="PVP original EUR (tachado)"><input name="upsell.second_coin.list_eur" type="number" step="0.01" defaultValue={money('upsell.second_coin.list_eur')} className={`${inp} w-28`} /></Field>
          <Field label="PVP original USD (tachado)"><input name="upsell.second_coin.list_usd" type="number" step="0.01" defaultValue={money('upsell.second_coin.list_usd')} className={`${inp} w-28`} /></Field>
        </Group>

        <Group title="Sistema">
          <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="system.maintenance_mode" defaultChecked={bool('system.maintenance_mode')} /> Modo mantenimiento (solo admin ve la web)</label>
        </Group>

        <button type="submit" className="bevel bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Guardar configuración</button>
      </form>

      {/* Imágenes de las monedas del upsell (subida de fichero, formularios aparte) */}
      <div className="mt-4 rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Imágenes de las monedas (Prestige)</h2>
        <p className="mt-1 text-xs text-faint">Sube una imagen por moneda. Requiere el Volume de Railway montado para que persistan.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {(['a', 'b'] as const).map((coin) => (
            <form key={coin} action={uploadUpsellCoinImageAction} className="rounded border border-border p-3">
              <input type="hidden" name="coin" value={coin} />
              <span className="text-xs uppercase tracking-wider text-gold-light">Moneda {coin.toUpperCase()}</span>
              {str(`upsell.coin.${coin}.image`) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={str(`upsell.coin.${coin}.image`)} alt={`Moneda ${coin}`} className="mt-2 h-24 w-24 rounded object-cover" />
              ) : (
                <p className="mt-2 text-xs text-faint">Sin imagen</p>
              )}
              <input type="file" name="file" accept="image/*" className="mt-2 block w-full text-xs text-muted" />
              <button className="bevel mt-2 bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1a1408]">Subir imagen</button>
            </form>
          ))}
        </div>
      </div>

      {/* Pasarelas de pago (formulario propio, credenciales) */}
      <div className="mt-4">
        <GatewayConfig
          values={{
            // Credenciales por modo; si están vacías, migramos las heredadas a sandbox.
            'paypal.sandbox.client_id': str('paypal.sandbox.client_id') || str('paypal.client_id'),
            'paypal.sandbox.client_secret': str('paypal.sandbox.client_secret') || str('paypal.client_secret'),
            'paypal.sandbox.webhook_id': str('paypal.sandbox.webhook_id') || str('paypal.webhook_id'),
            'paypal.live.client_id': str('paypal.live.client_id'),
            'paypal.live.client_secret': str('paypal.live.client_secret'),
            'paypal.live.webhook_id': str('paypal.live.webhook_id'),
            'paypal.mode': str('paypal.mode'),
            'paypal.test_result': str('paypal.test_result'),
            'payments.paypal.enabled': bool('payments.paypal.enabled'),
            'stripe.secret_key': str('stripe.secret_key'),
            'stripe.publishable_key': str('stripe.publishable_key'),
            'stripe.webhook_secret': str('stripe.webhook_secret'),
            'payments.stripe.enabled': bool('payments.stripe.enabled'),
          }}
          subPlanInfo={subPlanInfo}
        />
      </div>
    </div>
  );
}
