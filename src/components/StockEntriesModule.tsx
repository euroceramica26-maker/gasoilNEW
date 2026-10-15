import React, { useState } from 'react';
import { StockEntry, Citerne, Fournisseur, User } from '../types';
import { SignaturePad } from './SignaturePad';
import { PrintReceiptModal } from './PrintReceiptModal';
import { ConfirmModal } from './ConfirmModal';
import { Plus, Printer, ShieldAlert, CheckCircle2, FileSignature, ArrowDownToLine, Droplets, Calendar, User as UserIcon, Eye, X, Trash2, Scale, Lock } from 'lucide-react';

interface StockEntriesModuleProps {
  entries: StockEntry[];
  citernes: Citerne[];
  fournisseurs?: Fournisseur[];
  currentUser?: User | null;
  onAddStockEntry: (entry: Omit<StockEntry, 'id'>) => void;
  onDeleteStockEntry?: (id: string, restoreTankStock: boolean) => void;
}

export const StockEntriesModule: React.FC<StockEntriesModuleProps> = ({
  entries,
  citernes,
  fournisseurs = [],
  currentUser,
  onAddStockEntry,
  onDeleteStockEntry
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntryForPrint, setSelectedEntryForPrint] = useState<StockEntry | null>(null);
  const [viewSignature, setViewSignature] = useState<string | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<StockEntry | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    numeroBon: `BL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    dateLivraison: new Date().toISOString().slice(0, 16),
    fournisseur: 'TotalEnergies Commercial Fuels',
    chauffeurLivreur: '',
    immatriculationCiterneLivreur: '',
    citerneId: citernes[0]?.id || '',
    quantiteLivree: 25000,
    densiteMesuree: 0.842,
    temperatureMesuree: 18.5,
    receptionnaireUsine: 'Ahmed Benali (Responsable Dépôt)',
    signatureBase64: '',
    notes: 'Plombage camion vérifié. Test eau négatif.'
  });

  const isSuperAdmin = currentUser?.role === 'Super Administrateur' || currentUser?.login?.toLowerCase() === 'ouaradtech';
  const isClientAdmin = Boolean(currentUser?.isClientAdmin || currentUser?.role === 'Administrateur Client');
  const isRegularUser = currentUser ? (!isSuperAdmin && !isClientAdmin) : false;

  const selectedCiterne = citernes.find(c => c.id === formData.citerneId);
  const spaceAvailable = selectedCiterne ? selectedCiterne.capaciteTotale - selectedCiterne.stockActuel : 0;
  const isOverflowRisk = formData.quantiteLivree > spaceAvailable;

  // Calcul métrologique du poids en kilogrammes et tonnes de Gasoil (Volume en Litres × Densité à 15°C)
  const calculatedPoidsKg = Math.round((Number(formData.quantiteLivree) || 0) * (Number(formData.densiteMesuree) || 0.840) * 100) / 100;
  const calculatedTonnes = (calculatedPoidsKg / 1000).toFixed(3);

  const handleOpenForm = () => {
    setFormData({
      numeroBon: `BL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      dateLivraison: new Date().toISOString().slice(0, 16),
      fournisseur: fournisseurs[0]?.nom || 'Afriquia SMDC (Groupe Akwa)',
      chauffeurLivreur: 'Nabil Cherkaoui',
      immatriculationCiterneLivreur: 'MA-89410-A-6',
      citerneId: citernes[0]?.id || '',
      quantiteLivree: 20000,
      densiteMesuree: 0.841,
      temperatureMesuree: 18.0,
      receptionnaireUsine: currentUser ? `${currentUser.prenom} ${currentUser.nom} (${currentUser.role})` : 'Ahmed Benali (Chef Dépôt Mohammedia)',
      signatureBase64: '',
      notes: 'Plombage citerne conforme, test décantation fond de cuve OK.'
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.chauffeurLivreur || !formData.immatriculationCiterneLivreur) {
      setFormError('Veuillez renseigner le nom du chauffeur et l’immatriculation de la citerne livreur.');
      return;
    }
    if (!formData.signatureBase64) {
      setFormError('Veuillez apposer et valider la signature manuscrite sur l’écran avant d’enregistrer le dépotage.');
      return;
    }

    const calculatedEntryPoidsKg = Math.round((Number(formData.quantiteLivree) || 0) * (Number(formData.densiteMesuree) || 0.840) * 100) / 100;

    const newEntry: Omit<StockEntry, 'id'> = {
      ...formData,
      poidsKg: calculatedEntryPoidsKg,
      statut: 'Validé'
    };

    onAddStockEntry(newEntry);
    setIsFormOpen(false);

    // Auto prompt print
    const createdMockEntry: StockEntry = {
      ...newEntry,
      id: `ent-${Date.now()}`
    };
    setSelectedEntryForPrint(createdMockEntry);
  };

  return (
    <div className="space-y-5">
      {actionFeedback && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionFeedback(null)} 
            className="text-emerald-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-industrial">
            <ArrowDownToLine className="w-5 h-5 text-amber-500" />
            Module 2 : Entrées de Stock (Livraisons & Dépotages)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enregistrement des arrivages camions-citernes avec contrôle métrologique, signature manuscrite et bon d'entrée
          </p>
        </div>

        <button
          onClick={handleOpenForm}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Enregistrer Nouvelle Livraison (BL)</span>
        </button>
      </div>

      {/* Stock Entries History Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Historique des Réceptions Validées ({entries.length})
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400">
              Total Volume : <strong className="text-emerald-400 font-mono-num">{entries.reduce((acc, e) => acc + e.quantiteLivree, 0).toLocaleString('fr-FR')} Litres</strong>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-blue-300 flex items-center gap-1.5 font-semibold">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Total Poids Net : <strong className="text-white font-mono-num">{entries.reduce((acc, e) => acc + (e.poidsKg || Math.round(e.quantiteLivree * (e.densiteMesuree || 0.840))), 0).toLocaleString('fr-FR')} kg</strong> <span className="text-amber-400 font-mono-num font-bold">({(entries.reduce((acc, e) => acc + (e.poidsKg || Math.round(e.quantiteLivree * (e.densiteMesuree || 0.840))), 0) / 1000).toFixed(2)} Tonnes)</span>
              </span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="p-3.5">N° Bon / Date</th>
                <th className="p-3.5">Fournisseur & Livreur</th>
                <th className="p-3.5">Citerne Cible</th>
                <th className="p-3.5">Volume & Poids Dépoté (L / kg)</th>
                <th className="p-3.5">Paramètres Physiques</th>
                <th className="p-3.5">Signature</th>
                <th className="p-3.5 text-right">Bon d'Entrée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {entries.map(entry => {
                const targetCiterne = citernes.find(c => c.id === entry.citerneId);
                const entryWeightKg = entry.poidsKg || Math.round(entry.quantiteLivree * (entry.densiteMesuree || 0.840));
                const entryWeightTons = (entryWeightKg / 1000).toFixed(2);

                return (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <span className="font-mono-num font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {entry.numeroBon}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono-num mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(entry.dateLivraison).toLocaleString('fr-FR')}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-100 block">
                        {entry.fournisseur}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <UserIcon className="w-3 h-3 text-slate-500" />
                        Chauffeur: {entry.chauffeurLivreur} • Immat: {entry.immatriculationCiterneLivreur}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-200">
                        {targetCiterne ? targetCiterne.code : entry.citerneId}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {targetCiterne?.nom || 'Cuve usine'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-mono-num font-bold text-sm text-emerald-400">
                        +{entry.quantiteLivree.toLocaleString('fr-FR')} L
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono-num text-blue-300 font-bold mt-1 bg-slate-950/70 px-2 py-0.5 rounded border border-blue-900/40 w-fit" title="Poids net calculé du gasoil (Litres × Densité)">
                        <Scale className="w-3 h-3 text-blue-400 shrink-0" />
                        <span>{entryWeightKg.toLocaleString('fr-FR')} kg</span>
                        <span className="text-slate-400 font-normal">({entryWeightTons} T)</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono-num text-[11px] text-slate-300">
                      <div>Densité: {entry.densiteMesuree} kg/L</div>
                      <div className="text-slate-400">Température: {entry.temperatureMesuree} °C</div>
                    </td>

                    <td className="p-3.5">
                      {entry.signatureBase64 ? (
                        <button
                          onClick={() => setViewSignature(entry.signatureBase64)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 flex items-center gap-1 text-[11px] border border-slate-700 transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Voir signature</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 italic">Non signée</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedEntryForPrint(entry)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimer Bon</span>
                        </button>

                        {onDeleteStockEntry && !isRegularUser && (
                          <button
                            type="button"
                            onClick={() => setEntryToDelete(entry)}
                            title="Supprimer ce bon de livraison"
                            className="px-2.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shadow-sm active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Supprimer</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal New Stock Entry with Signature Pad */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-5 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center gap-2 font-industrial">
                  <ArrowDownToLine className="w-5 h-5 text-amber-500" />
                  Réception de Carburant (Bon de Livraison)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Contrôle des volumes, dépotage citerne et émargement numérique
                </p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-950 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">N° Bon de Livraison (BL) *</label>
                  <input
                    type="text"
                    required
                    value={formData.numeroBon}
                    onChange={e => setFormData({...formData, numeroBon: e.target.value})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Date & Heure de Réception *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dateLivraison}
                    onChange={e => setFormData({...formData, dateLivraison: e.target.value})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 block">Société Fournisseur *</label>
                    {fournisseurs.length > 0 && (
                      <span className="text-[10px] text-amber-400">Fournisseurs agréés</span>
                    )}
                  </div>
                  {fournisseurs.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={formData.fournisseur}
                        onChange={e => setFormData({...formData, fournisseur: e.target.value})}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-semibold"
                      >
                        {fournisseurs.map(f => (
                          <option key={f.id} value={f.nom}>
                            {f.nom} ({f.typeGasoilFourni})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={formData.fournisseur}
                      onChange={e => setFormData({...formData, fournisseur: e.target.value})}
                      placeholder="TotalEnergies, Shell, Petromin..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                    />
                  )}
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Chauffeur Livreur *</label>
                  <input
                    type="text"
                    required
                    value={formData.chauffeurLivreur}
                    onChange={e => setFormData({...formData, chauffeurLivreur: e.target.value})}
                    placeholder="Nom et prénom du livreur"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Immat. Citerne Porteuse / Tracteur *</label>
                  <input
                    type="text"
                    required
                    value={formData.immatriculationCiterneLivreur}
                    onChange={e => setFormData({...formData, immatriculationCiterneLivreur: e.target.value})}
                    placeholder="ex: 89410-A-6 ou MA-58401-B-1"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Citerne Cible de l'Usine *</label>
                  <select
                    value={formData.citerneId}
                    onChange={e => setFormData({...formData, citerneId: e.target.value})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-semibold"
                  >
                    {citernes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.nom} (Dispo: {(c.capaciteTotale - c.stockActuel).toLocaleString()} L)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Physical Parameters */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-amber-400">
                    Volume Livré (L) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="50"
                    value={formData.quantiteLivree}
                    onChange={e => setFormData({...formData, quantiteLivree: Number(e.target.value)})}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-amber-400 font-bold font-mono-num text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Densité à 15°C (kg/L)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.densiteMesuree}
                    onChange={e => setFormData({...formData, densiteMesuree: Number(e.target.value)})}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono-num text-sm"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Température (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperatureMesuree}
                    onChange={e => setFormData({...formData, temperatureMesuree: Number(e.target.value)})}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono-num text-sm"
                  />
                </div>
              </div>

              {/* Affichage Métrologique en Temps Réel du Poids en kg du Gasoil */}
              <div className="p-3.5 bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/70 border border-blue-500/50 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-md shrink-0">
                      <Scale className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                          Poids Net Gasoil Dépoté (Calcul Métrologique)
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-900/60 text-blue-200 border border-blue-700/50 font-bold">
                          NF EN ISO 3675
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2.5 mt-0.5">
                        <span className="text-xl sm:text-2xl font-black text-white font-mono-num drop-shadow-sm">
                          {calculatedPoidsKg.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} <span className="text-sm font-semibold text-blue-300">kg</span>
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-amber-400 font-mono-num">
                          ≈ {calculatedTonnes} Tonnes métriques
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-950/90 px-3 py-2 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 w-full sm:w-auto text-left sm:text-right">
                    <div className="text-slate-400 text-[10px]">Formule Métrologique :</div>
                    <div className="text-emerald-400 font-bold mt-0.5">
                      {formData.quantiteLivree.toLocaleString('fr-FR')} L × {formData.densiteMesuree} kg/L
                    </div>
                  </div>
                </div>
              </div>

              {/* Overflow Safety Warning */}
              {isOverflowRisk && (
                <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-lg text-red-200 flex items-start gap-2 text-xs">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Alerte Sécurité Capacité Dépassée !</span>
                    <p className="mt-0.5">
                      La citerne sélectionnée n'a que {spaceAvailable.toLocaleString()} Litres disponibles. La livraison de {formData.quantiteLivree.toLocaleString()} Litres causera un débordement volumique.
                    </p>
                  </div>
                </div>
              )}

              {/* Plant Receiver Name */}
              <div>
                <label className="text-slate-400 block mb-1">Réceptionnaire Usine Habilité *</label>
                <input
                  type="text"
                  required
                  value={formData.receptionnaireUsine}
                  onChange={e => setFormData({...formData, receptionnaireUsine: e.target.value})}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-400 block mb-1">Observations / Contrôle Scellés</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Test eau négatif, scellés conformes..."
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              {/* Signature Capture Section */}
              <div className="pt-2">
                <SignaturePad
                  signatoryTitle="Émargement Manuscrit du Chauffeur Livreur"
                  onSave={(signatureData) => {
                    setFormData(prev => ({ ...prev, signatureBase64: signatureData }));
                  }}
                  initialSignature={formData.signatureBase64}
                />
                {formData.signatureBase64 && (
                  <div className="mt-2 text-emerald-400 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Signature capturée et vérifiée. Prêt pour validation.</span>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  Valider la Livraison & Imprimer Bon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature Viewer Lightbox */}
      {viewSignature && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full">
            <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-amber-500" />
              Émargement Manuscrit Original
            </h4>
            <div className="bg-white rounded-lg p-3 border border-slate-400 flex items-center justify-center">
              <img src={viewSignature} alt="Signature" className="max-h-36 object-contain" />
            </div>
            <button
              onClick={() => setViewSignature(null)}
              className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedEntryForPrint && (
        <PrintReceiptModal
          type="entree"
          data={selectedEntryForPrint}
          citernes={citernes}
          onClose={() => setSelectedEntryForPrint(null)}
        />
      )}

      {/* In-App Delete Confirmation Modal */}
      {entryToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Supprimer la livraison de gasoil"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le bon de réception ${entryToDelete.numeroBon} (${entryToDelete.fournisseur}) ?`}
          detail={`Action : Suppression du bon et déduction de ${entryToDelete.quantiteLivree.toLocaleString('fr-FR')} Litres du stock de la citerne.`}
          confirmLabel="Supprimer Définitivement"
          onConfirm={() => {
            const num = entryToDelete.numeroBon;
            const vol = entryToDelete.quantiteLivree;
            if (onDeleteStockEntry) {
              onDeleteStockEntry(entryToDelete.id, true);
            }
            setEntryToDelete(null);
            setActionFeedback(`Bon de livraison ${num} supprimé avec succès. -${vol.toLocaleString('fr-FR')} L réajustés sur la citerne.`);
          }}
          onCancel={() => setEntryToDelete(null)}
        />
      )}
    </div>
  );
};
