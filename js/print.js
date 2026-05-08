/**
 * print.js — Impressão de Comandas e Notas
 * Padaria Pão de Mel
 */

const Print = (() => {

  // ── Comanda A4 de produção ─────────────────────────────────

  function comanda(id) {
    const p = Storage.getPedidos().find(x => x.id === id);
    if (!p) return;

    const itensRows = (p.itens || []).map(it => `
      <tr>
        <td>${it.nome}</td>
        <td>${it.qtd}</td>
        <td>${it.unid || '—'}</td>
        <td>${App.fmtMoeda(it.valorUnit)}</td>
        <td style="font-weight:800;">${App.fmtMoeda(it.total)}</td>
      </tr>`).join('');

    const descAtivos = (p.descartaveis || []).filter(d => d.qtd > 0);
    const descHtml = descAtivos.length
      ? `<div class="print-desc-section">
           <div class="print-desc-title">🥤 Descartáveis</div>
           <div class="print-desc-items">
             ${descAtivos.map(d => `${d.label}: <strong>${d.qtd}</strong>`).join(' &nbsp;|&nbsp; ')}
           </div>
         </div>`
      : '';

    const obsHtml = p.obs
      ? `<div class="print-obs">
           <strong>📝 Observações:</strong><br>${p.obs}
         </div>`
      : '';

    const agora = new Date();

    document.getElementById('print-area').innerHTML = `
      <div class="print-page">

        <!-- Cabeçalho -->
        <div class="print-header">
          <div>
            <div class="print-logo-name">🍞 Pão de Mel</div>
            <div class="print-logo-sub">Padaria • 25 Anos de Tradição</div>
          </div>
          <div class="print-header-right">
            COMANDA DE PRODUÇÃO<br>
            ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}<br>
            Criado por: <strong>${p.criadoPor || '—'}</strong>
          </div>
        </div>

        <!-- Cliente em destaque -->
        <div class="print-client-block">
          <div class="print-client-label">${App.TIPO_LABELS[p.tipo] || p.tipo}</div>
          <div class="print-client-name">${p.cliente}</div>
          <div class="print-client-sub">${p.telefone || ''}</div>
        </div>

        <!-- Grid de informações -->
        <div class="print-info-grid">
          <div class="print-info-box">
            <div class="print-info-label">📦 Data de Produção</div>
            <div class="print-info-val">${App.fmtDateTimeBR(p.dtProd, p.hrProd)}</div>
          </div>
          <div class="print-info-box">
            <div class="print-info-label">🚚 Data de Entrega</div>
            <div class="print-info-val">${App.fmtDateTimeBR(p.dtEntrega, p.hrEntrega)}</div>
          </div>
          <div class="print-info-box">
            <div class="print-info-label">👨‍🍳 Resp. Produção</div>
            <div class="print-info-val">${p.respProd || '—'}</div>
          </div>
          <div class="print-info-box">
            <div class="print-info-label">🚚 Entregador</div>
            <div class="print-info-val">${p.entregador || '—'}</div>
          </div>
        </div>

        <!-- Flags -->
        <div class="print-flags">
          <span class="print-flag ${p.nota ? 'yes' : 'no'}">
            📄 Nota Fiscal: ${p.nota ? 'SIM' : 'NÃO'}
          </span>
          <span class="print-flag ${p.compra ? 'warn' : 'no'}">
            🛒 Compra Insumo: ${p.compra ? (p.compraDetail || 'SIM') : 'NÃO'}
          </span>
        </div>

        <!-- Tabela de itens -->
        <table class="print-table">
          <tr>
            <th>Item</th>
            <th>Qtd</th>
            <th>Unid.</th>
            <th>Vl. Unit.</th>
            <th>Total</th>
          </tr>
          ${itensRows}
          <tr class="total-row">
            <td colspan="4" style="text-align:right;">TOTAL DO PEDIDO</td>
            <td>${App.fmtMoeda(p.total)}</td>
          </tr>
        </table>

        <!-- Descartáveis -->
        ${descHtml}

        <!-- Observações -->
        ${obsHtml}

        <!-- Assinaturas -->
        <div class="print-sign">
          <div class="print-sign-box">
            <div class="print-sign-label">Responsável pela Produção</div>
          </div>
          <div class="print-sign-box">
            <div class="print-sign-label">Conferência Final</div>
          </div>
        </div>

        <!-- Rodapé -->
        <div class="print-footer">
          Padaria Pão de Mel • 25 Anos de Tradição •
          Gerado em ${agora.toLocaleDateString('pt-BR')}
        </div>

      </div>
    `;

    // Fecha o modal e imprime
    App.closeModal('modal-detail');
    document.getElementById('print-area').style.display = 'block';

    setTimeout(() => {
      window.print();
      document.getElementById('print-area').style.display = 'none';
    }, 300);
  }

  // ── Exposição pública ──────────────────────────────────────

  return { comanda };

})();
