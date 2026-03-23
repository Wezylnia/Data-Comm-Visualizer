/**
 * charts.js — Plotly.js ile constellation diyagramı ve dalga formu çizimi
 */

const Charts = (() => {

    const COLORS = {
        inactive: '#d1d5db',
        active: '#6366f1',
        activeFill: 'rgba(99,102,241,.7)',
        carrier: '#6366f1',
        digital: '#10b981',
        symbolBorder: 'rgba(107,114,128,.35)',
        circle: 'rgba(156,163,175,.4)',
        annotation: '#374151',
        grid: '#f3f4f6',
        axisLine: '#9ca3af'
    };

    const FONT = { family: 'Inter, sans-serif' };

    // ────────────────────────────────────────
    //  Constellation Diyagramı
    // ────────────────────────────────────────
    function drawConstellation(divId, type, M, mapping, activeIndices) {
        const div = document.getElementById(divId);
        if (!div) return;

        // FSK ve ASK için özel dot chart çizim
        if (type === 'FSK') {
            drawCategoryDotChart(divId, mapping, activeIndices, 'frequency', 'Frekans (normalize)');
            return;
        }
        if (type === 'ASK') {
            drawCategoryDotChart(divId, mapping, activeIndices, 'amplitude', 'Genlik (Amplitude)');
            return;
        }

        const activeSet = new Set(activeIndices);

        // Inactive noktalar
        const inactiveI = [], inactiveQ = [], inactiveText = [];
        // Active noktalar
        const activeIArr = [], activeQArr = [], activeText = [];

        mapping.forEach(sym => {
            if (activeSet.has(sym.index)) {
                activeIArr.push(sym.I);
                activeQArr.push(sym.Q);
                activeText.push(sym.bits);
            } else {
                inactiveI.push(sym.I);
                inactiveQ.push(sym.Q);
                inactiveText.push(sym.bits);
            }
        });

        const traces = [];

        // PSK birim çember
        if (type === 'PSK') {
            const theta = [];
            for (let a = 0; a <= 360; a += 1) theta.push(a * Math.PI / 180);
            traces.push({
                x: theta.map(a => Math.cos(a)),
                y: theta.map(a => Math.sin(a)),
                mode: 'lines',
                line: { color: COLORS.circle, width: 1.5, dash: 'dot' },
                hoverinfo: 'skip',
                showlegend: false
            });
        }

        // QAM: 2 iç içe çember
        if (type === 'QAM') {
            const theta = [];
            for (let a = 0; a <= 360; a += 1) theta.push(a * Math.PI / 180);
            // İç çember (genlik=1)
            traces.push({
                x: theta.map(a => 1 * Math.cos(a)),
                y: theta.map(a => 1 * Math.sin(a)),
                mode: 'lines',
                line: { color: COLORS.circle, width: 1.5, dash: 'dot' },
                hoverinfo: 'skip',
                showlegend: false
            });
            // Dış çember (genlik=2)
            traces.push({
                x: theta.map(a => 2 * Math.cos(a)),
                y: theta.map(a => 2 * Math.sin(a)),
                mode: 'lines',
                line: { color: COLORS.circle, width: 1.5, dash: 'dot' },
                hoverinfo: 'skip',
                showlegend: false
            });
        }

        // Inactive semboller
        traces.push({
            x: inactiveI, y: inactiveQ,
            mode: 'markers+text',
            marker: { size: 12, color: COLORS.inactive, line: { width: 1, color: '#9ca3af' } },
            text: inactiveText,
            textposition: 'top center',
            textfont: { size: 10, color: '#9ca3af', family: 'Courier New' },
            hovertemplate: 'I: %{x}<br>Q: %{y}<br>Bits: %{text}<extra>Pasif</extra>',
            name: 'Pasif Semboller',
            showlegend: true
        });

        // Active semboller
        traces.push({
            x: activeIArr, y: activeQArr,
            mode: 'markers+text',
            marker: { size: 14, color: COLORS.activeFill, line: { width: 2, color: COLORS.active }, symbol: 'circle' },
            text: activeText,
            textposition: 'top center',
            textfont: { size: 11, color: COLORS.active, family: 'Courier New', weight: 700 },
            hovertemplate: 'I: %{x}<br>Q: %{y}<br>Bits: %{text}<extra>Aktif</extra>',
            name: 'Aktif Semboller',
            showlegend: true
        });

        // Eksen limitleri
        const allI = mapping.map(s => s.I);
        const allQ = mapping.map(s => s.Q);
        const maxVal = Math.max(Math.max(...allI.map(Math.abs)), Math.max(...allQ.map(Math.abs)), 1) * 1.4;

        const layout = {
            font: FONT,
            height: div.clientHeight || 350,
            margin: { t: 20, r: 20, b: 50, l: 55 },
            xaxis: {
                title: 'In-Phase (I)',
                zeroline: true, zerolinewidth: 1.5, zerolinecolor: COLORS.axisLine,
                range: [-maxVal, maxVal],
                gridcolor: COLORS.grid,
                dtick: type === 'QAM' ? 1 : undefined
            },
            yaxis: {
                title: 'Quadrature (Q)',
                zeroline: true, zerolinewidth: 1.5, zerolinecolor: COLORS.axisLine,
                range: [-maxVal, maxVal],
                gridcolor: COLORS.grid,
                scaleanchor: 'x', scaleratio: 1
            },
            legend: { orientation: 'h', y: -0.15, x: 0.5, xanchor: 'center', font: { size: 11 } },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white'
        };

        Plotly.newPlot(div, traces, layout, { responsive: true, displaylogo: false });
    }

    // FSK / ASK ortak: kategori-değer dot chart
    function drawCategoryDotChart(divId, mapping, activeIndices, valueKey, yTitle) {
        const div = document.getElementById(divId);
        const activeSet = new Set(activeIndices);

        const colors = mapping.map(s => activeSet.has(s.index) ? COLORS.activeFill : COLORS.inactive);
        const lineColors = mapping.map(s => activeSet.has(s.index) ? COLORS.active : '#9ca3af');

        const trace = {
            x: mapping.map(s => s.bits),
            y: mapping.map(s => s[valueKey]),
            mode: 'markers',
            marker: {
                size: 16,
                color: colors,
                line: { width: 2, color: lineColors }
            },
            text: mapping.map(s => `${s[valueKey]}`),
            hovertemplate: 'Bits: %{x}<br>' + yTitle + ': %{y}<extra></extra>',
            showlegend: false
        };

        const layout = {
            font: FONT,
            height: div.clientHeight || 350,
            margin: { t: 20, r: 20, b: 55, l: 55 },
            xaxis: {
                title: 'Sembol (Bit Dizisi)',
                type: 'category',
                gridcolor: COLORS.grid
            },
            yaxis: {
                title: yTitle,
                gridcolor: COLORS.grid,
                zeroline: false,
                dtick: 1
            },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white'
        };

        Plotly.newPlot(div, [trace], layout, { responsive: true, displaylogo: false });
    }

    // ────────────────────────────────────────
    //  Zaman Domeni Dalga Formu
    // ────────────────────────────────────────
    function drawWaveform(divId, signalData) {
        const div = document.getElementById(divId);
        if (!div) return;

        const { t, signal, symbolInfo, bitsPerSymbol: n } = signalData;

        // -- Dijital veri bandı (üstteki subplot) --
        const digitalT = [];
        const digitalV = [];
        const allBits = symbolInfo.map(s => s.bits).join('');
        const bitDuration = symbolInfo.length > 0 ? (symbolInfo[0].tEnd - symbolInfo[0].tStart) / n : 1;

        for (let i = 0; i < allBits.length; i++) {
            const tStart = i * bitDuration;
            const tEnd = (i + 1) * bitDuration;
            const val = allBits[i] === '1' ? 1 : 0;
            digitalT.push(tStart, tEnd);
            digitalV.push(val, val);
        }

        const digitalTrace = {
            x: digitalT,
            y: digitalV,
            mode: 'lines',
            line: { color: COLORS.digital, width: 2.5, shape: 'hv' },
            name: 'Dijital Veri',
            xaxis: 'x',
            yaxis: 'y2',
            hovertemplate: 't: %{x:.3f}<br>Bit: %{y}<extra>Dijital</extra>'
        };

        // -- Modüle edilmiş sinyal --
        const signalTrace = {
            x: t,
            y: signal,
            mode: 'lines',
            line: { color: COLORS.carrier, width: 1.5 },
            name: 'Modüle Sinyal',
            xaxis: 'x',
            yaxis: 'y',
            hovertemplate: 't: %{x:.3f}<br>Genlik: %{y:.3f}<extra>Sinyal</extra>'
        };

        // -- Sembol sınırı dikey çizgileri & etiketleri --
        const shapes = [];
        const annotations = [];

        symbolInfo.forEach((sym, idx) => {
            // Dikey çizgi (sınır)
            if (idx > 0) {
                shapes.push({
                    type: 'line',
                    x0: sym.tStart, x1: sym.tStart,
                    y0: 0, y1: 1, yref: 'paper',
                    line: { color: COLORS.symbolBorder, width: 1.2, dash: 'dash' }
                });
            }

            // Bit grubu etiketi
            const tMid = (sym.tStart + sym.tEnd) / 2;
            annotations.push({
                x: tMid,
                y: 1.02,
                yref: 'paper',
                text: `<b>${sym.bits}</b>`,
                showarrow: false,
                font: { family: 'Courier New', size: 12, color: COLORS.active },
                yanchor: 'bottom'
            });
        });

        // Bit sınırları (dijital bant)
        for (let i = 1; i < allBits.length; i++) {
            const tBit = i * bitDuration;
            const isSymbolBorder = (i % n === 0);
            if (!isSymbolBorder) {
                shapes.push({
                    type: 'line',
                    x0: tBit, x1: tBit,
                    y0: 0.78, y1: 1, yref: 'paper',
                    line: { color: 'rgba(16,185,129,.25)', width: 0.8, dash: 'dot' }
                });
            }
        }

        // Bit etiketleri (dijital bandın içine)
        for (let i = 0; i < allBits.length; i++) {
            const tMid = (i + 0.5) * bitDuration;
            annotations.push({
                x: tMid,
                y: 0.5, yref: 'y2 domain',
                text: allBits[i],
                showarrow: false,
                font: { family: 'Courier New', size: 10, color: '#065f46' }
            });
        }

        const tMax = symbolInfo.length > 0 ? symbolInfo[symbolInfo.length - 1].tEnd : 1;
        const yMax = Math.max(...signal.map(Math.abs), 1) * 1.2;

        const layout = {
            font: FONT,
            height: div.clientHeight || 500,
            margin: { t: 35, r: 20, b: 50, l: 55 },
            xaxis: {
                title: 'Zaman (t)',
                range: [0, tMax],
                gridcolor: COLORS.grid,
                zeroline: false
            },
            yaxis: {
                title: 'Genlik',
                range: [-yMax, yMax],
                gridcolor: COLORS.grid,
                zeroline: true, zerolinecolor: '#d1d5db', zerolinewidth: 1,
                domain: [0, 0.72]
            },
            yaxis2: {
                range: [-0.15, 1.15],
                fixedrange: true,
                showticklabels: false,
                gridcolor: COLORS.grid,
                zeroline: false,
                domain: [0.78, 1]
            },
            shapes: shapes,
            annotations: annotations,
            legend: { orientation: 'h', y: -0.12, x: 0.5, xanchor: 'center', font: { size: 11 } },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white'
        };

        Plotly.newPlot(div, [signalTrace, digitalTrace], layout, { responsive: true, displaylogo: false });
    }

    return { drawConstellation, drawWaveform };
})();
