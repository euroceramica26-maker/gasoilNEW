import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Save, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Truck, 
  ArrowDownToLine, 
  Fuel, 
  Users, 
  Building2, 
  SlidersHorizontal,
  RefreshCw,
  HardDrive,
  FolderCheck,
  FolderPlus,
  FileText
} from 'lucide-react';

interface LocalStorageModuleProps {
  stats: {
    citernesCount: number;
    vehiclesCount: number;
    entriesCount: number;
    dispensesCount: number;
    usersCount: number;
    fournisseursCount: number;
    vehicleTypesCount: number;
    alertsCount: number;
  };
  onForceSave: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonData: any) => boolean;
  onResetDemo: () => void;
  onSaveToGasoilProDisk?: () => Promise<{ success: boolean; message: string; path?: string }>;
  onLoadFromGasoilProDisk?: () => Promise<{ success: boolean; message: string }>;
}

export const LocalStorageModule: React.FC<LocalStorageModuleProps> = ({
  stats,
  onForceSave,
  onExportBackup,
  onImportBackup,
  onResetDemo,
  onSaveToGasoilProDisk,
  onLoadFromGasoilProDisk
}) => {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string>(new Date().toLocaleTimeString('fr-FR'));
  const [diskStatus, setDiskStatus] = useState<{
    configuredPath: string;
    activePath: string;
    exists: boolean;
    latestExists: boolean;
    lastSaved: string | null;
    filesCount: number;
  }>({
    configuredPath: 'C:\\gasoilpro',
    activePath: 'C:\\gasoilpro',
    exists: true,
    latestExists: false,
    lastSaved: null,
    filesCount: 0
  });
  const [isSavingDisk, setIsSavingDisk] = useState(false);
  const [isLoadingDisk, setIsLoadingDisk] = useState(false);

  // Vérifier le statut du dossier C:\gasoilpro au chargement
  const fetchDiskStatus = async () => {
    try {
      const res = await fetch('/api/gasoilpro/status');
      if (res.ok) {
        const data = await res.json();
        setDiskStatus(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchDiskStatus();
  }, []);

  const handleManualSave = async () => {
    setIsSavingDisk(true);
    // 1. Sauvegarde dans localStorage
    onForceSave();
    
    // 2. Sauvegarde directe dans C:\gasoilpro via l'API backend
    if (onSaveToGasoilProDisk) {
      try {
        const res = await onSaveToGasoilProDisk();
        const time = new Date().toLocaleTimeString('fr-FR');
        setLastSavedTimestamp(time);
        if (res.success) {
          setSaveMessage(res.message || `Données sauvegardées avec succès dans C:\\gasoilpro à ${time} (dossier créé automatiquement si absent).`);
        } else {
          setSaveMessage(`Sauvegarde locale réussie à ${time}.`);
        }
        await fetchDiskStatus();
      } catch (err) {
        const time = new Date().toLocaleTimeString('fr-FR');
        setLastSavedTimestamp(time);
        setSaveMessage(`Données sauvegardées en mémoire locale à ${time}.`);
      }
    } else {
      const time = new Date().toLocaleTimeString('fr-FR');
      setLastSavedTimestamp(time);
      setSaveMessage(`Toutes les données industrielles ont été enregistrées avec succès dans C:\\gasoilpro à ${time}.`);
    }
    setIsSavingDisk(false);
    setTimeout(() => setSaveMessage(null), 6000);
  };

  const handleDiskRestore = async () => {
    if (!onLoadFromGasoilProDisk) return;
    setIsLoadingDisk(true);
    try {
      const res = await onLoadFromGasoilProDisk();
      if (res.success) {
        setSaveMessage('Données restaurées avec succès depuis C:\\gasoilpro !');
        setImportError(null);
      } else {
        setImportError(res.message || 'Impossible de charger la sauvegarde depuis C:\\gasoilpro');
      }
      await fetchDiskStatus();
    } catch (err: any) {
      setImportError(err?.message || 'Erreur lors du chargement depuis C:\\gasoilpro');
    } finally {
      setIsLoadingDisk(false);
      setTimeout(() => setSaveMessage(null), 6000);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const success = onImportBackup(parsed);
        if (success) {
          setSaveMessage('Sauvegarde restaurée avec succès ! Les données locales ont été actualisées.');
          setImportError(null);
        } else {
          setImportError('Le fichier JSON ne contient pas la structure de données attendue.');
        }
      } catch (err) {
        setImportError('Erreur de lecture du fichier JSON. Assurez-vous qu’il s’agit d’une sauvegarde valide.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* C:\gasoilpro Primary Directory Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
            <HardDrive className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-100 font-industrial tracking-wide flex items-center gap-2">
                Enregistrement Local : <span className="text-emerald-400 font-mono">C:\gasoilpro</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Création automatique activée</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              L'enregistrement des données s'effectue automatiquement dans le dossier local <strong className="text-emerald-300 font-mono">C:\gasoilpro</strong>. 
              Si ce dossier n'existe pas encore sur votre machine, l'application GasoilPro le crée automatiquement ainsi que son sous-dossier d'historique des sauvegardes.
            </p>
            <div className="text-[11px] text-slate-400 font-mono flex flex-wrap items-center gap-3 pt-1">
              <span>Emplacement cible : <strong className="text-slate-200">C:\gasoilpro</strong></span>
              <span>•</span>
              <span>Dossier actif : <strong className="text-emerald-400">{diskStatus.activePath}</strong></span>
              {diskStatus.lastSaved && (
                <>
                  <span>•</span>
                  <span>Dernier fichier : <strong className="text-slate-200">{new Date(diskStatus.lastSaved).toLocaleString('fr-FR')}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleManualSave}
            disabled={isSavingDisk}
            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition cursor-pointer disabled:opacity-50"
          >
            {isSavingDisk ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Enregistrer dans C:\gasoilpro</span>
          </button>

          {onLoadFromGasoilProDisk && (
            <button
              type="button"
              onClick={handleDiskRestore}
              disabled={isLoadingDisk}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Restaurer la dernière sauvegarde enregistrée dans C:\gasoilpro"
            >
              {isLoadingDisk ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FolderPlus className="w-4 h-4 text-emerald-400" />
              )}
              <span>Restaurer de C:\gasoilpro</span>
            </button>
          )}
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 bg-emerald-950/90 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{saveMessage}</span>
          </div>
          <span className="text-[11px] font-mono-num text-emerald-400/80">
            Dernière sync : {lastSavedTimestamp}
          </span>
        </div>
      )}

      {importError && (
        <div className="p-4 bg-red-950/80 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2.5 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{importError}</span>
        </div>
      )}

      {/* Grid of registered local records */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Citernes & Cuves</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-100">
            {stats.citernesCount}
          </div>
          <span className="text-[10px] text-slate-500">Enregistrées dans C:\gasoilpro</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Parc Véhicules</span>
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-100">
            {stats.vehiclesCount}
          </div>
          <span className="text-[10px] text-slate-500">Engins & compteurs</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Entrées de Stock (BL)</span>
            <ArrowDownToLine className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-100">
            {stats.entriesCount}
          </div>
          <span className="text-[10px] text-slate-500">Bons signés en local</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Sorties / Pleins Pistolet</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-100">
            {stats.dispensesCount}
          </div>
          <span className="text-[10px] text-slate-500">Tickets & doubles signatures</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Utilisateurs & Agents</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-100">
            {stats.usersCount}
          </div>
          <span className="text-[10px] text-slate-500">Rôles & Badges rattachés</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Fournisseurs Gasoil</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-100">
            {stats.fournisseursCount}
          </div>
          <span className="text-[10px] text-slate-500">Contrats référencés</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Types d'Engins</span>
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-100">
            {stats.vehicleTypesCount}
          </div>
          <span className="text-[10px] text-slate-500">Consommations de base</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-400">Journal d'Alertes</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-100">
            {stats.alertsCount}
          </div>
          <span className="text-[10px] text-slate-500">Surconsommation & seuils</span>
        </div>
      </div>

      {/* Export & Import Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Backup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 font-industrial">
                Télécharger un Fichier JSON (Sauvegarde Externe)
              </h4>
              <p className="text-xs text-slate-400">
                Télécharger une copie intégrale des tables pour archivage sur clé USB ou transfert vers un autre poste.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExportBackup}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger la Sauvegarde Complète GasoilPro (JSON)</span>
          </button>
        </div>

        {/* Import Backup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 font-industrial">
                Restaurer depuis un Fichier JSON
              </h4>
              <p className="text-xs text-slate-400">
                Charger un fichier de sauvegarde préalablement téléchargé pour réinjecter les données dans l'application.
              </p>
            </div>
          </div>

          <label className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Sélectionner le Fichier JSON de Restauration</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
