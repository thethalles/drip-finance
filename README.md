# DRIP FINANCE

Este repositório contém o aplicativo DRIP Finance um aplicativo inovador de gestão financeira pessoal, desenvolvido para simplificar o controle financeiro dos brasileiros. Com foco em acessibilidade e tecnologia, o app permite registrar rendimentos, acompanhar gastos, filtrar despesas por categoria e período e gerar relatórios visualmente atraentes. A proposta visa democratizar a gestão financeira, proporcionando maior organização e motivação para decisões financeiras mais conscientes e saudáveis.

**Objetivo deste arquivo**: descrever as dependências e os passos necessários para rodar o projeto localmente (web e build Android com Capacitor).

**Resumo rápido**
- Frontend: React + Vite + TypeScript
- Mobile/native wrapper: Capacitor (Android)
- Backend (serviços): Firebase (configurações no diretório do projeto)

**Requisitos de sistema**
- Node.js: versão LTS recomendada (18.x ou 20.x). Verifique com `node -v`.
- npm: acompanha o Node; comandos do README usam `npm`.
- Java JDK: versão 11 ou superior (necessário para builds Android). Defina `JAVA_HOME`.
- Android Studio + Android SDK: para compilar/executar a versão Android (defina `ANDROID_SDK_ROOT` ou `ANDROID_HOME`).

Dependências do projeto (principais, extraídas de `drip-finance/package.json`):
- @capacitor/android, @capacitor/cli, @capacitor/core (Capacitor v8)
- react, react-dom (React 19)
- firebase (SDK Web)
- vite, typescript (dev)
- framer-motion, lucide-react, react-router-dom, recharts, clsx, tailwind-merge

Instalação e execução (ambiente de desenvolvimento)
1. Clone o repositório e entre na pasta do projeto:

	cd <onde-clonou-o-repo>

2. Instale as dependências do subprojeto (o script raiz delega para `drip-finance`):

	cd drip-finance
	npm install

3. Rodar em desenvolvimento (dev server):

	npm run dev

	- Ou, a partir da raiz do repositório, você também pode usar:

	npm run start

4. Build para produção (web):

	npm run build


Android (Capacitor)
- Pré-requisitos: Java JDK, Android Studio, Android SDK (platform tools), variáveis `JAVA_HOME` e `ANDROID_SDK_ROOT` configuradas.
- Sincronize o projeto Capacitor e abra no Android Studio:

  cd drip-finance
  npx cap sync android
  npx cap open android

- No Android Studio: aguarde a sincronização do Gradle e então rode o app em um emulador ou dispositivo.

Notas sobre Firebase
- O repositório contém arquivos de configuração (`firebase-applet-config.json`, `firebase-blueprint.json`), mas você deve apontar o app para seu projeto Firebase se desejar funcionalidades completas (autenticação, banco). Atualize as configurações em `drip-finance/src/firebase.ts` conforme necessário.

Dicas e resolução de problemas
- Se encontrar erros de versão do Node ou do TypeScript, use uma versão LTS do Node e remova `node_modules` antes de reinstalar (`rm -rf node_modules && npm install` no WSL/Git Bash ou use Explorer no Windows).
- Erros ao compilar Android normalmente são causados por `JAVA_HOME` ou `ANDROID_SDK_ROOT` não configurados ou por versões de Gradle incompatíveis. Abra o projeto no Android Studio para mensagens detalhadas.

Onde procurar código
- Código-fonte do app: [drip-finance/src](drip-finance/src)
- Scripts: veja [drip-finance/package.json](drip-finance/package.json)