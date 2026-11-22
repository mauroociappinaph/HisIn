# HisIn — sin listening, temario 11-17, historias y UI jugable

Feature: quitar el material de listening, sumar los 16 submódulos nuevos (10 de gramática + 6 de vocabulario), una historia por submódulo, y una capa de juego en la UI.
Owner: mauroociappina · Branch: `feat/vocab-trainer-stories`

## Specs

G1. Textual del usuario: «ELIMINA LAS PARTES DE LISENING». `TOPIC_SKILLS` pasa a GRAMMAR · READING · WRITING · STORY; la migración borra las filas LISTENING y recrea el enum (no queda un valor muerto); el módulo `listening` se oculta de home y hub.

G2. Textual: «MEJORA LA UI/UX HACIENDOLA MAS 'JUGABLE'». Nivel calculado desde XP (`levelFromXp`), anillo de progreso de nivel en home y chip `Nv N` en el navbar, anillo de meta diaria, racha con estado real (activa sólo si practicaste hoy), tira de logros, tarjetas de módulo con anillo de % y acción `▶ Empezar/Continuar`, y micro-interacciones (hover elevate, active scale).

G3. Textual: «Submódulos de gramática (10) … vocabulario (6) … DESPUÉS … CREA LAS HISTORIAS PARA CADA UNO DE ESTOS MODULOS». Los 16 submódulos entran al temario (módulos 11-17) y cada uno recibe **4 materiales: gramática, reading, writing e historia**.

G4. Las historias se generan con el mismo pipeline y la misma validación de dominio; se guardan como `TopicMaterial` con `skill = STORY`.

G5. Los logros se nombran por lo que el alumno hizo ("Arrancaste", "Semana completa"), no por un número; los pendientes se muestran como meta, nunca como candado.

## Tests

`src/modules/progress/game.test.ts` (8): curva de nivel, acarreo de XP sobrante, crecimiento de la curva, XP grande sin bucle, NaN/negativos clampeados, logros de inicio y racha, logros de largo plazo, y estado de la racha (activa sólo si hay práctica hoy).

## Log

L1 (usuario, textual): el pedido de quitar listening, hacer la UI jugable y crear historias por módulo, con los 16 submódulos transcritos.
L2 (ejecución): 16 submódulos generados con 4 materiales cada uno (64), y backfill de historia para los 26 submódulos previos (26). Estado final: **42 temas · 168 materiales · 42 historias**.
