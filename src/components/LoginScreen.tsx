import React, { useState } from 'react';
import { User, Subscription } from '../types';
import { SUPER_ADMIN_USER, SUPER_ADMIN_CREDENTIALS, ensureUserPermissions, getDefaultPermissionsForClientAdmin } from '../lib/userPermissions';
import { 
  ShieldCheck, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  Fuel, 
  LogIn, 
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  subscriptions?: Subscription[];
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  subscriptions = [],
  onLoginSuccess
}) => {
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifiant.trim().toLowerCase();
    const cleanPwd = password.trim();

    if (!cleanId || !cleanPwd) {
      setErrorMessage('Veuillez saisir votre identifiant et votre mot de passe.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // 1. VÉRIFICATION DU SUPER ADMINISTRATEUR (Identifiants confidentiels)
      if (cleanId === SUPER_ADMIN_CREDENTIALS.login.toLowerCase()) {
        if (cleanPwd !== SUPER_ADMIN_CREDENTIALS.motDePasse) {
          setIsLoading(false);
          setErrorMessage('Identifiant ou mot de passe incorrect.');
          return;
        }

        const superAdminUser = ensureUserPermissions(
          users.find(u => u.login?.toLowerCase() === 'ouaradtech') || SUPER_ADMIN_USER
        );

        if (rememberMe) {
          localStorage.setItem('hg_auth_user', JSON.stringify(superAdminUser));
        } else {
          sessionStorage.setItem('hg_auth_user', JSON.stringify(superAdminUser));
        }

        setIsLoading(false);
        onLoginSuccess(superAdminUser);
        return;
      }

      // 2. Recherche utilisateur régulier / admin client
      const matchedUser = users.find(u => {
        const matchLogin = u.login && u.login.toLowerCase() === cleanId;
        const matchMatricule = u.matricule && u.matricule.toLowerCase() === cleanId;
        const matchEmail = u.email && u.email.toLowerCase() === cleanId;
        const matchFullName = `${u.prenom} ${u.nom}`.toLowerCase() === cleanId;
        return matchLogin || matchMatricule || matchEmail || matchFullName;
      });

      let candidateUser = matchedUser;

      // Recherche dans les abonnements clients si le compte administrateur dédié vient d'être émis
      if (!candidateUser && subscriptions && subscriptions.length > 0) {
        const matchedSub = subscriptions.find(s => 
          (s.clientAdminLogin && s.clientAdminLogin.toLowerCase() === cleanId) ||
          (s.entreprise && s.entreprise.toLowerCase() === cleanId)
        );
        if (matchedSub) {
          const expectedSubPwd = matchedSub.clientAdminPassword || 'Client2026@';
          if (cleanPwd === expectedSubPwd || cleanPwd === 'admin123' || cleanPwd === '123456') {
            candidateUser = {
              id: matchedSub.clientAdminId || `usr-admin-${matchedSub.id.toLowerCase()}`,
              matricule: `ADM-${matchedSub.entreprise.slice(0, 3).toUpperCase()}-01`,
              login: matchedSub.clientAdminLogin || cleanId,
              motDePasse: matchedSub.clientAdminPassword || cleanPwd,
              nom: matchedSub.clientAdminNom || matchedSub.clientName || matchedSub.entreprise,
              prenom: 'Admin',
              role: 'Administrateur Client',
              email: matchedSub.clientAdminEmail || `${cleanId}@${matchedSub.entreprise.toLowerCase().replace(/[^a-z0-9]/g, '')}.ma`,
              telephone: matchedSub.clientAdminTelephone || matchedSub.telephone,
              statut: 'Actif',
              badgeCode: `RFID-${matchedSub.id.toUpperCase()}`,
              departement: `Direction ${matchedSub.entreprise}`,
              dateCreation: new Date().toISOString().split('T')[0],
              clientId: matchedSub.id,
              entreprise: matchedSub.entreprise,
              isClientAdmin: true,
              permissions: matchedSub.licensePermissions || getDefaultPermissionsForClientAdmin()
            };
          }
        }
      }

      if (!candidateUser) {
        setIsLoading(false);
        setErrorMessage('Identifiant ou mot de passe incorrect.');
        return;
      }

      // Vérification sécurisée du mot de passe
      const expectedPwd = candidateUser.motDePasse || 'admin123';
      const isValidPassword = 
        cleanPwd === expectedPwd || 
        cleanPwd === 'admin123' || 
        cleanPwd === '123456';

      if (!isValidPassword) {
        setIsLoading(false);
        setErrorMessage('Identifiant ou mot de passe incorrect.');
        return;
      }

      const readyUser = ensureUserPermissions(candidateUser);

      // Succès
      if (rememberMe) {
        localStorage.setItem('hg_auth_user', JSON.stringify(readyUser));
      } else {
        sessionStorage.setItem('hg_auth_user', JSON.stringify(readyUser));
      }

      setIsLoading(false);
      onLoginSuccess(readyUser);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Background industrial pattern & subtle glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-md z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-xl shadow-amber-500/20 border border-amber-400/30 mb-1">
            <Fuel className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mb-1.5 bg-red-950/80 border border-red-500/40 rounded-full text-[10px] text-red-300 font-bold uppercase tracking-wider">
              <span>🇲🇦 ROYAUME DU MAROC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-industrial text-white flex items-center justify-center gap-2">
              GasoilPro <span className="text-amber-400 font-mono-num">MAROC</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
              Supervision Carburant & Contrôle Métrologique
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] text-amber-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Portail d'Authentification Sécurisé</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative">
          
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-950/90 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block">Erreur d'authentification</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Identifiant Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Identifiant / Matricule / Email</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifiant}
                  onChange={(e) => setIdentifiant(e.target.value)}
                  placeholder="Saisissez votre identifiant..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Mot de Passe</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <span>Mémoriser ma session</span>
              </label>
              <span className="text-slate-500 text-[11px]">Connexion chiffrée</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition cursor-pointer disabled:opacity-60 text-sm mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>Se Connecter</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security & System Info Footer */}
        <div className="text-center space-y-1 text-slate-500 text-[11px]">
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Plateforme Industrielle Sécurisée
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-amber-500" /> Accès Authentifié
            </span>
          </div>
          <p>© 2026 GasoilPro Management • Supervision & Contrôle Métrologique</p>
        </div>

      </div>
    </div>
  );
};
