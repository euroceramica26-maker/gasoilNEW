import React, { useState } from 'react';
import { Citerne, Vehicle, StockEntry, FuelDispense, ConsumptionAlert } from '../types';
import { CiterneGraphic } from './CiterneGraphic';
import { 
  Fuel, 
  ArrowDownToLine, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Truck, 
  Gauge, 
  Droplets,
  Layers,
  Activity,
  Zap,
  Users,
  KeyRound,
  Phone,
  Clock
} from 'lucide-react';

interface DashboardProps {
  citernes: Citerne[];
  vehicles: Vehicle[];
  entries: StockEntry[];
  dispenses: FuelDispense[];
  alerts: ConsumptionAlert[];
  onUpdateCiterneLevel: (citerneId: string, newLevel: number) => void;
  onNavigateTab: (
    tab: 'dashboard' | 'entries' | 'dispenses' | 'utilisateurs' | 'gestion' | 'controle_total' | 'architecture',
    subTab?: 'utilisateurs' | 'citernes' | 'types_engins' | 'fournisseurs' | 'parc_vehicules'
  ) => void;
  licenseWarning?: {
    daysRemaining: number;
    dateExpiration: string;
    entreprise: string;
  } | null;
  onOpenRenewalModal?: () => void;
  isSuperAdmin?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  citernes,
  vehicles,
  entries,
  dispenses,
  alerts,
  onUpdateCiterneLevel,
  onNavigateTab,
  licenseWarning,
  onOpenRenewalModal,
  isSuperAdmin = false
}) => {
  const [selectedCiterneId, setSelectedCiterneId] = useState<string>(citernes[0]?.id || '');

  // Plant Global Aggregations
  const totalStock = citernes.reduce((acc, c) => acc + c.stockActuel, 0);
  const totalCapacity = citernes.reduce((acc, c) => acc + c.capaciteTotale, 0);
  const globalPercentage = totalCapacity > 0 ? (totalStock / totalCapacity) * 100 : 0;
  
  // Date locale du jour (format YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);

  // Distributions enregistrées aujourd'hui vs total cumulé
  const totalDispensedToday = dispenses
    .filter(d => d.dateHeure && d.dateHeure.slice(0, 10) === todayStr)
    .reduce((acc, d) => acc + d.volumeLivre, 0);
  const dispensesTodayCount = dispenses
    .filter(d => d.dateHeure && d.dateHeure.slice(0, 10) === todayStr).length;

  const totalDispensedAllTime = dispenses.reduce((acc, d) => acc + d.volumeLivre, 0);
  const totalDelivered = entries.reduce((acc, e) => acc + e.quantiteLivree, 0);

  // Consommation moyenne réelle enregistrée pour la flotte (L/100km et L/h)
  const kmDispenses = dispenses.filter(d => {
    const v = vehicles.find(veh => veh.id === d.vehiculeId);
    return (!v || v.uniteMesure === 'km') && (d.deltaCompteur || 0) > 0;
  });
  const totalKmLitres = kmDispenses.reduce((acc, d) => acc + d.volumeLivre, 0);
  const totalKmDelta = kmDispenses.reduce((acc, d) => acc + (d.deltaCompteur || 0), 0);
  const fleetAverageConsoKm = totalKmDelta > 0 ? (totalKmLitres / totalKmDelta) * 100 : 0;

  const hDispenses = dispenses.filter(d => {
    const v = vehicles.find(veh => veh.id === d.vehiculeId);
    return v?.uniteMesure === 'heures' && (d.deltaCompteur || 0) > 0;
  });
  const totalHLitres = hDispenses.reduce((acc, d) => acc + d.volumeLivre, 0);
  const totalHDelta = hDispenses.reduce((acc, d) => acc + (d.deltaCompteur || 0), 0);
  const fleetAverageConsoH = totalHDelta > 0 ? totalHLitres / totalHDelta : 0;

  const activeVehiclesCount = vehicles.filter(v => v.status === 'Actif').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'En Maintenance').length;

  const criticalTanks = citernes.filter(c => c.stockActuel <= c.seuilCritique);
  const warningTanks = citernes.filter(c => c.stockActuel <= c.seuilAlerteBas && c.stockActuel > c.seuilCritique);

  return (
    <div className="space-y-6">
      {/* Bannière Super Admin : Cloisonnement & Confidentialité Multi-Tenant */}
      {isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-300 text-sm font-industrial tracking-wide">
                  MODE SUPER ADMINISTRATEUR OUARADTECH — CLOISONNEMENT MULTI-TENANT ACTIF
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Toutes les données opérationnelles des clients (citernes, véhicules, approvisionnements, sorties volucompteurs, habilitations et comptes utilisateurs) sont <strong>strictement isolées et invisibles au Super Admin</strong> conformément à la règle de confidentialité.
              </p>
            </div>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('controle_total')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shrink-0 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <span>Accéder au Contrôle Total & Abonnements</span>
            </button>
          )}
        </div>
      )}
      {/* Avertissement de Renouvellement de Licence (1 mois avant échéance <= 30 jours) */}
      {licenseWarning && licenseWarning.daysRemaining <= 30 && licenseWarning.daysRemaining > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/80 via-orange-950/70 to-slate-900 border-2 border-amber-500/60 shadow-xl shadow-amber-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5 sm:mt-0 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-amber-300 text-sm font-industrial tracking-wide">
                  AVIS DE RENOUVELLEMENT DE LICENCE REQUIS
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] font-mono-num font-bold text-amber-300">
                  {licenseWarning.daysRemaining} jour{licenseWarning.daysRemaining > 1 ? 's' : ''} restant{licenseWarning.daysRemaining > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                Votre abonnement d'exploitation pour <strong>{licenseWarning.entreprise}</strong> arrive à échéance le <strong className="text-amber-300 font-mono-num">{licenseWarning.dateExpiration}</strong>. 
                <span className="text-amber-200/90 ml-1">
                  À l'arrivée de cette échéance, l'application s'arrêtera automatiquement de fonctionner. Veuillez renouveler votre licence auprès d'OuaradTech.
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <a
              href="tel:+212661002626"
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">+212 6 61 00 26 26</span>
              <span className="md:hidden">Appeler</span>
            </a>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('gasoilpro:test-10am-warning'))}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Tester immédiatement l'avertissement automatique quotidien de 10h00 (durée 5 minutes)"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Alerte 10h00 (5 min)</span>
            </button>

            {onOpenRenewalModal && (
              <button
                type="button"
                onClick={onOpenRenewalModal}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Renouveler ma Licence</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Plant KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Stock */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Stock Global Gasoil
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num font-bold text-2xl text-slate-100">
              {totalStock.toLocaleString('fr-FR')}
            </span>
            <span className="text-xs font-semibold text-amber-400">Litres</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Remplissage global:</span>
            <span className="font-mono-num font-semibold text-slate-200">{globalPercentage.toFixed(1)}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${globalPercentage}%` }}
            />
          </div>
        </div>

        {/* Total Fuel Dispensed & Consumption */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Consommation & Sorties Carburant
              </span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Fuel className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono-num font-bold text-2xl text-slate-100">
                {totalDispensedAllTime.toLocaleString('fr-FR')}
              </span>
              <span className="text-xs font-semibold text-blue-400">Litres Délivrés</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">Aujourd'hui ({todayStr}) :</span>
              <span className="font-mono-num font-bold text-amber-300">
                {totalDispensedToday.toLocaleString('fr-FR')} L ({dispensesTodayCount} ticket{dispensesTodayCount > 1 ? 's' : ''})
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Conso Moyenne Flotte :</span>
              <span className="font-mono-num font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px]">
                {fleetAverageConsoKm > 0 && fleetAverageConsoH > 0
                  ? `${fleetAverageConsoKm.toFixed(1)} L/100km • ${fleetAverageConsoH.toFixed(1)} L/h`
                  : fleetAverageConsoKm > 0
                  ? `${fleetAverageConsoKm.toFixed(1)} L/100km`
                  : fleetAverageConsoH > 0
                  ? `${fleetAverageConsoH.toFixed(1)} L/h`
                  : '--'}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>Total historique : {dispenses.length} tickets validés</span>
            </div>
          </div>
        </div>

        {/* Deliveries Received */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Réceptions de Stock
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num font-bold text-2xl text-slate-100">
              {totalDelivered.toLocaleString('fr-FR')}
            </span>
            <span className="text-xs font-semibold text-emerald-400">Litres</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Bons de livraison signés:</span>
            <span className="font-mono-num font-semibold text-slate-200">{entries.length} BL</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        {/* Fleet Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Parc Véhicules & Engins
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono-num font-bold text-2xl text-slate-100">
              {activeVehiclesCount} <span className="text-sm font-normal text-slate-400">/ {vehicles.length}</span>
            </span>
            <span className="text-xs font-semibold text-emerald-400">Opérationnels</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>En révision / atelier:</span>
            <span className="font-mono-num font-semibold text-amber-400">{maintenanceCount} engins</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full" 
              style={{ width: `${(activeVehiclesCount / vehicles.length) * 100}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Realistic Cistern Graphical Overview Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-industrial">
              <Layers className="w-5 h-5 text-amber-500" />
              Module 5 : Représentation Graphique Réaliste des Citernes en Temps Réel
            </h2>
            <p className="text-xs text-slate-400">
              Sondes magnétostrictives, jaugeage volumétrique, vagues animées et détection de seuils critiques
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Télémesure Active (Échantillonnage 1s)
            </span>
          </div>
        </div>

        {/* 3 Industrial Tanks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {citernes.map(citerne => (
            <CiterneGraphic
              key={citerne.id}
              citerne={citerne}
              isSelected={selectedCiterneId === citerne.id}
              onSelect={() => setSelectedCiterneId(citerne.id)}
              onSimulateLevelChange={(newVal) => onUpdateCiterneLevel(citerne.id, newVal)}
            />
          ))}
        </div>
      </div>

      {/* Industrial Alerts & Recent Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Alerts & Critical Warnings Panel (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-200 text-sm">
                Centre de Contrôle & Alertes Automatisées
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono-num">
              {alerts.length} événements
            </span>
          </div>

          <div className="space-y-2.5">
            {alerts.map(alt => (
              <div 
                key={alt.id}
                className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition ${
                  alt.gravite === 'danger' 
                    ? 'bg-red-950/40 border-red-500/40 text-red-200' 
                    : alt.gravite === 'warning'
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {alt.gravite === 'danger' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                  ) : alt.gravite === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{alt.titre}</span>
                    <span className="text-[10px] text-slate-400 font-mono-num">{alt.date}</span>
                  </div>
                  <p className="mt-0.5 text-slate-300 leading-relaxed">{alt.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Shortcuts to Modules */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <button
              onClick={() => onNavigateTab('gestion', 'citernes')}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Gérer Citernes</span>
            </button>
            <button
              onClick={() => onNavigateTab('gestion', 'parc_vehicules')}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Parc Véhicules</span>
            </button>
            <button
              onClick={() => onNavigateTab('entries')}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
              <span>Entrées / Dépotages</span>
            </button>
            <button
              onClick={() => onNavigateTab('dispenses')}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              <span>Sorties / Pleins</span>
            </button>
            <button
              onClick={() => onNavigateTab('utilisateurs')}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer col-span-2 sm:col-span-1"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Utilisateurs & Opérateurs</span>
            </button>
          </div>
        </div>

        {/* Operational Feed & Tank Safety Guidelines */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-slate-200 text-sm">
                Règles de Sécurité Dépôt
              </h3>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-0.5">1. Contrôle des Scellés :</span>
              <p className="text-slate-400 text-[11px]">
                Tout camion-citerne arrivant doit être vérifié avant dépotage (intégrité des plombs et test pâte à eau de fond de cuve).
              </p>
            </div>

            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-blue-400 block mb-0.5">2. Étalonnage Métrologique :</span>
              <p className="text-slate-400 text-[11px]">
                Volucompteurs certifiés trimestriellement. Écart toléré &lt; 0.2% par rapport à la fiole jaugée 200L.
              </p>
            </div>

            <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-0.5">3. Signature Électronique :</span>
              <p className="text-slate-400 text-[11px]">
                Chaque livraison et sortie de gasoil fait l'objet d'un émargement numérique horodaté conservé dans la base pour audit.
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="pt-2">
              <button
                onClick={() => onNavigateTab('architecture')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <span>Consulter l'Architecture Technique & DDL</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
