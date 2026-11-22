# HisIn — build verde, navegación de planes y shell dinámico

Feature: cerrar los errores de prerender que rompían el build y hacer clickeables las clases guardadas.
Owner: mauroociappina · Branch: `feat/vocab-trainer-stories`

## Specs

B1. El shell (nav) no calcula valores inestables al prerenderizar: pide solo `streak` y `xp` por `getShellCounters`, y declara su acceso dinámico con `connection()` dentro de `<Suspense>`. El perfil completo (con `itemsToday` y `new Date()`) queda para pantallas de request.

B2. Las rutas dinámicas del currículum (`/lessons/[module]`, `/practice/[module]`) declaran `generateStaticParams` con los seis módulos: su shell se prerenderiza y los datos cargan en el cliente.

B3. El `spawn` del CLI queda anotado con `turbopackIgnore` para que el build no trace todo el proyecto como código de servidor.

B4. Las clases guardadas se abren: cada fila es un botón que carga ese plan en pantalla, con estado `abrir →` / `abierta` y acción “Cerrar plan”.

B5. `pnpm build` termina en 0 con todas las rutas en partial prerender, y `pnpm test` sigue verde.

## Log

L1 (usuario, textual): «Error Type Blocking Route … Route "/grammar/[slug]": Next.js encountered the unstable value `new Date()` while prerendering … CLIKEO Y NO ENTRA EN NINGUNA CARD».
