/**
 * clientes.js — Módulo de Clientes
 * Padaria Pão de Mel
 */

const Clientes = (() => {

  let _editingId = null;
  let _currentTipo = 'avulso';

  // ── Listar ─────────────────────────────────────────────────

  function render() {
    const search = (document.getElementById('search-clientes')?.value || '').toLowerCase();
    const clientes = Storage.getClientes()
      .filter(c => !search || c.nome.toLowerCase().includes(search));

    const el = document.getElementById('clientes-list');
    const isAdmin = Auth.isAdmin();

    let html = '';

    if (isAdmin) {
      html += `<button class="btn btn-accent btn-block" onclick="Clientes.openNew()">+ Novo Cliente</button>`;
    }

    if (!clientes.length) {
      el.innerHTML = html + `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <p>Nenhum cliente cadastrado</p>
        </div>`;
      return;
    }

    html += clientes.map(c => {
      const pedidos    = Storage.getPedidos().filter(p =>
        p.cliente.toLowerCase() === c.nome.toLowerCase()
      );
      const totalGasto = pedidos.reduce((s, p) => s + (p.total || 0), 0);

      return `
        <div class="client-card" onclick="Clientes.openDetail('${c.id}')">
          <div class="client-avatar">${App.initials(c.nome)}</div>
          <div class="client-info">
            <div class="client-name">${c.nome}</div>
            <div class="client-detail">
              ${c.telefone || 'Sem telefone'} •
              ${pedidos.length} pedido(s) •
              ${App.fmtMoeda(totalGasto)}
            </div>
          </div>
          <span class="client-badge">
            ${c.tipo === 'fidelizado' ? '⭐ Fidelizado' : 'Avulso'}
          </span>
        </div>`;
    }).join('');

    el.innerHTML = html;
  }

  // ── Detalhe ────────────────────────────────────────────────

  function openDetail(id) {
    const c = Storage.getClientes().find(x => x.id === id);
    if (!c) return;

    const pedidos = Storage.getPedidos()
      .filter(p => p.cliente.toLowerCase() === c.nome.toLowerCase())
      .sort((a, b) => (b.dtCriado || '').localeCompare(a.dtCriado || ''));

    const total    = pedidos.reduce((s, p) => s + (p.total || 0), 0);
    const isAdmin  = Auth.isAdmin();

    const hist = pedidos.slice(0, 20).map(p => `
      <div class="order-mini" onclick="App.closeModal('modal-client-detail'); Pedidos.openDetail('${p.id}')">
        <div style="font-size:1.1rem;">${App.STATUS_ICONS[p.status]}</div>
        <div class="order-mini-info">
          <div class="order-mini-client" style="font-size:0.85rem;">${App.TIPO_LABELS[p.tipo] || p.tipo}</div>
          <div class="order-mini-detail">${App.fmtDateBR(p.dtEntrega)}</div>
        </div>
        <div class="order-mini-val">${App.fmtMoeda(p.total)}</div>
      </div>`).join('');

    document.getElementById('client-detail-content').innerHTML = `
      <div class="fechamento-card">
        <div style="font-size:0.7rem;opacity:0.7;text-transform:uppercase;letter-spacing:0.08em;">
          ${c.tipo === 'fidelizado' ? '⭐ Cliente Fidelizado' : 'Cliente Avulso'}
        </div>
        <div class="order-detail-client">${c.nome}</div>
        <div style="font-size:0.8rem;opacity:0.75;margin-top:4px;">
          ${c.telefone || ''} ${c.email ? '• ' + c.email : ''}
        </div>
        <div class="fechamento-total">${App.fmtMoeda(total)}</div>
        <div style="font-size:0.72rem;opacity:0.7;">total em ${pedidos.length} pedido(s)</div>
      </div>

      ${isAdmin ? `
        <div class="btn-group" style="margin-bottom:10px;">
          <button class="btn btn-outline btn-sm" style="flex:1;" onclick="Clientes.openEdit('${id}')">✏️ Editar</button>
          <button class="btn btn-accent btn-sm" style="flex:1;" onclick="Clientes.fechamentoMensal('${id}')">📄 Fechamento</button>
        </div>` : ''}

      <div style="font-weight:800;font-size:0.85rem;color:var(--primary);margin-bottom:8px;">Histórico de Pedidos</div>
      ${hist || '<div class="empty-state"><p>Nenhum pedido</p></div>'}

      <button class="btn btn-outline btn-block" style="margin-top:10px;" onclick="App.closeModal('modal-client-detail')">Fechar</button>
    `;

    App.openModal('modal-client-detail');
  }

  // ── Novo / Editar ──────────────────────────────────────────

  function openNew() {
    _editingId   = null;
    _currentTipo = 'avulso';
    document.getElementById('modal-client-title').textContent = '👤 Novo Cliente';
    ['c-nome', 'c-tel', 'c-email'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.querySelectorAll('#ctipo-group .toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.ctipo === 'avulso');
    });
    App.openModal('modal-client');
  }

  function openEdit(id) {
    const c = Storage.getClientes().find(x => x.id === id);
    if (!c) return;

    _editingId   = id;
    _currentTipo = c.tipo || 'avulso';

    document.getElementById('modal-client-title').textContent = '✏️ Editar Cliente';
    document.getElementById('c-nome').value  = c.nome;
    document.getElementById('c-tel').value   = c.telefone || '';
    document.getElementById('c-email').value = c.email || '';

    document.querySelectorAll('#ctipo-group .toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.ctipo === _currentTipo);
    });

    App.closeModal('modal-client-detail');
    App.openModal('modal-client');
  }

  function setTipo(tipo, btn) {
    _currentTipo = tipo;
    document.querySelectorAll('#ctipo-group .toggle-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  function save() {
    const nome = document.getElementById('c-nome').value.trim();
    if (!nome) { App.toast('❌ Informe o nome'); return; }

    const clientes = Storage.getClientes();
    const c = {
      id:         _editingId || App.uid(),
      nome,
      telefone:   document.getElementById('c-tel').value,
      email:      document.getElementById('c-email').value,
      tipo:       _currentTipo,
      dtCadastro: _editingId
        ? (clientes.find(x => x.id === _editingId)?.dtCadastro || App.today())
        : App.today(),
    };

    if (_editingId) {
      const idx = clientes.findIndex(x => x.id === _editingId);
      clientes[idx] = c;
    } else {
      clientes.unshift(c);
    }

    Storage.saveClientes(clientes);
    App.closeModal('modal-client');
    render();
    populateDatalist();
    App.toast('✅ Cliente salvo!');
  }

  // Salva automaticamente quando um pedido é criado para um cliente novo
  function autoSave(nome, telefone, tipo) {
    const clientes = Storage.getClientes();
    const existe = clientes.find(c => c.nome.toLowerCase() === nome.toLowerCase());
    if (!existe) {
      clientes.push({
        id:         App.uid(),
        nome,
        telefone:   telefone || '',
        email:      '',
        tipo:       tipo === 'fidelizado' ? 'fidelizado' : 'avulso',
        dtCadastro: App.today(),
      });
      Storage.saveClientes(clientes);
      populateDatalist();
    }
  }

  // ── Datalist para autocomplete ─────────────────────────────

  function populateDatalist() {
    const dl = document.getElementById('clientes-datalist');
    if (!dl) return;
    dl.innerHTML = Storage.getClientes()
      .map(c => `<option value="${c.nome}">`)
      .join('');
  }

  // ── Fechamento Mensal ──────────────────────────────────────

  function fechamentoMensal(clienteId) {
    const c = Storage.getClientes().find(x => x.id === clienteId);
    if (!c) return;

    const now  = new Date();
    const mes  = now.getMonth();
    const ano  = now.getFullYear();

    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

    const pedidos = Storage.getPedidos().filter(p => {
      if (p.cliente.toLowerCase() !== c.nome.toLowerCase()) return false;
      const d = new Date(p.dtEntrega || p.dtCriado);
      return d.getMonth() === mes && d.getFullYear() === ano;
    });

    const total = pedidos.reduce((s, p) => s + (p.total || 0), 0);

    const rows = pedidos.map(p => `
      <tr>
        <td>${App.fmtDateBR(p.dtEntrega)}</td>
        <td>${App.TIPO_LABELS[p.tipo] || p.tipo}</td>
        <td>${(p.itens || []).map(i => i.nome).join(', ')}</td>
        <td style="font-weight:700;">${App.fmtMoeda(p.total)}</td>
      </tr>`).join('');

    document.getElementById('print-area').innerHTML = `
      <div class="print-page">
        <div class="print-header">
          <div>
            <div class="print-logo-name">🍞 Pão de Mel</div>
            <div class="print-logo-sub">Padaria • 25 Anos de Tradição</div>
          </div>
          <div class="print-header-right">
            Fechamento Mensal<br>
            <strong>${meses[mes]} / ${ano}</strong>
          </div>
        </div>

        <div class="print-client-block">
          <div class="print-client-label">
            ${c.tipo === 'fidelizado' ? '⭐ Cliente Fidelizado' : 'Cliente'}
          </div>
          <div class="print-client-name">${c.nome}</div>
          <div class="print-client-sub">${c.telefone || ''}</div>
        </div>

        <table class="print-table">
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Itens</th>
            <th>Total</th>
          </tr>
          ${rows}
          <tr class="total-row">
            <td colspan="3" style="text-align:right;">TOTAL DO MÊS</td>
            <td>${App.fmtMoeda(total)}</td>
          </tr>
        </table>

        <div class="print-footer">
          Padaria Pão de Mel • 25 Anos de Tradição •
          Gerado em ${new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>`;

    document.getElementById('print-area').style.display = 'block';
    setTimeout(() => {
      window.print();
      document.getElementById('print-area').style.display = 'none';
    }, 300);
  }

  // ── Exposição pública ──────────────────────────────────────

  return {
    render,
    openDetail,
    openNew,
    openEdit,
    setTipo,
    save,
    autoSave,
    populateDatalist,
    fechamentoMensal,
  };

})();
