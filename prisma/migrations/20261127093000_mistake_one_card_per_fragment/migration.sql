-- 'dont work' is one mistake, no matter how many ways it can be fixed: re-correcting
-- the same email must not grow the deck with variants of the same card.
DROP INDEX IF EXISTS "Mistake_userId_original_corrected_key";

DELETE FROM "Mistake" a USING "Mistake" b
WHERE a."userId" = b."userId"
  AND lower(a."original") = lower(b."original")
  AND a."createdAt" > b."createdAt";

CREATE UNIQUE INDEX "Mistake_userId_original_key"
  ON "Mistake" ("userId", lower("original"));
