// db.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
const supabaseUrl = 'https://mgimhcfjavmjcojighkj.supabase.co'
const supabaseKey = 'sb_publishable_EW1_KIfrEz8kSMjlu5Cefw_nxXB2daL'
export const supabase = createClient(supabaseUrl, supabaseKey)

/* ============ جلب كل البيانات ============ */
export async function fetchAll() {
  try {
    const [clients, bookings, items, works, site] = await Promise.all([
      supabase.from('clients').select('*').order('id', { ascending: true }),
      supabase.from('bookings').select('*').order('created', { ascending: false }),
      supabase.from('items').select('*').order('id', { ascending: true }),
      supabase.from('works').select('*').order('id', { ascending: true }),
      supabase.from('site_settings').select('data').eq('id', 1).maybeSingle()
    ])
    
    if (clients.error) console.error('clients error:', clients.error)
    if (bookings.error) console.error('bookings error:', bookings.error)
    if (items.error) console.error('items error:', items.error)
    if (works.error) console.error('works error:', works.error)
    if (site.error) console.error('site error:', site.error)

    return {
      clients: clients.data || [],
      bookings: (bookings.data || []).map(b => ({
        id: b.id, clientId: b.client_id, design: b.design, date: b.date,
        time: b.time, note: b.note, ref: b.ref, refs: b.refs || [],
        status: b.status, price: b.price, created: b.created, paid: b.paid
      })),
      items: items.data || [],
      works: works.data || [],
      site: site.data?.data || {}
    }
  } catch (e) {
    console.error('fetchAll exception:', e)
    return { clients: [], bookings: [], items: [], works: [], site: {} }
  }
}

/* ============ Public pages: only what visitors may see (no clients / bookings) ============ */
export async function fetchPublic() {
  try {
    const [items, works, site] = await Promise.all([
      supabase.from('items').select('*').order('id', { ascending: true }),
      supabase.from('works').select('*').order('id', { ascending: true }),
      supabase.from('site_settings').select('data').eq('id', 1).maybeSingle()
    ])
    if (items.error) console.error('items error:', items.error)
    if (works.error) console.error('works error:', works.error)
    if (site.error) console.error('site error:', site.error)
    return { clients: [], bookings: [], items: items.data || [], works: works.data || [], site: site.data?.data || {} }
  } catch (e) {
    console.error('fetchPublic exception:', e)
    return { clients: [], bookings: [], items: [], works: [], site: {} }
  }
}

/* ============ Booking from the website ============
   Preferred: SQL function create_booking (see supabase-setup.sql) — visitors never read clients/bookings.
   Fallback: direct inserts (works with the old policies). Returns the booking number or null. */
export async function createBooking(p) {
  try {
    const { data, error } = await supabase.rpc('create_booking', {
      p_name: p.name, p_phone: p.phone, p_design: p.design, p_date: p.date || null,
      p_time: p.time || '', p_note: p.note || '', p_photos: p.photos || []
    })
    if (!error) return data ?? null
    console.warn('create_booking RPC unavailable, using direct insert:', error.message)
  } catch (e) { console.warn('create_booking RPC failed:', e) }

  let clientId = null
  const { data: existing } = await supabase.from('clients').select('*').eq('phone', p.phone).maybeSingle()
  if (existing) {
    clientId = existing.id
    if (p.photos.length) await supabase.from('clients').update({ photos: [...(existing.photos || []), ...p.photos] }).eq('id', clientId)
  } else {
    const { data, error } = await supabase.from('clients').insert({ name: p.name, phone: p.phone, note: '', photos: p.photos }).select().single()
    if (error) throw error
    clientId = data.id
  }
  const { error } = await supabase.from('bookings').insert({
    client_id: clientId, design: p.design, date: p.date || null, time: p.time || '', note: p.note || '',
    ref: p.photos[0] || '', refs: p.photos, status: 'new', price: 0
  })
  if (error) throw error
  return null
}

