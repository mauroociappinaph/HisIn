# HisIn — buscador NLP y biblioteca unificada

Feature: una caja donde el alumno escribe la duda como le sale —en español o en inglés— y la app responde con la lección, el término, la palabra, el error o la noticia que la cubre.
Owner: mauroociappina · Branch: `feat/stories-interactive`

## Specs

S1. El buscador acepta lenguaje natural en español o inglés y devuelve resultados agrupados por tipo, en orden de lectura: lecciones → términos de las historias → vocabulario propio → errores propios → historias → noticias.

S2. Normaliza acentos, mayúsculas y puntuación (`¿Cómo se dice «metida de pata»?` → `como se dice metida de pata`).

S3. Expande con sinónimos de dominio en las dos direcciones: `disculpa → apology, apologise, sorry, regret`; `plata → funding, capital, runway`; `error → mistake, blunder, slip`.

S4. Reduce plurales y gerundios a su base (`questions → question`, `shipping → ship`), deshaciendo la consonante doblada.

S5. Ranking BM25 con peso 3,2 en el título: encuentra *la* lección que explica la regla, no las doce que mencionan la palabra una vez.

S6. Los documentos se construyen por request desde la base, así que un error recién archivado es buscable de inmediato.

S7. La biblioteca (`/library`) mantiene la lista de vocabulario propio con sus filtros y suma la sección «En todo el curso» arriba, con los resultados agrupados.

S8. Sin coincidencias no hay caja vacía: dice «probá con el término en inglés».

## Tests

`src/modules/search/search.test.ts` (10): normalización con acentos y comillas, stop words en ambos idiomas, expansión de sinónimos, reducción de plural y gerundio, la consulta real «como pido disculpas en un email» → `corporate-writing`, título por encima del cuerpo, glosa en español → término, consulta sin relación → vacío, límite de resultados, y orden/agrupación.

## Log

L1 (usuario): «si. y tambien agrega esya nueva palabra donde creas mekor: Blunder».
L2 (ejecución): `src/modules/search/search.ts`, `GET /api/search?q=`, sección cruzada en `/library`.
L3 (blunder): agregada por el pipeline de alta (`/api/vocabulary/analyze`), que la clasifica como WORD B2, le escribe definición y ejemplo en contexto healthtech («a costly blunder by launching the clinical dashboard without validating its patient-safety alerts»), una nota sobre el matiz frente a *error* y la manda al repaso espaciado. Verificada en el buscador.
L4 (defecto encontrado): `news/analyze`, `glossary/translate` y `vocabulary/analyze` seguían tomando `const [model] = resolveModels()` — el primer modelo y nada más. Las tres pasaron a `runWithFallback`.

## Medición y corrección del ranking (L5-L6)

Se midió el buscador con siete consultas reales contra el índice completo (más de 500 documentos). Dos defectos serios:

1. **Inundación por sinónimos**: los sinónimos entraban como términos sueltos, así que «plata» se satisfacía con «runway» y «kubernetes» traía resultados basura.
2. **El boost de título multiplicaba el documento entero** (`score *= 3.2`) en vez del término, premiando documentos con cualquier coincidencia en el título.

Correcciones: puntaje por **grupo de token** (cada palabra con sus sinónimos), multiplicador de **cobertura al cuadrado** (responder una de tres palabras no es responder), **penalización 0,55** a las coincidencias por sinónimo, **corte relativo 0,30** contra el mejor resultado, boost de título aplicado al término, sinónimos ampliados a ~35 grupos y plurales españoles en «-es» (`formales → formal`).

| Consulta | Antes | Después |
| --- | --- | --- |
| negociacion de clausulas | «give and take» | **Contract language and standard clauses** |
| kubernetes helm chart | 2 resultados basura | **0** |
| used to vs would | 30 resultados | **1**: Used to vs. would |
| que es un blunder | 1 | 1: blunder |
| plata para el runway | «Shopping money stores» | **runway** |

Techo conocido: el buscador es **léxico**, no semántico. «como pido disculpas formales» sigue devolviendo «Inversion in formal conditionals» antes que la lección de escritura corporativa, porque la palabra que falta no está en ningún documento y los sinónimos a mano no la cubren. La solución es híbrida: si la cobertura es baja, pedirle al motor 5 palabras clave en inglés y 2 lecciones candidatas, y volver a buscar. Tests: 15.

## Capa híbrida (L7) y módulo 46 (L8)

L5 (capa híbrida): cuando la primera pasada es fina o superficial —menos de 3 resultados, o ningún documento que cubra la consulta completa— el motor propone 3-6 palabras clave en inglés y hasta 3 lecciones candidatas. Las palabras se buscan **solas** (sumarlas a la consulta original diluye la cobertura y devuelve vacío), los resultados se **fusionan** con los léxicos en vez de reemplazarlos, y las lecciones nombradas suben 1,8×. La expansión se cachea por pregunta normalizada en `SearchExpansion`: una consulta popular cuesta una llamada, no una por tecla. Si la expansión falla, la búsqueda no falla.

Medición: «como negocio un precio mejor» 0 → **Business negotiation** primero; «used to vs would» → *Used to vs. would*.

L6 (módulo 46): **46 · Curriculum design and materials production**, seis submódulos C2 — análisis de necesidades y diseño de sílabos, principios y adaptación de materiales, redacción de libros de texto y unidades, diseño multimodal y accesibilidad, fundamentos de Language Testing & Assessment, y evaluación de desempeño, pilotaje y calibración de ítems.
