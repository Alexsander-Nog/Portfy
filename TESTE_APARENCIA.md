# 🎨 TESTE COMPLETO - SEÇÃO DE APARÊNCIA

## O que você vai testar:

1. **Cores Personalizadas**
2. **Paletas Pré-definidas**
3. **Tipografia (Fontes)**
4. **Layout**
5. **Tema Claro/Escuro**
6. **Preview em Tempo Real**
7. **Persistência dos Dados**

---

## 📋 PASSO A PASSO PARA TESTE:

### 1. Limpe o Console
- Pressione **F12** para abrir o DevTools
- Vá para a aba **Console**
- Clique no ícone 🚫 para limpar

### 2. Acesse a Seção de Aparência
- No dashboard, clique em **"Aparência"** no menu lateral

### 3. Teste as Cores Personalizadas

#### 3.1. Cor Principal
- Clique no seletor de cor ao lado de "Cor Principal"
- Escolha uma cor diferente (ex: azul #0077b6)
- Veja se o campo de texto atualiza o código hex
- Digite um código hex manualmente e veja se o seletor muda

#### 3.2. Cor Secundária
- Faça o mesmo teste com a cor secundária
- Experimente com: #023e8a

#### 3.3. Cor de Destaque
- Teste também a cor de destaque
- Experimente com: #00b4d8

**✅ Esperado:** Todas as cores devem atualizar no preview em tempo real

### 4. Teste as Paletas Pré-definidas

Clique em cada uma das 6 paletas:
- Galaxy Wine (Padrão) - roxo/vinho
- Ocean Blue - azul
- Forest Green - verde
- Sunset Orange - laranja
- Purple Dream - roxo
- Minimalist Gray - cinza

**✅ Esperado:** Ao clicar, todas as 3 cores devem mudar instantaneamente e o preview deve atualizar

### 5. Teste a Tipografia

Clique em cada fonte e veja se:
- A fonte fica selecionada (check ✓ aparece)
- O botão muda de cor
- (Opcional) O preview usa a fonte

Fontes disponíveis:
- Inter
- Roboto
- Playfair Display
- Montserrat
- Lora

### 6. Teste o Layout

Clique em cada layout e observe:
- O card fica selecionado (check ✓)
- O mockup no preview muda
- O botão "Salvar" fica ativo

Layouts:
- **Moderno** - grid de 2 colunas
- **Minimalista** - layout simples
- **Masonry** - tipo Pinterest
- **Lista** - vertical

### 7. Teste o Tema Claro/Escuro

- Clique em **"Escuro"** e veja se o preview muda para fundo escuro
- Clique em **"Claro"** e veja se volta ao normal

### 8. Teste o Botão Salvar

1. Faça qualquer mudança (ex: troque uma cor)
2. Veja se aparece **"Salvar Personalização"** no botão
3. Clique em **"Salvar Personalização"**
4. **OBSERVE O CONSOLE** - deve aparecer:
   ```
   === upsertUserTheme INICIADO ===
   userId: ...
   theme: {...}
   Payload para Supabase (user_themes): {...}
   Resposta do Supabase (upsertUserTheme):
     data: {...}
     error: null
   Tema salvo com sucesso: {...}
   === upsertUserTheme CONCLUÍDO ===
   ```
5. O botão deve mudar para **"Salvo ✓"** e ficar desabilitado

### 9. Teste Restaurar Padrão

1. Faça várias mudanças de cor, layout, tema
2. Clique em **"Restaurar Padrão"**
3. Tudo deve voltar para:
   - Cor Principal: #a21d4c
   - Cor Secundária: #2d2550
   - Cor de Destaque: #c92563
   - Layout: Moderno
   - Tema: Claro
   - Fonte: Inter

### 10. Teste de Persistência (CRÍTICO!)

1. Faça alterações e **SALVE**
2. Espere aparecer "Salvo ✓"
3. Pressione **F5** para recarregar a página
4. **OBSERVE O CONSOLE** - deve aparecer:
   ```
   === CARREGANDO DADOS DO USUÁRIO ===
   === fetchUserTheme INICIADO ===
   Tema carregado com sucesso do Supabase: {...}
   === fetchUserTheme CONCLUÍDO ===
   ```
5. Vá para Aparência novamente
6. **Verifique se as alterações foram mantidas!**

---

## 🐛 REPORTE DE PROBLEMAS:

Se algo não funcionar, **COPIE E COLE AQUI**:

### 📝 O que você testou:
(Ex: "Mudei a cor principal para azul")

### ❌ O que aconteceu:
(Ex: "A cor não mudou no preview")

### 📋 Mensagens do Console:
```
[Cole aqui TODAS as mensagens do console]
```

### 📸 Print (se possível):
[Cole um print da tela]

---

## ✅ CHECKLIST FINAL:

Marque o que está funcionando:

- [ ] Cores personalizadas (seletor + input hex)
- [ ] Paletas pré-definidas (6 paletas)
- [ ] Seleção de fontes (5 opções)
- [ ] Seleção de layout (4 opções)
- [ ] Toggle Claro/Escuro
- [ ] Preview em tempo real
- [ ] Botão "Salvar" ativa/desativa
- [ ] Botão "Restaurar Padrão"
- [ ] **Dados SALVAM no banco**
- [ ] **Dados CARREGAM após F5**

Após testar tudo, me diga quais itens estão ✅ e quais estão ❌!
