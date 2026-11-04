/**
 * ComGptPatNavSE — Execução Financeira
 * Projeto Apps Script vinculado à planilha do Google.
 *
 * O que este arquivo faz:
 *   1. cria um menu próprio na planilha;
 *   2. mostra o site como barra lateral ou janela;
 *   3. publica o site como aplicativo da Web (doGet), que é o endereço
 *      para colocar como link na intranet;
 *   4. registra um ato de concessão de SF numa aba da planilha.
 *
 * Arquivos no editor do Apps Script (todos do tipo HTML, menos este):
 *   Codigo.gs   este arquivo
 *   index       conteúdo de index.html
 *   style       conteúdo de style.css, colado como está
 *   script      conteúdo de script.js, colado como está
 *
 * O Apps Script só guarda arquivos .html. Por isso o CSS e o JS ficam em
 * arquivos HTML com o texto puro, e incluirCss()/incluirJs() os embutem
 * no index na hora de montar a página.
 */

var ABA_REGISTRO = 'Atos de Concessão';
var CABECALHO = [
  'Registrado em', 'Nº da OS', 'Suprido', 'UGR', 'Modalidade',
  'ND', 'PI', 'Valor total', 'Valor saque', 'Início aplicação',
  'Fim aplicação', 'Prazo da PC', 'Nº da NE', 'Observação'
];


/* ------------------------------------------------------------------ *
 *  1. Menu na planilha                                               *
 * ------------------------------------------------------------------ */

/** Roda sozinho quando alguém abre a planilha. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Execução Financeira')
    .addItem('Abrir na barra lateral', 'mostrarBarraLateral')
    .addItem('Abrir em janela', 'mostrarJanela')
    .addSeparator()
    .addItem('Preparar aba de registro', 'prepararAbaRegistro')
    .addToUi();
}

var TITULO = 'Execução Financeira · ComGptPatNavSE';

/** Monta o site: index com style e script embutidos. */
function pagina() {
  return HtmlService.createTemplateFromFile('index').evaluate();
}

/**
 * Texto de um arquivo do projeto, sem processar.
 * @param {string} nome nome do arquivo no editor, sem extensão
 * @return {string}
 */
function lerArquivo(nome) {
  return HtmlService.createTemplateFromFile(nome).getRawContent();
}

/** Usada no index:  incluirCss('style') -> <style>…</style> */
function incluirCss(nome) {
  return '<style>\n' + lerArquivo(nome) + '\n</style>';
}

/** Usada no index:  incluirJs('script') -> <script>…</script> */
function incluirJs(nome) {
  return '<script>\n' + lerArquivo(nome) + '\n</script>';
}

function mostrarBarraLateral() {
  var html = pagina()
    .setTitle('Execução Financeira');
  SpreadsheetApp.getUi().showSidebar(html);
}

function mostrarJanela() {
  var html = pagina()
    .setWidth(900)
    .setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, TITULO);
}


/* ------------------------------------------------------------------ *
 *  2. Aplicativo da Web — o link da intranet                         *
 * ------------------------------------------------------------------ */

/**
 * Chamado quando alguém abre a URL da implantação.
 * Implantar > Nova implantação > Aplicativo da Web.
 */
function doGet(e) {
  return pagina()
    .setTitle(TITULO)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


/* ------------------------------------------------------------------ *
 *  3. Registro do ato de concessão                                   *
 * ------------------------------------------------------------------ */

/** Cria a aba de registro com o cabeçalho, se ainda não existir. */
function prepararAbaRegistro() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(ABA_REGISTRO);

  if (!aba) {
    aba = planilha.insertSheet(ABA_REGISTRO);
  }

  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, CABECALHO.length)
       .setValues([CABECALHO])
       .setFontWeight('bold');
    aba.setFrozenRows(1);
    aba.autoResizeColumns(1, CABECALHO.length);
  }

  SpreadsheetApp.getUi().alert('Aba "' + ABA_REGISTRO + '" pronta.');
}

