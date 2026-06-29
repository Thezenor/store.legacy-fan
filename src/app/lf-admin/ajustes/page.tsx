import { prisma } from '@/lib/prisma';

// Lectura de la configuración del sistema (la edición CRUD llega en próxima iteración).
export default async function AdminAjustes() {
  const settings = await prisma.systemSetting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Ajustes del sistema</h1>
      <p className="mt-1 text-sm text-muted">{settings.length} parámetros (solo lectura por ahora)</p>
      <div className="mt-6 overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="px-4 py-3">Grupo</th>
              <th className="px-4 py-3">Clave</th>
              <th className="px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 text-faint">{s.group ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-foreground">{s.key}</td>
                <td className="px-4 py-3 font-mono text-xs text-gold-light">{JSON.stringify(s.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
