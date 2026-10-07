// Perfil público de una clínica (organización tipo Doctoralia / TopDoctors, estilo DentistaCerca).
// Datos: perfil_clinica_publico(id) → solo información pública que la clínica eligió mostrar
// en ORALIX; disponibilidad_publica(id) → días disponibles/llenos según su agenda (sin pacientes).
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import supabase from './lib/supabase';
import { URL_PARA_DENTISTAS } from './lib/enlaces';

const C = {
  azul: '#1A6FBF', teal: '#00B4A0', tinta: '#28262a', gris: '#6B7A8D', borde: '#E4EAF2',
  cielo: '#e3f1fb', pastilla: '#9fe0d6', blanco: '#FFFFFF', verdeWa: '#25D366',
};
const SERIF = "'Instrument Serif', Georgia, serif";
const SANS  = "'Instrument Sans', Inter, Arial, sans-serif";
const DIAS = [
  ['lunes', 'Lunes'], ['martes', 'Martes'], ['miercoles', 'Miércoles'], ['jueves', 'Jueves'],
  ['viernes', 'Viernes'], ['sabado', 'Sábado'], ['domingo', 'Domingo'],
];
const SECCIONES = [
  ['sobre', 'Sobre la clínica'], ['doctores', 'Doctores'], ['servicios', 'Servicios y precios'],
  ['ubicacion', 'Ubicación y horario'], ['pagos', 'Formas de pago'], ['opiniones', 'Opiniones'],
];

const iniciales = n => (n || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
const telWa = tel => { let d = (tel || '').replace(/\D/g, ''); if (d.length === 10) d = '52' + d; return d.length >= 12 ? d : null; };
const fmx = n => Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

function useAncho() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return w;
}

