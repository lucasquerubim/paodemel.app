/**
 * auth.js — Autenticação (versão simplificada)
 * Padaria Pão de Mel
 *
 * Login removido temporariamente conforme solicitado.
 * Todos têm acesso de admin por enquanto.
 */

const Auth = (() => {

  let _currentUser = 'lucas';

  return {

    // Bypass: já entra como admin
    bypassLogin() {
      _currentUser = 'lucas';
    },

    login(profile) {
      _currentUser = profile;
    },

    logout() {
      _currentUser = null;
    },

    getUser() {
      return _currentUser;
    },

    isAdmin() {
      return true; // todos são admin por enquanto
    },

    getUserName() {
      return 'Padaria';
    }
  };

})();
