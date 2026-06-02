import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

function Avatar({ name, size = 36, fontSize = 13 }) {
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

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { profile, logout } = useAuthStore()

  const [stats, setStats] = useState({
    totalMembers: 0, totalGroups: 0,
    pendingRequests: 0, pendingPayments: 0,
    totalCollected: 0, blacklisted: 0,
  })
  const [recentRequests, setRecentRequests] = useState([])
  const [recentPayments, setRecentPayments] = useState([])
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [notifForm, setNotifForm] = useState({ title:'', message:'', type:'info' })
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      // ── Counts
      const [
        { count: members },
        { count: groups },
        { count: pendingPays },
        { count: blacklisted },
        { data: approvedPayments },
      ] = await Promise.all([
        supabase.from('users').select('*', { count:'exact', head:true }).eq('is_blacklisted', false).eq('is_admin', false),
        supabase.from('groups').select('*', { count:'exact', head:true }),
        supabase.from('payments').select('*', { count:'exact', head:true }).eq('status','pending'),
        supabase.from('users').select('*', { count:'exact', head:true }).eq('is_blacklisted', true),
        supabase.from('payments').select('amount').eq('status','approved'),
      ])

      const totalCollected = approvedPayments?.reduce((s, p) => s + (p.amount || 0), 0) || 0

      // ── Fetch requests separately (avoid join issues)
      const { data: rawRequests } = await supabase
        .from('group_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10)

      // Enrich each request with user and group data
      const enriched = await Promise.all(
        (rawRequests || []).map(async (req) => {
          const { data: user }  = await supabase.from('users').select('*').eq('id', req.user_id).single()
          const { data: group } = await supabase.from('groups').select('*').eq('id', req.group_id).single()
          return { ...req, users: user, groups: group }
        })
      )

      // Filter out admin's own requests
      const finalRequests = enriched.filter(r => !r.users?.is_admin)

      // ── Fetch recent payments
      const { data: rawPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

      const enrichedPayments = await Promise.all(
        (rawPayments || []).map(async (pay) => {
          const { data: user }  = await supabase.from('users').select('full_name, phone').eq('id', pay.user_id).single()
          const { data: group } = await supabase.from('groups').select('name').eq('id', pay.group_id).single()
          const { data: slot }  = await supabase.from('slots').select('slot_number').eq('id', pay.slot_id).single()
          return { ...pay, users: user, groups: group, slots: slot }
        })
      )

      setStats({
        totalMembers:    members    || 0,
        totalGroups:     groups     || 0,
        pendingRequests: finalRequests.length,
        pendingPayments: pendingPays || 0,
        totalCollected,
        blacklisted:     blacklisted || 0,
      })
      setRecentRequests(finalRequests.slice(0, 5))
      setRecentPayments(enrichedPayments)

    } catch (err) {
      console.error('Dashboard error:', err)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // ── Approve / Decline join request
  const handleRequest = async (reqId, userId, groupId, slotsWanted, action) => {
    setActing(reqId)
    try {
      await supabase.from('group_requests')
        .update({
          status:      action,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reqId)

      if (action === 'approved') {
        await supabase.from('notifications').insert({
          user_id:  userId,
          group_id: groupId,
          title:    '🎉 Request Approved!',
          message:  `Your request to join has been approved! You can now pick your slot number${slotsWanted > 1 ? 's' : ''}.`,
          type:     'success',
        })
        toast.success('Request approved! User notified ✅')
      } else {
        await supabase.from('notifications').insert({
          user_id:  userId,
          group_id: groupId,
          title:    'Request Declined',
          message:  'Your request to join this circle has been declined. Contact admin on WhatsApp for more information.',
          type:     'warning',
        })
        toast.success('Request declined. User notified.')
      }
      fetchAll()
    } catch (err) {
      toast.error(err.message || 'Action failed')
    } finally {
      setActing(null)
    }
  }

  // ── Approve / Reject payment
  const handlePayment = async (payId, userId, groupId, action) => {
    setActing(payId)
    try {
      await supabase.from('payments')
        .update({
          status:      action,
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', payId)

      if (action === 'approved') {
        await supabase.from('notifications').insert({
          user_id:  userId,
          group_id: groupId,
          title:    '💰 Payment Approved!',
          message:  'Your payment has been verified and approved by admin. Thank you!',
          type:     'payment',
        })
        toast.success('Payment approved ✅')
      } else {
        await supabase.from('notifications').insert({
          user_id:  userId,
          group_id: groupId,
          title:    '❌ Payment Rejected',
          message:  'Your payment could not be verified. Please contact admin on WhatsApp.',
          type:     'warning',
        })
        toast.success('Payment rejected. User notified.')
      }
      fetchAll()
    } catch (err) {
      toast.error(err.message || 'Action failed')
    } finally {
      setActing(null)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

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
            <div style={{ fontSize:11, color:'#fbbf24', fontWeight:700, letterSpacing:'0.1em' }}>ADMIN PANEL</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff' }}>Rita Light Wealth Circle™</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <motion.button whileTap={{ scale:0.96 }}
              onClick={() => navigate('/admin/groups')}
              style={{
                background:'linear-gradient(135deg, #fbbf24, #d97706)',
                border:'none', color:'#3a1f00',
                padding:'8px 16px', borderRadius:10,
                fontSize:12, fontWeight:700, cursor:'pointer',
              }}>+ New Group</motion.button>
            <button onClick={handleLogout}
              style={{
                background:'#1f1d35', border:'1px solid #2a2840',
                color:'#AFA9EC', padding:'8px 14px',
                borderRadius:10, fontSize:12,
                fontWeight:600, cursor:'pointer',
              }}>Logout</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'20px 20px 0' }}>

        {/* ── STATS GRID */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {[
            { label:'Members',     value:stats.totalMembers,    icon:'👥', color:'#7F77DD', action:() => navigate('/admin/members') },
            { label:'Groups',      value:stats.totalGroups,     icon:'⭕', color:'#fbbf24', action:() => navigate('/admin/groups') },
            { label:'Collected',   value:`₦${(stats.totalCollected/1000).toFixed(0)}k`, icon:'💰', color:'#22c55e', action:null },
            { label:'Requests',    value:stats.pendingRequests, icon:'📋', color:'#f59e0b', action:() => navigate('/admin/members'), alert:stats.pendingRequests > 0 },
            { label:'Payments',    value:stats.pendingPayments, icon:'⏳', color:'#ef4444', action:() => navigate('/admin/payments'), alert:stats.pendingPayments > 0 },
            { label:'Blacklisted', value:stats.blacklisted,     icon:'🚫', color:'#6b7280', action:() => navigate('/admin/members') },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
              onClick={s.action || undefined}
              style={{
                background:'#1a1830', border:`1px solid ${s.alert ? s.color+'60' : '#2a2840'}`,
                borderRadius:16, padding:'14px 12px',
                cursor:s.action ? 'pointer' : 'default',
                position:'relative', textAlign:'center',
              }}
            >
              {s.alert && (
                <motion.div
                  animate={{ scale:[1,1.2,1] }} transition={{ duration:1.5, repeat:Infinity }}
                  style={{ position:'absolute', top:8, right:8, width:8, height:8, borderRadius:'50%', background:s.color }}
                />
              )}
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:'#534AB7', marginTop:2, fontWeight:600 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── QUICK ACTIONS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
          {[
            { icon:'➕', label:'Create\nGroup',   action:() => navigate('/admin/groups')   },
            { icon:'👥', label:'Members',         action:() => navigate('/admin/members')  },
            { icon:'💳', label:'Payments',        action:() => navigate('/admin/payments') },
            { icon:'📋', label:'Requests',        action:() => navigate('/admin/members')  },
            { icon:'🔔', label:'Send\nReminder', action:() => setShowNotifModal(true) },
          ].map(q => (
            <motion.button key={q.label} whileTap={{ scale:0.93 }}
              onClick={q.action}
              style={{
                background:'#1a1830', border:'1px solid #2a2840',
                borderRadius:14, padding:'12px 6px',
                display:'flex', flexDirection:'column',
                alignItems:'center', gap:6, cursor:'pointer',
              }}
            >
              <div style={{
                width:36, height:36, borderRadius:10,
                background:'#1f1d35', border:'1px solid #2a2840',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
              }}>{q.icon}</div>
              <span style={{ fontSize:10, color:'#AFA9EC', fontWeight:600, whiteSpace:'pre-line', textAlign:'center', lineHeight:1.3 }}>
                {q.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* ── PENDING JOIN REQUESTS */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#f1f0ff' }}>
              Pending Join Requests
              {stats.pendingRequests > 0 && (
                <span style={{
                  background:'#f59e0b20', border:'1px solid #f59e0b40',
                  color:'#f59e0b', borderRadius:20,
                  padding:'2px 8px', fontSize:10, fontWeight:700, marginLeft:8,
                }}>{stats.pendingRequests}</span>
              )}
            </div>
            <button onClick={() => navigate('/admin/members')}
              style={{ background:'none', border:'none', color:'#7F77DD', fontSize:12, cursor:'pointer', fontWeight:600 }}>
              View all →
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <div style={{
              background:'#1a1830', border:'1px dashed #2a2840',
              borderRadius:16, padding:'24px', textAlign:'center',
              fontSize:13, color:'#534AB7',
            }}>No pending requests 🎉</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {recentRequests.map((req, i) => (
                <motion.div key={req.id}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                  style={{
                    background:'#1a1830', border:'1px solid #f59e0b30',
                    borderRadius:16, padding:'14px 16px',
                  }}
                >
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
                    <Avatar name={req.users?.full_name} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#f1f0ff' }}>
                        {req.users?.full_name || 'Unknown'}
                      </div>
                      <div style={{ fontSize:11, color:'#534AB7', marginTop:1 }}>
                        📱 {req.users?.phone} · {req.users?.state}
                      </div>
                      <div style={{ fontSize:11, color:'#AFA9EC', marginTop:2 }}>
                        Wants <strong style={{ color:'#fbbf24' }}>{req.slots_wanted} slot{req.slots_wanted > 1 ? 's' : ''}</strong> in <strong style={{ color:'#7F77DD' }}>{req.groups?.name}</strong>
                      </div>
                      <div style={{ fontSize:11, color:'#534AB7', marginTop:1 }}>
                        💼 {req.users?.occupation}
                      </div>
                    </div>
                    <div style={{ fontSize:10, color:'#3C3489', flexShrink:0 }}>
                      {dayjs(req.created_at).fromNow()}
                    </div>
                  </div>

                  {/* NIN + Video */}
                  <div style={{
                    background:'#1f1d35', borderRadius:10,
                    padding:'8px 12px', marginBottom:10,
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                  }}>
                    <div>
                      <div style={{ fontSize:10, color:'#534AB7', fontWeight:600 }}>NIN</div>
                      <div style={{ fontSize:13, color:'#f1f0ff', fontWeight:700, letterSpacing:'0.05em' }}>
                        {req.users?.nin || 'Not provided'}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <a href="https://verify.nimc.gov.ng" target="_blank" rel="noopener noreferrer"
                        style={{
                          background:'#1f1d35', border:'1px solid #3C3489',
                          borderRadius:8, padding:'5px 10px',
                          fontSize:10, color:'#7F77DD',
                          fontWeight:600, cursor:'pointer', textDecoration:'none',
                        }}>🔍 Check NIN</a>
                      {req.users?.face_video_url && (
                        <a href={req.users.face_video_url} target="_blank" rel="noopener noreferrer"
                          style={{
                            background:'#7F77DD20', border:'1px solid #7F77DD40',
                            borderRadius:8, padding:'5px 10px',
                            fontSize:10, color:'#7F77DD',
                            fontWeight:600, textDecoration:'none',
                          }}>▶ Video</a>
                      )}
                    </div>
                  </div>

                  {/* Approve / Decline */}
                  <div style={{ display:'flex', gap:8 }}>
                    <motion.button whileTap={{ scale:0.96 }}
                      onClick={() => handleRequest(req.id, req.user_id, req.group_id, req.slots_wanted, 'declined')}
                      disabled={acting === req.id}
                      style={{
                        flex:1, padding:'10px',
                        background:'#2d0a0a', border:'1px solid #7f1d1d',
                        color:'#ef4444', borderRadius:10,
                        fontSize:13, fontWeight:700, cursor:'pointer',
                      }}>❌ Decline</motion.button>
                    <motion.button whileTap={{ scale:0.96 }}
                      onClick={() => handleRequest(req.id, req.user_id, req.group_id, req.slots_wanted, 'approved')}
                      disabled={acting === req.id}
                      style={{
                        flex:2, padding:'10px',
                        background: acting === req.id ? '#2a2840' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                        border:'none', color:'#fff',
                        borderRadius:10, fontSize:13,
                        fontWeight:700, cursor: acting === req.id ? 'not-allowed' : 'pointer',
                      }}>
                      {acting === req.id ? 'Processing...' : '✅ Approve'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── PENDING PAYMENTS */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#f1f0ff' }}>
              Pending Payments
              {stats.pendingPayments > 0 && (
                <span style={{
                  background:'#ef444420', border:'1px solid #ef444440',
                  color:'#ef4444', borderRadius:20,
                  padding:'2px 8px', fontSize:10, fontWeight:700, marginLeft:8,
                }}>{stats.pendingPayments}</span>
              )}
            </div>
            <button onClick={() => navigate('/admin/payments')}
              style={{ background:'none', border:'none', color:'#7F77DD', fontSize:12, cursor:'pointer', fontWeight:600 }}>
              View all →
            </button>
          </div>

          {recentPayments.length === 0 ? (
            <div style={{
              background:'#1a1830', border:'1px dashed #2a2840',
              borderRadius:16, padding:'24px', textAlign:'center',
              fontSize:13, color:'#534AB7',
            }}>No pending payments 🎉</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {recentPayments.map((pay, i) => (
                <motion.div key={pay.id}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                  style={{
                    background:'#1a1830', border:'1px solid #ef444430',
                    borderRadius:16, padding:'14px 16px',
                  }}
                >
                  <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:10 }}>
                    <Avatar name={pay.users?.full_name} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#f1f0ff' }}>
                        {pay.users?.full_name}
                      </div>
                      <div style={{ fontSize:11, color:'#534AB7', marginTop:1 }}>
                        {pay.groups?.name} · Slot #{pay.slots?.slot_number}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:16, fontWeight:800, color:'#fbbf24' }}>
                        ₦{pay.amount?.toLocaleString()}
                      </div>
                      <div style={{ fontSize:10, color:'#534AB7' }}>
                        {dayjs(pay.payment_date).format('DD MMM')}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background:'#1f1d35', borderRadius:10,
                    padding:'8px 12px', marginBottom:10,
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                  }}>
                    <div>
                      <div style={{ fontSize:10, color:'#534AB7' }}>Sender · Ref</div>
                      <div style={{ fontSize:12, color:'#AFA9EC', marginTop:1 }}>
                        {pay.sender_name} · {pay.transaction_ref}
                      </div>
                    </div>
                    {pay.receipt_url && (
                      <a href={pay.receipt_url} target="_blank" rel="noopener noreferrer"
                        style={{
                          background:'#7F77DD20', border:'1px solid #7F77DD40',
                          borderRadius:8, padding:'5px 10px',
                          fontSize:10, color:'#7F77DD',
                          fontWeight:600, textDecoration:'none',
                        }}>📎 Receipt</a>
                    )}
                  </div>

                  <div style={{ display:'flex', gap:8 }}>
                    <motion.button whileTap={{ scale:0.96 }}
                      onClick={() => handlePayment(pay.id, pay.user_id, pay.group_id, 'rejected')}
                      disabled={acting === pay.id}
                      style={{
                        flex:1, padding:'10px',
                        background:'#2d0a0a', border:'1px solid #7f1d1d',
                        color:'#ef4444', borderRadius:10,
                        fontSize:13, fontWeight:700, cursor:'pointer',
                      }}>❌ Reject</motion.button>
                    <motion.button whileTap={{ scale:0.96 }}
                      onClick={() => handlePayment(pay.id, pay.user_id, pay.group_id, 'approved')}
                      disabled={acting === pay.id}
                      style={{
                        flex:2, padding:'10px',
                        background: acting === pay.id ? '#2a2840' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                        border:'none', color:'#fff',
                        borderRadius:10, fontSize:13,
                        fontWeight:700, cursor: acting === pay.id ? 'not-allowed' : 'pointer',
                      }}>
                      {acting === pay.id ? 'Processing...' : '✅ Approve'}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
