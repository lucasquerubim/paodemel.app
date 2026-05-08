# 🍞 Padaria Pão de Mel — Sistema de Pedidos

Sistema PWA para gerenciamento de pedidos da Padaria Pão de Mel.

---

## 📁 Estrutura de arquivos

```
paodemel/
├── index.html          ← Página principal (abre aqui)
├── manifest.json       ← Config do PWA
├── sw.js               ← Service Worker (offline)
├── css/
│   ├── base.css        ← Reset, variáveis, layout
│   ├── components.css  ← Cards, forms, modais
│   └── print.css       ← Comanda A4
├── js/
│   ├── storage.js      ← Dados (localStorage)
│   ├── auth.js         ← Login e perfis
│   ├── app.js          ← Navegação e utilitários
│   ├── pedidos.js      ← Criar/editar/listar pedidos
│   ├── clientes.js     ← Cadastro e histórico
│   ├── relatorios.js   ← Métricas e gráficos
│   ├── alertas.js      ← Lembretes e notificações
│   └── print.js        ← Impressão de comandas
└── assets/
    └── logo.png        ← Logo da padaria
```

---

## 🚀 Como rodar

### No VS Code
1. Instale a extensão **Live Server** (ritwickdey.LiveServer)
2. Clique com botão direito em `index.html` → **Open with Live Server**
3. Abre no navegador em `http://localhost:5500`

### No celular (Android / iPhone)
1. Rode o Live Server no computador
2. Descubra o IP local do computador (ex: `192.168.1.10`)
3. No celular, acesse `http://192.168.1.10:5500`
4. Chrome Android → menu `⋮` → **Adicionar à tela inicial**
5. Safari iPhone → botão `⬆` → **Adicionar à Tela de Início**

---

## 👥 Perfis de acesso

| Usuário | Senha | Acesso |
|---------|-------|--------|
| Lucas   | lucas | ✅ Admin completo |
| Marcos  | marcos | 👁️ Só visualizar |
| Tania   | tania  | 👁️ Só visualizar |
| Thais   | thais  | 👁️ Só visualizar |

---

## 🔄 Fluxo de status do pedido

```
Aguardando → Compra Pendente → Em Produção
→ Separação → Assando/Fritando → Pronto → Saiu → Entregue
```

---

## 📧 Configurar e-mails automáticos (EmailJS)

1. Crie conta grátis em https://emailjs.com
2. Conecte seu Gmail
3. Crie um template de e-mail
4. No arquivo `js/pedidos.js`, localize o comentário:
   ```
   // TODO: Integrar EmailJS aqui
   ```
5. Substitua pelos seus dados:
   ```js
   emailjs.send('SEU_SERVICE_ID', 'SEU_TEMPLATE_ID', {
     cliente: order.cliente,
     total:   App.fmtMoeda(order.total),
     entrega: order.dtEntrega,
   }, 'SUA_PUBLIC_KEY');
   ```

---

## 📊 Configurar Google Sheets

1. Crie uma planilha no Google Sheets
2. Vá em **Extensões → Apps Script**
3. Cole o código abaixo:

```js
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data  = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.dtCriado,
    data.cliente,
    data.tipo,
    data.total,
    data.status,
    data.entregador,
    data.dtEntrega,
  ]);
  return ContentService.createTextOutput('OK');
}
```

4. Clique em **Implantar → Nova implantação → App da Web**
5. Permissão: "Qualquer pessoa"
6. Copie a URL gerada
7. Em `js/pedidos.js`, adicione na função `save()`:
   ```js
   fetch('SUA_URL_DO_APPS_SCRIPT', {
     method: 'POST',
     body: JSON.stringify(order),
   });
   ```

---

## 💾 Dados e backup

- Dados ficam salvos no navegador por **60 dias**
- Para exportar backup manual, abra o console do navegador e rode:
  ```js
  Storage.exportAll()
  ```
- Para importar:
  ```js
  Storage.importAll(JSON_COPIADO)
  ```

---

## 🛠️ Personalizar

- **Cores**: edite as variáveis em `css/base.css` (`:root { ... }`)
- **Descartáveis**: edite o array `DESCARTAVEIS` em `js/pedidos.js`
- **Perfis**: edite o objeto `PROFILES` em `js/auth.js`
- **E-mails**: edite o array `EMAILS` em `js/app.js`

---

## 📞 Contato técnico

Sistema desenvolvido para uso interno da Padaria Pão de Mel.
