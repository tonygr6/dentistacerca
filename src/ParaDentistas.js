// Página "Para dentistas": beneficios de tener perfil en DentistaCerca antes de mandar al registro.
// Solo afirmaciones reales (planes aprobados 3-oct-2026); sin cifras ni testimonios inventados.
import React, { useEffect, useState } from 'react';
import { URL_REGISTRO, URL_ORALIX } from './lib/enlaces';

const C = { azul: '#1A6FBF', teal: '#00B4A0', tinta: '#28262a', gris: '#6B7A8D', borde: '#E4EAF2', cielo: '#e3f1fb', pastilla: '#9fe0d6', blanco: '#FFFFFF' };
const SERIF = "'Instrument Serif', Georgia, serif";
const SANS  = "'Instrument Sans', Inter, Arial, sans-serif";
const PERFIL_EJEMPLO = '#/clinica/ef186904-32ee-4c74-8b34-546649040d76';

const BENEFICIOS = [
  ['📍', 'Aparece donde te buscan', 'Tu clínica en el directorio y en el mapa de DentistaCerca, filtrable por especialidad y zona.'],
  ['🦷', 'Un perfil completo', 'Tus doctores con foto y cédula, servicios con precio “desde”, horario, ubicación y formas de pago.'],
  ['💬', 'Citas directo a tu WhatsApp', 'El paciente te escribe a tu número. Sin intermediarios y sin comisión por paciente.'],
  ['📅', 'Disponibilidad real', 'Los días con espacio se calculan con tu agenda de ORALIX: el paciente ve cuándo puedes atenderlo.'],
  ['✅', 'Confianza desde el primer clic', 'Sello de clínica verificada por ORALIX y cédula profesional con enlace al registro de la SEP.'],
  ['⭐', 'Opiniones verificadas', 'Próximamente: solo de pacientes que tuvieron una cita real en tu clínica.', true],
];

const PASOS = [
  ['Crea tu cuenta gratis', 'Regístrate en ORALIX con el plan Básico. Toma un par de minutos.'],
  ['Completa tu perfil', 'En Configuración → “Mi perfil en ORALIX 360”: ubicación, especialidades, descripción y formas de pago. Cada doctor llena su perfil y tú eliges qué servicios mostrar.'],
  ['Actívalo y recibe pacientes', 'Marca tu clínica como visible y aparece en DentistaCerca. Lo puedes ocultar cuando quieras.'],
];

const PLANES = [
  ['Básico', '$0', 'Perfil en DentistaCerca, agenda, expediente, odontograma, punto de venta y recordatorios por WhatsApp. 1 doctor, hasta 100 pacientes.'],
  ['Pro', '$499', 'Todo lo de Básico + Smart Admin (costeo, almacén, rentabilidad), Lucy por voz y análisis de radiografías con IA. Hasta 3 doctores.'],
  ['Premium', '$899', 'Todo lo de Pro + Lucy contestando tu WhatsApp 24 h y Entrena a Lucy. Hasta 10 doctores.'],
];

const PREGUNTAS = [
  ['¿Cuánto cuesta tener mi perfil?', 'Nada. El perfil en DentistaCerca está incluido en el plan Básico de ORALIX, que es gratuito.'],
  ['¿Cobran comisión por paciente?', 'No. Los pacientes te contactan directo por WhatsApp o teléfono; DentistaCerca no cobra por cita.'],
  ['¿Qué información se publica?', 'Solo la que tú eliges en ORALIX: datos de la clínica, doctores que decidan aparecer y los servicios que marques. Nunca datos de tus pacientes.'],
  ['¿Puedo ocultar mi perfil?', 'Sí, con un clic en Configuración → “Mi perfil en ORALIX 360”.'],
  ['Ya uso ORALIX, ¿qué hago?', 'Inicia sesión, entra a Configuración → “Mi perfil en ORALIX 360”, completa tus datos y marca tu clínica como visible.'],
];

