# Como Configurar as Políticas de Storage no Supabase

## Passo 1: Acesse o Storage no Supabase Dashboard

1. Vá para o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **Storage**
4. Verifique se o bucket `portfolio-assets` existe e está configurado como **público**

## Passo 2: Configure as Políticas (Policies)

Clique em **Policies** e adicione as seguintes 4 políticas:

### 1️⃣ Política de Leitura Pública (SELECT)

**Nome:** `portfolio_assets_public_read`

```sql
CREATE POLICY "portfolio_assets_public_read" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'portfolio-assets');
```

**O que faz:** Permite que qualquer pessoa veja as imagens do portfólio.

---

### 2️⃣ Política de Upload (INSERT)

**Nome:** `portfolio_assets_authenticated_insert`

```sql
CREATE POLICY "portfolio_assets_authenticated_insert" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**O que faz:** Permite que usuários autenticados façam upload apenas para sua própria pasta (usando seu user ID).

---

### 3️⃣ Política de Atualização (UPDATE)

**Nome:** `portfolio_assets_authenticated_update`

```sql
CREATE POLICY "portfolio_assets_authenticated_update" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'portfolio-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**O que faz:** Permite que usuários atualizem apenas seus próprios arquivos.

---

### 4️⃣ Política de Exclusão (DELETE)

**Nome:** `portfolio_assets_authenticated_delete`

```sql
CREATE POLICY "portfolio_assets_authenticated_delete" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'portfolio-assets' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**O que faz:** Permite que usuários excluam apenas seus próprios arquivos.

---

## Passo 3: Aplicar via SQL Editor (Alternativa)

Se preferir, você pode executar o arquivo `storage.sql` completo:

1. Vá para **SQL Editor** no Supabase Dashboard
2. Copie todo o conteúdo do arquivo `supabase/storage.sql`
3. Cole no editor e clique em **Run**

---

## ⚠️ IMPORTANTE: Remova Políticas Antigas

Se você já tinha políticas antigas com nomes diferentes, **delete-as primeiro** para evitar conflitos:

```sql
DROP POLICY IF EXISTS "portfolio_assets_read" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_assets_update" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_assets_delete" ON storage.objects;
```

---

## ✅ Como Testar

1. Faça login na sua aplicação
2. Tente alterar a foto de perfil
3. Verifique no console do navegador (F12) se aparecem os logs
4. A foto deve ser enviada com sucesso!

---

## 🔍 Verificar Políticas Existentes

Para ver todas as políticas atuais do storage:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
```
