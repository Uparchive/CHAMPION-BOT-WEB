// ═══════════════════════════════════════════════════════════════
// CHART MANAGER - Gráfico Profissional com Animações
// ═══════════════════════════════════════════════════════════════

let candlestickChart = null;
let chartData = {
    candles: [],
    trades: [], // Armazena trades executados
    indicators: {
        rsi: null,
        macd: null,
        adx: null,
        signal: null
    }
};

// Plugin customizado para desenhar marcadores de trade
const tradeMarkersPlugin = {
    id: 'tradeMarkers',
    afterDatasetsDraw(chart, args, options) {
        const ctx = chart.ctx;
        const trades = chartData.trades || [];
        
        trades.forEach(trade => {
            // Encontra o índice da vela correspondente
            const candleIndex = chartData.candles.findIndex(c => 
                Math.abs(c.epoch - trade.epoch) < 60 // Mesma vela (tolerância de 60s)
            );
            
            if (candleIndex === -1) return;
            
            // Calcula posição no gráfico
            const meta = chart.getDatasetMeta(1); // Dataset de fechamento
            const point = meta.data[candleIndex];
            
            if (!point) return;
            
            const x = point.x;
            const y = point.y;
            
            // Cor baseada na direção
            const isCall = trade.direction === 'CALL';
            const color = isCall ? '#22c55e' : '#ef4444';
            const bgColor = isCall ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
            
            // Desenha círculo externo (animação de pulso)
            const time = Date.now() - trade.timestamp;
            const pulseScale = 1 + Math.sin(time / 500) * 0.15;
            
            ctx.save();
            
            // Anel de pulso
            ctx.beginPath();
            ctx.arc(x, y, 12 * pulseScale, 0, Math.PI * 2);
            ctx.fillStyle = bgColor;
            ctx.fill();
            
            // Círculo principal
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
            
            // Ícone de seta
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(isCall ? '▲' : '▼', x, y);
            
            // Label com informações
            const labelY = isCall ? y - 25 : y + 25;
            const labelText = `${trade.symbol} $${trade.stake.toFixed(2)}`;
            
            // Fundo do label
            ctx.font = '11px "Segoe UI", Arial';
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(x - textWidth / 2 - 6, labelY - 10, textWidth + 12, 20);
            
            // Borda do label
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(x - textWidth / 2 - 6, labelY - 10, textWidth + 12, 20);
            
            // Texto do label
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, x, labelY);
            
            ctx.restore();
        });
    }
};

// Registra o plugin
Chart.register(tradeMarkersPlugin);

// Inicializa o gráfico profissional
function initChart() {
    const canvas = document.getElementById('candlestickChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Gradientes profissionais
    const gradient1 = ctx.createLinearGradient(0, 0, 0, 300);
    gradient1.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
    gradient1.addColorStop(1, 'rgba(118, 75, 162, 0.05)');

    const gradient2 = ctx.createLinearGradient(0, 0, 0, 300);
    gradient2.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
    gradient2.addColorStop(1, 'rgba(118, 75, 162, 0.3)');

    // Configuração profissional do gráfico
    candlestickChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Máxima',
                    data: [],
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.2,
                    borderDash: [5, 5]
                },
                {
                    label: 'Fechamento',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: gradient1,
                    borderWidth: 3,
                    pointRadius: 3,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#667eea',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3,
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Mínima',
                    data: [],
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.2,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#ffffff',
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyColor: '#ffffff',
                    bodyFont: {
                        size: 12
                    },
                    borderColor: 'rgba(102, 126, 234, 0.8)',
                    borderWidth: 2,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: function(context) {
                            return '⏰ ' + context[0].label;
                        },
                        label: function(context) {
                            const index = context.dataIndex;
                            const candle = chartData.candles[index];
                            if (candle) {
                                const change = candle.close - candle.open;
                                const changePercent = ((change / candle.open) * 100).toFixed(2);
                                const changeIcon = change >= 0 ? '📈' : '📉';
                                
                                return [
                                    `${changeIcon} Abertura: $${candle.open.toFixed(4)}`,
                                    `📊 Máxima: $${candle.high.toFixed(4)}`,
                                    `📊 Mínima: $${candle.low.toFixed(4)}`,
                                    `💰 Fechamento: $${candle.close.toFixed(4)}`,
                                    `${change >= 0 ? '🟢' : '🔴'} Variação: ${changePercent}%`
                                ];
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)',
                        drawBorder: false,
                        lineWidth: 1
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 8
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)',
                        drawBorder: false,
                        lineWidth: 1
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        callback: function(value) {
                            return '$' + value.toFixed(4);
                        },
                        padding: 8
                    }
                }
            }
        }
    });

    // Inicia animação de atualização dos marcadores
    setInterval(() => {
        if (candlestickChart && chartData.trades.length > 0) {
            candlestickChart.update('none');
        }
    }, 50); // 20 FPS para animação suave

    console.log('📈 Gráfico profissional inicializado');
}

