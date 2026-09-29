# Photo Background Replacer - Frontend SPA

Interface Web moderna, reativa e intuitiva desenvolvida em **Angular 18** para remoção e substituição automatizada de fundo em fotos corporativas de funcionários.

Projetada com *Standalone Components*, integração com a API REST via `PhotoApiService` e configuração dinâmica de proxy para desenvolvimento e ambientes conteinerizados.

---

## 📋 Sumário

- [Visão Geral](#-visão-geral)
- [Funcionalidades da Interface](#-funcionalidades-da-interface)
- [Arquitetura e Estrutura do Projeto](#-arquitetura-e-estrutura-do-projeto)
- [Componentes e Serviços](#-componentes-e-serviços)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Variáveis de Ambiente e Proxy](#-variáveis-de-ambiente-e-proxy)
- [Executando em Desenvolvimento](#-executando-em-desenvolvimento)
- [Build de Produção e Deploy](#-build-de-produção-e-deploy)
- [Integração com a API Backend](#-integração-com-a-api-backend)
- [Hospedagem em Infraestrutura Separada](#-hospedagem-em-infraestrutura-separada)
- [Boas Práticas e Resolução de Problemas](#-boas-práticas-e-resolução-de-problemas)

---

## 💡 Visão Geral

O frontend atua como o ponto de contato dos usuários finais (equipes de Recursos Humanos, TI, comunicação interna ou gestores) para:
1. Cadastrar e manter a imagem de fundo corporativa padrão da organização.
2. Tratar fotos individuais de colaboradores com visualização antes/depois instantânea.
3. Processar lotes de até 50 fotos simultaneamente, com feedback de progresso em tempo real e download consolidado em formato `.zip`.

---

## ✨ Funcionalidades da Interface

- **Gerenciamento de Fundo Corporativo**:
  - Upload de template institucional com drag-and-drop.
  - Validação imediata no frontend (formatos JPEG, PNG, WEBP e tamanho máximo de 20 MB).
  - Exibição de metadados do fundo ativo (dimensões, tamanho e nome original).
  - Opção para substituir ou remover o fundo ativo a qualquer momento.

- **Processamento Individual de Foto**:
  - Seleção por clique ou arrastar e soltar (drag-and-drop).
  - Indicador de processamento em andamento (*spinner* de carregamento).
  - Comparativo visual lado a lado (**Original vs. Foto Final Tratada**).
  - Exibição de tempo de resposta em milissegundos e dimensões da imagem de saída.
  - Download imediato da foto final em formato PNG de alta resolução.

- **Processamento em Lote (Batch)**:
  - Seleção de múltiplos arquivos de uma só vez (até 50 fotos).
  - Barra de progresso visual exibindo o status de envio e processamento.
  - Tabela analítica com o resultado individual de cada foto (Status: Sucesso ou Falha, tempo de processamento em ms e mensagem de erro específica se houver).
  - Botão de download direto do arquivo ZIP gerado pelo servidor contendo todas as fotos bem-sucedidas.

- **Experiência do Usuário (UX) & Resiliência**:
  - Alertas contextuais com botões de fechamento.
  - Detecção de erro `412 Precondition Failed` (quando o usuário tenta processar fotos sem um fundo configurado), oferecendo um atalho interativo *"Ir para Configurações de Fundo"*.
  - Tratamento de timeout de rede e mensagens amigáveis em português.

---

## 🏗 Arquitetura e Estrutura do Projeto

```
frontend/
├── src/
│   ├── index.html                      # Ponto de montagem HTML
│   ├── main.ts                         # Bootstrap da aplicação Angular
│   ├── styles.css                      # Estilos globais, tema e variáveis CSS
│   └── app/
│       ├── app.component.ts            # Componente raiz, layout principal e abas
│       ├── models/
│       │   └── api.models.ts           # Interfaces TypeScript e contratos de dados
│       ├── services/
│       │   └── photo-api.service.ts    # Serviço HTTP com tratamento de erros
│       └── components/
│           ├── background-config/      # Gestão do fundo corporativo
│           │   └── background-config.component.ts
│           ├── single-process/         # Processamento de foto única e preview
│           │   └── single-process.component.ts
│           └── batch-process/          # Processamento em lote e download ZIP
│               └── batch-process.component.ts
├── angular.json                        # Configuração do build e dev-server Angular
├── package.json                        # Scripts npm e dependências
├── tsconfig.json                       # Configuração TypeScript base
├── tsconfig.app.json                   # Configuração TypeScript da aplicação
├── proxy.conf.js                       # Proxy dinâmico para redirecionar chamadas /api
├── proxy.conf.json                     # Proxy estático de fallback
├── .env.example                        # Template de variáveis de ambiente do frontend
└── README.md                           # Documentação do frontend
```

---

## 🧩 Componentes e Serviços

1. **`AppComponent`** ([`frontend/src/app/app.component.ts`](src/app/app.component.ts)):
   - Layout global com cabeçalho institucional, rodapé e navegação por abas:
     - 📸 **Processar Foto** (Individual)
     - 📁 **Processar em Lote** (Batch)
     - ⚙️ **Configurar Fundo** (Template corporativo)
   - Monitoramento do status da API (`/health`) na inicialização.

2. **`BackgroundConfigComponent`** ([`frontend/src/app/components/background-config/background-config.component.ts`](src/app/components/background-config/background-config.component.ts)):
   - Permite visualizar a imagem de fundo em vigor, remover ou enviar um novo arquivo.

3. **`SingleProcessComponent`** ([`frontend/src/app/components/single-process/single-process.component.ts`](src/app/components/single-process/single-process.component.ts)):
   - Gerencia o estado de upload de um único retrato, enviando a requisição para a rota `/process/single?format=json` e exibindo o Data URI Base64 retornado.

4. **`BatchProcessComponent`** ([`frontend/src/app/components/batch-process/batch-process.component.ts`](src/app/components/batch-process/batch-process.component.ts)):
   - Gerencia a seleção de múltiplos arquivos, valida limites (1 a 50 fotos) e exibe o resumo com link para download do ZIP gerado.

5. **`PhotoApiService`** ([`frontend/src/app/services/photo-api.service.ts`](src/app/services/photo-api.service.ts)):
   - Centraliza todas as chamadas HTTP via `HttpClient`.
   - Resolve dinamicamente a `baseUrl`:
     - Suporta execução sob reverse proxy (ex: `/proxy/4200/` ou `/proxy/8000/`).
     - Usa caminhos relativos ao domínio atual para produção ou proxy dev server.

---

## 📦 Pré-requisitos

- **Node.js**: versão 18.x ou 20.x+ (recomendado LTS)
- **npm**: versão 9.x ou superior

---

## 🚀 Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio-frontend>
cd frontend
```

### 2. Instalar as Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente (Opcional)

Se necessário, crie um arquivo `.env` para ajustar o endereço do servidor backend de desenvolvimento:

```bash
cp .env.example .env
```

---

## ⚙️ Variáveis de Ambiente e Proxy

O arquivo [`proxy.conf.js`](proxy.conf.js) carrega automaticamente o arquivo `.env` na raiz do frontend ou na raiz do projeto pai, permitindo redirecionar as chamadas iniciadas com `/api` para o backend correto:

| Variável | Tipo | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `FRONTEND_HOST` | `string` | `0.0.0.0` | IP em que o servidor Angular Dev Server escuta |
| `FRONTEND_PORT` | `integer`| `4200` | Porta local do Angular Dev Server |
| `BACKEND_URL` | `string` | `http://127.0.0.1:8000` | URL completa do backend FastAPI |
| `BACKEND_PORT` | `integer`| `8000` | Porta do backend (utilizada se `BACKEND_URL` não for definida) |

---

## 🏃 Executando em Desenvolvimento

Inicie o servidor de desenvolvimento do Angular:

```bash
npm start
```

O comando executará:
```bash
ng serve --host 0.0.0.0 --port 4200 --disable-host-check --proxy-config proxy.conf.js
```

Acesse no navegador:
```
http://localhost:4200
```

Todas as requisições para `/api/...` feitas pelo Angular serão automaticamente encaminhadas pelo proxy para o backend (padrão: `http://127.0.0.1:8000`).

---

## 📦 Build de Produção e Deploy

### 1. Gerar Build Otimizado

```bash
npm run build
```

Os artefatos compilados e otimizados serão gerados no diretório:
```
dist/photo-background-replacer-ui/browser/
```

### 2. Servir com Nginx

Exemplo de configuração para o `nginx.conf`:

```nginx
server {
    listen 80;
    server_name fotos.empresa.com.br;

    root /usr/share/nginx/html;
    index index.html;

    # Encaminha chamadas de API para o backend FastAPI
    location /api/ {
        proxy_pass http://backend-api:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Redireciona todas as outras rotas para o index.html (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Deploy Conteinerizado (Dockerfile Exemplo)

```dockerfile
# Etapa 1: Build da SPA
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: Servidor estático com Nginx
FROM nginx:alpine
COPY --from=builder /app/dist/photo-background-replacer-ui/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔗 Integração com a API Backend

O frontend consome as seguintes rotas da API REST:

| Funcionalidade | Rota Backend | Método | Tipo de Dado |
| :--- | :--- | :---: | :--- |
| **Integridade** | `/api/v1/health` | `GET` | JSON (`{ status, version }`) |
| **Fundo Ativo** | `/api/v1/background` | `GET` | JSON (`BackgroundMetadata`) |
| **Imagem do Fundo** | `/api/v1/background/image` | `GET` | Stream binário (JPEG/PNG/WEBP) |
| **Upload Fundo** | `/api/v1/background` | `POST` | `multipart/form-data` (`file`) |
| **Excluir Fundo** | `/api/v1/background` | `DELETE` | Void (`204 No Content`) |
| **Processar Foto** | `/api/v1/process/single?format=json` | `POST` | `multipart/form-data` (`file`) |
| **Processar Lote** | `/api/v1/process/batch` | `POST` | `multipart/form-data` (`files`) |
| **Download ZIP** | `/api/v1/process/batch/{id}/download` | `GET` | Stream binário (`application/zip`) |

---

## 🌐 Hospedagem em Infraestrutura Separada

Como uma Single Page Application (SPA), o frontend gera apenas arquivos estáticos (HTML, CSS e JavaScript compilados) e pode ser hospedado em plataformas modernas de CDN/Edge (como **Vercel, Netlify, AWS S3 + CloudFront, GitHub Pages, Firebase Hosting ou Nginx**), totalmente separado da infraestrutura onde o backend Python roda.

Existem **dois padrões arquiteturais** para conectar a interface ao backend em infraestrutura isolada:

### Cenário A: Domínios Distintos (Cross-Origin)
Ideal para quando o frontend está em um domínio (ex: `https://app.suaempresa.com.br`) e o backend em outro (ex: `https://api.suaempresa.com.br`).

1. **Configuração da URL da API no Frontend**:
   O serviço `PhotoApiService` aceita a injeção dinâmica de endereço em tempo de execução via `window.__APP_CONFIG__.apiUrl`. No seu `index.html` (ou via template de injeção em runtime), insira:
   ```html
   <script>
     window.__APP_CONFIG__ = {
       apiUrl: "https://api.suaempresa.com.br/api/v1"
     };
   </script>
   ```
2. **CORS no Backend**:
   No `.env` do backend, defina `CORS_ORIGINS=https://app.suaempresa.com.br` para permitir que o navegador execute as requisições AJAX/Fetch.

### Cenário B: Proxy Reverso / Gateway Unificado (Same-Origin — Recomendado)
Ideal para centralizar o tráfego sob um único domínio institucional (ex: `https://suaempresa.com.br`), eliminando configurações de CORS e preflight requests.

- **Exemplo Vercel (`vercel.json`)**:
  ```json
  {
    "rewrites": [
      { "source": "/api/:path*", "destination": "https://api.suaempresa.com.br/api/:path*" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

- **Exemplo Netlify (`_redirects` ou `netlify.toml`)**:
  ```
  /api/*  https://api.suaempresa.com.br/api/:splat  200
  /*      /index.html                               200
  ```

- **Exemplo AWS CloudFront**:
  - Comportamento padrão `/*` ➔ Bucket S3 com o build do frontend.
  - Comportamento de caminho `/api/*` ➔ ALB ou API Gateway do backend FastAPI.

---

## 💡 Boas Práticas e Resolução de Problemas

1. **Erro de Conexão com o Backend (Status 0)**:
   - Verifique se o serviço do backend FastAPI está rodando (geralmente em `http://localhost:8000`).
   - Se o backend estiver em outra porta ou host, ajuste a variável `BACKEND_URL` ou `BACKEND_PORT` no `.env` do frontend e reinicie o comando `npm start`.

2. **Erro 412 (Fundo não configurado)**:
   - A interface detecta esse status e sugere automaticamente a navegação para a aba "Configurar Fundo". Basta fazer o upload de uma imagem com resolução mínima de 800x600 px.

3. **Arquivos muito pesados**:
   - Fotos individuais são limitadas a 15 MB e fundos a 20 MB. O frontend faz a pré-validação antes de enviar dados desnecessários pela rede.
