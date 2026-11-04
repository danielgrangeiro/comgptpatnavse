/* Execução Financeira — ComGptPatNavSE
 * JavaScript puro: no Apps Script ele entra pelo incluirJs(). */
(function () {
  'use strict';

  /* ============================================================
   * CONFIGURAÇÃO
   * Endereço onde os PDFs da pasta normativos/ estão publicados.
   * - Vazio: usa o caminho relativo (funciona no GitHub Pages e
   *   abrindo o index.html direto do computador).
   * - No Apps Script não há como hospedar PDF. Coloque aqui o
   *   endereço do GitHub Pages, com a barra no fim. Ex.:
   *   'https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/'
   *   Enquanto estiver vazio, o bloco Normativos some no Apps Script.
   * ============================================================ */
  var ENDERECO_ARQUIVOS = '';

  var NO_APPS_SCRIPT = typeof google !== 'undefined' && !!google.script;

  /* ============================================================
   * 1. Lista "feito": progresso guardado no navegador
   * ============================================================ */
  var CHAVE = 'cpgf-guia-conferencia-v2';
  var caixas = Array.prototype.slice.call(
    document.querySelectorAll('.marcar input[type="checkbox"]')
  );
  var barra = document.getElementById('barra');
  var conta = document.getElementById('conta');

  function ler() {
    try {
      var cru = localStorage.getItem(CHAVE);
      return cru ? JSON.parse(cru) : {};
    } catch (e) { return {}; }
  }

  function gravar() {
    var estado = {};
    caixas.forEach(function (c) { if (c.checked) estado[c.name] = 1; });
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (e) { /* janela privada ou dados do site bloqueados */ }
  }

  function pintar() {
    var feitos = caixas.filter(function (c) { return c.checked; }).length;
    var total = caixas.length;
    barra.style.width = total ? (feitos / total * 100) + '%' : '0';
    conta.textContent = feitos + ' de ' + total;
  }

  var salvo = ler();
  caixas.forEach(function (c) {
    c.checked = !!salvo[c.name];
    c.addEventListener('change', function () { gravar(); pintar(); });
  });

  document.getElementById('limpar').addEventListener('click', function () {
    caixas.forEach(function (c) { c.checked = false; });
    gravar();
    pintar();
  });

  pintar();


  /* ============================================================
   * 2. Botões "Copiar"
   *    No Apps Script a página roda num iframe; a API de clipboard
   *    pode estar bloqueada, então há um plano B com execCommand.
   * ============================================================ */
  function copiarTexto(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).catch(function () {
        return copiarAntigo(texto);
      });
    }
    return copiarAntigo(texto);
  }

  function copiarAntigo(texto) {
    return new Promise(function (ok, falha) {
      var area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var deu = false;
      try { deu = document.execCommand('copy'); } catch (e) { deu = false; }
      document.body.removeChild(area);
      if (deu) { ok(); } else { falha(); }
    });
  }

  function selecionar(el) {
    var faixa = document.createRange();
    faixa.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(faixa);
  }

  document.querySelectorAll('.copiar').forEach(function (botao) {
    botao.addEventListener('click', function () {
      var alvo = document.getElementById(botao.getAttribute('data-alvo'));
      if (!alvo) return;
      var texto = alvo.textContent.replace(/\s+/g, ' ').trim();
      var rotulo = botao.textContent;

      copiarTexto(texto).then(function () {
        botao.textContent = 'Copiado';
        botao.setAttribute('data-estado', 'ok');
      }, function () {
        selecionar(alvo);
        botao.textContent = 'Use Ctrl+C';
      }).then(function () {
        setTimeout(function () {
          botao.textContent = rotulo;
          botao.removeAttribute('data-estado');
        }, 1800);
      });
    });
  });


  /* ============================================================
   * 3. Calculadora de prazos do SF
   *    - período de aplicação: até 90 dias, contando o dia do início
   *      (ex.: 01AGO -> 29OUT);
   *    - prestação de contas: até 30 dias após o término
   *      (ex.: 29OUT -> 28NOV);
   *    - término em dezembro: prestação de contas até 15JAN.
   *    Mesma regra de prazoPrestacaoContas() no Codigo.gs.
   * ============================================================ */
  var MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
               'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  function lerData(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3]); // data local, sem fuso
  }

  function somarDias(data, dias) {
    var d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    d.setDate(d.getDate() + dias);
    return d;
  }

  function doisDig(n) { return (n < 10 ? '0' : '') + n; }

  function militar(d) {
    return doisDig(d.getDate()) + MESES[d.getMonth()] + String(d.getFullYear()).slice(2);
  }

  function civil(d) {
    return doisDig(d.getDate()) + '/' + doisDig(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function prazoPC(fim) {
    if (fim.getMonth() === 11) return new Date(fim.getFullYear() + 1, 0, 15);
    return somarDias(fim, 30);
  }

  var campo = document.getElementById('calc-inicio');
  var saida = document.getElementById('calc-saida');
  var alerta = document.getElementById('calc-alerta');

  function calcular() {
    var inicio = lerData(campo.value);
    if (!inicio) { saida.hidden = true; alerta.hidden = true; return; }

    var fim = somarDias(inicio, 89);
    var exercicio = new Date(inicio.getFullYear(), 11, 31);
    var cortado = fim > exercicio;
    if (cortado) fim = exercicio;

    var pc = prazoPC(fim);

    document.getElementById('calc-fim').innerHTML =
      militar(fim) + '<small>' + civil(fim) + '</small>';
    document.getElementById('calc-pc').innerHTML =
      militar(pc) + '<small>' + civil(pc) + '</small>';
    document.getElementById('calc-periodo').textContent =
      militar(inicio) + ' A ' + militar(fim);

    saida.hidden = false;
    alerta.hidden = !cortado;
  }

  if (campo) {
    campo.addEventListener('input', calcular);
    campo.addEventListener('change', calcular);
  }


  /* ============================================================
   * 4. Atalhos: marca a etapa visível
   * ============================================================ */
  var links = Array.prototype.slice.call(document.querySelectorAll('.atalhos a'));
  if ('IntersectionObserver' in window && links.length) {
    var porId = {};
    links.forEach(function (a) { porId[a.getAttribute('href').slice(1)] = a; });

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = porId[e.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    Object.keys(porId).forEach(function (id) {
      var secao = document.getElementById(id);
      if (secao) observador.observe(secao);
    });
  }


  /* ============================================================
   * 5. Normativos: links para os PDFs
   * ============================================================ */
  var blocoArquivos = document.querySelector('[data-arquivos]');
  if (blocoArquivos) {
    if (ENDERECO_ARQUIVOS) {
      blocoArquivos.querySelectorAll('a[data-arquivo]').forEach(function (a) {
        a.href = ENDERECO_ARQUIVOS + a.getAttribute('data-arquivo');
      });
    } else if (NO_APPS_SCRIPT) {
      blocoArquivos.hidden = true;
      var atalho = document.querySelector('.atalhos a[href="#' + blocoArquivos.id + '"]');
      if (atalho) atalho.parentNode.hidden = true;
    }
  }


  /* ============================================================
   * 6. Navegação entre páginas
   *    Tudo fica num único index.html; cada página é um <main
   *    class="vista">. O endereço usa #/nome-da-pagina, e #ancora
   *    leva a uma seção dentro dela.
   *    Os cliques são tratados aqui porque, no Apps Script, o
   *    <base target="_top"> faria um link #... recarregar a janela.
   * ============================================================ */
  var TITULO_BASE = 'Execução Financeira · ComGptPatNavSE';
  var vistas = Array.prototype.slice.call(document.querySelectorAll('.vista'));
  var trilha = document.getElementById('trilha');
  var trilhaAtual = document.getElementById('trilha-atual');

  function nomeDaVista(v) {
    var h1 = v.querySelector('h1');
    return h1 ? h1.textContent.trim() : '';
  }

  function lerEndereco(hash) {
    var h = String(hash || '').replace(/^#/, '');
    if (h.charAt(0) === '/') return { vista: h.slice(1) || 'inicio' };
    var alvo = h && document.getElementById(h);
    if (alvo) {
      var v = alvo.closest('.vista');
      return { vista: v ? v.getAttribute('data-vista') : 'inicio', ancora: h };
    }
    return { vista: 'inicio' };
  }

  function mostrar(rota) {
    var atual = null;
    vistas.forEach(function (v) {
      var esta = v.getAttribute('data-vista') === rota.vista;
      v.hidden = !esta;
      if (esta) atual = v;
    });
    if (!atual) { // endereço desconhecido: volta ao início
      atual = vistas[0];
      atual.hidden = false;
    }

    var inicio = atual.getAttribute('data-vista') === 'inicio';
    trilha.hidden = inicio;
    trilhaAtual.textContent = inicio ? '' : nomeDaVista(atual);
    document.title = inicio ? TITULO_BASE : nomeDaVista(atual) + ' · ' + TITULO_BASE;

    var alvo = rota.ancora && document.getElementById(rota.ancora);
    if (alvo) { alvo.scrollIntoView(); } else { window.scrollTo(0, 0); }
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href^="#"]');
    if (!a) return;
    ev.preventDefault();
    var hash = a.getAttribute('href');
    mostrar(lerEndereco(hash));
    try {
      if (location.hash !== hash) history.pushState(null, '', hash);
    } catch (e) { /* iframe do Apps Script pode bloquear o histórico */ }
  });

  window.addEventListener('popstate', function () {
    mostrar(lerEndereco(location.hash));
  });

  mostrar(lerEndereco(location.hash));
})();
