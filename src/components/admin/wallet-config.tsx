'use client';

import { saveWalletAction, generateWalletSecretAction } from '@/lib/admin-actions';

type Values = Record<string, string | boolean>;

const inp = 'mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-foreground';

/**
 * Configuración del carnet digital de socio y futuros pases de Wallet.
 * El QR del carnet solo aparece cuando "wallet.enabled" está activo y hay
 * secreto. Apple/Google quedan preparados pero no se activan hasta tener
 * credenciales de plataforma.
 */
export function WalletConfig({ values }: { values: Values }) {
  const v = (k: string) => String(values[k] ?? '');
  const b = (k: string) => Boolean(values[k]);
  const set = (k: string) => Boolean(values[`${k}.set`]);

  return (
    <div className="space-y-4">
      {/* Carnet digital + token firmado */}
      <form action={saveWalletAction} className="rounded-card border border-border bg-surface p-5">
        <input type="hidden" name="_scope" value="card" />
        <h2 className="font-display text-lg text-gold-light">Carnet digital de socio (QR firmado)</h2>
        <p className="mt-1 text-[11px] text-faint">
          El carnet del panel del socio muestra un QR con un token firmado (HMAC), sin datos
          personales en claro. Se valida en <code>/api/verify-member</code> para la entrada a eventos.
          Da de baja a un socio para revocar su carnet al instante.
        </p>

        <label className="mt-4 flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="enabled" defaultChecked={b('wallet.enabled')} />
          Activar carnet digital y QR de verificación
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-muted">Secreto del token (HMAC)</span>
            <input
              name="wallet.token_secret"
              type="password"
              defaultValue=""
              placeholder={set('wallet.token_secret') ? '•••••••• (guardado)' : 'sin configurar'}
              className={inp}
            />
            <span className="mt-1 block text-[11px] text-faint">
              Déjalo vacío para conservar el actual. Usa el botón de abajo para generar uno seguro.
            </span>
          </label>
          <label className="block">
            <span className="text-xs text-muted">Validez del token (días)</span>
            <input name="wallet.token_ttl_days" type="number" min={1} defaultValue={v('wallet.token_ttl_days') || '365'} className={inp} />
            <span className="mt-1 block text-[11px] text-faint">
              El QR se regenera en cada visita; un pantallazo robado caduca pasado este plazo.
            </span>
          </label>
        </div>

        <button className="bevel mt-4 bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">
          Guardar configuración
        </button>
      </form>

      <form action={generateWalletSecretAction} className="rounded-card border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">
            Generar secreto seguro
          </button>
          <span className="text-xs text-muted">
            Crea y guarda una clave aleatoria de 256 bits. {set('wallet.token_secret') ? 'Ya hay un secreto guardado.' : 'Aún no hay secreto.'}
          </span>
        </div>
      </form>

      {/* Apple & Google Wallet — preparado, no activo */}
      <form action={saveWalletAction} className="rounded-card border border-border bg-surface p-5">
        <h2 className="font-display text-lg text-gold-light">Apple Wallet & Google Wallet</h2>
        <p className="mt-1 text-[11px] text-faint">
          Preparado para añadir el pase a Apple Wallet (.pkpass) y Google Wallet más adelante. Reúne
          aquí las credenciales de plataforma; <strong>no se activará</strong> hasta que estén completas
          y se implemente el generador de pases. Hereda el mismo secreto y verificación de arriba.
        </p>

        <input type="hidden" name="_scope" value="platforms" />

        <fieldset className="mt-4 rounded border border-border p-3">
          <legend className="px-1 text-xs uppercase tracking-wider text-gold-light">Apple Wallet</legend>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="apple_enabled" defaultChecked={b('wallet.apple.enabled')} />
            Marcar Apple Wallet como configurado (no activa nada todavía)
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-xs text-muted">Team ID</span>
              <input name="wallet.apple.team_id" defaultValue={v('wallet.apple.team_id')} className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Pass Type ID</span>
              <input name="wallet.apple.pass_type_id" defaultValue={v('wallet.apple.pass_type_id')} className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Certificado .p12 (base64)</span>
              <input name="wallet.apple.cert_p12" type="password" defaultValue="" placeholder={set('wallet.apple.cert_p12') ? '•••••••• (guardado)' : ''} className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Contraseña del certificado</span>
              <input name="wallet.apple.cert_password" type="password" defaultValue="" placeholder={set('wallet.apple.cert_password') ? '•••••••• (guardado)' : ''} className={inp} /></label>
          </div>
        </fieldset>

        <fieldset className="mt-4 rounded border border-border p-3">
          <legend className="px-1 text-xs uppercase tracking-wider text-gold-light">Google Wallet</legend>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="google_enabled" defaultChecked={b('wallet.google.enabled')} />
            Marcar Google Wallet como configurado (no activa nada todavía)
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-xs text-muted">Issuer ID</span>
              <input name="wallet.google.issuer_id" defaultValue={v('wallet.google.issuer_id')} className={inp} /></label>
            <label className="block"><span className="text-xs text-muted">Service Account (JSON)</span>
              <input name="wallet.google.service_account_json" type="password" defaultValue="" placeholder={set('wallet.google.service_account_json') ? '•••••••• (guardado)' : ''} className={inp} /></label>
          </div>
        </fieldset>

        <button className="bevel mt-4 bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">
          Guardar credenciales de Wallet
        </button>
      </form>
    </div>
  );
}
