# 🚨 SOLUÇÃO RÁPIDA - Cole no Console do Navegador

## Passo 1: Abra o Console
Pressione **F12** no navegador e vá para a aba "Console"

## Passo 2: Cole este código

```javascript
// ═══════════════════════════════════════════════════════════════
// FORÇA PERMISSÃO DE ADMIN - SOLUÇÃO DIRETA
// ═══════════════════════════════════════════════════════════════

(async function forceAdminAccess() {
    console.log('%c🔧 INICIANDO CORREÇÃO FORÇADA DE ADMIN', 'color: #ffc107; font-size: 20px; font-weight: bold');
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Função de hash (necessária)
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async function hashPassword(password) {
        const salt = 'ChampionBot2025_SecureSalt';
        return await sha256(password + salt);
    }
    
    // 1. Verifica sessão
    const sessionTemp = sessionStorage.getItem('championBotSession');
    const sessionPerm = localStorage.getItem('championBotSession');
    const session = JSON.parse(sessionTemp || sessionPerm || 'null');
    
    if (!session) {
        console.log('%c❌ ERRO: Nenhuma sessão ativa!', 'color: #dc3545; font-size: 16px');
        console.log('Vá para auth.html e faça login primeiro.');
        alert('❌ Você precisa estar logado!\n\nVá para auth.html');
        return;
    }
    
    console.log('%c✅ Sessão encontrada:', 'color: #28a745', session.username);
    
    // 2. Carrega dados V3
    const v3Data = JSON.parse(localStorage.getItem('championBotUsersV3') || '{"users": [], "meta": {}}');
    console.log(`📊 Sistema V3: ${v3Data.users.length} usuário(s)`);
    
    // 3. Busca usuário
    let userIndex = v3Data.users.findIndex(u => u.username === session.username);
    
    if (userIndex === -1) {
        console.log('%c⚠️ Usuário não existe no V3, criando...', 'color: #ffc107');
        
        // Busca no sistema antigo
        const oldData = JSON.parse(localStorage.getItem('championBotUsers') || '{}');
        const oldUser = oldData[session.username];
        
        let passwordHash;
        if (oldUser && oldUser.passwordHash) {
            passwordHash = oldUser.passwordHash;
            console.log('✅ Usando senha do sistema antigo');
        } else {
            passwordHash = await hashPassword('admin123');
            console.log('%c⚠️ Senha padrão definida: admin123', 'color: #ffc107');
        }
        
        // Cria usuário
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            username: session.username,
            email: oldUser?.email || session.username + '@champion.bot',
            passwordHash: passwordHash,
            isAdmin: true,
            active: true,
            subscriptionType: 'permanent',
            expiryDate: null,
            createdAt: oldUser?.createdAt || new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            metadata: {
                source: 'console-fix',
                fixDate: new Date().toISOString()
            }
        };
        
        v3Data.users.push(newUser);
        userIndex = v3Data.users.length - 1;
        
        console.log('%c✅ Usuário criado no V3', 'color: #28a745');
    } else {
        console.log('%c✅ Usuário encontrado no V3', 'color: #28a745');
    }
    
    // 4. FORÇA permissões de admin
    console.log('%c🔧 Aplicando permissões de admin...', 'color: #17a2b8; font-size: 16px');
    
    v3Data.users[userIndex].isAdmin = true;
    v3Data.users[userIndex].active = true;
    v3Data.users[userIndex].subscriptionType = 'permanent';
    v3Data.users[userIndex].expiryDate = null;
    v3Data.users[userIndex].lastActivity = new Date().toISOString();
    
    // 5. Salva
    v3Data.meta = {
        version: 3,
        totalUsers: v3Data.users.length,
        lastUpdate: new Date().toISOString()
    };
    
    localStorage.setItem('championBotUsersV3', JSON.stringify(v3Data));
    
    // 6. Resultados
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('%c✅ SUCESSO! PERMISSÕES APLICADAS!', 'color: #28a745; font-size: 20px; font-weight: bold');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Usuário:', v3Data.users[userIndex].username);
    console.log('isAdmin:', v3Data.users[userIndex].isAdmin);
    console.log('active:', v3Data.users[userIndex].active);
    console.log('subscriptionType:', v3Data.users[userIndex].subscriptionType);
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Alerta
    alert('✅ SUCESSO!\n\nVocê agora é ADMINISTRADOR!\n\nVá para admin.html');
    
    // Redireciona
    const redirect = confirm('Deseja ir para o painel admin agora?');
    if (redirect) {
        window.location.href = 'admin.html';
    }
})();
```

## Passo 3: Pressione Enter

O script vai:
1. Verificar sua sessão
2. Criar ou encontrar seu usuário no V3
3. FORÇAR permissões de admin
4. Salvar
5. Redirecionar para admin.html

---

## ❓ Se não funcionar

### Opção 1: Reset Completo
```javascript
// Cola isso no console
sessionStorage.clear();
localStorage.removeItem('championBotSession');
localStorage.removeItem('championBotUsersV3');
localStorage.removeItem('championBotUsers');
alert('Tudo limpo! Vá para setup_master.html');
location.href = 'setup_master.html';
```

### Opção 2: Ver o que tem no sistema
```javascript
// Cola isso no console
const session = JSON.parse(sessionStorage.getItem('championBotSession') || localStorage.getItem('championBotSession') || 'null');
const v3 = JSON.parse(localStorage.getItem('championBotUsersV3') || '{"users": []}');
console.table({
    'Sessão Ativa': session ? 'SIM' : 'NÃO',
    'Usuário Sessão': session?.username || 'N/A',
    'Total Users V3': v3.users.length
});
console.log('Usuários V3:', v3.users);
if (session) {
    const user = v3.users.find(u => u.username === session.username);
    console.log('Seu usuário:', user);
    console.table({
        'Username': user?.username || 'NÃO ENCONTRADO',
        'isAdmin': user?.isAdmin || false,
        'active': user?.active || false,
        'subscriptionType': user?.subscriptionType || 'N/A'
    });
}
```

---

## 🎯 Solução Mais Simples

Se você só quer entrar AGORA sem complicação:

1. Pressione F12
2. Cole:
```javascript
localStorage.setItem('championBotUsersV3', JSON.stringify({
    users: [{
        id: 'admin123',
        username: 'admin',
        email: 'admin@champion.bot',
        passwordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        isAdmin: true,
        active: true,
        subscriptionType: 'permanent',
        expiryDate: null,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        metadata: {source: 'emergency-fix'}
    }],
    meta: {version: 3, totalUsers: 1, lastUpdate: new Date().toISOString()}
}));
alert('Admin criado! Vá para auth.html e use:\nUsuário: admin\nSenha: (deixe em branco e pressione Enter)');
```

3. Vá para `auth.html`
4. Usuário: **admin**
5. Senha: **(deixe em branco ou qualquer coisa)**
6. Entre!

---

**Última atualização:** 19/10/2025
