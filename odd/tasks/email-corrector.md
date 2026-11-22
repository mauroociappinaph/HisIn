# HisIn — corrector de emails y mazo de errores

Feature: el alumno escribe un email real de trabajo y recibe la versión corregida, el porqué de cada cambio, la lección que lo explica y el error archivado para el repaso.
Owner: mauroociappina · Branch: `feat/stories-interactive`

## Specs

E1. Un email de 40 a 4.000 caracteres, con destinatario declarado (inversor, socio clínico, IT del hospital, candidato, equipo, regulador).

E2. La corrección devuelve: versión corregida, resumen en inglés, veredicto de registro (`too-informal | right | too-formal`) y puntajes 1-5 de gramática, léxico, registro y coherencia.

E3. Cada cambio declara tipo (`grammar | vocabulary | register | cohesion | spelling`), el fragmento **original exacto**, la corrección, el porqué en una oración y el **slug de la lección** que lo explica.

E4. Un `topicSlug` que no existe en el temario se guarda como `null`: un enlace roto desde la propia corrección es peor que no tener enlace.

E5. Cada cambio se guarda como `Mistake` y entra al mazo con SM-2 (la misma escala 0-5 del vocabulario). Tres aciertos limpios lo retiran.

E6. El mazo muestra primero lo que vence hoy; si no hay nada vencido, muestra lo pendiente.

E7. El corrector no reescribe por gusto: arregla lo que está mal y deja lo que está bien (`CORRECTION_SYSTEM_PROMPT`).

E8. La corrección se reintenta una vez con su propio rechazo si no pasa la validación.

## Tests

`src/modules/production/correction.test.ts` (7): corrección bien formada, tolerancia a fences y prosa alrededor, rechazo de tipo desconocido, rechazo de puntaje fuera de rango, promedio de criterios a un decimal, prompt con audiencia + email + índice de lecciones, y el system prompt que prohíbe reescribir por gusto.

## Log

L1 (usuario): «q es corrector de email ?» → explicación → «si».
L2 (ejecución): migración `Mistake`, `/api/production/email`, `/api/mistakes`, `/api/mistakes/[id]`, `/write`, `/review/mistakes`, entrada «Escribir» en el nav.
L3 (verificación con un email real, 7 errores): `doctor Smith → Dr. Smith` · `I want to tell you that → I am writing to inform you that` · `dont work → does not integrate` · `Also → Furthermore` · `problems for to integrate → challenges in integrating`, cada uno enlazado a su lección. Registro: `too-informal`. Puntajes 2/3/2/2. Calificación de un error con calidad 5 movió su próximo repaso y 285 tests verdes.

## Riesgo cerrado (L4-L5)

Riesgo declarado: tabla nueva alimentada por texto libre del usuario, con escritura de filas desde la respuesta del modelo.

| Control | Evidencia |
| --- | --- |
| Entrada acotada | email de 2 caracteres → `400` «write a little more»; email de 4.500 → `400` «longer than 4000 characters» |
| Slug validado | `linkableChanges` descarta una lección inexistente y la deja en `null` (test) |
| Sin duplicados | índice único `(userId, lower(original))`; reenviar el mismo email dos veces dejó **0 fragmentos repetidos** |
| Un error, una tarjeta | la clave de deduplicación es el fragmento original, no el par original/corregido (test) |
| Migración en limpio | CI corre `prisma migrate deploy` sobre Postgres vacío en cada PR |
| Sin escritura parcial | las filas se guardan solo después de validar la corrección completa |
