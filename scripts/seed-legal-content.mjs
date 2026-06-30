// Carga contenido legal REAL (ES) en LegalPage. Base orientativa: revisar con
// asesor legal y completar los datos entre corchetes antes de la apertura.
// Uso: NODE_OPTIONS=--use-system-ca node scripts/seed-legal-content.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const EMPRESA = 'Legacy Fan';
const EMAIL = 'info@legacy-fan.com';
const SEDE = 'Dover, Delaware (EE. UU.)';

const DOCS = {
  'aviso-legal': {
    title: 'Aviso legal',
    body: `AVISO LEGAL E IDENTIFICACIÓN DEL PRESTADOR

Titular del sitio: ${EMPRESA} [completar razón social].
Domicilio: ${SEDE} [completar dirección registral completa].
Identificación fiscal / registro: [completar NIF/EIN y datos registrales].
Correo de contacto: ${EMAIL}.
Sitio web: store.legacy-fan.com.

Objeto. Este sitio es una tienda en línea de membresías de coleccionismo (Legacy Prime Club y Legacy Prestige Club) y de piezas coleccionables en metales preciosos.

Condiciones de uso. El acceso y uso del sitio implica la aceptación de este Aviso Legal, de los Términos y Condiciones, de la Política de Privacidad y de la Política de Cookies.

Propiedad intelectual. Los contenidos, marcas, logotipos, diseños e imágenes son propiedad de ${EMPRESA} o de terceros con licencia, y no pueden reproducirse sin autorización.

Responsabilidad. ${EMPRESA} no se responsabiliza del mal uso del sitio ni de interrupciones ajenas a su control. Los enlaces a sitios de terceros se ofrecen solo a título informativo.

Legislación y jurisdicción. Ver el apartado correspondiente en los Términos y Condiciones.`,
  },

  terms: {
    title: 'Términos y condiciones',
    body: `TÉRMINOS Y CONDICIONES DE VENTA Y USO

1. Identificación. Titular: ${EMPRESA} [razón social], con domicilio en ${SEDE} y correo ${EMAIL}.

2. Objeto. Regulan el alta de socio, la reserva, el pago y la entrega de las membresías Legacy Prime Club y Legacy Prestige Club y de las piezas coleccionables asociadas.

3. Naturaleza del producto. Los productos son artículos COLECCIONABLES en metales preciosos. NO constituyen un producto financiero, ni una inversión, ni una promesa de rentabilidad o revalorización.

4. Proceso de compra. (a) Reserva: depósito de 50 €/$ que asegura tu plaza, es reembolsable según el punto 8 y se descuenta del pago completo. (b) Pago completo: abona el precio de la membresía; al completarse se asigna un número de socio permanente. Verás el precio y los impuestos aplicables antes de confirmar.

5. Membresía y renovación. La membresía es ANUAL. Cuando se contrata como suscripción, se RENUEVA AUTOMÁTICAMENTE cada 12 meses por el importe vigente, cargándose en tu método de pago salvo que la canceles antes de la fecha de renovación desde tu cuenta (sección «Suscripción»). El número de socio es permanente aunque no renueves.

6. Segunda moneda (Prestige). Podrás reservar la segunda moneda con un depósito o adquirirla con el descuento indicado; los descuentos se aplican sobre el premium, nunca sobre el valor spot del metal.

7. Precios e impuestos. Los precios se muestran en EUR o USD según selección. Los impuestos y gastos de envío aplicables se indican antes de finalizar la compra.

8. Derecho de desistimiento. Si eres consumidor en la UE dispones de 14 días naturales para desistir, salvo las excepciones legales (p. ej. bienes confeccionados a medida o personalizados, o servicios ya ejecutados con tu consentimiento). El depósito de reserva es reembolsable hasta el cierre/lanzamiento según se indique. Para ejercerlo, escribe a ${EMAIL}.

9. Mystery Box. El contenido mantiene un factor sorpresa, garantizando siempre el mínimo indicado en cada categoría.

10. Puntos, descuentos y referidos. Se rigen por sus condiciones específicas. Los puntos y descuentos se aplican solo sobre el premium. El saldo de referidos es interno y no retirable en efectivo.

11. Entrega. Los plazos y costes de envío se detallan en la Política de Envíos. La prioridad de preventa puede variar por categoría.

12. Cancelación y reembolsos. Ver Política de Devoluciones y el punto 5 para la suscripción.

13. Protección de datos. Tratamos tus datos conforme a la Política de Privacidad.

14. Ley aplicable y jurisdicción. [Indicar la legislación aplicable y los tribunales competentes; para consumidores de la UE se respetarán las normas imperativas de protección de su país de residencia.]

15. Contacto. ${EMAIL}.`,
  },

  privacy: {
    title: 'Política de privacidad',
    body: `POLÍTICA DE PRIVACIDAD (RGPD)

1. Responsable del tratamiento: ${EMPRESA} [razón social], ${SEDE}. Contacto: ${EMAIL}.

2. Datos que tratamos. Datos de registro y perfil (nombre, apellidos, correo, teléfono, país), datos de compra y membresía, y datos técnicos de navegación. No almacenamos los datos completos de tarjeta: el pago lo procesa la pasarela (PayPal).

3. Finalidades y base jurídica. (a) Gestionar tu cuenta, reserva, pago y membresía — ejecución del contrato. (b) Enviar comunicaciones de servicio — ejecución del contrato. (c) Newsletter y comunicaciones comerciales — consentimiento. (d) Cumplimiento de obligaciones legales y fiscales — obligación legal. (e) Prevención del fraude y seguridad — interés legítimo.

4. Conservación. Conservamos los datos mientras exista la relación y, después, durante los plazos legales (fiscales, contables) que correspondan.

5. Destinatarios y encargados. Compartimos datos con proveedores que nos prestan servicio: pasarela de pago (PayPal), envío de correos (Resend), alojamiento (Railway) y, en su caso, transporte. Actúan como encargados conforme a contrato.

6. Transferencias internacionales. Algunos proveedores pueden estar fuera del EEE; en tal caso se aplican garantías adecuadas (cláusulas contractuales tipo u otras).

7. Tus derechos. Acceso, rectificación, supresión, oposición, limitación y portabilidad. Para ejercerlos escribe a ${EMAIL}. Puedes reclamar ante la autoridad de control competente.

8. Seguridad. Aplicamos medidas técnicas y organizativas razonables (contraseñas cifradas, control de acceso, conexiones seguras).

9. Menores. El servicio no está dirigido a menores de edad.

10. Cambios. Podremos actualizar esta política; publicaremos la versión vigente en esta página.`,
  },

  cookies: {
    title: 'Política de cookies',
    body: `POLÍTICA DE COOKIES

1. Qué son. Las cookies y tecnologías similares son pequeños archivos que se almacenan en tu dispositivo para que el sitio funcione y para recordar tus preferencias.

2. Cookies que usamos. (a) Técnicas/necesarias: sesión e inicio de sesión, preferencia de idioma y de divisa, tema claro/oscuro y consentimiento de cookies. Son imprescindibles y no requieren consentimiento. (b) Analíticas o de terceros: solo se activarán si las incorporamos y con tu consentimiento previo.

3. Gestión del consentimiento. Al entrar verás un aviso para aceptar o rechazar las cookies no necesarias. Puedes cambiar tu elección borrando las cookies del navegador.

4. Cómo desactivarlas. Puedes configurar tu navegador para bloquear o eliminar cookies; algunas funciones podrían dejar de operar correctamente.

5. Terceros. Servicios como PayPal pueden instalar sus propias cookies al usar su pasarela; consulta sus políticas.

6. Contacto. ${EMAIL}.`,
  },

  returns: {
    title: 'Política de devoluciones y desistimiento',
    body: `DEVOLUCIONES Y DERECHO DE DESISTIMIENTO

1. Desistimiento. Si eres consumidor en la UE, dispones de 14 días naturales desde la recepción para desistir, salvo excepciones legales (bienes personalizados/confeccionados a medida, o servicios ya prestados con tu consentimiento expreso).

2. Depósito de reserva. El depósito de 50 €/$ es reembolsable hasta el cierre o lanzamiento según se indique en cada campaña; pasado ese momento puede no ser reembolsable.

3. Suscripción. Puedes cancelar la renovación automática en cualquier momento desde tu cuenta; la cancelación evita futuros cobros y no genera derecho a reembolso del periodo ya iniciado, salvo lo que exija la ley.

4. Productos dañados o erróneos. Si recibes una pieza defectuosa o incorrecta, contáctanos en 14 días para su sustitución o reembolso.

5. Cómo solicitarlo. Escribe a ${EMAIL} indicando tu número de socio o pedido. Te indicaremos los pasos.

6. Reembolsos. Se efectúan por el mismo medio de pago en un plazo razonable tras aprobar la devolución.`,
  },

  shipping: {
    title: 'Política de envíos',
    body: `POLÍTICA DE ENVÍOS

1. Ámbito. Realizamos envíos a los países habilitados en cada campaña.

2. Plazos. Los plazos dependen del lanzamiento de cada pieza y del destino; se informan en la ficha y en tu cuenta. Las piezas en preventa se envían tras su producción.

3. Gastos. Los gastos de envío se calculan y muestran antes de finalizar la compra. Determinadas categorías pueden incluir envío gratuito según se indique.

4. Aduanas. En envíos internacionales pueden aplicarse aranceles o impuestos en destino, a cargo del destinatario salvo indicación contraria.

5. Seguimiento. Te facilitaremos la información de seguimiento cuando el envío salga.

6. Incidencias. Ante extravíos o daños en transporte, contáctanos en ${EMAIL}.`,
  },

  membership: {
    title: 'Condiciones de membresía',
    body: `CONDICIONES DE MEMBRESÍA

1. Niveles. Legacy Prime Club y Legacy Prestige Club, con los beneficios descritos en cada página de club.

2. Alta. La membresía se activa con el pago completo, que asigna un número de socio permanente y único.

3. Duración y renovación. La membresía es anual. Si se contrata como suscripción, se renueva automáticamente cada 12 meses por el importe vigente, salvo cancelación previa desde tu cuenta (sección «Suscripción»). Te informaremos del importe antes de cada renovación cuando la ley lo exija.

4. Cancelación. Puedes cancelar la renovación en cualquier momento desde tu cuenta; conservarás el acceso hasta el final del periodo ya pagado. El número de socio es permanente.

5. Beneficios. Acceso a comunidad privada, preventas, contenidos y demás ventajas del nivel. La prioridad de preventa puede quedar por detrás de categorías superiores.

6. Impago/suspensión. El impago de una renovación puede suspender los beneficios hasta su regularización.

7. Modificaciones. Podremos actualizar los beneficios y condiciones, informando con antelación razonable.`,
  },

  points: {
    title: 'Condiciones del programa de puntos',
    body: `PROGRAMA DE PUNTOS

1. Obtención. Acumulas puntos por compras según el ratio vigente.

2. Base de cálculo. Los puntos y descuentos se aplican SOLO sobre el premium, NUNCA sobre el valor spot del metal.

3. Canje. Los puntos pueden canjearse según las reglas y el saldo disponibles en tu cuenta.

4. Caducidad. Los puntos caducan según el plazo configurado (por defecto, a los años indicados desde su obtención).

5. Naturaleza. Los puntos no son dinero, no son canjeables por efectivo ni transferibles, salvo que se indique lo contrario.

6. Cambios. Podremos ajustar el programa informando con antelación razonable.`,
  },

  referrals: {
    title: 'Condiciones del programa de referidos',
    body: `PROGRAMA DE REFERIDOS

1. Funcionamiento. Comparte tu enlace o código; cuando la persona referida complete su alta como socio se activa la recompensa configurada.

2. Recompensa. La recompensa se abona como SALDO INTERNO, no es dinero ni retirable en efectivo, y se aplica a futuras compras.

3. Condiciones. No se admiten autorreferidos ni cuentas fraudulentas o duplicadas; ${EMPRESA} podrá anular recompensas obtenidas de forma irregular.

4. Cambios. Podremos modificar o finalizar el programa informando con antelación razonable.

5. Contacto. ${EMAIL}.`,
  },
};

async function main() {
  for (const [slug, doc] of Object.entries(DOCS)) {
    await prisma.legalPage.upsert({
      where: { slug_locale: { slug, locale: 'es' } },
      update: { title: doc.title, body: doc.body },
      create: { slug, locale: 'es', title: doc.title, body: doc.body },
    });
    console.log('guardado:', slug);
  }
  await prisma.$disconnect();
}
main();
