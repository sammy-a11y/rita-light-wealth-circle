import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import AOS from 'aos'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

// ── Avatar generator
function Avatar({ name, size = 38, fontSize = 14 }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '??'
  const colors = [
    ['#7F77DD','#534AB7'], ['#f59e0b','#d97706'],
    ['#10b981','#059669'], ['#ef4444','#dc2626'],
    ['#8b5cf6','#7c3aed'], ['#06b6d4','#0891b2'],
  ]
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0
  const [from, to] = colors[colorIndex]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${from}, ${to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>{initials}</div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const [groups, setGroups]               = useState([])
  const [notifications, setNotifications] = useState([])
  const [pendingRequest, setPendingRequest] = useState(null)
  const [loading, setLoading]             = useState(true)
  const [activeGroup, setActiveGroup]     = useState(null)
  const [scoreboard, setScoreboard]       = useState([])
  const [showScoreboard, setShowScoreboard] = useState(false)

  useEffect(() => {
    AOS.refresh()
    if (profile?.id) {
      fetchDashboard()
      fetchNotifications()
      fetchPendingRequest()
    }
  }, [profile])

  // ── Fetch user's groups + slots + scoreboard data
  const fetchDashboard = async () => {
    setLoading(true)
    try {
      // Get user's slots
      const { data: slots } = await supabase
        .from('slots')
        .select(`
          *,
          groups (
            id, name, amount_per_slot, payout_amount,
            frequency, status, max_slots, starts_at
          )
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (slots) {
        // Group slots by group
        const groupMap = {}
        slots.forEach(slot => {
          const gid = slot.group_id
          if (!groupMap[gid]) {
            groupMap[gid] = { ...slot.groups, mySlots: [] }
          }
          groupMap[gid].mySlots.push(slot)
        })
        setGroups(Object.values(groupMap))
      }
    } catch (err) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch scoreboard for a group
  const fetchScoreboard = async (groupId) => {
    try {
      const { data: slots } = await supabase
        .from('slots')
        .select(`
          slot_number, status, is_admin_slot,
          users ( id, full_name ),
          payments ( status, created_at )
        `)
        .eq('group_id', groupId)
        .order('slot_number', { ascending: true })

      if (slots) setScoreboard(slots)
    } catch {
      toast.error('Could not load scoreboard')
    }
  }

  const openScoreboard = async (group) => {
    setActiveGroup(group)
    await fetchScoreboard(group.id)
    setShowScoreboard(true)
  }

  // ── Fetch notifications
  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setNotifications(data)
  }

  // ── Fetch pending group request
const fetchPendingRequest = async () => {
  const { data } = await supabase
    .from('group_requests')
    .select('*, groups(name)')
    .eq('user_id', profile.id)
    .eq('status', 'pending')
    .limit(1)
  if (data && data.length > 0) setPendingRequest(data[0])
}

  // ── Mark notification as read
  const markRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const notifColor = (type) => ({
    payment: '#22c55e', warning: '#f59e0b',
    penalty: '#ef4444', success: '#7F77DD', info: '#AFA9EC',
  }[type] || '#AFA9EC')

  const notifIcon = (type) => ({
    payment: '💰', warning: '⚠️',
    penalty: '🚨', success: '✅', info: 'ℹ️',
  }[type] || 'ℹ️')

    const freqLabel = (f) => ({
    daily:   'day',
    weekly:  'week',
    monthly: 'month',
    }[f] || f)

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'#0f0e1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <motion.div
            animate={{ rotate:360 }}
            transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
            style={{ width:40, height:40, border:'3px solid #2a2840', borderTop:'3px solid #7F77DD', borderRadius:'50%', margin:'0 auto 16px' }}
          />
          <p style={{ color:'#AFA9EC', fontSize:13 }}>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0f0e1a', paddingBottom:90 }}>

      {/* ── HEADER */}
      <div style={{
        background:'linear-gradient(135deg, #1a1830, #1f1d35)',
        borderBottom:'1px solid #2a2840',
        padding:'20px 20px 24px',
        position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ maxWidth:480, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Avatar name={profile?.full_name} size={44} fontSize={16} />
              <div>
                <div style={{ fontSize:11, color:'#534AB7', fontWeight:600, letterSpacing:'0.05em' }}>WELCOME BACK</div>
                <div style={{ fontSize:17, fontWeight:800, color:'#f1f0ff' }}>
                  {profile?.full_name?.split(' ')[0]} 👋
                </div>
              </div>
            </div>

            {/* Notification bell */}
            <motion.button
              whileTap={{ scale:0.9 }}
              onClick={() => navigate('/notifications')}
              style={{
                background:'#1f1d35', border:'1px solid #2a2840',
                borderRadius:12, width:42, height:42,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', position:'relative',
              }}
            >
              <span style={{ fontSize:18 }}>🔔</span>
              {unreadCount > 0 && (
                <div style={{
                  position:'absolute', top:-4, right:-4,
                  background:'#ef4444', borderRadius:'50%',
                  width:18, height:18, fontSize:10,
                  fontWeight:700, color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>{unreadCount}</div>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 20px 0' }}>

        {/* ── PENDING REQUEST BANNER */}
        {pendingRequest && (
          <motion.div
            initial={{ opacity:0, y:-10 }}
            animate={{ opacity:1, y:0 }}
            data-aos="fade-down"
            style={{
              background:'linear-gradient(135deg, #1c1a0e, #2a2408)',
              border:'1px solid #fbbf2440',
              borderRadius:16, padding:'14px 16px',
              marginBottom:16,
              display:'flex', alignItems:'center', gap:12,
            }}
          >
            <span style={{ fontSize:24 }}>⏳</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fbbf24' }}>
                Request Pending
              </div>
              <div style={{ fontSize:12, color:'#AFA9EC', marginTop:2 }}>
                Your request to join <strong style={{ color:'#f1f0ff' }}>{pendingRequest.groups?.name}</strong> is being reviewed by admin.
              </div>
            </div>
          </motion.div>
        )}

        {/* ── QUICK ACTIONS */}
        <div data-aos="fade-up" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {[
            { icon:'👥', label:'Browse\nCircles',  action:() => navigate('/groups'),  color:'#7F77DD' },
            { icon:'💰', label:'Make\nPayment', action:() => navigate('/groups'), color:'#fbbf24' },
            { icon:'📋', label:'Transaction\nHistory', action:() => navigate('/history'), color:'#22c55e' },
          ].map(q => (
            <motion.button key={q.label}
              whileTap={{ scale:0.93 }}
              onClick={q.action}
              style={{
                background:'#1a1830', border:`1px solid ${q.color}30`,
                borderRadius:16, padding:'14px 8px',
                display:'flex', flexDirection:'column',
                alignItems:'center', gap:8,
                cursor:'pointer',
              }}
            >
              <div style={{
                width:40, height:40, borderRadius:12,
                background:`${q.color}18`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:20,
              }}>{q.icon}</div>
              <span style={{ fontSize:11, color:'#AFA9EC', fontWeight:600, whiteSpace:'pre-line', textAlign:'center', lineHeight:1.3 }}>
                {q.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* ── MY CIRCLES */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#f1f0ff' }}>My Circles</div>
            <button onClick={() => navigate('/groups')}
              style={{ background:'none', border:'none', color:'#7F77DD', fontSize:12, cursor:'pointer', fontWeight:600 }}>
              + Join new
            </button>
          </div>

          {groups.length === 0 ? (
            <motion.div
              data-aos="fade-up"
              style={{
                background:'#1a1830', border:'1px dashed #2a2840',
                borderRadius:20, padding:32, textAlign:'center',
              }}
            >
              <div style={{ fontSize:40, marginBottom:12 }}>⭕</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#f1f0ff', marginBottom:8 }}>No circles yet</div>
              <div style={{ fontSize:12, color:'#AFA9EC', marginBottom:20, lineHeight:1.6 }}>
                You haven't joined any saving circle yet. Browse available circles and request to join.
              </div>
              <motion.button whileTap={{ scale:0.97 }}
                onClick={() => navigate('/groups')}
                style={{
                  background:'linear-gradient(135deg, #fbbf24, #d97706)',
                  border:'none', color:'#3a1f00',
                  padding:'12px 24px', borderRadius:12,
                  fontSize:13, fontWeight:800, cursor:'pointer',
                }}>Browse Circles ✦</motion.button>
            </motion.div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {groups.map((group, i) => (
                <motion.div
                  key={group.id}
                  data-aos="fade-up"
                  data-aos-delay={i * 80}
                  style={{
                    background:'#1a1830',
                    border:'1px solid #2a2840',
                    borderRadius:20, overflow:'hidden',
                  }}
                >
                  {/* Group header */}
                  <div style={{
                    height:4,
                    background: group.status === 'active'
                      ? 'linear-gradient(90deg, #7F77DD, #fbbf24)'
                      : group.status === 'completed'
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : 'linear-gradient(90deg, #534AB7, #3C3489)',
                  }} />

                  <div style={{ padding:'16px 16px 0' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:15, fontWeight:800, color:'#f1f0ff' }}>{group.name}</div>
                        <div style={{ fontSize:11, color:'#534AB7', marginTop:2 }}>
                          ₦{group.amount_per_slot?.toLocaleString()} / {freqLabel(group.frequency)}
                        </div>
                      </div>
                      <span style={{
                        background: group.status === 'active' ? '#052e16' : group.status === 'completed' ? '#1a2e1a' : '#1f1d35',
                        border: `1px solid ${group.status === 'active' ? '#166534' : group.status === 'completed' ? '#22c55e40' : '#3C3489'}`,
                        color: group.status === 'active' ? '#22c55e' : group.status === 'completed' ? '#4ade80' : '#7F77DD',
                        borderRadius:20, padding:'3px 10px',
                        fontSize:10, fontWeight:700, textTransform:'uppercase',
                      }}>
                        {group.status}
                      </span>
                    </div>

                    {/* My slots */}
                    <div style={{ marginBottom:12 }}>
                      <div style={{ fontSize:11, color:'#534AB7', marginBottom:6, fontWeight:600 }}>MY SLOTS</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {group.mySlots?.map(slot => (
                          <div key={slot.id} style={{
                            background: slot.status === 'paid' ? '#052e16' : '#1f1d35',
                            border: `1px solid ${slot.status === 'paid' ? '#166534' : '#3C3489'}`,
                            borderRadius:8, padding:'4px 10px',
                            fontSize:12, fontWeight:700,
                            color: slot.status === 'paid' ? '#22c55e' : '#AFA9EC',
                          }}>
                            #{slot.slot_number}
                            {slot.status === 'paid' && ' ✓'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payout info */}
                    <div style={{
                      background:'#1f1d35', borderRadius:12,
                      padding:'10px 12px', marginBottom:14,
                      display:'flex', justifyContent:'space-between',
                    }}>
                      <div>
                        <div style={{ fontSize:10, color:'#534AB7', fontWeight:600 }}>YOUR PAYOUT</div>
                        <div style={{ fontSize:16, fontWeight:800, color:'#fbbf24' }}>
                          ₦{(group.payout_amount * (group.mySlots?.length || 1))?.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:10, color:'#534AB7', fontWeight:600 }}>NEXT DUE</div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#f1f0ff' }}>
                          {group.starts_at ? dayjs(group.starts_at).fromNow() : 'TBD'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pay button */}
                  <motion.button
                    whileTap={{ scale:0.98 }}
                    onClick={() => navigate(`/payment/${group.id}`)}
                    style={{
                      width:'100%', padding:'12px',
                      background:'linear-gradient(135deg, #fbbf24, #d97706)',
                      border:'none', borderTop:'1px solid #2a2840',
                      color:'#3a1f00', fontSize:13,
                      fontWeight:700, cursor:'pointer',
                      display:'flex', alignItems:'center',
                      justifyContent:'center', gap:8,
                    }}
                  >
                    💰 Make Payment
                  </motion.button>

                  {/* Scoreboard button */}
                  <motion.button
                    whileTap={{ scale:0.98 }}
                    onClick={() => openScoreboard(group)}
                    style={{
                      width:'100%', padding:'12px',
                      background:'#1f1d35',
                      border:'none',
                      borderTop:'1px solid #2a2840',
                      color:'#7F77DD', fontSize:13,
                      fontWeight:700, cursor:'pointer',
                      display:'flex', alignItems:'center',
                      justifyContent:'center', gap:8,
                    }}
                  >
                    🏆 View Circle Scoreboard
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── RECENT NOTIFICATIONS */}
        {notifications.length > 0 && (
          <div data-aos="fade-up" style={{ marginBottom:20 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#f1f0ff', marginBottom:12 }}>
              Recent Notifications
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {notifications.map(n => (
                <motion.div
                  key={n.id}
                  whileTap={{ scale:0.98 }}
                  onClick={() => markRead(n.id)}
                  style={{
                    background: n.is_read ? '#1a1830' : '#1f1d35',
                    border:`1px solid ${n.is_read ? '#2a2840' : notifColor(n.type)+'30'}`,
                    borderRadius:14, padding:'12px 14px',
                    display:'flex', gap:12, alignItems:'flex-start',
                    cursor:'pointer',
                  }}
                >
                  <div style={{
                    width:34, height:34, borderRadius:10,
                    background:`${notifColor(n.type)}18`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, flexShrink:0,
                  }}>{notifIcon(n.type)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'#f1f0ff', marginBottom:2 }}>{n.title}</div>
                    <div style={{ fontSize:12, color:'#AFA9EC', lineHeight:1.5 }}>{n.message}</div>
                    <div style={{ fontSize:10, color:'#3C3489', marginTop:4 }}>
                      {dayjs(n.created_at).fromNow()}
                    </div>
                  </div>
                  {!n.is_read && (
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#7F77DD', flexShrink:0, marginTop:4 }} />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════
          SCOREBOARD MODAL
      ══════════════════════════ */}
      <AnimatePresence>
        {showScoreboard && activeGroup && (
          <motion.div
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            exit={{ opacity:0 }}
            style={{
              position:'fixed', inset:0,
              background:'rgba(0,0,0,0.85)',
              zIndex:200,
              display:'flex', alignItems:'flex-end',
              justifyContent:'center',
            }}
            onClick={() => setShowScoreboard(false)}
          >
            <motion.div
              initial={{ y:'100%' }}
              animate={{ y:0 }}
              exit={{ y:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:30 }}
              onClick={e => e.stopPropagation()}
              style={{
                background:'#1a1830',
                borderTop:'1px solid #2a2840',
                borderRadius:'24px 24px 0 0',
                width:'100%', maxWidth:480,
                maxHeight:'85vh',
                overflow:'hidden',
                display:'flex', flexDirection:'column',
              }}
            >
              {/* Modal header */}
              <div style={{
                padding:'16px 20px 12px',
                borderBottom:'1px solid #2a2840',
                flexShrink:0,
              }}>
                <div style={{ width:40, height:4, borderRadius:2, background:'#2a2840', margin:'0 auto 14px' }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:16, fontWeight:800, color:'#f1f0ff' }}>
                      🏆 Circle Scoreboard
                    </div>
                    <div style={{ fontSize:12, color:'#534AB7', marginTop:2 }}>
                      {activeGroup.name} — {activeGroup.frequency}
                    </div>
                  </div>
                  <button onClick={() => setShowScoreboard(false)}
                    style={{ background:'#2a2840', border:'none', color:'#AFA9EC', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:14 }}>✕</button>
                </div>

                {/* Legend */}
                <div style={{ display:'flex', gap:16, marginTop:12 }}>
                  {[
                    { icon:'✅', label:'Paid', color:'#22c55e' },
                    { icon:'❌', label:'Not paid', color:'#ef4444' },
                    { icon:'🎯', label:'Currently packing', color:'#fbbf24' },
                    { icon:'👑', label:'Admin slot', color:'#7F77DD' },
                  ].map(l => (
                    <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <span style={{ fontSize:12 }}>{l.icon}</span>
                      <span style={{ fontSize:10, color:l.color, fontWeight:600 }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoreboard list */}
              <div style={{ overflowY:'auto', padding:'12px 20px 24px', flex:1 }}>
                {scoreboard.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px 0', color:'#534AB7', fontSize:13 }}>
                    No members yet
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {scoreboard.map((slot, i) => {
                      const isPacking = slot.status === 'packing'
                      const isPaid    = slot.payments?.some(p => p.status === 'approved')
                      const isAdmin   = slot.is_admin_slot
                      const isMe      = slot.users?.id === profile?.id

                      return (
                        <motion.div
                          key={slot.slot_number}
                          initial={{ opacity:0, y:10 }}
                          animate={{ opacity:1, y:0 }}
                          transition={{ delay:i * 0.04 }}
                          style={{
                            background: isPacking
                              ? 'linear-gradient(135deg, #1c1a0e, #2a2408)'
                              : isMe ? '#1f1d35' : '#15132a',
                            border: isPacking
                              ? '1px solid #fbbf2460'
                              : isMe ? '1px solid #7F77DD50' : '1px solid #2a2840',
                            borderRadius:14, padding:'12px 14px',
                            display:'flex', alignItems:'center', gap:12,
                          }}
                        >
                          {/* Slot number */}
                          <div style={{
                            width:32, height:32, borderRadius:10,
                            background: isAdmin
                              ? 'linear-gradient(135deg, #7F77DD, #534AB7)'
                              : isPacking
                              ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                              : '#1f1d35',
                            border: (!isAdmin && !isPacking) ? '1px solid #2a2840' : 'none',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:12, fontWeight:800,
                            color: isAdmin || isPacking ? '#fff' : '#534AB7',
                            flexShrink:0,
                          }}>#{slot.slot_number}</div>

                          {/* Avatar */}
                          <Avatar
                            name={isAdmin ? 'Admin' : slot.users?.full_name || '?'}
                            size={36}
                            fontSize={12}
                          />

                          {/* Name */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{
                                fontSize:13, fontWeight:700,
                                color: isPacking ? '#fbbf24' : '#f1f0ff',
                                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                              }}>
                                {isAdmin
                                  ? 'Admin (Rita)'
                                  : slot.users?.full_name || 'Available'}
                              </div>
                              {isMe && (
                                <span style={{
                                  background:'#7F77DD20', border:'1px solid #7F77DD40',
                                  borderRadius:6, padding:'1px 6px',
                                  fontSize:9, color:'#7F77DD', fontWeight:700,
                                }}>YOU</span>
                              )}
                              {isPacking && (
                                <span style={{
                                  background:'#fbbf2420', border:'1px solid #fbbf2440',
                                  borderRadius:6, padding:'1px 6px',
                                  fontSize:9, color:'#fbbf24', fontWeight:700,
                                }}>PACKING</span>
                              )}
                            </div>
                            {isPacking && (
                              <div style={{ fontSize:10, color:'#fbbf24', marginTop:1 }}>
                                🎯 Collecting ₦{activeGroup.payout_amount?.toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* Payment status */}
                          <div style={{ flexShrink:0, textAlign:'center' }}>
                            {isAdmin ? (
                              <span style={{ fontSize:18 }}>👑</span>
                            ) : isPacking ? (
                              <span style={{ fontSize:18 }}>🎯</span>
                            ) : isPaid ? (
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                                <span style={{ fontSize:20 }}>✅</span>
                                <span style={{ fontSize:9, color:'#22c55e', fontWeight:600 }}>PAID</span>
                              </div>
                            ) : (
                              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                                <span style={{ fontSize:20 }}>❌</span>
                                <span style={{ fontSize:9, color:'#ef4444', fontWeight:600 }}>UNPAID</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                {/* Summary */}
                {scoreboard.length > 0 && (
                  <div style={{
                    background:'#1f1d35', border:'1px solid #2a2840',
                    borderRadius:14, padding:'14px 16px', marginTop:16,
                    display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, textAlign:'center',
                  }}>
                    {[
                      {
                        label:'Paid',
                        value: scoreboard.filter(s => s.payments?.some(p => p.status==='approved')).length,
                        color:'#22c55e',
                      },
                      {
                        label:'Not Paid',
                        value: scoreboard.filter(s => !s.is_admin_slot && !s.payments?.some(p => p.status==='approved')).length,
                        color:'#ef4444',
                      },
                      {
                        label:'Total Slots',
                        value: scoreboard.length,
                        color:'#7F77DD',
                      },
                    ].map(stat => (
                      <div key={stat.label}>
                        <div style={{ fontSize:20, fontWeight:800, color:stat.color }}>{stat.value}</div>
                        <div style={{ fontSize:10, color:'#534AB7', marginTop:2 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
