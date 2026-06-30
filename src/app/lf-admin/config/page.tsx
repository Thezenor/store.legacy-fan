import { prisma } from '@/lib/prisma';
import { saveConfigAction } from '@/lib/admin-actions';
import { GatewayConfig } from '@/components/admin/gateway-config';

const inp = 'mt-1 rounded border border-border bg-background px-2 py-1.5 text-foreground';

export default async function AdminConfig() {
  const rows = await prisma.systemSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const v = (k: string) => map.get(k);
  const num = (k: string) => Number(v(k) ?? 0);
  const money = (k: string) => (num(k) / 100).toFixed(2);
  const bool = (k: string) => Boolean(v(k));
  const str = (k: string) => String(v(k) ?? '');
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

        <Group title="Sistema">
          <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="system.maintenance_mode" defaultChecked={bool('system.maintenance_mode')} /> Modo mantenimiento (solo admin ve la web)</label>
        </Group>

        <button type="submit" className="bevel bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Guardar configuración</button>
      </form>

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
            'payments.paypal.enabled': bool('payments.paypal.enabled'),
            'stripe.secret_key': str('stripe.secret_key'),
            'stripe.publishable_key': str('stripe.publishable_key'),
            'stripe.webhook_secret': str('stripe.webhook_secret'),
            'payments.stripe.enabled': bool('payments.stripe.enabled'),
          }}
        />
      </div>
    </div>
  );
}
