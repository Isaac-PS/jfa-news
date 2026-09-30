# Jornal FA News

Site do jornal interno da escola Félix de Azevedo. É um site estático (HTML, CSS e JavaScript), publicado no GitHub Pages, com um painel administrativo em `/admin` para publicar notícias. Não usa banco de dados: as notícias ficam no arquivo `data/noticias.json` e as fotos em `assets/noticias/`.

Desenvolvido por [Isaac Paiva](https://www.isaacpaiva.com.br/).

## O que tem no site

- Página principal: boas-vindas, últimas notícias, botão para o YouTube, equipe, patrocínio (WhatsApp) e redes sociais.
- `noticias.html`: todas as notícias. `noticia.html?id=...`: uma notícia.
- `admin/`: painel para criar, editar e excluir notícias.

## Ver o site no computador

Precisa do [Node.js](https://nodejs.org/) (versão 22 ou mais nova).

```bash
npm run servir
```

Abra http://localhost:4000. Para rodar os testes automáticos: `npm test`.

## Publicar no GitHub Pages (uma vez só)

1. Crie uma conta em https://github.com, se ainda não tiver.
2. Crie um repositório **público** (por exemplo `fa-news`). O GitHub Pages gratuito exige repositório público.
3. Envie o projeto para o repositório:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/fa-news.git
   git push -u origin main
   ```
4. No GitHub, abra o repositório > **Settings** > **Pages**. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`. Salve.
5. Aguarde cerca de 1 a 2 minutos. O endereço aparece na mesma tela (algo como `https://SEU-USUARIO.github.io/fa-news/`).
6. Para usar um domínio próprio (por exemplo `jornalfa.com.br`), preencha o campo **Custom domain** na mesma tela e siga as instruções de DNS do GitHub.

## Configurar o painel

Edite `data/config.json` e troque `SEU-USUARIO` e `fa-news` pelo dono e pelo nome do seu repositório:

```json
"github": { "owner": "SEU-USUARIO", "repo": "fa-news", "branch": "main" }
```

Salve e envie a alteração para o GitHub (`git add`, `git commit`, `git push`).

## Gerar o token de acesso (para quem vai publicar)

O painel grava no repositório usando um token pessoal do GitHub.

1. No GitHub: foto do perfil > **Settings** > **Developer settings** > **Personal access tokens** > **Fine-grained tokens** > **Generate new token**.
2. **Token name:** `Painel FA News`. **Expiration:** escolha uma validade (por exemplo, 1 ano).
3. **Repository access:** *Only select repositories* e escolha o repositório do jornal.
4. **Permissions** > **Repository permissions** > **Contents: Read and write**.
5. Clique em **Generate token** e copie o valor (ele só aparece uma vez).

Guarde o token em local seguro e não o compartilhe fora da equipe. Se ele vazar, apague-o em **Fine-grained tokens** e gere outro.

## Publicar uma notícia

1. Abra `https://SEU-SITE/admin/`.
2. Cole o token e clique em **Entrar**. Marque "Lembrar neste dispositivo" só em computador ou celular de uso pessoal.
3. Clique em **Nova notícia** e preencha título e texto (uma linha em branco separa os parágrafos). Autor e data já vêm preenchidos (troque se precisar). Resumo e imagem de capa são opcionais; sem resumo, o site usa o início do texto.
4. Clique em **Publicar**. A notícia aparece no site em cerca de 1 a 2 minutos.
5. Para corrigir ou apagar, use **Editar** ou **Excluir** na lista. Ao terminar, clique em **Sair**, principalmente em computadores compartilhados.

As três notícias que vêm no projeto são exemplos (título começa com "Exemplo:"). Exclua-as pelo painel quando publicar as reais.

## Trocar textos, equipe e contatos

| O que | Onde |
|---|---|
| Texto de boas-vindas | `index.html`, parágrafo com a classe `hero__texto` |
| Integrantes da equipe | `data/equipe.json` |
| Links, WhatsApp, e-mail | `data/config.json` |

**Equipe:** para cada integrante, edite `nome`, `funcao` e `bio`. Para usar foto, coloque o arquivo em `assets/equipe/` (JPG, PNG ou WebP, de preferência quadrada e com menos de 500 KB) e escreva o caminho em `foto`, por exemplo `"foto": "assets/equipe/maria.jpg"`. Sem foto (`null`), o site mostra as iniciais.

**Contatos:** em `data/config.json`, troque `email` pelo e-mail real. O número do WhatsApp fica em `whatsapp` (só dígitos, com 55 e DDD) e `whatsappExibicao` (como aparece no site).

## Problemas comuns

- **"O token é inválido, expirou ou não tem permissão":** gere um token novo (veja acima) e confira se a permissão **Contents: Read and write** está marcada e se o repositório certo foi escolhido.
- **"Repositório ou arquivo não encontrado":** confira `owner` e `repo` em `data/config.json` e se essas alterações foram enviadas ao GitHub.
- **A notícia não aparece logo:** aguarde 1 a 2 minutos e recarregue. O GitHub Pages precisa publicar de novo a cada alteração.
- **"...outra pessoa alterou as notícias ao mesmo tempo...":** tente publicar de novo.

## Testar o painel sem GitHub (desenvolvimento)

`npm run mock-github` sobe um GitHub falso em http://localhost:4010 (token `token-de-teste`). Para usá-lo, acrescente temporariamente `"apiUrl": "http://localhost:4010"` ao bloco `github` de `data/config.json` e **remova** antes de publicar.

## Estrutura

```
index.html, noticias.html, noticia.html   páginas do site
admin/index.html                          painel
css/                                      estilos
js/                                       scripts (js/lib/ tem a lógica testada)
data/                                     notícias, equipe e configuração
assets/                                   logos, fotos das notícias e da equipe (originais/ guarda os logos originais)
scripts/                                  ferramentas locais (servidor, GitHub falso, recorte de logos)
tests/                                    testes automáticos (npm test)
docs/                                     especificação e plano de implementação
```
