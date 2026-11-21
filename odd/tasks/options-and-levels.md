# HisIn — opciones barajadas y niveles sin contenido

Feature: dos defectos reportados por el usuario tras hacer el test de nivel (C2).
Owner: mauroociappina · Branch: `feat/vocab-trainer-stories`

## Specs

S1. Textual del usuario: «En la mayoria de los test el primero input para agregar es seimpre el correcto». Ninguna pregunta se muestra con las opciones en el orden almacenado: la presentación baraja de forma determinista por id de pregunta, conserva el valor de la respuesta entre las opciones y no pierde ni duplica ninguna opción.

S2. La corrección compara por valor, nunca por índice: barajar no altera el resultado de `/test` ni de `/practice`.

S3. Textual del usuario: «me dio C2 y no hay ninguna leccion ni nada para hacer». Si el nivel del aprendiz no tiene contenido para un módulo, la app usa el nivel disponible más cercano (exacto → el más bajo por debajo → el más alto por arriba) y muestra qué nivel está usando, en vez de devolver una pantalla vacía.

S4. El motor produce contenido C2 real (vocabulario y lecciones) para que un aprendiz C2 tenga material propio y el fallback sea la red, no la solución.

S5. Tests: el barajado no deja la respuesta siempre en la primera posición, es determinista para el mismo id y conserva el conjunto de opciones; la resolución de nivel cubre nivel exacto, vecino inferior, vecino superior y catálogo vacío.

S6. Verificación observada: distribución de la posición de la respuesta en la UI ya no concentrada en la primera; un aprendiz C2 encuentra lecciones y práctica con contenido.

## Tasks

| ID | Specs | Ruta | Commit |
| --- | --- | --- | --- |
| T1 | S1, S2 | `presentOptions` puro + tests | U1 |
| T2 | S1, S2 | `/test` y `/practice/[module]` usan la presentación barajada | U1 |
| T3 | S3, S5 | `resolveLevel` puro + tests | U1 |
| T4 | S3 | wiring de nivel en práctica y lecciones | U1 |
| T5 | S4 | generar vocabulario y lecciones C2 con el motor | contenido (DB) |
| T6 | S6 | verificación end-to-end | U1 |

## Log

L1 (usuario, textual): «hice el test de nivel y me dio C2 y no hay ninguna leccion ni nada para hacer. En la mayoria de los test el primero input para agregar es siemrpe el correcto»

L2 (evidencia, parent): de 74 preguntas, la respuesta está en la posición 1 en 41 (55%), en la 2 en 18, en la 3 en 3; el cliente renderiza `q.options` sin barajar. Lecciones por nivel: A1=1, B1=6, B2=1, C1=2, **C2=0**; vocabulario por nivel: A1=1, A2=1, B1=4, B2=6, C1=4, **C2=0**.
