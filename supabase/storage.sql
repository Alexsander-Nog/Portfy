-- Criar o bucket 'portfolio-assets' como público
insert into storage.buckets (id, name, public)
values ('portfolio-assets', 'portfolio-assets', true)
on conflict (id) do nothing;

-- Política para permitir leitura pública (qualquer pessoa pode ver as imagens)
create policy "portfolio_assets_public_read" 
on storage.objects 
for select 
to public
using (bucket_id = 'portfolio-assets');

-- Política para permitir upload apenas para usuários autenticados
-- O path deve começar com o ID do usuário autenticado
create policy "portfolio_assets_authenticated_insert" 
on storage.objects 
for insert 
to authenticated
with check (
  bucket_id = 'portfolio-assets' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir atualização apenas dos próprios arquivos
create policy "portfolio_assets_authenticated_update" 
on storage.objects 
for update 
to authenticated
using (
  bucket_id = 'portfolio-assets' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir exclusão apenas dos próprios arquivos
create policy "portfolio_assets_authenticated_delete" 
on storage.objects 
for delete 
to authenticated
using (
  bucket_id = 'portfolio-assets' 
  and (storage.foldername(name))[1] = auth.uid()::text
);
