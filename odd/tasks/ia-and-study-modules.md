# HisIn — resumen en inglés, navbar legible y módulos de estudio

Feature: el análisis de noticias se lee en inglés, la navegación expresa una idea por destino, y el contenido se organiza en recorridos de estudio.
Owner: mauroociappina · Branch: `feat/vocab-trainer-stories`

## Specs

N1. Textual del usuario: «TIENE QUE ESTAR EN INGLES ESTA PARTE». El digest del análisis de noticias se escribe en inglés (`summary`), porque la app enseña inglés. Los análisis viejos con `summaryEs` se siguen leyendo (normalización al leer), y re-analizar la nota la actualiza.

N2. Textual del usuario: «LAS SECCIONES QUE ESTAN EN EL NAVBAR ESTAN MUY MEZCLADAS». El navbar tiene cuatro destinos, uno por idea: **Hoy** (qué hacer ahora), **Estudiar** (todo el material: módulos, gramática, patrones, chunks, historias, noticias), **Repasar** (repaso espaciado) y **Progreso** (medición y preferencias). La gramática deja de ser destino y pasa a ser contenido dentro de Estudiar.

N3. `params` se consume siempre dentro de `<Suspense>` (error "Instant" de Next): `/grammar/[slug]` separa el cuerpo que espera `params` del shell.

N4. Textual del usuario: «HAY QUE CREAR MODULOS DE ESTUDIO». Existe `/modules` con un recorrido de cuatro pasos por módulo — leer la lección → revisar la estructura → practicar → repasar a las 48 h — con minutos que suman exactamente la duración de la clase y enlaces directos a cada superficie.

N5. El progreso de un módulo es honesto: porcentaje de lecciones de ese módulo marcadas como vistas, nunca un número inventado.

N6. Tests: reparto exacto de minutos en las cuatro duraciones, orden de pasos, ninguna etapa por debajo de 2 minutos, práctica con la mayor cuota, fallback a `/patterns` cuando no hay tema de gramática, y progreso que sólo cuenta lecciones del módulo.

## Log

L1 (usuario, textual): «TIENE QUE ESTAR EN INGLES ESTA PARTE LAS SECCIONES QUE ESTAN EN EL NAVBAR ESTAN MUY MEZCLADAS NO SE ENTIENDE NO ES COMPRENSIBEL … HAY QUE CREAR MODULOS DE ESTUDIO.» con captura del digest en español y del error `Instant` en `/grammar/[slug]`.
