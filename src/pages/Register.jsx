import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { sendOTP as termiiSendOTP, verifyOTP } from '../lib/termii'
import toast from 'react-hot-toast'
import { FaceVerificationCamera } from '../components/FaceVerification'
import ritaLogo from '../assets/rita_logo.jpeg'


const STEPS = [
  { number: 1, label: 'Personal'  },
  { number: 2, label: 'Contact'   },
  { number: 3, label: 'Income'    },
  { number: 4, label: 'NIN & Face'},
  { number: 5, label: 'Location'  },
]

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT - Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
]

const OCCUPATIONS = [
  'Student','Civil Servant','Business Owner','Trader/Merchant',
  'Teacher/Lecturer','Healthcare Worker','Engineer','Lawyer',
  'Accountant/Finance','Driver/Logistics','Farmer','Artisan/Craftsman',
  'Unemployed','Other',
]

const INCOME_RANGES = [
  'Below ₦50,000','₦50,000 - ₦100,000','₦100,000 - ₦200,000',
  '₦200,000 - ₦500,000','₦500,000 - ₦1,000,000','Above ₦1,000,000',
  'Prefer not to say',
]

export default function Register() {
  const navigate = useNavigate()

  const [step, setStep]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [otpSent, setOtpSent]     = useState(false)
  const [videoBlob, setVideoBlob] = useState(null)
  const [videoURL, setVideoURL]   = useState(null)
  const [location, setLocation]   = useState(null)
  const [preparing, setPreparing] = useState(false)

  const [pinId, setPinId] = useState('')
  const [form, setForm] = useState({
    full_name:         '',
    birth_year:        '',
    gender:            '',
    email:             '',
    password:          '',
    phone:             '',
    otp:               '',
    address:           '',
    state:             '',
    city:              '',
    employment_status: '',
    occupation:        '',
    income_range:      '',
    nin:               '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const getAge = () => new Date().getFullYear() - parseInt(form.birth_year)

  const canProceed = () => {
    if (step === 1) {
      if (!form.full_name.trim())  { toast.error('Enter your full name');    return false }
      if (!form.birth_year)        { toast.error('Enter your birth year');   return false }
      if (getAge() < 18)           { toast.error('You must be 18 or older'); return false }
      if (parseInt(form.birth_year) < 1900 || parseInt(form.birth_year) > 2008)
                                   { toast.error('Enter a valid birth year'); return false }
      if (!form.gender)            { toast.error('Select your gender');      return false }
      return true
    }
    if (step === 2) {
      if (!form.email.trim())         { toast.error('Enter your email');           return false }
      if (!form.email.includes('@'))  { toast.error('Enter a valid email');        return false }
      if (!form.password || form.password.length < 6)
                                      { toast.error('Password min 6 characters');  return false }
      if (!form.phone.trim())         { toast.error('Enter your phone number');    return false }
      if (!form.address.trim())       { toast.error('Enter your address');         return false }
      if (!form.state)                { toast.error('Select your state');          return false }
      if (!form.city.trim())          { toast.error('Enter your city');            return false }
      return true
    }
    if (step === 3) {
      if (!form.employment_status) { toast.error('Select employment status'); return false }
      if (!form.occupation)        { toast.error('Select your occupation');   return false }
      if (!form.income_range)      { toast.error('Select income range');      return false }
      return true
    }
    if (step === 4) {
      if (!form.nin.trim() || form.nin.length !== 11)
                                   { toast.error('NIN must be exactly 11 digits'); return false }
      if (!/^\d+$/.test(form.nin)) { toast.error('NIN must contain numbers only'); return false }
      if (!videoBlob)              { toast.error('Please complete face verification'); return false }
      return true
    }
    if (step === 5) {
      if (!location) { toast.error('Please enable location to continue'); return false }
      return true
    }
    return true
  }

  const nextStep = () => {
    if (!canProceed()) return
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStep = () => {
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

const sendOTP = async () => {
  if (!form.phone.trim()) { toast.error('Enter phone number first'); return }
  setLoading(true)
  try {
    const res = await termiiSendOTP(form.phone)
    if (res.pinId) {
      setPinId(res.pinId)
      setOtpSent(true)
      toast.success('OTP sent to ' + form.phone)
    } else {
      toast.error('Failed to send OTP. Check your number.')
    }
  } catch {
    toast.error('Failed to send OTP')
  } finally {
    setLoading(false)
  }
}

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device')
      return
    }
    toast.loading('Getting your location...')
    navigator.geolocation.getCurrentPosition(
      pos => {
        toast.dismiss()
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        toast.success('Location captured ✅')
      },
      () => {
        toast.dismiss()
        toast.error('Location denied. Please enable location in your browser settings.')
      }
    )
  }

  const handleSubmit = async () => {
    if (!location) { toast.error('Please enable location first'); return }
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('Registration failed. Try again.')

      let videoUrl = null
      if (videoBlob) {
        const fileName = `face-videos/${userId}-${Date.now()}.webm`
        const { error: uploadError } = await supabase.storage
          .from('verifications')
          .upload(fileName, videoBlob, { contentType: 'video/webm' })
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('verifications')
            .getPublicUrl(fileName)
          videoUrl = urlData?.publicUrl
        }
      }

      const { error: profileError } = await supabase.from('users').insert({
        id:                userId,
        full_name:         form.full_name.trim(),
        email:             form.email.trim().toLowerCase(),
        phone:             form.phone.trim(),
        nin:               form.nin.trim(),
        face_video_url:    videoUrl,
        birth_year:        parseInt(form.birth_year),
        gender:            form.gender,
        address:           form.address.trim(),
        state:             form.state,
        city:              form.city.trim(),
        employment_status: form.employment_status,
        occupation:        form.occupation,
        income_range:      form.income_range,
        latitude:          location.lat,
        longitude:         location.lng,
        is_verified:       true,
        is_admin:          false,
        is_blacklisted:    false,
      })
      if (profileError) throw profileError

      setPreparing(true)
      await new Promise(r => setTimeout(r, 3000))
      navigate('/dashboard')

    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Preparing screen
  if (preparing) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0f0e1a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32, textAlign: 'center',
      }}>
        <motion.img src={ritaLogo} alt="logo"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fbbf24', marginBottom: 28 }}
        />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f1f0ff', marginBottom: 10 }}>
            Welcome, {form.full_name.split(' ')[0]}! 🎉
          </h2>
          <p style={{ fontSize: 14, color: '#AFA9EC', marginBottom: 32, lineHeight: 1.7 }}>
            Your account has been created successfully.<br />Preparing your dashboard...
          </p>
        </motion.div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              style={{ width: 10, height: 10, borderRadius: '50%', background: '#7F77DD' }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}
        >
          {['Creating your account...','Setting up your profile...','Preparing your dashboard...'].map((msg, i) => (
            <motion.div key={msg}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.6 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 1 + i * 0.6 }}
                style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7F77DD, #534AB7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#fff', flexShrink: 0,
                }}
              >✓</motion.div>
              <span style={{ fontSize: 13, color: '#AFA9EC' }}>{msg}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0e1a', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src={ritaLogo} alt="logo"
            style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fbbf24', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          />
          <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, letterSpacing: '0.15em', marginTop: 6 }}>
            RITA LIGHT WEALTH CIRCLE™
          </div>
        </div>

        {/* Step Progress Bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            {STEPS.map(s => (
              <div key={s.number} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: step > s.number
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : step === s.number
                    ? 'linear-gradient(135deg, #7F77DD, #534AB7)'
                    : '#1f1d35',
                  border: step >= s.number ? 'none' : '1px solid #3C3489',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: step >= s.number ? '#fff' : '#534AB7',
                  transition: 'all 0.3s',
                }}>
                  {step > s.number ? '✓' : s.number}
                </div>
                <div style={{
                  fontSize: 9, marginTop: 4,
                  color: step === s.number ? '#7F77DD' : '#534AB7',
                  fontWeight: step === s.number ? 600 : 400,
                }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 3, background: '#1f1d35', borderRadius: 2, marginTop: 4 }}>
            <motion.div
              animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.4 }}
              style={{ height: '100%', background: 'linear-gradient(90deg, #7F77DD, #fbbf24)', borderRadius: 2 }}
            />
          </div>
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            style={{ background: '#1a1830', border: '1px solid #2a2840', borderRadius: 24, padding: '28px 24px' }}
          >

            {/* ── STEP 1 */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f0ff', marginBottom: 4 }}>Personal Information</h2>
                <p style={{ fontSize: 13, color: '#AFA9EC', marginBottom: 24 }}>Tell us about yourself. You must be 18 or older.</p>

                <Field label="Full name (as on your NIN)">
                  <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="e.g. James Okafor" />
                </Field>

                <Field label="Year of birth">
                  <input type="number" value={form.birth_year} onChange={e => set('birth_year', e.target.value)}
                    placeholder="e.g. 1995" min="1900" max="2008" />
                  {form.birth_year && parseInt(form.birth_year) > 1900 && (
                    <div style={{ marginTop: 6, fontSize: 12, color: getAge() >= 18 ? '#22c55e' : '#ef4444' }}>
                      {getAge() >= 18 ? `✓ Age ${getAge()} — eligible` : `✗ Age ${getAge()} — must be 18+`}
                    </div>
                  )}
                </Field>

                <Field label="Gender">
                  <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Prefer not to say</option>
                  </select>
                </Field>
              </div>
            )}

            {/* ── STEP 2 */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f0ff', marginBottom: 4 }}>Contact & Address</h2>
                <p style={{ fontSize: 13, color: '#AFA9EC', marginBottom: 24 }}>Your contact details and home address.</p>

                <Field label="Email address">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="james@email.com" />
                </Field>

                <Field label="Password (min. 6 characters)">
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Create a strong password" />
                </Field>

                <Field label="Phone number">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)}
                      placeholder="+234 800 000 0000" style={{ flex: 1 }} />
                    <button onClick={sendOTP} disabled={loading}
                      style={{
                        background: 'linear-gradient(135deg, #7F77DD, #534AB7)',
                        border: 'none', color: '#fff',
                        padding: '0 14px', borderRadius: 12,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}>
                      {otpSent ? 'Resend' : 'Send OTP'}
                    </button>
                  </div>
                </Field>

                {otpSent && (
                  <Field label="Enter OTP code">
                    <input type="text" value={form.otp} onChange={e => set('otp', e.target.value)}
                      placeholder="6-digit code" maxLength={6} />
                    {form.otp && <div style={{ marginTop: 6, fontSize: 12, color: '#22c55e' }}>✓ OTP entered</div>}
                  </Field>
                )}

                <Field label="Home address">
                  <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 12 Broad Street, Ikoyi" />
                </Field>

                <Field label="State">
                  <select value={form.state} onChange={e => set('state', e.target.value)}>
                    <option value="">Select your state</option>
                    {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>

                <Field label="City / Area">
                  <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Ikoyi" />
                </Field>
              </div>
            )}

            {/* ── STEP 3 */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f0ff', marginBottom: 4 }}>Source of Income</h2>
                <p style={{ fontSize: 13, color: '#AFA9EC', marginBottom: 24 }}>This helps us match you to the right savings circle.</p>

                <Field label="Employment status">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                    {['Employed','Self-Employed','Business Owner','Student','Unemployed','Other'].map(opt => (
                      <button key={opt} onClick={() => set('employment_status', opt)}
                        style={{
                          padding: '10px 8px', borderRadius: 10,
                          fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'center',
                          background: form.employment_status === opt ? 'linear-gradient(135deg, #7F77DD, #534AB7)' : '#1f1d35',
                          border: form.employment_status === opt ? 'none' : '1px solid #3C3489',
                          color: form.employment_status === opt ? '#fff' : '#AFA9EC',
                          transition: 'all 0.2s',
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                </Field>

                <Field label="Occupation / What do you do?">
                  <select value={form.occupation} onChange={e => set('occupation', e.target.value)}>
                    <option value="">Select occupation</option>
                    {OCCUPATIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </Field>

                <Field label="Monthly income range">
                  <select value={form.income_range} onChange={e => set('income_range', e.target.value)}>
                    <option value="">Select income range</option>
                    {INCOME_RANGES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Field>

                <div style={{
                  background: '#1f1d35', border: '1px solid #2a2840',
                  borderRadius: 12, padding: 14, marginTop: 8,
                  fontSize: 12, color: '#7F77DD', lineHeight: 1.6,
                }}>
                  🔒 Your income information is kept private and only visible to the admin.
                </div>
              </div>
            )}

            {/* ── STEP 4 */}
            {step === 4 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f0ff', marginBottom: 4 }}>NIN & Face Verification</h2>
                <p style={{ fontSize: 13, color: '#AFA9EC', marginBottom: 24 }}>
                  Your NIN and face video will be used to confirm your identity.
                </p>

                <Field label="NIN (National Identification Number — 11 digits)">
                  <input
                    type="text"
                    value={form.nin}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                      set('nin', val)
                    }}
                    placeholder="e.g. 12345678901"
                    maxLength={11}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{ fontSize: 11, color: form.nin.length === 11 ? '#22c55e' : '#534AB7' }}>
                      {form.nin.length === 11 ? '✓ NIN looks good' : `${form.nin.length}/11 digits`}
                    </span>
                  </div>
                </Field>

                {/* ── FACE VERIFICATION */}
                <div style={{ marginTop: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#AFA9EC', marginBottom: 10, fontWeight: 600 }}>
                    Face Verification
                  </div>
                  <div style={{
                    background: '#1f1d35', border: '1px solid #2a2840',
                    borderRadius: 12, padding: 14, marginBottom: 14,
                    fontSize: 12, color: '#AFA9EC', lineHeight: 1.7,
                  }}>
                    📹 Follow the instructions on screen. The camera will guide you automatically!
                  </div>
                  <FaceVerificationCamera
                    onComplete={(blob) => {
                      setVideoBlob(blob)
                      const url = URL.createObjectURL(blob)
                      setVideoURL(url)
                    }}
                    onRetake={() => {
                      setVideoBlob(null)
                      setVideoURL(null)
                    }}
                    videoBlob={videoBlob}
                  />
                </div>

                <div style={{
                  background: '#1f1d35', border: '1px solid #2a2840',
                  borderRadius: 12, padding: 14,
                  fontSize: 11, color: '#534AB7', lineHeight: 1.6,
                }}>
                  🔒 Your face video is stored securely and only viewed by the admin for identity verification.
                </div>
              </div>
            )}

            {/* ── STEP 5 */}
            {step === 5 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f0ff', marginBottom: 4 }}>Enable Location</h2>
                <p style={{ fontSize: 13, color: '#AFA9EC', marginBottom: 24 }}>
                  Location is required to join any savings circle. This helps protect all members from fraud.
                </p>

                <div style={{
                  background: '#1f1d35', border: '1px solid #2a2840',
                  borderRadius: 16, padding: 20, marginBottom: 20,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f0ff', marginBottom: 12 }}>
                    Why do we need your location?
                  </div>
                  {[
                    { icon: '🛡️', text: 'Protects all members from scammers' },
                    { icon: '📍', text: 'Recorded once at registration' },
                    { icon: '🔒', text: 'Only the admin can see your location' },
                    { icon: '⚖️', text: 'Used only in case of fraud or dispute' },
                  ].map(item => (
                    <div key={item.text} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      <span style={{ fontSize: 13, color: '#AFA9EC' }}>{item.text}</span>
                    </div>
                  ))}
                </div>

                {!location ? (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={getLocation}
                    style={{
                      width: '100%', padding: '16px',
                      background: 'linear-gradient(135deg, #7F77DD, #534AB7)',
                      border: 'none', color: '#fff',
                      borderRadius: 14, fontSize: 15,
                      fontWeight: 700, cursor: 'pointer', marginBottom: 16,
                    }}
                  >📍 Enable My Location</motion.button>
                ) : (
                  <div style={{
                    background: '#052e16', border: '1px solid #166534',
                    borderRadius: 14, padding: 16, marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ fontSize: 28 }}>✅</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>Location captured!</div>
                      <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{
                  background: '#1f1d35', border: '1px solid #2a2840',
                  borderRadius: 12, padding: 14,
                  fontSize: 12, color: '#AFA9EC', lineHeight: 1.7,
                }}>
                  By completing registration you agree to our{' '}
                  <span style={{ color: '#7F77DD', cursor: 'pointer' }} onClick={() => navigate('/')}>Terms & Conditions</span>
                  {' '}and{' '}
                  <span style={{ color: '#7F77DD', cursor: 'pointer' }} onClick={() => navigate('/')}>Privacy Policy</span>.
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          {step > 1 && (
            <button onClick={prevStep}
              style={{
                flex: 1, padding: '14px',
                background: '#1a1830', border: '1px solid #2a2840',
                color: '#AFA9EC', borderRadius: 14,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>← Back</button>
          )}
          {step < 5 ? (
            <motion.button whileTap={{ scale: 0.97 }} onClick={nextStep}
              style={{
                flex: 2, padding: '14px',
                background: 'linear-gradient(135deg, #7F77DD, #534AB7)',
                border: 'none', color: '#fff', borderRadius: 14,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Continue →</motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={loading || !location}
              style={{
                flex: 2, padding: '14px',
                background: loading ? '#2a2840' : 'linear-gradient(135deg, #fbbf24, #d97706)',
                border: 'none',
                color: loading ? '#534AB7' : '#3a1f00',
                borderRadius: 14, fontSize: 14,
                fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? 'Creating account...' : 'Create Account ✦'}
            </motion.button>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#534AB7', marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#7F77DD', fontWeight: 600, textDecoration: 'none' }}>Login here</Link>
        </p>

      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#AFA9EC', marginBottom: 6, letterSpacing: '0.02em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
