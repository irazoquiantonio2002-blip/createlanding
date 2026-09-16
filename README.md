# Plataforma + Workflow · Generador de páginas web

Dos mitades de un mismo sistema:

- **`Plataforma/`** — dashboard en Next.js donde se captura la información del negocio
  (nombre, descripción, servicios, color de marca, logo, imágenes, contacto) y se aprieta
  **Generar página web**.
- **`workflow/`** — configuración para hablar con el n8n de `n8n.agenciahello.com.mx`, donde
  vive el workflow **Generador landing page - Prueba 3** que arma y publica la página.

---

## Cómo corre

```bash
cd Plataforma
npm install     # solo la primera vez
npm run dev     # http://localhost:3000
```

Todo lo demás ya está puesto: el esquema de Supabase, el bucket de Storage, el webhook de n8n y
las dos credenciales. El workflow **Generador landing page - Prueba 3** está activo, que es lo
que necesita el webhook para responder.

---

## El recorrido completo

```
Dashboard                  Supabase                     n8n
─────────                  ────────                     ───
Formulario
  │ sube logo e imágenes ──► Storage (bucket público)
  │ guarda los datos ───────► tabla negocios
  │
  └─ "Generar página web"
        │ crea fila ────────► tabla sitio_generaciones (encolado)
        │
        └─ POST /webhook/generar-landing ──────────────► Lo llama la plataforma
                                                          │ (cabecera x-plataforma-token)
                              ◄── 202 { ok: true } ───────┤ Revisar petición → Acusar recibo
                                                          │
                                                          ├─ Guardar negocio (upsert en proyectos)
                                                          ├─ Reservar sitio
           tabla sitio_generaciones ◄── generando ────────┤
                                                          ├─ Visión sobre el logo → color de marca
                                                          ├─ Perfil del negocio, tipografía (IA)
                                                          ├─ Fotos: primero las tuyas, Pexels rellena
                                                          ├─ Plantilla 2-extra + copy por bloque (IA)
                                                          ├─ GitHub: repo + logo + index.html
                                                          └─ Vercel: proyecto + deploy
           tabla sitio_generaciones ◄── desplegado + URL ──┘
        │
        └─ el dashboard consulta cada 4s y muestra la URL
```

El webhook contesta **de inmediato** (202) y el workflow sigue corriendo por su cuenta: armar una
página son entre 2 y 5 minutos, y cualquier proxy cortaría la conexión mucho antes.

---

## Supabase

Proyecto **`bcgboknagavmluglllun`** ("helloweb100-png's Project"), dedicado a esto. Es el mismo al
que apunta el token de `Plataforma/CLAVES SUPABASE.txt`.

> Ojo: existe otro proyecto Supabase, `gekcpzhaigihbndqqlvi`, que tiene el CRM de la agencia y
> está bajo **otra cuenta**. No es el que usa la plataforma. Si algún día las tablas `negocios` y
> `sitio_generaciones` aparecen ahí también, son de un primer intento y se pueden borrar.

El esquema completo está en [`Plataforma/supabase/schema.sql`](Plataforma/supabase/schema.sql) y
se puede volver a correr sin romper nada.

| Tabla | Qué guarda |
|---|---|
| `negocios` | Todo lo que se captura en el formulario |
| `sitio_generaciones` | Un renglón por intento: estado, paso, URL, error |
| Storage `negocios` | Logo e imágenes, en bucket **público** |

Las dos tablas tienen **RLS activo y sin políticas**, a propósito: la plataforma entra siempre
desde el servidor con la service role key, que ignora RLS. El navegador no puede tocarlas ni con
la `anon` key. Todo pasa por las rutas `/api`.

El bucket es público porque n8n baja el logo y las fotos por URL desde otro servidor, sin
credenciales de Supabase.

---

## Qué se le cambió al workflow

El respaldo de cómo estaba antes quedó en `workflow/respaldos/`.

### Nodos nuevos (8)

| Nodo | Para qué |
|---|---|
| `Lo llama la plataforma` | Webhook `POST /webhook/generar-landing`, protegido con la cabecera `x-plataforma-token` |
| `Revisar petición` | Valida y normaliza el cuerpo para que quede igual que una fila de `proyectos` |
| `Acusar recibo` | Contesta 202 y deja que el flujo siga |
| `Guardar negocio` | `UPSERT` en `proyectos` por teléfono, y devuelve la fila |
| `Plataforma: generando` | Le avisa al dashboard que arrancó |
| `Plataforma: listo` | Le manda la URL de Vercel |
| `Plataforma: error` | Le manda el motivo del fallo |
| `Toca avisar por WhatsApp?` | Corta el aviso al dueño cuando el alta viene del dashboard |

