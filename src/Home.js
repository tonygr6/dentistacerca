// Página de inicio de DentistaCerca.mx
// Diseño hecho en Claude (Chat); aquí con datos REALES de ORALIX:
//   - clínicas: directorio_publico()  (solo clínicas que eligieron aparecer)
//   - disponibilidad: disponibilidad_publica()  (cerrado / lleno / con espacio, desde la agenda real)
// Las cifras y testimonios del diseño original quedan apagados (MOSTRAR_CIFRAS)
// hasta tener datos reales que los respalden.
import { URL_REGISTRO, URL_PARA_DENTISTAS, URL_ACCESO_DENTISTAS } from './lib/enlaces';
import React, { useEffect, useState } from 'react';
import supabase from './lib/supabase';
import './home.css';

const MOSTRAR_CIFRAS = false;

// Ícono del diseño → especialidad tal como la guarda ORALIX (filtro del directorio)
const ESPECIALIDADES = [
  ['general',    'Odontología General', 'Odontología general'],
  ['ortodoncia', 'Ortodoncia',          'Ortodoncia'],
  ['endodoncia', 'Endodoncia',          'Endodoncia'],
  ['implantes',  'Implantes Dentales',  'Implantes'],
  ['cirugia',    'Cirugía Oral',        'Cirugía oral'],
  ['protesis',   'Prótesis Dental',     'Estética dental'],
  ['perio',      'Periodoncia',         'Periodoncia'],
  ['odontoped',  'Odontopediatría',     'Odontopediatría'],
];

const SERVICIOS = [
  'Brackets metálicos', 'Alineadores transparentes', 'Extracción muela del juicio',
  'Limpieza dental profesional', 'Corona de porcelana', 'Blanqueamiento dental',
  'Carilla de porcelana', 'Radiografía panorámica', 'Nervio (conducto radicular)',
];

