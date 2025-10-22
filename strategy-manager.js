// ═══════════════════════════════════════════════════════════════
// 🎯 STRATEGY MANAGER - Gerenciador de Estratégias Modulares
// ═══════════════════════════════════════════════════════════════

// Importar estratégias modulares
import { diamondHands } from './strategies/diamond-hands.js';
import { flashScalper } from './strategies/flash-scalper.js';
import { consecutivas } from './strategies/consecutivas.js';
import { vidente } from './strategies/vidente.js'; // 🔮 MODO VIDENTE (90%+ PRECISÃO)

// ═══════════════════════════════════════════════════════════════
// LISTA DE ESTRATÉGIAS EXTERNAS (MODULARES)
// ═══════════════════════════════════════════════════════════════
export const externalStrategies = {
    diamond: diamondHands,
    flash: flashScalper,
    consecutivas: consecutivas,
    vidente: vidente,          // 🔮 NOVO! Modo Vidente (90%+ precisão)
    // Futuras estratégias serão adicionadas aqui:
    // titanium: titaniumShield,
    // quantum: quantumTrader,
    // neural: neuralNetwork,
};

// ═══════════════════════════════════════════════════════════════
// CARREGAR ESTRATÉGIA POR ID
// ═══════════════════════════════════════════════════════════════
export function getStrategy(strategyId) {
    return externalStrategies[strategyId] || null;
}

// ═══════════════════════════════════════════════════════════════
// LISTAR TODAS AS ESTRATÉGIAS EXTERNAS
// ═══════════════════════════════════════════════════════════════
export function listExternalStrategies() {
    return Object.keys(externalStrategies).map(id => ({
        id: id,
        name: externalStrategies[id].name,
        description: externalStrategies[id].description,
        winRate: externalStrategies[id].getInfo().winRate,
        tradesPerDay: externalStrategies[id].getInfo().tradesPerDay,
        risk: externalStrategies[id].getInfo().risk
    }));
}

// ═══════════════════════════════════════════════════════════════
// VALIDAR SE ESTRATÉGIA ESTÁ DISPONÍVEL
// ═══════════════════════════════════════════════════════════════
export function isStrategyAvailable(strategyId) {
    return strategyId in externalStrategies;
}

// ═══════════════════════════════════════════════════════════════
// OBTER INFORMAÇÕES DETALHADAS DA ESTRATÉGIA
// ═══════════════════════════════════════════════════════════════
export function getStrategyInfo(strategyId) {
    const strategy = externalStrategies[strategyId];
    if (!strategy) return null;
    
    return {
        ...strategy.getInfo(),
        id: strategyId,
        name: strategy.name,
        version: strategy.version,
        stakePercent: strategy.stakePercent,
        minStake: strategy.minStake
    };
}

// Exportar para escopo global (compatibilidade com app.js)
if (typeof window !== 'undefined') {
    window.externalStrategies = externalStrategies;
    window.getStrategy = getStrategy;
    window.listExternalStrategies = listExternalStrategies;
    window.isStrategyAvailable = isStrategyAvailable;
    window.getStrategyInfo = getStrategyInfo;
}
