import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

export default function AdminGroups() {
  const navigate    = useNavigate()
  const { profile } = useAuthStore()

  const [groups, setGroups]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [showDelete, setShowDelete] = useState(null)
  const [deleting, setDeleting]   = useState(false)

  const [form, setForm] = useState({
    name:             '',
    description:      '',
    amount_per_slot:  '',
    admin_cut:        '',
    payout_amount:    '',
    frequency:        'weekly',
    max_slots:        '25',
    bank_name:        '',
    account_name:     '',
    account_number:   '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { fetchGroups() }, [])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`*, slots(id, user_id)`)
        .order('created_at', { ascending: false })
      if (error) throw error
      setGroups(data || [])
    } catch {
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const createGroup = async () => {
    if (!form.name.trim())           { toast.error('Enter group name');         return }
    if (!form.amount_per_slot)       { toast.error('Enter amount per slot');    return }
    if (!form.payout_amount)         { toast.error('Enter payout amount');      return }
    if (!form.max_slots)             { toast.error('Enter number of slots');    return }
    if (parseInt(form.max_slots) < 4){ toast.error('Minimum 4 slots — slots 1 & 2 are yours, members start from 3'); return }

    setSaving(true)
    try {
      const { error } = await supabase.from('groups').insert({
        name:            form.name.trim(),
        description:     form.description.trim(),
        amount_per_slot: parseFloat(form.amount_per_slot),
        payout_amount:   parseFloat(form.payout_amount),
        frequency:       form.frequency,
        max_slots:       parseInt(form.max_slots),
        status:          'open',
        created_by:      profile.id,
        bank_name:       form.bank_name.trim(),
        account_name:    form.account_name.trim(),
        account_number:  form.account_number.trim(),
      })
      if (error) throw error

      toast.success(`${form.name} created successfully! 🎉`)
      setShowForm(false)
      setForm({
        name:'', description:'',
        amount_per_slot:'', payout_amount:'',
        frequency:'weekly', max_slots:'20',
      })
      fetchGroups()
    } catch (err) {
      toast.error(err.message || 'Failed to create group')
    } finally {
      setSaving(false)
    }
  }

  const deleteGroup = async (groupId) => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
      if (error) throw error
      toast.success('Group deleted')
      setShowDelete(null)
      fetchGroups()
    } catch (err) {
      toast.error(err.message || 'Failed to delete group')
    } finally {
      setDeleting(false)
    }
  }

  const updateStatus = async (groupId, status) => {
    try {
      await supabase.from('groups').update({ status }).eq('id', groupId)
      toast.success(`Group marked as ${status}`)
      fetchGroups()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const getFilledSlots = (slots) =>
    slots?.filter(s => s.user_id !== null).length || 0

  const statusColor = (status) => ({
    open:      { bg:'#052e16', border:'#166534', text:'#22c55e' },
    filling:   { bg:'#1c1a0e', border:'#854d0e', text:'#fbbf24' },
    active:    { bg:'#1e1b4b', border:'#4338ca', text:'#818cf8' },
    completed: { bg:'#1a1a1a', border:'#374151', text:'#6b7280' },
  }[status] || { bg:'#1f1d35', border:'#3C3489', text:'#7F77DD' })

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0f0e1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
          style={{ width:40, height:40, border:'3px solid #2a2840', borderTop:'3px solid #fbbf24', borderRadius:'50%' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0f0e1a', paddingBottom:40 }}>

      {/* ── HEADER */}
      <div style={{
        background:'linear-gradient(135deg, #13112a, #1a1830)',
        borderBottom:'1px solid #2a2840',
        padding:'20px 20px 16px',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <button onClick={() => navigate('/admin')}
              style={{ background:'none', border:'none', color:'#fbbf24', fontSize:12, cursor:'pointer', marginBottom:4, padding:0 }}>
              ← Dashboard
            </button>
            <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff' }}>Manage Circles</div>
            <div style={{ fontSize:12, color:'#534AB7', marginTop:1 }}>{groups.length} circles total</div>
          </div>
          <motion.button whileTap={{ scale:0.96 }}
            onClick={() => setShowForm(true)}
            style={{
              background:'linear-gradient(135deg, #fbbf24, #d97706)',
              border:'none', color:'#3a1f00',
              padding:'10px 18px', borderRadius:12,
              fontSize:13, fontWeight:800, cursor:'pointer',
              boxShadow:'0 4px 16px rgba(251,191,36,0.3)',
            }}>+ Create Circle</motion.button>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'20px 20px 0' }}>

        {/* ── GROUPS LIST */}
        {groups.length === 0 ? (
          <div style={{
            background:'#1a1830', border:'1px dashed #2a2840',
            borderRadius:20, padding:'48px 24px', textAlign:'center',
          }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⭕</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#f1f0ff', marginBottom:8 }}>No circles yet</div>
            <div style={{ fontSize:13, color:'#AFA9EC', marginBottom:20 }}>
              Create your first saving circle to get started
            </div>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => setShowForm(true)}
              style={{
                background:'linear-gradient(135deg, #fbbf24, #d97706)',
                border:'none', color:'#3a1f00',
                padding:'12px 24px', borderRadius:12,
                fontSize:13, fontWeight:800, cursor:'pointer',
              }}>+ Create First Circle</motion.button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {groups.map((group, i) => {
              const filled   = getFilledSlots(group.slots)
              const progress = (filled / group.max_slots) * 100
              const colors   = statusColor(group.status)
              const isFull   = filled >= group.max_slots

              return (
                <motion.div key={group.id}
                  initial={{ opacity:0, y:10 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:i * 0.06 }}
                  style={{
                    background:'#1a1830', border:'1px solid #2a2840',
                    borderRadius:20, overflow:'hidden',
                  }}
                >
                  {/* Color bar */}
                  <div style={{
                    height:4,
                    background: group.frequency === 'weekly'
                      ? 'linear-gradient(90deg, #7F77DD, #fbbf24)'
                      : 'linear-gradient(90deg, #fbbf24, #7F77DD)',
                  }} />

                  <div style={{ padding:'16px 16px 0' }}>
                    {/* Top row */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:800, color:'#f1f0ff' }}>{group.name}</div>
                        <div style={{ fontSize:11, color:'#534AB7', marginTop:2 }}>
                          Created {dayjs(group.created_at).format('DD MMM YYYY')}
                        </div>
                      </div>
                      <span style={{
                        background:colors.bg, border:`1px solid ${colors.border}`,
                        color:colors.text, borderRadius:20,
                        padding:'3px 10px', fontSize:10, fontWeight:700,
                        textTransform:'uppercase',
                      }}>{group.status}</span>
                    </div>

                    {/* Stats row */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                      {[
                        { label:'PACK',      value:`₦${group.amount_per_slot?.toLocaleString()}`, sub:group.frequency === 'weekly' ? '/week' : '/month', color:'#f1f0ff' },
                        { label:'COLLECT',   value:`₦${group.payout_amount?.toLocaleString()}`,   sub:'per slot', color:'#fbbf24' },
                        { label:'SLOTS',     value:`${filled}/${group.max_slots}`,                 sub:'filled',   color: isFull ? '#ef4444' : '#22c55e' },
                      ].map(s => (
                        <div key={s.label} style={{
                          background:'#1f1d35', borderRadius:10,
                          padding:'8px 10px', textAlign:'center',
                        }}>
                          <div style={{ fontSize:9, color:'#534AB7', fontWeight:700, marginBottom:3 }}>{s.label}</div>
                          <div style={{ fontSize:14, fontWeight:800, color:s.color }}>{s.value}</div>
                          <div style={{ fontSize:9, color:'#534AB7' }}>{s.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom:12 }}>
                      <div style={{ height:6, background:'#1f1d35', borderRadius:3, overflow:'hidden' }}>
                        <motion.div
                          initial={{ width:0 }}
                          animate={{ width:`${progress}%` }}
                          transition={{ duration:0.8 }}
                          style={{
                            height:'100%', borderRadius:3,
                            background: progress >= 100
                              ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                              : progress >= 70
                              ? 'linear-gradient(90deg, #fbbf24, #d97706)'
                              : 'linear-gradient(90deg, #7F77DD, #fbbf24)',
                          }}
                        />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                        <span style={{ fontSize:10, color:'#534AB7' }}>{Math.round(progress)}% filled</span>
                        <span style={{ fontSize:10, color: isFull ? '#ef4444' : '#22c55e' }}>
                          {isFull ? '🔒 Full' : `${group.max_slots - filled} slots left`}
                        </span>
                      </div>
                    </div>

                    {group.description && (
                      <div style={{ fontSize:12, color:'#AFA9EC', lineHeight:1.6, marginBottom:12 }}>
                        {group.description}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{
                    display:'flex', gap:0,
                    borderTop:'1px solid #2a2840',
                  }}>
                    {/* Status change */}
                    {group.status !== 'completed' && (
                      <button
                        onClick={() => {
                          const next = { open:'active', filling:'active', active:'completed' }[group.status]
                          if (next) updateStatus(group.id, next)
                        }}
                        style={{
                          flex:1, padding:'11px',
                          background:'transparent', border:'none',
                          borderRight:'1px solid #2a2840',
                          color:'#7F77DD', fontSize:12,
                          fontWeight:600, cursor:'pointer',
                        }}
                      >
                        {group.status === 'active' ? '✓ Mark Complete' : '▶ Activate'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowDelete(group)}
                      style={{
                        flex:1, padding:'11px',
                        background:'transparent', border:'none',
                        color:'#ef4444', fontSize:12,
                        fontWeight:600, cursor:'pointer',
                      }}
                    >🗑️ Delete Circle</button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════
          CREATE GROUP MODAL
      ══════════════════════════ */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:30 }}
              onClick={e => e.stopPropagation()}
              style={{
                background:'#1a1830', borderTop:'1px solid #2a2840',
                borderRadius:'24px 24px 0 0',
                width:'100%', maxWidth:600,
                maxHeight:'90vh', overflowY:'auto',
                padding:'20px 24px 40px',
              }}
            >
              <div style={{ width:40, height:4, borderRadius:2, background:'#2a2840', margin:'0 auto 20px' }} />
              <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff', marginBottom:4 }}>Create New Circle</div>
              <div style={{ fontSize:13, color:'#534AB7', marginBottom:24 }}>Fill in the details for the new saving circle</div>

              {/* Circle name */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Circle Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Gold Circle — Weekly" />
              </div>

              {/* Description */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Description (optional)</label>
                <input value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Brief description of this circle" />
              </div>

              {/* Frequency */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Frequency</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {['daily','weekly','monthly'].map(f => (
                    <button key={f} onClick={() => set('frequency', f)}
                      style={{
                        padding:'12px', borderRadius:12, border:'none',
                        background: form.frequency === f
                          ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                          : '#1f1d35',
                        border: form.frequency !== f ? '1px solid #2a2840' : 'none',
                        color: form.frequency === f ? '#3a1f00' : '#AFA9EC',
                        fontSize:13, fontWeight:700, cursor:'pointer',
                        textTransform:'capitalize',
                      }}
                    >{f === 'daily' ? '📆 Daily' : f === 'weekly' ? '📅 Weekly' : '🗓️ Monthly'}</button>
                  ))}
                </div>
              </div>

{/* Amount per slot */}
<div style={{ marginBottom:14 }}>
  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
    Amount Members Pay (₦)
  </label>
  <input type="number" value={form.amount_per_slot}
    onChange={e => {
      set('amount_per_slot', e.target.value)
      // Auto recalculate payout
      const payout = parseFloat(e.target.value||0) - parseFloat(form.admin_cut||0)
      if (payout > 0) set('payout_amount', payout.toString())
    }}
    placeholder="e.g. 25000" />
</div>

{/* Admin cut */}
<div style={{ marginBottom:14 }}>
  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#fbbf24', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
    Your Cut Per Slot (₦) 🔒 Only you see this
  </label>
  <input type="number" value={form.admin_cut}
    onChange={e => {
      set('admin_cut', e.target.value)
      // Auto calculate payout
      const payout = parseFloat(form.amount_per_slot||0) - parseFloat(e.target.value||0)
      if (payout > 0) set('payout_amount', payout.toString())
    }}
    placeholder="e.g. 5000" />
  <div style={{ fontSize:11, color:'#534AB7', marginTop:4 }}>
    Member collects = Pack amount minus your cut
  </div>
</div>

{/* Payout — auto calculated, read only */}
<div style={{ marginBottom:14 }}>
  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
    Member Collects (₦) — auto calculated
  </label>
  <input type="number" value={form.payout_amount}
    onChange={e => set('payout_amount', e.target.value)}
    placeholder="Auto calculated"
    style={{ opacity: form.payout_amount ? 1 : 0.5 }}
  />
  {form.amount_per_slot && form.admin_cut && (
    <div style={{ fontSize:12, color:'#22c55e', marginTop:4, fontWeight:600 }}>
      ✓ Member packs ₦{parseFloat(form.amount_per_slot||0).toLocaleString()} → 
      collects ₦{parseFloat(form.payout_amount||0).toLocaleString()} · 
      Your cut: ₦{parseFloat(form.admin_cut||0).toLocaleString()}
    </div>
  )}
</div>

              {/* Max slots */}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  Number of Slots (minimum 3)
                </label>
                <input type="number" value={form.max_slots}
                  onChange={e => set('max_slots', e.target.value)}
                  placeholder="e.g. 20" min="3" max="50" />
                <div style={{ fontSize:11, color:'#534AB7', marginTop:4 }}>
                  💡 Slots 1 & 2 are yours automatically. Members pick from slot 3 upward.
                </div>
              </div>

              {/* Summary preview */}
              {form.amount_per_slot && form.payout_amount && form.max_slots && (
                <div style={{
                  background:'linear-gradient(135deg, #1c1a0e, #2a2408)',
                  border:'1px solid #fbbf2430',
                  borderRadius:14, padding:'14px 16px',
                  marginBottom:20,
                }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#fbbf24', marginBottom:10 }}>Circle Summary</div>
                  {[
                    { label:'Each member packs', value:`₦${parseFloat(form.amount_per_slot||0).toLocaleString()} / ${form.frequency === 'weekly' ? 'week' : 'month'}` },
                    { label:'Each member collects', value:`₦${parseFloat(form.payout_amount||0).toLocaleString()}` },
                    { label:'Total slots', value:`${form.max_slots} (2 yours + ${parseInt(form.max_slots||0)-2} for members)` },
                    { label:'Group starts when', value:`All ${form.max_slots} slots are filled` },
                  ].map(r => (
                    <div key={r.label} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:11, color:'#854d0e' }}>{r.label}</span>
                      <span style={{ fontSize:11, color:'#fbbf24', fontWeight:600 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ 
                background:'#1f1d35', border:'1px solid #fbbf2430',
                borderRadius:12, padding:14, marginBottom:14 
                }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#fbbf24', marginBottom:12 }}>
                    💳 Payment Account for this Circle
                </div>

                <div style={{ marginBottom:10 }}>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:5 }}>Bank Name</label>
                    <input value={form.bank_name} onChange={e => set('bank_name', e.target.value)}
                    placeholder="e.g. Access Bank" />
                </div>

                <div style={{ marginBottom:10 }}>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:5 }}>Account Name</label>
                    <input value={form.account_name} onChange={e => set('account_name', e.target.value)}
                    placeholder="e.g. Rita O. Adeyemi" />
                </div>

                <div style={{ marginBottom:4 }}>
                    <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:5 }}>Account Number</label>
                    <input type="text" value={form.account_number}
                    onChange={e => set('account_number', e.target.value.replace(/\D/g,'').slice(0,10))}
                    placeholder="e.g. 0123456789" maxLength={10} />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex:1, padding:'13px', background:'#1f1d35', border:'1px solid #2a2840', color:'#AFA9EC', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale:0.97 }}
                  onClick={createGroup} disabled={saving}
                  style={{
                    flex:2, padding:'13px',
                    background: saving ? '#2a2840' : 'linear-gradient(135deg, #fbbf24, #d97706)',
                    border:'none',
                    color: saving ? '#534AB7' : '#3a1f00',
                    borderRadius:12, fontSize:14,
                    fontWeight:800, cursor: saving ? 'not-allowed' : 'pointer',
                  }}>
                  {saving ? 'Creating...' : 'Create Circle ✦'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════ */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setShowDelete(null)}
          >
            <motion.div
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
              onClick={e => e.stopPropagation()}
              style={{
                background:'#1a1830', border:'1px solid #7f1d1d',
                borderRadius:24, padding:32,
                maxWidth:360, width:'100%', textAlign:'center',
              }}
            >
              <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#ef4444', marginBottom:8 }}>Delete Circle?</div>
              <div style={{ fontSize:13, color:'#AFA9EC', lineHeight:1.7, marginBottom:24 }}>
                Are you sure you want to delete <strong style={{ color:'#f1f0ff' }}>{showDelete.name}</strong>?
                This will remove all slots and data. This cannot be undone.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowDelete(null)}
                  style={{ flex:1, padding:'12px', background:'#1f1d35', border:'1px solid #2a2840', color:'#AFA9EC', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale:0.97 }}
                  onClick={() => deleteGroup(showDelete.id)} disabled={deleting}
                  style={{
                    flex:1, padding:'12px',
                    background: deleting ? '#2a2840' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border:'none', color:'#fff',
                    borderRadius:12, fontSize:14,
                    fontWeight:700, cursor: deleting ? 'not-allowed' : 'pointer',
                  }}>
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
