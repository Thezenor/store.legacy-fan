import { prisma } from '@/lib/prisma';
import {
  createAmbassadorAction,
  updateAmbassadorAction,
  reactivateAmbassadorAction,
  linkAmbassadorUserAction,
} from '@/lib/admin-actions';

export const dynamic = 'force-dynamic';

const inp = 'rounded border border-border bg-background px-2 py-1.5 text-foreground';
const btn = 'border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light hover:bg-surface-elevated';
const MODELS = ['A', 'B', 'C'];
const STATUSES = ['ACTIVO', 'SUSPENDIDO', 'CANCELADO'];
const PAYOUTS = ['', 'PAYPAL', 'TRANSFERENCIA', 'CREDITO'];
const MODEL_LABEL: Record<string, string> = { A: 'A · Comisión', B: 'B · Descuento', C: 'C · Mixto' };
const fmtDate = (d: Date | null) => (d ? new Intl.DateTimeFormat('es', { dateStyle: 'short' }).format(d) : '—');
const toInput = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default async function AdminEmbajadores({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; saved?: string; error?: string; code?: string }>;
}) {
  const sp = await searchParams;
  const ambassadors = await prisma.ambassador.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { signups: true } } },
  });
  const now = Date.now();

  const ERR: Record<string, string> = {
    name: 'Falta el nombre.',
    codelen: 'El código debe tener entre 12 y 26 caracteres.',
    dup: `Ya existe un embajador con el código ${sp.code ?? ''}. Añade un distintivo (p. ej. …UK).`,
    email: 'Email de acceso inválido.',
    pass: 'La contraseña debe tener al menos 8 caracteres (cuenta nueva).',
    userlinked: 'Ese usuario ya está vinculado a otro embajador.',
  };

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-foreground">Embajadores</h1>
      <p className="mt-1 text-sm text-muted">
        Alta y gestión de embajadores. El código se genera como <span className="serial">LEGACY + NOMBRE</span> y es permanente.
      </p>

      {sp.created ? (
        <p className="mt-3 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-300">
          ✓ Embajador creado con código <span className="serial">{sp.created}</span>.
        </p>
      ) : null}
      {sp.saved ? (
        <p className="mt-3 rounded border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm text-green-300">
          ✓ Cambios guardados{sp.saved === 'reactivated' ? ' · código reactivado' : ''}.
        </p>
      ) : null}
      {sp.error ? (
        <p className="mt-3 rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {ERR[sp.error] ?? 'No se pudo completar la operación.'}
        </p>
      ) : null}

      {/* Alta */}
      <div className="mt-4 rounded-card border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-light">Dar de alta un embajador</h2>
        <form action={createAmbassadorAction} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block"><span className="text-xs text-muted">Nombre / marca</span>
            <input name="name" required className={`mt-1 w-48 ${inp}`} placeholder="Silver Dragons" /></label>
          <label className="block"><span className="text-xs text-muted">Código (opcional)</span>
            <input name="code" className={`mt-1 w-52 ${inp}`} placeholder="auto: LEGACYSILVERDRAGONS" /></label>
          <label className="block"><span className="text-xs text-muted">Modelo</span>
            <select name="model" className={`mt-1 ${inp}`}>{MODELS.map((m) => <option key={m} value={m}>{MODEL_LABEL[m]}</option>)}</select></label>
          <label className="block"><span className="text-xs text-muted">Canal / URL</span>
            <input name="channelUrl" className={`mt-1 w-52 ${inp}`} placeholder="youtube.com/@…" /></label>
          <label className="block"><span className="text-xs text-muted">Segmento</span>
            <input name="segment" className={`mt-1 w-36 ${inp}`} /></label>
          <label className="block"><span className="text-xs text-muted">Idioma</span>
            <select name="locale" className={`mt-1 ${inp}`}><option value="">—</option><option value="es">ES</option><option value="en">EN</option><option value="fr">FR</option><option value="it">IT</option></select></label>
          <button className="bevel bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a1408]">Crear</button>
        </form>
      </div>

      <p className="mt-6 text-sm text-muted">{ambassadors.length} embajadores</p>

      <div className="mt-2 space-y-4">
        {ambassadors.length === 0 ? (
          <p className="rounded-card border border-border bg-surface p-6 text-center text-muted">Aún no hay embajadores.</p>
        ) : ambassadors.map((a) => {
          const lapsed = a.reactivateBy ? new Date(a.reactivateBy).getTime() < now : false;
          return (
            <div key={a.id} className="rounded-card border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="serial text-gold-light">{a.code}</span>{' '}
                  <span className="text-foreground">· {a.name}</span>
                  <span className="ml-2 text-xs text-faint">{a._count.signups} altas</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${a.status === 'ACTIVO' ? 'bg-gold/15 text-gold-light' : 'border border-red-500/40 text-red-400'}`}>{a.status.toLowerCase()}</span>
                  {lapsed ? <span className="rounded-full border border-amber-500/40 px-2 py-0.5 text-amber-400">sin reactivar (no devenga)</span> : null}
                </div>
              </div>

              <form action={updateAmbassadorAction} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input type="hidden" name="id" value={a.id} />
                <label className="block"><span className="text-[11px] text-muted">Nombre</span><input name="name" defaultValue={a.name} className={`mt-1 w-full ${inp}`} /></label>
                <label className="block"><span className="text-[11px] text-muted">Modelo</span><select name="model" defaultValue={a.model} className={`mt-1 w-full ${inp}`}>{MODELS.map((m) => <option key={m} value={m}>{MODEL_LABEL[m]}</option>)}</select></label>
                <label className="block"><span className="text-[11px] text-muted">Estado</span><select name="status" defaultValue={a.status} className={`mt-1 w-full ${inp}`}>{STATUSES.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}</select></label>
                <label className="block"><span className="text-[11px] text-muted">Canal / URL</span><input name="channelUrl" defaultValue={a.channelUrl ?? ''} className={`mt-1 w-full ${inp}`} /></label>
                <label className="block"><span className="text-[11px] text-muted">Segmento</span><input name="segment" defaultValue={a.segment ?? ''} className={`mt-1 w-full ${inp}`} /></label>
                <label className="block"><span className="text-[11px] text-muted">Idioma</span><input name="locale" defaultValue={a.locale ?? ''} className={`mt-1 w-full ${inp}`} /></label>
                <label className="block"><span className="text-[11px] text-muted">Método de cobro</span><select name="payoutMethod" defaultValue={a.payoutMethod ?? ''} className={`mt-1 w-full ${inp}`}>{PAYOUTS.map((p) => <option key={p} value={p}>{p ? p.toLowerCase() : '—'}</option>)}</select></label>
                <label className="block"><span className="text-[11px] text-muted">Caduca (reactivación)</span><input name="reactivateBy" type="date" defaultValue={toInput(a.reactivateBy)} className={`mt-1 w-full ${inp}`} /></label>
                <label className="flex items-end gap-2 pb-1 text-[11px] text-muted"><input type="checkbox" name="fiscalOk" defaultChecked={a.fiscalOk} /> Datos fiscales OK</label>

                <details className="sm:col-span-3">
                  <summary className="cursor-pointer text-[11px] text-gold-light">Datos fiscales (para autofactura)</summary>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input name="fiscalName" defaultValue={a.fiscalName ?? ''} placeholder="Nombre fiscal / razón social" className={inp} />
                    <input name="fiscalId" defaultValue={a.fiscalId ?? ''} placeholder="NIF / VAT / TIN" className={inp} />
                    <input name="fiscalAddress" defaultValue={a.fiscalAddress ?? ''} placeholder="Dirección fiscal" className={inp} />
                    <input name="fiscalCountry" defaultValue={a.fiscalCountry ?? ''} placeholder="País (ISO)" className={inp} />
                    <input name="notes" defaultValue={a.notes ?? ''} placeholder="Notas" className={`sm:col-span-2 ${inp}`} />
                  </div>
                </details>

                <div className="sm:col-span-3 flex items-center gap-3">
                  <button className={btn}>Guardar</button>
                  <span className="text-[11px] text-faint">Alta: {fmtDate(a.createdAt)} · Reactivado: {fmtDate(a.reactivatedAt)}</span>
                </div>
              </form>

              <div className="mt-2 flex flex-wrap items-center gap-4">
                <form action={reactivateAmbassadorAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-[11px] text-gold hover:underline">Reactivar código (reinicia caducidad)</button>
                </form>
                <form action={linkAmbassadorUserAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <span className="text-[11px] text-muted">Acceso al panel:</span>
                  <input name="email" type="email" placeholder="email" className={`text-[11px] ${inp}`} />
                  <input name="password" type="text" placeholder="contraseña (si es nuevo)" className={`text-[11px] ${inp}`} />
                  <button className="text-[11px] text-gold-light hover:underline">{a.userId ? 'Actualizar acceso' : 'Crear acceso'}</button>
                  {a.userId ? <span className="text-[11px] text-green-300">✓ vinculado</span> : null}
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
