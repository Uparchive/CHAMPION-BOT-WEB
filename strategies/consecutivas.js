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
    // 🎯 MODO HACKER - ANÁLISE AVANÇADA DE PRECISÃO
    // ═══════════════════════════════════════════════════════════════
    
    analyze: function(candles) {
        if (!candles || candles.length < 10) {
            return null;
        }
        
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const last = closes[closes.length - 1];
        const prev = closes[closes.length - 2];
        const prev2 = closes[closes.length - 3];
        
        let score = 0;
        let direction = null;
        let reasons = [];
        
        // ═══════════════════════════════════════════════════════════
        // 🎯 DECISÃO 1: ANÁLISE DE VELAS (CANDLESTICK PATTERN)
        // ═══════════════════════════════════════════════════════════
        
        const lastCandle = candles[candles.length - 1];
        const prevCandle = candles[candles.length - 2];
        
        const lastBody = Math.abs(lastCandle.close - lastCandle.open);
        const lastRange = lastCandle.high - lastCandle.low;
        const bodyRatio = lastBody / lastRange;
        
        // Vela de força (corpo grande)
        if (bodyRatio > 0.6) {
            if (lastCandle.close > lastCandle.open) {
                // Vela verde forte = CALL
                direction = 'CALL';
                score += 1.5;
                reasons.push('� Vela verde forte detectada');
            } else {
                // Vela vermelha forte = PUT
                direction = 'PUT';
                score += 1.5;
                reasons.push('� Vela vermelha forte detectada');
            }
        } else {
            // Vela fraca, usar momentum
            const momentum = last - prev2;
            if (momentum > 0) {
                direction = 'CALL';
                score += 0.8;
                reasons.push('📈 Momentum positivo');
            } else {
                direction = 'PUT';
                score += 0.8;
                reasons.push('📉 Momentum negativo');
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🎯 DECISÃO 2: ANÁLISE DE SUPORTE E RESISTÊNCIA
        // ═══════════════════════════════════════════════════════════
        
        const recent10Highs = highs.slice(-10);
        const recent10Lows = lows.slice(-10);
        const resistance = Math.max(...recent10Highs);
        const support = Math.min(...recent10Lows);
        const range = resistance - support;
        const pricePosition = (last - support) / range; // 0 = suporte, 1 = resistência
        
        if (pricePosition < 0.3 && direction === 'CALL') {
            score += 1.0;
            reasons.push('🎯 Próximo ao suporte - CALL forte');
        } else if (pricePosition > 0.7 && direction === 'PUT') {
            score += 1.0;
            reasons.push('🎯 Próximo à resistência - PUT forte');
        } else if (pricePosition >= 0.3 && pricePosition <= 0.7) {
            score += 0.3;
            reasons.push('➡️ Zona neutra');
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🎯 DECISÃO 3: VOLUME E FORÇA DA TENDÊNCIA
        // ═══════════════════════════════════════════════════════════
        
        const first8 = closes[closes.length - 8];
        const trend = last - first8;
        const trendPercent = (trend / first8) * 100;
        
        if (Math.abs(trendPercent) > 0.1) {
            if (trend > 0 && direction === 'CALL') {
                score += 0.8;
                reasons.push(`✅ Tendência forte de alta (${trendPercent.toFixed(2)}%)`);
            } else if (trend < 0 && direction === 'PUT') {
                score += 0.8;
                reasons.push(`✅ Tendência forte de baixa (${trendPercent.toFixed(2)}%)`);
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🎯 DECISÃO 4: RSI MELHORADO
        // ═══════════════════════════════════════════════════════════
        
        const rsi = this.calculateSimpleRSI(closes, 14);
        
        if (rsi < 35 && direction === 'CALL') {
            score += 1.0;
            reasons.push(`🎯 RSI sobrevenda (${rsi.toFixed(0)}) - CALL forte`);
        } else if (rsi > 65 && direction === 'PUT') {
            score += 1.0;
            reasons.push(`🎯 RSI sobrecompra (${rsi.toFixed(0)}) - PUT forte`);
        } else if (rsi >= 45 && rsi <= 55) {
            score += 0.2;
            reasons.push(`➡️ RSI neutro (${rsi.toFixed(0)})`);
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🎯 DECISÃO 5: PADRÃO DE REVERSÃO
        // ═══════════════════════════════════════════════════════════
        
        const prev3Candle = candles[candles.length - 3];
        const consecutiveBulls = 
            lastCandle.close > lastCandle.open &&
            prevCandle.close > prevCandle.open &&
            prev3Candle.close > prev3Candle.open;
        
        const consecutiveBears = 
            lastCandle.close < lastCandle.open &&
            prevCandle.close < prevCandle.open &&
            prev3Candle.close < prev3Candle.open;
        
        if (consecutiveBulls && direction === 'PUT') {
            score += 0.7;
            reasons.push('🔄 3 velas verdes seguidas - possível reversão PUT');
        } else if (consecutiveBears && direction === 'CALL') {
            score += 0.7;
            reasons.push('🔄 3 velas vermelhas seguidas - possível reversão CALL');
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🎯 CÁLCULO DE CONFIANÇA AVANÇADO
        // ═══════════════════════════════════════════════════════════
        
        const maxScore = 5.8; // Score máximo possível com todas as análises
        let confidence = Math.min(score / maxScore, 1.0);
        
        // Boost de confiança se múltiplos indicadores concordam
        const strongSignals = reasons.filter(r => r.includes('forte') || r.includes('🎯')).length;
        if (strongSignals >= 2) {
            confidence = Math.min(confidence + 0.15, 0.95);
            reasons.push(`🚀 BOOST: ${strongSignals} sinais fortes concordam`);
        }
        
        // Se não atingiu confiança mínima, usar RSI como tiebreaker
        if (confidence < this.minConfidence) {
            const rsi = this.calculateSimpleRSI(closes, 14);
            direction = rsi < 50 ? 'CALL' : 'PUT';
            confidence = this.minConfidence;
            reasons.push(`🎲 Tiebreaker RSI: ${direction}`);
        }
        
        return {
            direction: direction,
            confidence: Math.max(confidence, this.minConfidence),
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
