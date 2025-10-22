// Chart Manager Premium v2.0
console.log('📊 Chart Manager carregando...');

let chart = null;
let data = { candles: [], trades: [], indicators: {} };
let currentAsset = ''; // 🎯 Rastreia ativo atual no gráfico

function waitForChart(cb) {
    let i = 0;
    const check = setInterval(() => {
        if (typeof Chart !== 'undefined') {
            clearInterval(check);
            console.log(' Chart.js OK');
            cb();
        } else if (i++ > 50) {
            clearInterval(check);
            console.error(' Chart.js não carregou');
        }
    }, 100);
}

function initChart() {
    const canvas = document.getElementById('candlestickChart');
    if (!canvas || chart) return;
    
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, 'rgba(102, 126, 234, 0.4)');
    grad.addColorStop(1, 'rgba(118, 75, 162, 0.05)');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Máxima',
                data: [],
                borderColor: 'rgba(34, 197, 94, 0.4)',
                borderWidth: 1,
                pointRadius: 0,
                borderDash: [5, 5]
            }, {
                label: 'Fechamento',
                data: [],
                borderColor: '#667eea',
                backgroundColor: grad,
                borderWidth: 3,
                pointRadius: 3,
                pointBackgroundColor: '#667eea',
                tension: 0.3,
                fill: true
            }, {
                label: 'Mínima',
                data: [],
                borderColor: 'rgba(239, 68, 68, 0.4)',
                borderWidth: 1,
                pointRadius: 0,
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: '📈 Gráfico - Candlestick',
                    color: '#667eea',
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    borderColor: '#667eea',
                    borderWidth: 2
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.6)', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 11 } }
                }
            }
        }
    });
    
    console.log(' Gráfico inicializado');
    return true;
}

