# 20 — Carnet digital y Wallet (Apple / Google)

Carnet virtual de socio con QR firmado para verificación en eventos, y base
preparada para pases de Apple Wallet y Google Wallet.

## Estado actual

| Pieza | Estado |
|---|---|
| Carnet virtual (anverso + reverso) en `/account` | ✅ visible desde el primer pago |
| QR firmado en el reverso | ✅ solo si el sistema está activo en el panel |
| Token de socio (HMAC, sin datos personales) | ✅ |
| Endpoint de verificación `/api/verify-member` | ✅ |
| Pantalla de puerta `/verify` (✓/✗) | ✅ |
| Panel superadmin **Carnet y Wallet** | ✅ |
| Revocación instantánea (baja del socio) | ✅ |
| Pase Apple Wallet (`.pkpass`) | 🟡 preparado, faltan credenciales + generador |
| Pase Google Wallet (JWT) | 🟡 preparado, faltan credenciales + generador |

El sistema está **apagado por defecto**. No bloquea el entorno: el carnet se
muestra sin QR hasta que se active en el panel.

## Arquitectura ("datos limitados pero cifrados")

El QR **no contiene datos personales en claro**. Lleva un token compacto
firmado con HMAC-SHA256:

```
base64url({ v, sub:userId, num:LF-000051, tier, iat, exp }) . base64url(HMAC)
```

- El portador no puede leer ni falsificar el token (clave secreta solo en el
  servidor).
- La verificación real (identidad, estado, revocación) ocurre en el servidor.
- **Revocación**: dar de baja al socio invalida el carnet al instante (la
  verificación comprueba `status === SOCIO_ACTIVO` y que el número coincide).
- El token caduca (TTL configurable, por defecto 365 días) y el QR se regenera
  en cada visita al panel, así un pantallazo robado expira.

### Ficheros

- `src/lib/members/pass-token.ts` — firma/verificación del token (crypto nativo,
  sin dependencias), `issueMemberToken`, `isWalletEnabled`, `generatePassSecret`.
- `src/lib/members/verify.ts` — `verifyMemberByToken` (firma + caducidad + estado
  en BD). Compartido por API y pantalla.
- `src/app/api/verify-member/route.ts` — verificación JSON (uso programático).
- `src/app/verify/page.tsx` — pantalla de puerta ✓/✗ (destino del QR).
- `src/components/brand/member-card.tsx` — carnet (anverso/reverso + QR).
- `src/app/lf-admin/carnet/page.tsx` + `src/components/admin/wallet-config.tsx`
  — configuración en el panel.

### Settings (grupo `wallet`)

| Clave | Tipo | Uso |
|---|---|---|
| `wallet.enabled` | bool | activa carnet/QR |
| `wallet.token_secret` | secreto | clave HMAC (o env `MEMBER_PASS_SECRET`) |
| `wallet.token_ttl_days` | número | validez del token (por defecto 365) |
| `wallet.apple.enabled` | bool | marca Apple como configurado (no activa nada aún) |
| `wallet.apple.team_id` | texto | Team ID de Apple Developer |
| `wallet.apple.pass_type_id` | texto | identificador del tipo de pase |
| `wallet.apple.cert_p12` | secreto | certificado de firma (base64) |
| `wallet.apple.cert_password` | secreto | contraseña del `.p12` |
| `wallet.google.enabled` | bool | marca Google como configurado |
| `wallet.google.issuer_id` | texto | Issuer ID de Google Wallet |
| `wallet.google.service_account_json` | secreto | credenciales de service account |

Los secretos nunca se envían al cliente: el panel solo muestra un indicador
`(guardado)`.

## Activar el carnet (cuando se quiera)

1. Panel → **Carnet y Wallet**.
2. Pulsar **"Generar secreto seguro"** (crea `wallet.token_secret`).
3. Marcar **"Activar carnet digital y QR de verificación"** y guardar.
4. El QR aparece automáticamente en el reverso del carnet de cada socio.
5. Para el control en puerta: escanear el QR con la cámara del móvil → abre
   `/verify` con el resultado ✓/✗.

## Obtener credenciales — Apple Wallet (`.pkpass`)

Requiere cuenta **Apple Developer** de pago (99 USD/año).

1. **Pass Type ID**: developer.apple.com → Certificates, IDs & Profiles →
   Identifiers → `+` → *Pass Type IDs* → crear `pass.com.legacy-fan.member`.
   → guardar como `wallet.apple.pass_type_id`.
2. **Certificado de firma**: en ese Pass Type ID → *Create Certificate* → subir
   un CSR (generado con Acceso a Llaveros en macOS o con OpenSSL) → descargar el
   `.cer`. Convertir a `.p12` (con la clave privada) y guardarlo en base64 en
   `wallet.apple.cert_p12`; la contraseña en `wallet.apple.cert_password`.
3. **Team ID**: visible en la esquina superior derecha de la cuenta de
   desarrollador → `wallet.apple.team_id`.
4. **WWDR**: el certificado intermediario de Apple (Worldwide Developer
   Relations) se incluye en el `.pkpass` al firmarlo (lo gestionará el generador).

## Obtener credenciales — Google Wallet (JWT)

Gratis. Requiere proyecto en **Google Cloud**.

1. console.cloud.google.com → crear proyecto → habilitar **Google Wallet API**.
2. Solicitar una cuenta de emisor en pay.google.com/business/console → obtener el
   **Issuer ID** → `wallet.google.issuer_id`.
3. Crear una **Service Account** → generar clave JSON → pegarla en
   `wallet.google.service_account_json`. Darle permiso de emisor en la consola
   de Google Wallet.
4. El pase se entrega con un botón "Add to Google Wallet" que lleva un JWT
   firmado con esa service account (lo generará el backend).

## Cómo encaja el generador futuro

Ambos pases reutilizan **el mismo token y la misma verificación** ya construidos:

- El QR del pase apunta a `/verify?token=...` (idéntico al del panel).
- Solo falta el código que **empaqueta** el pase para cada plataforma:
  - Apple: construir el `.pkpass` (ZIP firmado con el `.p12` + WWDR) y servirlo
    desde una ruta tipo `/api/wallet/apple?...`.
  - Google: construir el objeto/clase de Wallet y firmar el JWT con la service
    account; botón "Add to Google Wallet".
- Las actualizaciones remotas (cambio de nivel, baja) son opcionales y se
  añaden con el web service de Apple y la API de objetos de Google.
