# 🔥 CONSECUTIVAS - ROTAÇÃO AUTOMÁTICA DE ATIVO

## 🎯 FUNCIONALIDADE IMPLEMENTADA

A estratégia **Consecutivas** agora **rotaciona automaticamente** para um ativo diferente **após cada operação**, garantindo variedade e evitando bugs no gráfico.

---

## 🔄 COMO FUNCIONA

### **Sequência de Rotação:**
```
Trade 1: R_10  🔥
Trade 2: R_25  🔥
Trade 3: R_50  🔥
Trade 4: R_75  🔥
Trade 5: R_100 🔥
Trade 6: R_10  🔥 (volta ao início)
...e assim por diante
```

### **Fluxo Completo:**

```
[00:00] Trade finaliza em R_10
        📊 🟢 VITÓRIA
        Lucro: +$1.85
        
[00:02] 🔥 Consecutivas detecta conclusão
        └─ Inicia rotação de ativo...
        
[00:03] 🔥 Rotacionando ativo!
        └─ Anterior: R_10 → Novo: R_25
        └─ Cancelando tick stream de R_10...
        └─ Atualizando campo de seleção...
        └─ LIMPANDO GRÁFICO ANTERIOR ✅
        └─ Obtendo candles de R_25...
        └─ Atualizando gráfico com R_25...
        └─ Inscrevendo em tick stream de R_25...
        
[00:04] ✅ Rotação completa!
        └─ Próximo trade será em R_25
        └─ Buscando próxima oportunidade...
        
[00:05] 📊 Gráfico mostra R_25 (sem bug) ✅
        📈 Candles corretos
        📊 Indicadores atualizados
        🎯 Próximo trade em R_25
```

---

## 🛡️ PROTEÇÃO CONTRA BUGS

### **Problema Anterior:**
```javascript
// Quando mudava de ativo, o gráfico:
❌ Misturava dados de R_10 com R_25
❌ Mostrava candles antigos
❌ Indicadores ficavam desatualizados
❌ Linhas de entrada no ativo errado
```

### **Solução Implementada:**
```javascript
// Rotação limpa e segura:
✅ Cancela tick stream anterior
✅ LIMPA GRÁFICO COMPLETAMENTE
✅ Obtém novos candles do novo ativo
✅ Atualiza gráfico com dados corretos
✅ Reinscreve em novo tick stream
✅ Atualiza todos os elementos visuais
```

---

## 📊 DIFERENÇA: FLASH SCALPER vs CONSECUTIVAS

### **Flash Scalper (MESMO ATIVO):**
```
[00:00] Trade em R_50 ✅
[00:02] Próximo trade em R_50 ✅
[00:04] Próximo trade em R_50 ✅
[00:06] Próximo trade em R_50 ✅
        ↑ Mantém mesmo ativo
```

### **Consecutivas (ROTACIONA):**
```
[00:00] Trade em R_10 ✅
[00:02] 🔄 Rotaciona → R_25
[00:04] Trade em R_25 ✅
[00:06] 🔄 Rotaciona → R_50
[00:08] Trade em R_50 ✅
[00:10] 🔄 Rotaciona → R_75
        ↑ Sempre muda de ativo
```

---

## 🔧 CÓDIGO TÉCNICO

### **1. Detecção de Estratégia no checkTradeResult:**

```javascript
// Após trade finalizar...
const strategy = STRATEGIES[currentStrategy];

if (strategy && strategy.instantRetrade && isRunning) {
    // 🔥 CONSECUTIVAS: ROTACIONA
    if (strategy.id === 'consecutivas') {
        log(`🔥 Consecutivas: Rotacionando para próximo ativo...`, 'info');
        setTimeout(async () => {
            if (isRunning && !activeTradeId) {
                await rotateAssetForConsecutivas();  // ⚡ ROTAÇÃO
                performTradeAnalysis();               // ⚡ ANÁLISE
            }
        }, 2000);
    } 
    // ⚡ FLASH SCALPER: MESMO ATIVO
    else {
        log(`⚡ ${strategy.name}: Buscando próxima oportunidade...`, 'info');
        setTimeout(() => {
            if (isRunning && !activeTradeId) {
                performTradeAnalysis();  // Análise direta
            }
        }, 2000);
    }
}
```

### **2. Função rotateAssetForConsecutivas():**

