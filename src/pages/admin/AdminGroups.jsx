import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const freqLabel = (f) => ({ daily:'Daily', weekly:'Weekly', monthly:'Monthly' }[f] || f)
const freqShort = (f) => ({ daily:'day',   weekly:'week',  monthly:'month'   }[f] || f)

export default function AdminGroups() {
  const navigate    = useNavigate()
  const { profile } = useAuthStore()

  const [groups, setGroups]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [showDelete, setShowDelete] = useState(null)
  const [deleting, setDeleting]     = useState(false)

  const [form, setForm] = useState({
    name:           '',
    description:    '',
    amount_per_slot:'',
    admin_cut:      '',
    payout_gross:   '',   // NEW: full amount before admin fee, typed by admin
    payout_amount:  '',   // auto-calculated = payout_gross - admin_cut (what members see/collect)
    frequency:      'daily',
    max_slots:      '15',
    bank_name:      '',
    account_name:   '',
    account_number: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Net = gross payout minus admin fee. Only returns a value when it's a valid positive number.
  const recomputeNet = (gross, cut) => {
    const g = parseFloat(gross || 0)
    const c = parseFloat(cut || 0)
    const net = g - c
    return net > 0 ? net.toString() : ''
  }

  useEffect(() => { fetchGroups() }, [])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*, slots(id, user_id)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setGroups(data || [])
    } catch { toast.error('Failed to load groups') }
    finally  { setLoading(false) }
  }

  const createGroup = async () => {
    if (!form.name.trim())            { toast.error('Enter group name');                          return }
    if (!form.amount_per_slot)        { toast.error('Enter amount members will pay per slot');    return }
    if (!form.payout_gross)           { toast.error('Enter the full payout amount (before your fee)'); return }
    if (form.admin_cut && parseFloat(form.admin_cut) >= parseFloat(form.payout_gross)) {
      toast.error('Your fee cannot be more than or equal to the payout amount'); return
    }
    if (!form.payout_amount)          { toast.error('Payout could not be calculated — check your fee'); return }
    if (!form.max_slots)              { toast.error('Enter number of slots');         return }
    if (parseInt(form.max_slots) < 4) { toast.error('Minimum 4 slots required');     return }
    if (!form.bank_name.trim())       { toast.error('Enter bank name');               return }
    if (!form.account_name.trim())    { toast.error('Enter account name');            return }
    if (!form.account_number.trim())  { toast.error('Enter account number');         return }

    setSaving(true)
    try {
      const { error } = await supabase.from('groups').insert({
        name:            form.name.trim(),
        description:     form.description.trim(),
        amount_per_slot: parseFloat(form.amount_per_slot),
        payout_gross:    parseFloat(form.payout_gross),   // full amount before fee
        payout_amount:   parseFloat(form.payout_amount),  // net amount members actually collect
        admin_cut:       parseFloat(form.admin_cut || 0),
        frequency:       form.frequency,
        max_slots:       parseInt(form.max_slots),
        status:          'open',
        created_by:      profile.id,
        bank_name:       form.bank_name.trim(),
        account_name:    form.account_name.trim(),
        account_number:  form.account_number.trim(),
      })
      if (error) throw error

      toast.success(`${form.name} created! 🎉`)
      setShowForm(false)
      setForm({
        name:'', description:'', amount_per_slot:'',
        admin_cut:'', payout_gross:'', payout_amount:'', frequency:'daily',
        max_slots:'15', bank_name:'', account_name:'', account_number:'',
      })
      fetchGroups()
    } catch (err) { toast.error(err.message || 'Failed to create group') }
    finally       { setSaving(false) }
  }

  const deleteGroup = async (groupId) => {
    setDeleting(true)
    try {
      const { error } = await supabase.from('groups').delete().eq('id', groupId)
      if (error) throw error
      toast.success('Circle deleted')
      setShowDelete(null)
      fetchGroups()
    } catch (err) { toast.error(err.message || 'Failed to delete') }
    finally       { setDeleting(false) }
  }

  const updateStatus = async (groupId, status) => {
    try {
      await supabase.from('groups').update({ status }).eq('id', groupId)
      toast.success(`Circle marked as ${status}`)
      fetchGroups()
    } catch { toast.error('Failed to update status') }
  }

  const getFilledSlots = (slots) => slots?.filter(s => s.user_id !== null).length || 0

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0f0e1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
        style={{ width:40, height:40, border:'3px solid #2a2840', borderTop:'3px solid #fbbf24', borderRadius:'50%' }} />
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0f0e1a', paddingBottom:40 }}>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(135deg, #13112a, #1a1830)', borderBottom:'1px solid #2a2840', padding:'20px 20px 16px', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <button onClick={() => navigate('/admin')}
              style={{ background:'none', border:'none', color:'#fbbf24', fontSize:12, cursor:'pointer', marginBottom:4, padding:0 }}>← Dashboard</button>
            <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff' }}>Manage Circles</div>
            <div style={{ fontSize:12, color:'#534AB7', marginTop:1 }}>{groups.length} circles total</div>
          </div>
          <motion.button whileTap={{ scale:0.96 }} onClick={() => setShowForm(true)}
            style={{ background:'linear-gradient(135deg, #fbbf24, #d97706)', border:'none', color:'#3a1f00', padding:'10px 18px', borderRadius:12, fontSize:13, fontWeight:800, cursor:'pointer' }}>
            + Create Circle
          </motion.button>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'20px 20px 0' }}>

        {groups.length === 0 ? (
          <div style={{ background:'#1a1830', border:'1px dashed #2a2840', borderRadius:20, padding:'48px 24px', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⭕</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#f1f0ff', marginBottom:8 }}>No circles yet</div>
            <div style={{ fontSize:13, color:'#AFA9EC', marginBottom:20 }}>Create your first saving circle</div>
            <motion.button whileTap={{ scale:0.97 }} onClick={() => setShowForm(true)}
              style={{ background:'linear-gradient(135deg, #fbbf24, #d97706)', border:'none', color:'#3a1f00', padding:'12px 24px', borderRadius:12, fontSize:13, fontWeight:800, cursor:'pointer' }}>
              + Create First Circle
            </motion.button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {groups.map((group, i) => {
              const filled   = getFilledSlots(group.slots)
              const progress = (filled / group.max_slots) * 100
              const isFull   = filled >= group.max_slots
              const statusColor = {
                open:      { bg:'#052e16', border:'#166534', text:'#22c55e' },
                filling:   { bg:'#1c1a0e', border:'#854d0e', text:'#fbbf24' },
                active:    { bg:'#1e1b4b', border:'#4338ca', text:'#818cf8' },
                completed: { bg:'#1a1a1a', border:'#374151', text:'#6b7280' },
              }[group.status] || { bg:'#1f1d35', border:'#3C3489', text:'#7F77DD' }

              return (
                <motion.div key={group.id}
                  initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                  style={{ background:'#1a1830', border:'1px solid #2a2840', borderRadius:20, overflow:'hidden' }}>

                  {/* Color bar */}
                  <div style={{ height:4, background: group.frequency === 'daily' ? 'linear-gradient(90deg, #22c55e, #7F77DD)' : group.frequency === 'weekly' ? 'linear-gradient(90deg, #7F77DD, #fbbf24)' : 'linear-gradient(90deg, #fbbf24, #7F77DD)' }} />

                  <div style={{ padding:'16px 16px 0' }}>
                    {/* Name & status */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:800, color:'#f1f0ff' }}>{group.name}</div>
                        <div style={{ fontSize:11, color:'#534AB7', marginTop:2 }}>
                          {freqLabel(group.frequency)} · Created {dayjs(group.created_at).format('DD MMM YYYY')}
                        </div>
                      </div>
                      <span style={{ background:statusColor.bg, border:`1px solid ${statusColor.border}`, color:statusColor.text, borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase' }}>
                        {group.status}
                      </span>
                    </div>

                    {/* Stats */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                      <div style={{ background:'#1f1d35', borderRadius:10, padding:'8px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'#534AB7', fontWeight:700, marginBottom:3 }}>MEMBERS PAY</div>
                        <div style={{ fontSize:14, fontWeight:800, color:'#f1f0ff' }}>₦{group.amount_per_slot?.toLocaleString()}</div>
                        <div style={{ fontSize:9, color:'#534AB7' }}>per slot</div>
                      </div>
                      <div style={{ background:'#1f1d35', borderRadius:10, padding:'8px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'#854d0e', fontWeight:700, marginBottom:3 }}>THEY COLLECT</div>
                        <div style={{ fontSize:14, fontWeight:800, color:'#fbbf24' }}>₦{group.payout_amount?.toLocaleString()}</div>
                        <div style={{ fontSize:9, color:'#534AB7' }}>net, per slot</div>
                      </div>
                      <div style={{ background:'#1f1d35', borderRadius:10, padding:'8px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'#534AB7', fontWeight:700, marginBottom:3 }}>SLOTS</div>
                        <div style={{ fontSize:14, fontWeight:800, color: isFull ? '#ef4444' : '#22c55e' }}>{filled}/{group.max_slots}</div>
                        <div style={{ fontSize:9, color:'#534AB7' }}>filled</div>
                      </div>
                    </div>

                    {/* Admin cut — only Rita sees */}
                    {group.admin_cut > 0 && (
                      <div style={{ background:'linear-gradient(135deg, #1c1a0e, #2a2408)', border:'1px solid #fbbf2430', borderRadius:10, padding:'8px 12px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:4 }}>
                        <span style={{ fontSize:11, color:'#854d0e' }}>
                          🔒 Gross ₦{group.payout_gross?.toLocaleString()} − fee ₦{group.admin_cut?.toLocaleString()}
                        </span>
                        <span style={{ fontSize:13, fontWeight:800, color:'#fbbf24' }}>= ₦{group.payout_amount?.toLocaleString()} net</span>
                      </div>
                    )}

                    {/* Account details */}
                    {group.bank_name && (
                      <div style={{ background:'#1f1d35', borderRadius:10, padding:'8px 12px', marginBottom:12 }}>
                        <div style={{ fontSize:10, color:'#534AB7', fontWeight:600, marginBottom:4 }}>PAYMENT ACCOUNT</div>
                        <div style={{ fontSize:12, color:'#AFA9EC' }}>
                          {group.bank_name} · {group.account_name} · <strong style={{ color:'#7F77DD' }}>{group.account_number}</strong>
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div style={{ marginBottom:12 }}>
                      <div style={{ height:6, background:'#1f1d35', borderRadius:3, overflow:'hidden' }}>
                        <motion.div initial={{ width:0 }} animate={{ width:`${progress}%` }} transition={{ duration:0.8 }}
                          style={{ height:'100%', borderRadius:3, background: progress >= 100 ? 'linear-gradient(90deg, #ef4444, #dc2626)' : progress >= 70 ? 'linear-gradient(90deg, #fbbf24, #d97706)' : 'linear-gradient(90deg, #7F77DD, #fbbf24)' }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                        <span style={{ fontSize:10, color:'#534AB7' }}>{Math.round(progress)}% filled</span>
                        <span style={{ fontSize:10, color: isFull ? '#ef4444' : '#22c55e' }}>{isFull ? '🔒 Full' : `${group.max_slots - filled} slots left`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display:'flex', gap:0, borderTop:'1px solid #2a2840' }}>
                    {group.status !== 'completed' && (
                      <button onClick={() => {
                        const next = { open:'active', filling:'active', active:'completed' }[group.status]
                        if (next) updateStatus(group.id, next)
                      }}
                        style={{ flex:1, padding:'11px', background:'transparent', border:'none', borderRight:'1px solid #2a2840', color:'#7F77DD', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        {group.status === 'active' ? '✓ Mark Complete' : '▶ Activate'}
                      </button>
                    )}
                    <button onClick={() => setShowDelete(group)}
                      style={{ flex:1, padding:'11px', background:'transparent', border:'none', color:'#ef4444', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                      🗑️ Delete Circle
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* CREATE CIRCLE MODAL */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:30 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'#1a1830', borderTop:'1px solid #2a2840', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto', padding:'20px 24px 40px' }}>

              <div style={{ width:40, height:4, borderRadius:2, background:'#2a2840', margin:'0 auto 20px' }} />
              <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff', marginBottom:4 }}>Create New Circle</div>
              <div style={{ fontSize:13, color:'#534AB7', marginBottom:24 }}>Fill in the details below</div>

              {/* Circle name */}
              <Field label="Circle Name">
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Gold Circle — Daily" />
              </Field>

              {/* Description */}
              <Field label="Description (optional)">
                <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description" />
              </Field>

              {/* Frequency */}
              <Field label="Payment Frequency">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  {[
                    { key:'daily',   label:'📆 Daily'   },
                    { key:'weekly',  label:'📅 Weekly'  },
                    { key:'monthly', label:'🗓️ Monthly' },
                  ].map(f => (
                    <button key={f.key} onClick={() => set('frequency', f.key)}
                      style={{ padding:'12px 4px', borderRadius:12, border:'none', background: form.frequency === f.key ? 'linear-gradient(135deg, #fbbf24, #d97706)' : '#1f1d35', border: form.frequency !== f.key ? '1px solid #2a2840' : 'none', color: form.frequency === f.key ? '#3a1f00' : '#AFA9EC', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Amount per slot — what each member pays. Independent of the payout calc. */}
              <Field label="Amount Members Pay Per Slot (₦)">
                <input type="number" value={form.amount_per_slot}
                  onChange={e => set('amount_per_slot', e.target.value)}
                  placeholder="e.g. 300" />
                <div style={{ fontSize:11, color:'#534AB7', marginTop:4 }}>
                  What each member packs every {freqShort(form.frequency)}.
                </div>
              </Field>

              {/* Full payout — gross, typed directly by admin */}
              <Field label="Full Payout Amount (₦) — before your fee">
                <input type="number" value={form.payout_gross}
                  onChange={e => {
                    set('payout_gross', e.target.value)
                    set('payout_amount', recomputeNet(e.target.value, form.admin_cut))
                  }}
                  placeholder="e.g. 25000" />
              </Field>

              {/* Admin cut */}
              <Field label="Your Platform Fee Per Slot (₦) 🔒 Only you see this">
                <input type="number" value={form.admin_cut}
                  onChange={e => {
                    set('admin_cut', e.target.value)
                    set('payout_amount', recomputeNet(form.payout_gross, e.target.value))
                  }}
                  placeholder="e.g. 4000" />
                <div style={{ fontSize:11, color:'#534AB7', marginTop:4 }}>
                  This is deducted from the full payout above. Members won't see this amount.
                </div>
              </Field>

              {/* Net payout — auto-calculated, read-only, this is what members actually see */}
              <Field label="Members Collect (₦) — auto-calculated, fee already deducted">
                <input type="number" value={form.payout_amount} readOnly
                  style={{ opacity:0.75, cursor:'not-allowed' }}
                  placeholder="Fills automatically once you enter payout & fee above" />
                {form.payout_gross && form.admin_cut && form.payout_amount && (
                  <div style={{ marginTop:8, background:'#1c1a0e', border:'1px solid #fbbf2450', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#fbbf24' }}>
                    ⚠️ Members will only see <strong>₦{parseFloat(form.payout_amount).toLocaleString()}</strong>.
                    Your ₦{parseFloat(form.admin_cut).toLocaleString()} fee is already deducted and stays hidden from them.
                  </div>
                )}
              </Field>

              {/* Max slots */}
              <Field label="Number of Slots (minimum 4)">
                <input type="number" value={form.max_slots} onChange={e => set('max_slots', e.target.value)} placeholder="e.g. 15" min="4" max="100" />
                <div style={{ fontSize:11, color:'#534AB7', marginTop:4 }}>
                  💡 Slots 1 & 2 are yours automatically. Members pick from slot 3 upward.
                </div>
              </Field>

              {/* Payment account */}
              <div style={{ background:'#1f1d35', border:'1px solid #fbbf2430', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#fbbf24', marginBottom:12 }}>
                  💳 Payment Account for this Circle
                </div>
                <Field label="Bank Name">
                  <input value={form.bank_name} onChange={e => set('bank_name', e.target.value)} placeholder="e.g. Access Bank" />
                </Field>
                <Field label="Account Name">
                  <input value={form.account_name} onChange={e => set('account_name', e.target.value)} placeholder="e.g. Rita O. Adeyemi" />
                </Field>
                <Field label="Account Number">
                  <input type="text" value={form.account_number}
                    onChange={e => set('account_number', e.target.value.replace(/\D/g,'').slice(0,10))}
                    placeholder="e.g. 0123456789" maxLength={10} />
                </Field>
              </div>

              {/* Summary */}
              {form.payout_gross && form.payout_amount && form.max_slots && (
                <div style={{ background:'linear-gradient(135deg, #1c1a0e, #2a2408)', border:'1px solid #fbbf2420', borderRadius:14, padding:'14px 16px', marginBottom:20 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#fbbf24', marginBottom:10 }}>Circle Summary</div>
                  {[
                    { label:'Each member pays',          value:`₦${parseFloat(form.amount_per_slot||0).toLocaleString()} per ${freqShort(form.frequency)}` },
                    { label:'Full payout (gross)',        value:`₦${parseFloat(form.payout_gross||0).toLocaleString()}` },
                    { label:'Your platform fee',          value:`₦${parseFloat(form.admin_cut||0).toLocaleString()} per slot` },
                    { label:'Member actually collects',   value:`₦${parseFloat(form.payout_amount||0).toLocaleString()}` },
                    { label:'Total slots',                value:`${form.max_slots} (2 yours + ${parseInt(form.max_slots||0)-2} for members)` },
                    { label:'Circle starts when',         value:`All ${form.max_slots} slots are filled` },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:11, color:'#854d0e' }}>{r.label}</span>
                      <span style={{ fontSize:11, color:'#fbbf24', fontWeight:600 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex:1, padding:'13px', background:'#1f1d35', border:'1px solid #2a2840', color:'#AFA9EC', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale:0.97 }} onClick={createGroup} disabled={saving}
                  style={{ flex:2, padding:'13px', background: saving ? '#2a2840' : 'linear-gradient(135deg, #fbbf24, #d97706)', border:'none', color: saving ? '#534AB7' : '#3a1f00', borderRadius:12, fontSize:14, fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Creating...' : 'Create Circle ✦'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setShowDelete(null)}>
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'#1a1830', border:'1px solid #7f1d1d', borderRadius:24, padding:32, maxWidth:360, width:'100%', textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#ef4444', marginBottom:8 }}>Delete Circle?</div>
              <div style={{ fontSize:13, color:'#AFA9EC', lineHeight:1.7, marginBottom:24 }}>
                Are you sure you want to delete <strong style={{ color:'#f1f0ff' }}>{showDelete.name}</strong>? This cannot be undone.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowDelete(null)}
                  style={{ flex:1, padding:'12px', background:'#1f1d35', border:'1px solid #2a2840', color:'#AFA9EC', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale:0.97 }} onClick={() => deleteGroup(showDelete.id)} disabled={deleting}
                  style={{ flex:1, padding:'12px', background: deleting ? '#2a2840' : 'linear-gradient(135deg, #ef4444, #dc2626)', border:'none', color:'#fff', borderRadius:12, fontSize:14, fontWeight:700, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
