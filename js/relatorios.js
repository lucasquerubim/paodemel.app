/**
 * relatorios.js — Módulo de Relatórios
 * Padaria Pão de Mel
 */

const Relatorios = (() => {

  function render() {
    const from = document.getElementById('rel-from').value;
    const to   = document.getElementById('rel-to').value;

    const pedidos = Storage.getPedidos().filter(p => {
      const d = p.dtEntrega || p.dtCriado;
      return (!from || d >= from) && (!to || d <= to);
    });

    _renderStats(pedidos);
    _renderProdutos(pedidos);
    _renderEntregadores(pedidos);
    _renderTipos(pedidos);
  }

  function _renderStats(pedidos) {
    const total      = pedidos.reduce((s, p) => s + (p.total || 0), 0);
    const entregues  = pedidos.filter(p => p.status === 7).length;
    const ticketMedio = pedidos.length ? total / pedidos.length : 0;

    document.getElementById('rel-stats').innerHTML = `
      <div class="report-stat">
        <div class="report-stat-icon" style="background:var(--accent-light);">💰</div>
        <div class="report-stat-info">
          <div class="report-stat-val">${App.fmtMoeda(total)}</div>
          <div class="report-stat-label">Faturamento no Período</div>
        </div>
      </div>
      <div class="report-stat">
        <div class="report-stat-icon" style="background:#d1fae5;">📋</div>
        <div class="report-stat-info">
          <div class="report-stat-val">${pedidos.length}</div>
          <div class="report-stat-label">Total de Pedidos</div>
        </div>
      </div>
      <div class="report-stat">
        <div class="report-stat-icon" style="background:#dcfce7;">✅</div>
        <div class="report-stat-info">
          <div class="report-stat-val">${entregues}</div>
          <div class="report-stat-label">Pedidos Entregues</div>
        </div>
      </div>
      <div class="report-stat">
        <div class="report-stat-icon" style="background:#ede9fe;">💵</div>
        <div class="report-stat-info">
          <div class="report-stat-val">${App.fmtMoeda(ticketMedio)}</div>
          <div class="report-stat-label">Ticket Médio</div>
        </div>
      </div>
    `;
  }

  function _renderProdutos(pedidos) {
    const map = {};
    pedidos.forEach(p => {
      (p.itens || []).forEach(it => {
        map[it.nome] = (map[it.nome] || 0) + it.qtd;
      });
    });

    const sorted = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    document.getElementById('rel-products').innerHTML = sorted.length
      ? sorted.map(([nome, qtd], i) => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
            <span style="font-weight:800;color:var(--primary);width:20px;font-size:0.85rem;">${i + 1}</span>
            <span style="flex:1;font-size:0.88rem;font-weight:600;">${nome}</span>
            <span style="font-weight:800;color:var(--muted);font-size:0.82rem;">${qtd}x</span>
          </div>`).join('')
      : '<div class="empty-state"><p>Sem dados no período</p></div>';
  }

  function _renderEntregadores(pedidos) {
    const map = {};
    pedidos.forEach(p => {
      if (p.entregador) {
        if (!map[p.entregador]) map[p.entregador] = { count: 0, total: 0 };
        map[p.entregador].count++;
        map[p.entregador].total += p.total || 0;
      }
    });

    const sorted = Object.entries(map).sort((a, b) => b[1].count - a[1].count);

    document.getElementById('rel-entregador').innerHTML = sorted.length
      ? sorted.map(([nome, v]) => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
            <span style="font-size:0.88rem;font-weight:600;">🚚 ${nome}</span>
            <span style="font-weight:800;font-size:0.82rem;">
              ${v.count} pedido(s) • ${App.fmtMoeda(v.total)}
            </span>
          </div>`).join('')
      : '<div class="empty-state"><p>Sem dados no período</p></div>';
  }

  function _renderTipos(pedidos) {
    const map = {};
    pedidos.forEach(p => {
      if (!map[p.tipo]) map[p.tipo] = { count: 0, total: 0 };
      map[p.tipo].count++;
      map[p.tipo].total += p.total || 0;
    });

    document.getElementById('rel-tipo').innerHTML = Object.entries(map).length
      ? Object.entries(map).map(([tipo, v]) => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
            <span style="font-size:0.88rem;font-weight:600;">${App.TIPO_LABELS[tipo] || tipo}</span>
            <span style="font-weight:800;font-size:0.82rem;">
              ${v.count} pedido(s) • ${App.fmtMoeda(v.total)}
            </span>
          </div>`).join('')
      : '<div class="empty-state"><p>Sem dados no período</p></div>';
  }

  return { render };

})();
