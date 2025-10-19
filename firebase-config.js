// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DO FIREBASE
// ═══════════════════════════════════════════════════════════════

// Importar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuração do Firebase - Champion Bot
const firebaseConfig = {
    apiKey: "AIzaSyCWPobM_NmbPG15ulqn9e9z7MKtAdgXjv8",
    authDomain: "champion-bot-2835b.firebaseapp.com",
    projectId: "champion-bot-2835b",
    storageBucket: "champion-bot-2835b.firebasestorage.app",
    messagingSenderId: "1023800590615",
    appId: "1:1023800590615:web:e06a993d07a27626ab3752",
    measurementId: "G-J6C2FDM8M4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE USUÁRIOS (FIRESTORE)
// ═══════════════════════════════════════════════════════════════

/**
 * Criar novo usuário no Firestore
 */
async function createUserInFirestore(userData) {
    try {
        const docRef = await addDoc(collection(db, 'users'), {
            username: userData.username,
            email: userData.email,
            passwordHash: userData.passwordHash,
            isAdmin: userData.isAdmin || false,
            active: userData.active !== undefined ? userData.active : true,
            subscriptionType: userData.subscriptionType || 'trial',
            expiryDate: userData.expiryDate || null,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            lastActivity: new Date().toISOString(),
            metadata: userData.metadata || {}
        });
        
        console.log('✅ Usuário criado no Firebase:', docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar todos os usuários
 */
async function getAllUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const users = [];
        
        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ ${users.length} usuários carregados do Firebase`);
        return users;
    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        return [];
    }
}

/**
 * Buscar usuário por username
 */
async function getUserByUsername(username) {
    try {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }
        
        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        return null;
    }
}

/**
 * Buscar usuário por email
 */
async function getUserByEmail(email) {
    try {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return null;
        }
        
        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        return null;
    }
}

/**
 * Atualizar usuário
 */
async function updateUser(userId, updates) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...updates,
            lastActivity: new Date().toISOString()
        });
        
        console.log('✅ Usuário atualizado:', userId);
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Excluir usuário
 */
async function deleteUser(userId) {
    try {
        await deleteDoc(doc(db, 'users', userId));
        console.log('✅ Usuário excluído:', userId);
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao excluir usuário:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Ouvir mudanças em tempo real nos usuários
 */
function listenToUsers(callback) {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        callback(users);
    }, (error) => {
        console.error('❌ Erro ao ouvir mudanças:', error);
    });
}

/**
 * Atualizar último login
 */
async function updateLastLogin(userId) {
    return await updateUser(userId, {
        lastLogin: new Date().toISOString(),
        lastActivity: new Date().toISOString()
    });
}

/**
 * Ativar/Desativar usuário
 */
async function toggleUserStatus(userId, active) {
    return await updateUser(userId, { active });
}

/**
 * Verificar se usuário existe
 */
async function userExists(username, email) {
    const byUsername = await getUserByUsername(username);
    const byEmail = await getUserByEmail(email);
    
    return {
        usernameExists: !!byUsername,
        emailExists: !!byEmail
    };
}

// ═══════════════════════════════════════════════════════════════
// MIGRAÇÃO DE DADOS (localStorage -> Firebase)
// ═══════════════════════════════════════════════════════════════

/**
 * Migrar usuários do localStorage para o Firebase
 */
async function migrateLocalStorageToFirebase() {
    try {
        console.log('🔄 Iniciando migração de dados...');
        
        // Buscar dados do localStorage
        const v3Data = JSON.parse(localStorage.getItem('championBotUsersV3') || '{"users": []}');
        
        if (v3Data.users.length === 0) {
            console.log('ℹ️ Nenhum usuário para migrar');
            return { success: true, migrated: 0 };
        }
        
        // Verificar quais usuários já existem no Firebase
        const firebaseUsers = await getAllUsers();
        const firebaseUsernames = new Set(firebaseUsers.map(u => u.username));
        
        let migrated = 0;
        let skipped = 0;
        
        // Migrar cada usuário
        for (const user of v3Data.users) {
            if (firebaseUsernames.has(user.username)) {
                console.log(`⏭️ Usuário "${user.username}" já existe no Firebase`);
                skipped++;
                continue;
            }
            
            const result = await createUserInFirestore(user);
            if (result.success) {
                migrated++;
            }
        }
        
        console.log(`✅ Migração concluída: ${migrated} migrados, ${skipped} ignorados`);
        return { success: true, migrated, skipped };
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sincronizar Firebase com localStorage (fallback)
 */
async function syncFirebaseToLocalStorage() {
    try {
        const users = await getAllUsers();
        
        const v3Data = {
            users: users,
            meta: {
                version: 3,
                totalUsers: users.length,
                lastUpdate: new Date().toISOString(),
                source: 'firebase'
            }
        };
        
        localStorage.setItem('championBotUsersV3', JSON.stringify(v3Data));
        console.log('✅ Dados sincronizados com localStorage');
        
    } catch (error) {
        console.error('❌ Erro ao sincronizar:', error);
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTAR FUNÇÕES
// ═══════════════════════════════════════════════════════════════

export {
    // Firebase instances
    app,
    auth,
    db,
    
    // User functions
    createUserInFirestore,
    getAllUsers,
    getUserByUsername,
    getUserByEmail,
    updateUser,
    deleteUser,
    listenToUsers,
    updateLastLogin,
    toggleUserStatus,
    userExists,
    
    // Migration
    migrateLocalStorageToFirebase,
    syncFirebaseToLocalStorage
};
