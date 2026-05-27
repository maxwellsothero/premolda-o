<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premoldaco - Calculadora de Laje</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>

<header class="header">
    <div class="container">
        <div class="logo">
            <div class="logo-icon">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="20" width="36" height="6" rx="1" fill="#fff" opacity="0.9"/>
                    <rect x="6" y="14" width="4" height="12" rx="1" fill="#FFD700"/>
                    <rect x="18" y="14" width="4" height="12" rx="1" fill="#FFD700"/>
                    <rect x="30" y="14" width="4" height="12" rx="1" fill="#FFD700"/>
                    <rect x="10" y="14" width="8" height="12" rx="1" fill="#fff" opacity="0.3"/>
                    <rect x="22" y="14" width="8" height="12" rx="1" fill="#fff" opacity="0.3"/>
                </svg>
            </div>
            <div>
                <h1>Premoldaco</h1>
                <span class="logo-subtitle">Calculadora de Laje Premoldada</span>
            </div>
        </div>
    </div>
</header>

<main class="main">
    <div class="container">

        <div class="intro">
            <h2>Calcule os materiais da sua laje</h2>
            <p>Informe as medidas do vao para saber a quantidade de trilhos, isopor, tela e malha.</p>
        </div>

        <?php
        // ── Dados dos produtos ──
        $telas = [
            'Q138' => ['nome' => 'TELA Q138', 'desc' => '2,45x6,00m (10x10 - 4,2mm)', 'larg' => 2.45, 'comp' => 6.00],
            'Q196' => ['nome' => 'TELA Q196', 'desc' => '2,45x6,00m (10x10 - 5,0mm)', 'larg' => 2.45, 'comp' => 6.00],
            'Q61'  => ['nome' => 'TELA Q61',  'desc' => '2,45x6,00m (15x15 - 3,4mm)', 'larg' => 2.45, 'comp' => 6.00],
            'Q92'  => ['nome' => 'TELA Q92',  'desc' => '2,45x6,00m (15x15 - 4,2mm)', 'larg' => 2.45, 'comp' => 6.00],
        ];

        $malhas = [
            'LEVE'      => ['nome' => 'MALHA POP LEVE',      'desc' => '2x3m (20x20 - 3,4mm)', 'larg' => 2, 'comp' => 3],
            'MEDIA'     => ['nome' => 'MALHA POP MEDIA',     'desc' => '2x3m (15x15 - 3,4mm)', 'larg' => 2, 'comp' => 3],
            'PESADA'    => ['nome' => 'MALHA POP PESADA',    'desc' => '2x3m (10x10 - 4,2mm)', 'larg' => 2, 'comp' => 3],
            'REFORCADA' => ['nome' => 'MALHA POP REFORCADA', 'desc' => '2x3m (15x15 - 4,2mm)', 'larg' => 2, 'comp' => 3],
        ];

        // ── Valores do formulario ──
        $comprimento = isset($_POST['comprimento']) ? floatval($_POST['comprimento']) : 0;
        $largura = isset($_POST['largura']) ? floatval($_POST['largura']) : 0;
        $tela_sel = isset($_POST['tela']) ? $_POST['tela'] : 'Q138';
        $malha_sel = isset($_POST['malha']) ? $_POST['malha'] : 'LEVE';
        $enchimento = (isset($_POST['enchimento']) && $_POST['enchimento'] === 'tijolo') ? 'tijolo' : 'isopor';
        $usar_tela = isset($_POST['usar_tela']);
        $usar_malha = isset($_POST['usar_malha']);
        $calculado = isset($_POST['calcular']) && $comprimento > 0 && $largura > 0;

        if ($calculado) {
            $maior = max($comprimento, $largura);
            $menor = min($comprimento, $largura);
            $comprimento_calc = $maior;
            $largura_calc = $menor;
            $area = $largura_calc * $comprimento_calc;

            // Trilhos
            $qtd_trilhos = ceil($comprimento_calc / 0.43);

            // Enchimento (Isopor ou Tijolo Ceramico)
            if ($enchimento === 'tijolo') {
                $qtd_enchimento = ceil($area * 12);
                $peso_enchimento = $area * 60;
                $nome_enchimento = 'Tijolo Ceramico';
                $unidade_enchimento = 'tijolos';
                $fator_enchimento = 12;
                $peso_m2_enchimento = 60;
            } else {
                $qtd_enchimento = ceil($area * 2.3);
                $peso_enchimento = $area * 18;
                $nome_enchimento = 'Isopor (EPS)';
                $unidade_enchimento = 'placas';
                $fator_enchimento = 2.3;
                $peso_m2_enchimento = 18;
            }
            $qtd_isopor = $qtd_enchimento;

            // Area da malha POP (todas sao 2x3 = 6m2)
            $area_malha_complemento = 6;

            // Tela - apenas se marcado
            if ($usar_tela) {
                $tela_info = $telas[$tela_sel];
                $area_tela = $tela_info['larg'] * $tela_info['comp'];
                $qtd_tela_bruta = $area / $area_tela;

                // SEM MARGEM: qtd base + regra do complemento
                $qtd_tela_sem_base = floor($qtd_tela_bruta);
                $sobra_tela_sem = $area - ($qtd_tela_sem_base * $area_tela);
                $complemento_tela_sem = 0;
                if ($sobra_tela_sem > 0) {
                    if ($sobra_tela_sem < $area_malha_complemento) {
                        $complemento_tela_sem = 1; // adiciona 1 malha POP
                    } else {
                        $qtd_tela_sem_base += 1; // adiciona mais 1 tela
                        // verifica se ainda sobra depois de adicionar a tela
                        $sobra_apos = $area - ($qtd_tela_sem_base * $area_tela);
                        if ($sobra_apos > 0) {
                            $complemento_tela_sem = 1;
                        }
                    }
                }
                $qtd_tela_sem = $qtd_tela_sem_base;

                // COM MARGEM (+10%): mesma regra
                $area_com_margem_tela = $area * 1.10;
                $qtd_tela_com_base = floor($area_com_margem_tela / $area_tela);
                $sobra_tela_com = $area_com_margem_tela - ($qtd_tela_com_base * $area_tela);
                $complemento_tela_com = 0;
                if ($sobra_tela_com > 0) {
                    if ($sobra_tela_com < $area_malha_complemento) {
                        $complemento_tela_com = 1;
                    } else {
                        $qtd_tela_com_base += 1;
                        $sobra_apos = $area_com_margem_tela - ($qtd_tela_com_base * $area_tela);
                        if ($sobra_apos > 0) {
                            $complemento_tela_com = 1;
                        }
                    }
                }
                $qtd_tela_com = $qtd_tela_com_base;
            }

            // Malha (+20%) - apenas se marcado
            if ($usar_malha) {
                $malha_info = $malhas[$malha_sel];
                $area_malha = $malha_info['larg'] * $malha_info['comp'];
                $qtd_malha_bruta = $area / $area_malha;
                $qtd_malha = ceil($qtd_malha_bruta * 1.20);
            }
        }
        ?>

        <div class="calculator-layout">
            <!-- FORMULARIO -->
            <div class="card card-form">
                <div class="card-header">
                    <div class="card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                            <rect x="4" y="2" width="16" height="20" rx="2"/>
                            <line x1="8" y1="6" x2="16" y2="6"/>
                            <line x1="8" y1="10" x2="10" y2="10"/>
                            <line x1="14" y1="10" x2="16" y2="10"/>
                            <line x1="8" y1="14" x2="10" y2="14"/>
                            <line x1="14" y1="14" x2="16" y2="14"/>
                            <line x1="8" y1="18" x2="16" y2="18"/>
                        </svg>
                    </div>
                    <h3>Medidas do Vao</h3>
                </div>

                <form id="calculatorForm" method="post" action="">
                    <div class="form-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="largura">Largura</label>
                                <div class="input-wrapper">
                                    <input type="number" id="largura" name="largura" step="0.01" min="0.01"
                                           placeholder="6.00"
                                           value="<?php echo $largura > 0 ? htmlspecialchars($_POST['largura']) : ''; ?>"
                                           required>
                                    <span class="input-suffix">m</span>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="comprimento">Comprimento</label>
                                <div class="input-wrapper">
                                    <input type="number" id="comprimento" name="comprimento" step="0.01" min="0.01"
                                           placeholder="10.00"
                                           value="<?php echo $comprimento > 0 ? htmlspecialchars($_POST['comprimento']) : ''; ?>"
                                           required>
                                    <span class="input-suffix">m</span>
                                </div>
                            </div>
                        </div>
                        <small class="form-hint">O sistema identifica automaticamente o maior lado como comprimento dos trilhos.</small>

                        <!-- SECAO ENCHIMENTO -->
                        <div class="form-group" style="margin-top:1rem;">
                            <label for="enchimento">Material de Enchimento</label>
                            <div class="select-wrapper">
                                <select id="enchimento" name="enchimento">
                                    <option value="isopor" <?php echo ($enchimento === 'isopor') ? 'selected' : ''; ?>>Isopor (EPS) - 2,3 placas/m&sup2; - 18 kg/m&sup2;</option>
                                    <option value="tijolo" <?php echo ($enchimento === 'tijolo') ? 'selected' : ''; ?>>Tijolo Ceramico - 12 tijolos/m&sup2; - 60 kg/m&sup2;</option>
                                </select>
                            </div>
                            <small class="form-hint">Escolha entre isopor (mais leve) ou tijolo ceramico (estrutural).</small>
                        </div>

                        <!-- SECAO TELA (OPCIONAL) -->
                        <div class="form-section <?php echo (isset($_POST['usar_tela']) ? '' : 'section-disabled'); ?>" id="secao-tela">
                            <label class="toggle-section">
                                <input type="checkbox" name="usar_tela" id="usar_tela" value="1" <?php echo isset($_POST['usar_tela']) ? 'checked' : ''; ?>>
                                <span class="toggle-switch"></span>
                                <span class="section-icon section-icon-tela">
                                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                        <path d="M3 4h14v1H3V4zm0 3h14v1H3V7zm0 3h14v1H3v-1zm0 3h14v1H3v-1zm0 3h14v1H3v-1z"/>
                                        <path d="M4 3v14h1V3H4zm3 0v14h1V3H7zm3 0v14h1V3h-1zm3 0v14h1V3h-1zm3 0v14h1V3h-1z"/>
                                    </svg>
                                </span>
                                <span>Incluir Tela de Aco</span>
                                <span class="optional-badge">Opcional</span>
                            </label>
                            <div class="section-content" id="content-tela">
                                <div class="form-group">
                                    <label for="tela">Modelo da Tela</label>
                                    <div class="select-wrapper">
                                        <select id="tela" name="tela">
                                            <?php foreach ($telas as $key => $t): ?>
                                            <option value="<?php echo $key; ?>" <?php echo ($tela_sel === $key) ? 'selected' : ''; ?>>
                                                <?php echo $t['nome'] . ' - ' . $t['desc']; ?>
                                            </option>
                                            <?php endforeach; ?>
                                        </select>
                                    </div>
                                    <small class="form-hint">Acrescimo automatico de 10% para perdas e emendas.</small>
                                </div>
                            </div>
                        </div>

                        <!-- SECAO MALHA (OPCIONAL) -->
                        <div class="form-section <?php echo (isset($_POST['usar_malha']) ? '' : 'section-disabled'); ?>" id="secao-malha">
                            <label class="toggle-section">
                                <input type="checkbox" name="usar_malha" id="usar_malha" value="1" <?php echo isset($_POST['usar_malha']) ? 'checked' : ''; ?>>
                                <span class="toggle-switch"></span>
                                <span class="section-icon section-icon-malha">
                                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                        <path d="M2 2h4v4H2V2zm6 0h4v4H8V2zm6 0h4v4h-4V2zM2 8h4v4H2V8zm6 0h4v4H8V8zm6 0h4v4h-4V8zM2 14h4v4H2v-4zm6 0h4v4H8v-4zm6 0h4v4h-4v-4z"/>
                                    </svg>
                                </span>
                                <span>Incluir Malha POP</span>
                                <span class="optional-badge">Opcional</span>
                            </label>
                            <div class="section-content" id="content-malha">
                                <div class="form-group">
                                    <label for="malha">Modelo da Malha</label>
                                    <div class="select-wrapper">
                                        <select id="malha" name="malha">
                                            <?php foreach ($malhas as $key => $m): ?>
                                            <option value="<?php echo $key; ?>" <?php echo ($malha_sel === $key) ? 'selected' : ''; ?>>
                                                <?php echo $m['nome'] . ' - ' . $m['desc']; ?>
                                            </option>
                                            <?php endforeach; ?>
                                        </select>
                                    </div>
                                    <small class="form-hint">Acrescimo automatico de 20% para perdas e emendas.</small>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="btn-calculate" name="calcular">
                            Calcular Materiais
                        </button>
                    </div>
                </form>

                <?php if ($calculado): ?>
                <div class="formula-box">
                    <h4>Formulas utilizadas</h4>
                    <div class="formula-item">
                        <span class="formula-label fl-trilho">Trilhos</span>
                        <code><?php echo number_format($comprimento_calc, 2, ',', '.'); ?> / 0,43 = <strong><?php echo $qtd_trilhos; ?></strong></code>
                    </div>
                    <div class="formula-item">
                        <span class="formula-label <?php echo ($enchimento === 'tijolo') ? 'fl-tijolo' : 'fl-isopor'; ?>"><?php echo ($enchimento === 'tijolo') ? 'Tijolo' : 'Isopor'; ?></span>
                        <code>(<?php echo number_format($largura_calc, 2, ',', '.'); ?> &times; <?php echo number_format($comprimento_calc, 2, ',', '.'); ?>) &times; <?php echo number_format($fator_enchimento, ($enchimento === 'tijolo' ? 0 : 1), ',', '.'); ?> = <?php echo number_format($area * $fator_enchimento, 1, ',', '.'); ?> &asymp; <strong><?php echo $qtd_enchimento; ?> <?php echo $unidade_enchimento; ?></strong></code>
                    </div>
                    <?php if ($usar_tela): ?>
                    <div class="formula-item">
                        <span class="formula-label fl-tela">Tela</span>
                        <code><?php echo number_format($area, 2, ',', '.'); ?> / <?php echo number_format($area_tela, 2, ',', '.'); ?> = <strong><?php echo $qtd_tela_sem; ?> telas</strong><?php if ($complemento_tela_sem > 0): ?> + 1 Malha POP (faltam <?php echo number_format($sobra_tela_sem, 2, ',', '.'); ?> m&sup2;)<?php endif; ?></code>
                    </div>
                    <?php endif; ?>
                    <?php if ($usar_malha): ?>
                    <div class="formula-item">
                        <span class="formula-label fl-malha">Malha</span>
                        <code><?php echo number_format($area, 2, ',', '.'); ?> / <?php echo number_format($area_malha, 2, ',', '.'); ?> = <?php echo number_format($qtd_malha_bruta, 2, ',', '.'); ?> + 20% = <strong><?php echo $qtd_malha; ?></strong></code>
                    </div>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
            </div>

            <!-- RESULTADO -->
            <?php if ($calculado): ?>
            <div class="card card-result" id="resultado">
                <div class="card-header">
                    <div class="card-icon icon-success">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="22" height="22">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                    </div>
                    <h3>Resultado</h3>
                </div>

                <!-- Area -->
                <div class="result-cards">
                    <div class="result-card rc-area rc-full">
                        <span class="rc-value"><?php echo number_format($area, 2, ',', '.'); ?></span>
                        <span class="rc-unit">m&sup2;</span>
                        <span class="rc-label">Area Total do Vao</span>
                    </div>
                </div>

                <!-- Trilhos + Enchimento -->
                <div class="result-section-title">Estrutura da Laje</div>
                <div class="result-cards">
                    <div class="result-card rc-trilho">
                        <span class="rc-value"><?php echo $qtd_trilhos; ?></span>
                        <span class="rc-unit">unidades</span>
                        <span class="rc-label">Trilhos (vigotas)</span>
                    </div>
                    <div class="result-card rc-isopor">
                        <span class="rc-value"><?php echo $qtd_enchimento; ?></span>
                        <span class="rc-unit"><?php echo $unidade_enchimento; ?></span>
                        <span class="rc-label"><?php echo $nome_enchimento; ?></span>
                        <span class="rc-detail"><?php echo number_format($peso_enchimento, 0, ',', '.'); ?> kg (<?php echo $peso_m2_enchimento; ?> kg/m&sup2;)</span>
                    </div>
                </div>

                <?php if ($usar_tela || $usar_malha): ?>
                <div class="result-cards">
                    <?php if ($usar_tela): ?>
                    <?php
                        $m2_tela_sem = $qtd_tela_sem * $area_tela;
                        $m2_tela_com = $qtd_tela_com * $area_tela;
                    ?>
                    <div class="result-card rc-tela rc-full">
                        <span class="rc-label"><?php echo htmlspecialchars($tela_info['nome']); ?></span>
                        <span class="rc-detail"><?php echo htmlspecialchars($tela_info['desc']); ?> &mdash; <?php echo number_format($area_tela, 2, ',', '.'); ?> m&sup2;/peca</span>
                        <div class="rc-compare">
                            <div class="rc-compare-col rc-compare-sem">
                                <span class="rc-compare-value"><?php echo $qtd_tela_com; ?></span>
                                <span class="rc-compare-unit">telas</span>
                                <span class="rc-compare-m2"><?php echo number_format($m2_tela_com, 2, ',', '.'); ?> m&sup2;</span>
                                <?php if ($complemento_tela_com > 0): ?>
                                <div class="rc-complemento">
                                    <span class="rc-complemento-icon">+</span>
                                    <span><?php echo $complemento_tela_com; ?> Malha POP</span>
                                    <small>complemento de <?php echo number_format($sobra_tela_com, 2, ',', '.'); ?> m&sup2;</small>
                                </div>
                                <?php endif; ?>
                            </div>
                            <div class="rc-compare-divider">
                                <span class="rc-compare-arrow">+10%</span>
                            </div>
                            <div class="rc-compare-col rc-compare-com">
                                <span class="rc-compare-value"><?php echo $qtd_tela_sem; ?></span>
                                <span class="rc-compare-unit">telas</span>
                                <span class="rc-compare-m2"><?php echo number_format($m2_tela_sem, 2, ',', '.'); ?> m&sup2;</span>
                                <?php if ($complemento_tela_sem > 0): ?>
                                <div class="rc-complemento">
                                    <span class="rc-complemento-icon">+</span>
                                    <span><?php echo $complemento_tela_sem; ?> Malha POP</span>
                                    <small>complemento de <?php echo number_format($sobra_tela_sem, 2, ',', '.'); ?> m&sup2;</small>
                                </div>
                                <?php endif; ?>
                                <span class="rc-compare-rec">Recomendado</span>
                            </div>
                        </div>
                    </div>
                    <?php endif; ?>
                    <?php if ($usar_malha): ?>
                    <?php
                        $qtd_malha_sem = ceil($qtd_malha_bruta);
                        $m2_malha_sem = $qtd_malha_sem * $area_malha;
                        $m2_malha_com = $qtd_malha * $area_malha;
                    ?>
                    <div class="result-card rc-malha rc-full">
                        <span class="rc-label"><?php echo htmlspecialchars($malha_info['nome']); ?></span>
                        <span class="rc-detail"><?php echo htmlspecialchars($malha_info['desc']); ?> &mdash; <?php echo number_format($area_malha, 2, ',', '.'); ?> m&sup2;/peca</span>
                        <div class="rc-single">
                            <span class="rc-compare-value"><?php echo $qtd_malha; ?></span>
                            <span class="rc-compare-unit">pecas</span>
                            <span class="rc-compare-m2"><?php echo number_format($m2_malha_com, 2, ',', '.'); ?> m&sup2;</span>
                            <span class="rc-badge">+20% incluso</span>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
                <?php endif; ?>

                <div class="result-detail">
                    <table>
                        <tr><td>Comprimento (maior lado)</td><td><strong><?php echo number_format($comprimento_calc, 2, ',', '.'); ?> m</strong></td></tr>
                        <tr><td>Largura (menor lado)</td><td><strong><?php echo number_format($largura_calc, 2, ',', '.'); ?> m</strong></td></tr>
                        <tr><td>Espacamento entre trilhos</td><td><strong>0,43 m</strong></td></tr>
                        <?php if ($usar_tela): ?>
                        <tr><td>Area da tela (<?php echo $tela_info['nome']; ?>)</td><td><strong><?php echo number_format($area_tela, 2, ',', '.'); ?> m&sup2;</strong></td></tr>
                        <?php endif; ?>
                        <?php if ($usar_malha): ?>
                        <tr><td>Area da malha (<?php echo $malha_info['nome']; ?>)</td><td><strong><?php echo number_format($area_malha, 2, ',', '.'); ?> m&sup2;</strong></td></tr>
                        <?php endif; ?>
                    </table>
                </div>

                <div class="result-tip">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                    <span>
                        <?php if ($usar_tela && $usar_malha): ?>
                            Tela ja inclui +10% e Malha ja inclui +20% de acrescimo para perdas e emendas.
                        <?php elseif ($usar_tela): ?>
                            Tela ja inclui +10% de acrescimo para perdas e emendas.
                        <?php elseif ($usar_malha): ?>
                            Malha ja inclui +20% de acrescimo para perdas e emendas.
                        <?php else: ?>
                            Recomendamos adicionar 10% a mais de trilhos e <?php echo ($enchimento === 'tijolo') ? 'tijolos' : 'isopor'; ?> para cobrir perdas.
                        <?php endif; ?>
                    </span>
                </div>
            </div>
            <?php endif; ?>
        </div>

        <!-- VISUALIZACAO -->
        <?php if ($calculado): ?>
        <div class="visualization-section">
            <div class="viz-tabs">
                <button class="viz-tab active" data-tab="2d">Planta 2D</button>
                <button class="viz-tab" data-tab="3d">Vista 3D</button>
            </div>

            <div class="viz-panel" id="panel-2d">
                <div class="card card-viz">
                    <div class="viz-legend">
                        <div class="legend-item">
                            <span class="legend-color" style="background:#78909c;"></span>
                            Trilho (vigota)
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background:<?php echo ($enchimento === 'tijolo') ? '#c97b4a' : '#fff'; ?>; border:1px solid #ccc;"></span>
                            <?php echo $nome_enchimento; ?>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color legend-color-grid" style="background:transparent;"></span>
                            Tela / Malha
                        </div>
                    </div>
                    <canvas id="canvas2d"></canvas>
                    <div class="viz-dims">
                        <span>Comprimento: <?php echo number_format($comprimento_calc, 2, ',', '.'); ?>m</span>
                        <span>Largura: <?php echo number_format($largura_calc, 2, ',', '.'); ?>m</span>
                    </div>
                </div>
            </div>

            <div class="viz-panel hidden" id="panel-3d">
                <div class="card card-viz">
                    <div class="viz-legend">
                        <div class="legend-item">
                            <span class="legend-color" style="background:#78909c;"></span>
                            Trilho
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background:<?php echo ($enchimento === 'tijolo') ? '#c97b4a' : '#fff'; ?>; border:1px solid #ccc;"></span>
                            <?php echo ($enchimento === 'tijolo') ? 'Tijolo' : 'Isopor'; ?>
                        </div>
                        <div class="legend-item">
                            <span class="legend-color" style="background:rgba(239,68,68,0.3); border:1px solid #ef4444;"></span>
                            Tela/Malha
                        </div>
                    </div>
                    <div class="canvas3d-wrapper">
                        <canvas id="canvas3d"></canvas>
                    </div>
                    <div class="viz-controls">
                        <label>Rotacao: <input type="range" id="rotationSlider" min="0" max="360" value="30"></label>
                        <label>Elevacao: <input type="range" id="elevationSlider" min="10" max="80" value="35"></label>
                    </div>
                </div>
            </div>
        </div>

        <script>
            var LAJE_DATA = {
                comprimento: <?php echo $comprimento_calc; ?>,
                largura: <?php echo $largura_calc; ?>,
                trilhos: <?php echo $qtd_trilhos; ?>,
                isopor: <?php echo $qtd_enchimento; ?>,
                enchimento: '<?php echo $enchimento; ?>',
                espacamento: 0.43,
                tela: { qtd: <?php echo $qtd_tela; ?>, larg: <?php echo $tela_info['larg']; ?>, comp: <?php echo $tela_info['comp']; ?>, nome: '<?php echo $tela_info['nome']; ?>' },
                malha: { qtd: <?php echo $qtd_malha; ?>, larg: <?php echo $malha_info['larg']; ?>, comp: <?php echo $malha_info['comp']; ?>, nome: '<?php echo $malha_info['nome']; ?>' }
            };
        </script>
        <?php endif; ?>

        <?php if (!$calculado): ?>
        <div class="card card-info">
            <div class="info-grid">
                <div class="info-step">
                    <div class="step-num">1</div>
                    <strong>Informe as medidas</strong>
                    <p>Digite comprimento e largura do vao em metros.</p>
                </div>
                <div class="info-step">
                    <div class="step-num">2</div>
                    <strong>Escolha tela e malha</strong>
                    <p>Selecione os modelos de tela de aco e malha POP.</p>
                </div>
                <div class="info-step">
                    <div class="step-num">3</div>
                    <strong>Veja o resultado</strong>
                    <p>Trilhos, isopor, tela, malha e visualizacao 2D/3D.</p>
                </div>
            </div>
        </div>
        <?php endif; ?>

    </div>
</main>

<footer class="footer">
    <div class="container">
        <p>&copy; <?php echo date('Y'); ?> Premoldaco - Calculadora de Laje Premoldada</p>
        <p class="footer-sub">Os calculos sao estimativas. Consulte sempre um engenheiro estrutural.</p>
    </div>
</footer>

<script src="js/app.js"></script>
</body>
</html>
