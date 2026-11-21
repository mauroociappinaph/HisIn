# HisIn — Entrenador de vocabulario + historias generadas por el motor

Feature: el entrenador de vocabulario gana modos de práctica, y el motor de generación gana el `kind: "story"` para que las historias provengan de contenido validado y persistido, nunca de texto escrito a mano en el cliente.
Owner: mauroociappina · Branch: `feat/vocab-trainer-stories`

## Specs

S1. El motor acepta `kind: "story"`. Cada historia valida: `module` dentro de los módulos reales, `level` CEFR, `title` 5–120 caracteres, `body` 400–3000, `translation` en español 20–900, y 3–12 `targetWords` únicos.

S2. Toda palabra declarada en `targetWords` aparece en el `body` (comparación case-insensitive con límites de palabra e insensible a multi-palabra). Si falta aunque sea una, la respuesta se rechaza y no se escribe nada.

S3. Cada historia se persiste en `VocabularyStory` con clave natural `(module, level, title)`: re-generar no duplica filas.

S4. `GET /api/stories?module=&level=` lista las historias de ese módulo y nivel, más nuevas primero. Ambos parámetros son opcionales y validados.

S5. El entrenador de `/review/vocab` suma el modo «Historias»: lista de relatos, lectura con las target words resaltadas, audio del texto completo y toggle de traducción.

S6. El resaltado respeta límites de palabra, conserva el texto original y soporta términos de varias palabras.

S7. `/studio` permite pedir `kind: story` como cualquier otro.

S8. `README.md` documenta el nuevo kind, el endpoint y el modelo.

S9. `pnpm test` cubre el schema de historia, el resaltado y la deduplicación del repositorio.

## Tasks

| ID | Specs | Ruta | Commit |
| --- | --- | --- | --- |
| T1 | S1, S2 | schema + prompt + tests | U2 |
| T2 | S3 | modelo Prisma + migración | U2 |
| T3 | S3 | persistencia idempotente + service | U2 |
| T4 | S4 | repository de lectura + `/api/stories` | U2 |
| T5 | S6 | resaltado puro + tests | U3 |
| T6 | S5 | modo Historias en el entrenador | U3 |
| T7 | S7, S8 | `/studio` + README | U3 |
| T8 | S9 | correr el motor y verificar | U3 |

## Log

L1 (usuario, textual): «Podes lebantar ambos servidores ?»

L2 (usuario, textual): «Entra a mi chrome abierto y hacelo con esta interface y dinamica: https://gemini.google.com/app/5f572d33bf6dc859?hl=es»

L3 (usuario, textual): «Genrea el motor de la app y hace add push y commit»

L4 (usuario, textual): «TOma el reol de CTO y de Profesor de Ingles con 20 anos de experiencia de Hardvar y toma todas las decisiones vos»

L5 (decisión, CTO): el contenido de práctica sale del motor de la app, nunca hardcodeado; por eso el trabajo es `kind: story` + modo Historias, no texto inventado. El entrenador se entrega en la misma rama porque comparte la UI del modo.