function updateChart(candles, asset) {
    if (!chart && !initChart()) return;
    if (!candles || candles.length === 0) return;
    
    // 🔄 Detecta mudança de ativo
    if (asset && asset !== currentAsset) {
        console.log(`🔄 Ativo alterado: ${currentAsset} → ${asset}`);
        currentAsset = asset;
        
        // 🧹 Limpar anotações e painel ao trocar ativo
        if (chart.options.plugins?.annotation?.annotations) {
            chart.options.plugins.annotation.annotations = {};
        }
        clearLiveTradePanel();
    }
    
    data.candles = candles;
    const labels = candles.map(c => new Date(c.epoch * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = candles.map(c => c.high);
    chart.data.datasets[1].data = candles.map(c => c.close);
    chart.data.datasets[2].data = candles.map(c => c.low);
    
    // 📊 Atualiza título do gráfico com o ativo
    if (chart.options.plugins?.title) {
        chart.options.plugins.title.text = `📈 ${asset || 'Gráfico'} - Candlestick`;
    }
    
    chart.update('active');
    
    console.log(`📊 Gráfico atualizado: ${asset || '?'} - ${candles.length} velas`);
}

function clearChart() {
    if (!chart) return;
    chart.data.labels = [];
    chart.data.datasets.forEach(ds => ds.data = []);
    
    // 🧹 Limpar anotações (linhas de entrada/saída)
    if (chart.options.plugins?.annotation?.annotations) {
        chart.options.plugins.annotation.annotations = {};
    }
    
    chart.update('none');
    data = { candles: [], trades: [], indicators: {} };
    currentAsset = ''; // 🧹 Reset do ativo
    
    // 🧹 Remover painel flutuante se existir
    clearLiveTradePanel();
    
    console.log('🧹 Gráfico limpo');
}

function updateIndicators(ind) {
    if (!ind) return;
    data.indicators = ind;
    
    const els = {
        rsi: document.getElementById('rsiValue'),
        macd: document.getElementById('macdValue'),
        adx: document.getElementById('adxValue'),
        signal: document.getElementById('signalValue')
    };
    
    if (els.rsi && ind.rsi) {
        els.rsi.textContent = ind.rsi.toFixed(2);
        els.rsi.style.color = ind.rsi > 70 ? '#ef4444' : ind.rsi < 30 ? '#22c55e' : '#fbbf24';
    }
    if (els.macd && ind.macd) {
        els.macd.textContent = (ind.macd > 0 ? '+' : '') + ind.macd.toFixed(4);
        els.macd.style.color = ind.macd > 0 ? '#22c55e' : '#ef4444';
    }
    if (els.adx && ind.adx) {
        els.adx.textContent = ind.adx.toFixed(2);
        els.adx.style.color = ind.adx > 50 ? '#22c55e' : ind.adx > 25 ? '#fbbf24' : '#ef4444';
    }
    if (els.signal && ind.signal) {
        const s = ind.signal.toLowerCase();
        els.signal.textContent = s === 'buy' ? 'COMPRA' : s === 'sell' ? 'VENDA' : 'NEUTRO';
        els.signal.className = 'indicator-value signal ' + s;
    }
}

function switchView(view) {
    const log = document.getElementById('logContainer');
    const chartDiv = document.getElementById('chartContainer');
    if (!log || !chartDiv) return;
    
    document.querySelectorAll('.btn-view-toggle').forEach(b => b.classList.remove('active'));
    
    if (view === 'log') {
        log.style.display = 'block';
        chartDiv.style.display = 'none';
        document.querySelector('[data-view="log"]')?.classList.add('active');
    } else {
        log.style.display = 'none';
        chartDiv.style.display = 'block';
        document.querySelector('[data-view="chart"]')?.classList.add('active');
        if (!chart) initChart();
    }
}

// 🎯 ATUALIZAÇÃO EM TEMPO REAL DO TRADE ATIVO
function updateLiveTrade(tradeData) {
    if (!chart) return;
    
    const { currentPrice, entryPrice, direction, isProfit, priceDiff, priceDiffPercent } = tradeData;
    
    // 🔧 Garantir que plugins.annotation existe
    if (!chart.options.plugins) {
        chart.options.plugins = {};
    }
    if (!chart.options.plugins.annotation) {
        chart.options.plugins.annotation = { annotations: {} };
    }
    
    // Linha horizontal do preço de entrada
    chart.options.plugins.annotation.annotations = {
        entryLine: {
            type: 'line',
            yMin: entryPrice,
            yMax: entryPrice,
            borderColor: '#fbbf24',
            borderWidth: 2,
            borderDash: [10, 5],
            label: {
                display: true,
                content: `Entrada: ${entryPrice.toFixed(5)}`,
                position: 'start',
                backgroundColor: '#fbbf24',
                color: '#000'
            }
        },
        currentLine: {
            type: 'line',
            yMin: currentPrice,
            yMax: currentPrice,
            borderColor: isProfit ? '#22c55e' : '#ef4444',
            borderWidth: 3,
            label: {
                display: true,
                content: `${direction} | ${isProfit ? '🟢 LUCRO' : '🔴 PREJUÍZO'} | ${currentPrice.toFixed(5)}`,
                position: 'end',
                backgroundColor: isProfit ? '#22c55e' : '#ef4444',
                color: '#fff',
                font: { weight: 'bold', size: 12 }
            }
        }
    };
    
    // ⚡ Usar 'active' ao invés de 'none' para manter transições suaves
    chart.update('active');
    
    // 📊 Atualizar painel de status do trade (criar se não existir)
    updateTradeStatusPanel(tradeData);
}

function updateTradeStatusPanel(tradeData) {
    const { currentPrice, entryPrice, direction, isProfit, priceDiff, priceDiffPercent } = tradeData;
    
    let panel = document.getElementById('liveTradePanel');
    if (!panel) {
        // Criar painel
        panel = document.createElement('div');
        panel.id = 'liveTradePanel';
        panel.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: ${isProfit ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 1000;
            min-width: 220px;
            transition: all 0.3s ease;
        `;
        
        const chartContainer = document.getElementById('chartContainer');
        if (chartContainer) {
            chartContainer.style.position = 'relative';
            chartContainer.appendChild(panel);
        }
    }
    
    // Atualizar cor de fundo
    panel.style.background = isProfit ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    
    // Calcular movimento em pips (para pares de moedas normalmente é 4 casas decimais)
    const pips = (priceDiff * 10000).toFixed(1);
    
    panel.innerHTML = `
        <div style="font-size: 18px; margin-bottom: 8px;">
            ${isProfit ? '🟢 EM LUCRO' : '🔴 EM PREJUÍZO'}
        </div>
        <div style="font-size: 12px; opacity: 0.9; line-height: 1.6;">
            <div><strong>${direction}</strong> em ${entryPrice.toFixed(5)}</div>
            <div>Atual: <strong>${currentPrice.toFixed(5)}</strong></div>
            <div>Diferença: <strong>${priceDiff.toFixed(5)}</strong> (${pips} pips)</div>
            <div>Variação: <strong>${priceDiffPercent.toFixed(2)}%</strong></div>
        </div>
    `;
}

function clearLiveTradePanel() {
    const panel = document.getElementById('liveTradePanel');
    if (panel) {
        panel.remove();
    }
    
    // Limpar anotações do gráfico
    if (chart && chart.options.plugins.annotation) {
        chart.options.plugins.annotation.annotations = {};
        chart.update('none');
    }
}

window.initChart = initChart;
window.updateChart = updateChart;
window.clearChart = clearChart;
window.updateIndicators = updateIndicators;
window.switchView = switchView;
window.updateLiveTrade = updateLiveTrade; // 🎯 Nova função
window.clearLiveTradePanel = clearLiveTradePanel; // 🧹 Limpar painel

waitForChart(() => {
    console.log(' Chart Manager pronto');
    setTimeout(() => {
        if (document.getElementById('candlestickChart')) initChart();
    }, 2000);
});
