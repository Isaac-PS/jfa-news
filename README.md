# Jornal FA News

Site do jornal interno da escola Félix de Azevedo. É um site estático (HTML, CSS e JavaScript), publicado no GitHub Pages, com um painel administrativo em `/admin` para publicar notícias. Não usa banco de dados: as notícias ficam no arquivo `data/noticias.json` e as fotos em `assets/noticias/`.

Desenvolvido por [Isaac Paiva](https://www.isaacpaiva.com.br/).

## O que tem no site

- Página principal: boas-vindas, últimas notícias, botão para o YouTube, equipe, patrocínio (WhatsApp) e redes sociais.
- `noticias.html`: todas as notícias. `noticia.html?id=...`: uma notícia.
- `admin/`: painel para criar, editar e excluir notícias.

## Ver o site no computador

Precisa do [Node.js](https://nodejs.org/) (versão 20 ou mais nova).

```bash
npm run servir
```

Abra http://localhost:4000. Para rodar os testes automáticos: `npm test`.

## Publicar no GitHub Pages (uma vez só)

1. Crie uma conta em https://github.com, se ainda não tiver.
2. Crie um repositório **público** (por exemplo `fa-news`). O GitHub Pages gratuito exige repositório público. Crie-o **vazio**: não marque *Add a README file*, *Add .gitignore* nem *Choose a license*; se marcar, o primeiro `git push` é recusado. Se mais de uma pessoa vai publicar, leia antes a seção **Gerar o token de acesso**: o ideal é criar o repositório numa organização.
3. Envie o projeto para o repositório (os comandos abaixo precisam do [Git](https://git-scm.com/) instalado):
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

## Gerar o token de acesso

O painel grava no repositório usando um token pessoal do GitHub.

**Quem gera o token:** o token precisa ser criado pela conta que é **dona do repositório**, porque os tokens "fine-grained" só enxergam repositórios do próprio dono. Quem só foi convidado como colaborador não consegue gerar, na própria conta, um token para este repositório. Para cada pessoa da equipe ter o seu token, crie o repositório numa **organização** gratuita do GitHub (foto do perfil > **Your organizations** > **New organization**) em vez de uma conta pessoal, e peça para cada pessoa gerar o token com **Resource owner** igual à organização. Se a organização pedir aprovação do token, quem é dono dela aprova em **Settings** > **Personal access tokens**.

1. No GitHub: foto do perfil > **Settings** > **Developer settings** > **Personal access tokens** > **Fine-grained tokens** > **Generate new token**.
2. **Token name:** `Painel FA News`. **Expiration:** escolha uma validade (por exemplo, 1 ano).
3. **Repository access:** escolha *Only select repositories* e marque o repositório do jornal. Atenção: a opção que já vem marcada, *Public repositories*, dá acesso **somente de leitura**: o painel entra, mostra as notícias, mas não consegue publicar.
4. **Permissions** > **Repository permissions** > **Contents: Read and write**.
5. Clique em **Generate token** e copie o valor (ele só aparece uma vez).

Guarde o token em local seguro e não o compartilhe fora da equipe. Se ele vazar, apague-o em **Fine-grained tokens** e gere outro.

## Publicar uma notícia

1. Abra o endereço do painel: `https://SEU-USUARIO.github.io/fa-news/admin/` (ou `https://seu-dominio/admin/`, se você usa domínio próprio).
2. Cole o token e clique em **Entrar**. Se você marcar "Lembrar neste dispositivo", o token fica guardado no navegador para o endereço do site e o painel entra sozinho nas próximas vezes. Marque só em computador ou celular de uso pessoal. Atenção: outros sites publicados no mesmo `SEU-USUARIO.github.io` conseguem ler esse dado do navegador; por isso é melhor usar uma conta ou organização só do jornal, ou um domínio próprio. Sem marcar, o token vale só para aquela aba: o painel pede o token de novo quando você fecha a aba.
3. Clique em **Nova notícia** e preencha título e texto (uma linha em branco separa os parágrafos). Autor e data já vêm preenchidos (troque se precisar). Resumo e imagem de capa são opcionais; sem resumo, o site usa o início do texto.
4. Clique em **Publicar**. A notícia aparece no site em cerca de 1 a 2 minutos.
5. Para corrigir ou apagar, use **Editar** ou **Excluir** na lista. Ao terminar, clique em **Sair**, principalmente em computadores compartilhados.

**Limites do painel:** título com até 120 caracteres e resumo com até 160. A imagem de capa pode ser JPG, PNG ou WebP, com até 15 MB; o painel a reduz sozinho para no máximo 1200 px de largura.

### Formatar o texto, com links, imagens e vídeos

Acima do campo **Texto** há uma barra de botões, e logo abaixo dele a **Prévia do texto** mostra como a notícia vai ficar.

| Botão | O que faz |
|---|---|
| **Subtítulo** | Transforma a linha do cursor em subtítulo (`## Título`). Clique de novo para desfazer. |
| **N** / **I** | Negrito (`**texto**`) e itálico (`*texto*`) no trecho selecionado. |
| **Link** | Transforma o trecho selecionado em link (`[texto](https://endereço)`). Aceita `exemplo.com` sem o `https://`. |
| **Imagem** | Envia uma foto do computador ou celular (reduzida sozinha) ou usa o endereço `https://` de uma imagem, com uma descrição que vira legenda. |
| **Vídeo** | Incorpora um vídeo a partir do link do YouTube ou do Vimeo. |

Os botões só escrevem essa marcação no texto; se preferir, digite-a à mão. Textos antigos, sem marcação, continuam iguais. HTML digitado no texto não é interpretado: aparece como texto comum.

Uma imagem enviada pelo botão **Imagem** vai para o site na hora. Se você desistir da notícia sem publicar, o arquivo fica no repositório (pasta `assets/noticias/`, nome começando por `corpo-`) e pode ser apagado pelo GitHub. Ao **excluir** uma notícia, o painel apaga também as imagens dela.

As três notícias que vêm no projeto são exemplos (título começa com "Exemplo:"). Exclua-as pelo painel quando publicar as reais.

## Trocar textos, equipe e contatos

| O que | Onde |
|---|---|
| Texto de boas-vindas | `index.html`, parágrafo com a classe `hero__texto` |
| Integrantes da equipe | `data/equipe.json` |
| Links, WhatsApp, e-mail | `data/config.json` |

**Equipe:** para cada integrante, edite `nome`, `funcao` e `bio`. Para usar foto, crie a pasta `assets/equipe/` (ela não vem com o projeto), coloque o arquivo nela (JPG, PNG ou WebP, de preferência quadrada e com menos de 500 KB) e escreva o caminho em `foto`, por exemplo `"foto": "assets/equipe/maria.jpg"`. Sem foto (`null`), o site mostra as iniciais.

**Contatos:** em `data/config.json`, troque `email` pelo e-mail real. O número do WhatsApp fica em `whatsapp` (só dígitos, com 55 e DDD) e `whatsappExibicao` (como aparece no site).

### Editar arquivos depois que o painel já publicou

O painel grava notícias direto no GitHub, então o repositório fica com notícias mais novas do que a cópia que está no seu computador. Para mexer em `data/equipe.json`, `data/config.json` ou `index.html` sem perder nada:

- **Jeito mais simples:** edite o arquivo direto no github.com. Abra o arquivo no repositório, clique no lápis (**Edit this file**), faça a alteração e clique em **Commit changes**.
- **Editando no computador** (precisa do [Git](https://git-scm.com/) instalado): rode `git pull` **antes** de começar e, depois de salvar, `git add`, `git commit` e `git push`. Se o `git push` for recusado, rode `git pull` e tente de novo. **Nunca use `git push --force`**: isso apagaria as notícias publicadas pelo painel.

## Problemas comuns

- **"O token é inválido, expirou ou não tem permissão":** gere um token novo (veja acima) e confira se a permissão **Contents: Read and write** está marcada e se o repositório certo foi escolhido com *Only select repositories*. Se a mensagem aparecer ao publicar, o painel volta para a tela de entrada e guarda o que você digitou: entre de novo com o token certo e clique em **Publicar**.
- **"Repositório ou arquivo não encontrado":** confira `owner` e `repo` em `data/config.json` e se essas alterações foram enviadas ao GitHub.
- **A notícia não aparece logo:** aguarde 1 a 2 minutos e recarregue. O GitHub Pages precisa publicar de novo a cada alteração.
- **"...outra pessoa alterou as notícias ao mesmo tempo...":** tente publicar de novo.

## Testar o painel sem GitHub (desenvolvimento)

`npm run mock-github` sobe um GitHub falso em http://localhost:4010 (token `token-de-teste`). Para usá-lo:

1. Em `data/config.json`, acrescente temporariamente `"apiUrl": "http://localhost:4010"` ao bloco `github` (e troque `owner` por qualquer nome, como `teste`, para sumir o aviso de repositório não configurado).
2. Em outro terminal, rode `npm run servir` e abra http://localhost:4000/admin/.
3. O que for publicado no GitHub falso fica só na memória dele (some quando ele é parado) e **não aparece** no site local.

Antes de publicar de verdade, **remova** o `apiUrl` (e devolva o `owner`) ou desfaça tudo com `git checkout -- data/config.json`. O `npm test` falha se o `apiUrl` ficar no arquivo.

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