Los tres nodos `Plataforma: …` cuelgan **en paralelo** del camino principal y con
`onError: continueRegularOutput`: si el aviso falla, la página se genera igual.

### Nodos que se modificaron

- **`Buscar proyectos sin sitio`** — el `SELECT` trae también las columnas nuevas.
- **`Preparar datos`** — arrastra `origen`, `color_marca`, `imagenes_propias`, `plantilla_slug`
  y `avisar_whatsapp`. Por el camino de WhatsApp todo cae en su valor de siempre.
- **`Leer marca`** — si el negocio fijó su color en el dashboard, ese manda sobre lo que la IA
  vea en el logo. La paleta, los neutros y el contraste WCAG se calculan igual.
- **`Preparar contexto`** — las fotos del negocio van primero (portada, servicios, resultados) y
  Pexels rellena hasta los 16 huecos que pide la plantilla.
- **`Reservar sitio`** — antes solo se reintentaba lo que había fallado; ahora se puede regenerar
  una página ya publicada, pero nunca pisar una que se esté armando.
- **`Registrar error`** — el `RETURNING` incluye `ultimo_error`, para poder enseñarlo.

### Columnas nuevas en `proyectos` (Postgres de n8n)

`origen`, `giro`, `color_marca`, `imagenes` (jsonb), `plantilla_slug`, `generacion_id`,
`avisar_whatsapp`. Todas con valor por omisión, para no romper al asistente de WhatsApp que
sigue insertando en esa tabla sin saber de ellas.

---

## Cosas que conviene saber

**Son dos bases de datos distintas.** El Postgres del workflow es la base propia de n8n (ahí
viven `leads`, `proyectos`, `sitios_web`, `plantillas` junto a las tablas internas de n8n).
Supabase es otra cosa. La plataforma nunca toca el Postgres de n8n: le habla por el webhook.

**Un negocio = un teléfono.** La tabla `proyectos` tiene índice único en `telefono`, así que dos
negocios del dashboard con el mismo WhatsApp se pisan. Es el índice que ya existía y del que
depende el asistente de WhatsApp.

**Hay 23 plantillas en la base, pero el workflow usa solo `2-extra`.** Los nodos que trocean y
arman la página están hechos para la estructura de esa plantilla. La columna `plantilla_slug` ya
viaja de punta a punta por si más adelante se quieren habilitar las demás.

**n8n contesta 200 aunque falle.** Si el workflow revienta antes de llegar a `Acusar recibo`,
n8n cierra la conexión con 200 y cuerpo vacío, no con un 5xx. Por eso la plataforma exige un
`{ ok: true }` en el cuerpo y no se conforma con el código de estado.

**Desde el dashboard no se le escribe al dueño por WhatsApp.** La idea es que la agencia revise
la página antes. Si algún día se quiere lo contrario, es mandar `avisar_whatsapp: true` en el
cuerpo del webhook.

**El tope de 15 minutos.** Una generación que lleve más de ese rato sin reportar nada se da por
perdida: el dashboard lo dice y libera el botón. Si no, un fallo silencioso de n8n dejaría al
negocio bloqueado para siempre.

**Las credenciales de n8n traen candado de dominio.** Una credencial creada con
`allowedHttpRequestDomains: "none"` se puede usar para autenticar un webhook, pero **no** dentro
de un nodo HTTP Request: falla con *«This credential is configured to prevent use within an HTTP
Request node»*. La credencial `Supabase - Plataforma` está en `"domains"` con el dominio **sin
esquema** (`bcgboknagavmluglllun.supabase.co`); si se pone con `https://` delante, n8n lo rechaza
aunque el mensaje de error muestre justo ese dominio como permitido.

---

## Mapa del código

```
Plataforma/src/
  app/
    page.tsx                      listado de negocios
    negocios/nuevo/page.tsx       formulario
    negocios/[id]/page.tsx        detalle + botón de generar
    api/
      upload/                     sube archivos a Storage
      negocios/                   alta y listado
      negocios/[id]/generar/      crea la generación y llama a n8n
      generaciones/[id]/          lo consulta el dashboard cada 4s
  lib/
    supabase.ts                   cliente con service role (SOLO servidor)
    n8n.ts                        arma el cuerpo del webhook y lo dispara
    tipos.ts                      tipos compartidos
  components/
    FormularioNegocio.tsx         el formulario completo
    PanelGeneracion.tsx           botón de generar + seguimiento
    campos.tsx / subidores.tsx    piezas del formulario
```
