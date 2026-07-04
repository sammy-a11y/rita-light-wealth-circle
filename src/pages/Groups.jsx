import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import AOS from 'aos'

// ── Helper: frequency label
const freqLabel = (f) => ({ daily:'Daily', weekly:'Weekly', monthly:'Monthly' }[f] || f)
const freqShort = (f) => ({ daily:'day',   weekly:'week',  monthly:'month'   }[f] || f)

export default function Groups() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const [groups, setGroups]               = useState([])
  const [myRequests, setMyRequests]       = useState([])
  const [mySlots, setMySlots]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [requesting, setRequesting]       = useState(null)
  const [filter, setFilter]               = useState('all')
  const [showModal, setShowModal]         = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [slotsWanted, setSlotsWanted]     = useState(1)

  useEffect(() => {
    AOS.refresh()
    fetchGroups()
    fetchMyRequests()
    fetchMySlots()
  }, [])

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*, slots(id, slot_number, user_id, is_admin_slot)')
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
      if (error) throw error
      setGroups(data || [])
    } catch {
      toast.error('Failed to load circles')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyRequests = async () => {
    const { data } = await supabase
      .from('group_requests').select('*').eq('user_id', profile?.id)
    if (data) setMyRequests(data)
  }

  const fetchMySlots = async () => {
    const { data } = await supabase
      .from('slots').select('group_id').eq('user_id', profile?.id)
    if (data) setMySlots(data.map(s => s.group_id))
  }

  const getFilledCount    = (slots) => slots?.filter(s => s.user_id !== null).length || 0
  const getAvailableCount = (group) => group.max_slots - (group.slots?.filter(s => s.user_id !== null).length || 0)
  const getRequestStatus  = (groupId) => myRequests.find(r => r.group_id === groupId)?.status || null
  const isMember          = (groupId) => mySlots.includes(groupId)

  const openJoinModal = (group) => {
    if (!profile) { toast.error('Please login first'); return }
    setSelectedGroup(group)
    setSlotsWanted(1)
    setShowModal(true)
  }

  const sendRequest = async () => {
    if (!selectedGroup) return
    setRequesting(selectedGroup.id)
    try {
      const { error } = await supabase.from('group_requests').insert({
        user_id:      profile.id,
        group_id:     selectedGroup.id,
        slots_wanted: slotsWanted,
        status:       'pending',
      })
      if (error) {
        if (error.code === '23505') toast.error('You already sent a request for this circle')
        else throw error
        return
      }
      await supabase.from('notifications').insert({
        user_id:  profile.id,
        group_id: selectedGroup.id,
        title:    'Join Request Sent',
        message:  `Your request to join ${selectedGroup.name} has been sent. Admin will review and notify you.`,
        type:     'info',
      })
      toast.success('Request sent! Rita will review and notify you 🎉')
      setShowModal(false)
      fetchMyRequests()
    } catch (err) {
      toast.error(err.message || 'Failed to send request')
    } finally {
      setRequesting(null)
    }
  }

  const filteredGroups = groups.filter(g => {
    if (filter === 'daily')   return g.frequency === 'daily'
    if (filter === 'weekly')  return g.frequency === 'weekly'
    if (filter === 'monthly') return g.frequency === 'monthly'
    if (filter === 'open')    return g.status === 'open' || g.status === 'filling'
    return true
  })

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
          <div style={{ fontSize:20, fontWeight:800, color:'#f1f0ff', marginBottom:4 }}>Saving Circles</div>
          <div style={{ fontSize:13, color:'#534AB7' }}>Browse and request to join a circle</div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'16px 20px 0' }}>

        {/* ── FILTER TABS */}
        <div data-aos="fade-down" style={{
          display:'flex', gap:8, background:'#1a1830',
          border:'1px solid #2a2840', borderRadius:14, padding:4, marginBottom:20,
        }}>
          {[
            { key:'all',     label:'All'     },
            { key:'open',    label:'Open'    },
            { key:'daily',   label:'Daily'   },
            { key:'weekly',  label:'Weekly'  },
            { key:'monthly', label:'Monthly' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                flex:1, padding:'8px 4px', borderRadius:10, border:'none',
                background: filter === f.key ? 'linear-gradient(135deg, #7F77DD, #534AB7)' : 'transparent',
                color: filter === f.key ? '#fff' : '#534AB7',
                fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.2s',
              }}
            >{f.label}</button>
          ))}
        </div>

        {/* ── GROUPS LIST */}
        {filteredGroups.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>⭕</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#f1f0ff', marginBottom:8 }}>No circles available</div>
            <div style={{ fontSize:13, color:'#AFA9EC' }}>Check back later or change your filter</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {filteredGroups.map((group, i) => {
              const filled    = getFilledCount(group.slots)
              const available = getAvailableCount(group)
              const progress  = (filled / group.max_slots) * 100
              const reqStatus = getRequestStatus(group.id)
              const member    = isMember(group.id)
              const isFull    = available === 0
              const colors    = statusColor(group.status)

              return (
                <motion.div key={group.id}
                  data-aos="fade-up" data-aos-delay={i * 80}
                  style={{ background:'#1a1830', border:'1px solid #2a2840', borderRadius:20, overflow:'hidden' }}
                >
                  {/* Top color bar */}
                  <div style={{
                    height:4,
                    background: group.frequency === 'daily'
                      ? 'linear-gradient(90deg, #22c55e, #7F77DD)'
                      : group.frequency === 'weekly'
                      ? 'linear-gradient(90deg, #7F77DD, #fbbf24)'
                      : 'linear-gradient(90deg, #fbbf24, #7F77DD)',
                  }} />

                  <div style={{ padding:'16px 16px 0' }}>
                    {/* Name & status */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div>
                        <div style={{ fontSize:16, fontWeight:800, color:'#f1f0ff' }}>{group.name}</div>
                        <div style={{ fontSize:11, color:'#534AB7', marginTop:2 }}>
                          {freqLabel(group.frequency)} · {group.max_slots} slots total
                        </div>
                      </div>
                      <span style={{
                        background:colors.bg, border:`1px solid ${colors.border}`,
                        color:colors.text, borderRadius:20,
                        padding:'3px 10px', fontSize:10, fontWeight:700, textTransform:'uppercase',
                      }}>{group.status}</span>
                    </div>

                    {/* Amount cards */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                      <div style={{ background:'#1f1d35', borderRadius:12, padding:'10px 12px' }}>
                        <div style={{ fontSize:10, color:'#534AB7', fontWeight:600, marginBottom:2 }}>YOU PAY</div>
                        <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff' }}>
                          ₦{group.amount_per_slot?.toLocaleString()}
                        </div>
                        <div style={{ fontSize:10, color:'#534AB7' }}>per {freqShort(group.frequency)}</div>
                      </div>
                      <div style={{
                        background:'linear-gradient(135deg, #1c1a0e, #2a2408)',
                        border:'1px solid #fbbf2420', borderRadius:12, padding:'10px 12px',
                      }}>
                        <div style={{ fontSize:10, color:'#854d0e', fontWeight:600, marginBottom:2 }}>YOU COLLECT</div>
                        <div style={{ fontSize:18, fontWeight:800, color:'#fbbf24' }}>
                          ₦{group.payout_amount?.toLocaleString()}
                        </div>
                        <div style={{ fontSize:10, color:'#854d0e' }}>when your turn comes</div>
                      </div>
                    </div>

                    {/* Platform fee notice — subtle, honest */}
                    <div style={{
                      display:'flex', alignItems:'center', gap:6,
                      marginBottom:12, padding:'6px 10px',
                      background:'#1f1d35', borderRadius:8,
                      border:'1px solid #2a2840',
                    }}>
                      <span style={{ fontSize:11 }}>ℹ️</span>
                      <span style={{ fontSize:11, color:'#534AB7' }}>
                        A small platform service fee applies. Payout shown is what you receive.
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ marginBottom:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:11, color:'#AFA9EC', fontWeight:600 }}>
                          {filled} / {group.max_slots} slots filled
                        </span>
                        <span style={{ fontSize:11, color: isFull ? '#ef4444' : '#22c55e', fontWeight:600 }}>
                          {isFull ? '🔒 Full' : `${available} left`}
                        </span>
                      </div>
                      <div style={{ height:6, background:'#1f1d35', borderRadius:3, overflow:'hidden' }}>
                        <motion.div
                          initial={{ width:0 }} animate={{ width:`${progress}%` }}
                          transition={{ duration:0.8, ease:'easeOut' }}
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
                    </div>

                    {group.description && (
                      <div style={{ fontSize:12, color:'#AFA9EC', lineHeight:1.6, marginBottom:12 }}>
                        {group.description}
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  <div style={{ padding:'0 16px 16px' }}>
                    {member ? (
                      <div style={{
                        background:'#052e16', border:'1px solid #166534',
                        borderRadius:12, padding:'12px', textAlign:'center',
                        fontSize:13, fontWeight:700, color:'#22c55e',
                      }}>✅ You are a member of this circle</div>

                    ) : reqStatus === 'approved' ? (
                      <motion.button whileTap={{ scale:0.97 }}
                        onClick={() => navigate(`/slots/${group.id}`)}
                        style={{
                          width:'100%', padding:'13px',
                          background:'linear-gradient(135deg, #22c55e, #16a34a)',
                          border:'none', color:'#fff', borderRadius:12,
                          fontSize:14, fontWeight:800, cursor:'pointer',
                          boxShadow:'0 4px 16px rgba(34,197,94,0.3)',
                        }}>🎯 Pick Your Slot Now!</motion.button>

                    ) : reqStatus === 'pending' ? (
                      <div style={{
                        background:'#1c1a0e', border:'1px solid #854d0e',
                        borderRadius:12, padding:'12px', textAlign:'center',
                        fontSize:13, fontWeight:700, color:'#fbbf24',
                        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                      }}>
                        <motion.span animate={{ rotate:360 }}
                          transition={{ duration:2, repeat:Infinity, ease:'linear' }}
                          style={{ display:'inline-block' }}>⏳</motion.span>
                        Request pending — awaiting approval
                      </div>

                    ) : reqStatus === 'declined' ? (
                      <div style={{
                        background:'#2d0a0a', border:'1px solid #7f1d1d',
                        borderRadius:12, padding:'12px', textAlign:'center',
                        fontSize:13, fontWeight:700, color:'#ef4444',
                      }}>❌ Request declined by admin</div>

                    ) : isFull ? (
                      <div style={{
                        background:'#1f1d35', border:'1px solid #2a2840',
                        borderRadius:12, padding:'12px', textAlign:'center',
                        fontSize:13, fontWeight:600, color:'#534AB7',
                      }}>🔒 This circle is full</div>

                    ) : (
                      <motion.button whileTap={{ scale:0.97 }}
                        onClick={() => openJoinModal(group)}
                        disabled={requesting === group.id}
                        style={{
                          width:'100%', padding:'13px',
                          background:'linear-gradient(135deg, #fbbf24, #d97706)',
                          border:'none', color:'#3a1f00', borderRadius:12,
                          fontSize:14, fontWeight:800, cursor:'pointer',
                          boxShadow:'0 4px 16px rgba(251,191,36,0.25)',
                        }}>Request to Join ✦</motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── JOIN MODAL */}
      <AnimatePresence>
        {showModal && selectedGroup && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:30 }}
              onClick={e => e.stopPropagation()}
              style={{
                background:'#1a1830', borderTop:'1px solid #2a2840',
                borderRadius:'24px 24px 0 0', width:'100%', maxWidth:480,
                padding:'20px 24px 40px',
              }}
            >
              <div style={{ width:40, height:4, borderRadius:2, background:'#2a2840', margin:'0 auto 20px' }} />
              <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff', marginBottom:4 }}>Request to Join</div>
              <div style={{ fontSize:13, color:'#534AB7', marginBottom:24 }}>{selectedGroup.name}</div>

              {/* Summary */}
              <div style={{ background:'#1f1d35', border:'1px solid #2a2840', borderRadius:16, padding:16, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'#534AB7' }}>Pay per slot</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#f1f0ff' }}>
                    ₦{selectedGroup.amount_per_slot?.toLocaleString()} / {freqShort(selectedGroup.frequency)}
                  </span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:12, color:'#534AB7' }}>Collect per slot</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#fbbf24' }}>
                    ₦{selectedGroup.payout_amount?.toLocaleString()}
                  </span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'#534AB7' }}>Available slots</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#22c55e' }}>
                    {getAvailableCount(selectedGroup)} slots open
                  </span>
                </div>
              </div>

              {/* Fee notice inside modal too */}
              <div style={{
                display:'flex', alignItems:'flex-start', gap:8, marginBottom:16,
                padding:'10px 12px', background:'#1f1d35',
                border:'1px solid #2a2840', borderRadius:10,
              }}>
                <span style={{ fontSize:13, marginTop:1 }}>ℹ️</span>
                <span style={{ fontSize:12, color:'#AFA9EC', lineHeight:1.6 }}>
                  The collect amount shown is what you will actually receive.
                  A small platform service fee has already been accounted for.
                </span>
              </div>

              {/* Slot count picker */}
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#f1f0ff', marginBottom:12 }}>
                  How many slots do you want?
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {[1, 2].map(n => (
                    <button key={n} onClick={() => setSlotsWanted(n)}
                      disabled={n > getAvailableCount(selectedGroup) - 2}
                      style={{
                        flex:1, padding:'12px 4px', borderRadius:12,
                        background: slotsWanted === n ? 'linear-gradient(135deg, #7F77DD, #534AB7)' : '#1f1d35',
                        border: slotsWanted !== n ? '1px solid #2a2840' : 'none',
                        color: slotsWanted === n ? '#fff' : '#534AB7',
                        fontSize:15, fontWeight:800,
                        cursor: n > getAvailableCount(selectedGroup) - 2 ? 'not-allowed' : 'pointer',
                        opacity: n > getAvailableCount(selectedGroup) - 2 ? 0.3 : 1,
                      }}
                    >{n}</button>
                  ))}
                </div>
                <div style={{ fontSize:11, color:'#534AB7', marginTop:8 }}>
                  Slots 1 & 2 are taken. Your slots will be assigned from slot 3 upward.
                </div>
              </div>

              {/* Total */}
              <div style={{
                background:'linear-gradient(135deg, #1c1a0e, #2a2408)',
                border:'1px solid #fbbf2420', borderRadius:14,
                padding:'14px 16px', marginBottom:20,
                display:'flex', justifyContent:'space-between',
              }}>
                <div>
                  <div style={{ fontSize:11, color:'#854d0e', fontWeight:600 }}>TOTAL YOU PAY</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'#fbbf24' }}>
                    ₦{(selectedGroup.amount_per_slot * slotsWanted)?.toLocaleString()}
                    <span style={{ fontSize:11, color:'#854d0e', fontWeight:400 }}>/{freqShort(selectedGroup.frequency)}</span>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, color:'#854d0e', fontWeight:600 }}>TOTAL YOU COLLECT</div>
                  <div style={{ fontSize:20, fontWeight:800, color:'#fbbf24' }}>
                    ₦{(selectedGroup.payout_amount * slotsWanted)?.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ background:'#1f1d35', border:'1px solid #2a2840', borderRadius:12, padding:12, marginBottom:20, fontSize:12, color:'#AFA9EC', lineHeight:1.7 }}>
                📋 Your request will be reviewed by admin. Once approved you will receive a notification.
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowModal(false)}
                  style={{ flex:1, padding:'13px', background:'#1f1d35', border:'1px solid #2a2840', color:'#AFA9EC', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale:0.97 }} onClick={sendRequest} disabled={!!requesting}
                  style={{
                    flex:2, padding:'13px',
                    background: requesting ? '#2a2840' : 'linear-gradient(135deg, #fbbf24, #d97706)',
                    border:'none', color: requesting ? '#534AB7' : '#3a1f00',
                    borderRadius:12, fontSize:14, fontWeight:800,
                    cursor: requesting ? 'not-allowed' : 'pointer',
                  }}>
                  {requesting ? 'Sending...' : 'Send Request ✦'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
