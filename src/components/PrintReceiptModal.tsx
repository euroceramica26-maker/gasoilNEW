import React, { useState } from 'react';
import { StockEntry, FuelDispense, Citerne, Vehicle, User, Subscription, ClientCompanyInfo } from '../types';
import { resolveClientCompanyInfo, saveClientCompanyDetails } from '../lib/clientCompanyUtils';
import { Printer, X, CheckCircle, FileText, Download, CheckCircle2, Sliders, ExternalLink, Scale, Building2, Edit3, Save, MapPin, ShieldCheck, Phone } from 'lucide-react';

interface PrintReceiptModalProps {
  type: 'entree' | 'sortie';
  data: StockEntry | FuelDispense;
  citernes: Citerne[];
  vehicles?: Vehicle[];
  currentUser?: User | null;
  subscriptions?: Subscription[];
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  type,
  data,
  citernes,
  vehicles = [],
  currentUser,
  subscriptions = [],
  onClose
}) => {
  const [printFormat, setPrintFormat] = useState<'a4' | 'ticket80'>('a4');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);

  // Résolution dynamique des informations légales & coordonnées du compte client
  const baseClientInfo = resolveClientCompanyInfo({
    data,
    subscriptions,
    currentUser,
    activeLicenseKey: typeof window !== 'undefined' ? localStorage.getItem('hg_active_license') || '' : ''
  });

  const [clientInfo, setClientInfo] = useState<ClientCompanyInfo>(baseClientInfo);
  const [editFormData, setEditFormData] = useState<ClientCompanyInfo>(baseClientInfo);

  const handleSaveClientHeader = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = (data as any)?.clientId || currentUser?.clientId || 'default';
    saveClientCompanyDetails(targetId, editFormData, subscriptions);
    setClientInfo(editFormData);
    setIsEditClientModalOpen(false);
    setFeedback(`En-tête de document mis à jour pour « ${editFormData.entreprise} » !`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const isEntree = type === 'entree';
  const entry = isEntree ? (data as StockEntry) : null;
  const dispense = !isEntree ? (data as FuelDispense) : null;

  const targetCiterne = citernes.find(c => c.id === (entry ? entry.citerneId : dispense?.citerneId));
  const targetVehicle = dispense ? vehicles.find(v => v.id === dispense.vehiculeId) : null;

  const docTitle = isEntree ? 'Bon de Réception Gasoil (Entrée)' : 'Ticket de Distribution Carburant (Sortie)';
  const docRef = isEntree ? (entry?.numeroBon || 'BL-000') : (dispense?.codeTicket || 'TK-000');
  const docDate = new Date(isEntree ? (entry?.dateLivraison || '') : (dispense?.dateHeure || '')).toLocaleString('fr-FR');

  // Générateur du code HTML propre pour l'impression isolée (Iframe & Téléchargement autonome)
  const generateStandaloneHtml = (forDownload = false): string => {
    const isA4 = printFormat === 'a4';

    let specificContent = '';
    if (isEntree && entry) {
      specificContent = `
        <div style="margin-bottom: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: ${isA4 ? '13px' : '11px'};">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px; font-weight: bold; color: #475569; width: 45%;">Fournisseur :</td>
              <td style="padding: 4px; font-weight: bold; color: #0f172a;">${entry.fournisseur || ''}</td>
            </tr>
            <tr>
              <td style="padding: 4px; font-weight: bold; color: #475569;">Chauffeur Livreur :</td>
              <td style="padding: 4px; color: #1e293b;">${entry.chauffeurLivreur || ''}</td>
            </tr>
            <tr>
              <td style="padding: 4px; font-weight: bold; color: #475569;">Citerne Livreur :</td>
              <td style="padding: 4px; font-family: monospace; font-weight: bold; color: #1e293b;">${entry.immatriculationCiterneLivreur || ''}</td>
            </tr>
            <tr>
              <td style="padding: 4px; font-weight: bold; color: #475569;">Citerne Usine Cible :</td>
              <td style="padding: 4px; font-weight: bold; color: #0f172a;">${targetCiterne ? `${targetCiterne.code} - ${targetCiterne.nom}` : entry.citerneId}</td>
            </tr>
          </table>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: ${isA4 ? '13px' : '11px'}; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background: #0f172a; color: white;">
              <th style="padding: 8px; text-align: left;">Paramètre Mesuré</th>
              <th style="padding: 8px; text-align: right;">Valeur</th>
              <th style="padding: 8px; text-align: left;">Conformité</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: bold;">Volume Livré Ambiant</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 15px; color: #0284c7;">${entry.quantiteLivree.toLocaleString('fr-FR')} L</td>
              <td style="padding: 8px; color: #059669; font-weight: bold;">✓ Conforme BL</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #eff6ff;">
              <td style="padding: 8px; font-weight: bold; color: #1e3a8a;">Poids Net Gasoil (Masse)</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; font-family: monospace; font-size: 14px; color: #1d4ed8;">
                ${(entry.poidsKg || Math.round(entry.quantiteLivree * (entry.densiteMesuree || 0.840))).toLocaleString('fr-FR')} kg (${((entry.poidsKg || Math.round(entry.quantiteLivree * (entry.densiteMesuree || 0.840))) / 1000).toFixed(2)} T)
              </td>
              <td style="padding: 8px; color: #1d4ed8; font-weight: bold;">Masse Métrologique (V × d)</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
              <td style="padding: 8px;">Densité / Masse Volumique</td>
              <td style="padding: 8px; text-align: right; font-family: monospace;">${entry.densiteMesuree} kg/L</td>
              <td style="padding: 8px; color: #64748b;">NF EN ISO 3675</td>
            </tr>
            <tr>
              <td style="padding: 8px;">Température Produit</td>
              <td style="padding: 8px; text-align: right; font-family: monospace;">${entry.temperatureMesuree} °C</td>
              <td style="padding: 8px; color: #64748b;">Standard 15°C</td>
            </tr>
          </tbody>
        </table>
        ${entry.notes ? `<div style="padding: 8px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 4px; font-size: 11px; margin-bottom: 16px;"><strong>Remarques :</strong> ${entry.notes}</div>` : ''}
      `;
    } else if (dispense) {
      specificContent = `
        <div style="margin-bottom: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: ${isA4 ? '13px' : '11px'};">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px; font-weight: bold; color: #475569; width: 45%;">Plaque Immatriculation :</td>
              <td style="padding: 4px; font-weight: 800; font-family: monospace; font-size: 13px; color: #0f172a;">${targetVehicle?.immatriculation || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 4px; font-weight: bold; color: #475569;">Modèle & Marque :</td>
              <td style="padding: 4px; font-weight: bold; color: #0f172a;">${targetVehicle ? `${targetVehicle.modele} (${targetVehicle.marque} • ${targetVehicle.code})` : dispense.vehiculeId}</td>
            </tr>
            <tr>
              <td style="padding: 4px; font-weight: bold; color: #475569;">Citerne Source :</td>
              <td style="padding: 4px; font-weight: bold; color: #0f172a;">${targetCiterne ? `${targetCiterne.code} - ${targetCiterne.nom}` : dispense.citerneId}</td>
            </tr>
            <tr>
              <td style="padding: 4px; font-weight: bold; color: #475569;">Chauffeur / Opérateur :</td>
              <td style="padding: 4px; color: #1e293b;">${dispense.chauffeur || ''}</td>
            </tr>
            <tr>
              <td style="padding: 4px; font-weight: bold; color: #475569;">Pompiste Distributeur :</td>
              <td style="padding: 4px; color: #1e293b;">${dispense.pompiste || ''}</td>
            </tr>
          </table>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: ${isA4 ? '13px' : '11px'}; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background: #0f172a; color: white;">
              <th style="padding: 8px; text-align: left;">Désignation</th>
              <th style="padding: 8px; text-align: right;">Valeur</th>
              <th style="padding: 8px; text-align: left;">Unité / Détails</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px; font-weight: bold;">Volume Carburant Pistolet</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; font-size: 15px; color: #0284c7;">${dispense.volumeLivre.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L</td>
              <td style="padding: 8px; color: #64748b;">Distribution certifiée</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
              <td style="padding: 8px;">Compteur Actuel</td>
              <td style="padding: 8px; text-align: right; font-family: monospace; font-weight: bold;">${dispense.compteurActuel.toLocaleString('fr-FR')}</td>
              <td style="padding: 8px; color: #64748b;">${targetVehicle?.uniteMesure || 'km'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 8px;">Compteur Précédent</td>
              <td style="padding: 8px; text-align: right; font-family: monospace;">${dispense.compteurPrecedent.toLocaleString('fr-FR')}</td>
              <td style="padding: 8px; color: #64748b;">Delta: +${dispense.deltaCompteur}</td>
            </tr>
            <tr style="background: #f8fafc;">
              <td style="padding: 8px; font-weight: bold;">Ratio Consommation</td>
              <td style="padding: 8px; text-align: right; font-weight: bold; color: ${dispense.surconsommationAlerte ? '#dc2626' : '#059669'};">
                ${dispense.deltaCompteur === 0 || !dispense.ratioConsommation || dispense.ratioConsommation === 0
                  ? 'Stationnaire (N/A)' 
                  : `${dispense.ratioConsommation.toFixed(2)} ${targetVehicle?.uniteMesure === 'km' ? 'L/100km' : 'L/h'}`}
              </td>
              <td style="padding: 8px; font-size: 11px; font-weight: bold; color: ${dispense.surconsommationAlerte ? '#dc2626' : '#059669'};">
                ${dispense.deltaCompteur === 0 || !dispense.ratioConsommation || dispense.ratioConsommation === 0
                  ? '✓ Plein direct' 
                  : dispense.surconsommationAlerte ? '⚠ ALERTE CONSO' : '✓ Conforme'}
              </td>
            </tr>
          </tbody>
        </table>
        ${dispense.remarques ? `<div style="padding: 8px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 11px; margin-bottom: 16px;"><strong>Remarques :</strong> ${dispense.remarques}</div>` : ''}
      `;
    }

    const sigLeft = isEntree ? entry?.signatureBase64 : dispense?.signatureChauffeur;
    const sigRight = !isEntree ? dispense?.signaturePompiste : null;
    const nameLeft = isEntree ? (entry?.chauffeurLivreur || 'Chauffeur Livreur') : (dispense?.chauffeur || 'Chauffeur / Opérateur');
    const nameRight = isEntree ? (entry?.receptionnaireUsine || 'Visa Usine') : (dispense?.pompiste || 'Pompiste Distributeur');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${docTitle} - ${docRef}</title>
  <style>
    @page { size: auto; margin: 8mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: ${isA4 ? '20px' : '10px'};
      background: #ffffff;
      color: #0f172a;
    }
    .wrapper {
      max-width: ${isA4 ? '780px' : '320px'};
      margin: 0 auto;
      border: ${isA4 ? '2px solid #0f172a' : '1px dashed #64748b'};
      padding: ${isA4 ? '24px' : '14px'};
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title-banner {
      background: #0f172a;
      color: #ffffff;
      text-align: center;
      padding: 8px 12px;
      font-weight: bold;
      font-size: ${isA4 ? '14px' : '12px'};
      letter-spacing: 0.5px;
      margin-bottom: 16px;
      text-transform: uppercase;
    }
    .sig-row {
      display: flex;
      gap: 16px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 2px solid #0f172a;
    }
    .sig-box {
      flex: 1;
      font-size: 11px;
    }
    .sig-img {
      height: 70px;
      width: 100%;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 4px;
    }
    .sig-img img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: monospace;
    }
  </style>
  ${forDownload ? '<script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>' : ''}
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div>
        <div style="font-size: 10px; font-weight: 700; color: #b91c1c; letter-spacing: 1px; text-transform: uppercase;">🇲🇦 ROYAUME DU MAROC</div>
        <h2 style="margin: 1px 0 0 0; font-size: ${isA4 ? '18px' : '14px'}; font-weight: 800; color: #0f172a; text-transform: uppercase;">${clientInfo.entreprise}</h2>
        <div style="font-size: 10px; color: #475569; margin-top: 2px;">${clientInfo.depot}</div>
        <div style="font-size: 9px; color: #64748b;">${clientInfo.sousTitre} • ${clientInfo.adresse}</div>
        <div style="font-size: 8px; color: #94a3b8; margin-top: 2px; font-family: monospace;">ICE: ${clientInfo.ice} • ${clientInfo.rc} • ${clientInfo.identifiantFiscal}${clientInfo.telephone ? ` • Tél: ${clientInfo.telephone}` : ''}${clientInfo.email ? ` • Email: ${clientInfo.email}` : ''}</div>
      </div>
      <div style="text-align: right;">
        <div style="background: #0f172a; color: white; padding: 4px 8px; font-weight: bold; font-family: monospace; font-size: 12px; display: inline-block;">${docRef}</div>
        <div style="font-size: 10px; color: #475569; margin-top: 4px; font-family: monospace;">${docDate}</div>
      </div>
    </div>

    <div class="title-banner">
      ${isEntree ? 'Bon Officiel d’Entrée en Citerne (Dépotage)' : 'Ticket Officiel de Distribution Pistolet'}
    </div>

    ${specificContent}

    <div class="sig-row">
      <div class="sig-box">
        <strong>${isEntree ? 'Chauffeur Fournisseur :' : 'Chauffeur / Opérateur :'}</strong>
        <div style="color: #475569; margin-bottom: 2px;">${nameLeft}</div>
        <div class="sig-img">
          ${sigLeft ? `<img src="${sigLeft}" alt="Signature" />` : '<span style="color: #94a3b8; font-style: italic;">Signature enregistrée</span>'}
        </div>
      </div>

      <div class="sig-box">
        <strong>${isEntree ? 'Réceptionnaire Usine :' : 'Pompiste Distributeur :'}</strong>
        <div style="color: #475569; margin-bottom: 2px;">${nameRight}</div>
        <div class="sig-img">
          ${sigRight 
            ? `<img src="${sigRight}" alt="Signature Pompiste" />` 
            : '<div style="width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: flex-end; padding: 4px; font-size: 9px; color: #94a3b8; border-top: 1px dashed #cbd5e1;">Visa & Cachet Usine</div>'
          }
        </div>
      </div>
    </div>

    <div class="footer">
      <div>GASOILPRO MAROC v4.6 • Plateforme Conforme Normes Dépôts & Carburants Maroc • REF: ${isEntree ? entry?.id : dispense?.id}</div>
      <div style="letter-spacing: 2px; font-weight: bold;">|||| | ||||| ||| ||||||| ||</div>
    </div>
  </div>
</body>
</html>`;
  };

  // 1. Déclenchement de l'impression directe (Iframe isolé + window.print)
  const handlePrint = () => {
    setFeedback('Préparation du document et envoi vers l\'imprimante...');

    try {
      // Création d'une iframe cachée temporaire pour imprimer proprement sans les styles d'App
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const html = generateStandaloneHtml(false);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setFeedback('Impression transmise ! Si votre navigateur bloque la boîte de dialogue dans cet aperçu, utilisez le bouton "Télécharger Bon A4".');
          } catch (errIframe) {
            console.warn('Iframe print blocked, falling back to window.print():', errIframe);
            window.print();
          } finally {
            setTimeout(() => {
              try {
                document.body.removeChild(iframe);
              } catch {
                // ignore
              }
            }, 3000);
          }
        }, 300);
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Direct print fallback:', err);
      window.print();
      setFeedback('Fenêtre d\'impression lancée.');
    }
  };

  // 2. Téléchargement d'un fichier imprimable autonome (HTML / Prêt pour PDF)
  const handleDownload = () => {
    const html = generateStandaloneHtml(true);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeRef = docRef.replace(/[^a-zA-Z0-9-_]/g, '_');
    link.download = `${isEntree ? 'Bon-Reception' : 'Ticket-Distribution'}_${safeRef}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedback(`Fichier "${link.download}" téléchargé ! Ouvrez-le simplement dans votre navigateur pour l'imprimer ou l'enregistrer en PDF.`);
  };

  return (
    <div className="modal-backdrop-print fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Toolbar (No-Print) */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
                {docTitle}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono-num">
                Réf: {docRef} • {docDate}
              </p>
            </div>
          </div>

          {/* Action buttons & Format switcher */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Format toggle */}
            <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex text-xs">
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  printFormat === 'a4' 
                    ? 'bg-amber-500 text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Format A4
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('ticket80')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  printFormat === 'ticket80' 
                    ? 'bg-amber-500 text-slate-950 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ticket 80mm
              </button>
            </div>

            {/* Edit Client Header Button */}
            <button
              type="button"
              onClick={() => {
                setEditFormData(clientInfo);
                setIsEditClientModalOpen(true);
              }}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
              title="Personnaliser les informations de ce compte client sur le document"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Coordonnées Client</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 text-xs shadow-md transition cursor-pointer active:scale-95"
              title="Lancer l'impression directe"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer Direct</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-lg flex items-center gap-1.5 text-xs border border-slate-700 transition cursor-pointer active:scale-95"
              title="Télécharger le fichier imprimable autonome (HTML / PDF)"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Télécharger Bon</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between no-print animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Printable Document Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-900/60 flex justify-center">
          <div 
            id="printable-document-area"
            className={`printable-receipt w-full bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-lg border border-slate-200 transition-all ${
              printFormat === 'ticket80' ? 'max-w-sm' : 'max-w-xl'
            }`}
          >
            {/* En-tête officiel avec coordonnées du compte client */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
              <div>
                <div className="text-[10px] font-bold text-red-600 tracking-wider uppercase flex items-center gap-1">
                  <span>🇲🇦 ROYAUME DU MAROC</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 uppercase font-industrial mt-0.5">
                  {clientInfo.entreprise}
                </h1>
                <p className="text-xs text-slate-700 font-semibold mt-0.5">
                  {clientInfo.depot}
                </p>
                <p className="text-[10px] text-slate-500">
                  {clientInfo.sousTitre} • {clientInfo.adresse}
                </p>
                <p className="text-[11px] text-slate-600 font-mono-num font-medium mt-0.5">
                  ICE: {clientInfo.ice} • {clientInfo.rc} • {clientInfo.identifiantFiscal}{clientInfo.telephone ? ` • Tél: ${clientInfo.telephone}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-mono-num font-bold text-xs rounded">
                  {docRef}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 font-mono-num">
                  {docDate}
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="bg-slate-100 p-2.5 rounded border border-slate-300 text-center mb-4">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
                {isEntree 
                  ? 'BON DE RÉCEPTION ET DÉPOTAGE CARBURANT (ENTRÉE DE STOCK)' 
                  : 'BON DE DISTRIBUTION CARBURANT (SORTIE DE STOCK)'
                }
              </h2>
            </div>

            {/* Details Table */}
            {isEntree && entry && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-500 block font-medium">Fournisseur :</span>
                    <span className="font-bold text-slate-900 text-sm">{entry.fournisseur}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Chauffeur Livreur :</span>
                    <span className="font-semibold text-slate-800">{entry.chauffeurLivreur}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Citerne Porteuse / Tracteur :</span>
                    <span className="font-mono-num font-bold text-slate-800">{entry.immatriculationCiterneLivreur}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Citerne Cible Usine :</span>
                    <span className="font-semibold text-slate-800">
                      {targetCiterne ? `${targetCiterne.code} - ${targetCiterne.nom}` : entry.citerneId}
                    </span>
                  </div>
                </div>

                {/* Quantities & Parameters */}
                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="p-2">Paramètre Mesuré</th>
                        <th className="p-2 text-right">Valeur</th>
                        <th className="p-2">Conformité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2 font-medium">Volume Livré (Température Ambiante)</td>
                        <td className="p-2 text-right font-mono-num font-bold text-sm text-slate-950">
                          {entry.quantiteLivree.toLocaleString('fr-FR')} Litres
                        </td>
                        <td className="p-2 text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Conforme BL
                        </td>
                      </tr>
                      <tr className="bg-blue-50/70 font-semibold">
                        <td className="p-2 text-blue-950 font-bold flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-blue-600" />
                          <span>Poids Net Gasoil Dépoté (Masse)</span>
                        </td>
                        <td className="p-2 text-right font-mono-num font-bold text-blue-900">
                          {(entry.poidsKg || Math.round(entry.quantiteLivree * (entry.densiteMesuree || 0.840))).toLocaleString('fr-FR')} kg
                          <span className="text-[11px] font-normal text-blue-700 ml-1">({((entry.poidsKg || Math.round(entry.quantiteLivree * (entry.densiteMesuree || 0.840))) / 1000).toFixed(2)} T)</span>
                        </td>
                        <td className="p-2 text-blue-800 font-bold">Masse Métrologique (V × d)</td>
                      </tr>
                      <tr>
                        <td className="p-2">Masse Volumique (Densité)</td>
                        <td className="p-2 text-right font-mono-num">{entry.densiteMesuree} kg/L</td>
                        <td className="p-2 text-slate-600">Norme NF EN ISO 3675</td>
                      </tr>
                      <tr>
                        <td className="p-2">Température Produit au Dépotage</td>
                        <td className="p-2 text-right font-mono-num">{entry.temperatureMesuree} °C</td>
                        <td className="p-2 text-slate-600">Compensation standard 15°C</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {entry.notes && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-slate-700">
                    <span className="font-semibold block text-[11px] text-amber-900">Observations / Contrôle Scellés :</span>
                    <p className="italic">{entry.notes}</p>
                  </div>
                )}
              </div>
            )}

            {!isEntree && dispense && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-500 block font-medium">Immatriculation Véhicule :</span>
                    <span className="font-mono-num font-extrabold text-slate-900 text-sm bg-slate-200 px-2 py-0.5 rounded border border-slate-300 inline-block mb-1">
                      {targetVehicle?.immatriculation || 'Non renseignée'}
                    </span>
                    <span className="text-slate-500 block font-medium mt-1">Modèle & Marque :</span>
                    <span className="font-bold text-slate-900 text-xs block">
                      {targetVehicle ? `${targetVehicle.modele} (${targetVehicle.marque})` : dispense.vehiculeId}
                    </span>
                    <span className="text-slate-600 block text-[11px] mt-0.5">
                      Réf: {targetVehicle?.code} • {targetVehicle?.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Citerne Source / Volucompteur :</span>
                    <span className="font-semibold text-slate-800">
                      {targetCiterne ? `${targetCiterne.code} (${targetCiterne.nom})` : dispense.citerneId}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Chauffeur / Opérateur Engin :</span>
                    <span className="font-semibold text-slate-800">{dispense.chauffeur}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Pompiste Distributeur :</span>
                    <span className="font-semibold text-slate-800">{dispense.pompiste}</span>
                  </div>
                </div>

                {/* Metrics Table */}
                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="p-2">Désignation</th>
                        <th className="p-2 text-right">Index / Quantité</th>
                        <th className="p-2">Unité / Analyse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2 font-medium">Volume Carburant Pompé</td>
                        <td className="p-2 text-right font-mono-num font-bold text-sm text-slate-950">
                          {dispense.volumeLivre.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} Litres
                        </td>
                        <td className="p-2 text-slate-600">Distribution pistolet étalonné</td>
                      </tr>
                      <tr>
                        <td className="p-2">Compteur Actuel</td>
                        <td className="p-2 text-right font-mono-num">{dispense.compteurActuel.toLocaleString('fr-FR')}</td>
                        <td className="p-2 text-slate-600">{targetVehicle?.uniteMesure || 'km'}</td>
                      </tr>
                      <tr>
                        <td className="p-2">Compteur Précédent</td>
                        <td className="p-2 text-right font-mono-num">{dispense.compteurPrecedent.toLocaleString('fr-FR')}</td>
                        <td className="p-2 text-slate-600">Delta: +{dispense.deltaCompteur} {targetVehicle?.uniteMesure}</td>
                      </tr>
                      <tr className={dispense.surconsommationAlerte && dispense.deltaCompteur > 0 ? 'bg-red-50 text-red-950 font-bold' : ''}>
                        <td className="p-2 font-semibold">Ratio Consommation Calculé</td>
                        <td className="p-2 text-right font-mono-num font-bold">
                          {dispense.deltaCompteur === 0 || !dispense.ratioConsommation || dispense.ratioConsommation === 0
                            ? 'Stationnaire (N/A)'
                            : `${dispense.ratioConsommation.toFixed(2)} ${targetVehicle?.uniteMesure === 'km' ? 'L/100km' : 'L/h'}`}
                        </td>
                        <td className="p-2">
                          {dispense.deltaCompteur === 0 || !dispense.ratioConsommation || dispense.ratioConsommation === 0 ? (
                            <span className="text-slate-600 font-medium">Plein direct sans déplacement</span>
                          ) : dispense.surconsommationAlerte ? (
                            <span className="text-red-700 font-bold">ALERTE SURCONSOMMATION</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Dans les tolérances usine</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {dispense.remarques && (
                  <div className="p-2 bg-slate-100 border border-slate-200 rounded text-slate-700 text-xs">
                    <span className="font-semibold block text-[11px] text-slate-900">Remarques :</span>
                    <p>{dispense.remarques}</p>
                  </div>
                )}
              </div>
            )}

            {/* Signatures Row */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mt-5 pt-4 border-t-2 border-slate-900 text-xs">
              <div>
                <span className="block font-semibold text-slate-700 mb-0.5">
                  {isEntree ? 'Pour le Fournisseur / Livreur :' : 'Le Chauffeur / Opérateur Engin :'}
                </span>
                <p className="text-[11px] text-slate-500 mb-1.5 truncate">
                  {isEntree ? entry?.chauffeurLivreur : dispense?.chauffeur}
                </p>
                {/* Signature preview */}
                <div className="h-16 sm:h-20 border border-slate-300 rounded bg-slate-50 flex items-center justify-center p-1.5">
                  {(isEntree ? entry?.signatureBase64 : dispense?.signatureChauffeur) ? (
                    <img 
                      src={isEntree ? entry?.signatureBase64 : dispense?.signatureChauffeur} 
                      alt="Signature" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Signature enregistrée</span>
                  )}
                </div>
              </div>

              <div>
                <span className="block font-semibold text-slate-700 mb-0.5">
                  {isEntree ? "Pour l'Usine (Réceptionnaire) :" : "Le Pompiste Distributeur :"}
                </span>
                <p className="text-[11px] text-slate-500 mb-1.5 truncate">
                  {isEntree ? entry?.receptionnaireUsine : dispense?.pompiste}
                </p>
                <div className="h-16 sm:h-20 border border-slate-300 rounded bg-slate-50 flex items-center justify-center p-1.5">
                  {(!isEntree && dispense?.signaturePompiste) ? (
                    <img 
                      src={dispense.signaturePompiste} 
                      alt="Signature Pompiste" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col justify-end text-right">
                      <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
                        {isEntree ? 'Visa & Tampon Officiel Usine' : 'Visa & Signature du Pompiste'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Barcode Simulation & Legal Notice */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
              <div className="font-mono-num">
                SYSTEME: GASOILPRO v4.2 • REF: {isEntree ? entry?.id : dispense?.id}
              </div>
              <div className="tracking-widest font-mono-num font-bold text-slate-700">
                |||| | ||||| ||| ||||||| || |||||| |
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: PERSONNALISATION DIRECTE DE L'EN-TÊTE CLIENT */}
      {isEditClientModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in no-print">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Coordonnées & En-tête du Compte Client
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditClientModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClientHeader} className="p-4 space-y-3 overflow-y-auto text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Raison Sociale / Nom de l'Entreprise Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.entreprise}
                  onChange={e => setEditFormData({ ...editFormData, entreprise: e.target.value })}
                  placeholder="Ex: EUROCERAMICA MAROC SA, AFRIQUIA LOGISTIQUE..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-semibold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nom du Dépôt / Site de Stockage *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.depot}
                    onChange={e => setEditFormData({ ...editFormData, depot: e.target.value })}
                    placeholder="Ex: Dépôt & Parc Cuves"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Ville *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.ville}
                    onChange={e => setEditFormData({ ...editFormData, ville: e.target.value })}
                    placeholder="Ex: Casablanca, Tanger..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Fiscal details */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Identifiants Fiscaux Marocains
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      N° ICE (15 chiffres)
                    </label>
                    <input
                      type="text"
                      value={editFormData.ice}
                      onChange={e => setEditFormData({ ...editFormData, ice: e.target.value })}
                      placeholder="Ex: 003124567000012"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-[11px] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      N° RC
                    </label>
                    <input
                      type="text"
                      value={editFormData.rc}
                      onChange={e => setEditFormData({ ...editFormData, rc: e.target.value })}
                      placeholder="Ex: RC Casablanca 584920"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-[11px] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      IF (Identifiant Fiscal)
                    </label>
                    <input
                      type="text"
                      value={editFormData.identifiantFiscal}
                      onChange={e => setEditFormData({ ...editFormData, identifiantFiscal: e.target.value })}
                      placeholder="Ex: IF: 49281045"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono text-[11px] focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Adresse Complète
                  </label>
                  <input
                    type="text"
                    value={editFormData.adresse}
                    onChange={e => setEditFormData({ ...editFormData, adresse: e.target.value })}
                    placeholder="Zone Industrielle..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Téléphone Direct
                  </label>
                  <input
                    type="text"
                    value={editFormData.telephone}
                    onChange={e => setEditFormData({ ...editFormData, telephone: e.target.value })}
                    placeholder="+212 5 22 00 00 00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Sous-titre / Spécifications Métrologiques
                </label>
                <input
                  type="text"
                  value={editFormData.sousTitre}
                  onChange={e => setEditFormData({ ...editFormData, sousTitre: e.target.value })}
                  placeholder="Spécifications Métrologiques & Contrôle Carburant Gasoil 10ppm"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditClientModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Appliquer au Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
