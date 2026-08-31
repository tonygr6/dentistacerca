import React, { useEffect, useRef, useState, useCallback } from 'react';
import supabase from './lib/supabase';

const ESPECIALIDADES = [
  'Ortodoncia', 'Endodoncia', 'Cirugía oral', 'Periodoncia',
  'Implantes', 'Odontología general', 'Odontopediatría', 'Estética dental',
];

const CDMX = { lat: 19.4326, lng: -99.1332 };

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

// Carga el SDK de Google Maps una sola vez
function cargarGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return; }
    const key = process.env.REACT_APP_GOOGLE_MAPS_KEY;
    if (!key) { reject(new Error('Variable REACT_APP_GOOGLE_MAPS_KEY no configurada')); return; }
    const existente = document.querySelector('script[data-gmaps]');
    if (existente) {
      existente.addEventListener('load', resolve);
      existente.addEventListener('error', () => reject(new Error('Error al cargar Google Maps')));
      return;
    }
    const script = document.createElement('script');
    script.setAttribute('data-gmaps', '1');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;
    script.onload  = resolve;
    script.onerror = () => reject(new Error('Error al cargar Google Maps'));
    document.head.appendChild(script);
  });
}

export default function App() {
  const mapRef     = useRef(null);
  const mapInst    = useRef(null);
  const markersRef = useRef([]);
  const infoWinRef = useRef(null);

  const [clinicas,     setClinicas]     = useState([]);
  const [filtradas,    setFiltradas]    = useState([]);
  const [busqueda,     setBusqueda]     = useState('');
  const [especFiltro,  setEspecFiltro]  = useState('');
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando,     setCargando]     = useState(true);
  const [errorMapa,    setErrorMapa]    = useState('');
  const [menuAbierto,  setMenuAbierto]  = useState(false);

  // ── Cargar clínicas visibles en el directorio ────────────────────────────
  useEffect(() => {
    supabase
      .from('clinicas')
      .select('id, nombre, direccion, telefono, email, horarios, logo_clinica_url, latitud, longitud, especialidades, ciudad')
      .eq('visible_360', true)
      .then(({ data }) => {
        const lista = (data || []).filter(c => c.latitud && c.longitud);
        setClinicas(lista);
        setFiltradas(lista);
        setCargando(false);
      });
  }, []);

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

  // ── Inicializar mapa ──────────────────────────────────────────────────────
  const initMap = useCallback((lista) => {
    if (!mapRef.current || !window.google?.maps) return;
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 11,
      center: CDMX,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });
    mapInst.current = map;
    infoWinRef.current = new window.google.maps.InfoWindow();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }

    lista.forEach(c => agregarMarcador(c, map));
  }, []); // eslint-disable-line

  function agregarMarcador(clinica, map) {
    const pos = { lat: parseFloat(clinica.latitud), lng: parseFloat(clinica.longitud) };
    const marker = new window.google.maps.Marker({
      position: pos,
      map,
      title: clinica.nombre,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#00B4A0',
        fillOpacity: 1,
        strokeColor: '#1A6FBF',
        strokeWeight: 2,
      },
    });
    marker.addListener('click', () => {
      setSeleccionada(clinica);
      infoWinRef.current?.setContent(`
        <div style="font-family:Inter,Arial,sans-serif;padding:4px;max-width:220px">
          <strong style="color:#1A6FBF;font-size:14px">${clinica.nombre}</strong><br/>
          <span style="color:#888;font-size:12px">${clinica.direccion || ''}</span>
        </div>
      `);
      infoWinRef.current?.open(map, marker);
      map.panTo(pos);
    });
    markersRef.current.push(marker);
  }

  useEffect(() => {
    if (clinicas.length === 0) return;
    cargarGoogleMaps()
      .then(() => initMap(clinicas))
      .catch(err => setErrorMapa(err.message));
  }, [clinicas, initMap]);

  // Actualizar visibilidad de marcadores según filtro
  useEffect(() => {
    const ids = new Set(filtradas.map(c => c.id));
    markersRef.current.forEach((m, i) => m.setVisible(ids.has(clinicas[i]?.id)));
  }, [filtradas, clinicas]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.fondo, fontFamily: "'Inter', Arial, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: C.grad, height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.18)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '26px' }}>🦷</span>
          <div>
            <span style={{ color: 'white', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' }}>
              dentista<span style={{ color: '#7DE8DF' }}>cerca</span>
              <span style={{ fontWeight: '500', fontSize: '15px', opacity: 0.85 }}>.mx</span>
            </span>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '11px', lineHeight: 1 }}>
              Directorio dental gratuito · México
            </p>
          </div>
        </div>

        {/* Botón ¿Eres dentista? */}
        <a
          href="https://app.oralix.mx"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'white', fontSize: '13px', fontWeight: '600', textDecoration: 'none', padding: '8px 16px', border: '1.5px solid rgba(255,255,255,0.45)', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', transition: 'background 0.2s' }}
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
      <div style={{ display: 'flex', height: 'calc(100vh - 114px)' }}>

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
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>🦷</div>
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
                    mapInst.current.panTo({ lat: parseFloat(c.latitud), lng: parseFloat(c.longitud) });
                    mapInst.current.setZoom(15);
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
        <div style={{ flex: 1, position: 'relative' }}>
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
            <div style={{ position: 'absolute', bottom: '24px', right: '24px', background: C.blanco, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '320px', overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
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
                {seleccionada.telefono && (
                  <a href={`tel:${seleccionada.telefono}`} style={{ display: 'block', marginTop: '14px', padding: '10px', background: C.grad, color: 'white', borderRadius: '8px', textAlign: 'center', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
                    📞 Llamar ahora
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: C.primario, color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '14px', fontSize: '12px', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        dentistacerca.mx · Directorio dental gratuito · Powered by{' '}
        <a href="https://app.oralix.mx" target="_blank" rel="noopener noreferrer" style={{ color: '#7DE8DF', textDecoration: 'none', fontWeight: '600' }}>ORALIX</a>
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
