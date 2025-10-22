# 🔄 ROTAÇÃO AUTOMÁTICA DE ATIVOS - CONSECUTIVAS

## 🎯 OBJETIVO

A estratégia **Consecutivas** agora **rotaciona automaticamente** de ativo a cada nova operação para:
- ✅ **Diversificar risco** entre diferentes mercados
- ✅ **Evitar padrões repetitivos** no mesmo ativo
- ✅ **Maximizar oportunidades** em vários ativos
- ✅ **Reduzir exposição** a um único mercado

---

## 🔥 COMO FUNCIONA

### **Sequência de Rotação:**
```
R_10 → R_25 → R_50 → R_75 → R_100 → R_10 → R_25 → ...
 ↑                                          ↓
 └──────────────────────────────────────────┘
              (circular infinita)
```

### **Fluxo de Operação:**

```
[00:00] Bot inicia - Ativo: R_10
[00:05] Trade #1 executado em R_10 (PUT)
        🔄 Rotação automática → R_25
        
[00:10] Trade #2 executado em R_25 (CALL)
        🔄 Rotação automática → R_50
        
[00:15] Trade #3 executado em R_50 (PUT)
        🔄 Rotação automática → R_75
        
[00:20] Trade #4 executado em R_75 (CALL)
        🔄 Rotação automática → R_100
        
[00:25] Trade #5 executado em R_100 (PUT)
        🔄 Rotação automática → R_10 (volta ao início)
        
[00:30] Trade #6 executado em R_10 (CALL)
        🔄 Rotação automática → R_25
        
... (continua rotacionando infinitamente)
```

---

## 📊 ATIVOS NA ROTAÇÃO

### **Lista Completa:**
| Posição | Ativo | Descrição | Volatilidade |
|---------|-------|-----------|--------------|
| 1 | **R_10** | Índice sintético 10% | Baixa |
| 2 | **R_25** | Índice sintético 25% | Baixa-Média |
| 3 | **R_50** | Índice sintético 50% | Média |
| 4 | **R_75** | Índice sintético 75% | Média-Alta |
| 5 | **R_100** | Índice sintético 100% | Alta |

**Total:** 5 ativos em rotação circular

---

## ⚙️ IMPLEMENTAÇÃO TÉCNICA

### **1. Função de Rotação:**

```javascript
function rotateAssetConsecutivas() {
    // Array de ativos para rotação
    const rotationAssets = ['R_10', 'R_25', 'R_50', 'R_75', 'R_100'];
    
    // Pegar ativo atual
    const currentAsset = document.getElementById('symbol').value;
    
    // Encontrar índice do ativo atual
    let currentIndex = rotationAssets.indexOf(currentAsset);
    
    // Se não encontrou, começa do zero
    if (currentIndex === -1) {
        currentIndex = 0;
    } else {
        // Avançar para próximo (circular)
        currentIndex = (currentIndex + 1) % rotationAssets.length;
    }
    
    // Selecionar novo ativo
    const newAsset = rotationAssets[currentIndex];
    
    // Atualizar no select
    document.getElementById('symbol').value = newAsset;
    
    // Atualizar no dashboard
    document.getElementById('currentAssetValue').textContent = newAsset;
    
    log(`🔄 Consecutivas: Rotação ${currentAsset} → ${newAsset}`, 'info');
}
```

### **2. Integração em executeTrade:**

```javascript
async function executeTrade(signal) {
    try {
        // Verificar limites diários
        if (checkDailyLimits()) {
            log(`⛔ Trade cancelado - Limite diário atingido!`, 'error');
            return;
        }
        
        activeTradeId = 'pending';
        const strategy = STRATEGIES[currentStrategy];
        
        // 🔥 CONSECUTIVAS: ROTACIONAR ATIVO A CADA TRADE
        if (strategy && strategy.id === 'consecutivas') {
            rotateAssetConsecutivas();
        }
        
        const symbol = document.getElementById('symbol').value;
        // ... resto da função
```

