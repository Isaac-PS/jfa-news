# Jornal FA News — Especificação de design

Data: 2026-09-30
Escola: Félix de Azevedo
Autor do site: Isaac Paiva (https://www.isaacpaiva.com.br/)

## 1. Objetivo

Site institucional do jornal interno da escola Félix de Azevedo, em português do Brasil, com:

- página principal de apresentação do jornal;
- seção de últimas notícias, no formato de mini blog;
- painel administrativo online para publicar, editar e excluir notícias;
- links para o canal do YouTube, WhatsApp (patrocínio), Instagram e e-mail.

Público: alunos, famílias e comunidade escolar, com acesso predominantemente por celular.

## 2. Decisões já tomadas

| Tema | Decisão |
|---|---|
| Banco de dados | Nenhum. As notícias ficam em um arquivo JSON no repositório do projeto. |
| Tecnologia | HTML, CSS e JavaScript puros (módulos ES), sem etapa de build. |
| Hospedagem | GitHub Pages (gratuito; o repositório precisa ser público). |
| Painel admin | Online em `/admin`, grava no repositório pela API do GitHub usando um token. |
| Armazenamento das notícias | Um único `data/noticias.json`. Imagens em `assets/noticias/`. |
| Equipe | Arquivo `data/equipe.json` editado à mão. O painel não administra a equipe. |

## 3. Fora do escopo

- Comentários, curtidas, busca, categorias, paginação, newsletter.
- Painel para editar a equipe ou os links (editados nos arquivos JSON).
- Pré-visualização de link no WhatsApp/Instagram por notícia (o GitHub Pages serve HTML estático, então as tags Open Graph seriam iguais para todas as notícias).
- Múltiplos usuários com permissões diferentes. Quem tiver um token válido pode publicar.

## 4. Estrutura de arquivos

```
JFA/
  index.html              página principal
  noticias.html           lista completa de notícias
  noticia.html            leitura de uma notícia (?id=...)
  admin/index.html        painel administrativo
  css/
    style.css             estilos do site (tokens de cor na :root)
    admin.css             estilos do painel
  js/
    main.js               menu, seções da home, equipe, links
    noticias.js           lista e leitura de notícias no site público
    admin.js              interface do painel
    lib/
      slug.js             gera o id da notícia
      texto.js            transforma o texto em parágrafos seguros
      formato.js          data por extenso, iniciais, link do WhatsApp, validação de caminho de imagem
      modelo.js           valida, ordena e aplica criar/editar/excluir na lista
      github.js           cliente da API de conteúdo do GitHub (fetch injetável)
      imagem.js           redimensiona e converte a imagem no navegador
      publicar.js         orquestra publicar/editar/excluir sobre um cliente GitHub injetado
      dados.js            carrega os arquivos JSON do site
      dom.js              criação de DOM sem innerHTML
  data/
    noticias.json
    equipe.json
    config.json
  assets/                 logos (recortados e com nomes sem espaço), originais/, noticias/ e equipe/
  scripts/                ferramentas locais: recortar-logos.ps1, servir.js, mock-github.js
  tests/                  testes com node --test
  .nojekyll               evita o processamento do Jekyll no GitHub Pages
  README.md               passo a passo de publicação e uso
  docs/superpowers/specs/ esta especificação
```

Os módulos em `js/lib/` não dependem do DOM (exceto `imagem.js`), para poderem ser testados no Node.

## 5. Dados

### 5.1 `data/noticias.json`

```json
{
  "noticias": [
    {
      "id": "2026-09-30-feira-de-ciencias",
      "titulo": "Feira de Ciências",
      "autor": "Equipe FA News",
      "data": "2026-09-30",
      "resumo": "Até 160 caracteres.",
      "texto": "Parágrafo 1.\n\nParágrafo 2.",
      "imagem": "assets/noticias/2026-09-30-feira-de-ciencias.jpg"
    }
  ]
}
```

- `imagem` é opcional (`null` quando não há).
- A lista é exibida da data mais recente para a mais antiga. Em datas iguais, a notícia adicionada por último aparece primeiro.
- O `id` é a data mais o título simplificado (sem acentos, minúsculas, hífens). Se já existir, recebe o sufixo `-2`, `-3`, etc. O `id` não muda ao editar, para os links continuarem válidos.
- O arquivo é entregue com 3 notícias de exemplo, para validar o layout. Elas são apagadas pelo painel.

### 5.2 `data/equipe.json`

```json
{
  "membros": [
    { "nome": "Nome do Integrante", "funcao": "Repórter", "bio": "Mini bio de exemplo.", "foto": null }
  ]
}
```

Quando `foto` é `null`, o site mostra um avatar com as iniciais. Vem com 4 membros de exemplo.

### 5.3 `data/config.json`

```json
{
  "github": { "owner": "SEU-USUARIO", "repo": "fa-news", "branch": "main" },
  "youtube": "https://www.youtube.com/@JornalFA",
  "instagram": "https://www.instagram.com/jorna.lfa/",
  "whatsapp": "5585996333970",
  "whatsappExibicao": "+55 85 99633-3970",
  "email": "contato@jornalfa.example",
  "mensagemPatrocinio": "Olá! Tenho interesse em patrocinar o Jornal FA News."
}
```

`owner` e `repo` são valores provisórios até o repositório existir. O bloco `github` aceita ainda um campo opcional `apiUrl` (padrão `https://api.github.com`), usado apenas para testar o painel contra o GitHub falso local (`scripts/mock-github.js`); ele não aparece no arquivo entregue. O e-mail é um valor provisório (`.example` é um domínio reservado e não entrega e-mail). O link do WhatsApp é `https://wa.me/5585996333970?text=<mensagem codificada>`.

## 6. Site público

### 6.1 Página principal (`index.html`), na ordem

1. **Topo e boas-vindas.** Logo do jornal, "Seja bem-vindo ao Jornal FA News" e um texto introdutório provisório de 3 a 4 frases.
2. **Últimas notícias.** As 3 mais recentes, em cards (imagem, data, título, resumo). Link "Ver todas as notícias" para `noticias.html`. Cada card leva a `noticia.html?id=<id>`.
3. **Faixa "Clique e assista agora".** Botão para o canal do YouTube (abre em nova aba).
4. **Conheça nossa equipe.** Cards com foto (ou iniciais), nome, função e mini bio.
5. **Seja um patrocinador.** Texto curto e botão que abre o WhatsApp com a mensagem já preenchida.
6. **Redes sociais.** Instagram, WhatsApp e e-mail, com ícones e texto visível.
7. **Rodapé.** Logo da escola, nome "Félix de Azevedo", e o crédito "Desenvolvido por Isaac Paiva", com link para o site dele.

Navegação fixa no topo com âncoras (Início, Notícias, Vídeos, Equipe, Patrocine, Contato). No celular, vira um menu recolhível.

### 6.2 `noticias.html` e `noticia.html`

- `noticias.html` lista todas as notícias em cards, sem paginação.
- `noticia.html` mostra a notícia do parâmetro `id`. Se o `id` não existir, mostra "Notícia não encontrada" com link de volta. O `<title>` da página é atualizado com o título da notícia.

### 6.3 Leitura dos dados

- `fetch('data/noticias.json', { cache: 'no-cache' })`, para revalidar o cache e mostrar a notícia nova logo depois da publicação do GitHub Pages.
- Falha de rede, JSON inválido ou lista vazia: mensagem amigável no lugar da seção. A página não quebra.
- Todo texto vindo do JSON é inserido com `textContent`. Nunca `innerHTML`. O caminho da imagem só é aceito se começar com `assets/noticias/`.

### 6.4 Visual

- Cores extraídas dos logos: azul (~#0B49A8), amarelo (~#FFDD57), amarelo mais escuro do brasão (~#F5B800) e cinza suave (~#D9D9D9). Os valores finais são amostrados das imagens na implementação e ficam como variáveis CSS na `:root`.
- Fundo claro. Texto escuro sobre claro, azul sobre amarelo. Amarelo nunca é usado como cor de texto sobre branco (contraste insuficiente).
- Títulos em Montserrat (Google Fonts), com peso alto, próximo ao logo. Corpo em fonte sem serifa legível.
- Layout responsivo com prioridade para o celular (a partir de 360px), foco visível nos elementos interativos, `alt` nas imagens e respeito a `prefers-reduced-motion`.
- Os logos em `assets/` têm margens em branco. Na implementação são recortados e renomeados (`logo-jornal.png`, `logo-escola.png`, `icone.png`, este último também usado como favicon).

## 7. Painel administrativo (`/admin`)

### 7.1 Acesso

- A página é pública, mas sem token não executa nada. Ela não é linkada no menu do site.
- Tela inicial pede um token do GitHub (fine-grained, restrito ao repositório, permissão *Contents: Read and write*). O painel o valida com uma chamada ao repositório.
- O token fica em `sessionStorage` por padrão. Com a opção "lembrar neste dispositivo", vai para `localStorage`. O botão "Sair" apaga o token dos dois.
- O token nunca é gravado no repositório. Vazou? Revoga no GitHub e gera outro.

### 7.2 Telas

- **Lista.** Todas as notícias com botões Editar e Excluir (com confirmação) e o botão "Nova notícia".
- **Formulário.** Título (obrigatório), autor, data (padrão: hoje), resumo (até 160 caracteres, com contador), texto completo (obrigatório; linha em branco separa parágrafos) e imagem de capa opcional, com prévia e opção de remover. Aceita JPG, PNG e WebP.

### 7.3 Fluxo de salvar

1. Se há imagem nova, o navegador a redimensiona (largura máxima de 1200px), converte para JPEG (PNG com transparência ganha fundo branco) e envia para `assets/noticias/<id>.jpg`.
2. Busca a versão mais recente de `data/noticias.json` (com o `sha`).
3. Aplica a mudança (criar, editar ou excluir) nessa versão e grava com `PUT`. Em caso de conflito (HTTP 409 ou 422), repete os passos 2 e 3, no máximo 3 vezes.
4. Mostra "Publicado! Aparece no site em cerca de 1 a 2 minutos".

Excluir apaga a notícia do JSON e também a imagem dela (se houver).

### 7.4 Tratamento de erros

| Situação | Comportamento |
|---|---|
| Token inválido ou expirado | Volta à tela de token com mensagem clara. |
| Sem internet | Mensagem "Sem conexão" e o formulário continua preenchido. |
| Conflito de gravação | Repetição automática (3 tentativas); depois, mensagem para tentar de novo. |
| Imagem inválida ou muito grande | Recusa antes de enviar, com o motivo. |
| Falha após enviar a imagem e antes de gravar o JSON | Avisa e permite tentar de novo. A imagem sobra no repositório sem prejudicar o site. |

## 8. Testes e verificação

- **Automáticos (`node --test`):** `slug.js` (acentos, símbolos, colisão de id), `texto.js` (parágrafos, texto vazio, HTML digitado é tratado como texto), `modelo.js` (ordenação, criar, editar mantendo o id, excluir), `github.js` com `fetch` simulado (sucesso, 401, 409 com nova tentativa, falha de rede).
- **Manual:** conferir no navegador o layout da home, `noticias.html` e `noticia.html` em desktop e em 375px de largura, com e sem notícias, e com dados de erro.
- **Painel:** exercitado de ponta a ponta contra um GitHub falso local (`scripts/mock-github.js`), que reproduz os controles de `sha` e conflitos. A validação contra um repositório real do GitHub acontece quando o repositório e o token existirem, e fica registrada como pendente na entrega.

## 9. Entrega

- Código na pasta `D:\Projetos\JFA`, com `git init` local no início da implementação.
- `README.md` com o passo a passo: criar o repositório público no GitHub, enviar o projeto, ativar o GitHub Pages (branch principal, pasta raiz), gerar o token, preencher `config.json`, publicar a primeira notícia e trocar os placeholders.

## 10. Valores provisórios (para trocar depois)

- Texto introdutório da página principal.
- Nomes, funções, bios e fotos da equipe.
- E-mail de contato (`contato@jornalfa.example`).
- `owner` e `repo` do GitHub em `config.json`.
- As 3 notícias de exemplo.

O WhatsApp está definido como +55 85 99633-3970 (com o 9 à frente), conforme confirmado.
