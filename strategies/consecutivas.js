// ═══════════════════════════════════════════════════════════════
// 🔥 CONSECUTIVAS - Palpite Rápido SEM FILTROS
// Filosofia: "Escolhe um lado e MANDA BALA!"
// ═══════════════════════════════════════════════════════════════

export const consecutivas = {
    // Identificação
    id: 'consecutivas',
    name: 'Consecutivas 🔥',
    version: '1.0.0',
    
    // Configurações de Stake
    stakePercent: 1.0,        // 1% da banca
    minStake: 0.35,
    
    // Descrição
    description: '🔥 SEM FILTROS - Palpite rápido baseado no momentum. CALL ou PUT e manda bala!',
    
    // ═══════════════════════════════════════════════════════════════
    // CONFIGURAÇÃO ULTRA SIMPLES - SEM FILTROS!
    // ═══════════════════════════════════════════════════════════════
    
    minScore: 1,              // 🔥 PRECISA APENAS 1 PONTO! (qualquer sinal serve)
    
    // TODOS OS FILTROS DESABILITADOS
    useADXFilter: false,      // ❌ Sem filtro de tendência
    useMACDFilter: false,     // ❌ Sem filtro de momentum
    useVolumeFilter: false,   // ❌ Sem filtro de volume
    useStochasticFilter: false, // ❌ Sem stochastic
    useEMAFilter: false,      // ❌ Sem EMA
    useBollingerFilter: false, // ❌ Sem Bollinger
    
    // Volatilidade - ACEITA QUALQUER COISA
    minVolatility: 0.01,      // 0.01% (praticamente zero)
    maxVolatility: 100,       // 100% (aceita até mercado caótico)
    
    // RSI - Apenas para decidir direção
    rsiMin: 0,                // Aceita qualquer RSI
    rsiMax: 100,              // Aceita qualquer RSI
    
    // Sem requisitos extras
    requireBonusPoint: false, // ❌ Sem bônus obrigatório
    
    // ═══════════════════════════════════════════════════════════════
    // ULTRA RÁPIDO - SEM COOLDOWN!
    // ═══════════════════════════════════════════════════════════════
    
    maxTradesPerHour: 60,     // 🔥 60 trades/hora (1 por minuto!)
    maxTradesPerDay: 500,     // 🔥 500 trades/dia
    cooldownSeconds: 0,       // ⚡ ZERO COOLDOWN! (análise instantânea)
    instantRetrade: true,     // 🚀 Re-trade IMEDIATO
    
    // Opera 24/7
    tradingHoursStart: 0,     // 00h
    tradingHoursEnd: 24,      // 24h
    
    // ═══════════════════════════════════════════════════════════════
    // GESTÃO DE RISCO MÍNIMA
    // ═══════════════════════════════════════════════════════════════
    
    maxConsecutiveLosses: 5,  // Para após 5 perdas (mais tolerante)
    pauseAfterLosses: true,
    pauseDuration: 180,       // 3 minutos de pausa
    
    // ═══════════════════════════════════════════════════════════════
    // LÓGICA DE DECISÃO SIMPLES
    // ═══════════════════════════════════════════════════════════════
    
    // Baseado APENAS em momentum recente
    momentumPeriod: 3,        // Últimas 3 velas
    
    // Confirmação mínima
    minConfidence: 0.30,      // 30% já basta! (bem agressivo)
    
    // ═══════════════════════════════════════════════════════════════
    // FUNÇÃO DE ANÁLISE - PALPITE RÁPIDO
    // ═══════════════════════════════════════════════════════════════
    
    analyze: function(candles) {
        if (!candles || candles.length < 5) {
            return null;
        }
        
        const closes = candles.map(c => c.close);
        const last = closes[closes.length - 1];
        const prev = closes[closes.length - 2];
        const prev2 = closes[closes.length - 3];
        
        let score = 0;
        let direction = null;
        let reasons = [];
        
        // ═══════════════════════════════════════════════════════════
        // DECISÃO 1: MOMENTUM DAS ÚLTIMAS 3 VELAS
        // ═══════════════════════════════════════════════════════════
        
        const momentum = last - prev2; // Diferença entre última e 3 velas atrás
        
        if (momentum > 0) {
            // Preço subindo = CALL
            direction = 'CALL';
            score += 1;
            reasons.push('📈 Momentum positivo (subindo)');
        } else if (momentum < 0) {
            // Preço caindo = PUT
            direction = 'PUT';
            score += 1;
            reasons.push('📉 Momentum negativo (caindo)');
        } else {
            // Preço lateral = escolhe baseado na última vela
            if (last > prev) {
                direction = 'CALL';
                score += 0.5;
                reasons.push('➡️ Lateral com leve alta');
            } else {
                direction = 'PUT';
                score += 0.5;
                reasons.push('➡️ Lateral com leve queda');
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // DECISÃO 2: TENDÊNCIA RECENTE (ÚLTIMAS 5 VELAS)
        // ═══════════════════════════════════════════════════════════
        
        const first5 = closes[closes.length - 5];
        const trend = last - first5;
        
        if (trend > 0 && direction === 'CALL') {
            score += 0.5;
            reasons.push('✅ Tendência confirma CALL');
        } else if (trend < 0 && direction === 'PUT') {
            score += 0.5;
            reasons.push('✅ Tendência confirma PUT');
        }
        
        // ═══════════════════════════════════════════════════════════
        // DECISÃO 3: RSI SIMPLES (OPCIONAL)
        // ═══════════════════════════════════════════════════════════
        
        const rsi = this.calculateSimpleRSI(closes, 14);
        
        if (rsi < 40 && direction === 'CALL') {
            score += 0.5;
            reasons.push(`✅ RSI baixo (${rsi.toFixed(0)}) confirma CALL`);
        } else if (rsi > 60 && direction === 'PUT') {
            score += 0.5;
            reasons.push(`✅ RSI alto (${rsi.toFixed(0)}) confirma PUT`);
        }
        
        // ═══════════════════════════════════════════════════════════
        // CONFIANÇA BASEADA NO SCORE
        // ═══════════════════════════════════════════════════════════
        
        const maxScore = 2.5; // Score máximo possível
        const confidence = Math.min(score / maxScore, 1.0);
        
        // Se não atingiu confiança mínima (30%), escolhe direção aleatória baseada em RSI
        if (confidence < this.minConfidence) {
            direction = rsi < 50 ? 'CALL' : 'PUT';
            reasons.push(`🎲 Palpite baseado em RSI: ${direction}`);
        }
        
        return {
            direction: direction,
            confidence: Math.max(confidence, this.minConfidence), // Mínimo 30%
            score: score,
            reasons: reasons
        };
    },
    
    // ═══════════════════════════════════════════════════════════════
    // CÁLCULO SIMPLIFICADO DE RSI
    // ═══════════════════════════════════════════════════════════════
    
    calculateSimpleRSI: function(closes, period = 14) {
        if (closes.length < period + 1) return 50; // Default neutro
        
        let gains = 0;
        let losses = 0;
        
        for (let i = closes.length - period; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            if (change > 0) {
                gains += change;
            } else {
                losses += Math.abs(change);
            }
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        return rsi;
    }
};
