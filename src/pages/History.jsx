import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

export default function History() {
  const navigate    = useNavigate()
  const { profile } = useAuthStore()

  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          groups ( name, frequency ),
          slots  ( slot_number )
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setPayments(data || [])
    } catch {
      toast.error('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const filtered = payments.filter(p => {
    if (filter === 'approved') return p.status === 'approved'
    if (filter === 'pending')  return p.status === 'pending'
    if (filter === 'rejected') return p.status === 'rejected'
    return true
  })

  const totalPaid = payments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalPenalty = payments
    .reduce((sum, p) => sum + (p.penalty_fee || 0), 0)

  const statusStyle = (status) => ({
    approved: { bg:'#052e16', border:'#166534', text:'#22c55e', icon:'✅' },
    pending:  { bg:'#1c1a0e', border:'#854d0e', text:'#fbbf24', icon:'⏳' },
    rejected: { bg:'#2d0a0a', border:'#7f1d1d', text:'#ef4444', icon:'❌' },
  }[status] || { bg:'#1f1d35', border:'#2a2840', text:'#AFA9EC', icon:'❓' })

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0f0e1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
          style={{ width:40, height:40, border:'3px solid #2a2840', borderTop:'3px solid #7F77DD', borderRadius:'50%' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0f0e1a', paddingBottom:90 }}>

      {/* ── HEADER */}
      <div style={{
        background:'linear-gradient(135deg, #1a1830, #1f1d35)',
        borderBottom:'1px solid #2a2840',
        padding:'20px 20px 16px',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ maxWidth:480, margin:'0 auto' }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#f1f0ff' }}>Transaction History</div>
          <div style={{ fontSize:13, color:'#534AB7', marginTop:2 }}>All your payments across circles</div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 20px 0' }}>

        {/* ── SUMMARY CARDS */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
          {[
            { label:'Total Paid',    value:`₦${totalPaid.toLocaleString()}`,    color:'#22c55e', icon:'✅' },
            { label:'Pending',       value:`₦${totalPending.toLocaleString()}`, color:'#fbbf24', icon:'⏳' },
            { label:'Total Penalty', value:`₦${totalPenalty.toLocaleString()}`, color:'#ef4444', icon:'⚠️' },
          ].map(s => (
            <motion.div key={s.label}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              style={{
                background:'#1a1830', border:'1px solid #2a2840',
                borderRadius:14, padding:'12px 10px', textAlign:'center',
              }}
            >
              <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:14, fontWeight:800, color:s.color }}>
                {s.value}
              </div>
              <div style={{ fontSize:10, color:'#534AB7', marginTop:2 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── FILTER TABS */}
        <div style={{
          display:'flex', gap:6,
          background:'#1a1830', border:'1px solid #2a2840',
          borderRadius:12, padding:4, marginBottom:20,
        }}>
          {[
            { key:'all',      label:'All'      },
            { key:'approved', label:'Approved' },
            { key:'pending',  label:'Pending'  },
            { key:'rejected', label:'Rejected' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                flex:1, padding:'8px 4px',
                borderRadius:8, border:'none',
                background: filter === f.key
                  ? 'linear-gradient(135deg, #7F77DD, #534AB7)'
                  : 'transparent',
                color: filter === f.key ? '#fff' : '#534AB7',
                fontSize:11, fontWeight:600,
                cursor:'pointer', transition:'all 0.2s',
              }}
            >{f.label}</button>
          ))}
        </div>

        {/* ── PAYMENTS LIST */}
        {filtered.length === 0 ? (
          <div style={{
            background:'#1a1830', border:'1px dashed #2a2840',
            borderRadius:20, padding:'48px 24px', textAlign:'center',
          }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#f1f0ff', marginBottom:8 }}>
              No transactions yet
            </div>
            <div style={{ fontSize:13, color:'#AFA9EC', marginBottom:20, lineHeight:1.6 }}>
              Your payment history will appear here once you start making contributions.
            </div>
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => navigate('/groups')}
              style={{
                background:'linear-gradient(135deg, #fbbf24, #d97706)',
                border:'none', color:'#3a1f00',
                padding:'12px 24px', borderRadius:12,
                fontSize:13, fontWeight:800, cursor:'pointer',
              }}>Join a Circle ✦</motion.button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map((pay, i) => {
              const s = statusStyle(pay.status)
              return (
                <motion.div key={pay.id}
                  initial={{ opacity:0, y:10 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ delay:i * 0.05 }}
                  style={{
                    background:s.bg, border:`1px solid ${s.border}`,
                    borderRadius:16, padding:'14px 16px',
                  }}
                >
                  {/* Top row */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, color:'#f1f0ff' }}>
                        ₦{pay.amount?.toLocaleString()}
                      </div>
                      <div style={{ fontSize:11, color:'#534AB7', marginTop:2 }}>
                        {pay.groups?.name} · Slot #{pay.slots?.slot_number}
                      </div>
                    </div>
                    <span style={{
                      background:`${s.text}20`, border:`1px solid ${s.text}40`,
                      color:s.text, borderRadius:20,
                      padding:'3px 10px', fontSize:10,
                      fontWeight:700, textTransform:'uppercase',
                      display:'flex', alignItems:'center', gap:4,
                    }}>
                      {s.icon} {pay.status}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
                    {[
                      { label:'Date',      value:dayjs(pay.payment_date).format('DD MMM YYYY') },
                      { label:'Sender',    value:pay.sender_name },
                      { label:'Reference', value:pay.transaction_ref },
                      { label:'Frequency', value:pay.groups?.frequency === 'weekly' ? 'Weekly' : 'Monthly' },
                    ].map(d => (
                      <div key={d.label} style={{ background:'#ffffff08', borderRadius:8, padding:'6px 8px' }}>
                        <div style={{ fontSize:9, color:'#534AB7', fontWeight:600, marginBottom:2 }}>{d.label}</div>
                        <div style={{ fontSize:11, color:'#AFA9EC', fontWeight:500 }}>{d.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Penalty fee */}
                  {pay.penalty_fee > 0 && (
                    <div style={{
                      background:'#2d0a0a', border:'1px solid #7f1d1d',
                      borderRadius:8, padding:'6px 10px',
                      fontSize:11, color:'#ef4444', marginBottom:8,
                    }}>
                      ⚠️ Penalty fee applied: ₦{pay.penalty_fee?.toLocaleString()}
                    </div>
                  )}

                  {/* Receipt link */}
                  {pay.receipt_url && (
                    <a href={pay.receipt_url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        fontSize:11, color:'#7F77DD',
                        textDecoration:'none', fontWeight:600,
                      }}
                    >📎 View receipt →</a>
                  )}

                  {/* Status message */}
                  {pay.status === 'pending' && (
                    <div style={{ fontSize:11, color:'#854d0e', marginTop:6 }}>
                      ⏳ Awaiting admin verification...
                    </div>
                  )}
                  {pay.status === 'rejected' && (
                    <div style={{ fontSize:11, color:'#ef4444', marginTop:6 }}>
                      ❌ Payment rejected. Contact admin on WhatsApp for help.
                    </div>
                  )}
                  {pay.status === 'approved' && pay.approved_at && (
                    <div style={{ fontSize:11, color:'#22c55e', marginTop:6 }}>
                      ✅ Approved on {dayjs(pay.approved_at).format('DD MMM YYYY')}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
