/**
 * storage.js — Camada de dados
 * Padaria Pão de Mel
 *
 * Todas as funções de leitura e escrita no localStorage.
 * Dados expiram automaticamente após STORAGE_DAYS dias.
 */

const Storage = (() => {

  const PREFIX      = 'pdm_';
  const STORAGE_DAYS = 60; // dias antes de expirar

  // ── Funções internas ──────────────────────────────────────

  function _key(name) {
    return PREFIX + name;
  }

  function _set(name, data) {
    try {
      localStorage.setItem(_key(name), JSON.stringify({
        data,
        ts: Date.now()
      }));
    } catch (e) {
      console.error('[Storage] Erro ao salvar:', name, e);
    }
  }

  function _get(name, defaultValue = []) {
    try {
      const raw = localStorage.getItem(_key(name));
      if (!raw) return defaultValue;

      const parsed = JSON.parse(raw);
      const expiry = STORAGE_DAYS * 24 * 60 * 60 * 1000;

      if (Date.now() - parsed.ts > expiry) {
        localStorage.removeItem(_key(name));
        return defaultValue;
      }

      return parsed.data;
    } catch (e) {
      console.error('[Storage] Erro ao ler:', name, e);
      return defaultValue;
    }
  }

  // ── API pública ────────────────────────────────────────────

  return {

    // Pedidos
    getPedidos()        { return _get('pedidos', []); },
    savePedidos(data)   { _set('pedidos', data); },

    // Clientes
    getClientes()       { return _get('clientes', []); },
    saveClientes(data)  { _set('clientes', data); },

    // Alertas
    getAlertas()        { return _get('alertas', []); },
    saveAlertas(data)   { _set('alertas', data); },

    // Configurações
    getConfig()         { return _get('config', {}); },
    saveConfig(data)    { _set('config', data); },

    // Exportar tudo (para backup)
    exportAll() {
      return {
        pedidos:  this.getPedidos(),
        clientes: this.getClientes(),
        alertas:  this.getAlertas(),
        config:   this.getConfig(),
        exportedAt: new Date().toISOString()
      };
    },

    // Importar backup
    importAll(json) {
      try {
        const data = typeof json === 'string' ? JSON.parse(json) : json;
        if (data.pedidos)  this.savePedidos(data.pedidos);
        if (data.clientes) this.saveClientes(data.clientes);
        if (data.alertas)  this.saveAlertas(data.alertas);
        return true;
      } catch (e) {
        console.error('[Storage] Erro ao importar:', e);
        return false;
      }
    }
  };

})();
