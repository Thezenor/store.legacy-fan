'use client';

import { useState } from 'react';
import {
  saveGatewayAction,
  createSubscriptionPlanAction,
  testGatewayConnectionAction,
} from '@/lib/admin-actions';

type Values = Record<string, string | boolean>;

type PlanInfo = {
  phaseKey: string;
  phaseName: string;
  price: string;
  sandbox: string;
  live: string;
  sandboxErr: string;
  liveErr: string;
};

const inp = 'mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-foreground';

// Configuración dinámica de pasarela: eliges pasarela → aparecen sus campos.
export function GatewayConfig({
  values,
  subPlanInfo = {},
}: {
  values: Values;
  subPlanInfo?: Record<string, PlanInfo>;
}) {
  const [gateway, setGateway] = useState<'paypal' | 'stripe'>('paypal');
  const [mode, setMode] = useState<'sandbox' | 'live'>(
    (String(values['paypal.mode'] ?? '') as 'sandbox' | 'live') || 'sandbox',
  );
  const v = (k: string) => String(values[k] ?? '');
  const b = (k: string) => Boolean(values[k]);

  return (
    <div className="space-y-4">
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
        <div className="mt-3 space-y-4">
          <label className="block max-w-xs"><span className="text-xs text-muted">Modo activo</span>
            <select name="paypal.mode" value={mode} onChange={(e) => setMode(e.target.value as 'sandbox' | 'live')} className={inp}>
              <option value="sandbox">sandbox (pruebas)</option><option value="live">live (producción)</option>
            </select>
            <span className="mt-1 block text-[11px] text-faint">Cambia entre sandbox y live sin reescribir credenciales: se guardan los dos juegos. Los IDs de plan de abajo se guardan para el modo seleccionado.</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Sandbox */}
            <fieldset className="rounded border border-border p-3">
              <legend className="px-1 text-xs uppercase tracking-wider text-gold-light">Sandbox</legend>
              <label className="block"><span className="text-xs text-muted">Client ID</span>
                <input name="paypal.sandbox.client_id" defaultValue={v('paypal.sandbox.client_id')} className={inp} /></label>
              <label className="mt-2 block"><span className="text-xs text-muted">Client Secret</span>
                <input name="paypal.sandbox.client_secret" type="password" defaultValue={v('paypal.sandbox.client_secret')} className={inp} /></label>
              <label className="mt-2 block"><span className="text-xs text-muted">Webhook ID</span>
                <input name="paypal.sandbox.webhook_id" defaultValue={v('paypal.sandbox.webhook_id')} className={inp} /></label>
            </fieldset>

            {/* Live */}
            <fieldset className="rounded border border-border p-3">
              <legend className="px-1 text-xs uppercase tracking-wider text-gold-light">Live</legend>
              <label className="block"><span className="text-xs text-muted">Client ID</span>
                <input name="paypal.live.client_id" defaultValue={v('paypal.live.client_id')} className={inp} /></label>
              <label className="mt-2 block"><span className="text-xs text-muted">Client Secret</span>
                <input name="paypal.live.client_secret" type="password" defaultValue={v('paypal.live.client_secret')} className={inp} /></label>
              <label className="mt-2 block"><span className="text-xs text-muted">Webhook ID</span>
                <input name="paypal.live.webhook_id" defaultValue={v('paypal.live.webhook_id')} className={inp} /></label>
            </fieldset>
          </div>

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

    {/* Probar conexión con la pasarela (credenciales del modo activo) */}
    {gateway === 'paypal' ? (
      <form action={testGatewayConnectionAction} className="rounded-card border border-border bg-surface p-4">
        <input type="hidden" name="gateway" value="paypal" />
        <div className="flex flex-wrap items-center gap-3">
          <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">
            Probar conexión PayPal
          </button>
          <span className="text-xs text-muted">Valida las credenciales del modo activo (guarda antes los cambios).</span>
        </div>
        {v('paypal.test_result') ? (
          <p
            className={`mt-2 text-xs ${
              v('paypal.test_result').startsWith('OK') ? 'text-silver' : 'text-red-400'
            }`}
          >
            {v('paypal.test_result')}
          </p>
        ) : null}
      </form>
    ) : null}

    {/* Crear planes de suscripción según la FASE actual (precio por fase) */}
    {gateway === 'paypal' ? (
      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="font-display text-base text-gold-light">Planes de suscripción · {mode}</h3>
        <p className="mt-1 text-[11px] text-faint">
          El precio del plan es el de la FASE activa. Como PayPal no permite editar el importe de un
          plan, cada fase/precio usa su propio plan: se crea automáticamente al suscribirse, o puedes
          pre-crearlo aquí. Requiere credenciales {mode} guardadas.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {([
            ['PRIME', 'EUR'],
            ['PRIME', 'USD'],
            ['PRESTIGE', 'EUR'],
            ['PRESTIGE', 'USD'],
          ] as const).map(([club, cur]) => {
            const info = subPlanInfo[`${club}.${cur}`];
            const planId = mode === 'live' ? info?.live : info?.sandbox;
            const err = mode === 'live' ? info?.liveErr : info?.sandboxErr;
            return (
              <form
                key={`${club}.${cur}`}
                action={createSubscriptionPlanAction}
                className="flex flex-col gap-1 rounded border border-border p-3"
              >
                <input type="hidden" name="gateway" value="paypal" />
                <input type="hidden" name="club" value={club} />
                <input type="hidden" name="currency" value={cur} />
                <input type="hidden" name="mode" value={mode} />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">
                    {club} · {cur}
                    {info ? <span className="text-faint"> — {info.phaseName || info.phaseKey}: {info.price}</span> : null}
                  </span>
                  <button className="bevel bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#1a1408]">
                    {planId ? 'Recrear' : 'Crear plan'}
                  </button>
                </div>
                {planId ? (
                  <span className="truncate text-[11px] text-silver" title={planId}>✓ {planId}</span>
                ) : (
                  <span className="text-[11px] text-faint">Sin plan para esta fase/precio</span>
                )}
                {err ? <span className="text-[11px] text-red-400">⚠ {err}</span> : null}
              </form>
            );
          })}
        </div>
      </div>
    ) : null}
    </div>
  );
}
