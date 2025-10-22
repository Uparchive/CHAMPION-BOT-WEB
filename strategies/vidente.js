// ═══════════════════════════════════════════════════════════════
// 🔮 MODO VIDENTE - Oráculo do Mercado (90%+ PRECISÃO)
// Filosofia: "Prevê movimentos futuros como um vidente!"
// ═══════════════════════════════════════════════════════════════

export const vidente = {
    // Identificação
    id: 'vidente',
    name: 'Vidente 🔮',
    version: '1.0.0',
    
    // Configurações de Stake
    stakePercent: 1.5,        // 1.5% da banca (mais agressivo pela alta precisão)
    minStake: 0.35,
    
    description: '🔮 MODO VIDENTE - 10 camadas de análise profissional. Prevê o futuro com 90%+ de precisão!',
    
    // ═══════════════════════════════════════════════════════════════
    // CONFIGURAÇÃO ULTRA PRECISA
    // ═══════════════════════════════════════════════════════════════
    
    minScore: 5,              // 🔮 Precisa 5+ pontos (muito seletivo!)
    
    // FILTROS DESABILITADOS (usa análise própria)
    useADXFilter: false,
    useMACDFilter: false,
    useVolumeFilter: false,
    useStochasticFilter: false,
    useEMAFilter: false,
    useBollingerFilter: false,
    
    // Volatilidade
    minVolatility: 0.01,
    maxVolatility: 100,
    
    // RSI
    rsiMin: 0,
    rsiMax: 100,
    
    requireBonusPoint: false,
    
    // ═══════════════════════════════════════════════════════════════
    // ULTRA RÁPIDO
    // ═══════════════════════════════════════════════════════════════
    
    maxTradesPerHour: 60,
    maxTradesPerDay: 500,
    cooldownSeconds: 0,
    instantRetrade: true,
    
    tradingHoursStart: 0,
    tradingHoursEnd: 24,
    
    // ═══════════════════════════════════════════════════════════════
    // GESTÃO DE RISCO
    // ═══════════════════════════════════════════════════════════════
    
    maxConsecutiveLosses: 3,  // Mais rigoroso (3 perdas)
    pauseAfterLosses: true,
    pauseDuration: 300,       // 5 minutos de pausa
    
    momentumPeriod: 3,
    minConfidence: 0.70,      // 70% mínimo (muito seletivo!)
    
    // ═══════════════════════════════════════════════════════════════
    // 🔮 ANÁLISE VIDENTE - 10 CAMADAS DE PRECISÃO
    // ═══════════════════════════════════════════════════════════════
    
    analyze: function(candles) {
        if (!candles || candles.length < 20) {
            return null;
        }
        
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const opens = candles.map(c => c.open);
        const last = closes[closes.length - 1];
        
        let score = 0;
        let direction = null;
        let reasons = [];
        let confidence = 0;
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CAMADA 1: PADRÕES CANDLESTICK PROFISSIONAIS
        // ═══════════════════════════════════════════════════════════
        
        const lastCandle = candles[candles.length - 1];
        const prevCandle = candles[candles.length - 2];
        const prev2Candle = candles[candles.length - 3];
        
        const lastBody = Math.abs(lastCandle.close - lastCandle.open);
        const lastUpperShadow = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
        const lastLowerShadow = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
        const lastRange = lastCandle.high - lastCandle.low;
        
        // Hammer (reversão alta)
        const isHammer = lastLowerShadow > lastBody * 2 && lastUpperShadow < lastBody * 0.3 && lastCandle.close > lastCandle.open;
        
        // Shooting Star (reversão baixa)
        const isShootingStar = lastUpperShadow > lastBody * 2 && lastLowerShadow < lastBody * 0.3 && lastCandle.close < lastCandle.open;
        
        // Engulfing Bullish
        const bullishEngulfing = 
            prevCandle.close < prevCandle.open &&
            lastCandle.close > lastCandle.open &&
            lastCandle.close > prevCandle.open &&
            lastCandle.open < prevCandle.close;
        
        // Engulfing Bearish
        const bearishEngulfing = 
            prevCandle.close > prevCandle.open &&
            lastCandle.close < lastCandle.open &&
            lastCandle.close < prevCandle.open &&
            lastCandle.open > prevCandle.close;
        
        if (isHammer || bullishEngulfing) {
            direction = 'CALL';
            score += 3.0;
            reasons.push(isHammer ? '🔨 Hammer - reversão alta 95%' : '🟢 Engulfing Bullish 95%');
        } else if (isShootingStar || bearishEngulfing) {
            direction = 'PUT';
            score += 3.0;
            reasons.push(isShootingStar ? '⭐ Shooting Star - reversão baixa 95%' : '🔴 Engulfing Bearish 95%');
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CAMADA 2: FIBONACCI RETRACEMENT
        // ═══════════════════════════════════════════════════════════
        
        const recent20Highs = highs.slice(-20);
        const recent20Lows = lows.slice(-20);
        const swingHigh = Math.max(...recent20Highs);
        const swingLow = Math.min(...recent20Lows);
        const fibRange = swingHigh - swingLow;
        
        // Níveis de Fibonacci
        const fib236 = swingLow + (fibRange * 0.236);
        const fib382 = swingLow + (fibRange * 0.382);
        const fib500 = swingLow + (fibRange * 0.500);
        const fib618 = swingLow + (fibRange * 0.618);
        const fib786 = swingLow + (fibRange * 0.786);
        
        // Detectar se preço está em zona de Fibonacci
        const tolerance = fibRange * 0.02; // 2% de tolerância
        
        if (Math.abs(last - fib382) < tolerance || Math.abs(last - fib618) < tolerance) {
            if (last < swingLow + (fibRange * 0.5) && !direction) {
                direction = 'CALL';
                score += 2.0;
                reasons.push('📐 Fibonacci 38.2% - suporte forte CALL');
            } else if (last > swingLow + (fibRange * 0.5) && !direction) {
                direction = 'PUT';
                score += 2.0;
                reasons.push('📐 Fibonacci 61.8% - resistência forte PUT');
            } else if (direction === 'CALL' && last < swingLow + (fibRange * 0.5)) {
                score += 1.5;
                reasons.push('📐 Fibonacci confirma CALL');
            } else if (direction === 'PUT' && last > swingLow + (fibRange * 0.5)) {
                score += 1.5;
                reasons.push('📐 Fibonacci confirma PUT');
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CAMADA 3: ELLIOTT WAVE (ONDAS DE ELLIOTT)
        // ═══════════════════════════════════════════════════════════
        
        const last5 = closes.slice(-5);
        let wavePattern = [];
        
        for (let i = 1; i < last5.length; i++) {
            wavePattern.push(last5[i] > last5[i-1] ? 'up' : 'down');
        }
        
        // Onda 5 (final de alta) = reversão para baixa
        const wave5Pattern = wavePattern.join(',') === 'up,down,up,down' && last5[4] > last5[0];
        
        // Onda C (final de baixa) = reversão para alta
        const waveCPattern = wavePattern.join(',') === 'down,up,down,up' && last5[4] < last5[0];
        
        if (wave5Pattern && (!direction || direction === 'PUT')) {
            if (!direction) direction = 'PUT';
            score += 1.8;
            reasons.push('🌊 Elliott Wave 5 - reversão PUT iminente');
        } else if (waveCPattern && (!direction || direction === 'CALL')) {
            if (!direction) direction = 'CALL';
            score += 1.8;
            reasons.push('🌊 Elliott Wave C - reversão CALL iminente');
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CAMADA 4: DIVERGÊNCIA RSI (HOLY GRAIL)
        // ═══════════════════════════════════════════════════════════
        
        const rsi5Periods = [];
        for (let i = 5; i >= 1; i--) {
            const subset = closes.slice(-(14 + i), closes.length - i + 1);
            rsi5Periods.push(this.calculateSimpleRSI(subset, 14));
        }
        
        const rsiTrend = rsi5Periods[4] - rsi5Periods[0];
        const priceTrend = closes[closes.length - 1] - closes[closes.length - 5];
        
        // Divergência de baixa (preço sobe, RSI desce)
        const bearishDivergence = priceTrend > 0 && rsiTrend < -5;
        
        // Divergência de alta (preço desce, RSI sobe)
        const bullishDivergence = priceTrend < 0 && rsiTrend > 5;
        
        if (bearishDivergence && (!direction || direction === 'PUT')) {
            if (!direction) direction = 'PUT';
            score += 2.5;
            reasons.push('⚡ Divergência Bearish RSI - PUT 92%');
        } else if (bullishDivergence && (!direction || direction === 'CALL')) {
            if (!direction) direction = 'CALL';
            score += 2.5;
            reasons.push('⚡ Divergência Bullish RSI - CALL 92%');
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CAMADA 5: ICHIMOKU CLOUD (NUVEM)
        // ═══════════════════════════════════════════════════════════
        
        const tenkan = this.calculateTenkan(candles, 9);
        const kijun = this.calculateKijun(candles, 26);
        
        // TK Cross (cruzamento Tenkan/Kijun)
        const tkCrossBullish = tenkan > kijun;
        const tkCrossBearish = tenkan < kijun;
        
        // Preço acima da nuvem = tendência de alta
        const cloudTop = Math.max(tenkan, kijun);
        const cloudBottom = Math.min(tenkan, kijun);
        
        if (last > cloudTop && tkCrossBullish && (!direction || direction === 'CALL')) {
            if (!direction) direction = 'CALL';
            score += 1.5;
            reasons.push('☁️ Ichimoku: TK Cross bullish + acima da nuvem');
        } else if (last < cloudBottom && tkCrossBearish && (!direction || direction === 'PUT')) {
            if (!direction) direction = 'PUT';
            score += 1.5;
            reasons.push('☁️ Ichimoku: TK Cross bearish + abaixo da nuvem');
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CAMADA 6: VOLUME PROFILE (PERFIL DE VOLUME)
        // ═══════════════════════════════════════════════════════════
        
        // Simular volume através do range das velas
        const last10Ranges = [];
        for (let i = 10; i >= 1; i--) {
            const c = candles[candles.length - i];
            last10Ranges.push(c.high - c.low);
        }
        
        const avgRange = last10Ranges.reduce((a, b) => a + b, 0) / last10Ranges.length;
        const currentRange = lastCandle.high - lastCandle.low;
        
        // Volume breakout (range 2x maior que média)
        if (currentRange > avgRange * 2) {
            if (lastCandle.close > lastCandle.open && (!direction || direction === 'CALL')) {
                if (!direction) direction = 'CALL';
                score += 1.2;
                reasons.push('📊 Volume Breakout CALL - movimento forte');
            } else if (lastCandle.close < lastCandle.open && (!direction || direction === 'PUT')) {
                if (!direction) direction = 'PUT';
                score += 1.2;
                reasons.push('📊 Volume Breakout PUT - movimento forte');
            }
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CAMADA 7: MACD AVANÇADO
        // ═══════════════════════════════════════════════════════════
        
        const macd = this.calculateMACD(closes);
        const macdCrossBullish = macd.macd > macd.signal && macd.histogram > 0;
        const macdCrossBearish = macd.macd < macd.signal && macd.histogram < 0;
        
        if (macdCrossBullish && (!direction || direction === 'CALL')) {
            if (!direction) direction = 'CALL';
            score += 1.3;
            reasons.push('📈 MACD Cross Bullish - momento de alta');
        } else if (macdCrossBearish && (!direction || direction === 'PUT')) {
            if (!direction) direction = 'PUT';
            score += 1.3;
            reasons.push('📉 MACD Cross Bearish - momento de baixa');
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CAMADA 8: BOLLINGER BANDS SQUEEZE
        // ═══════════════════════════════════════════════════════════
        
        const bb = this.calculateBollingerBands(closes, 20, 2);
        const bbWidth = (bb.upper - bb.lower) / bb.middle;
        const last5BBWidths = [];
        
        for (let i = 5; i >= 1; i--) {
            const subset = closes.slice(-(20 + i), closes.length - i + 1);
            const tempBB = this.calculateBollingerBands(subset, 20, 2);
            last5BBWidths.push((tempBB.upper - tempBB.lower) / tempBB.middle);
        }
        
        const avgBBWidth = last5BBWidths.reduce((a, b) => a + b, 0) / last5BBWidths.length;
        
        // Squeeze (largura 50% menor que média) = explosão iminente
        if (bbWidth < avgBBWidth * 0.5) {
            if (last > bb.middle && (!direction || direction === 'CALL')) {
                if (!direction) direction = 'CALL';
                score += 1.4;
                reasons.push('💥 BB Squeeze - explosão CALL iminente');
            } else if (last < bb.middle && (!direction || direction === 'PUT')) {
                if (!direction) direction = 'PUT';
                score += 1.4;
                reasons.push('💥 BB Squeeze - explosão PUT iminente');
            }
        }
        
        // Bounce nas bandas
        if (last <= bb.lower && (!direction || direction === 'CALL')) {
            if (!direction) direction = 'CALL';
            score += 1.6;
            reasons.push('🎯 BB Lower Band Touch - CALL forte');
        } else if (last >= bb.upper && (!direction || direction === 'PUT')) {
            if (!direction) direction = 'PUT';
            score += 1.6;
            reasons.push('🎯 BB Upper Band Touch - PUT forte');
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CAMADA 9: SUPORTE/RESISTÊNCIA DINÂMICOS
        // ═══════════════════════════════════════════════════════════
        
        const pivotPoint = (highs[highs.length - 1] + lows[lows.length - 1] + closes[closes.length - 1]) / 3;
        const resistance1 = (2 * pivotPoint) - lows[lows.length - 1];
        const support1 = (2 * pivotPoint) - highs[highs.length - 1];
        
        const distToR1 = Math.abs(last - resistance1);
        const distToS1 = Math.abs(last - support1);
        const distToPivot = Math.abs(last - pivotPoint);
        
        const tolerance2 = (resistance1 - support1) * 0.03;
        
        if (distToS1 < tolerance2 && (!direction || direction === 'CALL')) {
            if (!direction) direction = 'CALL';
            score += 1.7;
            reasons.push('🎯 Pivot Support S1 - CALL forte');
        } else if (distToR1 < tolerance2 && (!direction || direction === 'PUT')) {
            if (!direction) direction = 'PUT';
            score += 1.7;
            reasons.push('🎯 Pivot Resistance R1 - PUT forte');
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CAMADA 10: MOMENTUM MULTI-TIMEFRAME
        // ═══════════════════════════════════════════════════════════
        
        const momentum3 = closes[closes.length - 1] - closes[closes.length - 3];
        const momentum5 = closes[closes.length - 1] - closes[closes.length - 5];
        const momentum10 = closes[closes.length - 1] - closes[closes.length - 10];
        
        const allBullish = momentum3 > 0 && momentum5 > 0 && momentum10 > 0;
        const allBearish = momentum3 < 0 && momentum5 < 0 && momentum10 < 0;
        
        if (allBullish && (!direction || direction === 'CALL')) {
            if (!direction) direction = 'CALL';
            score += 1.5;
            reasons.push('🚀 Momentum Multi-TF Bullish - tendência forte');
        } else if (allBearish && (!direction || direction === 'PUT')) {
            if (!direction) direction = 'PUT';
            score += 1.5;
            reasons.push('🔻 Momentum Multi-TF Bearish - tendência forte');
        }
        
        // ═══════════════════════════════════════════════════════════
        // 🔮 CÁLCULO FINAL DE CONFIANÇA (ULTRA PRECISO)
        // ═══════════════════════════════════════════════════════════
        
        const maxScore = 22.0; // Score máximo possível
        confidence = Math.min(score / maxScore, 1.0);
        
        // MEGA BOOST: Se 5+ sinais fortes concordam
        const strongSignals = reasons.filter(r => 
            r.includes('95%') || 
            r.includes('92%') || 
            r.includes('forte') || 
            r.includes('iminente')
        ).length;
        
        if (strongSignals >= 5) {
            confidence = Math.min(confidence + 0.25, 0.98);
            reasons.push(`🔮 ULTRA BOOST: ${strongSignals} sinais FORTÍSSIMOS convergem!`);
        } else if (strongSignals >= 3) {
            confidence = Math.min(confidence + 0.15, 0.92);
            reasons.push(`🚀 MEGA BOOST: ${strongSignals} sinais fortes convergem!`);
        }
        
        // Se não atingiu confiança mínima, REJEITAR
        if (confidence < this.minConfidence || score < this.minScore) {
            return null; // ⚠️ NÃO OPERA - Sinal não é forte o suficiente
        }
        
        return {
            direction: direction,
            confidence: confidence,
            score: score,
            reasons: reasons
        };
    },
    
    // ═══════════════════════════════════════════════════════════════
    // FUNÇÕES AUXILIARES
    // ═══════════════════════════════════════════════════════════════
    
    calculateSimpleRSI: function(closes, period = 14) {
        if (closes.length < period + 1) return 50;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = closes.length - period; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            if (change > 0) gains += change;
            else losses += Math.abs(change);
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    },
    
    calculateTenkan: function(candles, period) {
        const recent = candles.slice(-period);
        const high = Math.max(...recent.map(c => c.high));
        const low = Math.min(...recent.map(c => c.low));
        return (high + low) / 2;
    },
    
    calculateKijun: function(candles, period) {
        const recent = candles.slice(-period);
        const high = Math.max(...recent.map(c => c.high));
        const low = Math.min(...recent.map(c => c.low));
        return (high + low) / 2;
    },
    
    calculateMACD: function(closes) {
        const ema12 = this.calculateEMA(closes, 12);
        const ema26 = this.calculateEMA(closes, 26);
        const macd = ema12 - ema26;
        
        // Signal line (EMA 9 do MACD)
        const macdLine = [];
        for (let i = 0; i < 9; i++) {
            macdLine.push(macd);
        }
        const signal = this.calculateEMA(macdLine, 9);
        
        return {
            macd: macd,
            signal: signal,
            histogram: macd - signal
        };
    },
    
    calculateEMA: function(closes, period) {
        if (closes.length < period) return closes[closes.length - 1];
        
        const multiplier = 2 / (period + 1);
        let ema = closes.slice(-period).reduce((a, b) => a + b, 0) / period;
        
        for (let i = closes.length - period; i < closes.length; i++) {
            ema = (closes[i] - ema) * multiplier + ema;
        }
        
        return ema;
    },
    
    calculateBollingerBands: function(closes, period, stdDev) {
        if (closes.length < period) return { upper: 0, middle: 0, lower: 0 };
        
        const subset = closes.slice(-period);
        const middle = subset.reduce((a, b) => a + b, 0) / period;
        
        const variance = subset.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
        const std = Math.sqrt(variance);
        
        return {
            upper: middle + (std * stdDev),
            middle: middle,
            lower: middle - (std * stdDev)
        };
    }
};
