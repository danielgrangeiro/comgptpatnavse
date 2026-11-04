# Execução Financeira — ComGptPatNavSE

Site da Seção de Execução Financeira do **Comando do Grupamento de Patrulha Naval do
Sudeste (ComGptPatNavSE)**. Ele reúne os serviços que a seção presta aos navios
subordinados e, com o tempo, vai publicar os gastos e atos administrativos do
Grupamento.

O site é uma página estática: HTML, CSS e JavaScript, sem framework e sem etapa de
build. O mesmo código roda em três lugares, sem nenhuma alteração:

| Onde | Para quê |
|---|---|
| Navegador, abrindo o `index.html` | Ver e testar as alterações |
| GitHub Pages | Versão pública do repositório |
| Google Apps Script (aplicativo da Web) | Endereço oficial divulgado aos navios |

## Situação

| Serviço | Situação |
|---|---|
| 01 · Suprimento de Fundos | **Publicado.** Guia do CPGF completo |
| 02 · Diárias e Passagens | Em breve |
| 03 · Empenho e Pagamento | Em breve |
| 04 · Transparência — gastos e atos administrativos | Em breve |

### Suprimento de Fundos: o guia do CPGF

Resume o *Guia para Utilização do Suprimento de Fundos* do ComGptPatNavSE
([`GUIA SF.pdf`](GUIA%20SF.pdf)) e cobre o caminho inteiro do portador do cartão:

1. **Emitir o cartão.** Cadastro do Portador no Banco do Brasil, campo a campo:
   centros de custo dos navios, permissões e filtros.
2. **Pedir a concessão.** Proposta de Concessão, justificativas dos regimes normal
   e especial, limites por regime e classe de navio, e calculadora do período de
   aplicação e do prazo da prestação de contas.
3. **Usar o cartão.** Dados que devem sair na nota fiscal, o que pode ser comprado,
   e a certificação da NF e da fatura mensal.
4. **Lançar as notas no SCP.** Pedido de acesso pelo SisNetuno e lançamento no
   Compras.gov.br.
5. **Comprovação.** Os erros que mais aparecem.

Cada etapa termina com uma lista de verificação. As marcações ficam só no navegador
de quem abriu a página e não são enviadas a lugar nenhum.

## Arquivos

```
.
├── index.html        estrutura de todas as páginas
├── style.css         aparência (CSS puro)
├── script.js         navegação, listas, calculadora, botões de copiar
├── Codigo.gs         servidor do Apps Script (menu, doGet, registro de atos)
├── GUIA SF.pdf       guia original, fonte do conteúdo do SF
└── normativos/
    ├── SGM-301-REV10.pdf
    └── subelementos/
        ├── 339030.pdf             material de consumo
        ├── 339039.pdf             outros serviços de terceiros, PJ
        └── 449052_atualizado.pdf  equipamentos e material permanente
```

### Como as páginas funcionam

Tudo fica num único `index.html`. Cada página é um bloco `<main class="vista">`, e o
`script.js` mostra um bloco de cada vez conforme o endereço:

| Endereço | Página |
|---|---|
| `#/` | Início, com o menu dos serviços |
| `#/suprimento-de-fundos` | Suprimento de Fundos |
| `#cartao`, `#concessao`, `#uso`… | Uma seção dentro da página |

Assim o site não depende de várias rotas no servidor, o que no Apps Script exigiria
um `doGet` por página.

### Como o mesmo arquivo roda no Apps Script

O Apps Script só guarda arquivos HTML e não serve `.css` nem `.js` soltos. O
`index.html` resolve isso com as marcações de template do Apps Script:

```html
<?!= incluirCss('style'); ?>
<? if (false) { ?><link rel="stylesheet" href="style.css"><? } ?>
```

- **No navegador**, o navegador lê `<? … ?>` como comentário: a primeira linha some
  e o `<link>` carrega o `style.css`.
- **No Apps Script**, `incluirCss('style')` embute o CSS e o `if (false)` apaga o
  `<link>`.

O JavaScript segue o mesmo esquema com `incluirJs('script')`.

## Ver no computador

Abra o `index.html` no navegador. Se quiser um servidor local:

```sh
python3 -m http.server 8000
# e abra http://localhost:8000
```

