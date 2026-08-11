import { useEffect, useState } from 'react';
import { Plus, Waves } from 'lucide-react';
import { createTraining, listEvents } from '../services/events';

const emptyForm={event_date:'',start_time:'',end_time:'',place:'',planned_meters:'',description:''};

export default function SessionsPage({ user }){
  const [events,setEvents]=useState([]);
  const [form,setForm]=useState(emptyForm);
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');

  async function refresh(){
    try{setLoading(true);setEvents((await listEvents()).filter(e=>e.type==='training').sort((a,b)=>b.event_date.localeCompare(a.event_date)))}
    catch(e){setError(e.message)}finally{setLoading(false)}
  }
  useEffect(()=>{refresh()},[]);

  async function submit(e){
    e.preventDefault();
    try{
      setSaving(true);setError('');
      await createTraining(form,user.id);
      setForm(emptyForm);setOpen(false);await refresh();
    }catch(e){setError(e.message)}finally{setSaving(false)}
  }

  return <section>
    <div className="section-toolbar">
      <div><span className="eyebrow">Entrenamientos</span><h2>Sesiones</h2><p>Las sesiones creadas aquí aparecen automáticamente a los nadadores.</p></div>
      {user.role==='coach'&&<button className="primary inline-action" onClick={()=>setOpen(v=>!v)}><Plus size={18}/>Añadir sesión</button>}
    </div>
    {error&&<div className="error">{error}</div>}
    {open&&user.role==='coach'&&<form className="card session-form" onSubmit={submit}>
      <h3>Nueva sesión de entrenamiento</h3>
      <div className="form-grid">
        <label>Fecha<input type="date" required value={form.event_date} onChange={e=>setForm({...form,event_date:e.target.value})}/></label>
        <label>Hora inicio<input type="time" required value={form.start_time} onChange={e=>setForm({...form,start_time:e.target.value})}/></label>
        <label>Hora fin<input type="time" required value={form.end_time} onChange={e=>setForm({...form,end_time:e.target.value})}/></label>
        <label>Lugar<input value={form.place} onChange={e=>setForm({...form,place:e.target.value})}/></label>
        <label>Metros previstos<input type="number" min="0" value={form.planned_meters} onChange={e=>setForm({...form,planned_meters:e.target.value})}/></label>
      </div>
      <label>Descripción<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <div className="form-actions"><button type="button" onClick={()=>setOpen(false)}>Cancelar</button><button className="primary" disabled={saving}>{saving?'Guardando…':'Guardar sesión'}</button></div>
    </form>}
    <div className="session-list">{loading?<div className="card">Cargando sesiones…</div>:events.length?events.map(e=><article className="card session-card" key={e.id}><div className="session-icon"><Waves size={20}/></div><div><h3>Entrenamiento</h3><p><strong>{new Date(`${e.event_date}T12:00:00`).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</strong></p><p>{e.start_time?.slice(0,5)}–{e.end_time?.slice(0,5)}{e.place?` · ${e.place}`:''}</p>{e.planned_meters&&<span className="pill">{e.planned_meters} m previstos</span>}{e.description&&<p>{e.description}</p>}</div></article>):<div className="card empty-state">Todavía no hay sesiones programadas.</div>}</div>
  </section>
}
