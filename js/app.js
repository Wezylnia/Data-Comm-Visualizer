/**
 * app.js — UI orchestration, validation, tablo oluşturma
 */

document.addEventListener('DOMContentLoaded', () => {
    const elBitInput = document.getElementById('bitInput');
    const elModType  = document.getElementById('modType');
    const elModLevel = document.getElementById('modLevel');
    const elBtnDraw  = document.getElementById('btnDraw');
    const elError    = document.getElementById('errorMsg');
    const elResults  = document.getElementById('resultsSection');
    const elInfoGrid = document.getElementById('infoGrid');
    const elTableHead = document.getElementById('tableHead');
    const elTableBody = document.getElementById('tableBody');

    // ── Seviye dropdown'ını modülasyon tipine göre güncelle ──
    function updateLevelOptions() {
        const type = elModType.value;
        const currentVal = parseInt(elModLevel.value);
        const levels = type === 'QAM' ? [4, 8, 16] : [2, 4, 8, 16];
        elModLevel.innerHTML = '';
        levels.forEach(lv => {
            const opt = document.createElement('option');
            opt.value = lv;
            opt.textContent = lv;
            elModLevel.appendChild(opt);
        });
        // Mevcut değeri korumaya çalış
        if (levels.includes(currentVal)) {
            elModLevel.value = currentVal;
        } else {
            elModLevel.value = levels[0];
        }
    }
    elModType.addEventListener('change', updateLevelOptions);
    updateLevelOptions();

    // ── Hata göster/gizle ──
    function showError(msg) {
        elError.textContent = msg;
        elError.style.display = 'block';
        elResults.style.display = 'none';
    }
    function hideError() {
        elError.style.display = 'none';
    }

    // ── Validation ──
    function validate(bits, M) {
        if (!bits || bits.length === 0) {
            return 'Bit dizisi boş olamaz.';
        }
        if (!/^[01]+$/.test(bits)) {
            return 'Bit dizisi sadece 0 ve 1 içermelidir.';
        }
        const n = Modulations.bitsPerSymbol(M);
        if (bits.length < n) {
            return `En az ${n} bit gerekli (${M}-seviyeli modülasyon için sembol başına ${n} bit).`;
        }
        return null;
    }

    // ── Bilgi Bandı ──
    function renderInfoBanner(type, M, bits, signalData) {
        const n = signalData.bitsPerSymbol;
        const numSymbols = signalData.symbolInfo.length;
        const padded = bits.length % n !== 0;
        const totalBits = numSymbols * n;

        const items = [
            { label: 'Modülasyon', value: `${M}-${type}` },
            { label: 'Bit/Sembol', value: n },
            { label: 'Giriş Bitleri', value: bits.length },
            { label: 'Sembol Sayısı', value: numSymbols },
        ];
        if (padded) {
            items.push({ label: 'Pad', value: `${totalBits - bits.length} bit (0 eklendi)` });
        }

        elInfoGrid.innerHTML = items.map(it =>
            `<div class="info-item"><span class="info-label">${it.label}</span><span class="info-value">${it.value}</span></div>`
        ).join('');
    }

    // ── Tabloyu Oluştur ──
    function renderTable(type, mapping, activeIndices) {
        const activeSet = new Set(activeIndices);

        // Başlık
        let headers = ['#', 'Bit Dizisi'];
        switch (type) {
            case 'ASK': headers.push('Genlik (A)'); break;
            case 'FSK': headers.push('Frekans (f)'); break;
            case 'PSK': headers.push('Faz (°)'); break;
            case 'QAM': headers.push('Genlik', 'Faz (°)'); break;
        }
        elTableHead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';

        // Satırlar
        elTableBody.innerHTML = '';
        mapping.forEach(sym => {
            const isActive = activeSet.has(sym.index);
            const tr = document.createElement('tr');
            if (isActive) tr.classList.add('active-row');

            let cells = `<td>${sym.index}</td><td class="mono">${sym.bits}</td>`;
            switch (type) {
                case 'ASK':
                    cells += `<td>${sym.amplitude}</td>`;
                    break;
                case 'FSK':
                    cells += `<td>${sym.frequency}</td>`;
                    break;
                case 'PSK':
                    cells += `<td>${sym.phaseDeg}°</td>`;
                    break;
                case 'QAM':
                    cells += `<td>${sym.amplitude}</td>`;
                    cells += `<td>${sym.phaseDeg}°</td>`;
                    break;
            }
            tr.innerHTML = cells;
            elTableBody.appendChild(tr);
        });
    }

    // ── Ana Çizim ──
    function draw() {
        hideError();
        const bits = elBitInput.value.trim();
        const type = elModType.value;
        const M = parseInt(elModLevel.value);

        const err = validate(bits, M);
        if (err) { showError(err); return; }

        // Sinyal üret
        const signalData = Modulations.generateSignal(type, M, bits);
        const mapping = signalData.mapping;
        const activeIndices = [...new Set(signalData.symbolInfo.map(s => s.index))];

        // Bilgi bandı
        renderInfoBanner(type, M, bits, signalData);

        // Tablo
        renderTable(type, mapping, activeIndices);

        // Sonuçları önce göster (Plotly container boyutlarını ölçebilsin)
        elResults.style.display = 'block';

        // Grafikler
        Charts.drawConstellation('constellationPlot', type, M, mapping, activeIndices);
        Charts.drawWaveform('waveformPlot', signalData);

        elResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ── Event Listeners ──
    elBtnDraw.addEventListener('click', draw);

    // Enter ile de çizim
    elBitInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') draw();
    });

    // Select değiştiğinde eğer sonuçlar görünüyorsa yeniden çiz
    elModType.addEventListener('change', () => { if (elResults.style.display !== 'none') draw(); });
    elModLevel.addEventListener('change', () => { if (elResults.style.display !== 'none') draw(); });
});