/**
 * app.js — Núcleo do aplicativo
 * Padaria Pão de Mel
 */

const App = (() => {

  const STATUS_LABELS = [
    'Aguardando',
    'Compra Pendente',
    'Em Produção',
    'Separação',
    'Assando/Fritando',
    'Pronto',
    'Saiu p/ Entrega',
    'Entregue'
  ];

  const STATUS_ICONS = ['⏳','🛒','👨‍🍳','📦','🔥','✅','🚚','🎉'];

  const TIPO_LABELS = {
    festa:      '🎉 Festa/Kit',
    delivery:   '🚚 Delivery',
    retirada:   '🏪 Retirada',
    fidelizado: '⭐ Fidelizado'
  };

  const EMAILS = [
    'lucasantonioquerubim@gmail.com',
    'marcospaodemel@gmail.com',
    'taniasspessoa@gmail.com',
    'thaisgaldino2025@gmail.com'
  ];

  // ── Toast ──────────────────────────────────────────────────
  let _toastTimer = null;
  function toast(msg, duration = 2800) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  // ── Utilitários ────────────────────────────────────────────
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function fmtMoeda(v) { return 'R$ ' + parseFloat(v || 0).toFixed(2).replace('.', ','); }

  function fmtDateInput(d) { return d.toISOString().slice(0, 10); }

  function fmtDateBR(s) {
    if (!s) return '—';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }

  function fmtDateTimeBR(dateStr, timeStr) {
    const d = fmtDateBR(dateStr);
    return timeStr ? `${d} às ${timeStr}` : d;
  }

  function parseNum(s) { return parseFloat((s || '0').toString().replace(',', '.')) || 0; }

  function initials(name) {
    return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  function today() { return fmtDateInput(new Date()); }

  // ── Modais ─────────────────────────────────────────────────
  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  function _initModalClose() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('open');
      });
    });
  }

  // ── Navegação ──────────────────────────────────────────────
  function goTo(page, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (btn) {
      btn.classList.add('active');
    } else {
      const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
      if (navBtn) navBtn.classList.add('active');
    }

    const renders = {
      dash:       () => Dashboard.render(),
      pedidos:    () => Pedidos.render(),
      clientes:   () => Clientes.render(),
      relatorios: () => Relatorios.render(),
      alertas:    () => Alertas.render(),
    };
    if (renders[page]) renders[page]();
  }

  // ── Init ───────────────────────────────────────────────────
  function init() {
    const t = today();
    document.getElementById('rel-from').value = t.slice(0, 7) + '-01';
    document.getElementById('rel-to').value = t;
    document.getElementById('dash-date').textContent =
      new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    _initModalClose();
    Dashboard.render();
    Pedidos.initDescGrid();
    Clientes.populateDatalist();

    if ('Notification' in window && Notification.permission === 'default') {
      document.addEventListener('click', () => Notification.requestPermission(), { once: true });
    }

    Alertas.check();
    setInterval(() => Alertas.check(), 60000);
  }

  return {
    STATUS_LABELS, STATUS_ICONS, TIPO_LABELS, EMAILS,
    toast, uid, fmtMoeda, fmtDateInput, fmtDateBR, fmtDateTimeBR,
    parseNum, initials, today,
    openModal, closeModal, goTo, init,
  };

})();


// ── Dashboard ───────────────────────────────────────────────
const Dashboard = (() => {

  function render() {
    const pedidos = Storage.getPedidos();
    const hoje    = App.today();

    const todayOrders = pedidos.filter(p => p.dtEntrega === hoje || p.dtCriado === hoje);
    const upcoming = pedidos
      .filter(p => p.dtEntrega > hoje && p.status < 7)
      .sort((a, b) => a.dtEntrega.localeCompare(b.dtEntrega))
      .slice(0, 5);

    const emProducao   = pedidos.filter(p => p.status >= 1 && p.status <= 4).length;
    const paraEntregar = pedidos.filter(p => p.status === 5 || p.status === 6).length;
    const fatHoje      = todayOrders.reduce((s, p) => s + (p.total || 0), 0);

    document.getElementById('stat-hoje').textContent     = todayOrders.length;
    document.getElementById('stat-fat').textContent      = 'R$' + fatHoje.toFixed(0);
    document.getElementById('stat-producao').textContent = emProducao;
    document.getElementById('stat-entrega').textContent  = paraEntregar;

    const active = pedidos.filter(p => p.status < 7).length;
    const nb = document.getElementById('nav-badge');
    nb.style.display = active > 0 ? 'flex' : 'none';
    nb.textContent   = active;

    _renderMiniList('today-list', todayOrders.slice(0, 8));
    _renderMiniList('upcoming-list', upcoming);
  }

  function _renderMiniList(elId, orders) {
    const el = document.getElementById(elId);
    if (!orders.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>Nenhum pedido</p></div>`;
      return;
    }
    el.innerHTML = orders.map(p => `
      <div class="order-mini" onclick="Pedidos.openDetail('${p.id}')">
        <div style="font-size:1.3rem">${App.STATUS_ICONS[p.status]}</div>
        <div class="order-mini-info">
          <div class="order-mini-client">${p.cliente}</div>
          <div class="order-mini-detail">
            ${App.TIPO_LABELS[p.tipo] || p.tipo} •
            Entrega ${App.fmtDateBR(p.dtEntrega)} ${p.hrEntrega || ''}
          </div>
        </div>
        <div class="order-mini-val">${App.fmtMoeda(p.total)}</div>
      </div>
    `).join('');
  }

  return { render };
})();
