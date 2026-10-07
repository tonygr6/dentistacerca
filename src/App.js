// DentistaCerca.mx — navegación entre la página de inicio y el directorio con mapa.
// Usa el "#" de la dirección (#/ y #/directorio?...) para no requerir configuración
// extra de rutas en Vercel.
import React, { useEffect, useState } from 'react';
import Home from './Home';
import Directorio from './Directorio';
import PerfilClinica from './PerfilClinica';

function leerRuta() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const [ruta, consulta = ''] = hash.split('?');
  const params = new URLSearchParams(consulta);
  return {
    vista: ruta.startsWith('/directorio') ? 'directorio' : ruta.startsWith('/clinica/') ? 'perfil' : 'inicio',
    clinicaId: ruta.startsWith('/clinica/') ? decodeURIComponent(ruta.slice('/clinica/'.length)) : '',
    filtro: {
      q: params.get('q') || '',
      espec: params.get('espec') || '',
      clinica: params.get('clinica') || '',
    },
  };
}

export default function App() {
  const [ruta, setRuta] = useState(leerRuta);

  useEffect(() => {
    const alCambiar = () => { setRuta(leerRuta()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  function irADirectorio(filtro = {}) {
    const params = new URLSearchParams(Object.entries(filtro).filter(([, v]) => v));
    const consulta = params.toString();
    window.location.hash = `/directorio${consulta ? '?' + consulta : ''}`;
  }

  function irAInicio() {
    window.location.hash = '/';
  }

  if (ruta.vista === 'perfil' && ruta.clinicaId) {
    return <PerfilClinica key={ruta.clinicaId} clinicaId={ruta.clinicaId} irAInicio={irAInicio} irADirectorio={irADirectorio} />;
  }
  if (ruta.vista === 'directorio') {
    // key: si cambia el filtro desde el inicio, el directorio se vuelve a montar con él
    return <Directorio key={JSON.stringify(ruta.filtro)} filtroInicial={ruta.filtro} irAInicio={irAInicio} />;
  }
  return <Home irADirectorio={irADirectorio} />;
}
