# PixelForge — Editor de imágenes online

**PixelForge** es una suite profesional de edición de imágenes que funciona íntegramente en el
navegador. Combina herramientas rápidas para el día a día con un **Editor Pro** basado en capas, y
está pensada para publicarse como sitio estático en **GitHub Pages**.

> Tus imágenes se procesan directamente en tu dispositivo. Nunca se suben a ningún servidor.

---

## ✨ Características

### Editor rápido (Estudio)
- **Importación** por clic o arrastrar y soltar: PNG, JPG, WEBP, GIF, BMP, SVG y AVIF (según navegador).
- **Ajustes en tiempo real**: brillo, contraste, exposición, saturación, vibrancia, temperatura,
  matiz, luces, sombras, blancos, negros, nitidez, desenfoque, opacidad, sepia, escala de grises e
  inversión.
- **16 filtros** con vista previa: B&N, Vintage, Cálido, Frío, Cinemático, Fade, Dramático, Sepia y más.
- **Recorte** con proporciones 1:1, 4:3, 16:9, 3:2, 9:16, 3:4, 2:3 y libre, con guías y tamaño personalizado.
- **Redimensionado** con bloqueo de proporción, porcentajes y presets (Instagram, YouTube, 4K, HD…).
- **Rotar** (90°, 180°, ángulo libre) y **voltear** (horizontal / vertical).
- **Compresión** con estimación de peso, ahorro porcentual y comparación **Antes / Después**.
- **Conversión de formato** PNG / JPG / WEBP con control de calidad, escala y nombre de archivo.
- **Deshacer / rehacer** y comparación antes/después.

### Editor Pro
- **Canvas profesional** con zoom (rueda + Ctrl), paneo (Espacio + arrastrar) y ajuste automático.
- **Capas**: crear, duplicar, eliminar, reordenar (drag & drop), renombrar, ocultar, bloquear y ajustar opacidad.
- **Pincel y borrador** con tamaño, dureza y opacidad configurables.
- **Texto**: fuente, tamaño, negrita, cursiva, alineación, color, interlineado y presets.
- **Formas**: rectángulo, círculo, triángulo, estrella, línea y flecha, con relleno y borde.
- **Clonar** y **cuentagotas** (copia el color HEX al portapapeles).
- **Selección rectangular** con borrado de región (tecla Delete).
- **Recorte de lienzo** con guías.
- **Ajustes y filtros** por capa (no destructivos con vista previa y aplicación).
- **Historial** con atajos profesionales y **exportación** PNG / JPG / WEBP.

### Experiencia
- Home con **acciones rápidas** destacadas (Editar, Comprimir, Convertir, Redimensionar, Recortar, Filtros, Editor Pro).
- Editor Pro con barra de menús completa (Archivo, Editar, Imagen, Capa, Filtro, Vista) y **menú Filtro** que aplica presets directamente a la capa activa.
- **Zoom con presets** (25/50/100/200/400 + Ajustar) desde la barra de estado.
- Paneles contextuales: las **Propiedades** muestran solo los controles relevantes a la herramienta/capa.
- En móvil/tablet, los paneles del Editor Pro se abren en un **drawer** y la toolbar pasa a la parte inferior.
- Indicación discreta de **procesamiento local** (sin banners intrusivos).

### Plataforma
- Tema **Oscuro / Claro / Sistema** persistido en `localStorage`.
- **Proyectos locales** guardados en **IndexedDB** con miniaturas.
- **PWA** instalable con soporte offline básico (service worker).
- Diseño **responsive** con barra inferior y drawers en móvil.
- Accesibilidad: navegación por teclado, `focus-visible`, `aria-label`, tooltips y contrastes.
- Notificaciones tipo **Toast** y mensajes de error amigables.

---

## 🚀 Desarrollo

Requiere **Node.js 18+**.

```bash
npm install
npm run dev        # servidor de desarrollo
npm run typecheck  # verificación de TypeScript
npm test           # tests (Vitest)
npm run build      # build de producción -> dist/
npm run preview    # sirve el build
```

`npm run build` ejecuta `tsc -b` y `vite build`. El resultado en `dist/` es 100 % estático y
contiene todos los recursos: `index.html`, assets con hash, el chunk del Web Worker, iconos,
manifest, favicon y `sw.js`. Está diseñado para servirse desde un subdirectorio
(p. ej. `https://usuario.github.io/PixelForge/`).

