'use client';

import { useState } from 'react';
import { saveGatewayAction } from '@/lib/admin-actions';

type Values = Record<string, string | boolean>;

const inp = 'mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-foreground';

// Configuración dinámica de pasarela: eliges pasarela → aparecen sus campos.
export function GatewayConfig({ values }: { values: Values }) {
  const [gateway, setGateway] = useState<'paypal' | 'stripe'>('paypal');
  const v = (k: string) => String(values[k] ?? '');
  const b = (k: string) => Boolean(values[k]);

  return (
    <form action={saveGatewayAction} className="rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-lg text-gold-light">Pasarelas de pago</h2>

      <label className="mt-3 block max-w-xs">
        <span className="text-xs text-muted">Pasarela</span>
        <select
          name="gateway"
          value={gateway}
          onChange={(e) => setGateway(e.target.value as 'paypal' | 'stripe')}
          className={inp}
        >
          <option value="paypal">PayPal</option>
          <option value="stripe">Stripe</option>
        </select>
      </label>

      {gateway === 'paypal' ? (
        <div className="mt-3 space-y-3">
          <label className="block"><span className="text-xs text-muted">Client ID</span>
            <input name="paypal.client_id" defaultValue={v('paypal.client_id')} className={inp} /></label>
          <label className="block"><span className="text-xs text-muted">Client Secret</span>
            <input name="paypal.client_secret" type="password" defaultValue={v('paypal.client_secret')} className={inp} /></label>
          <label className="block"><span className="text-xs text-muted">Webhook ID</span>
            <input name="paypal.webhook_id" defaultValue={v('paypal.webhook_id')} className={inp} /></label>
          <label className="block max-w-xs"><span className="text-xs text-muted">Modo</span>
            <select name="paypal.mode" defaultValue={v('paypal.mode') || 'sandbox'} className={inp}>
              <option value="sandbox">sandbox</option><option value="live">live</option>
            </select></label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="enabled" defaultChecked={b('payments.paypal.enabled')} /> Usar PayPal como método de pago
          </label>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block"><span className="text-xs text-muted">Secret Key</span>
            <input name="stripe.secret_key" type="password" defaultValue={v('stripe.secret_key')} className={inp} /></label>
          <label className="block"><span className="text-xs text-muted">Publishable Key</span>
            <input name="stripe.publishable_key" defaultValue={v('stripe.publishable_key')} className={inp} /></label>
          <label className="block"><span className="text-xs text-muted">Webhook Secret</span>
            <input name="stripe.webhook_secret" type="password" defaultValue={v('stripe.webhook_secret')} className={inp} /></label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="enabled" defaultChecked={b('payments.stripe.enabled')} /> Usar Stripe como método de pago
          </label>
        </div>
      )}

      <button className="bevel mt-4 bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">
        Guardar pasarela
      </button>
      <p className="mt-2 text-[11px] text-faint">
        Las credenciales se guardan en la base de datos. Para máxima seguridad puedes mantenerlas también en variables de entorno.
      </p>
    </form>
  );
}
