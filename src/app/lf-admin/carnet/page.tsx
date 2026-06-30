import { prisma } from '@/lib/prisma';
import { WalletConfig } from '@/components/admin/wallet-config';

export const dynamic = 'force-dynamic';

// Claves no secretas que sí se muestran con su valor en el panel.
const PLAIN_KEYS = [
  'wallet.enabled',
  'wallet.token_ttl_days',
  'wallet.apple.enabled',
  'wallet.apple.team_id',
  'wallet.apple.pass_type_id',
  'wallet.google.enabled',
  'wallet.google.issuer_id',
];
// Secretos: nunca se envían al cliente; solo un flag `<key>.set` de presencia.
const SECRET_KEYS = [
  'wallet.token_secret',
  'wallet.apple.cert_p12',
  'wallet.apple.cert_password',
  'wallet.google.service_account_json',
];

export default async function AdminCarnet() {
  const rows = await prisma.systemSetting.findMany({ where: { group: 'wallet' } });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const values: Record<string, string | boolean> = {};
  for (const k of PLAIN_KEYS) {
    const v = map.get(k);
    if (v != null) values[k] = typeof v === 'boolean' ? v : String(v);
  }
  for (const k of SECRET_KEYS) {
    const v = map.get(k);
    values[`${k}.set`] = v != null && String(v) !== '';
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-foreground">Carnet digital y Wallet</h1>
      <p className="mt-1 text-sm text-muted">
        Carnet virtual del socio con QR firmado para verificación e (más adelante) pases de Apple
        Wallet y Google Wallet. Los datos del QR van firmados y sin información personal en claro.
      </p>

      <div className="mt-6 max-w-3xl">
        <WalletConfig values={values} />
      </div>
    </div>
  );
}
