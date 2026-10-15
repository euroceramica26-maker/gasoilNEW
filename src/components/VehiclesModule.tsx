import React, { useState } from 'react';
import { Vehicle, VehicleType, VehicleStatus, VehicleTypeConfig } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { Plus, Download, Upload, Search, Edit2, Trash2, Truck, AlertCircle, FileSpreadsheet, Check, X } from 'lucide-react';

interface VehiclesModuleProps {
  vehicles: Vehicle[];
  vehicleTypes?: VehicleTypeConfig[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onImportVehicles: (imported: Vehicle[]) => void;
}

const VEHICLE_TYPES: VehicleType[] = [
  'Camion Benne',
  'Pelleteuse',
  'Chargeuse',
  'Chariot Elévateur',
  'Groupe Electrogène',
  'Véhicule Léger',
  'Dumper'
];

export const VehiclesModule: React.FC<VehiclesModuleProps> = ({
  vehicles,
  vehicleTypes,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onImportVehicles
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('Tous');
  const [selectedStatus, setSelectedStatus] = useState<string>('Tous');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [importNotification, setImportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const availableTypeNames = vehicleTypes && vehicleTypes.length > 0 
    ? Array.from(new Set([...vehicleTypes.filter(vt => vt.actif).map(vt => vt.libelle), ...VEHICLE_TYPES]))
    : VEHICLE_TYPES;

  const handleTypeSelect = (typeName: string) => {
    const matched = vehicleTypes?.find(vt => vt.libelle === typeName);
    if (matched) {
      setFormData(prev => ({
        ...prev,
        type: typeName as VehicleType,
        uniteMesure: matched.uniteMesure,
        consommationMoyenneTheorique: matched.consoDefautTheorique
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        type: typeName as VehicleType
      }));
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    immatriculation: '',
    marque: '',
    modele: '',
    type: 'Camion Benne' as VehicleType,
    status: 'Actif' as VehicleStatus,
    annee: 2023,
    kilometrageOuHeures: 0,
    uniteMesure: 'km' as 'km' | 'heures',
    capaciteReservoir: 300,
    consommationMoyenneTheorique: 35,
    dateMiseEnService: new Date().toISOString().split('T')[0],
    departement: 'Transport Usine'
  });

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setFormData({
      code: `ENG-${Math.floor(100 + Math.random() * 900)}`,
      immatriculation: '',
      marque: '',
      modele: '',
      type: 'Camion Benne',
      status: 'Actif',
      annee: new Date().getFullYear(),
      kilometrageOuHeures: 0,
      uniteMesure: 'km',
      capaciteReservoir: 400,
      consommationMoyenneTheorique: 45,
      dateMiseEnService: new Date().toISOString().split('T')[0],
      departement: 'Carrière & Extraction'
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({
      code: v.code,
      immatriculation: v.immatriculation,
      marque: v.marque,
      modele: v.modele,
      type: v.type,
      status: v.status,
      annee: v.annee,
      kilometrageOuHeures: v.kilometrageOuHeures,
      uniteMesure: v.uniteMesure,
      capaciteReservoir: v.capaciteReservoir,
      consommationMoyenneTheorique: v.consommationMoyenneTheorique,
      dateMiseEnService: v.dateMiseEnService,
      departement: v.departement
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.code || !formData.marque || !formData.modele) {
      setFormError('Veuillez renseigner le code, la marque et le modèle.');
      return;
    }

    if (editingVehicle) {
      onUpdateVehicle({
        ...editingVehicle,
        ...formData
      });
    } else {
      onAddVehicle({
        ...formData,
        derniereConsoReelle: formData.consommationMoyenneTheorique
      });
    }
    setIsModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Code',
      'Immatriculation',
      'Marque',
      'Modele',
      'Type',
      'Statut',
      'Annee',
      'Compteur',
      'Unite',
      'CapaciteReservoir_L',
      'ConsoTheorique',
      'Departement'
    ];

    const rows = vehicles.map(v => [
      `"${v.code}"`,
      `"${v.immatriculation}"`,
      `"${v.marque}"`,
      `"${v.modele}"`,
      `"${v.type}"`,
      `"${v.status}"`,
      v.annee,
      v.kilometrageOuHeures,
      `"${v.uniteMesure}"`,
      v.capaciteReservoir,
      v.consommationMoyenneTheorique,
      `"${v.departement}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `parc_vehicules_gasoil_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) {
          setImportNotification({ type: 'error', message: 'Le fichier CSV est vide ou ne contient que les en-têtes.' });
          return;
        }

        const delimiter = lines[0].includes(';') ? ';' : ',';
        const newVehicles: Vehicle[] = [];

        // Parse starting line 1
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 5) {
            newVehicles.push({
              id: `imp-${Date.now()}-${i}`,
              code: cols[0] || `ENG-IMP-${i}`,
              immatriculation: cols[1] || 'SANS-IMMAT',
              marque: cols[2] || 'Générique',
              modele: cols[3] || 'Industriel',
              type: (VEHICLE_TYPES.includes(cols[4] as VehicleType) ? cols[4] : 'Camion Benne') as VehicleType,
              status: (cols[5] === 'En Maintenance' || cols[5] === 'Hors Service' ? cols[5] : 'Actif') as VehicleStatus,
              annee: Number(cols[6]) || 2022,
              kilometrageOuHeures: Number(cols[7]) || 0,
              uniteMesure: cols[8]?.toLowerCase().includes('h') ? 'heures' : 'km',
              capaciteReservoir: Number(cols[9]) || 350,
              consommationMoyenneTheorique: Number(cols[10]) || 30,
              dateMiseEnService: new Date().toISOString().split('T')[0],
              departement: cols[11] || 'Atelier Général'
            });
          }
        }

        if (newVehicles.length > 0) {
          onImportVehicles(newVehicles);
          setImportNotification({ type: 'success', message: `${newVehicles.length} véhicules et engins importés avec succès !` });
        } else {
          setImportNotification({ type: 'error', message: 'Aucune ligne valide trouvée dans le CSV.' });
        }
      } catch (err) {
        setImportNotification({ type: 'error', message: 'Erreur lors de la lecture du fichier CSV. Vérifiez le format.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered List
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.immatriculation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modele.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.departement.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'Tous' || v.type === selectedType;
    const matchesStatus = selectedStatus === 'Tous' || v.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Module Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-industrial">
            <Truck className="w-5 h-5 text-amber-500" />
            Module 1 : Gestion du Parc et des Véhicules
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi des camions, engins lourds, chargeuses et groupes électrogènes ({vehicles.length} unités au parc)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Import */}
          <label className="cursor-pointer px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-slate-700 transition">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Importer CSV/Excel</span>
            <input 
              type="file" 
              accept=".csv,.txt" 
              onChange={handleImportCSV} 
              className="hidden" 
            />
          </label>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exporter CSV</span>
          </button>

          {/* Add Vehicle Button */}
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Ajouter Véhicule / Engin</span>
          </button>
        </div>
      </div>

      {/* Import CSV Status Notification Banner */}
      {importNotification && (
        <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
          importNotification.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/80 border-red-500/40 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {importNotification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{importNotification.message}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="p-1 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par code (ENG-101), immat, marque, modèle, atelier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="Tous">Tous les Types ({vehicles.length})</option>
            {VEHICLE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="Tous">Tous les Statuts</option>
            <option value="Actif">Actif</option>
            <option value="En Maintenance">En Maintenance</option>
            <option value="Hors Service">Hors Service</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table / Grid */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-3.5">Code / Immat</th>
                <th className="p-3.5">Engin & Modèle</th>
                <th className="p-3.5">Département</th>
                <th className="p-3.5">Index Actuel</th>
                <th className="p-3.5">Réservoir</th>
                <th className="p-3.5">Conso Théorique vs Réelle</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Aucun véhicule ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(vehicle => {
                  const hasOverconsumption = 
                    vehicle.derniereConsoReelle && 
                    vehicle.derniereConsoReelle > vehicle.consommationMoyenneTheorique * 1.15;

                  return (
                    <tr key={vehicle.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-industrial text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                            {vehicle.code}
                          </span>
                        </div>
                        <span className="font-mono-num text-[11px] text-slate-400 block mt-1">
                          {vehicle.immatriculation}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-100">
                          {vehicle.marque} {vehicle.modele}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {vehicle.type} ({vehicle.annee})
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-400">
                        {vehicle.departement}
                      </td>

                      <td className="p-3.5 font-mono-num font-semibold text-slate-200">
                        {vehicle.kilometrageOuHeures.toLocaleString('fr-FR')} {vehicle.uniteMesure}
                      </td>

                      <td className="p-3.5 font-mono-num text-slate-300">
                        {vehicle.capaciteReservoir} L
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2 font-mono-num">
                          <span className="text-slate-400">
                            Réf: {vehicle.consommationMoyenneTheorique} {vehicle.uniteMesure === 'km' ? 'L/100km' : 'L/h'}
                          </span>
                        </div>
                        {vehicle.derniereConsoReelle && (
                          <div className={`text-[11px] font-mono-num font-semibold mt-0.5 flex items-center gap-1 ${
                            hasOverconsumption ? 'text-red-400 font-bold' : 'text-emerald-400'
                          }`}>
                            {hasOverconsumption && <AlertCircle className="w-3 h-3 text-red-400 animate-pulse" />}
                            <span>Réelle: {vehicle.derniereConsoReelle.toFixed(1)} {vehicle.uniteMesure === 'km' ? 'L/100km' : 'L/h'}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold inline-block border ${
                          vehicle.status === 'Actif'
                            ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30'
                            : vehicle.status === 'En Maintenance'
                            ? 'bg-amber-950/70 text-amber-400 border-amber-500/30'
                            : 'bg-red-950/70 text-red-400 border-red-500/30'
                        }`}>
                          {vehicle.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(vehicle)}
                            title="Modifier"
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setVehicleToDelete(vehicle)}
                            title="Supprimer"
                            className="p-1.5 rounded hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Vehicle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-500" />
                {editingVehicle ? 'Modifier le Véhicule' : 'Nouveau Véhicule / Engin'}
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
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Code Usine (Interne) *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                    placeholder="ENG-101"
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Immatriculation</label>
                  <input
                    type="text"
                    value={formData.immatriculation}
                    onChange={e => setFormData({...formData, immatriculation: e.target.value})}
                    placeholder="48291-A-12"
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Marque *</label>
                  <input
                    type="text"
                    required
                    value={formData.marque}
                    onChange={e => setFormData({...formData, marque: e.target.value})}
                    placeholder="Caterpillar, Volvo..."
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Modèle *</label>
                  <input
                    type="text"
                    required
                    value={formData.modele}
                    onChange={e => setFormData({...formData, modele: e.target.value})}
                    placeholder="336D, FMX 460..."
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Type d'Engin</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as VehicleType})}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:border-amber-500"
                  >
                    {VEHICLE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Statut Opérationnel</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as VehicleStatus})}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100 focus:border-amber-500"
                  >
                    <option value="Actif">Actif</option>
                    <option value="En Maintenance">En Maintenance</option>
                    <option value="Hors Service">Hors Service</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Année</label>
                  <input
                    type="number"
                    value={formData.annee}
                    onChange={e => setFormData({...formData, annee: Number(e.target.value)})}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unité Compteur</label>
                  <select
                    value={formData.uniteMesure}
                    onChange={e => setFormData({...formData, uniteMesure: e.target.value as 'km' | 'heures'})}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  >
                    <option value="km">Kilomètres (km)</option>
                    <option value="heures">Heures moteur (h)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Index Compteur</label>
                  <input
                    type="number"
                    value={formData.kilometrageOuHeures}
                    onChange={e => setFormData({...formData, kilometrageOuHeures: Number(e.target.value)})}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Capacité Réservoir (L)</label>
                  <input
                    type="number"
                    value={formData.capaciteReservoir}
                    onChange={e => setFormData({...formData, capaciteReservoir: Number(e.target.value)})}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">
                    Conso Théorique ({formData.uniteMesure === 'km' ? 'L/100km' : 'L/h'})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.consommationMoyenneTheorique}
                    onChange={e => setFormData({...formData, consommationMoyenneTheorique: Number(e.target.value)})}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Département / Affectation</label>
                <input
                  type="text"
                  value={formData.departement}
                  onChange={e => setFormData({...formData, departement: e.target.value})}
                  placeholder="Carrière, Transport, Concassage..."
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  {editingVehicle ? 'Enregistrer Modifications' : 'Ajouter au Parc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {vehicleToDelete && (
        <ConfirmModal
          isOpen={true}
          title={`Supprimer le véhicule ${vehicleToDelete.code}`}
          message={`Êtes-vous sûr de vouloir supprimer définitivement le véhicule ${vehicleToDelete.code} (${vehicleToDelete.marque} ${vehicleToDelete.modele}) ?`}
          detail={`Immatriculation : ${vehicleToDelete.immatriculation} • Type : ${vehicleToDelete.type} • Compteur : ${vehicleToDelete.kilometrageOuHeures.toLocaleString()} ${vehicleToDelete.uniteMesure}`}
          confirmLabel="Supprimer du Parc"
          onConfirm={() => {
            onDeleteVehicle(vehicleToDelete.id);
            setVehicleToDelete(null);
          }}
          onCancel={() => setVehicleToDelete(null)}
        />
      )}
    </div>
  );
};
