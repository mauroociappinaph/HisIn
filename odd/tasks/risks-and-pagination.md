# HisIn — riesgos cerrados, paginador y chips explicados

Feature: cerrar la deuda de contratos que veníamos arrastrando, paginar las listas largas y explicar los chips de las tarjetas.
Owner: mauroociappina · Branch: `feat/vocab-trainer-stories`

## Specs

R1. `PATCH /api/vocabulary/[id]` corrige una entrada propia (definición, ejemplo, nota, función, registro, separabilidad, partícula, término). Nunca toca nivel, módulo, origen ni el id; nunca toca contenido sembrado o generado (`403`). Función y registro son listas cerradas; un valor fuera de la lista devuelve `400` con la lista.

R2. `validateUpdate` rechaza un patch vacío o sin campos editables, en vez de escribir una fila "por las dudas".

R3. `/api/news` y `/api/vocabulary?kind=` aceptan `limit`/`offset` y devuelven `{ items, total, hasMore }`; **sin** esos parámetros devuelven el array de siempre (compatibilidad con los consumidores existentes).

R4. `parsePage` clampa `limit` a 1..100 y `offset` a ≥0; `paginate` no inventa totales y las páginas tilean la lista sin huecos ni repetidos.

R5. Las listas largas tienen paginador visible: noticias con "Cargar más" y contador real (`12 de 40`), chunks y patrones con ventana de 12 y conteos de filtro exactos (porque se calculan sobre la lista completa, no sobre la página).

R6. Cada tarjeta de chunk/patrón explica qué mide cada chip: `separable` = gramática, `neutral/informal/formal` = registro, `propia` = origen.

R7. Una entrada propia con la función mal etiquetada se corrige desde la tarjeta con un selector (`Corregir función`) que llama al PATCH; la fila `be interested in + noun/gerund` pasó de `persuade` a `express` con ese mecanismo.

## Tests

`src/shared/lib/pagination.test.ts` (6): total real, última página, offset fuera de rango, clamps, ausencia de parámetros, páginas que tilean sin huecos.
`src/modules/vocabulary/update.test.ts` (9): función `express` aceptada, taxonomía cerrada, limpiar opcionales con null, patch vacío rechazado, campos inmutables ignorados, longitudes, registros, booleano estricto, partícula normalizada.
