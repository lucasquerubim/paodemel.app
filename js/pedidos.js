/**
 * pedidos.js — Módulo de Pedidos
 * Padaria Pão de Mel
 */

const Pedidos = (() => {

  const DESCARTAVEIS = [
    { key: 'copo',        label: '🥤 Copo'        },
    { key: 'prato',       label: '🍽️ Prato'       },
    { key: 'colher',      label: '🥄 Colher'      },
    { key: 'garfo',       label: '🍴 Garfo'       },
    { key: 'guardanapo',  label: '🧻 Guardanapo'  },
  ];

  let _editingId     = null;
  let _currentTipo   = 'festa';
  let _currentForma  = 'retirada';
  let _currentFilter = 'todos';
  let _descOpen      = false;

  // ── Listar ─────────────────────────────────────────────────
  function render() {
    const search = (document.getElementById('search-pedidos')?.value || '').toLowerCase();

    let pedidos = Storage.getPedidos().filter(p => {
      if (search && !p.cliente.toLowerCase().includes(search)) return false;
      if (_currentFilter === 'todos') return true;
      return p.status === parseInt(_currentFilter);
    }).sort((a, b) => (b.dtCriado || '').localeCompare(a.dtCriado || ''));

    const el = document.getElementById('pedidos-list');

    if (!pedidos.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>Nenhum pedido encontrado</p></div>`;
      return;
    }

    el.innerHTML = pedidos.map(p => `
      <div class="pedido-card" onclick="Pedidos.openDetail('${p.id}')">
        <div class="pedido-card-top">
          <div><div class="pedido-card-name">${p.cliente}</div></div>
          <div>
            <div class="pedido-card-total">${App.fmtMoeda(p.total)}</div>
            <div class="pedido-card-date">Entrega ${App.fmtDateBR(p.dtEntrega)}</div>
          </div>
        </div>
        <div class="pedido-card-pills">
          <span class="status-pill st-${p.status}">${App.STATUS_ICONS[p.status]} ${App.STATUS_LABELS[p.status]}</span>
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

  // ── DETALHE (LAYOUT LIMPO E HIERÁRQUICO) ───────────────────
  function openDetail(id) {
    const p = Storage.getPedidos().find(x => x.id === id);
    if (!p) return;

    const statusBtns = App.STATUS_LABELS.map((l, i) => `
      <button class="toggle-btn ${p.status === i ? 'active' : ''}"
              onclick="Pedidos.changeStatus('${id}', ${i})">
        ${App.STATUS_ICONS[i]} ${l}
      </button>`).join('');

    const itensRows = (p.itens || []).map(it => `
      <div class="detail-item-row">
        <div class="detail-item-main">
          <div class="detail-item-name">${it.nome}</div>
          ${it.obs ? `<div class="detail-item-obs">${it.obs}</div>` : ''}
        </div>
        <div class="detail-item-qty">${it.qtd} ${it.unid || ''}</div>
        <div class="detail-item-total">${App.fmtMoeda(it.total)}</div>
      </div>`).join('');

    const descAtivos = (p.descartaveis || []).filter(d => d.qtd > 0);
    const descBlocos = descAtivos.length
      ? descAtivos.map(d => `<span class="desc-chip">${d.label}: <strong>${d.qtd}</strong></span>`).join('')
      : '';
    const descOutrosTxt = p.descOutros
      ? `<div class="detail-obs-box" style="margin-top:8px;"><strong>✏️ Outros:</strong> ${p.descOutros}</div>`
      : '';

    const enderecoBlock = (p.formaEntrega === 'entrega' && p.endereco)
      ? `<div class="detail-block">
           <div class="detail-block-label">📍 Endereço de Entrega</div>
           <div class="detail-block-value">${p.endereco}</div>
         </div>`
      : '';

    document.getElementById('detail-content').innerHTML = `

      <!-- CABEÇALHO COM CLIENTE GRANDE -->
      <div class="detail-header-big">
        <div class="detail-tipo-tag">${App.TIPO_LABELS[p.tipo] || p.tipo}</div>
        <div class="detail-client-name">${p.cliente}</div>
        <div class="detail-client-tel">${p.telefone || ''}</div>
        <div class="detail-status-row">
          <span class="status-pill st-${p.status}">${App.STATUS_ICONS[p.status]} ${App.STATUS_LABELS[p.status]}</span>
        </div>
      </div>

      <!-- DATAS EM DESTAQUE -->
      <div class="detail-grid-2">
        <div class="detail-block">
          <div class="detail-block-label">📦 Produção</div>
          <div class="detail-block-value">${App.fmtDateTimeBR(p.dtProd, p.hrProd)}</div>
        </div>
        <div class="detail-block accent">
          <div class="detail-block-label">🚚 Entrega</div>
          <div class="detail-block-value">${App.fmtDateTimeBR(p.dtEntrega, p.hrEntrega)}</div>
        </div>
      </div>

      <!-- RESPONSÁVEIS -->
      <div class="detail-grid-2">
        <div class="detail-block">
          <div class="detail-block-label">👨‍🍳 Resp. Produção</div>
          <div class="detail-block-value">${p.respProd || '—'}</div>
        </div>
        <div class="detail-block">
          <div class="detail-block-label">${p.formaEntrega === 'entrega' ? '🚚 Entregador' : '🏪 Retirada'}</div>
          <div class="detail-block-value">${p.formaEntrega === 'entrega' ? (p.entregador || '—') : 'Cliente vem buscar'}</div>
        </div>
      </div>

      ${enderecoBlock}

      <!-- FLAGS -->
      <div class="detail-flags-row">
        <span class="flag-chip ${p.nota ? 'flag-yes' : 'flag-no'}">📄 Nota: ${p.nota ? 'SIM' : 'NÃO'}</span>
        <span class="flag-chip ${p.compra ? 'flag-warn' : 'flag-no'}">🛒 Compra: ${p.compra ? (p.compraDetail || 'SIM') : 'NÃO'}</span>
      </div>

      <!-- MUDAR STATUS -->
      <div class="detail-section">
        <div class="detail-section-title">🔄 Mudar Status</div>
        <div class="toggle-group" style="flex-wrap:wrap;">${statusBtns}</div>
      </div>

      <!-- ITENS -->
      <div class="detail-section">
        <div class="detail-section-title">🛍️ Itens (${(p.itens || []).length})</div>
        <div class="detail-items-list">${itensRows}</div>
      </div>

      <!-- DESCARTÁVEIS -->
      ${descBlocos || p.descOutros ? `
        <div class="detail-section">
          <div class="detail-section-title">🥤 Descartáveis</div>
          <div class="desc-chips-row">${descBlocos}</div>
          ${descOutrosTxt}
        </div>` : ''}

      <!-- OBSERVAÇÕES -->
      ${p.obs ? `
        <div class="detail-section">
          <div class="detail-section-title">📝 Observações</div>
          <div class="detail-obs-box">${p.obs}</div>
        </div>` : ''}

      <!-- TOTAL -->
      <div class="total-row-display">
        <span class="total-label">Total do Pedido</span>
        <span class="total-val">${App.fmtMoeda(p.total)}</span>
      </div>

      <!-- AÇÕES -->
      <div class="btn-group">
        <button class="btn btn-outline btn-sm" style="flex:1;" onclick="Pedidos.openEdit('${id}')">✏️ Editar</button>
        <button class="btn btn-accent btn-sm" style="flex:1;" onclick="Print.comanda('${id}')">🖨️ Imprimir</button>
        <button class="btn btn-danger btn-sm" onclick="Pedidos.remove('${id}')">🗑️</button>
      </div>

      <button class="btn btn-outline btn-block" style="margin-top:8px;" onclick="App.closeModal('modal-detail')">Fechar</button>
    `;

    App.openModal('modal-detail');
  }

  function changeStatus(id, newStatus) {
    const pedidos = Storage.getPedidos();
    const idx = pedidos.findIndex(p => p.id === id);
    if (idx < 0) return;
    pedidos[idx].status = newStatus;
    Storage.savePedidos(pedidos);
    App.toast('✅ Status: ' + App.STATUS_LABELS[newStatus]);
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

  // ── FORMULÁRIO ─────────────────────────────────────────────
  function openNew() {
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

    document.getElementById('o-cliente').value       = p.cliente;
    document.getElementById('o-telefone').value      = p.telefone || '';
    document.getElementById('o-dt-prod').value       = p.dtProd || '';
    document.getElementById('o-hr-prod').value       = p.hrProd || '';
    document.getElementById('o-dt-entrega').value    = p.dtEntrega || '';
    document.getElementById('o-hr-entrega').value    = p.hrEntrega || '';
    document.getElementById('o-resp-prod').value     = p.respProd || '';
    document.getElementById('o-entregador').value    = p.entregador || '';
    document.getElementById('o-obs').value           = p.obs || '';
    document.getElementById('o-nota').checked        = p.nota || false;
    document.getElementById('o-compra').checked      = p.compra || false;
    document.getElementById('o-compra-detail').value = p.compraDetail || '';
    document.getElementById('compra-detail-group').style.display = p.compra ? 'flex' : 'none';
    document.getElementById('o-endereco').value      = p.endereco || '';
    document.getElementById('o-desc-outros').value   = p.descOutros || '';

    // Tipo
    setTipo(p.tipo || 'festa');
    // Forma
    setForma(p.formaEntrega || 'retirada');

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

    const hasDesc = (p.descartaveis || []).some(d => d.qtd > 0) || p.descOutros;
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
     'o-hr-entrega','o-resp-prod','o-entregador','o-obs','o-compra-detail',
     'o-endereco','o-desc-outros']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

    document.getElementById('o-nota').checked   = false;
    document.getElementById('o-compra').checked = false;
    document.getElementById('compra-detail-group').style.display = 'none';
    document.getElementById('cliente-info').style.display = 'none';

    setTipo('festa');
    setForma('retirada');

    document.getElementById('items-table').innerHTML = '';
    addItemRow();
    addItemRow();

    _descOpen = false;
    document.getElementById('desc-section').style.display = 'none';
    document.getElementById('desc-arrow').textContent = '▸';
    initDescGrid();

    const hoje = App.today();
    document.getElementById('o-dt-prod').value    = hoje;
    document.getElementById('o-dt-entrega').value = hoje;

    calcTotal();
  }

  // ── Tipo do pedido ─────────────────────────────────────────
  function setTipo(tipo, btn) {
    _currentTipo = tipo;
    document.querySelectorAll('#tipo-group .toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tipo === tipo);
    });

    // Quando fidelizado: dica visual para selecionar cliente cadastrado
    const inputCliente = document.getElementById('o-cliente');
    if (tipo === 'fidelizado') {
      inputCliente.placeholder = 'Selecione um cliente cadastrado';
      // mostra clientes fidelizados no datalist
      const dl = document.getElementById('clientes-datalist');
      const fidelizados = Storage.getClientes().filter(c => c.tipo === 'fidelizado');
      if (fidelizados.length) {
        dl.innerHTML = fidelizados.map(c => `<option value="${c.nome}">`).join('');
      }
    } else {
      inputCliente.placeholder = 'Nome do cliente';
      Clientes.populateDatalist();
    }
  }

  // ── Forma de entrega ───────────────────────────────────────
  function setForma(forma, btn) {
    _currentForma = forma;
    document.querySelectorAll('#forma-group .toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.forma === forma);
    });
    document.getElementById('endereco-group').style.display = forma === 'entrega' ? 'flex' : 'none';
  }

  // ── Quando cliente é selecionado: preenche dados ───────────
  function onClienteChange() {
    const nome = document.getElementById('o-cliente').value.trim();
    const cliente = Storage.getClientes().find(c => c.nome.toLowerCase() === nome.toLowerCase());

    const infoBox = document.getElementById('cliente-info');

    if (cliente) {
      // Preenche telefone se vazio
      const telField = document.getElementById('o-telefone');
      if (!telField.value && cliente.telefone) telField.value = cliente.telefone;

      // Preenche endereço se vazio
      const endField = document.getElementById('o-endereco');
      if (!endField.value && cliente.endereco) endField.value = cliente.endereco;

      // Mostra info do cliente
      infoBox.style.display = 'block';
      infoBox.innerHTML = `
        <strong>${cliente.tipo === 'fidelizado' ? '⭐ Cliente Fidelizado' : '👤 Cliente Cadastrado'}</strong>
        ${cliente.telefone ? '<br>📞 ' + cliente.telefone : ''}
        ${cliente.endereco ? '<br>📍 ' + cliente.endereco : ''}
      `;
    } else {
      infoBox.style.display = 'none';
    }
  }

  // ── ITENS (CARDS GRANDES) ──────────────────────────────────
  function addItemRow(it = null) {
    const row = document.createElement('div');
    row.className = 'item-card';
    const rid = App.uid();
    row.innerHTML = `
      <div class="item-card-header">
        <span class="item-card-num">Item</span>
        <button class="del-btn" onclick="this.closest('.item-card').remove(); Pedidos.calcTotal()">✕</button>
      </div>
      <div class="form-group">
        <label class="form-label">Nome do item</label>
        <input type="text" class="form-input" data-field="nome" placeholder="Ex: Mini coxinha"
               value="${it?.nome || ''}" />
      </div>
      <div class="item-card-grid">
        <div class="form-group">
          <label class="form-label">Quantidade</label>
          <input type="number" class="form-input" data-field="qtd" placeholder="0" min="0" step="0.1"
                 value="${it?.qtd || ''}" oninput="Pedidos.calcTotal()" />
        </div>
        <div class="form-group">
          <label class="form-label">Unidade</label>
          <input type="text" class="form-input" data-field="unid" placeholder="un / kg / pct"
                 value="${it?.unid || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Valor Unit. (R$)</label>
          <input type="number" class="form-input" data-field="valorUnit" placeholder="0,00" min="0" step="0.01"
                 value="${it?.valorUnit || ''}" oninput="Pedidos.calcTotal()" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Observações do item (opcional)</label>
        <input type="text" class="form-input" data-field="obs" placeholder="Ex: sem cebola, recheio especial..."
               value="${it?.obs || ''}" />
      </div>
    `;
    document.getElementById('items-table').appendChild(row);
    _updateItemNumbers();
    calcTotal();
  }

  function _updateItemNumbers() {
    document.querySelectorAll('#items-table .item-card').forEach((card, i) => {
      const num = card.querySelector('.item-card-num');
      if (num) num.textContent = `Item ${i + 1}`;
    });
  }

  function calcTotal() {
    let total = 0;
    document.querySelectorAll('#items-table .item-card').forEach(card => {
      const qtd = App.parseNum(card.querySelector('[data-field="qtd"]').value);
      const val = App.parseNum(card.querySelector('[data-field="valorUnit"]').value);
      total += qtd * val;
    });
    document.getElementById('order-total').textContent = App.fmtMoeda(total);
    _updateItemNumbers();
  }

  function _getItems() {
    return Array.from(document.querySelectorAll('#items-table .item-card'))
      .map(card => {
        const nome      = card.querySelector('[data-field="nome"]').value.trim();
        const qtd       = App.parseNum(card.querySelector('[data-field="qtd"]').value);
        const unid      = card.querySelector('[data-field="unid"]').value.trim();
        const valorUnit = App.parseNum(card.querySelector('[data-field="valorUnit"]').value);
        const obs       = card.querySelector('[data-field="obs"]').value.trim();
        if (!nome && !qtd) return null;
        return { nome, qtd, unid, valorUnit, obs, total: qtd * valorUnit };
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

  // ── SALVAR ─────────────────────────────────────────────────
  function save() {
    const cliente = document.getElementById('o-cliente').value.trim();
    if (!cliente) { App.toast('❌ Informe o nome do cliente'); return; }

    const itens = _getItems();
    if (!itens.length) { App.toast('❌ Adicione pelo menos 1 item'); return; }

    const total        = itens.reduce((s, i) => s + i.total, 0);
    const descartaveis = _getDescartaveis();
    const descOutros   = document.getElementById('o-desc-outros').value.trim();
    const pedidos      = Storage.getPedidos();
    const endereco     = document.getElementById('o-endereco').value.trim();

    const order = {
      id:           _editingId || App.uid(),
      cliente,
      telefone:     document.getElementById('o-telefone').value,
      tipo:         _currentTipo,
      formaEntrega: _currentForma,
      endereco,
      dtProd:       document.getElementById('o-dt-prod').value,
      hrProd:       document.getElementById('o-hr-prod').value,
      dtEntrega:    document.getElementById('o-dt-entrega').value,
      hrEntrega:    document.getElementById('o-hr-entrega').value,
      respProd:     document.getElementById('o-resp-prod').value,
      entregador:   document.getElementById('o-entregador').value,
      itens,
      descartaveis,
      descOutros,
      total,
      nota:         document.getElementById('o-nota').checked,
      compra:       document.getElementById('o-compra').checked,
      compraDetail: document.getElementById('o-compra-detail').value,
      obs:          document.getElementById('o-obs').value,
      status:       _editingId ? (pedidos.find(p => p.id === _editingId)?.status || 0) : 0,
      dtCriado:     _editingId ? (pedidos.find(p => p.id === _editingId)?.dtCriado || App.today()) : App.today(),
      criadoPor:    Auth.getUserName(),
    };

    if (_editingId) {
      const idx = pedidos.findIndex(p => p.id === _editingId);
      pedidos[idx] = order;
    } else {
      pedidos.unshift(order);
      Clientes.autoSave(cliente, document.getElementById('o-telefone').value, endereco, _currentTipo);
    }

    Storage.savePedidos(pedidos);
    App.closeModal('modal-order');
    Dashboard.render();
    render();

    App.toast(_editingId ? '✅ Pedido atualizado!' : '✅ Pedido salvo!');
  }

  return {
    render, setFilter, openDetail, openNew, openEdit, changeStatus, remove,
    addItemRow, calcTotal, initDescGrid, toggleDescartaveis, toggleDescItem,
    toggleCompraDetail, setTipo, setForma, onClienteChange, save,
    DESCARTAVEIS,
  };

})();
