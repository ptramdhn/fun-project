/* ==========================================================================
   APP LOGIC: SPIN WHEEL PREMIUM (VOUCHER, JSON, ZONK MEMES & BACKSOUND)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const confettiCanvas = document.getElementById('confetti-canvas');
    const confettiCtx = confettiCanvas.getContext('2d');

    const spinBtn = document.getElementById('spin-button');
    const pointer = document.getElementById('wheel-pointer-id');

    // Voucher & Info Elements
    const voucherInput = document.getElementById('voucher-input');
    const claimVoucherBtn = document.getElementById('claim-voucher-btn');
    const voucherStatusMsg = document.getElementById('voucher-status-msg');
    const prizesTableBody = document.getElementById('prizes-table-body');
    const vouchersBadgesContainer = document.getElementById('vouchers-badges-container');

    // Tab buttons and content
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Settings elements
    const spinDurationInput = document.getElementById('spin-duration');
    const spinDurationVal = document.getElementById('spin-duration-val');
    const volumeInput = document.getElementById('volume-control');
    const volumeVal = document.getElementById('volume-val');
    const soundToggle = document.getElementById('sound-effects-toggle');
    const confettiToggle = document.getElementById('confetti-toggle');
    const paletteRadios = document.querySelectorAll('input[name="color-palette"]');

    // Results elements
    const resultsList = document.getElementById('results-list');
    const copyResultsBtn = document.getElementById('copy-results-btn');
    const clearResultsBtn = document.getElementById('clear-results-btn');

    // Winner Modal Elements
    const winnerModal = document.getElementById('winner-modal');
    const winnerModalTitle = document.getElementById('winner-modal-title');
    const modalDescText = document.getElementById('modal-desc-text');
    const winnerNameDisplay = document.getElementById('winner-name-display');
    const zonkMediaContainer = document.getElementById('zonk-media-container');
    const zonkImage = document.getElementById('zonk-image');
    const zonkQuote = document.getElementById('zonk-quote');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // --- APPLICATION STATE ---
    let prizes = [];
    let configVouchers = [];
    let usedVouchers = new Set();
    let claimedVoucherCode = null; // Voucher divalidasi & siap digunakan
    let results = [];

    // Audio Context (Synthesized effects)
    let audioCtx = null;

    // YouTube Player for Zonk Backsound
    let ytPlayer = null;

    // Spin Physics state
    let isSpinning = false;
    let wheelAngle = 0; // dalam radian
    let lastWinningIndex = -1;
    let selectedWinnerIndex = -1; // Pemenang yang sudah ditentukan di awal putar

    // Confetti state
    let confettiParticles = [];
    let isConfettiActive = false;
    let confettiAnimationId = null;

    // Default configuration values
    const config = {
        spinDuration: 6, // detik (dibuat tegang)
        volume: 0.8, // 0 ke 1
        soundEnabled: true,
        confettiEnabled: true,
        palette: 'rainbow'
    };

    // --- PALETTE DEFINITIONS ---
    const PALETTES = {
        rainbow: ['#ff007f', '#ff7b00', '#ffd700', '#39ff14', '#00f2fe', '#8b00ff'],
        neon: ['#ff007f', '#00f2fe', '#a100ff', '#05ffa1', '#ffd700'],
        sunset: ['#f12711', '#f5af19', '#e73c7e', '#ff4e50', '#f9d423'],
        ocean: ['#00c6ff', '#0072ff', '#00f2fe', '#4a00e0', '#2b5876'],
        forest: ['#11998e', '#38ef7d', '#134e5e', '#71b280', '#1b4d3e']
    };

    // --- ZONK MEME IMAGES AND MOCKING QUOTES ---
    const ZONK_MEMES = [
        {
            image: '/images/IMG_20251003_235747.jpg.jpeg',
            quotes: [
                "Muka kamu pas dapet Zonk mirip banget sama filter ini! Wkwkwk! 🤪",
                "Liat nih muka kamu, lucuuu kan? Tapi lebih lucu lagi usaha kamu yang sia-sia dapet Zonk! 😂",
                "Yee... ngarep dapet iPhone ya? Mending liat filter muka kocak ini dulu biar gak stress! 😜"
            ]
        },
        {
            image: '/images/IMG_20251221_143614.jpg.jpeg',
            quotes: [
                "Ngapain mandi kalo ujung-ujungnya tetep dapet ZONK? 🚿😜 Hahaha, sia-sia amat!",
                "Mandi udah wangi, cantik maksimal, eh tapi takdir tetep dapet ZONK! Sad... 🤣",
                "Kata foto ini: 'Ngapain mandi?' mending coba lagi aja sapatau tetep Zonk! 🤪"
            ]
        },
        {
            image: '/images/IMG_20260127_190557.jpg.jpeg',
            quotes: [
                "Wleeeeee! Kena zonk! Kasihan deh kamu, makanya jangan terlalu berharap! 😜",
                "Melet dulu ah biar makin kesel! ZONK lagi kan, kasihan deh kamu! 🤪",
                "Ngarep dapet rumah ya? Dikasih melet aja nih dari jauh! Hahaha! 😂"
            ]
        },
        {
            image: '/images/IMG_20260205_000836.jpg.jpeg',
            quotes: [
                "Tuh ditunjuk mukanya, mukanya langsung layu dapet Zonk! Tetot! 🤪",
                "Pencet pipi dulu biar dapet hoki, eh ternyata zonk juga. Coba lagi gih! 🤣",
                "Cemberut ya dapet zonk? Tuh ditunjuk mukanya biar keliatan sedihnya! 😜"
            ]
        },
        {
            image: '/images/IMG_20260206_003254.jpg.jpeg',
            quotes: [
                "Mikir keras ya kenapa dapet zonk mulu? 🤔 Ya karena emang takdirmu hari ini dapet zonk!",
                "Hmm... dapet apa ya? Oh tentu saja dapet Zonk! Gak usah sok mikir hoki deh! 😂",
                "Pose mikir cantik, padahal hatinya menangis karena dapet Zonk! 🤪"
            ]
        }
    ];

    // --- INITIALIZATION ---
    async function init() {
        // Load configurations
        const storedConfig = localStorage.getItem('spinwheel_config');
        if (storedConfig) {
            Object.assign(config, JSON.parse(storedConfig));
            applyConfigToUI();
        }

        // Load used vouchers from LocalStorage
        const storedUsedVouchers = localStorage.getItem('spinwheel_used_vouchers');
        if (storedUsedVouchers) {
            usedVouchers = new Set(JSON.parse(storedUsedVouchers));
        }

        // Load winner results
        const storedResults = localStorage.getItem('spinwheel_results');
        if (storedResults) {
            results = JSON.parse(storedResults);
            updateResultsUI();
        }

        // Initialize YouTube Player API global callback
        window.onYouTubeIframeAPIReady = function () {
            ytPlayer = new YT.Player('yt-player', {
                height: '1',
                width: '1',
                videoId: 'Rsq68BjHui8',
                playerVars: {
                    'autoplay': 0,
                    'controls': 0,
                    'disablekb': 1,
                    'fs': 0,
                    'rel': 0,
                    'showinfo': 0,
                    'origin': window.location.origin
                },
                events: {
                    'onReady': () => {
                        if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
                            ytPlayer.setVolume(config.volume * 100);
                        }
                    }
                }
            });
        };

        // Load YouTube IFrame API script
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Load database JSON
        try {
            const response = await fetch('/wheel-data.json');
            if (!response.ok) throw new Error('Gagal memuat database JSON');
            const data = await response.json();

            prizes = data.prizes || [];
            configVouchers = data.vouchers || [];

            renderPrizesTable();
            renderVouchersUI();
        } catch (error) {
            console.error('Error loading database:', error);
            showVoucherStatus('Gagal memuat data roda! Pastikan server berjalan.', 'error');
        }

        // Setup Resize Listener
        resizeConfettiCanvas();
        window.addEventListener('resize', () => {
            resizeConfettiCanvas();
            drawWheel();
        });

        drawWheel();
    }

    function saveConfigToStorage() {
        localStorage.setItem('spinwheel_config', JSON.stringify(config));
    }

    function saveUsedVouchersToStorage() {
        localStorage.setItem('spinwheel_used_vouchers', JSON.stringify(Array.from(usedVouchers)));
    }

    function saveResultsToStorage() {
        localStorage.setItem('spinwheel_results', JSON.stringify(results));
    }

    function applyConfigToUI() {
        spinDurationInput.value = config.spinDuration;
        spinDurationVal.textContent = config.spinDuration;

        volumeInput.value = Math.round(config.volume * 100);
        volumeVal.textContent = Math.round(config.volume * 100) + '%';

        soundToggle.checked = config.soundEnabled;
        confettiToggle.checked = config.confettiEnabled;

        paletteRadios.forEach(radio => {
            const label = radio.closest('.palette-option');
            if (radio.value === config.palette) {
                radio.checked = true;
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    }

    // --- RENDER SIDEBAR INFO (PRIZES & VOUCHERS) ---
    function renderPrizesTable() {
        if (prizes.length === 0) {
            prizesTableBody.innerHTML = '<tr><td class="text-center">Tidak ada data hadiah</td></tr>';
            return;
        }

        // Render hadiah tanpa kolom persentase peluang
        prizesTableBody.innerHTML = prizes.map(p => {
            const style = p.isZonk ? 'color: var(--text-muted); font-size: 0.85rem;' : 'font-weight: 600; color: #fff;';
            return `
                <tr style="${style}">
                    <td>${escapeHTML(p.name)}</td>
                </tr>
            `;
        }).join('');
    }

    function renderVouchersUI() {
        if (!vouchersBadgesContainer) return;
        if (configVouchers.length === 0) {
            vouchersBadgesContainer.innerHTML = '<span class="text-muted">Tidak ada voucher</span>';
            return;
        }

        vouchersBadgesContainer.innerHTML = configVouchers.map(code => {
            const isUsed = usedVouchers.has(code);
            const badgeClass = isUsed ? 'voucher-badge used' : 'voucher-badge';
            const titleAttr = isUsed ? 'Voucher sudah terpakai' : 'Klik untuk menyalin voucher';
            return `
                <span class="${badgeClass}" title="${titleAttr}" data-code="${escapeHTML(code)}">
                    ${escapeHTML(code)}
                </span>
            `;
        }).join('');

        // Listener untuk badge voucher
        vouchersBadgesContainer.querySelectorAll('.voucher-badge:not(.used)').forEach(badge => {
            badge.addEventListener('click', () => {
                const code = badge.getAttribute('data-code');
                voucherInput.value = code;
                validateVoucher(code);
            });
        });
    }

    // --- VOUCHER VALIDATION SYSTEM ---
    function validateVoucher(code) {
        code = code.trim().toUpperCase();
        if (code === '') {
            showVoucherStatus('Masukkan kode voucher terlebih dahulu.', 'error');
            claimedVoucherCode = null;
            return false;
        }

        const isRegistered = configVouchers.some(v => v.toUpperCase() === code);
        if (!isRegistered) {
            showVoucherStatus('Kode voucher tidak valid / tidak terdaftar!', 'error');
            claimedVoucherCode = null;
            return false;
        }

        if (usedVouchers.has(code)) {
            showVoucherStatus('Voucher ini sudah pernah digunakan!', 'error');
            claimedVoucherCode = null;
            return false;
        }

        showVoucherStatus('Voucher valid! Silakan klik tombol SPIN atau tekan Space.', 'success');
        claimedVoucherCode = code;
        return true;
    }

    function showVoucherStatus(msg, type) {
        voucherStatusMsg.textContent = msg;
        voucherStatusMsg.className = 'voucher-status-msg ' + (type || '');
    }

    claimVoucherBtn.addEventListener('click', () => {
        validateVoucher(voucherInput.value);
    });

    voucherInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validateVoucher(voucherInput.value);
        }
    });

    // --- WEB AUDIO API SYNTHESIS (TICK SOUND) ---
    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTickSound() {
        if (!config.soundEnabled || config.volume <= 0) return;
        try {
            initAudioContext();

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.03);

            gain.gain.setValueAtTime(config.volume * 0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + 0.04);
        } catch (e) {
            console.warn('Audio synthesis failed:', e);
        }
    }

    function playWinnerSound() {
        if (!config.soundEnabled || config.volume <= 0) return;
        try {
            initAudioContext();
            const now = audioCtx.currentTime;

            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];

            notes.forEach((freq, index) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + index * 0.08);

                gain.gain.setValueAtTime(0, now + index * 0.08);
                gain.gain.linearRampToValueAtTime(config.volume * 0.25, now + index * 0.08 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.35);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(now + index * 0.08);
                osc.stop(now + index * 0.08 + 0.4);
            });
        } catch (e) {
            console.warn('Winner audio synthesis failed:', e);
        }
    }

    // --- CANVAS CONFETTI SYSTEM ---
    function resizeConfettiCanvas() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }

    class Confetti {
        constructor() {
            this.x = Math.random() * confettiCanvas.width;
            this.y = Math.random() * confettiCanvas.height - confettiCanvas.height;
            this.r = Math.floor(Math.random() * 6) + 4;
            this.d = Math.random() * confettiCanvas.height;
            this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
            this.tilt = Math.random() * 10 - 5;
            this.tiltAngleIncremental = Math.random() * 0.07 + 0.02;
            this.tiltAngle = 0;
            this.velocity = {
                x: Math.random() * 4 - 2,
                y: Math.random() * 3 + 2
            };
        }

        update() {
            this.y += this.velocity.y;
            this.x += this.velocity.x;
            this.tiltAngle += this.tiltAngleIncremental;
            this.tilt = Math.sin(this.tiltAngle) * 12;
            return this.y <= confettiCanvas.height && this.x >= -20 && this.x <= confettiCanvas.width + 20;
        }

        draw() {
            confettiCtx.beginPath();
            confettiCtx.lineWidth = this.r;
            confettiCtx.strokeStyle = this.color;
            confettiCtx.moveTo(this.x + this.tilt + this.r / 2, this.y);
            confettiCtx.lineTo(this.x + this.tilt, this.y + this.tilt + this.r / 2);
            confettiCtx.stroke();
        }
    }

    function spawnBurstConfetti() {
        if (!config.confettiEnabled) return;

        isConfettiActive = true;
        confettiParticles = [];

        const count = 160;
        for (let i = 0; i < count; i++) {
            const p = new Confetti();
            p.y = confettiCanvas.height + Math.random() * 20;
            p.x = i % 2 === 0 ? Math.random() * 100 : confettiCanvas.width - Math.random() * 100;
            p.velocity.y = -(Math.random() * 8 + 10);
            p.velocity.x = i % 2 === 0 ? Math.random() * 10 + 2 : -(Math.random() * 10 + 2);
            confettiParticles.push(p);
        }

        if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
        animateConfetti();
    }

    function animateConfetti() {
        if (!isConfettiActive) return;
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        confettiParticles = confettiParticles.filter(p => {
            const keep = p.update();
            if (keep) {
                p.velocity.y += 0.15;
                p.velocity.x *= 0.99;
                p.draw();
            }
            return keep;
        });

        if (confettiParticles.length < 50 && confettiParticles.length > 0) {
            isConfettiActive = false;
        }

        if (isConfettiActive || confettiParticles.length > 0) {
            confettiAnimationId = requestAnimationFrame(animateConfetti);
        } else {
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        }
    }

    // --- WHEEL DRAWING ENGINE ---
    function drawWheel() {
        const size = Math.min(canvas.parentElement.clientWidth, 600);
        canvas.width = size;
        canvas.height = size;

        const radius = size / 2;
        const centerX = radius;
        const centerY = radius;

        ctx.clearRect(0, 0, size, size);

        if (prizes.length === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius - 15, 0, 2 * Math.PI);
            ctx.fillStyle = '#1e2030';
            ctx.fill();

            ctx.fillStyle = '#6b7280';
            ctx.font = '600 18px Outfit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Memuat data juring roda...', centerX, centerY);
            return;
        }

        const arcSize = (2 * Math.PI) / prizes.length;
        const palette = PALETTES[config.palette] || PALETTES.rainbow;

        // 1. Draw Segments
        for (let i = 0; i < prizes.length; i++) {
            const startAngle = i * arcSize + wheelAngle;
            const endAngle = startAngle + arcSize;
            const color = palette[i % palette.length];

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius - 10, startAngle, endAngle);
            ctx.closePath();

            ctx.fillStyle = color;
            ctx.fill();

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.stroke();
        }

        // 2. Draw Text on Segments
        ctx.save();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        let fontSize = Math.max(10, Math.min(16, 280 / prizes.length));
        ctx.font = `600 ${fontSize}px Outfit`;

        for (let i = 0; i < prizes.length; i++) {
            const startAngle = i * arcSize + wheelAngle;
            const textAngle = startAngle + arcSize / 2;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(textAngle);

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 4;

            let displayName = prizes[i].name;
            const maxTextWidth = radius - 70;
            if (ctx.measureText(displayName).width > maxTextWidth) {
                while (ctx.measureText(displayName + '...').width > maxTextWidth && displayName.length > 0) {
                    displayName = displayName.slice(0, -1);
                }
                displayName += '...';
            }

            ctx.fillText(displayName, radius - 30, 0);
            ctx.restore();
        }
        ctx.restore();

        // 3. Draw Outer Ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 9, 0, 2 * Math.PI);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#10121d';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 12, 0, 2 * Math.PI);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.stroke();
    }

    // --- WEIGHTED RANDOM SELECTION ---
    function selectWeightedPrize() {
        const r = Math.random();
        let cumulativeProb = 0;

        for (let i = 0; i < prizes.length; i++) {
            cumulativeProb += prizes[i].probability;
            if (r <= cumulativeProb) {
                return i;
            }
        }
        return prizes.length - 1; // Fallback
    }

    // --- SPIN LOGIC ---
    function startSpinWheel() {
        if (prizes.length === 0 || isSpinning) return;

        if (!claimedVoucherCode) {
            const isValid = validateVoucher(voucherInput.value);
            if (!isValid) return;
        }

        const codeToBurn = claimedVoucherCode;

        // Burn voucher
        usedVouchers.add(codeToBurn);
        saveUsedVouchersToStorage();
        renderVouchersUI();

        claimedVoucherCode = null;
        voucherInput.value = '';
        showVoucherStatus('Voucher digunakan untuk putaran ini!', 'success');

        initAudioContext();

        // Buka blokir pemutaran otomatis audio YouTube di browser
        if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
            try {
                ytPlayer.playVideo();
                ytPlayer.pauseVideo();
            } catch (err) {
                console.log("YouTube player unlock failed:", err);
            }
        }

        isSpinning = true;
        spinBtn.disabled = true;
        voucherInput.disabled = true;
        claimVoucherBtn.disabled = true;

        isConfettiActive = false;
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        // 1. Tentukan pemenang
        selectedWinnerIndex = selectWeightedPrize();
        const winnerObj = prizes[selectedWinnerIndex];

        // 2. Hitung target sudut berhenti
        const arcSize = (2 * Math.PI) / prizes.length;
        const segmentOffset = (0.25 + Math.random() * 0.5) * arcSize;
        const localTarget = selectedWinnerIndex * arcSize + segmentOffset;

        const startAngle = wheelAngle;
        const currentAngleMod = startAngle % (2 * Math.PI);
        const targetAngleMod = (2 * Math.PI - localTarget) % (2 * Math.PI);

        let angleDiff = targetAngleMod - currentAngleMod;
        if (angleDiff < 0) {
            angleDiff += 2 * Math.PI;
        }

        const spinsCount = 8 + Math.floor(Math.random() * 4);
        const totalRotation = spinsCount * 2 * Math.PI + angleDiff;

        const startTime = performance.now();
        const duration = config.spinDuration * 1000; // ms

        lastWinningIndex = -1;

        function animateSpin(currentTime) {
            const elapsed = currentTime - startTime;

            if (elapsed >= duration) {
                wheelAngle = (startAngle + totalRotation) % (2 * Math.PI);
                drawWheel();

                isSpinning = false;
                spinBtn.disabled = false;
                voucherInput.disabled = false;
                claimVoucherBtn.disabled = false;

                announceWinner(winnerObj);
            } else {
                const progress = elapsed / duration;
                const ease = 1 - Math.pow(1 - progress, 5);
                wheelAngle = startAngle + ease * totalRotation;

                drawWheel();

                if (prizes.length > 0) {
                    const normalizedAngle = (2 * Math.PI - (wheelAngle % (2 * Math.PI))) % (2 * Math.PI);
                    const currentIdx = Math.floor(normalizedAngle / arcSize);

                    if (currentIdx !== lastWinningIndex) {
                        playTickSound();
                        triggerPointerAnimation();
                        lastWinningIndex = currentIdx;
                    }
                }

                requestAnimationFrame(animateSpin);
            }
        }

        requestAnimationFrame(animateSpin);
    }

    function triggerPointerAnimation() {
        pointer.classList.add('tick');
        setTimeout(() => {
            pointer.classList.remove('tick');
        }, 45);
    }

    // --- WINNER ANNOUNCEMENT & MODAL CONTROLLER ---
    function announceWinner(winnerObj) {
        winnerNameDisplay.textContent = winnerObj.name;
        winnerModal.classList.add('active');

        if (winnerObj.isZonk) {
            // Pengaturan khusus ZONK (Meme ngeledek & backsound)
            winnerNameDisplay.className = 'winner-glow zonk-text';
            winnerModalTitle.textContent = 'Yah, Zonk! 😢';
            modalDescText.textContent = 'Nasibmu kurang beruntung:';

            // Pilih gambar meme & quote acak sesuai index meme
            const memeIndex = Math.floor(Math.random() * ZONK_MEMES.length);
            const meme = ZONK_MEMES[memeIndex];
            const quoteText = meme.quotes[Math.floor(Math.random() * meme.quotes.length)];

            zonkImage.src = meme.image;
            zonkQuote.textContent = quoteText;
            zonkMediaContainer.style.display = 'flex';

            // Putar backsound YouTube Shorts (Akibat Terlalu Berharap meme)
            if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
                try {
                    ytPlayer.setVolume(config.volume * 100);
                    ytPlayer.seekTo(0);
                    ytPlayer.playVideo();
                } catch (err) {
                    console.warn("Gagal memutar audio youtube:", err);
                }
            }
        } else {
            // Hadiah Utama (Confetti & Chime)
            winnerNameDisplay.className = 'winner-glow prize-text';
            winnerModalTitle.textContent = 'Selamat! 🎉';
            modalDescText.textContent = 'Hadiah yang berhasil didapatkan:';
            zonkMediaContainer.style.display = 'none';

            playWinnerSound();
            spawnBurstConfetti();

            // Hentikan lagu YouTube jika sedang berjalan
            if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
                try {
                    ytPlayer.pauseVideo();
                } catch (err) {
                    console.error(err);
                }
            }
        }

        // Catat ke riwayat
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        results.unshift({ name: winnerObj.name, time: timeNow });
        saveResultsToStorage();
        updateResultsUI();

        showVoucherStatus('Voucher telah hangus digunakan. Masukkan voucher baru.', '');
    }

    function closeWinnerModal() {
        winnerModal.classList.remove('active');

        // Matikan backsound YouTube Zonk saat modal ditutup
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
            try {
                ytPlayer.pauseVideo();
            } catch (err) {
                console.error(err);
            }
        }

        setTimeout(() => {
            isConfettiActive = false;
        }, 1200);
    }

    // --- SIDEBAR TABS CONTROLS ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- SETTINGS TAB ACTIONS ---
    spinDurationInput.addEventListener('input', (e) => {
        config.spinDuration = parseInt(e.target.value);
        spinDurationVal.textContent = config.spinDuration;
        saveConfigToStorage();
    });

    volumeInput.addEventListener('input', (e) => {
        config.volume = parseInt(e.target.value) / 100;
        volumeVal.textContent = e.target.value + '%';
        saveConfigToStorage();

        // Set volume YouTube player juga
        if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
            try {
                ytPlayer.setVolume(config.volume * 100);
            } catch (err) {
                console.error(err);
            }
        }
    });

    soundToggle.addEventListener('change', (e) => {
        config.soundEnabled = e.target.checked;
        saveConfigToStorage();
        initAudioContext();
    });

    confettiToggle.addEventListener('change', (e) => {
        config.confettiEnabled = e.target.checked;
        saveConfigToStorage();
    });

    paletteRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                config.palette = e.target.value;
                paletteRadios.forEach(r => r.closest('.palette-option').classList.remove('active'));
                e.target.closest('.palette-option').classList.add('active');

                saveConfigToStorage();
                drawWheel();
            }
        });
    });

    // --- RESULTS TAB ACTIONS ---
    function updateResultsUI() {
        if (results.length === 0) {
            resultsList.innerHTML = '<li class="empty-state">Belum ada pemenang yang diacak</li>';
            return;
        }

        resultsList.innerHTML = results.map(item => `
            <li>
                <span class="winner-text">🎉 ${escapeHTML(item.name)}</span>
                <span class="time-stamp">${item.time}</span>
            </li>
        `).join('');
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    copyResultsBtn.addEventListener('click', () => {
        if (results.length === 0) {
            alert('Tidak ada riwayat hasil untuk disalin!');
            return;
        }
        const textToCopy = results.map((item, index) => `${index + 1}. ${item.name} (${item.time})`).join('\n');
        navigator.clipboard.writeText(textToCopy)
            .then(() => alert('Riwayat pemenang berhasil disalin ke clipboard!'))
            .catch(err => console.error('Gagal menyalin text: ', err));
    });

    clearResultsBtn.addEventListener('click', () => {
        if (results.length === 0) return;
        if (confirm('Apakah Anda yakin ingin menghapus seluruh riwayat pemenang?')) {
            results = [];
            saveResultsToStorage();
            updateResultsUI();
        }
    });

    // --- MODAL CLICK HANDLERS ---
    spinBtn.addEventListener('click', startSpinWheel);
    closeModalBtn.addEventListener('click', closeWinnerModal);

    winnerModal.addEventListener('click', (e) => {
        if (e.target === winnerModal) {
            closeWinnerModal();
        }
    });

    // Spacebar to SPIN
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !isSpinning && document.activeElement !== voucherInput) {
            e.preventDefault();
            startSpinWheel();
        }
    });

    // --- INIT APPLICATION ---
    init();
});
