import { User, UserRole, UserPermissions, Subscription } from '../types';

export const SUPER_ADMIN_CREDENTIALS = {
  login: 'ouaradtech',
  motDePasse: 'Ouaradtech26@'
};

export const FULL_PERMISSIONS: UserPermissions = {
  menus: {
    dashboard: true,
    entries: true,
    dispenses: true,
    reports: true,
    citernes: true,
    vehicles: true,
    gestion: true,
    fournisseurs: true,
    users: true,
    repairs: true,
    alerts: true,
    architecture: true,
    controle_total: true
  },
  options: {
    canAddEntries: true,
    canAddDispenses: true,
    canExportReports: true,
    canPrintReceipts: true,
    canManageCiternes: true,
    canManageVehicles: true,
    canManageUsers: true,
    canManageSubscriptions: true,
    canManageSecurity: true,
    canEmergencyLockdown: true
  }
};

export const getDefaultPermissionsForClientAdmin = (): UserPermissions => ({
  menus: {
    dashboard: true,
    entries: true,
    dispenses: true,
    reports: true,
    citernes: true,
    vehicles: true,
    gestion: true,
    fournisseurs: true,
    users: true,
    repairs: true,
    alerts: true,
    architecture: false, // Réservé au Super Admin OuaradTech
    controle_total: false // Réservé au Super Admin OuaradTech
  },
  options: {
    canAddEntries: true,
    canAddDispenses: true,
    canExportReports: true,
    canPrintReceipts: true,
    canManageCiternes: true,
    canManageVehicles: true,
    canManageUsers: true,
    canManageSubscriptions: false, // Réservé au Super Admin
    canManageSecurity: false,
    canEmergencyLockdown: false
  }
});

export const CLIENT_LICENSE_PRESETS = {
  standard: {
    nom: 'Pack Standard Exploitation',
    description: 'Gestion quotidienne carburant : entrées, distributions, citernes et rapports',
    permissions: {
      menus: {
        dashboard: true,
        entries: true,
        dispenses: true,
        citernes: true,
        vehicles: true,
        gestion: true,
        fournisseurs: true,
        users: false,
        repairs: true,
        alerts: true,
        architecture: false,
        controle_total: false
      },
      options: {
        canAddEntries: true,
        canAddDispenses: true,
        canExportReports: true,
        canPrintReceipts: true,
        canManageCiternes: true,
        canManageVehicles: true,
        canManageUsers: false,
        canManageSubscriptions: false,
        canManageSecurity: false,
        canEmergencyLockdown: false
      }
    } as UserPermissions
  },
  complet: {
    nom: 'Pack Intégral Pro (Dépôt & Flotte)',
    description: 'Contrôle complet des opérations client avec gestion de son équipe et maintenance',
    permissions: getDefaultPermissionsForClientAdmin()
  },
  consultation: {
    nom: 'Pack Consultation & Audit',
    description: 'Accès lecture seule aux indicateurs, jauges et historique avec export',
    permissions: {
      menus: {
        dashboard: true,
        entries: false,
        dispenses: true,
        citernes: true,
        vehicles: true,
        gestion: false,
        fournisseurs: false,
        users: false,
        repairs: false,
        alerts: true,
        architecture: false,
        controle_total: false
      },
      options: {
        canAddEntries: false,
        canAddDispenses: false,
        canExportReports: true,
        canPrintReceipts: false,
        canManageCiternes: false,
        canManageVehicles: false,
        canManageUsers: false,
        canManageSubscriptions: false,
        canManageSecurity: false,
        canEmergencyLockdown: false
      }
    } as UserPermissions
  }
};

