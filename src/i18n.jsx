import { createContext,useContext,useMemo,useState } from 'react';

const translations={
  es:{
    nav:{home:'Inicio',calendar:'Calendario',sessions:'Sesiones',attendance:'Asistencia',wellness:'Wellness',competitions:'Competiciones',athletes:'Nadadores',logout:'Cerrar sesión',close:'Cerrar'},
    role:{coach:'Entrenador',athlete:'Nadador'},
    login:{program:'Programa de natación CTEIB',tagline:'Seguimiento diario de wellness, entrenamiento, asistencia y competición.',access:'Acceso',welcome:'Bienvenido',subtitle:'Inicia sesión para acceder a tu panel.',user:'Usuario',password:'Contraseña',entering:'Entrando…',enter:'Entrar',error:'Usuario o contraseña incorrectos.'},
    common:{loading:'Cargando…'}
  },
  ca:{
    nav:{home:'Inici',calendar:'Calendari',sessions:'Sessions',attendance:'Assistència',wellness:'Wellness',competitions:'Competicions',athletes:'Nedadors',logout:'Tancar sessió',close:'Tancar'},
    role:{coach:'Entrenador',athlete:'Nedador'},
    login:{program:'Programa de natació CTEIB',tagline:'Seguiment diari de wellness, entrenament, assistència i competició.',access:'Accés',welcome:'Benvingut',subtitle:'Inicia sessió per accedir al teu panell.',user:'Usuari',password:'Contrasenya',entering:'Entrant…',enter:'Entrar',error:'Usuari o contrasenya incorrectes.'},
    common:{loading:'Carregant…'}
  }
};

const LanguageContext=createContext(null);

function getStoredLanguage(){try{const value=localStorage.getItem('cteib-language');return value==='ca'?'ca':'es'}catch{return'es'}}

export function LanguageProvider({children}){
  const[language,setLanguageState]=useState(getStoredLanguage);
  const setLanguage=value=>{const next=value==='ca'?'ca':'es';setLanguageState(next);try{localStorage.setItem('cteib-language',next)}catch{}}
  const value=useMemo(()=>({language,setLanguage,t:translations[language]}),[language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(){const ctx=useContext(LanguageContext);if(!ctx)throw new Error('useLanguage must be used inside LanguageProvider');return ctx}