const CHIPS_HERO = [
  ['Ortodoncia', { espec: 'Ortodoncia' }],
  ['Implantes dentales', { espec: 'Implantes' }],
  ['Estética dental', { espec: 'Estética dental' }],
  ['Dentista para niños', { espec: 'Odontopediatría' }],
  ['Endodoncia', { espec: 'Endodoncia' }],
];

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function iniciales(nombre) {
  return (nombre || '?').split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function telefonoWhatsApp(tel) {
  let d = (tel || '').replace(/\D/g, '');
  if (d.length === 10) d = '52' + d;
  return d.length >= 12 ? d : null;
}

function urlGoogleMaps(c) {
  const q = encodeURIComponent(`${c.nombre} ${c.direccion || ''} ${c.ciudad || ''}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function Avatar({ clinica, clase }) {
  return (
    <div className={clase}>
      {clinica.logo_clinica_url
        ? <img src={clinica.logo_clinica_url} alt="" />
        : iniciales(clinica.nombre)}
    </div>
  );
}

export default function Home({ irADirectorio }) {
  const [clinicas, setClinicas]         = useState([]);
  const [destacada, setDestacada]       = useState(null);   // clínica del recuadro de disponibilidad
  const [dias, setDias]                 = useState([]);
  const [diaElegido, setDiaElegido]     = useState(null);
  const [busqueda, setBusqueda]         = useState('');

  useEffect(() => {
    supabase.rpc('directorio_publico').then(({ data }) => {
      const lista = data || [];
      setClinicas(lista);
      const conHorario = lista.find(c => c.tiene_horario) || null;
      setDestacada(conHorario);
      if (conHorario) {
        supabase.rpc('disponibilidad_publica', { p_clinica: conHorario.id, p_dias: 8 })
          .then(({ data: d }) => {
            setDias(d || []);
            const primero = (d || []).find(x => x.estado === 'disponible');
            setDiaElegido(primero?.fecha || null);
          });
      }
    });
  }, []);

  // Bajar a una sección sin tocar el # de la dirección (lo usa la navegación)
  function irASeccion(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  function buscar(e) {
    e?.preventDefault();
    irADirectorio({ q: busqueda.trim() });
  }

  function etiquetaDia(fechaISO, idx) {
    const f = new Date(fechaISO + 'T12:00:00');
    const nombre = idx === 0 ? 'Hoy' : idx === 1 ? 'Mañana' : DIAS_CORTOS[f.getDay()];
    return { nombre, fecha: `${f.getDate()} ${MESES_CORTOS[f.getMonth()]}` };
  }

  const waDestacada = destacada && telefonoWhatsApp(destacada.telefono);
  const textoDia = diaElegido ? (() => {
    const f = new Date(diaElegido + 'T12:00:00');
    return f.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  })() : '';
  const urlAgendar = waDestacada
    ? `https://wa.me/${waDestacada}?text=${encodeURIComponent(
        `Hola, vi su clínica en DentistaCerca.mx y quisiera una cita${textoDia ? ` el ${textoDia}` : ''}.`)}`
    : null;

  return (
    <div className="dc-home">

      {/* Franja para dentistas (solo celular; en escritorio está el botón en la barra) */}
      <a className="top-dentista" href={URL_PARA_DENTISTAS}>¿Eres dentista? <strong>Crea tu perfil gratis →</strong></a>

      {/* NAV */}
      <nav className="nav">
        <a className="brand" href="#/" onClick={() => window.scrollTo(0, 0)}>
          <div className="brand-icon"><img src="/img/logo-pin-256.png" alt="" /></div>
          <span>Dentista<span className="tl">Cerca</span>.mx</span>
        </a>
        <div className="nav-links">
          <button className="nl nl-hide" onClick={() => irASeccion('especialidades')}>¿Cómo funciona?</button>
          <button className="nl nl-hide" onClick={() => irASeccion('para-dentistas')}>Para dentistas</button>
          <a className="nl nl-hide nl-dentista" href={URL_PARA_DENTISTAS}>Soy dentista</a>
          <button className="nl nl-cta" onClick={() => irADirectorio({})}>Agendar cita</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">✓ Solo clínicas dentales verificadas por ORALIX</div>
          <h1>Encuentra la atención dental que <em>necesitas</em></h1>
          <p className="hero-sub">Busca por especialidad, colonia o nombre de clínica, y encuentra un dentista cerca de ti.</p>
          <form className="search-box" onSubmit={buscar}>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Ej.: ortodoncia, Guadalajara, nombre de la clínica…"
            />
            <div className="search-city">📍 Guadalajara</div>
            <button className="btn-search" type="submit">Buscar</button>
          </form>
          <div className="hero-chips">
            {CHIPS_HERO.map(([texto, filtro]) => (
              <button key={texto} className="hero-chip" onClick={() => irADirectorio(filtro)}>{texto}</button>
            ))}
          </div>
        </div>
      </section>

      {MOSTRAR_CIFRAS && (
        <div className="stats">
          <div className="stats-inner">
            <div><div className="stat-n">{clinicas.length}</div><div className="stat-l">🏥 Clínicas verificadas</div></div>
          </div>
        </div>
      )}

      {/* FEATURES */}
      <section className="section sec-bg">
        <div className="section-inner">
          <div className="feat-grid">
            <div className="feat-card feat-card-a">
              <div className="feat-pad">
                <img className="feat-logo" src="/img/logo-diente.png" alt="" />
                <div className="feat-ht"><span className="green">¡Es gratis</span> para pacientes!</div>
                <div className="feat-hst">Buscar clínicas, ver disponibilidad y pedir tu cita dental no tiene ningún costo para ti. Sin comisiones ocultas.</div>
                <span className="feat-tag">Siempre gratuito para pacientes</span>
              </div>
            </div>

            <div className="feat-card feat-card-b">
              <div className="feat-pad">
                <div className="feat-ht">Consulta disponibilidad en <em>tiempo real</em></div>
                <div className="feat-hst">Revisa qué días tiene espacio la clínica y pide tu cita por WhatsApp en segundos.</div>
                {destacada ? (
                  <div className="avail-demo">
                    <div className="avail-doc">
                      <Avatar clinica={destacada} clase="avail-avatar" />
                      <div>
                        <div className="avail-name">{destacada.nombre}</div>
                        <div className="avail-spec">{(destacada.especialidades || []).slice(0, 2).join(' · ') || destacada.ciudad}</div>
                      </div>
                    </div>
                    <div className="avail-grid">
                      {dias.map((d, i) => {
                        const { nombre, fecha } = etiquetaDia(d.fecha, i);
                        const libre = d.estado === 'disponible';
                        const clase = !libre ? 'off' : d.fecha === diaElegido ? 'on' : 'def';
                        return (
                          <button key={d.fecha} className={`aday ${clase}`} disabled={!libre}
                            title={d.estado === 'cerrado' ? 'Cerrado' : d.estado === 'lleno' ? 'Agenda llena' : 'Con espacio'}
                            onClick={() => setDiaElegido(d.fecha)}>
                            {nombre}<div className="aday-date">{fecha}</div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="avail-legend">
                      <span>🟢 Con espacio</span><span>⚪ Cerrado o lleno</span>
                    </div>
                    <div className="avail-actions">
                      {urlAgendar && (
                        <a className="btn-sm btn-wa" href={urlAgendar} target="_blank" rel="noopener noreferrer">💬 Pedir cita por WhatsApp</a>
                      )}
                      <a className="btn-sm btn-gmaps" href={urlGoogleMaps(destacada)} target="_blank" rel="noopener noreferrer">📍 Ver en Google Maps</a>
                    </div>
                  </div>
                ) : (
                  <div className="avail-demo" style={{ fontSize: 13, color: 'var(--muted)' }}>Cargando disponibilidad…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESPECIALIDADES */}
      <section className="section" id="especialidades">
        <div className="section-inner">
          <div className="two-col-hd">
            <div>
              <div className="section-title">Especialidades más <em>buscadas</em></div>
              <div className="section-sub">Encuentra el especialista dental que necesitas</div>
            </div>
            <button className="show-all-lnk" onClick={() => irADirectorio({})}>Ver todas →</button>
          </div>
          <div className="spec-grid">
            {ESPECIALIDADES.map(([icono, etiqueta, filtro]) => (
              <button key={icono} className="spec-item" onClick={() => irADirectorio({ espec: filtro })}>
                <img src={`/img/esp-${icono}.png`} alt="" />
                <span>{etiqueta}</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 44 }}>
            <div className="two-col-hd">
              <div className="section-title" style={{ fontSize: 28 }}>Servicios más buscados</div>
            </div>
            <div className="chips-grid">
              {SERVICIOS.map(s => (
                <button key={s} className="ech" onClick={() => irADirectorio({})}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CLÍNICAS REALES */}
      {clinicas.length > 0 && (
        <section className="section sec-bg">
          <div className="section-inner">
            <div className="two-col-hd">
              <div>
                <div className="section-title">Clínicas <em>verificadas</em></div>
                <div className="section-sub">Dentistas que trabajan con ORALIX</div>
              </div>
              <button className="show-all-lnk" onClick={() => irADirectorio({})}>Ver en el mapa →</button>
            </div>
            <div className="clinics-row">
              {clinicas.slice(0, 8).map(c => (
                <button key={c.id} className="mini-card" onClick={() => { window.location.hash = `/clinica/${c.id}`; }}>
                  <Avatar clinica={c} clase="mc-av" />
                  <div className="mc-ver">✓ ORALIX</div>
                  <div className="mc-name">{c.nombre}</div>
                  <div className="mc-spec">{(c.especialidades || []).slice(0, 2).join(' · ')}</div>
                  <div className="mc-city">📍 {c.ciudad || c.direccion}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PARA DENTISTAS */}
      <section className="dentista-section" id="para-dentistas">
        <div className="dentista-inner">
          <div className="dentista-title">¿Eres dentista o tienes una <em>clínica</em>?</div>
          <div className="dentista-sub">Conecta con más pacientes y administra tu clínica con tecnología hecha para dentistas</div>
          <div className="crear-perfil">
            <div>
              <div className="cp-title">Crea gratis el perfil de tu <em>clínica</em></div>
              <div className="cp-sub">Aparece en el directorio y el mapa, muestra a tus doctores, servicios y horario, y recibe citas por WhatsApp.</div>
            </div>
            <div className="cp-acciones">
              <a className="cp-btn" href={URL_REGISTRO} target="_blank" rel="noopener noreferrer">Crear mi perfil gratis →</a>
              <a className="cp-link" href={URL_PARA_DENTISTAS}>Ver todos los beneficios y cómo funciona →</a>
              <a className="cp-link" href={URL_ACCESO_DENTISTAS} target="_blank" rel="noopener noreferrer">¿Ya usas ORALIX? Acceso dentistas: administra tu perfil →</a>
            </div>
          </div>
          <div className="dentista-grid">

            <div className="dcard">
              <div className="dc-illus"><img className="foto" src="/img/dentista-oralix.webp" alt="Dentista en su clínica con ORALIX" /></div>
              <div className="dc-body">
                <div className="oralix-chip"><img src="/img/logo-dentistacerca.png" alt="" /><span>ORALIX</span></div>
                <div className="dc-tag dc-tag-pro">Creado por un dentista, para dentistas</div>
                <div className="dc-ht">Administra y haz crecer tu clínica</div>
                <div className="dc-features">
                  <div className="dc-ft">Expediente clínico digital completo</div>
                  <div className="dc-ft">Agenda con recordatorios por WhatsApp</div>
                  <div className="dc-ft">Punto de venta, abonos y reportes</div>
                  <div className="dc-ft">Perfil verificado en DentistaCerca.mx</div>
                </div>
                <a className="dc-btn" href="https://app.oralix.mx" target="_blank" rel="noopener noreferrer">Conocer ORALIX →</a>
              </div>
            </div>

            <div className="dcard">
              <div className="dc-illus"><img className="foto" src="/img/dentista-lucy.jpg" alt="Dentista en su clínica con Lucy" /></div>
              <div className="dc-body">
                <div className="oralix-chip"><img src="/img/logo-dentistacerca.png" alt="" /><span>ORALIX Lucy</span></div>
                <div className="dc-tag dc-tag-lucy">✦ Nuevo · IA dental</div>
                <div className="dc-ht">Tu asistente digital inteligente</div>
                <div className="dc-features">
                  <div className="dc-ft">Contesta tu WhatsApp Business 24/7</div>
                  <div className="dc-ft">Responde dudas con tus precios reales</div>
                  <div className="dc-ft">Toma solicitudes de cita y te avisa en ORALIX</div>
                  <div className="dc-ft">Se hace a un lado cuando tú contestas</div>
                </div>
                <a className="dc-btn" href="https://app.oralix.mx" target="_blank" rel="noopener noreferrer">Conocer Lucy →</a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="fg-title">Servicio</div>
              <a className="fg-link" href="https://app.oralix.mx/privacidad.html" target="_blank" rel="noopener noreferrer">Aviso de privacidad</a>
              <button className="fg-link" onClick={() => irASeccion('para-dentistas')}>Quiénes somos</button>
            </div>
            <div>
              <div className="fg-title">Para pacientes</div>
              <button className="fg-link" onClick={() => irADirectorio({})}>Buscar clínicas</button>
              <button className="fg-link" onClick={() => irASeccion('especialidades')}>Ver especialidades</button>
              <button className="fg-link" onClick={() => irADirectorio({})}>Agendar cita</button>
            </div>
            <div>
              <div className="fg-title">Para dentistas</div>
              <a className="fg-link" href="https://app.oralix.mx" target="_blank" rel="noopener noreferrer">ORALIX</a>
              <a className="fg-link" href="https://app.oralix.mx" target="_blank" rel="noopener noreferrer">Lucy — IA de agenda</a>
            </div>
            <div>
              <div className="footer-brand"><span>DentistaCerca.mx</span></div>
              <div className="footer-addr">Powered by ORALIX<br />Guadalajara, Jalisco, México</div>
            </div>
          </div>
          <div className="footer-bottom">
            <div>DentistaCerca.mx © {new Date().getFullYear()} — Red dental verificada por ORALIX</div>
            <div>Guadalajara y zona metropolitana</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
