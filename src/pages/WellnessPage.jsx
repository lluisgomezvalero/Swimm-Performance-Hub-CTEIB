import { useEffect, useState } from 'react';
import { CheckCircle2, HeartPulse, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const today = () => new Date().toLocaleDateString('en-CA');
const scaleFields = [
  ['sleep_quality','Calidad del sueño','1 = muy mala · 5 = excelente'],
  ['fatigue','Fatiga','1 = nada fatigado/a · 5 = muy fatigado/a'],
  ['soreness','Dolor muscular','1 = nada · 5 = mucho'],
  ['stress','Estrés','1 = nada · 5 = mucho'],
  ['mood','Estado de ánimo','1 = muy bajo · 5 = excelente'],
];

export default function WellnessPage({ user }) {
  const [entry,setEntry] = useState(null);
  const [entries,setEntries] = useState([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState('');
  const [form,setForm] = useState({sleep_quality:3,fatigue:3,soreness:3,stress:3,mood:3,sleep_hours:'',hrv_ms:'',comment:''});

  const load = async () => {
    setLoading(true); setError('');
    if (user.demo) { setLoading(false); return; }
    if (user.role === 'athlete') {
      const {data,error:e}=await supabase.from('wellness_entries').select('*').eq('athlete_id',user.id).eq('entry_date',today()).maybeSingle();
      if(e) setError(e.message); else setEntry(data);
    } else {
      const {data,error:e}=await supabase.from('wellness_entries').select('*, profiles!wellness_entries_athlete_id_fkey(full_name)').eq('entry_date',today()).order('created_at',{ascending:false});
      if(e) {
        const fallback=await supabase.from('wellness_entries').select('*').eq('entry_date',today()).order('created_at',{ascending:false});
        if(fallback.error) setError(fallback.error.message); else setEntries(fallback.data||[]);
      } else setEntries(data||[]);
    }
    setLoading(false);
  };
  useEffect(()=>{load()},[user.id,user.role]);

  const submit=async(e)=>{
    e.preventDefault(); setSaving(true); setError('');
    const payload={athlete_id:user.id,entry_date:today(),sleep_quality:+form.sleep_quality,fatigue:+form.fatigue,soreness:+form.soreness,stress:+form.stress,mood:+form.mood,sleep_hours:+form.sleep_hours,hrv_ms:+form.hrv_ms,comment:form.comment.trim()||null};
    const {data,error:e2}=await supabase.from('wellness_entries').insert(payload).select().single();
    if(e2) setError(e2.code==='23505'?'El cuestionario de hoy ya está contestado.':e2.message); else setEntry(data);
    setSaving(false);
  };

  if(user.demo) return <section className="card wellness-done"><HeartPulse size={38}/><h2>Wellness conectado a Supabase</h2><p>Para guardar o consultar respuestas reales entra con una cuenta de nadador o entrenador. El acceso demo no escribe datos.</p></section>;
  if(loading) return <section className="card"><p>Cargando wellness…</p></section>;

  if(user.role==='coach') return <>
    <div className="section-toolbar"><div><span className="eyebrow">Hoy</span><h2>Wellness del equipo</h2><p>{entries.length} respuestas registradas hoy.</p></div><button className="inline-action" onClick={load}><RefreshCw size={17}/>Actualizar</button></div>
    {error&&<div className="error">{error}</div>}
    <div className="wellness-list">{entries.length===0?<section className="card empty-state">Todavía no hay respuestas de wellness hoy.</section>:entries.map(x=><article className="card wellness-entry" key={x.id}><div><strong>{x.profiles?.full_name||'Nadador/a'}</strong><span>HRV {x.hrv_ms} ms · Sueño {x.sleep_hours} h</span></div><div className="wellness-values"><span>Sueño <b>{x.sleep_quality}/5</b></span><span>Fatiga <b>{x.fatigue}/5</b></span><span>Dolor <b>{x.soreness}/5</b></span><span>Estrés <b>{x.stress}/5</b></span><span>Ánimo <b>{x.mood}/5</b></span></div>{x.comment&&<p>{x.comment}</p>}</article>)}</div>
  </>;

  if(entry) return <section className="card wellness-done"><CheckCircle2 size={46}/><span className="eyebrow">Completado</span><h2>Wellness de hoy ya contestado</h2><p>Tu respuesta ha quedado registrada. Mañana se abrirá un nuevo cuestionario.</p><div className="wellness-summary"><span>HRV <b>{entry.hrv_ms} ms</b></span><span>Sueño <b>{entry.sleep_hours} h</b></span></div></section>;

  return <section className="card wellness-form"><span className="eyebrow">Cuestionario diario</span><h2>¿Cómo estás hoy?</h2><p>Contesta una sola vez al día. Los valores quedarán disponibles para el equipo técnico.</p>{error&&<div className="error">{error}</div>}<form onSubmit={submit}>
    <div className="wellness-scales">{scaleFields.map(([key,label,legend])=><fieldset key={key}><legend>{label}</legend><small>{legend}</small><div className="scale-buttons">{[1,2,3,4,5].map(n=><label key={n} className={+form[key]===n?'selected':''}><input type="radio" name={key} value={n} checked={+form[key]===n} onChange={()=>setForm({...form,[key]:n})}/><span>{n}</span></label>)}</div></fieldset>)}</div>
    <div className="form-grid"><label>Horas de sueño<input type="number" min="0" max="16" step="0.25" required value={form.sleep_hours} onChange={e=>setForm({...form,sleep_hours:e.target.value})} placeholder="8"/></label><label>HRV (ms)<input type="number" min="1" max="500" required value={form.hrv_ms} onChange={e=>setForm({...form,hrv_ms:e.target.value})} placeholder="65"/></label></div>
    <label>Comentario opcional<textarea rows="3" value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} placeholder="Algo que deba saber el equipo técnico…"/></label>
    <div className="form-actions"><button className="primary" disabled={saving}>{saving?'Guardando…':'Enviar wellness'}</button></div>
  </form></section>;
}