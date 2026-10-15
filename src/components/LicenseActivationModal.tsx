import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Phone, 
  Building, 
  Calendar, 
  Sparkles,
  Lock,
  X
} from 'lucide-react';
import { Subscription } from '../types';
import { validateLicenseKeyFormat } from '../lib/licenseUtils';

interface LicenseActivationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  activeSubscription: Subscription | null;
  onActivateSuccess: (subscription: Subscription) => void;
  isMandatoryBlock?: boolean; // True si l'application est bloquée car pas de licence valide
}

export const LicenseActivationModal: React.FC<LicenseActivationModalProps> = ({
  isOpen,
  onClose,
  activeSubscription,
  onActivateSuccess,
  isMandatoryBlock = false
}) => {
  const [inputCode, setInputCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<Subscription | null>(null);
  const [copiedSample, setCopiedSample] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const [bypassPin, setBypassPin] = useState('');

  if (!isOpen) return null;

  const handleVerifyAndActivate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const formatCheck = validateLicenseKeyFormat(inputCode);
    if (!formatCheck.isValid) {
      setErrorMessage(formatCheck.reason || 'Code de licence à 36 caractères invalide.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Appel Backend /api/subscriptions/verify
      const verifyRes = await fetch('/api/subscriptions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formatCheck.normalizedKey })
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.valid) {
        setErrorMessage(verifyData.message || 'Code de licence non valide ou expiré.');
        setIsLoading(false);
        return;
      }

      // 2. Appel Backend /api/subscriptions/activate
      const activateRes = await fetch('/api/subscriptions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formatCheck.normalizedKey })
      });

      const activateData = await activateRes.json();

      if (activateData.success && activateData.subscription) {
        setSuccessInfo(activateData.subscription);
        setTimeout(() => {
          onActivateSuccess(activateData.subscription);
          if (onClose && !isMandatoryBlock) {
            onClose();
          }
        }, 1200);
      } else {
        setErrorMessage(activateData.error || 'Erreur lors de l activation de la licence.');
      }
    } catch (err) {
      // Fallback local si backend en cours de redémarrage
      setErrorMessage('Connexion au serveur backend... Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMasterBypass = () => {
    if (bypassPin.trim() === 'MAROC2026') {
      const emergencySub: Subscription = {
        id: 'SUB-BYPASS-001',
        licenseKey: 'HGMA2026-BYPASS-MASTER-ROOT-9988776655', // 36 chars
        clientName: 'Contournement Super Admin',
        entreprise: 'Super Administrateur Maroc',
        contact: 'Directeur Général',
        telephone: '+212 6 61 00 00 00',
        ville: 'Mohammedia',
        plan: 'Entreprise',
        dateEmission: new Date().toISOString().split('T')[0],
        dateExpiration: '2030-12-31',
        statut: 'Actif',
        prixMAD: 0,
        maxVehicules: 999,
        maxCiternes: 99,
        cleActilee: true,
        notes: 'Accès maître déverrouillé par PIN de sécurité.'
      };
      onActivateSuccess(emergencySub);
      if (onClose) onClose();
    } else {
      setErrorMessage('Code PIN Maître erroné. Veuillez saisir le bon code d urgence.');
    }
  };

  const sampleKey = 'HGMA2026-A8F9-BC41-7E02-99D34FA189B7';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-5 text-slate-950 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-950/20 backdrop-blur rounded-xl border border-slate-950/20">
                <KeyRound className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full inline-block mb-1">
                  Système de Licences & Abonnements
                </span>
                <h3 className="text-xl font-extrabold tracking-tight font-industrial">
                  Activation de Licence Logicielle (36 Caractères)
                </h3>
              </div>
            </div>
            
            {onClose && !isMandatoryBlock && (
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-950/10 hover:bg-slate-950/30 text-slate-950 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-slate-100">
          
          {/* Active status info if exists */}
          {activeSubscription && (
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="text-slate-400">Licence Actuelle en Cours :</div>
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeSubscription.entreprise} ({activeSubscription.plan})</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Expiration :</span>
                <span className="font-mono-num font-semibold text-slate-200">{activeSubscription.dateExpiration}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerifyAndActivate} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  Code d'Abonnement à 36 Chiffres et Lettres *
                </label>
                <span className={`text-[11px] font-mono font-bold ${
                  inputCode.trim().length === 36 ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {inputCode.trim().length}/36 caractères
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setErrorMessage(null);
                  }}
                  placeholder="EX: HGMA2026-A8F9-BC41-7E02-99D34FA189B7"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-base font-mono-num tracking-wider text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 font-bold selection:bg-amber-500 selection:text-slate-950"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Saisissez le code officiel à 36 caractères délivré lors de l'achat de votre abonnement (lettres majuscules et chiffres).
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Validation échouée</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successInfo && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block text-sm">Licence Activée avec Succès !</span>
                  <span>{successInfo.entreprise} • Formule {successInfo.plan} valide jusqu'au {successInfo.dateExpiration}.</span>
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={isLoading || inputCode.trim().length < 32}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Vérifier & Activer la Licence</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Key Helper */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Exemple de clé officielle 36 caractères :
              </span>
              <button
                type="button"
                onClick={() => {
                  setInputCode(sampleKey);
                  navigator.clipboard.writeText(sampleKey);
                  setCopiedSample(true);
                  setTimeout(() => setCopiedSample(false), 2000);
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition cursor-pointer"
              >
                {copiedSample ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedSample ? 'Copié !' : 'Insérer cette clé'}
              </button>
            </div>
            <code className="block bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 font-mono-num text-[11px] text-amber-300/90 select-all">
              {sampleKey}
            </code>
          </div>

          {/* Morocco Support & Purchase Section */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Support Licences & Vente Maroc : <strong className="text-slate-200">+212 5 23 32 40 00</strong></span>
            </div>
            
            <button
              type="button"
              onClick={() => setShowBypass(!showBypass)}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition flex items-center gap-1"
            >
              <Lock className="w-3 h-3" />
              <span>Accès d'Urgence Super Admin</span>
            </button>
          </div>

          {/* Emergency Super Admin PIN Bypass */}
          {showBypass && (
            <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl space-y-2 animate-in fade-in text-xs">
              <div className="text-red-300 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-red-400" />
                Déverrouillage d'Urgence par Code PIN Maître :
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={bypassPin}
                  onChange={(e) => setBypassPin(e.target.value)}
                  placeholder="PIN Maître (ex: MAROC2026)"
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-xs focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={handleMasterBypass}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition text-xs cursor-pointer"
                >
                  Débloquer
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
