# 🚀 Guia de Deploy - Vizuhalizando AI

## ✅ O que já está pronto

- ✅ Landing page profissional mobile-first
- ✅ Fluxo de análise facial com Gemini 3 Pro
- ✅ Dashboard SaaS com paleta de cores personalizada  
- ✅ Gerador de looks com Nano Banana
- ✅ **Feature de mockup com rosto do usuário**

## 📋 Pré-requisitos

1. **API Key do Google Gemini**
   - Já disponível: `AIzaSyATnmJo1IfzDl0lDv9OVLeG7YwCHyeol18`
   - Ou gere nova em: https://aistudio.google.com/app/apikey

2. **Node.js** instalado (versão 18+)

## 🌐 Opção 1: Deploy no Vercel (Recomendado)

### Passo 1: Instalar Vercel CLI
```bash
npm install -g vercel
```

### Passo 2: Login na Vercel
```bash
vercel login
```

### Passo 3: Deploy
```bash
vercel --prod
```

### Passo 4: Adicionar variável de ambiente
No painel da Vercel:
1. Acesse: Settings → Environment Variables
2. Adicione:
   - **Nome**: `API_KEY`
   - **Valor**: `AIzaSyATnmJo1IfzDl0lDv9OVLeG7YwCHyeol18`
3. Clique em "Save"
4. Redeploy o projeto

## 🔷 Opção 2: Deploy no Netlify

### Passo 1: Instalar Netlify CLI
```bash
npm install -g netlify-cli
```

### Passo 2: Login no Netlify
```bash
netlify login
```

### Passo 3: Deploy
```bash
netlify deploy --prod
```

### Passo 4: Adicionar variável de ambiente
No painel do Netlify:
1. Acesse: Site settings → Environment variables
2. Adicione:
   - **Key**: `API_KEY`
   - **Value**: `AIzaSyATnmJo1IfzDl0lDv9OVLeG7YwCHyeol18`
3. Salve e redeploy

## 💻 Teste Local

### 1. Clonar o repositório
```bash
git clone https://github.com/evaldo0510/vizuha.git
cd vizuha
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Criar arquivo .env
```bash
cp .env.example .env
```

Edite `.env` e adicione:
```
API_KEY=AIzaSyATnmJo1IfzDl0lDv9OVLeG7YwCHyeol18
```

### 4. Rodar localmente
```bash
npm run dev
```

Acesse: http://localhost:3000

## 🎨 Funcionalidades Implementadas

### 1. Análise Facial
- Usa Gemini 3 Pro para análise
- Detecta: formato de rosto, coloração pessoal, contraste
- Retorna paleta de cores personalizada

### 2. Geração de Looks com Rosto do Usuário
- **FEATURE PRINCIPAL**: Mockup usa o rosto real do usuário
- Gemini 3 Pro Image combina selfie + roupa + ambiente
- Suporta múltiplos contextos: corporativo, casual, festa, esportivo
- Configurável: aspect ratio (1:1, 3:4, 9:16, 16:9) e resolução (1K, 2K, 4K)

### 3. Dashboard Profissional
- Layout SaaS moderno
- Cards com paleta personalizada
- Integração com Google Search e Maps

## 🔧 Estrutura do Projeto

```
vizuha/
├── App.tsx                    # Componente principal
├── services/
│   └── geminiService.ts      # Integrações Gemini
├── .env.example              # Template de variáveis
└── DEPLOY.md                 # Este arquivo
```

## 🎯 Próximos Passos

1. **Deploy**: Escolha Vercel ou Netlify e siga os passos acima
2. **Teste**: Acesse o app e teste a análise facial
3. **Ajustes**: Personalize cores, textos e features
4. **Monetização**: Ative os planos Pro quando estiver pronto

## 🆘 Troubleshooting

**Erro: "API_KEY not found"**
- Verifique se a variável de ambiente está configurada
- No Vercel/Netlify, redeploy após adicionar a variável

**Erro: "Failed to generate image"**
- Verifique se a API Key do Gemini está válida
- Confirme que tem créditos disponíveis no Google AI Studio

**App não carrega**
- Verifique os logs do deployment
- Confirme que todas as dependências foram instaladas

## 📞 Suporte

Repositório: https://github.com/evaldo0510/vizuha

---

**Desenvolvido com Google Gemini 3 Pro & Nano Banana** 🚀
