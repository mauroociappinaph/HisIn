# HisIn — registro de riesgos y cómo se cerraron

Cada riesgo declarado durante la construcción, con la mitigación y la evidencia que
permite comprobarlo. Un riesgo no se cierra con una promesa: se cierra con una
verificación que otra persona puede repetir.

## R1 · Operaciones destructivas sobre datos generados

**Qué podía salir mal**: el curso entero vive en la base. Varios scripts borran filas
a propósito (materiales desviados, glosas viejas, materiales para regenerar) y una
corrida anterior dejó 13 temas con huecos cuando el proveedor falló.

**Mitigación**
- `scripts/repair-drift.ts` escribe `odd/backups/drift-<stamp>.json` **antes** de
  borrar y acepta `--restore`. Sin `--apply` solo reporta.
- `scripts/backup-content.ts` (`pnpm backup:content`) fotografía todo el contenido
  (temas, materiales, glosas, citas, prólogos, módulos) y `--restore` lo reinserta con
  upserts, así que correrlo dos veces no cambia nada.

**Evidencia**: round trip ejecutado — snapshot `149 temas / 596 materiales / 2.490
glosas / 45 módulos`, restore, **mismos conteos**.

## R2 · Calidad del contenido generado (repetición y deriva)

**Qué podía salir mal**: 149 temas escritos por un modelo pueden repetir el mismo memo
o desviarse a otro tema (pasó: una lección de diseño curricular enseñaba «should have +
past participle»).

**Mitigación**
- Compuerta de repetición en `/generate`: shingles + Jaccard ponderado; si un material
  se parece ≥0,55 a otro del mismo skill, se reintenta nombrando la lección que copiaba.
- Compuerta de consistencia: la lectura, la escritura y la historia deben usar la
  estructura que enseña la gramática (≥3 apariciones) o se reintenta.
- Diagnóstico (`pnpm audit:topics`, `pnpm audit:duplicates`) para ver lo que las
  compuertas no pueden detectar solas.

**Evidencia**: auditoría sobre 596 materiales → **0 pares casi duplicados** y **0
materiales con oración repetida**; deriva de gramática: 20 → 1 caso real, corregido.

## R3 · Contratos compartidos y fiabilidad del motor

**Qué podía salir mal**: el ancla de dominio, `TOPIC_SKILLS` y el esquema de temas son
consumidos por todas las rutas; y `resolveModels()` devolvía una cadena que **nadie
usaba** (todas las rutas tomaban solo el primer modelo), así que un `429` terminaba la
generación.

**Mitigación**
- `runWithFallback`: recorre la cadena, presupuesto completo al primero y 45 s a los
  siguientes; las ocho rutas de contenido lo usan.
- Tests de contrato del esquema: rechazo de texto genérico, skill repetido, tipo
  desconocido, marcadores de estructura, deriva temática.

**Evidencia**: temas que devolvían `502` pasaron a `201` con el proveedor principal
agotado; 278 tests verdes, incluidos los del esquema.

## R4 · Volumen de revisión

**Qué podía salir mal**: 17 commits y ~4,7k líneas autoradas en una sola rama, muy por
encima de la rebanada de ~400 líneas.

**Mitigación**: PR #2 con guía de revisión que mapea grupos de commits a preocupaciones
(CI y motor · páginas de lección · reglas del dominio · scripts), y el orden en que
conviene leerlos.

**Evidencia**: https://github.com/mauroociappinaph/HisIn/pull/2

## R5 · Entrega: el merge era el único paso sin verificar

**Qué podía salir mal**: todo se corría a mano en local; nada impedía que `main`
quedara roto.

**Mitigación**: `.github/workflows/ci.yml` corre en cada PR y en `main`: install,
migraciones sobre Postgres real, `prisma generate`, `tsc`, `lint`, tests y `build`.

**Evidencia**: run `45074266573` en el PR #2 — **Install ✓ · Apply migrations ✓ ·
Generate client ✓ · Type check ✓ · Lint ✓ · Test ✓ · Build ✓**.
