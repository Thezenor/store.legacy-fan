-- Variante móvil de imágenes optimizadas (escritorio = url, móvil = urlMobile).
ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "urlMobile" TEXT;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "imageUrlMobile" TEXT;
