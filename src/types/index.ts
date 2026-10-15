export type VehicleType = 'Camion Benne' | 'Pelleteuse' | 'Chargeuse' | 'Chariot Elévateur' | 'Groupe Electrogène' | 'Véhicule Léger' | 'Dumper';

export type VehicleStatus = 'Actif' | 'En Maintenance' | 'Hors Service';

export interface Vehicle {
  id: string;
  code: string; // Ex: ENG-104
  immatriculation: string;
  marque: string;
  modele: string;
  type: VehicleType;
  status: VehicleStatus;
  annee: number;
  kilometrageOuHeures: number;
  uniteMesure: 'km' | 'heures';
  capaciteReservoir: number; // en Litres
  consommationMoyenneTheorique: number; // L/100km ou L/h
  derniereConsoReelle?: number;
  dateMiseEnService: string;
  departement: string; // Ex: Carrière, Logistique, Usine, Energie
  clientId?: string; // Isolation client multi-tenant
  entreprise?: string;
}

export interface Citerne {
  id: string;
  code: string; // Ex: CIT-01
  nom: string;
  capaciteTotale: number; // Litres (ex: 50 000 L)
  stockActuel: number; // Litres
  seuilAlerteBas: number; // Litres (ex: 8 000 L)
  seuilCritique: number; // Litres (ex: 3 000 L)
  temperatureC: number;
  densiteKgL: number;
  typeGasoil: 'Gasoil Standard 10ppm' | 'Gasoil Non Routier (GNR)' | 'Gasoil Heavy Duty';
  emplacement: string;
  dernierControle: string;
  statut: 'Opérationnelle' | 'En Remplissage' | 'Maintenance';
  clientId?: string; // Isolation client multi-tenant
  entreprise?: string;
}

export interface StockEntry {
  id: string;
  numeroBon: string; // Ex: BL-2026-0492
  dateLivraison: string;
  fournisseur: string;
  chauffeurLivreur: string;
  immatriculationCiterneLivreur: string;
  citerneId: string;
  quantiteLivree: number; // Litres
  densiteMesuree: number;
  temperatureMesuree: number;
  poidsKg?: number; // Poids net en kg du gasoil (Litres * Densité)
  receptionnaireUsine: string;
  signatureBase64: string;
  notes?: string;
  statut: 'Validé' | 'En Attente';
  clientId?: string; // Isolation client multi-tenant
  entreprise?: string;
}

export interface FuelDispense {
  id: string;
  codeTicket: string; // Ex: SORT-2026-118
  dateHeure: string;
  citerneId: string;
  vehiculeId: string;
  pompiste: string;
  chauffeur: string;
  volumeLivre: number; // Litres
  compteurActuel: number; // km ou heures
  compteurPrecedent: number;
  deltaCompteur: number;
  ratioConsommation: number; // L/100km ou L/h calculé
  surconsommationAlerte: boolean;
  signatureChauffeur?: string;
  signaturePompiste?: string;
  remarques?: string;
  clientId?: string; // Isolation client multi-tenant
  entreprise?: string;
}

export type AppTheme = 
  | 'or-imperial' 
  | 'bleu-saphir' 
  | 'emeraude-prestige' 
  | 'platine-epure' 
  | 'cuivre-cognac'
  // Compatibilité avec les anciennes valeurs
  | 'sombre-ambre' 
  | 'chantier-orange' 
  | 'marine-bleu' 
  | 'eco-vert' 
  | 'atelier-clair';

export interface ThemeConfig {
  id: AppTheme;
  nom: string;
  description: string;
  accentHex: string;
  bgHex: string;
  accentClass: string;
  accentBgClass: string;
  borderAccentClass: string;
  isDark: boolean;
}

export type UserRole = 
  | 'Super Administrateur'
  | 'Administrateur' 
  | 'Administrateur Client'
  | 'Chef de Dépôt' 
  | 'Pompiste' 
  | 'Chauffeur / Opérateur' 
  | 'Responsable Maintenance'
  | 'Client / Opérateur Invité';

export type UserStatus = 'Actif' | 'Inactif' | 'Suspendu';

export interface UserMenuPermissions {
  dashboard: boolean;
  entries: boolean;
  dispenses: boolean;
  reports?: boolean;
  citernes: boolean;
  vehicles: boolean;
  gestion: boolean;
  fournisseurs: boolean;
  users: boolean;
  repairs: boolean;
  alerts: boolean;
  architecture: boolean;
  controle_total: boolean;
}

