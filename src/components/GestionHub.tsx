import React, { useState } from 'react';
import { 
  User, 
  Citerne, 
  Vehicle, 
  Fournisseur, 
  VehicleTypeConfig,
  AppTheme,
  Subscription
} from '../types';
import { UsersModule } from './UsersModule';
import { CiternesModule } from './CiternesModule';
import { VehiclesModule } from './VehiclesModule';
import { FournisseursModule } from './FournisseursModule';
import { VehicleTypesModule } from './VehicleTypesModule';
import { ThemeSelectorModule } from './ThemeSelectorModule';
import { LocalStorageModule } from './LocalStorageModule';
import { CloudBackendModule } from './CloudBackendModule';
import { 
  Settings, 
  Users, 
  UserCheck,
  Layers, 
  SlidersHorizontal, 
  Building2, 
  Truck,
  Palette,
  HardDrive,
  Cloud
} from 'lucide-react';
import { StockEntry, FuelDispense } from '../types';

export type GestionSubTab = 
  | 'utilisateurs' 
  | 'citernes' 
  | 'types_engins' 
  | 'fournisseurs' 
  | 'parc_vehicules'
  | 'themes'
  | 'stockage_local'
  | 'backend_cloud';

interface GestionHubProps {
  initialSubTab?: GestionSubTab;
  currentUser?: User | null;
  subscriptions?: Subscription[];
  // Users
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  // Citernes
  citernes: Citerne[];
  onAddCiterne: (citerne: Omit<Citerne, 'id'>) => void;
  onUpdateCiterne: (citerne: Citerne) => void;
  onDeleteCiterne: (id: string) => void;
  onUpdateCiterneLevel: (citerneId: string, newLevel: number) => void;
  // Vehicle Types
  vehicleTypes: VehicleTypeConfig[];
  onAddVehicleType: (vt: Omit<VehicleTypeConfig, 'id'>) => void;
  onUpdateVehicleType: (vt: VehicleTypeConfig) => void;
  onDeleteVehicleType: (id: string) => void;
  // Fournisseurs
  fournisseurs: Fournisseur[];
  onAddFournisseur: (fournisseur: Omit<Fournisseur, 'id'>) => void;
  onUpdateFournisseur: (fournisseur: Fournisseur) => void;
  onDeleteFournisseur: (id: string) => void;
  // Vehicles
  vehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onImportVehicles: (imported: Vehicle[]) => void;
  // Themes
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  // Local storage management
  storageStats: {
    citernesCount: number;
    vehiclesCount: number;
    entriesCount: number;
    dispensesCount: number;
    usersCount: number;
    fournisseursCount: number;
    vehicleTypesCount: number;
    alertsCount: number;
  };
  onForceSaveLocal: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonData: any) => boolean;
  onResetDemo: () => void;
  onSaveToGasoilProDisk?: () => Promise<{ success: boolean; message: string; path?: string }>;
  onLoadFromGasoilProDisk?: () => Promise<{ success: boolean; message: string }>;
  // Cloud sync
  entries?: StockEntry[];
  dispenses?: FuelDispense[];
  onDataLoadedFromCloud?: (data: {
    citernes: Citerne[];
    vehicles: Vehicle[];
    entries: StockEntry[];
    dispenses: FuelDispense[];
    users: User[];
    subscriptions: Subscription[];
  }) => void;
}

