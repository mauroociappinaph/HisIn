# HisIn — contexto de clase y sección de Gramática

Feature: el contexto pedagógico (disciplina, nivel educativo, duración, secuencia) pasa a ser un dato validado que gobierna los planes y las lecciones, y aparece la sección de Gramática con los tiempos.
Owner: mauroociappina · Branch: `feat/vocab-trainer-stories`

## Specs

S1. Textual del usuario: «Asignatura o materia (… salud, derecho, ingeniería, negocios, lenguas) · Nivel educativo (grado inicial, grado avanzado, posgrado, formación profesional) · Duración de la clase (45, 60, 90, 120 minutos) y si es única o parte de una secuencia semanal».

S2. Los cuatro parámetros se guardan en el perfil del aprendiz y toda pantalla que arme una sesión los usa; ninguna puede inventar sus propios valores por defecto.

S3. `validateClassDesign` rechaza un contexto incompleto nombrando el campo que falta, y es la única puerta de entrada (API y repositorio).

S4. `buildLessonFlow` reparte los minutos en cinco fases (apertura con recuperación, explicación acotada, ciclo activo, aplicación, cierre con ticket de salida) y **suma exacta** la duración pedida; el cierre nunca queda en cero.

S5. La tarea de aplicación depende de la disciplina (nota clínica, cláusula, incident report, board update, mensaje de trabajo) y la secuencia decide si hay prework y reexposición (semanal) o tarea auténtica de cierre (única).

S6. Un plan de clase se guarda como snapshot (contexto + flujo) para que no cambie bajo el aprendiz cuando se ajuste el algoritmo.

S7. Textual del usuario: «Faltan Niveles. ¿Dónde aprendo por ejemplo dónde se usa present perfect? O past tense?». Existe `/grammar` con mapa por eje y nivel, y `/grammar/[slug]` con: fórmula, «dónde se usa» (2+ situaciones del trabajo), ejemplos con audio y traducción, errores del hispanohablante y enlaces a patrones.

S8. Hay página específica de contraste *present perfect vs. past simple*, porque es la decisión que más se falla en una reunión.

S9. Ningún tema está bloqueado: el nivel ordena, no habilita.

S10. Tests: reparto exacto de minutos en las cuatro duraciones, orden de fases, cierre ≥3 min, prework/reexposición por secuencia, aplicación distinta por disciplina, validación con el campo faltante, integridad del contenido de gramática (slugs únicos, usos, ejemplos traducidos, errores completos, contrastes presentes).

## Tasks

| ID | Specs | Ruta | Estado |
| --- | --- | --- | --- |
| T1 | S2, S3, S4, S5 | `src/modules/classroom/design.ts` + tests | hecho |
| T2 | S6 | modelo `ClassPlan` + migración + repositorio | hecho |
| T3 | S2, S3 | `GET/PUT/POST /api/class` | hecho |
| T4 | S7, S8, S9 | `src/modules/grammar/content.ts` + `/grammar` + `/grammar/[slug]` | hecho |
| T5 | S1, S2 | `/class` (contexto + generación + guardados) y chip de contexto en `/lessons` | hecho |

## Log

L1 (usuario, textual): «Aplica todo esto en la app: 1. Asignatura o materia… 2. Nivel educativo… 3. Duración de la clase… Aplicalo bien todo eso. En toda la app. Crea test para que siempre se aplique en todos lados. Crea secciones si crees que son necesario… Aparte de esto Faltan NIveles. Donde aprendo por ejemplo donde se usa present perfect? O pase tence?»

## Ampliación: aplicarlo en toda la app

S11. El nivel educativo admite **grupo mixto**: `educationLevel = "mixto"` con `educationMix` (dos o más niveles, suma exacta 100%). Se rechaza una mezcla incompleta, con niveles desconocidos, o declarada sin nivel mixto.

S12. La **duración decide el tamaño de la práctica**: 45→8, 60→12, 90→18, 120→24 ítems por sesión (`itemsForMinutes`), usado por el desafío del entrenador.

S13. El **contexto viaja al motor**: `generationRequestSchema` acepta `context` (≤400) y `/api/ai/generate` lo rellena desde el perfil con `contextPromptFragment`, así todo lo generado desde la app respeta disciplina, nivel educativo, duración y secuencia.

S14. El contexto se captura en el **onboarding** (bloque 4) y se edita en `/class`; `/progress` lo muestra con link para cambiarlo, y cada lección ofrece "Diseñar la clase" con su título precargado.

L2 (decisión): el caso mixto se modela como composición porcentual, no como lista, porque es lo que un docente declara y lo que permite verificar que suma 100%.
