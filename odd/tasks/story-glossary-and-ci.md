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

## Puntuación, títulos fuera de la card, dedupe y dificultad progresiva (L17-L19)

L17 (usuario, textual): «FALTAN . , Y OTROS SIGNOS EN LA PARTE DE HOSTORIAS DENTRO DE TOPIC EN LA PARTE LEE TAMBIEN ESTA TODO JUNTO … EN TOPIC SACA LOS NUMEROS Y TITULOS DE LA CARD Y PONELO ARRIBA DE LAS CARDS MAS GRANDE PARA QUE SE DESTAQUEN … CREA UN ALGORITMO PARA QUE NO SE REPITA INFORMACION Y LAS LECCIONES SUBAN LA DIFICULTAD A MEDIDA QUE SE VA AVANZANDO. DESPUES DE ESTO EJECUTALO Y ADAPTA LA APP».
L18 (diagnóstico medido): 122 de 134 readings y 126 de 134 stories venían sin saltos de párrafo, y 124 materiales tenían el punto pegado a la palabra siguiente (`good.Instead`). `normalizeSpacing` y `toParagraphs` lo resuelven en el render, sin reescribir el contenido guardado; el lector de historias ahora pagina por párrafo y mantiene cada palabra clickeable.
L19 (ejecución): títulos de paso fuera de la card, en 24 px y numerados `01..09`; módulo 44 (formación docente: gramática pedagógica y discurso, fonología avanzada, SLA y tratamiento del error); `progression.ts` con shingles + Jaccard ponderado, `findDuplicates`, `repeatedSentences`, `difficultyScore` y `nextLesson`; compuerta de repetición en `/generate`; home con "Next lesson · easiest undone" y barra de dificultad por submódulo.
L20 (auditoría ejecutada): `pnpm audit:duplicates` sobre 536 materiales → **0 pares casi duplicados (≥0,55)** y **0 materiales con oración repetida**. El algoritmo confirma que el contenido existente no se repite y queda como compuerta para lo que se genere.

## Módulo 44 completo y compuerta de deriva temática (L21-L22)

L21 (usuario, textual): «4. Enfoques metodológicos y práctica reflexiva … 5. Diseño curricular y evaluación de programas … 6. Desarrollo profesional y producción académica» → módulo 44 pasa de 3 a 6 submódulos (44.4 enfoques metodológicos y práctica reflexiva, 44.5 diseño curricular y evaluación de programas, 44.6 desarrollo profesional y redacción académica).
L22 (defecto encontrado durante la verificación): `curriculum-design-program-evaluation` recibió una GRAMMAR sobre «should have + past participle». Causa: en temas que no son gramaticales el motor rellena el slot GRAMMAR con una regla cualquiera. Arreglo: `topicKeywords`/`mentionsTopic`/`isGrammarTopic` y una **compuerta de deriva temática** en `/generate` (sólo para temas de dominio) que reintenta nombrando el desvío; más `pnpm audit:topics` que lista los 20 temas de dominio cuyo material se desvió, para reconstruirlos cuando haya cuota.

L23 (historias conectadas ejecutadas): las 145 historias se reescribieron en orden de temario con continuidad de mundo (Elena y Marcus atraviesan 43.1 → 43.5 con la misma empresa). Todas entre **293 y 390 palabras**. 144 prólogos y 144 citas; 43 prólogos de módulo.
L24 (reparación de deriva): `scripts/repair-drift.ts` borra **solo** los materiales desviados de temas de dominio cuando 3 o más de 4 se desviaron, y el generador rellena esas ranuras. Dry-run primero, `--apply` después; después se re-ejecuta `audit:topics` para confirmar.

L25 (defecto de resiliencia encontrado): `resolveModels()` devuelve una cadena ordenada de modelos, pero **todas las rutas usaban `const [model] = resolveModels()`**, así que el primer 429 terminaba la generación. `runWithFallback` recorre la cadena (presupuesto completo para el primero, 45 s para los siguientes) y las ocho rutas de contenido lo usan. La generación de un tema pasó de 502 a 201 con el proveedor principal agotado.
L26 (borrado seguro): `repair-drift` ahora escribe un backup JSON en `odd/backups/drift-<timestamp>.json` **antes** de borrar y acepta `--restore <archivo>`; sin `--apply` solo reporta. Motivo: una corrida anterior borró materiales y la generación falló por cuota, dejando 13 temas incompletos.

L27 (la compuerta de deriva pasó a diagnóstico): medirla como bloqueo generaba 12 falsos positivos (un memo sobre redacción corporativa no repite "corporate writing"). Se retiró del camino de generación y `audit:topics` reporta dos señales separadas: **gramática desviada** (el defecto real) y **señal suave** (ningún término del título en 3+ materiales). El caso genuino, `curriculum-design-program-evaluation`, se regeneró con backup previo (`odd/backups/curriculum-grammar.json`) y ahora enseña "Mixed conditionals for programme evaluation decisions".
L28: relleno completado con la cadena de fallback → **580 materiales, 0 temas incompletos, 145 prólogos, 44 prólogos de módulo, 145 citas, 2.386 glosas**. 18 historias volvieron a quedar cortas al regenerarse sus materiales; se reescriben con `/story` en un job aparte.

L29 (cierre de riesgos): `pnpm backup:content` + `--restore` verificados como round trip (149/596/2.490/45 antes y después). PR #2 abierto con guía de revisión por grupos de commits; CI corrió de verdad y quedó **verde en los siete pasos** (run 45074266573). Registro completo en `odd/tasks/risks.md`.
