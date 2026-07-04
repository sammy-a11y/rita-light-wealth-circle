import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { sendApprovalPush, sendDeclinePush } from '../../lib/usePush'

function Avatar({ name, size = 40, fontSize = 14 }) {
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

export default function AdminMembers() {
  const navigate    = useNavigate()
  const { profile } = useAuthStore()

  const [members, setMembers]         = useState([])
  const [requests, setRequests]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('all')
  const [selected, setSelected]       = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showBlacklist, setShowBlacklist] = useState(false)
  const [blacklistReason, setBlacklistReason] = useState('')
  const [acting, setActing]           = useState(false)
  const [activeTab, setActiveTab]     = useState('members')

  useEffect(() => {
    fetchMembers()
    fetchRequests()
  }, [])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          slots ( id, group_id, slot_number, status,
            groups ( name, amount_per_slot, frequency )
          )
        `)
        .eq('is_admin', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      setMembers(data || [])
    } catch {
      toast.error('Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    try {
      const { data: reqData, error: reqError } = await supabase
        .from('group_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (reqError) throw reqError

      const enriched = await Promise.all(
        (reqData || []).map(async (req) => {
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user_id)
            .single()

          const { data: group } = await supabase
            .from('groups')
            .select('*')
            .eq('id', req.group_id)
            .single()

          return { ...req, users: user, groups: group }
        })
      )

      const filtered = enriched.filter(r => !r.users?.is_admin)
      setRequests(filtered)
    } catch (err) {
      console.error('Requests error:', err)
      toast.error('Failed to load requests')
    }
  }

  const blacklistMember = async () => {
    if (!blacklistReason.trim()) { toast.error('Enter reason for blacklist'); return }
    setActing(true)
    try {
      await supabase.from('users')
        .update({ is_blacklisted: true, blacklist_reason: blacklistReason.trim() })
        .eq('id', selected.id)

      await supabase.from('blacklist').insert({
        user_id:        selected.id,
        reason:         blacklistReason.trim(),
        blacklisted_by: profile.id,
      })

      await supabase.from('notifications').insert({
        user_id: selected.id,
        title:   'Account Suspended',
        message: 'Your account has been suspended. Contact admin for more information.',
        type:    'warning',
      })

      toast.success(`${selected.full_name} has been blacklisted`)
      setShowBlacklist(false)
      setShowProfile(false)
      setBlacklistReason('')
      fetchMembers()
    } catch (err) {
      toast.error(err.message || 'Failed to blacklist member')
    } finally {
      setActing(false)
    }
  }

  const removeBlacklist = async (member) => {
    try {
      await supabase.from('users')
        .update({ is_blacklisted: false, blacklist_reason: null })
        .eq('id', member.id)
      toast.success(`${member.full_name} removed from blacklist`)
      fetchMembers()
    } catch (err) {
      toast.error(err.message)
    }
  }

  // ── Handle join request — now fires push notification too
  const handleRequest = async (req, action) => {
    setActing(true)
    try {
      await supabase.from('group_requests')
        .update({ status: action, reviewed_by: profile.id, reviewed_at: new Date().toISOString() })
        .eq('id', req.id)

      if (action === 'approved') {
        // Save in-app notification
        await supabase.from('notifications').insert({
          user_id:  req.user_id,
          group_id: req.group_id,
          title:    '🎉 Request Approved!',
          message:  `Your request to join ${req.groups?.name} has been approved! You can now pick your slot.`,
          type:     'success',
        })
        // Fire phone push notification
        await sendApprovalPush(req.user_id, req.groups?.name)
        toast.success('Request approved ✅')
      } else {
        // Save in-app notification
        await supabase.from('notifications').insert({
          user_id:  req.user_id,
          group_id: req.group_id,
          title:    'Request Declined',
          message:  `Your request to join ${req.groups?.name} has been declined. Contact admin on WhatsApp.`,
          type:     'warning',
        })
        // Fire phone push notification
        await sendDeclinePush(req.user_id, req.groups?.name)
        toast.success('Request declined')
      }
      fetchRequests()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActing(false)
    }
  }

  const maskNIN = (nin) => {
    if (!nin || nin.length < 4) return '***********'
    return nin.slice(0, 3) + '*****' + nin.slice(-3)
  }

  const filtered = members.filter(m => {
    const matchSearch = m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search) || m.email?.toLowerCase().includes(search.toLowerCase())
    if (filter === 'blacklisted') return m.is_blacklisted && matchSearch
    if (filter === 'active')      return !m.is_blacklisted && matchSearch
    return matchSearch
  })

  const pendingCount = requests.length

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
          <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff' }}>Members & Requests</div>
          <div style={{ fontSize:12, color:'#534AB7', marginTop:1 }}>
            {members.length} members · {members.filter(m => m.is_blacklisted).length} blacklisted
          </div>
        </div>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'16px 20px 0' }}>

        {/* ── TABS */}
        <div style={{
          display:'flex', gap:0,
          background:'#1a1830', border:'1px solid #2a2840',
          borderRadius:14, overflow:'hidden', marginBottom:16,
        }}>
          {[
            { key:'members',  label:'All Members',   count:members.length },
            { key:'requests', label:'Join Requests', count:pendingCount, alert:pendingCount > 0 },
            { key:'blacklist',label:'Blacklisted',   count:members.filter(m=>m.is_blacklisted).length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                flex:1, padding:'11px 6px',
                background: activeTab === tab.key ? 'linear-gradient(135deg, #7F77DD, #534AB7)' : 'transparent',
                border:'none',
                color: activeTab === tab.key ? '#fff' : '#534AB7',
                fontSize:11, fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:4,
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : tab.alert ? '#f59e0b20' : '#2a2840',
                  color: activeTab === tab.key ? '#fff' : tab.alert ? '#f59e0b' : '#534AB7',
                  borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:800,
                }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── SEARCH */}
        {activeTab === 'members' && (
          <div style={{ marginBottom:14 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search by name, phone or email..." style={{ width:'100%' }} />
          </div>
        )}

        {/* ── FILTER */}
        {activeTab === 'members' && (
          <div style={{ display:'flex', gap:6, marginBottom:16 }}>
            {[
              { key:'all',         label:'All' },
              { key:'active',      label:'Active' },
              { key:'blacklisted', label:'Blacklisted' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{
                  padding:'7px 14px', borderRadius:20, border:'none',
                  background: filter === f.key ? 'linear-gradient(135deg, #fbbf24, #d97706)' : '#1a1830',
                  border: filter !== f.key ? '1px solid #2a2840' : 'none',
                  color: filter === f.key ? '#3a1f00' : '#534AB7',
                  fontSize:11, fontWeight:700, cursor:'pointer',
                }}
              >{f.label}</button>
            ))}
          </div>
        )}

        {/* ══ MEMBERS TAB ══ */}
        {activeTab === 'members' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#534AB7', fontSize:13 }}>No members found</div>
            ) : filtered.map((member, i) => (
              <motion.div key={member.id}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                style={{
                  background:'#1a1830',
                  border:`1px solid ${member.is_blacklisted ? '#7f1d1d' : '#2a2840'}`,
                  borderRadius:16, padding:'14px 16px', cursor:'pointer',
                }}
                onClick={() => { setSelected(member); setShowProfile(true) }}
              >
                <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <div style={{ position:'relative' }}>
                    <Avatar name={member.full_name} />
                    {member.is_blacklisted && (
                      <div style={{
                        position:'absolute', bottom:-2, right:-2,
                        width:16, height:16, borderRadius:'50%',
                        background:'#ef4444', fontSize:9,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>🚫</div>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ fontSize:14, fontWeight:700, color: member.is_blacklisted ? '#ef4444' : '#f1f0ff' }}>
                        {member.full_name}
                      </div>
                      {member.is_blacklisted && (
                        <span style={{
                          background:'#2d0a0a', border:'1px solid #7f1d1d',
                          color:'#ef4444', borderRadius:6, padding:'1px 6px', fontSize:9, fontWeight:700,
                        }}>BLACKLISTED</span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:'#534AB7', marginTop:1 }}>📱 {member.phone} · {member.state}</div>
                    <div style={{ fontSize:11, color:'#AFA9EC', marginTop:1 }}>💼 {member.occupation} · {member.employment_status}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:11, color:'#534AB7' }}>{member.slots?.length || 0} slot{member.slots?.length !== 1 ? 's' : ''}</div>
                    <div style={{ fontSize:10, color:'#3C3489', marginTop:2 }}>{dayjs(member.created_at).format('DD MMM YY')}</div>
                    <div style={{ fontSize:11, color:'#7F77DD', marginTop:2 }}>View →</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ══ REQUESTS TAB ══ */}
        {activeTab === 'requests' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {requests.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#534AB7', fontSize:13 }}>No pending requests 🎉</div>
            ) : requests.map((req, i) => (
              <motion.div key={req.id}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                style={{ background:'#1a1830', border:'1px solid #f59e0b30', borderRadius:16, padding:'14px 16px' }}
              >
                <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
                  <Avatar name={req.users?.full_name} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#f1f0ff' }}>{req.users?.full_name}</div>
                    <div style={{ fontSize:11, color:'#534AB7', marginTop:1 }}>📱 {req.users?.phone} · {req.users?.state}</div>
                    <div style={{ fontSize:11, color:'#AFA9EC', marginTop:1 }}>
                      Wants <strong style={{ color:'#fbbf24' }}>{req.slots_wanted} slot{req.slots_wanted > 1 ? 's' : ''}</strong> in <strong style={{ color:'#7F77DD' }}>{req.groups?.name}</strong>
                    </div>
                    <div style={{ fontSize:11, color:'#534AB7', marginTop:1 }}>💼 {req.users?.occupation} · {req.users?.employment_status}</div>
                    <div style={{ fontSize:11, color:'#534AB7' }}>💰 {req.users?.income_range}</div>
                  </div>
                  <div style={{ fontSize:10, color:'#3C3489' }}>{dayjs(req.created_at).format('DD MMM')}</div>
                </div>

                {/* NIN + Video */}
                <div style={{ background:'#1f1d35', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div>
                      <div style={{ fontSize:10, color:'#534AB7', fontWeight:600, marginBottom:2 }}>NIN NUMBER</div>
                      <div style={{ fontSize:15, fontWeight:800, color:'#f1f0ff', letterSpacing:'0.08em' }}>
                        {req.users?.nin || 'Not provided'}
                      </div>
                    </div>
                    <a href="https://nimc.gov.ng/verify-nin/" target="_blank" rel="noopener noreferrer"
                      style={{
                        background:'#7F77DD20', border:'1px solid #7F77DD40',
                        borderRadius:8, padding:'6px 12px',
                        fontSize:11, color:'#7F77DD', fontWeight:700, textDecoration:'none',
                        display:'flex', alignItems:'center', gap:4,
                      }}>🔍 Verify NIN</a>
                  </div>
                  {req.users?.face_video_url && (
                    <a href={req.users.face_video_url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display:'flex', alignItems:'center', gap:8,
                        background:'#534AB720', border:'1px solid #534AB740',
                        borderRadius:8, padding:'8px 12px', textDecoration:'none',
                      }}>
                      <div style={{
                        width:28, height:28, borderRadius:'50%',
                        background:'linear-gradient(135deg, #7F77DD, #534AB7)',
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:12,
                      }}>▶</div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:'#7F77DD' }}>Watch Face Verification Video</div>
                        <div style={{ fontSize:10, color:'#534AB7' }}>Tap to open video</div>
                      </div>
                    </a>
                  )}
                </div>

                <div style={{ fontSize:11, color:'#AFA9EC', marginBottom:12, background:'#1f1d35', borderRadius:8, padding:'8px 10px' }}>
                  📍 {req.users?.address}, {req.users?.state}
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <motion.button whileTap={{ scale:0.96 }}
                    onClick={() => handleRequest(req, 'declined')} disabled={acting}
                    style={{
                      flex:1, padding:'10px',
                      background:'#2d0a0a', border:'1px solid #7f1d1d',
                      color:'#ef4444', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer',
                    }}>❌ Decline</motion.button>
                  <motion.button whileTap={{ scale:0.96 }}
                    onClick={() => handleRequest(req, 'approved')} disabled={acting}
                    style={{
                      flex:2, padding:'10px',
                      background: acting ? '#2a2840' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      border:'none', color:'#fff', borderRadius:10, fontSize:13,
                      fontWeight:700, cursor: acting ? 'not-allowed' : 'pointer',
                    }}>
                    {acting ? 'Processing...' : '✅ Approve Request'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ══ BLACKLIST TAB ══ */}
        {activeTab === 'blacklist' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {members.filter(m => m.is_blacklisted).length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
                <div style={{ fontSize:13, color:'#534AB7' }}>No blacklisted members</div>
              </div>
            ) : members.filter(m => m.is_blacklisted).map((member, i) => (
              <motion.div key={member.id}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                style={{ background:'#1a1830', border:'1px solid #7f1d1d', borderRadius:16, padding:'14px 16px' }}
              >
                <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:10 }}>
                  <Avatar name={member.full_name} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#ef4444' }}>{member.full_name}</div>
                    <div style={{ fontSize:11, color:'#534AB7', marginTop:1 }}>📱 {member.phone} · {member.state}</div>
                  </div>
                </div>
                {member.blacklist_reason && (
                  <div style={{ background:'#2d0a0a', border:'1px solid #7f1d1d', borderRadius:8, padding:'8px 12px', marginBottom:10, fontSize:12, color:'#fca5a5' }}>
                    Reason: {member.blacklist_reason}
                  </div>
                )}
                <button onClick={() => removeBlacklist(member)}
                  style={{ width:'100%', padding:'10px', background:'#1f1d35', border:'1px solid #2a2840', color:'#AFA9EC', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  ↩ Remove from Blacklist
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ══ MEMBER PROFILE MODAL ══ */}
      <AnimatePresence>
        {showProfile && selected && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowProfile(false)}>
            <motion.div initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
              transition={{ type:'spring', stiffness:300, damping:30 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'#1a1830', borderTop:'1px solid #2a2840', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', padding:'20px 24px 40px' }}>
              <div style={{ width:40, height:4, borderRadius:2, background:'#2a2840', margin:'0 auto 20px' }} />
              <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:20 }}>
                <Avatar name={selected.full_name} size={52} fontSize={18} />
                <div>
                  <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff' }}>{selected.full_name}</div>
                  <div style={{ fontSize:12, color:'#534AB7', marginTop:2 }}>{selected.email}</div>
                  {selected.is_blacklisted && (
                    <span style={{ background:'#2d0a0a', border:'1px solid #7f1d1d', color:'#ef4444', borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:700 }}>🚫 BLACKLISTED</span>
                  )}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {[
                  { label:'Phone',      value:selected.phone },
                  { label:'State',      value:selected.state },
                  { label:'City',       value:selected.city },
                  { label:'Gender',     value:selected.gender },
                  { label:'Birth Year', value:selected.birth_year },
                  { label:'Employment', value:selected.employment_status },
                  { label:'Occupation', value:selected.occupation },
                  { label:'Income',     value:selected.income_range },
                ].map(r => (
                  <div key={r.label} style={{ background:'#1f1d35', borderRadius:10, padding:'8px 12px' }}>
                    <div style={{ fontSize:9, color:'#534AB7', fontWeight:700, marginBottom:2 }}>{r.label.toUpperCase()}</div>
                    <div style={{ fontSize:12, color:'#f1f0ff', fontWeight:500 }}>{r.value || '—'}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'#1f1d35', borderRadius:10, padding:'10px 12px', marginBottom:14 }}>
                <div style={{ fontSize:9, color:'#534AB7', fontWeight:700, marginBottom:2 }}>ADDRESS</div>
                <div style={{ fontSize:12, color:'#f1f0ff' }}>{selected.address || '—'}</div>
              </div>
              <div style={{ background:'#1f1d35', borderRadius:10, padding:'10px 12px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:9, color:'#534AB7', fontWeight:700, marginBottom:2 }}>NIN NUMBER</div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#f1f0ff', letterSpacing:'0.08em' }}>{selected.nin || 'Not provided'}</div>
                </div>
                <a href="https://verify.nimc.gov.ng" target="_blank" rel="noopener noreferrer"
                  style={{ background:'#7F77DD20', border:'1px solid #7F77DD40', borderRadius:8, padding:'6px 12px', fontSize:11, color:'#7F77DD', fontWeight:700, textDecoration:'none' }}>🔍 Verify</a>
              </div>
              {selected.latitude && selected.longitude && (
                <div style={{ background:'#1f1d35', borderRadius:10, padding:'10px 12px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:9, color:'#534AB7', fontWeight:700, marginBottom:2 }}>REGISTERED LOCATION</div>
                    <div style={{ fontSize:12, color:'#f1f0ff' }}>{selected.latitude?.toFixed(4)}, {selected.longitude?.toFixed(4)}</div>
                  </div>
                  <a href={`https://maps.google.com/?q=${selected.latitude},${selected.longitude}`} target="_blank" rel="noopener noreferrer"
                    style={{ background:'#22c55e20', border:'1px solid #22c55e40', borderRadius:8, padding:'6px 12px', fontSize:11, color:'#22c55e', fontWeight:700, textDecoration:'none' }}>📍 View Map</a>
                </div>
              )}
              {selected.face_video_url && (
                <a href={selected.face_video_url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:10, background:'#534AB720', border:'1px solid #534AB740', borderRadius:12, padding:'12px 16px', marginBottom:16, textDecoration:'none' }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg, #7F77DD, #534AB7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>▶</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#7F77DD' }}>Watch Face Verification Video</div>
                    <div style={{ fontSize:11, color:'#534AB7' }}>Tap to open in new tab</div>
                  </div>
                </a>
              )}
              {selected.slots?.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#f1f0ff', marginBottom:8 }}>Active Slots</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {selected.slots.map(slot => (
                      <div key={slot.id} style={{ background:'#1f1d35', borderRadius:10, padding:'8px 12px', display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:12, color:'#AFA9EC' }}>{slot.groups?.name} · Slot #{slot.slot_number}</span>
                        <span style={{ fontSize:11, fontWeight:700, color: slot.status === 'paid' ? '#22c55e' : '#f59e0b' }}>{slot.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize:11, color:'#534AB7', textAlign:'center', marginBottom:20 }}>
                Member since {dayjs(selected.created_at).format('DD MMMM YYYY')}
              </div>
              {!selected.is_blacklisted ? (
                <motion.button whileTap={{ scale:0.97 }}
                  onClick={() => { setShowProfile(false); setShowBlacklist(true) }}
                  style={{ width:'100%', padding:'13px', background:'#2d0a0a', border:'1px solid #7f1d1d', color:'#ef4444', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  🚫 Blacklist This Member
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale:0.97 }}
                  onClick={() => { removeBlacklist(selected); setShowProfile(false) }}
                  style={{ width:'100%', padding:'13px', background:'#052e16', border:'1px solid #166534', color:'#22c55e', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  ↩ Remove from Blacklist
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ BLACKLIST REASON MODAL ══ */}
      <AnimatePresence>
        {showBlacklist && selected && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setShowBlacklist(false)}>
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'#1a1830', border:'1px solid #7f1d1d', borderRadius:24, padding:28, maxWidth:400, width:'100%' }}>
              <div style={{ fontSize:32, textAlign:'center', marginBottom:12 }}>🚫</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#ef4444', textAlign:'center', marginBottom:8 }}>Blacklist {selected.full_name}?</div>
              <p style={{ fontSize:13, color:'#AFA9EC', lineHeight:1.7, marginBottom:20, textAlign:'center' }}>
                This will permanently ban them from the platform. They will be notified.
              </p>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#AFA9EC', marginBottom:6 }}>Reason for blacklist</label>
                <input value={blacklistReason} onChange={e => setBlacklistReason(e.target.value)}
                  placeholder="e.g. Collected slot #3, stopped paying contributions" />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowBlacklist(false)}
                  style={{ flex:1, padding:'12px', background:'#1f1d35', border:'1px solid #2a2840', color:'#AFA9EC', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                <motion.button whileTap={{ scale:0.97 }} onClick={blacklistMember} disabled={acting}
                  style={{ flex:1, padding:'12px', background: acting ? '#2a2840' : 'linear-gradient(135deg, #ef4444, #dc2626)', border:'none', color:'#fff', borderRadius:12, fontSize:14, fontWeight:700, cursor: acting ? 'not-allowed' : 'pointer' }}>
                  {acting ? 'Processing...' : 'Blacklist 🚫'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
