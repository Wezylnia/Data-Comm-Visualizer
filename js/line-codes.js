/**
 * line-codes.js — Hat Kodlama (Line Coding) motoru
 * NRZ-L, NRZ-I, Manchester, Differential Manchester, AMI, Pseudoternary, HDB3
 */

const LineCodes = (() => {

    const TYPES = ['NRZ-L', 'NRZ-I', 'Manchester', 'DiffManchester', 'AMI', 'Pseudoternary', 'HDB3'];

    function isLineCode(type) {
        return TYPES.includes(type);
    }

    // ────────────────────────────────────────
    //  NRZ-L: 1 → +V, 0 → −V
    // ────────────────────────────────────────
    function encodeNRZL(bits) {
        return bits.split('').map(b => ({ level: b === '1' ? 1 : -1, note: '' }));
    }

    // ────────────────────────────────────────
    //  NRZ-I: 1 → seviyeyi invertler, 0 → aynı kalır
    // ────────────────────────────────────────
    function encodeNRZI(bits) {
        let level = -1;
        return bits.split('').map(b => {
            if (b === '1') level = -level;
            return { level, note: '' };
        });
    }

    // ────────────────────────────────────────
    //  Manchester (IEEE 802.3)
    //  1 → yüksek→düşük, 0 → düşük→yüksek (orta-bit geçişi)
    // ────────────────────────────────────────
    function encodeManchester(bits) {
        return bits.split('').map(b => ({
            first:  b === '1' ?  1 : -1,
            second: b === '1' ? -1 :  1,
            note: ''
        }));
    }

    // ────────────────────────────────────────
    //  Differential Manchester
    //  Her bitte orta geçiş var.
    //  0 → başta geçiş, 1 → başta geçiş yok
    // ────────────────────────────────────────
    function encodeDiffManchester(bits) {
        let level = 1;
        return bits.split('').map(b => {
            if (b === '0') level = -level;
            const result = { first: level, second: -level, note: '' };
            level = -level;
            return result;
        });
    }

    // ────────────────────────────────────────
    //  AMI: 0 → 0V, 1 → sırayla +V / −V
    // ────────────────────────────────────────
    function encodeAMI(bits) {
        let lastPolarity = -1;
        return bits.split('').map(b => {
            if (b === '0') return { level: 0, note: '' };
            lastPolarity = -lastPolarity;
            return { level: lastPolarity, note: '' };
        });
    }

    // ────────────────────────────────────────
    //  Pseudoternary: 1 → 0V, 0 → sırayla +V / −V
    // ────────────────────────────────────────
    function encodePseudoternary(bits) {
        let lastPolarity = -1;
        return bits.split('').map(b => {
            if (b === '1') return { level: 0, note: '' };
            lastPolarity = -lastPolarity;
            return { level: lastPolarity, note: '' };
        });
    }

    // ────────────────────────────────────────
    //  HDB3: AMI + 4 ardışık sıfır ikamesi
    //  Tek 1-sayısı → 000V, Çift 1-sayısı → B00V
    // ────────────────────────────────────────
    function encodeHDB3(bits) {
        const bitArr = bits.split('');
        const result = [];
        let lastPolarity = -1;
        let onesSinceLastSub = 0;
        let i = 0;

        while (i < bitArr.length) {
            if (i + 3 < bitArr.length &&
                bitArr[i] === '0' && bitArr[i + 1] === '0' &&
                bitArr[i + 2] === '0' && bitArr[i + 3] === '0') {

                if (onesSinceLastSub % 2 === 0) {
                    // Çift → B00V
                    lastPolarity = -lastPolarity;
                    const bPulse = lastPolarity;
                    result.push({ level: bPulse, note: 'B' });
                    result.push({ level: 0, note: '' });
                    result.push({ level: 0, note: '' });
                    result.push({ level: bPulse, note: 'V' });
                } else {
                    // Tek → 000V
                    result.push({ level: 0, note: '' });
                    result.push({ level: 0, note: '' });
                    result.push({ level: 0, note: '' });
                    result.push({ level: lastPolarity, note: 'V' });
                }
                onesSinceLastSub = 0;
                i += 4;
            } else {
                if (bitArr[i] === '1') {
                    lastPolarity = -lastPolarity;
                    result.push({ level: lastPolarity, note: '' });
                    onesSinceLastSub++;
                } else {
                    result.push({ level: 0, note: '' });
                }
                i++;
            }
        }

        return result;
    }

    // ────────────────────────────────────────
    //  Sinyal Üretimi (çizim verisi)
    // ────────────────────────────────────────
    function generateSignal(type, bitString) {
        const bits = bitString;
        const isManchester = (type === 'Manchester' || type === 'DiffManchester');

        let encoded;
        switch (type) {
            case 'NRZ-L':          encoded = encodeNRZL(bits); break;
            case 'NRZ-I':          encoded = encodeNRZI(bits); break;
            case 'Manchester':      encoded = encodeManchester(bits); break;
            case 'DiffManchester':  encoded = encodeDiffManchester(bits); break;
            case 'AMI':            encoded = encodeAMI(bits); break;
            case 'Pseudoternary':  encoded = encodePseudoternary(bits); break;
            case 'HDB3':          encoded = encodeHDB3(bits); break;
            default: throw new Error('Bilinmeyen hat kodu: ' + type);
        }

        const t = [];
        const signal = [];
        const Tb = 1;

        if (isManchester) {
            encoded.forEach((pair, idx) => {
                const tStart = idx * Tb;
                t.push(tStart, tStart + Tb / 2);
                signal.push(pair.first, pair.first);
                t.push(tStart + Tb / 2, tStart + Tb);
                signal.push(pair.second, pair.second);
            });
        } else {
            encoded.forEach((item, idx) => {
                const tStart = idx * Tb;
                t.push(tStart, tStart + Tb);
                signal.push(item.level, item.level);
            });
        }

        return {
            t,
            signal,
            bits,
            encoded,
            type,
            isManchester,
            bitDuration: Tb,
            numBits: bits.length
        };
    }

    // ── Açıklamalar ──
    const descriptions = {
        'NRZ-L':          'Non-Return to Zero Level — 1 → +V, 0 → −V',
        'NRZ-I':          'Non-Return to Zero Inverted — 1 → seviye değişir, 0 → seviye aynı kalır',
        'Manchester':      'Manchester (IEEE 802.3) — 1 → yüksek→düşük, 0 → düşük→yüksek (orta-bit geçişi)',
        'DiffManchester':  'Differential Manchester — Her bitte orta geçiş. 0 → başta geçiş, 1 → başta geçiş yok',
        'AMI':            'Alternate Mark Inversion — 0 → 0V, 1 → sırayla +V / −V',
        'Pseudoternary':  'Pseudoternary — 1 → 0V, 0 → sırayla +V / −V',
        'HDB3':           'High Density Bipolar 3 — AMI tabanlı, 4 ardışık sıfır B00V veya 000V ile ikame edilir'
    };

    return { isLineCode, generateSignal, descriptions, TYPES };
})();
