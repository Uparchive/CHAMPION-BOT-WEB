// ═══════════════════════════════════════════════════════════════
// CHAMPION BOT - AUTHENTICATION SYSTEM v2.0
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// CRYPTO UTILITIES - Criptografia SHA-256
// ═══════════════════════════════════════════════════════════════

/**
 * Gera hash SHA-256 de uma string
 * @param {string} message - Mensagem para hashear
 * @returns {Promise<string>} Hash em hexadecimal
 */
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Criptografa senha com salt
 * @param {string} password - Senha em texto plano
 * @returns {Promise<string>} Hash criptografado
 */
async function hashPassword(password) {
    // Adiciona salt fixo para consistência
    const salt = 'ChampionBot2025_SecureSalt';
    return await sha256(password + salt);
}

// ═══════════════════════════════════════════════════════════════
// USER DATABASE - Gerenciamento de Usuários
// ═══════════════════════════════════════════════════════════════

/**
 * Inicializa o banco de dados de usuários
 */
function initializeUserDatabase() {
    // ========================================
    // 1. SISTEMA ANTIGO (championBotUsers)
    // ========================================
    if (!localStorage.getItem('championBotUsers')) {
        // Cria usuário mestre padrão
        const masterUser = {
            username: 'Champion Mestre',
            passwordHash: '', // Será preenchido na primeira vez
            isAdmin: true,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            active: true
        };

        const users = {
            'Champion Mestre': masterUser
        };

        localStorage.setItem('championBotUsers', JSON.stringify(users));
        
        // Define a senha do usuário mestre
        setMasterPassword();
    }

    // ========================================
    // 2. SISTEMA V3 (championBotUsersV3)
    // ========================================
    if (!localStorage.getItem('championBotUsersV3')) {
        const v3Data = {
            users: [],
            meta: {
                version: 3,
                totalUsers: 0,
                lastUpdate: new Date().toISOString(),
                masterUserConfigured: false
            }
        };
        
        localStorage.setItem('championBotUsersV3', JSON.stringify(v3Data));
        console.log('✅ Sistema V3 inicializado');
    }
}

/**
 * Define a senha criptografada do usuário mestre
 */
async function setMasterPassword() {
    const masterPassword = 'Champion@2025!';
    const passwordHash = await hashPassword(masterPassword);
    
    const users = JSON.parse(localStorage.getItem('championBotUsers'));
    users['Champion Mestre'].passwordHash = passwordHash;
    
    localStorage.setItem('championBotUsers', JSON.stringify(users));
}

/**
 * Busca todos os usuários (compatível com sistema antigo e V3)
 * @returns {Object} Objeto com todos os usuários
 */
function getAllUsers() {
    // Tenta sistema V3 primeiro
    const v3Data = JSON.parse(localStorage.getItem('championBotUsersV3') || '{"users": []}');
    
    if (v3Data.users && v3Data.users.length > 0) {
        // Converte array V3 para formato antigo (objeto)
        const usersObj = {};
        v3Data.users.forEach(user => {
            usersObj[user.username] = user;
        });
        return usersObj;
    }
    
    // Fallback para sistema antigo
    return JSON.parse(localStorage.getItem('championBotUsers') || '{}');
}

/**
 * Busca usuário por username (compatível com sistema antigo e V3)
 * @param {string} username - Nome de usuário
 * @returns {Object|null} Dados do usuário ou null
 */
function getUserByUsername(username) {
    // Tenta sistema V3 primeiro
    const v3Data = JSON.parse(localStorage.getItem('championBotUsersV3') || '{"users": []}');
    
    if (v3Data.users && v3Data.users.length > 0) {
        const user = v3Data.users.find(u => u.username === username);
        if (user) {
            console.log('✅ Usuário encontrado no sistema V3:', username);
            return user;
        }
    }
    
    // Fallback para sistema antigo
    const users = JSON.parse(localStorage.getItem('championBotUsers') || '{}');
    const oldUser = users[username];
    
    if (oldUser) {
        console.log('✅ Usuário encontrado no sistema antigo:', username);
        // Se encontrou no antigo mas não no V3, migra automaticamente
        migrateUserToV3(oldUser);
    }
    
    return oldUser || null;
}

/**
 * Migra usuário do sistema antigo para V3
 * @param {Object} oldUser - Dados do usuário no formato antigo
 */
