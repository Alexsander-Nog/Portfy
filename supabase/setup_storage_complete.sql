-- ========================================
-- SCRIPT COMPLETO PARA CONFIGURAR STORAGE
-- Execute este script no SQL Editor do Supabase
-- ========================================

-- Passo 1: Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "portfolio_assets_read" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_assets_update" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_assets_delete" ON storage.objects;
DROP POLICY IF EXISTS "profile_ijvnt4_0" ON storage.objects;
DROP POLICY IF EXISTS "profile_ijvnt4_1" ON storage.objects;

-- Passo 2: Criar o bucket como público (se ainda não existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-assets', 'portfolio-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Passo 3: Criar política de LEITURA PÚBLICA
-- Permite que qualquer pessoa veja as imagens
CREATE POLICY "portfolio_assets_public_read" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'portfolio-assets');

-- Passo 4: Criar política de UPLOAD
-- Permite upload apenas para usuários autenticados em sua própria pasta
CREATE POLICY "portfolio_assets_authenticated_insert" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Passo 5: Criar política de ATUALIZAÇÃO
-- Permite atualizar apenas os próprios arquivos
CREATE POLICY "portfolio_assets_authenticated_update" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'portfolio-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Passo 6: Criar política de EXCLUSÃO
-- Permite excluir apenas os próprios arquivos
CREATE POLICY "portfolio_assets_authenticated_delete" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'portfolio-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ========================================
-- VERIFICAÇÃO
-- Execute esta query para confirmar que as políticas foram criadas
-- ========================================
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'portfolio_assets%';
