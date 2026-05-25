import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

function Avatar({ name, size = 38, fontSize = 13 }) {
  const initials = name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??'
  const colors = [
    ['#7F77DD','#534AB7'],['#f59e0b','#d97706'],
    ['#10b981','#059669'],['#8b5cf6','#7c3aed'],
    ['#ef4444','#dc2626'],['#06b6d4','#0891b2'],
  ]
  const [from, to] = colors[name ? name.charCodeAt(0) % colors.length : 0]
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:`linear-gradient(135deg, ${from}, ${to})`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize, fontWeight:700, color:'#fff', flexShrink:0,
    }}>{initials}</div>
  )
}

export default function AdminPayments() {
  const navigate    = useNavigate()
  const { profile } = useAuthStore()

  const [payments, setPayments]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('pending')
  const [search, setSearch]       = useState('')
  const [acting, setActing]       = useState(null)
  const [selected, setSelected]   = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [penaltyModal, setPenaltyModal] = useState(null)
  const [penaltyAmount, setPenaltyAmount] = useState('1000')

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          users ( full_name, phone, email, state ),
          groups ( name, amount_per_slot, frequency ),
          slots  ( slot_number )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      setPayments(data || [])
    } catch {
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  // ── Approve payment
  const approvePayment = async (pay) => {
    setActing(pay.id)
    try {
      await supabase.from('payments')
        .update({
          status:      'approved',
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', pay.id)

      // Mark slot as paid
      if (pay.slot_id) {
        await supabase.from('slots')
          .update({ status: 'paid' })
          .eq('id', pay.slot_id)
      }

      await supabase.from('notifications').insert({
        user_id:  pay.user_id,
        group_id: pay.group_id,
        title:    '💰 Payment Approved!',
        message:  `Your payment of ₦${pay.amount?.toLocaleString()} for ${pay.groups?.name} has been verified and approved. Thank you!`,
        type:     'payment',
      })

      toast.success('Payment approved ✅')
      setShowDetail(false)
      fetchPayments()
    } catch (err) {
      toast.error(err.message || 'Failed to approve')
    } finally {
      setActing(null)
    }
  }

  // ── Reject payment
  const rejectPayment = async (pay) => {
    setActing(pay.id)
    try {
      await supabase.from('payments')
        .update({ status: 'rejected' })
        .eq('id', pay.id)

      await supabase.from('notifications').insert({
        user_id:  pay.user_id,
        group_id: pay.group_id,
        title:    '❌ Payment Rejected',
        message:  `Your payment for ${pay.groups?.name} could not be verified. Please contact admin on WhatsApp for help.`,
        type:     'warning',
      })

      toast.success('Payment rejected. User notified.')
      setShowDetail(false)
      fetchPayments()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActing(null)
    }
  }

  // ── Apply penalty
  const applyPenalty = async () => {
    if (!penaltyModal) return
    setActing(penaltyModal.id)
    try {
      await supabase.from('payments')
        .update({ penalty_fee: parseFloat(penaltyAmount) })
        .eq('id', penaltyModal.id)

      await supabase.from('notifications').insert({
        user_id:  penaltyModal.user_id,
        group_id: penaltyModal.group_id,
        title:    '⚠️ Penalty Fee Applied',
        message:  `A penalty fee of ₦${parseFloat(penaltyAmount).toLocaleString()} has been applied to your payment for ${penaltyModal.groups?.name} due to late payment.`,
        type:     'penalty',
      })

      toast.success(`₦${parseFloat(penaltyAmount).toLocaleString()} penalty applied`)
      setPenaltyModal(null)
      fetchPayments()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActing(null)
    }
  }

  const filtered = payments.filter(p => {
    const matchFilter = filter === 'all' ? true : p.status === filter
    const matchSearch = !search ||
      p.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.groups?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.transaction_ref?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // ── Stats
  const totalApproved = payments.filter(p => p.status === 'approved').reduce((s, p) => s + (p.amount || 0), 0)
  const totalPending  = payments.filter(p => p.status === 'pending').length
  const totalRejected = payments.filter(p => p.status === 'rejected').length
  const totalPenalty  = payments.reduce((s, p) => s + (p.penalty_fee || 0), 0)

  const statusStyle = (status) => ({
    pending:  { bg:'#1c1a0e', border:'#854d0e', text:'#fbbf24', icon:'⏳' },
    approved: { bg:'#052e16', border:'#166534', text:'#22c55e', icon:'✅' },
    rejected: { bg:'#2d0a0a', border:'#7f1d1d', text:'#ef4444', icon:'❌' },
  }[status] || { bg:'#1f1d35', border:'#2a2840', text:'#AFA9EC', icon:'❓' })

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
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <button onClick={() => navigate('/admin')}
            style={{ background:'none', border:'none', color:'#fbbf24', fontSize:12, cursor:'pointer', marginBottom:4, padding:0 }}>
            ← Dashboard
          </button>
          <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff' }}>Payments</div>
          <div style={{ fontSize:12, color:'#534AB7', marginTop:1 }}>
            {totalPending} pending · ₦{totalApproved.toLocaleString()} approved total
          </div>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'16px 20px 0' }}>

        {/* ── STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
          {[
            { label:'Approved',  value:`₦${(totalApproved/1000).toFixed(0)}k`, color:'#22c55e', icon:'✅' },
            { label:'Pending',   value:totalPending,                            color:'#fbbf24', icon:'⏳', alert:totalPending > 0 },
            { label:'Rejected',  value:totalRejected,                           color:'#ef4444', icon:'❌' },
            { label:'Penalties', value:`₦${(totalPenalty/1000).toFixed(0)}k`,  color:'#f59e0b', icon:'⚠️' },
          ].map((s,i) => (
            <motion.div key={s.label}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
              style={{
                background:'#1a1830',
                border:`1px solid ${s.alert ? s.color+'50' : '#2a2840'}`,
                borderRadius:14, padding:'12px 8px', textAlign:'center',
              }}
            >
              <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:9, color:'#534AB7', marginTop:2, fontWeight:600 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── SEARCH */}
        <div style={{ marginBottom:12 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by name, group or reference..."
            style={{ width:'100%' }} />
        </div>

        {/* ── FILTER TABS */}
        <div style={{
          display:'flex', gap:0,
          background:'#1a1830', border:'1px solid #2a2840',
          borderRadius:12, overflow:'hidden', marginBottom:16,
        }}>
          {[
            { key:'pending',  label:'Pending',  count:payments.filter(p=>p.status==='pending').length },
            { key:'approved', label:'Approved', count:payments.filter(p=>p.status==='approved').length },
            { key:'rejected', label:'Rejected', count:payments.filter(p=>p.status==='rejected').length },
            { key:'all',      label:'All',      count:payments.length },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                flex:1, padding:'10px 4px',
                background: filter === f.key
                  ? 'linear-gradient(135deg, #7F77DD, #534AB7)'
                  : 'transparent',
                border:'none',
                color: filter === f.key ? '#fff' : '#534AB7',
                fontSize:11, fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center',
                justifyContent:'center', gap:4,
              }}
            >
              {f.label}
              <span style={{
                background: filter === f.key ? 'rgba(255,255,255,0.2)' : '#2a2840',
                borderRadius:8, padding:'1px 5px',
                fontSize:9, fontWeight:800,
              }}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* ── PAYMENTS LIST */}
        {filtered.length === 0 ? (
          <div style={{
            background:'#1a1830', border:'1px dashed #2a2840',
            borderRadius:16, padding:'40px 24px', textAlign:'center',
            fontSize:13, color:'#534AB7',
          }}>
            {filter === 'pending' ? 'No pending payments 🎉' : 'No payments found'}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map((pay, i) => {
              const s = statusStyle(pay.status)
              return (
                <motion.div key={pay.id}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                  style={{
                    background:s.bg, border:`1px solid ${s.border}`,
                    borderRadius:16, padding:'14px 16px',
                    cursor:'pointer',
                  }}
                  onClick={() => { setSelected(pay); setShowDetail(true) }}
                >
                  <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
                    <Avatar name={pay.users?.full_name} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#f1f0ff' }}>
                        {pay.users?.full_name}
                      </div>
                      <div style={{ fontSize:11, color:'#534AB7', marginTop:1 }}>
                        {pay.groups?.name} · Slot #{pay.slots?.slot_number}
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:16, fontWeight:800, color:'#fbbf24' }}>
                        ₦{pay.amount?.toLocaleString()}
                      </div>
                      <span style={{
                        background:`${s.text}20`, border:`1px solid ${s.text}40`,
                        color:s.text, borderRadius:10,
                        padding:'2px 8px', fontSize:9,
                        fontWeight:700, display:'inline-block', marginTop:2,
                      }}>{s.icon} {pay.status}</span>
                    </div>
                  </div>

                  <div style={{
                    display:'flex', justifyContent:'space-between',
                    fontSize:11, color:'#534AB7',
                  }}>
                    <span>📅 {dayjs(pay.payment_date).format('DD MMM YYYY')}</span>
                    <span>Ref: {pay.transaction_ref}</span>
                  </div>

                  {pay.penalty_fee > 0 && (
                    <div style={{
                      marginTop:8, background:'#2d0a0a',
                      border:'1px solid #7f1d1d',
                      borderRadius:6, padding:'4px 8px',
                      fontSize:10, color:'#ef4444',
                    }}>⚠️ Penalty: ₦{pay.penalty_fee?.toLocaleString()}</div>
                  )}

                  {/* Quick approve for pending */}
                  {pay.status === 'pending' && (
                    <div style={{ display:'flex', gap:6, marginTop:10 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <motion.button whileTap={{ scale:0.96 }}
                        onClick={() => rejectPayment(pay)}
                        disabled={acting === pay.id}
                        style={{
                          flex:1, padding:'8px',
                          background:'#2d0a0a', border:'1px solid #7f1d1d',
                          color:'#ef4444', borderRadius:8,
                          fontSize:11, fontWeight:700, cursor:'pointer',
                        }}>❌ Reject</motion.button>
                      <motion.button whileTap={{ scale:0.96 }}
                        onClick={() => approvePayment(pay)}
                        disabled={acting === pay.id}
                        style={{
                          flex:2, padding:'8px',
                          background: acting === pay.id ? '#2a2840' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                          border:'none', color:'#fff',
                          borderRadius:8, fontSize:11,
                          fontWeight:700, cursor: acting === pay.id ? 'not-allowed' : 'pointer',
                        }}>
                        {acting === pay.id ? '...' : '✅ Approve'}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

      </div>

      {/* ══════════════════════════
          PAYMENT DETAIL MODAL
      ══════════════════════════ */}
      <AnimatePresence>
        {showDetail && selected && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowDetail(false)}
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

              {/* Header */}
              <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:20 }}>
                <Avatar name={selected.users?.full_name} size={48} fontSize={16} />
                <div>
                  <div style={{ fontSize:17, fontWeight:800, color:'#f1f0ff' }}>
                    {selected.users?.full_name}
                  </div>
                  <div style={{ fontSize:12, color:'#534AB7', marginTop:2 }}>
                    {selected.users?.phone} · {selected.users?.state}
                  </div>
                </div>
              </div>

              {/* Payment info */}
              <div style={{
                background:'#1f1d35', borderRadius:16, padding:16, marginBottom:16,
              }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { label:'Amount',    value:`₦${selected.amount?.toLocaleString()}`, color:'#fbbf24', large:true },
                    { label:'Status',    value:selected.status?.toUpperCase(),           color: selected.status==='approved' ? '#22c55e' : selected.status==='rejected' ? '#ef4444' : '#fbbf24' },
                    { label:'Group',     value:selected.groups?.name },
                    { label:'Slot',      value:`#${selected.slots?.slot_number}` },
                    { label:'Date',      value:dayjs(selected.payment_date).format('DD MMM YYYY') },
                    { label:'Reference', value:selected.transaction_ref },
                    { label:'Sender',    value:selected.sender_name },
                    { label:'Frequency', value:selected.groups?.frequency },
                  ].map(r => (
                    <div key={r.label} style={{ background:'#2a2840', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ fontSize:9, color:'#534AB7', fontWeight:700, marginBottom:2 }}>{r.label.toUpperCase()}</div>
                      <div style={{ fontSize: r.large ? 18 : 12, fontWeight: r.large ? 800 : 500, color: r.color || '#f1f0ff' }}>
                        {r.value || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Penalty */}
              {selected.penalty_fee > 0 && (
                <div style={{
                  background:'#2d0a0a', border:'1px solid #7f1d1d',
                  borderRadius:12, padding:'10px 14px', marginBottom:14,
                  fontSize:13, color:'#ef4444',
                }}>⚠️ Penalty fee: ₦{selected.penalty_fee?.toLocaleString()}</div>
              )}

              {/* Receipt */}
              {selected.receipt_url && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#f1f0ff', marginBottom:8 }}>Receipt</div>
                  <a href={selected.receipt_url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display:'block', background:'#1f1d35',
                      border:'1px solid #2a2840', borderRadius:12,
                      overflow:'hidden', textDecoration:'none',
                    }}
                  >
                    <img src={selected.receipt_url} alt="receipt"
                      style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }}
                      onError={e => { e.target.style.display='none' }}
                    />
                    <div style={{ padding:'10px 14px', fontSize:12, color:'#7F77DD', fontWeight:600 }}>
                      📎 Tap to open full receipt →
                    </div>
                  </a>
                </div>
              )}

              {/* Action buttons */}
              {selected.status === 'pending' && (
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <motion.button whileTap={{ scale:0.97 }}
                    onClick={() => rejectPayment(selected)}
                    disabled={!!acting}
                    style={{
                      flex:1, padding:'13px',
                      background:'#2d0a0a', border:'1px solid #7f1d1d',
                      color:'#ef4444', borderRadius:12,
                      fontSize:14, fontWeight:700, cursor:'pointer',
                    }}>❌ Reject</motion.button>
                  <motion.button whileTap={{ scale:0.97 }}
                    onClick={() => approvePayment(selected)}
                    disabled={!!acting}
                    style={{
                      flex:2, padding:'13px',
                      background: acting ? '#2a2840' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      border:'none', color:'#fff',
                      borderRadius:12, fontSize:14,
                      fontWeight:700, cursor: acting ? 'not-allowed' : 'pointer',
                    }}>
                    {acting ? 'Processing...' : '✅ Approve Payment'}
                  </motion.button>
                </div>
              )}

              {/* Apply penalty button */}
              {selected.status !== 'rejected' && !selected.penalty_fee && (
                <button
                  onClick={() => { setShowDetail(false); setPenaltyModal(selected) }}
                  style={{
                    width:'100%', padding:'11px',
                    background:'#1c1a0e', border:'1px solid #854d0e',
                    color:'#fbbf24', borderRadius:12,
                    fontSize:13, fontWeight:600, cursor:'pointer',
                  }}>⚠️ Apply Penalty Fee</button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════
          PENALTY MODAL
      ══════════════════════════ */}
      <AnimatePresence>
        {penaltyModal && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setPenaltyModal(null)}
          >
            <motion.div
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
              onClick={e => e.stopPropagation()}
              style={{
                background:'#1a1830', border:'1px solid #854d0e',
                borderRadius:24, padding:28,
                maxWidth:360, width:'100%',
              }}
            >
              <div style={{ fontSize:32, textAlign:'center', marginBottom:12 }}>⚠️</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fbbf24', textAlign:'center', marginBottom:8 }}>
                Apply Penalty Fee
              </div>
              <p style={{ fontSize:13, color:'#AFA9EC', textAlign:'center', marginBottom:20, lineHeight:1.6 }}>
                Apply a penalty fee to <strong style={{ color:'#f1f0ff' }}>{penaltyModal.users?.full_name}</strong> for late payment.
              </p>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:6 }}>
                  Penalty Amount (₦)
                </label>
                <input type="number" value={penaltyAmount}
                  onChange={e => setPenaltyAmount(e.target.value)}
                  placeholder="1000" />
                <div style={{ fontSize:11, color:'#534AB7', marginTop:4 }}>
                  Default penalty is ₦1,000
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setPenaltyModal(null)}
                  style={{ flex:1, padding:'12px', background:'#1f1d35', border:'1px solid #2a2840', color:'#AFA9EC', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale:0.97 }}
                  onClick={applyPenalty} disabled={!!acting}
                  style={{
                    flex:1, padding:'12px',
                    background: acting ? '#2a2840' : 'linear-gradient(135deg, #fbbf24, #d97706)',
                    border:'none', color: acting ? '#534AB7' : '#3a1f00',
                    borderRadius:12, fontSize:14,
                    fontWeight:700, cursor: acting ? 'not-allowed' : 'pointer',
                  }}>
                  {acting ? '...' : 'Apply ⚠️'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