```javascript
async function rotateAssetForConsecutivas() {
    const availableAssets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
    
    // 🎯 Pegar ativo atual
    const currentAsset = document.getElementById('symbol').value;
    
    // 🎯 Rotacionar para próximo índice (circular)
    currentAssetIndex = (currentAssetIndex + 1) % availableAssets.length;
    const newAsset = availableAssets[currentAssetIndex];
    
    log(`🔥 ═══════════════════════════════════════════════`, 'warning');
    log(`🔥 Consecutivas: Rotacionando ativo!`, 'warning');
    log(`🔥 Anterior: ${currentAsset} → Novo: ${newAsset}`, 'warning');
    log(`🔥 ═══════════════════════════════════════════════`, 'warning');
    
    // 🛑 1. CANCELAR TICK STREAM ANTERIOR
    if (tickSubscription) {
        try {
            await sendWSRequest({ forget: tickSubscription });
            log(`🔥 Cancelando tick stream de ${currentAsset}...`, 'info');
        } catch (error) {
            console.error('Erro ao cancelar ticks:', error);
        }
        tickSubscription = null;
    }
    
    // 🎯 2. ATUALIZAR CAMPO DE SELEÇÃO
    document.getElementById('symbol').value = newAsset;
    
    // 🎯 3. ATUALIZAR DASHBOARD
    const currentAssetEl = document.getElementById('currentAssetValue');
    if (currentAssetEl) {
        currentAssetEl.textContent = newAsset;
    }
    
    // 🧹 4. LIMPAR GRÁFICO (PREVENIR BUG!)
    if (typeof window.clearChart === 'function') {
        window.clearChart();
    }
    
    // 📊 5. OBTER CANDLES DO NOVO ATIVO
    try {
        const candles = await getCandles(newAsset, 40);
        if (candles && candles.length > 0) {
            // 📈 6. ATUALIZAR GRÁFICO COM DADOS CORRETOS
            if (typeof window.updateChart === 'function') {
                window.updateChart(candles, newAsset);
                log(`📊 Gráfico atualizado para ${newAsset}`, 'info');
            }
        }
    } catch (error) {
        console.error('Erro ao obter candles:', error);
    }
    
    // 📡 7. RE-INSCREVER EM NOVO TICK STREAM
    await subscribeToTicks(newAsset);
    
    log(`✅ Rotação completa! Próximo trade será em ${newAsset}`, 'success');
}
```

### **3. Função clearChart() (chart-manager.js):**

```javascript
function clearChart() {
    if (!chart) return;
    
    // Limpa dados de candles
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.data.datasets[1].data = [];
    chart.data.datasets[2].data = [];
    
    // Remove anotações (linhas de entrada/saída)
    if (chart.options.plugins?.annotation?.annotations) {
        chart.options.plugins.annotation.annotations = {};
    }
    
    chart.update('none');
    console.log('🧹 Gráfico limpo');
}
```

---

## 🎯 BENEFÍCIOS DA ROTAÇÃO

### **1. Diversificação**
- ✅ Não fica "preso" em um ativo com baixa volatilidade
- ✅ Aproveita oportunidades em diferentes mercados
- ✅ Reduz exposição a padrões específicos de um ativo

### **2. Velocidade**
- ✅ Não espera simulação completa (5 ativos testados)
- ✅ Rotação instantânea (2 segundos)
- ✅ Mantém ritmo de 1 trade/minuto

### **3. Confiabilidade**
- ✅ Gráfico sempre correto
- ✅ Sem mistura de dados
- ✅ Indicadores atualizados
- ✅ Sem travamentos

### **4. Experiência Visual**
- ✅ Usuário vê mudança clara no dashboard
- ✅ Nome do ativo atualizado
- ✅ Gráfico muda visualmente
- ✅ Logs informativos

---

## 📋 LOGS ESPERADOS

### **Durante Rotação:**
```
📊 ═══════════ RESULTADO DO TRADE ═══════════
📊 🟢 VITÓRIA
📊 Lucro: +$1.85
📊 Saldo Atual: $102.50
📊 Win Rate: 55.0% (11W / 9L)
📊 Lucro Diário: $5.20

⚡ Consecutivas: Buscando próxima oportunidade IMEDIATAMENTE...

🔥 ═══════════════════════════════════════════════
🔥 Consecutivas: Rotacionando ativo!
🔥 Anterior: R_10 → Novo: R_25
🔥 ═══════════════════════════════════════════════
🔥 Cancelando tick stream de R_10...
📊 Gráfico atualizado para R_25
✅ Rotação completa! Próximo trade será em R_25

🔥 Consecutivas: CALL | Confiança: 45%
   └─ ✅ Momentum de alta (últimas 3 velas)
   └─ 📈 Movimento ascendente detectado
💰 Executando trade: CALL em R_25...
```

---

## 🧪 TESTE DE VALIDAÇÃO

