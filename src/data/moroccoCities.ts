// Liste officielle et exhaustive des villes, provinces et pôles pétroliers & industriels du Royaume du Maroc

export interface MoroccoCityInfo {
  name: string;
  region: string;
  isHub?: boolean; // Pôle pétrolier ou dépôt logistique stratégique
}

export const MOROCCO_CITIES: MoroccoCityInfo[] = [
  // --- PÔLES PÉTROLIERS, PORTUAIRES & LOGISTIQUES STRATÉGIQUES ---
  { name: 'Mohammedia', region: 'Casablanca-Settat', isHub: true },
  { name: 'Casablanca', region: 'Casablanca-Settat', isHub: true },
  { name: 'Jorf Lasfar', region: 'Casablanca-Settat', isHub: true },
  { name: 'Tanger Med', region: 'Tanger-Tétouan-Al Hoceïma', isHub: true },
  { name: 'Tanger', region: 'Tanger-Tétouan-Al Hoceïma', isHub: true },
  { name: 'Agadir', region: 'Souss-Massa', isHub: true },
  { name: 'Nador West Med', region: 'Oriental', isHub: true },
  { name: 'Nador', region: 'Oriental', isHub: true },
  { name: 'Sidi Kacem', region: 'Rabat-Salé-Kénitra', isHub: true },
  { name: 'Laâyoune Port', region: 'Laâyoune-Sakia El Hamra', isHub: true },

  // --- GRANDES MÉTROPOLES & CAPITALES RÉGIONALES ---
  { name: 'Rabat', region: 'Rabat-Salé-Kénitra' },
  { name: 'Salé', region: 'Rabat-Salé-Kénitra' },
  { name: 'Témara', region: 'Rabat-Salé-Kénitra' },
  { name: 'Skhirat', region: 'Rabat-Salé-Kénitra' },
  { name: 'Kénitra', region: 'Rabat-Salé-Kénitra' },
  { name: 'Marrakech', region: 'Marrakech-Safi' },
  { name: 'Fès', region: 'Fès-Meknès' },
  { name: 'Meknès', region: 'Fès-Meknès' },
  { name: 'Oujda', region: 'Oriental' },
  { name: 'Tétouan', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Safi', region: 'Marrakech-Safi' },
  { name: 'El Jadida', region: 'Casablanca-Settat' },
  { name: 'Beni Mellal', region: 'Béni Mellal-Khénifra' },
  { name: 'Khouribga', region: 'Béni Mellal-Khénifra' },
  { name: 'Settat', region: 'Casablanca-Settat' },
  { name: 'Berrechid', region: 'Casablanca-Settat' },

  // --- PROVINCES DU NORD & RIF ---
  { name: 'Al Hoceïma', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Larache', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Ksar El Kebir', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Chefchaouen', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Asilah', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'M\'diq', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Fnideq', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Martil', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Ouazzane', region: 'Tanger-Tétouan-Al Hoceïma' },

  // --- PROVINCES DE L\'ORIENTAL ---
  { name: 'Berkane', region: 'Oriental' },
  { name: 'Taourirt', region: 'Oriental' },
  { name: 'Guercif', region: 'Oriental' },
  { name: 'Jerada', region: 'Oriental' },
  { name: 'Driouch', region: 'Oriental' },
  { name: 'Saïdia', region: 'Oriental' },
  { name: 'Bouarfa', region: 'Oriental' },
  { name: 'Figuig', region: 'Oriental' },

  // --- GRAND CASABLANCA & CHAOUIA ---
  { name: 'Bouskoura', region: 'Casablanca-Settat' },
  { name: 'Nouaceur', region: 'Casablanca-Settat' },
  { name: 'Médiouna', region: 'Casablanca-Settat' },
  { name: 'Tit Mellil', region: 'Casablanca-Settat' },
  { name: 'Aïn Harrouda', region: 'Casablanca-Settat' },
  { name: 'Benslimane', region: 'Casablanca-Settat' },
  { name: 'Bouznika', region: 'Casablanca-Settat' },
  { name: 'Had Soualem', region: 'Casablanca-Settat' },
  { name: 'Azemmour', region: 'Casablanca-Settat' },
  { name: 'Sidi Bennour', region: 'Casablanca-Settat' },
  { name: 'Zemamra', region: 'Casablanca-Settat' },
  { name: 'Oulad Teïma', region: 'Souss-Massa' },
  { name: 'Ben Guerir', region: 'Marrakech-Safi' },
  { name: 'Youssoufia', region: 'Marrakech-Safi' },

  // --- CENTRE, ATLAS & PLAINES ---
  { name: 'Taza', region: 'Fès-Meknès' },
  { name: 'Sefrou', region: 'Fès-Meknès' },
  { name: 'Ifrane', region: 'Fès-Meknès' },
  { name: 'Azrou', region: 'Fès-Meknès' },
  { name: 'Khémisset', region: 'Rabat-Salé-Kénitra' },
  { name: 'Tiflet', region: 'Rabat-Salé-Kénitra' },
  { name: 'Sidi Slimane', region: 'Rabat-Salé-Kénitra' },
  { name: 'Souk El Arbaa', region: 'Rabat-Salé-Kénitra' },
  { name: 'Khénifra', region: 'Béni Mellal-Khénifra' },
  { name: 'Fquih Ben Salah', region: 'Béni Mellal-Khénifra' },
  { name: 'Kasba Tadla', region: 'Béni Mellal-Khénifra' },
  { name: 'Oued Zem', region: 'Béni Mellal-Khénifra' },
  { name: 'Azilal', region: 'Béni Mellal-Khénifra' },
  { name: 'Demnate', region: 'Béni Mellal-Khénifra' },
  { name: 'Midelt', region: 'Drâa-Tafilalet' },
  { name: 'Errachidia', region: 'Drâa-Tafilalet' },
  { name: 'Erfoud', region: 'Drâa-Tafilalet' },
  { name: 'Rissani', region: 'Drâa-Tafilalet' },
  { name: 'Tinghir', region: 'Drâa-Tafilalet' },
  { name: 'Ouarzazate', region: 'Drâa-Tafilalet' },
  { name: 'Zagora', region: 'Drâa-Tafilalet' },
  { name: 'Kalaat M\'Gouna', region: 'Drâa-Tafilalet' },

  // --- SOUSS & SUD ---
  { name: 'Taroudant', region: 'Souss-Massa' },
  { name: 'Tiznit', region: 'Souss-Massa' },
  { name: 'Inezgane', region: 'Souss-Massa' },
  { name: 'Aït Melloul', region: 'Souss-Massa' },
  { name: 'Biougra', region: 'Souss-Massa' },
  { name: 'Tafraout', region: 'Souss-Massa' },
  { name: 'Essaouira', region: 'Marrakech-Safi' },
  { name: 'Chichaoua', region: 'Marrakech-Safi' },
  { name: 'Guelmim', region: 'Guelmim-Oued Noun' },
  { name: 'Tan-Tan', region: 'Guelmim-Oued Noun' },
  { name: 'Sidi Ifni', region: 'Guelmim-Oued Noun' },
  { name: 'Assa', region: 'Guelmim-Oued Noun' },
  { name: 'Tata', region: 'Souss-Massa' },

  // --- PROVINCES SAHARIENNES DU SUD ---
  { name: 'Laâyoune', region: 'Laâyoune-Sakia El Hamra' },
  { name: 'Dakhla', region: 'Dakhla-Oued Ed-Dahab' },
  { name: 'Boujdour', region: 'Laâyoune-Sakia El Hamra' },
  { name: 'Smara', region: 'Laâyoune-Sakia El Hamra' },
  { name: 'Tarfaya', region: 'Laâyoune-Sakia El Hamra' },
  { name: 'El Marsa', region: 'Laâyoune-Sakia El Hamra' },
  { name: 'Aousserd', region: 'Dakhla-Oued Ed-Dahab' },
  { name: 'Lagouira', region: 'Dakhla-Oued Ed-Dahab' }
];

// Noms uniques triés pour listes déroulantes et autocomplétion
export const ALL_MOROCCO_CITY_NAMES: string[] = Array.from(
  new Set(MOROCCO_CITIES.map(c => c.name))
).sort((a, b) => a.localeCompare(b, 'fr'));