/**
 * Grava um ato de concessão. Chamada do HTML por google.script.run.
 * @param {Object} dados campos do formulário
 * @return {Object} {ok: boolean, mensagem: string, linha: number}
 */
function registrarAto(dados) {
  dados = dados || {};

  var obrigatorios = ['os', 'suprido', 'valorTotal', 'fimAplicacao'];
  var faltando = obrigatorios.filter(function (campo) {
    return !String(dados[campo] || '').trim();
  });

  if (faltando.length) {
    return {
      ok: false,
      mensagem: 'Preencha: ' + faltando.join(', ')
    };
  }

  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(ABA_REGISTRO);
  if (!aba) {
    aba = planilha.insertSheet(ABA_REGISTRO);
    aba.getRange(1, 1, 1, CABECALHO.length)
       .setValues([CABECALHO])
       .setFontWeight('bold');
    aba.setFrozenRows(1);
  }

  var linha = [
    new Date(),
    dados.os || '',
    dados.suprido || '',
    dados.ugr || '',
    dados.modalidade || '',
    dados.nd || '',
    dados.pi || '',
    dados.valorTotal || '',
    dados.valorSaque || '',
    dados.inicioAplicacao || '',
    dados.fimAplicacao || '',
    prazoPrestacaoContas(dados.fimAplicacao),
    dados.ne || '',
    dados.observacao || ''
  ];

  aba.appendRow(linha);

  return {
    ok: true,
    mensagem: 'Ato registrado na linha ' + aba.getLastRow() + '.',
    linha: aba.getLastRow()
  };
}

/**
 * Prazo da prestação de contas: até 30 dias contados do 1º dia após o término
 * do período de aplicação. Aplicação encerrada em dezembro vence em 15JAN do
 * exercício seguinte.
 * @param {string|Date} fimAplicacao
 * @return {Date|string}
 */
function prazoPrestacaoContas(fimAplicacao) {
  if (!fimAplicacao) return '';

  var fim = lerDataLocal(fimAplicacao);
  if (!fim) return '';

  if (fim.getMonth() === 11) {               // dezembro
    return new Date(fim.getFullYear() + 1, 0, 15);
  }

  // 30 dias contados do 1º dia após o término: 29OUT -> 28NOV (exemplo do guia)
  var prazo = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  prazo.setDate(prazo.getDate() + 30);
  return prazo;
}

/**
 * Lê 'AAAA-MM-DD' como data local. new Date('AAAA-MM-DD') lê em UTC e,
 * no fuso de Brasília, cai no dia anterior às 21h.
 * @param {string|Date} valor
 * @return {Date|null}
 */
function lerDataLocal(valor) {
  if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor;
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  var d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Devolve os atos já registrados, para o HTML montar uma lista.
 * @return {Array<Object>}
 */
function listarAtos() {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_REGISTRO);
  if (!aba || aba.getLastRow() < 2) return [];

  var valores = aba.getRange(2, 1, aba.getLastRow() - 1, CABECALHO.length).getValues();

  return valores.map(function (linha) {
    var item = {};
    CABECALHO.forEach(function (titulo, i) {
      var valor = linha[i];
      item[titulo] = (valor instanceof Date) ? valor.toISOString() : valor;
    });
    return item;
  });
}


/* ------------------------------------------------------------------ *
 *  4. Teste rápido — rode daqui, não da planilha                     *
 * ------------------------------------------------------------------ */

function testarPrazo() {
  [
    '2026-10-29',   // -> 28/11/2026 (exemplo do guia)
    '2026-03-20',   // -> 19/04/2026
    '2026-12-31',   // -> 15/01/2027
    ''              // -> vazio
  ].forEach(function (data) {
    Logger.log(data + '  ->  ' + prazoPrestacaoContas(data));
  });
}