/* ============ Clients ============ */
export async function saveClient(c) {
  const row = { name: c.name, phone: c.phone, note: c.note || '', photos: c.photos || [] }
  if (!c.id || c.id > 1e12) {
    const { data, error } = await supabase.from('clients').insert(row).select().single()
    if (error) { console.error('saveClient insert:', error); return null }
    return { ...data, id: data.id }
  }
  const { data, error } = await supabase.from('clients').update(row).eq('id', c.id).select().single()
  if (error) { console.error('saveClient update:', error); return null }
  return data
}
export const deleteClient = id => supabase.from('clients').delete().eq('id', id)

/* ============ Bookings ============ */
export async function saveBooking(b) {
  const row = {
    client_id: b.clientId === 0 ? null : b.clientId,
    design: b.design, date: b.date || null, time: b.time || '',
    note: b.note || '', ref: b.ref || '', refs: b.refs || [],
    status: b.status || 'new', price: b.price || 0, paid: b.paid || null
  }
  if (!b.id || b.id > 1e12) {
    const { data, error } = await supabase.from('bookings').insert(row).select().single()
    if (error) { console.error('saveBooking insert:', error); return null }
    return { ...data, clientId: data.client_id }
  }
  const { data, error } = await supabase.from('bookings').update(row).eq('id', b.id).select().single()
  if (error) { console.error('saveBooking update:', error); return null }
  return { ...data, clientId: data.client_id }
}
export const deleteBooking = id => supabase.from('bookings').delete().eq('id', id)

/* ============ Items ============ */
export async function saveItem(i) {
  const base = {
    kind: i.kind, title: i.title, te: i.te || '', desc: i.desc || '',
    de: i.de || '', price: i.price, old: i.old || 0, img: i.img || '',
    rec: !!i.rec, ratio: i.ratio || '', fit: i.fit || '', pos: i.pos || ''
  }
  // cat = القسم (mani / pedi / trt) ، dur = المدة بالدقائق (يحتاجان أعمدة في Supabase، انظر supabase-setup.sql)
  const row = { ...base, cat: i.cat || '', dur: i.dur || 0 }
  const isNew = !i.id || i.id > 1e12
  const run = r => isNew
    ? supabase.from('items').insert(r).select().single()
    : supabase.from('items').update(r).eq('id', i.id).select().single()
  let { data, error } = await run(row)
  if (error && /column|schema cache/i.test(error.message || '')) {
    console.warn('items.cat / items.dur columns are missing — saved without them. Run supabase-setup.sql')
    ;({ data, error } = await run(base))
  }
  if (error) { console.error('saveItem:', error); return null }
  return data
}
export const deleteItem = id => supabase.from('items').delete().eq('id', id)

/* ============ Works ============ */
export async function saveWork(w) {
  const row = {
    img: w.img, title: w.title, te: w.te || '',
    ratio: w.ratio || '', fit: w.fit || '', pos: w.pos || ''
  }
  if (!w.id || w.id > 1e12) {
    const { data, error } = await supabase.from('works').insert(row).select().single()
    if (error) { console.error('saveWork insert:', error); return null }
    return data
  }
  const { data, error } = await supabase.from('works').update(row).eq('id', w.id).select().single()
  if (error) { console.error('saveWork update:', error); return null }
  return data
}
export const deleteWork = id => supabase.from('works').delete().eq('id', id)

/* ============ Site Settings ============ */
export const saveSite = data => supabase.from('site_settings').update({ data }).eq('id', 1)

/* ============ Storage: رفع صورة ============ */
export async function uploadPhoto(file, folder = 'misc') {
  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('dn-photos').upload(name, file)
    if (error) { console.error('upload error:', error); return '' }
    const { data } = supabase.storage.from('dn-photos').getPublicUrl(name)
    return data.publicUrl
  } catch (e) {
    console.error('uploadPhoto exception:', e)
    return ''
  }
}