function migrateUserToV3(oldUser) {
    if (!oldUser || !oldUser.username) return;
    
    console.log('🔄 Migrando usuário para V3:', oldUser.username);
    
    try {
        const v3Data = JSON.parse(localStorage.getItem('championBotUsersV3') || '{"users": [], "meta": {}}');
        
        // Verifica se já existe no V3
        const exists = v3Data.users.find(u => u.username === oldUser.username);
        if (exists) {
            console.log('⚠️ Usuário já existe no V3, pulando migração');
            return;
        }
        
        // Cria usuário V3
        const v3User = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            username: oldUser.username,
            email: oldUser.email || 'user@champion.bot',
            passwordHash: oldUser.passwordHash,
            isAdmin: oldUser.isAdmin || false,
            active: oldUser.active !== false,
            subscriptionType: oldUser.isAdmin ? 'permanent' : 'trial',
            expiryDate: oldUser.isAdmin ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: oldUser.createdAt || new Date().toISOString(),
            lastLogin: oldUser.lastLogin || null,
            lastActivity: new Date().toISOString(),
            metadata: {
                source: 'auto-migration',
                migrationDate: new Date().toISOString(),
                originalData: oldUser.metadata || {}
            }
        };
        
        v3Data.users.push(v3User);
        v3Data.meta = {
            version: 3,
            totalUsers: v3Data.users.length,
            lastUpdate: new Date().toISOString()
        };
        
        localStorage.setItem('championBotUsersV3', JSON.stringify(v3Data));
        console.log('✅ Migração concluída para:', oldUser.username);
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
    }
}

/**
 * Valida credenciais de login
 * @param {string} username - Nome de usuário
 * @param {string} password - Senha em texto plano
 * @returns {Promise<boolean>} True se válido
 */
async function validateCredentials(username, password) {
    const user = getUserByUsername(username);
    
    if (!user) {
        return false;
    }

    if (!user.active) {
        return false;
    }

    const passwordHash = await hashPassword(password);
    return user.passwordHash === passwordHash;
}

/**
 * Atualiza último login do usuário (compatível com ambos os sistemas)
 * @param {string} username - Nome de usuário
 */
function updateLastLogin(username) {
    // Atualiza sistema antigo
    const users = JSON.parse(localStorage.getItem('championBotUsers') || '{}');
    if (users[username]) {
        users[username].lastLogin = new Date().toISOString();
        localStorage.setItem('championBotUsers', JSON.stringify(users));
    }
    
    // Atualiza sistema V3
    const v3Data = JSON.parse(localStorage.getItem('championBotUsersV3') || '{"users": []}');
    const userIndex = v3Data.users.findIndex(u => u.username === username);
    
    if (userIndex !== -1) {
        v3Data.users[userIndex].lastLogin = new Date().toISOString();
        v3Data.users[userIndex].lastActivity = new Date().toISOString();
        v3Data.meta.lastUpdate = new Date().toISOString();
        localStorage.setItem('championBotUsersV3', JSON.stringify(v3Data));
        console.log('✅ Último login atualizado no V3 para:', username);
    }
}

// ═══════════════════════════════════════════════════════════════
// SESSION MANAGEMENT - Gerenciamento de Sessão
// ═══════════════════════════════════════════════════════════════

/**
 * Cria sessão de usuário autenticado
 * @param {string} username - Nome de usuário
 * @param {boolean} rememberMe - Lembrar usuário
 */
function createSession(username, rememberMe = false) {
    const sessionData = {
        username: username,
        loginTime: new Date().toISOString(),
        expiresAt: rememberMe 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };

    const storageType = rememberMe ? localStorage : sessionStorage;
    storageType.setItem('championBotSession', JSON.stringify(sessionData));
    
    updateLastLogin(username);
}

/**
 * Verifica se há sessão ativa
 * @returns {Object|null} Dados da sessão ou null
 */
function getActiveSession() {
    // Tenta sessionStorage primeiro (sessão temporária)
    let sessionData = sessionStorage.getItem('championBotSession');
    let isTemporary = true;
    
    // Se não houver, tenta localStorage (lembrar-me)
    if (!sessionData) {
        sessionData = localStorage.getItem('championBotSession');
        isTemporary = false;
    }

    if (!sessionData) {
        return null;
    }

    try {
        const session = JSON.parse(sessionData);
        
        // Verifica se a sessão expirou
        if (new Date(session.expiresAt) < new Date()) {
            destroySession();
            return null;
        }

        return session;
    } catch (e) {
        return null;
    }
}

/**
 * Destrói sessão ativa
 */
function destroySession() {
    sessionStorage.removeItem('championBotSession');
    localStorage.removeItem('championBotSession');
}

// ═══════════════════════════════════════════════════════════════
// UI FUNCTIONS - Funções da Interface
// ═══════════════════════════════════════════════════════════════