export interface UserOptionPermissions {
  canAddEntries: boolean;
  canAddDispenses: boolean;
  canExportReports: boolean;
  canPrintReceipts: boolean;
  canManageCiternes: boolean;
  canManageVehicles: boolean;
  canManageUsers: boolean;
  canManageSubscriptions: boolean;
  canManageSecurity: boolean;
  canEmergencyLockdown: boolean;
}

export interface UserPermissions {
  menus: UserMenuPermissions;
  options: UserOptionPermissions;
}

export interface User {
  id: string;
  matricule: string; // Ex: USR-001
  login?: string; // Identifiant de connexion
  motDePasse?: string; // Mot de passe sécurisé
  nom: string;
  prenom: string;
  role: UserRole;
  email: string;
  telephone: string;
  statut: UserStatus;
  badgeCode: string; // Code RFID ou PIN
  departement: string;
  dateCreation: string;
  dernierAcces?: string;
  permissions?: UserPermissions;
  clientId?: string; // ID du client / abonnement rattaché
  entreprise?: string; // Entreprise cliente associée
  isClientAdmin?: boolean; // Indicateur administrateur de client
  createdBy?: string; // Login ou ID de l'administrateur créateur (isolation stricte par compte client)
}

export interface Repair {
  id: string;
  reference: string; // Ex: REP-2026-088
  dateIntervention: string;
  cibleType: 'Véhicule' | 'Pompe & Volucompteur' | 'Citerne' | 'Pistolet / Flexible';
  cibleId: string;
  cibleLibelle: string;
  technicien: string;
  typeIntervention: 'Préventive' | 'Curative' | 'Etalonnage Volucompteur';
  description: string;
  piecesRemplacees?: string;
  coutTotal: number;
  statut: 'Terminée' | 'En Cours' | 'Planifiée';
  clientId?: string;
  entreprise?: string;
}

export interface Fournisseur {
  id: string;
  code: string; // Ex: FRS-01
  nom: string;
  contactNom: string;
  telephone: string;
  email: string;
  adresse: string;
  typeGasoilFourni: string;
  numContrat?: string;
  statut: 'Actif' | 'Inactif';
  notes?: string;
  clientId?: string;
  entreprise?: string;
}

export interface VehicleTypeConfig {
  id: string;
  code: string;
  libelle: string;
  categorie: 'Transport' | 'Extraction' | 'Manutention' | 'Énergie' | 'Liaison';
  uniteMesure: 'km' | 'heures';
  consoDefautTheorique: number;
  description: string;
  actif: boolean;
  clientId?: string;
  entreprise?: string;
}

export interface ConsumptionAlert {
  id: string;
  date: string;
  gravite: 'info' | 'warning' | 'danger';
  titre: string;
  message: string;
  vehiculeCode?: string;
  citerneCode?: string;
  clientId?: string;
  entreprise?: string;
}

export type SubscriptionPlan = 'Mensuel' | 'Trimestriel' | 'Annuel' | 'Entreprise' | 'Essai';

export interface Subscription {
  id: string;
  licenseKey: string; // Code de 36 caractères (lettres & chiffres)
  clientName: string;
  entreprise: string;
  contact: string;
  telephone: string;
  ville: string;
  plan: SubscriptionPlan;
  dateEmission: string;
  dateExpiration: string;
  statut: 'Actif' | 'Expiré' | 'Suspendu' | 'En Attente';
  prixMAD: number;
  maxVehicules: number;
  maxCiternes: number;
  notes?: string;
  cleActilee?: boolean;
  durationDays?: number; // Durée totale contractuelle de la licence en jours
  dateActivation?: string; // Date et heure précises de la première activation
  clientAdminId?: string; // ID utilisateur de l'admin client créé
  clientAdminLogin?: string; // Login de l'admin client dédié
  clientAdminPassword?: string; // Mot de passe de l'admin client
  clientAdminNom?: string; // Nom & prénom de l'admin client
  clientAdminEmail?: string; // Email de l'admin client
  clientAdminTelephone?: string; // Téléphone direct
  licensePermissions?: UserPermissions; // Autorisations spécifiques accordées pour cette licence par le Super Admin
}

export interface SecurityConfig {
  emergencyLockdown: boolean;
  maintenanceMode: boolean;
  readOnlyMode: boolean;
  requireSignatures: boolean;
  doubleValidationReceptions: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  allowOfflineMode: boolean;
  lastLockdownDate?: string;
  lockdownReason?: string;
  masterPinCode: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  status: 'Succès' | 'Échec' | 'Alerte' | 'Sécurité';
  ipAddress?: string;
}
