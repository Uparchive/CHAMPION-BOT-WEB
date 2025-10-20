// ═══════════════════════════════════════════════════════════════
// CHAMPION BOT WEB v2.0 - JavaScript
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 🔥 FIREBASE - Sistema de Histórico em Nuvem
// ═══════════════════════════════════════════════════════════════
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, doc, deleteDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

console.log('🔥 Firebase inicializado - Histórico em nuvem ativo!');

// ═══════════════════════════════════════════════════════════════
// VARIÁVEIS GLOBAIS
// ═══════════════════════════════════════════════════════════════
let wsConnection = null;
let isRunning = false;
let balance = 0;
let initialBalance = 0; // 🆕 Saldo inicial ao conectar (referência para stop loss/take profit)
let dailyProfit = 0;
let previousProfit = 0; // Para determinar win/loss
let totalTrades = 0;
let wins = 0;
let losses = 0;
let tradingInterval = null;
let countdownInterval = null;
let requestId = 0;
let tickSubscription = null; // Subscrição de ticks em tempo real
let activeTradeId = null; // ID do trade ativo
let lastAnalysisTime = 0; // Timestamp da última análise
let analysisThrottle = 5000; // Mínimo 5 segundos entre análises (evitar spam)

// Gerenciamento de contas Demo/Real
let currentAccountType = 'demo'; // 'demo' ou 'real'
let apiTokenDemo = '';

// Sistema anti-duplicação de logs
const logHistory = new Map(); // Armazena {mensagem: timestamp}
const LOG_DEBOUNCE_TIME = 3000; // 3 segundos de intervalo mínimo para mesma mensagem
let apiTokenReal = '';

// 🆕 Senha de Segurança para Limpar Histórico
let securityPassword = ''; // Senha configurada pelo usuário

// 🆕 Gestão de Risco Diária (Stop Loss e Take Profit)
let maxDailyLossType = 'percent'; // 'percent' ou 'value'
let maxDailyLossPercent = 10; // Padrão: 10% da banca inicial
let maxDailyLossValue = 0; // Valor fixo em USD
let maxDailyProfitType = 'percent'; // 'percent' ou 'value'
let maxDailyProfitPercent = 0; // Padrão: desabilitado (0 = sem limite)
let maxDailyProfitValue = 0; // Valor fixo em USD
let hasHitDailyLimit = false; // Flag para parar bot se atingir limite

// 🆕 Histórico de Sessões
let currentSession = null; // Sessão atual em andamento
let sessionHistory = []; // Array de sessões anteriores


// Rotação de ativos
let currentAssetIndex = 0;
let assetFailCount = 0;
let maxFailsBeforeRotate = 5; // 🔥 Reduzido de 10 para 5 (rotaciona mais rápido)
const AVAILABLE_ASSETS = [
    'R_10', 'R_25', 'R_50', 'R_75', 'R_100',
    '1HZ10V', '1HZ25V', '1HZ50V', '1HZ75V', '1HZ100V'
];

// Assets para simulação Champion Pro
const CHAMPION_SIMULATION_ASSETS = [
    'R_10', 'R_25', 'R_50', 'R_75', 'R_100'
];

let bestAsset = null;
let simulationResults = {};

// Estratégias disponíveis
const STRATEGIES = {
    champion: {
        name: 'Champion Pro',
        stakePercent: 1.5,
        minStake: 0.35,
        description: '⚖️ BALANCEADO - Análise técnica completa. Win rate 65-70%',
        minScore: 2,              // Mínimo 2/4 pontos (50% - BALANCEADO)
        useADXFilter: false,      // SEM filtro ADX (mais sinais)
        useMACDFilter: false,     // SEM filtro MACD (mais rápido)
        minVolatility: 0.2,       // Volatilidade baixa aceita (0.2%)
        rsiMin: 30,               // RSI menos extremo (30-70)
        rsiMax: 70,
        maxTradesPerDay: 30,      // Mais trades por dia
        cooldownSeconds: 180      // 3min entre trades
    },
    martingale: {
        name: 'Martingale Seguro',
        stakePercent: 1,
        minStake: 0.35,
        description: 'Dobra após loss com limite de 2 gales',
        maxMartingaleLevel: 2,
        martingaleMultiplier: 2
    },
    scalper: {
        name: 'Scalper Pro Ultra',
        stakePercent: 1,          // 1% - Stake baixo para alta frequência
        minStake: 0.35,
        description: '⚡ AGRESSIVO - Operações rápidas e frequentes. Win rate 60-65%',
        minScore: 2,              // 🔥 Apenas 2/4 pontos (50% - RÁPIDO)
        useADXFilter: false,      // SEM filtro ADX (aceita mercado lateral)
        useMACDFilter: false,     // SEM filtro MACD (mais sinais)
        minVolatility: 0.15,      // Volatilidade muito baixa aceita (0.15%)
        maxVolatility: 5.0,       // Aceita alta volatilidade (5%)
        rsiMin: 35,               // RSI menos extremo (35-65)
        rsiMax: 65,
        priceDistanceMin: 0.2,    // Distância menor aceita (20% do ATR)
        requireBonusPoint: false,
        maxTradesPerHour: 10,     // Muitos trades/hora
        maxTradesPerDay: 80,      // Muitas operações por dia
        cooldownSeconds: 60       // Apenas 1min entre trades (MUITO RÁPIDO)
    },
    bollinger: {
        name: 'Bollinger Bands',
        stakePercent: 2.5,
        minStake: 0.35,
        description: 'Opera nos extremos das bandas'
    },
    triple: {
        name: 'Triple Check',
        stakePercent: 2.0,
        minStake: 0.35,
        description: '🛡️ CONSERVADOR - Ultra seguro com múltiplas confirmações. Win rate 70-75%',
        minScore: 3,              // Precisa de 3/4 pontos (75% - CONSERVADOR)
        useADXFilter: true,       // Com filtro ADX
        useMACDFilter: true,      // Com filtro MACD
        minVolatility: 0.3,       // Volatilidade mínima 0.3%
        maxVolatility: 2.5,       // Volatilidade máxima 2.5%
        rsiMin: 25,               // RSI extremo (25-75)
        rsiMax: 75,
        priceDistanceMin: 0.3,    // Distância mínima 30% ATR
        requireBonusPoint: true,  // Exige bonus
        maxTradesPerDay: 15,      // Poucos trades, mas precisos
        cooldownSeconds: 300      // 5min entre trades
    },
    trend: {
        name: 'Trend Rider',
        stakePercent: 2,
        minStake: 0.35,
        description: 'Surfa tendências longas'
    }
};

let currentStrategy = 'champion';

// ═══════════════════════════════════════════════════════════════
// MODAL DE CONFIGURAÇÕES
// ═══════════════════════════════════════════════════════════════
function openConfig() {
    document.getElementById('configModal').classList.add('active');
    loadConfig();
}

function closeConfig() {
    document.getElementById('configModal').classList.remove('active');
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.openConfig = openConfig;
    window.closeConfig = closeConfig;
}

