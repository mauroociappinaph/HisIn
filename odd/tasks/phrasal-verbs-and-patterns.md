# HisIn — phrasal verbs, patrones y vocabulario propio

Feature: el banco de vocabulario aprende tres formas (palabra, phrasal verb, patrón), el aprendiz puede cargar las suyas, y cada forma entra al mismo motor de repaso espaciado.
Owner: mauroociappina · Branch: `feat/vocab-trainer-verbs-patterns`

## Specs

S1. Textual del usuario: «Agrega despues un input para yo agregar phrase verbs , palabras y Patrones. Falta una seccion de phrase verbs y una de patrones». Existen tres formas de entrada en el banco, distinguidas por `kind`: `WORD`, `PHRASAL_VERB`, `PATTERN`. Toda entrada existente queda como `WORD` sin perder datos (migración aditiva con default).

S2. Un `PHRASAL_VERB` guarda su partícula (`particle`): la última palabra del término debe estar en la lista cerrada de partículas (`up, down, off, on, in, out, over, through, back, away, along, around, by, for, into, with, across, apart`). Si no está, la entrada se rechaza con un error que nombra la palabra inválida.

S3. Un `PATTERN` describe una estructura con slots: contiene `+` o al menos tres palabras, y su `definition` explica la función (qué comunica), no solo la traducción. Un `WORD` es un término sin espacios de 2 a 40 caracteres.

S4. El aprendiz puede agregar entradas propias (`POST /api/vocabulary`) con término, tipo, definición, ejemplo y nivel. La entrada se valida (S2, S3), se guarda con `source = USER` y **entra al repaso espaciado de inmediato** creando su `VocabularyReview` inicial, para que no quede invisible.

S5. Una entrada propia puede borrarse (`DELETE /api/vocabulary/[id]`) solo si es `source = USER`; las sembradas o generadas no se pueden borrar desde la app. Borrar borra también su repaso (cascade) y nunca toca otra fila.

S6. `GET /api/vocabulary?module=&level=&kind=` filtra por tipo cuando se pide `kind`; sin `kind` el comportamiento actual no cambia (contrato existente intacto).

S7. Hay dos secciones nuevas enlazadas desde la navegación: `/phrasal-verbs` y `/patterns`. Cada una lista sus entradas con audio, nivel, módulo, definición y ejemplo, permite filtrar y agregar una entrada nueva del tipo correspondiente desde la propia sección.

S8. El entrenador (`/review/vocab`) muestra el `kind` en las tarjetas y el desafío funciona igual para las tres formas (el cloze usa el ejemplo propio de la entrada).

S9. Tests: reglas de clasificación y validación de S2/S3 (partícula válida e inválida, patrón con y sin estructura, palabra con espacios) y el filtro por `kind`.

S10. Verificación observada: una entrada agregada desde `/phrasal-verbs` aparece en la lista, en el repaso SRS y en el entrenador; borrarla la quita de los tres lugares.

## Tasks

| ID | Specs | Ruta | Commit |
| --- | --- | --- | --- |
| T1 | S1 | migración: `kind`, `particle`, `source`, `extraExample`, `notes` | U1 |
| T2 | S2, S3, S9 | reglas puras de entrada + tests | U1 |
| T3 | S4, S5, S6 | POST/DELETE/GET con validación y repaso inicial | U1 |
| T4 | S7 | `/phrasal-verbs` y `/patterns` + navegación + formulario | U2 |
| T5 | S8, S10 | integración en el entrenador y verificación end-to-end | U2 |

## Log

L1 (usuario, textual): «Agrega despues un input para yo agregar phrase verbs , palabras y Patrones. Falta una seccion de phrase verbs y una de patrones . Hace una busqyeda en internet de otras paginas web para aprender ingles y comparala con la nuestra. Encontra cosas malas , mejorables , para agregar y mejorar la didactica , etc»

