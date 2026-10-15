import React from 'react';
import { Citerne } from '../types';
import { AlertTriangle, Droplets, Thermometer, Gauge, ShieldCheck, MapPin } from 'lucide-react';

interface CiterneGraphicProps {
  citerne: Citerne;
  compact?: boolean;
  onSimulateLevelChange?: (newLevel: number) => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

export const CiterneGraphic: React.FC<CiterneGraphicProps> = ({
  citerne,
  compact = false,
  onSimulateLevelChange,
  onSelect,
  isSelected = false
}) => {
  const percentage = Math.min(100, Math.max(0, (citerne.stockActuel / citerne.capaciteTotale) * 100));
  const isCritical = citerne.stockActuel <= citerne.seuilCritique;
  const isWarning = !isCritical && citerne.stockActuel <= citerne.seuilAlerteBas;
  const volumeDisponible = citerne.capaciteTotale - citerne.stockActuel;

  // Liquid height within SVG viewport (viewbox 0 0 340 200)
  // Tank interior is roughly y: 40 to y: 160 (height: 120px)
  const tankTop = 38;
  const tankHeight = 118;
  const fillHeight = (percentage / 100) * tankHeight;
  const liquidY = tankTop + (tankHeight - fillHeight);

  // Status color helpers
  const statusColor = isCritical 
    ? 'text-red-400 bg-red-950/80 border-red-500/40' 
    : isWarning 
    ? 'text-amber-400 bg-amber-950/80 border-amber-500/40' 
    : 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40';

  const liquidGradientId = `gasoil-grad-${citerne.id}`;
  const clipId = `tank-clip-${citerne.id}`;

  return (
    <div 
      onClick={onSelect}
      className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected 
          ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/50' 
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
      } ${compact ? 'p-3' : 'p-5'}`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-industrial text-xs tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 font-bold">
              {citerne.code}
            </span>
            <h3 className="font-semibold text-slate-100 text-sm md:text-base leading-tight">
              {citerne.nom}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{citerne.emplacement}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-medium">{citerne.typeGasoil}</span>
          </div>
        </div>

        {/* State Badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${statusColor}`}>
          {isCritical ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-red-400" />
              <span>CRITIQUE</span>
            </>
          ) : isWarning ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>RÉSERVE BASSE</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>OPTIMAL</span>
            </>
          )}
        </div>
      </div>

      {/* SVG Realistic Tank Graphic */}
      <div className="relative my-2 flex justify-center items-center bg-slate-950/70 rounded-lg p-3 border border-slate-800/80">
        <svg 
          viewBox="0 0 360 195" 
          className="w-full max-w-[420px] h-auto drop-shadow-md select-none"
        >
          <defs>
            {/* Liquid gradient with amber glow */}
            <linearGradient id={liquidGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#d97706" stopOpacity="0.92" />
              <stop offset="70%" stopColor="#b45309" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0.98" />
            </linearGradient>

            {/* Tank metal body gradient */}
            <linearGradient id="tankBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="15%" stopColor="#334155" />
              <stop offset="60%" stopColor="#1e293b" />
              <stop offset="90%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Steel highlight */}
            <linearGradient id="metalHighlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#475569" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.7" />
            </linearGradient>

            {/* Clip path of the cylindrical inner tank */}
            <clipPath id={clipId}>
              <rect x="40" y="38" width="280" height="118" rx="28" ry="28" />
            </clipPath>
          </defs>

          {/* Concrete / Steel Foundation Saddles (Berceaux de pose) */}
          <path d="M70 156 L60 180 L110 180 L100 156 Z" fill="#334155" stroke="#1e293b" strokeWidth="2" />
          <path d="M260 156 L250 180 L300 180 L290 156 Z" fill="#334155" stroke="#1e293b" strokeWidth="2" />
          <rect x="50" y="180" width="260" height="6" rx="2" fill="#1e293b" />

          {/* Upper Piping & Manhole (Trou d'homme, évent, sonde) */}
          {/* Manhole dome */}
          <rect x="155" y="24" width="50" height="15" rx="3" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          <circle cx="180" cy="24" r="6" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
          
          {/* Vent Pipe (Event) */}
          <path d="M90 38 L90 20 L105 20 L105 26" fill="none" stroke="#64748b" strokeWidth="4" strokeLinecap="round" />
          
          {/* Inlet & Sensor Flange */}
          <rect x="250" y="28" width="24" height="10" rx="2" fill="#475569" stroke="#64748b" strokeWidth="1" />
          <circle cx="262" cy="24" r="3" fill="#38bdf8" />

          {/* Main Tank Shell (Background) */}
          <rect 
            x="40" 
            y="38" 
            width="280" 
            height="118" 
            rx="28" 
            ry="28" 
            fill="url(#tankBodyGrad)" 
            stroke="#64748b" 
            strokeWidth="3.5"
          />

          {/* Liquid Masked Fill */}
          <g clipPath={`url(#${clipId})`}>
            {/* Liquid Background */}
            <rect 
              x="30" 
              y={liquidY} 
              width="300" 
              height={fillHeight + 40} 
              fill={`url(#${liquidGradientId})`} 
            />

            {/* Liquid Waves */}
            {percentage > 1 && percentage < 99 && (
              <>
                <path 
                  d={`M30 ${liquidY} Q 80 ${liquidY - 5}, 140 ${liquidY} T 240 ${liquidY} T 340 ${liquidY} L 340 ${liquidY + 10} L 30 ${liquidY + 10} Z`}
                  fill="#fbbf24"
                  opacity="0.5"
                  className="animate-wave"
                />
                <path 
                  d={`M30 ${liquidY + 2} Q 90 ${liquidY + 6}, 160 ${liquidY + 2} T 280 ${liquidY + 2} T 350 ${liquidY + 2} L 350 ${liquidY + 12} L 30 ${liquidY + 12} Z`}
                  fill="#fef08a"
                  opacity="0.3"
                  className="animate-wave-slow"
                />
              </>
            )}

            {/* Bottom sediment line (anti-fouling) */}
            <rect x="40" y="152" width="280" height="4" fill="#451a03" opacity="0.4" />
          </g>

          {/* Realistic Metallic Shell Highlights & Glass Reflection */}
          <rect 
            x="40" 
            y="38" 
            width="280" 
            height="118" 
            rx="28" 
            ry="28" 
            fill="url(#metalHighlight)" 
            pointerEvents="none"
          />

          {/* Horizontal Tank Shell Ribs (Anneaux de renfort) */}
          <line x1="110" y1="38" x2="110" y2="156" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.3" />
          <line x1="180" y1="38" x2="180" y2="156" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />
          <line x1="250" y1="38" x2="250" y2="156" stroke="#94a3b8" strokeWidth="1" strokeOpacity="0.3" />

          {/* Graduated Scale Rule on Left */}
          <g opacity="0.8">
            <line x1="56" y1="46" x2="56" y2="148" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* 100% */}
            <line x1="52" y1="46" x2="60" y2="46" stroke="#cbd5e1" strokeWidth="1.5" />
            <text x="64" y="49" fill="#94a3b8" fontSize="8" fontFamily="monospace">100%</text>
            
            {/* 75% */}
            <line x1="53" y1="71" x2="59" y2="71" stroke="#cbd5e1" strokeWidth="1" />
            <text x="64" y="74" fill="#94a3b8" fontSize="8" fontFamily="monospace">75%</text>
            
            {/* 50% */}
            <line x1="50" y1="97" x2="62" y2="97" stroke="#cbd5e1" strokeWidth="1.5" />
            <text x="64" y="100" fill="#94a3b8" fontSize="8" fontFamily="monospace">50%</text>
            
            {/* 25% */}
            <line x1="53" y1="123" x2="59" y2="123" stroke="#cbd5e1" strokeWidth="1" />
            <text x="64" y="126" fill="#94a3b8" fontSize="8" fontFamily="monospace">25%</text>
            
            {/* 0% */}
            <line x1="52" y1="148" x2="60" y2="148" stroke="#cbd5e1" strokeWidth="1.5" />
            <text x="64" y="151" fill="#94a3b8" fontSize="8" fontFamily="monospace">0%</text>
          </g>

          {/* Level Cursor Pointer */}
          <polygon 
            points={`38,${liquidY} 46,${liquidY - 4} 46,${liquidY + 4}`} 
            fill="#f59e0b" 
            stroke="#ffffff" 
            strokeWidth="0.8" 
          />

          {/* Center Digital HUD Badge */}
          <g transform="translate(180, 97)">
            <rect x="-60" y="-18" width="120" height="36" rx="6" fill="#020617" fillOpacity="0.85" stroke="#475569" strokeWidth="1" />
            <text x="0" y="-1" textAnchor="middle" fill="#f8fafc" fontSize="15" fontWeight="bold" fontFamily="monospace">
              {percentage.toFixed(1)} %
            </text>
            <text x="0" y="12" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
              {citerne.stockActuel.toLocaleString('fr-FR')} L
            </text>
          </g>
        </svg>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
        <div className="bg-slate-950/50 p-2 rounded border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Stock Actuel</span>
          <span className="font-mono-num font-bold text-amber-400 text-sm">
            {citerne.stockActuel.toLocaleString('fr-FR')} L
          </span>
        </div>

        <div className="bg-slate-950/50 p-2 rounded border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Capacité Totale</span>
          <span className="font-mono-num text-slate-200 text-sm">
            {citerne.capaciteTotale.toLocaleString('fr-FR')} L
          </span>
        </div>

        <div className="bg-slate-950/50 p-2 rounded border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Dispo Dépotage</span>
          <span className="font-mono-num font-semibold text-emerald-400 text-sm">
            {volumeDisponible.toLocaleString('fr-FR')} L
          </span>
        </div>

        <div className="bg-slate-950/50 p-2 rounded border border-slate-800/80">
          <span className="text-slate-400 block text-[11px]">Sonde T° / Densité</span>
          <div className="flex items-center gap-1.5 text-slate-300 font-mono-num mt-0.5">
            <Thermometer className="w-3.5 h-3.5 text-blue-400" />
            <span>{citerne.temperatureC}°C</span>
            <span className="text-slate-600">|</span>
            <span>{citerne.densiteKgL}</span>
          </div>
        </div>
      </div>

      {/* Interactive Simulation Slider (if enabled) */}
      {onSimulateLevelChange && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 bg-slate-950/40 p-2.5 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Gauge className="w-3.5 h-3.5 text-amber-500" />
              Simulateur Jauge Magnétostrictive (Test Direct) :
            </span>
            <span className="font-mono-num text-amber-400 font-bold">
              {citerne.stockActuel.toLocaleString('fr-FR')} L ({percentage.toFixed(0)}%)
            </span>
          </div>
          <input 
            type="range"
            min="0"
            max={citerne.capaciteTotale}
            step="500"
            value={citerne.stockActuel}
            onChange={(e) => onSimulateLevelChange(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono-num">
            <span>0 L (Vide)</span>
            <span className="text-red-400">Critique: {citerne.seuilCritique}L</span>
            <span className="text-amber-400">Alerte: {citerne.seuilAlerteBas}L</span>
            <span>{citerne.capaciteTotale} L (Plein)</span>
          </div>
        </div>
      )}
    </div>
  );
};
