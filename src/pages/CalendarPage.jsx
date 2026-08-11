import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listEvents } from '../services/events';

const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const weekDays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

function isoDate(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function startOffset(date){const day=date.getDay(); return day===0?6:day-1;}

export default function CalendarPage(){
  const [cursor,setCursor]=useState(()=>new Date());
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{(async()=>{try{setLoading(true);setEvents(await listEvents())}catch(e){setError(e.message)}finally{setLoading(false)}})()},[]);

  const cells=useMemo(()=>{
    const y=cursor.getFullYear(),m=cursor.getMonth();
    const days=new Date(y,m+1,0).getDate();
    const lead=startOffset(new Date(y,m,1));
    const total=Math.ceil((lead+days)/7)*7;
    return Array.from({length:total},(_,i)=>{const d=i-lead+1;return d>=1&&d<=days?{day:d,date:isoDate(y,m,d)}:null});
  },[cursor]);

  const byDate=useMemo(()=>events.reduce((acc,e)=>{(acc[e.event_date]??=[]).push(e);return acc},{}),[events]);
  const prev=()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1));
  const next=()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1));
  const today=()=>setCursor(new Date());

  return <section className="calendar-wrap">
    <div className="section-toolbar">
      <div><span className="eyebrow">Calendario compartido</span><h2>{monthNames[cursor.getMonth()]} {cursor.getFullYear()}</h2></div>
      <div className="toolbar-actions"><button onClick={prev}><ChevronLeft size={18}/></button><button onClick={today}>Hoy</button><button onClick={next}><ChevronRight size={18}/></button></div>
    </div>
    {error&&<div className="error">{error}</div>}
    {loading?<div className="card">Cargando calendario…</div>:<div className="calendar-card">
      <div className="calendar-head">{weekDays.map(d=><div key={d}>{d}</div>)}</div>
      <div className="calendar-grid">{cells.map((cell,i)=><div className={`calendar-cell ${!cell?'empty':''}`} key={i}>{cell&&<><span className="day-number">{cell.day}</span><div className="day-events">{(byDate[cell.date]||[]).map(e=><div key={e.id} className={`calendar-event ${e.type}`}><strong>{e.type==='training'?'Entrenamiento':'Competición'}</strong><span>{e.start_time?.slice(0,5)||''}{e.place?` · ${e.place}`:''}</span></div>)}</div></>}</div>)}</div>
    </div>}
    <div className="calendar-legend"><span><i className="dot training"></i>Entrenamiento</span><span><i className="dot competition"></i>Competición</span></div>
  </section>
}
