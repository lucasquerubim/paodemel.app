/**
 * print.js — Impressão de Comandas
 * Padaria Pão de Mel
 *
 * NOVA VERSÃO:
 * - Formato A4 paisagem
 * - 2 comandas idênticas lado a lado (= meia folha A4 cada)
 * - Cliente em destaque GIGANTE preto
 * - Sem cortes laterais
 * - Itens grandes e legíveis
 */

const Print = (() => {

  function comanda(id) {
    const p = Storage.getPedidos().find(x => x.id === id);
    if (!p) return;

    const html = _buildComanda(p);

    // Duas vias lado a lado para corte (cada uma = meia folha A4)
    document.getElementById('print-area').innerHTML = `
      <div class="print-sheet">
        ${html}
        ${html}
      </div>
    `;

    App.closeModal('modal-detail');
    document.getElementById('print-area').style.display = 'block';

    setTimeout(() => {
      window.print();
      document.getElementById('print-area').style.display = 'none';
    }, 300);
  }

  function _buildComanda(p) {

    // === Linhas dos itens ===
    const itensRows = (p.itens || []).map((it, i) => `
      <tr>
        <td class="col-num">${i + 1}</td>
        <td class="col-item">
          <div class="item-name">${it.nome}</div>
          ${it.obs ? `<div class="item-obs">${it.obs}</div>` : ''}
        </td>
        <td class="col-qtd">${it.qtd}</td>
        <td class="col-unid">${it.unid || '—'}</td>
      </tr>`).join('');

    // === Descartáveis ===
    const descAtivos = (p.descartaveis || []).filter(d => d.qtd > 0);
    let descText = '';

    if (descAtivos.length) {
      descText = descAtivos.map(d => `${d.label.replace(/[^\w\s\u00C0-\u017F]/g, '').trim()}: ${d.qtd}`).join(' • ');
    }
    if (p.descOutros) {
      descText += (descText ? ' • ' : '') + 'Outros: ' + p.descOutros;
    }

    const descBlock = descText ? `
      <div class="desc-block">
        <div class="block-label">🥤 DESCARTÁVEIS</div>
        <div class="block-content">${descText}</div>
      </div>` : '';

    const obsBlock = p.obs ? `
      <div class="obs-block">
        <div class="block-label">📝 OBSERVAÇÕES</div>
        <div class="block-content">${p.obs}</div>
      </div>` : '';

    const enderecoBlock = (p.formaEntrega === 'entrega' && p.endereco) ? `
      <div class="endereco-block">
        <div class="block-label">📍 ENDEREÇO DE ENTREGA</div>
        <div class="block-content">${p.endereco}</div>
      </div>` : '';

    const flagsRow = `
      <div class="flags-row">
        <span class="flag ${p.nota ? 'flag-yes' : 'flag-no'}">
          ${p.nota ? '✓' : '✗'} Nota Fiscal
        </span>
        <span class="flag ${p.compra ? 'flag-warn' : 'flag-no'}">
          ${p.compra ? '!' : '✗'} Comprar Insumo${p.compra && p.compraDetail ? ': ' + p.compraDetail : ''}
        </span>
        <span class="flag flag-info">
          ${p.formaEntrega === 'entrega' ? '🚚 Entregar' : '🏪 Retirada'}
        </span>
      </div>`;

    return `
      <div class="comanda">

        <!-- TOPO COM LOGO E TIPO -->
        <div class="comanda-top">
          <div class="comanda-logo">
            <span class="logo-icon">🍞</span>
            <span class="logo-text">Pão de Mel</span>
          </div>
          <div class="comanda-tipo">${(App.TIPO_LABELS[p.tipo] || p.tipo).toUpperCase()}</div>
        </div>

        <!-- NOME DO CLIENTE GIGANTE EM PRETO -->
        <div class="comanda-cliente-block">
          <div class="cliente-label">CLIENTE</div>
          <div class="cliente-name">${p.cliente}</div>
          ${p.telefone ? `<div class="cliente-tel">📞 ${p.telefone}</div>` : ''}
        </div>

        <!-- ENTREGA EM DESTAQUE -->
        <div class="entrega-destaque">
          <div class="entrega-box entrega-main">
            <div class="entrega-label">🚚 ENTREGA</div>
            <div class="entrega-data">${App.fmtDateBR(p.dtEntrega)}</div>
            ${p.hrEntrega ? `<div class="entrega-hora">às ${p.hrEntrega}</div>` : ''}
          </div>
          <div class="entrega-box">
            <div class="entrega-label">📦 PRODUÇÃO</div>
            <div class="entrega-data-sm">${App.fmtDateBR(p.dtProd)}</div>
            ${p.hrProd ? `<div class="entrega-hora">às ${p.hrProd}</div>` : ''}
          </div>
          <div class="entrega-box">
            <div class="entrega-label">${p.formaEntrega === 'entrega' ? '🚚 ENTREGADOR' : '👨‍🍳 PRODUÇÃO'}</div>
            <div class="entrega-data-sm">${p.formaEntrega === 'entrega' ? (p.entregador || '—') : (p.respProd || '—')}</div>
          </div>
        </div>

        ${flagsRow}

        ${enderecoBlock}

        <!-- TABELA DE ITENS -->
        <div class="itens-wrapper">
          <div class="block-label">🛍️ ITENS DO PEDIDO</div>
          <table class="itens-table">
            <thead>
              <tr>
                <th class="col-num">#</th>
                <th class="col-item">Item</th>
                <th class="col-qtd">Qtd</th>
                <th class="col-unid">Unid.</th>
              </tr>
            </thead>
            <tbody>${itensRows}</tbody>
          </table>
        </div>

        ${descBlock}
        ${obsBlock}

        <!-- ASSINATURAS -->
        <div class="sign-row">
          <div class="sign-box"><div class="sign-label">Responsável Produção</div></div>
          <div class="sign-box"><div class="sign-label">Conferência</div></div>
        </div>

        <!-- RODAPÉ -->
        <div class="comanda-footer">
          Padaria Pão de Mel • Gerado em ${new Date().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
        </div>

      </div>
    `;
  }

  return { comanda };

})();
