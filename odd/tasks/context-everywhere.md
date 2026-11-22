# HisIn — el contexto de clase, visible y operativo en toda la app

Feature: los tres parámetros (disciplina, nivel educativo, duración + secuencia) dejan de estar escondidos en `/class` y pasan a verse y a cambiar el comportamiento en las superficies principales.
Owner: mauroociappina · Branch: `feat/vocab-trainer-stories`

## Specs

C1. Textual del usuario (3ª vez): «Aplica todo esto en la app: 1. Asignatura o materia … 2. Nivel educativo … y, si es mixto, cómo se compone. 3. Duración de la clase … y si es única o parte de una secuencia semanal». Diagnóstico: estaba guardado y usado en planes, pero **invisible** en la entrada, y no afectaba noticias ni el alta rápida.

C2. El navbar muestra el contexto activo como chip (`salud · 120 min`) que lleva a `/class`: se ve siempre, sin buscarlo.

C3. `Hoy` abre con la barra **Tu contexto de clase**: disciplina, nivel educativo (incluido mixto), duración y secuencia, editables en el momento; cada cambio persiste y refresca la app.

C4. **Noticias por disciplina**: `feedsForDiscipline` elige las fuentes (salud → Fierce/MobiHealth/STAT; negocios → TechCrunch/Sifted/STAT; derecho e ingeniería → prensa de negocio; lenguas → todas) y el sync devuelve la disciplina usada. Una disciplina desconocida cae al set completo, nunca a cero fuentes.

C5. El análisis de una noticia recibe el contexto de clase en el prompt (`Reader context: …`), y el alta rápida también: los ejemplos se escriben para esa disciplina, nivel y duración.

C6. Tests: selección de fuentes por disciplina con fallback, contexto presente en el prompt del análisis de entradas, además de los ya existentes de reparto de minutos y tamaño de sesión.

## Log

L1 (usuario, textual): «Aplica todo esto en la app: …» (repetido por tercera vez, con el mismo texto del pedido original).
L2 (decisión): la tercera repetición es señal de que estaba guardado pero no visible; se prioriza visibilidad (chip + barra) y dos aplicaciones reales (feeds por disciplina, contexto en los prompts) por sobre más persistencia.
