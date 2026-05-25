// ── Replace the entire Step 4 face video section in Register.jsx
// Find: {/* ── STEP 4 — NIN & Face Video */}
// Replace the video recording part with this component

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const INSTRUCTIONS = [
  { text: 'Look straight at the camera', icon: '👁️', duration: 2500 },
  { text: 'Slowly turn your head LEFT', icon: '⬅️', duration: 2500 },
  { text: 'Slowly turn your head RIGHT', icon: '➡️', duration: 2500 },
  { text: 'Nod your head once', icon: '⬇️', duration: 2000 },
  { text: 'Look straight again', icon: '✅', duration: 1500 },
]

export function FaceVerificationCamera({ onComplete, onRetake, videoBlob }) {
  const videoRef   = useRef(null)
  const mediaRef   = useRef(null)
  const chunksRef  = useRef([])

  const [phase, setPhase]         = useState('idle') 
  // idle | countdown | recording | done
  const [countdown, setCountdown] = useState(3)
  const [stepIndex, setStepIndex] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const [cameraReady, setCameraReady]   = useState(false)
  const [videoURL, setVideoURL]         = useState(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 320, height: 240 },
        audio: false,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraReady(true)
      }
    } catch {
      alert('Camera access denied. Please allow camera in your browser settings.')
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    stream?.getTracks().forEach(t => t.stop())
  }

  // ── Start countdown then record
  const handleStart = () => {
    setPhase('countdown')
    setCountdown(3)
    let count = 3
    const timer = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count === 0) {
        clearInterval(timer)
        startRecording()
      }
    }, 1000)
  }

  const startRecording = () => {
    setPhase('recording')
    setStepIndex(0)
    setStepProgress(0)
    chunksRef.current = []

    const stream = videoRef.current?.srcObject
    if (!stream) return

    mediaRef.current = new MediaRecorder(stream)
    mediaRef.current.ondataavailable = e => chunksRef.current.push(e.data)
    mediaRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url  = URL.createObjectURL(blob)
      setVideoURL(url)
      setPhase('done')
      stopCamera()
      onComplete(blob)
    }
    mediaRef.current.start()

    // Run through instructions automatically
    let elapsed = 0
    let idx     = 0
    INSTRUCTIONS.forEach((instr, i) => {
      setTimeout(() => {
        setStepIndex(i)
        setStepProgress(0)
        idx = i
      }, elapsed)
      elapsed += instr.duration
    })

    // Stop after all instructions
    setTimeout(() => {
      if (mediaRef.current?.state === 'recording') {
        mediaRef.current.stop()
      }
    }, elapsed)
  }

  const handleRetake = () => {
    setPhase('idle')
    setVideoURL(null)
    setStepIndex(0)
    onRetake()
    startCamera()
  }

  const totalDuration = INSTRUCTIONS.reduce((s, i) => s + i.duration, 0)
  const elapsedBefore = INSTRUCTIONS.slice(0, stepIndex).reduce((s, i) => s + i.duration, 0)
  const overallProgress = phase === 'recording'
    ? Math.min(100, (elapsedBefore / totalDuration) * 100)
    : phase === 'done' ? 100 : 0

  return (
    <div>
      {/* Camera / Video box */}
      <div style={{
        borderRadius: 20, overflow: 'hidden',
        background: '#000',
        aspectRatio: '4/3',
        position: 'relative',
        marginBottom: 14,
        border: phase === 'recording'
          ? '2px solid #7F77DD'
          : phase === 'done'
          ? '2px solid #22c55e'
          : '1px solid #2a2840',
      }}>
        {/* Live camera feed */}
        <video ref={videoRef} muted playsInline
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            display: phase === 'done' ? 'none' : 'block',
            transform: 'scaleX(-1)', // mirror
          }}
        />

        {/* Done — show recorded video */}
        {phase === 'done' && videoURL && (
          <video src={videoURL} controls
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {/* Countdown overlay */}
        <AnimatePresence>
          {phase === 'countdown' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                style={{
                  fontSize: 72, fontWeight: 900,
                  color: '#7F77DD',
                  lineHeight: 1,
                }}
              >{countdown === 0 ? 'GO!' : countdown}</motion.div>
              <div style={{ fontSize: 14, color: '#AFA9EC', marginTop: 12 }}>
                Get ready...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording — instruction overlay */}
        <AnimatePresence>
          {phase === 'recording' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                padding: '24px 16px 16px',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 6 }}>
                    {INSTRUCTIONS[stepIndex]?.icon}
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: '#fff', lineHeight: 1.4,
                  }}>
                    {INSTRUCTIONS[stepIndex]?.text}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REC indicator */}
        {phase === 'recording' && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: '#ef4444', borderRadius: 20,
            padding: '4px 10px', fontSize: 11,
            color: '#fff', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <motion.div
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}
            />
            REC
          </div>
        )}

        {/* Face guide oval */}
        {(phase === 'idle' || phase === 'countdown') && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              width: 140, height: 180,
              border: '2px dashed rgba(127,119,221,0.5)',
              borderRadius: '50%',
            }} />
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      {phase === 'recording' && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 4, background: '#1f1d35', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.3 }}
              style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, #7F77DD, #fbbf24)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#534AB7' }}>
              Step {stepIndex + 1} of {INSTRUCTIONS.length}
            </span>
            <span style={{ fontSize: 10, color: '#534AB7' }}>
              {Math.round(overallProgress)}%
            </span>
          </div>
        </div>
      )}

      {/* Step dots */}
      {phase === 'recording' && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
          {INSTRUCTIONS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width:      i === stepIndex ? 20 : 8,
                background: i < stepIndex
                  ? '#22c55e'
                  : i === stepIndex
                  ? '#7F77DD'
                  : '#2a2840',
              }}
              style={{ height: 8, borderRadius: 4 }}
            />
          ))}
        </div>
      )}

      {/* Done state */}
      {phase === 'done' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: '#052e16', border: '1px solid #166534',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            marginBottom: 12,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}
          >✓</motion.div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
              Verification Complete!
            </div>
            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>
              Your face video has been recorded successfully
            </div>
          </div>
        </motion.div>
      )}

      {/* Buttons */}
      {phase === 'idle' && cameraReady && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          style={{
            width: '100%', padding: '13px',
            background: 'linear-gradient(135deg, #7F77DD, #534AB7)',
            border: 'none', color: '#fff',
            borderRadius: 12, fontSize: 14,
            fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
          }}
        >
          ▶ Start Face Verification
        </motion.button>
      )}

      {phase === 'idle' && !cameraReady && (
        <div style={{
          textAlign: 'center', padding: '12px',
          fontSize: 13, color: '#534AB7',
        }}>
          Starting camera...
        </div>
      )}

      {phase === 'done' && (
        <button onClick={handleRetake}
          style={{
            background: 'none', border: 'none',
            color: '#7F77DD', fontSize: 12,
            cursor: 'pointer', fontWeight: 600,
            display: 'block', margin: '0 auto',
          }}>
          ↺ Retake verification
        </button>
      )}
    </div>
  )
}
