/**
 * modulations.js — Dijital modülasyon matematik motoru
 * ASK, FSK, PSK, QAM sembol eşleme ve sinyal üretimi
 * Natural binary eşleme (Gray kodlama yok)
 */

const Modulations = (() => {
    // ── Yardımcılar ──
    function bitsPerSymbol(M) {
        return Math.log2(M);
    }

    function splitBits(bitString, n) {
        const groups = [];
        for (let i = 0; i < bitString.length; i += n) {
            let group = bitString.slice(i, i + n);
            // Son grup eksikse 0 ile pad
            while (group.length < n) group += '0';
            groups.push(group);
        }
        return groups;
    }

    function indexFromBits(bits) {
        return parseInt(bits, 2);
    }

    function bitsFromIndex(index, n) {
        return index.toString(2).padStart(n, '0');
    }

    function roundN(val, decimals = 4) {
        return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    // ── ASK Sembol Eşleme ──
    // A_k = k + 1 → tam sayı genlik seviyeleri (1, 2, 3, ...)
    // FSK frekans mantığıyla aynı: kolay çizilir, küsüratsız
    function askMapping(M) {
        const n = bitsPerSymbol(M);
        const symbols = [];
        for (let k = 0; k < M; k++) {
            const amplitude = k + 1;
            symbols.push({
                index: k,
                bits: bitsFromIndex(k, n),
                amplitude: amplitude,
                I: amplitude,
                Q: 0
            });
        }
        return symbols;
    }

    // ── FSK Sembol Eşleme ──
    // f_k = f_base + k * Δf
    function fskMapping(M) {
        const n = bitsPerSymbol(M);
        const fBase = 1;  // normalize edilmiş temel frekans (carrier cycle/sembol)
        const deltaF = 1; // frekanslar arası fark
        const symbols = [];
        for (let k = 0; k < M; k++) {
            const freq = fBase + k * deltaF;
            symbols.push({
                index: k,
                bits: bitsFromIndex(k, n),
                frequency: freq,
                // FSK'da constellation anlamlı değil ama referans için:
                I: 0,
                Q: 0
            });
        }
        return symbols;
    }

    // ── PSK Sembol Eşleme ──
    // θ_k = 2πk / M (natural binary, k=0'dan başlanır)
    function pskMapping(M) {
        const n = bitsPerSymbol(M);
        const symbols = [];
        for (let k = 0; k < M; k++) {
            const phase = (2 * Math.PI * k) / M;
            symbols.push({
                index: k,
                bits: bitsFromIndex(k, n),
                phase: roundN(phase),
                phaseDeg: roundN((phase * 180) / Math.PI, 1),
                I: roundN(Math.cos(phase)),
                Q: roundN(Math.sin(phase))
            });
        }
        return symbols;
    }

    // ── QAM Sembol Eşleme ──
    // 2 iç içe çember: iç halka (genlik=1, ilk M/2 sembol), dış halka (genlik=2, son M/2 sembol)
    // Her halkada M/2 sembol eşit faz aralıklarıyla yerleştirilir
    function qamMapping(M) {
        const n = bitsPerSymbol(M);
        const symbols = [];
        const half = M / 2;

        // İç halka: genlik=1, ilk M/2 sembol
        for (let k = 0; k < half; k++) {
            const phase = (2 * Math.PI * k) / half;
            symbols.push({
                index: k,
                bits: bitsFromIndex(k, n),
                amplitude: 1,
                phase: roundN(phase),
                phaseDeg: roundN((phase * 180) / Math.PI, 1),
                I: roundN(1 * Math.cos(phase)),
                Q: roundN(1 * Math.sin(phase))
            });
        }

        // Dış halka: genlik=2, son M/2 sembol
        for (let k = 0; k < half; k++) {
            const phase = (2 * Math.PI * k) / half;
            symbols.push({
                index: half + k,
                bits: bitsFromIndex(half + k, n),
                amplitude: 2,
                phase: roundN(phase),
                phaseDeg: roundN((phase * 180) / Math.PI, 1),
                I: roundN(2 * Math.cos(phase)),
                Q: roundN(2 * Math.sin(phase))
            });
        }

        return symbols;
    }

    // ── Genel Mapping ──
    function getSymbolMapping(type, M) {
        switch (type) {
            case 'ASK': return askMapping(M);
            case 'FSK': return fskMapping(M);
            case 'PSK': return pskMapping(M);
            case 'QAM': return qamMapping(M);
            default: throw new Error('Bilinmeyen modülasyon tipi: ' + type);
        }
    }

    // ── Sinyal Üretimi ──
    function generateSignal(type, M, bitString) {
        const n = bitsPerSymbol(M);
        const groups = splitBits(bitString, n);
        const mapping = getSymbolMapping(type, M);

        const samplesPerSymbol = 200;
        // FSK'da frekans farkı görünür olsun diye 2 cycle, diğerlerinde 1 yeterli
        const carrierCyclesPerSymbol = type === 'FSK' ? 2 : 1;
        const Ts = 1; // sembol periyodu (normalize)
        const fc = carrierCyclesPerSymbol / Ts;

        const t = [];
        const signal = [];
        const symbolInfo = []; // her sembol için bilgi

        groups.forEach((bitGroup, symIdx) => {
            const symbolIndex = indexFromBits(bitGroup);
            const sym = mapping[symbolIndex];
            const tStart = symIdx * Ts;

            symbolInfo.push({
                index: symbolIndex,
                bits: bitGroup,
                tStart: tStart,
                tEnd: tStart + Ts,
                symbol: sym
            });

            for (let i = 0; i < samplesPerSymbol; i++) {
                const ti = tStart + (i / samplesPerSymbol) * Ts;
                t.push(roundN(ti, 6));

                let val = 0;
                switch (type) {
                    case 'ASK':
                        val = sym.amplitude * Math.sin(2 * Math.PI * fc * ti);
                        break;
                    case 'FSK': {
                        const fk = sym.frequency * (fc / carrierCyclesPerSymbol);
                        val = Math.sin(2 * Math.PI * fk * ti);
                        break;
                    }
                    case 'PSK':
                        val = Math.sin(2 * Math.PI * fc * ti + sym.phase);
                        break;
                    case 'QAM':
                        // A·sin(2πfc·t + θ) = I·sin(2πfc·t) + Q·cos(2πfc·t)
                        val = sym.I * Math.sin(2 * Math.PI * fc * ti) + sym.Q * Math.cos(2 * Math.PI * fc * ti);
                        break;
                }
                signal.push(roundN(val, 6));
            }
        });

        return { t, signal, symbolInfo, mapping, groups, bitsPerSymbol: n };
    }

    // ── Public API ──
    return {
        bitsPerSymbol,
        splitBits,
        getSymbolMapping,
        generateSignal
    };
})();
