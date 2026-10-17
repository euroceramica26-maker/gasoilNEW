import React, { useState, useEffect } from 'react';
import { User, Subscription, ClientCompanyInfo } from '../types';
import { resolveClientCompanyInfo, saveClientCompanyDetails, generateDeterministicIce, generateDeterministicRc, generateDeterministicIf } from '../lib/clientCompanyUtils';
import { 
  Building2, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Save, 
  Printer, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Sparkles,
  Eye,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import { MOROCCO_CITIES } from '../data/moroccoCities';

interface ClientCompanySettingsModuleProps {
  currentUser?: User | null;
  subscriptions?: Subscription[];
  onUpdateSubscription?: (sub: Subscription) => void;
  onRefreshData?: () => void;
}

export const ClientCompanySettingsModule: React.FC<ClientCompanySettingsModuleProps> = ({
  currentUser,
  subscriptions = [],
  onUpdateSubscription,
  onRefreshData
}) => {
  const isSuperAdmin = currentUser?.role === 'Super Administrateur' || currentUser?.login?.toLowerCase() === 'ouaradtech';

  // Si super admin, il peut choisir pour quel client éditer les infos
  const [selectedSubId, setSelectedSubId] = useState<string>(() => {
    if (subscriptions.length > 0) {
      if (currentUser?.clientId) {
        const found = subscriptions.find(s => s.id === currentUser.clientId);
        if (found) return found.id;
      }
      return subscriptions[0].id;
    }
    return 'default';
  });

  const activeSub = subscriptions.find(s => s.id === selectedSubId) || subscriptions[0];

  const currentResolved = resolveClientCompanyInfo({
    currentUser,
    subscriptions,
    activeLicenseKey: activeSub?.licenseKey
  });

  const [formData, setFormData] = useState<ClientCompanyInfo>(currentResolved);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const updated = resolveClientCompanyInfo({
      currentUser,
      subscriptions,
      data: activeSub ? { clientId: activeSub.id, entreprise: activeSub.entreprise } : null,
      activeLicenseKey: activeSub?.licenseKey
    });
    setFormData(updated);
  }, [selectedSubId, subscriptions, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const targetId = activeSub ? activeSub.id : (currentUser?.clientId || 'default');
    saveClientCompanyDetails(targetId, formData, subscriptions, onUpdateSubscription);

    // Mettre à jour également le backend si possible
    if (activeSub) {
      fetch(`/api/subscriptions/${activeSub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entreprise: formData.entreprise,
          ville: formData.ville,
          ice: formData.ice,
          rc: formData.rc,
          identifiantFiscal: formData.identifiantFiscal,
          depot: formData.depot,
          adresse: formData.adresse,
          telephone: formData.telephone
        })
      }).catch(() => {});
    }

    setTimeout(() => {
      setIsSaving(false);
      setSuccessToast(`Informations et en-tête de documents enregistrés pour « ${formData.entreprise} » !`);
      setTimeout(() => setSuccessToast(null), 4000);
      if (onRefreshData) onRefreshData();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100 font-industrial tracking-wide">
                  En-tête des Documents & Coordonnées Client
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                  Personnalisation Compte
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Ces informations remplacent automatiquement l'en-tête générique sur tous les <strong>bons de réception de carburant (dépotage)</strong>, <strong>tickets de distribution</strong> et <strong>rapports officiels</strong>.
              </p>
            </div>
          </div>

          {/* Sélecteur de compte client si Super Admin */}
          {isSuperAdmin && subscriptions.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 whitespace-nowrap font-medium">Client :</span>
              <select
                value={selectedSubId}
                onChange={e => setSelectedSubId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-amber-500 focus:outline-none"
              >
                {subscriptions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.entreprise} ({s.ville})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-950/90 border border-emerald-500/40 p-4 rounded-xl text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {/* Main Grid: Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              Informations Légales & Identifiants de l'Entreprise
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Raison Sociale / Nom de l'Entreprise Cliente <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.entreprise}
                onChange={e => setFormData({ ...formData, entreprise: e.target.value })}
                placeholder="Ex: EUROCERAMICA MAROC SA, AFRIQUIA LOGISTIQUE..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-semibold focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Nom principal affiché en gros caractères en haut des bons et tickets.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom du Dépôt / Site de Stockage <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.depot}
                  onChange={e => setFormData({ ...formData, depot: e.target.value })}
                  placeholder="Ex: Complexe Industriel & Dépôt d’Hydrocarbures"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ville / Hub Pétrolier Maroc
                </label>
                <select
                  value={formData.ville}
                  onChange={e => setFormData({ ...formData, ville: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                >
                  {MOROCCO_CITIES.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.region})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Legal Identifiers (ICE, RC, IF) */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Identifiants Fiscaux Marocains (Obligatoires sur Factures & Bons)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    N° ICE (15 chiffres)
                  </label>
                  <input
                    type="text"
                    value={formData.ice}
                    onChange={e => setFormData({ ...formData, ice: e.target.value })}
                    placeholder="Ex: 003124567000012"
                    maxLength={18}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    N° Registre Commerce (RC)
                  </label>
                  <input
                    type="text"
                    value={formData.rc}
                    onChange={e => setFormData({ ...formData, rc: e.target.value })}
                    placeholder={`Ex: RC ${formData.ville || 'Casablanca'} 584920`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Identifiant Fiscal (IF)
                  </label>
                  <input
                    type="text"
                    value={formData.identifiantFiscal}
                    onChange={e => setFormData({ ...formData, identifiantFiscal: e.target.value })}
                    placeholder="Ex: IF: 49281045"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Address & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adresse Complète du Dépôt / Usine
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Zone Industrielle, Boulevard Ahl Loghlam..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Téléphone Direct Site
                </label>
                <input
                  type="text"
                  value={formData.telephone}
                  onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+212 5 22 35 10 20"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sous-titre / Spécifications Métrologiques
              </label>
              <input
                type="text"
                value={formData.sousTitre}
                onChange={e => setFormData({ ...formData, sousTitre: e.target.value })}
                placeholder="Contrôle Métrologique & Spécifications Marocaines Gasoil 10ppm"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mise à jour immédiate sur tous les formats d'impression
              </span>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Enregistrer & Appliquer aux Documents</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-100">
                  Aperçu Direct de l'En-tête Imprimé
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Format Officiel 🇲🇦
              </span>
            </div>

            {/* Simulated Paper Sheet Preview */}
            <div className="bg-white text-slate-900 p-5 rounded-xl shadow-inner border border-slate-300">
              <div className="border-b-2 border-slate-900 pb-3 mb-3 flex items-start justify-between">
                <div>
                  <div className="text-[9px] font-bold text-red-600 tracking-wider uppercase">
                    🇲🇦 ROYAUME DU MAROC
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950 uppercase tracking-tight font-industrial mt-0.5">
                    {formData.entreprise || 'NOM DE VOTRE ENTREPRISE'}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                    {formData.depot || 'Dépôt & Complexe d’Hydrocarbures'}
                  </p>
                  <p className="text-[9px] text-slate-500">
                    {formData.sousTitre} • {formData.adresse}
                  </p>
                  <p className="text-[9px] font-mono font-medium text-slate-600 mt-0.5">
                    ICE: {formData.ice || generateDeterministicIce(formData.entreprise)} • {formData.rc || generateDeterministicRc(formData.entreprise, formData.ville)} • {formData.identifiantFiscal || generateDeterministicIf(formData.entreprise)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 bg-slate-900 text-white font-mono font-bold text-[10px] rounded">
                    BL-2026-0849
                  </span>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-mono">
                    {new Date().toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Sample Document Body */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-center mb-3">
                <span className="text-[11px] font-bold uppercase text-slate-800">
                  BON OFFICIEL DE RÉCEPTION & DÉPOTAGE CARBURANT (ENTRÉE EN CITERNE)
                </span>
              </div>

              <div className="space-y-1.5 text-[10px] text-slate-600 border-t border-slate-200 pt-2">
                <div className="flex justify-between">
                  <span>Citerne Destinataire :</span>
                  <span className="font-bold text-slate-900">CIT-01 • Cuve Principale 50 000 L</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantité Livrée :</span>
                  <span className="font-bold text-slate-900">25 000 Litres (Gasoil 10ppm)</span>
                </div>
                <div className="flex justify-between">
                  <span>Masse Nette Métrologique :</span>
                  <span className="font-bold text-slate-900">21 050,00 kg (21,050 Tonnes)</span>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[8px] text-slate-400 font-mono">
                <span>DOCUMENT CLIENT CONFORME NORMES HYDROCARBURES MAROC</span>
                <span>||||| ||| |||||||</span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold">
              <FileCheck2 className="w-4 h-4 text-sky-400" />
              <span>Où ces informations apparaissent-elles ?</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong>Bons de Réception :</strong> Imprimables ou exportés au format PDF/HTML avec signature manuscrite.</li>
              <li><strong>Tickets de Distribution :</strong> Format Ticket thermique (80mm) et format feuille standard (A4).</li>
              <li><strong>Rapports Mensuels :</strong> Exports PDF officiels, fiches métrologiques et classeurs Excel.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
