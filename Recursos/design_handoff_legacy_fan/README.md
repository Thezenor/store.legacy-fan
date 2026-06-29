# Handoff: Legacy Fan — Marketplace + Panel de Administración

## Overview
Plataforma de dos partes para **Legacy Fan**, marca de obras de arte coleccionables en metales preciosos (plata .999, oro .999, cobre .999), acuñadas en ediciones limitadas con licencias oficiales y certificado de autenticidad.

1. **Marketplace** (web) — tienda de cara al cliente: home, catálogo con filtros, ficha de producto, carrito.
2. **Panel de Super-Administración** — gestión interna: dashboard, productos, inventario/tiradas, pedidos, CRM, distribuidores/comisiones, certificados.

Ambas vistas viven en un único prototipo (`Legacy Fan Marketplace.dc.html`) y se conmutan con un toggle **MARKETPLACE / ADMIN** en la barra superior. Se incluye además `Legacy Fan Branding.dc.html`, el **manual de marca** (logo, paleta, tipografía, materiales, voz) que rige el sistema visual de ambas.

### Catálogo y colecciones reales
Colecciones: **World Peace**, **Legends of War**, **Top Sports**, **Legacy Fan Club**. Piezas de muestra alineadas con el sitio: World Peace, Ganesha .01, Two Faces of the Moon .01, Viking Raider. Atributos de pieza: 2oz · Plata .999 (con Oro Selectivo en algunas) · Antiqued Finish · Ultra High Relief · 50mm · edición numerada. Tiradas típicas 299 / 499 / 999 según demanda.

## About the Design Files
Los archivos de este paquete (`Legacy Fan Marketplace.dc.html`, `Legacy Fan Branding.dc.html` + su runtime `support.js`) son **referencias de diseño creadas en HTML** — prototipos que muestran el aspecto y comportamiento previstos, **no** código de producción para copiar directamente.

La tarea es **recrear estos diseños en el entorno del codebase destino** (React, Vue, etc.), usando sus patrones y librerías establecidos. Si no existe codebase aún, elegir el framework más apropiado (se recomienda **React + TypeScript** con un router y una librería de estilos como Tailwind o CSS Modules) e implementar allí.

> Nota técnica: el `.dc.html` es un "Design Component" — el markup va entre `<x-dc>`, con estilos inline y una clase `Component` que expone los datos/handlers. No es necesario replicar este runtime; sirve solo para abrir el prototipo en un navegador y leer la lógica.

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciado e interacciones son finales. Recrear la UI pixel-perfect con las librerías del codebase. Los datos mostrados son de muestra (mock) y deben sustituirse por datos reales de API.

---

## Design Tokens

### Colores
| Token | Hex | Uso |
|---|---|---|
| Fondo base | `#08080a` | Fondo de página |
| Fondo elevado | `#0a0a0c` / `#0b0b0d` / `#0e0e10` | Sidebar, tarjetas, cards de producto |
| Borde sutil | `rgba(255,255,255,0.07)` – `0.08` | Separadores, bordes de tarjeta |
| Borde input | `rgba(255,255,255,0.12)` – `0.22` | Botones secundarios, inputs |
| Texto primario | `#f2f0ea` | Texto principal |
| Texto secundario | `#9a978f` / `#a6a39b` | Descripciones |
| Texto terciario / muted | `#8a8780` / `#6a6862` | Labels, metadatos |
| **Oro (acento)** | gradiente `135deg, #e6c264 → #a9822f` | CTAs primarios, badges, precios |
| Oro texto | `#e6c878` | Precios, acentos, ítem de menú activo |
| Oro label | `#c8a24b` | Eyebrows / kickers |
| Plata (producto) | radial `#fbfaf6 → #cfd2d8 → #8d9095 → #3f4044` | Render de monedas de plata |
| Oro (producto) | radial `#fff7e3 → #e6c878 → #b88a32 → #5e441a` | Render de monedas de oro |
| Cobre (producto) | radial `#f1efe9 → #c0855a → #7c4f33 → #3a261a` | Render de monedas de cobre |
| Verde estado | texto `#7bbf8f` / fondo `rgba(123,191,143,0.12)` | "Disponible", "Entregado", "Activo", "Verificado" |
| Azul estado | texto `#7ba6bf` / fondo `rgba(123,166,191,0.12)` | "Enviado" |
| Ámbar estado | texto `#e6c878` / fondo `rgba(230,200,120,0.12)` | "Preventa", "Procesando", "Pendiente", "Por emitir" |
| Gris estado | texto `#9a978f` / fondo `rgba(255,255,255,0.06)` | "En desarrollo" |
| Lila tier | texto `#bf9bdb` / fondo `rgba(160,123,191,0.14)` | Nivel "Early Collector" |

