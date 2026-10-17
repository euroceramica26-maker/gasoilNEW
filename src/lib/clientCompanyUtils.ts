import { Subscription, User, ClientCompanyInfo } from '../types';

/**
 * Génère un ICE marocain standard (15 chiffres officiels) dérivé de façon déterministe
 * à partir du nom ou de la raison sociale du compte client.
 */
export function generateDeterministicIce(name: string): string {
  const clean = (name || 'CLIENT').trim().toUpperCase();
  let hash = 5381;
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) + clean.charCodeAt(i);
  }
  const positiveHash = Math.abs(hash);
  const part1 = (positiveHash % 90000000 + 10000000).toString();
  const part2 = ((positiveHash * 31) % 90000 + 10000).toString();
  return `00${part1}${part2}`.slice(0, 15);
}

/**
 * Génère un Registre de Commerce (RC) propre au compte client et à sa ville
 */
export function generateDeterministicRc(name: string, ville: string = 'Casablanca'): string {
  const clean = (name || 'CLIENT').trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 37 + clean.charCodeAt(i)) % 900000;
  }
  const rcNumber = Math.abs(hash) + 120000;
  return `RC ${ville.trim()} ${rcNumber}`;
}

/**
 * Génère un Identifiant Fiscal (IF) propre au compte client
 */
export function generateDeterministicIf(name: string): string {
  const clean = (name || 'CLIENT').trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 29 + clean.charCodeAt(i)) % 90000000;
  }
  const ifNumber = Math.abs(hash) + 21000000;
  return `IF: ${ifNumber}`;
}

/**
 * Résout de façon exhaustive et dynamique les coordonnées, mentions légales et fiscales
 * spécifiques du compte client pour tous les documents d'impression (Bons de Réception d'entrée,
 * Tickets de distribution, Rapports officiels et Certificats).
 */
