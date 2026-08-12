import { useEffect,useMemo,useState } from 'react';
import { Activity,ArrowLeft,ChevronRight,HeartPulse,Medal,Search,Timer,UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './AthletesPage.css';

const statusLabel={present:'Presente',late:'Tarde',justified:'Justificada',unjustified:'No justificada'};
const fmtDate=d=>new Date(`${d}T12:00:00`).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'});
const avg=arr=>arr.length?(arr.reduce((a,b)=>a+b,0)/arr.length):null;

export default function AthletesPage({user}){
  const[athletes,setAthletes]=useState([]);
  const[selected,setSelected]=useState(null);
  const[history,setHistory]=useState(null);
  const[loading,setLoading]=useState(true);
  const[detailLoading,setDetailLoading]=useState(false);
  const[query,setQuery]=useState('');
  const[error,setError]=useState('');

  useEffect(()=>{loadAthletes()},[]);

  async function loadAthletes(){
    setLoading(true);setError('');
    const{data,error:e}=await supabase.from('profiles').select('id,full_name,active,created_at').eq('role','athlete').order('full_name');
    if(e)setError(e.message);else setAthletes(data||[]);
    setLoading(false);
  }

  async function openAthlete(a){
    setSelected(a);setDetailLoading(true);setError('');
    try{
      const [wellness,training,attendance,reviews]=await Promise.all([
        supabase.from('wellness_entries').select('*').eq('athlete_id',a.id).order('entry_date',{ascending:false}).limit(30),
        supabase.from('training_responses').select('*, events!training_responses_event_id_fkey(event_date,start_time,place,planned_meters)').eq('athlete_id',a.id).order('created_at',{ascending:false}).limit(30),
        supabase.from('attendance').select('*, events!attendance_event_id_fkey(event_date,start_time,place)').eq('athlete_id',a.id).order('updated_at',{ascending:false}).limit(30),
        supabase.from('competition_reviews').select('*, events!competition_reviews_event_id_fkey(event_date,place)').eq('athlete_id',a.id).order('created_at',{ascending:false}).limit(20)
      ]);
      for(const r of [wellness,training,attendance,reviews]) if(r.error) throw r.error;
      setHistory({wellness:wellness.data||[],training:training.data||[],attendance:attendance.data||[],reviews:reviews.data||[]});
    }catch(e){setError(e.message)}finally{setDetailLoading(false)}
  }

  const filtered=useMemo(()=>athletes.filter(a=>(a.full_name||'').toLowerCase().includes(query.toLowerCase())),[athletes,query]);

  if(user.demo)return <section className="card empty-state"><h2>Nadadores</h2><p>El historial individual necesita una cuenta real de entrenador.</p></section>;

  if(selected){
    const w=history?.wellness||[],t=history?.training||[],at=history?.attendance||[],r=history?.reviews||[];
    const lastWellness=w[0],lastTraining=t[0];
    const borgAvg=avg(t.slice(0,10).map(x=>x.borg));
    const hrvAvg=avg(w.slice(0,7).map(x=>x.hrv_ms));
    const attendancePct=at.length?Math.round(at.filter(x=>x.status==='present'||x.status==='late').length/at.length*100):null;
    return <section className="athlete-detail">
      <button className="back-button" onClick={()=>{setSelected(null);setHistory(null)}}><ArrowLeft size={18}/>Volver a nadadores</button>
      <section className="card athlete-hero"><div className="athlete-avatar big">{(selected.full_name||'?').charAt(0).toUpperCase()}</div><div><span className="eyebrow">Perfil individual</span><h2>{selected.full_name}</h2><p>{selected.active?'Nadador activo':'Nadador inactivo'}</p></div></section>
      {error&&<div className="error">{error}</div>}
      {detailLoading?<section className="card">Cargando historial…</section>:<>
        <div className="athlete-kpis">
          <article className="card"><HeartPulse size={20}/><span>HRV medio · 7 registros</span><strong>{hrvAvg?`${Math.round(hrvAvg)} ms`:'—'}</strong></article>
          <article className="card"><Timer size={20}/><span>Borg medio · 10 sesiones</span><strong>{borgAvg?borgAvg.toFixed(1):'—'}</strong></article>
          <article className="card"><UserCheck size={20}/><span>Asistencia registrada</span><strong>{attendancePct!==null?`${attendancePct}%`:'—'}</strong></article>
          <article className={`card ${lastWellness?.has_pain?'pain-kpi':''}`}><Activity size={20}/><span>Dolor último wellness</span><strong>{lastWellness?lastWellness.has_pain?`${lastWellness.pain_score}/10`:'No':'—'}</strong></article>
        </div>

        <div className="athlete-history-grid">
          <section className="card history-section"><div className="history-title"><HeartPulse size={20}/><div><h3>Wellness reciente</h3><span>{w.length} registros cargados</span></div></div>{w.length?w.slice(0,7).map(x=><article className="history-row" key={x.id}><div><b>{fmtDate(x.entry_date)}</b><span>HRV {x.hrv_ms} ms · Sueño {x.sleep_hours} h</span></div><div className="mini-values"><span>Fatiga {x.fatigue}/5</span><span>Estrés {x.stress}/5</span>{x.has_pain&&<span className="danger-text">Dolor {x.pain_score}/10</span>}</div>{x.pain_note&&<p>{x.pain_note}</p>}{x.comment&&<p>{x.comment}</p>}</article>):<p className="empty-state">Sin wellness registrado.</p>}</section>

          <section className="card history-section"><div className="history-title"><Timer size={20}/><div><h3>Sesiones y carga</h3><span>{t.length} respuestas cargadas</span></div></div>{t.length?t.slice(0,7).map(x=><article className="history-row" key={x.id}><div><b>{x.events?.event_date?fmtDate(x.events.event_date):'Sesión'}</b><span>{x.events?.place||'Sin lugar'} · {x.meters} m</span></div><div className="mini-values"><span>Borg {x.borg}/10</span>{x.events?.planned_meters&&<span>Previstos {x.events.planned_meters} m</span>}</div>{x.comment&&<p>{x.comment}</p>}</article>):<p className="empty-state">Sin valoraciones de entrenamiento.</p>}</section>

          <section className="card history-section"><div className="history-title"><UserCheck size={20}/><div><h3>Asistencia</h3><span>{at.length} registros cargados</span></div></div>{at.length?at.slice(0,8).map(x=><article className="history-row compact" key={x.id}><div><b>{x.events?.event_date?fmtDate(x.events.event_date):'Sesión'}</b><span>{x.events?.place||'Sin lugar'}</span></div><span className={`attendance-chip ${x.status}`}>{statusLabel[x.status]||x.status}</span></article>):<p className="empty-state">Sin asistencia registrada.</p>}</section>

          <section className="card history-section"><div className="history-title"><Medal size={20}/><div><h3>Competiciones</h3><span>{r.length} valoraciones cargadas</span></div></div>{r.length?r.slice(0,6).map(x=><article className="history-row" key={x.id}><div><b>{x.events?.event_date?fmtDate(x.events.event_date):'Competición'}</b><span>{x.events?.place||'Sin lugar'}</span></div><div className="competition-score-mini">{x.rating}/5</div>{x.reason&&<p><b>Motivo:</b> {x.reason}</p>}{x.comment&&<p>{x.comment}</p>}</article>):<p className="empty-state">Sin valoraciones de competición.</p>}</section>
        </div>
      </>}
    </section>
  }

  return <section className="athletes-page"><div className="section-toolbar"><div><span className="eyebrow">Equipo</span><h2>Nadadores</h2><p>Accede al historial individual de cada deportista.</p></div></div>{error&&<div className="error">{error}</div>}<div className="athlete-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar nadador…"/></div>{loading?<section className="card">Cargando nadadores…</section>:<div className="athlete-list-grid">{filtered.map(a=><button className="card athlete-list-card" key={a.id} onClick={()=>openAthlete(a)}><div className="athlete-avatar">{(a.full_name||'?').charAt(0).toUpperCase()}</div><div><strong>{a.full_name}</strong><span>{a.active?'Activo':'Inactivo'}</span></div><ChevronRight size={20}/></button>)}</div>}</section>;
}
