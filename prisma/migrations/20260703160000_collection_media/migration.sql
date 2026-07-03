-- Galería de colección: varias imágenes y varios vídeos por colección.
DO $$ BEGIN
  CREATE TYPE "CollectionMediaKind" AS ENUM ('IMAGE', 'VIDEO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "CollectionMedia" (
  "id"           TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "kind"         "CollectionMediaKind" NOT NULL,
  "url"          TEXT NOT NULL,
  "urlMobile"    TEXT,
  "alt"          TEXT,
  "sortOrder"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CollectionMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CollectionMedia_collectionId_idx" ON "CollectionMedia"("collectionId");

DO $$ BEGIN
  ALTER TABLE "CollectionMedia"
    ADD CONSTRAINT "CollectionMedia_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Migra el vídeo único legacy a la nueva tabla (una sola vez).
INSERT INTO "CollectionMedia" ("id", "collectionId", "kind", "url", "sortOrder")
SELECT 'cmv_' || "id", "id", 'VIDEO', "videoUrl", 0
FROM "Collection"
WHERE "videoUrl" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "CollectionMedia" m WHERE m."collectionId" = "Collection"."id" AND m."kind" = 'VIDEO');
