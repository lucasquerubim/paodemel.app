/**
 * pedidos.js — Módulo de Pedidos
 * Padaria Pão de Mel
 *
 * Criar, editar, listar, alterar status e detalhar pedidos.
 */

const Pedidos = (() => {

  const DESCARTAVEIS = [
    { key: 'copo',        label: '🥤 Copo'       },
    { key: 'prato',       label: '🍽️ Prato'      },
    { key: 'colher',      label: '🥄 Colher'      },
    { key: 'garfo',       label: '🍴 Garfo'       },
    { key: 'guardanapo',  label: '🧻 Guardanapo'  },
    { key: 'outros',      label: '✏️ Outros'      },
  ];

  let _editingId    = null;
  let _currentTipo  = 'festa';
  let _currentFilter = 'todos';
  let _descOpen     = false;

  // ── Listar pedidos ─────────────────────────────────────────

  function render() {
    const search = (document.getElementById('search-pedidos')?.value || '').toLowerCase();

    let pedidos = Storage.getPedidos().filter(p => {
      if (search && !p.cliente.toLowerCase().includes(search)) return false;
      if (_currentFilter === 'todos') return true;
      return p.status === parseInt(_currentFilter);
    }).sort((a, b) => (b.dtCriado || '').localeCompare(a.dtCriado || ''));

    const el = document.getElementById('pedidos-list');

    if (!pedidos.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>Nenhum pedido encontrado</p>
        </div>`;
      return;
    }

    el.innerHTML = pedidos.map(p => `
      <div class="pedido-card" onclick="Pedidos.openDetail('${p.id}')">
        <div class="pedido-card-top">
          <div>
            <div class="pedido-card-name">${p.cliente}</div>
          </div>
          <div>
            <div class="pedido-card-total">${App.fmtMoeda(p.total)}</div>
            <div class="pedido-card-date">Entrega ${App.fmtDateBR(p.dtEntrega)}</div>
          </div>
        </div>
        <div class="pedido-card-pills">
          <span class="status-pill st-${p.status}">
            ${App.STATUS_ICONS[p.status]} ${App.STATUS_LABELS[p.status]}
          </span>
          <span class="type-pill">${App.TIPO_LABELS[p.tipo] || p.tipo}</span>
        </div>
        <div class="pedido-card-meta">
          ${p.entregador ? `<span>🚚 ${p.entregador}</span>` : ''}
          ${p.respProd   ? `<span>👨‍🍳 ${p.respProd}</span>`  : ''}
          ${p.nota       ? '<span>📄 Nota</span>'            : ''}
          ${p.compra     ? '<span>🛒 Compra</span>'          : ''}
        </div>
      </div>
    `).join('');
  }

  function setFilter(f, btn) {
    _currentFilter = f;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    render();
  }

  // ── Abrir detalhe ──────────────────────────────────────────

  function openDetail(id) {
    const p = Storage.getPedidos().find(x => x.id === id);
    if (!p) return;

    const isAdmin = Auth.isAdmin();

    // Botões de status (só admin)
    const statusBtns = isAdmin
      ? App.STATUS_LABELS.map((l, i) => `
          <button
            class="toggle-btn ${p.status === i ? 'active' : ''}"
            onclick="Pedidos.changeStatus('${id}', ${i})">
            ${App.STATUS_ICONS[i]} ${l}
          </button>`).join('')
      : '';

    // Linhas dos itens
    const itensRows = (p.itens || []).map(it => `
      <tr>
        <td>${it.nome}</td>
        <td>${it.qtd} ${it.unid || ''}</td>
        <td>${App.fmtMoeda(it.valorUnit)}</td>
        <td style="font-weight:800;">${App.fmtMoeda(it.total)}</td>
      </tr>`).join('');

    // Descartáveis
    const descRows = (p.descartaveis || [])
      .filter(d => d.qtd > 0)
      .map(d => `
        <div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:4px 0;border-bottom:1px solid var(--border)">
          <span>${d.label}</span>
          <span style="font-weight:800;">${d.qtd} un</span>
        </div>`).join('');

    document.getElementById('detail-content').innerHTML = `
      <div class="order-detail-header">
        <div class="order-detail-client">${p.cliente}</div>
        <div class="order-detail-sub">
          ${App.TIPO_LABELS[p.tipo] || p.tipo} • Criado em ${App.fmtDateBR(p.dtCriado)}
        </div>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">
        <span class="status-pill st-${p.status}">
          ${App.STATUS_ICONS[p.status]} ${App.STATUS_LABELS[p.status]}
        </span>
      </div>

      ${isAdmin ? `
        <div class="form-group" style="margin-bottom:14px;">
          <div class="form-label">Mudar Status</div>
          <div class="toggle-group" style="flex-wrap:wrap;">${statusBtns}</div>
        </div>` : ''}

      <div class="detail-row">
        <span class="detail-label">📦 Produção</span>
        <span class="detail-val">${App.fmtDateTimeBR(p.dtProd, p.hrProd)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🚚 Entrega</span>
        <span class="detail-val">${App.fmtDateTimeBR(p.dtEntrega, p.hrEntrega)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">👨‍🍳 Resp. Produção</span>
        <span class="detail-val">${p.respProd || '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🚚 Entregador</span>
        <span class="detail-val">${p.entregador || '—'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📄 Nota Fiscal</span>
        <span class="detail-val">${p.nota ? '✅ Sim' : '❌ Não'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🛒 Compra Insumo</span>
        <span class="detail-val">${p.compra ? (p.compraDetail || 'Sim') : 'Não'}</span>
      </div>

      <div style="height:1px;background:var(--border);margin:12px 0;"></div>

      <div style="font-weight:800;font-size:0.85rem;margin-bottom:8px;color:var(--primary);">🛍️ Itens</div>
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
        <tr style="background:var(--cream);">
          <th style="padding:6px;text-align:left;color:var(--muted);font-weight:700;">Item</th>
          <th style="padding:6px;text-align:left;color:var(--muted);font-weight:700;">Qtd</th>
          <th style="padding:6px;color:var(--muted);font-weight:700;">Unit</th>
          <th style="padding:6px;color:var(--muted);font-weight:700;">Total</th>
        </tr>
        ${itensRows}
        <tr>
          <td colspan="3" style="padding:6px;font-weight:800;text-align:right;">TOTAL</td>
          <td style="padding:6px;font-weight:800;color:var(--primary);">${App.fmtMoeda(p.total)}</td>
        </tr>
      </table>

      ${descRows ? `
        <div style="margin-top:10px;">
          <div style="font-weight:800;font-size:0.85rem;margin-bottom:6px;color:var(--accent-dark);">🥤 Descartáveis</div>
          ${descRows}
        </div>` : ''}

      ${p.obs ? `
        <div style="margin-top:10px;background:var(--cream);border-radius:8px;padding:10px;font-size:0.85rem;">
          <span style="font-weight:800;">📝 Obs:</span> ${p.obs}
        </div>` : ''}

      <div class="total-row-display" style="margin-top:12px;">
        <span class="total-label">Total do Pedido</span>
        <span class="total-val">${App.fmtMoeda(p.total)}</span>
      </div>

      ${isAdmin ? `
        <div class="btn-group">
          <button class="btn btn-outline btn-sm" style="flex:1;" onclick="Pedidos.openEdit('${id}')">✏️ Editar</button>
          <button class="btn btn-accent btn-sm" style="flex:1;" onclick="Print.comanda('${id}')">🖨️ Imprimir</button>
          <button class="btn btn-danger btn-sm" onclick="Pedidos.remove('${id}')">🗑️</button>
        </div>` : `
        <div class="btn-group">
          <button class="btn btn-outline btn-block" onclick="Print.comanda('${id}')">🖨️ Imprimir Comanda</button>
        </div>`}

      <button class="btn btn-outline btn-block" style="margin-top:8px;" onclick="App.closeModal('modal-detail')">Fechar</button>
    `;

    App.openModal('modal-detail');
  }

  function changeStatus(id, newStatus) {
    if (!Auth.isAdmin()) { App.toast('❌ Apenas Lucas pode alterar o status'); return; }

    const pedidos = Storage.getPedidos();
    const idx = pedidos.findIndex(p => p.id === id);
    if (idx < 0) return;

    pedidos[idx].status = newStatus;
    Storage.savePedidos(pedidos);
    App.toast('✅ Status: ' + App.STATUS_LABELS[newStatus]);

    // Re-renderiza o detalhe com novo status
    openDetail(id);
    Dashboard.render();
    render();
  }

  function remove(id) {
    if (!confirm('Excluir este pedido?')) return;
    Storage.savePedidos(Storage.getPedidos().filter(p => p.id !== id));
    App.closeModal('modal-detail');
    Dashboard.render();
    render();
    App.toast('🗑️ Pedido excluído');
  }

  // ── Formulário: Novo / Editar ──────────────────────────────

  function openNew() {
    if (!Auth.isAdmin()) { App.toast('❌ Apenas Lucas pode criar pedidos'); return; }
    _editingId = null;
    document.getElementById('modal-order-title').textContent = '🧾 Novo Pedido';
    _clearForm();
    App.openModal('modal-order');
  }

  function openEdit(id) {
    App.closeModal('modal-detail');
    const p = Storage.getPedidos().find(x => x.id === id);
    if (!p) return;

    _editingId = id;
    document.getElementById('modal-order-title').textContent = '✏️ Editar Pedido';

    // Preenche campos
    document.getElementById('o-cliente').value      = p.cliente;
    document.getElementById('o-telefone').value     = p.telefone || '';
    document.getElementById('o-dt-prod').value      = p.dtProd || '';
    document.getElementById('o-hr-prod').value      = p.hrProd || '';
    document.getElementById('o-dt-entrega').value   = p.dtEntrega || '';
    document.getElementById('o-hr-entrega').value   = p.hrEntrega || '';
    document.getElementById('o-resp-prod').value    = p.respProd || '';
    document.getElementById('o-entregador').value   = p.entregador || '';
    document.getElementById('o-obs').value          = p.obs || '';
    document.getElementById('o-nota').checked       = p.nota || false;
    document.getElementById('o-compra').checked     = p.compra || false;
    document.getElementById('o-compra-detail').value = p.compraDetail || '';
    document.getElementById('compra-detail-group').style.display = p.compra ? 'flex' : 'none';

    // Tipo
    _currentTipo = p.tipo || 'festa';
    document.querySelectorAll('#tipo-group .toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tipo === _currentTipo);
    });

    // Itens
    document.getElementById('items-table').innerHTML = '';
    (p.itens || []).forEach(it => addItemRow(it));

    // Descartáveis
    initDescGrid();
    (p.descartaveis || []).forEach(d => {
      if (d.qtd > 0) {
        const chk = document.getElementById('desc-chk-' + d.key);
        const inp = document.getElementById('desc-qty-' + d.key);
        if (chk && inp) {
          chk.checked  = true;
          inp.value    = d.qtd;
          inp.disabled = false;
        }
      }
    });

    const hasDesc = (p.descartaveis || []).some(d => d.qtd > 0);
    if (hasDesc) {
      _descOpen = true;
      document.getElementById('desc-section').style.display = '';
      document.getElementById('desc-arrow').textContent = '▾';
    }

    calcTotal();
    App.openModal('modal-order');
  }

  function _clearForm() {
    ['o-cliente','o-telefone','o-dt-prod','o-hr-prod','o-dt-entrega',
     'o-hr-entrega','o-resp-prod','o-entregador','o-obs','o-compra-detail']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    document.getElementById('o-nota').checked   = false;
    document.getElementById('o-compra').checked = false;
    document.getElementById('compra-detail-group').style.display = 'none';

    // Tipo padrão
    _currentTipo = 'festa';
    document.querySelectorAll('#tipo-group .toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tipo === 'festa');
    });

    // Itens
    document.getElementById('items-table').innerHTML = '';
    addItemRow();
    addItemRow();

    // Descartáveis
    _descOpen = false;
    document.getElementById('desc-section').style.display = 'none';
    document.getElementById('desc-arrow').textContent = '▸';
    initDescGrid();

    // Datas padrão = hoje
    const hoje = App.today();
    document.getElementById('o-dt-prod').value    = hoje;
    document.getElementById('o-dt-entrega').value = hoje;

    calcTotal();
  }

  function setTipo(tipo, btn) {
    _currentTipo = tipo;
    document.querySelectorAll('#tipo-group .toggle-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  // ── Itens ──────────────────────────────────────────────────

  function addItemRow(it = null) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <input type="text"   placeholder="Item"   value="${it?.nome      || ''}" oninput="Pedidos.calcTotal()" />
      <input type="number" placeholder="Qtd"    value="${it?.qtd       || ''}" min="0" step="0.1" oninput="Pedidos.calcTotal()" />
      <input type="text"   placeholder="un/kg"  value="${it?.unid      || ''}" />
      <input type="number" placeholder="0,00"   value="${it?.valorUnit || ''}" min="0" step="0.01" oninput="Pedidos.calcTotal()" />
      <button class="del-btn" onclick="this.parentElement.remove(); Pedidos.calcTotal()">✕</button>
    `;
    document.getElementById('items-table').appendChild(row);
    calcTotal();
  }

  function calcTotal() {
    let total = 0;
    document.querySelectorAll('#items-table .item-row').forEach(row => {
      const inputs = row.querySelectorAll('input');
      const qtd = App.parseNum(inputs[1].value);
      const val = App.parseNum(inputs[3].value);
      total += qtd * val;
    });
    document.getElementById('order-total').textContent = App.fmtMoeda(total);
  }

  function _getItems() {
    return Array.from(document.querySelectorAll('#items-table .item-row'))
      .map(row => {
        const inputs = row.querySelectorAll('input');
        const nome      = inputs[0].value.trim();
        const qtd       = App.parseNum(inputs[1].value);
        const unid      = inputs[2].value.trim();
        const valorUnit = App.parseNum(inputs[3].value);
        if (!nome && !qtd) return null;
        return { nome, qtd, unid, valorUnit, total: qtd * valorUnit };
      })
      .filter(Boolean);
  }

  // ── Descartáveis ───────────────────────────────────────────

  function initDescGrid() {
    const grid = document.getElementById('desc-grid');
    grid.innerHTML = DESCARTAVEIS.map(d => `
      <div class="desc-item">
        <label>
          <input type="checkbox" id="desc-chk-${d.key}" onchange="Pedidos.toggleDescItem('${d.key}')" />
          ${d.label}
        </label>
        <input type="number" id="desc-qty-${d.key}" value="" min="1" placeholder="0" disabled />
      </div>
    `).join('');
  }

  function toggleDescartaveis() {
    _descOpen = !_descOpen;
    document.getElementById('desc-section').style.display = _descOpen ? '' : 'none';
    document.getElementById('desc-arrow').textContent = _descOpen ? '▾' : '▸';
  }

  function toggleDescItem(key) {
    const chk = document.getElementById('desc-chk-' + key);
    const inp = document.getElementById('desc-qty-' + key);
    inp.disabled = !chk.checked;
    if (chk.checked) { inp.value = '1'; inp.focus(); }
    else inp.value = '';
  }

  function _getDescartaveis() {
    return DESCARTAVEIS.map(d => {
      const chk = document.getElementById('desc-chk-' + d.key);
      const inp = document.getElementById('desc-qty-' + d.key);
      return {
        key:   d.key,
        label: d.label,
        qtd:   chk?.checked ? App.parseNum(inp?.value) : 0
      };
    });
  }

  function toggleCompraDetail() {
    const chk = document.getElementById('o-compra');
    document.getElementById('compra-detail-group').style.display = chk.checked ? 'flex' : 'none';
  }

  // ── Salvar ─────────────────────────────────────────────────

  function save() {
    const cliente = document.getElementById('o-cliente').value.trim();
    if (!cliente) { App.toast('❌ Informe o nome do cliente'); return; }

    const itens = _getItems();
    if (!itens.length) { App.toast('❌ Adicione pelo menos 1 item'); return; }

    const total        = itens.reduce((s, i) => s + i.total, 0);
    const descartaveis = _getDescartaveis();
    const pedidos      = Storage.getPedidos();

    const order = {
      id:           _editingId || App.uid(),
      cliente,
      telefone:     document.getElementById('o-telefone').value,
      tipo:         _currentTipo,
      dtProd:       document.getElementById('o-dt-prod').value,
      hrProd:       document.getElementById('o-hr-prod').value,
      dtEntrega:    document.getElementById('o-dt-entrega').value,
      hrEntrega:    document.getElementById('o-hr-entrega').value,
      respProd:     document.getElementById('o-resp-prod').value,
      entregador:   document.getElementById('o-entregador').value,
      itens,
      descartaveis,
      total,
      nota:         document.getElementById('o-nota').checked,
      compra:       document.getElementById('o-compra').checked,
      compraDetail: document.getElementById('o-compra-detail').value,
      obs:          document.getElementById('o-obs').value,
      status:       _editingId
        ? (pedidos.find(p => p.id === _editingId)?.status || 0)
        : 0,
      dtCriado:     _editingId
        ? (pedidos.find(p => p.id === _editingId)?.dtCriado || App.today())
        : App.today(),
      criadoPor: Auth.getUserName(),
    };

    if (_editingId) {
      const idx = pedidos.findIndex(p => p.id === _editingId);
      pedidos[idx] = order;
    } else {
      pedidos.unshift(order);
      Clientes.autoSave(cliente, document.getElementById('o-telefone').value, _currentTipo);
    }

    Storage.savePedidos(pedidos);
    App.closeModal('modal-order');
    Dashboard.render();
    render();

    App.toast(_editingId ? '✅ Pedido atualizado!' : '✅ Pedido salvo!');
  }

  // ── Exposição pública ──────────────────────────────────────

  return {
    render,
    setFilter,
    openDetail,
    openNew,
    openEdit,
    changeStatus,
    remove,
    addItemRow,
    calcTotal,
    initDescGrid,
    toggleDescartaveis,
    toggleDescItem,
    toggleCompraDetail,
    setTipo,
    save,
    DESCARTAVEIS,
  };

})();
