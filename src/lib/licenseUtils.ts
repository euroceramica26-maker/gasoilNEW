import { Subscription, SecurityConfig, AuditLog } from '../types';

/**
 * Génère une clé de licence officielle à 36 caractères (lettres majuscules et chiffres).
 * Format standardisé ISO-UUID : 8-4-4-4-12 = exactement 36 caractères (ou 36 caractères bruts).
 * Exemple : "HGMA2026-B8F9-4C17-9E02-8FA19B7E52CD" (36 caractères avec tirets)
 * ou "HGMA2026B8F94C179E028FA19B7E52CD9A8B" (36 caractères continus sans tirets).
 */
export function generate36CharLicenseKey(withHyphens: boolean = true, prefix: string = 'HGMA'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclut 0/O, 1/I pour éviter les confusions de saisie
  
  if (!withHyphens) {
    // 36 caractères continus
    let key = (prefix + '2026').slice(0, 8);
    while (key.length < 36) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  // Format 8-4-4-4-12 = 32 caractères alphanumériques + 4 tirets = exactement 36 caractères !
  const genChunk = (len: number) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const part1 = (prefix + '2026').slice(0, 8); // 8
  const part2 = genChunk(4); // 4
  const part3 = genChunk(4); // 4
  const part4 = genChunk(4); // 4
  const part5 = genChunk(12); // 12

  // 8 + 1 + 4 + 1 + 4 + 1 + 4 + 1 + 12 = 36 caractères
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

/**
 * Valide et normalise une clé de licence saisie par un utilisateur ou client.
 * Accepte les clés avec ou sans tirets, insensibles à la casse.
 */
export function validateLicenseKeyFormat(key: string): { 
  isValid: boolean; 
  normalizedKey: string; 
  reason?: string;
  charCount: number;
} {
  if (!key) {
    return { isValid: false, normalizedKey: '', reason: 'Code vide', charCount: 0 };
  }

  const clean = key.trim().toUpperCase();
  const rawAlphanumeric = clean.replace(/[^A-Z0-9]/g, '');

  // Exactement 36 caractères (avec tirets format 8-4-4-4-12 ou 36 alphanumériques purs)
  if (clean.length === 36 || rawAlphanumeric.length === 32 || rawAlphanumeric.length === 36) {
    return {
      isValid: true,
      normalizedKey: clean,
      charCount: clean.length
    };
  }

  return {
    isValid: false,
    normalizedKey: clean,
    reason: `Longueur invalide (${clean.length} caractères). Un code d'abonnement valide contient 36 caractères (lettres et chiffres).`,
    charCount: clean.length
  };
}

/**
 * Calcule le nombre de jours restants avant expiration
 */
export function getDaysRemaining(dateExpirationStr: string): number {
  if (!dateExpirationStr) return 0;
  try {
    const formattedStr = dateExpirationStr.includes('T') ? dateExpirationStr : `${dateExpirationStr}T23:59:59`;
    const expDate = new Date(formattedStr);
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
}

/**
 * Durée par défaut en jours selon le plan d'abonnement
 */
export function getPlanDurationDays(plan: string): number {
  switch (plan) {
    case 'Mensuel':
      return 30;
    case 'Trimestriel':
      return 90;
    case 'Essai':
      return 14;
    case 'Annuel':
    case 'Entreprise':
    default:
      return 365;
  }
}

/**
 * Abonnements initiaux pour le Maroc (Démos, Clients industriels & Transporteurs)
 */
export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

export const INITIAL_SECURITY_CONFIG: SecurityConfig = {
  emergencyLockdown: false,
  maintenanceMode: false,
  readOnlyMode: false,
  requireSignatures: true,
  doubleValidationReceptions: true,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  allowOfflineMode: true,
  masterPinCode: 'MAROC2026' // Code secret maître de déverrouillage d'urgence
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-001',
    timestamp: '2026-10-10 09:00:00',
    user: 'ouaradtech (Super Admin)',
    action: 'Démarrage & Initialisation Système',
    module: 'Sécurité Centrale',
    details: 'Système initialisé. Compte Super Administrateur ouaradtech opérationnel.',
    status: 'Succès',
    ipAddress: '127.0.0.1'
  }
];
