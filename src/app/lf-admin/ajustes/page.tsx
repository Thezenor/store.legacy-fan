import { prisma } from '@/lib/prisma';
import { updateSettingAction } from '@/lib/admin-actions';

// Claves cuyo VALOR es secreto: nunca se envía al navegador (solo un
// indicador de presencia). Editar desde sus paneles dedicados (Config/Carnet)
// o escribiendo un valor nuevo aquí (campo vacío = conservar).
const SECRET_PATTERNS = [
  /secret/i,
  /password/i,
  /api_key/i,
  /client_secret/i,
  /service_account/i,
  /cert_p12/i,
  /webhook_id/i,
];
const isSecretKey = (key: string) => SECRET_PATTERNS.some((re) => re.test(key));

// Edición de la configuración del sistema (valor JSON). Todo configurable (doc 00/09).
export default async function AdminAjustes() {
  const settings = await prisma.systemSetting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Ajustes del sistema</h1>
      <p className="mt-1 text-sm text-muted">
        {settings.length} parámetros (valor en JSON). Los secretos no se muestran: escribe un valor
        nuevo para sustituirlos o déjalos vacíos para conservarlos.
      </p>
      <div className="mt-6 space-y-2">
        {settings.map((s) => {
          const secret = isSecretKey(s.key);
          const hasValue = s.value !== null && String(s.value) !== '';
          return (
            <form
              key={s.id}
              action={updateSettingAction}
              className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
            >
              <input type="hidden" name="key" value={s.key} />
              {secret ? <input type="hidden" name="secret" value="1" /> : null}
              <div className="min-w-[220px] flex-1">
                <div className="font-mono text-xs text-foreground">
                  {s.key} {secret ? <span className="text-gold-light">🔒</span> : null}
                </div>
                <div className="text-[11px] text-faint">{s.group ?? '—'}</div>
              </div>
              <input
                name="value"
                type={secret ? 'password' : 'text'}
                defaultValue={secret ? '' : JSON.stringify(s.value)}
                placeholder={secret ? (hasValue ? '•••••••• (guardado)' : '(vacío)') : ''}
                autoComplete="off"
                className="min-w-[160px] flex-1 rounded border border-border bg-background px-2 py-1.5 font-mono text-xs text-gold-light"
              />
              <button
                type="submit"
                className="rounded border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold-light transition hover:bg-surface-elevated"
              >
                Guardar
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
