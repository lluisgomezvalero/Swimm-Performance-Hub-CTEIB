import { useEffect,useMemo,useState } from 'react';
import { AlertTriangle,CalendarDays,ChevronRight,ClipboardCheck,Dumbbell,HeartPulse,Medal,RefreshCw,Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { listEvents } from '../services/events';
import './DashboardPage.css';

const today=()=>new Date().toLocaleDateString('en-CA');
const fmtDate=date=>new Date(`${date}T12:00:00`).toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'});
const eventTime=e=>e?.start_time?.slice(0,5)||'Sin hora';

export default function DashboardPage({user}){
  const navigate=useNavigate();
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const[data,setData]=useState({});

  async function load(){
    if(user.demo){setLoading(false);return}
    setLoading(true);setError('');
    try{
      const events=await listEvents();
      const nowDay=today();
      const future=events.filter(e=>e.event_date>=nowDay).sort((a,b)=>a.event_date.localeCompare(b.event_date)||String(a.start_time||'').localeCompare(String(b.start_time||'')));
      if(user.role==='coach'){
        const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
        const monthAgo=new Date();monthAgo.setDate(monthAgo.getDate()-30);
        const [athletes,wellness,responses,attendance,reviews]=await Promise.all([
          supabase.from('profiles').select('id',{count:'exact'}).eq('role','athlete').eq('active',true),
          supabase.from('wellness_entries').select('athlete_id,hrv_ms,has_pain,pain_score').eq('entry_date',nowDay),
          supabase.from('training_responses').select('borg,meters,created_at').gte('created_at',weekAgo.toISOString()),
          supabase.from('attendance').select('status,updated_at').gte('updated_at',monthAgo.toISOString()),
          supabase.from('competition_reviews').select('rating,created_at')
        ]);
        const errs=[athletes.error,wellness.error,responses.error,attendance.error,reviews.error].filter(Boolean);if(errs.length)throw errs[0];
        const borgs=(responses.data||[]).map(x=>x.borg).filter(Number.isFinite);
        const marked=(attendance.data||[]);const presentLike=marked.filter(x=>x.status==='present'||x.status==='late').length;
        setData({athletes:athletes.count||0,wellness:wellness.data||[],avgBorg:borgs.length?(borgs.reduce((a,b)=>a+b,0)/borgs.length).toFixed(1):null,attendancePct:marked.length?Math.round(presentLike/marked.length*100):null,reviews:reviews.data||[],nextEvent:future[0]||null});
      }else{
        const [wellness,lastResponse,reviews]=await Promise.all([
          supabase.from('wellness_entries').select('*').eq('athlete_id',user.id).eq('entry_date',nowDay).maybeSingle(),
          supabase.from('training_responses').select('*').eq('athlete_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
          supabase.from('competition_reviews').select('event_id').eq('athlete_id',user.id)
        ]);
        const errs=[wellness.error,lastResponse.error,reviews.error].filter(Boolean);if(errs.length)throw errs[0];
        const nextTraining=future.find(e=>e.type==='training')||null;
        const nextCompetition=future.find(e=>e.type==='competition')||null;
        setData({wellness:wellness.data||null,lastResponse:lastResponse.data||null,nextTraining,nextCompetition,reviewedIds:new Set((reviews.data||[]).map(x=>x.event_id))});
      }
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  useEffect(()=>{load()},[user.id,user.role]);

  const greeting=useMemo(()=>{const h=new Date().getHours();return h<13?'Buenos días':h<20?'Buenas tardes':'Buenas noches'},[]);
  if(user.demo)return <><section className="hero-card dashboard-hero"><span className="eyebrow">Modo de prueba</span><h2>{greeting}, {user.name}</h2><p>Entra con una cuenta real para ver indicadores conectados a Supabase.</p></section><section className="card empty-state">El dashboard real no genera ni consulta datos desde el acceso demo.</section></>;
  if(loading)return <section className="card">Cargando dashboard…</section>;

  if(user.role==='coach'){
    const wellnessCount=data.wellness?.length||0;const painCount=(data.wellness||[]).filter(x=>x.has_pain).length;
    return <section className="dashboard-page"><section className="hero-card dashboard-hero"><div><span className="eyebrow">Panel de entrenador</span><h2>{greeting}, {user.name}</h2><p>Resumen operativo del programa de natación.</p></div><button className="dashboard-refresh" onClick={load}><RefreshCw size={17}/>Actualizar</button></section>{error&&<div className="error">{error}</div>}
      <div className="dashboard-grid">
        <button className="dash-card" onClick={()=>navigate('/wellness')}><span className="dash-icon wellness"><HeartPulse/></span><div><span>Wellness hoy</span><strong>{wellnessCount}/{data.athletes}</strong><small>{data.athletes?`${Math.round(wellnessCount/data.athletes*100)}% completado`:'Sin nadadores'}</small></div><ChevronRight/></button>
        <button className="dash-card" onClick={()=>navigate('/sessions')}><span className="dash-icon borg"><Dumbbell/></span><div><span>Percepción de esfuerzo media · 7 días</span><strong>{data.avgBorg??'—'}</strong><small>{data.avgBorg?'Escala Borg CR10':'Sin respuestas recientes'}</small></div><ChevronRight/></button>
        <button className="dash-card" onClick={()=>navigate('/attendance')}><span className="dash-icon attendance"><ClipboardCheck/></span><div><span>Asistencia · 30 días</span><strong>{data.attendancePct!=null?`${data.attendancePct}%`:'—'}</strong><small>Presente + tarde</small></div><ChevronRight/></button>
        <button className={`dash-card ${painCount?'alert':''}`} onClick={()=>navigate('/wellness')}><span className="dash-icon pain"><AlertTriangle/></span><div><span>Dolor comunicado hoy</span><strong>{painCount}</strong><small>{painCount?'Revisar wellness':'Sin alertas registradas'}</small></div><ChevronRight/></button>
      </div>
      <section className="dashboard-lower"><article className="card next-card"><div className="card-head"><div><span className="eyebrow">Agenda</span><h3>Próximo evento</h3></div><CalendarDays/></div>{data.nextEvent?<button className="next-event" onClick={()=>navigate(data.nextEvent.type==='training'?'/sessions':'/competitions')}><span className={`event-badge ${data.nextEvent.type}`}>{data.nextEvent.type==='training'?'Entrenamiento':'Competición'}</span><strong>{fmtDate(data.nextEvent.event_date)} · {eventTime(data.nextEvent)}</strong><small>{data.nextEvent.place||'Sin lugar indicado'}</small><ChevronRight/></button>:<p>No hay próximos eventos programados.</p>}</article>
      <article className="card quick-card"><span className="eyebrow">Equipo</span><h3>{data.athletes} nadadores activos</h3><p>{(data.reviews||[]).length} valoraciones de competición registradas.</p><button onClick={()=>navigate('/athletes')}><Users size={18}/>Ver nadadores</button></article></section>
    </section>;
  }

  return <section className="dashboard-page"><section className="hero-card dashboard-hero"><div><span className="eyebrow">Panel de nadador</span><h2>{greeting}, {user.name}</h2><p>Tu seguimiento y próximos eventos.</p></div><button className="dashboard-refresh" onClick={load}><RefreshCw size={17}/></button></section>{error&&<div className="error">{error}</div>}
    <div className="dashboard-grid athlete-grid">
      <button className={`dash-card ${!data.wellness?'pending':''}`} onClick={()=>navigate('/wellness')}><span className="dash-icon wellness"><HeartPulse/></span><div><span>Wellness de hoy</span><strong>{data.wellness?'Hecho':'Pendiente'}</strong><small>{data.wellness?`HRV ${data.wellness.hrv_ms} ms`:'Completa tu cuestionario'}</small></div><ChevronRight/></button>
      <button className="dash-card" onClick={()=>navigate('/sessions')}><span className="dash-icon calendar"><Dumbbell/></span><div><span>Próxima sesión</span><strong>{data.nextTraining?fmtDate(data.nextTraining.event_date):'—'}</strong><small>{data.nextTraining?`${eventTime(data.nextTraining)}${data.nextTraining.planned_meters?` · ${data.nextTraining.planned_meters} m`:''}`:'No programada'}</small></div><ChevronRight/></button>
      <button className="dash-card" onClick={()=>navigate('/sessions')}><span className="dash-icon borg"><Dumbbell/></span><div><span>Última percepción de esfuerzo</span><strong>{data.lastResponse?`${data.lastResponse.borg}/10`:'—'}</strong><small>{data.lastResponse?`Borg CR10 · ${data.lastResponse.meters} m realizados`:'Sin valoraciones'}</small></div><ChevronRight/></button>
      <button className="dash-card" onClick={()=>navigate('/competitions')}><span className="dash-icon competition"><Medal/></span><div><span>Próxima competición</span><strong>{data.nextCompetition?fmtDate(data.nextCompetition.event_date):'—'}</strong><small>{data.nextCompetition?`${eventTime(data.nextCompetition)}${data.nextCompetition.place?` · ${data.nextCompetition.place}`:''}`:'No programada'}</small></div><ChevronRight/></button>
    </div>
    {data.wellness?.has_pain&&<button className="dashboard-pain-alert" onClick={()=>navigate('/wellness')}><AlertTriangle size={20}/><div><strong>Dolor comunicado: {data.wellness.pain_score}/10</strong><span>{data.wellness.pain_note||'Registrado en el wellness de hoy'}</span></div><ChevronRight/></button>}
  </section>;
}