export const createClientAdminUser = (
  subscription: Partial<Subscription>, 
  custom?: {
    login?: string;
    motDePasse?: string;
    nom?: string;
    prenom?: string;
    email?: string;
    telephone?: string;
    permissions?: UserPermissions;
  }
): User => {
  const entrepriseName = subscription.entreprise || 'Client Inconnu';
  const cleanEnterpriseSlug = entrepriseName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);

  const subId = subscription.id || `SUB-${Date.now().toString().slice(-4)}`;
  const defaultLogin = custom?.login || subscription.clientAdminLogin || `admin_${cleanEnterpriseSlug || 'client'}`;
  const defaultPassword = custom?.motDePasse || subscription.clientAdminPassword || `Client${cleanEnterpriseSlug.slice(0, 4).toUpperCase()}2026@`;
  const defaultNom = custom?.nom || subscription.clientAdminNom || subscription.clientName || entrepriseName;
  const defaultPrenom = custom?.prenom || 'Admin';

  const defaultPermissions = subscription.licensePermissions || 
    custom?.permissions || 
    getDefaultPermissionsForClientAdmin();

  return {
    id: subscription.clientAdminId || `usr-admin-${subId.toLowerCase()}`,
    matricule: `ADM-CLI-${subId.replace('SUB-', '').slice(-4)}`,
    login: defaultLogin,
    motDePasse: defaultPassword,
    nom: defaultNom,
    prenom: defaultPrenom,
    role: 'Administrateur Client',
    email: custom?.email || subscription.clientAdminEmail || `${defaultLogin}@${cleanEnterpriseSlug || 'client'}.ma`,
    telephone: custom?.telephone || subscription.clientAdminTelephone || subscription.telephone || '+212 6 61 00 00 00',
    statut: 'Actif',
    badgeCode: `RFID-CLI-${subId.slice(-4)}`,
    departement: `Direction ${entrepriseName}`,
    dateCreation: new Date().toISOString().split('T')[0],
    clientId: subscription.id,
    entreprise: entrepriseName,
    isClientAdmin: true,
    permissions: defaultPermissions
  };
};

export const SUPER_ADMIN_USER: User = {
  id: 'usr-superadmin',
  matricule: 'OUARAD-001',
  login: 'ouaradtech',
  motDePasse: 'Ouaradtech26@',
  nom: 'OuaradTech',
  prenom: 'Super Admin',
  role: 'Super Administrateur',
  email: 'admin@ouaradtech.com',
  telephone: '+212 6 61 00 26 26',
  statut: 'Actif',
  badgeCode: 'RFID-SUPER-MASTER-001',
  departement: 'Direction Générale OuaradTech (Tous Droits)',
  dateCreation: '2024-01-01',
  permissions: FULL_PERMISSIONS
};

