import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  KeyRound, 
  Phone, 
  Mail, 
  Minimize2, 
  Maximize2, 
  Building2, 
  ShieldAlert, 
  Calendar,
  Sparkles,
  Play
} from 'lucide-react';
import { Subscription } from '../types';

interface DailyLicenseWarningModalProps {
  clientSub: Subscription | null;
  daysRemaining: number;
  onOpenRenewalModal: () => void;
  isSuperAdmin?: boolean;
}

export const DailyLicenseWarningModal: React.FC<DailyLicenseWarningModalProps> = ({
  clientSub,
  daysRemaining,
  onOpenRenewalModal,
  isSuperAdmin = false
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 minutes = 300s
  const [triggerSource, setTriggerSource] = useState<'scheduled_10am' | 'test'>('scheduled_10am');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Vérification de l'heure : 10h00 chaque jour
  useEffect(() => {
    // Ne pas afficher pour le Super Admin (il administre les licences) sauf en test
    if (isSuperAdmin) return;

    const checkTimeAndTrigger = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Fenêtre de 10h00 : de 10h00 à 10h05
      const isTenAMWindow = currentHour === 10 && currentMinute < 5;

      const lastDate = localStorage.getItem('gasoilpro_daily_warning_10h_date');
      const startTimeStr = localStorage.getItem('gasoilpro_daily_warning_10h_start_time');

      if (isTenAMWindow) {
        if (lastDate !== todayStr) {
          // Premier déclenchement de la journée à 10h00
          localStorage.setItem('gasoilpro_daily_warning_10h_date', todayStr);
          const startNow = Date.now();
          localStorage.setItem('gasoilpro_daily_warning_10h_start_time', startNow.toString());
          setSecondsRemaining(300);
          setIsVisible(true);
          setIsMinimized(false);
          setTriggerSource('scheduled_10am');
        } else if (startTimeStr) {
          // Déjà déclenché aujourd'hui, vérifier si les 5 minutes sont encore en cours
          const elapsedSeconds = Math.floor((Date.now() - parseInt(startTimeStr, 10)) / 1000);
          if (elapsedSeconds < 300) {
            setSecondsRemaining(300 - elapsedSeconds);
            setIsVisible(true);
            setTriggerSource('scheduled_10am');
          }
        }
      }
    };

    // Vérifier immédiatement à l'ouverture
    checkTimeAndTrigger();

    // Vérifier toutes les 10 secondes
    const interval = setInterval(checkTimeAndTrigger, 10000);
    return () => clearInterval(interval);
  }, [todayStr, isSuperAdmin]);

  // Décompte des 5 minutes lorsque la modale est active
  useEffect(() => {
    if (!isVisible || secondsRemaining <= 0) {
      if (isVisible && secondsRemaining <= 0) {
        setIsVisible(false);
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, secondsRemaining]);

  // Fonction pour déclencher un test manuel de 5 minutes
  const handleTestWarning = () => {
    setSecondsRemaining(300);
    setIsVisible(true);
    setIsMinimized(false);
    setTriggerSource('test');
  };

  // Écouter un événement personnalisé pour déclencher le test depuis d'autres composants
  useEffect(() => {
    const handleCustomTrigger = () => handleTestWarning();
    window.addEventListener('gasoilpro:test-10am-warning', handleCustomTrigger);
    return () => window.removeEventListener('gasoilpro:test-10am-warning', handleCustomTrigger);
  }, []);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 300) * 100));

  if (!isVisible) {
    return null;
  }

  // Version minimisée (Bandeau flottant en bas à droite)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-3 duration-200">
        <div className="bg-slate-900 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-center gap-3.5 max-w-md backdrop-blur-xl">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-400 text-xs truncate">
                AVERTISSEMENT RENOUVELLEMENT (10H00)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono-num font-bold text-[10px]">
                {formatTimer(secondsRemaining)}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {clientSub?.entreprise || 'Entreprise'} • {daysRemaining} jour(s) restant(s)
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
              title="Agrandir la notification"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenRenewalModal}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition shadow flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Renouveler</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modale Complète Plein Écran / Centrée
  return (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl shadow-amber-950/50 relative overflow-hidden space-y-5">
        
        {/* Glow ambient background effect */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 h-56 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Controls: Minimize */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>ALERTE QUOTIDIENNE PROGRAMMÉE À 10H00 • DURÉE : 5 MINUTES</span>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1 text-xs"
            title="Réduire en bandeau flottant"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="text-[11px] hidden sm:inline">Réduire</span>
          </button>
        </div>

        {/* Header Title with Official Moroccan Stamp */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
            <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <span>🇲🇦 GASOILPRO MAROC</span>
              <span>•</span>
              <span>SUPERVISION MÉTROLOGIQUE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 font-industrial tracking-tight leading-snug">
              AVERTISSEMENT DE RENOUVELLEMENT DE LICENCE
            </h2>
            <p className="text-xs text-slate-300">
              Notification journalière obligatoire pour le suivi de validité de votre système industriel GasoilPro.
            </p>
          </div>
        </div>

        {/* 5-Minute Live Countdown Timer */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Temps d'affichage restant (5 min obligatoires) :</span>
            </span>
            <span className="font-mono-num font-extrabold text-amber-400 text-base">
              {formatTimer(secondsRemaining)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/60">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-1000 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 text-right">
            Ce message disparaîtra automatiquement à l'issue des 5 minutes d'affichage.
          </p>
        </div>

        {/* Client & License Status Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Entreprise Titulaire</span>
            <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{clientSub?.entreprise || 'Établissement Client'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Formule : <strong className="text-amber-300">{clientSub?.plan || 'Standard'}</strong>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Échéance Contractuelle</span>
            <div className="font-mono-num font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{clientSub?.dateExpiration || 'À vérifier'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Validité : <strong className={`${daysRemaining <= 15 ? 'text-red-400' : 'text-amber-300'}`}>{daysRemaining} jour(s) restant(s)</strong>
            </div>
          </div>
        </div>

        {/* Detailed Information & Rules */}
        <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-orange-950/20 to-slate-950 rounded-xl border border-amber-500/30 text-xs text-slate-300 space-y-2">
          <div className="font-bold text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Procédure de Continuité d'Exploitation :</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            Afin d'éviter tout blocage de vos pompes et volucompteurs en cas d'expiration, veuillez vous procurer votre nouvelle <strong>clé officielle à 36 caractères</strong> auprès de la direction OuaradTech et l'enregistrer dans l'application.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-2 w-full sm:w-auto">
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span>Support OuaradTech : <strong className="text-amber-300">+212 6 61 00 26 26</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition cursor-pointer"
            >
              Réduire en bandeau (5 min)
            </button>

            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                onOpenRenewalModal();
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Saisir la Clé de Renouvellement</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