export default function PerfilClinica({ clinicaId, irAInicio, irADirectorio }) {
  const ancho = useAncho();
  const movil = ancho < 900;
  const [perfil, setPerfil]   = useState(null);
  const [dispon, setDispon]   = useState([]);
  const [estado, setEstado]   = useState('cargando');   // cargando | ok | noexiste | error
  const mapRef  = useRef(null);
  const mapInst = useRef(null);

  useEffect(() => {
    let vivo = true;
    setEstado('cargando');
    Promise.all([
      supabase.rpc('perfil_clinica_publico', { p_clinica: clinicaId }),
      supabase.rpc('disponibilidad_publica', { p_clinica: clinicaId, p_dias: 7 }),
    ]).then(([p, d]) => {
      if (!vivo) return;
      if (p.error) { console.error('[Perfil]', p.error); setEstado('error'); return; }
      if (!p.data) { setEstado('noexiste'); return; }
      setPerfil(p.data);
      setDispon(d.data || []);
      setEstado('ok');
      document.title = `${p.data.clinica.nombre} — DentistaCerca.mx`;
    });
    return () => { vivo = false; };
  }, [clinicaId]);

  // Mapa pequeño de ubicación (OpenStreetMap)
  useEffect(() => {
    const c = perfil?.clinica;
    if (!c?.latitud || !c?.longitud || !mapRef.current || mapInst.current) return;
    const pos = [parseFloat(c.latitud), parseFloat(c.longitud)];
    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(pos, 16);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
    }).addTo(map);
    L.circleMarker(pos, { radius: 11, color: C.azul, weight: 3, fillColor: C.teal, fillOpacity: 1 }).addTo(map);
    mapInst.current = map;
  }, [perfil]);
  useEffect(() => () => { mapInst.current?.remove(); mapInst.current = null; }, []);

  const irA = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ── Encabezado común ──────────────────────────────────────────────────────
  const header = (
    <header style={{ background: C.blanco, borderBottom: `1px solid ${C.borde}`, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
      <div onClick={irAInicio} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <img src="/img/logo-pin-256.png" alt="" style={{ width: '28px', height: '38px', objectFit: 'contain' }} />
        <span style={{ color: C.tinta, fontWeight: 600, fontSize: '18px', letterSpacing: '-0.02em', fontFamily: SANS }}>
          Dentista<span style={{ color: C.azul }}>Cerca</span>.mx
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {!movil && <button onClick={() => irADirectorio({})} style={{ border: `1px solid ${C.borde}`, background: C.blanco, color: C.tinta, borderRadius: '100px', padding: '8px 16px', fontSize: '14px', cursor: 'pointer', fontFamily: SANS }}>← Directorio</button>}
        <a href={URL_PARA_DENTISTAS} style={{ color: C.tinta, fontSize: '14px', fontWeight: 500, textDecoration: 'none', padding: '9px 16px', borderRadius: '100px', background: C.pastilla, fontFamily: SANS, whiteSpace: 'nowrap' }}>{movil ? 'Soy dentista' : '¿Eres dentista? Crea tu perfil →'}</a>
      </div>
    </header>
  );

  if (estado !== 'ok') {
    return (
      <div style={{ minHeight: '100vh', background: `linear-gradient(${C.cielo}, #fff 340px)`, fontFamily: SANS }}>
        {header}
        <div style={{ maxWidth: '560px', margin: '80px auto', textAlign: 'center', padding: '0 20px', color: C.gris }}>
          {estado === 'cargando' ? <p>Cargando perfil…</p> : (
            <>
              <img src="/img/logo-diente.png" alt="" style={{ width: '64px', marginBottom: '12px' }} />
              <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '32px', color: C.tinta, margin: '0 0 8px' }}>
                {estado === 'noexiste' ? 'Perfil no disponible' : 'No se pudo cargar el perfil'}
              </h1>
              <p style={{ margin: '0 0 20px' }}>{estado === 'noexiste' ? 'Esta clínica no está publicada en DentistaCerca o ya no existe.' : 'Inténtalo de nuevo en unos minutos.'}</p>
              <button onClick={() => irADirectorio({})} style={{ border: 'none', background: C.azul, color: '#fff', borderRadius: '100px', padding: '11px 22px', fontSize: '15px', cursor: 'pointer', fontFamily: SANS }}>Ver directorio</button>
            </>
          )}
        </div>
      </div>
    );
  }

  const { clinica: c, doctores, servicios } = perfil;
  const wa = telWa(c.whatsapp) || telWa(c.telefono);
  const urlWa = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola, vi el perfil de ${c.nombre} en DentistaCerca.mx y me gustaría agendar una cita.`)}` : null;
  const urlMapa = c.latitud && c.longitud
    ? `https://www.google.com/maps/dir/?api=1&destination=${c.latitud},${c.longitud}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.nombre} ${c.direccion || ''} ${c.ciudad || ''}`)}`;
  const porCategoria = servicios.reduce((acc, s) => { const k = s.categoria || 'Servicios'; (acc[k] = acc[k] || []).push(s); return acc; }, {});
  const proximoDisponible = dispon.find(d => d.estado === 'disponible');

  const card    = { background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: '20px', padding: movil ? '20px' : '28px' };
  const h2      = { fontFamily: SERIF, fontWeight: 400, fontSize: movil ? '26px' : '30px', color: C.tinta, margin: '0 0 14px', letterSpacing: '-0.01em' };
  const pastilla = { display: 'inline-block', padding: '5px 12px', borderRadius: '100px', background: C.pastilla, color: C.tinta, fontSize: '13px', fontWeight: 500 };
  const btn = (fondo, color, borde) => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '100px', background: fondo, color, border: borde ? `1px solid ${borde}` : 'none', textDecoration: 'none', fontWeight: 600, fontSize: '15px', fontFamily: SANS, cursor: 'pointer' });

  const tarjetaCita = (
    <div style={{ ...card, padding: '22px' }}>
      <p style={{ fontFamily: SERIF, fontSize: '26px', margin: '0 0 4px', color: C.tinta }}>Agenda tu <span style={{ color: C.azul }}>cita</span></p>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: C.gris }}>
        {proximoDisponible ? `Próximo día con espacio: ${new Date(proximoDisponible.fecha + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}` : 'Escríbenos y te damos el primer espacio disponible.'}
      </p>
      {dispon.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '16px' }}>
          {dispon.map(d => {
            const f = new Date(d.fecha + 'T12:00:00');
            const col = d.estado === 'disponible' ? { bg: '#E7F8EE', fg: '#15803d' } : d.estado === 'lleno' ? { bg: '#FEF3E2', fg: '#b45309' } : { bg: '#F1F3F6', fg: '#9aa5b1' };
            return (
              <div key={d.fecha} title={d.estado === 'disponible' ? 'Hay espacio' : d.estado === 'lleno' ? 'Agenda llena' : 'Cerrado'}
                style={{ textAlign: 'center', padding: '6px 0', borderRadius: '10px', background: col.bg, color: col.fg, fontSize: '11px', lineHeight: 1.3 }}>
                <div style={{ textTransform: 'capitalize' }}>{f.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')}</div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{f.getDate()}</div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {urlWa && <a href={urlWa} target="_blank" rel="noopener noreferrer" style={btn(C.verdeWa, '#fff')}>💬 Agendar por WhatsApp</a>}
        {c.telefono && <a href={`tel:${c.telefono.replace(/[^\d+]/g, '')}`} style={btn(C.azul, '#fff')}>📞 Llamar {c.telefono}</a>}
        <a href={urlMapa} target="_blank" rel="noopener noreferrer" style={btn(C.blanco, C.tinta, C.borde)}>📍 Cómo llegar</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(${C.cielo}, #fff 420px)`, fontFamily: SANS, color: C.tinta, paddingBottom: movil ? '90px' : 0 }}>
      {header}

      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: movil ? '16px' : '28px 24px 60px' }}>
        {/* Migas */}
        <p style={{ fontSize: '13px', color: C.gris, margin: '0 0 14px' }}>
          <span onClick={irAInicio} style={{ cursor: 'pointer' }}>Inicio</span> ›{' '}
          <span onClick={() => irADirectorio({})} style={{ cursor: 'pointer' }}>Directorio</span>
          {c.ciudad && <> › <span onClick={() => irADirectorio({ q: c.ciudad })} style={{ cursor: 'pointer' }}>{c.ciudad}</span></>} › <span style={{ color: C.tinta }}>{c.nombre}</span>
        </p>

        {/* Encabezado del perfil */}
        <section style={{ ...card, display: 'flex', gap: movil ? '16px' : '24px', alignItems: movil ? 'flex-start' : 'center', flexDirection: movil ? 'column' : 'row', marginBottom: '16px' }}>
          <div style={{ width: movil ? '84px' : '112px', height: movil ? '84px' : '112px', borderRadius: '24px', overflow: 'hidden', flexShrink: 0, background: `linear-gradient(135deg, ${C.azul}, ${C.teal})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {c.logo_clinica_url
              ? <img src={c.logo_clinica_url} alt={`Logo de ${c.nombre}`} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#fff' }} />
              : <span style={{ color: '#fff', fontSize: '32px', fontWeight: 700 }}>{iniciales(c.nombre)}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#0f766e', background: '#E6FAF6', padding: '4px 10px', borderRadius: '100px', marginBottom: '8px' }}>✓ Clínica verificada por ORALIX</span>
            <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: movil ? '34px' : '46px', lineHeight: 1.05, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{c.nombre}</h1>
            <p style={{ margin: '0 0 10px', fontSize: '15px', color: C.gris }}>
              📍 {[c.direccion, c.ciudad].filter(Boolean).join(', ') || 'Ubicación por confirmar'}
              {doctores.length > 0 && <> · 👨‍⚕️ {doctores.length} {doctores.length === 1 ? 'doctor' : 'doctores'}</>}
            </p>
            {c.especialidades.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {c.especialidades.map(e => <span key={e} style={pastilla}>{e}</span>)}
              </div>
            )}
          </div>
        </section>

        {/* Pestañas de secciones */}
        <nav style={{ position: 'sticky', top: '64px', zIndex: 50, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(6px)', border: `1px solid ${C.borde}`, borderRadius: '100px', padding: '6px', display: 'flex', gap: '4px', overflowX: 'auto', marginBottom: '20px' }}>
          {SECCIONES.map(([id, label]) => (
            <button key={id} onClick={() => irA(id)} style={{ flexShrink: 0, border: 'none', background: 'transparent', padding: '8px 14px', borderRadius: '100px', fontSize: '14px', color: C.tinta, cursor: 'pointer', fontFamily: SANS, whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.cielo; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              {label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <section id="sobre" style={{ ...card, scrollMarginTop: '130px' }}>
              <h2 style={h2}>Sobre la <span style={{ color: C.azul }}>clínica</span></h2>
              <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.7, color: '#3d3b40', whiteSpace: 'pre-line' }}>
                {c.descripcion || `${c.nombre} es una clínica dental${c.ciudad ? ` en ${c.ciudad}` : ''} que trabaja con ORALIX, el sistema de gestión dental con expediente clínico digital.`}
              </p>
            </section>

            <section id="doctores" style={{ ...card, scrollMarginTop: '130px' }}>
              <h2 style={h2}>Nuestros <span style={{ color: C.azul }}>doctores</span></h2>
              {doctores.length === 0 ? (
                <p style={{ margin: 0, color: C.gris }}>La clínica aún no ha publicado los perfiles de sus doctores.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1fr 1fr', gap: '14px' }}>
                  {doctores.map(d => (
                    <div key={d.nombre} style={{ border: `1px solid ${C.borde}`, borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px' }}>
                      <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: `linear-gradient(135deg, ${C.azul}, ${C.teal})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {d.foto ? <img src={d.foto} alt={d.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontSize: '22px', fontWeight: 700 }}>{iniciales(d.nombre)}</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '16px' }}>{d.nombre}</p>
                        {d.especialidad && <p style={{ margin: '2px 0 0', fontSize: '14px', color: C.azul }}>{d.especialidad}</p>}
                        {d.anios > 0 && <p style={{ margin: '2px 0 0', fontSize: '13px', color: C.gris }}>{d.anios} {d.anios === 1 ? 'año' : 'años'} de experiencia</p>}
                        {d.bio && <p style={{ margin: '8px 0 0', fontSize: '14px', lineHeight: 1.55, color: '#3d3b40' }}>{d.bio}</p>}
                        {d.cedula && (
                          <p style={{ margin: '8px 0 0', fontSize: '12px', color: C.gris }}>
                            Cédula profesional {d.cedula} ·{' '}
                            <a href="https://www.cedulaprofesional.sep.gob.mx/" target="_blank" rel="noopener noreferrer" style={{ color: C.azul }}>Verificar en la SEP ↗</a>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="servicios" style={{ ...card, scrollMarginTop: '130px' }}>
              <h2 style={h2}>Servicios y <span style={{ color: C.azul }}>precios</span></h2>
              {servicios.length === 0 ? (
                <p style={{ margin: 0, color: C.gris }}>Consulta servicios y precios directamente con la clínica.</p>
              ) : (
                <>
                  {Object.entries(porCategoria).map(([cat, lista]) => (
                    <div key={cat} style={{ marginBottom: '14px' }}>
                      <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.gris }}>{cat}</p>
                      {lista.map(s => (
                        <div key={s.nombre} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: `1px solid ${C.borde}`, fontSize: '15px' }}>
                          <span>{s.nombre}</span>
                          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', color: s.precio ? C.tinta : C.gris }}>{s.precio ? `desde ${fmx(s.precio)}` : 'En valoración'}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: C.gris }}>Precios de referencia; el costo final se confirma en la valoración.</p>
                </>
              )}
            </section>

            <section id="ubicacion" style={{ ...card, scrollMarginTop: '130px' }}>
              <h2 style={h2}>Ubicación y <span style={{ color: C.azul }}>horario</span></h2>
              <div style={{ display: 'grid', gridTemplateColumns: movil ? '1fr' : '1.2fr 1fr', gap: '18px' }}>
                <div>
                  {c.latitud && c.longitud
                    ? <div ref={mapRef} style={{ height: '240px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${C.borde}`, position: 'relative', zIndex: 0 }} />
                    : <div style={{ height: '120px', borderRadius: '16px', background: C.cielo, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.gris }}>Mapa no disponible</div>}
                  <p style={{ margin: '10px 0 0', fontSize: '15px' }}>📍 {[c.direccion, c.ciudad].filter(Boolean).join(', ')}</p>
                  <a href={urlMapa} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: C.azul }}>Cómo llegar ↗</a>
                </div>
                <div>
                  {c.horario_semanal ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <tbody>
                        {DIAS.map(([k, nombre]) => {
                          const rangos = c.horario_semanal[k] || [];
                          return (
                            <tr key={k} style={{ borderBottom: `1px solid ${C.borde}` }}>
                              <td style={{ padding: '7px 0', color: C.gris }}>{nombre}</td>
                              <td style={{ padding: '7px 0', textAlign: 'right', fontWeight: 500 }}>{rangos.length ? rangos.map(r => r.replace('-', ' – ')).join(', ') : <span style={{ color: '#b0b8c1' }}>Cerrado</span>}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ margin: 0, fontSize: '14px', color: c.horarios ? C.tinta : C.gris, whiteSpace: 'pre-line' }}>🕐 {c.horarios || 'Consulta el horario con la clínica.'}</p>
                  )}
                </div>
              </div>
            </section>

            <section id="pagos" style={{ ...card, scrollMarginTop: '130px' }}>
              <h2 style={h2}>Formas de <span style={{ color: C.azul }}>pago</span></h2>
              {c.formas_pago.length
                ? <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{c.formas_pago.map(f => <span key={f} style={{ ...pastilla, background: C.cielo }}>{f}</span>)}</div>
                : <p style={{ margin: 0, color: C.gris }}>Consulta las formas de pago con la clínica.</p>}
            </section>

            <section id="opiniones" style={{ ...card, scrollMarginTop: '130px' }}>
              <h2 style={h2}>Opiniones de <span style={{ color: C.azul }}>pacientes</span></h2>
              <p style={{ margin: 0, color: C.gris, lineHeight: 1.6 }}>
                Muy pronto: opiniones verificadas. En DentistaCerca solo se publicarán opiniones de pacientes que tuvieron una cita real en la clínica.
              </p>
            </section>
          </div>

          {!movil && <aside style={{ position: 'sticky', top: '140px' }}>{tarjetaCita}</aside>}
        </div>

        {movil && <div style={{ marginTop: '16px' }}>{tarjetaCita}</div>}

        {/* Invitación a dentistas */}
        <section style={{ marginTop: '28px', background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: '20px', padding: movil ? '20px' : '26px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: SERIF, fontSize: movil ? '24px' : '28px', margin: 0 }}>¿Eres dentista? Crea el perfil de tu <span style={{ color: C.azul }}>clínica</span></p>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: C.gris }}>Es gratis: aparece en el directorio y recibe citas por WhatsApp.</p>
          </div>
          <a href={URL_PARA_DENTISTAS} style={{ ...btn(C.azul, '#fff'), padding: '13px 24px' }}>Conocer los beneficios →</a>
        </section>
      </main>

      {/* Barra fija en celular */}
      {movil && urlWa && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 200, background: C.blanco, borderTop: `1px solid ${C.borde}`, padding: '10px 16px', display: 'flex', gap: '8px' }}>
          <a href={urlWa} target="_blank" rel="noopener noreferrer" style={{ ...btn(C.verdeWa, '#fff'), flex: 1 }}>💬 Agendar cita</a>
          {c.telefono && <a href={`tel:${c.telefono.replace(/[^\d+]/g, '')}`} style={{ ...btn(C.blanco, C.tinta, C.borde), padding: '12px 18px' }}>📞</a>}
        </div>
      )}

      <footer style={{ background: C.cielo, color: '#4a4a4c', textAlign: 'center', padding: '18px', fontSize: '12px', marginTop: '20px' }}>
        dentistacerca.mx · Directorio dental gratuito · Powered by <a href="https://app.oralix.mx" target="_blank" rel="noopener noreferrer" style={{ color: C.azul, textDecoration: 'none', fontWeight: 600 }}>ORALIX</a>
      </footer>
    </div>
  );
}