export const GestionHub: React.FC<GestionHubProps> = ({
  initialSubTab = 'utilisateurs',
  currentUser,
  subscriptions = [],
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  citernes,
  onAddCiterne,
  onUpdateCiterne,
  onDeleteCiterne,
  onUpdateCiterneLevel,
  vehicleTypes,
  onAddVehicleType,
  onUpdateVehicleType,
  onDeleteVehicleType,
  fournisseurs,
  onAddFournisseur,
  onUpdateFournisseur,
  onDeleteFournisseur,
  vehicles,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onImportVehicles,
  currentTheme,
  onSelectTheme,
  storageStats,
  onForceSaveLocal,
  onExportBackup,
  onImportBackup,
  onResetDemo,
  onSaveToGasoilProDisk,
  onLoadFromGasoilProDisk,
  entries = [],
  dispenses = [],
  onDataLoadedFromCloud
}) => {
  const [activeSubTab, setActiveSubTab] = useState<GestionSubTab>(initialSubTab);

  React.useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const isSuperAdmin = currentUser?.role === 'Super Administrateur' || currentUser?.login?.toLowerCase() === 'ouaradtech';
  const isClientAdmin = Boolean(
    currentUser?.isClientAdmin ||
    currentUser?.role === 'Administrateur Client' ||
    subscriptions.some(s => 
      (s.clientAdminId && currentUser?.id === s.clientAdminId) ||
      (s.clientAdminLogin && currentUser?.login && currentUser.login.toLowerCase() === s.clientAdminLogin.toLowerCase())
    )
  );
  const isRegularUser = !isSuperAdmin && !isClientAdmin;

  const subTabs = [
    {
      id: 'utilisateurs' as GestionSubTab,
      label: isRegularUser ? 'Mon Profil Personnel' : 'Utilisateurs',
      icon: isRegularUser ? UserCheck : Users,
      count: isRegularUser ? 1 : users.length,
      badgeColor: 'text-purple-400 bg-purple-950/80 border-purple-500/30'
    },
    {
      id: 'citernes' as GestionSubTab,
      label: 'Citernes',
      icon: Layers,
      count: citernes.length,
      badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-500/30'
    },
    {
      id: 'types_engins' as GestionSubTab,
      label: 'Types d’Engins',
      icon: SlidersHorizontal,
      count: vehicleTypes.length,
      badgeColor: 'text-blue-400 bg-blue-950/80 border-blue-500/30'
    },
    {
      id: 'fournisseurs' as GestionSubTab,
      label: 'Fournisseurs',
      icon: Building2,
      count: fournisseurs.length,
      badgeColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30'
    },
    {
      id: 'parc_vehicules' as GestionSubTab,
      label: 'Parc Véhicules',
      icon: Truck,
      count: vehicles.length,
      badgeColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30'
    },
    {
      id: 'themes' as GestionSubTab,
      label: 'Thèmes Graphiques',
      icon: Palette,
      badgeColor: 'text-amber-400 bg-amber-950/80 border-amber-500/30'
    },
    {
      id: 'stockage_local' as GestionSubTab,
      label: 'Stockage Local',
      icon: HardDrive,
      count: 'Actif',
      badgeColor: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30'
    },
    {
      id: 'backend_cloud' as GestionSubTab,
      label: 'Backend Cloud',
      icon: Cloud,
      count: 'En Ligne',
      badgeColor: 'text-sky-400 bg-sky-950/80 border-sky-500/30'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Hub Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Settings className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-industrial tracking-wide">
                Centre de Gestion & Administration du Site
              </h2>
              <p className="text-xs text-slate-400">
                Administration unifiée : Utilisateurs, Citernes, Types d'engins, Fournisseurs, Parc Véhicules, Thèmes et Stockage local
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tab selection pills */}
        <div className="flex flex-wrap gap-2 pt-3">
          {subTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-bold'
                    : 'bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono-num font-bold ${
                  isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-Module */}
      <div className="transition-all duration-200">
        {activeSubTab === 'utilisateurs' && (
          <UsersModule
            users={users}
            currentUser={currentUser ?? null}
            subscriptions={subscriptions}
            onAddUser={onAddUser}
            onUpdateUser={onUpdateUser}
            onDeleteUser={onDeleteUser}
          />
        )}

        {activeSubTab === 'citernes' && (
          <CiternesModule
            citernes={citernes}
            onAddCiterne={onAddCiterne}
            onUpdateCiterne={onUpdateCiterne}
            onDeleteCiterne={onDeleteCiterne}
            onUpdateCiterneLevel={onUpdateCiterneLevel}
          />
        )}

        {activeSubTab === 'types_engins' && (
          <VehicleTypesModule
            vehicleTypes={vehicleTypes}
            onAddVehicleType={onAddVehicleType}
            onUpdateVehicleType={onUpdateVehicleType}
            onDeleteVehicleType={onDeleteVehicleType}
          />
        )}

        {activeSubTab === 'fournisseurs' && (
          <FournisseursModule
            fournisseurs={fournisseurs}
            onAddFournisseur={onAddFournisseur}
            onUpdateFournisseur={onUpdateFournisseur}
            onDeleteFournisseur={onDeleteFournisseur}
          />
        )}

        {activeSubTab === 'parc_vehicules' && (
          <VehiclesModule
            vehicles={vehicles}
            onAddVehicle={onAddVehicle}
            onUpdateVehicle={onUpdateVehicle}
            onDeleteVehicle={onDeleteVehicle}
            onImportVehicles={onImportVehicles}
          />
        )}

        {activeSubTab === 'themes' && (
          <ThemeSelectorModule
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
          />
        )}

        {activeSubTab === 'stockage_local' && (
          <LocalStorageModule
            stats={storageStats}
            onForceSave={onForceSaveLocal}
            onExportBackup={onExportBackup}
            onImportBackup={onImportBackup}
            onResetDemo={onResetDemo}
            onSaveToGasoilProDisk={onSaveToGasoilProDisk}
            onLoadFromGasoilProDisk={onLoadFromGasoilProDisk}
          />
        )}

        {activeSubTab === 'backend_cloud' && (
          <CloudBackendModule
            citernes={citernes}
            vehicles={vehicles}
            entries={entries}
            dispenses={dispenses}
            fournisseurs={fournisseurs}
            vehicleTypes={vehicleTypes}
            users={users}
            subscriptions={subscriptions}
            onDataLoadedFromCloud={onDataLoadedFromCloud}
          />
        )}
      </div>
    </div>
  );
};
