# HisIn — migración a shadcn/ui

Decisión: migrar las piezas interactivas a shadcn (Radix por debajo), manteniendo HisMia como sistema de diseño.

## Por qué

La UI estaba escrita a mano sobre los tokens de HisMia. Se veía bien, pero las piezas interactivas no tenían comportamiento accesible: el modal del botón `＋` era un `div` con `role="dialog"`, sin focus trap, sin Escape y sin bloquear el scroll.

## Qué se hizo

| Pieza | Estado |
| --- | --- |
| `components.json` | creado, con alias a `@/components/ui` y `@/shared/lib/cn` para que el CLI funcione a futuro |
| `src/components/ui/dialog.tsx` | shadcn Dialog sobre `@radix-ui/react-dialog`: portal, overlay, focus trap, Escape, scroll lock, botón de cierre con `aria-label` |
| `src/components/ui/tooltip.tsx` | shadcn Tooltip sobre Radix |
| `src/components/ui/tabs.tsx` | shadcn Tabs sobre Radix, con navegación por teclado y `data-state` |
| Alta rápida (`quick-add`) | **migrada**: usa `Dialog` + `DialogTitle` + `DialogDescription` |
| Biblioteca (`/library`) | **migrada**: el filtro por tipo es `Tabs` con teclado y estado anunciado |
| Tokens | los componentes usan las clases de siempre, que globals.css ya mapea a HisMia |

Pendiente consciente: `Select` (audiencia del email, nivel de clase), `Toast`/`Sonner` (guardados) y `Checkbox` (lección hecha, drills).

## Incidente que disparó la sesión

El repaso de vocabulario quedaba en «Cargando repaso…» y el modal no abría. Causa: **los jobs de generación en background saturaban el dev server** (una request de generación tarda minutos y el proceso las atiende de a una). Detenidos los jobs, el repaso carga (35 pendientes) y el modal abre.

También se agregó `allowedDevOrigins` en `next.config.ts`: el websocket de HMR fallaba al entrar por `192.168.0.115` porque Next bloquea orígenes de desarrollo no declarados.
