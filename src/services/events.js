import { supabase } from '../lib/supabase';

export async function listEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTraining(values, userId) {
  const payload = {
    type: 'training',
    event_date: values.event_date,
    start_time: values.start_time,
    end_time: values.end_time,
    place: values.place || null,
    planned_meters: values.planned_meters ? Number(values.planned_meters) : null,
    description: values.description || null,
    created_by: userId,
  };
  const { data, error } = await supabase.from('events').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function createCompetition(values, userId) {
  const payload = {
    type: 'competition',
    event_date: values.event_date,
    start_time: values.start_time || null,
    end_time: values.end_time || null,
    place: values.place || null,
    planned_meters: null,
    description: values.description || null,
    created_by: userId,
  };
  const { data, error } = await supabase.from('events').insert(payload).select().single();
  if (error) throw error;
  return data;
}
