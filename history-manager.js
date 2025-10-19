// ═══════════════════════════════════════════════════════════════
// SISTEMA DE HISTÓRICO POR USUÁRIO - FIREBASE
// Champion Bot v2.0
// ═══════════════════════════════════════════════════════════════

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, query, where, orderBy, limit, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuração do Firebase
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
const db = getFirestore(app);

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE HISTÓRICO
// ═══════════════════════════════════════════════════════════════

/**
 * Adicionar entrada no histórico do usuário
 * @param {string} username - Nome do usuário
 * @param {object} entry - Dados da entrada do histórico
 */
export async function addHistoryEntry(username, entry) {
    try {
        const historyEntry = {
            username: username,
            action: entry.action || 'undefined',
            details: entry.details || {},
            result: entry.result || 'success',
            timestamp: new Date().toISOString(),
            device: getDeviceInfo(),
            metadata: entry.metadata || {}
        };
        
        const docRef = await addDoc(collection(db, 'history'), historyEntry);
        console.log('✅ Histórico salvo no Firebase:', docRef.id);
        
        // Também salva no localStorage como backup
        saveToLocalStorage(username, historyEntry);
        
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('❌ Erro ao salvar histórico:', error);
        
        // Fallback: salva apenas no localStorage
        saveToLocalStorage(username, entry);
        return { success: false, error: error.message };
    }
}

/**
 * Buscar histórico do usuário
 * @param {string} username - Nome do usuário
 * @param {number} limitItems - Limite de itens a retornar (padrão: 50)
 */
export async function getUserHistory(username, limitItems = 50) {
    try {
        const q = query(
            collection(db, 'history'),
            where('username', '==', username),
            orderBy('timestamp', 'desc'),
            limit(limitItems)
        );
        
        const querySnapshot = await getDocs(q);
        const history = [];
        
        querySnapshot.forEach((doc) => {
            history.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ ${history.length} entradas de histórico carregadas do Firebase`);
        
        // Sincroniza com localStorage
        if (history.length > 0) {
            localStorage.setItem(`history_${username}`, JSON.stringify(history));
        }
        
        return history;
    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        
        // Fallback: busca do localStorage
        return getFromLocalStorage(username);
    }
}

/**
 * Buscar todo o histórico (admin)
 * @param {number} limitItems - Limite de itens a retornar (padrão: 100)
 */
export async function getAllHistory(limitItems = 100) {
    try {
        const q = query(
            collection(db, 'history'),
            orderBy('timestamp', 'desc'),
            limit(limitItems)
        );
        
        const querySnapshot = await getDocs(q);
        const history = [];
        
        querySnapshot.forEach((doc) => {
            history.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ ${history.length} entradas totais carregadas`);
        return history;
    } catch (error) {
        console.error('❌ Erro ao buscar histórico completo:', error);
        return [];
    }
}

/**
 * Limpar histórico do usuário
 * @param {string} username - Nome do usuário
 */
export async function clearUserHistory(username) {
    try {
        const q = query(
            collection(db, 'history'),
            where('username', '==', username)
        );
        
        const querySnapshot = await getDocs(q);
        const deletePromises = [];
        
        querySnapshot.forEach((docSnapshot) => {
            deletePromises.push(deleteDoc(doc(db, 'history', docSnapshot.id)));
        });
        
        await Promise.all(deletePromises);
        
        console.log(`✅ Histórico de ${username} limpo (${deletePromises.length} entradas)`);
        
        // Limpa do localStorage também
        localStorage.removeItem(`history_${username}`);
        
        return { success: true, deleted: deletePromises.length };
    } catch (error) {
        console.error('❌ Erro ao limpar histórico:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Estatísticas do histórico
 * @param {string} username - Nome do usuário (opcional)
 */
export async function getHistoryStats(username = null) {
    try {
        let q;
        if (username) {
            q = query(
                collection(db, 'history'),
                where('username', '==', username)
            );
        } else {
            q = collection(db, 'history');
        }
        
        const querySnapshot = await getDocs(q);
        
        const stats = {
            total: querySnapshot.size,
            byAction: {},
            byResult: {},
            lastEntry: null
        };
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Por ação
            stats.byAction[data.action] = (stats.byAction[data.action] || 0) + 1;
            
            // Por resultado
            stats.byResult[data.result] = (stats.byResult[data.result] || 0) + 1;
            
            // Última entrada
            if (!stats.lastEntry || data.timestamp > stats.lastEntry) {
                stats.lastEntry = data.timestamp;
            }
        });
        
        return stats;
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        return { total: 0, byAction: {}, byResult: {}, lastEntry: null };
    }
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES (localStorage - backup)
// ═══════════════════════════════════════════════════════════════

function saveToLocalStorage(username, entry) {
    try {
        const key = `history_${username}`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        
        history.unshift(entry);
        
        // Limita a 100 entradas no localStorage
        if (history.length > 100) {
            history.length = 100;
        }
        
        localStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}

function getFromLocalStorage(username) {
    try {
        const key = `history_${username}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
        console.error('Erro ao buscar do localStorage:', error);
        return [];
    }
}

function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timestamp: new Date().toISOString()
    };
}

// ═══════════════════════════════════════════════════════════════
// MIGRAÇÃO DE HISTÓRICO (localStorage → Firebase)
// ═══════════════════════════════════════════════════════════════

export async function migrateHistoryToFirebase(username) {
    try {
        const localHistory = getFromLocalStorage(username);
        
        if (localHistory.length === 0) {
            console.log('ℹ️ Nenhum histórico local para migrar');
            return { success: true, migrated: 0 };
        }
        
        console.log(`🔄 Migrando ${localHistory.length} entradas de histórico...`);
        
        let migrated = 0;
        for (const entry of localHistory) {
            const result = await addHistoryEntry(username, entry);
            if (result.success) migrated++;
        }
        
        console.log(`✅ ${migrated} entradas migradas para o Firebase`);
        return { success: true, migrated };
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        return { success: false, error: error.message };
    }
}

// Exportar Firebase instance
export { db };
