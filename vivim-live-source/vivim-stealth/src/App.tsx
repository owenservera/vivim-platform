import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundCanvas } from './BackgroundCanvas';
import './index.css';

function App() {
  const [stage, setStage] = useState(0);

  // Cinematic sequence orchestration
  useEffect(() => {
    // Stage 1: Reveal logo
    const t1 = setTimeout(() => setStage(1), 800);
    // Stage 2: Present Motto
    const t2 = setTimeout(() => setStage(2), 2500);
    // Stage 3: Show context line
    const t3 = setTimeout(() => setStage(3), 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <>
      <div className="ambient-sphere sphere-1" />
      <div className="ambient-sphere sphere-2" />
      <div className="ambient-sphere sphere-3" />
      
      <BackgroundCanvas />
      
      <div className="noise-overlay" />

      {/* Main Container */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        
        {/* Enigmatic Logo Presentation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)' }}
          animate={{ 
            opacity: stage >= 1 ? 1 : 0, 
            scale: stage >= 1 ? 1 : 0.95, 
            y: stage >= 1 ? 0 : 20, 
            filter: stage >= 1 ? 'blur(0px)' : 'blur(10px)' 
          }}
          transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            marginBottom: '4rem'
          }}
        >
          <motion.div
            animate={{ 
              boxShadow: ['0 0 20px rgba(0, 212, 232, 0.05)', '0 0 40px rgba(255, 45, 110, 0.1)', '0 0 20px rgba(0, 212, 232, 0.05)']
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              borderRadius: '30px',
              padding: '4px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.05)',
              overflow: 'hidden'
            }}
          >
            <img 
              src="/v.jpg" 
              alt="VIVIM" 
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '26px',
                display: 'block',
                mixBlendMode: 'luminosity'
              }} 
            />
          </motion.div>
          
          {/* Pulsing halo */}
          <motion.div
            animate={{ scale: [1, 1.4], opacity: [0.2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '0', left: '0', right: '0', bottom: '0',
              borderRadius: '30px',
              background: 'var(--vivim-cyan)',
              zIndex: -1,
              filter: 'blur(20px)' // Note: This blur handles the halo glow effect
            }}
          />
        </motion.div>

        {/* The Motto / Vision */}
        <div style={{ textAlign: 'center', perspective: '1000px' }}>
          <motion.div
            initial={{ opacity: 0, rotateX: 15, y: 15 }}
            animate={{ 
              opacity: stage >= 2 ? 1 : 0, 
              rotateX: stage >= 2 ? 0 : 15, 
              y: stage >= 2 ? 0 : 15 
            }}
            transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
              fontWeight: 200,
              letterSpacing: '0.15em',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '1rem'
            }}
          >
            <motion.span whileHover={{ color: '#fff' }}>OWN</motion.span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
            <motion.span whileHover={{ color: '#fff' }}>SHARE</motion.span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
            <motion.span whileHover={{ color: '#fff' }}>EVOLVE</motion.span>
          </motion.div>

          <motion.h1
            className="gradient-text"
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
            animate={{ 
              opacity: stage >= 2 ? 1 : 0, 
              scale: stage >= 2 ? 1 : 0.98, 
              filter: stage >= 2 ? 'blur(0px)' : 'blur(5px)' 
            }}
            transition={{ duration: 1.8, delay: stage >= 2 ? 0.2 : 0, ease: 'easeOut' }}
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              margin: 0
            }}
          >
            YOUR AI
          </motion.h1>

          {/* Context / Subliminal message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: stage >= 3 ? 1 : 0, 
              y: stage >= 3 ? 0 : 10 
            }}
            transition={{ duration: 1.5, delay: stage >= 3 ? 0.3 : 0, ease: 'easeOut' }}
            style={{
              marginTop: '4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center'
            }}
          >
            <div style={{
              height: '40px',
              width: '1px',
              background: 'linear-gradient(to bottom, transparent, rgba(0, 212, 232, 0.5), transparent)'
            }} />
            
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 300,
              fontSize: '0.9rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)'
            }}>
              The Sovereign Knowledge Architecture
            </p>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 200,
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.2)'
            }}>
              INITIALIZING...
            </p>
          </motion.div>
        </div>

      </main>
    </>
  );
}

export default App;
