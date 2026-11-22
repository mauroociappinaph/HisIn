# HisIn — glosario de las historias, CI y niveles C1/C2

Feature: la historia muestra la traducción y entiende frases verbales y patrones; el merge a main deja de ser el único paso sin verificar; entran los bloques C1, C2 y Business English.
Owner: mauroociappina · Branch: `feat/stories-interactive`

## Specs

S1. Textual del usuario: «ESTO ESTA BUENO CUANDO SE PASA EL MOUSE POR ARRIBA PERO TIENE QUE TAMBIEN APARTE DE ESO MOSTRAR LA TRADUCCION, INTERPRETAR LAS FRASES VERBALES Y PATRONES». Cada historia tiene glosario guardado (`StoryGloss`): término, traducción rioplatense, tipo y nota opcional.

S2. Una unidad multipalabra es **una** entrada y **un** chip clickeable: `put up with`, `used to work`, `edge case`. Nunca tres palabras sueltas sin sentido.

S3. El tooltip nativo muestra `término · traducción · nota`; el panel bajo el párrafo muestra término, traducción, tipo y nota, y **conserva el último visto** para que la traducción no desaparezca al mover el mouse.

S4. El glosario se genera una vez por tema y es idempotente: `saveGlosses` no reescribe lo que el alumno ya leyó.

S5. El motor a veces devuelve el término con la puntuación de la historia (`until dawn.`): se limpia al parsear y se descartan unidades de más de 5 palabras.

S6. Textual del usuario: «SOLUCIONA EL RISK 5». El riesgo era que el merge a main fuera el único paso sin verificación: ahora `.github/workflows/ci.yml` corre install, migraciones, `tsc`, `lint`, `test` y `build` contra un Postgres real en cada PR y en main.

S7. Textual del usuario: los 24 submódulos C1/C2 y el bloque «Business English (Negociación, presentaciones ejecutivas, redacción corporativa y comunicación intercultural)». Entran como módulos 31-39, con los mismos 4 materiales.

## Tests

`src/modules/topics/glossary.test.ts` (13): dedupe de términos repetidos, rechazo de glosarios cortos y de tipos inválidos, limpieza de puntuación, unión de la frase en un solo token, no inventar match para una forma flexionada, prioridad de la unidad más larga, texto y espaciado intactos al re-renderizar, tope de búsqueda y el prompt del motor.

## Log

L1 (usuario, textual): «SOLUCIONA EL RISK 5 DESPUES [captura del hover] ESTO ESTA BUENO CUANDO SE PASA EL MOUSE POR ARRIBA PERO TIENE QUE TAMBIEN APARTE DE ESO MOSTRAR LA TRADUCCION, INERPREATAR LAS FRASES VERBALES Y PATRONES … LAS HISTORY TENDRÍAN QUE RE DIRECCIONAR ACA: /review/vocab» + los 24 submódulos C1/C2 + Business English.
L2 (ejecución): glosario generado para las 73 historias; 240 tests; build y lint verdes.