**Momento da rotação:** ANTES de executar o trade, garantindo que cada operação seja em um ativo diferente.

---

## 🎯 BENEFÍCIOS DA ROTAÇÃO

### **1. Diversificação Automática:**
```
Sem rotação:
❌ 10 trades em R_10
❌ Alta exposição a um único ativo
❌ Se R_10 estiver em tendência ruim = muitas perdas

Com rotação:
✅ 2 trades em R_10
✅ 2 trades em R_25
✅ 2 trades em R_50
✅ 2 trades em R_75
✅ 2 trades em R_100
✅ Risco distribuído!
```

### **2. Evita Padrões:**
```
Sem rotação:
❌ Bot pode aprender padrões ruins do mesmo ativo
❌ Mercado pode ficar lateral no ativo escolhido

Com rotação:
✅ Sempre busca novos padrões
✅ Se um ativo está ruim, próximo pode estar bom
```

### **3. Maximiza Oportunidades:**
```
Exemplo real:
R_10:  Lateral (difícil)
R_25:  Tendência clara! ✅
R_50:  Lateral (difícil)
R_75:  Tendência clara! ✅
R_100: Volátil (oportunidades)

Com rotação: Pega as melhores entradas de cada ativo!
```

---

## 📈 ESTATÍSTICAS ESPERADAS

### **Distribuição de Trades (100 operações):**
```
R_10:   20 trades (20%)
R_25:   20 trades (20%)
R_50:   20 trades (20%)
R_75:   20 trades (20%)
R_100:  20 trades (20%)

Total: 100 trades perfeitamente distribuídos!
```

### **Impacto no Win Rate:**
```
Antes (sem rotação):
- Win rate depende muito do ativo escolhido
- Se escolher ativo ruim = Win rate baixo

Depois (com rotação):
- Win rate é MÉDIA dos 5 ativos
- Mais estável e previsível
- Reduz variância dos resultados
```

---

## 🧪 EXEMPLO PRÁTICO

### **Sessão de 30 minutos (10 trades):**

```
[14:00] 🔥 Bot Consecutivas iniciado - R_10
[14:02] Trade #1: CALL em R_10
        Resultado: WIN ✅
        🔄 Rotação → R_25
        
[14:05] Trade #2: PUT em R_25
        Resultado: LOSS ❌
        🔄 Rotação → R_50
        
[14:07] Trade #3: CALL em R_50
        Resultado: WIN ✅
        🔄 Rotação → R_75
        
[14:10] Trade #4: PUT em R_75
        Resultado: WIN ✅
        🔄 Rotação → R_100
        
[14:12] Trade #5: CALL em R_100
        Resultado: LOSS ❌
        🔄 Rotação → R_10 (volta ao início!)
        
[14:15] Trade #6: PUT em R_10
        Resultado: WIN ✅
        🔄 Rotação → R_25
        
[14:18] Trade #7: CALL em R_25
        Resultado: WIN ✅
        🔄 Rotação → R_50
        
[14:20] Trade #8: PUT em R_50
        Resultado: WIN ✅
        🔄 Rotação → R_75
        
[14:23] Trade #9: CALL em R_75
        Resultado: LOSS ❌
        🔄 Rotação → R_100
        
[14:25] Trade #10: PUT em R_100
        Resultado: WIN ✅
        🔄 Rotação → R_10

[14:30] Resultado Final:
        7 WINS / 3 LOSSES = 70% Win Rate
        Lucro: +$12.40
```

### **Distribuição:**
```
R_10:   2 trades (1W 1L)
R_25:   2 trades (1W 1L)
R_50:   2 trades (2W 0L) ⭐
R_75:   2 trades (1W 1L)
R_100:  2 trades (1W 1L)
```

**Observação:** R_50 teve melhor desempenho nessa sessão!

---

## 🔧 LOGS DO CONSOLE

