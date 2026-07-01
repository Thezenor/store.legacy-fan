'use client';

import { useEffect, useState } from 'react';
import { saveEmailAction, sendTestEmailConfigAction } from '@/lib/admin-actions';

type Values = Record<string, string | boolean>;
const inp = 'mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-foreground';
// Recorta espacios al perder el foco (evita valores con espacios al copiar/pegar).
const trimOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.value = e.currentTarget.value.trim();
};

// Configuración del envío de correos: proveedor (Resend / SMTP / consola),
// remitente, credenciales y envío de prueba.
export function EmailConfig({ values }: { values: Values }) {
  const v = (k: string) => String(values[k] ?? '');
  const set = (k: string) => Boolean(values[`${k}.set`]);
  const savedProvider = v('email.provider') || 'console';
  const [provider, setProvider] = useState<string>(savedProvider);
  // La selección solo cambia cuando el usuario la cambia o cuando se guarda un
  // proveedor distinto (sincroniza con el valor guardado; no salta sola).
  useEffect(() => {
    setProvider(savedProvider);
  }, [savedProvider]);

  return (
    <div className="space-y-4">
      <form action={saveEmailAction} className="rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Envío de correos</h2>
        <p className="mt-1 text-[11px] text-faint">
          Elige el proveedor y sus credenciales. Se usa para verificación de cuenta, recibos,
          avisos de pedido, etc. Los secretos no se muestran; déjalos vacíos para conservarlos.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-muted">Proveedor</span>
            <select name="email.provider" value={provider} onChange={(e) => setProvider(e.target.value)} className={inp}>
              <option value="console">Consola (no envía · pruebas)</option>
              <option value="resend">Resend (API)</option>
              <option value="smtp">SMTP (servidor propio)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-muted">Remitente (From)</span>
            <input name="email.from" defaultValue={v('email.from')} onBlur={trimOnBlur} placeholder="Legacy Fan <no-reply@legacy-fan.com>" className={inp} />
          </label>
        </div>

        {provider === 'resend' ? (
          <fieldset className="mt-4 rounded border border-border p-3">
            <legend className="px-1 text-xs uppercase tracking-wider text-gold-light">Resend</legend>
            <label className="block"><span className="text-xs text-muted">API Key</span>
              <input name="email.resend.api_key" type="password" defaultValue="" onBlur={trimOnBlur} placeholder={set('email.resend.api_key') ? '•••••••• (guardada)' : 're_...'} className={inp} /></label>
          </fieldset>
        ) : null}

        {provider === 'smtp' ? (
          <fieldset className="mt-4 rounded border border-border p-3">
            <legend className="px-1 text-xs uppercase tracking-wider text-gold-light">SMTP</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="text-xs text-muted">Host</span>
                <input name="email.smtp.host" defaultValue={v('email.smtp.host')} onBlur={trimOnBlur} placeholder="smtp.tuservidor.com" className={inp} /></label>
              <label className="block"><span className="text-xs text-muted">Puerto</span>
                <input name="email.smtp.port" type="number" defaultValue={v('email.smtp.port') || '587'} onBlur={trimOnBlur} className={inp} /></label>
              <label className="block"><span className="text-xs text-muted">Usuario</span>
                <input name="email.smtp.user" defaultValue={v('email.smtp.user')} onBlur={trimOnBlur} className={inp} /></label>
              <label className="block"><span className="text-xs text-muted">Contraseña</span>
                <input name="email.smtp.password" type="password" defaultValue="" onBlur={trimOnBlur} placeholder={set('email.smtp.password') ? '•••••••• (guardada)' : ''} className={inp} /></label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="email.smtp.secure" defaultChecked={Boolean(values['email.smtp.secure'] === true || values['email.smtp.secure'] === 'true')} />
              Conexión segura (SSL/TLS · puerto 465)
            </label>
          </fieldset>
        ) : null}

        <button className="bevel mt-4 bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">
          Guardar configuración de correo
        </button>
      </form>

      {/* Enviar email de prueba */}
      <form action={sendTestEmailConfigAction} className="rounded-card border border-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs text-muted">Enviar prueba a</span>
            <input name="to" type="email" onBlur={trimOnBlur} placeholder="tu@correo.com" className={`${inp} w-64`} />
          </label>
          <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">
            Enviar email de prueba
          </button>
        </div>
        {v('email.test_result') ? (
          <p className={`mt-2 text-xs ${v('email.test_result').startsWith('OK') ? 'text-silver' : 'text-red-400'}`}>
            {v('email.test_result')}
          </p>
        ) : null}
        <p className="mt-2 text-[11px] text-faint">Guarda la configuración antes de probar.</p>
      </form>
    </div>
  );
}
