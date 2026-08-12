import { useEffect,useMemo,useState } from 'react';
import { Check,Clock3,FileCheck2,RefreshCw,UserX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { listEvents } from '../services/events';

const statuses={
  present:{label:'Presente',icon:Check},
  late:{label:'Tarde',icon:Clock3},
  justified:{label:'Justificada',icon:FileCheck2},
  unjustified:{label:'No justificada',icon:UserX},
};

export default function AttendancePage({user}){
  const[events,setEvents]=useState([]);
  const[athletes,setAthletes]=useState([]);
  const[attendance,setAttendance]=useState({});
  const[selected,setSelected]=useState('');
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState('');
  const[error,setError]=useState('');

  const load=async()=>{
    setLoading(true);setError('');
    try{
      const [ev,{data:profiles,error:pErr}] = await Promise.all([
        listEvents(),
        supabase.from('profiles').select('id,full_name,active').eq('role','athlete').eq('active',true).order('full_name')
      ]);
      if(pErr) throw pErr;
      const training=ev.filter(x=>x.type==='training').sort((a,b)=>b.event_date.localeCompare(a.event_date)||String(b.start_time).localeCompare(String(a.start_time)));
      setEvents(training);setAthletes(profiles||[]);
      const target=selected||training[0]?.id||'';setSelected(target);
      if(target) await loadAttendance(target);
    }catch(e){setError(e.message)}finally{setLoading(false)}
  };

  const loadAttendance=async(eventId)=>{
    const{data,error:e}=await supabase.from('attendance').select('*').eq('event_id',eventId);
    if(e) throw e;
    const map={};(data||[]).forEach(x=>map[x.athlete_id]=x);setAttendance(map);
  };

  useEffect(()=>{load()},[]);

  const chooseEvent=async(id)=>{setSelected(id);setLoading(true);setError('');try{await loadAttendance(id)}catch(e){setError(e.message)}finally{setLoading(false)}};

  const setStatus=async(athleteId,status)=>{
    if(!selected)return;
    setSaving(athleteId);setError('');
    const previous=attendance[athleteId];
    setAttendance(prev=>({...prev,[athleteId]:{...(prev[athleteId]||{}),event_id:selected,athlete_id:athleteId,status}}));
    const payload={event_id:selected,athlete_id:athleteId,status,validated_by:user.id,updated_at:new Date().toISOString()};
    const{data,error:e}=await supabase.from('attendance').upsert(payload,{onConflict:'event_id,athlete_id'}).select().single();
    if(e){setError(e.message);setAttendance(prev=>{const n={...prev};if(previous)n[athleteId]=previous;else delete n[athleteId];return n})}else setAttendance(prev=>({...prev,[athleteId]:data}));
    setSaving('');
  };

  const activeEvent=events.find(x=>x.id===selected);
  const counts=useMemo(()=>Object.values(attendance).reduce((a,x)=>{if(x?.status)a[x.status]=(a[x.status]||0)+1;return a},{present:0,late:0,justified:0,unjustified:0}),[attendance]);

  if(user.demo)return <section className="card empty-state"><h2>Asistencia</h2><p>La asistencia real solo se puede gestionar desde una cuenta de entrenador conectada a Supabase.</p></section>;

  return <section className="attendance-page">
    <div className="section-toolbar"><div><span className="eyebrow">Control del entrenador</span><h2>Asistencia</h2><p>Selecciona una sesión y marca el estado de cada nadador.</p></div><button className="inline-action" onClick={load}><RefreshCw size={17}/>Actualizar</button></div>
    {error&&<div className="error">{error}</div>}
    <div className="attendance-layout">
      <aside className="attendance-sessions card">
        <h3>Sesiones</h3>
        {events.length===0?<p className="empty-state">No hay entrenamientos creados.</p>:events.map(ev=><button key={ev.id} className={selected===ev.id?'active':''} onClick={()=>chooseEvent(ev.id)}><strong>{new Date(`${ev.event_date}T12:00:00`).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}</strong><span>{ev.start_time?.slice(0,5)}–{ev.end_time?.slice(0,5)}</span>{ev.place&&<small>{ev.place}</small>}</button>)}
      </aside>
      <div className="attendance-main">
        {activeEvent&&<section className="attendance-summary card"><div><span className="eyebrow">Sesión seleccionada</span><h3>{new Date(`${activeEvent.event_date}T12:00:00`).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</h3><p>{activeEvent.start_time?.slice(0,5)}–{activeEvent.end_time?.slice(0,5)}{activeEvent.place?` · ${activeEvent.place}`:''}</p></div><div className="attendance-counts"><span className="present">{counts.present} presentes</span><span className="late">{counts.late} tarde</span><span className="justified">{counts.justified} justificadas</span><span className="unjustified">{counts.unjustified} no justificadas</span></div></section>}
        {loading?<section className="card">Cargando asistencia…</section>:!selected?<section className="card empty-state">Selecciona una sesión.</section>:<div className="athlete-attendance-list">{athletes.map(a=>{const current=attendance[a.id]?.status;return <article className="card athlete-attendance" key={a.id}><div className="athlete-name"><div className="avatar-mini">{(a.full_name||'?').trim().charAt(0).toUpperCase()}</div><div><strong>{a.full_name}</strong><span>{current?statuses[current].label:'Sin marcar'}</span></div></div><div className="status-buttons">{Object.entries(statuses).map(([key,item])=>{const Icon=item.icon;return <button key={key} disabled={saving===a.id} className={`${key} ${current===key?'selected':''}`} onClick={()=>setStatus(a.id,key)}><Icon size={16}/><span>{item.label}</span></button>})}</div></article>})}</div>}
      </div>
    </div>
  </section>;
}