export const getDefaultPermissionsForRole = (role: UserRole): UserPermissions => {
  if (role === 'Super Administrateur') {
    return JSON.parse(JSON.stringify(FULL_PERMISSIONS));
  }

  if (role === 'Administrateur Client') {
    return getDefaultPermissionsForClientAdmin();
  }

  if (role === 'Administrateur') {
    return {
      menus: {
        dashboard: true,
        entries: true,
        dispenses: true,
        citernes: true,
        vehicles: true,
        gestion: true,
        fournisseurs: true,
        users: true,
        repairs: true,
        alerts: true,
        architecture: false, // Réservé au Super Admin OuaradTech
        controle_total: false // STRICTEMENT réservé au Super Admin OuaradTech (interdit aux comptes clients)
      },
      options: {
        canAddEntries: true,
        canAddDispenses: true,
        canExportReports: true,
        canPrintReceipts: true,
        canManageCiternes: true,
        canManageVehicles: true,
        canManageUsers: true,
        canManageSubscriptions: false,
        canManageSecurity: false,
        canEmergencyLockdown: false
      }
    };
  }

  if (role === 'Chef de Dépôt') {
    return {
      menus: {
        dashboard: true,
        entries: true,
        dispenses: true,
        citernes: true,
        vehicles: true,
        gestion: true,
        fournisseurs: true,
        users: false,
        repairs: true,
        alerts: true,
        architecture: false,
        controle_total: false
      },
      options: {
        canAddEntries: true,
        canAddDispenses: true,
        canExportReports: true,
        canPrintReceipts: true,
        canManageCiternes: true,
        canManageVehicles: true,
        canManageUsers: false,
        canManageSubscriptions: false,
        canManageSecurity: false,
        canEmergencyLockdown: false
      }
    };
  }

  if (role === 'Pompiste') {
    return {
      menus: {
        dashboard: true,
        entries: true,
        dispenses: true,
        citernes: true,
        vehicles: false,
        gestion: false,
        fournisseurs: false,
        users: false,
        repairs: false,
        alerts: true,
        architecture: false,
        controle_total: false
      },
      options: {
        canAddEntries: true,
        canAddDispenses: true,
        canExportReports: false,
        canPrintReceipts: true,
        canManageCiternes: false,
        canManageVehicles: false,
        canManageUsers: false,
        canManageSubscriptions: false,
        canManageSecurity: false,
        canEmergencyLockdown: false
      }
    };
  }

  if (role === 'Responsable Maintenance') {
    return {
      menus: {
        dashboard: true,
        entries: false,
        dispenses: true,
        citernes: true,
        vehicles: true,
        gestion: false,
        fournisseurs: true,
        users: false,
        repairs: true,
        alerts: true,
        architecture: false,
        controle_total: false
      },
      options: {
        canAddEntries: false,
        canAddDispenses: false,
        canExportReports: true,
        canPrintReceipts: false,
        canManageCiternes: false,
        canManageVehicles: true,
        canManageUsers: false,
        canManageSubscriptions: false,
        canManageSecurity: false,
        canEmergencyLockdown: false
      }
    };
  }

  if (role === 'Chauffeur / Opérateur') {
    return {
      menus: {
        dashboard: true,
        entries: false,
        dispenses: true,
        citernes: false,
        vehicles: true,
        gestion: false,
        fournisseurs: false,
        users: false,
        repairs: false,
        alerts: false,
        architecture: false,
        controle_total: false
      },
      options: {
        canAddEntries: false,
        canAddDispenses: false,
        canExportReports: false,
        canPrintReceipts: false,
        canManageCiternes: false,
        canManageVehicles: false,
        canManageUsers: false,
        canManageSubscriptions: false,
        canManageSecurity: false,
        canEmergencyLockdown: false
      }
    };
  }

  // Client / Opérateur Invité (Consultation)
  return {
    menus: {
      dashboard: true,
      entries: false,
      dispenses: true,
      citernes: true,
      vehicles: true,
      gestion: false,
      fournisseurs: false,
      users: false,
      repairs: false,
      alerts: true,
      architecture: false,
      controle_total: false
    },
    options: {
      canAddEntries: false,
      canAddDispenses: false,
      canExportReports: true,
      canPrintReceipts: false,
      canManageCiternes: false,
      canManageVehicles: false,
      canManageUsers: false,
      canManageSubscriptions: false,
      canManageSecurity: false,
      canEmergencyLockdown: false
    }
  };
};

export const ensureUserPermissions = (user: User): User => {
  if (user.role === 'Super Administrateur' || user.login?.toLowerCase() === 'ouaradtech') {
    return {
      ...user,
      role: 'Super Administrateur',
      permissions: JSON.parse(JSON.stringify(FULL_PERMISSIONS))
    };
  }

  const basePermissions = user.permissions || getDefaultPermissionsForRole(user.role);
  // RÈGLE CRITIQUE : Le menu Contrôle Total & Vente d'Abonnements est STRICTEMENT réservé au Super Admin OuaradTech
  // Aucun compte client (même administrateur) ne peut y accéder ou l'afficher !
  return {
    ...user,
    permissions: {
      ...basePermissions,
      menus: {
        ...basePermissions.menus,
        controle_total: false
      },
      options: {
        ...basePermissions.options,
        canManageSubscriptions: false
      }
    }
  };
};

export const deduplicateUsers = (userList: User[]): User[] => {
  const map = new Map<string, User>();
  for (const raw of userList) {
    if (!raw) continue;
    const u = ensureUserPermissions(raw);
    const key = (u.id || '').trim().toLowerCase();
    if (!key) continue;
    if (map.has(key)) {
      const prev = map.get(key)!;
      map.set(key, { ...prev, ...u });
    } else {
      map.set(key, u);
    }
  }

  const finalMap = new Map<string, User>();
  const seenLogins = new Set<string>();

  for (const u of map.values()) {
    const loginKey = (u.login || '').trim().toLowerCase();
    if (loginKey && seenLogins.has(loginKey)) {
      const existingKey = Array.from(finalMap.keys()).find(k => {
        const item = finalMap.get(k);
        return item && (item.login || '').trim().toLowerCase() === loginKey;
      });
      if (existingKey) {
        finalMap.set(existingKey, { ...finalMap.get(existingKey)!, ...u });
      }
    } else {
      if (loginKey) seenLogins.add(loginKey);
      finalMap.set(u.id, u);
    }
  }

  return Array.from(finalMap.values());
};
