import { useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardCheck, Dumbbell, HeartPulse, Home, LogOut, Medal, Users } from 'lucide-react';

const coachNav = [
  ['/', 'Inicio', Home],
  ['/calendar', 'Calendario', CalendarDays],
  ['/sessions', 'Sesiones', Dumbbell],
  ['/attendance', 'Asistencia', ClipboardCheck],
  ['/wellness', 'Wellness', HeartPulse],
  ['/competitions', 'Competiciones', Medal],
  ['/athletes', 'Nadadores', Users],
];
const athleteNav = [
  ['/', 'Inicio', Home],
  ['/calendar', 'Calendario', CalendarDays],
  ['/sessions', 'Sesiones', Dumbbell],
  ['/wellness', 'Wellness', HeartPulse],
  ['/competitions', 'Competiciones', Medal],
];

function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const normalized = user.trim().toLowerCase();
    if (normalized === 'entrenador' && password === '1234') return onLogin({ id: 'coach-1', name: 'Entrenador CTEIB', role: 'coach' });
    if (normalized === 'nadador' && password === '1234') return onLogin({ id: 'athlete-1', name: 'Nadador Demo', role: 'athlete' });
    setError('Usuario o contraseña incorrectos.');
  };
  return <main className="login-page">
    <section className="login-brand">
      <img src="/assets/cteib-natacio-logo.png" alt="CTEIB Natació" />
      <span>Swim Performance Hub</span>
      <h1>Programa de natación CTEIB</h1>
      <p>Seguimiento diario de wellness, entrenamiento, asistencia y competición.</p>
    </section>
    <section className="login-card">
      <div><span className="eyebrow">Acceso</span><h2>Bienvenido</h2><p>Inicia sesión para acceder a tu panel.</p></div>
      <form onSubmit={submit}>
        <label>Usuario<input value={user} onChange={e=>setUser(e.target.value)} autoComplete="username" required /></label>
        <label>Contraseña<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" required /></label>
        {error && <div className="error">{error}</div>}
        <button className="primary" type="submit">Entrar</button>
      </form>
      <div className="demo-actions">
        <button onClick={()=>onLogin({ id:'coach-1', name:'Entrenador CTEIB', role:'coach' })}>Entrar como entrenador</button>
        <button onClick={()=>onLogin({ id:'athlete-1', name:'Nadador Demo', role:'athlete' })}>Entrar como nadador</button>
      </div>
    </section>
  </main>;
}

function Placeholder({ title, text }) {
  return <section className="card"><span className="eyebrow">Módulo React</span><h2>{title}</h2><p>{text}</p></section>;
}

function Dashboard({ role }) {
  const cards = role === 'coach'
    ? [['Wellness hoy','0'],['Borg medio','—'],['Sesiones registradas','0'],['Valoraciones','0']]
    : [['Wellness','Pendiente'],['Próxima sesión','—'],['Último Borg','—'],['Próxima competición','—']];
  return <>
    <section className="hero-card"><span className="eyebrow">{role==='coach'?'Panel de entrenador':'Panel de nadador'}</span><h2>{role==='coach'?'Control del programa':'Tu seguimiento diario'}</h2><p>Esta es ya la nueva base React. En los siguientes pasos conectaremos los datos reales con Supabase.</p></section>
    <section className="stats-grid">{cards.map(([label,value])=><article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
  </>;
}

function Shell({ user, onLogout }) {
  const nav = user.role === 'coach' ? coachNav : athleteNav;
  const location = useLocation();
  const navigate = useNavigate();
  const activeTitle = useMemo(()=>nav.find(([path])=>path===location.pathname)?.[1] || 'Inicio',[location.pathname, nav]);
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-row"><img src="/assets/cteib-natacio-logo.png" alt="CTEIB Natació"/><div><strong>Programa de natación CTEIB</strong><span>Swim Performance Hub</span></div></div>
      <nav>{nav.map(([path,label,Icon])=><button key={path} className={location.pathname===path?'active':''} onClick={()=>navigate(path)}><Icon size={19}/><span>{label}</span></button>)}</nav>
      <button className="logout" onClick={onLogout}><LogOut size={18}/>Cerrar sesión</button>
    </aside>
    <main className="main-content">
      <header><div><span className="eyebrow">{user.role==='coach'?'Entrenador':'Nadador'}</span><h1>{activeTitle}</h1></div><div className="user-pill">{user.name}</div></header>
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Dashboard role={user.role}/>} />
          <Route path="/calendar" element={<Placeholder title="Calendario" text="Aquí migraremos la vista mensual tipo Google Calendar y los eventos compartidos."/>} />
          <Route path="/sessions" element={<Placeholder title="Sesiones" text="Aquí estarán las sesiones creadas por el entrenador y el registro de Borg, metros y comentarios."/>} />
          <Route path="/attendance" element={user.role==='coach'?<Placeholder title="Asistencia" text="Presente, tarde, justificada y no justificada, con colores y gestión exclusiva del entrenador."/>:<Navigate to="/" replace/>} />
          <Route path="/wellness" element={<Placeholder title="Wellness" text="Cuestionario diario, HRV y bloqueo tras responder."/>} />
          <Route path="/competitions" element={<Placeholder title="Competiciones" text="Valoración del 1 al 5 y motivo obligatorio si la respuesta es 1 o 2."/>} />
          <Route path="/athletes" element={user.role==='coach'?<Placeholder title="Nadadores" text="Gestión de deportistas, perfiles e historial individual."/>:<Navigate to="/" replace/>} />
          <Route path="*" element={<Navigate to="/" replace/>} />
        </Routes>
      </div>
    </main>
    <nav className="bottom-nav">{nav.slice(0,5).map(([path,label,Icon])=><button key={path} className={location.pathname===path?'active':''} onClick={()=>navigate(path)}><Icon size={21}/><span>{label}</span></button>)}</nav>
  </div>;
}

export default function App() {
  const [user, setUser] = useState(null);
  return user ? <Shell user={user} onLogout={()=>setUser(null)} /> : <Login onLogin={setUser} />;
}
