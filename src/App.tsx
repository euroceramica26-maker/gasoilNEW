import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Citerne, 
  Vehicle, 
  StockEntry, 
  FuelDispense, 
  ConsumptionAlert,
  User,
  Fournisseur,
  VehicleTypeConfig,
  AppTheme,
  Subscription,
  SecurityConfig,
  AuditLog,
  UserMenuPermissions,
  UserOptionPermissions
} from './types';
import { 
  SUPER_ADMIN_USER, 
  ensureUserPermissions, 
  getDefaultPermissionsForRole,
  deduplicateUsers 
} from './lib/userPermissions';
import { 
  INITIAL_CITERNES, 
  INITIAL_VEHICLES, 
  INITIAL_STOCK_ENTRIES, 
  INITIAL_DISPENSES, 
  INITIAL_ALERTS,
  INITIAL_USERS,
  INITIAL_FOURNISSEURS,
  INITIAL_VEHICLE_TYPES,
  AVAILABLE_THEMES
} from './mockData';
import { 
  INITIAL_SUBSCRIPTIONS, 
  INITIAL_SECURITY_CONFIG, 
  INITIAL_AUDIT_LOGS, 
  getDaysRemaining 
} from './lib/licenseUtils';
import { Dashboard } from './components/Dashboard';
import { GestionHub, GestionSubTab } from './components/GestionHub';
import { UsersModule } from './components/UsersModule';
import { StockEntriesModule } from './components/StockEntriesModule';
import { FuelDispensesModule } from './components/FuelDispensesModule';
import { FuelExitReportsModule } from './components/FuelExitReportsModule';
import { ArchitectureModal } from './components/ArchitectureModal';
import { ConfirmModal } from './components/ConfirmModal';
import { LoginScreen } from './components/LoginScreen';
import { MasterControlModule } from './components/MasterControlModule';
import { LicenseActivationModal } from './components/LicenseActivationModal';
import { 
  ClientLicenseActivationScreen, 
  ClientLicenseExpiredScreen, 
  ClientLicenseWarningBanner, 
  ClientLicenseRenewalModal 
} from './components/ClientLicenseGate';
import { DailyLicenseWarningModal } from './components/DailyLicenseWarningModal';
import { getPlanDurationDays, validateLicenseKeyFormat } from './lib/licenseUtils';
import { testConnection } from './lib/firebase';
import { 
  Gauge, 
  Layers, 
  Truck, 
  ArrowDownToLine, 
  Fuel, 
  Users, 
  FileText, 
  BarChart3, 
  RefreshCw, 
  Clock, 
  Menu, 
  X,
  Settings,
  ChevronDown,
  SlidersHorizontal,
  Building2,
  Palette,
  HardDrive,
  Save,
  CheckCircle2,
  LogOut,
  UserCheck,
  Shield,
  KeyRound,
  ShieldAlert,
  Crown
} from 'lucide-react';

// Exécution immédiate du reset demandé :
// "reset tout les donnees laisser seulement le compte super admin ouaradtech"
const SYSTEM_RESET_FLAG = 'hg_reset_ouaradtech_only_v2026';
if (typeof window !== 'undefined' && localStorage.getItem(SYSTEM_RESET_FLAG) !== 'completed') {
  try {
    localStorage.removeItem('hg_citernes');
    localStorage.removeItem('hg_vehicles');
    localStorage.removeItem('hg_entries');
    localStorage.removeItem('hg_dispenses');
    localStorage.removeItem('hg_fournisseurs');
    localStorage.removeItem('hg_vehicle_types');
    localStorage.removeItem('hg_alerts');
    localStorage.removeItem('hg_subscriptions');
    localStorage.removeItem('hg_active_license');
    localStorage.removeItem('hg_users');
    localStorage.setItem('hg_auth_user', JSON.stringify(SUPER_ADMIN_USER));
    localStorage.setItem(SYSTEM_RESET_FLAG, 'completed');
  } catch (e) {
    console.error('Initial reset error:', e);
  }
}

