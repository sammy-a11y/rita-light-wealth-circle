import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AOS from 'aos'

// Import your logo — put rita_logo.jpeg inside src/assets/
import ritaLogo from '../assets/rita_logo.jpeg'

export default function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(-1)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  useEffect(() => {
    AOS.refresh()
  }, [])

  const useCounter = (end, duration = 2000) => {
    const [count, setCount] = useState(0)
    useEffect(() => {
      let start = 0
      const step = end / (duration / 16)
      const timer = setInterval(() => {
        start += step
        if (start >= end) { setCount(end); clearInterval(timer) }
        else setCount(Math.floor(start))
      }, 16)
      return () => clearInterval(timer)
    }, [end, duration])
    return count
  }

  const members = useCounter(150)
  const payouts = useCounter(4)
  const groups  = useCounter(12)
  const success = useCounter(100)

  const navLinks = ['Home','About','How It Works','Services','FAQ','Contact']

  const features = [
    { icon: '🛡️', title: 'Scam Protected',      desc: 'Face video and NIN verification keeps fraudsters out permanently.' },
    { icon: '📍', title: 'Location Tracking',    desc: 'Every member GPS location is recorded. Nobody can run and hide.' },
    { icon: '💸', title: 'Transparent Payments', desc: 'Every payment is verified by admin and visible in your history.' },
    { icon: '🔔', title: 'Smart Reminders',      desc: 'Auto notifications 10 days before your packing date.' },
    { icon: '⭕', title: 'Pick Your Slot',       desc: 'Choose your number. Pick more than one slot if you want.' },
    { icon: '🚫', title: 'Blacklist System',     desc: 'Scammers get permanently blacklisted. No second chances ever.' },
  ]

  const steps = [
    { number: '01', title: 'Register & Verify',    desc: 'Sign up with phone number, NIN and a short face video. One time only.', icon: '📝' },
    { number: '02', title: 'Join a Circle',        desc: 'Browse available groups and join one that fits your budget.', icon: '👥' },
    { number: '03', title: 'Pick Your Slot',       desc: 'Choose your number from slot 3 upward. Slots 1 & 2 belong to admin.', icon: '🎯' },
    { number: '04', title: 'Contribute & Collect', desc: 'Pay weekly or monthly contributions. Collect when your number comes.', icon: '💰' },
  ]

  const faqs = [
    { q: 'What is Rita Light Wealth Circle?',        a: 'It is a digital Ajo (Osusu) platform where members contribute money regularly and each person collects the full pot when their slot number comes up. Fully verified and scam-protected.' },
    { q: 'How do I join a group?',                   a: 'Register with your NIN and face video, get verified by admin, then browse available groups and pick your slot number from 3 upward.' },
    { q: 'What happens if someone refuses to pay?',  a: 'They get a ₦1,000 penalty fee and a warning. If they continue to default they are permanently blacklisted from the platform and reported to the appropriate authorities.' },
    { q: 'Can I pick more than one slot?',           a: 'Yes! You can pick multiple slot numbers in the same group. Each slot has its own contribution and payout cycle.' },
    { q: 'How does Rita verify my payment?',         a: 'You upload your receipt after paying to the provided account. Rita checks and approves it manually. Once approved it shows in your transaction history.' },
    { q: 'What if a group does not fill up?',        a: 'The group stays open until all slots are filled. Once full, a 5-hour countdown starts then the group officially begins.' },
  ]

  const testimonials = [
    { name: 'Chioma A.',  location: 'Lagos',  text: 'I was so scared of Ajo after being scammed twice. Rita Light changed everything. The NIN and face video made me feel safe finally.', avatar: 'CA', stars: 5 },
    { name: 'Emeka O.',   location: 'Abuja',  text: 'Collected my ₦40,000 last month! The reminders kept me on track and the admin was always responsive. God bless Rita.', avatar: 'EO', stars: 5 },
    { name: 'Fatima B.',  location: 'Kano',   text: 'The slot system is genius. I picked slot 5 and 8 in the same group. Double the savings! Will never use manual Ajo again.', avatar: 'FB', stars: 5 },
    { name: 'Tunde M.',   location: 'Ibadan', text: 'As someone who has lost money to Ajo scams before, this platform is a breath of fresh air. Location tracking gives real peace of mind.', avatar: 'TM', stars: 5 },
  ]

  const services = [
    { icon: '🥈', title: 'Silver Circle',  desc: 'Pack ₦1,000 weekly · Collect ₦10,000',  badge: 'Starter',      color: '#AFA9EC' },
    { icon: '💎', title: 'Gold Circle',    desc: 'Pack ₦2,000 weekly · Collect ₦20,000',  badge: 'Most Popular', color: '#fbbf24' },
    { icon: '👑', title: 'Diamond Circle', desc: 'Pack ₦5,000 monthly · Collect ₦50,000', badge: 'Premium',      color: '#7F77DD' },
  ]

  return (
    <div style={{ background: '#0f0e1a', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      {/* ══════════════════════════
          HEADER
      ══════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(10,9,20,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(127,119,221,0.15)',
        padding: '0 32px',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: 68,
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={ritaLogo} alt="Rita Light Wealth Circle"
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fbbf24' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f0ff', lineHeight: 1.2, letterSpacing: '0.02em' }}>RITA LIGHT</div>
              <div style={{ fontSize: 9, color: '#fbbf24', fontWeight: 700, letterSpacing: '0.18em' }}>WEALTH CIRCLE™</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', gap: 32, alignItems: 'center' }} className="desktop-nav">
            {navLinks.map(link => (
              <a key={link}
                href={`#${link.toLowerCase().replace(/\s+/g,'-')}`}
                className="nav-link"
                style={{
                  color: '#AFA9EC', fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', paddingBottom: 2,
                  borderBottom: '2px solid transparent',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >{link}</a>
            ))}
          </nav>

          {/* Right buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <motion.button whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                border: '1px solid #534AB7',
                color: '#AFA9EC', padding: '9px 20px',
                borderRadius: 10, fontSize: 13,
                fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#7F77DD'; e.currentTarget.style.color='#f1f0ff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#534AB7'; e.currentTarget.style.color='#AFA9EC' }}
            >Login</motion.button>

            {/* Join Now — hidden on mobile */}
            <motion.button whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/register')}
              className="join-btn-desktop"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                border: 'none', color: '#3a1f00',
                padding: '9px 20px', borderRadius: 10,
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(251,191,36,0.3)',
              }}>Join Now ✦</motion.button>

            {/* Hamburger — mobile only */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="hamburger"
              style={{
                background: 'transparent', border: '1px solid #3C3489',
                color: '#AFA9EC', fontSize: 18, cursor: 'pointer',
                width: 36, height: 36, borderRadius: 8,
                display: 'none', alignItems: 'center', justifyContent: 'center',
              }}>☰</button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: '#13121f',
                borderTop: '1px solid #3C3489',
                padding: '16px 24px 20px',
                display: 'flex', flexDirection: 'column', gap: 18,
              }}
            >
              {navLinks.map(link => (
                <a key={link}
                  href={`#${link.toLowerCase().replace(/\s+/g,'-')}`}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    color: '#AFA9EC', fontSize: 14,
                    textDecoration: 'none', fontWeight: 500,
                  }}
                >{link}</a>
              ))}
              <button onClick={() => { setMenuOpen(false); navigate('/register') }}
                style={{
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                  border: 'none', color: '#3a1f00',
                  padding: '12px', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>Join a Circle ✦</button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div style={{ height: 68 }} />

      {/* ══════════════════════════
          HERO
      ══════════════════════════ */}
      <section id="home" style={{
        minHeight: '88vh', display: 'flex', alignItems: 'center',
        padding: '48px 32px 40px', position: 'relative', overflow: 'hidden',
        maxWidth: 1100, margin: '0 auto',
      }}>
        {/* Glow blobs */}
        <div style={{ position:'absolute', top:0, left:-120, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(127,119,221,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:0, right:-120, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div style={{ display:'flex', alignItems:'center', gap:60, width:'100%', flexWrap:'wrap' }}>

          {/* LEFT */}
          <div style={{ flex:1, minWidth:280 }}>
            <motion.div
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
              style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:'#1f1d35', border:'1px solid #3C3489',
                borderRadius:20, padding:'6px 14px',
                fontSize:11, color:'#7F77DD', fontWeight:600,
                marginBottom:20, letterSpacing:'0.05em',
              }}
            >🇳🇬 Nigeria's Safest Digital Ajo Platform</motion.div>

            <motion.h1
              initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.1 }}
              style={{ fontSize:44, fontWeight:900, lineHeight:1.1, marginBottom:20, color:'#f1f0ff', letterSpacing:'-0.02em' }}
            >
              Save Together.<br />
              <span className="gold-shimmer">Rise Together.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.2 }}
              style={{ fontSize:15, color:'#AFA9EC', lineHeight:1.8, marginBottom:32, maxWidth:420 }}
            >
              Join Nigeria's most trusted digital Ajo circle. Verified members, transparent payments, location tracking and zero tolerance for scammers.
            </motion.p>

            <motion.div
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.3 }}
              style={{ display:'flex', gap:12, flexWrap:'wrap' }}
            >
              <motion.button whileTap={{ scale:0.97 }} whileHover={{ scale:1.02 }}
                onClick={() => navigate('/register')}
                style={{
                  background:'linear-gradient(135deg, #fbbf24, #d97706)',
                  border:'none', color:'#3a1f00',
                  padding:'14px 32px', borderRadius:12,
                  fontSize:15, fontWeight:800, cursor:'pointer',
                  boxShadow:'0 6px 24px rgba(251,191,36,0.3)',
                }}>Join a Circle ✦</motion.button>

              <motion.button whileTap={{ scale:0.97 }}
                onClick={() => navigate('/login')}
                style={{
                  background:'transparent', border:'1px solid #534AB7',
                  color:'#AFA9EC', padding:'14px 28px',
                  borderRadius:12, fontSize:15, fontWeight:500, cursor:'pointer',
                }}>Login →</motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
              style={{ display:'flex', gap:8, marginTop:24, flexWrap:'wrap' }}
            >
              {['🔒 NIN Verified','📍 GPS Tracked','✅ Admin Approved','🚫 Scam Protected'].map(b => (
                <span key={b} style={{
                  background:'#1a1830', border:'1px solid #2a2840',
                  borderRadius:20, padding:'5px 12px',
                  fontSize:11, color:'#7F77DD',
                }}>{b}</span>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — image collage */}
          <motion.div
            initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.7, delay:0.3 }}
            style={{ flex:1, minWidth:280, position:'relative' }}
          >
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { url:'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80', h:200 },
                { url:'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80', h:140 },
                { url:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80', h:140 },
                { url:'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&q=80', h:200 },
              ].map((img, i) => (
                <motion.div key={i}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4+i*0.1 }}
                  style={{
                    height:img.h, borderRadius:16, overflow:'hidden',
                    border:'1px solid #2a2840',
                    marginTop: i===1||i===2 ? 20 : 0,
                  }}
                >
                  <img src={img.url} alt="people saving"
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.style.display='none'; e.target.parentElement.style.background='#1f1d35' }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Floating payout card */}
            <motion.div
              animate={{ y:[0,-8,0] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
              style={{
                position:'absolute', bottom:-16, left:-16,
                background:'#1f1d35', border:'1px solid #534AB7',
                borderRadius:16, padding:'12px 18px',
                boxShadow:'0 8px 32px rgba(127,119,221,0.3)',
              }}
            >
              <div style={{ fontSize:10, color:'#AFA9EC', marginBottom:4 }}>Latest payout 🎉</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#fbbf24' }}>₦50,000</div>
              <div style={{ fontSize:10, color:'#7F77DD', marginTop:2 }}>Diamond Circle · Emeka O.</div>
            </motion.div>

            {/* Floating members card */}
            <motion.div
              animate={{ y:[0,6,0] }} transition={{ duration:2.5, repeat:Infinity, ease:'easeInOut', delay:1 }}
              style={{
                position:'absolute', top:0, right:-16,
                background:'#1f1d35', border:'1px solid #fbbf2440',
                borderRadius:16, padding:'10px 16px',
                boxShadow:'0 8px 32px rgba(251,191,36,0.15)',
              }}
            >
              <div style={{ fontSize:10, color:'#AFA9EC', marginBottom:2 }}>Active members</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fbbf24' }}>150+ 👥</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════
          STATS
      ══════════════════════════ */}
      <section style={{
        background:'linear-gradient(135deg, #1a1830, #1f1d35)',
        border:'1px solid #2a2840',
        margin:'0 32px', borderRadius:24, padding:'40px 32px',
        maxWidth:1100, marginLeft:'auto', marginRight:'auto',
      }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24, textAlign:'center' }}>
          {[
            { value:members, suffix:'+',  label:'Verified Members',   icon:'👥' },
            { value:payouts, suffix:'M+', label:'Total Paid Out (₦)', icon:'💰' },
            { value:groups,  suffix:'+',  label:'Active Circles',     icon:'⭕' },
            { value:success, suffix:'%',  label:'Success Rate',       icon:'✅' },
          ].map((stat, i) => (
            <motion.div key={i} data-aos="zoom-in" data-aos-delay={i*100}>
              <div style={{ fontSize:26, marginBottom:8 }}>{stat.icon}</div>
              <div style={{ fontSize:34, fontWeight:900, color:'#fbbf24', letterSpacing:'-0.02em' }}>
                {stat.value}{stat.suffix}
              </div>
              <div style={{ fontSize:12, color:'#AFA9EC', marginTop:4 }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════
          HOW IT WORKS
      ══════════════════════════ */}
      <section id="how-it-works" style={{ padding:'80px 32px', maxWidth:1100, margin:'0 auto' }}>
        <div data-aos="fade-up" style={{ textAlign:'center', marginBottom:52 }}>
          <span style={{ background:'#1f1d35', border:'1px solid #3C3489', borderRadius:20, padding:'6px 16px', fontSize:11, color:'#7F77DD', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>How It Works</span>
          <h2 style={{ fontSize:34, fontWeight:900, color:'#f1f0ff', marginTop:16, marginBottom:12 }}>From signup to payout</h2>
          <p style={{ fontSize:14, color:'#AFA9EC', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>Four simple steps and you are inside a trusted saving circle</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20 }}>
          {steps.map((step, i) => (
            <div key={step.number} data-aos="fade-up" data-aos-delay={i*100}
              className="float-card"
              style={{ background:'#1a1830', border:'1px solid #2a2840', borderRadius:20, padding:24, position:'relative', overflow:'hidden' }}
            >
              <div style={{ position:'absolute', top:-8, right:-4, fontSize:64, fontWeight:900, color:'#1f1d35', lineHeight:1, userSelect:'none' }}>{step.number}</div>
              <div style={{ fontSize:32, marginBottom:14 }}>{step.icon}</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#f1f0ff', marginBottom:8 }}>{step.title}</div>
              <div style={{ fontSize:13, color:'#AFA9EC', lineHeight:1.7 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════
          SERVICES
      ══════════════════════════ */}
      <section id="services" style={{ padding:'80px 32px', maxWidth:1100, margin:'0 auto' }}>
        <div data-aos="fade-up" style={{ textAlign:'center', marginBottom:52 }}>
          <span style={{ background:'#1f1d35', border:'1px solid #3C3489', borderRadius:20, padding:'6px 16px', fontSize:11, color:'#fbbf24', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Our Circles</span>
          <h2 style={{ fontSize:34, fontWeight:900, color:'#f1f0ff', marginTop:16, marginBottom:12 }}>Choose your saving plan</h2>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20 }}>
          {services.map((s, i) => (
            <motion.div key={s.title}
              data-aos="zoom-in" data-aos-delay={i*100}
              whileHover={{ scale:1.03, y:-4 }}
              style={{
                background:'#1a1830', border:`1px solid ${s.color}30`,
                borderRadius:24, padding:28,
                position:'relative', overflow:'hidden', cursor:'pointer',
              }}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
              <div style={{ display:'inline-block', background:`${s.color}18`, border:`1px solid ${s.color}35`, borderRadius:20, padding:'4px 12px', fontSize:11, color:s.color, fontWeight:600, marginBottom:16 }}>{s.badge}</div>
              <div style={{ fontSize:40, marginBottom:12 }}>{s.icon}</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#f1f0ff', marginBottom:8 }}>{s.title}</div>
              <div style={{ fontSize:13, color:'#AFA9EC', lineHeight:1.6, marginBottom:20 }}>{s.desc}</div>
              <button onClick={() => navigate('/register')} style={{ background:`linear-gradient(135deg, ${s.color}80, ${s.color}50)`, border:`1px solid ${s.color}50`, color:'#fff', padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', width:'100%' }}>Join This Circle</button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════
          ABOUT
      ══════════════════════════ */}
      <section id="about" style={{ padding:'80px 32px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'flex', gap:60, alignItems:'center', flexWrap:'wrap' }}>

          <motion.div data-aos="fade-right" style={{ flex:1, minWidth:260, position:'relative' }}>
            <div style={{ borderRadius:24, overflow:'hidden', border:'1px solid #2a2840', height:380 }}>
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80"
                alt="founder"
                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                onError={e => { e.target.style.display='none'; e.target.parentElement.style.background='#1f1d35' }}
              />
            </div>
            <motion.div
              animate={{ y:[0,-6,0] }} transition={{ duration:2.5, repeat:Infinity }}
              style={{ position:'absolute', bottom:20, right:-16, background:'#1f1d35', border:'1px solid #7F77DD', borderRadius:16, padding:'14px 18px', boxShadow:'0 8px 32px rgba(127,119,221,0.25)' }}
            >
              <div style={{ fontSize:10, color:'#AFA9EC' }}>Members trust us</div>
              <div style={{ fontSize:22, fontWeight:900, color:'#7F77DD' }}>150+</div>
              <div style={{ fontSize:14, marginTop:4 }}>⭐⭐⭐⭐⭐</div>
            </motion.div>
          </motion.div>

          <div data-aos="fade-left" style={{ flex:1, minWidth:260 }}>
            <span style={{ background:'#1f1d35', border:'1px solid #3C3489', borderRadius:20, padding:'6px 16px', fontSize:11, color:'#7F77DD', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>About Us</span>
            <h2 style={{ fontSize:30, fontWeight:900, color:'#f1f0ff', marginTop:16, marginBottom:16, lineHeight:1.25 }}>
              Born from frustration.<br />
              <span className="gold-shimmer">Built with trust.</span>
            </h2>
            <p style={{ fontSize:14, color:'#AFA9EC', lineHeight:1.85, marginBottom:16 }}>
              Rita Light Wealth Circle was created after too many Nigerians lost their hard-earned money to Ajo scammers — people who collect early then disappear. People with fake identities. People who block you after collecting.
            </p>
            <p style={{ fontSize:14, color:'#AFA9EC', lineHeight:1.85, marginBottom:24 }}>
              We built a platform where every member is fully verified, every payment is tracked, and every location is recorded. No more running. No more hiding. Just honest saving.
            </p>
            {[
              { icon:'✅', text:'Every member verified with NIN and face video' },
              { icon:'📍', text:'GPS location tracked from day of registration' },
              { icon:'🚫', text:'Scammers permanently blacklisted — no second chances' },
            ].map(item => (
              <div key={item.text} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
                <span style={{ fontSize:18 }}>{item.icon}</span>
                <span style={{ fontSize:13, color:'#AFA9EC', lineHeight:1.6 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════
          FEATURES
      ══════════════════════════ */}
      <section style={{ padding:'80px 32px', maxWidth:1100, margin:'0 auto' }}>
        <div data-aos="fade-up" style={{ textAlign:'center', marginBottom:52 }}>
          <span style={{ background:'#1f1d35', border:'1px solid #3C3489', borderRadius:20, padding:'6px 16px', fontSize:11, color:'#7F77DD', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Features</span>
          <h2 style={{ fontSize:34, fontWeight:900, color:'#f1f0ff', marginTop:16 }}>Built to stop scammers</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
          {features.map((f, i) => (
            <div key={f.title} data-aos="zoom-in" data-aos-delay={i*80}
              className="float-card"
              style={{ background:'#1a1830', border:'1px solid #2a2840', borderRadius:20, padding:20 }}
            >
              <div style={{ fontSize:32, marginBottom:12 }}>{f.icon}</div>
              <div style={{ fontSize:14, fontWeight:700, color:'#f1f0ff', marginBottom:8 }}>{f.title}</div>
              <div style={{ fontSize:12, color:'#AFA9EC', lineHeight:1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════
          TESTIMONIALS
      ══════════════════════════ */}
      <section style={{ padding:'80px 32px', maxWidth:1100, margin:'0 auto' }}>
        <div data-aos="fade-up" style={{ textAlign:'center', marginBottom:52 }}>
          <span style={{ background:'#1f1d35', border:'1px solid #3C3489', borderRadius:20, padding:'6px 16px', fontSize:11, color:'#fbbf24', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Social Proof</span>
          <h2 style={{ fontSize:34, fontWeight:900, color:'#f1f0ff', marginTop:16 }}>What our members say</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
          {testimonials.map((t, i) => (
            <motion.div key={t.name}
              data-aos="fade-up" data-aos-delay={i*100}
              className="float-card"
              style={{ background:'#1a1830', border:'1px solid #2a2840', borderRadius:20, padding:22 }}
            >
              <div style={{ fontSize:13, marginBottom:12 }}>{'⭐'.repeat(t.stars)}</div>
              <p style={{ fontSize:13, color:'#AFA9EC', lineHeight:1.75, marginBottom:16, fontStyle:'italic' }}>"{t.text}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg, #7F77DD, #534AB7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#f1f0ff' }}>{t.name}</div>
                  <div style={{ fontSize:11, color:'#534AB7' }}>📍 {t.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════
          FAQ
      ══════════════════════════ */}
      <section id="faq" style={{ padding:'80px 32px', maxWidth:700, margin:'0 auto' }}>
        <div data-aos="fade-up" style={{ textAlign:'center', marginBottom:52 }}>
          <span style={{ background:'#1f1d35', border:'1px solid #3C3489', borderRadius:20, padding:'6px 16px', fontSize:11, color:'#7F77DD', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>FAQ</span>
          <h2 style={{ fontSize:34, fontWeight:900, color:'#f1f0ff', marginTop:16 }}>Common questions</h2>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {faqs.map((faq, i) => (
            <motion.div key={i}
              data-aos="fade-up" data-aos-delay={i*60}
              style={{ background:'#1a1830', border:`1px solid ${activeTab===i ? '#7F77DD' : '#2a2840'}`, borderRadius:14, overflow:'hidden', transition:'border-color 0.2s' }}
            >
              <button onClick={() => setActiveTab(activeTab===i ? -1 : i)}
                style={{ width:'100%', padding:'16px 20px', background:'transparent', border:'none', color:'#f1f0ff', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', textAlign:'left', gap:12 }}
              >
                {faq.q}
                <span style={{ color:'#7F77DD', fontSize:20, flexShrink:0, transition:'transform 0.3s', transform:activeTab===i ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
              </button>
              <AnimatePresence>
                {activeTab===i && (
                  <motion.div
                    initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.3 }}
                    style={{ overflow:'hidden' }}
                  >
                    <div style={{ padding:'0 20px 16px 20px', paddingTop:12, fontSize:13, color:'#AFA9EC', lineHeight:1.8, borderTop:'1px solid #2a2840' }}>{faq.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════
          CTA
      ══════════════════════════ */}
      <section style={{ padding:'20px 32px 80px', maxWidth:700, margin:'0 auto' }}>
        <motion.div data-aos="zoom-in"
          style={{ background:'linear-gradient(135deg, #1a1830, #1f1d35)', border:'1px solid #534AB7', borderRadius:28, padding:'52px 36px', textAlign:'center', position:'relative', overflow:'hidden' }}
        >
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg, #7F77DD, #fbbf24, #7F77DD)' }} />
          <img src={ritaLogo} alt="logo" style={{ width:64, height:64, borderRadius:'50%', objectFit:'cover', margin:'0 auto 20px', display:'block', border:'2px solid #fbbf24' }} />
          <h2 style={{ fontSize:28, fontWeight:900, color:'#f1f0ff', marginBottom:12 }}>Ready to join the circle?</h2>
          <p style={{ fontSize:14, color:'#AFA9EC', lineHeight:1.8, marginBottom:32, maxWidth:400, margin:'0 auto 32px' }}>
            Over 150 verified members are already saving safely. Join Rita Light Wealth Circle today.
          </p>
          <motion.button whileTap={{ scale:0.97 }} whileHover={{ scale:1.02 }}
            onClick={() => navigate('/register')}
            style={{ background:'linear-gradient(135deg, #fbbf24, #d97706)', border:'none', color:'#3a1f00', padding:'15px 40px', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer', boxShadow:'0 6px 24px rgba(251,191,36,0.3)', display:'block', margin:'0 auto', maxWidth:300, width:'100%' }}
          >Get Started — It's Free ✦</motion.button>
        </motion.div>
      </section>

      {/* ══════════════════════════
          CONTACT
      ══════════════════════════ */}
      <section id="contact" style={{ padding:'20px 32px 80px', maxWidth:700, margin:'0 auto' }}>
        <div data-aos="fade-up" style={{ textAlign:'center', marginBottom:40 }}>
          <span style={{ background:'#1f1d35', border:'1px solid #3C3489', borderRadius:20, padding:'6px 16px', fontSize:11, color:'#7F77DD', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Contact</span>
          <h2 style={{ fontSize:34, fontWeight:900, color:'#f1f0ff', marginTop:16 }}>Get in touch</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14 }}>
          {[
            { icon:'📧', label:'Email',    value:'hello@ritalight.ng' },
            { icon:'📞', label:'Phone',    value:'+234 8140739102' },
            { icon:'📍', label:'Location', value:'Nigeria 🇳🇬' },
          ].map(c => (
            <div key={c.label} data-aos="fade-up"
              style={{ background:'#1a1830', border:'1px solid #2a2840', borderRadius:16, padding:20, textAlign:'center' }}
            >
              <div style={{ fontSize:28, marginBottom:8 }}>{c.icon}</div>
              <div style={{ fontSize:11, color:'#534AB7', marginBottom:4, fontWeight:600, letterSpacing:'0.05em', textTransform:'uppercase' }}>{c.label}</div>
              <div style={{ fontSize:13, color:'#f1f0ff', fontWeight:500 }}>{c.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════
          FOOTER
      ══════════════════════════ */}
      <footer style={{ background:'#0a0916', borderTop:'1px solid #1f1d35', padding:'52px 32px 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>

          {/* Top row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:40, marginBottom:48 }}>

            {/* Brand column */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <img src={ritaLogo} alt="logo" style={{ width:44, height:44, borderRadius:'50%', objectFit:'cover', border:'2px solid #fbbf24' }} />
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#f1f0ff', letterSpacing:'0.02em' }}>RITA LIGHT</div>
                  <div style={{ fontSize:9, color:'#fbbf24', fontWeight:700, letterSpacing:'0.18em' }}>WEALTH CIRCLE™</div>
                </div>
              </div>
              <p style={{ fontSize:13, color:'#534AB7', lineHeight:1.7, maxWidth:220 }}>
                Nigeria's most trusted digital Ajo platform. Save together, rise together.
              </p>
              {/* Socials */}
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                {[
                  { icon:'📘', label:'Facebook' },
                  { icon:'📸', label:'Instagram' },
                  { icon:'🐦', label:'Twitter' },
                ].map(s => (
                  <div key={s.label}
                    style={{ width:36, height:36, borderRadius:'50%', background:'#1a1830', border:'1px solid #2a2840', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, cursor:'pointer' }}
                    title={s.label}
                  >{s.icon}</div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#f1f0ff', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Quick Links</div>
              {navLinks.map(link => (
                <a key={link} href={`#${link.toLowerCase().replace(/\s+/g,'-')}`}
                  style={{ display:'block', fontSize:13, color:'#534AB7', textDecoration:'none', marginBottom:10, transition:'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color='#AFA9EC'}
                  onMouseLeave={e => e.target.style.color='#534AB7'}
                >{link}</a>
              ))}
            </div>

            {/* Legal */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#f1f0ff', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Legal</div>
              {[
                { label:'Terms & Conditions', action: () => setShowTerms(true) },
                { label:'Privacy Policy',     action: () => setShowPrivacy(true) },
                { label:'Refund Policy',      action: () => setShowTerms(true) },
                { label:'User Agreement',     action: () => setShowTerms(true) },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  style={{ display:'block', fontSize:13, color:'#534AB7', background:'none', border:'none', padding:0, cursor:'pointer', marginBottom:10, textAlign:'left', transition:'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color='#AFA9EC'}
                  onMouseLeave={e => e.target.style.color='#534AB7'}
                >{item.label}</button>
              ))}
            </div>

            {/* Contact column */}
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#f1f0ff', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Contact Us</div>
              {[
                { icon:'📧', text:'hello@ritalight.ng' },
                { icon:'📞', text:'+234 8140739102' },
                { icon:'💬', text:'WhatsApp Support' },
                { icon:'📍', text:'Nigeria 🇳🇬' },
              ].map(c => (
                <div key={c.text} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
                  <span style={{ fontSize:14 }}>{c.icon}</span>
                  <span style={{ fontSize:13, color:'#534AB7' }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop:'1px solid #1f1d35', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <p style={{ fontSize:12, color:'#2a2840' }}>© {new Date().getFullYear()} Rita Light Wealth Circle™. All rights reserved.</p>
            <p style={{ fontSize:12, color:'#2a2840' }}>Save Together. Rise Together. 🇳🇬</p>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════
          WHATSAPP BUTTON (real icon)
      ══════════════════════════ */}
      <motion.a
        href="https://wa.me/2348140739102?text=Hi%20Rita%20Light%20Wealth%20Circle%2C%20I%20need%20support"
        target="_blank"
        rel="noopener noreferrer"
        animate={{ scale:[1, 1.08, 1] }}
        transition={{ duration:2.5, repeat:Infinity }}
        style={{
          position:'fixed', bottom:24, right:20, zIndex:9999,
          width:54, height:54, borderRadius:'50%',
          background:'linear-gradient(135deg, #25D366, #128C7E)',
          display:'flex', alignItems:'center', justifyContent:'center',
          textDecoration:'none',
          boxShadow:'0 4px 20px rgba(37,211,102,0.45)',
        }}
        title="Chat with us on WhatsApp"
      >
        {/* Real WhatsApp SVG icon */}
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.347.64 4.64 1.84 6.64L2.667 29.333l6.88-1.8A13.267 13.267 0 0016.004 29.333C23.36 29.333 29.333 23.36 29.333 16S23.36 2.667 16.004 2.667zm0 24.266a11 11 0 01-5.6-1.533l-.4-.24-4.08 1.067 1.093-3.96-.267-.413A10.933 10.933 0 015.067 16c0-6.04 4.907-10.933 10.933-10.933S26.933 9.96 26.933 16 22.04 26.933 16.004 26.933zm6.013-8.187c-.333-.16-1.96-.96-2.267-1.067-.306-.106-.52-.16-.733.16-.213.32-.84 1.067-1.027 1.28-.186.213-.373.24-.693.08-.32-.16-1.347-.493-2.56-1.573-.947-.84-1.587-1.88-1.773-2.2-.187-.32-.02-.493.14-.653.143-.14.32-.36.48-.547.16-.187.213-.32.32-.533.106-.213.053-.4-.027-.56-.08-.16-.733-1.76-1-2.4-.267-.64-.547-.547-.733-.547h-.627c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667s1.147 3.093 1.307 3.307c.16.213 2.267 3.453 5.493 4.84.773.333 1.373.533 1.84.68.773.24 1.48.213 2.04.133.627-.093 1.96-.8 2.24-1.573.28-.773.28-1.44.2-1.573-.08-.133-.293-.213-.627-.373z"/>
        </svg>
      </motion.a>

      {/* ══════════════════════════
          TERMS MODAL
      ══════════════════════════ */}
      <AnimatePresence>
        {showTerms && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setShowTerms(false)}
          >
            <motion.div
              initial={{ opacity:0, y:40, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:40, scale:0.96 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'#1a1830', border:'1px solid #3C3489', borderRadius:24, padding:32, maxWidth:540, width:'100%', maxHeight:'80vh', overflowY:'auto' }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <h2 style={{ fontSize:20, fontWeight:800, color:'#f1f0ff' }}>Terms & Conditions</h2>
                <button onClick={() => setShowTerms(false)} style={{ background:'#2a2840', border:'none', color:'#AFA9EC', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:16 }}>✕</button>
              </div>
              {[
                { title:'1. Membership', text:'All members must provide accurate personal information including full name, valid NIN, phone number and a clear face video during registration. False information will result in immediate account suspension and blacklisting.' },
                { title:'2. Contributions', text:'Members are required to make their contributions on time as scheduled by the group. Late payments attract a ₦1,000 penalty fee automatically applied to your account balance.' },
                { title:'3. Slot Numbers', text:'Slot numbers 1 and 2 in every group are permanently reserved for the admin. Members can pick from slot 3 upward. A member may hold multiple slots in the same group.' },
                { title:'4. Fraud & Scams', text:'Any member found to have collected their payout and defaulted on subsequent contributions will be permanently blacklisted from the platform and may be reported to relevant authorities.' },
                { title:'5. Location Consent', text:'By joining any group, members consent to having their GPS location recorded and stored. This information is used solely for fraud prevention and accountability purposes.' },
                { title:'6. Group Completion', text:'A group will not commence until all slots are filled. Once full, a 5-hour countdown begins before the group officially starts. The admin reserves the right to close any group at any time.' },
                { title:'7. Payments', text:'All payments must be made to the account provided by the admin. Payments are verified manually by the admin. Members must upload a valid receipt for every payment made.' },
                { title:'8. Amendments', text:'Rita Light Wealth Circle reserves the right to update these terms at any time. Members will be notified of significant changes via the platform.' },
              ].map(item => (
                <div key={item.title} style={{ marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#7F77DD', marginBottom:6 }}>{item.title}</div>
                  <div style={{ fontSize:13, color:'#AFA9EC', lineHeight:1.75 }}>{item.text}</div>
                </div>
              ))}
              <button onClick={() => setShowTerms(false)}
                style={{ background:'linear-gradient(135deg, #7F77DD, #534AB7)', border:'none', color:'#fff', padding:'12px 28px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', width:'100%', marginTop:8 }}>
                I Understand ✓
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════
          PRIVACY MODAL
      ══════════════════════════ */}
      <AnimatePresence>
        {showPrivacy && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setShowPrivacy(false)}
          >
            <motion.div
              initial={{ opacity:0, y:40, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:40, scale:0.96 }}
              onClick={e => e.stopPropagation()}
              style={{ background:'#1a1830', border:'1px solid #3C3489', borderRadius:24, padding:32, maxWidth:540, width:'100%', maxHeight:'80vh', overflowY:'auto' }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <h2 style={{ fontSize:20, fontWeight:800, color:'#f1f0ff' }}>Privacy Policy</h2>
                <button onClick={() => setShowPrivacy(false)} style={{ background:'#2a2840', border:'none', color:'#AFA9EC', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:16 }}>✕</button>
              </div>
              {[
                { title:'1. Data We Collect', text:'We collect your full name, email address, phone number, NIN, face video, device information and GPS location when you register and use our platform.' },
                { title:'2. How We Use It', text:'Your data is used to verify your identity, prevent fraud, process contributions, send notifications and maintain platform security. We do not sell your data to third parties.' },
                { title:'3. Location Data', text:'Your GPS location is collected when you register, pick a slot and make contributions. This data is stored securely and is only accessible by the platform admin for fraud prevention.' },
                { title:'4. Face Video', text:'Your face video is used exclusively for identity verification by the admin. It is stored securely and is not shared with any third party.' },
                { title:'5. Data Security', text:'We use industry-standard encryption to protect your personal data. All data is stored on secure servers. We take all reasonable precautions to prevent unauthorized access.' },
                { title:'6. Your Rights', text:'You may request deletion of your account and associated data at any time by contacting the admin, subject to any outstanding obligations on the platform.' },
                { title:'7. Contact', text:'For any privacy-related concerns please contact us at privacy@ritalight.ng' },
              ].map(item => (
                <div key={item.title} style={{ marginBottom:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#7F77DD', marginBottom:6 }}>{item.title}</div>
                  <div style={{ fontSize:13, color:'#AFA9EC', lineHeight:1.75 }}>{item.text}</div>
                </div>
              ))}
              <button onClick={() => setShowPrivacy(false)}
                style={{ background:'linear-gradient(135deg, #7F77DD, #534AB7)', border:'none', color:'#fff', padding:'12px 28px', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', width:'100%', marginTop:8 }}>
                I Understand ✓
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════
          STYLES
      ══════════════════════════ */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .join-btn-desktop { display: none !important; }
          .hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .hamburger { display: none !important; }
        }
        .nav-link:hover {
          color: #7F77DD !important;
          border-bottom: 2px solid #7F77DD !important;
        }
      `}</style>
    </div>
  )
}
