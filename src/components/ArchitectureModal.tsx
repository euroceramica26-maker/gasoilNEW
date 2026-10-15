import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Layers, 
  Printer, 
  FileCode, 
  CheckSquare, 
  Cpu, 
  Tablet, 
  Monitor, 
  Copy, 
  Check, 
  Download,
  ShieldAlert
} from 'lucide-react';

export const ArchitectureModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stack' | 'db' | 'steps' | 'code' | 'printing'>('stack');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const SQL_DDL = `-- ========================================================
-- GASOILPRO - SCHEMA RELATIONNEL POSTGRESQL / SQLITE
-- Version: 4.2 Production Industrielle
-- ========================================================

-- 1. TABLE DES CITERNES / CUVE DE STOCKAGE
CREATE TABLE citernes (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,       -- Ex: CIT-01
    nom VARCHAR(100) NOT NULL,
    capacite_totale NUMERIC(10, 2) NOT NULL CHECK (capacite_totale > 0),
    stock_actuel NUMERIC(10, 2) NOT NULL CHECK (stock_actuel >= 0),
    seuil_alerte_bas NUMERIC(10, 2) NOT NULL,
    seuil_critique NUMERIC(10, 2) NOT NULL,
    temperature_celsius NUMERIC(5, 2) DEFAULT 15.0,
    densite_kg_l NUMERIC(5, 4) DEFAULT 0.8400,
    type_gasoil VARCHAR(50) NOT NULL,      -- Gasoil 10ppm, GNR, etc.
    emplacement VARCHAR(100),
    dernier_controle DATE,
    statut VARCHAR(30) DEFAULT 'Opérationnelle',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour requêtes temps réel de jauge
CREATE INDEX idx_citernes_code ON citernes(code);

-- 2. TABLE DU PARC AUTOMOBILE ET ENGINS INDUSTRIELS
CREATE TABLE vehicules (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,       -- Ex: ENG-101, CAM-201
    immatriculation VARCHAR(30) NOT NULL,
    marque VARCHAR(50) NOT NULL,
    modele VARCHAR(50) NOT NULL,
    type_engin VARCHAR(50) NOT NULL,        -- Camion, Pelleteuse, Dumper, Chariot
    statut VARCHAR(30) DEFAULT 'Actif',     -- Actif, En Maintenance, Hors Service
    annee INT,
    kilometrage_ou_heures NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unite_mesure VARCHAR(10) NOT NULL CHECK (unite_mesure IN ('km', 'heures')),
    capacite_reservoir NUMERIC(8, 2) NOT NULL,
    conso_moyenne_theorique NUMERIC(6, 2) NOT NULL, -- L/100km ou L/h
    derniere_conso_reelle NUMERIC(6, 2),
    departement VARCHAR(80),
    date_mise_en_service DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicules_code ON vehicules(code);
CREATE INDEX idx_vehicules_statut ON vehicules(statut);

-- 3. TABLE DES ENTRÉES DE STOCK (LIVRAISONS FOURNISSEUR)
CREATE TABLE entrees_stock (
    id VARCHAR(36) PRIMARY KEY,
    numero_bon VARCHAR(50) NOT NULL UNIQUE, -- BL Fournisseur
    date_livraison TIMESTAMP WITH TIME ZONE NOT NULL,
    fournisseur VARCHAR(100) NOT NULL,
    chauffeur_livreur VARCHAR(100) NOT NULL,
    immat_citerne_livreur VARCHAR(30) NOT NULL,
    citerne_id VARCHAR(36) NOT NULL REFERENCES citernes(id),
    quantite_livree NUMERIC(10, 2) NOT NULL CHECK (quantite_livree > 0),
    densite_mesuree NUMERIC(5, 4),
    temperature_mesuree NUMERIC(5, 2),
    receptionnaire_usine VARCHAR(100) NOT NULL,
    signature_base64 TEXT NOT NULL,         -- Capture manuscrite vecteur/PNG
    notes TEXT,
    statut VARCHAR(20) DEFAULT 'Validé',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entrees_citerne ON entrees_stock(citerne_id);
CREATE INDEX idx_entrees_date ON entrees_stock(date_livraison);

-- 4. TABLE DES SORTIES DE STOCK / TRANSACTIONS DE PLEIN
CREATE TABLE sorties_carburant (
    id VARCHAR(36) PRIMARY KEY,
    code_ticket VARCHAR(50) NOT NULL UNIQUE,
    date_heure TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    citerne_id VARCHAR(36) NOT NULL REFERENCES citernes(id),
    vehicule_id VARCHAR(36) NOT NULL REFERENCES vehicules(id),
    pompiste VARCHAR(100) NOT NULL,
    chauffeur VARCHAR(100) NOT NULL,
    volume_livre NUMERIC(8, 2) NOT NULL CHECK (volume_livre > 0),
    compteur_actuel NUMERIC(12, 2) NOT NULL,
    compteur_precedent NUMERIC(12, 2) NOT NULL,
    delta_compteur NUMERIC(10, 2) GENERATED ALWAYS AS (compteur_actuel - compteur_precedent) STORED,
    ratio_consommation NUMERIC(6, 2),       -- L/100km ou L/h
    surconsommation_alerte BOOLEAN DEFAULT FALSE,
    signature_chauffeur TEXT,
    remarques TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sorties_vehicule ON sorties_carburant(vehicule_id);
CREATE INDEX idx_sorties_citerne ON sorties_carburant(citerne_id);
CREATE INDEX idx_sorties_date ON sorties_carburant(date_heure);

-- 5. TABLE DES UTILISATEURS ET OPÉRATEURS USINE
CREATE TABLE utilisateurs (
    id VARCHAR(36) PRIMARY KEY,
    matricule VARCHAR(30) NOT NULL UNIQUE,  -- Ex: USR-101, PMP-01
    nom VARCHAR(60) NOT NULL,
    prenom VARCHAR(60) NOT NULL,
    role VARCHAR(50) NOT NULL,              -- 'Administrateur', 'Chef de Dépôt', 'Pompiste', 'Chauffeur'
    email VARCHAR(120),
    telephone VARCHAR(30),
    statut VARCHAR(20) DEFAULT 'Actif',     -- 'Actif', 'Inactif', 'Suspendu'
    badge_code VARCHAR(50) NOT NULL UNIQUE, -- Code RFID ou PIN sécurisé
    departement VARCHAR(80),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_utilisateurs_matricule ON utilisateurs(matricule);
CREATE INDEX idx_utilisateurs_badge ON utilisateurs(badge_code);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(role);
`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider border border-amber-500/30">
                Spécification d'Ingénierie Logicielle
              </span>
              <span className="text-xs text-slate-400">Version 4.2 Industrielle</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1 font-industrial">
              Architecture Système Multiplateforme (Windows & Android)
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Dossier d'architecture technique pour environnement d'usine robuste : Tablettes tactiles Android durcies (quai dépotage) et postes PC fixes Windows (supervision d'atelier et station de pompage).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy('all-ddl', SQL_DDL)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 transition"
            >
              {copiedId === 'all-ddl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'all-ddl' ? 'Copié !' : 'Copier Schéma SQL'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-800/80 pt-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'stack' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Recommandation Stack Multiplateforme
          </button>

          <button
            onClick={() => setActiveTab('db')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'db' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            2. Base de Données (Schéma DDL & ERD)
          </button>

          <button
            onClick={() => setActiveTab('steps')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'steps' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            3. Plan d'Implémentation Phasé
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'code' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileCode className="w-4 h-4" />
            4. Code Signature & Citerne
          </button>

          <button
            onClick={() => setActiveTab('printing')}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'printing' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Printer className="w-4 h-4" />
            5. Stratégie d'Impression (Windows / Android)
          </button>
        </div>
      </div>

      {/* Content Sections */}
      {activeTab === 'stack' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Solution 1: Flutter Desktop & Mobile */}
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-xl p-5 shadow-lg relative">
            <span className="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
              RECOMMANDATION N°1 (OPTIMAL)
            </span>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-100 text-sm">
                Option A : Flutter Multiplateforme (Dart) + Backend NestJS / Go
              </h3>
            </div>
            <p className="text-slate-300 mb-3 leading-relaxed">
              <strong>Pourquoi c'est le choix d'excellence en milieu industriel :</strong>
            </p>
            <ul className="space-y-2 text-slate-300 list-disc pl-4">
              <li>
                <strong>Binaire natif x86_64 sous Windows</strong> : L'application compile directement en un exécutable Win32/C++ ultra-rapide sans dépendre d'un runtime navigateur.
              </li>
              <li>
                <strong>APK natif ARM64 sous Android</strong> : Fluidité totale 60/120fps sur tablettes durcies (Zebra, Honeywell, Samsung Galaxy Tab Active) avec gestion tactile irréprochable même avec gants.
              </li>
              <li>
                <strong>Support matériel direct</strong> : Accès aux ports série RS-232 / USB sous Windows (pour relier les automates de volucompteurs Tokheim/Satam) et Bluetooth SPP sous Android.
              </li>
              <li>
                <strong>Base locale SQLite (Offline-First)</strong> : Les chauffeurs et pompistes continuent d'enregistrer les pleins même en zone blanche sans Wi-Fi au fond de la carrière. Synchronisation automatique dès reconnexion.
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-slate-400 font-semibold block mb-1">Architecture proposée :</span>
              <div className="bg-slate-950 p-2.5 rounded font-mono-num text-[11px] text-amber-400">
                Frontend: Flutter 3.24+ (Windows Desktop + Android Mobile/Tablet)<br/>
                Local DB: SQLite via Drift / Isar (Mode Hors-ligne)<br/>
                API Backend: Node.js / NestJS ou Go (REST + WebSockets)<br/>
                Serveur Central: PostgreSQL 16 + Redis (File d'attente d'alertes)
              </div>
            </div>
          </div>

          {/* Solution 2: React Native / Tauri + Web */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                Option B : Tauri v2 / Capacitor (Web Tech: React + TypeScript)
              </h3>
            </div>
            <p className="text-slate-300 mb-3 leading-relaxed">
              <strong>Alternative Web moderne unifiée :</strong>
            </p>
            <ul className="space-y-2 text-slate-300 list-disc pl-4">
              <li>
                <strong>Partage de 98% du code TypeScript/React</strong> entre le poste PC de contrôle et l'application mobile tablette.
              </li>
              <li>
                <strong>Tauri v2</strong> compile un binaire Windows léger (moins de 15 Mo vs Electron 120 Mo) avec backend Rust sécurisé pour communiquer avec les imprimantes locales.
              </li>
              <li>
                <strong>Capacitor / PWA</strong> permet de déployer sous Android via le Play Store interne ou par fichier APK d'entreprise (Enterprise Sideloading).
              </li>
              <li>
                <strong>Mises à jour à chaud (OTA)</strong> : Possibilité de déployer des correctifs logiciels sur l'ensemble des terminaux du site sans intervention manuelle.
              </li>
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-slate-400 font-semibold block mb-1">Architecture proposée :</span>
              <div className="bg-slate-950 p-2.5 rounded font-mono-num text-[11px] text-blue-400">
                Frontend: React 19 + TypeScript + Tailwind CSS<br/>
                Windows Container: Tauri v2 (Rust IPC bridge)<br/>
                Android Container: Capacitor v6 (Plugins Camera & Bluetooth)<br/>
                Backend: FastAPI (Python) ou Express/NestJS (Node.js)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Schema Tab */}
      {activeTab === 'db' && (
        <div className="space-y-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  Script DDL de Création des Tables (PostgreSQL / SQLite)
                </h3>
                <p className="text-slate-400 text-[11px]">
                  5 tables relationnelles normalisées avec contraintes d'intégrité, index de performance et colonnes générées
                </p>
              </div>
              <button
                onClick={() => handleCopy('ddl-script', SQL_DDL)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition"
              >
                {copiedId === 'ddl-script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copier SQL</span>
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-[11px] font-mono-num text-slate-300 border border-slate-800 max-h-96">
              {SQL_DDL}
            </pre>
          </div>

          {/* ERD Diagram Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="font-bold text-amber-400 block mb-1">Citernes ↔ Transactions :</span>
              <p className="text-slate-400 text-[11px]">
                Chaque entrée (livraison camion) incrémente le <code className="text-slate-200">stock_actuel</code>. Chaque sortie (plein) le décrémente avec verrouillage transactionnel (<code className="text-slate-200">SELECT ... FOR UPDATE</code>) pour éviter tout double-débit simultané.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="font-bold text-blue-400 block mb-1">Véhicules ↔ Consommation :</span>
              <p className="text-slate-400 text-[11px]">
                La colonne <code className="text-slate-200">delta_compteur</code> calcule automatiquement la distance parcourue ou les heures moteur. Le ratio est comparé à la référence usine pour déclencher les alertes de surconsommation (&gt;15%).
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="font-bold text-emerald-400 block mb-1">Traçabilité & Signatures :</span>
              <p className="text-slate-400 text-[11px]">
                Les signatures manuscrites sont stockées en base (format base64 optimisé WebP/PNG ou vecteur SVG compact) liées à l'identifiant unique du bon pour valeur probante en cas de litige fournisseur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Implementation Steps Tab */}
      {activeTab === 'steps' && (
        <div className="space-y-3 text-xs">
          {[
            {
              phase: 'Phase 1',
              title: 'Cahier des charges & Configuration des Terminaux',
              duration: 'Semaines 1 à 2',
              items: [
                'Audit des citernes existantes (dimensions, sondes de niveau TLS Veeder-Root ou sondes à fil 4-20mA)',
                'Choix du matériel : Tablettes Android durcies IP65 pour la piste, PC quai Windows',
                'Mise en place de l’environnement de développement Flutter ou React/Tauri'
              ]
            },
            {
              phase: 'Phase 2',
              title: 'Architecture Données & Mode Hors-Ligne (Offline-First)',
              duration: 'Semaines 3 à 4',
              items: [
                'Déploiement de PostgreSQL sur le serveur local de l’usine',
                'Mise en œuvre du stockage local SQLite sur les terminaux nomades',
                'Algorithme de synchronisation bidirectionnelle avec gestion des conflits (CRDT ou Last-Write-Wins)'
              ]
            },
            {
              phase: 'Phase 3',
              title: 'Développement des Modules Métier & Jauges Réalistes',
              duration: 'Semaines 5 à 7',
              items: [
                'Module 1 : Import/Export CSV des flottes d’engins et compteurs',
                'Module 2 : Réceptions citernes avec capture de signature tactile et calcul de densité',
                'Module 3 : Délivrance pistolet avec calcul instantané L/100km et L/h',
                'Module 5 : Dashboard dynamique avec visualisation graphique animée des citernes'
              ]
            },
            {
              phase: 'Phase 4',
              title: 'Interfaçage des Imprimantes & Équipements de Pompage',
              duration: 'Semaines 8 à 9',
              items: [
                'Intégration des imprimantes thermiques 80mm Bluetooth pour tablettes Android',
                'Intégration du spooler Windows pour impression automatique des bons d’entrée A4 ou reçus',
                'Module 4 : Gestion des interventions métrologiques et historiques de maintenance'
              ]
            },
            {
              phase: 'Phase 5',
              title: 'Recette sur Site, Formation & Mise en Production',
              duration: 'Semaine 10',
              items: [
                'Test de charge et simulation de coupure réseau prolongée',
                'Formation des pompistes, chefs de dépôt et techniciens de maintenance',
                'Basculement en production avec sauvegarde automatique quotidienne'
              ]
            }
          ].map((step, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start">
              <div className="shrink-0">
                <span className="font-industrial font-bold text-xs bg-amber-500 text-slate-950 px-2.5 py-1 rounded">
                  {step.phase}
                </span>
                <span className="block text-[11px] text-slate-500 font-mono-num mt-1">{step.duration}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-100 text-sm mb-1">{step.title}</h4>
                <ul className="space-y-1 text-slate-300 list-disc pl-4">
                  {step.items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Code Examples Tab */}
      {activeTab === 'code' && (
        <div className="space-y-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-slate-100 text-sm mb-1">
              Extrait Flutter / Dart : Capture de Signature & Rendu Citerne Dynamique
            </h3>
            <p className="text-slate-400 text-[11px] mb-3">
              Code de référence prêt pour intégration dans un projet Flutter Windows & Android.
            </p>

            <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-[11px] font-mono-num text-slate-300 border border-slate-800 max-h-96">
{`// ===================================================================
// FLUTTER : WIDGET DE VISUALISATION DYNAMIQUE DE CITERNE INDUSTRIELLE
// ===================================================================
import 'dart:math' as math;
import 'package:flutter/material.dart';

class IndustrialTankPainter extends CustomPainter {
  final double fillPercent; // de 0.0 à 1.0
  final double wavePhase;   // valeur d'animation continue

  IndustrialTankPainter({required this.fillPercent, required this.wavePhase});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(24));

    // 1. Corps métallique de la cuve (Acier thermolaqué)
    final steelPaint = Paint()
      ..shader = LinearGradient(
        colors: [Colors.blueGrey.shade800, Colors.blueGrey.shade900, Colors.black],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(rect);
    canvas.drawRRect(rrect, steelPaint);

    // 2. Zone de liquide (Gasoil couleur ambre/doré avec vagues animées)
    final liquidHeight = size.height * fillPercent;
    final liquidTop = size.height - liquidHeight;

    final path = Path();
    path.moveTo(0, size.height);
    path.lineTo(0, liquidTop);

    // Calcul de la sinusoïde pour vague de surface
    for (double x = 0; x <= size.width; x += 4) {
      final y = liquidTop + math.sin((x / size.width * 2 * math.pi) + wavePhase) * 4.0;
      path.lineTo(x, y);
    }
    path.lineTo(size.width, size.height);
    path.close();

    // Clip dans la forme cylindrique
    canvas.save();
    canvas.clipRRect(rrect);

    final gasoilPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFF59E0B), Color(0xFFB45309), Color(0xFF78350F)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(rect);

    canvas.drawPath(path, gasoilPaint);
    canvas.restore();

    // 3. Bordure externe de la citerne
    final borderPaint = Paint()
      ..color = Colors.blueGrey.shade600
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5;
    canvas.drawRRect(rrect, borderPaint);
  }

  @override
  bool shouldRepaint(covariant IndustrialTankPainter oldDelegate) => true;
}

// ===================================================================
// FLUTTER : GESTION DE LA SIGNATURE MANUSCRITE
// ===================================================================
// Utilisation recommandée du package 'signature' dans pubspec.yaml:
// signature: ^5.5.0
//
// SignatureController _signatureController = SignatureController(
//   penStrokeWidth: 3,
//   penColor: Colors.blue.shade900,
//   exportBackgroundColor: Colors.transparent,
// );
//
// Widget buildSignaturePad() {
//   return Signature(
//     controller: _signatureController,
//     height: 180,
//     backgroundColor: Colors.white,
//   );
// }`}
            </pre>
          </div>
        </div>
      )}

      {/* Printing Strategy Tab */}
      {activeTab === 'printing' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Windows Strategy */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Impression sous Windows (PC Quai & Atelier)
                </h3>
              </div>
              <p className="text-slate-300 mb-3 leading-relaxed">
                Sous Windows, le système dispose généralement d'une imprimante laser de bureau (format A4) ou d'une imprimante ticket de caisse (Epson TM-T88 / Citizen USB) :
              </p>
              <ul className="space-y-2 text-slate-300 list-disc pl-4">
                <li>
                  <strong>Spooler Win32 standard</strong> : Communication via le pilote d'impression officiel Windows avec prise en charge du format A4 officiel (Bons de réception avec signatures et logos HD).
                </li>
                <li>
                  <strong>Port USB / Virtual COM (ESC/POS)</strong> : Envoi de commandes brutes ESC/POS directes sur le port USB via Win32 API (<code className="text-amber-400 font-mono-num">RawPrinterHelper</code>) pour une sortie instantanée en 0.5s sans boîte de dialogue.
                </li>
                <li>
                  <strong>Génération PDF automatique</strong> : Archivage simultané d'une copie PDF signée horodatée dans le dossier partagé réseau de la comptabilité usine.
                </li>
              </ul>
            </div>

            {/* Android Strategy */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Tablet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Impression sous Android (Tablettes Piste & Chauffeurs)
                </h3>
              </div>
              <p className="text-slate-300 mb-3 leading-relaxed">
                Sur le terrain, les opérateurs utilisent des imprimantes thermiques ceinture portatives (format 58mm ou 80mm) :
              </p>
              <ul className="space-y-2 text-slate-300 list-disc pl-4">
                <li>
                  <strong>Bluetooth SPP / BLE</strong> : Connexion directe de la tablette à l'imprimante ceinture (Zebra ZQ520, Bixolon, Goojprt). Pas besoin de réseau Wi-Fi.
                </li>
                <li>
                  <strong>Protocole ESC/POS binaire</strong> : Envoi des octets de formatage de texte, saut de ligne, code-barres Code-128 et bitmap de la signature manuscrite directement dans le flux Bluetooth.
                </li>
                <li>
                  <strong>Android Print Framework</strong> : En cas de présence d'un réseau Wi-Fi avec imprimante réseau IP, utilisation du service d'impression standard d'Android via protocole IPP / Mopria.
                </li>
              </ul>
            </div>
          </div>

          {/* ESC/POS Code Protocol Example */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h4 className="font-bold text-slate-100 text-xs mb-2 flex items-center gap-2">
              <Printer className="w-4 h-4 text-amber-500" />
              Séquence de Commandes ESC/POS pour Ticket Thermique 80mm
            </h4>
            <pre className="bg-slate-950 p-3 rounded font-mono-num text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
{`// Initialisation & Centrage
[0x1B, 0x40]                    // ESC @ (Reset imprimante)
[0x1B, 0x61, 0x01]              // ESC a 1 (Alignement Centre)
"*** GASOILPRO PLANT ***\\n"
"TICKET DE DISTRIBUTION\\n"
"--------------------------------\\n"
[0x1B, 0x61, 0x00]              // ESC a 0 (Alignement Gauche)
"Ticket: TKT-2026-1402\\n"
"Vehicule: ENG-101 (Pelleteuse)\\n"
"Volume: 450.0 Litres\\n"
"Index: 6,420 h (Delta: +18 h)\\n"
"Ratio: 25.0 L/h\\n"
"Chauffeur: Nabil Zlitni\\n"
"--------------------------------\\n"
// Impression Graphique Bitmap Signature Manuscrite (GS v 0)
[0x1D, 0x76, 0x30, 0x00, ...]   // Données bitmap monochromes de la signature
"\\n\\n"
[0x1D, 0x56, 0x41, 0x10]        // GS V 65 16 (Coupe-papier automatique)`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
