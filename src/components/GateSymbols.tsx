import React from 'react';
import { NodeType } from '../types';
import { decodeSevenSegment } from '../utils/circuitSolver';

interface GateSymbolProps {
  type: NodeType;
  width: number;
  height: number;
  isActive: boolean;
  state?: any;
  inputs?: boolean[];
  theme?: 'dark' | 'light';
}

export const GateSymbol: React.FC<GateSymbolProps> = ({
  type,
  width,
  height,
  isActive,
  state,
  inputs = [],
  theme = 'light',
}) => {
  // Adaptive color palette: Pure white in light mode / dark slate in dark mode
  const isDark = theme === 'dark';
  const strokeColor = isDark ? '#f8fafc' : '#111827';
  const bodyColor = isDark ? '#1e293b' : '#ffffff';
  const highSignalColor = isDark ? '#38bdf8' : '#0284c7';
  const lowSignalColor = isDark ? '#64748b' : '#374151';
  const inputCount = state?.inputCount || (inputs.length > 2 ? inputs.length : 2);

  // Helper to get lead color
  const getLeadColor = (val?: boolean) => (val ? highSignalColor : lowSignalColor);

  switch (type) {
    case 'AND': {
      // D-shape with 2, 3, or 4 inputs
      const is3 = inputCount === 3;
      const is4 = inputCount === 4;
      return (
        <svg width={width} height={height} viewBox="0 0 110 72" className="overflow-visible">
          {/* Main D-shape Body */}
          <path
            d="M 24 12 L 52 12 A 24 24 0 0 1 52 60 L 24 60 Z"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Input Lead Stubs */}
          {!is3 && !is4 && (
            <>
              <line x1="2" y1="22" x2="24" y2="22" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="50" x2="24" y2="50" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
            </>
          )}
          {is3 && (
            <>
              <line x1="2" y1="18" x2="24" y2="18" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="36" x2="24" y2="36" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
              <line x1="2" y1="54" x2="24" y2="54" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
            </>
          )}
          {is4 && (
            <>
              <line x1="2" y1="16" x2="24" y2="16" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="30" x2="24" y2="30" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
              <line x1="2" y1="42" x2="24" y2="42" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
              <line x1="2" y1="56" x2="24" y2="56" stroke={getLeadColor(inputs[3])} strokeWidth="2.5" />
            </>
          )}

          {/* Output Lead Stub */}
          <line x1="76" y1="36" x2="108" y2="36" stroke={getLeadColor(isActive)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'NAND': {
      const is3 = inputCount === 3;
      const is4 = inputCount === 4;
      return (
        <svg width={width} height={height} viewBox="0 0 110 72" className="overflow-visible">
          <path
            d="M 22 12 L 48 12 A 24 24 0 0 1 48 60 L 22 60 Z"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inversion Bubble */}
          <circle cx="76" cy="36" r="4.5" fill={bodyColor} stroke={strokeColor} strokeWidth="2.2" />

          {/* Input Leads */}
          {!is3 && !is4 && (
            <>
              <line x1="2" y1="22" x2="22" y2="22" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="50" x2="22" y2="50" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
            </>
          )}
          {is3 && (
            <>
              <line x1="2" y1="18" x2="22" y2="18" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="36" x2="22" y2="36" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
              <line x1="2" y1="54" x2="22" y2="54" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
            </>
          )}
          {is4 && (
            <>
              <line x1="2" y1="16" x2="22" y2="16" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="30" x2="22" y2="30" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
              <line x1="2" y1="42" x2="22" y2="42" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
              <line x1="2" y1="56" x2="22" y2="56" stroke={getLeadColor(inputs[3])} strokeWidth="2.5" />
            </>
          )}

          {/* Output Lead */}
          <line x1="81" y1="36" x2="108" y2="36" stroke={getLeadColor(isActive)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'OR': {
      const is3 = inputCount === 3;
      const is4 = inputCount === 4;
      return (
        <svg width={width} height={height} viewBox="0 0 110 72" className="overflow-visible">
          <path
            d="M 20 12 C 32 24, 32 48, 20 60 C 44 60, 68 50, 78 36 C 68 22, 44 12, 20 12 Z"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {!is3 && !is4 && (
            <>
              <line x1="2" y1="22" x2="26" y2="22" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="50" x2="26" y2="50" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
            </>
          )}
          {is3 && (
            <>
              <line x1="2" y1="18" x2="24" y2="18" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="36" x2="29" y2="36" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
              <line x1="2" y1="54" x2="24" y2="54" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
            </>
          )}
          {is4 && (
            <>
              <line x1="2" y1="16" x2="23" y2="16" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="30" x2="28" y2="30" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
              <line x1="2" y1="42" x2="28" y2="42" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
              <line x1="2" y1="56" x2="23" y2="56" stroke={getLeadColor(inputs[3])} strokeWidth="2.5" />
            </>
          )}

          <line x1="78" y1="36" x2="108" y2="36" stroke={getLeadColor(isActive)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'NOR': {
      const is3 = inputCount === 3;
      const is4 = inputCount === 4;
      return (
        <svg width={width} height={height} viewBox="0 0 110 72" className="overflow-visible">
          <path
            d="M 18 12 C 30 24, 30 48, 18 60 C 40 60, 64 50, 74 36 C 64 22, 40 12, 18 12 Z"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="78.5" cy="36" r="4.5" fill={bodyColor} stroke={strokeColor} strokeWidth="2.2" />

          {!is3 && !is4 && (
            <>
              <line x1="2" y1="22" x2="24" y2="22" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="50" x2="24" y2="50" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
            </>
          )}
          {is3 && (
            <>
              <line x1="2" y1="18" x2="22" y2="18" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="36" x2="27" y2="36" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
              <line x1="2" y1="54" x2="22" y2="54" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
            </>
          )}
          {is4 && (
            <>
              <line x1="2" y1="16" x2="21" y2="16" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
              <line x1="2" y1="30" x2="26" y2="30" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
              <line x1="2" y1="42" x2="26" y2="42" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
              <line x1="2" y1="56" x2="21" y2="56" stroke={getLeadColor(inputs[3])} strokeWidth="2.5" />
            </>
          )}

          <line x1="83" y1="36" x2="108" y2="36" stroke={getLeadColor(isActive)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'XOR': {
      return (
        <svg width={width} height={height} viewBox="0 0 110 72" className="overflow-visible">
          {/* Isolated Input Curve */}
          <path
            d="M 14 12 C 26 24, 26 48, 14 60"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Main Body */}
          <path
            d="M 22 12 C 34 24, 34 48, 22 60 C 44 60, 68 50, 78 36 C 68 22, 44 12, 22 12 Z"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="2" y1="22" x2="20" y2="22" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="2" y1="50" x2="20" y2="50" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="78" y1="36" x2="108" y2="36" stroke={getLeadColor(isActive)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'XNOR': {
      return (
        <svg width={width} height={height} viewBox="0 0 110 72" className="overflow-visible">
          <path
            d="M 12 12 C 24 24, 24 48, 12 60"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 20 12 C 32 24, 32 48, 20 60 C 42 60, 64 50, 74 36 C 64 22, 42 12, 20 12 Z"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="78.5" cy="36" r="4.5" fill={bodyColor} stroke={strokeColor} strokeWidth="2.2" />
          <line x1="2" y1="22" x2="18" y2="22" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="2" y1="50" x2="18" y2="50" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="83" y1="36" x2="108" y2="36" stroke={getLeadColor(isActive)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'BUFFER': {
      return (
        <svg width={width} height={height} viewBox="0 0 100 60" className="overflow-visible">
          <polygon
            points="24,12 74,30 24,48"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="2" y1="30" x2="24" y2="30" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="74" y1="30" x2="98" y2="30" stroke={getLeadColor(isActive)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'NOT': {
      return (
        <svg width={width} height={height} viewBox="0 0 100 60" className="overflow-visible">
          <polygon
            points="22,12 66,30 22,48"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="71.5" cy="30" r="4.5" fill={bodyColor} stroke={strokeColor} strokeWidth="2.2" />
          <line x1="2" y1="30" x2="22" y2="30" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="76" y1="30" x2="98" y2="30" stroke={getLeadColor(isActive)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'SWITCH': {
      // Authentic LogicFlow Toggle Switch: Square white box with toggle slider inside
      const isOn = Boolean(state?.isOn);
      return (
        <svg width={width} height={height} viewBox="0 0 88 54" className="overflow-visible">
          {/* Chassis Box */}
          <rect
            x="4"
            y="4"
            width="64"
            height="46"
            rx="4"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
          />

          {/* Slider Slot */}
          <rect
            x="14"
            y="17"
            width="44"
            height="20"
            rx="10"
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* Toggle Slider Knob */}
          <circle
            cx={isOn ? 46 : 26}
            cy="27"
            r="8"
            fill={isOn ? highSignalColor : '#64748b'}
            stroke="#0f172a"
            strokeWidth="1.5"
            className="transition-all duration-200"
          />

          {/* Output Lead Stub */}
          <line x1="68" y1="27" x2="86" y2="27" stroke={getLeadColor(isOn)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'LED': {
      // Authentic LogicFlow Light Bulb: Upright glass dome, metal base, vibrant electric blue halo when ON
      const isLit = Boolean(inputs[0]);
      return (
        <svg width={width} height={height} viewBox="0 0 68 76" className="overflow-visible">
          <defs>
            {/* Electric Blue Glow Filter when Light Bulb is ON */}
            <filter id="bulb-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Radial glow background */}
            <radialGradient id="bulb-radial" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Glowing Aura when ON */}
          {isLit && (
            <circle cx="34" cy="26" r="28" fill="url(#bulb-radial)" filter="url(#bulb-glow)" />
          )}

          {/* Glass Dome */}
          <path
            d="M 22 46 C 12 40, 10 18, 34 10 C 58 18, 56 40, 46 46 Z"
            fill={isLit ? '#e0f2fe' : bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Tungsten Filament */}
          <path
            d="M 28 42 L 30 26 L 34 22 L 38 26 L 40 42"
            fill="none"
            stroke={isLit ? highSignalColor : '#64748b'}
            strokeWidth={isLit ? '2.5' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Filament coils in center */}
          {isLit && (
            <circle cx="34" cy="22" r="3" fill="#ffffff" stroke={highSignalColor} strokeWidth="1.5" />
          )}

          {/* Metallic Screw Base */}
          <rect x="26" y="46" width="16" height="5" rx="1.5" fill="#94a3b8" stroke={strokeColor} strokeWidth="2" />
          <rect x="28" y="51" width="12" height="4" rx="1.5" fill="#64748b" stroke={strokeColor} strokeWidth="2" />
          <path d="M 30 55 L 38 55 L 36 59 L 32 59 Z" fill="#334155" stroke={strokeColor} strokeWidth="1.5" />

          {/* Bottom Lead Stub connecting to terminal pad */}
          <line x1="34" y1="59" x2="34" y2="74" stroke={getLeadColor(isLit)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'BUTTON': {
      const isPressed = Boolean(state?.isOn);
      return (
        <svg width={width} height={height} viewBox="0 0 78 58" className="overflow-visible">
          <rect x="4" y="6" width="56" height="46" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Button push cap */}
          <rect
            x="14"
            y="14"
            width="36"
            height="30"
            rx="6"
            fill={isPressed ? highSignalColor : '#e2e8f0'}
            stroke={strokeColor}
            strokeWidth="2"
            className="transition-all duration-100"
          />
          <text
            x="32"
            y="33"
            textAnchor="middle"
            fill={isPressed ? '#ffffff' : '#475569'}
            fontSize="10"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            PUSH
          </text>
          <line x1="60" y1="29" x2="76" y2="29" stroke={getLeadColor(isPressed)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'CLOCK': {
      return (
        <svg width={width} height={height} viewBox="0 0 90 54" className="overflow-visible">
          <rect x="4" y="4" width="66" height="46" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Pulse wave icon */}
          <path
            d="M 16 34 L 26 34 L 26 18 L 40 18 L 40 34 L 54 34 L 54 18 L 60 18"
            fill="none"
            stroke={isActive ? highSignalColor : strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x="37" y="44" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="bold">
            {state?.frequencyHz || 1} Hz
          </text>
          <line x1="70" y1="27" x2="88" y2="27" stroke={getLeadColor(isActive)} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'HIGH_CONST': {
      return (
        <svg width={width} height={height} viewBox="0 0 76 44" className="overflow-visible">
          <rect x="4" y="4" width="54" height="36" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <text x="31" y="27" textAnchor="middle" fill={highSignalColor} fontSize="18" fontWeight="bold" fontFamily="sans-serif">
            1
          </text>
          <line x1="58" y1="22" x2="74" y2="22" stroke={highSignalColor} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'LOW_CONST': {
      return (
        <svg width={width} height={height} viewBox="0 0 76 44" className="overflow-visible">
          <rect x="4" y="4" width="54" height="36" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <text x="31" y="27" textAnchor="middle" fill="#475569" fontSize="18" fontWeight="bold" fontFamily="sans-serif">
            0
          </text>
          <line x1="58" y1="22" x2="74" y2="22" stroke={lowSignalColor} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'SEVEN_SEG': {
      // Authentic LogicFlow 4-Bit Digit Display
      const { hexChar } = decodeSevenSegment(inputs);
      return (
        <svg width={width} height={height} viewBox="0 0 96 120" className="overflow-visible">
          {/* Chassis */}
          <rect x="20" y="8" width="68" height="104" rx="6" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />

          {/* 4 Input lead stubs on the left */}
          <line x1="2" y1="26" x2="20" y2="26" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="2" y1="50" x2="20" y2="50" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="2" y1="74" x2="20" y2="74" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
          <line x1="2" y1="98" x2="20" y2="98" stroke={getLeadColor(inputs[3])} strokeWidth="2.5" />

          {/* Display screen */}
          <rect x="28" y="16" width="52" height="72" rx="4" fill="#0f172a" />
          <text
            x="54"
            y="68"
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="46"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {hexChar}
          </text>
          <text x="54" y="103" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
            4-Bit Digit
          </text>
        </svg>
      );
    }

    case 'PROBE': {
      const bit = inputs[0] ? 1 : 0;
      return (
        <svg width={width} height={height} viewBox="0 0 96 58" className="overflow-visible">
          <line x1="2" y1="29" x2="18" y2="29" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <rect x="18" y="6" width="72" height="46" rx="6" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <text
            x="54"
            y="36"
            textAnchor="middle"
            fill={bit === 1 ? highSignalColor : '#475569'}
            fontSize="26"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {bit}
          </text>
        </svg>
      );
    }

    case 'BUZZER': {
      const isSounding = Boolean(inputs[0]);
      return (
        <svg width={width} height={height} viewBox="0 0 78 64" className="overflow-visible">
          <line x1="2" y1="32" x2="16" y2="32" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <rect x="16" y="8" width="56" height="48" rx="6" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <path
            d="M 32 24 L 42 18 L 42 46 L 32 40 Z"
            fill={isSounding ? highSignalColor : '#64748b'}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          {isSounding && (
            <path
              d="M 48 24 C 54 28, 54 36, 48 40 M 52 20 C 60 26, 60 38, 52 44"
              fill="none"
              stroke={highSignalColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          )}
        </svg>
      );
    }

    case 'TRI_STATE': {
      const inVal = Boolean(inputs[0]);
      const enVal = inputs[1] !== undefined ? Boolean(inputs[1]) : true;
      return (
        <svg width={width} height={height} viewBox="0 0 100 64" className="overflow-visible">
          <line x1="2" y1="24" x2="24" y2="24" stroke={getLeadColor(inVal)} strokeWidth="2.5" />
          <line x1="48" y1="60" x2="48" y2="36" stroke={getLeadColor(enVal)} strokeWidth="2.5" />
          <polygon
            points="24,10 68,24 24,38"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="68" y1="24" x2="98" y2="24" stroke={getLeadColor(isActive)} strokeWidth="2.5" />
          <text x="48" y="54" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">
            EN
          </text>
        </svg>
      );
    }

    case 'D_FLIP_FLOP': {
      const qVal = Boolean(state?.q);
      const qBarVal = Boolean(state?.qBar);
      return (
        <svg width={width} height={height} viewBox="0 0 110 80" className="overflow-visible">
          {/* IC Body */}
          <rect x="20" y="8" width="70" height="64" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          {/* Leads */}
          <line x1="2" y1="24" x2="20" y2="24" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="2" y1="56" x2="20" y2="56" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="90" y1="24" x2="108" y2="24" stroke={getLeadColor(qVal)} strokeWidth="2.5" />
          <line x1="90" y1="56" x2="108" y2="56" stroke={getLeadColor(qBarVal)} strokeWidth="2.5" />
          {/* Clock Caret */}
          <path d="M 20 50 L 28 56 L 20 62" fill="none" stroke={strokeColor} strokeWidth="2" />
          {/* Labels */}
          <text x="32" y="28" fill={strokeColor} fontSize="12" fontWeight="bold" fontFamily="monospace">D</text>
          <text x="74" y="28" fill={strokeColor} fontSize="12" fontWeight="bold" fontFamily="monospace">Q</text>
          <text x="72" y="60" fill={strokeColor} fontSize="12" fontWeight="bold" fontFamily="monospace">~Q</text>
          <text x="55" y="44" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">D-FF</text>
        </svg>
      );
    }

    case 'T_FLIP_FLOP': {
      const qVal = Boolean(state?.q);
      const qBarVal = Boolean(state?.qBar);
      return (
        <svg width={width} height={height} viewBox="0 0 110 80" className="overflow-visible">
          <rect x="20" y="8" width="70" height="64" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <line x1="2" y1="24" x2="20" y2="24" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="2" y1="56" x2="20" y2="56" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="90" y1="24" x2="108" y2="24" stroke={getLeadColor(qVal)} strokeWidth="2.5" />
          <line x1="90" y1="56" x2="108" y2="56" stroke={getLeadColor(qBarVal)} strokeWidth="2.5" />
          <path d="M 20 50 L 28 56 L 20 62" fill="none" stroke={strokeColor} strokeWidth="2" />
          <text x="32" y="28" fill={strokeColor} fontSize="12" fontWeight="bold" fontFamily="monospace">T</text>
          <text x="74" y="28" fill={strokeColor} fontSize="12" fontWeight="bold" fontFamily="monospace">Q</text>
          <text x="72" y="60" fill={strokeColor} fontSize="12" fontWeight="bold" fontFamily="monospace">~Q</text>
          <text x="55" y="44" textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold">T-FF</text>
        </svg>
      );
    }

    case 'JK_FLIP_FLOP': {
      const qVal = Boolean(state?.q);
      const qBarVal = Boolean(state?.qBar);
      return (
        <svg width={width} height={height} viewBox="0 0 110 88" className="overflow-visible">
          <rect x="20" y="8" width="70" height="72" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <line x1="2" y1="20" x2="20" y2="20" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="2" y1="44" x2="20" y2="44" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="2" y1="68" x2="20" y2="68" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
          <line x1="90" y1="24" x2="108" y2="24" stroke={getLeadColor(qVal)} strokeWidth="2.5" />
          <line x1="90" y1="64" x2="108" y2="64" stroke={getLeadColor(qBarVal)} strokeWidth="2.5" />
          <path d="M 20 38 L 28 44 L 20 50" fill="none" stroke={strokeColor} strokeWidth="2" />
          <text x="32" y="24" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">J</text>
          <text x="32" y="72" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">K</text>
          <text x="74" y="28" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">Q</text>
          <text x="72" y="68" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">~Q</text>
          <text x="55" y="48" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">JK-FF</text>
        </svg>
      );
    }

    case 'SR_FLIP_FLOP': {
      const qVal = Boolean(state?.q);
      const qBarVal = Boolean(state?.qBar);
      return (
        <svg width={width} height={height} viewBox="0 0 110 88" className="overflow-visible">
          <rect x="20" y="8" width="70" height="72" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <line x1="2" y1="20" x2="20" y2="20" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="2" y1="44" x2="20" y2="44" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="2" y1="68" x2="20" y2="68" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
          <line x1="90" y1="24" x2="108" y2="24" stroke={getLeadColor(qVal)} strokeWidth="2.5" />
          <line x1="90" y1="64" x2="108" y2="64" stroke={getLeadColor(qBarVal)} strokeWidth="2.5" />
          <path d="M 20 38 L 28 44 L 20 50" fill="none" stroke={strokeColor} strokeWidth="2" />
          <text x="32" y="24" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">S</text>
          <text x="32" y="72" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">R</text>
          <text x="74" y="28" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">Q</text>
          <text x="72" y="68" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">~Q</text>
          <text x="55" y="48" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">SR-FF</text>
        </svg>
      );
    }

    case 'HALF_ADDER': {
      const aVal = Boolean(inputs[0]);
      const bVal = Boolean(inputs[1]);
      const sumVal = aVal !== bVal;
      const carryVal = aVal && bVal;
      return (
        <svg width={width} height={height} viewBox="0 0 110 80" className="overflow-visible">
          <rect x="20" y="8" width="70" height="64" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <line x1="2" y1="24" x2="20" y2="24" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="2" y1="56" x2="20" y2="56" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="90" y1="24" x2="108" y2="24" stroke={getLeadColor(sumVal)} strokeWidth="2.5" />
          <line x1="90" y1="56" x2="108" y2="56" stroke={getLeadColor(carryVal)} strokeWidth="2.5" />
          <text x="30" y="28" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">A</text>
          <text x="30" y="60" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">B</text>
          <text x="68" y="28" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">Σ</text>
          <text x="68" y="60" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">Co</text>
          <text x="55" y="44" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">HALF ADD</text>
        </svg>
      );
    }

    case 'FULL_ADDER': {
      const aVal = Boolean(inputs[0]);
      const bVal = Boolean(inputs[1]);
      const cinVal = Boolean(inputs[2]);
      const sumVal = (aVal !== bVal) !== cinVal;
      const coutVal = (aVal && bVal) || (cinVal && (aVal !== bVal));
      return (
        <svg width={width} height={height} viewBox="0 0 110 88" className="overflow-visible">
          <rect x="20" y="8" width="70" height="72" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <line x1="2" y1="20" x2="20" y2="20" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="2" y1="44" x2="20" y2="44" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="2" y1="68" x2="20" y2="68" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
          <line x1="90" y1="28" x2="108" y2="28" stroke={getLeadColor(sumVal)} strokeWidth="2.5" />
          <line x1="90" y1="60" x2="108" y2="60" stroke={getLeadColor(coutVal)} strokeWidth="2.5" />
          <text x="30" y="24" fill={strokeColor} fontSize="10" fontWeight="bold" fontFamily="monospace">A</text>
          <text x="30" y="48" fill={strokeColor} fontSize="10" fontWeight="bold" fontFamily="monospace">B</text>
          <text x="26" y="72" fill={strokeColor} fontSize="9" fontWeight="bold" fontFamily="monospace">Cin</text>
          <text x="68" y="32" fill={strokeColor} fontSize="11" fontWeight="bold" fontFamily="monospace">Σ</text>
          <text x="66" y="64" fill={strokeColor} fontSize="9" fontWeight="bold" fontFamily="monospace">Cout</text>
          <text x="55" y="48" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">FULL ADD</text>
        </svg>
      );
    }

    case 'MUX_2TO1': {
      const d0 = Boolean(inputs[0]);
      const d1 = Boolean(inputs[1]);
      const sel = Boolean(inputs[2]);
      const yVal = sel ? d1 : d0;
      return (
        <svg width={width} height={height} viewBox="0 0 96 72" className="overflow-visible">
          <polygon
            points="20,10 72,18 72,52 20,60"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="2" y1="20" x2="20" y2="20" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="2" y1="50" x2="20" y2="50" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="48" y1="70" x2="48" y2="56" stroke={getLeadColor(inputs[2])} strokeWidth="2.5" />
          <line x1="72" y1="35" x2="94" y2="35" stroke={getLeadColor(yVal)} strokeWidth="2.5" />
          <text x="26" y="24" fill={strokeColor} fontSize="9" fontWeight="bold" fontFamily="monospace">0</text>
          <text x="26" y="54" fill={strokeColor} fontSize="9" fontWeight="bold" fontFamily="monospace">1</text>
          <text x="62" y="38" fill={strokeColor} fontSize="10" fontWeight="bold" fontFamily="monospace">Y</text>
          <text x="48" y="36" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">MUX</text>
          <text x="48" y="66" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="bold">S</text>
        </svg>
      );
    }

    case 'DEMUX_1TO2': {
      const inSig = Boolean(inputs[0]);
      const sel = Boolean(inputs[1]);
      const y0 = !sel ? inSig : false;
      const y1 = sel ? inSig : false;
      return (
        <svg width={width} height={height} viewBox="0 0 96 72" className="overflow-visible">
          <polygon
            points="20,18 72,10 72,60 20,52"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="2" y1="35" x2="20" y2="35" stroke={getLeadColor(inputs[0])} strokeWidth="2.5" />
          <line x1="48" y1="70" x2="48" y2="56" stroke={getLeadColor(inputs[1])} strokeWidth="2.5" />
          <line x1="72" y1="20" x2="94" y2="20" stroke={getLeadColor(y0)} strokeWidth="2.5" />
          <line x1="72" y1="50" x2="94" y2="50" stroke={getLeadColor(y1)} strokeWidth="2.5" />
          <text x="26" y="38" fill={strokeColor} fontSize="10" fontWeight="bold" fontFamily="monospace">IN</text>
          <text x="64" y="24" fill={strokeColor} fontSize="9" fontWeight="bold" fontFamily="monospace">0</text>
          <text x="64" y="54" fill={strokeColor} fontSize="9" fontWeight="bold" fontFamily="monospace">1</text>
          <text x="48" y="36" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="bold">DEMUX</text>
          <text x="48" y="66" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="bold">S</text>
        </svg>
      );
    }

    case 'FLOW_START': {
      const isFlowActive = Boolean(state?.isFlowActive);
      return (
        <svg width={width} height={height} viewBox="0 0 140 50" className="overflow-visible">
          {isFlowActive && (
            <rect x="2" y="2" width="136" height="46" rx="23" fill="none" stroke="#10b981" strokeWidth="6" opacity="0.4" className="animate-pulse" />
          )}
          <rect
            x="4"
            y="4"
            width="132"
            height="42"
            rx="21"
            fill={bodyColor}
            stroke={isFlowActive ? '#10b981' : isDark ? '#10b981' : '#059669'}
            strokeWidth={isFlowActive ? '3.5' : '2.5'}
          />
          <polygon points="26,18 26,32 37,25" fill={isDark ? '#34d399' : '#059669'} />
          <text
            x="76"
            y="29"
            textAnchor="middle"
            fill={strokeColor}
            fontSize="12"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            {state?.customLabel || 'START'}
          </text>
          <line x1="70" y1="46" x2="70" y2="50" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );
    }

    case 'FLOW_END': {
      const isFlowActive = Boolean(state?.isFlowActive);
      return (
        <svg width={width} height={height} viewBox="0 0 140 50" className="overflow-visible">
          {isFlowActive && (
            <rect x="2" y="2" width="136" height="46" rx="23" fill="none" stroke="#ef4444" strokeWidth="6" opacity="0.4" className="animate-pulse" />
          )}
          <line x1="70" y1="0" x2="70" y2="4" stroke={strokeColor} strokeWidth="2.5" />
          <rect
            x="4"
            y="4"
            width="132"
            height="42"
            rx="21"
            fill={bodyColor}
            stroke={isFlowActive ? '#ef4444' : isDark ? '#f43f5e' : '#e11d48'}
            strokeWidth={isFlowActive ? '3.5' : '2.5'}
          />
          <rect x="24" y="19" width="12" height="12" rx="2" fill={isDark ? '#fb7185' : '#e11d48'} />
          <text
            x="76"
            y="29"
            textAnchor="middle"
            fill={strokeColor}
            fontSize="12"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            {state?.customLabel || 'STOP / END'}
          </text>
        </svg>
      );
    }

    case 'FLOW_PROCESS': {
      const isFlowActive = Boolean(state?.isFlowActive);
      const displayText = state?.flowAction || state?.customLabel || 'Process';
      return (
        <svg width={width} height={height} viewBox="0 0 150 60" className="overflow-visible">
          {isFlowActive && (
            <rect x="2" y="2" width="146" height="56" rx="8" fill="none" stroke="#38bdf8" strokeWidth="6" opacity="0.4" className="animate-pulse" />
          )}
          <line x1="75" y1="0" x2="75" y2="4" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="75" y1="56" x2="75" y2="60" stroke={strokeColor} strokeWidth="2.5" />
          <rect
            x="4"
            y="4"
            width="142"
            height="52"
            rx="6"
            fill={bodyColor}
            stroke={isFlowActive ? '#38bdf8' : isDark ? '#38bdf8' : '#0284c7'}
            strokeWidth={isFlowActive ? '3.5' : '2'}
          />
          <text x="14" y="17" fill="#0284c7" fontSize="8" fontWeight="bold" letterSpacing="0.05em">
            PROCESS
          </text>
          <text
            x="75"
            y="37"
            textAnchor="middle"
            fill={strokeColor}
            fontSize="11"
            fontWeight="600"
            fontFamily="ui-monospace, monospace"
          >
            {displayText.length > 18 ? displayText.slice(0, 17) + '…' : displayText}
          </text>
        </svg>
      );
    }

    case 'FLOW_DECISION': {
      const isFlowActive = Boolean(state?.isFlowActive);
      const condText = state?.flowCondition || state?.customLabel || 'Condition ?';
      return (
        <svg width={width} height={height} viewBox="0 0 150 80" className="overflow-visible">
          {isFlowActive && (
            <polygon points="75,0 150,40 75,80 0,40" fill="none" stroke="#f59e0b" strokeWidth="6" opacity="0.4" className="animate-pulse" />
          )}
          <line x1="75" y1="0" x2="75" y2="4" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="146" y1="40" x2="150" y2="40" stroke="#10b981" strokeWidth="2.5" />
          <line x1="75" y1="76" x2="75" y2="80" stroke="#ef4444" strokeWidth="2.5" />
          <polygon
            points="75,4 146,40 75,76 4,40"
            fill={bodyColor}
            stroke={isFlowActive ? '#f59e0b' : isDark ? '#fbbf24' : '#d97706'}
            strokeWidth={isFlowActive ? '3.5' : '2'}
          />
          {/* YES Branch Badge at Right */}
          <g transform="translate(120, 20)">
            <rect x="0" y="0" width="22" height="13" rx="3" fill="#10b981" />
            <text x="11" y="9.5" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
              YES
            </text>
          </g>
          {/* NO Branch Badge at Bottom */}
          <g transform="translate(64, 61)">
            <rect x="0" y="0" width="22" height="13" rx="3" fill="#ef4444" />
            <text x="11" y="9.5" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
              NO
            </text>
          </g>
          <text
            x="75"
            y="43"
            textAnchor="middle"
            fill={strokeColor}
            fontSize="11"
            fontWeight="bold"
            fontFamily="ui-monospace, monospace"
          >
            {condText.length > 15 ? condText.slice(0, 14) + '…' : condText}
          </text>
        </svg>
      );
    }

    case 'FLOW_INPUT': {
      const isFlowActive = Boolean(state?.isFlowActive);
      const labelText = state?.flowAction || state?.customLabel || 'Read X';
      return (
        <svg width={width} height={height} viewBox="0 0 150 60" className="overflow-visible">
          {isFlowActive && (
            <polygon points="16,2 148,2 134,58 2,58" fill="none" stroke="#a855f7" strokeWidth="6" opacity="0.4" className="animate-pulse" />
          )}
          <line x1="75" y1="0" x2="75" y2="4" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="75" y1="56" x2="75" y2="60" stroke={strokeColor} strokeWidth="2.5" />
          <polygon
            points="18,4 146,4 132,56 4,56"
            fill={bodyColor}
            stroke={isFlowActive ? '#a855f7' : isDark ? '#c084fc' : '#9333ea'}
            strokeWidth={isFlowActive ? '3.5' : '2'}
          />
          <text x="24" y="17" fill="#9333ea" fontSize="8" fontWeight="bold" letterSpacing="0.05em">
            INPUT (READ)
          </text>
          <text
            x="75"
            y="37"
            textAnchor="middle"
            fill={strokeColor}
            fontSize="11"
            fontWeight="600"
            fontFamily="ui-monospace, monospace"
          >
            {labelText.length > 18 ? labelText.slice(0, 17) + '…' : labelText}
          </text>
        </svg>
      );
    }

    case 'FLOW_OUTPUT': {
      const isFlowActive = Boolean(state?.isFlowActive);
      const labelText = state?.flowAction || state?.customLabel || 'Print result';
      return (
        <svg width={width} height={height} viewBox="0 0 150 60" className="overflow-visible">
          {isFlowActive && (
            <polygon points="16,2 148,2 134,58 2,58" fill="none" stroke="#06b6d4" strokeWidth="6" opacity="0.4" className="animate-pulse" />
          )}
          <line x1="75" y1="0" x2="75" y2="4" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="75" y1="56" x2="75" y2="60" stroke={strokeColor} strokeWidth="2.5" />
          <polygon
            points="18,4 146,4 132,56 4,56"
            fill={bodyColor}
            stroke={isFlowActive ? '#06b6d4' : isDark ? '#22d3ee' : '#0891b2'}
            strokeWidth={isFlowActive ? '3.5' : '2'}
          />
          <text x="24" y="17" fill="#0891b2" fontSize="8" fontWeight="bold" letterSpacing="0.05em">
            OUTPUT (PRINT)
          </text>
          <text
            x="75"
            y="37"
            textAnchor="middle"
            fill={strokeColor}
            fontSize="11"
            fontWeight="600"
            fontFamily="ui-monospace, monospace"
          >
            {labelText.length > 18 ? labelText.slice(0, 17) + '…' : labelText}
          </text>
        </svg>
      );
    }

    case 'FLOW_CONNECTOR': {
      const isFlowActive = Boolean(state?.isFlowActive);
      return (
        <svg width={width} height={height} viewBox="0 0 50 50" className="overflow-visible">
          {isFlowActive && (
            <circle cx="25" cy="25" r="21" fill="none" stroke="#38bdf8" strokeWidth="5" opacity="0.4" className="animate-pulse" />
          )}
          <line x1="25" y1="0" x2="25" y2="4" stroke={strokeColor} strokeWidth="2" />
          <line x1="0" y1="25" x2="4" y2="25" stroke={strokeColor} strokeWidth="2" />
          <line x1="25" y1="46" x2="25" y2="50" stroke={strokeColor} strokeWidth="2" />
          <circle
            cx="25"
            cy="25"
            r="18"
            fill={bodyColor}
            stroke={isFlowActive ? '#38bdf8' : strokeColor}
            strokeWidth={isFlowActive ? '3' : '2'}
          />
          <text
            x="25"
            y="29"
            textAnchor="middle"
            fill={strokeColor}
            fontSize="11"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {state?.customLabel || '•'}
          </text>
        </svg>
      );
    }

    case 'FLOW_SUBROUTINE': {
      const isFlowActive = Boolean(state?.isFlowActive);
      const labelText = state?.flowAction || state?.customLabel || 'Call func()';
      return (
        <svg width={width} height={height} viewBox="0 0 150 60" className="overflow-visible">
          {isFlowActive && (
            <rect x="2" y="2" width="146" height="56" rx="8" fill="none" stroke="#ec4899" strokeWidth="6" opacity="0.4" className="animate-pulse" />
          )}
          <line x1="75" y1="0" x2="75" y2="4" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="75" y1="56" x2="75" y2="60" stroke={strokeColor} strokeWidth="2.5" />
          <rect
            x="4"
            y="4"
            width="142"
            height="52"
            rx="5"
            fill={bodyColor}
            stroke={isFlowActive ? '#ec4899' : isDark ? '#f472b6' : '#db2777'}
            strokeWidth={isFlowActive ? '3.5' : '2'}
          />
          <line x1="16" y1="4" x2="16" y2="56" stroke={strokeColor} strokeWidth="1.5" />
          <line x1="134" y1="4" x2="134" y2="56" stroke={strokeColor} strokeWidth="1.5" />
          <text x="24" y="17" fill="#db2777" fontSize="8" fontWeight="bold" letterSpacing="0.05em">
            SUBROUTINE
          </text>
          <text
            x="75"
            y="37"
            textAnchor="middle"
            fill={strokeColor}
            fontSize="11"
            fontWeight="600"
            fontFamily="ui-monospace, monospace"
          >
            {labelText.length > 16 ? labelText.slice(0, 15) + '…' : labelText}
          </text>
        </svg>
      );
    }

    case 'SUBCIRCUIT':
    case 'SUB_CIRCUIT': {
      const chipTitle = state?.subCircuitName || state?.subcircuitName || 'SUB-CIRCUIT';
      const chipColor = state?.color || (isDark ? '#38bdf8' : '#0284c7');
      return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          {/* Main IC chip body */}
          <rect
            x="14"
            y="6"
            width={width - 28}
            height={height - 12}
            rx="6"
            fill={bodyColor}
            stroke={chipColor}
            strokeWidth="2"
          />
          {/* Top Notch */}
          <path
            d={`M ${width / 2 - 8} 6 A 8 8 0 0 0 ${width / 2 + 8} 6`}
            fill="none"
            stroke={chipColor}
            strokeWidth="2"
          />
          {/* Chip Label */}
          <text
            x={width / 2}
            y={height / 2 + 3}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="11"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="0.5"
          >
            {chipTitle.length > 13 ? chipTitle.slice(0, 12) + '…' : chipTitle}
          </text>
          <text
            x={width / 2}
            y={height / 2 + 18}
            textAnchor="middle"
            fill={isDark ? '#94a3b8' : '#64748b'}
            fontSize="8"
            fontFamily="monospace"
          >
            IC MODULE
          </text>
        </svg>
      );
    }

    case 'ELEC_RESISTOR': {
      const rOhms = state?.resistanceOhms ?? 1000;
      const rLabel = rOhms >= 1000000 ? `${rOhms / 1000000}MΩ` : rOhms >= 1000 ? `${rOhms / 1000}kΩ` : `${rOhms}Ω`;
      return (
        <svg width={width} height={height} viewBox="0 0 90 48" className="overflow-visible select-none">
          <line x1="2" y1="24" x2="22" y2="24" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="68" y1="24" x2="88" y2="24" stroke={strokeColor} strokeWidth="2.5" />
          <polyline
            points="22,24 28,14 34,34 40,14 46,34 52,14 58,34 64,14 68,24"
            fill="none"
            stroke={isActive ? highSignalColor : strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="45"
            y="44"
            textAnchor="middle"
            fill={isDark ? '#94a3b8' : '#475569'}
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {rLabel}
          </text>
        </svg>
      );
    }

    case 'ELEC_POTENTIOMETER': {
      const rOhms = state?.resistanceOhms ?? 10000;
      const rLabel = rOhms >= 1000 ? `${rOhms / 1000}kΩ` : `${rOhms}Ω`;
      return (
        <svg width={width} height={height} viewBox="0 0 94 68" className="overflow-visible select-none">
          <line x1="2" y1="18" x2="22" y2="18" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="2" y1="50" x2="22" y2="50" stroke={strokeColor} strokeWidth="2.5" />
          <rect x="22" y="14" width="46" height="40" rx="3" fill={bodyColor} stroke={strokeColor} strokeWidth="2.2" />
          <line x1="68" y1="34" x2="92" y2="34" stroke={strokeColor} strokeWidth="2.5" />
          <polygon points="54,34 62,30 62,38" fill={highSignalColor} />
          <text x="42" y="38" textAnchor="middle" fill={isDark ? '#cbd5e1' : '#1e293b'} fontSize="9" fontWeight="bold">
            POT
          </text>
          <text x="45" y="62" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="9" fontFamily="monospace">
            {rLabel}
          </text>
        </svg>
      );
    }

    case 'ELEC_CAPACITOR': {
      const cFarads = state?.capacitanceFarads ?? 0.00001;
      const cLabel = cFarads < 1e-6 ? `${Math.round(cFarads * 1e9)}nF` : `${Math.round(cFarads * 1e6)}µF`;
      return (
        <svg width={width} height={height} viewBox="0 0 84 50" className="overflow-visible select-none">
          <line x1="2" y1="25" x2="36" y2="25" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="48" y1="25" x2="82" y2="25" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="36" y1="10" x2="36" y2="40" stroke={isActive ? highSignalColor : strokeColor} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="48" y1="10" x2="48" y2="40" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" />
          <text x="28" y="16" fill="#38bdf8" fontSize="9" fontWeight="bold">+</text>
          <text x="56" y="16" fill="#94a3b8" fontSize="10" fontWeight="bold">-</text>
          <text x="42" y="47" textAnchor="middle" fill={isDark ? '#94a3b8' : '#475569'} fontSize="9" fontFamily="monospace">
            {cLabel}
          </text>
        </svg>
      );
    }

    case 'ELEC_INDUCTOR': {
      const lHenries = state?.inductanceHenries ?? 0.001;
      const lLabel = lHenries >= 1 ? `${lHenries}H` : `${lHenries * 1000}mH`;
      return (
        <svg width={width} height={height} viewBox="0 0 84 50" className="overflow-visible select-none">
          <line x1="2" y1="25" x2="18" y2="25" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="66" y1="25" x2="82" y2="25" stroke={strokeColor} strokeWidth="2.5" />
          <path
            d="M 18 25 A 6 6 0 0 1 30 25 A 6 6 0 0 1 42 25 A 6 6 0 0 1 54 25 A 6 6 0 0 1 66 25"
            fill="none"
            stroke={isActive ? highSignalColor : strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text x="42" y="44" textAnchor="middle" fill={isDark ? '#94a3b8' : '#475569'} fontSize="9" fontFamily="monospace">
            {lLabel}
          </text>
        </svg>
      );
    }

    case 'ELEC_DIODE': {
      const isCond = state?.isConducting || isActive;
      return (
        <svg width={width} height={height} viewBox="0 0 88 54" className="overflow-visible select-none">
          <line x1="2" y1="27" x2="30" y2="27" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="58" y1="27" x2="86" y2="27" stroke={strokeColor} strokeWidth="2.5" />
          <polygon
            points="30,13 58,27 30,41"
            fill={isCond ? (isDark ? '#0284c7' : '#38bdf8') : bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="58" y1="13" x2="58" y2="41" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <text x="44" y="50" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="9" fontWeight="bold">
            1N4007
          </text>
        </svg>
      );
    }

    case 'ELEC_ZENER': {
      const isCond = state?.isConducting || isActive;
      const vZ = state?.zenerBreakdownVoltage ?? 5.1;
      return (
        <svg width={width} height={height} viewBox="0 0 88 54" className="overflow-visible select-none">
          <line x1="2" y1="27" x2="30" y2="27" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="58" y1="27" x2="86" y2="27" stroke={strokeColor} strokeWidth="2.5" />
          <polygon
            points="30,13 58,27 30,41"
            fill={isCond ? (isDark ? '#0284c7' : '#38bdf8') : bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M 52 13 L 58 13 L 58 41 L 64 41" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          <text x="44" y="50" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="9" fontWeight="bold">
            {vZ}V
          </text>
        </svg>
      );
    }

    case 'ELEC_LED': {
      const isCond = state?.isOn || state?.isConducting || isActive;
      return (
        <svg width={width} height={height} viewBox="0 0 88 54" className="overflow-visible select-none">
          <line x1="2" y1="27" x2="28" y2="27" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="56" y1="27" x2="86" y2="27" stroke={strokeColor} strokeWidth="2.5" />
          <polygon
            points="28,14 56,27 28,40"
            fill={isCond ? '#10b981' : bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="56" y1="14" x2="56" y2="40" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <path d="M 46 11 L 54 3 M 52 15 L 60 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <polygon points="56,2 53,4 55,6" fill="#10b981" />
          <polygon points="62,6 59,8 61,10" fill="#10b981" />
          <text x="42" y="50" textAnchor="middle" fill={isCond ? '#10b981' : isDark ? '#94a3b8' : '#64748b'} fontSize="9" fontWeight="bold">
            {isCond ? 'LIT' : 'LED'}
          </text>
        </svg>
      );
    }

    case 'ELEC_BATTERY': {
      const v = state?.voltageVolts ?? 9;
      return (
        <svg width={width} height={height} viewBox="0 0 80 60" className="overflow-visible select-none">
          <line x1="2" y1="30" x2="28" y2="30" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="52" y1="30" x2="78" y2="30" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="28" y1="18" x2="28" y2="42" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="38" y1="8" x2="38" y2="52" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <line x1="44" y1="18" x2="44" y2="42" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="52" y1="8" x2="52" y2="52" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          <text x="64" y="24" fill="#ef4444" fontSize="12" fontWeight="bold">+</text>
          <text x="14" y="24" fill="#64748b" fontSize="13" fontWeight="bold">-</text>
          <text x="40" y="58" textAnchor="middle" fill={isDark ? '#f87171' : '#dc2626'} fontSize="10" fontWeight="bold">
            +{v}V
          </text>
        </svg>
      );
    }

    case 'ELEC_GROUND': {
      return (
        <svg width={width} height={height} viewBox="0 0 60 44" className="overflow-visible select-none">
          <line x1="30" y1="2" x2="30" y2="18" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="12" y1="18" x2="48" y2="18" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          <line x1="18" y1="24" x2="42" y2="24" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="30" x2="36" y2="30" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
          <text x="30" y="42" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="8" fontWeight="bold">
            GND
          </text>
        </svg>
      );
    }

    case 'ELEC_AC_SOURCE': {
      const f = state?.frequencyHz ?? 60;
      return (
        <svg width={width} height={height} viewBox="0 0 76 60" className="overflow-visible select-none">
          <circle cx="38" cy="30" r="22" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <line x1="60" y1="30" x2="74" y2="30" stroke={strokeColor} strokeWidth="2.5" />
          <path
            d="M 24 30 Q 31 16 38 30 T 52 30"
            fill="none"
            stroke={isActive ? highSignalColor : strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text x="38" y="58" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="9" fontFamily="monospace">
            {f}Hz AC
          </text>
        </svg>
      );
    }

    case 'ELEC_NPN': {
      const isCond = state?.isConducting;
      return (
        <svg width={width} height={height} viewBox="0 0 92 76" className="overflow-visible select-none">
          <circle cx="50" cy="38" r="28" fill={bodyColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="2" y1="38" x2="38" y2="38" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="38" y1="20" x2="38" y2="56" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="38" y1="28" x2="62" y2="18" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="62" y1="18" x2="90" y2="18" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="38" y1="48" x2="62" y2="58" stroke={isCond ? highSignalColor : strokeColor} strokeWidth="2.5" />
          <line x1="62" y1="58" x2="90" y2="58" stroke={isCond ? highSignalColor : strokeColor} strokeWidth="2.5" />
          <polygon points="62,58 54,52 56,58" fill={isCond ? highSignalColor : strokeColor} />
          <text x="76" y="14" fill="#64748b" fontSize="8" fontWeight="bold">C</text>
          <text x="14" y="34" fill="#64748b" fontSize="8" fontWeight="bold">B</text>
          <text x="76" y="70" fill="#64748b" fontSize="8" fontWeight="bold">E</text>
        </svg>
      );
    }

    case 'ELEC_PNP': {
      const isCond = state?.isConducting;
      return (
        <svg width={width} height={height} viewBox="0 0 92 76" className="overflow-visible select-none">
          <circle cx="50" cy="38" r="28" fill={bodyColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="2" y1="38" x2="38" y2="38" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="38" y1="20" x2="38" y2="56" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="38" y1="28" x2="62" y2="18" stroke={isCond ? highSignalColor : strokeColor} strokeWidth="2.5" />
          <line x1="62" y1="18" x2="90" y2="18" stroke={isCond ? highSignalColor : strokeColor} strokeWidth="2.5" />
          <polygon points="46,24 54,20 54,28" fill={isCond ? highSignalColor : strokeColor} />
          <line x1="38" y1="48" x2="62" y2="58" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="62" y1="58" x2="90" y2="58" stroke={strokeColor} strokeWidth="2.5" />
          <text x="76" y="14" fill="#64748b" fontSize="8" fontWeight="bold">E</text>
          <text x="14" y="34" fill="#64748b" fontSize="8" fontWeight="bold">B</text>
          <text x="76" y="70" fill="#64748b" fontSize="8" fontWeight="bold">C</text>
        </svg>
      );
    }

    case 'ELEC_SWITCH': {
      const isOn = Boolean(state?.isOn);
      return (
        <svg width={width} height={height} viewBox="0 0 84 50" className="overflow-visible select-none">
          <line x1="2" y1="25" x2="26" y2="25" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="26" cy="25" r="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx="58" cy="25" r="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2" />
          <line x1="58" y1="25" x2="82" y2="25" stroke={strokeColor} strokeWidth="2.5" />
          {isOn ? (
            <line x1="26" y1="25" x2="58" y2="25" stroke={highSignalColor} strokeWidth="3.5" strokeLinecap="round" />
          ) : (
            <line x1="26" y1="25" x2="52" y2="10" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          )}
          <text x="42" y="44" textAnchor="middle" fill={isOn ? '#10b981' : '#64748b'} fontSize="9" fontWeight="bold">
            {isOn ? 'CLOSED' : 'OPEN'}
          </text>
        </svg>
      );
    }

    case 'ELEC_VOLTMETER': {
      const val = state?.measuredValue || '0.00 V';
      return (
        <svg width={width} height={height} viewBox="0 0 88 64" className="overflow-visible select-none">
          <rect x="18" y="6" width="52" height="52" rx="6" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <line x1="2" y1="20" x2="18" y2="20" stroke="#ef4444" strokeWidth="2.5" />
          <line x1="2" y1="44" x2="18" y2="44" stroke="#64748b" strokeWidth="2.5" />
          <text x="10" y="16" fill="#ef4444" fontSize="9" fontWeight="bold">+</text>
          <text x="10" y="40" fill="#64748b" fontSize="10" fontWeight="bold">-</text>
          <circle cx="44" cy="26" r="14" fill="none" stroke={strokeColor} strokeWidth="1.8" />
          <text x="44" y="31" textAnchor="middle" fill={isDark ? '#38bdf8' : '#0284c7'} fontSize="14" fontWeight="bold">
            V
          </text>
          <rect x="23" y="44" width="42" height="11" rx="2" fill="#0f172a" />
          <text x="44" y="53" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
            {val}
          </text>
        </svg>
      );
    }

    case 'ELEC_AMMETER': {
      const val = state?.measuredValue || '0.0 mA';
      return (
        <svg width={width} height={height} viewBox="0 0 88 64" className="overflow-visible select-none">
          <rect x="18" y="6" width="52" height="52" rx="6" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <line x1="2" y1="32" x2="18" y2="32" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="70" y1="32" x2="86" y2="32" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="44" cy="26" r="14" fill="none" stroke={strokeColor} strokeWidth="1.8" />
          <text x="44" y="31" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="bold">
            A
          </text>
          <rect x="23" y="44" width="42" height="11" rx="2" fill="#0f172a" />
          <text x="44" y="53" textAnchor="middle" fill="#f59e0b" fontSize="8" fontFamily="monospace" fontWeight="bold">
            {val}
          </text>
        </svg>
      );
    }

    case 'ELEC_OPAMP': {
      return (
        <svg width={width} height={height} viewBox="0 0 96 72" className="overflow-visible select-none">
          {/* Op-amp triangle */}
          <polygon
            points="22,10 76,36 22,62"
            fill={bodyColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Inverting (-) lead */}
          <line x1="2" y1="22" x2="22" y2="22" stroke={strokeColor} strokeWidth="2.5" />
          <text x="28" y="26" fill={isDark ? '#94a3b8' : '#475569'} fontSize="13" fontWeight="bold">-</text>
          {/* Non-inverting (+) lead */}
          <line x1="2" y1="50" x2="22" y2="50" stroke={strokeColor} strokeWidth="2.5" />
          <text x="28" y="54" fill="#ef4444" fontSize="12" fontWeight="bold">+</text>
          {/* Output lead */}
          <line x1="76" y1="36" x2="94" y2="36" stroke={isActive ? highSignalColor : strokeColor} strokeWidth="2.5" />
          {/* OpAmp Label */}
          <text x="44" y="40" textAnchor="middle" fill={isDark ? '#cbd5e1' : '#334155'} fontSize="9" fontWeight="bold" fontFamily="monospace">
            741
          </text>
        </svg>
      );
    }

    case 'ELEC_TRANSFORMER': {
      const ratio = state?.transformerRatio || 0.5;
      const ratioLabel = ratio < 1 ? `1:${Math.round(1 / ratio)}` : `${ratio}:1`;
      return (
        <svg width={width} height={height} viewBox="0 0 94 68" className="overflow-visible select-none">
          {/* Primary terminals */}
          <line x1="2" y1="18" x2="20" y2="18" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="2" y1="50" x2="20" y2="50" stroke={strokeColor} strokeWidth="2.5" />
          {/* Primary coil arcs */}
          <path
            d="M 20 18 A 6 6 0 0 1 20 28 A 6 6 0 0 1 20 38 A 6 6 0 0 1 20 48"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Iron core bars */}
          <line x1="44" y1="12" x2="44" y2="54" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="2" strokeDasharray="3 2" />
          <line x1="50" y1="12" x2="50" y2="54" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="2" strokeDasharray="3 2" />
          {/* Secondary coil arcs */}
          <path
            d="M 74 18 A 6 6 0 0 0 74 28 A 6 6 0 0 0 74 38 A 6 6 0 0 0 74 48"
            fill="none"
            stroke={isActive ? highSignalColor : strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Secondary terminals */}
          <line x1="74" y1="18" x2="92" y2="18" stroke={isActive ? highSignalColor : strokeColor} strokeWidth="2.5" />
          <line x1="74" y1="50" x2="92" y2="50" stroke={strokeColor} strokeWidth="2.5" />
          {/* Ratio badge */}
          <text x="47" y="64" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="9" fontFamily="monospace">
            {ratioLabel}
          </text>
        </svg>
      );
    }

    case 'ELEC_FUSE': {
      const isBlown = Boolean(state?.isFuseBlown);
      const rating = state?.fuseCurrentRating ?? 0.5;
      return (
        <svg width={width} height={height} viewBox="0 0 84 48" className="overflow-visible select-none">
          <line x1="2" y1="24" x2="20" y2="24" stroke={strokeColor} strokeWidth="2.5" />
          <line x1="64" y1="24" x2="82" y2="24" stroke={strokeColor} strokeWidth="2.5" />
          {/* Glass cartridge */}
          <rect x="20" y="12" width="44" height="24" rx="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2" />
          {/* Metal caps */}
          <rect x="20" y="12" width="8" height="24" rx="1" fill={isDark ? '#64748b' : '#cbd5e1'} />
          <rect x="56" y="12" width="8" height="24" rx="1" fill={isDark ? '#64748b' : '#cbd5e1'} />
          {/* Fuse element */}
          {isBlown ? (
            <path d="M 28 24 L 38 20 M 46 28 L 56 24" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path
              d="M 28 24 Q 35 18 42 24 T 56 24"
              fill="none"
              stroke={isActive ? highSignalColor : strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}
          <text
            x="42"
            y="44"
            textAnchor="middle"
            fill={isBlown ? '#ef4444' : isDark ? '#94a3b8' : '#64748b'}
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {isBlown ? 'BLOWN' : `${rating}A`}
          </text>
        </svg>
      );
    }

    case 'ELEC_SPDT_SWITCH': {
      const pos = state?.switchPosition || 'A';
      return (
        <svg width={width} height={height} viewBox="0 0 88 56" className="overflow-visible select-none">
          {/* Common input on left */}
          <line x1="2" y1="28" x2="24" y2="28" stroke={strokeColor} strokeWidth="2.5" />
          <circle cx="24" cy="28" r="4" fill={bodyColor} stroke={strokeColor} strokeWidth="2" />
          {/* Output A on top right */}
          <circle cx="64" cy="16" r="4" fill={bodyColor} stroke={pos === 'A' ? highSignalColor : strokeColor} strokeWidth="2" />
          <line x1="64" y1="16" x2="86" y2="16" stroke={pos === 'A' ? highSignalColor : strokeColor} strokeWidth="2.5" />
          <text x="76" y="11" fill="#64748b" fontSize="8" fontWeight="bold">A</text>
          {/* Output B on bottom right */}
          <circle cx="64" cy="40" r="4" fill={bodyColor} stroke={pos === 'B' ? highSignalColor : strokeColor} strokeWidth="2" />
          <line x1="64" y1="40" x2="86" y2="40" stroke={pos === 'B' ? highSignalColor : strokeColor} strokeWidth="2.5" />
          <text x="76" y="51" fill="#64748b" fontSize="8" fontWeight="bold">B</text>
          {/* Moving blade */}
          {pos === 'A' ? (
            <line x1="24" y1="28" x2="64" y2="16" stroke={highSignalColor} strokeWidth="3" strokeLinecap="round" />
          ) : (
            <line x1="24" y1="28" x2="64" y2="40" stroke={highSignalColor} strokeWidth="3" strokeLinecap="round" />
          )}
        </svg>
      );
    }

    case 'ELEC_OHMMETER': {
      const val = state?.measuredValue || '1.00 kΩ';
      return (
        <svg width={width} height={height} viewBox="0 0 88 64" className="overflow-visible select-none">
          <rect x="18" y="6" width="52" height="52" rx="6" fill={bodyColor} stroke={strokeColor} strokeWidth="2.5" />
          <line x1="2" y1="20" x2="18" y2="20" stroke="#3b82f6" strokeWidth="2.5" />
          <line x1="2" y1="44" x2="18" y2="44" stroke="#64748b" strokeWidth="2.5" />
          <circle cx="44" cy="26" r="14" fill="none" stroke={strokeColor} strokeWidth="1.8" />
          <text x="44" y="31" textAnchor="middle" fill="#10b981" fontSize="13" fontWeight="bold">
            Ω
          </text>
          <rect x="23" y="44" width="42" height="11" rx="2" fill="#0f172a" />
          <text x="44" y="53" textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="monospace" fontWeight="bold">
            {val}
          </text>
        </svg>
      );
    }

    default:
      return null;
  }
};

/**
 * Clean schematic previews for the Component Palette (supporting light and dark themes)
 */
export const PaletteGateSymbol: React.FC<{ type: NodeType; theme?: 'dark' | 'light' }> = ({
  type,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const stroke = isDark ? '#f1f5f9' : '#0f172a';
  const fill = isDark ? '#1e293b' : '#ffffff';

  switch (type) {
    case 'AND':
      return (
        <svg width="56" height="34" viewBox="0 0 68 40" className="overflow-visible">
          <path d="M 16 6 L 34 6 A 14 14 0 0 1 34 34 L 16 34 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="4" y1="12" x2="16" y2="12" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="12" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="28" x2="16" y2="28" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="28" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="48" y1="20" x2="62" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="62" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'NAND':
      return (
        <svg width="56" height="34" viewBox="0 0 68 40" className="overflow-visible">
          <path d="M 14 6 L 32 6 A 14 14 0 0 1 32 34 L 14 34 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="49" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="12" x2="14" y2="12" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="12" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="28" x2="14" y2="28" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="28" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="52" y1="20" x2="64" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="64" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'OR':
      return (
        <svg width="56" height="34" viewBox="0 0 68 40" className="overflow-visible">
          <path d="M 14 6 C 22 13, 22 27, 14 34 C 30 34, 46 28, 52 20 C 46 12, 30 6, 14 6 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="4" y1="12" x2="18" y2="12" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="12" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="28" x2="18" y2="28" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="28" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="52" y1="20" x2="64" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="64" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'NOR':
      return (
        <svg width="56" height="34" viewBox="0 0 68 40" className="overflow-visible">
          <path d="M 12 6 C 20 13, 20 27, 12 34 C 28 34, 44 28, 50 20 C 44 12, 28 6, 12 6 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="53" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="12" x2="16" y2="12" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="12" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="28" x2="16" y2="28" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="28" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="56" y1="20" x2="66" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="66" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'XOR':
      return (
        <svg width="56" height="34" viewBox="0 0 68 40" className="overflow-visible">
          <path d="M 10 6 C 18 13, 18 27, 10 34" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M 16 6 C 24 13, 24 27, 16 34 C 32 34, 48 28, 54 20 C 48 12, 32 6, 16 6 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="4" y1="12" x2="14" y2="12" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="12" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="28" x2="14" y2="28" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="28" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="54" y1="20" x2="66" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="66" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'XNOR':
      return (
        <svg width="56" height="34" viewBox="0 0 68 40" className="overflow-visible">
          <path d="M 8 6 C 16 13, 16 27, 8 34" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M 14 6 C 22 13, 22 27, 14 34 C 30 34, 46 28, 52 20 C 46 12, 30 6, 14 6 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="55" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="12" x2="12" y2="12" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="12" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="28" x2="12" y2="28" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="28" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="58" y1="20" x2="66" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="66" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'BUFFER':
      return (
        <svg width="56" height="34" viewBox="0 0 68 40" className="overflow-visible">
          <polygon points="16,6 48,20 16,34" fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="4" y1="20" x2="16" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="48" y1="20" x2="64" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="64" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'NOT':
      return (
        <svg width="56" height="34" viewBox="0 0 68 40" className="overflow-visible">
          <polygon points="14,6 44,20 14,34" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="48" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="20" x2="14" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="51" y1="20" x2="64" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="64" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'SWITCH':
      return (
        <svg width="44" height="34" viewBox="0 0 54 40" className="overflow-visible">
          <rect x="4" y="4" width="38" height="32" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <rect x="10" y="13" width="26" height="14" rx="7" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="18" cy="20" r="5" fill="#64748b" stroke="#0f172a" strokeWidth="1" />
          <line x1="42" y1="20" x2="52" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="52" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'LED':
      // Light Bulb icon in Palette
      return (
        <svg width="44" height="44" viewBox="0 0 44 48" className="overflow-visible">
          <path d="M 14 30 C 8 26, 6 12, 22 6 C 38 12, 36 26, 30 30 Z" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M 18 26 L 20 16 L 22 14 L 24 16 L 26 26" fill="none" stroke="#64748b" strokeWidth="1.5" />
          <rect x="17" y="30" width="10" height="4" fill="#94a3b8" stroke={stroke} strokeWidth="1.5" />
          <rect x="18" y="34" width="8" height="3" fill="#64748b" stroke={stroke} strokeWidth="1.5" />
          <circle cx="22" cy="42" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'SEVEN_SEG':
      // 4-Bit Digit icon in Palette
      return (
        <svg width="44" height="44" viewBox="0 0 50 56" className="overflow-visible">
          <rect x="12" y="4" width="34" height="48" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="29" y="36" textAnchor="middle" fill={stroke} fontSize="28" fontWeight="bold" fontFamily="monospace">
            F
          </text>
          <line x1="4" y1="14" x2="12" y2="14" stroke={stroke} strokeWidth="1.5" />
          <circle cx="4" cy="14" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="24" x2="12" y2="24" stroke={stroke} strokeWidth="1.5" />
          <circle cx="4" cy="24" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="34" x2="12" y2="34" stroke={stroke} strokeWidth="1.5" />
          <circle cx="4" cy="34" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="44" x2="12" y2="44" stroke={stroke} strokeWidth="1.5" />
          <circle cx="4" cy="44" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'BUTTON':
      return (
        <svg width="44" height="34" viewBox="0 0 54 40" className="overflow-visible">
          <rect x="4" y="4" width="36" height="32" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
          <rect x="12" y="10" width="20" height="20" rx="4" fill="#e2e8f0" stroke={stroke} strokeWidth="1.5" />
          <line x1="40" y1="20" x2="50" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="50" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'CLOCK':
      return (
        <svg width="44" height="34" viewBox="0 0 54 40" className="overflow-visible">
          <rect x="4" y="4" width="38" height="32" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M 12 24 L 18 24 L 18 14 L 26 14 L 26 24 L 34 24" fill="none" stroke={stroke} strokeWidth="2" />
          <line x1="42" y1="20" x2="52" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="52" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'HIGH_CONST':
      return (
        <svg width="44" height="34" viewBox="0 0 54 40" className="overflow-visible">
          <rect x="4" y="4" width="36" height="32" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="22" y="27" textAnchor="middle" fill={stroke} fontSize="20" fontWeight="bold">1</text>
          <line x1="40" y1="20" x2="50" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="50" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'LOW_CONST':
      return (
        <svg width="44" height="34" viewBox="0 0 54 40" className="overflow-visible">
          <rect x="4" y="4" width="36" height="32" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="22" y="27" textAnchor="middle" fill={stroke} fontSize="20" fontWeight="bold">0</text>
          <line x1="40" y1="20" x2="50" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="50" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'PROBE':
      return (
        <svg width="44" height="34" viewBox="0 0 54 40" className="overflow-visible">
          <line x1="4" y1="20" x2="14" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="14" y="6" width="36" height="28" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="32" y="26" textAnchor="middle" fill={stroke} fontSize="18" fontWeight="bold" fontFamily="monospace">?</text>
        </svg>
      );

    case 'BUZZER':
      return (
        <svg width="44" height="34" viewBox="0 0 54 40" className="overflow-visible">
          <line x1="4" y1="20" x2="14" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="14" y="6" width="36" height="28" rx="4" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M 22 16 L 30 12 L 30 28 L 22 24 Z" fill={stroke} />
          <path d="M 34 16 C 37 18, 37 22, 34 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'TRI_STATE':
      return (
        <svg width="56" height="34" viewBox="0 0 68 40" className="overflow-visible">
          <polygon points="16,6 48,20 16,34" fill={fill} stroke={stroke} strokeWidth="2" />
          <line x1="4" y1="20" x2="16" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="4" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="48" y1="20" x2="64" y2="20" stroke={stroke} strokeWidth="2" />
          <circle cx="64" cy="20" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="32" y1="38" x2="32" y2="26" stroke={stroke} strokeWidth="1.5" />
          <circle cx="32" cy="38" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'D_FLIP_FLOP':
      return (
        <svg width="50" height="36" viewBox="0 0 60 44" className="overflow-visible">
          <rect x="12" y="4" width="36" height="36" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="18" y="16" fill={stroke} fontSize="9" fontWeight="bold" fontFamily="monospace">D</text>
          <path d="M 12 28 L 17 32 L 12 36" fill="none" stroke={stroke} strokeWidth="1.5" />
          <text x="38" y="16" fill={stroke} fontSize="9" fontWeight="bold" fontFamily="monospace">Q</text>
          <text x="36" y="34" fill={stroke} fontSize="8" fontWeight="bold" fontFamily="monospace">~Q</text>
        </svg>
      );

    case 'T_FLIP_FLOP':
      return (
        <svg width="50" height="36" viewBox="0 0 60 44" className="overflow-visible">
          <rect x="12" y="4" width="36" height="36" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="18" y="16" fill={stroke} fontSize="9" fontWeight="bold" fontFamily="monospace">T</text>
          <path d="M 12 28 L 17 32 L 12 36" fill="none" stroke={stroke} strokeWidth="1.5" />
          <text x="38" y="16" fill={stroke} fontSize="9" fontWeight="bold" fontFamily="monospace">Q</text>
          <text x="36" y="34" fill={stroke} fontSize="8" fontWeight="bold" fontFamily="monospace">~Q</text>
        </svg>
      );

    case 'JK_FLIP_FLOP':
      return (
        <svg width="50" height="36" viewBox="0 0 60 44" className="overflow-visible">
          <rect x="12" y="4" width="36" height="36" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="17" y="14" fill={stroke} fontSize="8" fontWeight="bold" fontFamily="monospace">J</text>
          <path d="M 12 20 L 16 22 L 12 24" fill="none" stroke={stroke} strokeWidth="1.2" />
          <text x="17" y="34" fill={stroke} fontSize="8" fontWeight="bold" fontFamily="monospace">K</text>
          <text x="38" y="16" fill={stroke} fontSize="9" fontWeight="bold" fontFamily="monospace">Q</text>
          <text x="36" y="34" fill={stroke} fontSize="8" fontWeight="bold" fontFamily="monospace">~Q</text>
        </svg>
      );

    case 'SR_FLIP_FLOP':
      return (
        <svg width="50" height="36" viewBox="0 0 60 44" className="overflow-visible">
          <rect x="12" y="4" width="36" height="36" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="17" y="14" fill={stroke} fontSize="8" fontWeight="bold" fontFamily="monospace">S</text>
          <path d="M 12 20 L 16 22 L 12 24" fill="none" stroke={stroke} strokeWidth="1.2" />
          <text x="17" y="34" fill={stroke} fontSize="8" fontWeight="bold" fontFamily="monospace">R</text>
          <text x="38" y="16" fill={stroke} fontSize="9" fontWeight="bold" fontFamily="monospace">Q</text>
          <text x="36" y="34" fill={stroke} fontSize="8" fontWeight="bold" fontFamily="monospace">~Q</text>
        </svg>
      );

    case 'HALF_ADDER':
      return (
        <svg width="50" height="36" viewBox="0 0 60 44" className="overflow-visible">
          <rect x="12" y="4" width="36" height="36" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="30" y="22" textAnchor="middle" fill={stroke} fontSize="9" fontWeight="bold">HA</text>
          <text x="16" y="14" fill="#64748b" fontSize="7">A</text>
          <text x="16" y="34" fill="#64748b" fontSize="7">B</text>
          <text x="40" y="14" fill="#64748b" fontSize="7">Σ</text>
          <text x="40" y="34" fill="#64748b" fontSize="7">C</text>
        </svg>
      );

    case 'FULL_ADDER':
      return (
        <svg width="50" height="36" viewBox="0 0 60 44" className="overflow-visible">
          <rect x="12" y="4" width="36" height="36" rx="3" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="30" y="24" textAnchor="middle" fill={stroke} fontSize="9" fontWeight="bold">FA</text>
          <text x="15" y="13" fill="#64748b" fontSize="6">A</text>
          <text x="15" y="24" fill="#64748b" fontSize="6">B</text>
          <text x="14" y="35" fill="#64748b" fontSize="5">Ci</text>
          <text x="41" y="14" fill="#64748b" fontSize="7">Σ</text>
          <text x="39" y="34" fill="#64748b" fontSize="5">Co</text>
        </svg>
      );

    case 'MUX_2TO1':
      return (
        <svg width="50" height="36" viewBox="0 0 60 44" className="overflow-visible">
          <polygon points="14,6 44,12 44,32 14,38" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="28" y="25" textAnchor="middle" fill={stroke} fontSize="8" fontWeight="bold">MUX</text>
        </svg>
      );

    case 'DEMUX_1TO2':
      return (
        <svg width="50" height="36" viewBox="0 0 60 44" className="overflow-visible">
          <polygon points="14,12 44,6 44,38 14,32" fill={fill} stroke={stroke} strokeWidth="2" />
          <text x="28" y="25" textAnchor="middle" fill={stroke} fontSize="7" fontWeight="bold">DEMUX</text>
        </svg>
      );

    case 'FLOW_START':
      return (
        <svg width="54" height="34" viewBox="0 0 64 36" className="overflow-visible">
          <rect x="4" y="6" width="56" height="24" rx="12" fill={fill} stroke="#10b981" strokeWidth="2" />
          <polygon points="22,14 22,22 28,18" fill="#10b981" />
          <text x="38" y="21" fill={stroke} fontSize="8" fontWeight="bold">START</text>
        </svg>
      );

    case 'FLOW_END':
      return (
        <svg width="54" height="34" viewBox="0 0 64 36" className="overflow-visible">
          <rect x="4" y="6" width="56" height="24" rx="12" fill={fill} stroke="#ef4444" strokeWidth="2" />
          <rect x="20" y="14" width="8" height="8" rx="1" fill="#ef4444" />
          <text x="36" y="21" fill={stroke} fontSize="8" fontWeight="bold">END</text>
        </svg>
      );

    case 'FLOW_PROCESS':
      return (
        <svg width="54" height="34" viewBox="0 0 64 36" className="overflow-visible">
          <rect x="4" y="6" width="56" height="24" rx="4" fill={fill} stroke="#0284c7" strokeWidth="2" />
          <text x="32" y="21" textAnchor="middle" fill={stroke} fontSize="8" fontWeight="bold">ACTION</text>
        </svg>
      );

    case 'FLOW_DECISION':
      return (
        <svg width="54" height="34" viewBox="0 0 64 36" className="overflow-visible">
          <polygon points="32,4 58,18 32,32 6,18" fill={fill} stroke="#f59e0b" strokeWidth="2" />
          <text x="32" y="21" textAnchor="middle" fill={stroke} fontSize="8" fontWeight="bold">IF ?</text>
        </svg>
      );

    case 'FLOW_INPUT':
      return (
        <svg width="54" height="34" viewBox="0 0 64 36" className="overflow-visible">
          <polygon points="12,6 58,6 50,30 4,30" fill={fill} stroke="#9333ea" strokeWidth="2" />
          <text x="31" y="21" textAnchor="middle" fill={stroke} fontSize="8" fontWeight="bold">READ</text>
        </svg>
      );

    case 'FLOW_OUTPUT':
      return (
        <svg width="54" height="34" viewBox="0 0 64 36" className="overflow-visible">
          <polygon points="12,6 58,6 50,30 4,30" fill={fill} stroke="#0891b2" strokeWidth="2" />
          <text x="31" y="21" textAnchor="middle" fill={stroke} fontSize="8" fontWeight="bold">PRINT</text>
        </svg>
      );

    case 'FLOW_CONNECTOR':
      return (
        <svg width="44" height="34" viewBox="0 0 44 36" className="overflow-visible">
          <circle cx="22" cy="18" r="12" fill={fill} stroke={stroke} strokeWidth="2" />
          <circle cx="22" cy="18" r="3" fill={stroke} />
        </svg>
      );

    case 'FLOW_SUBROUTINE':
      return (
        <svg width="54" height="34" viewBox="0 0 64 36" className="overflow-visible">
          <rect x="4" y="6" width="56" height="24" rx="3" fill={fill} stroke="#ec4899" strokeWidth="2" />
          <line x1="12" y1="6" x2="12" y2="30" stroke={stroke} strokeWidth="1.5" />
          <line x1="52" y1="6" x2="52" y2="30" stroke={stroke} strokeWidth="1.5" />
          <text x="32" y="21" textAnchor="middle" fill={stroke} fontSize="8" fontWeight="bold">CALL</text>
        </svg>
      );

    case 'SUBCIRCUIT':
    case 'SUB_CIRCUIT':
      return (
        <svg width="56" height="34" viewBox="0 0 68 40" className="overflow-visible">
          <rect x="14" y="6" width="40" height="28" rx="4" fill={fill} stroke="#0284c7" strokeWidth="2" />
          <path d="M 30 6 A 4 4 0 0 0 38 6" fill="none" stroke="#0284c7" strokeWidth="1.5" />
          <text x="34" y="23" textAnchor="middle" fill={stroke} fontSize="8" fontWeight="bold">IC</text>
        </svg>
      );

    case 'ELEC_RESISTOR':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="2" y1="18" x2="14" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="50" y1="18" x2="62" y2="18" stroke={stroke} strokeWidth="2" />
          <polyline
            points="14,18 19,10 24,26 29,10 34,26 39,10 44,26 50,18"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'ELEC_POTENTIOMETER':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="2" y1="12" x2="16" y2="12" stroke={stroke} strokeWidth="1.5" />
          <line x1="2" y1="24" x2="16" y2="24" stroke={stroke} strokeWidth="1.5" />
          <rect x="16" y="8" width="32" height="20" rx="3" fill={fill} stroke="#f59e0b" strokeWidth="1.8" />
          <line x1="48" y1="18" x2="62" y2="18" stroke={stroke} strokeWidth="1.5" />
          <polygon points="36,18 42,15 42,21" fill="#0284c7" />
        </svg>
      );

    case 'ELEC_CAPACITOR':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="4" y1="18" x2="26" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="38" y1="18" x2="60" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="26" y1="6" x2="26" y2="30" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
          <line x1="38" y1="6" x2="38" y2="30" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'ELEC_INDUCTOR':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="2" y1="18" x2="12" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="52" y1="18" x2="62" y2="18" stroke={stroke} strokeWidth="2" />
          <path
            d="M 12 18 A 5 5 0 0 1 22 18 A 5 5 0 0 1 32 18 A 5 5 0 0 1 42 18 A 5 5 0 0 1 52 18"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'ELEC_DIODE':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="4" y1="18" x2="22" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="42" y1="18" x2="60" y2="18" stroke={stroke} strokeWidth="2" />
          <polygon points="22,8 42,18 22,28" fill="#0284c7" stroke={stroke} strokeWidth="1.8" />
          <line x1="42" y1="8" x2="42" y2="28" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'ELEC_ZENER':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="4" y1="18" x2="22" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="42" y1="18" x2="60" y2="18" stroke={stroke} strokeWidth="2" />
          <polygon points="22,8 42,18 22,28" fill="#0284c7" stroke={stroke} strokeWidth="1.8" />
          <path d="M 37 8 L 42 8 L 42 28 L 47 28" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'ELEC_LED':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="4" y1="18" x2="20" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="38" y1="18" x2="56" y2="18" stroke={stroke} strokeWidth="2" />
          <polygon points="20,9 38,18 20,27" fill="#10b981" stroke={stroke} strokeWidth="1.8" />
          <line x1="38" y1="9" x2="38" y2="27" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 30 7 L 36 2 M 36 10 L 42 5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'ELEC_BATTERY':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="4" y1="18" x2="24" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="40" y1="18" x2="60" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="24" y1="10" x2="24" y2="26" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="5" x2="32" y2="31" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="40" y1="5" x2="40" y2="31" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
          <text x="47" y="14" fill="#ef4444" fontSize="8" fontWeight="bold">+</text>
        </svg>
      );

    case 'ELEC_GROUND':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="32" y1="4" x2="32" y2="16" stroke={stroke} strokeWidth="2" />
          <line x1="16" y1="16" x2="48" y2="16" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="21" x2="42" y2="21" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="28" y1="26" x2="36" y2="26" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'ELEC_AC_SOURCE':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <circle cx="32" cy="18" r="14" fill={fill} stroke={stroke} strokeWidth="2" />
          <path d="M 22 18 Q 27 10 32 18 T 42 18" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'ELEC_NPN':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <circle cx="34" cy="18" r="14" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="6" y1="18" x2="26" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="26" y1="10" x2="26" y2="26" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="26" y1="13" x2="42" y2="8" stroke={stroke} strokeWidth="1.5" />
          <line x1="26" y1="23" x2="42" y2="28" stroke="#0284c7" strokeWidth="1.5" />
          <polygon points="42,28 36,25 38,28" fill="#0284c7" />
        </svg>
      );

    case 'ELEC_PNP':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <circle cx="34" cy="18" r="14" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="6" y1="18" x2="26" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="26" y1="10" x2="26" y2="26" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="26" y1="13" x2="42" y2="8" stroke="#0284c7" strokeWidth="1.5" />
          <polygon points="31,14 36,11 36,17" fill="#0284c7" />
          <line x1="26" y1="23" x2="42" y2="28" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'ELEC_SWITCH':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="6" y1="18" x2="22" y2="18" stroke={stroke} strokeWidth="2" />
          <circle cx="22" cy="18" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="44" cy="18" r="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="44" y1="18" x2="58" y2="18" stroke={stroke} strokeWidth="2" />
          <line x1="22" y1="18" x2="40" y2="8" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'ELEC_VOLTMETER':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <rect x="14" y="4" width="36" height="28" rx="4" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <circle cx="32" cy="18" r="9" fill="none" stroke="#0284c7" strokeWidth="1.5" />
          <text x="32" y="22" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="bold">V</text>
        </svg>
      );

    case 'ELEC_AMMETER':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <rect x="14" y="4" width="36" height="28" rx="4" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <circle cx="32" cy="18" r="9" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="32" y="22" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="bold">A</text>
        </svg>
      );

    case 'ELEC_OPAMP':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <polygon points="16,6 48,18 16,30" fill={fill} stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
          <line x1="4" y1="12" x2="16" y2="12" stroke={stroke} strokeWidth="1.5" />
          <line x1="4" y1="24" x2="16" y2="24" stroke={stroke} strokeWidth="1.5" />
          <line x1="48" y1="18" x2="60" y2="18" stroke={stroke} strokeWidth="1.5" />
        </svg>
      );

    case 'ELEC_TRANSFORMER':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <path d="M 18 8 A 4 4 0 0 1 18 14 A 4 4 0 0 1 18 20 A 4 4 0 0 1 18 26" fill="none" stroke={stroke} strokeWidth="1.8" />
          <line x1="30" y1="6" x2="30" y2="28" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2 1" />
          <line x1="34" y1="6" x2="34" y2="28" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2 1" />
          <path d="M 46 8 A 4 4 0 0 0 46 14 A 4 4 0 0 0 46 20 A 4 4 0 0 0 46 26" fill="none" stroke={stroke} strokeWidth="1.8" />
        </svg>
      );

    case 'ELEC_FUSE':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="4" y1="18" x2="16" y2="18" stroke={stroke} strokeWidth="1.8" />
          <line x1="48" y1="18" x2="60" y2="18" stroke={stroke} strokeWidth="1.8" />
          <rect x="16" y="10" width="32" height="16" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M 22 18 Q 28 13 32 18 T 42 18" fill="none" stroke="#0284c7" strokeWidth="1.5" />
        </svg>
      );

    case 'ELEC_SPDT_SWITCH':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <line x1="6" y1="18" x2="18" y2="18" stroke={stroke} strokeWidth="1.5" />
          <circle cx="18" cy="18" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="44" cy="10" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="44" cy="26" r="2.5" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <line x1="18" y1="18" x2="42" y2="10" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'ELEC_OHMMETER':
      return (
        <svg width="54" height="32" viewBox="0 0 64 36" className="overflow-visible">
          <rect x="14" y="4" width="36" height="28" rx="4" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <circle cx="32" cy="18" r="9" fill="none" stroke="#10b981" strokeWidth="1.5" />
          <text x="32" y="22" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold">Ω</text>
        </svg>
      );

    default:
      return null;
  }
};
