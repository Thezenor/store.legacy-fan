# Atributos de moneda — Plugin *Legacy Woo Tools*

Referencia de todos los campos/atributos que el plugin **Legacy Woo Tools** (`plugin/legacy-woo-tools/`, v0.4.0) añade a las **monedas** (productos de WooCommerce).

- **Prefijo de meta:** `_lwt_` (los campos se guardan como *post meta* del producto).
- **Dónde se editan:** editor de producto → pestaña **"Datos / Numismática"** (solo **productos simples**).
- **Definición en código:** `modules/product-fields/class-lwt-product-fields.php`.
- **Atributos filtrables:** `modules/product-fields/class-lwt-product-attributes.php`.

---

## 1. Campos (meta keys)

### 1.1 Datos generales

| Meta key | Etiqueta | Tipo | Opciones / valores | ¿Filtrable? |
|---|---|---|---|---|
| `_lwt_product_type` | Tipo de producto | select | `coin`, `ingot`, `blind_box`, `pack`, `other` | No |
| `_lwt_metal` | Metal | select | `silver_999`, `gold_999`, `bronze`, `copper`, `other` | **Sí** (`pa_lwt_metal`) |
| `_lwt_weight` | Peso (texto) | texto | libre (ej. `155 g`) | No |
| `_lwt_purity` | Pureza | texto | libre (ej. `.999`, `92.5%`) | No |
| `_lwt_limited_edition` | Edición limitada | checkbox | `yes` / `no` | No |
| `_lwt_total_units` | Unidades totales | número | entero ≥ 0 | No |
| `_lwt_product_status` | Estado del producto | select | `normal`, `presale`, `coming_soon`, `hidden`, `sold_out` | No |
| `_lwt_special_label` | Etiqueta especial | texto | libre (ej. `Exclusiva`) | No |
| `_lwt_ip_license` | IP / Licencia | texto | libre (ej. `Real Madrid™`) | No |
| `_lwt_features` | Incluye / Beneficios | textarea | un ítem por línea | No |

### 1.2 Datos numismáticos

| Meta key | Etiqueta | Tipo | Opciones / valores | ¿Filtrable? |
|---|---|---|---|---|
| `_lwt_year` | Año de emisión | número | entero ≥ 0 | No |
| `_lwt_country` | País | select | lista de países de WooCommerce | No |
| `_lwt_face_value` | Valor facial | texto | libre (ej. `100 EUR`) | No |
| `_lwt_dimension` | Dimensión | texto | libre (ej. `40 mm`, `50 mm x 3 mm`) | **Sí** (`pa_lwt_diameter`) |
| `_lwt_quality` | Calidad | select | `proof`, `reverse_proof`, `matte`, `antique`, `black_proof` | **Sí** (`pa_lwt_quality`) |
| `_lwt_mintage` | Tirada (mintage) | número | entero ≥ 0 | No |
| `_lwt_coa` | Certificado (CoA) | texto | libre (ej. `Certificado numerado`) | No |
| `_lwt_box` | Caja | texto | libre (ej. `Caja exclusiva numerada`) | No |
| `_lwt_capsule` | Cápsula | texto | libre (ej. `Cápsula premium`) | No |

### 1.3 Acabados técnicos

| Meta key | Etiqueta | Tipo | Valores | ¿Filtrable? |
|---|---|---|---|---|
| `_lwt_coin_features` | Acabados | multi-selección (checkboxes) | array de claves (ver §2.5) | **Sí** (`pa_lwt_feature`) |

---

## 2. Opciones (clave → etiqueta)

### 2.1 Tipo de producto — `_lwt_product_type`
| Clave | Etiqueta |
|---|---|
| `coin` | Moneda |
| `ingot` | Lingote |
| `blind_box` | Blind Box |
| `pack` | Pack |
| `other` | Otro |

### 2.2 Metal — `_lwt_metal`
| Clave | Etiqueta |
|---|---|
| `silver_999` | Plata .999 |
| `gold_999` | Oro .999 |
| `bronze` | Bronce |
| `copper` | Cobre |
| `other` | Otro |