---

## 🌐 Despliegue en GitHub Pages

El repositorio incluye un workflow en `.github/workflows/deploy.yml` que, al hacer push a `main`
(o `master`), instala dependencias, ejecuta **TypeScript**, ejecuta los **tests**, genera el
**build** y publica `dist/`. Si cualquier comprobación falla, **no se publica** la build rota.

1. Sube el proyecto a GitHub.
2. Ve a **Settings → Pages** y selecciona **Source: GitHub Actions**.
3. Haz push a `main`. La app se publicará en `https://<usuario>.github.io/<repo>/`.

El build usa `base: './'` y `HashRouter`, por lo que funciona en rutas de proyecto de GitHub Pages
sin configuración adicional.

---

## 🏗️ Arquitectura

```
src/
├── components/        # UI reutilizable (Button, Slider, Modal, Tooltip, Toaster, Dropzone…)
│   ├── layout/        # TopNav
│   └── ui/            # Sistema de componentes
├── features/
│   ├── pro/           # Editor Pro: canvas, toolbar, capas, paneles, export
│   ├── quick/         # Paneles del editor rápido + pipeline de render
│   └── toolsCatalog   # Catálogo de herramientas
├── hooks/             # useQuickPreview, useImageLoader, useKeyboardShortcuts
├── pages/             # Home, Studio, Tools, Projects, Settings, EditorPro
├── services/          # imageEngine, imageService, presets, storage (IndexedDB)
├── store/             # Zustand: theme, toasts, imagen, editor
├── styles/            # Tokens de diseño y estilos globales
└── types/             # Tipos compartidos
```

### Tecnologías
- **React 18** + **TypeScript**
- **Vite** (build estático)
- **Zustand** (estado)
- **React Router** (HashRouter)
- **lucide-react** (iconos)
- **idb-keyval** (IndexedDB)
- **Canvas API** para todo el procesamiento de imagen

### Motor de imagen
El procesamiento se centraliza en `services/imageEngine.ts`:
- Filtros de color/tono acelerados por GPU mediante `ctx.filter`.
- Correcciones tonales y de color por píxel (exposición, temperatura, vibrancia, luces/sombras…).
- Nitidez mediante convolución (unsharp mask).
- Previsualización a resolución reducida para mantener la interfaz fluida; exportación a resolución completa.

### Rendimiento y offline
- La codificación de exportaciones (PNG/JPG/WEBP) se realiza en un **Web Worker** con
  `OffscreenCanvas` (`services/exportWorker.ts`) para no bloquear la interfaz, con **fallback
  automático** al hilo principal si el navegador no lo soporta (compatibilidad Safari/Firefox).
- El **service worker** precarga la app y aplica *network-first* para la navegación (evita servir
  `index.html` obsoleto) y *cache-first* solo para los assets con hash (inmutables). Al cambiar de
  versión elimina cachés antiguas y recarga una vez cuando un worker nuevo toma el control, para no
  dejar al usuario atrapado en una versión antigua.
- Todas las rutas de assets, manifest, iconos y service worker son **relativas al `base` de Vite**,
  por lo que funcionan desde cualquier subdirectorio de GitHub Pages.

---

## 🔒 Privacidad

PixelForge no envía imágenes a ningún servidor. Todo el procesamiento y el almacenamiento de
proyectos ocurre en el navegador del usuario mediante Canvas, `localStorage` e `IndexedDB`. No hay
cuentas, analíticas invasivas ni subida automática de archivos.

---

## ⌨️ Atajos principales

| Atajo | Acción |
| --- | --- |
| `Ctrl + Z` | Deshacer |
| `Ctrl + Shift + Z` / `Ctrl + Y` | Rehacer |
| `Ctrl + S` | Guardar / exportar |
| `Ctrl + O` | Abrir imagen |
| `Delete` | Eliminar capa / región seleccionada |
| `Espacio + arrastrar` | Mover vista (pan) |
| `Ctrl + rueda` | Zoom |
| `[` / `]` | Tamaño del pincel |
| `V C B E T U S I Z H` | Mover, Recortar, Pincel, Borrador, Texto, Forma, Clonar, Cuentagotas, Zoom, Mano |

---

## 📄 Licencia

MIT. Consulta el proyecto para más detalles.