L2 (usuario, textual, contexto previo): «hice el test de nivel y me dio C2 y no hay ninguna leccion ni nada para hacer. En la mayoria de los test el primero input para agregar es siemrpe el correcto»

## Findings de la comparación (se completa con la investigación)

_Pendiente: se adjunta al terminar la investigación de mercado._

S11. Un phrasal verb guarda metadata gramatical, no solo significado: `separable` (booleano), `register` (`neutral` | `informal` | `formal`) y el tipo de multi-word verb se deduce de la partícula. La sección agrupa por partícula (up = completar/aumentar, out = excluir/descubrir) porque así se enseña el sistema, no la lista.

S12. Un patrón guarda su función comunicativa (`function`: `hedge`, `soften`, `persuade`, `report`, `compare`) además del frame con slots, y su `notes` documenta el error típico del hispanohablante (p. ej. `make + to + verb`, mal uso de `would rather`).

S13. El formulario de carga pide primero el tipo (palabra / phrasal verb / patrón), porque los campos dependen de él. Exige: glosa en palabras propias (no copiar el diccionario), una oración personal del contexto de trabajo del aprendiz, y la fuente donde la encontró. Para phrasal verb agrega separable, registro y partícula; para patrón, función y frame con slots.

S14. La tarjeta de repaso por defecto es un cloze generado sobre la oración propia del aprendiz, no una tarjeta definición→palabra: la recuperación productiva supera a la de reconocimiento (SAGE 2024), y el MCQ sobreestima el conocimiento.

S15. El repaso mezcla tipos (palabras, phrasal verbs, patrones) en la misma cola en lugar de separarlos por sección: la práctica intercalada retiene más que la bloqueada (Nakata & Suzuki 2019).

S16. Anti-bloat: el formulario avisa (no bloquea) cuando el aprendiz supera 10 altas en el día y rechaza duplicados por término + tipo. La cola infinita es el modo de falla documentado de LingQ.

## Findings de la comparación (investigación de mercado)

Comparado contra Duolingo, Anki, Quizlet, Clozemaster, LingQ, British Council LearnEnglish, Cambridge Write & Improve, Busuu, Babbel, ELSA Speak, Phrasal Verb Demon, UsingEnglish, Perfect English Grammar y YouGlish.

**Falencias de HisIn, por orden de gravedad**

1. Práctica de reconocimiento solamente: todo el lazo es MCQ, así que el XP mide la forma más débil de recuperación y sobreestima el conocimiento.
2. Una sola oración por palabra: los phrasal verbs de alta frecuencia son polisémicos (Gardner & Davies 2007) y la app enseña un sentido único sin separabilidad, registro ni colocación, lo que activamente enseña errores (`put away them`).
3. Sin capa de patrones: el aprendiz no puede generalizar (`make + object + verb`, hedging, `verb + gerund`); cada necesidad de business english se reaprende palabra por palabra.
4. Sin producción: ninguna tarea exige escribir o hablar con feedback, así que no hay lazo de corrección.
5. Sin metadata de gramática ni errores típicos: el diccionario de la app no puede decir qué partícula, qué posición del pronombre ni qué registro.

**Lo que hacen los mejores y HisIn no**

- Unidad de repaso = sentido, no palabra (Anki PHaVE: 150 verbos → 288 tarjetas).
- Práctica sobre oraciones, no palabras sueltas (Clozemaster, LingQ, Duolingo).
- Canal de producción con feedback (Write & Improve, Busuu, ELSA).
- Metadata explícita: separabilidad, orden, registro, función.
- CEFR por sentido y por construcción (English Vocabulary Profile, English Grammar Profile).
- Búsqueda de ejemplos reales (YouGlish).

**Decisiones de diseño adoptadas** (ver S11–S16): separabilidad y registro en cada phrasal verb, agrupación por partícula, función en cada patrón, cloze sobre la oración propia, cola única mezclada, formulario que fuerza paráfrasis y oración personal, y anti-bloat.
