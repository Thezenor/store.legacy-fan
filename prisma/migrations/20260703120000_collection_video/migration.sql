-- Vídeo de colección (URL de vídeo alojado o subida al Volume).
ALTER TABLE "Collection"
  ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