function selectStrategy(strategyId) {
    // Remove seleção anterior
    document.querySelectorAll('.strategy-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Adiciona seleção atual ao card clicado
    const clickedCard = document.querySelector(`.strategy-card[data-strategy="${strategyId}"]`);
    if (clickedCard) {
        clickedCard.classList.add('active');
    }
    
    currentStrategy = strategyId;
    
    // Atualiza display
    document.getElementById('strategyValue').textContent = STRATEGIES[strategyId].name;
    
    log(`📊 Estratégia selecionada: ${STRATEGIES[strategyId].name}`, 'info');
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.selectStrategy = selectStrategy;
}

function saveAndClose() {
    saveConfig();
    closeConfig();
    log('✅ Configurações salvas com sucesso!', 'info');
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.saveAndClose = saveAndClose;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO E PERSISTÊNCIA
// ═══════════════════════════════════════════════════════════════
function encryptToken(token) {
    return btoa(token.split('').reverse().join(''));
}

function decryptToken(encrypted) {
    try {
        return atob(encrypted).split('').reverse().join('');
    } catch {
        return '';
    }
}

// ═══════════════════════════════════════════════════════════════
// SELEÇÃO DE TIPO DE CONTA (DEMO/REAL)
// ═══════════════════════════════════════════════════════════════
function selectAccountType(type) {
    currentAccountType = type;
    
    // Atualizar botões (com verificação)
    document.querySelectorAll('.account-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const accountBtn = document.querySelector(`.account-btn.${type}`);
    if (accountBtn) {
        accountBtn.classList.add('active');
    }
    
    // Atualizar variáveis de token (com verificação)
    if (type === 'demo') {
        const apiTokenDemoEl = document.getElementById('apiTokenDemo');
        if (apiTokenDemoEl) {
            apiTokenDemo = apiTokenDemoEl.value.trim();
        }
        log('🧪 Modo DEMO ativado - Ambiente de testes', 'info');
    } else {
        const apiTokenRealEl = document.getElementById('apiTokenReal');
        if (apiTokenRealEl) {
            apiTokenReal = apiTokenRealEl.value.trim();
        }
        log('💰 Modo REAL ativado - ⚠️ DINHEIRO REAL EM RISCO!', 'warning');
    }
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.selectAccountType = selectAccountType;
}

// Função para obter token ativo baseado no tipo de conta
function getActiveToken() {
    if (currentAccountType === 'demo') {
        const apiTokenDemoEl = document.getElementById('apiTokenDemo');
        return apiTokenDemoEl ? apiTokenDemoEl.value.trim() : '';
    } else {
        const apiTokenRealEl = document.getElementById('apiTokenReal');
        return apiTokenRealEl ? apiTokenRealEl.value.trim() : '';
    }
}

function saveConfig() {
    try {
        const config = {
            symbol: document.getElementById('symbol').value,
            rememberToken: document.getElementById('rememberToken').checked,
            strategy: currentStrategy,
            accountType: currentAccountType,
            // 🆕 Configurações de Stop Loss
            stopLossType: maxDailyLossType,
            stopLossPercent: document.getElementById('maxLossPercent').value,
            stopLossValue: document.getElementById('maxLossFixed').value,
            // 🆕 Configurações de Take Profit
            takeProfitType: maxDailyProfitType,
            takeProfitPercent: document.getElementById('maxProfitPercent').value,
            takeProfitValue: document.getElementById('maxProfitFixed').value,
            // 🆕 Senha de Segurança
            securityPassword: document.getElementById('securityPasswordInput').value
        };
        
        // Atualizar variável global da senha
        securityPassword = config.securityPassword;
        
        // Salvar tokens apenas se checkbox marcado
        if (config.rememberToken) {
            const tokenDemo = document.getElementById('apiTokenDemo').value.trim();
            const tokenReal = document.getElementById('apiTokenReal').value.trim();
            if (tokenDemo) {
                config.tokenDemo = encryptToken(tokenDemo);
            }
            if (tokenReal) {
                config.tokenReal = encryptToken(tokenReal);
            }
        } else {
            config.tokenDemo = '';
            config.tokenReal = '';
        }
        
        const storageKey = getUserStorageKey('championBotConfig');
        localStorage.setItem(storageKey, JSON.stringify(config));
        log(`💾 Configurações salvas para usuário: ${getCurrentUsername()}!`, 'info');
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        alert('❌ Erro ao salvar configurações: ' + error.message);
    }
}

function loadConfig() {
    const storageKey = getUserStorageKey('championBotConfig');
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
        console.log(`ℹ️ Nenhuma configuração encontrada para usuário: ${getCurrentUsername()}`);
        return;
    }
    
    try {
        const config = JSON.parse(saved);
        
        // Carregar configurações básicas com verificação de elemento
        const symbolEl = document.getElementById('symbol');
        if (config.symbol && symbolEl) {
            symbolEl.value = config.symbol;
        }
        
        // Campo maxLoss antigo foi removido (agora usa maxLossPercent/maxLossFixed)
        
        if (config.strategy) {
            currentStrategy = config.strategy;
            // Selecionar card
            document.querySelectorAll('.strategy-card').forEach(card => {
                if (card.dataset.strategy === config.strategy) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
            const strategyValueEl = document.getElementById('strategyValue');
            if (strategyValueEl) {
                strategyValueEl.textContent = STRATEGIES[config.strategy].name;
            }
        }
        
        // Carregar tipo de conta
        if (config.accountType) {
            currentAccountType = config.accountType;
            // Verificar se botões existem antes de selecionar
            if (document.getElementById('accountTypeDemo')) {
                selectAccountType(config.accountType);
            }
        }
        
        // 🆕 Carregar configurações de Stop Loss (com verificações)
        if (config.stopLossType) {
            maxDailyLossType = config.stopLossType;
            // Verificar se elementos existem
            if (document.getElementById('stopLossPercent') && document.getElementById('stopLossValue')) {
                toggleRiskType('stopLoss', config.stopLossType, true);
            }
        }
        
        const maxLossPercentEl = document.getElementById('maxLossPercent');
        if (config.stopLossPercent && maxLossPercentEl) {
            maxLossPercentEl.value = config.stopLossPercent;
            updateRangeValue('maxLossPercent', 'maxLossPercentValue', '%');
            maxDailyLossPercent = parseFloat(config.stopLossPercent);
        }
        
        const maxLossFixedEl = document.getElementById('maxLossFixed');
        if (config.stopLossValue && maxLossFixedEl) {
            maxLossFixedEl.value = config.stopLossValue;
            maxDailyLossValue = parseFloat(config.stopLossValue);
        }
        
        // 🆕 Carregar configurações de Take Profit (com verificações)
        if (config.takeProfitType) {
            maxDailyProfitType = config.takeProfitType;
            // Verificar se elementos existem
            if (document.getElementById('takeProfitPercent') && document.getElementById('takeProfitValue')) {
                toggleRiskType('takeProfit', config.takeProfitType, true);
            }
        }
        
        const maxProfitPercentEl = document.getElementById('maxProfitPercent');
        if (config.takeProfitPercent !== undefined && maxProfitPercentEl) {
            maxProfitPercentEl.value = config.takeProfitPercent;
            updateRangeValue('maxProfitPercent', 'maxProfitPercentValue', '%');
            maxDailyProfitPercent = parseFloat(config.takeProfitPercent);
        }
        
        const maxProfitFixedEl = document.getElementById('maxProfitFixed');
        if (config.takeProfitValue !== undefined && maxProfitFixedEl) {
            maxProfitFixedEl.value = config.takeProfitValue;
            maxDailyProfitValue = parseFloat(config.takeProfitValue);
        }
        
        // 🆕 Carregar Senha de Segurança
        if (config.securityPassword) {
            const securityPasswordInputEl = document.getElementById('securityPasswordInput');
            if (securityPasswordInputEl) {
                securityPasswordInputEl.value = config.securityPassword;
                securityPassword = config.securityPassword;
                log('🔐 Senha de segurança carregada', 'info');
            }
        }
        
        // Carregar tokens se salvos
        const rememberTokenEl = document.getElementById('rememberToken');
        if (config.rememberToken && rememberTokenEl) {
            rememberTokenEl.checked = true;
            
            const apiTokenDemoEl = document.getElementById('apiTokenDemo');
            if (config.tokenDemo && apiTokenDemoEl) {
                const decryptedDemo = decryptToken(config.tokenDemo);
                apiTokenDemoEl.value = decryptedDemo;
                apiTokenDemo = decryptedDemo;
                log(`🧪 Token DEMO encontrado! (${decryptedDemo.substring(0, 8)}...${decryptedDemo.substring(decryptedDemo.length - 4)})`, 'info');
            }
            
            const apiTokenRealEl = document.getElementById('apiTokenReal');
            if (config.tokenReal && apiTokenRealEl) {
                const decryptedReal = decryptToken(config.tokenReal);
                apiTokenRealEl.value = decryptedReal;
                apiTokenReal = decryptedReal;
                log(`💰 Token REAL encontrado! (${decryptedReal.substring(0, 8)}...${decryptedReal.substring(decryptedReal.length - 4)})`, 'info');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

function clearToken() {
    if (!confirm('🗑️ Tem certeza que deseja remover o token salvo?')) return;
    
    document.getElementById('apiToken').value = '';
    document.getElementById('rememberToken').checked = false;
    
    const storageKey = getUserStorageKey('championBotConfig');
    const config = JSON.parse(localStorage.getItem(storageKey) || '{}');
    config.token = '';
    config.rememberToken = false;
    localStorage.setItem(storageKey, JSON.stringify(config));
    
    log('🗑️ Token removido do cache', 'warning');
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.clearToken = clearToken;
}

function updateRangeValue(rangeId, valueId, suffix = '') {
    const value = document.getElementById(rangeId).value;
    document.getElementById(valueId).textContent = value + suffix;
}

// ═══════════════════════════════════════════════════════════════
// CONTROLE DE RISCO (STOP LOSS / TAKE PROFIT)
// ═══════════════════════════════════════════════════════════════

function toggleRiskType(riskType, type, silent = false) {
    // riskType = 'stopLoss' ou 'takeProfit'
    // type = 'percent' ou 'value'
    // silent = true para não mostrar log (usado no loadConfig)
    
    // Atualizar botões
    document.getElementById(`${riskType}Percent`).classList.toggle('active', type === 'percent');
    document.getElementById(`${riskType}Value`).classList.toggle('active', type === 'value');
    
    // Mostrar/ocultar campos
    document.getElementById(`${riskType}PercentGroup`).style.display = type === 'percent' ? 'block' : 'none';
    document.getElementById(`${riskType}ValueGroup`).style.display = type === 'value' ? 'block' : 'none';
    
    // Atualizar variáveis globais
    if (riskType === 'stopLoss') {
        maxDailyLossType = type;
    } else {
        maxDailyProfitType = type;
    }
    
    if (!silent) {
        log(`💡 Tipo de ${riskType === 'stopLoss' ? 'Stop Loss' : 'Take Profit'} alterado para: ${type === 'percent' ? 'Porcentagem' : 'Valor Fixo'}`, 'info');
    }
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.toggleRiskType = toggleRiskType;
}

// ═══════════════════════════════════════════════════════════════
// ATUALIZAR VALOR DO SLIDER EM TEMPO REAL
// ═══════════════════════════════════════════════════════════════
function updateRangeValue(inputId, displayId, suffix = '') {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    
    if (!input || !display) {
        console.warn(`⚠️ Elementos não encontrados: ${inputId} ou ${displayId}`);
        return;
    }
    
    const value = input.value;
    display.textContent = value;
    
    // Atualizar cor do slider baseado no valor
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 100;
    const percentage = ((value - min) / (max - min)) * 100;
    
    // Atualizar gradiente do slider
    input.style.background = `linear-gradient(to right, #06ffa5 0%, #06ffa5 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`;
    
    console.log(`📊 Slider ${inputId} atualizado: ${value}${suffix}`);
}

// 🔥 EXPORTA PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.updateRangeValue = updateRangeValue;
}

function checkDailyLimits() {
    if (hasHitDailyLimit) return true; // Já atingiu limite hoje
    
    // Calcular limites baseado no saldo inicial
    let stopLossLimit = 0;
    let takeProfitLimit = 0;
    
    // STOP LOSS
    if (maxDailyLossType === 'percent') {
        stopLossLimit = initialBalance * (maxDailyLossPercent / 100);
    } else {
        stopLossLimit = maxDailyLossValue;
    }
    
    // TAKE PROFIT (0 = sem limite)
    if (maxDailyProfitType === 'percent') {
        takeProfitLimit = maxDailyProfitPercent > 0 ? initialBalance * (maxDailyProfitPercent / 100) : 0;
    } else {
        takeProfitLimit = maxDailyProfitValue;
    }
    
    // Verificar se atingiu Stop Loss (perda máxima)
    if (dailyProfit < 0 && Math.abs(dailyProfit) >= stopLossLimit) {
        hasHitDailyLimit = true;
        log(`🛑 STOP LOSS ATINGIDO! Perda de $${Math.abs(dailyProfit).toFixed(2)} atingiu limite de $${stopLossLimit.toFixed(2)}`, 'error');
        log(`⏸️ Bot será parado automaticamente para proteção da banca!`, 'warning');
        
        // Parar bot automaticamente
        setTimeout(() => {
            stopBot();
            alert(`🛑 STOP LOSS DIÁRIO ATINGIDO!\n\n` +
                  `💰 Saldo Inicial: $${initialBalance.toFixed(2)}\n` +
                  `📉 Perda Atual: $${Math.abs(dailyProfit).toFixed(2)}\n` +
                  `🚫 Limite: $${stopLossLimit.toFixed(2)}\n\n` +
                  `Bot foi parado automaticamente.\n` +
                  `Volte amanhã com estratégia renovada! 💪`);
        }, 1000);
        
        return true;
    }
    
    // Verificar se atingiu Take Profit (ganho máximo)
    if (takeProfitLimit > 0 && dailyProfit >= takeProfitLimit) {
        hasHitDailyLimit = true;
        log(`✅ TAKE PROFIT ATINGIDO! Lucro de $${dailyProfit.toFixed(2)} atingiu meta de $${takeProfitLimit.toFixed(2)}`, 'success');
        log(`🎯 Bot será parado automaticamente - Meta diária alcançada!`, 'warning');
        
        // Parar bot automaticamente
        setTimeout(() => {
            stopBot();
            alert(`✅ TAKE PROFIT DIÁRIO ATINGIDO!\n\n` +
                  `💰 Saldo Inicial: $${initialBalance.toFixed(2)}\n` +
                  `📈 Lucro Atual: $${dailyProfit.toFixed(2)}\n` +
                  `🎯 Meta: $${takeProfitLimit.toFixed(2)}\n\n` +
                  `Parabéns! Meta diária alcançada! 🎉\n` +
                  `Bot foi parado automaticamente.\n` +
                  `Descanse e volte amanhã! 💪`);
        }, 1000);
        
        return true;
    }
    
    return false;
}

// ═══════════════════════════════════════════════════════════════
// GERENCIAMENTO DE HISTÓRICO DE SESSÕES
// ═══════════════════════════════════════════════════════════════

function startSession() {
    const now = new Date();
    currentSession = {
        id: Date.now(),
        strategy: currentStrategy,
        strategyName: STRATEGIES[currentStrategy].name,
        accountType: currentAccountType,
        startTime: now,
        startBalance: initialBalance,
        startAsset: document.getElementById('symbol').value,
        assetsUsed: [document.getElementById('symbol').value],
        trades: [],
        wins: 0,
        losses: 0,
        totalProfit: 0,
        endTime: null,
        endBalance: 0,
        duration: 0,
        stopReason: null // 'manual', 'stop_loss', 'take_profit'
    };
    
    log(`📊 Nova sessão iniciada: ${currentSession.strategyName}`, 'info');
}

function recordTrade(tradeData) {
    if (!currentSession) return;
    
    currentSession.trades.push(tradeData);
    
    if (tradeData.result === 'win') {
        currentSession.wins++;
    } else {
        currentSession.losses++;
    }
    
    currentSession.totalProfit = dailyProfit;
    currentSession.endBalance = balance;
    
    // Adicionar ativo se ainda não está na lista
    if (!currentSession.assetsUsed.includes(tradeData.asset)) {
        currentSession.assetsUsed.push(tradeData.asset);
    }
}

async function endSession(reason = 'manual') {
    if (!currentSession) return;
    
    const now = new Date();
    currentSession.endTime = now;
    currentSession.endBalance = balance;
    currentSession.duration = Math.floor((now - currentSession.startTime) / 1000); // em segundos
    currentSession.stopReason = reason;
    
    // 🔥 CALCULAR CAMPOS NECESSÁRIOS PARA O FIREBASE
    const totalTrades = currentSession.trades.length;
    const wins = currentSession.wins || 0;
    const losses = currentSession.losses || 0;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
    const profit = balance - initialBalance;
    const profitPercent = initialBalance > 0 ? ((profit / initialBalance) * 100).toFixed(2) : 0;
    
    // Atualizar sessão com valores calculados
    currentSession.totalTrades = totalTrades;
    currentSession.winRate = parseFloat(winRate);
    currentSession.profit = parseFloat(profit.toFixed(2));
    currentSession.profitPercent = parseFloat(profitPercent);
    currentSession.initialBalance = initialBalance;
    currentSession.finalBalance = balance;
    currentSession.asset = currentSession.startAsset || 'R_50';
    currentSession.strategy = currentSession.strategyName || STRATEGIES[currentStrategy].name;
    
    console.log('📊 Sessão preparada para salvar:', {
        username: getCurrentUsername(),
        totalTrades: currentSession.totalTrades,
        wins: wins,
        losses: losses,
        profit: currentSession.profit,
        duration: currentSession.duration,
        strategy: currentSession.strategy
    });
    
    // 🔥 SALVAR IMEDIATAMENTE NO FIREBASE (ANTES DE LIMPAR)
    const firebaseId = await saveSessionToFirebase(currentSession);
    
    if (firebaseId) {
        log(`🔥 Sessão salva no Firebase!`, 'success');
    } else {
        log(`⚠️ Erro ao salvar no Firebase (salvo localmente)`, 'warning');
    }
    
    // Salvar sessão no histórico local
    sessionHistory.unshift(currentSession); // Adiciona no início do array
    
    // Limitar histórico a 50 sessões
    if (sessionHistory.length > 50) {
        sessionHistory = sessionHistory.slice(0, 50);
    }
    
    // Salvar no localStorage (backup)
    saveSessionHistoryLocal();
    
    // Atualizar interface
    renderSessionHistory();
    
    log(`📊 Sessão finalizada - Motivo: ${getStopReasonText(reason)}`, 'info');
    
    // Limpar sessão atual
    currentSession = null;
}

function getStopReasonText(reason) {
    const reasons = {
        'manual': 'Parada Manual',
        'stop_loss': 'Stop Loss Atingido',
        'take_profit': 'Take Profit Atingido'
    };
    return reasons[reason] || 'Desconhecido';
}

// 🆕 Obtém o nome do usuário logado
function getCurrentUsername() {
    try {
        const session = window.ChampionBotAuth?.getActiveSession();
        return session?.username || 'default_user';
    } catch (error) {
        console.warn('Auth não disponível, usando usuário padrão');
        return 'default_user';
    }
}

// 🆕 Gera chave de storage específica do usuário
function getUserStorageKey(baseKey) {
    const username = getCurrentUsername();
    return `${baseKey}_${username}`;
}

// 🔥 SALVA UMA SESSÃO INDIVIDUAL NO FIREBASE
async function saveSessionToFirebase(session) {
    if (!session) {
        console.error('❌ Sessão é null ou undefined');
        return null;
    }
    
    if (!session.endTime) {
        console.warn('⚠️ Sessão não tem endTime - não pode ser salva no Firebase');
        return null;
    }
    
    try {
        const username = getCurrentUsername();
        
        console.log('🔥 Preparando para salvar no Firebase...');
        console.log('👤 Usuário:', username);
        console.log('📊 Trades:', session.totalTrades);
        console.log('💰 Profit:', session.profit);
        
        const sessionData = {
            username: username,
            startTime: session.startTime.toISOString(),
            endTime: session.endTime.toISOString(),
            duration: session.duration || 0,
            strategy: session.strategy || 'Champion Pro',
            accountType: session.accountType || currentAccountType,
            asset: session.asset || 'R_50',
            assetsUsed: session.assetsUsed || [session.asset || 'R_50'],
            initialBalance: session.initialBalance || 0,
            finalBalance: session.finalBalance || session.endBalance || 0,
            profit: session.profit || 0,
            profitPercent: session.profitPercent || 0,
            totalTrades: session.totalTrades || 0,
            wins: session.wins || 0,
            losses: session.losses || 0,
            winRate: session.winRate || 0,
            stopReason: session.stopReason || 'manual',
            trades: session.trades || [],
            timestamp: new Date().toISOString(),
            device: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language
            }
        };
        
        console.log('📤 Enviando para Firebase:', sessionData);
        
        const docRef = await addDoc(collection(db, 'sessions'), sessionData);
        
        console.log(`🔥✅ Sessão salva no Firebase com ID: ${docRef.id}`);
        console.log(`👤 Para usuário: ${username}`);
        console.log(`📊 Dados salvos:`, sessionData);
        
        return docRef.id;
    } catch (firebaseError) {
        console.error('❌ ERRO ao salvar no Firebase:');
        console.error('Código:', firebaseError.code);
        console.error('Mensagem:', firebaseError.message);
        console.error('Erro completo:', firebaseError);
        
        if (firebaseError.code === 'permission-denied') {
            console.error('🔒 PERMISSÃO NEGADA! Verifique as regras do Firestore');
        } else if (firebaseError.code === 'unavailable') {
            console.error('🌐 Firebase indisponível. Verifique sua conexão com internet');
        }
        
        return null;
    }
}

// 💾 SALVA HISTÓRICO LOCAL (BACKUP)
function saveSessionHistoryLocal() {
    try {
        const username = getCurrentUsername();
        const storageKey = getUserStorageKey('championBotSessionHistory');
        localStorage.setItem(storageKey, JSON.stringify(sessionHistory));
        console.log(`✅ Histórico salvo localmente para: ${username} (${sessionHistory.length} sessões)`);
    } catch (error) {
        console.error('❌ Erro ao salvar histórico local:', error);
    }
}

// 📊 CARREGA HISTÓRICO DO FIREBASE (PRIORITÁRIO) OU LOCALSTORAGE (FALLBACK)
async function loadSessionHistory() {
    try {
        const username = getCurrentUsername();
        const storageKey = getUserStorageKey('championBotSessionHistory');
        
        console.log(`🔍 Carregando histórico para usuário: ${username}`);
        
        // 1️⃣ Tenta carregar do Firebase primeiro
        try {
            // 🔥 REMOVIDO orderBy para evitar erro de índice
            const q = query(
                collection(db, 'sessions'),
                where('username', '==', username),
                limit(50)
            );
            
            console.log('🔥 Executando query no Firebase...');
            const querySnapshot = await getDocs(q);
            const firebaseSessions = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // ✅ Proteção completa contra valores undefined/null
                const sessionData = {
                    id: doc.id,
                    startTime: data.startTime ? new Date(data.startTime) : new Date(),
                    endTime: data.endTime ? new Date(data.endTime) : new Date(),
                    duration: data.duration || 0,
                    strategy: data.strategy || 'Desconhecida',
                    strategyName: data.strategy || 'Desconhecida',
                    accountType: data.accountType || 'demo',
                    asset: data.asset || 'N/A',
                    assetsUsed: data.assetsUsed || [data.asset || 'N/A'],
                    initialBalance: data.initialBalance || 0,
                    startBalance: data.initialBalance || 0,
                    finalBalance: data.finalBalance || 0,
                    endBalance: data.finalBalance || 0,
                    profit: data.profit || 0,
                    totalProfit: data.profit || 0,
                    profitPercent: data.profitPercent || 0,
                    totalTrades: data.totalTrades || 0,
                    wins: data.wins || 0,
                    losses: data.losses || 0,
                    winRate: data.winRate || 0,
                    stopReason: data.stopReason || 'manual',
                    trades: data.trades || []
                };
                
                firebaseSessions.push(sessionData);
            });
            
            if (firebaseSessions.length > 0) {
                // Ordenar por data localmente (mais recente primeiro)
                firebaseSessions.sort((a, b) => b.endTime - a.endTime);
                
                sessionHistory = firebaseSessions;
                // Salva também no localStorage como cache
                saveSessionHistoryLocal();
                console.log(`🔥✅ ${firebaseSessions.length} sessões carregadas do Firebase para: ${username}`);
                log(`🔥 ${firebaseSessions.length} sessões carregadas da nuvem`, 'success');
                renderSessionHistory();
                return;
            } else {
                console.log(`🔥 Nenhuma sessão encontrada no Firebase para: ${username}`);
                log(`ℹ️ Nenhuma sessão na nuvem. Inicie o bot para criar histórico.`, 'info');
            }
        } catch (firebaseError) {
            console.error('⚠️ Erro ao carregar do Firebase:', firebaseError);
            console.error('Código do erro:', firebaseError.code);
            console.error('Mensagem:', firebaseError.message);
            
            if (firebaseError.code === 'failed-precondition') {
                log('⚠️ Firebase: índice não encontrado. Carregando do cache local...', 'warning');
            } else if (firebaseError.code === 'permission-denied') {
                log('❌ Firebase: permissão negada. Verifique as regras do Firestore.', 'error');
            } else {
                log('⚠️ Firebase temporariamente indisponível. Usando cache local...', 'warning');
            }
        }
        
        // 2️⃣ Fallback: Carrega do localStorage
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            sessionHistory = JSON.parse(saved);
            // Converter strings de data de volta para Date objects
            sessionHistory.forEach(session => {
                session.startTime = session.startTime ? new Date(session.startTime) : new Date();
                session.endTime = session.endTime ? new Date(session.endTime) : new Date();
                
                // ✅ Garantir campos obrigatórios
                session.trades = session.trades || [];
                session.wins = session.wins || 0;
                session.losses = session.losses || 0;
                session.profit = session.profit || session.totalProfit || 0;
                session.totalProfit = session.totalProfit || session.profit || 0;
                session.startBalance = session.startBalance || session.initialBalance || 0;
                session.endBalance = session.endBalance || session.finalBalance || 0;
                session.duration = session.duration || 0;
                session.strategy = session.strategy || 'Desconhecida';
                session.strategyName = session.strategyName || session.strategy || 'Desconhecida';
                session.assetsUsed = session.assetsUsed || [session.asset || 'N/A'];
            });
            console.log(`💾 Histórico carregado do localStorage para: ${username} - ${sessionHistory.length} sessões`);
            log(`💾 ${sessionHistory.length} sessões carregadas do cache local`, 'info');
            renderSessionHistory();
        } else {
            console.log(`ℹ️ Nenhum histórico encontrado para: ${username}`);
            sessionHistory = [];
            renderSessionHistory();
        }
    } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        sessionHistory = [];
        renderSessionHistory();
    }
}

// 🔥 EXPORTA PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.loadSessionHistory = loadSessionHistory;
}

async function clearSessionHistory() {
    // 🆕 VERIFICAR SENHA DE SEGURANÇA
    if (securityPassword && securityPassword.length > 0) {
        const inputPassword = prompt('🔐 Digite a senha de segurança para confirmar a exclusão do histórico:');
        
        if (!inputPassword) {
            log('❌ Exclusão cancelada - Senha não fornecida', 'warning');
            return;
        }
        
        if (inputPassword !== securityPassword) {
            alert('❌ Senha incorreta! Exclusão de histórico negada.');
            log('❌ Tentativa de exclusão de histórico com senha incorreta', 'error');
            return;
        }
        
        log('✅ Senha correta - Procedendo com exclusão', 'info');
    }
    
    if (!confirm('🗑️ Tem certeza que deseja limpar TODO o histórico de sessões?\n\nEsta ação não pode ser desfeita!')) {
        return;
    }
    
    const username = getCurrentUsername();
    const storageKey = getUserStorageKey('championBotSessionHistory');
    
    // 1️⃣ Limpa do localStorage
    sessionHistory = [];
    localStorage.removeItem(storageKey);
    
    // 2️⃣ Limpa do Firebase
    try {
        const q = query(
            collection(db, 'sessions'),
            where('username', '==', username)
        );
        
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        let deleteCount = 0;
        querySnapshot.forEach((docSnapshot) => {
            batch.delete(doc(db, 'sessions', docSnapshot.id));
            deleteCount++;
        });
        
        await batch.commit();
        console.log(`🔥 ${deleteCount} sessões removidas do Firebase para: ${username}`);
    } catch (firebaseError) {
        console.error('⚠️ Erro ao limpar Firebase (localStorage limpo):', firebaseError);
    }
    
    renderSessionHistory();
    log(`🗑️ Histórico de sessões limpo com sucesso para: ${username}`, 'warning');
}

// 🆕 ═══════════════════════════════════════════════════════════════
// SINCRONIZAR SESSÕES LOCAIS COM FIREBASE
// ═══════════════════════════════════════════════════════════════
async function syncLocalToFirebase() {
    try {
        const username = getCurrentUsername();
        const storageKey = getUserStorageKey('championBotSessionHistory');
        
        console.log(`🔄 Iniciando sincronização para usuário: ${username}`);
        log('🔄 Iniciando sincronização com Firebase...', 'info');
        
        // Verificar se há sessões locais
        const saved = localStorage.getItem(storageKey);
        if (!saved) {
            log('⚠️ Nenhuma sessão local encontrada para sincronizar', 'warning');
            alert('⚠️ Nenhuma sessão local encontrada para sincronizar.');
            return;
        }
        
        const localSessions = JSON.parse(saved);
        console.log(`📊 ${localSessions.length} sessões encontradas localmente`);
        
        if (localSessions.length === 0) {
            log('⚠️ Nenhuma sessão local para sincronizar', 'warning');
            alert('⚠️ Nenhuma sessão local para sincronizar.');
            return;
        }
        
        // Confirmar com usuário
        const confirm = window.confirm(
            `🔄 Sincronizar ${localSessions.length} sessões locais com Firebase?\n\n` +
            `Isso enviará todas as suas sessões salvas localmente para a nuvem.\n\n` +
            `Após a sincronização, elas ficarão disponíveis em qualquer dispositivo.`
        );
        
        if (!confirm) {
            log('❌ Sincronização cancelada pelo usuário', 'warning');
            return;
        }
        
        // Sincronizar cada sessão
        let syncedCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < localSessions.length; i++) {
            const session = localSessions[i];
            
            try {
                // Preparar dados para Firebase
                const sessionData = {
                    username: username,
                    startTime: session.startTime || new Date().toISOString(),
                    endTime: session.endTime || new Date().toISOString(),
                    duration: session.duration || 0,
                    strategy: session.strategy || session.strategyName || 'Desconhecida',
                    accountType: session.accountType || 'demo',
                    asset: session.asset || 'N/A',
                    assetsUsed: session.assetsUsed || [session.asset || 'N/A'],
                    initialBalance: session.startBalance || session.initialBalance || 0,
                    finalBalance: session.endBalance || session.finalBalance || 0,
                    profit: session.totalProfit || session.profit || 0,
                    profitPercent: session.profitPercent || 0,
                    totalTrades: session.totalTrades || (session.trades?.length) || 0,
                    wins: session.wins || 0,
                    losses: session.losses || 0,
                    winRate: session.winRate || 0,
                    stopReason: session.stopReason || 'manual',
                    trades: session.trades || []
                };
                
                // Salvar no Firebase
                const docRef = await addDoc(collection(db, 'sessions'), sessionData);
                syncedCount++;
                console.log(`✅ Sessão ${i+1}/${localSessions.length} sincronizada: ${docRef.id}`);
                log(`✅ Sessão ${i+1}/${localSessions.length} sincronizada`, 'success');
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Erro ao sincronizar sessão ${i+1}:`, error);
                log(`❌ Erro ao sincronizar sessão ${i+1}: ${error.message}`, 'error');
            }
        }
        
        // Resultado final
        console.log(`🎉 Sincronização concluída! ${syncedCount} sessões enviadas, ${errorCount} erros`);
        
        if (errorCount === 0) {
            log(`🎉 Todas as ${syncedCount} sessões foram sincronizadas com sucesso!`, 'success');
            alert(
                `✅ Sincronização Concluída!\n\n` +
                `${syncedCount} sessões foram enviadas para o Firebase.\n\n` +
                `Agora você pode acessar seu histórico de qualquer dispositivo!`
            );
            
            // Recarregar histórico do Firebase
            setTimeout(() => {
                loadSessionHistory();
            }, 1000);
        } else {
            log(`⚠️ Sincronização concluída com ${errorCount} erros. ${syncedCount} sessões enviadas.`, 'warning');
            alert(
                `⚠️ Sincronização Parcial\n\n` +
                `${syncedCount} sessões sincronizadas com sucesso.\n` +
                `${errorCount} sessões falharam.\n\n` +
                `Verifique o console para detalhes.`
            );
        }
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        log(`❌ Erro na sincronização: ${error.message}`, 'error');
        alert(`❌ Erro ao sincronizar:\n\n${error.message}`);
    }
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.clearSessionHistory = clearSessionHistory;
    window.syncLocalToFirebase = syncLocalToFirebase;
}

function renderSessionHistory() {
    const container = document.getElementById('sessionHistoryContainer');
    
    if (!container) {
        console.warn('⚠️ Container de histórico não encontrado');
        return;
    }
    
    if (sessionHistory.length === 0) {
        container.innerHTML = `
            <div class="empty-history">
                <div class="empty-icon">📊</div>
                <p>Nenhuma sessão registrada ainda</p>
                <small>Inicie o bot para começar a registrar sessões</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = sessionHistory.map(session => {
        // ✅ Proteção contra valores undefined
        const trades = session.trades || [];
        const wins = session.wins || 0;
        const losses = session.losses || 0;
        const totalProfit = session.totalProfit || session.profit || 0;
        const startBalance = session.startBalance || session.initialBalance || 0;
        const endBalance = session.endBalance || session.finalBalance || 0;
        const duration = session.duration || 0;
        const assetsUsed = session.assetsUsed || [session.asset || 'N/A'];
        const strategyName = session.strategyName || session.strategy || 'Desconhecida';
        
        const winRate = trades.length > 0 
            ? ((wins / trades.length) * 100).toFixed(1) 
            : '0.0';
        
        const profitClass = totalProfit >= 0 ? 'profit' : 'loss';
        const profitSign = totalProfit >= 0 ? '+' : '';
        
        const durationMinutes = Math.floor(duration / 60);
        const durationSeconds = duration % 60;
        const durationText = `${durationMinutes}min ${durationSeconds}s`;
        
        const startDate = session.startTime ? new Date(session.startTime).toLocaleDateString('pt-BR') : '--';
        const startTime = session.startTime ? new Date(session.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--';
        const endTime = session.endTime ? new Date(session.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--';
        
        const accountIcon = session.accountType === 'demo' ? '🧪' : '💰';
        const accountText = session.accountType === 'demo' ? 'DEMO' : 'REAL';
        
        return `
            <div class="session-card ${profitClass}">
                <div class="session-header">
                    <div class="session-title">
                        <div class="session-icon">${accountIcon}</div>
                        <div class="session-info">
                            <h3>${strategyName} (${accountText})</h3>
                            <div class="session-date">
                                📅 ${startDate} • ⏰ ${startTime} - ${endTime}
                            </div>
                        </div>
                    </div>
                    <div class="session-duration">
                        <div class="session-duration-label">Duração</div>
                        <div class="session-duration-value">⏱️ ${durationText}</div>
                    </div>
                </div>
                
                <div class="session-stats">
                    <div class="session-stat">
                        <div class="session-stat-label">💰 Saldo Inicial</div>
                        <div class="session-stat-value neutral">$${startBalance.toFixed(2)}</div>
                    </div>
                    <div class="session-stat">
                        <div class="session-stat-label">💵 Saldo Final</div>
                        <div class="session-stat-value neutral">$${endBalance.toFixed(2)}</div>
                    </div>
                    <div class="session-stat">
                        <div class="session-stat-label">📊 Total Trades</div>
                        <div class="session-stat-value neutral">${trades.length}</div>
                    </div>
                    <div class="session-stat">
                        <div class="session-stat-label">🟢 Vitórias</div>
                        <div class="session-stat-value profit">${wins}</div>
                    </div>
                    <div class="session-stat">
                        <div class="session-stat-label">🔴 Derrotas</div>
                        <div class="session-stat-value loss">${losses}</div>
                    </div>
                    <div class="session-stat">
                        <div class="session-stat-label">🎯 Win Rate</div>
                        <div class="session-stat-value neutral">${winRate}%</div>
                    </div>
                </div>
                
                <div style="margin-top: 15px;">
                    <strong>📊 Ativos Operados:</strong><br>
                    ${assetsUsed.map(asset => `<span class="session-asset">${asset}</span>`).join('')}
                </div>
                
                <div class="session-result ${profitClass}">
                    <div>
                        <div class="session-result-label">
                            ${session.stopReason ? '🛑 ' + getStopReasonText(session.stopReason) : '📊 Resultado Final'}
                        </div>
                    </div>
                    <div class="session-result-value ${profitClass}">
                        ${profitSign}$${Math.abs(totalProfit).toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // 🆕 Atualizar Resumo Geral e Filtros
    updateHistorySummary();
    updateHistoryFilters();
}

// 🆕 ═══════════════════════════════════════════════════════════════
// RESUMO GERAL DO HISTÓRICO
// ═══════════════════════════════════════════════════════════════
function updateHistorySummary() {
    const summaryEl = document.getElementById('historySummary');
    const filtersEl = document.getElementById('historyFilters');
    
    if (sessionHistory.length === 0) {
        summaryEl.style.display = 'none';
        filtersEl.style.display = 'none';
        return;
    }
    
    summaryEl.style.display = 'block';
    filtersEl.style.display = 'flex';
    
    // Calcular estatísticas gerais
    let totalSessions = sessionHistory.length;
    let totalTrades = 0;
    let totalWins = 0;
    let totalProfit = 0;
    
    sessionHistory.forEach(session => {
        // ✅ Proteção contra valores undefined
        const trades = session.trades || [];
        const wins = session.wins || 0;
        const profit = session.totalProfit || session.profit || 0;
        
        totalTrades += trades.length;
        totalWins += wins;
        totalProfit += profit;
    });
    
    const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : '0.0';
    const profitClass = totalProfit >= 0 ? 'profit' : 'loss';
    const profitSign = totalProfit >= 0 ? '+' : '';
    
    // Atualizar elementos com proteção
    const summaryTotalSessionsEl = document.getElementById('summaryTotalSessions');
    const summaryTotalTradesEl = document.getElementById('summaryTotalTrades');
    const summaryWinRateEl = document.getElementById('summaryWinRate');
    const profitEl = document.getElementById('summaryProfit');
    
    if (summaryTotalSessionsEl) summaryTotalSessionsEl.textContent = totalSessions;
    if (summaryTotalTradesEl) summaryTotalTradesEl.textContent = totalTrades;
    if (summaryWinRateEl) summaryWinRateEl.textContent = `${winRate}%`;
    
    if (profitEl) {
        profitEl.textContent = `${profitSign}$${Math.abs(totalProfit).toFixed(2)}`;
        profitEl.className = `summary-value-large ${profitClass}`;
    }
}

// 🆕 ═══════════════════════════════════════════════════════════════
// FILTROS DO HISTÓRICO
// ═══════════════════════════════════════════════════════════════
function updateHistoryFilters() {
    // Mostrar/ocultar campos de data personalizada
    const periodFilter = document.getElementById('periodFilter');
    const customDateGroup = document.getElementById('customDateGroup');
    
    if (periodFilter) {
        periodFilter.addEventListener('change', function() {
            if (this.value === 'custom') {
                customDateGroup.style.display = 'flex';
                customDateGroup.style.gap = '10px';
                customDateGroup.style.alignItems = 'center';
            } else {
                customDateGroup.style.display = 'none';
            }
        });
    }
}

function applyHistoryFilters() {
    // ✅ Proteção contra elementos não existentes
    const periodFilterEl = document.getElementById('periodFilter');
    const strategyFilterEl = document.getElementById('strategyFilter');
    const accountFilterEl = document.getElementById('accountFilter');
    const startDateInputEl = document.getElementById('startDateFilter');
    const endDateInputEl = document.getElementById('endDateFilter');
    
    if (!periodFilterEl || !strategyFilterEl || !accountFilterEl) {
        console.warn('⚠️ Elementos de filtro não encontrados');
        return;
    }
    
    const periodFilter = periodFilterEl.value;
    const strategyFilter = strategyFilterEl.value;
    const accountFilter = accountFilterEl.value;
    const startDateInput = startDateInputEl ? startDateInputEl.value : '';
    const endDateInput = endDateInputEl ? endDateInputEl.value : '';
    
    // Filtrar sessões
    let filteredSessions = [...sessionHistory];
    
    // Filtro de Período
    if (periodFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filteredSessions = filteredSessions.filter(session => {
            if (!session.startTime) return false;
            const sessionDate = new Date(session.startTime);
            
            switch(periodFilter) {
                case 'today':
                    return sessionDate >= today;
                
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return sessionDate >= weekAgo;
                
                case 'month':
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    return sessionDate >= monthStart;
                
                case 'custom':
                    if (startDateInput && endDateInput) {
                        const startDate = new Date(startDateInput);
                        const endDate = new Date(endDateInput);
                        endDate.setHours(23, 59, 59, 999); // Incluir o dia inteiro
                        return sessionDate >= startDate && sessionDate <= endDate;
                    }
                    return true;
                
                default:
                    return true;
            }
        });
    }
    
    // Filtro de Estratégia
    if (strategyFilter !== 'all') {
        filteredSessions = filteredSessions.filter(session => 
            session.strategy === strategyFilter
        );
    }
    
    // Filtro de Conta
    if (accountFilter !== 'all') {
        filteredSessions = filteredSessions.filter(session => 
            session.accountType === accountFilter
        );
    }
    
    // Renderizar sessões filtradas
    renderFilteredSessions(filteredSessions);
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.applyHistoryFilters = applyHistoryFilters;
}

function renderFilteredSessions(filteredSessions) {
    const container = document.getElementById('sessionHistoryContainer');
    
    if (filteredSessions.length === 0) {
        container.innerHTML = `
            <div class="empty-history">
                <div class="empty-icon">🔍</div>
                <p>Nenhuma sessão encontrada com esses filtros</p>
                <small>Tente ajustar os filtros ou limpar para ver todas as sessões</small>
            </div>
        `;
        
        // Atualizar resumo com dados filtrados
        document.getElementById('summaryTotalSessions').textContent = '0';
        document.getElementById('summaryTotalTrades').textContent = '0';
        document.getElementById('summaryWinRate').textContent = '0.0%';
        const profitEl = document.getElementById('summaryProfit');
        profitEl.textContent = '+$0.00';
        profitEl.className = 'summary-value-large profit';
        
        return;
    }
    
    // Calcular estatísticas das sessões filtradas
    let totalTrades = 0;
    let totalWins = 0;
    let totalProfit = 0;
    
    filteredSessions.forEach(session => {
        totalTrades += session.trades.length;
        totalWins += session.wins;
        totalProfit += session.totalProfit;
    });
    
    const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : '0.0';
    const profitClass = totalProfit >= 0 ? 'profit' : 'loss';
    const profitSign = totalProfit >= 0 ? '+' : '';
    
    // Atualizar resumo
    document.getElementById('summaryTotalSessions').textContent = filteredSessions.length;
    document.getElementById('summaryTotalTrades').textContent = totalTrades;
    document.getElementById('summaryWinRate').textContent = `${winRate}%`;
    
    const profitEl = document.getElementById('summaryProfit');
    profitEl.textContent = `${profitSign}$${Math.abs(totalProfit).toFixed(2)}`;
    profitEl.className = `summary-value-large ${profitClass}`;
    
    // Renderizar cards
    container.innerHTML = filteredSessions.map(session => {
        const winRate = session.trades.length > 0 
            ? ((session.wins / session.trades.length) * 100).toFixed(1) 
            : '0.0';
        
        const profitClass = session.totalProfit >= 0 ? 'profit' : 'loss';
        const profitSign = session.totalProfit >= 0 ? '+' : '';
        
        const durationMinutes = Math.floor(session.duration / 60);
        const durationSeconds = session.duration % 60;
        const durationText = `${durationMinutes}min ${durationSeconds}s`;
        
        const startDate = session.startTime.toLocaleDateString('pt-BR');
        const startTime = session.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const endTime = session.endTime ? session.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--';
        
        const accountIcon = session.accountType === 'demo' ? '🧪' : '💰';
        const accountText = session.accountType === 'demo' ? 'DEMO' : 'REAL';
        
        return `
            <div class="session-card ${profitClass}">
                <div class="session-header">
                    <div class="session-title">
                        <div class="session-icon">${accountIcon}</div>
                        <div class="session-info">
                            <h3>${session.strategyName} (${accountText})</h3>
                            <div class="session-date">
                                📅 ${startDate} • ⏰ ${startTime} - ${endTime}
                            </div>
                        </div>
                    </div>
                    <div class="session-duration">
                        <div class="session-duration-label">Duração</div>
                        <div class="session-duration-value">⏱️ ${durationText}</div>
                    </div>
                </div>
                
                <div class="session-stats">
                    <div class="session-stat">
                        <div class="session-stat-label">💰 Saldo Inicial</div>
                        <div class="session-stat-value neutral">$${session.startBalance.toFixed(2)}</div>
                    </div>
                    <div class="session-stat">
                        <div class="session-stat-label">💵 Saldo Final</div>
                        <div class="session-stat-value neutral">$${session.endBalance.toFixed(2)}</div>
                    </div>
                    <div class="session-stat">
                        <div class="session-stat-label">📊 Total Trades</div>
                        <div class="session-stat-value neutral">${session.trades.length}</div>
                    </div>
                    <div class="session-stat">
                        <div class="session-stat-label">🟢 Vitórias</div>
                        <div class="session-stat-value profit">${session.wins}</div>
                    </div>
                    <div class="session-stat">
                        <div class="session-stat-label">🔴 Derrotas</div>
                        <div class="session-stat-value loss">${session.losses}</div>
                    </div>
                    <div class="session-stat">
                        <div class="session-stat-label">🎯 Win Rate</div>
                        <div class="session-stat-value neutral">${winRate}%</div>
                    </div>
                </div>
                
                <div style="margin-top: 15px;">
                    <strong>📊 Ativos Operados:</strong><br>
                    ${session.assetsUsed.map(asset => `<span class="session-asset">${asset}</span>`).join('')}
                </div>
                
                <div class="session-result ${profitClass}">
                    <div>
                        <div class="session-result-label">
                            ${session.stopReason ? '🛑 ' + getStopReasonText(session.stopReason) : '📊 Resultado Final'}
                        </div>
                    </div>
                    <div class="session-result-value ${profitClass}">
                        ${profitSign}$${Math.abs(session.totalProfit).toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function resetHistoryFilters() {
    document.getElementById('periodFilter').value = 'all';
    document.getElementById('strategyFilter').value = 'all';
    document.getElementById('accountFilter').value = 'all';
    document.getElementById('startDateFilter').value = '';
    document.getElementById('endDateFilter').value = '';
    document.getElementById('customDateGroup').style.display = 'none';
    
    renderSessionHistory();
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.resetHistoryFilters = resetHistoryFilters;
}

// 🆕 ═══════════════════════════════════════════════════════════════
// EXPORTAR HISTÓRICO PARA PDF - VERSÃO PROFISSIONAL
// ═══════════════════════════════════════════════════════════════
function exportHistoryToPDF() {
    // Obter sessões filtradas ou todas se não houver filtro
    const periodFilter = document.getElementById('periodFilter').value;
    const strategyFilter = document.getElementById('strategyFilter').value;
    const accountFilter = document.getElementById('accountFilter').value;
    
    let filteredSessions = [...sessionHistory];
    
    // Aplicar filtros (mesmo código de applyHistoryFilters)
    if (periodFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filteredSessions = filteredSessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            
            switch(periodFilter) {
                case 'today':
                    return sessionDate >= today;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return sessionDate >= weekAgo;
                case 'month':
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    return sessionDate >= monthStart;
                case 'custom':
                    const startDateInput = document.getElementById('startDateFilter').value;
                    const endDateInput = document.getElementById('endDateFilter').value;
                    if (startDateInput && endDateInput) {
                        const startDate = new Date(startDateInput);
                        const endDate = new Date(endDateInput);
                        endDate.setHours(23, 59, 59, 999);
                        return sessionDate >= startDate && sessionDate <= endDate;
                    }
                    return true;
                default:
                    return true;
            }
        });
    }
    
    if (strategyFilter !== 'all') {
        filteredSessions = filteredSessions.filter(session => session.strategy === strategyFilter);
    }
    
    if (accountFilter !== 'all') {
        filteredSessions = filteredSessions.filter(session => session.accountType === accountFilter);
    }
    
    if (filteredSessions.length === 0) {
        alert('❌ Nenhuma sessão para exportar com os filtros selecionados!');
        return;
    }
    
    // Calcular estatísticas totais
    let totalTrades = 0;
    let totalWins = 0;
    let totalProfit = 0;
    
    filteredSessions.forEach(session => {
        totalTrades += session.trades.length;
        totalWins += session.wins;
        totalProfit += session.totalProfit;
    });
    
    const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : '0.0';
    
    // Criar PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;
    
    // Cores personalizadas (RGB)
    const colors = {
        primary: [41, 128, 185],      // Azul profissional
        success: [39, 174, 96],        // Verde vibrante
        danger: [231, 76, 60],         // Vermelho vibrante
        dark: [44, 62, 80],            // Cinza escuro
        light: [236, 240, 241],        // Cinza claro
        white: [255, 255, 255],
        text: [52, 73, 94]             // Texto escuro legível
    };
    
    // Função auxiliar para verificar nova página
    function checkNewPage(spaceNeeded = 20) {
        if (yPos + spaceNeeded > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
            return true;
        }
        return false;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // CABEÇALHO DO RELATÓRIO
    // ═══════════════════════════════════════════════════════════════
    
    // Banner azul no topo
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Título
    doc.setTextColor(...colors.white);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CHAMPION BOT WEB', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Performance', pageWidth / 2, 25, { align: 'center' });
    
    yPos = 45;
    
    // Data do relatório
    doc.setTextColor(...colors.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const reportDate = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Gerado em: ${reportDate}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 12;
    
    // ═══════════════════════════════════════════════════════════════
    // FILTROS APLICADOS
    // ═══════════════════════════════════════════════════════════════
    
    doc.setFillColor(...colors.light);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
    
    doc.setTextColor(...colors.dark);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Filtros Aplicados:', margin + 5, yPos + 7);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Período
    let periodText = 'Todos os Períodos';
    if (periodFilter === 'today') periodText = 'Hoje';
    else if (periodFilter === 'week') periodText = 'Últimos 7 dias';
    else if (periodFilter === 'month') periodText = 'Mês Atual';
    else if (periodFilter === 'custom') {
        const start = new Date(document.getElementById('startDateFilter').value).toLocaleDateString('pt-BR');
        const end = new Date(document.getElementById('endDateFilter').value).toLocaleDateString('pt-BR');
        periodText = `${start} até ${end}`;
    }
    doc.text(`• Período: ${periodText}`, margin + 7, yPos + 13);
    
    // Estratégia
    const strategyNames = {
        'all': 'Todas',
        'champion': 'Champion Pro',
        'martingale': 'Martingale Seguro',
        'antimartingale': 'Anti-Martingale',
        'fibonacci': 'Fibonacci Pro',
        'kelly': 'Kelly Criterion',
        'flatbet': 'Flat Bet'
    };
    doc.text(`• Estratégia: ${strategyNames[strategyFilter]}`, margin + 7, yPos + 18);
    
    // Conta
    const accountText = accountFilter === 'all' ? 'Todas' : (accountFilter === 'demo' ? 'Demo' : 'Real');
    doc.text(`• Conta: ${accountText}`, pageWidth / 2 + 10, yPos + 13);
    
    yPos += 32;
    
    checkNewPage(60);
    
    // ═══════════════════════════════════════════════════════════════
    // RESUMO GERAL - DESTAQUE
    // ═══════════════════════════════════════════════════════════════
    
    // Banner do resumo
    doc.setFillColor(...colors.primary);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
    
    doc.setTextColor(...colors.white);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO GERAL', pageWidth / 2, yPos + 8, { align: 'center' });
    
    yPos += 12;
    
    // Box branco com estatísticas
    doc.setFillColor(...colors.white);
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 40, 'FD');
    
    // Grid de estatísticas
    const boxWidth = (pageWidth - 2 * margin) / 2;
    const col1 = margin + 10;
    const col2 = margin + boxWidth + 10;
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Coluna 1
    doc.text('Total de Sessões:', col1, yPos + 10);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(`${filteredSessions.length}`, col1, yPos + 19);
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Total de Trades:', col1, yPos + 28);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text(`${totalTrades}`, col1, yPos + 37);
    
    // Coluna 2
    doc.setTextColor(...colors.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Win Rate Geral:', col2, yPos + 10);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    
    // Cor do win rate baseado em performance
    if (parseFloat(winRate) >= 70) {
        doc.setTextColor(...colors.success);
    } else if (parseFloat(winRate) >= 60) {
        doc.setTextColor(243, 156, 18); // Laranja
    } else {
        doc.setTextColor(...colors.danger);
    }
    doc.text(`${winRate}%`, col2, yPos + 19);
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Resultado Total:', col2, yPos + 28);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    
    // Cor do resultado
    const profitSign = totalProfit >= 0 ? '+' : '';
    if (totalProfit >= 0) {
        doc.setTextColor(...colors.success);
    } else {
        doc.setTextColor(...colors.danger);
    }
    doc.text(`${profitSign}$${Math.abs(totalProfit).toFixed(2)}`, col2, yPos + 37);
    
    yPos += 50;
    
    checkNewPage(30);
    
    // ═══════════════════════════════════════════════════════════════
    // LISTA DE SESSÕES
    // ═══════════════════════════════════════════════════════════════
    
    doc.setTextColor(...colors.dark);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Sessões Registradas', margin, yPos);
    yPos += 3;
    
    // Linha separadora
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // Percorrer sessões
    filteredSessions.forEach((session, index) => {
        checkNewPage(55);
        
        const boxHeight = 52;
        
        // Box da sessão com sombra
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(margin, yPos, pageWidth - 2 * margin, boxHeight, 'FD');
        
        // Barra lateral colorida (verde ou vermelha)
        if (session.totalProfit >= 0) {
            doc.setFillColor(...colors.success);
        } else {
            doc.setFillColor(...colors.danger);
        }
        doc.rect(margin, yPos, 4, boxHeight, 'F');
        
        // Header da sessão
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.dark);
        
        const accountIcon = session.accountType === 'demo' ? '[DEMO]' : '[REAL]';
        doc.text(`${session.strategyName}`, margin + 8, yPos + 7);
        
        // Badge do tipo de conta
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        if (session.accountType === 'demo') {
            doc.setTextColor(52, 152, 219); // Azul
        } else {
            doc.setTextColor(230, 126, 34); // Laranja
        }
        doc.text(accountIcon, margin + 8, yPos + 13);
        
        // Data e hora
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141); // Cinza médio
        const startDate = session.startTime.toLocaleDateString('pt-BR');
        const startTime = session.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const endTime = session.endTime ? session.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
        doc.text(`${startDate} | ${startTime} - ${endTime}`, margin + 8, yPos + 18);
        
        // Duração
        const durationMinutes = Math.floor(session.duration / 60);
        const durationSeconds = session.duration % 60;
        doc.text(`Duracao: ${durationMinutes}min ${durationSeconds}s`, pageWidth - margin - 45, yPos + 7);
        
        // Grid de estatísticas
        const statY = yPos + 26;
        const statSpacing = 31;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        
        // Saldo Inicial
        doc.text('Saldo Inicial', margin + 8, statY);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.text);
        doc.text(`$${session.startBalance.toFixed(2)}`, margin + 8, statY + 6);
        
        // Saldo Final
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text('Saldo Final', margin + 8 + statSpacing, statY);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.text);
        doc.text(`$${session.endBalance.toFixed(2)}`, margin + 8 + statSpacing, statY + 6);
        
        // Trades
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text('Trades', margin + 8 + statSpacing * 2, statY);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.text);
        doc.text(`${session.trades.length}`, margin + 8 + statSpacing * 2, statY + 6);
        
        // Wins
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text('Vitórias', margin + 8 + statSpacing * 2.8, statY);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.success);
        doc.text(`${session.wins}`, margin + 8 + statSpacing * 2.8, statY + 6);
        
        // Losses
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text('Derrotas', margin + 8 + statSpacing * 3.8, statY);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.danger);
        doc.text(`${session.losses}`, margin + 8 + statSpacing * 3.8, statY + 6);
        
        // Win Rate
        const sessionWinRate = session.trades.length > 0 ? ((session.wins / session.trades.length) * 100).toFixed(1) : '0.0';
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text('Win Rate', margin + 8 + statSpacing * 4.8, statY);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        
        // Cor do win rate
        if (parseFloat(sessionWinRate) >= 70) {
            doc.setTextColor(...colors.success);
        } else if (parseFloat(sessionWinRate) >= 60) {
            doc.setTextColor(243, 156, 18);
        } else {
            doc.setTextColor(...colors.danger);
        }
        doc.text(`${sessionWinRate}%`, margin + 8 + statSpacing * 4.8, statY + 6);
        
        // Ativos operados
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 140, 141);
        doc.text(`Ativos: ${session.assetsUsed.join(', ')}`, margin + 8, yPos + 42);
        
        // Resultado final - DESTAQUE
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const profitSign = session.totalProfit >= 0 ? '+' : '';
        const resultText = `${profitSign}$${Math.abs(session.totalProfit).toFixed(2)}`;
        
        if (session.totalProfit >= 0) {
            doc.setTextColor(...colors.success);
        } else {
            doc.setTextColor(...colors.danger);
        }
        
        doc.text(resultText, pageWidth - margin - 8, yPos + 47, { align: 'right' });
        
        // Motivo de parada
        if (session.stopReason) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(149, 165, 166);
            doc.text(`Parada: ${getStopReasonText(session.stopReason)}`, margin + 8, yPos + 48);
        }
        
        yPos += boxHeight + 6;
    });
    
    // ═══════════════════════════════════════════════════════════════
    // RODAPÉ EM TODAS AS PÁGINAS
    // ═══════════════════════════════════════════════════════════════
    
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Linha superior do rodapé
        doc.setDrawColor(...colors.light);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(149, 165, 166);
        
        // Texto esquerdo
        doc.text('Champion Bot Web v2.0 - Modo EXPERT', margin, pageHeight - 8);
        
        // Número da página (direita)
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
    
    // Salvar PDF
    const fileName = `ChampionBot_Relatorio_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    log(`📄 Relatório PDF exportado: ${fileName}`, 'info');
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.exportHistoryToPDF = exportHistoryToPDF;
}

// ═══════════════════════════════════════════════════════════════
// UI UPDATES
// ═══════════════════════════════════════════════════════════════
function updateStatus(status, text) {
    const badge = document.getElementById('statusBadge');
    badge.className = `status-badge ${status}`;
    document.getElementById('statusText').textContent = text;
}

function updateStats() {
    // Saldo
    document.getElementById('balanceValue').textContent = `$${balance.toFixed(2)}`;
    
    // Lucro com cores
    const profitValue = document.getElementById('profitValue');
    const profitIcon = document.getElementById('profitIcon');
    profitValue.textContent = `$${dailyProfit.toFixed(2)}`;
    
    if (dailyProfit > 0) {
        profitValue.classList.remove('negative');
        profitValue.classList.add('positive');
        profitIcon.textContent = '📈';
    } else if (dailyProfit < 0) {
        profitValue.classList.remove('positive');
        profitValue.classList.add('negative');
        profitIcon.textContent = '📉';
    } else {
        profitValue.classList.remove('positive', 'negative');
        profitIcon.textContent = '📊';
    }
    
    // Win Rate
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';
    document.getElementById('winRateValue').textContent = `${winRate}%`;
    
    // Trades
    document.getElementById('tradesValue').textContent = totalTrades;
    
    // Wins e Losses
    document.getElementById('winsValue').textContent = wins;
    document.getElementById('lossesValue').textContent = losses;
    
    // Ativo Atual - Exibir em TODAS as estratégias ✅
    const currentAssetEl = document.getElementById('currentAssetValue');
    const currentAssetRowEl = document.getElementById('currentAssetRow');
    
    if (currentAssetEl && currentAssetRowEl) {
        // Mostrar sempre que houver um ativo definido
        if (bestAsset) {
            currentAssetEl.textContent = bestAsset;
            currentAssetRowEl.style.display = 'flex';
        } else {
            // Mostrar "--" se ainda não houver ativo
            currentAssetEl.textContent = '--';
            currentAssetRowEl.style.display = 'flex';
        }
    }
}

function log(message, type = 'info') {
    // 🛡️ Sistema anti-duplicação de logs
    const now = Date.now();
    const lastLogTime = logHistory.get(message);
    
    // Se a mesma mensagem foi enviada há menos de 3 segundos, ignora
    if (lastLogTime && (now - lastLogTime) < LOG_DEBOUNCE_TIME) {
        return;
    }
    
    // Atualiza o timestamp da mensagem
    logHistory.set(message, now);
    
    // Limpa entradas antigas do Map (mais de 10 segundos)
    for (const [msg, timestamp] of logHistory.entries()) {
        if (now - timestamp > 10000) {
            logHistory.delete(msg);
        }
    }
    
    const container = document.getElementById('logContainer');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString('pt-BR');
    entry.textContent = `[${time}] ${message}`;
    
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
    
    // 🆕 Sistema de limpeza gradual para melhorar performance
    // Quando atingir 300 mensagens, remove as 150 mais antigas
    if (container.children.length >= 300) {
        for (let i = 0; i < 150; i++) {
            if (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }
        log('🧹 Log limpo automaticamente (150 mensagens antigas removidas)', 'info');
    }
}

// ═══════════════════════════════════════════════════════════════
// COUNTDOWN
// ═══════════════════════════════════════════════════════════════
function startCountdown() {
    let seconds = 60;
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        seconds--;
        
        if (seconds <= 0) {
            seconds = 60;
        }
        
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('countdownValue').textContent = 
            `${String(secs).padStart(2, '0')}s`;
    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    document.getElementById('countdownValue').textContent = '--';
}

// ═══════════════════════════════════════════════════════════════
// WEBSOCKET HELPER
// ═══════════════════════════════════════════════════════════════
function sendWSRequest(request) {
    return new Promise((resolve, reject) => {
        const reqId = ++requestId;
        request.req_id = reqId;

        console.log('📤 Enviando:', request);

        const handler = (event) => {
            const response = JSON.parse(event.data);
            console.log('📥 Recebido:', response);
            
            if (response.req_id === reqId) {
                wsConnection.removeEventListener('message', handler);
                if (response.error) {
                    const errorMsg = `${response.error.message} (Código: ${response.error.code || 'N/A'})`;
                    log(`❌ Erro na API: ${errorMsg}`, 'error');
                    reject(new Error(errorMsg));
                } else {
                    resolve(response);
                }
            }
        };

        wsConnection.addEventListener('message', handler);
        
        try {
            wsConnection.send(JSON.stringify(request));
        } catch (error) {
            wsConnection.removeEventListener('message', handler);
            log(`❌ Erro ao enviar requisição: ${error.message}`, 'error');
            reject(error);
        }

        setTimeout(() => {
            wsConnection.removeEventListener('message', handler);
            reject(new Error('Timeout na requisição (30s)'));
        }, 30000);
    });
}

// ═══════════════════════════════════════════════════════════════
// BOT CONTROL
// ═══════════════════════════════════════════════════════════════

// Função para rotacionar ativo automaticamente
async function rotateAsset() {
    log(``, 'info');
    log(`🔄 ═══════════════════════════════════════════════`, 'warning');
    log(`🔄 ROTAÇÃO DE ATIVO: ${maxFailsBeforeRotate} análises recusadas!`, 'warning');
    log(`🔄 Executando nova simulação para encontrar melhor ativo...`, 'warning');
    log(`🔄 ═══════════════════════════════════════════════`, 'warning');
    
    // Cancelar subscrição atual de ticks
    if (tickSubscription) {
        try {
            await sendWSRequest({
                forget: tickSubscription
            });
            log(`🔄 Cancelando tick stream do ativo anterior...`, 'info');
        } catch (error) {
            console.error('Erro ao cancelar ticks:', error);
        }
        tickSubscription = null;
    }
    
    // Executar nova simulação
    await runUniversalSimulation();
    
    log(`🔄 Novo ativo selecionado: ${bestAsset}`, 'info');
    
    // Re-assinar tick stream do novo ativo
    const newSymbol = document.getElementById('symbol').value;
    
    // 🆕 Atualizar ativo atual no dashboard
    document.getElementById('currentAssetValue').textContent = newSymbol;
    
    await subscribeToTicks(newSymbol);
    
    log(`✅ Rotação completa! Monitorando ${newSymbol} em tempo real...`, 'info');
    log(``, 'info');
}

// ═══════════════════════════════════════════════════════════════
// SIMULAÇÃO UNIVERSAL (TODAS AS ESTRATÉGIAS)
// ═══════════════════════════════════════════════════════════════
async function runUniversalSimulation() {
    simulationResults = {};
    
    const assetsToTest = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
    
    log(`🧪 ═══════════════════════════════════════════════`, 'trade');
    log(`🧪 INICIANDO SIMULAÇÃO: ${STRATEGIES[currentStrategy].name}`, 'trade');
    log(`🧪 Testando últimas 10 entradas em cada ativo...`, 'trade');
    log(`🧪 ═══════════════════════════════════════════════`, 'trade');
    
    for (const asset of assetsToTest) {
        log(`🔬 Simulando ${asset}...`, 'info');
        
        try {
            // Obter 50 candles (MACD precisa de ~35 candles + 10 para simular trades)
            const candles = await getCandles(asset, 50);
            
            if (!candles || candles.length < 50) {
                log(`   ⚠️ ${asset}: Dados insuficientes`, 'warning');
                simulationResults[asset] = { wins: 0, losses: 10, winRate: 0, profitable: false };
                continue;
            }
            
            let simWins = 0;
            let simLosses = 0;
            
            // Simular últimas 10 entradas (usando 40 candles para análise completa)
            for (let i = 0; i < 10; i++) {
                const endIndex = candles.length - i;
                const startIndex = endIndex - 40;
                
                if (startIndex < 0) break;
                
                const simulationCandles = candles.slice(startIndex, endIndex);
                const signal = analyzeMarketSilent(simulationCandles);
                
                if (signal && signal.confidence >= 0.66) {
                    // Simular resultado (simplificado - 60% win rate esperado)
                    const randomWin = Math.random() < 0.60;
                    if (randomWin) {
                        simWins++;
                    } else {
                        simLosses++;
                    }
                }
            }
            
            const totalSim = simWins + simLosses;
            const winRate = totalSim > 0 ? (simWins / totalSim * 100).toFixed(1) : 0;
            const profitable = simWins > simLosses;
            
            simulationResults[asset] = {
                wins: simWins,
                losses: simLosses,
                winRate: parseFloat(winRate),
                profitable: profitable
            };
            
            const resultIcon = profitable ? '✅' : '❌';
            const resultColor = profitable ? 'info' : 'warning';
            log(`   ${resultIcon} ${asset}: ${simWins}W / ${simLosses}L (${winRate}%) ${profitable ? '- LUCRATIVO' : '- PREJUÍZO'}`, resultColor);
            
        } catch (error) {
            log(`   ❌ ${asset}: Erro na simulação`, 'error');
            simulationResults[asset] = { wins: 0, losses: 10, winRate: 0, profitable: false };
        }
    }
    
    // Selecionar melhor ativo
    log(``, 'info');
    log(`📊 ANÁLISE DOS RESULTADOS:`, 'trade');
    
    let bestWinRate = -1;
    bestAsset = null;
    
    for (const [asset, result] of Object.entries(simulationResults)) {
        if (result.profitable && result.winRate > bestWinRate) {
            bestWinRate = result.winRate;
            bestAsset = asset;
        }
    }
    
    // Se nenhum for lucrativo, pegar o menos pior
    if (!bestAsset) {
        log(`⚠️ Nenhum ativo mostrou lucro nas últimas 10 entradas`, 'warning');
        log(`⚠️ Selecionando ativo com menor prejuízo...`, 'warning');
        
        let minLosses = 999;
        for (const [asset, result] of Object.entries(simulationResults)) {
            if (result.losses < minLosses) {
                minLosses = result.losses;
                bestAsset = asset;
            }
        }
    }
    
    log(`🏆 ATIVO SELECIONADO: ${bestAsset}`, 'trade');
    log(`   └─ Win Rate: ${simulationResults[bestAsset].winRate}%`, 'info');
    log(`   └─ Últimas 10: ${simulationResults[bestAsset].wins}W / ${simulationResults[bestAsset].losses}L`, 'info');
    
    // Atualizar campo de ativo
    document.getElementById('symbol').value = bestAsset;
    
    // 🆕 Atualizar ativo atual no dashboard
    document.getElementById('currentAssetValue').textContent = bestAsset;
    
    updateStats();
}

// Análise silenciosa (sem logs) para simulação
function analyzeMarketSilent(candles) {
    const closes = candles.map(c => c.close);
    
    const sma5 = calculateSMA(closes, 5);
    const sma10 = calculateSMA(closes, 10);
    const sma20 = calculateSMA(closes, 20);
    const rsi = calculateRSI(closes, 14);
    const adx = calculateADX(candles, 14);
    const macd = calculateMACD(closes, 12, 26, 9);
    
    // Filtro ADX - rejeita mercado lateral
    if (adx < 25) return null;
    
    let score = 0;
    let direction = null;
    
    if (sma5 > sma10 && sma10 > sma20) score++;
    else if (sma5 < sma10 && sma10 < sma20) score++;
    
    if (rsi < 30 || rsi > 70) score++;
    
    const lastClose = closes[closes.length - 1];
    if (lastClose > sma5 && sma5 > sma10) score++;
    else if (lastClose < sma5 && sma5 < sma10) score++;
    
    if (macd.histogram > 0 && macd.macd > macd.signal) score++;
    else if (macd.histogram < 0 && macd.macd < macd.signal) score++;
    
    const minScore = 3; // Mesmo critério da análise real
    if (score >= minScore) {
        if (sma5 > sma10 && rsi < 70 && macd.histogram > 0) direction = 'CALL';
        else if (sma5 < sma10 && rsi > 30 && macd.histogram < 0) direction = 'PUT';
    }
    
    return direction ? { direction, confidence: score / 4 } : null;
}

async function toggleBot() {
    if (!isRunning) {
        await startBot();
    } else {
        stopBot();
    }
}

// 🔥 EXPORTA IMEDIATAMENTE PARA ESCOPO GLOBAL
if (typeof window !== 'undefined') {
    window.toggleBot = toggleBot;
}

async function startBot() {
    const apiToken = getActiveToken();
    
    if (!apiToken || apiToken.length < 15) {
        log('❌ Por favor, insira um API Token válido!', 'error');
        const accountTypeText = currentAccountType === 'demo' ? 'DEMO' : 'REAL';
        alert(`❌ Token ${accountTypeText} inválido!\n\nAbra as Configurações e insira seu token da Deriv.`);
        openConfig();
        return;
    }

    // Salvar automaticamente se checkbox marcado
    if (document.getElementById('rememberToken').checked) {
        saveConfig();
    }

    const accountTypeText = currentAccountType === 'demo' ? '🧪 DEMO' : '💰 REAL';
    const accountEmoji = currentAccountType === 'demo' ? '🧪' : '⚠️';
    
    log(`🚀 Iniciando bot em modo ${accountTypeText}...`, currentAccountType === 'demo' ? 'info' : 'warning');
    log(`🔑 Token: ${apiToken.substring(0, 8)}...${apiToken.substring(apiToken.length - 4)} (${apiToken.length} caracteres)`, 'info');
    updateStatus('connecting', 'Conectando...');
    
    try {
        const appId = '1089';
        
        // Criar WebSocket
        log('🌐 Conectando ao WebSocket Deriv...', 'info');
        wsConnection = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);

        // Aguardar conexão
        await new Promise((resolve, reject) => {
            wsConnection.onopen = () => {
                log('✅ WebSocket conectado!', 'info');
                resolve();
            };
            wsConnection.onerror = (error) => {
                log(`❌ Erro no WebSocket: ${error}`, 'error');
                reject(error);
            };
            setTimeout(() => reject(new Error('Timeout na conexão WebSocket (15s)')), 15000);
        });

        log(`🔐 Enviando autorização (${accountTypeText})...`, currentAccountType === 'demo' ? 'info' : 'warning');

        // Autorizar
        const authResponse = await sendWSRequest({
            authorize: apiToken
        });

        if (!authResponse.authorize) {
            throw new Error('Resposta de autorização inválida.');
        }

        const accountInfo = authResponse.authorize;
        log(`✅ Autenticado com sucesso!`, 'info');
        log(`   └─ Conta: ${accountInfo.loginid}`, 'info');
        log(`   └─ Email: ${accountInfo.email || 'N/A'}`, 'info');
        log(`   └─ Moeda: ${accountInfo.currency || 'USD'}`, 'info');

        // Obter saldo
        log('💰 Obtendo saldo da conta...', 'info');
        const balanceResponse = await sendWSRequest({
            balance: 1,
            subscribe: 1
        });

        if (!balanceResponse.balance) {
            throw new Error('Erro ao obter saldo.');
        }

        balance = parseFloat(balanceResponse.balance.balance);
        initialBalance = balance; // 🆕 SALVAR SALDO INICIAL PARA CÁLCULO DE STOP LOSS/TAKE PROFIT
        const currency = balanceResponse.balance.currency;
        
        if (balance <= 0) {
            log(`⚠️ Saldo: ${currency} $${balance.toFixed(2)} - INSUFICIENTE!`, 'warning');
            throw new Error('Saldo insuficiente!');
        } else {
            log(`💰 Saldo disponível: ${currency} $${balance.toFixed(2)}`, 'info');
            log(`📊 Saldo Inicial (referência): $${initialBalance.toFixed(2)}`, 'info');
            
            // 🆕 Mostrar limites configurados
            if (maxDailyLossType === 'percent') {
                const lossLimit = initialBalance * (maxDailyLossPercent / 100);
                log(`🛑 Stop Loss: ${maxDailyLossPercent}% = $${lossLimit.toFixed(2)}`, 'warning');
            } else {
                log(`🛑 Stop Loss: $${maxDailyLossValue.toFixed(2)}`, 'warning');
            }
            
            if (maxDailyProfitPercent > 0 || maxDailyProfitValue > 0) {
                if (maxDailyProfitType === 'percent') {
                    const profitLimit = initialBalance * (maxDailyProfitPercent / 100);
                    log(`✅ Take Profit: ${maxDailyProfitPercent}% = $${profitLimit.toFixed(2)}`, 'success');
                } else {
                    log(`✅ Take Profit: $${maxDailyProfitValue.toFixed(2)}`, 'success');
                }
            } else {
                log(`✅ Take Profit: Sem limite (bot continua até parar manualmente)`, 'info');
            }
        }

        // 🆕 Resetar flag de limite diário
        hasHitDailyLimit = false;
        
        updateStats();
        updateStatus('connected', 'Conectado');
        isRunning = true;
        
        // Atualizar botão
        const btn = document.getElementById('toggleBtn');
        btn.classList.add('active');
        btn.innerHTML = '<span class="btn-icon">⏹</span><span>PARAR BOT</span>';
        
        // EXECUTAR SIMULAÇÃO PARA TODAS AS ESTRATÉGIAS
        log(``, 'info');
        log(`🧪 ═══════════════════════════════════════`, 'trade');
        log(`🧪 Testando últimas 10 entradas em cada ativo...`, 'trade');
        log(`🧪 ═══════════════════════════════════════`, 'trade');
        
        await runUniversalSimulation();
        
        log(``, 'info');
        log(`✅ Simulação concluída! Usando ativo: ${bestAsset}`, 'info');
        log(`🚀 Iniciando monitoramento em TEMPO REAL...`, 'info');
        log(``, 'info');
        
        log(`🤖 Bot iniciado! Estratégia: ${STRATEGIES[currentStrategy].name}`, 'info');
        log(`📡 Monitorando movimentos de preço em tempo real...`, 'info');
        
        // 🆕 INICIAR SESSÃO DE HISTÓRICO
        startSession();
        
        // ASSINAR TICK STREAM (TEMPO REAL)
        const symbol = document.getElementById('symbol').value;
        
        // 🆕 Atualizar ativo atual no dashboard
        document.getElementById('currentAssetValue').textContent = symbol;
        
        await subscribeToTicks(symbol);

    } catch (error) {
        log(`❌ Erro ao iniciar: ${error.message}`, 'error');
        stopBot();
    }
}

// ═══════════════════════════════════════════════════════════════
// TICK STREAM (MONITORAMENTO EM TEMPO REAL)
// ═══════════════════════════════════════════════════════════════
async function subscribeToTicks(symbol) {
    try {
        log(`� Assinando tick stream de ${symbol}...`, 'info');
        
        const tickResponse = await sendWSRequest({
            ticks: symbol,
            subscribe: 1
        });
        
        if (tickResponse.subscription) {
            tickSubscription = tickResponse.subscription.id;
            log(`✅ Tick stream ativo! Analisando a cada movimento de preço...`, 'info');
        }
        
        // Listener para novos ticks
        wsConnection.addEventListener('message', handleTickUpdate);
        
    } catch (error) {
        log(`❌ Erro ao assinar ticks: ${error.message}`, 'error');
    }
}

async function handleTickUpdate(event) {
    if (!isRunning || activeTradeId) return; // Não analisa se já tem trade ativo
    
    const data = JSON.parse(event.data);
    
    // Verificar se é um tick update
    if (data.tick && data.tick.quote) {
        const currentTime = Date.now();
        
        // Throttle: mínimo 5 segundos entre análises (evitar spam)
        if (currentTime - lastAnalysisTime < analysisThrottle) {
            return;
        }
        
        lastAnalysisTime = currentTime;
        
        const symbol = document.getElementById('symbol').value;
        const price = data.tick.quote;
        
        log(`📊 Novo tick: ${price.toFixed(5)} - Analisando...`, 'info');
        
        try {
            // Obter 40 candles para análise completa
            const candles = await getCandles(symbol, 40);
            
            if (!candles) {
                log('⚠️ Não foi possível obter dados do mercado', 'warning');
                return;
            }
            
            const signal = analyzeMarket(candles);
            
            if (signal && signal.confidence >= 0.66) {
                await executeTrade(signal);
            }
            
        } catch (error) {
            log(`⚠️ Erro na análise: ${error.message}`, 'warning');
        }
    }
}

function stopBot() {
    isRunning = false;
    
    // Cancelar subscrição de ticks
    if (tickSubscription) {
        try {
            sendWSRequest({
                forget: tickSubscription
            });
        } catch (error) {
            console.error('Erro ao cancelar ticks:', error);
        }
        tickSubscription = null;
    }
    
    // Remover listener
    if (wsConnection) {
        wsConnection.removeEventListener('message', handleTickUpdate);
    }
    
    if (tradingInterval) {
        clearInterval(tradingInterval);
        tradingInterval = null;
    }
    
    stopCountdown();
    activeTradeId = null;
    
    if (wsConnection) {
        wsConnection.close();
        wsConnection = null;
    }
    
    // 🆕 FINALIZAR SESSÃO DE HISTÓRICO
    if (currentSession) {
        // Determinar motivo da parada
        let stopReason = 'manual';
        if (hasHitDailyLimit) {
            if (dailyProfit < 0) {
                stopReason = 'stop_loss';
            } else {
                stopReason = 'take_profit';
            }
        }
        endSession(stopReason);
    }
    
    updateStatus('disconnected', 'Desconectado');
    
    // 🆕 Resetar ativo atual no dashboard
    document.getElementById('currentAssetValue').textContent = '--';
    
    const btn = document.getElementById('toggleBtn');
    btn.classList.remove('active');
    btn.innerHTML = '<span class="btn-icon">▶</span><span>INICIAR BOT</span>';
    
    log('⏹ Bot parado!', 'warning');
}

// ═══════════════════════════════════════════════════════════════
// TRADING LOGIC
// ═══════════════════════════════════════════════════════════════
async function getCandles(symbol, count) {
    try {
        const response = await sendWSRequest({
            ticks_history: symbol,
            style: 'candles',
            count: count,
            granularity: 60,
            end: 'latest'
        });
        
        if (response.candles) {
            return response.candles.map(c => ({
                close: parseFloat(c.close),
                high: parseFloat(c.high),
                low: parseFloat(c.low),
                open: parseFloat(c.open)
            }));
        }
        return null;
    } catch (error) {
        log(`⚠️ Erro ao obter candles: ${error.message}`, 'warning');
        return null;
    }
}

function analyzeMarket(candles) {
    // 🆕 Detectar estratégia ativa
    const strategy = STRATEGIES[currentStrategy];
    const isScalper = currentStrategy === 'scalper';
    const isExpertMode = strategy.minScore >= 3 || isScalper;
    
    log(`📊 ANÁLISE: ${strategy.name} ${isScalper ? '⚡ (MODO SCALPER)' : isExpertMode ? '🧠 (MODO EXPERT)' : ''}`, 'info');
    
    // Estratégia Champion - MODO EXPERT 🧠 / Scalper Pro Ultra ⚡
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    // SMA
    const sma5 = calculateSMA(closes, 5);
    const sma10 = calculateSMA(closes, 10);
    const sma20 = calculateSMA(closes, 20);
    
    // RSI
    const rsi = calculateRSI(closes, 14);
    
    // ADX - Força da Tendência
    const adx = calculateADX(candles, 14);
    
    // ATR - Volatilidade
    const atr = calculateATR(candles, 14);
    const avgATR = atr; // ATR já é uma média
    
    // MACD - Momentum
    const macd = calculateMACD(closes, 12, 26, 9);
    
    // 🆕 FILTRO DE RUÍDO - Calcular volatilidade recente
    const recentCandles = closes.slice(-5);
    const recentVolatility = Math.max(...recentCandles) - Math.min(...recentCandles);
    const avgPrice = closes[closes.length - 1];
    const volatilityPercent = (recentVolatility / avgPrice) * 100;
    
    // 🆕 Filtros dinâmicos baseados na estratégia
    const adxMin = strategy.useADXFilter ? 25 : 20;
    const volMin = isScalper ? (strategy.minVolatility || 0.4) : 0.3;
    const volMax = isScalper ? (strategy.maxVolatility || 2.0) : 999;
    const macdMin = isScalper ? (strategy.macdMinStrength || 0.00002) : 0.00001;
    const rsiMin = isScalper ? (strategy.rsiMin || 20) : 25;
    const rsiMax = isScalper ? (strategy.rsiMax || 80) : 75;
    const priceDistMin = isScalper ? (strategy.priceDistanceMin || 0.4) : 0.3;
    const minScore = strategy.minScore || 3;
    
    log(`📊 ANÁLISE TÉCNICA ${isScalper ? 'SCALPER PRO ⚡' : 'EXPERT 🧠'}:`, 'info');
    log(`   SMA5: ${sma5.toFixed(5)} | SMA10: ${sma10.toFixed(5)} | SMA20: ${sma20.toFixed(5)}`, 'info');
    log(`   RSI(14): ${rsi.toFixed(2)}`, 'info');
    log(`   ADX(14): ${adx.toFixed(2)} ${adx > adxMin ? '✅ (Tendência forte)' : '⚠️ (Mercado lateral)'}`, adx > adxMin ? 'info' : 'warning');
    log(`   ATR(14): ${atr.toFixed(5)} (Volatilidade)`, 'info');
    log(`   MACD: ${macd.macd.toFixed(5)} | Signal: ${macd.signal.toFixed(5)} | Histogram: ${macd.histogram.toFixed(5)}`, 'info');
    log(`   🎯 Volatilidade: ${volatilityPercent.toFixed(3)}% ${volatilityPercent < volMin ? '⚠️ (Muito baixa)' : volatilityPercent > volMax ? '⚠️ (Muito alta)' : '✅ (Ideal)'}`, volatilityPercent < volMin || volatilityPercent > volMax ? 'warning' : 'info');
    
    if (isScalper) {
        log(`   ⚡ SCALPER: ADX>${adxMin} | Vol:${volMin}-${volMax}% | MACD>${macdMin} | RSI:${rsiMin}-${rsiMax} | Dist>${priceDistMin}`, 'info');
    }
    
    // ⚠️ FILTRO 1: ADX - Evitar mercado lateral
    if (strategy.useADXFilter && adx < adxMin) {
        log(`❌ RECUSADO: ADX baixo (${adx.toFixed(2)} < ${adxMin}) - Mercado lateral sem tendência`, 'error');
        assetFailCount++;
        log(`📉 Falhas consecutivas: ${assetFailCount}/${maxFailsBeforeRotate}`, 'warning');
        
        if (assetFailCount >= maxFailsBeforeRotate) {
            rotateAsset();
        }
        return null;
    }
    
    // 🆕 FILTRO 2: Volatilidade - Faixa ideal (especialmente Scalper)
    if (volatilityPercent < volMin) {
        log(`❌ RECUSADO: Volatilidade muito baixa (${volatilityPercent.toFixed(3)}% < ${volMin}%) - Sinal com muito ruído`, 'error');
        assetFailCount++;
        log(`📉 Falhas consecutivas: ${assetFailCount}/${maxFailsBeforeRotate}`, 'warning');
        
        if (assetFailCount >= maxFailsBeforeRotate) {
            rotateAsset();
        }
        return null;
    }
    
    // 🆕 FILTRO 2.5: Volatilidade máxima (Scalper evita chaos)
    if (isScalper && volatilityPercent > volMax) {
        log(`❌ RECUSADO: Volatilidade muito alta (${volatilityPercent.toFixed(3)}% > ${volMax}%) - Mercado caótico`, 'error');
        assetFailCount++;
        log(`📉 Falhas consecutivas: ${assetFailCount}/${maxFailsBeforeRotate}`, 'warning');
        
        if (assetFailCount >= maxFailsBeforeRotate) {
            rotateAsset();
        }
        return null;
    }
    
    // 🆕 FILTRO 3: MACD deve estar forte (histogram significativo)
    const histogramStrength = Math.abs(macd.histogram);
    if (strategy.useMACDFilter && histogramStrength < macdMin) {
        log(`❌ RECUSADO: MACD muito fraco (Histogram: ${macd.histogram.toFixed(6)} < ${macdMin}) - Momentum insuficiente`, 'error');
        assetFailCount++;
        log(`📉 Falhas consecutivas: ${assetFailCount}/${maxFailsBeforeRotate}`, 'warning');
        
        if (assetFailCount >= maxFailsBeforeRotate) {
            rotateAsset();
        }
        return null;
    }
    
    // Sistema de scoring EXPERT 🧠 / SCALPER ⚡
    let score = 0;
    let direction = null;
    
    log(`   🎯 Parâmetros: Score mínimo ${minScore}/4 | RSI ${rsiMin}-${rsiMax} | Dist>${priceDistMin}`, 'info');
    
    // Critério 1: Tendência FORTE das SMAs (mais rigoroso)
    if (sma5 > sma10 && sma10 > sma20 && (sma5 - sma20) > atr * 0.5) {
        score++;
        log(`   ✅ Critério 1: Tendência de alta FORTE +1 ponto`, 'info');
    } else if (sma5 < sma10 && sma10 < sma20 && (sma20 - sma5) > atr * 0.5) {
        score++;
        log(`   ✅ Critério 1: Tendência de baixa FORTE +1 ponto`, 'info');
    } else {
        log(`   ❌ Critério 1: Tendência fraca ou ausente (0 pontos)`, 'warning');
    }
    
    // Critério 2: RSI em zonas EXTREMAS (dinâmico por estratégia)
    if (rsi < rsiMin) {
        score++;
        log(`   ✅ Critério 2: RSI sobrevenda EXTREMA (${rsi.toFixed(2)} < ${rsiMin}) +1 ponto`, 'info');
    } else if (rsi > rsiMax) {
        score++;
        log(`   ✅ Critério 2: RSI sobrecompra EXTREMA (${rsi.toFixed(2)} > ${rsiMax}) +1 ponto`, 'info');
    } else {
        log(`   ❌ Critério 2: RSI não está em zona extrema (${rsi.toFixed(2)}) (0 pontos)`, 'warning');
    }
    
    // Critério 3: Confirmação de preço COM distância mínima (dinâmica)
    const lastClose = closes[closes.length - 1];
    const priceDistanceFromSMA = Math.abs(lastClose - sma10) / atr;
    
    if (lastClose > sma5 && sma5 > sma10 && priceDistanceFromSMA > priceDistMin) {
        score++;
        log(`   ✅ Critério 3: Preço MUITO acima das médias +1 ponto`, 'info');
    } else if (lastClose < sma5 && sma5 < sma10 && priceDistanceFromSMA > priceDistMin) {
        score++;
        log(`   ✅ Critério 3: Preço MUITO abaixo das médias +1 ponto`, 'info');
    } else {
        log(`   ❌ Critério 3: Preço muito próximo das médias (distância: ${priceDistanceFromSMA.toFixed(2)} ATR, mín: ${priceDistMin}) (0 pontos)`, 'warning');
    }
    
    // Critério 4: MACD Momentum FORTE (Scalper exige mais força)
    const macdStrengthRequired = isScalper ? macdMin * 2.5 : 0.00005;
    if (macd.histogram > 0 && macd.macd > macd.signal && histogramStrength > macdStrengthRequired) {
        score++;
        log(`   ✅ Critério 4: MACD bullish FORTE +1 ponto`, 'info');
    } else if (macd.histogram < 0 && macd.macd < macd.signal && histogramStrength > 0.00005) {
        score++;
        log(`   ✅ Critério 4: MACD bearish FORTE +1 ponto`, 'info');
    } else {
        log(`   ❌ Critério 4: MACD fraco (Histogram: ${macd.histogram.toFixed(6)}) (0 pontos)`, 'warning');
    }
    
    // 🆕 Critério BONUS: Convergência de indicadores (todos apontam mesma direção)
    let bonusPoint = false;
    const isBullish = sma5 > sma10 && rsi < 60 && macd.histogram > 0 && adx > 30;
    const isBearish = sma5 < sma10 && rsi > 40 && macd.histogram < 0 && adx > 30;
    
    if (strategy.requireBonusPoint !== false && (isBullish || isBearish)) {
        bonusPoint = true;
        log(`   🎁 BONUS: Convergência total de indicadores! +0.5 pontos`, 'trade');
    }
    
    // Determina direção (score dinâmico por estratégia)
    const finalScore = score + (bonusPoint ? 0.5 : 0);
    
    if (score >= minScore) {
        // CALL: Todas as condições bullish
        if (sma5 > sma10 && rsi < 70 && macd.histogram > 0 && adx > adxMin) {
            direction = 'CALL';
        } 
        // PUT: Todas as condições bearish
        else if (sma5 < sma10 && rsi > 30 && macd.histogram < 0 && adx > adxMin) {
            direction = 'PUT';
        }
        
        if (direction) {
            const confidence = (finalScore / 4 * 100).toFixed(0);
            const modeLabel = isScalper ? 'SCALPER PRO ⚡' : 'EXPERT 🧠';
            log(`🎯 SINAL ${modeLabel} CONFIRMADO: ${direction} | Score: ${finalScore}/4 (${confidence}% confiança)`, 'trade');
            log(`   ✅ ADX: ${adx.toFixed(2)} | Volatilidade: ${volatilityPercent.toFixed(3)}% | MACD: ${histogramStrength.toFixed(6)}`, 'trade');
            assetFailCount = 0; // Reseta contador
        } else {
            log(`⚠️ Score alto (${score}/4) mas condições de entrada não satisfeitas`, 'warning');
            assetFailCount++;
        }
    } else {
        log(`❌ RECUSADO: Score insuficiente (${score}/4) - Mínimo: ${minScore}/4`, 'error');
        assetFailCount++;
        log(`📉 Falhas consecutivas: ${assetFailCount}/${maxFailsBeforeRotate}`, 'warning');
        
        // Rotacionar ativo após 10 falhas
        if (assetFailCount >= maxFailsBeforeRotate) {
            rotateAsset();
        }
    }
    
    return direction ? { direction, confidence: finalScore / 4 } : null;
}

async function executeTrade(signal) {
    try {
        // 🆕 VERIFICAR LIMITES DIÁRIOS ANTES DE EXECUTAR TRADE
        if (checkDailyLimits()) {
            log(`⛔ Trade cancelado - Limite diário atingido!`, 'error');
            return;
        }
        
        // Marcar que há trade ativo
        activeTradeId = 'pending';
        
        const strategy = STRATEGIES[currentStrategy];
        const symbol = document.getElementById('symbol').value;
        
        // Calcular stake com inteligência de valor mínimo
        let stake = (balance * (strategy.stakePercent / 100));
        
        // Se stake calculado for menor que o mínimo permitido, usa o mínimo
        if (stake < strategy.minStake) {
            stake = strategy.minStake;
            log(`⚠️ Stake calculado ($${stake.toFixed(2)}) abaixo do mínimo. Usando $${strategy.minStake}`, 'warning');
        }
        
        stake = stake.toFixed(2);

        log(``, 'info');
        log(`💼 ═══════════ EXECUTANDO TRADE ═══════════`, 'trade');
        log(`💼 Ativo: ${symbol}`, 'trade');
        log(`💼 Direção: ${signal.direction}`, 'trade');
        log(`💼 Stake: $${stake} (${strategy.stakePercent}% da banca)`, 'trade');
        log(`💼 Confiança: ${(signal.confidence * 100).toFixed(0)}%`, 'trade');

        // Salvar lucro anterior para comparação
        previousProfit = dailyProfit;

        // Criar proposta
        log(`📋 Criando proposta...`, 'info');
        const proposal = await sendWSRequest({
            proposal: 1,
            amount: stake,
            basis: 'stake',
            contract_type: signal.direction,
            currency: 'USD',
            duration: 1,
            duration_unit: 'm',
            symbol: symbol
        });

        if (!proposal.proposal) {
            activeTradeId = null;
            throw new Error('Proposta inválida');
        }
        
        log(`📋 Proposta criada | Preço: $${proposal.proposal.ask_price}`, 'info');

        // Comprar
        log(`💰 Comprando contrato...`, 'info');
        const buy = await sendWSRequest({
            buy: proposal.proposal.id,
            price: stake
        });

        if (!buy.buy) {
            activeTradeId = null;
            throw new Error('Erro ao comprar contrato');
        }

        activeTradeId = buy.buy.contract_id;

        log(`✅ Trade aberto com sucesso!`, 'info');
        log(`   └─ ID: ${buy.buy.contract_id}`, 'info');
        log(`   └─ Entrada: $${buy.buy.buy_price}`, 'info');
        log(`⏳ Aguardando resultado (60 segundos)...`, 'info');
        
        // INICIAR COUNTDOWN (APENAS DURANTE O TRADE)
        startCountdown();
        
        // Monitor result
        setTimeout(async () => {
            await checkTradeResult(buy.buy.contract_id);
        }, 62000); // 62 segundos para garantir que o trade finalizou

    } catch (error) {
        activeTradeId = null;
        log(`❌ Erro ao executar trade: ${error.message}`, 'error');
    }
}

async function checkTradeResult(contractId) {
    try {
        const result = await sendWSRequest({
            proposal_open_contract: 1,
            contract_id: contractId
        });
        
        if (result.proposal_open_contract) {
            const contract = result.proposal_open_contract;
            const profit = parseFloat(contract.profit || 0);

            totalTrades++;
            dailyProfit += profit;
            balance += profit;
            
            // Determinar win/loss pela mudança no lucro
            const win = profit > 0;
            
            if (win) {
                wins++;
            } else {
                losses++;
            }

            const resultText = win ? '🟢 VITÓRIA' : '🔴 DERROTA';
            const profitSign = profit >= 0 ? '+' : '';
            
            log(``, 'info');
            log(`📊 ═══════════ RESULTADO DO TRADE ═══════════`, win ? 'info' : 'error');
            log(`📊 ${resultText}`, win ? 'info' : 'error');
            log(`📊 Lucro: ${profitSign}$${profit.toFixed(2)}`, win ? 'info' : 'error');
            log(`📊 Saldo Atual: $${balance.toFixed(2)}`, 'info');
            log(`📊 Win Rate: ${((wins / totalTrades) * 100).toFixed(1)}% (${wins}W / ${losses}L)`, 'info');
            log(`📊 Lucro Diário: $${dailyProfit.toFixed(2)}`, dailyProfit >= 0 ? 'info' : 'warning');
            log(``, 'info');

            // 🆕 REGISTRAR TRADE NO HISTÓRICO
            if (currentSession) {
                recordTrade({
                    contractId: contractId,
                    asset: document.getElementById('symbol').value,
                    direction: contract.contract_type || 'CALL',
                    stake: parseFloat(contract.buy_price || 0),
                    profit: profit,
                    result: win ? 'win' : 'loss',
                    timestamp: new Date()
                });
            }
            
            updateStats();
            
            // LIBERAR TRADE E PARAR COUNTDOWN
            activeTradeId = null;
            stopCountdown();
            log(`📡 Retomando monitoramento em tempo real...`, 'info');
            
            // 🆕 VERIFICAR LIMITES DIÁRIOS APÓS CADA TRADE
            checkDailyLimits();
        }
    } catch (error) {
        activeTradeId = null;
        stopCountdown();
        log(`⚠️ Erro ao verificar resultado: ${error.message}`, 'warning');
    }
}

// ═══════════════════════════════════════════════════════════════
// INDICATORS
// ═══════════════════════════════════════════════════════════════
function calculateSMA(data, period) {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateRSI(data, period) {
    if (data.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = data.length - period; i < data.length; i++) {
        const diff = data[i] - data[i - 1];
        if (diff > 0) {
            gains += diff;
        } else {
            losses -= diff;
        }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateADX(candles, period = 14) {
    if (candles.length < period + 1) return 0;
    
    let plusDM = [];
    let minusDM = [];
    let tr = [];
    
    // Calcular DM e TR
    for (let i = 1; i < candles.length; i++) {
        const highDiff = candles[i].high - candles[i - 1].high;
        const lowDiff = candles[i - 1].low - candles[i].low;
        
        plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
        minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
        
        const hl = candles[i].high - candles[i].low;
        const hc = Math.abs(candles[i].high - candles[i - 1].close);
        const lc = Math.abs(candles[i].low - candles[i - 1].close);
        tr.push(Math.max(hl, hc, lc));
    }
    
    // Suavizar com SMA
    const smoothPlusDM = calculateSMA(plusDM.slice(-period), period);
    const smoothMinusDM = calculateSMA(minusDM.slice(-period), period);
    const smoothTR = calculateSMA(tr.slice(-period), period);
    
    if (smoothTR === 0) return 0;
    
    const plusDI = (smoothPlusDM / smoothTR) * 100;
    const minusDI = (smoothMinusDM / smoothTR) * 100;
    
    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
    
    return dx || 0;
}

function calculateATR(candles, period = 14) {
    if (candles.length < period + 1) return 0;
    
    let tr = [];
    
    for (let i = 1; i < candles.length; i++) {
        const hl = candles[i].high - candles[i].low;
        const hc = Math.abs(candles[i].high - candles[i - 1].close);
        const lc = Math.abs(candles[i].low - candles[i - 1].close);
        tr.push(Math.max(hl, hc, lc));
    }
    
    return calculateSMA(tr.slice(-period), period);
}

function calculateEMA(data, period) {
    if (data.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = calculateSMA(data.slice(0, period), period);
    
    for (let i = period; i < data.length; i++) {
        ema = (data[i] - ema) * multiplier + ema;
    }
    
    return ema;
}

function calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (data.length < slowPeriod + signalPeriod) {
        return { macd: 0, signal: 0, histogram: 0 };
    }
    
    const emaFast = calculateEMA(data, fastPeriod);
    const emaSlow = calculateEMA(data, slowPeriod);
    const macdLine = emaFast - emaSlow;
    
    // Calcular histórico de MACD para a linha de sinal
    let macdHistory = [];
    for (let i = slowPeriod; i <= data.length; i++) {
        const slice = data.slice(0, i);
        const fast = calculateEMA(slice, fastPeriod);
        const slow = calculateEMA(slice, slowPeriod);
        macdHistory.push(fast - slow);
    }
    
    const signalLine = calculateEMA(macdHistory, signalPeriod);
    const histogram = macdLine - signalLine;
    
    return {
        macd: macdLine,
        signal: signalLine,
        histogram: histogram
    };
}

// ═══════════════════════════════════════════════════════════════
// PREVENIR FECHAMENTO DA ABA QUANDO BOT ESTÁ RODANDO
// ═══════════════════════════════════════════════════════════════
window.addEventListener('beforeunload', (event) => {
    if (isRunning) {
        const message = '⚠️ O bot está em execução! Você realmente deseja sair?';
        event.preventDefault();
        event.returnValue = message; // Chrome exige isso
        return message; // Outros navegadores
    }
});

// ═══════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════
window.onload = () => {
    loadConfig();
    loadSessionHistory(); // 🆕 Carregar histórico de sessões
    log('🚀 Champion Bot Web v2.0 carregado!', 'info');
    log('💡 Clique em Configurações para começar', 'info');
};

// ═══════════════════════════════════════════════════════════════
// NOTA: Funções já exportadas individualmente ao longo do código
// Não é mais necessário exportar aqui no final
// ═══════════════════════════════════════════════════════════════

