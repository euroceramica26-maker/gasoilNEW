import React, { useState } from 'react';
import { FuelDispense, Vehicle, Citerne, User, Subscription } from '../types';
import { SignaturePad } from './SignaturePad';
import { PrintReceiptModal } from './PrintReceiptModal';
import { ConfirmModal } from './ConfirmModal';
import { 
  Fuel, 
  Plus, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Calendar, 
  User as UserIcon, 
  Gauge, 
  X, 
  FileSignature, 
  Trash2, 
  PenTool,
  Search,
  Truck,
  Car,
  BarChart3,
  Edit2,
  Calculator,
  RotateCcw
} from 'lucide-react';

interface FuelDispensesModuleProps {
  dispenses: FuelDispense[];
  vehicles: Vehicle[];
  citernes: Citerne[];
  currentUser?: User | null;
  subscriptions?: Subscription[];
  onAddDispense: (dispense: Omit<FuelDispense, 'id'>) => void;
  onUpdateDispense?: (dispense: FuelDispense) => void;
  onDeleteDispense?: (id: string, restoreTankStock: boolean) => void;
  onOpenReports?: () => void;
}

export const FuelDispensesModule: React.FC<FuelDispensesModuleProps> = ({
  dispenses,
  vehicles,
  citernes,
  currentUser,
  subscriptions = [],
  onAddDispense,
  onUpdateDispense,
  onDeleteDispense,
  onOpenReports
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDispenseForPrint, setSelectedDispenseForPrint] = useState<FuelDispense | null>(null);
  const [dispenseToDelete, setDispenseToDelete] = useState<FuelDispense | null>(null);
  const [viewSignatures, setViewSignatures] = useState<FuelDispense | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [editingDispense, setEditingDispense] = useState<FuelDispense | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicles[0]?.id || '');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [citerneId, setCiterneId] = useState(citernes[0]?.id || '');
  const [pompiste, setPompiste] = useState('Samir Chaabane');
  const [chauffeur, setChauffeur] = useState('');
  const [volumeLivre, setVolumeLivre] = useState<number>(150);
  const [volumeLivreInput, setVolumeLivreInput] = useState<string>('150');
  const [compteurPrecedent, setCompteurPrecedent] = useState<number>(0);
  const [compteurActuel, setCompteurActuel] = useState<number>(0);
  const [deltaCompteur, setDeltaCompteur] = useState<number>(250);
  const [isStationary, setIsStationary] = useState<boolean>(false);
  const [isManualRatio, setIsManualRatio] = useState<boolean>(false);
  const [manualRatioValue, setManualRatioValue] = useState<string>('');
  const [remarques, setRemarques] = useState('');
  const [signatureChauffeur, setSignatureChauffeur] = useState('');
  const [signaturePompiste, setSignaturePompiste] = useState('');
  const [activeSignatoryTab, setActiveSignatoryTab] = useState<'pompiste' | 'chauffeur'>('pompiste');

  const currentVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const currentCiterne = citernes.find(c => c.id === citerneId);

  // Filtered vehicles based on search (immatriculation, modèle, marque, code)
  const filteredVehicles = vehicles.filter(v => {
    if (!vehicleSearch.trim()) return true;
    const q = vehicleSearch.toLowerCase().trim();
    return (
      v.immatriculation.toLowerCase().includes(q) ||
      v.modele.toLowerCase().includes(q) ||
      v.marque.toLowerCase().includes(q) ||
      v.code.toLowerCase().includes(q) ||
      v.type.toLowerCase().includes(q)
    );
  });

  React.useEffect(() => {
    if (citernes.length > 0 && (!citerneId || !citernes.some(c => c.id === citerneId))) {
      setCiterneId(citernes[0].id);
    }
  }, [citernes, citerneId]);

  React.useEffect(() => {
    if (vehicles.length > 0 && (!selectedVehicleId || !vehicles.some(v => v.id === selectedVehicleId))) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  // Synchronisation bidirectionnelle des compteurs et calcul du delta
  const handleCompteurPrecedentChange = (newPrec: number) => {
    setCompteurPrecedent(newPrec);
    setDeltaCompteur(Math.max(0, compteurActuel - newPrec));
  };

  const handleCompteurActuelChange = (newActuel: number) => {
    setCompteurActuel(newActuel);
    setDeltaCompteur(Math.max(0, newActuel - compteurPrecedent));
  };

  const handleDeltaChange = (newDelta: number) => {
    const validDelta = Math.max(0, newDelta);
    setDeltaCompteur(validDelta);
    setCompteurActuel(compteurPrecedent + validDelta);
  };

  // Calcul transparent et vérifiable du ratio de consommation
  let calculatedRatio = 0;
  if (isManualRatio && manualRatioValue) {
    const parsed = parseFloat(manualRatioValue.replace(',', '.'));
    calculatedRatio = isNaN(parsed) ? 0 : parsed;
  } else if (!isStationary && currentVehicle && deltaCompteur > 0 && volumeLivre > 0) {
    if (currentVehicle.uniteMesure === 'km') {
      // Litres aux 100 kilomètres : (Litres / km) * 100
      calculatedRatio = (volumeLivre / deltaCompteur) * 100;
    } else {
      // Litres par heure moteur : Litres / heures
      calculatedRatio = volumeLivre / deltaCompteur;
    }
  }

  const isOverconsumption = currentVehicle && calculatedRatio > 0 && !isStationary
    ? calculatedRatio > currentVehicle.consommationMoyenneTheorique * 1.15
    : false;

  const handleOpenForm = () => {
    setEditingDispense(null);
    setFormError(null);
    const v = vehicles[0];
    setSelectedVehicleId(v?.id || '');
    setCiterneId(citernes[0]?.id || '');
    
    // Récupérer le dernier index enregistré pour ce véhicule s'il existe
    const vehicleDispenses = v ? dispenses.filter(d => d.vehiculeId === v.id) : [];
    const lastDsp = vehicleDispenses.length > 0 ? vehicleDispenses[0] : null;
    const initialPrec = lastDsp ? lastDsp.compteurActuel : (v?.kilometrageOuHeures || 0);

    setCompteurPrecedent(initialPrec);
    setDeltaCompteur(0);
    setCompteurActuel(initialPrec);
    setIsStationary(false);
    setIsManualRatio(false);
    setManualRatioValue('');
    setVolumeLivre(0);
    setVolumeLivreInput('');
    setChauffeur('Mourad Kharrat');
    setPompiste(currentUser ? `${currentUser.prenom} ${currentUser.nom}` : 'Samir Chaabane');
    setRemarques('');
    setSignatureChauffeur('');
    setSignaturePompiste('');
    setActiveSignatoryTab('pompiste');
    setVehicleSearch('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (dsp: FuelDispense) => {
    setEditingDispense(dsp);
    setFormError(null);
    setSelectedVehicleId(dsp.vehiculeId);
    setCiterneId(dsp.citerneId);
    setVolumeLivre(dsp.volumeLivre);
    setVolumeLivreInput(String(dsp.volumeLivre).replace('.', ','));
    setCompteurPrecedent(dsp.compteurPrecedent || 0);
    setCompteurActuel(dsp.compteurActuel);
    const delta = dsp.deltaCompteur !== undefined ? dsp.deltaCompteur : Math.max(0, dsp.compteurActuel - (dsp.compteurPrecedent || 0));
    setDeltaCompteur(delta);
    setIsStationary(delta === 0);

    // Détecter si un ratio manuel spécifique avait été saisi
    const v = vehicles.find(item => item.id === dsp.vehiculeId);
    const autoRatio = delta > 0 && dsp.volumeLivre > 0
      ? (v?.uniteMesure === 'km' ? (dsp.volumeLivre / delta) * 100 : dsp.volumeLivre / delta)
      : 0;
    const isCustom = dsp.ratioConsommation > 0 && Math.abs(dsp.ratioConsommation - autoRatio) > 0.05;

    setIsManualRatio(isCustom);
    setManualRatioValue(String(dsp.ratioConsommation || ''));
    setChauffeur(dsp.chauffeur);
    setPompiste(dsp.pompiste);
    setRemarques(dsp.remarques || '');
    setSignatureChauffeur(dsp.signatureChauffeur || '');
    setSignaturePompiste(dsp.signaturePompiste || '');
    setActiveSignatoryTab('pompiste');
    setVehicleSearch('');
    setIsFormOpen(true);
  };

  const handleVolumeChange = (rawValue: string) => {
    // Nettoyer tous les caractères non numériques excepté virgule et point
    const cleaned = rawValue.replace(/[^0-9.,]/g, '');
    
    // Découper à la première virgule ou au premier point
    const parts = cleaned.split(/[.,]/);
    let formatted = parts[0] || '';
    
    if (parts.length > 1) {
      // Préserver le séparateur choisi par l'utilisateur (virgule ou point)
      const separator = cleaned.includes(',') ? ',' : '.';
      // Tolérer et contraindre strictement à 2 chiffres après la virgule
      const decimals = parts.slice(1).join('').slice(0, 2);
      formatted = `${parts[0]}${separator}${decimals}`;
    }
    
    setVolumeLivreInput(formatted);
    
    if (!formatted || formatted === ',' || formatted === '.') {
      setVolumeLivre(0);
      return;
    }
    
    const parsed = parseFloat(formatted.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      setVolumeLivre(Math.round(parsed * 100) / 100);
    } else {
      setVolumeLivre(0);
    }
  };

  const handleVolumeBlur = () => {
    // Si l'utilisateur termine avec une virgule ou point orphelin, nettoyer
    if (volumeLivreInput.endsWith(',') || volumeLivreInput.endsWith('.')) {
      const trimmed = volumeLivreInput.slice(0, -1);
      setVolumeLivreInput(trimmed);
    }
  };

  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const v = vehicles.find(item => item.id === vId);
    if (v) {
      const vehicleDispenses = dispenses.filter(d => d.vehiculeId === vId && (!editingDispense || d.id !== editingDispense.id));
      const lastDsp = vehicleDispenses.length > 0 ? vehicleDispenses[0] : null;
      const prec = lastDsp ? lastDsp.compteurActuel : (v.kilometrageOuHeures || 0);
      setCompteurPrecedent(prec);
      setDeltaCompteur(0);
      setCompteurActuel(prec);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCiterne) {
      setFormError('Aucune citerne de carburant disponible. Veuillez d’abord configurer une citerne dans Gestion Citernes.');
      return;
    }
    if (!currentVehicle) {
      setFormError('Veuillez sélectionner un véhicule ou engin destinataire.');
      return;
    }

    // Arrondi précis à 2 décimales
    const finalVolume = Number((Math.round(volumeLivre * 100) / 100).toFixed(2));

    if (finalVolume <= 0) {
      setFormError('Veuillez saisir un volume de carburant valide supérieur à 0 (ex: 120 ou 150,25 L).');
      return;
    }

    if (finalVolume > currentCiterne.stockActuel && !editingDispense) {
      setFormError(`Stock insuffisant dans ${currentCiterne.code} (reste ${currentCiterne.stockActuel.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L).`);
      return;
    }

    if (!isStationary && compteurActuel < compteurPrecedent) {
      setFormError(`L'index compteur actuel (${compteurActuel}) ne peut pas être inférieur au compteur précédent (${compteurPrecedent}).`);
      return;
    }

    const finalRatio = Number(calculatedRatio.toFixed(2));

    if (editingDispense) {
      const updated: FuelDispense = {
        ...editingDispense,
        citerneId,
        vehiculeId: selectedVehicleId,
        pompiste,
        chauffeur: chauffeur || 'Chauffeur de bord',
        volumeLivre: finalVolume,
        compteurActuel: isStationary ? compteurPrecedent : compteurActuel,
        compteurPrecedent,
        deltaCompteur: isStationary ? 0 : deltaCompteur,
        ratioConsommation: finalRatio,
        surconsommationAlerte: isOverconsumption,
        signatureChauffeur,
        signaturePompiste,
        remarques
      };

      if (onUpdateDispense) {
        onUpdateDispense(updated);
      }
      setIsFormOpen(false);
      setActionFeedback(`Le ticket ${editingDispense.codeTicket} et sa consommation (${finalRatio.toFixed(2)} ${currentVehicle.uniteMesure === 'km' ? 'L/100km' : 'L/h'}) ont été corrigés avec succès !`);
      setSelectedDispenseForPrint(updated);
      return;
    }

    const newDispense: Omit<FuelDispense, 'id'> = {
      codeTicket: `SORT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      dateHeure: new Date().toISOString(),
      citerneId,
      vehiculeId: selectedVehicleId,
      pompiste,
      chauffeur: chauffeur || 'Chauffeur de bord',
      volumeLivre: finalVolume,
      compteurActuel: isStationary ? compteurPrecedent : compteurActuel,
      compteurPrecedent,
      deltaCompteur: isStationary ? 0 : deltaCompteur,
      ratioConsommation: finalRatio,
      surconsommationAlerte: isOverconsumption,
      signatureChauffeur,
      signaturePompiste,
      remarques,
      clientId: currentUser?.clientId || currentCiterne?.clientId || currentVehicle?.clientId || (subscriptions.length === 1 ? subscriptions[0].id : undefined),
      entreprise: currentUser?.entreprise || currentCiterne?.entreprise || currentVehicle?.entreprise || (subscriptions.length === 1 ? subscriptions[0].entreprise : undefined)
    };

    onAddDispense(newDispense);
    setIsFormOpen(false);
    setActionFeedback(`Plein enregistré avec succès. Consommation calculée : ${finalRatio.toFixed(2)} ${currentVehicle.uniteMesure === 'km' ? 'L/100km' : 'L/h'}.`);

    // Auto open ticket print preview
    setSelectedDispenseForPrint({
      ...newDispense,
      id: `dsp-${Date.now()}`
    });
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
            <Fuel className="w-5 h-5 text-amber-500" />
            Module 3 : Gestion des Sorties & Pleins Carburant
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Délivrance au pistolet, calcul de consommation unitaire (L/100km ou L/h) et détection des surconsommations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenReports && (
            <button
              onClick={onOpenReports}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 border border-slate-700 shadow transition cursor-pointer"
              title="Consulter les Rapports Sorties Gasoil (Par mois, par engin, par véhicule - Formats CSV, Excel, PDF)"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Consulter les Rapports Sorties</span>
            </button>
          )}

          <button
            onClick={handleOpenForm}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Distribuer Carburant (Nouveau Plein)</span>
          </button>
        </div>
      </div>

      {/* Fuel Dispenses History Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Historique des Distributions ({dispenses.length} pleins)
          </span>
          <span className="text-xs text-slate-500 font-mono-num">
            Total distribué : {dispenses.reduce((acc, d) => acc + d.volumeLivre, 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="p-3.5">N° Ticket / Heure</th>
                <th className="p-3.5">Véhicule & Engin</th>
                <th className="p-3.5">Citerne Source</th>
                <th className="p-3.5">Volume Délivré</th>
                <th className="p-3.5">Delta Compteur</th>
                <th className="p-3.5">Ratio Consommation</th>
                <th className="p-3.5">Intervenants</th>
                <th className="p-3.5 text-right">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {dispenses.map(dsp => {
                const veh = vehicles.find(v => v.id === dsp.vehiculeId);
                const cit = citernes.find(c => c.id === dsp.citerneId);

                return (
                  <tr key={dsp.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <span className="font-mono-num font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {dsp.codeTicket}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono-num mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(dsp.dateHeure).toLocaleString('fr-FR')}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono-num font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-700 shadow-sm text-[11px]">
                          {veh?.immatriculation || 'Sans immat'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono-num bg-slate-800 px-1.5 py-0.5 rounded">
                          {veh?.code || 'N/A'}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-100 flex items-center gap-1">
                        <span className="text-slate-400 text-[11px]">{veh?.marque}</span>
                        <span className="text-white text-xs font-bold">{veh?.modele}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        {veh?.type} • {veh?.departement}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-200">
                        {cit?.code || dsp.citerneId}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {cit?.nom}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono-num font-bold text-sm text-slate-100">
                      {dsp.volumeLivre.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L
                    </td>

                    <td className="p-3.5 font-mono-num text-[11px] text-slate-300">
                      <div>Index: {dsp.compteurActuel.toLocaleString()} {veh?.uniteMesure}</div>
                      <div className="text-slate-500">Préc: {dsp.compteurPrecedent.toLocaleString()} (+{dsp.deltaCompteur})</div>
                    </td>

                    <td className="p-3.5">
                      {dsp.deltaCompteur === 0 || !dsp.ratioConsommation || dsp.ratioConsommation === 0 ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 w-fit">
                            Stationnaire / Direct
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            Sans déplacement (N/A)
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span 
                              className={`font-mono-num font-bold text-sm ${
                                dsp.surconsommationAlerte ? 'text-red-400' : 'text-emerald-400'
                              }`}
                              title={`Formule : (${dsp.volumeLivre} L ÷ ${dsp.deltaCompteur} ${veh?.uniteMesure || 'km'})${veh?.uniteMesure === 'km' ? ' × 100' : ''} = ${dsp.ratioConsommation.toFixed(2)}`}
                            >
                              {dsp.ratioConsommation.toFixed(1)} {veh?.uniteMesure === 'km' ? 'L/100km' : 'L/h'}
                            </span>
                            {dsp.surconsommationAlerte && (
                              <span title="Surconsommation détectée !" className="p-0.5 bg-red-950 text-red-400 rounded">
                                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono-num">
                            Théorique: {veh?.consommationMoyenneTheorique} {veh?.uniteMesure === 'km' ? 'L/100km' : 'L/h'}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 text-[11px] text-slate-400">
                      <div>Chauffeur: <span className="text-slate-200">{dsp.chauffeur}</span></div>
                      <div>Pompiste: <span className="text-slate-300">{dsp.pompiste}</span></div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewSignatures(dsp)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                          title="Consulter les émargements pompiste & chauffeur"
                        >
                          <FileSignature className="w-3.5 h-3.5 text-blue-400" />
                          <span>Signatures</span>
                          {dsp.signaturePompiste && dsp.signatureChauffeur ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" title="2/2 signatures" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-amber-400" title="1/2 signature" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(dsp)}
                          title="Modifier ce ticket et corriger la consommation enregistrée"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Modifier</span>
                        </button>

                        <button
                          onClick={() => setSelectedDispenseForPrint(dsp)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket</span>
                        </button>

                        {onDeleteDispense && (
                          <button
                            type="button"
                            onClick={() => setDispenseToDelete(dsp)}
                            title="Supprimer cette distribution de carburant"
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

      {/* Modal Distribution de Carburant */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-5 shadow-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center gap-2 font-industrial">
                  <Fuel className="w-5 h-5 text-amber-500" />
                  {editingDispense 
                    ? `Correction Ticket ${editingDispense.codeTicket} — Ajustement de Consommation` 
                    : 'Délivrance de Carburant au Pistolet (Plein)'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingDispense 
                    ? 'Ajustez les compteurs, le volume ou le ratio pour corriger la consommation enregistrée' 
                    : 'Calcul en direct de la consommation moyenne et contrôle de cohérence métrologique'}
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
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {/* Saisie & Sélection Véhicule et Citerne */}
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800">
                    <label className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-amber-500" />
                      <span>Saisie Véhicule / Engin Cible *</span>
                    </label>
                    <span className="text-[11px] text-amber-400 font-medium">
                      Affichage automatique de l'immatriculation et du modèle
                    </span>
                  </div>

                  {/* Champ de saisie / filtre rapide par Immatriculation ou Modèle */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Saisissez ou filtrez par Immatriculation (ex: 48291, 77301...) ou Modèle (Hilux, FMX, 336D...)..."
                      value={vehicleSearch}
                      onChange={e => {
                        const val = e.target.value;
                        setVehicleSearch(val);
                        const q = val.toLowerCase().trim();
                        if (q) {
                          const match = vehicles.find(v => 
                            v.immatriculation.toLowerCase().includes(q) || 
                            v.modele.toLowerCase().includes(q) ||
                            v.marque.toLowerCase().includes(q) ||
                            v.code.toLowerCase().includes(q)
                          );
                          if (match && match.id !== selectedVehicleId) {
                            handleVehicleChange(match.id);
                          }
                        }
                      }}
                      className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none transition font-medium"
                    />
                    {vehicleSearch && (
                      <button
                        type="button"
                        onClick={() => setVehicleSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                        title="Effacer la recherche"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Sélection directe dans la liste */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                        Sélectionner dans la liste ({filteredVehicles.length} disponible{filteredVehicles.length > 1 ? 's' : ''})
                      </span>
                      <select
                        value={selectedVehicleId}
                        onChange={e => handleVehicleChange(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg text-slate-100 font-semibold text-xs cursor-pointer focus:outline-none transition"
                      >
                        {filteredVehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            [Immat: {v.immatriculation}] — Modèle: {v.modele} ({v.marque}) • {v.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1 font-medium">
                        Citerne Source / Volucompteur *
                      </span>
                      <select
                        value={citerneId}
                        onChange={e => setCiterneId(e.target.value)}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg text-slate-100 font-semibold text-xs cursor-pointer focus:outline-none transition"
                      >
                        {citernes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.code} - {c.nom} (Dispo: {c.stockActuel.toLocaleString()} L)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* CARTE D'AFFICHAGE OFFICIEL DU VÉHICULE IDENTIFIÉ (IMMATRICULATION & MODÈLE) */}
                  {currentVehicle && (
                    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-xl p-3.5 shadow-lg relative overflow-hidden">
                      {/* En-tête statut */}
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                            Identification Véhicule au Pistolet
                          </span>
                        </div>
                        <span className="text-[10px] font-mono-num px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {currentVehicle.code} • {currentVehicle.type}
                        </span>
                      </div>

                      {/* IMMATRICULATION ET MODÈLE BIEN MIS EN ÉVIDENCE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5">
                        {/* 1. PLAQUE D'IMMATRICULATION */}
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1">
                            <Car className="w-3 h-3 text-amber-400" />
                            <span>Immatriculation :</span>
                          </span>
                          <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border-2 border-slate-600 shadow-inner">
                            <span className="px-1.5 py-0.5 bg-red-700 text-white font-black text-[10px] rounded tracking-wider flex items-center justify-center border border-red-500/50 shadow-sm">
                              MA 🇲🇦
                            </span>
                            <span className="font-mono-num font-extrabold text-base sm:text-lg text-amber-300 tracking-wider">
                              {currentVehicle.immatriculation}
                            </span>
                          </div>
                        </div>

                        {/* 2. MODÈLE DU VÉHICULE */}
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-700">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-amber-400" />
                            <span>Modèle :</span>
                          </span>
                          <div className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700">
                            <div className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-1.5">
                              <span className="text-amber-400">{currentVehicle.marque}</span>
                              <span className="text-white underline decoration-amber-500/50 underline-offset-2">{currentVehicle.modele}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {currentVehicle.departement} • Année {currentVehicle.annee}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Détails Techniques Complémentaires */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                        <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Dernier Index</span>
                          <span className="font-mono-num font-bold text-slate-200 text-xs">
                            {compteurPrecedent.toLocaleString('fr-FR')} {currentVehicle.uniteMesure}
                          </span>
                        </div>
                        <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Réservoir</span>
                          <span className="font-mono-num font-bold text-slate-200 text-xs">
                            {currentVehicle.capaciteReservoir} L
                          </span>
                        </div>
                        <div className="bg-slate-950/70 p-1.5 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Conso Constructeur</span>
                          <span className="font-mono-num font-bold text-amber-400 text-xs">
                            {currentVehicle.consommationMoyenneTheorique} {currentVehicle.uniteMesure === 'km' ? 'L/100km' : 'L/h'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Counters & Volume Delivered */}
              <div className="space-y-3 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold text-amber-400">
                        Volume Carburant Pompé (Litres) *
                      </label>
                      <span className="text-[10px] text-amber-400 font-mono-num bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded">
                        Virgule tolérée • 2 décimales
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        placeholder="Ex: 150,25 ou 120"
                        value={volumeLivreInput}
                        onChange={e => handleVolumeChange(e.target.value)}
                        onBlur={handleVolumeBlur}
                        className="w-full p-2.5 pr-10 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded text-amber-400 font-bold font-mono-num text-base focus:outline-none transition"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                        L
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block font-mono-num">
                      Volume délivré au pistolet
                    </span>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 block font-semibold">
                          Distance / Temps Parcouru (Delta) *
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono-num">
                          Différence calculée
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          disabled={isStationary}
                          value={deltaCompteur}
                          onChange={e => handleDeltaChange(Number(e.target.value))}
                          className="w-full p-2.5 pr-12 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded text-cyan-300 font-bold font-mono-num text-base focus:outline-none transition disabled:opacity-40"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                          {currentVehicle?.uniteMesure || 'km'}
                        </span>
                      </div>
                    </div>
                    
                    <label className="flex items-center gap-2 mt-2 text-[11px] text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isStationary}
                        onChange={e => {
                          setIsStationary(e.target.checked);
                          if (e.target.checked) setDeltaCompteur(0);
                        }}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Plein stationnaire / transfert direct (sans déplacement)</span>
                    </label>
                  </div>
                </div>

                {/* Index Compteurs Précédent et Actuel avec synchronisation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 block font-medium">
                        Index Précédent ({currentVehicle?.uniteMesure || 'km'})
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono-num">
                        Compteur au départ
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={compteurPrecedent}
                      onChange={e => handleCompteurPrecedentChange(Number(e.target.value))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 focus:border-slate-500 rounded text-slate-200 font-mono-num text-sm focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 block font-medium">
                        Index Actuel ({currentVehicle?.uniteMesure || 'km'}) *
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono-num">
                        Relevé au pistolet
                      </span>
                    </div>
                    <input
                      type="number"
                      required={!isStationary}
                      disabled={isStationary}
                      min={compteurPrecedent}
                      value={compteurActuel}
                      onChange={e => handleCompteurActuelChange(Number(e.target.value))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded text-slate-100 font-bold font-mono-num text-sm focus:outline-none transition disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Consumption Preview Banner avec formule explicite */}
              <div className={`p-3.5 rounded-xl border space-y-2 ${
                isOverconsumption 
                  ? 'bg-red-950/70 border-red-500/40 text-red-200' 
                  : isStationary
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <Gauge className={`w-5 h-5 mt-0.5 shrink-0 ${isOverconsumption ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">
                          {isStationary 
                            ? 'Plein Stationnaire (Aucun ratio calculé)'
                            : isOverconsumption 
                            ? 'Alerte : Surconsommation Détectée !' 
                            : 'Consommation Calculée en Direct :'}
                        </span>
                        {isOverconsumption && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-800 text-white font-bold">
                            &gt; +15%
                          </span>
                        )}
                      </div>
                      {!isStationary && (
                        <p className="text-[11px] opacity-90 font-mono-num mt-0.5">
                          {currentVehicle?.uniteMesure === 'km' 
                            ? `Formule : (${volumeLivre} L ÷ ${deltaCompteur} km) × 100 = ${calculatedRatio.toFixed(2)} L/100km`
                            : `Formule : ${volumeLivre} L ÷ ${deltaCompteur} h = ${calculatedRatio.toFixed(2)} L/h`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono-num text-lg font-black block">
                      {isStationary 
                        ? 'N/A (Stationnaire)' 
                        : calculatedRatio > 0 
                        ? `${calculatedRatio.toFixed(2)} ${currentVehicle?.uniteMesure === 'km' ? 'L/100km' : 'L/h'}` 
                        : '--'}
                    </span>
                    <span className="text-[10px] opacity-75 font-mono-num block">
                      Référence usine : {currentVehicle?.consommationMoyenneTheorique} {currentVehicle?.uniteMesure === 'km' ? 'L/100km' : 'L/h'}
                    </span>
                  </div>
                </div>

                {/* Option d'ajustement manuel du ratio en cas de besoin spécifique */}
                <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsManualRatio(!isManualRatio)}
                    className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                  >
                    {isManualRatio ? '← Utiliser le calcul automatique standard' : '✎ Ajuster le ratio de consommation manuellement...'}
                  </button>

                  {isManualRatio && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Ratio manuel :</span>
                      <input
                        type="text"
                        placeholder="Ex: 34.5"
                        value={manualRatioValue}
                        onChange={e => setManualRatioValue(e.target.value)}
                        className="w-20 px-2 py-0.5 bg-slate-900 border border-amber-500/60 rounded text-amber-300 font-mono-num text-xs"
                      />
                      <span className="text-slate-400 font-mono-num">{currentVehicle?.uniteMesure === 'km' ? 'L/100km' : 'L/h'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Drivers & Operators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Chauffeur / Opérateur Engin *</label>
                  <input
                    type="text"
                    required
                    value={chauffeur}
                    onChange={e => setChauffeur(e.target.value)}
                    placeholder="Nom du conducteur..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Pompiste Distributeur *</label>
                  <input
                    type="text"
                    required
                    value={pompiste}
                    onChange={e => setPompiste(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Remarques / Anomalies Éventuelles</label>
                <input
                  type="text"
                  value={remarques}
                  onChange={e => setRemarques(e.target.value)}
                  placeholder="Ex: Utilisation intensives en côte, ralenti prolongé..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded text-slate-100"
                />
              </div>

              {/* Dual Signature Capture : Pompiste Distributeur & Chauffeur */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-industrial">
                    <FileSignature className="w-4 h-4 text-amber-500" />
                    Double Émargement Manuscrit (Pompiste Distributeur & Chauffeur)
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                      signaturePompiste ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {signaturePompiste ? '✓ Pompiste signé' : '○ Pompiste à signer'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                      signatureChauffeur ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {signatureChauffeur ? '✓ Chauffeur signé' : '○ Chauffeur à signer'}
                    </span>
                  </div>
                </div>

                {/* Tabs to select which signatory is currently signing */}
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveSignatoryTab('pompiste')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      activeSignatoryTab === 'pompiste'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>1. Signature Pompiste ({pompiste || 'Pompiste'})</span>
                    {signaturePompiste && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950 stroke-[3]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSignatoryTab('chauffeur')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      activeSignatoryTab === 'chauffeur'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>2. Signature Chauffeur ({chauffeur || 'Chauffeur'})</span>
                    {signatureChauffeur && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950 stroke-[3]" />}
                  </button>
                </div>

                {activeSignatoryTab === 'pompiste' ? (
                  <SignaturePad
                    key="pad-pompiste"
                    signatoryTitle={`Émargement Manuscrit du Pompiste Distributeur : ${pompiste}`}
                    onSave={(signatureData) => {
                      setSignaturePompiste(signatureData);
                      if (!signatureChauffeur) {
                        setTimeout(() => setActiveSignatoryTab('chauffeur'), 400);
                      }
                    }}
                    initialSignature={signaturePompiste}
                  />
                ) : (
                  <SignaturePad
                    key="pad-chauffeur"
                    signatoryTitle={`Émargement Manuscrit du Chauffeur / Destinataire : ${chauffeur}`}
                    onSave={(signatureData) => {
                      setSignatureChauffeur(signatureData);
                    }}
                    initialSignature={signatureChauffeur}
                  />
                )}
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
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
                  {editingDispense ? 'Enregistrer les Corrections du Ticket' : 'Valider Distribution & Générer Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Print Modal */}
      {selectedDispenseForPrint && (
        <PrintReceiptModal
          type="sortie"
          data={selectedDispenseForPrint}
          citernes={citernes}
          vehicles={vehicles}
          currentUser={currentUser}
          subscriptions={subscriptions}
          onClose={() => setSelectedDispenseForPrint(null)}
        />
      )}

      {/* In-App Delete Confirmation Modal */}
      {dispenseToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Supprimer la distribution de carburant"
          message={`Êtes-vous sûr de vouloir supprimer définitivement le ticket ${dispenseToDelete.codeTicket} ?`}
          detail={`Action : Suppression du ticket et restitution de ${dispenseToDelete.volumeLivre.toLocaleString('fr-FR')} Litres dans la citerne source.`}
          confirmLabel="Supprimer Définitivement"
          onConfirm={() => {
            const ticket = dispenseToDelete.codeTicket;
            const vol = dispenseToDelete.volumeLivre;
            if (onDeleteDispense) {
              onDeleteDispense(dispenseToDelete.id, true);
            }
            setDispenseToDelete(null);
            setActionFeedback(`Distribution ${ticket} supprimée avec succès. +${vol.toLocaleString('fr-FR')} L restitués dans la citerne.`);
          }}
          onCancel={() => setDispenseToDelete(null)}
        />
      )}
      {/* Modal Consultation des Signatures (Pompiste & Chauffeur) */}
      {viewSignatures && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-2 font-industrial">
                  <FileSignature className="w-5 h-5 text-amber-500" />
                  Émargements Manuscris : {viewSignatures.codeTicket}
                </h4>
                <p className="text-xs text-slate-400">
                  Distribution de {viewSignatures.volumeLivre.toLocaleString('fr-FR')} L • {new Date(viewSignatures.dateHeure).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewSignatures(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pompiste Signature Card */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Pompiste Distributeur
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono-num">
                    Agent usine
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {viewSignatures.pompiste}
                </div>
                <div className="h-28 bg-white rounded-lg p-2 border border-slate-600 flex items-center justify-center">
                  {viewSignatures.signaturePompiste ? (
                    <img
                      src={viewSignatures.signaturePompiste}
                      alt="Signature Pompiste"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">Signature non renseignée</span>
                  )}
                </div>
              </div>

              {/* Chauffeur Signature Card */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Chauffeur / Opérateur
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono-num">
                    Destinataire
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {viewSignatures.chauffeur}
                </div>
                <div className="h-28 bg-white rounded-lg p-2 border border-slate-600 flex items-center justify-center">
                  {viewSignatures.signatureChauffeur ? (
                    <img
                      src={viewSignatures.signatureChauffeur}
                      alt="Signature Chauffeur"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">Signature non renseignée</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setViewSignatures(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
