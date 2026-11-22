# HisIn — historia interactiva, audio y redirección al repaso

Feature: la historia de cada submódulo se lee como las noticias — hover, click-to-save y audio — y manda al repaso espaciado.
Owner: mauroociappina · Branch: `feat/stories-interactive`

## Specs

S1. Textual del usuario: «(a) que la historia se lea con hover-tooltip y click-to-save como las noticias».

S2. Hover sobre una palabra: se resalta y el pie muestra la palabra + «click para guardarla y analizarla». Sin tooltip flotante que tape el texto.

S3. Click sobre una palabra: pasa por el **mismo pipeline validado** del alta rápida (`POST /api/vocabulary/analyze`), con su clasificación, definición, ejemplo y enrutado. Si ya existe (409) se informa sin error. Las palabras guardadas quedan marcadas en verde dentro del texto.

S4. Las palabras funcionales (the, is, of…) se rechazan con un aviso, para no ensuciar el banco.

S5. Textual: «(b) audio para cada historia». Botón **Escuchar** que lee el texto completo con la voz del navegador (`speechSynthesis`, en-US, 0.92).

S6. Textual: «LAS HISTORY TENDRÍAN QUE REDIRECCIONAR ACÁ: /review/vocab». Cada historia lleva un CTA **«Repasar este vocabulario →»** a `/review/vocab`, y lo guardado entra a la cola SM-2 al instante.

S7. La etiqueta del material se muestra una sola vez (el lector no repite el rótulo de la tarjeta).

## Log

L1 (usuario, textual): «SEGUI CON (a) … (b) … y (c) el PR #1 sigue sin mergear (24 commits)» + 31 submódulos nuevos + «LAS HISTORY TENDRIAN QUE RE DIRECCIONAR ACA: /review/vocab».

L2 (ejecución): PR #1 **mergeado a main** con `gh pr merge 1 --merge` (merge commit `91cd756`), y el trabajo nuevo continúa en `feat/stories-interactive`.

## Temario completo (73 temas · 292 materiales · 73 historias)

Los 31 submódulos nuevos (B1 y B2) entraron en 13 módulos (18–30): pasado y narración, hipótesis y pasiva, relativos y modales, phrasal verbs, tres módulos de vocabulario B1, tiempos y pasiva avanzada, condicionales y deseos, modales perfectos y causativa, relativos y estilo indirecto avanzado, gerundio/infinitivo con cambio de significado, y tres módulos de vocabulario B2.

L3 (decisión): el bloque B1/B2 se agrupó por **función comunicativa**, no por lista: cada módulo mezcla la estructura con el vocabulario que la usa (p. ej. «Pasado: contraste y narración» junta los tres contrastes temporales).
L4 (ejecución): generación de 31 submódulos en 2m46s → 124 materiales nuevos, 0 fallos.
