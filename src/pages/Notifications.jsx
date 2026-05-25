import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

export default function Notifications() {
  const navigate    = useNavigate()
  const { profile } = useAuthStore()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState('all')
  const [clearing, setClearing]           = useState(false)

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription — new notifications appear instantly
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'notifications',
        filter: `user_id=eq.${profile?.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        toast(payload.new.title, { icon: notifIcon(payload.new.type) })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setNotifications(data || [])
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', profile?.id)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    toast.success('All marked as read')
  }

  const clearAll = async () => {
    setClearing(true)
    try {
      await supabase.from('notifications')
        .delete()
        .eq('user_id', profile?.id)
      setNotifications([])
      toast.success('All notifications cleared')
    } catch {
      toast.error('Failed to clear notifications')
    } finally {
      setClearing(false)
    }
  }

  const notifIcon = (type) => ({
    payment: '💰', warning: '⚠️',
    penalty: '🚨', success: '✅', info: 'ℹ️',
  }[type] || 'ℹ️')

  const notifColor = (type) => ({
    payment: { bg:'#052e16', border:'#166534',  text:'#22c55e'  },
    warning: { bg:'#1c1a0e', border:'#854d0e',  text:'#fbbf24'  },
    penalty: { bg:'#2d0a0a', border:'#7f1d1d',  text:'#ef4444'  },
    success: { bg:'#1e1b4b', border:'#4338ca',  text:'#818cf8'  },
    info:    { bg:'#1a1830', border:'#2a2840',  text:'#AFA9EC'  },
  }[type] || { bg:'#1a1830', border:'#2a2840', text:'#AFA9EC' })

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'payment') return n.type === 'payment'
    if (filter === 'warning') return n.type === 'warning' || n.type === 'penalty'
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

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
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:'#f1f0ff' }}>Notifications</div>
              <div style={{ fontSize:13, color:'#534AB7', marginTop:2 }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up 🎉'}
              </div>
            </div>
            {notifications.length > 0 && (
              <div style={{ display:'flex', gap:8 }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    style={{
                      background:'#1f1d35', border:'1px solid #2a2840',
                      borderRadius:8, padding:'6px 10px',
                      fontSize:11, color:'#7F77DD',
                      fontWeight:600, cursor:'pointer',
                    }}>Read all</button>
                )}
                <button onClick={clearAll} disabled={clearing}
                  style={{
                    background:'#1f1d35', border:'1px solid #2a2840',
                    borderRadius:8, padding:'6px 10px',
                    fontSize:11, color:'#ef4444',
                    fontWeight:600, cursor:'pointer',
                  }}>
                  {clearing ? '...' : 'Clear all'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'16px 20px 0' }}>

        {/* ── FILTER TABS */}
        <div style={{
          display:'flex', gap:0,
          background:'#1a1830', border:'1px solid #2a2840',
          borderRadius:12, overflow:'hidden', marginBottom:16,
        }}>
          {[
            { key:'all',     label:'All',      count:notifications.length },
            { key:'unread',  label:'Unread',   count:unreadCount, alert:unreadCount > 0 },
            { key:'payment', label:'Payments', count:notifications.filter(n=>n.type==='payment').length },
            { key:'warning', label:'Alerts',   count:notifications.filter(n=>n.type==='warning'||n.type==='penalty').length },
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
                justifyContent:'center', gap:3,
              }}
            >
              {f.label}
              {f.count > 0 && (
                <span style={{
                  background: filter === f.key ? 'rgba(255,255,255,0.2)' : f.alert ? '#ef444430' : '#2a2840',
                  color: filter === f.key ? '#fff' : f.alert ? '#ef4444' : '#534AB7',
                  borderRadius:8, padding:'1px 5px',
                  fontSize:9, fontWeight:800,
                }}>{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── NOTIFICATIONS LIST */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            style={{
              background:'#1a1830', border:'1px dashed #2a2840',
              borderRadius:20, padding:'48px 24px', textAlign:'center',
            }}
          >
            <div style={{ fontSize:48, marginBottom:16 }}>🔔</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#f1f0ff', marginBottom:8 }}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </div>
            <div style={{ fontSize:13, color:'#AFA9EC', lineHeight:1.6 }}>
              {filter === 'unread'
                ? 'You are all caught up! 🎉'
                : 'Notifications about payments, group updates and alerts will appear here.'}
            </div>
          </motion.div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <AnimatePresence>
              {filtered.map((notif, i) => {
                const colors = notifColor(notif.type)
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity:0, y:10 }}
                    animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0, x:-20 }}
                    transition={{ delay:i * 0.04 }}
                    onClick={() => !notif.is_read && markRead(notif.id)}
                    style={{
                      background: notif.is_read ? '#15132a' : colors.bg,
                      border:`1px solid ${notif.is_read ? '#2a2840' : colors.border}`,
                      borderRadius:16, padding:'14px 16px',
                      cursor: !notif.is_read ? 'pointer' : 'default',
                      transition:'all 0.2s',
                      position:'relative',
                    }}
                  >
                    {/* Unread dot */}
                    {!notif.is_read && (
                      <div style={{
                        position:'absolute', top:14, right:14,
                        width:8, height:8, borderRadius:'50%',
                        background:colors.text,
                      }} />
                    )}

                    <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                      {/* Icon */}
                      <div style={{
                        width:38, height:38, borderRadius:12,
                        background:`${colors.text}18`,
                        border:`1px solid ${colors.text}30`,
                        display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:18,
                        flexShrink:0,
                      }}>
                        {notifIcon(notif.type)}
                      </div>

                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{
                          fontSize:13, fontWeight:700,
                          color: notif.is_read ? '#AFA9EC' : '#f1f0ff',
                          marginBottom:4,
                        }}>
                          {notif.title}
                        </div>
                        <div style={{
                          fontSize:12,
                          color: notif.is_read ? '#3C3489' : '#AFA9EC',
                          lineHeight:1.6,
                          marginBottom:6,
                        }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize:10, color:'#3C3489' }}>
                          {dayjs(notif.created_at).fromNow()}
                        </div>
                      </div>
                    </div>

                    {/* Tap to mark read hint */}
                    {!notif.is_read && (
                      <div style={{
                        fontSize:10, color:colors.text,
                        marginTop:8, textAlign:'right',
                        opacity:0.7,
                      }}>Tap to mark as read</div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  )
}