### **Exemplo de saída:**
```javascript
[14:02:15] 🔥 Consecutivas: Palpite aceito! Confiança: 35%
[14:02:15] 💼 ═══════════ EXECUTANDO TRADE ═══════════
[14:02:15] 💼 Ativo: R_10
[14:02:15] 💼 Direção: CALL
[14:02:15] 🔄 Consecutivas: Rotação R_10 → R_25
[14:02:16] 📋 Criando proposta...
[14:02:17] ✅ Proposta criada! ID: ABC123
[14:02:17] 💰 Comprando contrato...
[14:02:18] ✅ Contrato comprado! ID: 123456789

[14:05:10] 🔥 Consecutivas: Palpite aceito! Confiança: 42%
[14:05:10] 💼 ═══════════ EXECUTANDO TRADE ═══════════
[14:05:10] 💼 Ativo: R_25
[14:05:10] 💼 Direção: PUT
[14:05:10] 🔄 Consecutivas: Rotação R_25 → R_50
[14:05:11] 📋 Criando proposta...
```

---

## ⚡ MODO TURBO - Consecutivas + Rotação

### **Configuração atual:**
```javascript
consecutivas: {
    cooldownSeconds: 0,        // ⚡ ZERO COOLDOWN
    maxTradesPerHour: 60,      // 🔥 60 trades/hora
    maxTradesPerDay: 500,      // 🔥 500 trades/dia
    minConfidence: 0.30,       // 30% já basta
    instantRetrade: true       // 🚀 Re-trade imediato
}
```

### **Performance esperada:**
```
Com rotação:
- 1 trade a cada minuto (média)
- 5 ativos diferentes
- Cada ativo: 12 trades/hora
- Diversificação: MÁXIMA
- Risco: DISTRIBUÍDO
- Oportunidades: MAXIMIZADAS
```

---

## 🎯 QUANDO USA ROTAÇÃO?

### **✅ Somente Consecutivas rotaciona:**
```javascript
if (strategy && strategy.id === 'consecutivas') {
    rotateAssetConsecutivas();  // ✅ SIM
}
```

### **❌ Outras estratégias NÃO rotacionam:**
```javascript
Champion Pro:     ❌ Não rotaciona (usa simulação)
Flash Scalper:    ❌ Não rotaciona (fica no ativo)
Diamond Hands:    ❌ Não rotaciona (análise profunda)
```

**Motivo:** Consecutivas é agressiva e busca volume, as outras são mais conservadoras.

---

## 🔍 PERSONALIZAÇÃO (FUTURO)

### **Possíveis melhorias:**

1. **Rotação Inteligente:**
```javascript
// Rotacionar apenas para ativos com boa volatilidade
const activeAssets = filterByVolatility(rotationAssets);
```

2. **Rotação Baseada em Performance:**
```javascript
// Dar preferência aos ativos com melhor win rate
const bestAssets = sortByWinRate(rotationAssets);
```

3. **Rotação Configurável:**
```javascript
// Permitir usuário escolher quais ativos incluir
userSelectedAssets = ['R_50', 'R_75', 'R_100'];
```

4. **Rotação com Peso:**
```javascript
// Alguns ativos aparecem mais que outros
weights = { R_50: 2, R_75: 2, R_100: 1 };
```

---

## ✅ STATUS

**IMPLEMENTADO COM SUCESSO!** 🔥

Agora a estratégia Consecutivas:
- ✅ **Rotaciona** automaticamente a cada trade
- ✅ **Diversifica** entre 5 ativos (R_10 → R_100)
- ✅ **Distribuição** uniforme (20% cada)
- ✅ **Circular** infinita (volta ao início)
- ✅ **Logs** claros no console
- ✅ **Dashboard** atualizado em tempo real

### **Próximos passos:**
1. ✅ Testar rotação no bot
2. ⏳ Observar distribuição de trades
3. ⏳ Analisar performance por ativo
4. ⏳ Ajustar lista se necessário

**Teste agora e veja os ativos mudando a cada operação! 🚀**
