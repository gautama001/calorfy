<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=UTF-8');

$supabaseUrl = getenv('SUPABASE_URL') ?: 'https://urqwsbzstbnktxxddhct.supabase.co';
$supabaseKey = getenv('SUPABASE_PUBLISHABLE_KEY') ?: 'sb_publishable_5YNLGMaL_FA-bVtl2eGZOA_jLPoZyE8';
$appUrl = getenv('CALORFY_APP_URL') ?: 'https://calorfy.com';
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#071b16">
    <meta name="robots" content="noindex, nofollow">
    <meta name="description" content="Calorfy Pro, seguimiento nutricional para profesionales.">
    <title>Calorfy Pro — Portal profesional</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --ink: #0a2921;
            --forest: #0b3c31;
            --deep: #061914;
            --mint: #10c99a;
            --mint-light: #3de2b7;
            --mint-soft: #dff8f0;
            --canvas: #f3f7f4;
            --white: #fff;
            --muted: #657871;
            --line: rgba(10,41,33,.12);
            --danger: #bd3b45;
            --warning: #f2a437;
            --shadow: 0 24px 70px rgba(6,25,20,.12);
        }
        * { box-sizing: border-box; }
        html, body { min-height: 100%; }
        body { margin: 0; color: var(--ink); background: var(--canvas); font-family: "DM Sans", sans-serif; -webkit-font-smoothing: antialiased; }
        button, input, select { font: inherit; }
        button, a { -webkit-tap-highlight-color: transparent; }
        button { cursor: pointer; }
        a { color: inherit; text-decoration: none; }
        [hidden] { display: none !important; }
        h1, h2, h3, p { margin-top: 0; }
        h1, h2, h3 { font-family: "Manrope", sans-serif; letter-spacing: -.035em; }
        .brand { display: inline-flex; align-items: center; gap: 10px; font: 800 23px/1 "Manrope", sans-serif; letter-spacing: -.045em; }
        .brand-mark { position: relative; width: 30px; height: 30px; border-radius: 9px; background: var(--mint); transform: rotate(-7deg); }
        .brand-mark::before, .brand-mark::after { content: ""; position: absolute; width: 7px; border-radius: 9px; background: var(--deep); }
        .brand-mark::before { height: 17px; left: 8px; top: 7px; }
        .brand-mark::after { height: 11px; right: 7px; bottom: 6px; }
        .pro-tag { margin-left: 2px; padding: 5px 8px; border-radius: 8px; color: var(--deep); background: var(--mint-light); font: 800 10px/1 "Manrope",sans-serif; letter-spacing: .1em; }
        .eyebrow { margin: 0 0 12px; color: #008b68; font: 800 11px/1 "Manrope",sans-serif; letter-spacing: .14em; text-transform: uppercase; }
        .button { display: inline-flex; min-height: 48px; padding: 0 18px; align-items: center; justify-content: center; gap: 9px; border: 1px solid transparent; border-radius: 13px; font-weight: 800; transition: transform .18s ease, filter .18s ease; }
        .button:hover { transform: translateY(-1px); filter: brightness(1.025); }
        .button:disabled { cursor: not-allowed; opacity: .55; transform: none; }
        .button-primary { color: var(--deep); background: var(--mint-light); }
        .button-dark { color: white; background: var(--forest); }
        .button-soft { color: var(--forest); border-color: var(--line); background: white; }
        .button-ghost { color: var(--muted); background: transparent; }
        .full { width: 100%; }
        .field { display: grid; gap: 7px; }
        .field label { color: var(--ink); font-size: 13px; font-weight: 800; }
        .input { width: 100%; height: 49px; padding: 0 14px; border: 1px solid var(--line); border-radius: 13px; outline: 0; color: var(--ink); background: #fbfdfc; transition: border-color .18s ease, box-shadow .18s ease; }
        .input:focus { border-color: var(--mint); box-shadow: 0 0 0 4px rgba(16,201,154,.11); }
        .input::placeholder { color: #93a39e; }
        .form-grid { display: grid; gap: 16px; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .helper { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.5; }
        .error-box, .success-box { margin: 0 0 16px; padding: 12px 14px; border-radius: 12px; font-size: 13px; line-height: 1.45; }
        .error-box { color: #8f2630; border: 1px solid rgba(189,59,69,.18); background: #fff0f1; }
        .success-box { color: #087356; border: 1px solid rgba(16,201,154,.2); background: var(--mint-soft); }

        .loading-screen { display: grid; position: fixed; z-index: 1000; inset: 0; place-items: center; color: white; background: var(--deep); }
        .loader-wrap { display: grid; justify-items: center; gap: 20px; }
        .loader { width: 34px; height: 34px; border: 3px solid rgba(255,255,255,.15); border-top-color: var(--mint-light); border-radius: 50%; animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-layout { display: grid; min-height: 100vh; grid-template-columns: minmax(380px, .92fr) minmax(460px, 1.08fr); }
        .auth-story { position: relative; overflow: hidden; display: flex; min-height: 100vh; padding: 48px clamp(34px, 6vw, 86px); flex-direction: column; color: white; background: radial-gradient(circle at 80% 12%, rgba(16,201,154,.24), transparent 27%), var(--deep); }
        .auth-story::after { content: ""; position: absolute; right: -230px; bottom: -250px; width: 650px; height: 650px; border: 1px solid rgba(61,226,183,.16); border-radius: 50%; box-shadow: 0 0 0 90px rgba(61,226,183,.025), 0 0 0 180px rgba(61,226,183,.018); }
        .auth-story .brand { position: relative; z-index: 1; }
        .story-content { position: relative; z-index: 1; margin: auto 0; max-width: 620px; padding: 65px 0; }
        .story-content .eyebrow { color: var(--mint-light); }
        .story-content h1 { max-width: 640px; margin-bottom: 22px; font-size: clamp(42px, 5vw, 69px); line-height: 1.02; }
        .story-content > p { max-width: 560px; color: rgba(255,255,255,.67); font-size: 18px; line-height: 1.65; }
        .story-points { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 38px; }
        .story-point { min-height: 118px; padding: 17px; border: 1px solid rgba(255,255,255,.09); border-radius: 17px; background: rgba(255,255,255,.045); }
        .story-point i { display: block; margin-bottom: 20px; color: var(--mint-light); font-style: normal; }
        .story-point b { display: block; font-size: 13px; line-height: 1.35; }
        .story-footer { position: relative; z-index: 1; display: flex; justify-content: space-between; color: rgba(255,255,255,.45); font-size: 12px; }
        .auth-side { display: grid; padding: 50px 24px; place-items: center; background: var(--canvas); }
        .auth-card { width: min(450px, 100%); padding: 38px; border: 1px solid var(--line); border-radius: 27px; background: white; box-shadow: var(--shadow); }
        .auth-card h2 { margin-bottom: 8px; font-size: 30px; }
        .auth-card > p { margin-bottom: 26px; color: var(--muted); }
        .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 25px; padding: 4px; border-radius: 13px; background: #eef3f0; }
        .tab { height: 42px; border: 0; border-radius: 10px; color: var(--muted); background: transparent; font-weight: 800; }
        .tab.active { color: var(--ink); background: white; box-shadow: 0 2px 9px rgba(6,25,20,.07); }
        .auth-note { margin: 20px 0 0; color: var(--muted); text-align: center; font-size: 12px; }

        .onboarding-layout { display: grid; min-height: 100vh; padding: 40px 22px; place-items: center; background: radial-gradient(circle at 10% 10%, rgba(16,201,154,.13), transparent 28%), var(--canvas); }
        .onboarding { width: min(820px, 100%); }
        .onboarding-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 35px; }
        .onboarding-card { display: grid; grid-template-columns: .72fr 1.28fr; overflow: hidden; border: 1px solid var(--line); border-radius: 30px; background: white; box-shadow: var(--shadow); }
        .onboarding-intro { padding: 40px; color: white; background: var(--forest); }
        .onboarding-intro h2 { margin: 28px 0 15px; font-size: 34px; line-height: 1.08; }
        .onboarding-intro p { color: rgba(255,255,255,.65); line-height: 1.6; }
        .step-list { display: grid; gap: 16px; margin-top: 40px; }
        .step-item { display: flex; gap: 11px; align-items: center; color: rgba(255,255,255,.64); font-size: 13px; }
        .step-item span { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 50%; color: var(--forest); background: var(--mint-light); font-weight: 800; }
        .onboarding-form { padding: 40px; }
        .onboarding-form h3 { margin-bottom: 7px; font-size: 24px; }
        .onboarding-form > p { margin-bottom: 27px; color: var(--muted); }

        .app-shell { display: grid; min-height: 100vh; grid-template-columns: 250px 1fr; }
        .sidebar { position: sticky; top: 0; display: flex; height: 100vh; padding: 28px 20px; flex-direction: column; color: white; background: var(--deep); }
        .sidebar .brand { padding: 0 8px; }
        .side-nav { display: grid; gap: 5px; margin-top: 45px; }
        .nav-item { display: flex; min-height: 47px; padding: 0 13px; align-items: center; gap: 12px; border: 0; border-radius: 13px; color: rgba(255,255,255,.55); background: transparent; text-align: left; font-weight: 700; }
        .nav-item.active { color: white; background: rgba(61,226,183,.12); }
        .nav-icon { display: grid; width: 25px; place-items: center; color: var(--mint-light); }
        .sidebar-bottom { margin-top: auto; padding: 16px 8px 0; border-top: 1px solid rgba(255,255,255,.08); }
        .account-mini { display: grid; grid-template-columns: 35px 1fr; gap: 10px; align-items: center; margin-bottom: 14px; }
        .account-avatar { display: grid; width: 35px; height: 35px; place-items: center; border-radius: 50%; color: var(--deep); background: var(--mint-light); font-weight: 800; }
        .account-mini b { display: block; overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
        .account-mini small { color: rgba(255,255,255,.45); }
        .logout { padding: 0; border: 0; color: rgba(255,255,255,.5); background: transparent; font-size: 12px; }
        .main-area { min-width: 0; }
        .topbar { display: flex; min-height: 78px; padding: 0 36px; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); background: rgba(243,247,244,.9); backdrop-filter: blur(12px); }
        .mobile-brand { display: none; }
        .topbar h1 { margin: 0; font-size: 21px; }
        .top-actions { display: flex; align-items: center; gap: 10px; }
        .badge { display: inline-flex; padding: 7px 10px; align-items: center; gap: 6px; border-radius: 99px; color: #89601a; background: #fff3da; font-size: 11px; font-weight: 800; }
        .content { width: min(1180px, calc(100% - 72px)); margin: 0 auto; padding: 42px 0 70px; }
        .welcome { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 30px; }
        .welcome h2 { margin-bottom: 7px; font-size: 34px; }
        .welcome p { margin: 0; color: var(--muted); }
        .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 15px; margin-bottom: 22px; }
        .stat { padding: 22px; border: 1px solid var(--line); border-radius: 20px; background: white; }
        .stat-head { display: flex; align-items: center; justify-content: space-between; color: var(--muted); font-size: 12px; font-weight: 700; }
        .stat-icon { display: grid; width: 35px; height: 35px; place-items: center; border-radius: 11px; color: var(--forest); background: var(--mint-soft); }
        .stat strong { display: block; margin-top: 22px; font: 800 30px/1 "Manrope",sans-serif; }
        .stat small { color: var(--muted); }
        .dashboard-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 18px; }
        .panel { padding: 24px; border: 1px solid var(--line); border-radius: 22px; background: white; }
        .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 20px; }
        .panel-head h3 { margin: 0; font-size: 19px; }
        .panel-head span { color: var(--muted); font-size: 12px; }
        .empty { display: grid; min-height: 220px; padding: 30px; place-items: center; border: 1px dashed var(--line); border-radius: 17px; text-align: center; }
        .empty-icon { display: grid; width: 52px; height: 52px; margin: 0 auto 15px; place-items: center; border-radius: 16px; color: var(--forest); background: var(--mint-soft); font-size: 23px; }
        .empty h4 { margin: 0 0 6px; font-family: "Manrope",sans-serif; }
        .empty p { max-width: 350px; margin: 0 auto; color: var(--muted); font-size: 13px; }
        .relationship { display: grid; grid-template-columns: 39px 1fr auto; align-items: center; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--line); }
        .relationship:last-child { border-bottom: 0; }
        .relationship b { font-size: 13px; }
        .relationship small { display: block; color: var(--muted); }
        .invite-box { padding: 20px; border-radius: 18px; color: white; background: var(--forest); }
        .invite-box h3 { margin-bottom: 8px; }
        .invite-box p { color: rgba(255,255,255,.62); font-size: 13px; line-height: 1.55; }
        .invite-result { display: grid; gap: 10px; margin-top: 15px; }
        .invite-link { overflow: hidden; padding: 12px; border: 1px solid rgba(255,255,255,.13); border-radius: 11px; color: var(--mint-light); background: rgba(255,255,255,.06); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
        .privacy-note { display: flex; gap: 11px; margin-top: 16px; padding: 15px; border: 1px solid var(--line); border-radius: 15px; background: #f7faf8; }
        .privacy-note i { color: var(--mint); font-style: normal; }
        .privacy-note p { margin: 0; color: var(--muted); font-size: 12px; line-height: 1.5; }
        .toast { position: fixed; z-index: 999; right: 22px; bottom: 22px; max-width: min(390px, calc(100% - 44px)); padding: 14px 17px; border-radius: 13px; color: white; background: var(--deep); box-shadow: var(--shadow); font-size: 13px; animation: toast-in .22s ease; }
        @keyframes toast-in { from { opacity: 0; transform: translateY(10px); } }
        :focus-visible { outline: 3px solid var(--warning); outline-offset: 3px; }

        @media (max-width: 980px) {
            .auth-layout { grid-template-columns: 1fr; }
            .auth-story { min-height: 520px; }
            .story-content { padding: 70px 0 50px; }
            .auth-side { padding: 60px 22px; }
            .app-shell { grid-template-columns: 82px 1fr; }
            .sidebar { padding-inline: 14px; }
            .sidebar .brand { justify-content: center; }
            .sidebar .brand > :not(.brand-mark) { display: none; }
            .nav-item { justify-content: center; padding: 0; }
            .nav-item > :not(.nav-icon) { display: none; }
            .account-mini { grid-template-columns: 1fr; justify-items: center; }
            .account-mini > :not(.account-avatar) { display: none; }
            .logout { width: 100%; font-size: 0; }
            .logout::after { content: "Salir"; font-size: 11px; }
            .dashboard-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 700px) {
            .field-row { grid-template-columns: 1fr; }
            .story-points { grid-template-columns: 1fr; }
            .story-point { min-height: auto; }
            .story-point i { margin-bottom: 8px; }
            .onboarding-card { grid-template-columns: 1fr; }
            .onboarding-intro { padding: 30px; }
            .step-list { display: none; }
            .app-shell { display: block; }
            .sidebar { position: fixed; z-index: 100; top: auto; right: 0; bottom: 0; left: 0; width: 100%; height: calc(68px + env(safe-area-inset-bottom)); padding: 8px 12px env(safe-area-inset-bottom); flex-direction: row; }
            .sidebar .brand, .sidebar-bottom { display: none; }
            .side-nav { width: 100%; margin: 0; grid-template-columns: repeat(4,1fr); }
            .nav-item { min-height: 50px; flex-direction: column; gap: 2px; font-size: 10px; }
            .nav-item > :not(.nav-icon) { display: block; }
            .topbar { min-height: 68px; padding: 0 16px; }
            .topbar h1 { display: none; }
            .mobile-brand { display: inline-flex; }
            .top-actions .button { display: none; }
            .content { width: min(100% - 30px, 1180px); padding: 30px 0 110px; }
            .welcome { display: block; }
            .welcome .button { width: 100%; margin-top: 20px; }
            .stats { grid-template-columns: 1fr; }
        }
        @media (max-width: 520px) {
            .auth-story { min-height: auto; padding: 28px 22px 44px; }
            .story-content { padding: 70px 0 30px; }
            .story-content h1 { font-size: 40px; }
            .story-content > p { font-size: 16px; }
            .story-footer { display: none; }
            .auth-card, .onboarding-form { padding: 28px 22px; }
            .auth-side { padding: 30px 15px; }
            .onboarding-layout { padding: 24px 15px; }
        }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
    </style>
</head>
<body>
    <div class="loading-screen" id="loadingScreen"><div class="loader-wrap"><div class="brand"><span class="brand-mark"></span>Calorfy <span class="pro-tag">PRO</span></div><div class="loader"></div></div></div>

    <section class="auth-layout" id="authView" hidden>
        <div class="auth-story">
            <a class="brand" href="<?= htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8') ?>"><span class="brand-mark"></span>Calorfy <span class="pro-tag">PRO</span></a>
            <div class="story-content">
                <p class="eyebrow">Seguimiento profesional conectado</p>
                <h1>Más contexto para acompañar mejor.</h1>
                <p>El espacio de trabajo para nutricionistas y entrenadores que quieren entender la evolución de sus clientes entre consultas.</p>
                <div class="story-points">
                    <div class="story-point"><i>◎</i><b>Una vista longitudinal del progreso</b></div>
                    <div class="story-point"><i>↗</i><b>Decisiones basadas en hábitos reales</b></div>
                    <div class="story-point"><i>⌁</i><b>Acceso siempre autorizado y revocable</b></div>
                </div>
            </div>
            <div class="story-footer"><span>Datos protegidos por permisos granulares.</span><a href="<?= htmlspecialchars($appUrl, ENT_QUOTES, 'UTF-8') ?>">Volver a Calorfy.com</a></div>
        </div>
        <div class="auth-side">
            <div class="auth-card">
                <p class="eyebrow">Portal profesional</p>
                <h2 id="authTitle">Bienvenido de nuevo</h2>
                <p id="authSubtitle">Ingresá para continuar con tus clientes.</p>
                <div class="tabs" role="tablist"><button class="tab active" id="loginTab" type="button" role="tab" aria-selected="true">Ingresar</button><button class="tab" id="signupTab" type="button" role="tab" aria-selected="false">Crear cuenta</button></div>
                <div id="authMessage" hidden></div>
                <form class="form-grid" id="authForm">
                    <div class="field" id="nameField" hidden><label for="displayName">Nombre y apellido</label><input class="input" id="displayName" name="displayName" autocomplete="name" placeholder="Ej. Laura Méndez"></div>
                    <div class="field"><label for="email">Correo electrónico</label><input class="input" id="email" name="email" type="email" autocomplete="email" required placeholder="nombre@consultorio.com"></div>
                    <div class="field"><label for="password">Contraseña</label><input class="input" id="password" name="password" type="password" minlength="8" autocomplete="current-password" required placeholder="Mínimo 8 caracteres"></div>
                    <button class="button button-dark full" id="authSubmit" type="submit">Ingresar</button>
                </form>
                <p class="auth-note">Al continuar aceptás las condiciones de uso y la política de privacidad de Calorfy.</p>
            </div>
        </div>
    </section>

    <section class="onboarding-layout" id="onboardingView" hidden>
        <div class="onboarding">
            <div class="onboarding-top"><div class="brand"><span class="brand-mark"></span>Calorfy <span class="pro-tag">PRO</span></div><button class="button button-ghost" id="onboardingLogout" type="button">Cerrar sesión</button></div>
            <div class="onboarding-card">
                <aside class="onboarding-intro"><span class="pro-tag">CONFIGURACIÓN</span><h2>Creemos tu espacio profesional.</h2><p>Esta información identifica tu perfil ante las personas que invites.</p><div class="step-list"><div class="step-item"><span>1</span>Perfil profesional</div><div class="step-item"><span>2</span>Verificación de identidad</div><div class="step-item"><span>3</span>Primer cliente</div></div></aside>
                <div class="onboarding-form"><h3>Información profesional</h3><p>Podrás actualizar estos datos más adelante.</p><div id="profileMessage" hidden></div><form class="form-grid" id="profileForm">
                    <div class="field"><label for="profession">Profesión</label><select class="input" id="profession" required><option value="nutritionist">Nutricionista</option><option value="personal_trainer">Entrenador/a personal</option></select></div>
                    <div class="field"><label for="publicName">Nombre público</label><input class="input" id="publicName" required minlength="2" maxlength="80" placeholder="Lic. Laura Méndez"></div>
                    <div class="field-row"><div class="field"><label for="countryCode">País</label><select class="input" id="countryCode"><option value="AR">Argentina</option><option value="BR">Brasil</option><option value="CL">Chile</option><option value="CO">Colombia</option><option value="MX">México</option><option value="PE">Perú</option><option value="UY">Uruguay</option><option value="OTHER">Otro</option></select></div><div class="field"><label for="licenseNumber">Matrícula (opcional)</label><input class="input" id="licenseNumber" maxlength="80" placeholder="MN 12345"></div></div>
                    <div class="field"><label for="organization">Consultorio u organización (opcional)</label><input class="input" id="organization" maxlength="120" placeholder="Centro Integral Salud"></div>
                    <p class="helper">La matrícula no se muestra como verificada hasta completar el proceso de validación.</p>
                    <button class="button button-dark full" id="profileSubmit" type="submit">Crear espacio profesional</button>
                </form></div>
            </div>
        </div>
    </section>

    <div class="app-shell" id="dashboardView" hidden>
        <aside class="sidebar">
            <a class="brand" href="#"><span class="brand-mark"></span><span>Calorfy</span><span class="pro-tag">PRO</span></a>
            <nav class="side-nav"><button class="nav-item active"><span class="nav-icon">⌂</span><span>Resumen</span></button><button class="nav-item"><span class="nav-icon">◎</span><span>Clientes</span></button><button class="nav-item"><span class="nav-icon">↗</span><span>Seguimiento</span></button><button class="nav-item"><span class="nav-icon">⚙</span><span>Ajustes</span></button></nav>
            <div class="sidebar-bottom"><div class="account-mini"><div class="account-avatar" id="sideInitial">P</div><div><b id="sideName">Profesional</b><small id="sideProfession">Calorfy Pro</small></div></div><button class="logout" id="logoutButton" type="button">Cerrar sesión</button></div>
        </aside>
        <main class="main-area">
            <header class="topbar"><div class="mobile-brand brand"><span class="brand-mark"></span>Calorfy <span class="pro-tag">PRO</span></div><h1>Panel profesional</h1><div class="top-actions"><span class="badge" id="verificationBadge">● PERFIL SIN VERIFICAR</span><button class="button button-soft" id="topInviteButton" type="button">+ Invitar cliente</button></div></header>
            <div class="content">
                <div class="welcome"><div><p class="eyebrow">Tu espacio de trabajo</p><h2 id="welcomeName">Buenos días</h2><p>Un resumen claro del acompañamiento de tus clientes.</p></div><button class="button button-dark" id="welcomeInviteButton" type="button">+ Invitar nuevo cliente</button></div>
                <div class="stats"><article class="stat"><div class="stat-head"><span>Clientes activos</span><span class="stat-icon">◎</span></div><strong id="activeClients">0</strong><small>con acceso autorizado</small></article><article class="stat"><div class="stat-head"><span>Invitaciones abiertas</span><span class="stat-icon">↗</span></div><strong id="openInvites">0</strong><small>pendientes de aceptar</small></article><article class="stat"><div class="stat-head"><span>Revisiones pendientes</span><span class="stat-icon">✓</span></div><strong>0</strong><small>próximamente</small></article></div>
                <div class="dashboard-grid">
                    <section class="panel"><div class="panel-head"><div><h3>Clientes recientes</h3><span>Accesos activos y autorizados</span></div></div><div id="clientsList"><div class="empty"><div><div class="empty-icon">◎</div><h4>Todavía no hay clientes conectados</h4><p>Creá una invitación privada para vincular a tu primera persona.</p></div></div></div></section>
                    <aside><div class="invite-box"><p class="eyebrow" style="color:var(--mint-light)">Nueva conexión</p><h3>Invitá a un cliente</h3><p>El enlace es de un solo uso, vence en 7 días y no otorga acceso hasta que la persona acepte sus permisos.</p><button class="button button-primary full" id="createInviteButton" type="button">Generar invitación segura</button><div class="invite-result" id="inviteResult" hidden><div class="invite-link" id="inviteLink"></div><button class="button button-soft full" id="copyInviteButton" type="button">Copiar enlace</button></div></div><div class="privacy-note"><i>◆</i><p>Calorfy Pro nunca habilita el diario, peso, objetivos o fotografías sin consentimiento explícito del cliente.</p></div></aside>
                </div>
            </div>
        </main>
    </div>
    <div class="toast" id="toast" hidden></div>

    <script type="module">
        import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

        const SUPABASE_URL = <?= json_encode($supabaseUrl, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) ?>;
        const SUPABASE_KEY = <?= json_encode($supabaseKey, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) ?>;
        const APP_URL = <?= json_encode($appUrl, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) ?>;
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, detectSessionInUrl: true } });

        const $ = id => document.getElementById(id);
        let authMode = 'login';
        let session = null;
        let profile = null;

        function showView(view) {
            ['loadingScreen', 'authView', 'onboardingView', 'dashboardView'].forEach(id => $(id).hidden = id !== view);
        }
        function message(target, text, type = 'error') {
            const box = $(target);
            box.hidden = !text;
            box.className = type === 'success' ? 'success-box' : 'error-box';
            box.textContent = text || '';
        }
        function toast(text) {
            const el = $('toast'); el.textContent = text; el.hidden = false;
            clearTimeout(toast.timer); toast.timer = setTimeout(() => el.hidden = true, 3000);
        }
        function setBusy(button, busy, label) {
            button.disabled = busy;
            if (!button.dataset.label) button.dataset.label = button.textContent;
            button.textContent = busy ? label : button.dataset.label;
        }
        function friendlyError(error) {
            const value = String(error?.message || error || 'Ocurrió un error.');
            if (value.includes('Invalid login credentials')) return 'El correo o la contraseña no son correctos.';
            if (value.includes('Email not confirmed')) return 'Confirmá tu correo antes de ingresar.';
            if (value.includes('already registered')) return 'Ya existe una cuenta con ese correo.';
            if (value.includes('Password should')) return 'La contraseña debe tener al menos 8 caracteres.';
            return value;
        }
        function professionLabel(value) { return value === 'personal_trainer' ? 'Entrenador/a personal' : 'Nutricionista'; }

        async function loadProfile(userId) {
            const { data, error } = await supabase.from('professional_profiles').select('user_id,profession,public_name,country_code,organization_name,license_number,verification_status').eq('user_id', userId).maybeSingle();
            if (error) throw error;
            return data;
        }
        async function routeSession(nextSession) {
            session = nextSession;
            if (!session) { profile = null; showView('authView'); return; }
            try {
                profile = await loadProfile(session.user.id);
                if (!profile) {
                    $('publicName').value = session.user.user_metadata?.display_name || '';
                    showView('onboardingView');
                    return;
                }
                await renderDashboard();
                showView('dashboardView');
            } catch (error) {
                showView('authView');
                message('authMessage', friendlyError(error));
            }
        }

        function setAuthMode(mode) {
            authMode = mode;
            const signup = mode === 'signup';
            $('loginTab').classList.toggle('active', !signup);
            $('signupTab').classList.toggle('active', signup);
            $('loginTab').setAttribute('aria-selected', String(!signup));
            $('signupTab').setAttribute('aria-selected', String(signup));
            $('nameField').hidden = !signup;
            $('displayName').required = signup;
            $('password').autocomplete = signup ? 'new-password' : 'current-password';
            $('authTitle').textContent = signup ? 'Creá tu cuenta profesional' : 'Bienvenido de nuevo';
            $('authSubtitle').textContent = signup ? 'Empezá a construir tu espacio de seguimiento.' : 'Ingresá para continuar con tus clientes.';
            $('authSubmit').textContent = signup ? 'Crear cuenta' : 'Ingresar';
            $('authSubmit').dataset.label = $('authSubmit').textContent;
            message('authMessage', '');
        }

        $('loginTab').addEventListener('click', () => setAuthMode('login'));
        $('signupTab').addEventListener('click', () => setAuthMode('signup'));
        $('authForm').addEventListener('submit', async event => {
            event.preventDefault(); message('authMessage', '');
            const button = $('authSubmit'); setBusy(button, true, authMode === 'signup' ? 'Creando cuenta…' : 'Ingresando…');
            try {
                const email = $('email').value.trim();
                const password = $('password').value;
                if (authMode === 'signup') {
                    const displayName = $('displayName').value.trim();
                    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName }, emailRedirectTo: window.location.origin } });
                    if (error) throw error;
                    if (!data.session) message('authMessage', 'Cuenta creada. Revisá tu correo para confirmarla y luego ingresá.', 'success');
                    else await routeSession(data.session);
                } else {
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    await routeSession(data.session);
                }
            } catch (error) { message('authMessage', friendlyError(error)); }
            finally { setBusy(button, false, ''); }
        });

        $('profileForm').addEventListener('submit', async event => {
            event.preventDefault(); message('profileMessage', '');
            const button = $('profileSubmit'); setBusy(button, true, 'Guardando perfil…');
            try {
                const { data, error } = await supabase.rpc('upsert_professional_profile', {
                    p_profession: $('profession').value,
                    p_public_name: $('publicName').value.trim(),
                    p_country_code: $('countryCode').value === 'OTHER' ? null : $('countryCode').value,
                    p_organization_name: $('organization').value.trim() || null,
                    p_license_number: $('licenseNumber').value.trim() || null
                }).single();
                if (error) throw error;
                profile = data;
                await renderDashboard();
                showView('dashboardView');
                toast('Tu espacio profesional está listo.');
            } catch (error) { message('profileMessage', friendlyError(error)); }
            finally { setBusy(button, false, ''); }
        });

        async function renderDashboard() {
            const firstName = profile.public_name.split(' ')[0];
            $('welcomeName').textContent = `Buenos días, ${firstName}`;
            $('sideName').textContent = profile.public_name;
            $('sideProfession').textContent = professionLabel(profile.profession);
            $('sideInitial').textContent = profile.public_name.charAt(0).toUpperCase();
            const verification = profile.verification_status || 'unverified';
            $('verificationBadge').textContent = verification === 'verified' ? '● PERFIL VERIFICADO' : verification === 'pending' ? '● VERIFICACIÓN PENDIENTE' : '● PERFIL SIN VERIFICAR';

            const [relationshipsResult, invitesResult] = await Promise.all([
                supabase.from('professional_client_relationships').select('id,client_id,status,started_at,professional_client_permissions(share_diary,share_weight,share_goals,share_photos)').eq('professional_id', session.user.id).order('updated_at', { ascending: false }),
                supabase.from('professional_invites').select('id,expires_at,accepted_at,revoked_at').eq('professional_id', session.user.id).order('created_at', { ascending: false })
            ]);
            if (relationshipsResult.error) throw relationshipsResult.error;
            if (invitesResult.error) throw invitesResult.error;
            const active = (relationshipsResult.data || []).filter(item => item.status === 'active');
            const now = Date.now();
            const open = (invitesResult.data || []).filter(item => !item.accepted_at && !item.revoked_at && new Date(item.expires_at).getTime() > now);
            $('activeClients').textContent = String(active.length);
            $('openInvites').textContent = String(open.length);
            const list = $('clientsList');
            if (!active.length) {
                list.innerHTML = '<div class="empty"><div><div class="empty-icon">◎</div><h4>Todavía no hay clientes conectados</h4><p>Creá una invitación privada para vincular a tu primera persona.</p></div></div>';
            } else {
                list.innerHTML = active.slice(0, 6).map((item, index) => {
                    const permissions = item.professional_client_permissions || {};
                    const count = ['share_diary','share_weight','share_goals','share_photos'].filter(key => permissions[key]).length;
                    return `<div class="relationship"><div class="account-avatar">${index + 1}</div><div><b>Cliente conectado</b><small>Desde ${new Date(item.started_at).toLocaleDateString('es-AR')}</small></div><span class="badge">${count} permisos</span></div>`;
                }).join('');
            }
        }

        async function createInvite() {
            const button = $('createInviteButton'); setBusy(button, true, 'Generando enlace…');
            try {
                const { data: token, error } = await supabase.rpc('create_professional_invite');
                if (error) throw error;
                const link = `${APP_URL.replace(/\/$/, '')}/connect?token=${encodeURIComponent(token)}`;
                $('inviteLink').textContent = link;
                $('inviteResult').hidden = false;
                await renderDashboard();
                toast('Invitación segura creada.');
            } catch (error) { toast(friendlyError(error)); }
            finally { setBusy(button, false, ''); }
        }
        ['createInviteButton', 'topInviteButton', 'welcomeInviteButton'].forEach(id => $(id).addEventListener('click', () => {
            if (id === 'createInviteButton') createInvite();
            else $('createInviteButton').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }));
        $('copyInviteButton').addEventListener('click', async () => {
            try { await navigator.clipboard.writeText($('inviteLink').textContent); toast('Enlace copiado.'); }
            catch { toast('No pudimos copiarlo. Seleccioná el enlace manualmente.'); }
        });
        async function logout() { await supabase.auth.signOut(); await routeSession(null); }
        $('logoutButton').addEventListener('click', logout);
        $('onboardingLogout').addEventListener('click', logout);

        const { data: { session: initialSession } } = await supabase.auth.getSession();
        await routeSession(initialSession);
        supabase.auth.onAuthStateChange((event, nextSession) => {
            if (event === 'SIGNED_OUT') routeSession(null);
        });
    </script>
</body>
</html>
