import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import supabase from './lib/supabase';

const ESPECIALIDADES = [
  'Ortodoncia', 'Endodoncia', 'Cirugía oral', 'Periodoncia',
  'Implantes', 'Odontología general', 'Odontopediatría', 'Estética dental',
];

const GUADALAJARA = { lat: 20.6597, lng: -103.3496 };

const C = {
  primario:   '#1A6FBF',
  secundario: '#00B4A0',
  grad:       'linear-gradient(135deg, #1A6FBF, #00B4A0)',
  blanco:     '#FFFFFF',
  fondo:      '#F5F7FA',
  borde:      '#E4EAF2',
  texto:      '#1a1a2e',
  textoClaro: '#6B7A8D',
};

function iniciales(nombre) {
  return (nombre || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
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

export default function Directorio({ filtroInicial = {}, irAInicio }) {
  const mapRef     = useRef(null);
  const mapInst    = useRef(null);
  const markersRef = useRef(new Map());   // id de clínica → marcador

  const [clinicas,     setClinicas]     = useState([]);
  const [filtradas,    setFiltradas]    = useState([]);
  const [busqueda,     setBusqueda]     = useState(filtroInicial.q || '');
  const [especFiltro,  setEspecFiltro]  = useState(filtroInicial.espec || '');
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando,     setCargando]     = useState(true);
  const [errorMapa,    setErrorMapa]    = useState('');

  // ── Cargar clínicas visibles en el directorio ────────────────────────────
  // directorio_publico(): solo datos de directorio de clínicas activas que
  // eligieron aparecer (la tabla clinicas no se puede leer sin sesión).
  useEffect(() => {
    supabase
      .rpc('directorio_publico')
      .then(({ data }) => {
        const lista = (data || []).filter(c => c.latitud && c.longitud);
        setClinicas(lista);
        setFiltradas(lista);
        if (filtroInicial.clinica) setSeleccionada(lista.find(c => c.id === filtroInicial.clinica) || null);
        setCargando(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtrar ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = busqueda.toLowerCase().trim();
    let res = clinicas;
    if (q) res = res.filter(c =>
      c.nombre?.toLowerCase().includes(q) ||
      c.ciudad?.toLowerCase().includes(q) ||
      c.direccion?.toLowerCase().includes(q)
    );
    if (especFiltro) res = res.filter(c => (c.especialidades || []).includes(especFiltro));
    setFiltradas(res);
  }, [busqueda, especFiltro, clinicas]);

  // ── Mapa (OpenStreetMap con Leaflet: gratis, sin llave) ──────────────────
  // Se crea una sola vez cuando llegan las clínicas; cada clínica es un círculo
  // con los colores de ORALIX. Al hacer clic se abre su tarjeta de detalle.
  useEffect(() => {
    if (clinicas.length === 0 || !mapRef.current || mapInst.current) return;
    try {
      const map = L.map(mapRef.current, { zoomControl: true }).setView([GUADALAJARA.lat, GUADALAJARA.lng], 11);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      mapInst.current = map;

      clinicas.forEach(c => {
        const marcador = L.circleMarker([parseFloat(c.latitud), parseFloat(c.longitud)], {
          radius: 11, color: '#1A6FBF', weight: 3, fillColor: '#00B4A0', fillOpacity: 1,
        }).bindTooltip(c.nombre, { direction: 'top', offset: [0, -10] });
        marcador.on('click', () => {
          setSeleccionada(c);
          map.panTo(marcador.getLatLng());
        });
        marcador.addTo(map);
        markersRef.current.set(c.id, marcador);
      });

      // Encuadrar todas las clínicas (o la elegida desde el inicio)
      const elegida = clinicas.find(c => c.id === filtroInicial.clinica);
      if (elegida) {
        map.setView([parseFloat(elegida.latitud), parseFloat(elegida.longitud)], 15);
      } else if (clinicas.length > 1) {
        map.fitBounds(L.latLngBounds(clinicas.map(c => [parseFloat(c.latitud), parseFloat(c.longitud)])), { padding: [50, 50], maxZoom: 13 });
      } else {
        map.setView([parseFloat(clinicas[0].latitud), parseFloat(clinicas[0].longitud)], 14);
      }
    } catch (err) {
      setErrorMapa('No se pudo cargar el mapa: ' + err.message);
    }
  }, [clinicas]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { mapInst.current?.remove(); mapInst.current = null; }, []);

  // Mostrar solo los marcadores de las clínicas que pasan el filtro
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    const ids = new Set(filtradas.map(c => c.id));
    markersRef.current.forEach((marcador, id) => {
      if (ids.has(id)) marcador.addTo(map); else marcador.remove();
    });
  }, [filtradas]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.fondo, fontFamily: "'Inter', Arial, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: C.blanco, borderBottom: `1px solid ${C.borde}`, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={irAInicio} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img src="/img/logo-dentistacerca.png" alt="" style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'white', objectFit: 'contain' }} />
          <div>
            <span style={{ color: '#28262a', fontWeight: '600', fontSize: '18px', letterSpacing: '-0.02em', fontFamily: "'Instrument Sans', Inter, sans-serif" }}>
              Dentista<span style={{ color: C.primario }}>Cerca</span>.mx
            </span>
            <p style={{ color: C.textoClaro, margin: '2px 0 0', fontSize: '11px', lineHeight: 1 }}>
              Directorio dental gratuito · México
            </p>
          </div>
        </div>

        {/* Botón ¿Eres dentista? */}
        <a
          href="https://app.oralix.mx"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#28262a', fontSize: '14px', fontWeight: '500', textDecoration: 'none', padding: '9px 18px', borderRadius: '100px', background: '#9fe0d6' }}
        >
          ¿Eres dentista? →
        </a>
      </header>

      {/* ── Hero / barra de búsqueda ── */}
      <div style={{ background: C.blanco, borderBottom: `1px solid ${C.borde}`, padding: '14px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '420px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Ciudad, colonia o nombre de clínica..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', border: `1.5px solid ${C.borde}`, borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: C.texto }}
          />
        </div>
        <select
          value={especFiltro}
          onChange={e => setEspecFiltro(e.target.value)}
          style={{ padding: '10px 14px', border: `1.5px solid ${C.borde}`, borderRadius: '8px', fontSize: '14px', outline: 'none', background: C.blanco, fontFamily: 'inherit', cursor: 'pointer', color: especFiltro ? C.primario : C.textoClaro }}
        >
          <option value="">Todas las especialidades</option>
          {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <span style={{ fontSize: '13px', color: C.textoClaro, whiteSpace: 'nowrap' }}>
          {cargando ? 'Cargando…' : `${filtradas.length} clínica${filtradas.length !== 1 ? 's' : ''} encontrada${filtradas.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Contenido: lista + mapa ── */}
      <div style={{ display: 'flex', height: 'calc(100vh - 178px)' }}>

        {/* Lista lateral */}
        <div style={{ width: '380px', flexShrink: 0, overflowY: 'auto', borderRight: `1px solid ${C.borde}`, background: C.blanco }}>

          {cargando && (
            <div style={{ padding: '48px', textAlign: 'center', color: C.textoClaro }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏳</div>
              <p style={{ margin: 0 }}>Cargando directorio…</p>
            </div>
          )}

          {!cargando && filtradas.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: C.textoClaro }}>
              <img src="/img/logo-diente.png" alt="" style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '12px' }} />
              <p style={{ margin: '0 0 6px', fontWeight: '700', color: C.primario, fontSize: '15px' }}>Sin resultados</p>
              <p style={{ margin: 0, fontSize: '13px' }}>Prueba con otra ciudad o especialidad</p>
            </div>
          )}

          {!cargando && filtradas.map(c => {
            const espec  = c.especialidades || [];
            const esSelec = seleccionada?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setSeleccionada(c);
                  if (mapInst.current && c.latitud && c.longitud) {
                    mapInst.current.setView([parseFloat(c.latitud), parseFloat(c.longitud)], 15);
                  }
                }}
                style={{ padding: '16px 20px', borderBottom: `1px solid ${C.borde}`, cursor: 'pointer', background: esSelec ? '#EBF8FD' : C.blanco, borderLeft: esSelec ? `4px solid ${C.secundario}` : '4px solid transparent', transition: 'all 0.15s' }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.logo_clinica_url
                      ? <img src={c.logo_clinica_url + '?t=1'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                      : <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{iniciales(c.nombre)}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 3px', fontWeight: '700', fontSize: '14px', color: C.primario, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nombre}</p>
                    {c.ciudad     && <p style={{ margin: '0 0 2px', fontSize: '12px', color: C.textoClaro }}>🏙️ {c.ciudad}</p>}
                    {c.direccion  && <p style={{ margin: '0 0 4px', fontSize: '12px', color: C.textoClaro, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {c.direccion}</p>}
                    {c.telefono   && <p style={{ margin: '0 0 6px', fontSize: '12px', color: C.textoClaro }}>📞 {c.telefono}</p>}
                    {espec.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {espec.slice(0, 3).map(e => (
                          <span key={e} style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', background: '#E0F2FE', color: C.primario }}>{e}</span>
                        ))}
                        {espec.length > 3 && <span style={{ fontSize: '10px', color: C.textoClaro, padding: '2px 4px' }}>+{espec.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mapa */}
        <div style={{ flex: 1, position: 'relative', zIndex: 0 }}>
          {errorMapa ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '12px', color: C.textoClaro }}>
              <div style={{ fontSize: '44px' }}>🗺️</div>
              <p style={{ margin: 0, fontWeight: '700', color: C.primario }}>Mapa no disponible</p>
              <p style={{ margin: 0, fontSize: '13px' }}>{errorMapa}</p>
            </div>
          ) : (
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          )}

          {/* Card de detalle flotante */}
          {seleccionada && (
            <div style={{ position: 'absolute', bottom: '24px', right: '24px', zIndex: 1000, background: C.blanco, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '320px', overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ background: C.grad, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', background: 'rgba(255,255,255,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {seleccionada.logo_clinica_url
                    ? <img src={seleccionada.logo_clinica_url + '?t=1'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                    : <span style={{ color: 'white', fontWeight: '700', fontSize: '16px' }}>{iniciales(seleccionada.nombre)}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seleccionada.nombre}</p>
                  {seleccionada.ciudad && <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{seleccionada.ciudad}</p>}
                </div>
                <button onClick={() => setSeleccionada(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {[
                  seleccionada.direccion && { icon: '📍', label: seleccionada.direccion },
                  seleccionada.telefono  && { icon: '📞', label: seleccionada.telefono  },
                  seleccionada.email     && { icon: '✉️', label: seleccionada.email     },
                  seleccionada.horarios  && { icon: '🕐', label: seleccionada.horarios  },
                ].filter(Boolean).map(({ icon, label }) => (
                  <div key={label} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, fontSize: '14px' }}>{icon}</span>
                    <span style={{ fontSize: '13px', color: C.texto, wordBreak: 'break-word' }}>{label}</span>
                  </div>
                ))}
                {(seleccionada.especialidades || []).length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {seleccionada.especialidades.map(e => (
                      <span key={e} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: '#E0F2FE', color: C.primario }}>{e}</span>
                    ))}
                  </div>
                )}
                {telefonoWhatsApp(seleccionada.telefono) && (
                  <a href={`https://wa.me/${telefonoWhatsApp(seleccionada.telefono)}?text=${encodeURIComponent('Hola, vi su clínica en DentistaCerca.mx y quisiera una cita.')}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', marginTop: '14px', padding: '10px', background: '#25D366', color: 'white', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                    💬 Pedir cita por WhatsApp
                  </a>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {seleccionada.telefono && (
                    <a href={`tel:${seleccionada.telefono}`} style={{ flex: 1, padding: '9px', background: C.grad, color: 'white', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>
                      📞 Llamar
                    </a>
                  )}
                  <a href={urlGoogleMaps(seleccionada)} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: '9px', background: C.fondo, color: C.texto, border: `1px solid ${C.borde}`, borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>
                    📍 Google Maps
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: '#f3f1eb', color: '#4a4a4c', borderTop: `1px solid ${C.borde}`, textAlign: 'center', padding: '14px', fontSize: '12px', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        dentistacerca.mx · Directorio dental gratuito · Powered by{' '}
        <a href="https://app.oralix.mx" target="_blank" rel="noopener noreferrer" style={{ color: C.primario, textDecoration: 'none', fontWeight: '600' }}>ORALIX</a>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
        input:focus, select:focus { border-color: #1A6FBF !important; box-shadow: 0 0 0 3px rgba(26,111,191,0.12); }
      `}</style>
    </div>
  );
}
