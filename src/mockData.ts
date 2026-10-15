import { Vehicle, Citerne, StockEntry, FuelDispense, Repair, ConsumptionAlert, User, Fournisseur, VehicleTypeConfig, ThemeConfig } from './types';

// Signature SVG placeholder standard
export const SAMPLE_SIGNATURE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120"><path d="M20 70 Q 50 20, 90 60 T 150 50 T 200 80 T 270 30 M 70 85 Q 130 95, 230 75" fill="none" stroke="%232563eb" stroke-width="3" stroke-linecap="round"/></svg>';

export const INITIAL_CITERNES: Citerne[] = [];

export const INITIAL_VEHICLES: Vehicle[] = [];

export const INITIAL_STOCK_ENTRIES: StockEntry[] = [];

export const INITIAL_DISPENSES: FuelDispense[] = [];

export const INITIAL_REPAIRS: Repair[] = [];

export const INITIAL_ALERTS: ConsumptionAlert[] = [];

export const INITIAL_USERS: User[] = [
  {
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
    permissions: {
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
    }
  }
];

export const INITIAL_FOURNISSEURS: Fournisseur[] = [];

export const INITIAL_VEHICLE_TYPES: VehicleTypeConfig[] = [
  {
    id: 'vt-1',
    code: 'TYP-CAM',
    libelle: 'Camion Benne',
    categorie: 'Transport',
    uniteMesure: 'km',
    consoDefautTheorique: 45.0,
    description: 'Camions 8x4 et 6x4 benne carrière et évacuation granulat',
    actif: true
  },
  {
    id: 'vt-2',
    code: 'TYP-PEL',
    libelle: 'Pelleteuse',
    categorie: 'Extraction',
    uniteMesure: 'heures',
    consoDefautTheorique: 25.0,
    description: 'Pelles hydrauliques sur chenilles 30t à 50t en front de taille',
    actif: true
  },
  {
    id: 'vt-3',
    code: 'TYP-CHG',
    libelle: 'Chargeuse',
    categorie: 'Extraction',
    uniteMesure: 'heures',
    consoDefautTheorique: 19.0,
    description: 'Chargeuses sur pneus fort tonnage pour alimentation trémies',
    actif: true
  },
  {
    id: 'vt-4',
    code: 'TYP-DMP',
    libelle: 'Dumper',
    categorie: 'Extraction',
    uniteMesure: 'heures',
    consoDefautTheorique: 28.0,
    description: 'Tombereaux articulés 40 tonnes transport roche massive',
    actif: true
  },
  {
    id: 'vt-5',
    code: 'TYP-MAN',
    libelle: 'Chariot Elévateur',
    categorie: 'Manutention',
    uniteMesure: 'heures',
    consoDefautTheorique: 4.8,
    description: 'Chariots élévateurs diesel parc palettes et expéditions',
    actif: true
  },
  {
    id: 'vt-6',
    code: 'TYP-GEN',
    libelle: 'Groupe Electrogène',
    categorie: 'Énergie',
    uniteMesure: 'heures',
    consoDefautTheorique: 75.0,
    description: 'Groupes électrogènes fixes de puissance 500kVA à 1000kVA',
    actif: true
  },
  {
    id: 'vt-7',
    code: 'TYP-UTL',
    libelle: 'Véhicule Léger',
    categorie: 'Liaison',
    uniteMesure: 'km',
    consoDefautTheorique: 9.0,
    description: 'Pick-up 4x4 et utilitaires de liaison et maintenance de piste',
    actif: true
  }
];

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'or-imperial',
    nom: 'Noir Onyx & Or Impérial',
    description: 'Alliance suprême de noir carbone onyx (#090d16) et d’or champagne brossé (#d4af37). Esthétique luxueuse de haute direction, cadrans dorés et contraste aristocratique.',
    accentHex: '#d4af37',
    bgHex: '#090d16',
    accentClass: 'text-amber-400',
    accentBgClass: 'bg-amber-500',
    borderAccentClass: 'border-amber-500/40',
    isDark: true
  },
  {
    id: 'bleu-saphir',
    nom: 'Bleu Saphir & Titane Royal',
    description: 'Profondeur cobalt et bleu saphir d’orfèvrerie (#0284c7) sur fond nuit stellaire (#060c1b). Précision aéronautique, élégance feutrée et contrastes haute fidélité.',
    accentHex: '#0284c7',
    bgHex: '#060c1b',
    accentClass: 'text-sky-400',
    accentBgClass: 'bg-sky-500',
    borderAccentClass: 'border-sky-500/40',
    isDark: true
  },
  {
    id: 'emeraude-prestige',
    nom: 'Émeraude Royale & Jade Sombre',
    description: 'Vert émeraude précieux (#10b981) sur fond velours minéral (#03140e). Prestige éco-responsable, distinction noble et sérénité visuelle maximale.',
    accentHex: '#10b981',
    bgHex: '#03140e',
    accentClass: 'text-emerald-400',
    accentBgClass: 'bg-emerald-500',
    borderAccentClass: 'border-emerald-500/40',
    isDark: true
  },
  {
    id: 'platine-epure',
    nom: 'Platine Épuré & Marbre Blanc',
    description: 'Mode clair magistral : blanc albâtre cristallin (#ffffff), surfaces platine brossé (#f8fafc) et typographie d’art suisse. Clarté absolue pour bureaux et salons exécutifs.',
    accentHex: '#b45309',
    bgHex: '#f8fafc',
    accentClass: 'text-amber-700',
    accentBgClass: 'bg-amber-600',
    borderAccentClass: 'border-amber-600/40',
    isDark: false
  },
  {
    id: 'cuivre-cognac',
    nom: 'Cuivre Brossé & Cognac Ambré',
    description: 'Harmonie chaleureuse de cuivre d’artisanat d’art (#ea580c), reflets cognac et bois fumé (#140a10). Atmosphère club privé et distinction aristocratique.',
    accentHex: '#ea580c',
    bgHex: '#140a10',
    accentClass: 'text-orange-400',
    accentBgClass: 'bg-orange-500',
    borderAccentClass: 'border-orange-500/40',
    isDark: true
  }
];