// Atualiza o gráfico com novas velas
function updateChart(candles) {
    if (!candlestickChart || !candles || candles.length === 0) return;

    // Armazena as velas
    chartData.candles = candles;

    // Limita para as últimas 40 velas (melhor visualização)
    const displayCandles = candles.slice(-40);

    // Prepara os dados
    const labels = displayCandles.map(candle => {
        const date = new Date(candle.epoch * 1000);
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    });

    const highs = displayCandles.map(c => c.high);
    const closes = displayCandles.map(c => c.close);
    const lows = displayCandles.map(c => c.low);

    // Atualiza os dados do gráfico
    candlestickChart.data.labels = labels;
    candlestickChart.data.datasets[0].data = highs;
    candlestickChart.data.datasets[1].data = closes;
    candlestickChart.data.datasets[2].data = lows;
    
    // Atualização sem animação para performance
    candlestickChart.update('none');

    console.log(`📊 Gráfico atualizado com ${displayCandles.length} velas`);
}

// Atualiza os indicadores técnicos
function updateIndicators(indicators) {
    if (!indicators) return;

    chartData.indicators = indicators;

    // Atualiza RSI
    const rsiEl = document.getElementById('rsiValue');
    if (rsiEl && indicators.rsi !== undefined) {
        rsiEl.textContent = indicators.rsi.toFixed(2);
        rsiEl.style.color = indicators.rsi > 70 ? '#ef4444' : 
                            indicators.rsi < 30 ? '#22c55e' : '#ffffff';
    }

    // Atualiza MACD
    const macdEl = document.getElementById('macdValue');
    if (macdEl && indicators.macd !== undefined) {
        macdEl.textContent = indicators.macd.toFixed(4);
        macdEl.style.color = indicators.macd > 0 ? '#22c55e' : '#ef4444';
    }

    // Atualiza ADX
    const adxEl = document.getElementById('adxValue');
    if (adxEl && indicators.adx !== undefined) {
        adxEl.textContent = indicators.adx.toFixed(2);
        adxEl.style.color = indicators.adx > 25 ? '#22c55e' : 
                            indicators.adx > 20 ? '#fbbf24' : '#ffffff';
    }

    // Atualiza Sinal
    const signalEl = document.getElementById('signalValue');
    if (signalEl && indicators.signal) {
        signalEl.textContent = indicators.signal.toUpperCase();
        signalEl.className = 'indicator-value signal';
        
        if (indicators.signal === 'buy' || indicators.signal === 'compra') {
            signalEl.classList.add('buy');
        } else if (indicators.signal === 'sell' || indicators.signal === 'venda') {
            signalEl.classList.add('sell');
        } else {
            signalEl.classList.add('neutral');
        }
    }
}

// Alterna entre visualização de log e gráfico
function switchView(view) {
    const logContainer = document.getElementById('logContainer');
    const chartContainer = document.getElementById('chartContainer');
    const buttons = document.querySelectorAll('.btn-view-toggle');

    if (view === 'log') {
        logContainer.style.display = 'block';
        chartContainer.style.display = 'none';
        console.log('📋 Visualização: Log');
    } else if (view === 'chart') {
        logContainer.style.display = 'none';
        chartContainer.style.display = 'flex';
        
        // Inicializa o gráfico se ainda não foi criado
        if (!candlestickChart) {
            initChart();
        }
        
        console.log('📈 Visualização: Gráfico');
    }

    // Atualiza botões ativos
    buttons.forEach(btn => {
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Adiciona marcadores de trade no gráfico
function addTradeMarker(trade) {
    if (!candlestickChart || !trade) return;

    // Adiciona trade ao array com timestamp para animação
    const tradeMarker = {
        ...trade,
        timestamp: Date.now()
    };
    
    chartData.trades.push(tradeMarker);
    
    // Limita a 10 trades visíveis (últimos)
    if (chartData.trades.length > 10) {
        chartData.trades.shift();
    }
    
    // Força redesenho com animação
    candlestickChart.update();
    
    console.log(`📍 Marcador de trade adicionado: ${trade.direction} ${trade.symbol} $${trade.stake}`);
    
    // Remove automaticamente após 5 minutos
    setTimeout(() => {
        const index = chartData.trades.indexOf(tradeMarker);
        if (index > -1) {
            chartData.trades.splice(index, 1);
            candlestickChart.update('none');
        }
    }, 300000); // 5 minutos
}

// Limpa o gráfico
function clearChart() {
    if (candlestickChart) {
        candlestickChart.data.labels = [];
        candlestickChart.data.datasets[0].data = [];
        candlestickChart.data.datasets[1].data = [];
        candlestickChart.data.datasets[2].data = [];
        candlestickChart.update();
    }
    
    chartData = {
        candles: [],
        trades: [],
        indicators: {
            rsi: null,
            macd: null,
            adx: null,
            signal: null
        }
    };

    // Reseta indicadores
    const rsiEl = document.getElementById('rsiValue');
    const macdEl = document.getElementById('macdValue');
    const adxEl = document.getElementById('adxValue');
    const signalEl = document.getElementById('signalValue');
    
    if (rsiEl) rsiEl.textContent = '--';
    if (macdEl) macdEl.textContent = '--';
    if (adxEl) adxEl.textContent = '--';
    if (signalEl) {
        signalEl.textContent = '--';
        signalEl.className = 'indicator-value signal neutral';
    }

    console.log('🧹 Gráfico limpo');
}

// Exporta funções globalmente
window.initChart = initChart;
window.updateChart = updateChart;
window.updateIndicators = updateIndicators;
window.switchView = switchView;
window.addTradeMarker = addTradeMarker;
window.clearChart = clearChart;

console.log('📊 Chart Manager Profissional carregado');
