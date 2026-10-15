import React, { useState } from 'react';
import { VehicleTypeConfig } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { 
  Wrench, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  X, 
  Download, 
  AlertTriangle,
  Gauge,
  Tag,
  SlidersHorizontal
} from 'lucide-react';

interface VehicleTypesModuleProps {
  vehicleTypes: VehicleTypeConfig[];
  onAddVehicleType: (vt: Omit<VehicleTypeConfig, 'id'>) => void;
  onUpdateVehicleType: (vt: VehicleTypeConfig) => void;
  onDeleteVehicleType: (id: string) => void;
}

const CATEGORIES = ['Transport', 'Extraction', 'Manutention', 'Énergie', 'Liaison'] as const;

export const VehicleTypesModule: React.FC<VehicleTypesModuleProps> = ({
  vehicleTypes,
  onAddVehicleType,
  onUpdateVehicleType,
  onDeleteVehicleType
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<VehicleTypeConfig | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<VehicleTypeConfig | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    categorie: 'Extraction' as 'Transport' | 'Extraction' | 'Manutention' | 'Énergie' | 'Liaison',
    uniteMesure: 'heures' as 'km' | 'heures',
    consoDefautTheorique: 25.0,
    description: '',
    actif: true
  });

  const handleOpenCreate = () => {
    setEditingType(null);
    setFormError(null);
    setFormData({
      code: `TYP-ENG-${vehicleTypes.length + 1}`,
      libelle: '',
      categorie: 'Extraction',
      uniteMesure: 'heures',
      consoDefautTheorique: 20.0,
      description: '',
      actif: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vt: VehicleTypeConfig) => {
    setEditingType(vt);
    setFormError(null);
    setFormData({
      code: vt.code,
      libelle: vt.libelle,
      categorie: vt.categorie,
      uniteMesure: vt.uniteMesure,
      consoDefautTheorique: vt.consoDefautTheorique,
      description: vt.description,
      actif: vt.actif
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.code || !formData.libelle) {
      setFormError('Veuillez renseigner le code et le libellé du type d’engin.');
      return;
    }

    if (editingType) {
      onUpdateVehicleType({
        ...editingType,
        ...formData
      });
    } else {
      onAddVehicleType(formData);
    }
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Code', 'Libelle', 'Categorie', 'Unite', 'ConsoTheoriqueDefaut', 'Description', 'Actif'];
    const rows = vehicleTypes.map(vt => [
      `"${vt.code}"`,
      `"${vt.libelle}"`,
      `"${vt.categorie}"`,
      `"${vt.uniteMesure}"`,
      vt.consoDefautTheorique,
      `"${vt.description}"`,
      vt.actif ? 'Oui' : 'Non'
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `types_engins_gasoil_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTypes = vehicleTypes.filter(vt => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      vt.libelle.toLowerCase().includes(term) ||
      vt.code.toLowerCase().includes(term) ||
      vt.description.toLowerCase().includes(term) ||
      vt.categorie.toLowerCase().includes(term);

    const matchesCategory = selectedCategory === 'Tous' || vt.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-industrial">
            <SlidersHorizontal className="w-5 h-5 text-amber-500" />
            Gestion des Types d'Engins & Machines
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Classification des catégories d'engins, étalons de consommation théorique et unités ({vehicleTypes.length} types configurés)
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
            <span>Nouveau Type d'Engin</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block">Total Catégories</span>
          <span className="font-mono-num font-bold text-xl text-slate-100 mt-1 block">
            {vehicleTypes.length}
          </span>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block">Suivi Horamètre (h)</span>
          <span className="font-mono-num font-bold text-xl text-amber-400 mt-1 block">
            {vehicleTypes.filter(vt => vt.uniteMesure === 'heures').length} types (L/h)
          </span>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block">Suivi Kilométrique (km)</span>
          <span className="font-mono-num font-bold text-xl text-blue-400 mt-1 block">
            {vehicleTypes.filter(vt => vt.uniteMesure === 'km').length} types (L/100km)
          </span>
        </div>
        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 block">Engins Extraction</span>
          <span className="font-mono-num font-bold text-xl text-emerald-400 mt-1 block">
            {vehicleTypes.filter(vt => vt.categorie === 'Extraction').length} types
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-3">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par libellé, code (TYP-CAM), catégorie, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="Tous">Toutes les Catégories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Types Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="p-3.5">Code & Type</th>
                <th className="p-3.5">Catégorie Usine</th>
                <th className="p-3.5">Unité Compteur</th>
                <th className="p-3.5">Conso Référence Usine</th>
                <th className="p-3.5">Description d'Emploi</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Aucun type d'engin trouvé.
                  </td>
                </tr>
              ) : (
                filteredTypes.map(vt => (
                  <tr key={vt.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-industrial text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                          {vt.code}
                        </span>
                      </div>
                      <span className="font-bold text-slate-100 text-sm block mt-1">
                        {vt.libelle}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        vt.categorie === 'Extraction'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                          : vt.categorie === 'Transport'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-500/30'
                          : vt.categorie === 'Manutention'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                          : vt.categorie === 'Énergie'
                          ? 'bg-red-950/80 text-red-300 border-red-500/30'
                          : 'bg-purple-950/80 text-purple-300 border-purple-500/30'
                      }`}>
                        {vt.categorie}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono-num font-semibold text-slate-200">
                      {vt.uniteMesure === 'km' ? 'Kilomètres (km)' : 'Heures Moteur (h)'}
                    </td>

                    <td className="p-3.5 font-mono-num font-bold text-amber-400">
                      {vt.consoDefautTheorique} {vt.uniteMesure === 'km' ? 'L/100km' : 'L/h'}
                    </td>

                    <td className="p-3.5 text-slate-400 max-w-xs">
                      {vt.description || <span className="italic text-slate-600">Aucune description</span>}
                    </td>

                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold inline-block border ${
                        vt.actif
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {vt.actif ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(vt)}
                          title="Modifier"
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTypeToDelete(vt)}
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

      {/* Modal Add / Edit Type */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2 font-industrial">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                {editingType ? 'Modifier le Type d’Engin' : 'Nouveau Type d’Engin / Machine'}
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
                  <label className="text-slate-400 block mb-1">Code Type *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    placeholder="TYP-ENG"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Libellé / Désignation *</label>
                  <input
                    type="text"
                    required
                    value={formData.libelle}
                    onChange={e => setFormData({...formData, libelle: e.target.value})}
                    placeholder="Niveleuse, Dumper, etc."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Catégorie d'Affectation</label>
                  <select
                    value={formData.categorie}
                    onChange={e => setFormData({...formData, categorie: e.target.value as any})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Unité de Mesure</label>
                  <select
                    value={formData.uniteMesure}
                    onChange={e => setFormData({...formData, uniteMesure: e.target.value as 'km' | 'heures'})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  >
                    <option value="heures">Heures Moteur (Engins/Machines)</option>
                    <option value="km">Kilomètres (Camions/Utilitaires)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-amber-400">
                    Conso Référence Défaut ({formData.uniteMesure === 'km' ? 'L/100km' : 'L/h'}) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.consoDefautTheorique}
                    onChange={e => setFormData({...formData, consoDefautTheorique: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-amber-400 font-bold font-mono-num"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Statut Type</label>
                  <select
                    value={formData.actif ? 'true' : 'false'}
                    onChange={e => setFormData({...formData, actif: e.target.value === 'true'})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  >
                    <option value="true">Actif (Disponible à la sélection)</option>
                    <option value="false">Désactivé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description & Domaine d'Utilisation</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Usage principal, tonnage, affectation carrière..."
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
                  {editingType ? 'Enregistrer Modifications' : 'Créer le Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {typeToDelete && (
        <ConfirmModal
          isOpen={true}
          title={`Supprimer le type ${typeToDelete.libelle}`}
          message={`Êtes-vous sûr de vouloir supprimer définitivement la configuration pour "${typeToDelete.libelle}" (${typeToDelete.code}) ?`}
          detail={`Catégorie : ${typeToDelete.categorie} • Norme conso : ${typeToDelete.consoDefautTheorique} ${typeToDelete.uniteMesure === 'km' ? 'L/100km' : 'L/h'}`}
          confirmLabel="Supprimer le Type"
          onConfirm={() => {
            onDeleteVehicleType(typeToDelete.id);
            setTypeToDelete(null);
          }}
          onCancel={() => setTypeToDelete(null)}
        />
      )}
    </div>
  );
};
