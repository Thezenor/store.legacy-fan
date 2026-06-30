import { verifyMemberByToken } from '@/lib/members/verify';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Pantalla de control en puerta: se abre al escanear el QR del carnet. Muestra
// un resultado claro ✓/✗ para el personal del evento. Sin indexar.
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const r = await verifyMemberByToken(token ?? '');

  const ok = r.status === 'valid';
  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date(iso));

  const NEGATIVE: Record<string, { title: string; detail: string }> = {
    disabled: { title: 'Sistema no activo', detail: 'La verificación de carnets no está habilitada.' },
    not_configured: { title: 'Sin configurar', detail: 'Falta el secreto del token en el panel.' },
    missing_token: { title: 'Sin código', detail: 'No se ha recibido ningún token para verificar.' },
    malformed: { title: 'Código no válido', detail: 'El código QR no tiene un formato reconocible.' },
    bad_signature: { title: 'Carnet falso', detail: 'La firma no es válida: el código no lo emitió Legacy Fan.' },
    expired: { title: 'Código caducado', detail: 'Este QR ha expirado. Pide al socio que abra de nuevo su carnet.' },
    revoked: { title: 'Socio no activo', detail: 'El carnet ya no está vigente (baja o número cambiado).' },
  };
  const neg =
    r.status === 'invalid'
      ? NEGATIVE[r.reason]
      : r.status !== 'valid'
        ? NEGATIVE[r.status]
        : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0c] px-6 py-12 text-center">
      <div className="w-full max-w-sm">
        {/* Marca */}
        <div className="font-display text-sm uppercase tracking-[0.28em] text-metal-gold">Legacy Fan</div>
        <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-gold-light/60">Verificación de socio</p>

        {/* Resultado */}
        <div
          className={`mt-8 rounded-2xl border p-8 shadow-card ${
            ok ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'
          }`}
        >
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
              ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
            }`}
            aria-hidden
          >
            {ok ? '✓' : '✕'}
          </div>

          {ok ? (
            <>
              <h1 className="mt-5 font-display text-2xl font-semibold text-green-400">Carnet válido</h1>
              <dl className="mt-6 space-y-3 text-left">
                {r.name ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-gold-light/60">Socio</dt>
                    <dd className="font-display text-lg text-foreground">{r.name}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-gold-light/60">Número</dt>
                  <dd className="font-display text-2xl text-metal-gold">{r.number}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-gold-light/60">Nivel</dt>
                  <dd className="text-foreground">{r.tier}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-gold-light/60">Válido hasta</dt>
                  <dd className="text-muted">{fmtDate(r.expiresAt)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <h1 className="mt-5 font-display text-2xl font-semibold text-red-400">
                {neg?.title ?? 'No válido'}
              </h1>
              <p className="mt-3 text-sm text-muted">{neg?.detail ?? 'No se pudo verificar el carnet.'}</p>
              {r.status === 'revoked' ? (
                <p className="mt-4 font-display text-lg text-foreground/70">{r.number}</p>
              ) : null}
            </>
          )}
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-gold-light/50">
          Verificado en el servidor de Legacy Fan. El código no contiene datos personales:
          solo un identificador firmado.
        </p>
      </div>
    </main>
  );
}
