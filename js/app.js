// ========================================
// Premoldaco - Visualizacao 2D e 3D
// ========================================

document.addEventListener('DOMContentLoaded', function () {

    // ── Scroll ao resultado ──
    var resultado = document.getElementById('resultado');
    if (resultado) {
        setTimeout(function () {
            resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 350);
    }

    // ── Toggles opcionais (Tela / Malha) ──
    function setupToggle(checkboxId, sectionId) {
        var cb = document.getElementById(checkboxId);
        var section = document.getElementById(sectionId);
        if (!cb || !section) return;
        function update() {
            if (cb.checked) {
                section.classList.remove('section-disabled');
            } else {
                section.classList.add('section-disabled');
            }
        }
        cb.addEventListener('change', update);
        update();
    }
    setupToggle('usar_tela', 'secao-tela');
    setupToggle('usar_malha', 'secao-malha');

    // ── Validacao ──
    var form = document.getElementById('calculatorForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            var c = parseFloat(document.getElementById('comprimento').value);
            var l = parseFloat(document.getElementById('largura').value);
            if (isNaN(c) || isNaN(l) || c <= 0 || l <= 0) {
                e.preventDefault();
                alert('Preencha todos os campos com valores validos.');
            }
        });
    }

    // ── Tabs ──
    var tabs = document.querySelectorAll('.viz-tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var target = tab.getAttribute('data-tab');
            document.querySelectorAll('.viz-panel').forEach(function (p) {
                p.classList.add('hidden');
            });
            document.getElementById('panel-' + target).classList.remove('hidden');

            if (target === '3d') draw3D();
            if (target === '2d') draw2D();
        });
    });

    // ── Se nao tem dados, sai ──
    if (typeof LAJE_DATA === 'undefined') return;

    var data = LAJE_DATA;

    // ============================
    // DESENHO 2D - PLANTA BAIXA
    // ============================
    var canvas2d = document.getElementById('canvas2d');
    if (canvas2d) {
        draw2D();
        window.addEventListener('resize', draw2D);
    }

    function draw2D() {
        var canvas = document.getElementById('canvas2d');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');

        var dpr = window.devicePixelRatio || 1;
        var containerWidth = canvas.parentElement.clientWidth - 40;
        var maxW = Math.min(containerWidth, 900);
        var maxH = 500;

        // Proporcao real
        var comp = data.comprimento;
        var larg = data.largura;
        var padding = 50;

        var scaleX = (maxW - padding * 2) / comp;
        var scaleY = (maxH - padding * 2) / larg;
        var scale = Math.min(scaleX, scaleY);

        var drawW = comp * scale;
        var drawH = larg * scale;
        var totalW = drawW + padding * 2;
        var totalH = drawH + padding * 2;

        canvas.style.width = totalW + 'px';
        canvas.style.height = totalH + 'px';
        canvas.width = totalW * dpr;
        canvas.height = totalH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var ox = padding;
        var oy = padding;

        // Fundo
        ctx.fillStyle = '#fafbfc';
        ctx.fillRect(0, 0, totalW, totalH);

        // Borda da laje
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(ox, oy, drawW, drawH);

        // Desenha trilhos e enchimento (isopor ou tijolo)
        var espaco = 0.43;
        var trilhoW = 0.12 * scale; // largura visual do trilho
        var numTrilhos = data.trilhos;
        var isTijolo = data.enchimento === 'tijolo';
        var fillColor = isTijolo ? '#c97b4a' : '#ffffff';
        var fillStroke = isTijolo ? '#8b5a2b' : '#e2e8f0';
        var placaH_m = isTijolo ? 0.25 : 0.40;

        for (var i = 0; i < numTrilhos; i++) {
            var x = ox + i * espaco * scale;

            // Enchimento entre trilhos
            if (i < numTrilhos - 1) {
                var isoX = x + trilhoW;
                var isoW = espaco * scale - trilhoW;
                ctx.fillStyle = fillColor;
                ctx.fillRect(isoX, oy, isoW, drawH);
                ctx.strokeStyle = fillStroke;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(isoX, oy, isoW, drawH);

                // Linhas horizontais (divisoes das placas/tijolos)
                var placaH = placaH_m * scale;
                ctx.strokeStyle = fillStroke;
                ctx.lineWidth = 0.5;
                for (var py = oy + placaH; py < oy + drawH; py += placaH) {
                    ctx.beginPath();
                    ctx.moveTo(isoX, py);
                    ctx.lineTo(isoX + isoW, py);
                    ctx.stroke();
                }
            }

            // Trilho (cinza)
            ctx.fillStyle = '#78909c';
            ctx.fillRect(x, oy, trilhoW, drawH);

            // Efeito de volume no trilho
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(x, oy, trilhoW * 0.3, drawH);
            ctx.fillStyle = 'rgba(0,0,0,0.08)';
            ctx.fillRect(x + trilhoW * 0.7, oy, trilhoW * 0.3, drawH);
        }

        // Borda externa reforco
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(ox, oy, drawW, drawH);

        // Cotas - comprimento (horizontal, embaixo)
        var cotaY = oy + drawH + 30;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ox, cotaY);
        ctx.lineTo(ox + drawW, cotaY);
        ctx.stroke();
        // Setas
        drawArrow(ctx, ox, cotaY, 'left');
        drawArrow(ctx, ox + drawW, cotaY, 'right');
        // Texto
        ctx.fillStyle = '#475569';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(comp.toFixed(2) + ' m', ox + drawW / 2, cotaY - 6);

        // Cotas - largura (vertical, direita)
        var cotaX = ox + drawW + 30;
        ctx.beginPath();
        ctx.moveTo(cotaX, oy);
        ctx.lineTo(cotaX, oy + drawH);
        ctx.stroke();
        drawArrow(ctx, cotaX, oy, 'up');
        drawArrow(ctx, cotaX, oy + drawH, 'down');
        ctx.save();
        ctx.translate(cotaX + 16, oy + drawH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(larg.toFixed(2) + ' m', 0, 0);
        ctx.restore();

        // Labels
        ctx.fillStyle = '#1e293b';
        ctx.font = '700 11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('TRILHOS: ' + data.trilhos + ' un', ox, oy - 14);
        ctx.textAlign = 'right';
        ctx.fillText((isTijolo ? 'TIJOLOS: ' : 'ISOPOR: ') + data.isopor + (isTijolo ? ' un' : ' placas'), ox + drawW, oy - 14);
    }

    function drawArrow(ctx, x, y, dir) {
        var s = 5;
        ctx.beginPath();
        if (dir === 'left') { ctx.moveTo(x, y); ctx.lineTo(x + s, y - s); ctx.lineTo(x + s, y + s); }
        if (dir === 'right') { ctx.moveTo(x, y); ctx.lineTo(x - s, y - s); ctx.lineTo(x - s, y + s); }
        if (dir === 'up') { ctx.moveTo(x, y); ctx.lineTo(x - s, y + s); ctx.lineTo(x + s, y + s); }
        if (dir === 'down') { ctx.moveTo(x, y); ctx.lineTo(x - s, y - s); ctx.lineTo(x + s, y - s); }
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
    }

    // ============================
    // DESENHO 3D - ISOMETRICO
    // ============================
    var canvas3dEl = document.getElementById('canvas3d');
    var rotSlider = document.getElementById('rotationSlider');
    var elevSlider = document.getElementById('elevationSlider');

    if (rotSlider) rotSlider.addEventListener('input', draw3D);
    if (elevSlider) elevSlider.addEventListener('input', draw3D);
    if (canvas3dEl) window.addEventListener('resize', function () {
        if (!document.getElementById('panel-3d').classList.contains('hidden')) draw3D();
    });

    function draw3D() {
        var canvas = document.getElementById('canvas3d');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');

        var dpr = window.devicePixelRatio || 1;
        var containerWidth = canvas.parentElement.clientWidth;
        var W = Math.min(containerWidth, 900);
        var H = 520;

        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var rotation = parseFloat(rotSlider ? rotSlider.value : 30) * Math.PI / 180;
        var elevation = parseFloat(elevSlider ? elevSlider.value : 35) * Math.PI / 180;

        var comp = data.comprimento;
        var larg = data.largura;
        var altTrilho = 0.15;
        var altIsopor = 0.12;

        // Escala para caber no canvas
        var maxDim = Math.max(comp, larg) * 1.6;
        var scale3d = Math.min(W, H) / maxDim * 0.55;

        var cx = W / 2;
        var cy = H / 2 + 20;

        // Projecao isometrica
        function project(x, y, z) {
            var cosR = Math.cos(rotation);
            var sinR = Math.sin(rotation);
            var cosE = Math.cos(elevation);
            var sinE = Math.sin(elevation);

            var rx = x * cosR - y * sinR;
            var ry = x * sinR + y * cosR;

            var sx = rx * scale3d;
            var sy = (ry * cosE - z * sinE) * scale3d;

            return { x: cx + sx, y: cy + sy };
        }

        // Fundo
        ctx.fillStyle = '#fafbfc';
        ctx.fillRect(0, 0, W, H);

        // Base da laje (chao)
        var baseColor = '#e8ecf0';
        var p0 = project(0, 0, 0);
        var p1 = project(comp, 0, 0);
        var p2 = project(comp, larg, 0);
        var p3 = project(0, larg, 0);

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#c0c8d0';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Coleta todos os elementos para ordenar por profundidade
        var elements = [];
        var espaco = 0.43;
        var trilhoW = 0.12;
        var numTrilhos = data.trilhos;

        for (var i = 0; i < numTrilhos; i++) {
            var tx = i * espaco;

            // Trilho
            elements.push({
                type: 'trilho',
                x: tx,
                depth: tx * Math.sin(rotation) + (larg / 2) * Math.cos(rotation)
            });

            // Isopor entre trilhos
            if (i < numTrilhos - 1) {
                var isoX = tx + trilhoW;
                elements.push({
                    type: 'isopor',
                    x: isoX,
                    width: espaco - trilhoW,
                    depth: (isoX + (espaco - trilhoW) / 2) * Math.sin(rotation) + (larg / 2) * Math.cos(rotation)
                });
            }
        }

        // Ordena por profundidade (de tras para frente)
        elements.sort(function (a, b) { return b.depth - a.depth; });

        // Desenha elementos
        var isTijolo3D = data.enchimento === 'tijolo';
        var fillTop = isTijolo3D ? '#c97b4a' : '#ffffff';
        var fillRight = isTijolo3D ? '#a86438' : '#f1f5f9';
        var fillFront = isTijolo3D ? '#8b5a2b' : '#e8ecf0';
        elements.forEach(function (el) {
            if (el.type === 'trilho') {
                drawBox3D(ctx, project, el.x, 0, 0, trilhoW, larg, altTrilho, '#78909c', '#607d8b', '#546e7a');
            } else {
                drawBox3D(ctx, project, el.x, 0, 0, el.width, larg, altIsopor, fillTop, fillRight, fillFront);
            }
        });

        // Cotas 3D
        ctx.fillStyle = '#475569';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';

        var labelComp1 = project(comp / 2, -0.6, 0);
        ctx.fillText(comp.toFixed(2) + ' m', labelComp1.x, labelComp1.y);

        var labelLarg1 = project(-0.6, larg / 2, 0);
        ctx.fillText(larg.toFixed(2) + ' m', labelLarg1.x, labelLarg1.y);

        // Titulo
        ctx.fillStyle = '#1e293b';
        ctx.font = '700 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Vista 3D - Laje Premoldada', W / 2, 24);
    }

    function drawBox3D(ctx, project, x, y, z, w, d, h, topColor, rightColor, frontColor) {
        // Face superior
        var t0 = project(x, y, h);
        var t1 = project(x + w, y, h);
        var t2 = project(x + w, y + d, h);
        var t3 = project(x, y + d, h);

        ctx.fillStyle = topColor;
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Face frontal
        var b2 = project(x + w, y + d, 0);
        var b3 = project(x, y + d, 0);

        ctx.fillStyle = frontColor;
        ctx.beginPath();
        ctx.moveTo(t3.x, t3.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(b3.x, b3.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.stroke();

        // Face lateral direita
        var b1 = project(x + w, y, 0);

        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.moveTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(b1.x, b1.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.stroke();

        // Face lateral esquerda
        var b0 = project(x, y, 0);

        ctx.fillStyle = rightColor;
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.lineTo(b3.x, b3.y);
        ctx.lineTo(b0.x, b0.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.stroke();
    }

});
