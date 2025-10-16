# ⚡ Champion Bot Web - Plataforma de Trading Profissional

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-success)

## 🚀 Descrição

Plataforma web leve e profissional para trading automatizado na Deriv usando a **Estratégia Champion** com análise técnica avançada.

## 📁 Estrutura do Projeto

```
Bot Atualização/
│
├── index.html          # Interface principal (HTML)
├── style.css           # Estilos e tema dark (CSS)
├── bot.js              # Lógica de trading (JavaScript)
└── README.md           # Este arquivo
```

## ✨ Características

### 🎨 Interface Moderna
- Design dark theme profissional
- Animações suaves e responsivas
- Dashboard em tempo real com 4 cards de estatísticas
- Logs coloridos por tipo (info/warning/error/trade)

### 🧠 Estratégia Champion
- **SMA (5/10/20)**: Médias móveis para tendência
- **RSI (14)**: Índice de força relativa
- **Sistema de Scoring**: 3 critérios (0-3 pontos)
- Mínimo 2/3 pontos para sinal válido
- Confiança mínima de 66% para executar trade

### 🔄 Rotação Automática de Ativos
- Após 10 análises recusadas consecutivas
- Muda automaticamente para próximo ativo
- 10 ativos disponíveis (R_10, R_25, R_50, etc.)

### 💾 Persistência de Dados
- Salva configurações no localStorage
- Token criptografado com Base64 + reversão
- Checkbox "Lembrar meu token"
- Carregamento automático na próxima sessão

### 🛡️ Gestão de Risco
- Stop Loss diário configurável (5-20%)
- Stake ajustável (0.5-5% do saldo)
- Para automaticamente ao atingir perda máxima

## 🔧 Como Usar

### 1️⃣ Abrir a Plataforma
```bash
# Navegue até a pasta
cd "c:\Users\Keslly Albuquerque\Desktop\Bot Atualização"

# Abra index.html no seu navegador
start index.html
```

### 2️⃣ Configurar Credenciais
1. Obtenha seu **API Token** em: https://app.deriv.com/account/api-token
   - Permissões necessárias: ✓ Read ✓ Trade ✓ Payments
2. Cole o token no campo "API Token Deriv"
3. Marque "💾 Lembrar meu token" (opcional)
4. Configure o ativo desejado (padrão: Volatility 10 Index)
5. Ajuste o stake e max loss

### 3️⃣ Iniciar Trading
1. Clique em **"▶ INICIAR BOT"**
2. Aguarde conexão e autorização
3. Bot começará análises a cada 30 segundos
4. Acompanhe os logs em tempo real

### 4️⃣ Parar o Bot
- Clique em **"⏹ PARAR BOT"** a qualquer momento
- Ou aguarde o stop loss automático

## 📊 Logs Detalhados

O bot mostra logs completos de cada operação:

```
🔍 ═══════════ NOVA ANÁLISE ═══════════
🔍 Ativo: R_10
🔍 Solicitando dados de mercado...
✅ 30 candles recebidos

📊 ANÁLISE TÉCNICA:
   SMA5: 1.23456 | SMA10: 1.23450 | SMA20: 1.23440
   RSI(14): 45.32
   ✅ Critério 1: Tendência de alta +1 ponto
   ❌ Critério 2: RSI neutro (0 pontos)
   ✅ Critério 3: Preço acima das médias +1 ponto
🎯 SINAL: CALL | Score: 2/3 (66% confiança)

💼 ═══════════ EXECUTANDO TRADE ═══════════
💼 Ativo: R_10
💼 Direção: CALL
💼 Stake: $0.22
💼 Confiança: 66%
✅ Trade aberto com sucesso!

📊 ═══════════ RESULTADO ═══════════
📊 🟢 VITÓRIA
📊 Lucro: +$0.18
📊 Saldo: $11.79
📊 Win Rate: 62.5% (5/8)
```

## 🎯 Critérios da Estratégia Champion

### Critério 1: Tendência das SMAs (0 ou 1 ponto)
- ✅ Alta: SMA5 > SMA10 > SMA20
- ✅ Baixa: SMA5 < SMA10 < SMA20
- ❌ Sem tendência clara

### Critério 2: RSI (0 ou 1 ponto)
- ✅ Sobrevenda: RSI < 30
- ✅ Sobrecompra: RSI > 70
- ❌ Neutro: 30 ≤ RSI ≤ 70

### Critério 3: Confirmação de Preço (0 ou 1 ponto)
- ✅ Preço acima: lastClose > SMA5 > SMA10
- ✅ Preço abaixo: lastClose < SMA5 < SMA10
- ❌ Sem confirmação

### Decisão de Trade
- **Score ≥ 2/3**: Sinal válido
- **Confiança ≥ 66%**: Executa trade
- **Score < 2/3**: Análise recusada (conta falha)
- **10 falhas**: Rotaciona para próximo ativo

## 🔒 Segurança

- Token criptografado com Base64 + reversão de string
- Armazenamento local (localStorage)
- Nenhum dado enviado para servidores externos
- Opção de limpar token salvo

## 🎨 Cores do Tema

```css
--bg-primary: #0f0f23      /* Fundo principal */
--bg-secondary: #1a1a3e    /* Fundo secundário */
--bg-card: #16213e         /* Cards */
--accent-green: #00ff88    /* Verde (win) */
--accent-red: #ff006e      /* Vermelho (loss) */
--accent-blue: #3a86ff     /* Azul */
--accent-purple: #8338ec   /* Roxo */
--accent-cyan: #06ffa5     /* Ciano */
```

## 📝 Arquivos do Projeto

### `index.html` (5.8 KB)
Estrutura HTML da interface com:
- Header com logo e status
- Painel de configuração (esquerda)
- Dashboard e logs (direita)
- Footer

### `style.css` (11.5 KB)
Estilos CSS incluindo:
- Tema dark com cores vibrantes
- Animações (pulse, slideIn)
- Cards de estatísticas
- Logs coloridos
- Scrollbar customizada

### `bot.js` (26.9 KB)
Lógica JavaScript com:
- Conexão WebSocket Deriv
- Estratégia Champion
- Indicadores técnicos (SMA, RSI)
- Gestão de trades
- Rotação de ativos
- Persistência de configurações

## 🚀 Vantagens da Arquitetura

✅ **Separação de Responsabilidades**: HTML/CSS/JS em arquivos distintos  
✅ **Manutenção Facilitada**: Edite cada parte independentemente  
✅ **Performance**: Arquivos pequenos e otimizados  
✅ **Portabilidade**: Funciona em qualquer navegador moderno  
✅ **Sem Dependências**: Não precisa instalar nada  
✅ **Zero Build**: Abra e use imediatamente  

## 📱 Requisitos

- Navegador moderno (Chrome, Edge, Firefox)
- Conexão com internet
- Conta Deriv ativa
- API Token com permissões corretas

## 🐛 Solução de Problemas

### Bot não conecta
- Verifique sua internet
- Confira se o token está correto
- Certifique-se das permissões do token

### Análises sempre recusadas
- Normal! Estratégia Champion é rigorosa
- Aguarde ou mude manualmente o ativo
- Após 10 falhas, rotaciona automaticamente

### Stop loss ativado
- Perda máxima diária atingida
- Ajuste o % de max loss nas configurações
- Reinicie o bot no próximo dia

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs em tempo real
2. Abra o console do navegador (F12)
3. Analise mensagens de erro

## 📄 Licença

MIT License - Use livremente!

---

**⚡ Champion Bot Web v2.0** | Desenvolvido para Trading Profissional 🚀