function useMovil() {
  const [m, setM] = useState(window.innerWidth < 760);
  useEffect(() => { const f = () => setM(window.innerWidth < 760); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return m;
}

export default function ParaDentistas({ irAInicio, irADirectorio }) {
  const movil = useMovil();
  const [abierta, setAbierta] = useState(0);
  useEffect(() => { document.title = 'Para dentistas — DentistaCerca.mx'; }, []);

  const wrap = { maxWidth: '1080px', margin: '0 auto', padding: movil ? '0 16px' : '0 24px' };
  const h2 = { fontFamily: SERIF, fontWeight: 400, fontSize: movil ? '34px' : '46px', lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 10px', textAlign: 'center' };
  const sub = { textAlign: 'center', color: C.gris, fontSize: '17px', margin: '0 auto 32px', maxWidth: '620px', lineHeight: 1.5 };
  const btnPrim = { display: 'inline-block', background: C.azul, color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '16px', padding: '15px 28px', borderRadius: '100px', fontFamily: SANS };
  const btnSec  = { display: 'inline-block', background: C.blanco, color: C.tinta, textDecoration: 'none', fontWeight: 500, fontSize: '16px', padding: '14px 26px', borderRadius: '100px', border: `1px solid ${C.borde}`, fontFamily: SANS };
  const card = { background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: '20px', padding: '24px' };

  return (
    <div style={{ minHeight: '100vh', fontFamily: SANS, color: C.tinta, background: C.blanco }}>
      {/* Encabezado */}
      <header style={{ background: C.blanco, borderBottom: `1px solid ${C.borde}`, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={irAInicio} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src="/img/logo-pin-256.png" alt="" style={{ width: '28px', height: '38px', objectFit: 'contain' }} />
          <span style={{ fontWeight: 600, fontSize: '18px', letterSpacing: '-0.02em' }}>Dentista<span style={{ color: C.azul }}>Cerca</span>.mx</span>
        </div>
        <a href={URL_REGISTRO} target="_blank" rel="noopener noreferrer" style={{ ...btnPrim, padding: '9px 16px', fontSize: '14px' }}>{movil ? 'Registrarme' : 'Crear mi perfil gratis →'}</a>
      </header>

      {/* Hero */}
      <section style={{ background: `linear-gradient(${C.cielo}, #fff)`, padding: movil ? '48px 0 40px' : '80px 0 64px' }}>
        <div style={{ ...wrap, textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: C.pastilla, padding: '6px 14px', borderRadius: '100px', fontSize: '14px', fontWeight: 500, marginBottom: '18px' }}>Para dentistas y clínicas dentales</span>
          <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: movil ? '44px' : '68px', lineHeight: 1.02, letterSpacing: '-0.02em', margin: '0 auto 16px', maxWidth: '860px' }}>
            Que los pacientes de tu zona <span style={{ color: C.azul }}>te encuentren</span>
          </h1>
          <p style={{ ...sub, fontSize: movil ? '17px' : '19px' }}>
            Crea gratis el perfil de tu clínica en DentistaCerca: tus doctores, servicios, horario y ubicación, con citas directo a tu WhatsApp.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={URL_REGISTRO} target="_blank" rel="noopener noreferrer" style={btnPrim}>Crear mi perfil gratis →</a>
            <a href={PERFIL_EJEMPLO} style={btnSec}>Ver un perfil de ejemplo</a>
          </div>
          <p style={{ margin: '16px 0 0', fontSize: '13px', color: C.gris }}>Incluido en el plan Básico de ORALIX ($0) · Al registrarte, 30 días de Premium de regalo</p>
        </div>
      </section>

      {/* Beneficios */}
      <section style={{ padding: movil ? '48px 0' : '72px 0' }}>
        <div style={wrap}>
          <h2 style={h2}>Lo que obtienes con tu <span style={{ color: C.azul }}>perfil</span></h2>
          <p style={sub}>Organizado como los grandes directorios médicos, pensado para clínicas dentales mexicanas.</p>
          <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
            {BENEFICIOS.map(([ico, titulo, texto, pronto]) => (
              <div key={titulo} style={card}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{ico}</div>
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '17px' }}>
                  {titulo} {pronto && <span style={{ fontSize: '11px', fontWeight: 600, background: C.cielo, color: C.azul, padding: '2px 8px', borderRadius: '100px', verticalAlign: 'middle' }}>Próximamente</span>}
                </p>
                <p style={{ margin: 0, color: C.gris, fontSize: '15px', lineHeight: 1.55 }}>{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section style={{ background: C.cielo, padding: movil ? '48px 0' : '72px 0' }}>
        <div style={wrap}>
          <h2 style={h2}>Cómo <span style={{ color: C.azul }}>funciona</span></h2>
          <p style={sub}>Tu perfil se alimenta de ORALIX: lo que actualizas en tu clínica se ve en DentistaCerca.</p>
          <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
            {PASOS.map(([titulo, texto], i) => (
              <div key={titulo} style={card}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: C.azul, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, marginBottom: '12px' }}>{i + 1}</div>
                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '17px' }}>{titulo}</p>
                <p style={{ margin: 0, color: C.gris, fontSize: '15px', lineHeight: 1.55 }}>{texto}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <a href={PERFIL_EJEMPLO} style={btnSec}>Ver cómo se ve un perfil real →</a>
          </div>
        </div>
      </section>

      {/* Planes */}
      <section style={{ padding: movil ? '48px 0' : '72px 0' }}>
        <div style={wrap}>
          <h2 style={h2}>Y además, tu clínica en <span style={{ color: C.azul }}>ORALIX</span></h2>
          <p style={sub}>El software de gestión dental creado por un dentista: el perfil es gratis y puedes crecer cuando lo necesites.</p>
          <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
            {PLANES.map(([nombre, precio, texto], i) => (
              <div key={nombre} style={{ ...card, border: i === 0 ? `2px solid ${C.azul}` : card.border }}>
                {i === 0 && <span style={{ fontSize: '12px', fontWeight: 600, background: C.pastilla, padding: '3px 10px', borderRadius: '100px' }}>Incluye tu perfil gratis</span>}
                <p style={{ margin: i === 0 ? '10px 0 2px' : '0 0 2px', fontWeight: 600, fontSize: '18px' }}>{nombre}</p>
                <p style={{ margin: '0 0 10px', fontFamily: SERIF, fontSize: '40px', lineHeight: 1 }}>{precio}<span style={{ fontFamily: SANS, fontSize: '14px', color: C.gris }}> MXN/mes</span></p>
                {i > 0 && <p style={{ margin: '0 0 10px' }}><span style={{ fontSize: '12.5px', fontWeight: 600, background: '#E6FAF6', color: '#0f766e', padding: '4px 10px', borderRadius: '100px' }}>🦷 Precio Dentista Fundador por 12 meses</span></p>}
                <p style={{ margin: 0, color: C.gris, fontSize: '14px', lineHeight: 1.55 }}>{texto}</p>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '13px', color: C.gris, margin: '16px 0 0' }}>
            Dentista Fundador: las primeras 50 clínicas que se suscriban (o hasta el 31 de enero de 2027) conservan su precio por 12 meses.<br />
            Precios con IVA incluido. Detalle completo en <a href="https://www.oralix.mx" target="_blank" rel="noopener noreferrer" style={{ color: C.azul }}>oralix.mx</a>.
          </p>
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section style={{ background: C.cielo, padding: movil ? '48px 0' : '72px 0' }}>
        <div style={{ ...wrap, maxWidth: '780px' }}>
          <h2 style={h2}>Preguntas <span style={{ color: C.azul }}>frecuentes</span></h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
            {PREGUNTAS.map(([p, r], i) => (
              <div key={p} style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <button onClick={() => setAbierta(abierta === i ? -1 : i)}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '18px 20px', fontSize: '16px', fontWeight: 600, color: C.tinta, cursor: 'pointer', fontFamily: SANS, display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  {p}<span style={{ color: C.azul }}>{abierta === i ? '−' : '+'}</span>
                </button>
                {abierta === i && <p style={{ margin: 0, padding: '0 20px 18px', color: C.gris, fontSize: '15px', lineHeight: 1.6 }}>{r}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section style={{ padding: movil ? '56px 0' : '80px 0', textAlign: 'center' }}>
        <div style={wrap}>
          <h2 style={h2}>Empieza <span style={{ color: C.azul }}>hoy</span>, es gratis</h2>
          <p style={sub}>Crea tu cuenta, completa tu perfil y aparece en DentistaCerca.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={URL_REGISTRO} target="_blank" rel="noopener noreferrer" style={btnPrim}>Crear mi perfil gratis →</a>
            <a href={URL_ORALIX} target="_blank" rel="noopener noreferrer" style={btnSec}>Ya uso ORALIX: iniciar sesión</a>
          </div>
          <p style={{ margin: '20px 0 0' }}>
            <button onClick={() => irADirectorio({})} style={{ background: 'none', border: 'none', color: C.azul, fontSize: '14px', cursor: 'pointer', fontFamily: SANS }}>Ver el directorio de clínicas →</button>
          </p>
        </div>
      </section>

      <footer style={{ background: C.cielo, color: '#4a4a4c', textAlign: 'center', padding: '18px', fontSize: '12px' }}>
        dentistacerca.mx · Directorio dental gratuito · Powered by <a href={URL_ORALIX} target="_blank" rel="noopener noreferrer" style={{ color: C.azul, textDecoration: 'none', fontWeight: 600 }}>ORALIX</a>
      </footer>
    </div>
  );
}
