import React from 'react';
import { AppTheme, ThemeConfig } from '../types';
import { AVAILABLE_THEMES } from '../mockData';
import { Palette, CheckCircle2, Sparkles, Sun, Moon, Shield, Fuel } from 'lucide-react';

interface ThemeSelectorModuleProps {
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeSelectorModule: React.FC<ThemeSelectorModuleProps> = ({
  currentTheme,
  onSelectTheme
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Palette className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 font-industrial tracking-wide flex items-center gap-2">
                Collection Thèmes Graphiques Élégants
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Harmonies graphiques haute fidélité pour postes de commandement, salons de direction, supervision extérieure et bureaux de gestion.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-num bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Thème Actif : </span>
          <span className="font-bold text-amber-400 uppercase">
            {AVAILABLE_THEMES.find(t => t.id === currentTheme)?.nom || currentTheme}
          </span>
        </div>
      </div>

      {/* Grille des thèmes élégants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AVAILABLE_THEMES.map((theme: ThemeConfig) => {
          const isSelected = currentTheme === theme.id;

          return (
            <div
              key={theme.id}
              onClick={() => onSelectTheme(theme.id)}
              className={`rounded-2xl border transition-all duration-200 cursor-pointer p-5 flex flex-col justify-between relative overflow-hidden group shadow-lg ${
                isSelected
                  ? 'border-amber-400 bg-slate-900 ring-2 ring-amber-500/30 shadow-amber-500/10 scale-[1.01]'
                  : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Corner badge if selected */}
              {isSelected && (
                <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-bold px-3 py-0.5 rounded-bl-xl flex items-center gap-1 shadow-md">
                  <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                  <span>ACTIF</span>
                </div>
              )}

              <div>
                {/* Header card with color swatch */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-lg shadow-md flex items-center justify-center font-bold text-xs"
                      style={{ backgroundColor: theme.accentHex, color: theme.isDark ? '#000' : '#fff' }}
                    >
                      <Fuel className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 font-industrial">
                        {theme.nom}
                      </h4>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        {theme.isDark ? <Moon className="w-2.5 h-2.5 text-blue-400" /> : <Sun className="w-2.5 h-2.5 text-amber-500" />}
                        {theme.isDark ? 'Mode Nuit / Sombre' : 'Mode Jour / Clair'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {theme.description}
                </p>

                {/* Palette visual preview */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Aperçu Palette & Contraste
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Background swatch */}
                    <div 
                      className="w-10 h-6 rounded border border-slate-700 flex items-center justify-center text-[9px] font-mono-num font-bold text-slate-400"
                      style={{ backgroundColor: theme.bgHex }}
                      title="Fond principal"
                    >
                      Fond
                    </div>
                    {/* Accent swatch */}
                    <div 
                      className="flex-1 h-6 rounded flex items-center justify-center text-[10px] font-mono-num font-bold shadow-sm"
                      style={{ 
                        backgroundColor: theme.accentHex,
                        color: theme.isDark ? '#020617' : '#ffffff'
                      }}
                      title="Couleur accentuelle"
                    >
                      Boutons & Jauges ({theme.accentHex})
                    </div>
                  </div>
                </div>
              </div>

              {/* Action button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTheme(theme.id);
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  isSelected
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                }`}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    <span>Thème Actuellement Appliqué</span>
                  </>
                ) : (
                  <>
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>Sélectionner ce Thème</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
