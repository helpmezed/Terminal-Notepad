import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface OrbAvatarProps {
  darkMode?: boolean;
  isTyping?: boolean;
  isSpeaking?: boolean;
  isScrambled?: boolean;
  wireframeEnabled?: boolean;
}

const CX = 100, CY = 100;
const R_HELM = 90;   // outer helmet ring
const R_VISOR = 74;  // visor face
const EYE_CX = 100, EYE_CY = 88; // eye is slightly above center
const R_EYE = 36;    // iris outer
const R_PUPIL = 18;  // hexagonal pupil
const MOUTH_Y = 147; // mouth row

function hexPoints(cx: number, cy: number, r: number, rotDeg = 0): string {
  return Array.from({ length: 6 }).map((_, i) => {
    const a = ((i * 60 + rotDeg) * Math.PI) / 180;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = startDeg * Math.PI / 180;
  const e = endDeg * Math.PI / 180;
  const x1 = cx + r * Math.cos(s - Math.PI / 2);
  const y1 = cy + r * Math.sin(s - Math.PI / 2);
  const x2 = cx + r * Math.cos(e - Math.PI / 2);
  const y2 = cy + r * Math.sin(e - Math.PI / 2);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
}

export default function OrbAvatar({
  isTyping = false,
  isSpeaking = false,
  isScrambled = false,
  wireframeEnabled = false,
}: OrbAvatarProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [segOpacities, setSegOpacities] = useState<number[]>(Array(12).fill(0.08));
  const [waveIds, setWaveIds] = useState<number[]>([]);
  const [mouthBars, setMouthBars] = useState<number[]>(Array(9).fill(0.15));
  const waveCounter = useRef(0);
  const blinkTimer = useRef<ReturnType<typeof setTimeout>>();

  const color = isScrambled ? '#ec4899' : '#00ff41';
  const dimColor = isScrambled ? 'rgba(236,72,153,0.12)' : 'rgba(0,255,65,0.1)';

  // Blink scheduler
  useEffect(() => {
    const scheduleBlink = () => {
      blinkTimer.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, isScrambled ? 80 : 140);
      }, isScrambled ? 800 + Math.random() * 1200 : 2500 + Math.random() * 4000);
    };
    scheduleBlink();
    return () => clearTimeout(blinkTimer.current);
  }, [isScrambled]);

  // Iris segment activity
  useEffect(() => {
    const active = isTyping ? 8 : isSpeaking ? 10 : isScrambled ? 6 : 2;
    const speed = isTyping ? 130 : isSpeaking ? 90 : isScrambled ? 200 : 900;
    const interval = setInterval(() => {
      setSegOpacities(() => {
        const arr = Array(12).fill(0.07);
        Array.from({ length: 12 }, (_, i) => i)
          .sort(() => Math.random() - 0.5)
          .slice(0, active + Math.floor(Math.random() * 3))
          .forEach(i => { arr[i] = 0.35 + Math.random() * 0.65; });
        return arr;
      });
    }, speed);
    return () => clearInterval(interval);
  }, [isTyping, isSpeaking, isScrambled]);

  // Speaking waves
  useEffect(() => {
    if (!isSpeaking) { setWaveIds([]); return; }
    const iv = setInterval(() => {
      const id = waveCounter.current++;
      setWaveIds(prev => [...prev, id]);
      setTimeout(() => setWaveIds(prev => prev.filter(w => w !== id)), 2000);
    }, 650);
    return () => clearInterval(iv);
  }, [isSpeaking]);

  // Mouth bars
  useEffect(() => {
    const iv = setInterval(() => {
      setMouthBars(Array(9).fill(0).map(() =>
        isSpeaking ? 0.2 + Math.random() * 0.8
        : isTyping  ? 0.1 + Math.random() * 0.35
        : 0.08 + Math.random() * 0.06
      ));
    }, isSpeaking ? 80 : isTyping ? 150 : 600);
    return () => clearInterval(iv);
  }, [isSpeaking, isTyping]);

  const scanDuration = isTyping ? 1.8 : isSpeaking ? 2.5 : 7;
  const irisRotDuration = isTyping ? 4 : isSpeaking ? 6 : 14;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: 110, height: 120 }}>
      <motion.svg
        viewBox="0 0 200 210"
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
        animate={isScrambled ? { x: [0, -2, 2, -1, 1, 0] } : { x: 0 }}
        transition={isScrambled ? { repeat: Infinity, duration: 0.12 } : {}}
      >
        <defs>
          <radialGradient id="visor-bg" cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor={color} stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="pupil-fill" cx="38%" cy="35%" r="65%">
            <stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </radialGradient>
          <radialGradient id="helm-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.04" />
            <stop offset="85%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── HELMET / OUTER SHELL ── */}
        <circle cx={CX} cy={CY} r={R_HELM} fill="url(#helm-bg)" />

        {/* Helmet ring */}
        <circle cx={CX} cy={CY} r={R_HELM}
          fill="none" stroke={color} strokeWidth="1.5" opacity="0.35" />

        {/* Tick marks on helmet */}
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i * 10 - 90) * Math.PI / 180;
          const isLong = i % 3 === 0;
          const r1 = R_HELM - (isLong ? 6 : 3);
          const r2 = R_HELM;
          return (
            <line key={i}
              x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)}
              x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)}
              stroke={color} strokeWidth={isLong ? "1" : "0.5"}
              opacity={isLong ? 0.4 : 0.2}
            />
          );
        })}

        {/* ── ANTENNAS ── */}
        {[-22, 22].map((offset, i) => {
          const baseX = CX + offset;
          const baseY = CY - R_HELM + 4;
          const tipX = baseX + (i === 0 ? -6 : 6);
          const tipY = baseY - 16;
          const isActive = i === 0 ? isTyping : isSpeaking;
          return (
            <g key={i}>
              <line x1={baseX} y1={baseY} x2={tipX} y2={tipY}
                stroke={color} strokeWidth="1.2" opacity="0.5" />
              <motion.circle cx={tipX} cy={tipY} r={3.5}
                fill={isActive ? color : 'none'}
                stroke={color} strokeWidth="1"
                animate={{ opacity: isActive ? [0.6, 1, 0.6] : 0.3, r: isActive ? [3.5, 4.5, 3.5] : 3.5 }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              />
              {isActive && (
                <motion.circle cx={tipX} cy={tipY} r={3.5}
                  fill="none" stroke={color} strokeWidth="0.8"
                  initial={{ r: 3.5, opacity: 0.6 }}
                  animate={{ r: 10, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'easeOut' }}
                />
              )}
            </g>
          );
        })}

        {/* ── VISOR / FACE ── */}
        <circle cx={CX} cy={CY} r={R_VISOR} fill="url(#visor-bg)" />
        <circle cx={CX} cy={CY} r={R_VISOR}
          fill="none" stroke={color} strokeWidth="1" opacity="0.25" />

        {/* Visor inner edge highlight */}
        <circle cx={CX} cy={CY} r={R_VISOR - 3}
          fill="none" stroke={color} strokeWidth="0.4"
          strokeDasharray="1 5" opacity="0.15" />

        {/* Ear panels */}
        {[-1, 1].map(side => (
          <g key={side}>
            <rect
              x={CX + side * (R_VISOR - 1) - (side > 0 ? 0 : 8)} y={CY - 10}
              width={8} height={20} rx={1}
              fill="none" stroke={color} strokeWidth="0.8" opacity="0.25"
            />
            {[0, 1, 2].map(j => (
              <motion.rect key={j}
                x={CX + side * (R_VISOR - 1) - (side > 0 ? -2 : 6)}
                y={CY - 6 + j * 6}
                width={4} height={3} rx={0.5}
                fill={color}
                animate={{ opacity: Math.random() > 0.5 ? [0.2, 0.7, 0.2] : [0.6, 0.2, 0.6] }}
                transition={{ repeat: Infinity, duration: 0.8 + j * 0.3 }}
              />
            ))}
          </g>
        ))}

        {/* ── EYE COMPLEX ── */}

        {/* Speaking ripples from eye */}
        <AnimatePresence>
          {waveIds.map(id => (
            <motion.circle key={id} cx={EYE_CX} cy={EYE_CY} r={R_EYE}
              fill="none" stroke={color} strokeWidth="0.6"
              initial={{ r: R_EYE, opacity: 0.5 }}
              animate={{ r: R_EYE + 40, opacity: 0 }}
              exit={{}}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        {/* Eye socket background */}
        <circle cx={EYE_CX} cy={EYE_CY} r={R_EYE + 4} fill="#000" opacity="0.5" />

        {/* Iris activity segments */}
        {Array.from({ length: 12 }).map((_, i) => {
          const segDeg = 360 / 12;
          return (
            <motion.path key={i}
              d={arcPath(EYE_CX, EYE_CY, R_EYE, i * segDeg + 1, (i + 1) * segDeg - 1)}
              fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
              animate={{ opacity: segOpacities[i] }}
              transition={{ duration: 0.12 }}
            />
          );
        })}

        {/* Iris outer ring - rotating */}
        <motion.circle cx={EYE_CX} cy={EYE_CY} r={R_EYE}
          fill="none" stroke={color} strokeWidth="0.6"
          strokeDasharray="5 3" opacity="0.3"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: irisRotDuration, ease: 'linear' }}
          style={{ originX: `${EYE_CX}px`, originY: `${EYE_CY}px` }}
        />

        {/* Scan sweep */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: scanDuration, ease: 'linear' }}
          style={{ originX: `${EYE_CX}px`, originY: `${EYE_CY}px` }}
        >
          {[0.25, 0.15, 0.08].map((op, i) => (
            <line key={i}
              x1={EYE_CX} y1={EYE_CY}
              x2={EYE_CX} y2={EYE_CY - R_EYE + 1}
              stroke={color} strokeWidth="0.5" opacity={op}
              transform={`rotate(${-(i + 1) * 12} ${EYE_CX} ${EYE_CY})`}
            />
          ))}
          <line x1={EYE_CX} y1={EYE_CY} x2={EYE_CX} y2={EYE_CY - R_EYE + 1}
            stroke={color} strokeWidth="1" opacity="0.6" />
          <circle cx={EYE_CX} cy={EYE_CY - R_EYE + 3} r={1.5} fill={color} opacity="0.9" />
        </motion.g>

        {/* Inner iris ring - counter rotate */}
        <motion.circle cx={EYE_CX} cy={EYE_CY} r={R_EYE - 10}
          fill="none" stroke={color} strokeWidth="0.5"
          strokeDasharray="3 6" opacity="0.25"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: irisRotDuration * 0.7, ease: 'linear' }}
          style={{ originX: `${EYE_CX}px`, originY: `${EYE_CY}px` }}
        />

        {/* Pupil hexagon */}
        <motion.polygon
          points={hexPoints(EYE_CX, EYE_CY, R_PUPIL, 0)}
          fill="url(#pupil-fill)"
          stroke={color} strokeWidth="1.5"
          animate={{
            scale: isSpeaking ? [1, 1.18, 0.9, 1.12, 1] : isTyping ? [1, 1.06, 0.97, 1] : [1, 1.03, 1],
          }}
          transition={{ repeat: Infinity, duration: isSpeaking ? 0.38 : isTyping ? 0.35 : 2.5 }}
          style={{ originX: `${EYE_CX}px`, originY: `${EYE_CY}px` }}
        />

        {/* Inner hex - counter-rotating */}
        <motion.polygon
          points={hexPoints(EYE_CX, EYE_CY, R_PUPIL * 0.55, 30)}
          fill="none" stroke={color} strokeWidth="0.8" opacity="0.5"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          style={{ originX: `${EYE_CX}px`, originY: `${EYE_CY}px` }}
        />

        {/* Pupil center dot */}
        <motion.circle cx={EYE_CX} cy={EYE_CY} r={4}
          fill={color}
          animate={{
            r: isSpeaking ? [4, 7, 4] : isTyping ? [4, 5.5, 4] : [4, 4.5, 4],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{ repeat: Infinity, duration: isSpeaking ? 0.28 : isTyping ? 0.5 : 1.8 }}
        />

        {/* Pupil highlight */}
        <ellipse cx={EYE_CX - 6} cy={EYE_CY - 6} rx={3} ry={2}
          fill={color} opacity="0.4"
          transform="rotate(-30, 94, 82)"
        />

        {/* ── EYELID BLINK ── */}
        <AnimatePresence>
          {isBlinking && (
            <>
              <motion.rect
                x={EYE_CX - R_EYE - 4} y={EYE_CY - R_EYE - 4}
                width={(R_EYE + 4) * 2} height={R_EYE + 4}
                fill="#08090a"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0 }}
                transition={{ duration: 0.07 }}
                style={{ originX: `${EYE_CX}px`, originY: `${EYE_CY - R_EYE - 4}px` }}
              />
              <motion.rect
                x={EYE_CX - R_EYE - 4} y={EYE_CY}
                width={(R_EYE + 4) * 2} height={R_EYE + 4}
                fill="#08090a"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                exit={{ scaleY: 0 }}
                transition={{ duration: 0.07 }}
                style={{ originX: `${EYE_CX}px`, originY: `${EYE_CY + R_EYE + 4}px` }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ── WIREFRAME OVERLAY ── */}
        <AnimatePresence>
          {wireframeEnabled && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[-20, -6, 6, 20].map(o => (
                <g key={o}>
                  <line x1={CX + o} y1={CY - R_VISOR} x2={CX + o} y2={CY + R_VISOR}
                    stroke={color} strokeWidth="0.25" opacity="0.2" />
                  <line x1={CX - R_VISOR} y1={CY + o} x2={CX + R_VISOR} y2={CY + o}
                    stroke={color} strokeWidth="0.25" opacity="0.2" />
                </g>
              ))}
              <circle cx={CX} cy={CY} r={R_VISOR * 0.5}
                fill="none" stroke={color} strokeWidth="0.25" opacity="0.15" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── MOUTH / AUDIO DISPLAY ── */}
        <rect x={66} y={MOUTH_Y - 10} width={68} height={20} rx={3}
          fill="#000" opacity="0.4" />
        <rect x={66} y={MOUTH_Y - 10} width={68} height={20} rx={3}
          fill="none" stroke={color} strokeWidth="0.6" opacity="0.2" />

        {mouthBars.map((h, i) => {
          const bw = 4, gap = 3.5;
          const bx = 68 + i * (bw + gap);
          const maxH = 14;
          const bh = Math.max(2, h * maxH);
          return (
            <motion.rect key={i}
              x={bx} rx={1}
              width={bw}
              animate={{ height: bh, y: MOUTH_Y - bh / 2 }}
              transition={{ duration: 0.1 }}
              fill={color}
              opacity={isSpeaking ? 0.7 + h * 0.3 : isTyping ? 0.4 : 0.2}
            />
          );
        })}

        {/* ── HUD READOUTS ── */}
        {/* Bottom label */}
        <text x={CX} y={CY + R_VISOR - 6}
          textAnchor="middle"
          fontSize="6" fontFamily="monospace"
          fill={color} opacity="0.3" letterSpacing="2">
          {isScrambled ? 'ENC//XOR' : isTyping ? 'IO//ACTIVE' : isSpeaking ? 'PCM//OUT' : 'IDLE//STD'}
        </text>
      </motion.svg>
    </div>
  );
}
