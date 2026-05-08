/**
 * alertas.js — Módulo de Alertas e Lembretes
 * Padaria Pão de Mel
 */

const Alertas = (() => {

  const ICONS = {
    lembrete: '📌',
    producao: '👨‍🍳',
    entrega:  '🚚',
  };

  let _currentTipo = 'lembrete';

  // ── Listar ─────────────────────────────────────────────────

  function render() {
    const alertas = Storage.getAlertas()
      .sort((a, b) =>
        a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora)
      );

    const el      = document.getElementById('alertas-list');
    const isAdmin = Auth.isAdmin();

    if (!alertas.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔕</div>
          <p>Nenhum lembrete criado</p>
        </div>`;
      return;
    }

    el.innerHTML = alertas.map(a => `
      <div class="alert-card" style="${a.done ? 'opacity:0.5;' : ''}">
        <div class="alert-icon">${ICONS[a.tipo] || '📌'}</div>
        <div class="alert-info">
          <div class="alert-title">${a.titulo}</div>
          <div class="alert-time">${App.fmtDateBR(a.data)} às ${a.hora}</div>
        </div>
        ${isAdmin ? `
          <button class="alert-del" onclick="Alertas.remove('${a.id}')">🗑️</button>
        ` : ''}
      </div>`).join('');
  }

  // ── Modal: novo alerta ─────────────────────────────────────

  function openModal() {
    if (!Auth.isAdmin()) { App.toast('❌ Apenas Lucas pode criar alertas'); return; }

    _currentTipo = 'lembrete';
    document.getElementById('al-titulo').value = '';
    document.getElementById('al-data').value   = App.today();
    document.getElementById('al-hora').value   = '08:00';

    document.querySelectorAll('#altipo-group .toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.altipo === 'lembrete');
    });

    App.openModal('modal-alert');
  }

  function setTipo(tipo, btn) {
    _currentTipo = tipo;
    document.querySelectorAll('#altipo-group .toggle-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  function save() {
    const titulo = document.getElementById('al-titulo').value.trim();
    if (!titulo) { App.toast('❌ Informe o título'); return; }

    const data = document.getElementById('al-data').value;
    const hora = document.getElementById('al-hora').value;

    const alertas = Storage.getAlertas();
    alertas.push({
      id:    App.uid(),
      titulo,
      data,
      hora,
      tipo:  _currentTipo,
      done:  false,
    });

    Storage.saveAlertas(alertas);
    App.closeModal('modal-alert');
    render();
    _schedule(titulo, data, hora);
    App.toast('🔔 Lembrete salvo!');
  }

  function remove(id) {
    Storage.saveAlertas(Storage.getAlertas().filter(a => a.id !== id));
    render();
    App.toast('🗑️ Lembrete removido');
  }

  // ── Notificações ───────────────────────────────────────────

  // Verifica se algum alerta deve disparar agora (chamado a cada minuto)
  function check() {
    const now     = new Date();
    const alertas = Storage.getAlertas().filter(a => !a.done);

    const due = alertas.filter(a => {
      const dt   = new Date(a.data + 'T' + a.hora);
      const diff = now - dt;
      // Dispara se passou entre 0 e 2 minutos
      return diff >= 0 && diff < 2 * 60 * 1000;
    });

    if (due.length) {
      document.getElementById('alert-dot').style.display = 'block';
      due.forEach(a => {
        _notify('🍞 Pão de Mel — ' + a.titulo, a.titulo);
      });
    }
  }

  // Agenda uma notificação para o momento exato
  function _schedule(titulo, data, hora) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') Notification.requestPermission();

    const dt   = new Date(data + 'T' + hora);
    const diff = dt - new Date();

    if (diff > 0) {
      setTimeout(() => _notify('🍞 Pão de Mel', titulo), diff);
    }
  }

  function _notify(title, body) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  // ── Exposição pública ──────────────────────────────────────

  return {
    render,
    openModal,
    setTipo,
    save,
    remove,
    check,
  };

})();
