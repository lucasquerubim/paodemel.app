/**
 * auth.js — Autenticação e perfis
 * Padaria Pão de Mel
 *
 * Gerencia os 4 perfis: Lucas (admin), Marcos, Tania, Thais (visualização).
 */

const Auth = (() => {

  // Definição dos perfis
  const PROFILES = {
    lucas:  { name: 'Lucas',  role: 'Administrador', isAdmin: true  },
    marcos: { name: 'Marcos', role: 'Visualizar',    isAdmin: false },
    tania:  { name: 'Tania',  role: 'Visualizar',    isAdmin: false },
    thais:  { name: 'Thais',  role: 'Visualizar',    isAdmin: false },
  };

  let _currentUser = null;

  // ── API pública ────────────────────────────────────────────

  return {

    login(profile) {
      if (!PROFILES[profile]) {
        console.error('[Auth] Perfil não encontrado:', profile);
        return;
      }

      _currentUser = profile;

      // Esconde tela de login, mostra app
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').style.display = 'flex';

      // Atualiza label do usuário
      document.getElementById('current-user-label').textContent = PROFILES[profile].name;

      // Controla FAB e botão de alerta (apenas admin)
      const isAdmin = PROFILES[profile].isAdmin;
      document.getElementById('fab').style.display = isAdmin ? 'flex' : 'none';

      const btnAlert = document.getElementById('btn-new-alert');
      if (btnAlert) btnAlert.style.display = isAdmin ? '' : 'none';

      // Banners de visualização
      ['dash', 'ped', 'cli'].forEach(k => {
        const el = document.getElementById('view-only-' + k);
        if (el) el.style.display = isAdmin ? 'none' : 'flex';
      });

      // Inicia o app
      App.init();
    },

    logout() {
      _currentUser = null;
      document.getElementById('app').style.display = 'none';
      document.getElementById('login-screen').style.display = 'flex';
    },

    // Retorna o usuário atual (string: 'lucas', 'marcos', etc.)
    getUser() {
      return _currentUser;
    },

    // Retorna true se o usuário atual é admin
    isAdmin() {
      if (!_currentUser) return false;
      return PROFILES[_currentUser]?.isAdmin === true;
    },

    // Retorna o nome legível do usuário atual
    getUserName() {
      if (!_currentUser) return '';
      return PROFILES[_currentUser]?.name || '';
    },

    // Retorna todos os perfis (para referência)
    getProfiles() {
      return PROFILES;
    }
  };

})();
