import React, { useState } from 'react';
import { 
  KeyRound, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  Clock, 
  LogOut, 
  Lock, 
  RefreshCw, 
  Sparkles,
  XCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { Subscription, User } from '../types';
import { validateLicenseKeyFormat } from '../lib/licenseUtils';

/**
 * ÉCRAN 1: ACTIVATION OBLIGATOIRE AU PREMIER LOGIN DU CLIENT
 * L'application ne démarre que lorsque le client entre sa clé à 36 caractères.
 * Le décompte de la durée de licence commence précisément au moment de cette activation.
 */
interface ClientLicenseActivationScreenProps {
  currentUser: User;
  clientSub: Subscription | null;
  onActivate: (code: string) => Promise<any>;
  onLogout: () => void;
}

export const ClientLicenseActivationScreen: React.FC<ClientLicenseActivationScreenProps> = ({
  currentUser,
  clientSub,
  onActivate,
  onLogout
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const check = validateLicenseKeyFormat(code);
    if (!check.isValid) {
      setError(check.reason || 'Code de licence à 36 caractères requis.');
      return;
    }

    setIsLoading(true);
    try {
      const activatedSub = await onActivate(check.normalizedKey);
      setSuccessInfo(`Licence activée avec succès pour ${activatedSub?.entreprise || 'votre compte'} !`);
    } catch (err: any) {
      setError(err?.message || 'Code d activation invalide ou erreur réseau.');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanCharsCount = code.trim().length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 font-industrial tracking-wider">
            GP
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-100 tracking-tight font-industrial">
              GASOILPRO <span className="text-amber-400">MAROC</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              Système de Métrologie & Gestion des Hydrocarbures
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">
              {currentUser.prenom} {currentUser.nom}
            </div>
            <div className="text-[10px] text-amber-400/90 font-medium truncate max-w-[180px]">
              {currentUser.entreprise || 'Compte Client'}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main Activation Box */}
      <main className="max-w-2xl w-full mx-auto my-auto py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden space-y-6">
          
          {/* Decorative ambient gradient */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>PREMIER LOGIN • ACTIVATION OBLIGATOIRE DE VOTRE INSTANCE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-industrial tracking-tight">
              Activez votre Licence GasoilPro
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Bienvenue sur votre espace d'exploitation. Pour sécuriser votre déploiement et commencer l'utilisation de vos volucompteurs et citernes, veuillez saisir votre <strong>clé officielle à 36 caractères</strong> remise par OuaradTech.
            </p>
          </div>

          {/* Important Information Notice */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-xs text-amber-200/90 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Démarrage de la Période d'Abonnement :</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Conformément à nos règles de licence, <strong>le décompte de votre durée d'abonnement commencera précisément à l'instant de cette première activation</strong>. Votre période complète (30 jours, 90 jours ou 365 jours selon votre formule) sera décomptée à partir d'aujourd'hui.
            </p>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Clé de Licence à 36 Caractères *</span>
                </label>
                <span className={`font-mono-num font-bold text-[11px] ${
                  cleanCharsCount === 36 ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {cleanCharsCount} / 36 caractères
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="EX: HGMA2026-A8F9-BC41-7E02-99D34FA189B7"
                  className="w-full px-4 py-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-sm sm:text-base font-mono-num tracking-wider text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/25 font-bold transition"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Format standard OuaradTech : 36 caractères (lettres majuscules et chiffres).
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-red-950/80 border border-red-500/50 rounded-2xl text-xs text-red-200 flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="block font-bold">Échec de l'activation</strong>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successInfo && (
              <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs text-emerald-200 flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successInfo} Démarrage de l'application...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || cleanCharsCount < 30}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition cursor-pointer disabled:opacity-50 text-sm tracking-wide"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Valider le Code & Démarrer la Licence</span>
                </>
              )}
            </button>
          </form>

          {/* Support Assistance Box */}
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Besoin d'aide pour obtenir votre code d'activation ?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Contactez votre interlocuteur OuaradTech ou le support national licences :
            </p>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1 text-amber-300">
                <Phone className="w-3 h-3 text-amber-400" />
                +212 6 61 00 26 26
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Mail className="w-3 h-3 text-slate-400" />
                admin@ouaradtech.com
              </span>
              <span className="text-slate-500">Royaume du Maroc</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto py-3 text-center text-[10px] text-slate-500 border-t border-slate-900">
        © 2026 OuaradTech Solutions Maroc • Système Sous Licence Propriétaire Certifiée ISO-Metrology
      </footer>
    </div>
  );
};


/**
 * ÉCRAN 2: APPLICATION ARRÊTÉE - LICENCE EXPIRÉE
 * Quand le délai de la licence arrive à échéance, l'application s'arrête de fonctionner pour le client.
 * Seul un code de renouvellement ou le Super Admin peut débloquer.
 */
interface ClientLicenseExpiredScreenProps {
  currentUser: User;
  clientSub: Subscription | null;
  onRenew: (code: string) => Promise<any>;
  onLogout: () => void;
}

export const ClientLicenseExpiredScreen: React.FC<ClientLicenseExpiredScreenProps> = ({
  currentUser,
  clientSub,
  onRenew,
  onLogout
}) => {
  const [renewalCode, setRenewalCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const check = validateLicenseKeyFormat(renewalCode);
    if (!check.isValid) {
      setError(check.reason || 'Code de renouvellement à 36 caractères requis.');
      return;
    }

    setIsLoading(true);
    try {
      await onRenew(check.normalizedKey);
      setSuccess('Licence renouvelée avec succès ! Déverrouillage de l application...');
    } catch (err: any) {
      setError(err?.message || 'Code de renouvellement invalide.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-red-600 selection:text-white">
      
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-red-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-lg shadow-red-950/80 font-industrial tracking-wider">
            GP
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-100 tracking-tight font-industrial flex items-center gap-2">
              <span>GASOILPRO MAROC</span>
              <span className="px-2 py-0.5 bg-red-950/80 border border-red-500/50 rounded text-[10px] font-bold text-red-300">
                SERVICE SUSPENDU
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">
              Arrêt de service pour cause d'expiration contractuelle
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-red-400" />
          <span>Déconnexion</span>
        </button>
      </header>

      {/* Center Lockout Box */}
      <main className="max-w-2xl w-full mx-auto my-auto py-8">
        <div className="bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/60 relative overflow-hidden space-y-6">
          
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Hero Alert */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-950/90 border border-red-500/60 text-red-400 flex items-center justify-center shadow-lg shadow-red-950">
              <ShieldAlert className="w-8 h-8 text-red-400 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-red-950/80 border border-red-500/40 rounded-full text-[11px] font-bold text-red-300 uppercase tracking-wider">
                <Lock className="w-3 h-3 text-red-400" />
                <span>APPLICATION ARRÊTÉE • ÉCHÉANCE DE LICENCE ATTEINTE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-industrial tracking-tight">
                Licence d'Exploitation Expirée
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                L'abonnement de votre entreprise <strong>{clientSub?.entreprise || currentUser.entreprise || 'Client'}</strong> est arrivé à échéance le <strong>{clientSub?.dateExpiration || 'Date dépassée'}</strong>.
              </p>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-red-500/30 text-xs text-slate-300 space-y-2">
            <p className="text-red-300 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Suspension automatique des accès :</span>
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Conformément aux conditions générales d'utilisation, l'ensemble des modules d'exploitation (Réceptions carburant, Distributions volucompteur, Jaugeage citernes, Parc véhicules et Données statistiques) est désormais arrêté jusqu'au renouvellement de votre licence.
            </p>
          </div>

          {/* Renewal Form */}
          <form onSubmit={handleRenewSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Saisir un Code de Renouvellement (36 Caractères) :</span>
                </label>
                <span className={`font-mono-num font-bold text-[11px] ${
                  renewalCode.trim().length === 36 ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {renewalCode.trim().length} / 36
                </span>
              </div>

              <input
                type="text"
                required
                value={renewalCode}
                onChange={(e) => {
                  setRenewalCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="EX: HGMA2026-RENEW-BC41-7E02-99D34FA189B7"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-sm font-mono-num tracking-wider text-amber-300 placeholder-slate-600 focus:outline-none focus:border-red-400 font-bold"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || renewalCode.trim().length < 30}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-950 transition cursor-pointer disabled:opacity-50 text-xs sm:text-sm tracking-wide"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Déverrouiller l'Application avec le Nouveau Code</span>
                </>
              )}
            </button>
          </form>

          {/* OuaradTech Commercial Contacts */}
          <div className="pt-4 border-t border-slate-800 text-xs space-y-2">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Contact Commercial & Renouvellement OuaradTech :</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Ligne Directe :</span>
                  <strong className="text-amber-300 font-mono">+212 6 61 00 26 26</strong>
                </div>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Email Support :</span>
                  <strong className="text-slate-200 font-mono">admin@ouaradtech.com</strong>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="max-w-4xl w-full mx-auto py-3 text-center text-[10px] text-slate-500 border-t border-slate-900">
        GasoilPro Solutions Maroc • Arrêt de Service Autoritaire de Protection Licence
      </footer>
    </div>
  );
};


/**
 * BANNIÈRE 3: AVERTISSEMENT RENOUVELLEMENT 1 MOIS AVANT ÉCHÉANCE (<= 30 JOURS)
 * S'affiche en haut de l'interface du client quand la licence arrive bientôt à terme.
 */
interface ClientLicenseWarningBannerProps {
  clientSub: Subscription;
  daysRemaining: number;
  onOpenRenewalModal: () => void;
}

export const ClientLicenseWarningBanner: React.FC<ClientLicenseWarningBannerProps> = ({
  clientSub,
  daysRemaining,
  onOpenRenewalModal
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-950/95 via-orange-950/90 to-amber-950/95 border-b border-amber-500/60 px-4 py-2.5 text-xs text-amber-100 shadow-lg relative z-40 animate-in fade-in">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/40 shrink-0 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="font-extrabold text-amber-300 flex items-center gap-2 text-xs">
              <span>AVERTISSEMENT DE RENOUVELLEMENT DE LICENCE</span>
              <span className="px-2 py-0.2 bg-amber-500/20 border border-amber-500/50 rounded-full font-mono-num font-bold text-[10px] text-amber-300">
                {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-snug">
              Votre abonnement pour <strong>{clientSub.entreprise}</strong> arrive à échéance le <strong>{clientSub.dateExpiration}</strong>. Pensez à renouveler auprès de OuaradTech pour éviter l'interruption des services.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <a
            href="tel:+212661002626"
            className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition"
          >
            <Phone className="w-3 h-3 text-amber-400" />
            <span>Support: +212 6 61 00 26 26</span>
          </a>

          <button
            type="button"
            onClick={onOpenRenewalModal}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-[11px] flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Saisir Clé Renouvellement</span>
          </button>
        </div>

      </div>
    </div>
  );
};


/**
 * MODAL DE SAISIE DE CLÉ DE RENOUVELLEMENT VOLONTAIRE
 */
interface ClientLicenseRenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSub: Subscription | null;
  onRenew: (code: string) => Promise<any>;
}

export const ClientLicenseRenewalModal: React.FC<ClientLicenseRenewalModalProps> = ({
  isOpen,
  onClose,
  clientSub,
  onRenew
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const check = validateLicenseKeyFormat(code);
    if (!check.isValid) {
      setError(check.reason || 'Code de licence à 36 caractères requis.');
      return;
    }

    setIsLoading(true);
    try {
      await onRenew(check.normalizedKey);
      setSuccess('Licence renouvelée avec succès !');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Code de renouvellement invalide.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-5">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
            <RefreshCw className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-100 text-lg font-industrial">
              Renouvellement de Licence Logicielle
            </h3>
            <p className="text-xs text-slate-400">
              {clientSub?.entreprise || 'Votre Compte'} • Saisissez votre nouvelle clé 36 caractères
            </p>
          </div>
        </div>

        {clientSub && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between items-center text-slate-300">
            <div>
              <span className="text-slate-400 text-[10px] block">Échéance Actuelle :</span>
              <strong className="text-amber-400 font-mono-num">{clientSub.dateExpiration}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px] block">Formule :</span>
              <strong className="text-slate-200">{clientSub.plan}</strong>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Code Officiel à 36 Caractères *</span>
              <span className="font-mono text-amber-400 text-[11px]">{code.trim().length} / 36</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="HGMA2026-RENEW-BC41-7E02-99D34FA189B7"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl font-mono-num font-bold text-sm text-amber-300 focus:outline-none focus:border-amber-400"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || code.trim().length < 30}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/25 transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Prolonger la Licence</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Support Commercial OuaradTech :</span>
          <strong className="text-amber-300 font-mono">+212 6 61 00 26 26</strong>
        </div>

      </div>
    </div>
  );
};
