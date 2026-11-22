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
