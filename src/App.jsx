import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, CalendarDays, ClipboardCheck, Dumbbell, Eye, EyeOff, HeartPulse, Home, LogOut, Medal, Users } from 'lucide-react';
import { supabase } from './lib/supabase';
import CalendarPage from './pages/CalendarPage';
import SessionsPage from './pages/SessionsPage';
import cteibLogo from './cteibLogo';

const coachNav=[['/','Inicio',Home],['/calendar','Calendario',CalendarDays],['/sessions','Sesiones',Dumbbell],['/attendance','Asistencia',ClipboardCheck],['/wellness','Wellness',HeartPulse],['/competitions','Competiciones',Medal],['/athletes','Nadadores',Users]];
const athleteNav=[['/','Inicio',Home],['/calendar','Calendario',CalendarDays],['/sessions','Sesiones',Dumbbell],['/wellness','Wellness',HeartPulse],['/competitions','Competiciones',Medal]];

function Logo({compact=false}){return <div className={compact?'cteib-logo compact':'cteib-logo'}><img src={cteibLogo} alt="CTEIB Natació"/></div>}

function Login(){
 const [loginType,setLoginType]=useState('coach');
 const [username,setUsername]=useState('');
 const [password,setPassword]=useState('');
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(false);
 const [showPassword,setShowPassword]=useState(false);

 const submit=async(e)=>{
  e.preventDefault();
  setError('');
  setLoading(true);
  const clean=username.trim().toLowerCase();
  const email=clean.includes('@')?clean:`${clean}@cteibnatacio.app`;
  const{error:signInError}=await supabase.auth.signInWithPassword({email,password});
  if(signInError)setError('Usuario o contraseña incorrectos.');
  setLoading(false);
 };

 return <main className="login-page login-v2">
  <section className="login-panel">
   <div className="login-inner">
    <Logo/>
    <h1>Swim Performance Hub</h1><p className="login-subtitle">Programa de natación CTEIB</p>
    <div className="role-switch" role="tablist" aria-label="Tipo de acceso">
      <button type="button" className={loginType==='coach'?'active':''} onClick={()=>{setLoginType('coach');setUsername('')}}>Entrenador</button>
      <button type="button" className={loginType==='athlete'?'active':''} onClick={()=>{setLoginType('athlete');setUsername('')}}>Nadador</button>
    </div>
    <p className="login-intro">Acceso como {loginType==='coach'?'entrenador':'nadador'}</p>
    <form onSubmit={submit}>
     <label>Usuario<input value={username} onChange={e=>setUsername(e.target.value)} type="text" autoComplete="username" placeholder={loginType==='coach'?'entrenador':'nadador1'} required/></label>
     <label>Contraseña<div className="password-field"><input value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?'text':'password'} autoComplete="current-password" required/><button type="button" aria-label="Mostrar contraseña" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div></label>
     {error&&<div className="error">{error}</div>}
     <button className="primary login-submit" type="submit" disabled={loading}>{loading?'Entrando…':'Iniciar sesión'}</button>
    </form>
    <p className="login-help">Puedes entrar solo con tu usuario. No es necesario escribir @cteibnatacio.app.</p>
   </div>
  </section>
  <section className="login-showcase">
   <div className="showcase-content"><span className="showcase-badge">↗ Entrena · Mide · Mejora</span><h2>Monitoriza el rendimiento de tu equipo de natación</h2><p>Wellness, carga de entrenamiento, Borg, asistencia y competiciones en una sola plataforma.</p>
    <div className="feature-list">
     <div><i><Activity/></i><span><strong>Seguimiento completo</strong><small>Wellness, HRV, metros, Borg y evolución diaria.</small></span></div>
     <div><i><CalendarDays/></i><span><strong>Calendario inteligente</strong><small>Planifica entrenamientos y competiciones con visión global.</small></span></div>
     <div><i><Users/></i><span><strong>Gestión del equipo</strong><small>Conecta entrenadores y nadadores en tiempo real.</small></span></div>
     <div><i><BarChart3/></i><span><strong>Análisis de datos</strong><small>Visualiza el progreso y toma decisiones basadas en datos.</small></span></div>
    </div>
   </div>
  </section>
 </main>
}

