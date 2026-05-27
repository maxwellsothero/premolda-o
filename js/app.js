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

    // ── Gerenciamento de Cômodos ──
    var roomsContainer = document.getElementById('rooms-container');
    var btnAddRoom = document.getElementById('btn-add-room');

    function reindexRooms() {
        if (!roomsContainer) return;
        var rows = roomsContainer.querySelectorAll('.room-row');
        rows.forEach(function (row, i) {
            row.setAttribute('data-room-index', i);
            row.querySelector('.room-number').textContent = 'Comodo ' + (i + 1);
            row.querySelectorAll('input').forEach(function (input) {
                var n = input.getAttribute('name');
                if (n) {
                    input.setAttribute('name', n.replace(/rooms\[\d+\]/, 'rooms[' + i + ']'));
                }
            });
        });
    }

    function attachRemoveHandler(btn) {
        btn.addEventListener('click', function () {
            var rows = roomsContainer.querySelectorAll('.room-row');
            if (rows.length <= 1) {
                alert('O projeto precisa de pelo menos 1 comodo.');
                return;
            }
            btn.closest('.room-row').remove();
            reindexRooms();
        });
    }

    if (roomsContainer) {
        roomsContainer.querySelectorAll('.room-remove').forEach(attachRemoveHandler);
    }

    if (btnAddRoom && roomsContainer) {
        btnAddRoom.addEventListener('click', function () {
            var i = roomsContainer.querySelectorAll('.room-row').length;
            var div = document.createElement('div');
            div.className = 'room-row';
            div.setAttribute('data-room-index', i);
            div.innerHTML =
                '<div class="room-row-header">' +
                    '<span class="room-number">Comodo ' + (i + 1) + '</span>' +
                    '<button type="button" class="room-remove" title="Remover">&times;</button>' +
                '</div>' +
                '<div class="room-row-fields">' +
                    '<div class="form-group">' +
                        '<label>Nome <small style="font-weight:400; color:#888;">(opcional)</small></label>' +
                        '<input type="text" name="rooms[' + i + '][nome]" placeholder="Ex: Sala">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Largura</label>' +
                        '<div class="input-wrapper">' +
                            '<input type="number" name="rooms[' + i + '][largura]" step="0.01" min="0.01" placeholder="6.00" required>' +
                            '<span class="input-suffix">m</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Comprimento</label>' +
                        '<div class="input-wrapper">' +
                            '<input type="number" name="rooms[' + i + '][comprimento]" step="0.01" min="0.01" placeholder="10.00" required>' +
                            '<span class="input-suffix">m</span>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            roomsContainer.appendChild(div);
            attachRemoveHandler(div.querySelector('.room-remove'));
        });
    }

    // ── Validacao ──
    var form = document.getElementById('calculatorForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            var rows = roomsContainer ? roomsContainer.querySelectorAll('.room-row') : [];
            var hasValid = false;
            rows.forEach(function (row) {
                var inputs = row.querySelectorAll('input[type="number"]');
                var larg = parseFloat(inputs[0].value);
                var comp = parseFloat(inputs[1].value);
                if (!isNaN(larg) && !isNaN(comp) && larg > 0 && comp > 0) hasValid = true;
            });
            if (!hasValid) {
                e.preventDefault();
                alert('Preencha pelo menos um comodo com largura e comprimento validos.');
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

    // ============================
    // SELETOR DE CÔMODO PARA VISUALIZAÇÃO
    // ============================
    var roomSelector = document.getElementById('room-selector');
    if (roomSelector && data.rooms) {
        roomSelector.addEventListener('change', function () {
            var i = parseInt(roomSelector.value);
            var r = data.rooms[i];
            if (!r) return;
            data.comprimento = r.comprimento;
            data.largura = r.largura;
            data.trilhos = r.trilhos;
            data.isopor = r.enchimento;
            draw2D();
            var panel3d = document.getElementById('panel-3d');
            if (panel3d && !panel3d.classList.contains('hidden')) draw3D();
        });
    }

    // ============================
    // DOWNLOAD DE ORÇAMENTO PDF
    // ============================
    var btnPdf = document.getElementById('btn-download-pdf');
    if (btnPdf) {
        btnPdf.addEventListener('click', function () {
            generateBudgetPDF();
        });
    }

    function generateBudgetPDF() {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('Biblioteca de PDF nao carregada. Verifique sua conexao.');
            return;
        }
        var jsPDFCtor = window.jspdf.jsPDF;
        var doc = new jsPDFCtor({ unit: 'mm', format: 'a4' });
        var pageW = doc.internal.pageSize.getWidth();
        var marginX = 14;
        var y = 18;

        // Cabeçalho
        doc.setFillColor(13, 148, 136);
        doc.rect(0, 0, pageW, 28, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('PREMOLDACO', marginX, 14);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Orcamento de Materiais para Laje Premoldada', marginX, 21);
        var hoje = new Date();
        var dataStr = String(hoje.getDate()).padStart(2, '0') + '/' +
                      String(hoje.getMonth() + 1).padStart(2, '0') + '/' +
                      hoje.getFullYear();
        doc.text(dataStr, pageW - marginX, 14, { align: 'right' });

        y = 38;
        doc.setTextColor(30, 41, 59);

        // Identificação
        if (data.projeto || data.cliente) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            if (data.projeto) {
                doc.text('Projeto: ', marginX, y);
                doc.setFont('helvetica', 'normal');
                doc.text(data.projeto, marginX + 18, y);
                y += 6;
            }
            if (data.cliente) {
                doc.setFont('helvetica', 'bold');
                doc.text('Cliente: ', marginX, y);
                doc.setFont('helvetica', 'normal');
                doc.text(data.cliente, marginX + 18, y);
                y += 6;
            }
            y += 2;
        }

        // Resumo geral
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(13, 148, 136);
        doc.text('Resumo do Projeto', marginX, y);
        y += 6;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Numero de comodos: ' + data.rooms.length, marginX, y); y += 5;
        doc.text('Area total: ' + data.area_total.toFixed(2).replace('.', ',') + ' m2', marginX, y); y += 5;
        doc.text('Material de enchimento: ' + data.nome_enchimento, marginX, y); y += 5;
        doc.text('Peso total estimado: ' + Math.round(data.peso_total).toLocaleString('pt-BR') + ' kg', marginX, y); y += 8;

        // Tabela por cômodo
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(13, 148, 136);
        doc.text('Detalhamento por Comodo', marginX, y);
        y += 4;
        doc.setTextColor(30, 41, 59);

        var roomRows = data.rooms.map(function (r) {
            return [
                r.nome,
                r.largura.toFixed(2).replace('.', ',') + ' x ' + r.comprimento.toFixed(2).replace('.', ',') + ' m',
                r.area.toFixed(2).replace('.', ',') + ' m2',
                String(r.trilhos),
                r.enchimento + ' ' + data.unidade_enchimento,
                Math.round(r.peso).toLocaleString('pt-BR') + ' kg'
            ];
        });
        doc.autoTable({
            startY: y,
            head: [['Comodo', 'Dimensoes', 'Area', 'Trilhos', data.nome_enchimento, 'Peso']],
            body: roomRows,
            foot: [[
                'TOTAL',
                '',
                data.area_total.toFixed(2).replace('.', ',') + ' m2',
                String(data.total_trilhos),
                data.total_enchimento + ' ' + data.unidade_enchimento,
                Math.round(data.peso_total).toLocaleString('pt-BR') + ' kg'
            ]],
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [13, 148, 136], textColor: 255 },
            footStyles: { fillColor: [241, 245, 249], textColor: [13, 148, 136], fontStyle: 'bold' },
            margin: { left: marginX, right: marginX }
        });
        y = doc.lastAutoTable.finalY + 8;

        // Materiais totais
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(13, 148, 136);
        doc.text('Lista de Materiais', marginX, y);
        y += 4;
        doc.setTextColor(30, 41, 59);

        var materiais = [
            ['Trilhos (vigotas) - espacamento 0,43m', String(data.total_trilhos) + ' un'],
            [data.nome_enchimento, data.total_enchimento + ' ' + data.unidade_enchimento]
        ];
        if (data.tela.ativo) {
            var telaLinha = data.tela.qtd + ' telas (' + data.tela.qtd_margem + ' com +10% margem)';
            if (data.tela.complemento > 0) telaLinha += ' + ' + data.tela.complemento + ' Malha POP complemento';
            materiais.push([data.tela.nome + ' - ' + data.tela.desc, telaLinha]);
        }
        if (data.malha.ativo) {
            materiais.push([data.malha.nome + ' - ' + data.malha.desc + ' (+20% incluso)', data.malha.qtd + ' pecas']);
        }
        doc.autoTable({
            startY: y,
            head: [['Material', 'Quantidade']],
            body: materiais,
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [13, 148, 136], textColor: 255 },
            margin: { left: marginX, right: marginX },
            columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
        });
        y = doc.lastAutoTable.finalY + 10;

        // Observações
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'italic');
        var obs = 'Os calculos sao estimativas baseadas em dimensoes informadas. ' +
                  'Recomenda-se margem de 10% para perdas em trilhos e enchimento. ' +
                  'Tela ja inclui +10% e Malha POP +20% para emendas. ' +
                  'Consulte sempre um engenheiro estrutural antes da execucao.';
        var obsLines = doc.splitTextToSize(obs, pageW - marginX * 2);
        doc.text(obsLines, marginX, y);

        // Rodapé
        var pageH = doc.internal.pageSize.getHeight();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Premoldaco - Calculadora de Laje Premoldada', marginX, pageH - 8);
        doc.text('Gerado em ' + dataStr, pageW - marginX, pageH - 8, { align: 'right' });

        var filename = 'orcamento-laje-' + (data.projeto || 'projeto').replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-' + hoje.getTime() + '.pdf';
        doc.save(filename);
    }

});
