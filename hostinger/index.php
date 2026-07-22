<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=UTF-8');

$year = date('Y');
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#071b16">
    <meta name="description" content="Calorfy une registro nutricional preciso, alimentos de LATAM y acompañamiento profesional en una sola experiencia.">
    <meta property="og:title" content="Calorfy — Nutrición que entiende tu contexto">
    <meta property="og:description" content="Hábitos claros, alimentos reales y profesionales conectados.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://calorfy.com">
    <title>Calorfy — Nutrición que entiende tu contexto</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --ink: #09251e;
            --ink-2: #163c32;
            --forest: #0b3c31;
            --forest-deep: #071b16;
            --mint: #10c99a;
            --mint-bright: #38e1b5;
            --mint-soft: #dff8f0;
            --cream: #f6f8f3;
            --white: #ffffff;
            --line: rgba(9, 37, 30, .12);
            --muted: #5f746e;
            --orange: #f5a93b;
            --shadow: 0 24px 70px rgba(7, 27, 22, .12);
            --radius: 28px;
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
            margin: 0;
            min-width: 320px;
            color: var(--ink);
            background: var(--cream);
            font-family: "DM Sans", sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        body.menu-open { overflow: hidden; }
        a { color: inherit; text-decoration: none; }
        button, a { -webkit-tap-highlight-color: transparent; }
        .container { width: min(1180px, calc(100% - 48px)); margin-inline: auto; }
        .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            margin: 0 0 18px;
            color: #008f6b;
            font: 800 12px/1 "Manrope", sans-serif;
            letter-spacing: .16em;
            text-transform: uppercase;
        }
        .eyebrow::before { content: ""; width: 24px; height: 2px; background: var(--mint); }
        h1, h2, h3 { margin-top: 0; font-family: "Manrope", sans-serif; letter-spacing: -.04em; }
        h1 { max-width: 780px; margin-bottom: 24px; font-size: clamp(46px, 6.6vw, 86px); line-height: .99; }
        h2 { margin-bottom: 20px; font-size: clamp(34px, 4.5vw, 58px); line-height: 1.04; }
        h3 { margin-bottom: 10px; font-size: 21px; }
        p { line-height: 1.65; }

        .site-header {
            position: fixed;
            z-index: 100;
            top: 0;
            left: 0;
            width: 100%;
            border-bottom: 1px solid transparent;
            transition: background .25s ease, border-color .25s ease, backdrop-filter .25s ease;
        }
        .site-header.scrolled {
            border-color: rgba(255,255,255,.08);
            background: rgba(7, 27, 22, .88);
            backdrop-filter: blur(18px);
        }
        .nav { height: 82px; display: flex; align-items: center; justify-content: space-between; }
        .brand { display: inline-flex; align-items: center; gap: 11px; color: var(--white); font: 800 24px/1 "Manrope", sans-serif; letter-spacing: -.045em; }
        .brand-mark { position: relative; width: 31px; height: 31px; border-radius: 10px; background: var(--mint); transform: rotate(-7deg); }
        .brand-mark::before, .brand-mark::after { content: ""; position: absolute; border-radius: 99px; background: var(--forest-deep); }
        .brand-mark::before { width: 7px; height: 18px; left: 8px; top: 7px; }
        .brand-mark::after { width: 7px; height: 12px; right: 7px; bottom: 6px; }
        .nav-links { display: flex; align-items: center; gap: 32px; color: rgba(255,255,255,.74); font-weight: 600; }
        .nav-links a { transition: color .2s ease; }
        .nav-links a:hover { color: var(--white); }
        .nav-cta { padding: 12px 18px; border: 1px solid rgba(255,255,255,.18); border-radius: 99px; color: var(--white) !important; }
        .menu-button { display: none; width: 44px; height: 44px; border: 1px solid rgba(255,255,255,.16); border-radius: 50%; color: white; background: transparent; font-size: 20px; }

        .hero {
            position: relative;
            overflow: hidden;
            min-height: 850px;
            padding: 175px 0 105px;
            color: var(--white);
            background:
                radial-gradient(circle at 82% 8%, rgba(16,201,154,.25), transparent 27%),
                radial-gradient(circle at 10% 85%, rgba(245,169,59,.10), transparent 30%),
                var(--forest-deep);
        }
        .hero::after { content: ""; position: absolute; right: -170px; bottom: -260px; width: 680px; height: 680px; border: 1px solid rgba(56,225,181,.16); border-radius: 50%; box-shadow: 0 0 0 90px rgba(56,225,181,.025), 0 0 0 180px rgba(56,225,181,.018); }
        .hero-grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1.12fr .88fr; align-items: center; gap: 70px; }
        .hero .eyebrow { color: var(--mint-bright); }
        .hero-copy > p { max-width: 620px; margin: 0 0 34px; color: rgba(255,255,255,.7); font-size: 19px; }
        .accent { color: var(--mint-bright); }
        .actions { display: flex; flex-wrap: wrap; gap: 13px; }
        .button { display: inline-flex; min-height: 54px; padding: 0 23px; align-items: center; justify-content: center; gap: 10px; border: 1px solid transparent; border-radius: 15px; font-weight: 800; transition: transform .2s ease, background .2s ease, border-color .2s ease; }
        .button:hover { transform: translateY(-2px); }
        .button-primary { color: var(--forest-deep); background: var(--mint-bright); }
        .button-secondary { color: var(--white); border-color: rgba(255,255,255,.18); background: rgba(255,255,255,.05); }
        .button-dark { color: var(--white); background: var(--forest); }
        .button-light { color: var(--forest); background: var(--white); }
        .trust { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 36px; color: rgba(255,255,255,.58); font-size: 13px; font-weight: 600; }
        .trust span::before { content: "✓"; margin-right: 7px; color: var(--mint-bright); }

        .phone-shell { position: relative; width: min(390px, 100%); margin-left: auto; padding: 12px; border: 1px solid rgba(255,255,255,.16); border-radius: 42px; background: rgba(255,255,255,.08); box-shadow: 0 42px 90px rgba(0,0,0,.34); backdrop-filter: blur(10px); transform: rotate(2deg); }
        .phone-screen { overflow: hidden; min-height: 610px; padding: 24px 20px; border-radius: 32px; color: var(--ink); background: #f3f8f5; }
        .phone-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .hello small { display: block; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .12em; }
        .hello strong { font: 800 22px/1.2 "Manrope", sans-serif; }
        .avatar { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 50%; color: var(--forest); background: var(--mint-soft); font-weight: 800; }
        .daily-card { padding: 22px; border-radius: 24px; color: white; background: var(--forest); }
        .daily-row { display: flex; align-items: flex-end; justify-content: space-between; }
        .daily-card small { color: rgba(255,255,255,.65); }
        .kcal { font: 800 34px/1 "Manrope", sans-serif; }
        .ring { display: grid; width: 74px; height: 74px; place-items: center; border: 7px solid rgba(255,255,255,.12); border-top-color: var(--mint-bright); border-right-color: var(--mint-bright); border-radius: 50%; font-weight: 800; }
        .progress { overflow: hidden; height: 7px; margin: 20px 0 10px; border-radius: 99px; background: rgba(255,255,255,.12); }
        .progress i { display: block; width: 68%; height: 100%; border-radius: inherit; background: var(--mint-bright); }
        .macros { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-top: 14px; }
        .macro { padding: 14px 10px; border: 1px solid var(--line); border-radius: 16px; background: white; }
        .macro b { display: block; font-family: "Manrope", sans-serif; }
        .macro span { color: var(--muted); font-size: 11px; }
        .meal-title { display: flex; align-items: center; justify-content: space-between; margin: 24px 1px 12px; }
        .meal-title b { font-family: "Manrope", sans-serif; }
        .meal-title span { color: #008f6b; font-size: 12px; font-weight: 800; }
        .meal { display: flex; align-items: center; gap: 12px; margin-bottom: 9px; padding: 12px; border: 1px solid var(--line); border-radius: 16px; background: white; }
        .food-icon { display: grid; flex: 0 0 44px; width: 44px; height: 44px; place-items: center; border-radius: 13px; background: var(--mint-soft); font-size: 21px; }
        .meal b { display: block; font-size: 13px; }
        .meal small { color: var(--muted); }
        .meal em { margin-left: auto; font-style: normal; font-size: 12px; font-weight: 800; }
        .float-note { position: absolute; left: -72px; bottom: 92px; padding: 16px 18px; border: 1px solid rgba(255,255,255,.14); border-radius: 18px; background: rgba(7,27,22,.88); box-shadow: var(--shadow); backdrop-filter: blur(12px); transform: rotate(-2deg); }
        .float-note span { display: block; color: var(--mint-bright); font-size: 12px; font-weight: 800; }
        .float-note strong { font-size: 14px; }

        .signal { position: relative; z-index: 3; margin-top: -42px; }
        .signal-inner { display: grid; grid-template-columns: 1.35fr repeat(3,1fr); align-items: center; gap: 1px; overflow: hidden; border: 1px solid var(--line); border-radius: 24px; background: var(--line); box-shadow: var(--shadow); }
        .signal-cell { min-height: 116px; padding: 24px 28px; background: white; }
        .signal-cell:first-child { display: flex; align-items: center; color: var(--forest); font: 800 18px/1.35 "Manrope", sans-serif; }
        .signal-cell strong { display: block; margin-bottom: 5px; font: 800 25px/1 "Manrope", sans-serif; }
        .signal-cell span { color: var(--muted); font-size: 13px; }

        section { padding: 120px 0; }
        .section-head { display: grid; grid-template-columns: .9fr 1.1fr; gap: 80px; align-items: end; margin-bottom: 58px; }
        .section-head p { max-width: 590px; margin: 0; color: var(--muted); font-size: 18px; }
        .feature-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
        .feature { min-height: 292px; padding: 30px; border: 1px solid var(--line); border-radius: var(--radius); background: rgba(255,255,255,.7); transition: transform .25s ease, box-shadow .25s ease; }
        .feature:hover { transform: translateY(-5px); box-shadow: 0 20px 50px rgba(7,27,22,.08); }
        .feature-icon { display: grid; width: 54px; height: 54px; margin-bottom: 42px; place-items: center; border-radius: 17px; background: var(--mint-soft); font-size: 25px; }
        .feature p { margin: 0; color: var(--muted); }

        .latam { overflow: hidden; color: white; background: var(--forest); }
        .latam-grid { display: grid; grid-template-columns: .85fr 1.15fr; gap: 80px; align-items: center; }
        .latam .eyebrow { color: var(--mint-bright); }
        .latam-copy > p { max-width: 520px; color: rgba(255,255,255,.66); font-size: 18px; }
        .country-pills { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 32px; }
        .country-pills span { padding: 10px 14px; border: 1px solid rgba(255,255,255,.13); border-radius: 99px; color: rgba(255,255,255,.78); background: rgba(255,255,255,.045); font-size: 13px; }
        .food-board { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; transform: rotate(1deg); }
        .food-card { padding: 20px; border: 1px solid rgba(255,255,255,.10); border-radius: 20px; background: rgba(255,255,255,.07); }
        .food-card:nth-child(2), .food-card:nth-child(3) { background: rgba(16,201,154,.12); }
        .food-card small { display: block; margin-bottom: 16px; color: var(--mint-bright); font-weight: 700; }
        .food-card strong { display: block; font: 800 18px/1.3 "Manrope", sans-serif; }
        .food-card span { color: rgba(255,255,255,.56); font-size: 12px; }

        .professional { background: #e9f6f1; }
        .pro-panel { display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; border-radius: 36px; background: white; box-shadow: var(--shadow); }
        .pro-copy { padding: clamp(38px, 6vw, 72px); }
        .pro-copy > p { color: var(--muted); font-size: 18px; }
        .pro-list { display: grid; gap: 14px; margin: 28px 0 34px; padding: 0; list-style: none; }
        .pro-list li { display: flex; align-items: center; gap: 12px; font-weight: 700; }
        .pro-list li::before { content: "✓"; display: grid; flex: 0 0 27px; width: 27px; height: 27px; place-items: center; border-radius: 50%; color: var(--forest); background: var(--mint-soft); font-size: 13px; }
        .pro-visual { display: grid; align-content: center; gap: 13px; padding: 50px; color: white; background: var(--forest-deep); }
        .dashboard-bar { display: flex; justify-content: space-between; align-items: center; padding: 18px; border-radius: 18px; background: rgba(255,255,255,.07); }
        .dashboard-bar small { color: rgba(255,255,255,.58); }
        .dashboard-bar strong { display: block; font: 800 19px/1.2 "Manrope", sans-serif; }
        .status { padding: 7px 10px; border-radius: 99px; color: var(--mint-bright); background: rgba(56,225,181,.1); font-size: 11px; font-weight: 800; }
        .client { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; padding: 15px 18px; border: 1px solid rgba(255,255,255,.08); border-radius: 18px; }
        .client-avatar { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 50%; color: var(--forest); background: var(--mint-bright); font-weight: 800; }
        .client small { color: rgba(255,255,255,.5); }
        .client b:last-child { color: var(--mint-bright); }

        .journey { background: white; }
        .steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; counter-reset: steps; }
        .step { counter-increment: steps; padding: 30px; border-top: 1px solid var(--line); }
        .step::before { content: "0" counter(steps); display: block; margin-bottom: 55px; color: #00a77c; font: 800 14px/1 "Manrope", sans-serif; }
        .step p { color: var(--muted); }

        .final-cta { padding: 110px 0; color: white; background: var(--forest-deep); }
        .cta-box { display: flex; align-items: center; justify-content: space-between; gap: 50px; padding: 0 4%; }
        .cta-box h2 { max-width: 700px; margin: 0; }
        .cta-box p { margin-bottom: 0; color: rgba(255,255,255,.62); }

        footer { padding: 52px 0 30px; color: rgba(255,255,255,.62); background: #04110e; }
        .footer-top { display: flex; justify-content: space-between; gap: 40px; padding-bottom: 45px; }
        .footer-copy { max-width: 430px; margin-top: 18px; font-size: 14px; }
        .footer-links { display: flex; flex-wrap: wrap; gap: 26px; font-size: 14px; font-weight: 600; }
        .footer-links a:hover { color: white; }
        .footer-bottom { display: flex; justify-content: space-between; gap: 20px; padding-top: 26px; border-top: 1px solid rgba(255,255,255,.08); font-size: 12px; }

        .reveal { opacity: 0; transform: translateY(22px); transition: opacity .65s ease, transform .65s ease; }
        .reveal.visible { opacity: 1; transform: none; }
        :focus-visible { outline: 3px solid var(--orange); outline-offset: 4px; }

        @media (max-width: 900px) {
            .nav-links { position: fixed; inset: 82px 0 auto; display: none; align-items: stretch; gap: 0; padding: 18px 24px 28px; background: rgba(7,27,22,.98); }
            .nav-links.open { display: grid; }
            .nav-links a { padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,.08); }
            .nav-cta { margin-top: 12px; text-align: center; border-bottom: 1px solid rgba(255,255,255,.18) !important; }
            .menu-button { display: block; }
            .hero { min-height: auto; padding-top: 145px; }
            .hero-grid, .latam-grid { grid-template-columns: 1fr; }
            .hero-copy { text-align: center; }
            .hero-copy > p { margin-inline: auto; }
            .hero .eyebrow { justify-content: center; }
            .actions, .trust { justify-content: center; }
            .phone-shell { margin: 30px auto 0; }
            .section-head { grid-template-columns: 1fr; gap: 15px; }
            .feature-grid { grid-template-columns: 1fr 1fr; }
            .feature:last-child { grid-column: 1 / -1; }
            .latam-copy { text-align: center; }
            .latam-copy > p { margin-inline: auto; }
            .latam .eyebrow, .country-pills { justify-content: center; }
            .pro-panel { grid-template-columns: 1fr; }
            .steps { grid-template-columns: 1fr; }
            .step::before { margin-bottom: 25px; }
            .cta-box { flex-direction: column; align-items: flex-start; }
        }

        @media (max-width: 620px) {
            .container { width: min(100% - 30px, 1180px); }
            .nav { height: 72px; }
            .nav-links { inset: 72px 0 auto; }
            section { padding: 84px 0; }
            h1 { font-size: 46px; }
            .hero { padding: 125px 0 84px; }
            .button { width: 100%; }
            .phone-shell { width: 100%; transform: none; }
            .phone-screen { min-height: 580px; }
            .float-note { left: -4px; bottom: 70px; }
            .signal { margin-top: -25px; }
            .signal-inner { grid-template-columns: 1fr 1fr; }
            .signal-cell:first-child { grid-column: 1 / -1; min-height: auto; }
            .signal-cell { min-height: 102px; padding: 20px; }
            .signal-cell:last-child { grid-column: 1 / -1; }
            .feature-grid, .food-board { grid-template-columns: 1fr; }
            .feature:last-child { grid-column: auto; }
            .feature { min-height: auto; }
            .feature-icon { margin-bottom: 30px; }
            .pro-visual { padding: 28px 20px; }
            .footer-top, .footer-bottom { flex-direction: column; }
            .footer-links { display: grid; gap: 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; }
            .reveal { opacity: 1; transform: none; }
        }
    </style>
</head>
<body>
    <header class="site-header" id="siteHeader">
        <div class="container nav">
            <a class="brand" href="#inicio" aria-label="Calorfy, inicio"><span class="brand-mark" aria-hidden="true"></span>Calorfy</a>
            <nav class="nav-links" id="navLinks" aria-label="Navegación principal">
                <a href="#producto">Producto</a>
                <a href="#latam">Alimentos LATAM</a>
                <a href="#profesionales">Profesionales</a>
                <a href="#como-funciona">Cómo funciona</a>
                <a class="nav-cta" href="https://pro.calorfy.com">Acceso profesional</a>
            </nav>
            <button class="menu-button" id="menuButton" type="button" aria-expanded="false" aria-controls="navLinks" aria-label="Abrir menú">☰</button>
        </div>
    </header>

    <main>
        <section class="hero" id="inicio">
            <div class="container hero-grid">
                <div class="hero-copy reveal">
                    <span class="eyebrow">Nutrición real, contexto real</span>
                    <h1>Entendé lo que comés. <span class="accent">Evolucioná con claridad.</span></h1>
                    <p>Calorfy combina una base nutricional pensada para Latinoamérica, seguimiento simple y conexión profesional para convertir datos cotidianos en mejores decisiones.</p>
                    <div class="actions">
                        <a class="button button-primary" href="#producto">Descubrir Calorfy <span aria-hidden="true">→</span></a>
                        <a class="button button-secondary" href="#profesionales">Soy profesional</a>
                    </div>
                    <div class="trust" aria-label="Beneficios principales">
                        <span>Alimentos locales</span><span>Objetivos personalizados</span><span>Privacidad primero</span>
                    </div>
                </div>

                <div class="phone-shell reveal" aria-label="Vista previa de la aplicación Calorfy">
                    <div class="phone-screen">
                        <div class="phone-top">
                            <div class="hello"><small>Miércoles, 22 de julio</small><strong>Hola, Martina</strong></div>
                            <div class="avatar">M</div>
                        </div>
                        <div class="daily-card">
                            <div class="daily-row">
                                <div><small>Balance de hoy</small><div class="kcal">1.426</div><small>de 1.977 kcal</small></div>
                                <div class="ring">72%</div>
                            </div>
                            <div class="progress"><i></i></div>
                            <small>Vas en línea con tu objetivo diario</small>
                        </div>
                        <div class="macros">
                            <div class="macro"><b>108 g</b><span>Proteínas</span></div>
                            <div class="macro"><b>142 g</b><span>Carbohidratos</span></div>
                            <div class="macro"><b>51 g</b><span>Grasas</span></div>
                        </div>
                        <div class="meal-title"><b>Comidas de hoy</b><span>+ Agregar</span></div>
                        <div class="meal"><div class="food-icon">🥣</div><div><b>Yogur con granola</b><small>Desayuno · 240 g</small></div><em>326 kcal</em></div>
                        <div class="meal"><div class="food-icon">🥘</div><div><b>Locro casero</b><small>Almuerzo · 380 g</small></div><em>564 kcal</em></div>
                        <div class="meal"><div class="food-icon">🧉</div><div><b>Mate cocido con leche</b><small>Merienda · 250 ml</small></div><em>118 kcal</em></div>
                    </div>
                    <div class="float-note"><span>Esta semana</span><strong>Consistencia: 6 de 7 días</strong></div>
                </div>
            </div>
        </section>

        <div class="container signal reveal" aria-label="Resumen de Calorfy">
            <div class="signal-inner">
                <div class="signal-cell">Una experiencia nutricional diseñada desde LATAM para hábitos que sí existen.</div>
                <div class="signal-cell"><strong>3 idiomas</strong><span>Español, portugués e inglés</span></div>
                <div class="signal-cell"><strong>100% contextual</strong><span>Objetivos según cada perfil</span></div>
                <div class="signal-cell"><strong>1 ecosistema</strong><span>Usuario y profesional conectados</span></div>
            </div>
        </div>

        <section id="producto">
            <div class="container">
                <div class="section-head reveal">
                    <div><span class="eyebrow">Más que contar calorías</span><h2>La información justa para actuar mejor.</h2></div>
                    <p>Calorfy transforma el registro diario en una experiencia útil: menos ruido, mejores referencias y una lectura clara del progreso a través del tiempo.</p>
                </div>
                <div class="feature-grid">
                    <article class="feature reveal"><div class="feature-icon">◎</div><h3>Registro sin fricción</h3><p>Buscá, ajustá porciones y agregá varias comidas en un solo flujo, con gramos, mililitros y medidas cotidianas.</p></article>
                    <article class="feature reveal"><div class="feature-icon">↗</div><h3>Progreso que se entiende</h3><p>Peso, tendencia, objetivos, calorías y macros conectados para mostrar cambios reales, no números aislados.</p></article>
                    <article class="feature reveal"><div class="feature-icon">✦</div><h3>Planes con contexto</h3><p>Recomendaciones que consideran medidas, preferencias, estilo de alimentación y metas personales.</p></article>
                </div>
            </div>
        </section>

        <section class="latam" id="latam">
            <div class="container latam-grid">
                <div class="latam-copy reveal">
                    <span class="eyebrow">Nuestra diferencia</span>
                    <h2>Tu comida no debería perderse en la traducción.</h2>
                    <p>Curamos alimentos y preparaciones propias de la región para que registrar una arepa, un locro o una feijoada sea tan natural como comerlos.</p>
                    <div class="country-pills"><span>Argentina</span><span>Brasil</span><span>México</span><span>Colombia</span><span>Perú</span><span>Chile</span><span>Uruguay</span><span>+ LATAM</span></div>
                </div>
                <div class="food-board reveal">
                    <article class="food-card"><small>ARGENTINA</small><strong>Empanada de carne</strong><span>Porción, gramos y macros</span></article>
                    <article class="food-card"><small>BRASIL</small><strong>Feijão com arroz</strong><span>Preparación y equivalencias</span></article>
                    <article class="food-card"><small>MÉXICO</small><strong>Chilaquiles verdes</strong><span>Ingredientes y porción real</span></article>
                    <article class="food-card"><small>COLOMBIA</small><strong>Arepa con queso</strong><span>Variantes locales contempladas</span></article>
                    <article class="food-card"><small>PERÚ</small><strong>Ceviche clásico</strong><span>Información nutricional clara</span></article>
                    <article class="food-card"><small>REGIONAL</small><strong>Base en crecimiento</strong><span>Curaduría antes que volumen vacío</span></article>
                </div>
            </div>
        </section>

        <section class="professional" id="profesionales">
            <div class="container">
                <div class="pro-panel reveal">
                    <div class="pro-copy">
                        <span class="eyebrow">Calorfy para profesionales</span>
                        <h2>Acompañar mejor, sin competir con tu criterio.</h2>
                        <p>Un espacio pensado para nutricionistas y entrenadores que necesitan continuidad entre consultas, con acceso siempre autorizado por cada persona.</p>
                        <ul class="pro-list"><li>Seguimiento longitudinal de clientes</li><li>Permisos granulares y revocables</li><li>Datos ordenados para preparar cada consulta</li><li>Invitaciones privadas y trazabilidad</li></ul>
                        <a class="button button-dark" href="https://pro.calorfy.com">Conocer Calorfy Pro <span aria-hidden="true">→</span></a>
                    </div>
                    <div class="pro-visual" aria-label="Vista previa del dashboard profesional">
                        <div class="dashboard-bar"><div><small>Panel profesional</small><strong>Buenos días, Laura</strong></div><span class="status">SEGURO</span></div>
                        <div class="dashboard-bar"><div><small>Clientes activos</small><strong>24 personas</strong></div><strong>+3</strong></div>
                        <div class="client"><div class="client-avatar">JM</div><div><b>Julián M.</b><br><small>Último registro: hoy</small></div><b>→</b></div>
                        <div class="client"><div class="client-avatar">CR</div><div><b>Camila R.</b><br><small>Racha de 12 días</small></div><b>→</b></div>
                        <div class="client"><div class="client-avatar">AS</div><div><b>Andrés S.</b><br><small>Revisión pendiente</small></div><b>→</b></div>
                    </div>
                </div>
            </div>
        </section>

        <section class="journey" id="como-funciona">
            <div class="container">
                <div class="section-head reveal"><div><span class="eyebrow">Simple desde el inicio</span><h2>Un proceso que acompaña, no abruma.</h2></div><p>Empezás con tu contexto, registrás a tu manera y construís una historia útil que podés compartir con un profesional cuando vos decidas.</p></div>
                <div class="steps">
                    <article class="step reveal"><h3>Definí tu punto de partida</h3><p>Objetivos, medidas, preferencias y estilo de alimentación para construir referencias coherentes.</p></article>
                    <article class="step reveal"><h3>Registrá tu vida real</h3><p>Comidas locales, recetas, porciones flexibles y evolución diaria sin castigos ni perfeccionismo.</p></article>
                    <article class="step reveal"><h3>Convertí datos en decisiones</h3><p>Observá tendencias y, si querés, conectá a tu profesional para recibir un acompañamiento mejor informado.</p></article>
                </div>
            </div>
        </section>

        <section class="final-cta">
            <div class="container cta-box reveal">
                <div><span class="eyebrow">Estamos construyendo el próximo estándar</span><h2>Nutrición precisa, cercana y conectada.</h2><p>Calorfy llegará próximamente a Android, iPhone y web profesional.</p></div>
                <a class="button button-light" href="mailto:hola@calorfy.com?subject=Quiero%20conocer%20Calorfy">Quiero saber más <span aria-hidden="true">→</span></a>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <div class="footer-top">
                <div><a class="brand" href="#inicio"><span class="brand-mark" aria-hidden="true"></span>Calorfy</a><p class="footer-copy">Tecnología nutricional construida para personas reales y profesionales que quieren acompañarlas mejor.</p></div>
                <div class="footer-links"><a href="#producto">Producto</a><a href="#profesionales">Profesionales</a><a href="mailto:soporte@calorfy.com">Soporte</a><a href="/privacy.html">Privacidad</a></div>
            </div>
            <div class="footer-bottom"><span>© <?= htmlspecialchars($year, ENT_QUOTES, 'UTF-8') ?> Calorfy. Todos los derechos reservados.</span><span>Hecho en Latinoamérica.</span></div>
        </div>
    </footer>

    <script>
        (() => {
            const header = document.getElementById('siteHeader');
            const button = document.getElementById('menuButton');
            const links = document.getElementById('navLinks');
            const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 18);
            updateHeader();
            window.addEventListener('scroll', updateHeader, { passive: true });

            button.addEventListener('click', () => {
                const open = links.classList.toggle('open');
                button.setAttribute('aria-expanded', String(open));
                button.textContent = open ? '×' : '☰';
                document.body.classList.toggle('menu-open', open);
            });
            links.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
                links.classList.remove('open');
                button.setAttribute('aria-expanded', 'false');
                button.textContent = '☰';
                document.body.classList.remove('menu-open');
            }));

            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: .12 });
            document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
        })();
    </script>
</body>
</html>