export function resolveClientCompanyInfo(params: {
  data?: { clientId?: string; entreprise?: string } | null;
  subscriptions?: Subscription[];
  currentUser?: User | null;
  activeLicenseKey?: string;
}): ClientCompanyInfo {
  const { data, activeLicenseKey } = params;

  // Récupération des souscriptions si non fournies
  let subscriptions = params.subscriptions || [];
  if (subscriptions.length === 0 && typeof window !== 'undefined') {
    try {
      const savedSubs = localStorage.getItem('hg_subscriptions');
      if (savedSubs) {
        subscriptions = JSON.parse(savedSubs);
      }
    } catch {}
  }

  // Récupération de l'utilisateur connecté si non fourni
  let currentUser = params.currentUser;
  if (!currentUser && typeof window !== 'undefined') {
    try {
      const savedUser = localStorage.getItem('hg_auth_user');
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
      }
    } catch {}
  }

  // Récupération de la clé de licence active
  const effectiveLicenseKey = activeLicenseKey || 
    (typeof window !== 'undefined' ? localStorage.getItem('hg_active_license') || '' : '');

  // 1. Recherche du compte client (Subscription) correspondant
  let matchingSub: Subscription | undefined;

  // A. Par clientId sur le document
  if (data?.clientId) {
    matchingSub = subscriptions.find(s => s.id === data.clientId);
  }

  // B. Par entreprise sur le document
  if (!matchingSub && data?.entreprise) {
    matchingSub = subscriptions.find(s => 
      s.entreprise.toLowerCase().trim() === data.entreprise?.toLowerCase().trim()
    );
  }

  // C. Par clientId sur l'utilisateur connecté
  if (!matchingSub && currentUser?.clientId) {
    matchingSub = subscriptions.find(s => s.id === currentUser.clientId);
  }

  // D. Par entreprise sur l'utilisateur connecté
  if (!matchingSub && currentUser?.entreprise && currentUser.role !== 'Super Administrateur') {
    matchingSub = subscriptions.find(s => 
      s.entreprise.toLowerCase().trim() === currentUser?.entreprise?.toLowerCase().trim()
    );
  }

  // E. Par lien admin client (clientAdminId ou clientAdminLogin)
  if (!matchingSub && currentUser) {
    matchingSub = subscriptions.find(s => 
      (s.clientAdminId && s.clientAdminId === currentUser?.id) ||
      (s.clientAdminLogin && currentUser?.login && s.clientAdminLogin.toLowerCase() === currentUser.login.toLowerCase())
    );
  }

  // F. Par licence active sur le poste
  if (!matchingSub && effectiveLicenseKey) {
    matchingSub = subscriptions.find(s => s.licenseKey === effectiveLicenseKey);
  }

  // G. Si une seule souscription existe et que l'utilisateur est un compte client
  if (!matchingSub && subscriptions.length === 1 && currentUser?.role !== 'Super Administrateur') {
    matchingSub = subscriptions[0];
  }

  // H. S'il n'y a qu'une seule souscription existante dans le système
  if (!matchingSub && subscriptions.length === 1) {
    matchingSub = subscriptions[0];
  }

  // 2. Recherche d'un override personnalisé sauvegardé localement par le compte client
  let localCustomInfo: Partial<ClientCompanyInfo> | null = null;
  if (typeof window !== 'undefined') {
    const candidateKeys = [
      matchingSub?.id ? `hg_client_info_${matchingSub.id}` : null,
      currentUser?.clientId ? `hg_client_info_${currentUser.clientId}` : null,
      data?.clientId ? `hg_client_info_${data.clientId}` : null,
      'hg_client_info_default'
    ].filter(Boolean) as string[];

    for (const key of candidateKeys) {
      try {
        const rawSaved = localStorage.getItem(key);
        if (rawSaved) {
          localCustomInfo = JSON.parse(rawSaved);
          if (localCustomInfo && (localCustomInfo.entreprise || localCustomInfo.ice)) {
            break;
          }
        }
      } catch {}
    }
  }

  // 3. Extraction du nom de l'entreprise cliente
  const entrepriseName = (
    localCustomInfo?.entreprise ||
    matchingSub?.entreprise ||
    data?.entreprise ||
    (currentUser?.entreprise && currentUser.role !== 'Super Administrateur' ? currentUser.entreprise : '') ||
    matchingSub?.clientName ||
    'ENTREPRISE INDUSTRIELLE CLIENTE'
  ).trim();

  // Ville du compte client
  const ville = (
    localCustomInfo?.ville ||
    matchingSub?.ville ||
    currentUser?.ville ||
    'Casablanca'
  ).trim();

  // Dépôt & Parc de stockage propre au client
  const depot = (
    localCustomInfo?.depot ||
    matchingSub?.depot ||
    `${entrepriseName} • Dépôt & Parc Carburant (${ville})`
  ).trim();

  // Adresse du site client
  const adresse = (
    localCustomInfo?.adresse ||
    matchingSub?.adresse ||
    `Zone Industrielle & Plateforme Logistique • ${ville}`
  ).trim();

  // Identifiants légaux et fiscaux marocains propres au client
  const ice = (
    localCustomInfo?.ice ||
    matchingSub?.ice ||
    generateDeterministicIce(entrepriseName)
  ).trim();

  const rc = (
    localCustomInfo?.rc ||
    matchingSub?.rc ||
    generateDeterministicRc(entrepriseName, ville)
  ).trim();

  const identifiantFiscal = (
    localCustomInfo?.identifiantFiscal ||
    matchingSub?.identifiantFiscal ||
    generateDeterministicIf(entrepriseName)
  ).trim();

  const telephone = (
    localCustomInfo?.telephone ||
    matchingSub?.telephone ||
    matchingSub?.clientAdminTelephone ||
    currentUser?.telephone ||
    '+212 5 22 00 00 00'
  ).trim();

  const email = (
    localCustomInfo?.email ||
    matchingSub?.clientAdminEmail ||
    currentUser?.email ||
    `contact@${entrepriseName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'entreprise'}.ma`
  ).trim();

  const sousTitre = (
    localCustomInfo?.sousTitre ||
    matchingSub?.activite ||
    `Spécifications Métrologiques & Contrôle Carburant • ${entrepriseName}`
  ).trim();

  return {
    entreprise: entrepriseName,
    depot,
    adresse,
    ville,
    ice,
    rc,
    identifiantFiscal,
    telephone,
    email,
    sousTitre
  };
}

/**
 * Sauvegarde les coordonnées d'un client dans le stockage local et synchronise l'abonnement
 */
export function saveClientCompanyDetails(
  clientIdOrSubId: string, 
  info: ClientCompanyInfo, 
  subscriptions: Subscription[],
  onUpdateSubscription?: (sub: Subscription) => void
) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`hg_client_info_${clientIdOrSubId}`, JSON.stringify(info));
      localStorage.setItem('hg_client_info_default', JSON.stringify(info));
    }
    
    // Mettre à jour l'abonnement si trouvé
    const subIndex = subscriptions.findIndex(s => 
      s.id === clientIdOrSubId || 
      s.entreprise.toLowerCase().trim() === info.entreprise.toLowerCase().trim()
    );
    if (subIndex !== -1 && onUpdateSubscription) {
      const updated: Subscription = {
        ...subscriptions[subIndex],
        entreprise: info.entreprise,
        ville: info.ville,
        ice: info.ice,
        rc: info.rc,
        identifiantFiscal: info.identifiantFiscal,
        depot: info.depot,
        adresse: info.adresse,
        telephone: info.telephone,
        activite: info.sousTitre
      };
      onUpdateSubscription(updated);
    }
  } catch (e) {
    console.error('Erreur sauvegarde informations client:', e);
  }
}
