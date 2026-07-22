'use client';

import { useEffect, useState } from 'react';

const foods = [
  ['ARGENTINA', 'Empanada de carne', 'Porción, gramos y macros'],
  ['BRASIL', 'Feijão com arroz', 'Preparación y equivalencias'],
  ['MÉXICO', 'Chilaquiles verdes', 'Ingredientes y porción real'],
  ['COLOMBIA', 'Arepa con queso', 'Variantes locales contempladas'],
  ['PERÚ', 'Ceviche clásico', 'Información nutricional clara'],
  ['REGIONAL', 'Base en crecimiento', 'Curaduría antes que volumen vacío'],
];

function Brand() {
  return <a className="brand" href="#inicio" aria-label="Calorfy, inicio"><span className="brand-mark" aria-hidden="true"/>Calorfy</a>;
}

export default function LandingPage({ year }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 18);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    return () => {
      window.removeEventListener('scroll', updateHeader);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    return () => document.body.classList.remove('menu-open');
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return <>
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav">
        <Brand/>
        <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Navegación principal">
          <a href="#producto" onClick={closeMenu}>Producto</a>
          <a href="#latam" onClick={closeMenu}>Alimentos LATAM</a>
          <a href="#profesionales" onClick={closeMenu}>Profesionales</a>
          <a href="#como-funciona" onClick={closeMenu}>Cómo funciona</a>
          <a className="nav-cta" href="https://pro.calorfy.com">Acceso profesional</a>
        </nav>
        <button className="menu-button" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? '×' : '☰'}</button>
      </div>
    </header>

    <main>
      <section className="hero" id="inicio">
        <div className="container hero-grid">
          <div className="hero-copy reveal">
            <span className="eyebrow">Nutrición real, contexto real</span>
            <h1>Entendé lo que comés. <span className="accent">Evolucioná con claridad.</span></h1>
            <p>Calorfy combina una base nutricional pensada para Latinoamérica, seguimiento simple y conexión profesional para convertir datos cotidianos en mejores decisiones.</p>
            <div className="actions">
              <a className="button button-primary" href="#producto">Descubrir Calorfy <span aria-hidden="true">→</span></a>
              <a className="button button-secondary" href="#profesionales">Soy profesional</a>
            </div>
            <div className="trust" aria-label="Beneficios principales"><span>Alimentos locales</span><span>Objetivos personalizados</span><span>Privacidad primero</span></div>
          </div>

          <div className="phone-shell reveal" aria-label="Vista previa de la aplicación Calorfy">
            <div className="phone-screen">
              <div className="phone-top"><div className="hello"><small>Miércoles, 22 de julio</small><strong>Hola, Martina</strong></div><div className="avatar">M</div></div>
              <div className="daily-card">
                <div className="daily-row"><div><small>Balance de hoy</small><div className="kcal">1.426</div><small>de 1.977 kcal</small></div><div className="ring">72%</div></div>
                <div className="progress"><i/></div><small>Vas en línea con tu objetivo diario</small>
              </div>
              <div className="macros"><div className="macro"><b>108 g</b><span>Proteínas</span></div><div className="macro"><b>142 g</b><span>Carbohidratos</span></div><div className="macro"><b>51 g</b><span>Grasas</span></div></div>
              <div className="meal-title"><b>Comidas de hoy</b><span>+ Agregar</span></div>
              <div className="meal"><div className="food-icon">🥣</div><div><b>Yogur con granola</b><small>Desayuno · 240 g</small></div><em>326 kcal</em></div>
              <div className="meal"><div className="food-icon">🥘</div><div><b>Locro casero</b><small>Almuerzo · 380 g</small></div><em>564 kcal</em></div>
              <div className="meal"><div className="food-icon">🧉</div><div><b>Mate cocido con leche</b><small>Merienda · 250 ml</small></div><em>118 kcal</em></div>
            </div>
            <div className="float-note"><span>Esta semana</span><strong>Consistencia: 6 de 7 días</strong></div>
          </div>
        </div>
      </section>

      <div className="container signal reveal" aria-label="Resumen de Calorfy"><div className="signal-inner">
        <div className="signal-cell">Una experiencia nutricional diseñada desde LATAM para hábitos que sí existen.</div>
        <div className="signal-cell"><strong>3 idiomas</strong><span>Español, portugués e inglés</span></div>
        <div className="signal-cell"><strong>100% contextual</strong><span>Objetivos según cada perfil</span></div>
        <div className="signal-cell"><strong>1 ecosistema</strong><span>Usuario y profesional conectados</span></div>
      </div></div>

      <section id="producto"><div className="container">
        <div className="section-head reveal"><div><span className="eyebrow">Más que contar calorías</span><h2>La información justa para actuar mejor.</h2></div><p>Calorfy transforma el registro diario en una experiencia útil: menos ruido, mejores referencias y una lectura clara del progreso a través del tiempo.</p></div>
        <div className="feature-grid">
          <article className="feature reveal"><div className="feature-icon">◎</div><h3>Registro sin fricción</h3><p>Buscá, ajustá porciones y agregá varias comidas en un solo flujo, con gramos, mililitros y medidas cotidianas.</p></article>
          <article className="feature reveal"><div className="feature-icon">↗</div><h3>Progreso que se entiende</h3><p>Peso, tendencia, objetivos, calorías y macros conectados para mostrar cambios reales, no números aislados.</p></article>
          <article className="feature reveal"><div className="feature-icon">✦</div><h3>Planes con contexto</h3><p>Recomendaciones que consideran medidas, preferencias, estilo de alimentación y metas personales.</p></article>
        </div>
      </div></section>

      <section className="latam" id="latam"><div className="container latam-grid">
        <div className="latam-copy reveal"><span className="eyebrow">Nuestra diferencia</span><h2>Tu comida no debería perderse en la traducción.</h2><p>Curamos alimentos y preparaciones propias de la región para que registrar una arepa, un locro o una feijoada sea tan natural como comerlos.</p><div className="country-pills"><span>Argentina</span><span>Brasil</span><span>México</span><span>Colombia</span><span>Perú</span><span>Chile</span><span>Uruguay</span><span>+ LATAM</span></div></div>
        <div className="food-board reveal">{foods.map(([country, name, description]) => <article className="food-card" key={name}><small>{country}</small><strong>{name}</strong><span>{description}</span></article>)}</div>
      </div></section>

      <section className="professional" id="profesionales"><div className="container"><div className="pro-panel reveal">
        <div className="pro-copy"><span className="eyebrow">Calorfy para profesionales</span><h2>Acompañar mejor, sin competir con tu criterio.</h2><p>Un espacio pensado para nutricionistas y entrenadores que necesitan continuidad entre consultas, con acceso siempre autorizado por cada persona.</p><ul className="pro-list"><li>Seguimiento longitudinal de clientes</li><li>Permisos granulares y revocables</li><li>Datos ordenados para preparar cada consulta</li><li>Invitaciones privadas y trazabilidad</li></ul><a className="button button-dark" href="https://pro.calorfy.com">Conocer Calorfy Pro <span aria-hidden="true">→</span></a></div>
        <div className="pro-visual" aria-label="Vista previa del dashboard profesional">
          <div className="dashboard-bar"><div><small>Panel profesional</small><strong>Buenos días, Laura</strong></div><span className="status">SEGURO</span></div>
          <div className="dashboard-bar"><div><small>Clientes activos</small><strong>24 personas</strong></div><strong>+3</strong></div>
          {[['JM', 'Julián M.', 'Último registro: hoy'], ['CR', 'Camila R.', 'Racha de 12 días'], ['AS', 'Andrés S.', 'Revisión pendiente']].map(([initials, name, detail]) => <div className="client" key={initials}><div className="client-avatar">{initials}</div><div><b>{name}</b><br/><small>{detail}</small></div><b>→</b></div>)}
        </div>
      </div></div></section>

      <section className="journey" id="como-funciona"><div className="container">
        <div className="section-head reveal"><div><span className="eyebrow">Simple desde el inicio</span><h2>Un proceso que acompaña, no abruma.</h2></div><p>Empezás con tu contexto, registrás a tu manera y construís una historia útil que podés compartir con un profesional cuando vos decidas.</p></div>
        <div className="steps"><article className="step reveal"><h3>Definí tu punto de partida</h3><p>Objetivos, medidas, preferencias y estilo de alimentación para construir referencias coherentes.</p></article><article className="step reveal"><h3>Registrá tu vida real</h3><p>Comidas locales, recetas, porciones flexibles y evolución diaria sin castigos ni perfeccionismo.</p></article><article className="step reveal"><h3>Convertí datos en decisiones</h3><p>Observá tendencias y, si querés, conectá a tu profesional para recibir un acompañamiento mejor informado.</p></article></div>
      </div></section>

      <section className="final-cta"><div className="container cta-box reveal"><div><span className="eyebrow">Estamos construyendo el próximo estándar</span><h2>Nutrición precisa, cercana y conectada.</h2><p>Calorfy llegará próximamente a Android, iPhone y web profesional.</p></div><a className="button button-light" href="mailto:hola@calorfy.com?subject=Quiero%20conocer%20Calorfy">Quiero saber más <span aria-hidden="true">→</span></a></div></section>
    </main>

    <footer><div className="container"><div className="footer-top"><div><Brand/><p className="footer-copy">Tecnología nutricional construida para personas reales y profesionales que quieren acompañarlas mejor.</p></div><div className="footer-links"><a href="#producto">Producto</a><a href="#profesionales">Profesionales</a><a href="mailto:soporte@calorfy.com">Soporte</a><a href="/privacidad">Privacidad</a><a href="/terminos">Términos</a></div></div><div className="footer-bottom"><span>© {year} Calorfy. Todos los derechos reservados.</span><span>Hecho en Latinoamérica.</span></div></div></footer>
  </>;
}
