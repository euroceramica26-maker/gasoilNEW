import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  Database, 
  RefreshCw, 
  Server, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Layers, 
  Truck, 
  FileText, 
  Fuel, 
  Users, 
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { 
  Citerne, 
  Vehicle, 
  StockEntry, 
  FuelDispense, 
  Fournisseur, 
  VehicleTypeConfig, 
  User, 
  Subscription 
} from '../types';
import { firestoreService } from '../lib/firestoreService';
import { testConnection } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

interface CloudBackendModuleProps {
  citernes: Citerne[];
  vehicles: Vehicle[];
  entries: StockEntry[];
  dispenses: FuelDispense[];
  fournisseurs: Fournisseur[];
  vehicleTypes: VehicleTypeConfig[];
  users: User[];
  subscriptions: Subscription[];
  onDataLoadedFromCloud?: (data: {
    citernes: Citerne[];
    vehicles: Vehicle[];
    entries: StockEntry[];
    dispenses: FuelDispense[];
    users: User[];
    subscriptions: Subscription[];
  }) => void;
}

export function CloudBackendModule({
  citernes,
  vehicles,
  entries,
  dispenses,
  fournisseurs,
  vehicleTypes,
  users,
  subscriptions,
  onDataLoadedFromCloud
}: CloudBackendModuleProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('hg_last_cloud_sync') || null;
  });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Test de connexion au chargement
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsConnected(null);
    try {
      const ok = await testConnection();
      setIsConnected(ok);
    } catch {
      setIsConnected(false);
    }
  };

  const handlePushToCloud = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const res = await firestoreService.pushAllToCloud({
        citernes,
        vehicles,
        entries,
        dispenses,
        fournisseurs,
        vehicleTypes,
        users,
        subscriptions
      });

      if (res.success) {
        const now = new Date().toLocaleString('fr-FR');
        setLastSyncTime(now);
        localStorage.setItem('hg_last_cloud_sync', now);
        setIsConnected(true);
        setStatusMessage({
          type: 'success',
          text: 'Toutes les données ont été sauvegardées et synchronisées dans le Cloud Firestore avec succès.'
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `Erreur de synchronisation: ${res.error || 'Veuillez vérifier les permissions'}`
        });
      }
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: `Erreur: ${e?.message || 'Échec de la connexion'}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!window.confirm('Voulez-vous restaurer les données depuis le Cloud ? Les données locales seront synchronisées avec la base distante.')) {
      return;
    }

    setIsPulling(true);
    setStatusMessage(null);
    try {
      const cloudData = await firestoreService.pullAllFromCloud();
      if (onDataLoadedFromCloud) {
        onDataLoadedFromCloud(cloudData);
      }
      setIsConnected(true);
      setStatusMessage({
        type: 'success',
        text: 'Données récupérées avec succès depuis le backend Cloud Firestore !'
      });
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: `Erreur lors de la récupération: ${e?.message || 'Échec'}`
      });
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-sky-500/20 rounded-xl border border-amber-500/30 text-amber-400">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Backend Cloud & Base de Données
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Opérationnel
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Synchronisation temps-réel, persistance haute-disponibilité et sécurisation ABAC
            </p>
          </div>
        </div>

        <button
          onClick={checkConnection}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isConnected === null ? 'animate-spin' : ''}`} />
          Vérifier la connexion
        </button>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Database Connection Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>STATUT CLOUD</span>
            <Server className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : isConnected === false ? 'bg-amber-500' : 'bg-slate-600'}`} />
            <span className="text-base font-bold text-slate-100">
              {isConnected ? 'Connecté & Prêt' : isConnected === false ? 'Prêt (Mode Hors-Ligne)' : 'Vérification...'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Région Europe / Multi-Zones sécurisées
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>PROJET & INSTANCE</span>
            <Cloud className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-200 truncate">
            {firebaseConfig.projectId}
          </p>
          <p className="text-xs text-slate-400 mt-1 truncate">
            DB: {firebaseConfig.firestoreDatabaseId}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>DERNIÈRE SYNCHRONISATION</span>
            <ShieldCheck className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-sm font-semibold text-slate-200">
            {lastSyncTime || 'Non synchronisé récemment'}
          </p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Règles Firestore déployées
          </p>
        </div>
      </div>

      {/* Sync Actions */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-amber-400" />
          Actions de Synchronisation Cloud
        </h3>
        <p className="text-sm text-slate-400">
          Enregistrez les données locales vers le cluster cloud, ou récupérez l'état centralisé pour restaurer vos dépôts et véhicules.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            onClick={handlePushToCloud}
            disabled={isSyncing}
            className="flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <ArrowUpCircle className={`w-5 h-5 ${isSyncing ? 'animate-bounce' : ''}`} />
            {isSyncing ? 'Synchronisation Cloud en cours...' : 'Envoyer tout vers le Cloud (Push)'}
          </button>

          <button
            onClick={handlePullFromCloud}
            disabled={isPulling}
            className="flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition disabled:opacity-50"
          >
            <ArrowDownCircle className={`w-5 h-5 ${isPulling ? 'animate-spin' : ''}`} />
            {isPulling ? 'Téléchargement...' : 'Récupérer depuis le Cloud (Pull)'}
          </button>
        </div>
      </div>

      {/* Inventory & Entities in Database */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-400" />
          Collections & Entités Synchronisées
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
            <Layers className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{citernes.length}</p>
            <p className="text-xs text-slate-400">Citernes</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
            <Truck className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{vehicles.length}</p>
            <p className="text-xs text-slate-400">Véhicules</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
            <FileText className="w-5 h-5 text-sky-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{entries.length}</p>
            <p className="text-xs text-slate-400">Bons Entrée</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
            <Fuel className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{dispenses.length}</p>
            <p className="text-xs text-slate-400">Distributions</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
            <Users className="w-5 h-5 text-rose-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{users.length}</p>
            <p className="text-xs text-slate-400">Utilisateurs</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
            <KeyRound className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-slate-100">{subscriptions.length}</p>
            <p className="text-xs text-slate-400">Licences</p>
          </div>
        </div>
      </div>
    </div>
  );
}