### Tipografía
- **Display / serif:** `'Cormorant Garamond', serif` — pesos 400/500/600, a menudo en *italic* para acentos. Headlines de hero (hasta 88px), títulos de sección, nombres de producto.
- **UI / sans:** `'Hanken Grotesk', sans-serif` — pesos 300–700. Cuerpo, labels, tablas, botones.
- Escala de referencia: hero 76–88px / títulos sección 44–46px / nombre producto (card) 22–26px / cuerpo 14–17px / labels 11–13px.
- Letter-spacing: eyebrows `0.30–0.34em`; botones/labels `0.06–0.10em`; logo `0.16em`.

### Espaciado
Padding de secciones ~70–90px vertical, 32–48px horizontal. Gaps de grid 18–24px. Radios: tarjetas `10–12px`, botones `4–5px`, chips/píldoras `999px`, monedas `50%`.

### Sombras
- Tarjeta de producto / coin: `0 18px 44px -16px rgba(0,0,0,0.8)`.
- Hero coin grande: `0 40px 90px -20px rgba(0,0,0,0.8), inset 0 0 60px rgba(255,255,255,0.12)`.

---

## Screens / Views

### Chrome global (todas las vistas)
- **Top bar** sticky, altura 68px, fondo `rgba(8,8,10,0.86)` + `backdrop-filter: blur(14px)`, borde inferior sutil.
- Izquierda: logo (círculo metálico plata 34px + wordmark "LEGACY FAN" en Cormorant 23px, `letter-spacing:0.16em`).
- Centro: toggle de píldoras **MARKETPLACE / ADMIN** (activo = gradiente oro, texto `#160f02`, bold; inactivo = transparente, texto `#cfcdc6`).
- Derecha (marketplace): selector idioma "ES / EN" + enlace CARRITO con badge contador (gradiente oro).

### MARKETPLACE

**Sub-nav** (debajo del chrome): Colecciones · Punto de venta · Distribuidores · Founders · Early Collector. Ítem activo en oro `#e6c878`.

#### 1. Home
- **Selector de variante de hero** (barra: "HERO · VARIANTE" + 3 botones A/B/C). En producción, elegir **una** sola variante — son alternativas a presentar, no las tres juntas.
  - **Hero A · Split:** grid 1.05fr / 0.95fr. Izq: eyebrow oro, titular "Donde el Arte Trasciende el Metal" (Cormorant 76px, "el Metal" en italic con clip de gradiente oro), párrafo, 2 CTAs (primario oro "EXPLORAR COLECCIONES", secundario outline "CONTACTAR"). Der: coin de plata 380px.
  - **Hero B · Centrado:** todo centrado, titular 88px, fila de 3 coins (plata/oro/cobre) abajo.
  - **Hero C · Banda:** gradiente diagonal a marrón, coin de oro grande difuminado a la derecha, titular "El coleccionismo elevado al arte".
- **Marquesina** infinita (28s linear): "EDICIÓN LIMITADA · PLATA .999 · ORO PURO · ULTRA HIGH RELIEF · ARTE COLECCIONABLE · LICENCIA OFICIAL".
- **Pilares de valor** (3 cards): 01 Plata .999 & Oro Puro · 02 Ultra High Relief · 03 Licencias Oficiales. (Copys exactos en el archivo.)
- **Grid de colecciones** (3 col): cards de producto clicables → ficha.

#### 2. Catálogo
- Grid 240px / 1fr. Aside de **filtros**: METAL (Plata .999, Oro .999, Cobre .999), PESO (1oz, 2oz, 5oz), COLECCIÓN (Iconos, Cultura, Legends), ESTADO (Disponible, Preventa, En desarrollo) — checkboxes custom 15px.
- Contenido: título "Catálogo · N piezas" + selector orden; grid 3 col de cards de producto.

#### 3. Ficha de producto
- Grid 1fr/1fr, columna izquierda sticky (top 90px). Izq: coin grande 66% en card cuadrada + 3 thumbnails. Der: eyebrow estado, nombre (Cormorant 58px), specs, precio (oro 34px), línea de edición; **bloque de certificado** (borde oro, "CERTIFICADO DE AUTENTICIDAD INCLUIDO", Nº de pieza); CTAs "AÑADIR AL CARRITO" (oro) + ♡; tabla de specs (Metal, Peso, Colección, Acabado Ultra High Relief 5mm, Diámetro 50mm, Certificado numerado + blockchain).

#### 4. Carrito
- Max-width 1000px. Lista de líneas (coin 72px + nombre/specs + precio + botón eliminar ×) y panel **Resumen** (subtotal, envío asegurado gratis, total en oro, botón "FINALIZAR COMPRA"). Estado vacío con CTA a catálogo.

**Footer:** wordmark + "© 2026 Legacy Fan · 8 The Green STE R, Dover DE 19901 · info@legacy-fan.com".

