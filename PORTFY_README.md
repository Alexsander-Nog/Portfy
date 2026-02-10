# 🌌 Portfy - Plataforma Universal de Portfólio + CV Profissional

![Portfy Logo](https://img.shields.io/badge/Portfy-Galaxy%20Wine-a21d4c?style=for-the-badge)

## 📋 Sobre o Projeto

**Portfy** é uma plataforma SaaS completa que permite a qualquer profissional criar um portfólio profissional online e currículos personalizáveis. A plataforma combina as melhores funcionalidades do Canva, LinkedIn, e sistemas de portfólio tradicionais em uma única solução moderna e intuitiva.

### 🎨 Identidade Visual

- **Cores Principais**: Galaxy (roxos/azuis profundos) com tons de vermelho vinho
- **Palette**:
  - Galaxy Dark: `#0f0b1f`
  - Galaxy Medium: `#1a1534`
  - Galaxy Light: `#2d2550`
  - Wine Dark: `#7a1538`
  - Wine Medium: `#a21d4c`
  - Wine Light: `#c92563`
  - Wine Pale: `#e94d7a`

## ✨ Funcionalidades Principais

### 1. **Landing Page**
- Hero section com proposta de valor clara
- Seção de benefícios com 6 cards principais
- Galeria de exemplos para diferentes profissões
- Planos de assinatura (Basic, Pro, Premium)
- Footer completo com navegação
- Seletor de idiomas (PT/EN/ES)

### 2. **Sistema de Autenticação**
- Login e cadastro com validação
- Integração social (Google, Github)
- 15 dias de trial grátis sem cartão
- Design galaxy com estrelas animadas

### 3. **Dashboard Completo**
- **Visão Geral**: Estatísticas de visitas, projetos e plano atual
- **Meu Portfólio**: Configuração de perfil completo
  - Upload de foto
  - Informações pessoais e bio
  - Links de redes sociais (LinkedIn, GitHub, Instagram, etc.)
- **Projetos**: Gerenciamento de portfólio
  - Adicionar/editar/excluir projetos
  - Categorias (Design, Desenvolvimento, Marketing, etc.)
  - Upload de imagens e mídia
  - Links externos
- **Experiências**: Timeline profissional
  - Empresas e cargos
  - Datas e descrições
  - Marcação de emprego atual

### 4. **Criador de CV**
- Seleção de idioma (PT/EN/ES)
- Múltiplos templates (Moderno, Minimalista, Corporativo, Criativo)
- Escolha de conteúdo para incluir
- Preview em tempo real
- Exportação em PDF
- Link online compartilhável

### 5. **Personalização Visual**
- Escolha de até 4 cores personalizadas
- Paletas pré-definidas
- Seleção de tipografia
- 4 layouts diferentes (Moderno, Minimalista, Masonry, Lista)
- Preview ao vivo com tema claro/escuro

### 6. **Sistema de Assinatura**
- **Plano Basic**: R$ 19/mês
  - 1 portfólio
  - CV em 1 idioma
  - Até 10 projetos
  - 2 cores personalizadas
  
- **Plano Pro**: R$ 39/mês (Mais Popular)
  - 3 portfólios
  - CV em 3 idiomas
  - Projetos ilimitados
  - 4 cores personalizadas
  - Análise de visitas
  
- **Plano Premium**: R$ 69/mês
  - Portfólios ilimitados
  - CV em todos os idiomas
  - Personalização total
  - Domínio personalizado
  - Suporte 24/7

### 7. **Página Pública do Portfólio**
- Design galaxy com efeito de estrelas
- Hero com foto, nome, profissão e bio
- Informações de contato
- Links de redes sociais
- Grade de projetos com imagens
- Timeline de experiências profissionais
- Botão para download de CV

## 🛠️ Tecnologias Utilizadas

- **React** 18.3.1
- **TypeScript**
- **Tailwind CSS** v4
- **Lucide React** (ícones)
- **Motion** (animações)
- **Vite** (build tool)

## 📦 Componentes Principais

```
/src/app/
├── App.tsx                          # Componente principal com navegação
├── components/
│   ├── Logo.tsx                     # Logo da Portfy (icon + full)
│   ├── Button.tsx                   # Componente de botão reutilizável
│   ├── Card.tsx                     # Componente de card reutilizável
│   ├── Auth.tsx                     # Página de login/cadastro
│   ├── Dashboard.tsx                # Dashboard principal
│   ├── DashboardLayout.tsx          # Layout com sidebar
│   ├── CVCreator.tsx                # Criador de CV
│   ├── Appearance.tsx               # Personalização visual
│   ├── Subscription.tsx             # Gerenciamento de assinatura
│   └── PublicPortfolio.tsx          # Página pública do portfólio
```

## 🎯 Público-Alvo

A plataforma é ideal para:
- 🎨 Designers
- 💻 Desenvolvedores
- 🎵 Músicos
- 📸 Fotógrafos
- 📊 Profissionais de Marketing
- 💼 Administradores
- ⚕️ Médicos
- 🏛️ Arquitetos
- 🎓 Estudantes
- 💪 Freelancers

## 🚀 Como Usar a Demo

A aplicação possui um navegador de páginas fixo na parte inferior para facilitar a navegação entre as diferentes telas:

1. **Landing**: Página inicial da plataforma
2. **Login**: Tela de autenticação
3. **Dashboard**: Área administrativa completa
4. **Portfólio**: Visualização pública do portfólio

## 🎨 Design System

### Cores
- **Primária**: `#a21d4c` (Wine Medium)
- **Secundária**: `#2d2550` (Galaxy Light)
- **Accent**: `#c92563` (Wine Light)
- **Background Light**: `#ffffff`
- **Background Dark**: `#0f0b1f`

### Tipografia
- Fonte padrão: Inter
- Tamanhos responsivos
- Pesos: 400 (normal), 500 (medium)

### Componentes
- Cards com hover effects
- Botões com gradientes
- Inputs com focus states
- Animações suaves com transitions

## 📱 Responsividade

A plataforma é totalmente responsiva e funciona em:
- 📱 Mobile (< 768px)
- 💻 Tablet (768px - 1024px)
- 🖥️ Desktop (> 1024px)

## 🔐 Segurança

- Validação de formulários
- Autenticação segura (mock)
- Proteção de dados do usuário
- Conformidade com LGPD

## 📈 Próximas Funcionalidades

- [ ] Integração real com backend
- [ ] Sistema de pagamento (Stripe/MercadoPago)
- [ ] Analytics avançado
- [ ] Exportação de CV em múltiplos formatos
- [ ] Templates adicionais
- [ ] Modo colaborativo
- [ ] API pública
- [ ] White-label para empresas

## 📝 Licença

Este é um projeto de demonstração criado para mostrar as capacidades da plataforma Portfy.

---

**Desenvolvido com ❤️ pela equipe Portfy**

*"Transforme sua carreira com um portfólio profissional"*
