-- Dirección de envío en el perfil (capturada de PayPal y editable por el socio).
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "shippingName" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "region" TEXT;