function Placeholder({title,text}){return <section className="card"><span className="eyebrow">Módulo React</span><h2>{title}</h2><p>{text}</p></section>}
function Dashboard({role}){const cards=role==='coach'?[['Wellness hoy','0'],['Borg medio','—'],['Sesiones registradas','0'],['Valoraciones','0']]:[['Wellness','Pendiente'],['Próxima sesión','—'],['Último Borg','—'],['Próxima competición','—']];return <><section className="hero-card"><span className="eyebrow">{role==='coach'?'Panel de entrenador':'Panel de nadador'}</span><h2>{role==='coach'?'Control del programa':'Tu seguimiento diario'}</h2><p>Calendario y sesiones ya trabajan con Supabase. Los siguientes módulos se irán conectando a esta misma base.</p></section><section className="stats-grid">{cards.map(([label,value])=><article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section></>}

function Shell({user,onLogout}){const nav=user.role==='coach'?coachNav:athleteNav;const location=useLocation();const navigate=useNavigate();const activeTitle=useMemo(()=>nav.find(([path])=>path===location.pathname)?.[1]||'Inicio',[location.pathname,nav]);return <div className="app-shell"><aside className="sidebar"><div className="brand-row"><Logo compact/><div><strong>Programa de natación CTEIB</strong><span>Swim Performance Hub</span></div></div><nav>{nav.map(([path,label,Icon])=><button key={path} className={location.pathname===path?'active':''} onClick={()=>navigate(path)}><Icon size={19}/><span>{label}</span></button>)}</nav><button className="logout" onClick={onLogout}><LogOut size={18}/>Cerrar sesión</button></aside><main className="main-content"><header><div><span className="eyebrow">{user.role==='coach'?'Entrenador':'Nadador'}</span><h1>{activeTitle}</h1></div><div className="user-pill">{user.name}</div></header><div className="page-content"><Routes><Route path="/" element={<Dashboard role={user.role}/>} /><Route path="/calendar" element={<CalendarPage user={user}/>} /><Route path="/sessions" element={<SessionsPage user={user}/>} /><Route path="/attendance" element={user.role==='coach'?<Placeholder title="Asistencia" text="Presente, tarde, justificada y no justificada, con colores y gestión exclusiva del entrenador."/>:<Navigate to="/" replace/>}/><Route path="/wellness" element={<Placeholder title="Wellness" text="Cuestionario diario, HRV y bloqueo tras responder."/>}/><Route path="/competitions" element={<Placeholder title="Competiciones" text="Valoración del 1 al 5 y motivo obligatorio si la respuesta es 1 o 2."/>}/><Route path="/athletes" element={user.role==='coach'?<Placeholder title="Nadadores" text="Gestión de deportistas, perfiles e historial individual."/>:<Navigate to="/" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></div></main><nav className="bottom-nav">{nav.slice(0,5).map(([path,label,Icon])=><button key={path} className={location.pathname===path?'active':''} onClick={()=>navigate(path)}><Icon size={21}/><span>{label}</span></button>)}</nav></div>}

export default function App(){const[user,setUser]=useState(null);const[loading,setLoading]=useState(true);useEffect(()=>{let mounted=true;const loadProfile=async(session)=>{if(!session?.user){if(mounted){setUser(null);setLoading(false)}return}const{data:profile,error}=await supabase.from('profiles').select('id, full_name, role, active').eq('id',session.user.id).single();if(mounted){if(!error&&profile?.active)setUser({id:profile.id,name:profile.full_name||session.user.email,role:profile.role,email:session.user.email});else setUser(null);setLoading(false)}};supabase.auth.getSession().then(({data})=>loadProfile(data.session));const{data:listener}=supabase.auth.onAuthStateChange((_event,session)=>loadProfile(session));return()=>{mounted=false;listener.subscription.unsubscribe()}},[]);const logout=async()=>{await supabase.auth.signOut()};if(loading)return <main className="login-page"><section className="login-card"><h2>Cargando…</h2></section></main>;return user?<Shell user={user} onLogout={logout}/>:<Login/>}
