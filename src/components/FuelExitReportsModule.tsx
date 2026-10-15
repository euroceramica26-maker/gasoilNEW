import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { FuelDispense, Vehicle, Citerne, User, VehicleTypeConfig } from '../types';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  Truck, 
  Car, 
  Fuel, 
  Scale, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Search, 
  RefreshCw, 
  PieChart, 
  ChevronRight,
  Info,
  X,
  Gauge
} from 'lucide-react';

interface FuelExitReportsModuleProps {
  dispenses: FuelDispense[];
  vehicles: Vehicle[];
  citernes: Citerne[];
  vehicleTypes?: VehicleTypeConfig[];
  currentUser?: User | null;
  onNavigateToDispenses?: () => void;
}

type ReportViewMode = 'mois' | 'engin' | 'vehicule' | 'detail';

export const FuelExitReportsModule: React.FC<FuelExitReportsModuleProps> = ({
  dispenses,
  vehicles,
  citernes,
  vehicleTypes = [],
  currentUser,
  onNavigateToDispenses
}) => {
  const [viewMode, setViewMode] = useState<ReportViewMode>('mois');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedEnginType, setSelectedEnginType] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedCiterneId, setSelectedCiterneId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [exportSuccessToast, setExportSuccessToast] = useState<string | null>(null);

  // Densité moyenne standard pour conversion masse en kg (0.840 kg/L à 15°C)
  const STANDARD_DENSITY = 0.840;

  // Extraire la liste des mois disponibles (YYYY-MM)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    dispenses.forEach(d => {
      const datePart = d.dateHeure || '';
      if (datePart.length >= 7) {
        monthSet.add(datePart.slice(0, 7));
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [dispenses]);

  // Extraire la liste des types d'engins disponibles
  const availableEnginTypes = useMemo(() => {
    const types = new Set<string>();
    vehicles.forEach(v => {
      if (v.type) types.add(v.type);
    });
    vehicleTypes.forEach(vt => {
      if (vt.libelle) types.add(vt.libelle);
    });
    return Array.from(types).sort();
  }, [vehicles, vehicleTypes]);

  // Filtrage des distributions
  const filteredDispenses = useMemo(() => {
    return dispenses.filter(dispense => {
      // Filtre mois
      if (selectedMonth !== 'all') {
        const dMonth = (dispense.dateHeure || '').slice(0, 7);
        if (dMonth !== selectedMonth) return false;
      }

      // Véhicule associé
      const veh = vehicles.find(v => v.id === dispense.vehiculeId);

      // Filtre type d'engin
      if (selectedEnginType !== 'all') {
        if (!veh || veh.type !== selectedEnginType) return false;
      }

      // Filtre véhicule précis
      if (selectedVehicleId !== 'all') {
        if (dispense.vehiculeId !== selectedVehicleId) return false;
      }

      // Filtre citerne
      if (selectedCiterneId !== 'all') {
        if (dispense.citerneId !== selectedCiterneId) return false;
      }

      // Recherche texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ticketMatch = dispense.codeTicket?.toLowerCase().includes(q);
        const immatMatch = veh?.immatriculation?.toLowerCase().includes(q) || veh?.code?.toLowerCase().includes(q);
        const driverMatch = dispense.chauffeur?.toLowerCase().includes(q);
        const pompisteMatch = dispense.pompiste?.toLowerCase().includes(q);
        const typeMatch = veh?.type?.toLowerCase().includes(q);
        if (!ticketMatch && !immatMatch && !driverMatch && !pompisteMatch && !typeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [dispenses, vehicles, selectedMonth, selectedEnginType, selectedVehicleId, selectedCiterneId, searchQuery]);

  // --- KPI GLOBAUX SUR DONNÉES FILTRÉES ---
  const kpis = useMemo(() => {
    const totalLitres = filteredDispenses.reduce((acc, d) => acc + (d.volumeLivre || 0), 0);
    const totalPoidsKg = totalLitres * STANDARD_DENSITY;
    const totalPoidsTonnes = totalPoidsKg / 1000;
    const totalOperations = filteredDispenses.length;

    // Engin le plus consommateur
    const enginVolumes: Record<string, number> = {};
    const vehVolumes: Record<string, { volume: number; immat: string; code: string; type: string }> = {};

    filteredDispenses.forEach(d => {
      const v = vehicles.find(veh => veh.id === d.vehiculeId);
      const eType = v?.type || 'Non spécifié';
      enginVolumes[eType] = (enginVolumes[eType] || 0) + (d.volumeLivre || 0);

      const vId = d.vehiculeId || 'unknown';
      if (!vehVolumes[vId]) {
        vehVolumes[vId] = {
          volume: 0,
          immat: v?.immatriculation || 'Inconnu',
          code: v?.code || '-',
          type: v?.type || '-'
        };
      }
      vehVolumes[vId].volume += d.volumeLivre || 0;
    });

    let topEngin = { name: 'Aucun', volume: 0, percent: 0 };
    Object.entries(enginVolumes).forEach(([name, vol]) => {
      if (vol > topEngin.volume) {
        topEngin = { name, volume: vol, percent: totalLitres > 0 ? (vol / totalLitres) * 100 : 0 };
      }
    });

    let topVehicule = { immat: 'Aucun', code: '', type: '', volume: 0, percent: 0 };
    Object.values(vehVolumes).forEach(item => {
      if (item.volume > topVehicule.volume) {
        topVehicule = {
          immat: item.immat,
          code: item.code,
          type: item.type,
          volume: item.volume,
          percent: totalLitres > 0 ? (item.volume / totalLitres) * 100 : 0
        };
      }
    });

    const activeVehiclesCount = Object.keys(vehVolumes).length;
    const avgVolumePerDispense = totalOperations > 0 ? totalLitres / totalOperations : 0;

    return {
      totalLitres,
      totalPoidsKg,
      totalPoidsTonnes,
      totalOperations,
      topEngin,
      topVehicule,
      activeVehiclesCount,
      avgVolumePerDispense
    };
  }, [filteredDispenses, vehicles]);

  // --- AGRÉGATION 1 : EN FONCTION DES MOIS ---
  const reportByMonth = useMemo(() => {
    const map: Record<string, {
      monthKey: string;
      label: string;
      totalLitres: number;
      totalPoidsKg: number;
      totalPoidsTonnes: number;
      totalOperations: number;
      vehiclesServed: Set<string>;
      topEngin: { name: string; volume: number };
      enginBreakdown: Record<string, number>;
    }> = {};

    filteredDispenses.forEach(d => {
      const monthKey = (d.dateHeure || '').slice(0, 7) || 'Non daté';
      if (!map[monthKey]) {
        let label = monthKey;
        if (monthKey.includes('-')) {
          const [y, m] = monthKey.split('-');
          const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
          const idx = parseInt(m, 10) - 1;
          if (idx >= 0 && idx < 12) {
            label = `${monthNames[idx]} ${y}`;
          }
        }
        map[monthKey] = {
          monthKey,
          label,
          totalLitres: 0,
          totalPoidsKg: 0,
          totalPoidsTonnes: 0,
          totalOperations: 0,
          vehiclesServed: new Set(),
          topEngin: { name: 'Aucun', volume: 0 },
          enginBreakdown: {}
        };
      }

      const item = map[monthKey];
      const vol = d.volumeLivre || 0;
      item.totalLitres += vol;
      item.totalPoidsKg += vol * STANDARD_DENSITY;
      item.totalPoidsTonnes = item.totalPoidsKg / 1000;
      item.totalOperations += 1;
      if (d.vehiculeId) item.vehiclesServed.add(d.vehiculeId);

      const v = vehicles.find(veh => veh.id === d.vehiculeId);
      const eType = v?.type || 'Divers';
      item.enginBreakdown[eType] = (item.enginBreakdown[eType] || 0) + vol;
    });

    return Object.values(map)
      .map(item => {
        let maxE = { name: 'Aucun', volume: 0 };
        Object.entries(item.enginBreakdown).forEach(([name, volume]) => {
          if (volume > maxE.volume) {
            maxE = { name, volume };
          }
        });
        return {
          ...item,
          topEngin: maxE,
          vehiclesCount: item.vehiclesServed.size,
          percentOfTotal: kpis.totalLitres > 0 ? (item.totalLitres / kpis.totalLitres) * 100 : 0
        };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [filteredDispenses, vehicles, kpis.totalLitres]);

  // --- AGRÉGATION 2 : EN FONCTION DES ENGINS ---
  const reportByEngin = useMemo(() => {
    const map: Record<string, {
      type: string;
      totalLitres: number;
      totalPoidsKg: number;
      totalPoidsTonnes: number;
      totalOperations: number;
      vehiclesSet: Set<string>;
      deltaTotal: number;
      uniteMesure: string;
      consoTheoriqueMoyenne: number;
      surconsommationsCount: number;
    }> = {};

    filteredDispenses.forEach(d => {
      const v = vehicles.find(veh => veh.id === d.vehiculeId);
      const eType = v?.type || 'Autre Engin';

      if (!map[eType]) {
        map[eType] = {
          type: eType,
          totalLitres: 0,
          totalPoidsKg: 0,
          totalPoidsTonnes: 0,
          totalOperations: 0,
          vehiclesSet: new Set(),
          deltaTotal: 0,
          uniteMesure: v?.uniteMesure || 'heures',
          consoTheoriqueMoyenne: v?.consommationMoyenneTheorique || 20,
          surconsommationsCount: 0
        };
      }

      const item = map[eType];
      const vol = d.volumeLivre || 0;
      item.totalLitres += vol;
      item.totalPoidsKg += vol * STANDARD_DENSITY;
      item.totalPoidsTonnes = item.totalPoidsKg / 1000;
      item.totalOperations += 1;
      item.deltaTotal += Math.max(0, (d.deltaCompteur || 0));
      if (d.surconsommationAlerte) item.surconsommationsCount += 1;
      if (d.vehiculeId) item.vehiclesSet.add(d.vehiculeId);
    });

    return Object.values(map)
      .map(item => {
        const vehiclesInFleet = vehicles.filter(v => v.type === item.type).length;
        const ratioConsoMoyen = item.deltaTotal > 0 
          ? (item.uniteMesure === 'km' ? (item.totalLitres / item.deltaTotal) * 100 : item.totalLitres / item.deltaTotal)
          : 0;

        return {
          ...item,
          vehiclesCount: item.vehiclesSet.size,
          fleetCount: vehiclesInFleet,
          ratioConsoMoyen,
          percentOfTotal: kpis.totalLitres > 0 ? (item.totalLitres / kpis.totalLitres) * 100 : 0
        };
      })
      .sort((a, b) => b.totalLitres - a.totalLitres);
  }, [filteredDispenses, vehicles, kpis.totalLitres]);

  // --- AGRÉGATION 3 : EN FONCTION DES VÉHICULES ---
  const reportByVehicle = useMemo(() => {
    const map: Record<string, {
      vehicleId: string;
      vehicle: Vehicle | undefined;
      totalLitres: number;
      totalPoidsKg: number;
      totalPoidsTonnes: number;
      totalOperations: number;
      deltaTotal: number;
      minCompteur: number;
      maxCompteur: number;
      surconsommationsCount: number;
      lastDate: string;
    }> = {};

    filteredDispenses.forEach(d => {
      const vId = d.vehiculeId || 'inconnu';
      if (!map[vId]) {
        const v = vehicles.find(veh => veh.id === vId);
        map[vId] = {
          vehicleId: vId,
          vehicle: v,
          totalLitres: 0,
          totalPoidsKg: 0,
          totalPoidsTonnes: 0,
          totalOperations: 0,
          deltaTotal: 0,
          minCompteur: d.compteurPrecedent || d.compteurActuel || 0,
          maxCompteur: d.compteurActuel || 0,
          surconsommationsCount: 0,
          lastDate: d.dateHeure || ''
        };
      }

      const item = map[vId];
      const vol = d.volumeLivre || 0;
      item.totalLitres += vol;
      item.totalPoidsKg += vol * STANDARD_DENSITY;
      item.totalPoidsTonnes = item.totalPoidsKg / 1000;
      item.totalOperations += 1;
      item.deltaTotal += Math.max(0, (d.deltaCompteur || 0));
      if (d.compteurActuel > item.maxCompteur) item.maxCompteur = d.compteurActuel;
      if (d.compteurPrecedent > 0 && d.compteurPrecedent < item.minCompteur) item.minCompteur = d.compteurPrecedent;
      if (d.surconsommationAlerte) item.surconsommationsCount += 1;
      if (d.dateHeure > item.lastDate) item.lastDate = d.dateHeure;
    });

    return Object.values(map)
      .map(item => {
        const v = item.vehicle;
        const unite = v?.uniteMesure || 'km';
        const theorique = v?.consommationMoyenneTheorique || 0;
        const ratioReel = item.deltaTotal > 0
          ? (unite === 'km' ? (item.totalLitres / item.deltaTotal) * 100 : item.totalLitres / item.deltaTotal)
          : (v?.derniereConsoReelle || theorique);

        const ecartPercent = theorique > 0 ? ((ratioReel - theorique) / theorique) * 100 : 0;

        return {
          ...item,
          unite,
          theorique,
          ratioReel,
          ecartPercent,
          percentOfTotal: kpis.totalLitres > 0 ? (item.totalLitres / kpis.totalLitres) * 100 : 0
        };
      })
      .sort((a, b) => b.totalLitres - a.totalLitres);
  }, [filteredDispenses, vehicles, kpis.totalLitres]);

  // --- ACTIONS D'EXPORT ---
  const triggerNotification = (msg: string) => {
    setExportSuccessToast(msg);
    setTimeout(() => setExportSuccessToast(null), 4000);
  };

  // 1. EXPORT CSV
  const handleExportCSV = () => {
    const rows: string[] = [];
    const dateStr = new Date().toISOString().slice(0, 10);

    // En-tête métrologique officiel
    rows.push('# ROYAUME DU MAROC - RAPPORT OFFICIEL DES SORTIES DE GASOIL');
    rows.push(`# Date de génération: ${new Date().toLocaleString('fr-FR')}`);
    rows.push(`# Filtre Mois: ${selectedMonth === 'all' ? 'Tous les mois' : selectedMonth}; Filtre Engin: ${selectedEnginType}; Filtre Véhicule: ${selectedVehicleId}`);
    rows.push(`# Total Volume: ${kpis.totalLitres.toFixed(1)} L; Total Poids: ${kpis.totalPoidsKg.toFixed(1)} kg (${kpis.totalPoidsTonnes.toFixed(3)} Tonnes)`);
    rows.push('');

    if (viewMode === 'mois') {
      rows.push('Mois;Libellé;Volume Distribué (Litres);Poids Net (kg);Poids Net (Tonnes);Nombre Pleins;Véhicules Servis;Engin Prédominant;Part Total (%)');
      reportByMonth.forEach(m => {
        rows.push(`"${m.monthKey}";"${m.label}";${m.totalLitres.toFixed(1)};${m.totalPoidsKg.toFixed(1)};${m.totalPoidsTonnes.toFixed(3)};${m.totalOperations};${m.vehiclesCount};"${m.topEngin.name}";${m.percentOfTotal.toFixed(1)}%`);
      });
    } else if (viewMode === 'engin') {
      rows.push('Type Engin;Nombre Véhicules Parc;Volume Distribué (Litres);Poids Net (kg);Poids Net (Tonnes);Nombre Pleins;Unité;Delta Total;Conso Moyenne Réelle;Conso Théorique;Part Total (%)');
      reportByEngin.forEach(e => {
        rows.push(`"${e.type}";${e.fleetCount};${e.totalLitres.toFixed(1)};${e.totalPoidsKg.toFixed(1)};${e.totalPoidsTonnes.toFixed(3)};${e.totalOperations};"${e.uniteMesure}";${e.deltaTotal};${e.ratioConsoMoyen.toFixed(2)};${e.consoTheoriqueMoyenne.toFixed(2)};${e.percentOfTotal.toFixed(1)}%`);
      });
    } else if (viewMode === 'vehicule') {
      rows.push('Code;Immatriculation;Marque & Modèle;Type Engin;Volume Distribué (Litres);Poids Net (kg);Poids Net (Tonnes);Nombre Pleins;Unité;Delta Compteur;Ratio Réel;Théorique;Écart (%);Part Total (%)');
      reportByVehicle.forEach(v => {
        rows.push(`"${v.vehicle?.code || '-'}";"${v.vehicle?.immatriculation || '-'}";"${v.vehicle?.marque || ''} ${v.vehicle?.modele || ''}";"${v.vehicle?.type || '-'}";${v.totalLitres.toFixed(1)};${v.totalPoidsKg.toFixed(1)};${v.totalPoidsTonnes.toFixed(3)};${v.totalOperations};"${v.unite}";${v.deltaTotal};${v.ratioReel.toFixed(2)};${v.theorique.toFixed(2)};${v.ecartPercent.toFixed(1)}%;${v.percentOfTotal.toFixed(1)}%`);
      });
    } else {
      rows.push('Ticket;Date et Heure;Véhicule;Type Engin;Citerne Source;Volume Livré (L);Poids Net (kg);Compteur Actuel;Delta;Ratio Calculé;Pompiste;Chauffeur');
      filteredDispenses.forEach(d => {
        const v = vehicles.find(veh => veh.id === d.vehiculeId);
        const cit = citernes.find(c => c.id === d.citerneId);
        const pKg = (d.volumeLivre * STANDARD_DENSITY).toFixed(1);
        rows.push(`"${d.codeTicket || '-'}";"${d.dateHeure}";"${v?.immatriculation || d.vehiculeId}";"${v?.type || '-'}";"${cit?.nom || d.citerneId}";${d.volumeLivre};${pKg};${d.compteurActuel};${d.deltaCompteur || 0};${(d.ratioConsommation || 0).toFixed(2)};"${d.pompiste}";"${d.chauffeur}"`);
      });
    }

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_sorties_gasoil_${viewMode}_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerNotification(`Export CSV (${viewMode}) téléchargé avec succès !`);
  };

  // 2. EXPORT EXCEL (.XLSX MULTI-FEUILLES COMPLET)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().slice(0, 10);

    // Feuille 1: Synthèse Mensuelle
    const dataMois = reportByMonth.map(m => ({
      'Mois': m.monthKey,
      'Libellé Mois': m.label,
      'Volume Sortie (Litres)': Number(m.totalLitres.toFixed(1)),
      'Poids Net Gasoil (kg)': Number(m.totalPoidsKg.toFixed(1)),
      'Poids Net Gasoil (Tonnes)': Number(m.totalPoidsTonnes.toFixed(3)),
      'Nombre de Pleins': m.totalOperations,
      'Véhicules Actifs': m.vehiclesCount,
      'Engin Prédominant': m.topEngin.name,
      'Part de la Consommation (%)': Number(m.percentOfTotal.toFixed(1))
    }));
    const wsMois = XLSX.utils.json_to_sheet(dataMois);
    XLSX.utils.book_append_sheet(wb, wsMois, '1_Synthese_Mensuelle');

    // Feuille 2: Par Engin
    const dataEngin = reportByEngin.map(e => ({
      'Type d\'Engin / Équipement': e.type,
      'Nombre d\'Engins au Parc': e.fleetCount,
      'Volume Total Distribué (Litres)': Number(e.totalLitres.toFixed(1)),
      'Masse Nette (kg)': Number(e.totalPoidsKg.toFixed(1)),
      'Masse Nette (Tonnes)': Number(e.totalPoidsTonnes.toFixed(3)),
      'Nombre de Pleins': e.totalOperations,
      'Unité de Mesure': e.uniteMesure,
      'Delta Total (km ou h)': e.deltaTotal,
      'Conso Moyenne Réelle': Number(e.ratioConsoMoyen.toFixed(2)),
      'Conso Théorique Réf': Number(e.consoTheoriqueMoyenne.toFixed(2)),
      'Part Globale (%)': Number(e.percentOfTotal.toFixed(1))
    }));
    const wsEngin = XLSX.utils.json_to_sheet(dataEngin);
    XLSX.utils.book_append_sheet(wb, wsEngin, '2_Consommation_Par_Engin');

    // Feuille 3: Par Véhicule
    const dataVehicule = reportByVehicle.map(v => ({
      'Code Engin': v.vehicle?.code || '-',
      'Immatriculation': v.vehicle?.immatriculation || '-',
      'Marque': v.vehicle?.marque || '',
      'Modèle': v.vehicle?.modele || '',
      'Catégorie': v.vehicle?.type || '-',
      'Volume Carburant (Litres)': Number(v.totalLitres.toFixed(1)),
      'Poids Net (kg)': Number(v.totalPoidsKg.toFixed(1)),
      'Poids Net (Tonnes)': Number(v.totalPoidsTonnes.toFixed(3)),
      'Nombre de Pleins': v.totalOperations,
      'Unité': v.unite,
      'Delta Compteur': v.deltaTotal,
      'Ratio Réel Moyen': Number(v.ratioReel.toFixed(2)),
      'Ratio Théorique': Number(v.theorique.toFixed(2)),
      'Écart (%)': Number(v.ecartPercent.toFixed(1)),
      'Statut': v.ecartPercent > 15 ? 'Surconsommation' : 'Normal',
      'Part (%)': Number(v.percentOfTotal.toFixed(1))
    }));
    const wsVehicule = XLSX.utils.json_to_sheet(dataVehicule);
    XLSX.utils.book_append_sheet(wb, wsVehicule, '3_Consommation_Par_Vehicule');

    // Feuille 4: Journal Détaillé
    const dataDetail = filteredDispenses.map(d => {
      const v = vehicles.find(veh => veh.id === d.vehiculeId);
      const cit = citernes.find(c => c.id === d.citerneId);
      return {
        'Ticket': d.codeTicket || '-',
        'Date & Heure': d.dateHeure,
        'Code Engin': v?.code || '-',
        'Immatriculation': v?.immatriculation || '-',
        'Type Engin': v?.type || '-',
        'Citerne Source': cit?.nom || d.citerneId,
        'Volume Livré (Litres)': d.volumeLivre,
        'Poids Net (kg)': Number((d.volumeLivre * STANDARD_DENSITY).toFixed(1)),
        'Compteur Précédent': d.compteurPrecedent || 0,
        'Compteur Actuel': d.compteurActuel,
        'Delta': d.deltaCompteur || 0,
        'Ratio Conso': Number((d.ratioConsommation || 0).toFixed(2)),
        'Alerte Surconso': d.surconsommationAlerte ? 'OUI' : 'NON',
        'Pompiste': d.pompiste,
        'Chauffeur': d.chauffeur,
        'Observations': d.remarques || ''
      };
    });
    const wsDetail = XLSX.utils.json_to_sheet(dataDetail);
    XLSX.utils.book_append_sheet(wb, wsDetail, '4_Journal_Detail_Sorties');

    // Téléchargement
    XLSX.writeFile(wb, `Rapport_Sorties_Gasoil_${dateStr}.xlsx`);
    triggerNotification('Classeur Excel (.xlsx) généré et téléchargé avec 4 feuilles de calcul !');
  };

  // 3. EXPORT PDF
  const handlePrintPDF = () => {
    window.print();
  };

  const resetFilters = () => {
    setSelectedMonth('all');
    setSelectedEnginType('all');
    setSelectedVehicleId('all');
    setSelectedCiterneId('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedMonth !== 'all' || selectedEnginType !== 'all' || selectedVehicleId !== 'all' || selectedCiterneId !== 'all' || searchQuery !== '';

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {exportSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{exportSuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Rapports & Métrologie Carburant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Rapports des Sorties de Gasoil
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Analyse détaillée des distributions de carburant en fonction des <span className="text-amber-300 font-semibold">engins</span>, des <span className="text-amber-300 font-semibold">véhicules</span> et des <span className="text-amber-300 font-semibold">mois</span> avec calculs métrologiques en litres, kilogrammes et tonnes.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 shadow transition cursor-pointer"
              title="Exporter au format CSV délimité par des points-virgules"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              title="Exporter le classeur complet Excel (.xlsx) avec 4 feuilles de calcul"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition cursor-pointer"
              title="Visualiser et imprimer le rapport officiel en format PDF"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Imprimer / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Litres */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Volume Distribué</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono-num text-white">
            {kpis.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-amber-400">L</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {filteredDispenses.length} opérations enregistrées
          </div>
        </div>

        {/* Poids Net en kg */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Poids Net Gasoil</span>
            <Scale className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono-num text-emerald-400">
            {kpis.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} <span className="text-xs font-normal">kg</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono-num font-semibold">
            ≈ {kpis.totalPoidsTonnes.toFixed(3)} Tonnes
          </div>
        </div>

        {/* Total Opérations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Total Pleins</span>
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono-num text-white">
            {kpis.totalOperations}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Moy. {(kpis.avgVolumePerDispense).toFixed(0)} L / plein
          </div>
        </div>

        {/* Flotte active servie */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Flotte Servie</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono-num text-purple-300">
            {kpis.activeVehiclesCount} <span className="text-xs font-normal text-slate-400">/ {vehicles.length}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Véhicules ravitaillés
          </div>
        </div>

        {/* Top Engin */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Top Engin</span>
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-amber-300 truncate" title={kpis.topEngin.name}>
            {kpis.topEngin.name}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono-num">
            {kpis.topEngin.volume.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} L ({kpis.topEngin.percent.toFixed(0)}%)
          </div>
        </div>

        {/* Top Véhicule */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Top Véhicule</span>
            <Car className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-sm font-bold text-sky-300 truncate" title={kpis.topVehicule.immat}>
            {kpis.topVehicule.immat}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono-num">
            {kpis.topVehicule.volume.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} L ({kpis.topVehicule.percent.toFixed(0)}%)
          </div>
        </div>
      </div>

      {/* Multi-Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Filtres de Sélection & Période</span>
            {hasActiveFilters && (
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-bold">
                Filtre Actif
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Mois */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Mois / Période
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">Tous les mois (Historique complet)</option>
              {availableMonths.map(m => {
                const [y, mm] = m.split('-');
                const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                const idx = parseInt(mm, 10) - 1;
                const label = idx >= 0 && idx < 12 ? `${monthNames[idx]} ${y}` : m;
                return (
                  <option key={m} value={m}>{label}</option>
                );
              })}
            </select>
          </div>

          {/* 2. Type d'Engin */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Type d'Engin
            </label>
            <select
              value={selectedEnginType}
              onChange={(e) => setSelectedEnginType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">Tous les engins & matériels</option>
              {availableEnginTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 3. Véhicule spécifique */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Véhicule / Immatriculation
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">Tous les véhicules ({vehicles.length})</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.immatriculation} - {v.code} ({v.type})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Citerne Source */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Citerne Source
            </label>
            <select
              value={selectedCiterneId}
              onChange={(e) => setSelectedCiterneId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="all">Toutes les citernes ({citernes.length})</option>
              {citernes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.nom}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Recherche Rapide */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Recherche libre
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Immat, chauffeur..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-600 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs View Selector */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setViewMode('mois')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            viewMode === 'mois'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Rapport en Fonction des Mois ({reportByMonth.length})</span>
        </button>

        <button
          onClick={() => setViewMode('engin')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            viewMode === 'engin'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Rapport en Fonction des Engins ({reportByEngin.length})</span>
        </button>

        <button
          onClick={() => setViewMode('vehicule')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            viewMode === 'vehicule'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Rapport en Fonction des Véhicules ({reportByVehicle.length})</span>
        </button>

        <button
          onClick={() => setViewMode('detail')}
          className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
            viewMode === 'detail'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Journal Détaillé des Sorties ({filteredDispenses.length})</span>
        </button>
      </div>

      {/* --- VUE 1 : EN FONCTION DES MOIS --- */}
      {viewMode === 'mois' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Tableau Récapitulatif Mensuel des Sorties de Gasoil
              </span>
              <span className="text-xs text-slate-400 font-mono-num font-semibold">
                Total : {kpis.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L • {kpis.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3">Mois / Période</th>
                    <th className="p-3 text-right">Volume Distribué (L)</th>
                    <th className="p-3 text-right">Poids Net (kg / Tonnes)</th>
                    <th className="p-3 text-center">Nombre Pleins</th>
                    <th className="p-3 text-center">Véhicules Servis</th>
                    <th className="p-3">Engin Prédominant</th>
                    <th className="p-3 text-right">Part du Total</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {reportByMonth.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Aucune distribution de carburant enregistrée pour les critères sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    reportByMonth.map(m => (
                      <tr key={m.monthKey} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>{m.label}</span>
                            <span className="text-[10px] text-slate-500 font-mono-num">({m.monthKey})</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono-num font-bold text-amber-400 text-sm">
                          {m.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L
                        </td>
                        <td className="p-3 text-right font-mono-num text-emerald-400">
                          <div className="font-bold">{m.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg</div>
                          <div className="text-[10px] text-slate-400">≈ {m.totalPoidsTonnes.toFixed(3)} T</div>
                        </td>
                        <td className="p-3 text-center font-mono-num font-semibold">
                          <span className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700">
                            {m.totalOperations}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono-num text-purple-300 font-semibold">
                          {m.vehiclesCount}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded border border-amber-500/20 text-[11px] font-medium">
                            {m.topEngin.name} ({m.topEngin.volume.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} L)
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono-num">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold">{m.percentOfTotal.toFixed(1)}%</span>
                            <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, m.percentOfTotal)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedMonth(m.monthKey);
                              setViewMode('detail');
                            }}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold hover:underline cursor-pointer"
                          >
                            Voir Détails
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {reportByMonth.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-white">
                      <td className="p-3">TOTAL GÉNÉRAL</td>
                      <td className="p-3 text-right font-mono-num text-amber-400 text-sm">
                        {kpis.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L
                      </td>
                      <td className="p-3 text-right font-mono-num text-emerald-400">
                        <div>{kpis.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg</div>
                        <div className="text-[10px] text-slate-400 font-normal">≈ {kpis.totalPoidsTonnes.toFixed(3)} T</div>
                      </td>
                      <td className="p-3 text-center font-mono-num">{kpis.totalOperations}</td>
                      <td className="p-3 text-center font-mono-num text-purple-300">{kpis.activeVehiclesCount}</td>
                      <td className="p-3 text-slate-400">-</td>
                      <td className="p-3 text-right font-mono-num">100.0%</td>
                      <td className="p-3 text-center">-</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- VUE 2 : EN FONCTION DES ENGINS --- */}
      {viewMode === 'engin' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                Tableau de Consommation par Catégorie et Type d'Engin
              </span>
              <span className="text-xs text-slate-400 font-mono-num font-semibold">
                {reportByEngin.length} catégories d'engins analysées
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3">Catégorie / Type Engin</th>
                    <th className="p-3 text-center">Engins au Parc</th>
                    <th className="p-3 text-right">Volume Distribué (L)</th>
                    <th className="p-3 text-right">Poids Net (kg / Tonnes)</th>
                    <th className="p-3 text-center">Pleins</th>
                    <th className="p-3 text-center">Unité</th>
                    <th className="p-3 text-right">Activité (Delta)</th>
                    <th className="p-3 text-right">Conso Réelle</th>
                    <th className="p-3 text-right">Conso Théorique</th>
                    <th className="p-3 text-right">Part Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {reportByEngin.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        Aucune distribution trouvée pour cette catégorie d'engins.
                      </td>
                    </tr>
                  ) : (
                    reportByEngin.map(e => (
                      <tr key={e.type} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            <span>{e.type}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono-num">
                          <span className="px-2 py-0.5 bg-slate-800 rounded font-bold text-slate-300 border border-slate-700">
                            {e.fleetCount}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono-num font-bold text-amber-400 text-sm">
                          {e.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L
                        </td>
                        <td className="p-3 text-right font-mono-num text-emerald-400">
                          <div className="font-bold">{e.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg</div>
                          <div className="text-[10px] text-slate-400">≈ {e.totalPoidsTonnes.toFixed(3)} T</div>
                        </td>
                        <td className="p-3 text-center font-mono-num font-semibold">
                          {e.totalOperations}
                        </td>
                        <td className="p-3 text-center text-[10px] uppercase font-bold text-slate-400">
                          {e.uniteMesure}
                        </td>
                        <td className="p-3 text-right font-mono-num font-semibold text-slate-300">
                          {e.deltaTotal.toLocaleString('fr-FR')} {e.uniteMesure}
                        </td>
                        <td className="p-3 text-right font-mono-num font-bold text-white">
                          {e.ratioConsoMoyen > 0 ? (
                            <span>{e.ratioConsoMoyen.toFixed(1)} {e.uniteMesure === 'km' ? 'L/100km' : 'L/h'}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono-num text-slate-400">
                          {e.consoTheoriqueMoyenne.toFixed(1)} {e.uniteMesure === 'km' ? 'L/100km' : 'L/h'}
                        </td>
                        <td className="p-3 text-right font-mono-num">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold">{e.percentOfTotal.toFixed(1)}%</span>
                            <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, e.percentOfTotal)}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {reportByEngin.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-white">
                      <td className="p-3">TOTAL PAR ENGIN</td>
                      <td className="p-3 text-center font-mono-num">{vehicles.length}</td>
                      <td className="p-3 text-right font-mono-num text-amber-400 text-sm">
                        {kpis.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L
                      </td>
                      <td className="p-3 text-right font-mono-num text-emerald-400">
                        <div>{kpis.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg</div>
                        <div className="text-[10px] text-slate-400 font-normal">≈ {kpis.totalPoidsTonnes.toFixed(3)} T</div>
                      </td>
                      <td className="p-3 text-center font-mono-num">{kpis.totalOperations}</td>
                      <td className="p-3 text-center text-slate-400">-</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                      <td className="p-3 text-right font-mono-num">100.0%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- VUE 3 : EN FONCTION DES VÉHICULES --- */}
      {viewMode === 'vehicule' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-400" />
                Tableau Détaillé de Consommation par Véhicule
              </span>
              <span className="text-xs text-slate-400 font-mono-num font-semibold">
                {reportByVehicle.length} véhicules servis
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3">Code & Immatriculation</th>
                    <th className="p-3">Type & Modèle</th>
                    <th className="p-3 text-right">Volume Livré (L)</th>
                    <th className="p-3 text-right">Poids Net (kg / Tonnes)</th>
                    <th className="p-3 text-center">Pleins</th>
                    <th className="p-3 text-right">Delta Activité</th>
                    <th className="p-3 text-right">Conso Réelle</th>
                    <th className="p-3 text-right">Conso Réf</th>
                    <th className="p-3 text-center">Écart & Statut</th>
                    <th className="p-3 text-right">Part Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {reportByVehicle.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        Aucun véhicule trouvé pour ces critères de filtre.
                      </td>
                    </tr>
                  ) : (
                    reportByVehicle.map(v => (
                      <tr key={v.vehicleId} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-semibold text-white">
                          <div className="font-bold text-amber-400 font-mono-num">
                            {v.vehicle?.immatriculation || v.vehicleId}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono-num">
                            Code: {v.vehicle?.code || '-'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-200">{v.vehicle?.type || 'Non défini'}</div>
                          <div className="text-[10px] text-slate-400">{v.vehicle?.marque} {v.vehicle?.modele}</div>
                        </td>
                        <td className="p-3 text-right font-mono-num font-bold text-amber-400 text-sm">
                          {v.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L
                        </td>
                        <td className="p-3 text-right font-mono-num text-emerald-400">
                          <div className="font-bold">{v.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg</div>
                          <div className="text-[10px] text-slate-400">≈ {v.totalPoidsTonnes.toFixed(3)} T</div>
                        </td>
                        <td className="p-3 text-center font-mono-num">
                          <span className="px-2 py-0.5 bg-slate-800 rounded font-semibold text-slate-300">
                            {v.totalOperations}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono-num text-slate-300 font-semibold">
                          {v.deltaTotal.toLocaleString('fr-FR')} {v.unite}
                        </td>
                        <td className="p-3 text-right font-mono-num font-bold text-white">
                          {v.ratioReel > 0 ? (
                            <span>{v.ratioReel.toFixed(1)} {v.unite === 'km' ? 'L/100km' : 'L/h'}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono-num text-slate-400">
                          {v.theorique.toFixed(1)} {v.unite === 'km' ? 'L/100km' : 'L/h'}
                        </td>
                        <td className="p-3 text-center">
                          {v.ecartPercent > 15 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-950 text-red-300 border border-red-500/40 rounded-full text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              +{v.ecartPercent.toFixed(0)}% Surconso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {v.ecartPercent > 0 ? `+${v.ecartPercent.toFixed(0)}%` : `${v.ecartPercent.toFixed(0)}%`} Conforme
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono-num">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold">{v.percentOfTotal.toFixed(1)}%</span>
                            <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, v.percentOfTotal)}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {reportByVehicle.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-950 font-bold border-t-2 border-slate-700 text-white">
                      <td className="p-3" colSpan={2}>TOTAL VÉHICULES ({reportByVehicle.length})</td>
                      <td className="p-3 text-right font-mono-num text-amber-400 text-sm">
                        {kpis.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L
                      </td>
                      <td className="p-3 text-right font-mono-num text-emerald-400">
                        <div>{kpis.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg</div>
                        <div className="text-[10px] text-slate-400 font-normal">≈ {kpis.totalPoidsTonnes.toFixed(3)} T</div>
                      </td>
                      <td className="p-3 text-center font-mono-num">{kpis.totalOperations}</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                      <td className="p-3 text-center text-slate-400">-</td>
                      <td className="p-3 text-right font-mono-num">100.0%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- VUE 4 : JOURNAL DÉTAILLÉ DES SORTIES --- */}
      {viewMode === 'detail' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Journal des Sorties et Ravitaillements ({filteredDispenses.length} opérations)
              </span>
              <span className="text-xs text-slate-400 font-mono-num font-semibold">
                Volume : {kpis.totalLitres.toLocaleString('fr-FR')} L • {kpis.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3">Ticket & Date</th>
                    <th className="p-3">Véhicule / Engin</th>
                    <th className="p-3">Citerne</th>
                    <th className="p-3 text-right">Volume Livré (L)</th>
                    <th className="p-3 text-right">Poids Net (kg)</th>
                    <th className="p-3 text-right">Compteurs</th>
                    <th className="p-3 text-right">Delta & Ratio</th>
                    <th className="p-3">Intervenants</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {filteredDispenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Aucune transaction de sortie trouvée selon les critères actuels.
                      </td>
                    </tr>
                  ) : (
                    filteredDispenses.map(d => {
                      const veh = vehicles.find(v => v.id === d.vehiculeId);
                      const cit = citernes.find(c => c.id === d.citerneId);
                      const pKg = d.volumeLivre * STANDARD_DENSITY;

                      return (
                        <tr key={d.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3">
                            <div className="font-bold text-amber-400 font-mono-num">{d.codeTicket || 'SORTIE'}</div>
                            <div className="text-[10px] text-slate-400 font-mono-num">{d.dateHeure}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white font-mono-num">{veh?.immatriculation || d.vehiculeId}</div>
                            <div className="text-[10px] text-slate-400">{veh?.type} • {veh?.code}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-slate-200">{cit?.nom || d.citerneId}</div>
                            <div className="text-[10px] text-slate-500">{cit?.code}</div>
                          </td>
                          <td className="p-3 text-right font-mono-num font-bold text-amber-400 text-sm">
                            {d.volumeLivre.toLocaleString('fr-FR')} L
                          </td>
                          <td className="p-3 text-right font-mono-num text-emerald-400 font-bold">
                            {pKg.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kg
                          </td>
                          <td className="p-3 text-right font-mono-num text-[11px]">
                            <div className="text-white font-semibold">{d.compteurActuel.toLocaleString('fr-FR')} {veh?.uniteMesure || 'km'}</div>
                            <div className="text-slate-500 text-[10px]">Préc: {d.compteurPrecedent?.toLocaleString('fr-FR') || '0'}</div>
                          </td>
                          <td className="p-3 text-right font-mono-num">
                            <div className="font-semibold text-slate-200">+{d.deltaCompteur || 0} {veh?.uniteMesure || 'km'}</div>
                            <div className="text-[10px] text-amber-400 font-bold">
                              {(d.ratioConsommation || 0).toFixed(1)} {veh?.uniteMesure === 'km' ? 'L/100km' : 'L/h'}
                            </div>
                          </td>
                          <td className="p-3 text-[11px]">
                            <div className="text-slate-300 font-medium">Chauffeur: <span className="text-white">{d.chauffeur}</span></div>
                            <div className="text-slate-500 text-[10px]">Pompiste: {d.pompiste}</div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL IMPRESSION / EXPORT PDF OFFICIEL --- */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Aperçu du Rapport Officiel Avant Impression / Enregistrement PDF
                </h3>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Document Container (Styled clean white sheet like official Moroccan ministry document) */}
            <div className="p-6 overflow-y-auto bg-white text-slate-900 font-sans print:p-0" id="official-pdf-print-area">
              
              {/* Official Moroccan Header */}
              <div className="border-b-2 border-slate-800 pb-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">
                      🇲🇦 ROYAUME DU MAROC
                    </div>
                    <div className="text-base font-extrabold text-slate-900">
                      GasoilPro MAROC • Supervision & Contrôle Métrologique
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Direction Technique & Gestion des Stocks d'Hydrocarbures
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-600">
                    <div>Date d'émission : <strong>{new Date().toLocaleDateString('fr-FR')}</strong></div>
                    <div>Heure : <strong>{new Date().toLocaleTimeString('fr-FR')}</strong></div>
                    <div>Opérateur : <strong>{currentUser?.nom || 'Admin'} ({currentUser?.role || 'Supervision'})</strong></div>
                  </div>
                </div>

                <div className="mt-3 text-center py-2 bg-slate-100 rounded border border-slate-300">
                  <h1 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    RAPPORT OFFICIEL DES SORTIES ET DISTRIBUTIONS DE GASOIL
                  </h1>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Période : {selectedMonth === 'all' ? 'Toutes les périodes' : selectedMonth} • Type Engin : {selectedEnginType === 'all' ? 'Tous les types' : selectedEnginType} • Citerne : {selectedCiterneId === 'all' ? 'Toutes les citernes' : selectedCiterneId}
                  </p>
                </div>
              </div>

              {/* KPI Summary Block */}
              <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                <div className="p-2 border border-slate-300 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Volume Total Livré</div>
                  <div className="text-base font-black font-mono text-slate-900">
                    {kpis.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L
                  </div>
                </div>
                <div className="p-2 border border-slate-300 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Poids Net Gasoil (Masse)</div>
                  <div className="text-base font-black font-mono text-slate-900">
                    {kpis.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg
                  </div>
                  <div className="text-[9px] text-slate-600">≈ {kpis.totalPoidsTonnes.toFixed(3)} Tonnes</div>
                </div>
                <div className="p-2 border border-slate-300 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Nombre d'Opérations</div>
                  <div className="text-base font-black font-mono text-slate-900">
                    {kpis.totalOperations} Pleins
                  </div>
                </div>
                <div className="p-2 border border-slate-300 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Flotte Active Servie</div>
                  <div className="text-base font-black font-mono text-slate-900">
                    {kpis.activeVehiclesCount} Véhicules
                  </div>
                </div>
              </div>

              {/* Tableau selon le mode actif */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1">
                  {viewMode === 'mois' && '1. Synthèse Mensuelle des Sorties de Carburant'}
                  {viewMode === 'engin' && '1. Ventilation de Consommation par Catégorie d’Engin'}
                  {viewMode === 'vehicule' && '1. Détail de Consommation par Véhicule et Immatriculation'}
                  {viewMode === 'detail' && '1. Journal Détaillé des Bons de Sortie Validés'}
                </h4>

                <table className="w-full text-[10px] border border-slate-300 border-collapse">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 border-b border-slate-300 font-bold uppercase">
                      {viewMode === 'mois' && (
                        <>
                          <th className="p-1.5 border-r border-slate-300 text-left">Période</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Volume (Litres)</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Poids Net (kg)</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Poids Net (Tonnes)</th>
                          <th className="p-1.5 border-r border-slate-300 text-center">Pleins</th>
                          <th className="p-1.5 border-r border-slate-300 text-center">Engins Servis</th>
                          <th className="p-1.5 border-r border-slate-300 text-left">Engin Top Conso</th>
                          <th className="p-1.5 text-right">Part (%)</th>
                        </>
                      )}
                      {viewMode === 'engin' && (
                        <>
                          <th className="p-1.5 border-r border-slate-300 text-left">Type d'Engin</th>
                          <th className="p-1.5 border-r border-slate-300 text-center">Flotte Parc</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Volume (Litres)</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Poids Net (kg)</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Masse (T)</th>
                          <th className="p-1.5 border-r border-slate-300 text-center">Pleins</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Conso Réelle</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Conso Théorique</th>
                          <th className="p-1.5 text-right">Part (%)</th>
                        </>
                      )}
                      {viewMode === 'vehicule' && (
                        <>
                          <th className="p-1.5 border-r border-slate-300 text-left">Immatriculation / Code</th>
                          <th className="p-1.5 border-r border-slate-300 text-left">Type d'Engin</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Volume (Litres)</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Poids (kg)</th>
                          <th className="p-1.5 border-r border-slate-300 text-center">Pleins</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Delta Activité</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Ratio Réel</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Théorique</th>
                          <th className="p-1.5 text-center">Statut</th>
                        </>
                      )}
                      {viewMode === 'detail' && (
                        <>
                          <th className="p-1.5 border-r border-slate-300 text-left">Ticket / Date</th>
                          <th className="p-1.5 border-r border-slate-300 text-left">Véhicule</th>
                          <th className="p-1.5 border-r border-slate-300 text-left">Type Engin</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Volume (L)</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Poids (kg)</th>
                          <th className="p-1.5 border-r border-slate-300 text-right">Compteur</th>
                          <th className="p-1.5 border-r border-slate-300 text-left">Chauffeur</th>
                          <th className="p-1.5 text-left">Pompiste</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {viewMode === 'mois' && reportByMonth.map(m => (
                      <tr key={m.monthKey}>
                        <td className="p-1.5 border-r border-slate-300 font-bold">{m.label}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold">{m.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{m.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{m.totalPoidsTonnes.toFixed(3)} T</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono">{m.totalOperations}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono">{m.vehiclesCount}</td>
                        <td className="p-1.5 border-r border-slate-300">{m.topEngin.name}</td>
                        <td className="p-1.5 text-right font-mono font-bold">{m.percentOfTotal.toFixed(1)}%</td>
                      </tr>
                    ))}

                    {viewMode === 'engin' && reportByEngin.map(e => (
                      <tr key={e.type}>
                        <td className="p-1.5 border-r border-slate-300 font-bold">{e.type}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono">{e.fleetCount}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold">{e.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{e.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{e.totalPoidsTonnes.toFixed(3)} T</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono">{e.totalOperations}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{e.ratioConsoMoyen.toFixed(1)} {e.uniteMesure === 'km' ? 'L/100km' : 'L/h'}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{e.consoTheoriqueMoyenne.toFixed(1)}</td>
                        <td className="p-1.5 text-right font-mono font-bold">{e.percentOfTotal.toFixed(1)}%</td>
                      </tr>
                    ))}

                    {viewMode === 'vehicule' && reportByVehicle.slice(0, 25).map(v => (
                      <tr key={v.vehicleId}>
                        <td className="p-1.5 border-r border-slate-300 font-bold">{v.vehicle?.immatriculation || v.vehicleId} ({v.vehicle?.code})</td>
                        <td className="p-1.5 border-r border-slate-300">{v.vehicle?.type}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold">{v.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{v.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono">{v.totalOperations}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{v.deltaTotal} {v.unite}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{v.ratioReel.toFixed(1)}</td>
                        <td className="p-1.5 border-r border-slate-300 text-right font-mono">{v.theorique.toFixed(1)}</td>
                        <td className="p-1.5 text-center font-semibold">{v.ecartPercent > 15 ? 'SURCONSO' : 'CONFORME'}</td>
                      </tr>
                    ))}

                    {viewMode === 'detail' && filteredDispenses.slice(0, 30).map(d => {
                      const veh = vehicles.find(v => v.id === d.vehiculeId);
                      return (
                        <tr key={d.id}>
                          <td className="p-1.5 border-r border-slate-300 font-mono font-bold">{d.codeTicket} ({d.dateHeure.slice(0, 10)})</td>
                          <td className="p-1.5 border-r border-slate-300 font-bold">{veh?.immatriculation || d.vehiculeId}</td>
                          <td className="p-1.5 border-r border-slate-300">{veh?.type}</td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold">{d.volumeLivre} L</td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono">{(d.volumeLivre * STANDARD_DENSITY).toFixed(1)} kg</td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono">{d.compteurActuel}</td>
                          <td className="p-1.5 border-r border-slate-300">{d.chauffeur}</td>
                          <td className="p-1.5">{d.pompiste}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-bold border-t-2 border-slate-400">
                      <td className="p-1.5 border-r border-slate-300" colSpan={viewMode === 'vehicule' ? 2 : 1}>TOTAL GLOBAL</td>
                      {viewMode === 'engin' && <td className="p-1.5 border-r border-slate-300 text-center">{vehicles.length}</td>}
                      <td className="p-1.5 border-r border-slate-300 text-right font-mono text-xs">{kpis.totalLitres.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} L</td>
                      <td className="p-1.5 border-r border-slate-300 text-right font-mono text-xs">{kpis.totalPoidsKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} kg</td>
                      {viewMode === 'mois' && <td className="p-1.5 border-r border-slate-300 text-right font-mono">{kpis.totalPoidsTonnes.toFixed(3)} T</td>}
                      {viewMode === 'engin' && <td className="p-1.5 border-r border-slate-300 text-right font-mono">{kpis.totalPoidsTonnes.toFixed(3)} T</td>}
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono">{kpis.totalOperations}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center" colSpan={3}>-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Visas réglementaires et Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-slate-400 text-center text-[10px]">
                <div className="border border-slate-300 rounded p-3 h-24 flex flex-col justify-between">
                  <div className="font-bold uppercase text-slate-700">Visa Chef de Dépôt / Pompiste</div>
                  <div className="text-[9px] text-slate-400">Signature & Tampon Dépôt</div>
                </div>

                <div className="border border-slate-300 rounded p-3 h-24 flex flex-col justify-between">
                  <div className="font-bold uppercase text-slate-700">Visa Responsable Parc & Matériel</div>
                  <div className="text-[9px] text-slate-400">Contrôle Métrologique & Ratios</div>
                </div>

                <div className="border border-slate-300 rounded p-3 h-24 flex flex-col justify-between">
                  <div className="font-bold uppercase text-slate-700">Visa Direction Technique & Générale</div>
                  <div className="text-[9px] text-slate-400">Approbation & Archivage Légal</div>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 mt-4">
                Document certifié conforme aux normes métrologiques en vigueur • Système de gestion GasoilPro MAROC
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Imprimez directement vers une imprimante ou sélectionnez <strong>"Enregistrer au format PDF"</strong>.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer / Télécharger PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