export default function App() {
  // Navigation tabs (Contrôle Total & Abonnements inclus)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entries' | 'dispenses' | 'reports' | 'utilisateurs' | 'gestion' | 'controle_total' | 'architecture'>('dashboard');
  const [gestionSubTab, setGestionSubTab] = useState<GestionSubTab>('utilisateurs');
  const [isGestionDropdownOpen, setIsGestionDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('fr-FR'));
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- ABONNEMENTS (CODES 36 CARACTÈRES) & SÉCURITÉ MAÎTRE ---
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('hg_subscriptions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_SUBSCRIPTIONS; }
    }
    return INITIAL_SUBSCRIPTIONS;
  });

  const [activeLicenseKey, setActiveLicenseKey] = useState<string>(() => {
    return localStorage.getItem('hg_active_license') || '';
  });

  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(() => {
    const saved = localStorage.getItem('hg_security_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_SECURITY_CONFIG; }
    }
    return INITIAL_SECURITY_CONFIG;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('hg_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_AUDIT_LOGS; }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  // Synchronisation continue avec le Backend Express (/api)
  useEffect(() => {
    // 1. Fetch Subscriptions
    fetch('/api/subscriptions')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.subscriptions)) {
          setSubscriptions(data.subscriptions);
        }
        if (data && data.activeLicenseKey) {
          setActiveLicenseKey(data.activeLicenseKey);
        }
      })
      .catch(() => {});

    // 2. Fetch Security Config
    fetch('/api/security/config')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.emergencyLockdown === 'boolean') {
          setSecurityConfig(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});

    // 3. Fetch Audit Logs
    fetch('/api/security/audit-logs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAuditLogs(data);
        }
      })
      .catch(() => {});

    // 4. Test initial connection to Cloud Firestore
    testConnection().catch(() => {});
  }, []);

  // Persistance continue
  useEffect(() => {
    localStorage.setItem('hg_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('hg_active_license', activeLicenseKey);
  }, [activeLicenseKey]);

  useEffect(() => {
    localStorage.setItem('hg_security_config', JSON.stringify(securityConfig));
  }, [securityConfig]);

  useEffect(() => {
    localStorage.setItem('hg_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // --- AUTHENTIFICATION SESSION (LOGIN AU DÉMARRAGE) ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hg_auth_user') || sessionStorage.getItem('hg_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem('hg_auth_user');
    sessionStorage.removeItem('hg_auth_user');
    setCurrentUser(null);
  };

  // --- CONTRÔLE DES ACCÈS, MENUS & OPTIONS PAR LE SUPER ADMIN ---
  const isSuperAdmin = currentUser?.role === 'Super Administrateur' || currentUser?.login?.toLowerCase() === 'ouaradtech';

  const canAccessMenu = (menuKey: keyof UserMenuPermissions): boolean => {
    if (!currentUser) return false;
    
    // RÈGLES CRITIQUES : Le menu Contrôle Total & Vente des Abonnements et l'Architecture Système Multiplateforme (Windows & Android)
    // sont STRICTEMENT réservés au Super Admin OuaradTech.
    // Ils ne doivent JAMAIS s'afficher ou être accessibles pour un compte client et utilisateur !
    if (menuKey === 'controle_total' || menuKey === 'architecture') {
      return isSuperAdmin;
    }

    if (isSuperAdmin) return true;

    // Vérifier les restrictions de licence définies par le Super Admin pour ce client
    const clientSub = subscriptions.find(s => 
      (currentUser.clientId && s.id === currentUser.clientId) ||
      (s.clientAdminId && s.clientAdminId === currentUser.id) ||
      (currentUser.login && s.clientAdminLogin === currentUser.login) ||
      (currentUser.entreprise && s.entreprise.toLowerCase() === currentUser.entreprise.toLowerCase())
    );

    if (clientSub?.licensePermissions?.menus && clientSub.licensePermissions.menus[menuKey] === false) {
      return false;
    }

    const perms = currentUser.permissions || getDefaultPermissionsForRole(currentUser.role);
    return perms.menus[menuKey] !== false;
  };

  const canExecuteOption = (optionKey: keyof UserOptionPermissions): boolean => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;

    // Vérifier les options autorisées dans la licence du client accordées par le Super Admin
    const clientSub = subscriptions.find(s => 
      (currentUser.clientId && s.id === currentUser.clientId) ||
      (s.clientAdminId && s.clientAdminId === currentUser.id) ||
      (currentUser.login && s.clientAdminLogin === currentUser.login) ||
      (currentUser.entreprise && s.entreprise.toLowerCase() === currentUser.entreprise.toLowerCase())
    );

    if (clientSub?.licensePermissions?.options && clientSub.licensePermissions.options[optionKey] === false) {
      return false;
    }

    const perms = currentUser.permissions || getDefaultPermissionsForRole(currentUser.role);
    return perms.options[optionKey] !== false;
  };

  // --- IDENTIFICATION DE L'ABONNEMENT ET ENCADREMENT DU CYCLE DE VIE DE LA LICENCE CLIENT ---
  const clientSub = subscriptions.find(s => 
    (currentUser?.clientId && s.id === currentUser.clientId) ||
    (s.clientAdminId && s.clientAdminId === currentUser?.id) ||
    (currentUser?.login && s.clientAdminLogin?.toLowerCase() === currentUser.login.toLowerCase()) ||
    (currentUser?.entreprise && s.entreprise.toLowerCase() === currentUser.entreprise.toLowerCase())
  ) || (!isSuperAdmin && subscriptions.length === 1 ? subscriptions[0] : null);

  // --- IDENTIFICATION DU CLIENT STRICT (ISOLATION MULTI-TENANT) ---
  const currentClientId = !isSuperAdmin
    ? (currentUser?.clientId || clientSub?.id || (currentUser?.entreprise ? `sub-${currentUser.entreprise.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : 'client-default'))
    : null;

  const currentEnterprise = !isSuperAdmin
    ? (currentUser?.entreprise || clientSub?.entreprise || 'Dépôt Principal')
    : '';

  // Synchronisation de session immédiate pour verrouiller le clientId du compte
  useEffect(() => {
    if (currentUser && !isSuperAdmin && currentClientId && currentUser.clientId !== currentClientId) {
      const updatedUser = { 
        ...currentUser, 
        clientId: currentClientId, 
        entreprise: currentEnterprise || currentUser.entreprise 
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('hg_auth_user', JSON.stringify(updatedUser));
    }
  }, [currentUser, isSuperAdmin, currentClientId, currentEnterprise]);

  const clientDaysRemaining = clientSub ? getDaysRemaining(clientSub.dateExpiration) : 0;

  // Identification précise : Administrateur du Client vs Utilisateur Simple
  const isCurrentClientAdmin = !isSuperAdmin && Boolean(
    currentUser?.isClientAdmin ||
    currentUser?.role === 'Administrateur Client' ||
    (clientSub && (
      (clientSub.clientAdminId && currentUser?.id === clientSub.clientAdminId) ||
      (clientSub.clientAdminLogin && currentUser?.login && currentUser.login.toLowerCase() === clientSub.clientAdminLogin.toLowerCase())
    ))
  );

  const isRegularUser = !isSuperAdmin && !isCurrentClientAdmin;

  // 1. Premier login des comptes clients : activation obligatoire du code 36 car.
  // La durée de la licence ne commence qu'au moment de cette validation !
  const isClientActivationRequired = Boolean(
    currentUser &&
    !isSuperAdmin &&
    (!clientSub || !clientSub.cleActilee || clientSub.statut === 'En Attente')
  );

  // 2. Échéance atteinte : l'application s'arrête de fonctionner pour le client
  const isClientLicenseExpired = Boolean(
    currentUser &&
    !isSuperAdmin &&
    clientSub &&
    clientSub.cleActilee &&
    (clientDaysRemaining <= 0 || clientSub.statut === 'Expiré')
  );

  // 3. Un mois avant échéance (<= 30 jours et > 0) : afficher message de renouvellement
  const isClientLicenseExpiringSoon = Boolean(
    currentUser &&
    !isSuperAdmin &&
    clientSub &&
    clientSub.cleActilee &&
    clientDaysRemaining > 0 &&
    clientDaysRemaining <= 30
  );

  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);

  // Protection stricte de navigation : interdiction formelle de l'onglet controle_total pour les clients
  useEffect(() => {
    if (!isSuperAdmin && activeTab === 'controle_total') {
      setActiveTab('dashboard');
    }
  }, [isSuperAdmin, activeTab]);

  // --- THEME STATE (5 THÈMES ÉLÉGANTS DE PRESTIGE) ---
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('hg_app_theme') as string;
    const validThemes: AppTheme[] = ['or-imperial', 'bleu-saphir', 'emeraude-prestige', 'platine-epure', 'cuivre-cognac'];
    if (validThemes.includes(saved as AppTheme)) {
      return saved as AppTheme;
    }
    // Migration fluide des anciens thèmes vers les nouveaux thèmes élégants
    if (saved === 'sombre-ambre') return 'or-imperial';
    if (saved === 'marine-bleu') return 'bleu-saphir';
    if (saved === 'eco-vert') return 'emeraude-prestige';
    if (saved === 'atelier-clair') return 'platine-epure';
    if (saved === 'chantier-orange') return 'cuivre-cognac';
    return 'or-imperial';
  });

  useEffect(() => {
    localStorage.setItem('hg_app_theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('fr-FR'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsGestionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Migration automatique vers les données et standards marocains si ancien jeu de données détecté
  const migrateStorageData = (raw: string): string => {
    return raw
      .replace(/\+216\s?71\s?110\s?220/g, '+212 5 22 35 10 20')
      .replace(/\+216\s?71\s?890\s?400/g, '+212 5 22 43 70 00')
      .replace(/\+216\s?72\s?445\s?100/g, '+212 5 22 46 20 00')
      .replace(/\+216\s?71\s?780\s?120/g, '+212 5 22 67 80 00')
      .replace(/\+216\s?71\s?884\s?102/g, '+212 5 22 88 41 02')
      .replace(/\+216\s?98\s?441\s?200/g, '+212 6 61 44 12 00')
      .replace(/\+216\s?97\s?332\s?119/g, '+212 6 62 33 21 19')
      .replace(/\+216\s?71\s?500\s?900/g, '+212 5 22 50 09 00')
      .replace(/\+216\s?22\s?991\s?304/g, '+212 6 70 99 13 04')
      .replace(/\+216\s?55\s?410\s?782/g, '+212 6 63 41 07 82')
      .replace(/\+216\s/g, '+212 ')
      .replace(/TN-9821-B/g, 'MA-89410-A-6')
      .replace(/TN-4410-X/g, 'MA-58401-B-1')
      .replace(/TN-6192-A/g, 'MA-44102-D-40')
      .replace(/TN-5840-X/g, 'MA-89410-A-6')
      .replace(/TN-/g, 'MA-')
      .replace(/Zone Dépôt Nord - Quai 1/g, 'Zone Pétrolière Mohammedia - Quai 1')
      .replace(/Atelier Central - Quai 2/g, 'Atelier Central Jorf Lasfar - Quai 2')
      .replace(/Centrale Électrique Bâtiment 4/g, 'Centrale Électrique Casablanca - Bâtiment 4')
      .replace(/Zone Industrielle Rades/g, 'Tour Akwa, Aïn Sebaâ, Casablanca')
      .replace(/Zone Portuaire Bizerte/g, 'Zone Industrielle Aïn Sebaâ, Casablanca')
      .replace(/Zone Industrielle Charguia II/g, 'Boulevard Ahl Loghlam, Sidi Bernoussi, Casablanca')
      .replace(/TotalEnergies Commercial Fuels/g, 'Afriquia SMDC (Groupe Akwa)')
      .replace(/Petromin Distribution Industrielle/g, 'Vivo Energy Maroc (Shell)')
      .replace(/Petromin Distribution/g, 'Vivo Energy Maroc (Shell)')
      .replace(/@totalenergies\.tn/g, '@totalenergies.ma')
      .replace(/@petromin-fuels\.com/g, '@petrom.ma')
      .replace(/@usine-hydro\.com/g, '@hydro-maroc.com');
  };

  // --- STATE WITH LOCALSTORAGE PERSISTENCE (ENREGISTREMENT LOCAL) ---
  const [citernes, setCiternes] = useState<Citerne[]>(() => {
    const saved = localStorage.getItem('hg_citernes');
    if (!saved) return INITIAL_CITERNES;
    try {
      return JSON.parse(migrateStorageData(saved));
    } catch {
      return INITIAL_CITERNES;
    }
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('hg_vehicles');
    if (!saved) return INITIAL_VEHICLES;
    try {
      return JSON.parse(migrateStorageData(saved));
    } catch {
      return INITIAL_VEHICLES;
    }
  });

  const [entries, setEntries] = useState<StockEntry[]>(() => {
    const saved = localStorage.getItem('hg_entries');
    if (!saved) return INITIAL_STOCK_ENTRIES;
    try {
      return JSON.parse(migrateStorageData(saved));
    } catch {
      return INITIAL_STOCK_ENTRIES;
    }
  });

  const [dispenses, setDispenses] = useState<FuelDispense[]>(() => {
    const saved = localStorage.getItem('hg_dispenses');
    if (!saved) return INITIAL_DISPENSES;
    try {
      return JSON.parse(migrateStorageData(saved));
    } catch {
      return INITIAL_DISPENSES;
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('hg_users');
    let loadedUsers: User[] = INITIAL_USERS;
    if (saved) {
      try {
        const migrated = migrateStorageData(saved);
        const parsed: User[] = JSON.parse(migrated);
        loadedUsers = parsed.map(u => {
          const match = INITIAL_USERS.find(iu => iu.id === u.id || iu.matricule === u.matricule || iu.login === u.login);
          return {
            ...u,
            login: u.login || match?.login || u.matricule.toLowerCase(),
            motDePasse: u.motDePasse || match?.motDePasse || 'admin123',
            permissions: u.permissions || match?.permissions,
            clientId: u.clientId || match?.clientId,
            entreprise: u.entreprise || match?.entreprise,
            isClientAdmin: u.isClientAdmin || match?.isClientAdmin
          };
        });

        // Assurer que les administrateurs clients initiaux sont bien présents
        for (const initUser of INITIAL_USERS) {
          if (!loadedUsers.some(u => u.id === initUser.id || (u.login && u.login === initUser.login))) {
            loadedUsers.push(initUser);
          }
        }
      } catch (e) {
        loadedUsers = INITIAL_USERS;
      }
    }

    // Assurer la présence constante et inaltérable du Super Administrateur OuaradTech
    const hasSuperAdmin = loadedUsers.some(u => 
      u.login?.toLowerCase() === 'ouaradtech' || 
      u.id === 'usr-superadmin' || 
      u.role === 'Super Administrateur'
    );
    if (!hasSuperAdmin) {
      loadedUsers = [SUPER_ADMIN_USER, ...loadedUsers];
    } else {
      loadedUsers = loadedUsers.map(u => {
        if (u.login?.toLowerCase() === 'ouaradtech' || u.id === 'usr-superadmin') {
          return {
            ...u,
            ...SUPER_ADMIN_USER,
            login: 'ouaradtech',
            motDePasse: 'Ouaradtech26@',
            role: 'Super Administrateur'
          };
        }
        return ensureUserPermissions(u);
      });
    }

    // DÉDUPLICATION ABSOLUE PAR ID & LOGIN POUR ÉVITER TOUT DOUBLON DE CLÉ REACT (ex: usr-admin-sub-...)
    const deduplicatedUsers = deduplicateUsers(loadedUsers);
    try {
      localStorage.setItem('hg_users', JSON.stringify(deduplicatedUsers));
    } catch {
      // ignore
    }
    return deduplicatedUsers;
  });

  // --- UTILISATEURS VISIBLES SELON LE PROFIL (ISOLATION STRICTE MULTI-TENANT) ---
  // RÈGLE CRITIQUE D'ISOLATION :
  // 1. Les comptes et habilitations des clients sont STRICTEMENT INVISIBLES pour le Super Administrateur OuaradTech.
  // 2. Le compte Super Administrateur ne doit JAMAIS être vu dans le compte client.
  // 3. Dans le compte client, les utilisateurs standards ne doivent JAMAIS avoir les informations du compte admin.
  // 4. Chaque utilisateur régulier ne doit avoir SEULEMENT que les informations de son propre compte utilisateur.
  // 5. Un client ne voit JAMAIS les utilisateurs ou données d'un autre client.
  const clientVisibleUsers = useMemo(() => {
    if (isSuperAdmin) {
      // Les utilisateurs et habilitations des clients sont strictement invisibles pour le Super Admin
      return deduplicateUsers(users.filter(u => 
        u.role === 'Super Administrateur' || 
        u.login?.toLowerCase() === 'ouaradtech' || 
        u.id === 'usr-superadmin'
      ));
    }

    // Utilisateur simple : isolation absolue, il ne voit QUE son propre compte et JAMAIS l'administrateur
    if (isRegularUser) {
      return currentUser ? [currentUser] : [];
    }

    // Administrateur client : il voit son compte admin et son équipe (JAMAIS le Super Admin et JAMAIS les autres clients)
    const targetCId = currentClientId || currentUser?.clientId || clientSub?.id;
    const targetEnterprise = (currentEnterprise || currentUser?.entreprise || clientSub?.entreprise || '').trim().toLowerCase();

    const rawList = users.filter(u => {
      // 1. Masquage inconditionnel et absolu de TOUT compte Super Administrateur
      if (
        u.role === 'Super Administrateur' || 
        u.login?.toLowerCase() === 'ouaradtech' || 
        u.id === 'usr-superadmin' ||
        Boolean(u.departement && u.departement.toLowerCase().includes('ouaradtech'))
      ) {
        return false;
      }

      // Si l'utilisateur appartient explicitement à un autre clientId, rejet strict
      if (u.clientId && targetCId && u.clientId !== targetCId) {
        return false;
      }

      // 2. Le compte administrateur client connecté lui-même
      if (
        currentUser && 
        (u.id === currentUser.id || (u.login && currentUser.login && u.login.toLowerCase() === currentUser.login.toLowerCase()))
      ) {
        return true;
      }

      // 3. L'administrateur dédié lié à l'abonnement du client
      if (
        clientSub && 
        ((clientSub.clientAdminId && u.id === clientSub.clientAdminId) ||
         (clientSub.clientAdminLogin && u.login && u.login.toLowerCase() === clientSub.clientAdminLogin.toLowerCase()))
      ) {
        return true;
      }

      // 4. Utilisateurs rattachés au clientId de ce compte client
      if (targetCId && u.clientId && u.clientId === targetCId) {
        return true;
      }

      // 5. Utilisateurs créés par ce client (par son ID ou son Login)
      if (
        (currentUser && u.createdBy && (u.createdBy === currentUser.id || u.createdBy === currentUser.login)) ||
        (clientSub && u.createdBy && (u.createdBy === clientSub.clientAdminId || u.createdBy === clientSub.clientAdminLogin))
      ) {
        return true;
      }

      // 6. Utilisateurs de la même entreprise (si entreprise explicitement renseignée)
      if (
        targetEnterprise !== '' &&
        u.entreprise &&
        u.entreprise.trim().toLowerCase() === targetEnterprise
      ) {
        return true;
      }

      return false;
    });

    return deduplicateUsers(rawList);
  }, [users, isSuperAdmin, isRegularUser, currentUser, clientSub, currentClientId, currentEnterprise]);

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>(() => {
    const saved = localStorage.getItem('hg_fournisseurs');
    if (!saved) return INITIAL_FOURNISSEURS;
    try {
      return JSON.parse(migrateStorageData(saved));
    } catch {
      return INITIAL_FOURNISSEURS;
    }
  });

  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeConfig[]>(() => {
    const saved = localStorage.getItem('hg_vehicle_types');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLE_TYPES;
  });

  const [alerts, setAlerts] = useState<ConsumptionAlert[]>(() => {
    const saved = localStorage.getItem('hg_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  // LocalStorage automatic continuous sync
  useEffect(() => {
    localStorage.setItem('hg_citernes', JSON.stringify(citernes));
  }, [citernes]);
  useEffect(() => {
    localStorage.setItem('hg_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);
  useEffect(() => {
    localStorage.setItem('hg_entries', JSON.stringify(entries));
  }, [entries]);
  useEffect(() => {
    localStorage.setItem('hg_dispenses', JSON.stringify(dispenses));
  }, [dispenses]);
  useEffect(() => {
    localStorage.setItem('hg_users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem('hg_fournisseurs', JSON.stringify(fournisseurs));
  }, [fournisseurs]);
  useEffect(() => {
    localStorage.setItem('hg_vehicle_types', JSON.stringify(vehicleTypes));
  }, [vehicleTypes]);
  useEffect(() => {
    localStorage.setItem('hg_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // --- CLOISONNEMENT STRICT MULTI-TENANT (DONNÉES SÉPARÉES & INVISIBLES AU SUPER ADMIN ET AUX AUTRES CLIENTS) ---
  // RÈGLE FORMELLE ABSOLUE :
  // 1. Chaque client a ses propres données séparées : citernes, types d'engins, véhicules, fournisseurs, entrées, sorties, alertes.
  // 2. Toutes les données des clients sont STRICTEMENT INVISIBLES pour les autres clients ET pour le Super Admin OuaradTech.

  const visibleCiternes = useMemo(() => {
    if (isSuperAdmin) {
      // Les données de citernes créées par ou pour le Super Admin (ou non taguées en mode test)
      return citernes.filter(c => c.clientId === 'superadmin' || !c.clientId);
    }
    const targetCId = currentClientId || clientSub?.id || currentUser?.clientId || 'client-default';
    return citernes.filter(c => 
      c.clientId === targetCId || 
      (c.clientId && (c.clientId === currentUser?.clientId || c.clientId === clientSub?.id)) ||
      (c.entreprise && currentUser?.entreprise && c.entreprise.toLowerCase().trim() === currentUser.entreprise.toLowerCase().trim()) ||
      (!c.clientId)
    );
  }, [citernes, isSuperAdmin, currentClientId, clientSub, currentUser]);

  const visibleVehicles = useMemo(() => {
    if (isSuperAdmin) {
      return vehicles.filter(v => v.clientId === 'superadmin' || !v.clientId);
    }
    const targetCId = currentClientId || clientSub?.id || currentUser?.clientId || 'client-default';
    return vehicles.filter(v => 
      v.clientId === targetCId || 
      (v.clientId && (v.clientId === currentUser?.clientId || v.clientId === clientSub?.id)) ||
      (v.entreprise && currentUser?.entreprise && v.entreprise.toLowerCase().trim() === currentUser.entreprise.toLowerCase().trim()) ||
      (!v.clientId)
    );
  }, [vehicles, isSuperAdmin, currentClientId, clientSub, currentUser]);

  const visibleEntries = useMemo(() => {
    if (isSuperAdmin) {
      return entries.filter(e => e.clientId === 'superadmin' || !e.clientId);
    }
    const targetCId = currentClientId || clientSub?.id || currentUser?.clientId || 'client-default';
    return entries.filter(e => 
      e.clientId === targetCId || 
      (e.clientId && (e.clientId === currentUser?.clientId || e.clientId === clientSub?.id)) ||
      (e.entreprise && currentUser?.entreprise && e.entreprise.toLowerCase().trim() === currentUser.entreprise.toLowerCase().trim()) ||
      (!e.clientId)
    );
  }, [entries, isSuperAdmin, currentClientId, clientSub, currentUser]);

  const visibleDispenses = useMemo(() => {
    if (isSuperAdmin) {
      return dispenses.filter(d => d.clientId === 'superadmin' || !d.clientId);
    }
    const targetCId = currentClientId || clientSub?.id || currentUser?.clientId || 'client-default';
    return dispenses.filter(d => 
      d.clientId === targetCId || 
      (d.clientId && (d.clientId === currentUser?.clientId || d.clientId === clientSub?.id)) ||
      (d.entreprise && currentUser?.entreprise && d.entreprise.toLowerCase().trim() === currentUser.entreprise.toLowerCase().trim()) ||
      (!d.clientId)
    );
  }, [dispenses, isSuperAdmin, currentClientId, clientSub, currentUser]);

  const visibleFournisseurs = useMemo(() => {
    if (isSuperAdmin) {
      return fournisseurs.filter(f => f.clientId === 'superadmin' || !f.clientId);
    }
    const targetCId = currentClientId || clientSub?.id || currentUser?.clientId || 'client-default';
    return fournisseurs.filter(f => 
      f.clientId === targetCId || 
      (f.clientId && (f.clientId === currentUser?.clientId || f.clientId === clientSub?.id)) ||
      (f.entreprise && currentUser?.entreprise && f.entreprise.toLowerCase().trim() === currentUser.entreprise.toLowerCase().trim()) ||
      (!f.clientId)
    );
  }, [fournisseurs, isSuperAdmin, currentClientId, clientSub, currentUser]);

  const visibleVehicleTypes = useMemo(() => {
    if (isSuperAdmin) {
      const superAdminTypes = vehicleTypes.filter(vt => vt.clientId === 'superadmin' || !vt.clientId);
      return superAdminTypes.length > 0 ? superAdminTypes : INITIAL_VEHICLE_TYPES;
    }
    const targetCId = currentClientId || clientSub?.id || currentUser?.clientId || 'client-default';
    const clientTypes = vehicleTypes.filter(vt => 
      vt.clientId === targetCId || 
      (vt.clientId && (vt.clientId === currentUser?.clientId || vt.clientId === clientSub?.id)) ||
      (!vt.clientId)
    );
    if (clientTypes.length === 0) {
      return INITIAL_VEHICLE_TYPES.map(vt => ({ ...vt, clientId: targetCId }));
    }
    return clientTypes;
  }, [vehicleTypes, isSuperAdmin, currentClientId, clientSub, currentUser]);

  const visibleAlerts = useMemo(() => {
    if (isSuperAdmin) {
      return alerts.filter(a => a.clientId === 'superadmin' || !a.clientId);
    }
    const targetCId = currentClientId || clientSub?.id || currentUser?.clientId || 'client-default';
    return alerts.filter(a => 
      a.clientId === targetCId || 
      (a.clientId && (a.clientId === currentUser?.clientId || a.clientId === clientSub?.id)) ||
      (a.entreprise && currentUser?.entreprise && a.entreprise.toLowerCase().trim() === currentUser.entreprise.toLowerCase().trim()) ||
      (!a.clientId)
    );
  }, [alerts, isSuperAdmin, currentClientId, clientSub, currentUser]);

  // Redirection de sécurité : Architecture réservée au Super Admin
  useEffect(() => {
    if (activeTab === 'architecture' && !isSuperAdmin) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isSuperAdmin]);

  // Enregistrement direct dans C:\gasoilpro (création automatique du dossier si absent)
  const handleSaveToGasoilProDisk = async (): Promise<{ success: boolean; message: string; path?: string }> => {
    try {
      const packageData = {
        citernes,
        vehicles,
        entries,
        dispenses,
        users,
        fournisseurs,
        vehicleTypes,
        alerts,
        currentTheme,
        subscriptions,
        activeLicenseKey
      };
      const res = await fetch('/api/gasoilpro/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageData)
      });
      if (res.ok) {
        const result = await res.json();
        return { 
          success: true, 
          message: `Enregistrement effectué dans ${result.configuredPath || 'C:\\gasoilpro'} (dossier créé automatiquement si absent).`,
          path: result.configuredPath 
        };
      }
      return { success: false, message: 'Erreur lors de la sauvegarde sur disque local.' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Erreur réseau vers le serveur local GasoilPro' };
    }
  };

  // Chargement / Restauration depuis C:\gasoilpro
  const handleLoadFromGasoilProDisk = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/gasoilpro/load');
      if (res.ok) {
        const result = await res.json();
        const data = result.data;
        if (data) {
          if (Array.isArray(data.citernes)) setCiternes(data.citernes);
          if (Array.isArray(data.vehicles)) setVehicles(data.vehicles);
          if (Array.isArray(data.entries)) setEntries(data.entries);
          if (Array.isArray(data.dispenses)) setDispenses(data.dispenses);
          if (Array.isArray(data.users)) setUsers(data.users);
          if (Array.isArray(data.fournisseurs)) setFournisseurs(data.fournisseurs);
          if (Array.isArray(data.vehicleTypes)) setVehicleTypes(data.vehicleTypes);
          if (Array.isArray(data.alerts)) setAlerts(data.alerts);
          if (data.currentTheme) setCurrentTheme(data.currentTheme);
          return { success: true, message: `Sauvegarde restaurée avec succès depuis ${result.configuredPath || 'C:\\gasoilpro'} !` };
        }
      }
      return { success: false, message: 'Aucun fichier de données valide trouvé dans C:\\gasoilpro' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Erreur de lecture depuis C:\\gasoilpro' };
    }
  };

  // Force local storage save & sync vers C:\gasoilpro
  const handleForceSaveLocal = () => {
    localStorage.setItem('hg_citernes', JSON.stringify(citernes));
    localStorage.setItem('hg_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('hg_entries', JSON.stringify(entries));
    localStorage.setItem('hg_dispenses', JSON.stringify(dispenses));
    localStorage.setItem('hg_users', JSON.stringify(users));
    localStorage.setItem('hg_fournisseurs', JSON.stringify(fournisseurs));
    localStorage.setItem('hg_vehicle_types', JSON.stringify(vehicleTypes));
    localStorage.setItem('hg_alerts', JSON.stringify(alerts));
    localStorage.setItem('hg_app_theme', currentTheme);

    // Enregistrement également dans C:\gasoilpro
    handleSaveToGasoilProDisk().then(res => {
      if (res.success) {
        setSaveBanner(`Données enregistrées dans C:\\gasoilpro et le stockage local !`);
      } else {
        setSaveBanner('Données enregistrées localement avec succès !');
      }
      setTimeout(() => setSaveBanner(null), 5000);
    });
  };

  // Export local backup file (JSON) cloisonné au client
  const handleExportBackup = () => {
    const backup = {
      version: '4.6 PRO',
      dateExport: new Date().toISOString(),
      plant: currentEnterprise || 'GASOILPRO INDUSTRIAL PLANT',
      clientId: currentClientId || 'superadmin',
      data: {
        citernes: visibleCiternes,
        vehicles: visibleVehicles,
        entries: visibleEntries,
        dispenses: visibleDispenses,
        users: clientVisibleUsers,
        fournisseurs: visibleFournisseurs,
        vehicleTypes: visibleVehicleTypes,
        alerts: visibleAlerts,
        currentTheme
      }
    };
    const clientSlug = (currentEnterprise || 'gasoilpro').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backup, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `gasoilpro_${clientSlug}_sauvegarde_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import local backup file (JSON) avec rattachement au client courant
  const handleImportBackup = (jsonData: any): boolean => {
    try {
      const payload = jsonData.data || jsonData;
      const targetCId = currentClientId || 'client-default';
      const targetEnt = currentEnterprise || '';

      if (Array.isArray(payload.citernes)) {
        const tagged = payload.citernes.map((c: any) => ({ ...c, clientId: targetCId, entreprise: targetEnt }));
        setCiternes(prev => [...prev.filter(c => c.clientId !== targetCId), ...tagged]);
      }
      if (Array.isArray(payload.vehicles)) {
        const tagged = payload.vehicles.map((v: any) => ({ ...v, clientId: targetCId, entreprise: targetEnt }));
        setVehicles(prev => [...prev.filter(v => v.clientId !== targetCId), ...tagged]);
      }
      if (Array.isArray(payload.entries)) {
        const tagged = payload.entries.map((e: any) => ({ ...e, clientId: targetCId, entreprise: targetEnt }));
        setEntries(prev => [...prev.filter(e => e.clientId !== targetCId), ...tagged]);
      }
      if (Array.isArray(payload.dispenses)) {
        const tagged = payload.dispenses.map((d: any) => ({ ...d, clientId: targetCId, entreprise: targetEnt }));
        setDispenses(prev => [...prev.filter(d => d.clientId !== targetCId), ...tagged]);
      }
      if (Array.isArray(payload.users)) {
        const tagged = payload.users.map((u: any) => ({ ...u, clientId: targetCId, entreprise: targetEnt }));
        setUsers(prev => [...prev.filter(u => u.clientId !== targetCId), ...tagged]);
      }
      if (Array.isArray(payload.fournisseurs)) {
        const tagged = payload.fournisseurs.map((f: any) => ({ ...f, clientId: targetCId, entreprise: targetEnt }));
        setFournisseurs(prev => [...prev.filter(f => f.clientId !== targetCId), ...tagged]);
      }
      if (Array.isArray(payload.vehicleTypes)) {
        const tagged = payload.vehicleTypes.map((vt: any) => ({ ...vt, clientId: targetCId, entreprise: targetEnt }));
        setVehicleTypes(prev => [...prev.filter(vt => vt.clientId !== targetCId), ...tagged]);
      }
      if (Array.isArray(payload.alerts)) {
        const tagged = payload.alerts.map((a: any) => ({ ...a, clientId: targetCId, entreprise: targetEnt }));
        setAlerts(prev => [...prev.filter(a => a.clientId !== targetCId), ...tagged]);
      }
      if (payload.currentTheme) setCurrentTheme(payload.currentTheme);
      return true;
    } catch {
      return false;
    }
  };

  // Synchronisation depuis le Backend Cloud (Firestore)
  const handleDataLoadedFromCloud = (cloudData: {
    citernes: Citerne[];
    vehicles: Vehicle[];
    entries: StockEntry[];
    dispenses: FuelDispense[];
    users: User[];
    subscriptions: Subscription[];
  }) => {
    if (cloudData.citernes && cloudData.citernes.length > 0) setCiternes(cloudData.citernes);
    if (cloudData.vehicles && cloudData.vehicles.length > 0) setVehicles(cloudData.vehicles);
    if (cloudData.entries && cloudData.entries.length > 0) setEntries(cloudData.entries);
    if (cloudData.dispenses && cloudData.dispenses.length > 0) setDispenses(cloudData.dispenses);
    if (cloudData.users && cloudData.users.length > 0) setUsers(cloudData.users);
    if (cloudData.subscriptions && cloudData.subscriptions.length > 0) setSubscriptions(cloudData.subscriptions);
  };

  // Reset complet de toutes les données du système (laisse uniquement le compte Super Admin ouaradtech)
  const handleResetAllData = async () => {
    // 1. Purge LocalStorage
    try {
      localStorage.removeItem('hg_citernes');
      localStorage.removeItem('hg_vehicles');
      localStorage.removeItem('hg_entries');
      localStorage.removeItem('hg_dispenses');
      localStorage.removeItem('hg_fournisseurs');
      localStorage.removeItem('hg_vehicle_types');
      localStorage.removeItem('hg_alerts');
      localStorage.removeItem('hg_subscriptions');
      localStorage.removeItem('hg_active_license');
      localStorage.removeItem('hg_security_config');
      localStorage.removeItem('hg_audit_logs');
      localStorage.removeItem('hg_users');
      localStorage.setItem('hg_auth_user', JSON.stringify(SUPER_ADMIN_USER));
      localStorage.setItem(SYSTEM_RESET_FLAG, 'completed');
    } catch (e) {
      console.warn('LocalStorage reset warning:', e);
    }

    // 2. Réinitialisation des états React
    setCiternes([]);
    setVehicles([]);
    setEntries([]);
    setDispenses([]);
    setFournisseurs([]);
    setVehicleTypes(INITIAL_VEHICLE_TYPES);
    setAlerts([]);
    setSubscriptions([]);
    setActiveLicenseKey('');
    setUsers([SUPER_ADMIN_USER]);
    setCurrentUser(SUPER_ADMIN_USER);
    setSecurityConfig(INITIAL_SECURITY_CONFIG);
    setAuditLogs([
      {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toLocaleString('fr-FR'),
        user: 'ouaradtech (Super Admin)',
        action: 'Réinitialisation Totale Système',
        module: 'Sécurité & Contrôle Total',
        details: 'Toutes les données ont été réinitialisées. Seul le compte Super Administrateur ouaradtech est conservé.',
        status: 'Succès',
        ipAddress: '127.0.0.1'
      }
    ]);
    setCurrentTheme('or-imperial');
    setIsResetModalOpen(false);

    // 3. Appel de réinitialisation backend
    try {
      await fetch('/api/system/reset', { method: 'POST' });
    } catch (e) {
      console.warn('Backend reset completed');
    }

    setSaveBanner('Système réinitialisé avec succès : toutes les données ont été effacées, seul le compte Super Admin ouaradtech est conservé.');
    setTimeout(() => setSaveBanner(null), 5000);
  };

  // Reset to default demo data
  const handlePerformReset = () => {
    handleResetAllData();
  };

  // --- CITERNES CRUD ---
  const handleAddCiterne = (newCiterneData: Omit<Citerne, 'id'>) => {
    const activeCId = isSuperAdmin ? 'superadmin' : (currentClientId || clientSub?.id || currentUser?.clientId || 'client-default');
    const activeEnt = isSuperAdmin ? 'Super Admin' : (currentEnterprise || currentUser?.entreprise || clientSub?.entreprise || 'Dépôt Principal');
    const newCit: Citerne = {
      ...newCiterneData,
      id: `cit-${Date.now()}`,
      clientId: activeCId,
      entreprise: activeEnt
    };
    setCiternes(prev => [...prev, newCit]);
    setAlerts(prev => [
      {
        id: `alt-cit-add-${Date.now()}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        gravite: 'info',
        titre: `Nouvelle Citerne Installée : ${newCit.code}`,
        message: `${newCit.nom} de capacité ${newCit.capaciteTotale.toLocaleString('fr-FR')} L ajoutée au parc.`,
        clientId: activeCId,
        entreprise: activeEnt
      },
      ...prev
    ]);
  };

  const handleUpdateCiterne = (updatedCiterne: Citerne) => {
    setCiternes(prev => prev.map(c => c.id === updatedCiterne.id ? {
      ...c,
      ...updatedCiterne,
      clientId: c.clientId || (isSuperAdmin ? 'superadmin' : (currentClientId || clientSub?.id || 'client-default'))
    } : c));
  };

  const handleDeleteCiterne = (id: string) => {
    const target = citernes.find(c => c.id === id);
    setCiternes(prev => prev.filter(c => c.id !== id));
    if (target) {
      setAlerts(prev => [
        {
          id: `alt-cit-del-${Date.now()}`,
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          gravite: 'warning',
          titre: `Citerne Retirée : ${target.code}`,
          message: `La citerne ${target.code} (${target.nom}) a été supprimée du système.`
        },
        ...prev
      ]);
    }
  };

  // Direct simulation / adjustment of tank level
  const handleUpdateCiterneLevel = (citerneId: string, newLevel: number) => {
    setCiternes(prev => prev.map(c => c.id === citerneId ? { ...c, stockActuel: newLevel } : c));
  };

  // --- STOCK ENTRIES (LIVRAISONS / DÉPOTAGES) ---
  const handleAddStockEntry = (newEntryData: Omit<StockEntry, 'id'>) => {
    const activeCId = isSuperAdmin ? 'superadmin' : (currentClientId || clientSub?.id || currentUser?.clientId || 'client-default');
    const activeEnt = isSuperAdmin ? 'Super Admin' : (currentEnterprise || currentUser?.entreprise || clientSub?.entreprise || 'Dépôt Principal');
    const newEntry: StockEntry = {
      ...newEntryData,
      id: `ent-${Date.now()}`,
      clientId: activeCId,
      entreprise: activeEnt
    };
    setEntries(prev => [newEntry, ...prev]);

    // Increase target tank stock
    setCiternes(prev => prev.map(c => {
      if (c.id === newEntry.citerneId) {
        const updatedLevel = Math.min(c.capaciteTotale, c.stockActuel + newEntry.quantiteLivree);
        return {
          ...c,
          stockActuel: updatedLevel,
          dernierControle: new Date().toISOString().split('T')[0]
        };
      }
      return c;
    }));

    const targetC = citernes.find(c => c.id === newEntry.citerneId);
    setAlerts(prev => [
      {
        id: `alt-${Date.now()}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        gravite: 'info',
        titre: `Dépotage Effectué : ${newEntry.numeroBon}`,
        message: `Réception de ${newEntry.quantiteLivree.toLocaleString('fr-FR')} L de ${newEntry.fournisseur} dans ${targetC?.code || 'citerne'}.`,
        citerneCode: targetC?.code,
        clientId: activeCId,
        entreprise: activeEnt
      },
      ...prev
    ]);
  };

  // Delete Stock Entry (Livraison) with tank stock rollback
  const handleDeleteStockEntry = (id: string, restoreTankStock: boolean = true) => {
    const entryToDelete = entries.find(e => e.id === id);
    if (!entryToDelete) return;

    if (restoreTankStock) {
      setCiternes(prev => prev.map(c => {
        if (c.id === entryToDelete.citerneId) {
          const rolledBackStock = Math.max(0, c.stockActuel - entryToDelete.quantiteLivree);
          return {
            ...c,
            stockActuel: rolledBackStock
          };
        }
        return c;
      }));
    }

    setEntries(prev => prev.filter(e => e.id !== id));

    setAlerts(prev => [
      {
        id: `alt-del-ent-${Date.now()}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        gravite: 'warning',
        titre: `Livraison Supprimée : ${entryToDelete.numeroBon}`,
        message: `Le bon ${entryToDelete.numeroBon} (${entryToDelete.fournisseur}) a été supprimé. Le stock citerne a été ajusté de -${entryToDelete.quantiteLivree.toLocaleString('fr-FR')} L.`
      },
      ...prev
    ]);
  };

  // --- FUEL DISPENSES (SORTIES / PLEINS) ---
  const handleAddDispense = (newDispenseData: Omit<FuelDispense, 'id'>) => {
    const activeCId = isSuperAdmin ? 'superadmin' : (currentClientId || clientSub?.id || currentUser?.clientId || 'client-default');
    const activeEnt = isSuperAdmin ? 'Super Admin' : (currentEnterprise || currentUser?.entreprise || clientSub?.entreprise || 'Dépôt Principal');
    const newDispense: FuelDispense = {
      ...newDispenseData,
      id: `dsp-${Date.now()}`,
      clientId: activeCId,
      entreprise: activeEnt
    };
    setDispenses(prev => [newDispense, ...prev]);

    // Decrease tank stock
    setCiternes(prev => prev.map(c => {
      if (c.id === newDispense.citerneId) {
        const updatedStock = Math.max(0, c.stockActuel - newDispense.volumeLivre);
        return {
          ...c,
          stockActuel: updatedStock
        };
      }
      return c;
    }));

    // Update vehicle odometer and latest consumption
    setVehicles(prev => prev.map(v => {
      if (v.id === newDispense.vehiculeId) {
        return {
          ...v,
          kilometrageOuHeures: newDispense.compteurActuel,
          derniereConsoReelle: newDispense.ratioConsommation
        };
      }
      return v;
    }));

    const veh = vehicles.find(v => v.id === newDispense.vehiculeId);
    const cit = citernes.find(c => c.id === newDispense.citerneId);

    if (newDispense.surconsommationAlerte) {
      setAlerts(prev => [
        {
          id: `alt-${Date.now()}`,
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          gravite: 'danger',
          titre: `Surconsommation Détectée : ${veh?.code}`,
          message: `Consommation mesurée à ${newDispense.ratioConsommation} ${veh?.uniteMesure === 'km' ? 'L/100km' : 'L/h'} (référence: ${veh?.consommationMoyenneTheorique}).`,
          vehiculeCode: veh?.code,
          clientId: activeCId,
          entreprise: currentEnterprise
        },
        ...prev
      ]);
    }

    if (cit && (cit.stockActuel - newDispense.volumeLivre) <= cit.seuilCritique) {
      setAlerts(prev => [
        {
          id: `alt-tank-${Date.now()}`,
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          gravite: 'danger',
          titre: `Niveau Critique : ${cit.code}`,
          message: `Le stock de la citerne ${cit.code} est tombé à ${(cit.stockActuel - newDispense.volumeLivre).toLocaleString('fr-FR')} L. Réapprovisionnement nécessaire.`,
          citerneCode: cit.code,
          clientId: activeCId,
          entreprise: currentEnterprise
        },
        ...prev
      ]);
    }
  };

  // Delete Fuel Dispense (Sortie / Plein) with tank stock restitution
  const handleDeleteDispense = (id: string, restoreTankStock: boolean = true) => {
    const dispenseToDelete = dispenses.find(d => d.id === id);
    if (!dispenseToDelete) return;

    if (restoreTankStock) {
      setCiternes(prev => prev.map(c => {
        if (c.id === dispenseToDelete.citerneId) {
          const restoredStock = Math.min(c.capaciteTotale, c.stockActuel + dispenseToDelete.volumeLivre);
          return {
            ...c,
            stockActuel: restoredStock
          };
        }
        return c;
      }));
    }

    setDispenses(prev => prev.filter(d => d.id !== id));

    setAlerts(prev => [
      {
        id: `alt-del-dsp-${Date.now()}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        gravite: 'info',
        titre: `Ticket Supprimé : ${dispenseToDelete.codeTicket}`,
        message: `Le ticket ${dispenseToDelete.codeTicket} a été supprimé. Les ${dispenseToDelete.volumeLivre.toLocaleString('fr-FR')} L ont été restitués dans la citerne.`
      },
      ...prev
    ]);
  };

  // --- VEHICLES CRUD ---
  const handleAddVehicle = (newVeh: Omit<Vehicle, 'id'>) => {
    const activeCId = isSuperAdmin ? 'superadmin' : (currentClientId || clientSub?.id || currentUser?.clientId || 'client-default');
    const activeEnt = isSuperAdmin ? 'Super Admin' : (currentEnterprise || currentUser?.entreprise || clientSub?.entreprise || 'Dépôt Principal');
    const v: Vehicle = {
      ...newVeh,
      id: `veh-${Date.now()}`,
      clientId: activeCId,
      entreprise: activeEnt
    };
    setVehicles(prev => [...prev, v]);
  };

  const handleUpdateVehicle = (updatedVeh: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedVeh.id ? updatedVeh : v));
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const handleImportVehicles = (imported: Vehicle[]) => {
    const activeCId = isSuperAdmin ? 'superadmin' : (currentClientId || clientSub?.id || currentUser?.clientId || 'client-default');
    const activeEnt = isSuperAdmin ? 'Super Admin' : (currentEnterprise || currentUser?.entreprise || clientSub?.entreprise || 'Dépôt Principal');
    const tagged = imported.map(v => ({
      ...v,
      clientId: activeCId,
      entreprise: activeEnt
    }));
    setVehicles(prev => [...tagged, ...prev]);
  };

  // --- USERS CRUD ---
  const handleAddUser = (newUserData: Omit<User, 'id'>) => {
    if (isRegularUser) {
      console.warn("Opération non autorisée : un utilisateur standard ne peut pas créer de compte.");
      return;
    }
    const userClientId = (!isSuperAdmin ? (currentUser?.clientId || clientSub?.id) : undefined) || (newUserData as any).clientId;
    const userEntreprise = (!isSuperAdmin ? (currentUser?.entreprise || clientSub?.entreprise) : undefined) || (newUserData as any).entreprise;
    const userCreatedBy = (!isSuperAdmin ? (currentUser?.login || currentUser?.id) : undefined) || (newUserData as any).createdBy;

    const u: User = {
      ...newUserData,
      id: (newUserData as any).id || `usr-${Date.now()}`,
      clientId: userClientId,
      entreprise: userEntreprise,
      createdBy: userCreatedBy
    };
    setUsers(prev => {
      // Éviter les clés en doublon en filtrant tout ID ou login identique
      const filtered = prev.filter(existing => 
        existing.id !== u.id && 
        (!u.login || !existing.login || existing.login.toLowerCase() !== u.login.toLowerCase())
      );
      return [...filtered, u];
    });
  };

  const handleUpdateUser = (updatedUser: User) => {
    if (isRegularUser) {
      console.warn("Opération non autorisée : un utilisateur standard n'a pas l'autorisation de modifier.");
      return;
    }
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(prev => prev && prev.id === updatedUser.id ? { ...prev, ...updatedUser } : prev);
  };

  const handleDeleteUser = (id: string) => {
    if (isRegularUser) {
      console.warn("Opération non autorisée : un utilisateur standard ne peut pas supprimer de compte.");
      return;
    }
    // Le Super Administrateur OuaradTech ne peut JAMAIS être supprimé
    const target = users.find(u => u.id === id);
    if (target && (target.role === 'Super Administrateur' || target.login?.toLowerCase() === 'ouaradtech' || target.id === 'usr-superadmin')) {
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // --- FOURNISSEURS CRUD ---
  const handleAddFournisseur = (newFrsData: Omit<Fournisseur, 'id'>) => {
    const activeCId = isSuperAdmin ? 'superadmin' : (currentClientId || clientSub?.id || currentUser?.clientId || 'client-default');
    const activeEnt = isSuperAdmin ? 'Super Admin' : (currentEnterprise || currentUser?.entreprise || clientSub?.entreprise || 'Dépôt Principal');
    const frs: Fournisseur = {
      ...newFrsData,
      id: `frs-${Date.now()}`,
      clientId: activeCId,
      entreprise: activeEnt
    };
    setFournisseurs(prev => [...prev, frs]);
  };

  const handleUpdateFournisseur = (updatedFrs: Fournisseur) => {
    setFournisseurs(prev => prev.map(f => f.id === updatedFrs.id ? updatedFrs : f));
  };

  const handleDeleteFournisseur = (id: string) => {
    setFournisseurs(prev => prev.filter(f => f.id !== id));
  };

  // --- VEHICLE TYPES CRUD ---
  const handleAddVehicleType = (newVtData: Omit<VehicleTypeConfig, 'id'>) => {
    const activeCId = isSuperAdmin ? 'superadmin' : (currentClientId || clientSub?.id || currentUser?.clientId || 'client-default');
    const activeEnt = isSuperAdmin ? 'Super Admin' : (currentEnterprise || currentUser?.entreprise || clientSub?.entreprise || 'Dépôt Principal');
    const vt: VehicleTypeConfig = {
      ...newVtData,
      id: `vt-${Date.now()}`,
      clientId: activeCId,
      entreprise: activeEnt
    };
    setVehicleTypes(prev => [...prev, vt]);
  };

  const handleUpdateVehicleType = (updatedVt: VehicleTypeConfig) => {
    setVehicleTypes(prev => prev.map(vt => vt.id === updatedVt.id ? updatedVt : vt));
  };

  const handleDeleteVehicleType = (id: string) => {
    setVehicleTypes(prev => prev.filter(vt => vt.id !== id));
  };

  // --- GESTION DES ABONNEMENTS (36 CARACTÈRES) & CONTRÔLE TOTAL ---
  const handleAddSubscription = async (newSub: Subscription, adminUser?: User) => {
    setSubscriptions(prev => {
      const filtered = prev.filter(s => s.id !== newSub.id);
      return [newSub, ...filtered];
    });
    if (adminUser) {
      setUsers(prev => {
        const filtered = prev.filter(u => 
          u.id !== adminUser.id && 
          (!adminUser.login || !u.login || u.login.toLowerCase() !== adminUser.login.toLowerCase())
        );
        return [...filtered, adminUser];
      });
    }
    try {
      await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub)
      });
    } catch (e) {
      console.warn('Backend sync failed, stored in localStorage');
    }
  };

  const handleUpdateSubscription = async (id: string, updated: Partial<Subscription>, updatedUser?: Partial<User>) => {
    setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...updated } : s));
    if (updatedUser) {
      setUsers(prev => {
        // Cibler STRICTEMENT le compte administrateur du client, JAMAIS tous les utilisateurs du client
        const isClientAdminTarget = (u: User) => Boolean(
          (updatedUser.id && u.id === updatedUser.id) ||
          (updated.clientAdminId && u.id === updated.clientAdminId) ||
          (updated.clientAdminLogin && u.login && u.login.toLowerCase() === updated.clientAdminLogin.toLowerCase()) ||
          (u.clientId === id && (u.isClientAdmin || u.role === 'Administrateur Client'))
        );

        const found = prev.some(isClientAdminTarget);
        let updatedList: User[];
        if (found) {
          updatedList = prev.map(u => isClientAdminTarget(u) ? { ...u, ...updatedUser } : u);
        } else {
          updatedList = [...prev, updatedUser as User];
        }

        // Déduplication absolue par ID
        const map = new Map<string, User>();
        for (const u of updatedList) {
          if (u && u.id && !map.has(u.id)) {
            map.set(u.id, u);
          }
        }
        return Array.from(map.values());
      });
      setCurrentUser(prev => {
        if (!prev) return null;
        const isTarget = Boolean(
          (updatedUser.id && prev.id === updatedUser.id) ||
          (updated.clientAdminId && prev.id === updated.clientAdminId) ||
          (prev.clientId === id && (prev.isClientAdmin || prev.role === 'Administrateur Client'))
        );
        if (isTarget) {
          return { ...prev, ...updatedUser };
        }
        return prev;
      });
    }
    try {
      await fetch(`/api/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn('Backend sync failed, stored in localStorage');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    const targetSub = subscriptions.find(s => s.id === id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));

    if (targetSub) {
      // Si la licence supprimée était celle active sur le poste, on la réinitialise
      if (targetSub.licenseKey === activeLicenseKey) {
        setActiveLicenseKey('');
        localStorage.removeItem('hg_active_license');
      }

      // Supprimer également l'utilisateur administrateur client dédié (et tous les utilisateurs liés à ce client)
      setUsers(prev => prev.filter(u => {
        // Le Super Administrateur Ouaradtech ne doit JAMAIS être supprimé
        if (u.login?.toLowerCase() === 'ouaradtech' || u.id === 'usr-superadmin' || u.role === 'Super Administrateur') {
          return true;
        }
        if (targetSub.clientAdminId && u.id === targetSub.clientAdminId) return false;
        if (targetSub.clientAdminLogin && u.login?.toLowerCase() === targetSub.clientAdminLogin.toLowerCase()) return false;
        if (u.clientId && u.clientId === targetSub.id) return false;
        if (u.entreprise && u.entreprise.toLowerCase() === targetSub.entreprise.toLowerCase() && (u.isClientAdmin || u.role === 'Administrateur Client')) return false;
        return true;
      }));
    }

    try {
      await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend sync failed, stored in localStorage');
    }
  };

  const handleActivateLicenseKey = async (key: string) => {
    setActiveLicenseKey(key);
    try {
      const res = await fetch('/api/subscriptions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: key })
      });
      const data = await res.json();
      if (data.subscription) {
        setSubscriptions(prev => prev.map(s => s.licenseKey === key ? { ...s, ...data.subscription, cleActilee: true, statut: 'Actif' } : s));
      }
    } catch (e) {
      console.warn('Backend sync failed, stored in localStorage');
    }
  };

  // Activation ou renouvellement de licence pour le client
  // La durée de validité démarre précisément au moment de cette activation
  const handleClientActivateOrRenew = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const formatCheck = validateLicenseKeyFormat(cleanCode);
    if (!formatCheck.isValid) {
      throw new Error(formatCheck.reason || 'Code de licence à 36 caractères requis.');
    }

    // 1. Tenter l'activation via le backend Express
    let backendSub: Subscription | null = null;
    try {
      const res = await fetch('/api/subscriptions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: formatCheck.normalizedKey,
          user: currentUser ? `${currentUser.prenom} ${currentUser.nom} (@${currentUser.login})` : 'Client'
        })
      });
      const data = await res.json();
      if (data.success && data.subscription) {
        backendSub = data.subscription;
      }
    } catch (e) {
      console.warn('Backend activation offline notice');
    }

    // 2. Trouver l'abonnement
    let targetSub = backendSub || subscriptions.find(s => {
      const matchKey = s.licenseKey.replace(/[^A-Z0-9]/g, '') === cleanCode.replace(/[^A-Z0-9]/g, '');
      return s.licenseKey === cleanCode || matchKey;
    });

    if (!targetSub) {
      throw new Error('Code de licence introuvable. Veuillez vérifier votre clé officielle à 36 caractères remise par OuaradTech.');
    }

    // 3. Calcul de la période : le début de la licence commencera précisément aujourd'hui
    const today = new Date();
    const duration = targetSub.durationDays || getPlanDurationDays(targetSub.plan);
    const expiration = new Date(today);
    expiration.setDate(today.getDate() + duration);

    const todayStr = today.toISOString().split('T')[0];
    const expStr = expiration.toISOString().split('T')[0];

    const activatedSub: Subscription = {
      ...(backendSub || targetSub),
      dateEmission: todayStr,
      dateActivation: today.toISOString(),
      dateExpiration: expStr,
      cleActilee: true,
      statut: 'Actif'
    };

    setSubscriptions(prev => {
      const exists = prev.some(s => s.id === activatedSub.id);
      if (exists) {
        return prev.map(s => s.id === activatedSub.id ? activatedSub : s);
      }
      return [activatedSub, ...prev];
    });

    setActiveLicenseKey(activatedSub.licenseKey);

    // Rattacher l'utilisateur courant à cette entreprise/clientId et persister en session
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        clientId: activatedSub.id,
        entreprise: activatedSub.entreprise,
        isClientAdmin: currentUser.isClientAdmin ?? true
      };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      if (localStorage.getItem('hg_auth_user')) {
        localStorage.setItem('hg_auth_user', JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem('hg_auth_user', JSON.stringify(updatedUser));
      }
    }

    try {
      await fetch(`/api/subscriptions/${activatedSub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activatedSub)
      });
    } catch (e) {
      // offline fallback
    }

    setSaveBanner(`Licence activée avec succès pour ${activatedSub.entreprise} ! Période démarrée du ${todayStr} au ${expStr}.`);
    setTimeout(() => setSaveBanner(null), 6000);

    return activatedSub;
  };

  const handleUpdateSecurityConfig = async (cfg: Partial<SecurityConfig>) => {
    setSecurityConfig(prev => ({ ...prev, ...cfg }));
    try {
      await fetch('/api/security/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg)
      });
    } catch (e) {
      console.warn('Backend sync failed, stored in localStorage');
    }
  };

  const handleToggleEmergencyLockdown = async (enable: boolean, pin: string, reason?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/security/lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, enable, reason })
      });
      const data = await res.json();
      if (data.success) {
        setSecurityConfig(data.securityConfig);
        return true;
      }
      return false;
    } catch (e) {
      if (pin === 'MAROC2026' || pin === securityConfig.masterPinCode) {
        setSecurityConfig(prev => ({ ...prev, emergencyLockdown: enable, lockdownReason: reason }));
        return true;
      }
      return false;
    }
  };

  // Helper to open a specific subtab in Gestion
  const handleNavigateToGestion = (subTab: GestionSubTab) => {
    if (subTab === 'utilisateurs') {
      setActiveTab('utilisateurs');
    } else {
      setActiveTab('gestion');
      setGestionSubTab(subTab);
    }
    setIsGestionDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  // --- ÉCRAN DE LOGIN OBLIGATOIRE AU DÉMARRAGE SI NON AUTHENTIFIÉ ---
  if (!currentUser) {
    return (
      <div data-theme={currentTheme}>
        <LoginScreen users={users} subscriptions={subscriptions} onLoginSuccess={setCurrentUser} />
      </div>
    );
  }

  // --- 1. PREMIER LOGIN DES COMPTES CLIENTS : ACTIVATION OBLIGATOIRE DE LA LICENCE ---
  // Le client doit entrer son code d'activation 36 caractères pour démarrer sa licence
  if (isClientActivationRequired) {
    return (
      <div data-theme={currentTheme}>
        <ClientLicenseActivationScreen
          currentUser={currentUser}
          clientSub={clientSub}
          onActivate={handleClientActivateOrRenew}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // --- 2. ÉCHÉANCE ATTEINTE : L'APPLICATION S'ARRÊTE DE FONCTIONNER POUR LE CLIENT ---
  if (isClientLicenseExpired) {
    return (
      <div data-theme={currentTheme}>
        <ClientLicenseExpiredScreen
          currentUser={currentUser}
          clientSub={clientSub}
          onRenew={handleClientActivateOrRenew}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen app-shell bg-slate-950 text-slate-100 flex flex-col">
      {/* 3. AVERTISSEMENT DE RENOUVELLEMENT DE LICENCE (1 MOIS AVANT ÉCHÉANCE <= 30 JOURS) */}
      {isClientLicenseExpiringSoon && clientSub && (
        <ClientLicenseWarningBanner
          clientSub={clientSub}
          daysRemaining={clientDaysRemaining}
          onOpenRenewalModal={() => setIsRenewalModalOpen(true)}
        />
      )}

      {/* Top Notification Save Banner */}
      {saveBanner && (
        <div className="no-print bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 stroke-[3]" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Top Industrial Navigation Bar (No-Print) */}
      <header className="no-print bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Plant Title */}
            <div 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
                <Fuel className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-industrial font-bold text-base sm:text-lg tracking-wider text-slate-100 flex items-center gap-1.5">
                    GASOILPRO <span className="text-amber-400">MAROC</span>
                  </h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 flex items-center gap-1">
                    <span>🇲🇦</span>
                    <span>v4.6 PRO</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Supervision & Gestion Carburant • Citernes, Flotte & Opérateurs (Royaume du Maroc)
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links (Filtrés dynamiquement selon les habilitations du profil ou Super Admin) */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
              {canAccessMenu('dashboard') && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Gauge className="w-4 h-4" />
                  <span>Tableau de Bord</span>
                </button>
              )}

              {canAccessMenu('entries') && (
                <button
                  onClick={() => setActiveTab('entries')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'entries'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Entrées / Dépotages</span>
                </button>
              )}

              {canAccessMenu('dispenses') && (
                <button
                  onClick={() => setActiveTab('dispenses')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'dispenses'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Fuel className="w-4 h-4" />
                  <span>Sorties / Pleins</span>
                </button>
              )}

              {/* MENU RAPPORTS SORTIES GASOIL (En fonction Engin, Véhicule, Mois - CSV, Excel, PDF) */}
              {canAccessMenu('reports') && (
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'reports'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Rapports Sorties Gasoil : par engin, véhicule et mois (formats CSV, Excel, PDF)"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Rapports Sorties Gasoil</span>
                </button>
              )}

              {/* MENU UTILISATEURS ACTIVÉ (Géré par Super Admin) */}
              {canAccessMenu('users') && (
                <button
                  onClick={() => setActiveTab('utilisateurs')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'utilisateurs'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={isRegularUser ? "Mon Compte Utilisateur & Profil" : "Gestion des Utilisateurs, Clients et Habilitations Menus"}
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>{isRegularUser ? 'Mon Compte' : 'Utilisateurs & Droits'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono-num font-bold ${
                    activeTab === 'utilisateurs'
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {isSuperAdmin ? users.length : clientVisibleUsers.length}
                  </span>
                </button>
              )}

              {/* MENU GESTION (Unified management and local storage) */}
              {canAccessMenu('gestion') && (
                <div className="relative" ref={dropdownRef}>
                  <div className="flex items-center">
                    <button
                      onClick={() => {
                        setActiveTab('gestion');
                        setIsGestionDropdownOpen(false);
                      }}
                      className={`px-3 py-2 rounded-l-lg flex items-center gap-1.5 transition cursor-pointer ${
                        activeTab === 'gestion'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800 border-r border-slate-700/50'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Menu Gestion</span>
                    </button>
                    <button
                      onClick={() => setIsGestionDropdownOpen(!isGestionDropdownOpen)}
                      className={`px-2 py-2 rounded-r-lg transition cursor-pointer ${
                        activeTab === 'gestion'
                          ? 'bg-amber-600 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Dérouler les sous-modules de gestion"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isGestionDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Dropdown Menu for Gestion */}
                  {isGestionDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in">
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                        Gestion du Site Industriel
                      </div>
                      
                      <button
                        onClick={() => handleNavigateToGestion('utilisateurs')}
                        className={`w-full px-3 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                          activeTab === 'gestion' && gestionSubTab === 'utilisateurs' ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-400" />
                          <span>{isRegularUser ? '1. Mon Compte & Profil' : '1. Habilitations & Utilisateurs'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono-num bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {clientVisibleUsers.length}
                        </span>
                      </button>

                      <button
                        onClick={() => handleNavigateToGestion('coordonnees_client')}
                        className={`w-full px-3 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                          activeTab === 'gestion' && gestionSubTab === 'coordonnees_client' ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400" />
                          <span>2. Coordonnées & En-tête Client</span>
                        </div>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/30">
                          Bons & Tickets
                        </span>
                      </button>

                      <button
                        onClick={() => handleNavigateToGestion('citernes')}
                        className={`w-full px-3 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                          activeTab === 'gestion' && gestionSubTab === 'citernes' ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-amber-400" />
                          <span>3. Gestion Citernes</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono-num bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {visibleCiternes.length}
                        </span>
                      </button>

                      <button
                        onClick={() => handleNavigateToGestion('types_engins')}
                        className={`w-full px-3 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                          activeTab === 'gestion' && gestionSubTab === 'types_engins' ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                          <span>4. Types d'Engins</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono-num bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {visibleVehicleTypes.length}
                        </span>
                      </button>

                      <button
                        onClick={() => handleNavigateToGestion('fournisseurs')}
                        className={`w-full px-3 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                          activeTab === 'gestion' && gestionSubTab === 'fournisseurs' ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-400" />
                          <span>5. Gestion Fournisseurs</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono-num bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {visibleFournisseurs.length}
                        </span>
                      </button>

                      <button
                        onClick={() => handleNavigateToGestion('parc_vehicules')}
                        className={`w-full px-3 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                          activeTab === 'gestion' && gestionSubTab === 'parc_vehicules' ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-cyan-400" />
                          <span>6. Parc Véhicules & Flotte</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono-num bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {visibleVehicles.length}
                        </span>
                      </button>

                      <div className="pt-1 mt-1 border-t border-slate-800">
                        <button
                          onClick={() => handleNavigateToGestion('themes')}
                          className={`w-full px-3 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                            activeTab === 'gestion' && gestionSubTab === 'themes' ? 'text-amber-400 font-bold bg-slate-800/60' : 'text-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-amber-400" />
                            <span>Thèmes Graphiques</span>
                          </div>
                        </button>

                        <button
                          onClick={() => handleNavigateToGestion('stockage_local')}
                          className={`w-full px-3 py-2.5 text-left flex items-center justify-between text-xs hover:bg-slate-800 transition ${
                            activeTab === 'gestion' && gestionSubTab === 'stockage_local' ? 'text-emerald-400 font-bold bg-slate-800/60' : 'text-emerald-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-emerald-400" />
                            <span>Stockage Local & Sauvegardes</span>
                          </div>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                            Persistant
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {canAccessMenu('architecture') && (
                <button
                  onClick={() => setActiveTab('architecture')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'architecture'
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : 'text-blue-400 hover:text-blue-300 hover:bg-slate-800 border border-blue-900/50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Architecture</span>
                </button>
              )}

              {/* MENU CONTRÔLE TOTAL & ABONNEMENTS (CODES 36 CARACTÈRES) - STRICTEMENT RÉSERVÉ AU SUPER ADMIN OUARADTECH */}
              {isSuperAdmin && canAccessMenu('controle_total') && (
                <button
                  onClick={() => setActiveTab('controle_total')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'controle_total'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800 border border-amber-500/30'
                  }`}
                  title="Panneau de Contrôle Total & Vente des Abonnements (Super Admin OuaradTech)"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Contrôle Total</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono-num font-bold ${
                    activeTab === 'controle_total'
                      ? 'bg-slate-950 text-amber-400'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    36-Chars
                  </span>
                </button>
              )}
            </nav>

            {/* Live Clock, User Session & Status Badge */}
            <div className="flex items-center gap-2.5">
              {/* Badge Licence Marocaine Active / Activation Modal trigger */}
              <button
                type="button"
                onClick={() => {
                  if (isSuperAdmin) {
                    setIsActivationModalOpen(true);
                  } else if (isCurrentClientAdmin) {
                    setIsRenewalModalOpen(true);
                  }
                }}
                title={
                  isSuperAdmin 
                    ? "Gérer ou activer votre clé de licence à 36 caractères" 
                    : isCurrentClientAdmin 
                      ? "État et renouvellement de votre licence d'établissement" 
                      : "Statut de la licence entreprise en cours"
                }
                className={`flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                  (clientSub ? clientDaysRemaining : getDaysRemaining(subscriptions.find(s => s.licenseKey === activeLicenseKey)?.dateExpiration || '')) <= 30
                    ? 'border-amber-500/60 text-amber-300'
                    : 'border-amber-500/30 text-slate-200 hover:text-white'
                }`}
              >
                <span className="text-xs">🇲🇦</span>
                <span className="hidden xl:inline text-slate-400 text-[11px]">Licence :</span>
                <span className={`font-mono-num font-bold text-[11px] ${
                  (clientSub ? clientDaysRemaining : getDaysRemaining(subscriptions.find(s => s.licenseKey === activeLicenseKey)?.dateExpiration || '')) <= 30
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {clientSub 
                    ? `${clientDaysRemaining}j`
                    : (subscriptions.find(s => s.licenseKey === activeLicenseKey) 
                        ? `${getDaysRemaining(subscriptions.find(s => s.licenseKey === activeLicenseKey)?.dateExpiration || '')}j`
                        : 'Active')
                  }
                </span>
              </button>

              <button
                type="button"
                onClick={handleForceSaveLocal}
                title="Enregistrer manuellement toutes les tables localement"
                className="hidden lg:flex items-center gap-1.5 bg-slate-950 hover:bg-slate-850 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Stockage Local</span>
              </button>

              <div className="hidden xl:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono-num text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentTime}</span>
              </div>

              {/* Connected User Badge & Logout */}
              {currentUser && (
                isSuperAdmin ? (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-amber-950/70 via-yellow-950/40 to-slate-950 px-2.5 py-1.5 rounded-xl border border-amber-500/50 shadow-sm shadow-amber-500/20 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-bold shadow shrink-0">
                      <Crown className="w-4 h-4 fill-slate-950" />
                    </div>
                    <div className="hidden lg:block text-left leading-tight">
                      <div className="font-extrabold text-amber-300 truncate max-w-[140px] flex items-center gap-1">
                        <span>ouaradtech</span>
                        <span className="text-[9px] bg-amber-500/30 text-amber-200 px-1 py-0.2 rounded border border-amber-500/40">TOUS DROITS</span>
                      </div>
                      <div className="text-[10px] text-amber-200/80 font-mono">
                        Super Administrateur
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Se déconnecter (Verrouiller le poste)"
                      className="p-1.5 rounded-lg hover:bg-red-950/80 text-slate-400 hover:text-red-400 transition cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline text-[10px] text-red-400 font-semibold">Quitter</span>
                    </button>
                  </div>
                ) : isCurrentClientAdmin ? (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/70 px-2.5 py-1.5 rounded-xl border border-sky-500/40 shadow-sm text-xs">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="hidden lg:block text-left leading-tight">
                      <div className="font-extrabold text-sky-300 truncate max-w-[150px] flex items-center gap-1">
                        <span className="truncate">{currentUser.entreprise || currentUser.nom}</span>
                        <span className="text-[9px] bg-sky-500/30 text-sky-200 px-1 py-0.2 rounded border border-sky-500/40 font-mono">ADMIN CLIENT</span>
                      </div>
                      <div className="text-[10px] text-sky-200/80 truncate max-w-[150px]">
                        {currentUser.prenom} {currentUser.nom} (@{currentUser.login})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Se déconnecter (Verrouiller le poste)"
                      className="p-1.5 rounded-lg hover:bg-red-950/80 text-slate-400 hover:text-red-400 transition cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline text-[10px] text-red-400 font-semibold">Quitter</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUser.prenom[0]}{currentUser.nom[0]}
                    </div>
                    <div className="hidden lg:block text-left leading-tight">
                      <div className="font-bold text-slate-200 truncate max-w-[120px]">
                        {currentUser.prenom} {currentUser.nom}
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-medium">
                        {currentUser.role}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Se déconnecter (Verrouiller le poste)"
                      className="p-1.5 rounded-lg hover:bg-red-950/80 text-slate-400 hover:text-red-400 transition cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline text-[10px] text-red-400 font-semibold">Quitter</span>
                    </button>
                  </div>
                )
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1.5 text-xs">
            {/* Mobile User Profile Header */}
            {currentUser && (
              <div className={`p-2.5 mb-2 rounded-xl border flex items-center justify-between ${
                isSuperAdmin ? 'bg-amber-950/30 border-amber-500/40' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isSuperAdmin 
                      ? 'bg-amber-500 text-slate-950 font-black' 
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {isSuperAdmin ? <Crown className="w-4 h-4 fill-slate-950" /> : `${currentUser.prenom[0]}${currentUser.nom[0]}`}
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 flex items-center gap-1">
                      <span>{currentUser.prenom} {currentUser.nom}</span>
                      {isSuperAdmin && <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1 rounded">Super Admin</span>}
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono">{currentUser.role} ({currentUser.matricule})</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}

            {canAccessMenu('dashboard') && (
              <button
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 font-semibold ${
                  activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-200'
                }`}
              >
                <Gauge className="w-4 h-4" /> Tableau de Bord & Jauges
              </button>
            )}

            {canAccessMenu('entries') && (
              <button
                onClick={() => { setActiveTab('entries'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 font-semibold ${
                  activeTab === 'entries' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-200'
                }`}
              >
                <ArrowDownToLine className="w-4 h-4" /> Entrées de Stock & BL
              </button>
            )}

            {canAccessMenu('dispenses') && (
              <button
                onClick={() => { setActiveTab('dispenses'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 font-semibold ${
                  activeTab === 'dispenses' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-200'
                }`}
              >
                <Fuel className="w-4 h-4" /> Sorties / Pleins Carburant
              </button>
            )}

            {canAccessMenu('reports') && (
              <button
                onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 font-semibold ${
                  activeTab === 'reports' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" /> Rapports Sorties Gasoil (Mois/Engin/Véhicule)
              </button>
            )}

            {/* Mobile Utilisateurs Button */}
            {canAccessMenu('users') && (
              <button
                onClick={() => { setActiveTab('utilisateurs'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-semibold ${
                  activeTab === 'utilisateurs' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>{isRegularUser ? 'Mon Compte & Profil' : 'Habilitations & Utilisateurs Usine'}</span>
                </div>
                <span className="font-mono-num text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">({isSuperAdmin ? users.length : clientVisibleUsers.length})</span>
              </button>
            )}

            {/* Mobile Gestion Section */}
            {canAccessMenu('gestion') && (
              <div className="pt-2 border-t border-slate-800">
                <div className="px-3 py-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  <span>Centre de Gestion & Administration</span>
                </div>
                <div className="space-y-1 pl-2">
                  <button
                    onClick={() => handleNavigateToGestion('utilisateurs')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-semibold ${
                      activeTab === 'gestion' && gestionSubTab === 'utilisateurs' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>{isRegularUser ? '1. Mon Compte & Profil' : '1. Habilitations & Utilisateurs'}</span>
                    </div>
                    <span className="font-mono-num text-[10px] text-slate-400">({isSuperAdmin ? users.length : clientVisibleUsers.length})</span>
                  </button>
                  <button
                    onClick={() => handleNavigateToGestion('coordonnees_client')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-semibold ${
                      activeTab === 'gestion' && gestionSubTab === 'coordonnees_client' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-400" />
                      <span>2. Coordonnées & En-tête Client</span>
                    </div>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/30">Bons & Tickets</span>
                  </button>
                  <button
                    onClick={() => handleNavigateToGestion('citernes')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-semibold ${
                      activeTab === 'gestion' && gestionSubTab === 'citernes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>3. Gestion Citernes</span>
                    </div>
                    <span className="font-mono-num text-[10px] text-slate-400">({citernes.length})</span>
                  </button>
                  <button
                    onClick={() => handleNavigateToGestion('types_engins')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-semibold ${
                      activeTab === 'gestion' && gestionSubTab === 'types_engins' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                      <span>4. Types d'Engins</span>
                    </div>
                    <span className="font-mono-num text-[10px] text-slate-400">({vehicleTypes.length})</span>
                  </button>
                  <button
                    onClick={() => handleNavigateToGestion('fournisseurs')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-semibold ${
                      activeTab === 'gestion' && gestionSubTab === 'fournisseurs' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>4. Gestion Fournisseurs</span>
                    </div>
                    <span className="font-mono-num text-[10px] text-slate-400">({fournisseurs.length})</span>
                  </button>
                  <button
                    onClick={() => handleNavigateToGestion('parc_vehicules')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-semibold ${
                      activeTab === 'gestion' && gestionSubTab === 'parc_vehicules' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-cyan-400" />
                      <span>5. Parc Véhicules & Flotte</span>
                    </div>
                    <span className="font-mono-num text-[10px] text-slate-400">({vehicles.length})</span>
                  </button>

                  <button
                    onClick={() => handleNavigateToGestion('themes')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-semibold ${
                      activeTab === 'gestion' && gestionSubTab === 'themes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      <span>6. Thèmes Graphiques</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavigateToGestion('stockage_local')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-semibold ${
                      activeTab === 'gestion' && gestionSubTab === 'stockage_local' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      <span>7. Stockage Local & Sauvegardes</span>
                    </div>
                    <span className="font-mono-num text-[10px] font-bold">Persistant</span>
                  </button>
                </div>
              </div>
            )}

            {canAccessMenu('architecture') && (
              <button
                onClick={() => { setActiveTab('architecture'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 font-semibold ${
                  activeTab === 'architecture' ? 'bg-blue-600 text-white font-bold' : 'text-blue-400'
                }`}
              >
                <FileText className="w-4 h-4" /> Architecture Technique & DDL
              </button>
            )}

            {isSuperAdmin && canAccessMenu('controle_total') && (
              <button
                onClick={() => { setActiveTab('controle_total'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between font-semibold ${
                  activeTab === 'controle_total' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  <span>Contrôle Total & Abonnements</span>
                </div>
                <span className="font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-bold">
                  36 Chars
                </span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Module Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            citernes={visibleCiternes}
            vehicles={visibleVehicles}
            entries={visibleEntries}
            dispenses={visibleDispenses}
            alerts={visibleAlerts}
            onUpdateCiterneLevel={handleUpdateCiterneLevel}
            onNavigateTab={(tab, subTab) => {
              setActiveTab(tab);
              if (subTab) setGestionSubTab(subTab);
            }}
            licenseWarning={!isSuperAdmin && clientSub && clientSub.cleActilee ? {
              daysRemaining: clientDaysRemaining,
              dateExpiration: clientSub.dateExpiration,
              entreprise: clientSub.entreprise
            } : null}
            onOpenRenewalModal={() => setIsRenewalModalOpen(true)}
            isSuperAdmin={isSuperAdmin}
          />
        )}

        {activeTab === 'entries' && (
          <StockEntriesModule
            entries={visibleEntries}
            citernes={visibleCiternes}
            fournisseurs={visibleFournisseurs}
            currentUser={currentUser}
            subscriptions={subscriptions}
            onAddStockEntry={handleAddStockEntry}
            onDeleteStockEntry={handleDeleteStockEntry}
          />
        )}

        {activeTab === 'dispenses' && (
          <FuelDispensesModule
            dispenses={visibleDispenses}
            vehicles={visibleVehicles}
            citernes={visibleCiternes}
            currentUser={currentUser}
            subscriptions={subscriptions}
            onAddDispense={handleAddDispense}
            onDeleteDispense={handleDeleteDispense}
            onOpenReports={() => setActiveTab('reports')}
          />
        )}

        {/* MENU DES RAPPORTS SORTIES GASOIL (PAR MOIS, PAR ENGIN, PAR VÉHICULE - CSV, EXCEL, PDF) */}
        {activeTab === 'reports' && (
          <FuelExitReportsModule
            dispenses={visibleDispenses}
            vehicles={visibleVehicles}
            citernes={visibleCiternes}
            vehicleTypes={visibleVehicleTypes}
            currentUser={currentUser}
            subscriptions={subscriptions}
            onNavigateToDispenses={() => setActiveTab('dispenses')}
          />
        )}

        {/* ACTIVATION DU MENU GESTION DES UTILISATEURS & OPÉRATEURS */}
        {activeTab === 'utilisateurs' && (
          <UsersModule
            users={clientVisibleUsers}
            currentUser={currentUser}
            subscriptions={subscriptions}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {activeTab === 'gestion' && (
          <GestionHub
            initialSubTab={gestionSubTab}
            currentUser={currentUser}
            subscriptions={subscriptions}
            users={clientVisibleUsers}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            citernes={visibleCiternes}
            onAddCiterne={handleAddCiterne}
            onUpdateCiterne={handleUpdateCiterne}
            onDeleteCiterne={handleDeleteCiterne}
            onUpdateCiterneLevel={handleUpdateCiterneLevel}
            vehicleTypes={visibleVehicleTypes}
            onAddVehicleType={handleAddVehicleType}
            onUpdateVehicleType={handleUpdateVehicleType}
            onDeleteVehicleType={handleDeleteVehicleType}
            fournisseurs={visibleFournisseurs}
            onAddFournisseur={handleAddFournisseur}
            onUpdateFournisseur={handleUpdateFournisseur}
            onDeleteFournisseur={handleDeleteFournisseur}
            vehicles={visibleVehicles}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onImportVehicles={handleImportVehicles}
            currentTheme={currentTheme}
            onSelectTheme={setCurrentTheme}
            storageStats={{
              citernesCount: visibleCiternes.length,
              vehiclesCount: visibleVehicles.length,
              entriesCount: visibleEntries.length,
              dispensesCount: visibleDispenses.length,
              usersCount: clientVisibleUsers.length,
              fournisseursCount: visibleFournisseurs.length,
              vehicleTypesCount: visibleVehicleTypes.length,
              alertsCount: visibleAlerts.length
            }}
            onForceSaveLocal={handleForceSaveLocal}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetDemo={handlePerformReset}
            onSaveToGasoilProDisk={handleSaveToGasoilProDisk}
            onLoadFromGasoilProDisk={handleLoadFromGasoilProDisk}
            onUpdateSubscription={(sub) => handleUpdateSubscription(sub.id, sub)}
            entries={visibleEntries}
            dispenses={visibleDispenses}
            onDataLoadedFromCloud={handleDataLoadedFromCloud}
          />
        )}

        {/* PANNEAU CONTRÔLE TOTAL & ABONNEMENTS */}
        {activeTab === 'controle_total' && (
          <MasterControlModule
            subscriptions={subscriptions}
            activeLicenseKey={activeLicenseKey}
            securityConfig={securityConfig}
            auditLogs={auditLogs}
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onAddSubscription={handleAddSubscription}
            onUpdateSubscription={handleUpdateSubscription}
            onDeleteSubscription={handleDeleteSubscription}
            onActivateLicenseKey={handleActivateLicenseKey}
            onUpdateSecurityConfig={handleUpdateSecurityConfig}
            onToggleEmergencyLockdown={handleToggleEmergencyLockdown}
            onExportBackup={handleExportBackup}
            onImportBackup={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const json = JSON.parse(e.target?.result as string);
                  handleImportBackup(json);
                } catch {
                  alert('Fichier de sauvegarde invalide.');
                }
              };
              reader.readAsText(file);
            }}
            onOpenActivationModal={() => setIsActivationModalOpen(true)}
            onResetSystem={handleResetAllData}
          />
        )}

        {activeTab === 'architecture' && isSuperAdmin && (
          <ArchitectureModal />
        )}
      </main>

      {/* Industrial Footer (No-Print) */}
      <footer className="no-print bg-slate-900/80 border-t border-slate-800 py-4 px-4 sm:px-8 mt-auto text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">GasoilPro Plant System</span>
            <span className="text-slate-600">•</span>
            <span>Supervision & Contrôle Métrologique • Enregistrement Local C:\gasoilpro</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigateToGestion('themes')}
              className="text-slate-400 hover:text-amber-400 transition flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <Palette className="w-3 h-3 text-amber-400" />
              <span>Thème: {AVAILABLE_THEMES.find(t => t.id === currentTheme)?.nom || currentTheme}</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={handleForceSaveLocal}
              className="text-slate-400 hover:text-emerald-400 transition flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <HardDrive className="w-3 h-3 text-emerald-400" />
              <span>Données Locales Sécurisées</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Confirm Reset Demo Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Réinitialiser les données de démo"
        message="Êtes-vous sûr de vouloir réinitialiser l'application ? Toutes les modifications locales seront effacées et remplacées par les données d'usine par défaut."
        detail="Cette action restaurera les citernes, véhicules, utilisateurs, types d'engins, fournisseurs et historiques de transactions d'origine."
        confirmLabel="Réinitialiser Tout"
        onConfirm={handlePerformReset}
        onCancel={() => setIsResetModalOpen(false)}
      />

      {/* Modal d'Activation et de Contrôle de Licence 36 Caractères */}
      <LicenseActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        activeSubscription={subscriptions.find(s => s.licenseKey === activeLicenseKey) || null}
        onActivateSuccess={(activatedSub) => {
          setActiveLicenseKey(activatedSub.licenseKey);
          setSubscriptions(prev => {
            const exists = prev.some(s => s.licenseKey === activatedSub.licenseKey);
            if (exists) {
              return prev.map(s => s.licenseKey === activatedSub.licenseKey ? { ...s, ...activatedSub, cleActilee: true, statut: 'Actif' } : s);
            }
            return [activatedSub, ...prev];
          });
        }}
      />

      {/* Modal de Renouvellement de Licence pour le Client */}
      <ClientLicenseRenewalModal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        clientSub={clientSub}
        onRenew={handleClientActivateOrRenew}
      />

      {/* Avertissement Quotidien Automatique de Renouvellement à 10h00 (Durée 5 minutes) */}
      <DailyLicenseWarningModal
        clientSub={clientSub}
        daysRemaining={clientDaysRemaining}
        onOpenRenewalModal={() => setIsRenewalModalOpen(true)}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