### **Passo 1: Iniciar Consecutivas**
```
1. Selecione estratégia: Consecutivas 🔥
2. Clique em INICIAR
3. Aguarde primeiro trade
```

### **Passo 2: Observar Primeiro Trade**
```
1. Trade abre em R_10
2. Aguarde 60 segundos
3. Trade finaliza
```

### **Passo 3: Observar Rotação**
```
1. Console mostra:
   🔥 Consecutivas: Rotacionando ativo!
   🔥 Anterior: R_10 → Novo: R_25
   
2. Dashboard atualiza:
   Ativo Atual: R_25
   
3. Gráfico muda:
   📈 R_25 - Candlestick
   Candles diferentes aparecem
```

### **Passo 4: Observar Segundo Trade**
```
1. Trade abre em R_25
2. Aguarde 60 segundos
3. Trade finaliza
4. Rotaciona para R_50
```

### **Passo 5: Validar Ciclo Completo**
```
Trade 1: R_10  ✅
Trade 2: R_25  ✅
Trade 3: R_50  ✅
Trade 4: R_75  ✅
Trade 5: R_100 ✅
Trade 6: R_10  ✅ (volta ao início)
```

---

## ⚠️ IMPORTANTE

### **Rotação APENAS para Consecutivas:**
- ✅ **Consecutivas**: Rotaciona a cada trade
- ❌ **Flash Scalper**: Mantém mesmo ativo
- ❌ **Champion**: Mantém mesmo ativo (baseado em simulação)
- ❌ **Diamond**: Mantém mesmo ativo (baseado em simulação)

### **Por que Consecutivas rotaciona?**
1. **Filosofia da estratégia**: "Palpite rápido sem filtros"
2. **Diversificação natural**: Testa todos os ativos
3. **Evita padrões**: Não cria "vício" em um ativo específico
4. **Velocidade**: Não precisa esperar simulação

---

## 🔍 DEBUG (se necessário)

### **Se gráfico não atualizar:**

1. **Abra Console (F12)**
2. **Procure por:**
```
🔥 Consecutivas: Rotacionando ativo!
🔥 Anterior: R_XX → Novo: R_YY
🧹 Gráfico limpo
📊 Gráfico atualizado para R_YY
```

3. **Se não ver logs:**
- Verifique se estratégia é realmente Consecutivas
- Confirme que `strategy.id === 'consecutivas'`

4. **Se gráfico bugar (dados misturados):**
```javascript
// No console, execute:
window.clearChart();
// Isso força limpeza manual do gráfico
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### **ANTES (SEM ROTAÇÃO):**
```
Trade 1: R_10 ✅
Trade 2: R_10 ✅ (mesmo ativo)
Trade 3: R_10 ✅ (mesmo ativo)
Trade 4: R_10 ✅ (mesmo ativo)
...
❌ Ficava preso no ativo inicial
```

### **DEPOIS (COM ROTAÇÃO):**
```
Trade 1: R_10  ✅
Trade 2: R_25  ✅ (rotacionou)
Trade 3: R_50  ✅ (rotacionou)
Trade 4: R_75  ✅ (rotacionou)
Trade 5: R_100 ✅ (rotacionou)
Trade 6: R_10  ✅ (volta ao início)
...
✅ Diversificação automática!
```

---

## 🎯 CICLO DE ROTAÇÃO

```
┌─────────────────────────────────────────┐
│                                         │
│  R_10 → R_25 → R_50 → R_75 → R_100    │
│   ↑                               ↓     │
│   └───────────────────────────────┘     │
│                                         │
│         (Ciclo infinito)               │
└─────────────────────────────────────────┘
```

**Índice de rotação:**
```javascript
currentAssetIndex = 0  →  R_10
currentAssetIndex = 1  →  R_25
currentAssetIndex = 2  →  R_50
currentAssetIndex = 3  →  R_75
currentAssetIndex = 4  →  R_100
currentAssetIndex = 0  →  R_10 (reinicia)
```

---

## ✅ STATUS

**ROTAÇÃO AUTOMÁTICA IMPLEMENTADA COM SUCESSO!** ✅

Agora a estratégia Consecutivas:
- ✅ **Rotaciona** para ativo diferente após cada trade
- ✅ **Limpa gráfico** antes de trocar (sem bugs)
- ✅ **Atualiza** dashboard com novo ativo
- ✅ **Obtém candles** corretos do novo ativo
- ✅ **Inscreve** em novo tick stream
- ✅ **Mantém velocidade** (rotação em 2 segundos)
- ✅ **Logs informativos** de cada rotação

**Teste agora e veja o Consecutivas rotacionando automaticamente! 🔥🔄**