## Publicar no GitHub Pages

1. No repositório: **Settings › Pages**.
2. Em *Source*, escolha **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
3. O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

## Copiar para o Google Apps Script

Faça isso a cada atualização do site.

1. Abra o projeto Apps Script (na planilha: **Extensões › Apps Script**).
2. Na primeira vez, crie três arquivos do tipo **HTML** com estes nomes exatos:
   `index`, `style` e `script`.
3. Copie o conteúdo, como está, de:

   | Arquivo do repositório | Arquivo no Apps Script |
   |---|---|
   | `Codigo.gs` | `Codigo.gs` |
   | `index.html` | `index` |
   | `style.css` | `style` |
   | `script.js` | `script` |

   O CSS e o JS são colados puros, sem `<style>` nem `<script>` em volta. O
   `Codigo.gs` é que acrescenta essas tags.
4. **Implantar › Gerenciar implantações ›** editar a implantação ativa ›
   *Versão: Nova versão* › **Implantar**. Assim o endereço continua o mesmo.

Na primeira implantação, use **Implantar › Nova implantação › Aplicativo da Web**,
com *Executar como: eu* e *Quem pode acessar* conforme o público desejado.

### Normativos no Apps Script

O Apps Script não hospeda PDFs. Para os links da seção *Normativos* funcionarem lá,
publique o repositório no GitHub Pages e informe o endereço no início do
`script.js`:

```js
var ENDERECO_ARQUIVOS = 'https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/';
```

Enquanto essa variável estiver vazia, a seção *Normativos* fica escondida no Apps
Script e continua aparecendo no navegador e no GitHub Pages.

## Recursos extras do `Codigo.gs`

Quando o projeto está vinculado a uma planilha, o `Codigo.gs` também:

- cria o menu **Execução Financeira**, que abre o site na barra lateral ou numa janela;
- cria a aba **Atos de Concessão** e registra atos com `registrarAto()`, calculando
  o prazo da prestação de contas: 30 dias após o fim da aplicação, ou 15JAN se a
  aplicação terminar em dezembro.

A calculadora do site usa a mesma regra. Se mudar uma, mude a outra.

## Acrescentar um serviço

1. No `index.html`, troque o cartão `<div class="servico em-breve">` do serviço por
   um link:

   ```html
   <a class="servico" href="#/diarias"> … <span class="servico-estado">Abrir →</span></a>
   ```

2. Antes do fechamento `</div>` da `.folha`, crie a página:

   ```html
   <main class="vista" data-vista="diarias" hidden>
     <header>
       <p class="eyebrow">Serviço 02</p>
       <h1>Diárias e Passagens</h1>
     </header>
     …
   </main>
   ```

   O `data-vista` precisa ser igual ao que vem depois de `#/` no link. O `<h1>` vira
   o nome na trilha "Início › …" e no título da aba.

3. Para listas de verificação, use `<ul class="marcar">` com um `name` único em cada
   `<input type="checkbox">`. O `name` é a chave salva no navegador.

## Manutenção do conteúdo

Estes valores mudam com a legislação e devem ser revistos a cada atualização do
Manual de SF da DFM ou do limite de dispensa de licitação:

- **Limites de concessão** (página de SF, seção 2), hoje com base no limite de
  dispensa de R$ 65.492,11 (Lei nº 14.133/2021, art. 75, II, atualizado pelo
  Decreto nº 12.807/2025);
- **centros de custo** dos navios (seção 1);
- **edições** do Manual de SF (4ª ed., JAN2026) e da SGM-301 (10ª Rev.).

## Fontes

- Guia para Utilização do Suprimento de Fundos, ComGptPatNavSE
- Manual de Suprimento de Fundos da DFM, 4ª edição (JAN2026)
- SGM-301, Normas sobre Administração Financeira e Contabilidade, 10ª Revisão
- Decreto nº 93.872/1986, arts. 45 e 47
- Portarias Normativas GM-MD nº 5.168/2021 e nº 3.518/2021
- Lei nº 14.133/2021, art. 75, e Decreto nº 12.807/2025

## Aviso

Este site é material de orientação. Ele não substitui a legislação, o Manual de SF
da DFM nem as normas da Marinha. Confira sempre a edição vigente antes de instruir
um processo.
