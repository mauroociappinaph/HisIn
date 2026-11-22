# HisIn — temario por temas, Mi vocabulario y nav definitiva

Feature: la página principal pasa a ser el árbol de módulos y submódulos con el temario oficial; los temas se generan con Gentleman Shell en contexto healthtech/Silicon Valley.
Owner: mauroociappina · Branch: `feat/vocab-trainer-stories`

## Specs

T1. Textual del usuario: «EN EL NAVBAR NO HAY UN LUGAR PARA ENTRAR A ESTA VIEW: /modules … NO VEO LA TAB DE MI VOCABULARIO … HACE QUE LA PAGINA PRINCIPAL SEA POR MODULOS Y SUB MODULOS … TODO LO DEBE MANEJAR GENTLEMAN SHELL».

T2. Navbar: **Módulos** (`/`, árbol de módulos y submódulos) · **Mi vocabulario** (`/library`) · **Gramática** · **Repasar** · **Progreso**. `/modules` (recorridos de estudio de 4 pasos) queda enlazado desde el árbol y desde el hub.

T3. `/library` lista **todo** lo guardado (palabras, phrasal verbs, expresiones, patrones) con filtros por tipo y búsqueda por término/definición/ejemplo, ventana de 20 con “Mostrar más”, y edición/borrado sólo de lo propio.

T4. Tema 1 del temario: «Verbo to be (afirmativo, negativo e interrogativo)» con cuatro materiales —GRAMMAR, READING, LISTENING, WRITING— y **todos** anclados a healthtech/emprendimiento/Silicon Valley.

T5. Cada material lo escribe el motor (`runGentleShell`) y no se guarda si no pasa la validación: 120–400 palabras, `keyPoints` de 2 a 6, `skill` único y —la regla que importa— **una palabra del dominio** (health, clinical, investor, startup, product, compliance…). Material genérico de manual se rechaza.

T6. La generación es idempotente por skill: sólo pide lo que falta, así una segunda generación no reescribe lo que el aprendiz ya leyó.

T7. `/topics/[slug]` muestra los cuatro materiales con su etiqueta de skill, los key points y el detalle del tema; si falta material, ofrece generarlo.

## Tests

`src/modules/topics/schema.test.ts` (7): lote válido aceptado, fences tolerados, material genérico rechazado por falta de dominio, skill repetido rechazado, skill desconocido rechazado, respuesta sin JSON, y el prompt pide sólo los skills faltantes.

## Log

L1 (usuario, textual): «EN EL NAVBAR NO HAY UN LUGAR PARA ENTRAR A ESTA VIEW … NO VEO LA TAB DE MI VOCABULARIO … TODO LO DEBE MANEJAR GENTLEMAN SHELL. TEMA 1 Verbo to be … (TRATA DE HACER EL GRAMMAR EL LISENNING, EL READING, ETC SIEMPRE ENFOCADO A LAS HEALTECH Y EMPRENDERURISMO, SILICON VALLEY ETC)».
L2 (ejecución): Tema 1 generado en vivo con `gemini-3.1-flash-lite`: 4/4 materiales guardados (1039/669/557/703 caracteres), sin faltantes.

## Temario cargado (owner-provided)

| Tema | Título | Materiales |
| --- | --- | --- |
| 1 | Verbo to be (afirmativo, negativo e interrogativo) | 4/4 |
| 2 | Pronombres personales sujeto y adjetivos posesivos | 4/4 |
| 3 | Artículos (a, an, the) y plurales | 4/4 |
| 4 | Demostrativos (this, that, these, those) | 4/4 |
| 5 | There is / There are y preposiciones de lugar | 4/4 |

L3 (bug): el Tema 2 falló porque el modelo devolvía el título completo (94 caracteres) en el campo `topic` y el schema lo limitaba a 80. Era un límite sobre un campo informativo, no sobre el contenido: se subió a 200 y se agregó test de regresión.
L4 (decisión): `scripts/seed-topics.ts` (expuesto como `pnpm seed:topics`) carga el temario de forma idempotente; los materiales se generan por tema con el botón de `/topics/[slug]`.

## Temas 6.1 y 6.2 (present simple)

| Código | Título | Materiales |
| --- | --- | --- |
| 6.1 | Present simple: afirmativo y usos (rutinas, verdades generales, -s / -es / -ies) | 4/4 |
| 6.2 | Present simple: negativo e interrogativo (don't / doesn't, Do / Does, preguntas abiertas) | 4/4 |

L5 (decisión): el owner numera por partes ("Tema 6.2"), así que `Topic.code String?` guarda el código de display (`6.1`, `6.2`) y la UI lo prefiere sobre `ord`. Migración aditiva.

## Dónde se guarda todo esto

- **Postgres local** — `DATABASE_URL` en `local.env` (raíz del repo), inyectado por `src/shared/lib/load-env.ts` vía `next.config.ts`.
- `Topic` (una fila por tema: slug, título, orden, `code`, nivel CEFR, focus) y `TopicMaterial` (una fila por skill: GRAMMAR/READING/LISTENING/WRITING, título, body, keyPoints), con unique `(topicId, skill)`.
- El resto del contenido: `Lesson`, `Question`, `Vocabulary`, `VocabularyStory`, `NewsArticle`; y `GenerationJob` guarda la auditoría de cada llamada al motor (prompt, modelo, estado, salida validada).
- El **temario** (qué temas existen) vive en `scripts/seed-topics.ts` (`pnpm seed:topics`); los **materiales** los escribe el motor vía `POST /api/topics/[slug]/generate` y se persisten en `TopicMaterial`.

## Reorganización en módulos y submódulos (16 temas / 64 materiales)

| Módulo | Submódulos |
| --- | --- |
| **1 · Fundamentos: to be, pronombres, artículos y lugar** | 1.1 to be · 1.2 pronombres y posesivos · 1.3 artículos y plurales · 1.4 demostrativos · 1.5 there is/are + lugar |
| **6 · Present simple** | 6.1 afirmativo y usos · 6.2 negativo e interrogativo · 6.3 adverbios de frecuencia · 6.4 excepciones e integración |
| **7 · Can: habilidad y permiso** | 7.1 estructura del modal · 7.2 habilidad y permiso · 7.3 pronunciación e integración |
| **8 · Present continuous e imperativos** | 8.1 afirmativo y ortografía -ing · 8.2 negativo e interrogativo · 8.3 imperativos · 8.4 contraste e integración |

L6 (decisión de IA): cada módulo agrupa una estructura con sus reglas, usos e integración; cada submódulo es una unidad de ~90 minutos. `Topic.unit` + `Topic.unitOrder` sostienen la jerarquía y la home agrupa con `groupByUnit` (probado: orden de módulos, orden interno, fallback "Otros temas" al final).

L7 (bug): 7.3 falló dos veces porque su material de LISTENING era un drill de pronunciación (`can` /kən/ vs `can't` /kænt/) sin palabras de producto, y el anclaje de dominio lo rechazaba. Se amplió el anclaje al **lugar de trabajo** (office, meeting, team, client, demo, interview, sprint, hospital, clinic, hire, onboarding, launch): un drill ambientado en una daily es del dominio, un texto sobre vacaciones no.
L8 (bug): 8.4 falló por timeout del motor (75 s) en la primera pasada y entró en el reintento; el timeout por intento se mantiene acotado a propósito.
