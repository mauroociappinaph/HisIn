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

## Topic UX, títulos en inglés y Academic English (L3-L6)

L3 (usuario, textual): «BUSCA EN INTERNET PARA QUE LA UI E UX SEA MAS INTUITIVA Y MEJOR EN TOPIC Y ASEGURATE QUE LO QUE ESTA EN HOME Y TOPIC SE COMUNIQUE CON EL RESTO DE LA APP … LOS TITULOS DE LOS TEMS DEBEN IR EN INGLES NO ESPANOL … ACORDATE DE USAR LOS ESTILOS Y TIPOGRAFIA DE HISMIA».
L4 (investigación): las fuentes coinciden en tres cosas para una lección larga: un índice pegajoso que marque dónde estás, la posición en la secuencia («Lección 3 de 8») y un control de Siguiente que no obligue a volver arriba. Fuentes: NN/g (in-page links, table of contents), USWDS typography, OpenLMS TOC, W3C WCAG 2.2.
L5 (ejecución): `TopicNav` (índice pegajoso con scroll spy, arriba del contenido en mobile), breadcrumb Módulos / módulo / submódulo, «Submódulo X de Y» con barras de posición, anterior/siguiente, y accesos a repaso, gramática y módulo. Home suma anclas `#module-N` y «Entrar →». Los 109 títulos de tema y los 36 nombres de módulo pasaron a inglés, y el módulo 40 suma 8 submódulos de Academic English con sus 4 materiales y glosario.
L6 (ejecución): el endpoint de glosario reintenta una vez con su propio rechazo: los 3 temas que quedaban sin glosario lo obtuvieron.

## Lección visual y dominios profesionales (L7-L9)

L7 (usuario, textual): «TOQUE PRAISE PERO NO ME LO TRADUJO APARTE FALTA LA PARTE DIDACTICA DE TODO ESTO … ESTA UI ES HORRIBLE … FALTA LA PARTE MAS DIDACTICA QUE DEBE SER MAS VISUAL USANDO GRAFICOS O LO QUE SEA MEJOR PRACTICA BUSCA EN INTER».
L8 (investigación): regla corta → ejemplos resaltados → error con su corrección → práctica inmediata, y divulgación progresiva en mobile. Fuentes: understoodin.com tutorial, millionbooks classroom, techclass microlearning, zollang learning phases.
L9 (ejecución):
- Click en cualquier palabra pide traducción (`POST /api/glossary/translate`) **además** de guardarla, y la muestra en el panel con la definición; antes sólo decía "guardada".
- La lección es de 5 pasos numerados con esfuerzo estimado: regla → práctica → lectura → escritura → historia.
- Bloque **Línea del tiempo** (SVG) que ubica el tiempo verbal, la **fórmula** cuando el material la cita, la tabla **✗ / ✓** sólo cuando la trampa declara el contraste, y ejemplos filtrados (sin fragmentos de dos palabras, sin frases en español).
- El índice es una tira horizontal de chips en mobile y lista pegajosa en desktop.
- Módulos 41-44: Medical, Legal, Aviation y Tech English (16 submódulos) con su glosario; el ancla de dominio se amplió a los dominios profesionales.

## Cards visuales y módulo 45 (L10-L11)

L10 (usuario, textual): «MEJOA TODAS LAS CARD ADENTRO DE TOPIC USA GRAFICOS MAS DESCRIPTIVOS , ILUSTRACIONES SI HACE FALTA SEPARA BIEN LOS TERMINOS SE MAS DIDACTICO EN EXPLICACIONES … AGREGA UN PAR DE CARD MAS UNA PARA LAS FRASES VERBALES SEGUN EL TOPICO QUE ESTA Y OTRA PARA DIVIDIR MEJOR EL PUNTO 1 LA REGLA».
L11 (ejecución): la lección pasó de 5 a 8 pasos: **La idea** (párrafo grande + línea del tiempo ilustrada con zonas y guías) · **La estructura** (fórmula en bloques + ejemplos en filas con borde) · **El error** (tarjetas ✗ / ✓ o callout) · **Frases hechas del tema** (tabla término · español · tipo, desde el glosario, sólo unidades multipalabra) · **Practicá** · **Leé** (barra de largo + tabla de términos del texto) · **Escribí** (barra de objetivo de palabras) · **La historia**. Cada card tiene icono SVG propio, número, un hint de una línea y su esfuerzo. La fórmula ahora también se lee sin comillas (`have/has + past participle`).
L12: módulo **45 · Exam and certification English** (5 submódulos: arquitectura y equivalencias MCER, rúbricas de writing por tarea/coherencia y por léxico/gramática, rúbricas de speaking por fluidez/pronunciación y por gramática/léxico).

## Lección en inglés, prólogos, role-play y cierre del riesgo (L13-L14)

L13 (usuario, textual): «AGREGA UN PROLOGO PARA CADA MODULO Y SUB NMODULO. NADA TIENE QUE ESTAR EN ESPANOL … EN EL INICIO HABRIA QUE AGREGAR UN BRADCRUM PARA MODULOS Y SUB MODULOS … USA LIBRERIAS EXTERNAS PARA LOS GRAFICOS … AGREGA UNA CARD MAS DE ROLE-PLAY EN TODAS LAS LECCIONES … SOLUCIONA EL RISK».
L14 (ejecución): la lección queda con copy 100% en inglés, breadcrumb completo (Módulos › módulo › código › título), prólogo de módulo (`UnitMeta`) y de submódulo (`Topic.prologue`), la idea partida en puntos numerados, card de role-play con escenario + modelo, gráficos con **Recharts** (`BarChart`, `LineChart`), y una compuerta de consistencia que reintenta la generación cuando reading/writing/story no usan la estructura que enseña la gramática.
L15 (riesgo cerrado con evidencia): 139 temas · 139 slugs únicos · 139 códigos únicos · 0 códigos duplicados dentro de un módulo · 536 materiales · 2.201 entradas de glosario · 43 módulos. Seed idempotente re-ejecutado tres veces sin cambios de conteo; 264 tests; build 0.
L16 (bloqueo externo): la cuota de Gemini devolvió 429 al generar el módulo 43 y los prólogos, así que esos contenidos quedan pendientes de cuota, no de código. Los endpoints (`/generate`, `/prologue`, `/units/<n>/prologue`, `/story`, `/quote`) reintentan con la compuerta de consistencia y pueden re-ejecutarse solos.
