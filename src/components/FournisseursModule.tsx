import React, { useState } from 'react';
import { Fournisseur } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { ALL_MOROCCO_CITY_NAMES } from '../data/moroccoCities';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Download, 
  CheckCircle2, 
  X,
  AlertTriangle,
  Fuel
} from 'lucide-react';

interface FournisseursModuleProps {
  fournisseurs: Fournisseur[];
  onAddFournisseur: (fournisseur: Omit<Fournisseur, 'id'>) => void;
  onUpdateFournisseur: (fournisseur: Fournisseur) => void;
  onDeleteFournisseur: (id: string) => void;
}

export const FournisseursModule: React.FC<FournisseursModuleProps> = ({
  fournisseurs,
  onAddFournisseur,
  onUpdateFournisseur,
  onDeleteFournisseur
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Tous');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null);
  const [fournisseurToDelete, setFournisseurToDelete] = useState<Fournisseur | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    contactNom: '',
    telephone: '',
    email: '',
    adresse: '',
    typeGasoilFourni: 'Gasoil Standard 10ppm',
    numContrat: '',
    statut: 'Actif' as 'Actif' | 'Inactif',
    notes: ''
  });

  const handleOpenCreate = () => {
    setEditingFournisseur(null);
    setFormError(null);
    setFormData({
      code: `FRS-0${fournisseurs.length + 1}`,
      nom: '',
      contactNom: '',
      telephone: '+212 ',
      email: '',
      adresse: '',
      typeGasoilFourni: 'Gasoil Standard 10ppm',
      numContrat: `CTR-2026-${Math.floor(10 + Math.random() * 90)}`,
      statut: 'Actif',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Fournisseur) => {
    setEditingFournisseur(f);
    setFormError(null);
    setFormData({
      code: f.code,
      nom: f.nom,
      contactNom: f.contactNom,
      telephone: f.telephone,
      email: f.email,
      adresse: f.adresse,
      typeGasoilFourni: f.typeGasoilFourni,
      numContrat: f.numContrat || '',
      statut: f.statut,
      notes: f.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.code || !formData.nom) {
      setFormError('Veuillez renseigner le code et le nom du fournisseur.');
      return;
    }

    if (editingFournisseur) {
      onUpdateFournisseur({
        ...editingFournisseur,
        ...formData
      });
    } else {
      onAddFournisseur(formData);
    }
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'Nom', 'Contact', 'Telephone', 'Email', 'Adresse', 'Carburant', 'Contrat', 'Statut'];
    const rows = fournisseurs.map(f => [
      `"${f.code}"`,
      `"${f.nom}"`,
      `"${f.contactNom}"`,
      `"${f.telephone}"`,
      `"${f.email}"`,
      `"${f.adresse}"`,
      `"${f.typeGasoilFourni}"`,
      `"${f.numContrat || ''}"`,
      `"${f.statut}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fournisseurs_gasoil_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFournisseurs = fournisseurs.filter(f => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      f.nom.toLowerCase().includes(term) ||
      f.code.toLowerCase().includes(term) ||
      f.contactNom.toLowerCase().includes(term) ||
      f.typeGasoilFourni.toLowerCase().includes(term) ||
      f.adresse.toLowerCase().includes(term);

    const matchesStatus = selectedStatus === 'Tous' || f.statut === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Title & Actions Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-industrial">
            <Building2 className="w-5 h-5 text-amber-500" />
            Gestion des Fournisseurs de Carburant
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Répertoire des distributeurs pétroliers, contrats d'approvisionnement et contacts ({fournisseurs.length} fournisseurs)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouveau Fournisseur</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block">Total Fournisseurs</span>
          <span className="font-mono-num font-bold text-xl text-slate-100 mt-1 block">
            {fournisseurs.length}
          </span>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block">Fournisseurs Actifs</span>
          <span className="font-mono-num font-bold text-xl text-emerald-400 mt-1 block">
            {fournisseurs.filter(f => f.statut === 'Actif').length}
          </span>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block">Gasoil Standard 10ppm</span>
          <span className="font-mono-num font-bold text-xl text-amber-400 mt-1 block">
            {fournisseurs.filter(f => f.typeGasoilFourni.includes('10ppm')).length}
          </span>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block">GNR & Heavy Duty</span>
          <span className="font-mono-num font-bold text-xl text-blue-400 mt-1 block">
            {fournisseurs.filter(f => f.typeGasoilFourni.includes('GNR') || f.typeGasoilFourni.includes('Heavy')).length}
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-3">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, code (FRS-01), contact, adresse, type carburant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="Tous">Tous les Statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="p-3.5">Code & Société</th>
                <th className="p-3.5">Contact Référent</th>
                <th className="p-3.5">Produit Livré</th>
                <th className="p-3.5">Coordonnées</th>
                <th className="p-3.5">N° Contrat / Accord</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredFournisseurs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Aucun fournisseur ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredFournisseurs.map(fournisseur => (
                  <tr key={fournisseur.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-industrial text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                          {fournisseur.code}
                        </span>
                      </div>
                      <span className="font-bold text-slate-100 text-sm block mt-1">
                        {fournisseur.nom}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-200 block">
                        {fournisseur.contactNom || 'N/A'}
                      </span>
                      {fournisseur.adresse && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-xs">{fournisseur.adresse}</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/70 text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                        <Fuel className="w-3 h-3" />
                        <span>{fournisseur.typeGasoilFourni}</span>
                      </span>
                    </td>

                    <td className="p-3.5 text-[11px] text-slate-400 space-y-0.5">
                      {fournisseur.telephone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{fournisseur.telephone}</span>
                        </div>
                      )}
                      {fournisseur.email && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{fournisseur.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 font-mono-num text-[11px] text-slate-300">
                      {fournisseur.numContrat ? (
                        <span className="flex items-center gap-1 text-slate-200">
                          <FileText className="w-3 h-3 text-slate-500" />
                          {fournisseur.numContrat}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Sans contrat cadre</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold inline-block border ${
                        fournisseur.statut === 'Actif'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-950 text-red-400 border-red-500/30'
                      }`}>
                        {fournisseur.statut}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(fournisseur)}
                          title="Modifier"
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setFournisseurToDelete(fournisseur)}
                          title="Supprimer"
                          className="p-1.5 rounded hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Fournisseur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2 font-industrial">
                <Building2 className="w-4 h-4 text-amber-500" />
                {editingFournisseur ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur de Carburant'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 bg-red-950 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Code Fournisseur *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    placeholder="FRS-01"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Raison Sociale / Société *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={e => setFormData({...formData, nom: e.target.value})}
                    placeholder="TotalEnergies, Shell, etc."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Contact Référent</label>
                  <input
                    type="text"
                    value={formData.contactNom}
                    onChange={e => setFormData({...formData, contactNom: e.target.value})}
                    placeholder="Nom du responsable B2B"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">N° Téléphone</label>
                  <input
                    type="text"
                    value={formData.telephone}
                    onChange={e => setFormData({...formData, telephone: e.target.value})}
                    placeholder="+212 5 22 ... ou +212 6 ..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Email Commercial</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="contact@fournisseur.ma"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">N° Contrat / Accord Cadre</label>
                  <input
                    type="text"
                    value={formData.numContrat}
                    onChange={e => setFormData({...formData, numContrat: e.target.value})}
                    placeholder="CTR-2026-..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Type de Carburant Fourni</label>
                  <select
                    value={formData.typeGasoilFourni}
                    onChange={e => setFormData({...formData, typeGasoilFourni: e.target.value})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  >
                    <option value="Gasoil Standard 10ppm">Gasoil Standard 10ppm</option>
                    <option value="Gasoil Non Routier (GNR)">Gasoil Non Routier (GNR)</option>
                    <option value="Gasoil Heavy Duty">Gasoil Heavy Duty</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Statut Partenariat</label>
                  <select
                    value={formData.statut}
                    onChange={e => setFormData({...formData, statut: e.target.value as 'Actif' | 'Inactif'})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  >
                    <option value="Actif">Actif (Opérationnel)</option>
                    <option value="Inactif">Inactif (Suspendu)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 flex items-center justify-between">
                  <span>Adresse / Dépôt Pétrolier</span>
                  <span className="text-[10px] text-amber-400">🇲🇦 {ALL_MOROCCO_CITY_NAMES.length} villes du Maroc</span>
                </label>
                <input
                  type="text"
                  list="morocco-cities-frs"
                  value={formData.adresse}
                  onChange={e => setFormData({...formData, adresse: e.target.value})}
                  placeholder="Zone Pétrolière Port Mohammedia, Dépôt Sud ou Casablanca..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
                <datalist id="morocco-cities-frs">
                  {ALL_MOROCCO_CITY_NAMES.map(city => (
                    <option key={`frs-city-${city}`} value={city} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Notes & Modalités de Livraison</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Délai de commande sous 24h, bon de commande obligatoire..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  {editingFournisseur ? 'Enregistrer Modifications' : 'Créer Fournisseur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {fournisseurToDelete && (
        <ConfirmModal
          isOpen={true}
          title={`Supprimer le fournisseur ${fournisseurToDelete.nom}`}
          message={`Êtes-vous sûr de vouloir supprimer définitivement ${fournisseurToDelete.nom} (${fournisseurToDelete.code}) du répertoire ?`}
          detail={`Type : ${fournisseurToDelete.typeGasoilFourni} • Contrat : ${fournisseurToDelete.numContrat || 'N/A'}`}
          confirmLabel="Supprimer Fournisseur"
          onConfirm={() => {
            onDeleteFournisseur(fournisseurToDelete.id);
            setFournisseurToDelete(null);
          }}
          onCancel={() => setFournisseurToDelete(null)}
        />
      )}
    </div>
  );
};
