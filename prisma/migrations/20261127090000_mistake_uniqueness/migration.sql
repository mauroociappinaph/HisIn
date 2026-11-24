-- Two corrections of the same email must not file the same card twice.
DELETE FROM "Mistake" a USING "Mistake" b
WHERE a."userId" = b."userId"
  AND lower(a."original") = lower(b."original")
  AND lower(a."corrected") = lower(b."corrected")
  AND a."createdAt" > b."createdAt";

CREATE UNIQUE INDEX "Mistake_userId_original_corrected_key"
  ON "Mistake" ("userId", lower("original"), lower("corrected"));