### 2.3 Estado del producto — `_lwt_product_status`
| Clave | Etiqueta |
|---|---|
| `normal` | Normal |
| `presale` | Preventa |
| `coming_soon` | Próximamente |
| `hidden` | Oculto |
| `sold_out` | Agotado |

### 2.4 Calidad — `_lwt_quality`
| Clave | Etiqueta |
|---|---|
| `proof` | Proof (Fondo Espejo) |
| `reverse_proof` | Reverse Proof (Prueba Inversa) |
| `matte` | Matte Finish (Acabado Mate) |
| `antique` | Antique Finish (Acabado Antiguo) |
| `black_proof` | Black Proof |

### 2.5 Acabados — `_lwt_coin_features` (20 opciones)
| Clave | Etiqueta |
|---|---|
| `high_relief` | High Relief (Alto Relieve) |
| `uhr` | Ultra High Relief (UHR) |
| `digital_printing` | Digital Printing (Color Digital) |
| `selective_gilding` | Selective Gilding (Baño de Oro Selectivo) |
| `rhodium_ruthenium` | Rhodium / Ruthenium Plating |
| `glow_dark` | Glow in the Dark (Fluorescencia) |
| `color_changing` | Color Changing (Termocrómico) |
| `hologram` | Hologram (Holograma) |
| `latent_image` | Latent Image (Imagen Latente) |
| `laser_frosting` | Laser Frosting (Satinado Láser) |
| `gemstone_inlay` | Gemstone / Crystal Inlays (Gemas / Cristales) |
| `meteorite_insert` | Meteorite / Artifact Inserts |
| `shape_coin` | Shape Coin (Moneda con Forma) |
| `bimetal` | Bi-Metal (Bimetálica) |
| `filigree` | Filigree (Filigrana / Calado Láser) |
| `incuse` | Incuse (Relieve Incuso) |
| `edge_lettering` | Edge Lettering (Grabado en el Canto) |
| `microtext` | Microtext (Microtexto de Seguridad) |
| `moving_elements` | Moving Elements (Elementos Móviles) |
| `enamel_inlay` | Enamel Inlay (Inserción de Esmalte) |

---

## 3. Atributos globales filtrables (taxonomías WooCommerce)

Se crean al activar el módulo (`wc_create_attribute()`) y se **sincronizan automáticamente** desde los meta al guardar el producto (`woocommerce_admin_process_product_object`). Compatibles con el widget nativo **"Filtrar por atributo"** y con `?filter_pa_...=`.

| Taxonomía | Meta origen | Basada en |
|---|---|---|
| `pa_lwt_metal` | `_lwt_metal` | Metal |
| `pa_lwt_quality` | `_lwt_quality` | Calidad |
| `pa_lwt_diameter` | `_lwt_dimension` | Dimensión |
| `pa_lwt_feature` | `_lwt_coin_features` | Acabados (términos dinámicos) |

---

## 4. Ciclo de vida (guardar / mostrar)

- **Guardar (admin):** hook `woocommerce_process_product_meta` → `LWT_Product_Fields::save_admin_fields()`. Validación: selects contra su array de opciones, números con `absint()`, checkbox `yes`/`no`, textos con `sanitize_text_field()`, textarea con `sanitize_textarea_field()`.
- **Leer (API interna):** `LWT_Product_Fields::get_premium_data( $product )` → array con etiquetas ya traducidas.
- **Mostrar (frontend):** hook `woocommerce_single_product_summary` (prioridad 25) → bloque **"Especificaciones"** (lista de campos), **badges** (estado, etiqueta especial, edición limitada, acabados) y bloque **"Incluye"** (a partir de `_lwt_features`). Estilos en `public/css/lwt-public.css`.

---

## 5. Notas

- **Migración v0.1.3:** `_lwt_coa`, `_lwt_box` y `_lwt_capsule` pasaron de **checkbox** (`yes`/`no`) a **campo de texto** libre (migración automática: `no` → vacío, `yes` → `Sí`).
- Los `select` incluyen una opción vacía inicial `— Selecciona —` (no se guarda como valor).
- Documento generado a partir del código fuente del plugin (`class-lwt-product-fields.php` / `class-lwt-product-attributes.php`). Si se añaden campos nuevos, actualizar esta tabla.
