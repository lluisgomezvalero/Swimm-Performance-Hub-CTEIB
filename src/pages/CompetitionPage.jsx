import { useEffect,useState } from 'react';
import { CheckCircle2,MapPin,Medal,Plus,X } from 'lucide-react';
import { createCompetition,listEvents } from '../services/events';
import { supabase } from '../lib/supabase';
import './CompetitionPage.css';

const emptyForm={event_date:'',start_time:'',end_time:'',place:'',description:''};
const finished=e=>{const end=e.end_time||'23:59';return new Date()>=new Date(`${e.event_date}T${end}`)};

export default function CompetitionPage({user}){
  const[events,setEvents]=useState([]);
  const[reviews,setReviews]=useState({});
  const[open,setOpen]=useState(false);
  const[form,setForm]=useState(emptyForm);
  const[answering,setAnswering]=useState(null);
  const[answer,setAnswer]=useState({rating:5,why:'',comment:''});
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState('');

  async function refresh(){
    try{
      setLoading(true);setError('');
      const ev=(await listEvents()).filter(e=>e.type==='competition').sort((a,b)=>b.event_date.localeCompare(a.event_date));
      setEvents(ev);
      if(!user.demo){
        let q=supabase.from('competition_reviews').select('*');
        if(user.role==='athlete')q=q.eq('athlete_id',user.id);
        const{data,error:e}=await q;if(e)throw e;
        const map={};(data||[]).forEach(r=>{if(user.role==='athlete')map[r.event_id]=r;else(map[r.event_id]??=[]).push(r)});setReviews(map);
      }
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  useEffect(()=>{refresh()},[user.id,user.role]);

  async function saveCompetition(e){
    e.preventDefault();
    try{setSaving(true);setError('');await createCompetition(form,user.id);setForm(emptyForm);setOpen(false);await refresh()}
    catch(e){setError(e.message)}finally{setSaving(false)}
  }

  async function sendReview(e,event){
    e.preventDefault();
    if(answer.rating<=2&&!answer.why.trim()){setError('Indica por qué has valorado la competición con 1 o 2.');return}
    try{
      setSaving(true);setError('');
      const low=answer.rating<=2?answer.why.trim():null;
      const{error:e2}=await supabase.from('competition_reviews').insert({event_id:event.id,athlete_id:user.id,rating:+answer.rating,reason:low,explanation:low,comment:answer.comment.trim()||null});
      if(e2)throw e2;
      setAnswering(null);setAnswer({rating:5,why:'',comment:''});await refresh();
    }catch(e){setError(e.code==='23505'?'Esta competición ya está valorada.':e.message)}finally{setSaving(false)}
  }

  return <section className="competition-page">
    <div className="section-toolbar"><div><span className="eyebrow">Competiciones</span><h2>Competiciones</h2><p>Programa competiciones y recoge la valoración de los nadadores.</p></div>{user.role==='coach'&&!user.demo&&<button className="primary inline-action" onClick={()=>setOpen(true)}><Plus size={18}/>Nueva competición</button>}</div>
    {error&&<div className="error">{error}</div>}

    {open&&user.role==='coach'&&<div className="competition-modal"><div className="competition-backdrop" onClick={()=>setOpen(false)}/><form className="competition-sheet" onSubmit={saveCompetition}><div className="competition-head"><div><span className="eyebrow light">Nueva competición</span><h3>Competición</h3><p>Crea el evento para que aparezca a los nadadores y en el calendario.</p></div><button type="button" onClick={()=>setOpen(false)}><X size={22}/></button></div><div className="competition-body"><label>Fecha<input type="date" required value={form.event_date} onChange={e=>setForm({...form,event_date:e.target.value})}/></label><div className="competition-time"><label>Hora inicio<input type="time" value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/></label><label>Hora fin<input type="time" value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/></label></div><label>Lugar<input value={form.place} onChange={e=>setForm({...form,place:e.target.value})} placeholder="Piscina / instalación"/></label><label>Descripción<textarea rows="4" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Prueba, convocatoria, indicaciones…"/></label></div><div className="competition-actions"><button type="button" onClick={()=>setOpen(false)}>Cancelar</button><button className="primary" disabled={saving}>{saving?'Guardando…':'Guardar competición'}</button></div></form></div>}

    <div className="competition-list">{loading?<div className="card">Cargando competiciones…</div>:events.length?events.map(ev=>{const review=reviews[ev.id];const canReview=user.role==='athlete'&&!user.demo&&finished(ev)&&!review;return <article className="card competition-card" key={ev.id}><div className="competition-icon"><Medal size={22}/></div><div className="competition-content"><div className="competition-title"><div><span className="eyebrow">Competición</span><h3>{new Date(`${ev.event_date}T12:00:00`).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</h3></div>{ev.place&&<span className="competition-place"><MapPin size={15}/>{ev.place}</span>}</div>{(ev.start_time||ev.end_time)&&<p>{ev.start_time?.slice(0,5)||'—'}{ev.end_time?`–${ev.end_time.slice(0,5)}`:''}</p>}{ev.description&&<p>{ev.description}</p>}
      {user.role==='athlete'&&review&&<div className="competition-done"><CheckCircle2 size={18}/><div><b>Valoración ya realizada</b><span>{review.rating}/5</span></div></div>}
      {canReview&&answering!==ev.id&&<button className="primary competition-review-btn" onClick={()=>{setAnswering(ev.id);setAnswer({rating:5,why:'',comment:''})}}>Valorar competición</button>}
      {canReview&&answering===ev.id&&<form className="competition-review-form" onSubmit={e=>sendReview(e,ev)}><label>¿Cómo valoras la competición?</label><div className="rating-grid">{[1,2,3,4,5].map(n=><button type="button" key={n} className={answer.rating===n?'selected':''} onClick={()=>setAnswer({...answer,rating:n})}><strong>{n}</strong><span>{['Muy mal','Mal','Correcta','Bien','Muy bien'][n-1]}</span></button>)}</div>{answer.rating<=2&&<label>¿Por qué? <span className="required">Obligatorio</span><textarea rows="3" required value={answer.why} onChange={e=>setAnswer({...answer,why:e.target.value})} placeholder="Explica brevemente qué ha ocurrido…"/></label>}<label>Comentario adicional <span className="optional">Opcional</span><textarea rows="3" value={answer.comment} onChange={e=>setAnswer({...answer,comment:e.target.value})} placeholder="Cualquier otro comentario…"/></label><div className="competition-actions"><button type="button" onClick={()=>setAnswering(null)}>Cancelar</button><button className="primary" disabled={saving}>{saving?'Guardando…':'Enviar valoración'}</button></div></form>}
      {user.role==='coach'&&!user.demo&&<div className="coach-review-box"><b>{(review||[]).length} valoraciones recibidas</b>{(review||[]).map(r=><div key={r.id}><span className={`review-score score-${r.rating}`}>{r.rating}/5</span><span>{r.reason||r.comment||'Sin comentario'}</span></div>)}</div>}
    </div></article>}):<div className="card empty-state">Todavía no hay competiciones programadas.</div>}</div>
  </section>;
}
