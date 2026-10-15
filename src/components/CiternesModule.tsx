import React, { useState } from 'react';
import { Citerne } from '../types';
import { CiterneGraphic } from './CiterneGraphic';
import { ConfirmModal } from './ConfirmModal';
import { 
  Layers, 
  Plus, 
  Edit2, 
  Trash2, 
  Gauge, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Droplet, 
  Sliders, 
  X,
  ShieldAlert
} from 'lucide-react';

interface CiternesModuleProps {
  citernes: Citerne[];
  onAddCiterne: (citerne: Omit<Citerne, 'id'>) => void;
  onUpdateCiterne: (citerne: Citerne) => void;
  onDeleteCiterne: (id: string) => void;
  onUpdateCiterneLevel: (citerneId: string, newLevel: number) => void;
}

export const CiternesModule: React.FC<CiternesModuleProps> = ({
  citernes,
  onAddCiterne,
  onUpdateCiterne,
  onDeleteCiterne,
  onUpdateCiterneLevel
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCiterne, setEditingCiterne] = useState<Citerne | null>(null);
  const [citerneToDelete, setCiterneToDelete] = useState<Citerne | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    capaciteTotale: 50000,
    stockActuel: 35000,
    seuilAlerteBas: 10000,
    seuilCritique: 4000,
    temperatureC: 18.0,
    densiteKgL: 0.840,
    typeGasoil: 'Gasoil Standard 10ppm' as 'Gasoil Standard 10ppm' | 'Gasoil Non Routier (GNR)' | 'Gasoil Heavy Duty',
    emplacement: 'Zone Dépôt Usine',
    dernierControle: new Date().toISOString().split('T')[0],
    statut: 'Opérationnelle' as 'Opérationnelle' | 'En Remplissage' | 'Maintenance'
  });

  const handleOpenCreate = () => {
    setEditingCiterne(null);
    setFormData({
      code: `CIT-0${citernes.length + 1}`,
      nom: `Citerne Réserve ${String.fromCharCode(65 + citernes.length)}`,
      capaciteTotale: 40000,
      stockActuel: 25000,
      seuilAlerteBas: 8000,
      seuilCritique: 3000,
      temperatureC: 18.5,
      densiteKgL: 0.842,
      typeGasoil: 'Gasoil Standard 10ppm',
      emplacement: 'Zone Dépôt Centrale',
      dernierControle: new Date().toISOString().split('T')[0],
      statut: 'Opérationnelle'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Citerne) => {
    setEditingCiterne(c);
    setFormData({
      code: c.code,
      nom: c.nom,
      capaciteTotale: c.capaciteTotale,
      stockActuel: c.stockActuel,
      seuilAlerteBas: c.seuilAlerteBas,
      seuilCritique: c.seuilCritique,
      temperatureC: c.temperatureC,
      densiteKgL: c.densiteKgL,
      typeGasoil: c.typeGasoil,
      emplacement: c.emplacement,
      dernierControle: c.dernierControle,
      statut: c.statut
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.code || !formData.nom) {
      setFormError('Veuillez renseigner le code et le nom de la citerne.');
      return;
    }

    if (formData.stockActuel > formData.capaciteTotale) {
      setFormError('Le stock actuel ne peut pas dépasser la capacité totale de la citerne.');
      return;
    }

    if (editingCiterne) {
      onUpdateCiterne({
        ...editingCiterne,
        ...formData
      });
    } else {
      onAddCiterne(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-industrial">
            <Layers className="w-5 h-5 text-amber-500" />
            Gestion des Citernes & Cuves de Stockage
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Paramétrage des capacités industrielles, seuils d'alerte, sondes magnétostrictives et jaugeage ({citernes.length} citernes installées)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Ajouter une Citerne</span>
        </button>
      </div>

      {/* Grid of Citernes with Interactive Graphic and Management Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {citernes.map(citerne => {
          const percentage = ((citerne.stockActuel / citerne.capaciteTotale) * 100).toFixed(1);
          const isCritical = citerne.stockActuel <= citerne.seuilCritique;
          const isWarning = !isCritical && citerne.stockActuel <= citerne.seuilAlerteBas;

          return (
            <div 
              key={citerne.id} 
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between"
            >
              {/* Graphic View Component */}
              <div className="p-3">
                <CiterneGraphic
                  citerne={citerne}
                  onSimulateLevelChange={(val) => onUpdateCiterneLevel(citerne.id, val)}
                />
              </div>

              {/* Management Controls Bar */}
              <div className="p-4 bg-slate-950/70 border-t border-slate-800/80 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    <span>Seuil Réserve Basse :</span>
                    <span className="font-mono-num font-bold text-amber-400 block">
                      {citerne.seuilAlerteBas.toLocaleString()} L
                    </span>
                  </div>
                  <div>
                    <span>Seuil Critique :</span>
                    <span className="font-mono-num font-bold text-red-400 block">
                      {citerne.seuilCritique.toLocaleString()} L
                    </span>
                  </div>
                  <div>
                    <span>Type de Carburant :</span>
                    <span className="font-semibold text-slate-200 block truncate">
                      {citerne.typeGasoil}
                    </span>
                  </div>
                  <div>
                    <span>Dernier Contrôle :</span>
                    <span className="font-mono-num text-slate-300 block">
                      {citerne.dernierControle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{citerne.emplacement}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(citerne)}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Modifier</span>
                    </button>

                    <button
                      onClick={() => setCiterneToDelete(citerne)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 transition cursor-pointer"
                      title="Supprimer la citerne"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Citerne */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2 font-industrial">
                <Layers className="w-4 h-4 text-amber-500" />
                {editingCiterne ? 'Modifier les Paramètres de la Citerne' : 'Nouvelle Citerne de Stockage'}
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
                  <label className="text-slate-400 block mb-1">Code Citerne *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    placeholder="CIT-04"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Nom / Désignation *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={e => setFormData({...formData, nom: e.target.value})}
                    placeholder="Citerne Principale D"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-amber-400">
                    Capacité Totale (Litres) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    value={formData.capaciteTotale}
                    onChange={e => setFormData({...formData, capaciteTotale: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-amber-400 font-bold font-mono-num"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-slate-200">
                    Stock Actuel (Litres) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={formData.capaciteTotale}
                    step="100"
                    value={formData.stockActuel}
                    onChange={e => setFormData({...formData, stockActuel: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-bold font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Seuil Alerte Bas (Litres) *</label>
                  <input
                    type="number"
                    required
                    value={formData.seuilAlerteBas}
                    onChange={e => setFormData({...formData, seuilAlerteBas: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-amber-300 font-mono-num"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Seuil Critique (Litres) *</label>
                  <input
                    type="number"
                    required
                    value={formData.seuilCritique}
                    onChange={e => setFormData({...formData, seuilCritique: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-red-400 font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Type de Gasoil</label>
                  <select
                    value={formData.typeGasoil}
                    onChange={e => setFormData({...formData, typeGasoil: e.target.value as any})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  >
                    <option value="Gasoil Standard 10ppm">Gasoil Standard 10ppm</option>
                    <option value="Gasoil Non Routier (GNR)">Gasoil Non Routier (GNR)</option>
                    <option value="Gasoil Heavy Duty">Gasoil Heavy Duty</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Statut Opérationnel</label>
                  <select
                    value={formData.statut}
                    onChange={e => setFormData({...formData, statut: e.target.value as any})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  >
                    <option value="Opérationnelle">Opérationnelle</option>
                    <option value="En Remplissage">En Remplissage</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Température (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperatureC}
                    onChange={e => setFormData({...formData, temperatureC: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Densité (kg/L)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.densiteKgL}
                    onChange={e => setFormData({...formData, densiteKgL: Number(e.target.value)})}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100 font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Emplacement / Quai</label>
                <input
                  type="text"
                  value={formData.emplacement}
                  onChange={e => setFormData({...formData, emplacement: e.target.value})}
                  placeholder="Quai Nord, Atelier Central..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  {editingCiterne ? 'Enregistrer Modifications' : 'Créer la Citerne'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {citerneToDelete && (
        <ConfirmModal
          isOpen={true}
          title={`Supprimer la citerne ${citerneToDelete.code}`}
          message={`Êtes-vous certain de vouloir supprimer définitivement la citerne "${citerneToDelete.nom}" (${citerneToDelete.code}) ?`}
          detail={
            citerneToDelete.stockActuel > 0 
              ? `ATTENTION : Cette citerne contient actuellement ${citerneToDelete.stockActuel.toLocaleString()} Litres de carburant sur ${citerneToDelete.capaciteTotale.toLocaleString()} L !`
              : `Capacité : ${citerneToDelete.capaciteTotale.toLocaleString()} Litres • Emplacement : ${citerneToDelete.emplacement}`
          }
          confirmLabel="Supprimer Définitivement"
          onConfirm={() => {
            onDeleteCiterne(citerneToDelete.id);
            setCiterneToDelete(null);
          }}
          onCancel={() => setCiterneToDelete(null)}
        />
      )}
    </div>
  );
};