/**
 * Mostra mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const successDiv = document.getElementById('successMessage');
    
    // Verificações de segurança para evitar erros em páginas sem esses elementos
    if (successDiv) successDiv.style.display = 'none';
    if (errorText) errorText.textContent = message;
    if (errorDiv) errorDiv.style.display = 'flex';
    
    // Remove após 5 segundos
    if (errorDiv) {
        setTimeout(() => {
            if (errorDiv) errorDiv.style.display = 'none';
        }, 5000);
    }
}

/**
 * Mostra mensagem de sucesso
 * @param {string} message - Mensagem de sucesso
 */
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    const errorDiv = document.getElementById('errorMessage');
    
    // Verifica se os elementos existem antes de acessar
    if (errorDiv) errorDiv.style.display = 'none';
    if (successText) successText.textContent = message;
    if (successDiv) successDiv.style.display = 'flex';
}

/**
 * Toggle visibilidade da senha
 */
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    // Verificação de segurança
    if (!passwordInput || !toggleIcon) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = '👁️';
    }
}

/**
 * Desabilita botão de login durante processamento
 * @param {boolean} disabled - True para desabilitar
 */
function setLoginButtonState(disabled) {
    const loginBtn = document.getElementById('loginBtn');
    
    // Verificação de segurança
    if (!loginBtn) return;
    
    loginBtn.disabled = disabled;
    
    if (disabled) {
        loginBtn.innerHTML = '<span class="btn-icon">⏳</span> Autenticando...';
    } else {
        loginBtn.innerHTML = '<span class="btn-icon">🔓</span> Entrar';
    }
}

// ═══════════════════════════════════════════════════════════════
// LOGIN HANDLER - Manipulador de Login
// ═══════════════════════════════════════════════════════════════

/**
 * Manipula submissão do formulário de login
 * @param {Event} event - Evento de submit
 */
async function handleLogin(event) {
    event.preventDefault();
    
    setLoginButtonState(true);
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeInput = document.getElementById('rememberMe');
    
    // Verificação de segurança
    if (!usernameInput || !passwordInput) {
        console.error('Elementos do formulário não encontrados');
        setLoginButtonState(false);
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeInput ? rememberMeInput.checked : false;

    try {
        // Valida credenciais
        const isValid = await validateCredentials(username, password);
        
        if (!isValid) {
            showError('❌ Usuário ou senha inválidos!');
            setLoginButtonState(false);
            return;
        }

        // Cria sessão
        createSession(username, rememberMe);
        
        // Busca o usuário para verificar se é admin
        const user = getUserByUsername(username);
        
        // Mostra sucesso
        showSuccess('✅ Login realizado com sucesso! Redirecionando...');
        
        // Redireciona baseado no tipo de usuário
        setTimeout(() => {
            if (user && user.isAdmin) {
                console.log('🔓 Usuário é admin, redirecionando para painel administrativo...');
                window.location.href = 'admin.html';
            } else {
                console.log('👤 Usuário comum, redirecionando para o bot...');
                window.location.href = 'index.html';
            }
        }, 1500);
        
    } catch (error) {
        console.error('Erro no login:', error);
        showError('⚠️ Erro ao processar login. Tente novamente.');
        setLoginButtonState(false);
    }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-LOGIN - Verificação Automática
// ═══════════════════════════════════════════════════════════════

/**
 * Verifica se já há sessão ativa ao carregar a página
 * Só redireciona se estiver na página de login
 */
function checkAutoLogin() {
    // Verifica qual página está aberta
    const currentPage = window.location.pathname.split('/').pop();
    
    // Só faz verificação se estiver em uma das páginas de autenticação
    const authPages = ['auth.html', 'auth_new.html', 'login.html', 'TEST_AUTH.html'];
    if (!authPages.includes(currentPage)) {
        return; // Não faz nada se não estiver em página de login
    }
    
    const session = getActiveSession();
    
    if (session) {
        // Já está logado, redireciona para o bot
        showSuccess('✅ Você já está logado! Redirecionando...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION - Inicialização
// ═══════════════════════════════════════════════════════════════

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initializeUserDatabase();
    checkAutoLogin();
    
    // Foco no campo de usuário (com verificação)
    const usernameField = document.getElementById('username');
    if (usernameField) usernameField.focus();
});

// ═══════════════════════════════════════════════════════════════
// EXPORTS - Funções Exportadas (para uso em outros arquivos)
// ═══════════════════════════════════════════════════════════════

// Exporta funções para uso global
window.ChampionBotAuth = {
    getActiveSession,
    destroySession,
    getAllUsers,
    getUserByUsername,
    hashPassword,
    validateCredentials,
    createSession,
    migrateUserToV3,
    initializeUserDatabase
};