### ADMIN
Layout grid `248px / 1fr`. **Sidebar** con 7 ítems (icono + label), activo = fondo gradiente oro tenue + borde oro + texto oro. Cabecera de contenido: título (Cormorant 34px) + subtítulo + buscador + avatar.

1. **Dashboard:** 4 KPIs (Ingresos mes €128.4k ▲18%, Pedidos 342, Piezas acuñadas 810/2.850, Coleccionistas 1.207); gráfico de barras "Ventas · últimos 8 meses" (barras gradiente oro, alturas en %); panel "Stock por edición" (barras de progreso plata); tabla "Pedidos recientes".
2. **Productos:** tabla (Producto con coin thumb, Metal, Precio, Tirada, Estado con chip de color).
3. **Inventario y tiradas:** grid 2 col de cards por edición — badge de estado (Casi agotada / En curso / En desarrollo), barra acuñadas/tirada, y desglose Disponibles / Reservadas / Vendidas.
4. **Pedidos:** tabla (Pedido, Cliente, Pieza, Total, Envío, Estado).
5. **Clientes / CRM:** tabla (Cliente con avatar+email, Segmento, Gastado, Piezas, Nivel: Founder/Early/Cliente con chip de color).
6. **Distribuidores y comisiones:** 3 KPIs (Red activa 24 socios, Ventas canal €122.6k, Comisiones €18.4k) + tabla (Distribuidor/PDV con ubicación, Tipo, Ventas, Comisión, Estado).
7. **Certificados:** tabla (Nº serie monoespaciado, Pieza, Propietario, Registro/hash blockchain, Estado: Verificado / Por emitir).

---

## Interactions & Behavior
- **Toggle app:** MARKETPLACE ↔ ADMIN cambia toda la vista; estado `app`.
- **Navegación marketplace:** home / catálogo / producto / carrito vía estado `mScreen`; click en card de producto fija `curId` y abre la ficha.
- **Variante de hero:** estado `hero` (0/1/2) — solo para presentación.
- **Carrito:** "Añadir al carrito" hace push del id; botón × lo quita; el badge del header refleja el conteo. El checkout es visual (sin pasarela).
- **Navegación admin:** estado `aScreen` selecciona sección; el sidebar resalta el activo y la cabecera cambia título/subtítulo.
- **Hover:** cards de producto cambian borde a oro `rgba(200,162,75,0.5)`.
- **Responsive:** el prototipo está optimizado para escritorio; el objetivo es **web responsive (escritorio + móvil)**. En móvil: hero a una columna, grids de producto a 1–2 col, filtros del catálogo colapsables en drawer, sidebar admin colapsable, tablas con scroll horizontal o reformateadas a cards.

## State Management
Variables de estado del prototipo (replicar como estado de UI / store):
- `app`: `'market' | 'admin'`
- `mScreen`: `'home' | 'catalog' | 'product' | 'cart'`
- `aScreen`: `'dash' | 'products' | 'inv' | 'orders' | 'customers' | 'dist' | 'certs'`
- `hero`: `0 | 1 | 2`
- `curId`: id del producto seleccionado
- `cart`: array de ids de producto

Datos a servir desde API: productos (id, nombre, metal, peso, colección, precio, estado, acuñadas, tirada, nº de serie), pedidos, clientes, distribuidores, ediciones/inventario, certificados. Toda la data del prototipo es mock y vive en el método `renderVals()` de la clase `Component` dentro del `.dc.html`.

## Assets
- **Logo oficial:** se enlaza desde `https://legacy-fan.com/wp-content/uploads/2026/04/Logo-200x60-1.png` (wordmark blanco). Descargar y servir localmente en producción; usar versión invertida sobre fondos claros.
- **Imágenes de producto:** la pieza **Ganesha** usa su imagen real del sitio (`/wp-content/uploads/2026/06/Ganesha-300x300.png`). Las demás "monedas" son gradientes radiales CSS según el metal (plata/oro/cobre) como placeholder — sustituir por **fotografía de producto real** en alta resolución.
- Fuentes vía Google Fonts: **Cormorant Garamond** (display/serif) + **Hanken Grotesk** (UI/sans).
- Iconos del sidebar admin: glifos Unicode de placeholder — sustituir por un set de iconos (Lucide, etc.).

## Files
- `Legacy Fan Marketplace.dc.html` — prototipo completo de **web + super-admin** (markup + estilos inline + lógica/datos en la clase `Component`).
- `Legacy Fan Branding.dc.html` — **manual de marca** (portada, esencia, logo, paleta, tipografía, materiales/acabados, voz, aplicación).
- `support.js` — runtime que renderiza los Design Components (solo para abrir los prototipos en navegador; no portar).

Para ver los prototipos: abrir cualquiera de los dos `.dc.html` en un navegador.
