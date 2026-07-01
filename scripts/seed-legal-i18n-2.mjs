// Traducciones EN/FR/IT de los documentos legales secundarios.
// Uso: NODE_OPTIONS=--use-system-ca node scripts/seed-legal-i18n-2.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const EMAIL = 'info@legacy-fan.com';
const SEDE = '8 The Green STE R, Dover, DE 19901 (Delaware, USA)';

const DOCS = {
  en: {
    returns: { title: 'Returns and withdrawal policy', body: `RETURNS AND RIGHT OF WITHDRAWAL

1. Withdrawal. EU consumers have 14 calendar days from receipt to withdraw, except legal exceptions (custom-made/personalised goods, or services already provided with your express consent).

2. Reservation deposit. The 50 €/$ deposit is refundable until the closing or launch stated in each campaign; after that it may not be refundable.

3. Subscription. You can cancel the automatic renewal anytime from your account; cancellation stops future charges and does not entitle you to a refund of the period already started, except as required by law.

4. Damaged or wrong items. If you receive a defective or incorrect piece, contact us within 14 days for replacement or refund.

5. How to request it. Write to ${EMAIL} with your member or order number. We will guide you.

6. Refunds. Made via the same payment method within a reasonable time after the return is approved.` },
    shipping: { title: 'Shipping policy', body: `SHIPPING POLICY

1. Scope. We ship to the countries enabled in each campaign.

2. Times. Times depend on each piece's launch and destination; shown on the item page and in your account. Pre-sale pieces ship after production.

3. Costs. Shipping costs are calculated and shown before completing the purchase. Some categories may include free shipping as indicated.

4. Customs. International shipments may incur duties or taxes at destination, payable by the recipient unless stated otherwise.

5. Tracking. We provide tracking information when the shipment leaves.

6. Issues. For losses or transit damage, contact ${EMAIL}.` },
    membership: { title: 'Membership terms', body: `MEMBERSHIP TERMS

1. Tiers. Legacy Prime Club and Legacy Prestige Club, with the benefits described on each club page.

2. Sign-up. Membership is activated with the full payment, which assigns a permanent, unique member number.

3. Duration and renewal. Membership is annual. If taken as a subscription, it renews automatically every 12 months at the current price, unless cancelled beforehand from your account ("Subscription" section). We will inform you of the amount before each renewal where required by law.

4. Cancellation. You can cancel the renewal anytime from your account; you keep access until the end of the period already paid. The member number is permanent.

5. Benefits. Access to private community, pre-sales, content and other tier perks. Pre-sale priority may rank behind higher tiers.

6. Non-payment/suspension. Non-payment of a renewal may suspend benefits until regularised.

7. Changes. We may update benefits and terms with reasonable prior notice.` },
    points: { title: 'Points program terms', body: `POINTS PROGRAM

1. Earning. You earn points on purchases per the current ratio.

2. Calculation base. Points and discounts apply ONLY to the premium, NEVER to the metal spot value.

3. Redemption. Points may be redeemed per the rules and balance available in your account.

4. Expiry. Points expire per the configured period (by default, the indicated number of years from earning).

5. Nature. Points are not money, not redeemable for cash and not transferable, unless stated otherwise.

6. Changes. We may adjust the program with reasonable prior notice.` },
    referrals: { title: 'Referral program terms', body: `REFERRAL PROGRAM

1. How it works. Share your link or code; when the referred person completes membership sign-up, the configured reward is activated.

2. Reward. The reward is credited as INTERNAL BALANCE, is not money or cash-withdrawable, and applies to future purchases.

3. Conditions. Self-referrals and fraudulent or duplicate accounts are not allowed; Legacy Fan may void rewards obtained irregularly.

4. Changes. We may modify or end the program with reasonable prior notice.

5. Contact. ${EMAIL}.` },
    'aviso-legal': { title: 'Legal notice', body: `LEGAL NOTICE AND PROVIDER IDENTIFICATION

Site owner: Legacy Fan LLC.
Address: ${SEDE}.
Registration: limited liability company (LLC) formed in the State of Delaware (USA).
Contact: ${EMAIL}.
Website: store.legacy-fan.com.

Purpose. This site is an online store of collecting memberships (Legacy Prime Club and Legacy Prestige Club) and collectible precious-metal pieces.

Terms of use. Accessing and using the site implies acceptance of this Legal Notice, the Terms and Conditions, the Privacy Policy and the Cookie Policy.

Intellectual property. Contents, trademarks, logos, designs and images belong to Legacy Fan or licensed third parties and may not be reproduced without authorisation.

Liability. Legacy Fan is not liable for misuse of the site or interruptions beyond its control. Third-party links are provided for information only.

Law and jurisdiction. See the corresponding section in the Terms and Conditions.` },
  },
  fr: {
    returns: { title: 'Politique de retours et rétractation', body: `RETOURS ET DROIT DE RÉTRACTATION

1. Rétractation. Les consommateurs de l'UE disposent de 14 jours calendaires dès réception pour se rétracter, sauf exceptions légales (biens personnalisés/sur mesure, ou services déjà fournis avec votre consentement exprès).

2. Acompte de réservation. L'acompte de 50 €/$ est remboursable jusqu'à la clôture ou au lancement indiqué dans chaque campagne ; passé ce délai il peut ne pas être remboursable.

3. Abonnement. Vous pouvez annuler le renouvellement automatique à tout moment depuis votre compte ; l'annulation arrête les futurs prélèvements et n'ouvre pas droit au remboursement de la période déjà commencée, sauf si la loi l'exige.

4. Articles endommagés ou erronés. Si vous recevez une pièce défectueuse ou incorrecte, contactez-nous sous 14 jours pour remplacement ou remboursement.

5. Comment le demander. Écrivez à ${EMAIL} avec votre numéro de membre ou de commande. Nous vous guiderons.

6. Remboursements. Effectués par le même moyen de paiement dans un délai raisonnable après approbation du retour.` },
    shipping: { title: 'Politique d’expédition', body: `POLITIQUE D'EXPÉDITION

1. Portée. Nous expédions vers les pays activés dans chaque campagne.

2. Délais. Les délais dépendent du lancement de chaque pièce et de la destination ; indiqués sur la fiche et dans votre compte. Les pièces en prévente sont expédiées après production.

3. Frais. Les frais de port sont calculés et affichés avant de finaliser l'achat. Certaines catégories peuvent inclure la livraison gratuite comme indiqué.

4. Douane. Les envois internationaux peuvent entraîner des droits ou taxes à destination, à la charge du destinataire sauf indication contraire.

5. Suivi. Nous fournissons les informations de suivi au départ de l'envoi.

6. Incidents. En cas de perte ou de dommage en transit, contactez ${EMAIL}.` },
    membership: { title: 'Conditions d’adhésion', body: `CONDITIONS D'ADHÉSION

1. Niveaux. Legacy Prime Club et Legacy Prestige Club, avec les avantages décrits sur chaque page de club.

2. Adhésion. L'adhésion est activée par le paiement complet, qui attribue un numéro de membre permanent et unique.

3. Durée et renouvellement. L'adhésion est annuelle. Souscrite en abonnement, elle se renouvelle automatiquement tous les 12 mois au prix en vigueur, sauf annulation préalable depuis votre compte (section « Abonnement »). Nous vous informerons du montant avant chaque renouvellement lorsque la loi l'exige.

4. Annulation. Vous pouvez annuler le renouvellement à tout moment depuis votre compte ; vous conservez l'accès jusqu'à la fin de la période payée. Le numéro de membre est permanent.

5. Avantages. Accès à la communauté privée, préventes, contenus et autres avantages du niveau. La priorité de prévente peut passer après les niveaux supérieurs.

6. Impayé/suspension. Le non-paiement d'un renouvellement peut suspendre les avantages jusqu'à régularisation.

7. Modifications. Nous pouvons mettre à jour les avantages et conditions avec un préavis raisonnable.` },
    points: { title: 'Conditions du programme de points', body: `PROGRAMME DE POINTS

1. Acquisition. Vous accumulez des points sur les achats selon le ratio en vigueur.

2. Base de calcul. Les points et remises s'appliquent UNIQUEMENT sur le premium, JAMAIS sur la valeur spot du métal.

3. Utilisation. Les points peuvent être utilisés selon les règles et le solde disponibles dans votre compte.

4. Expiration. Les points expirent selon la durée configurée (par défaut, le nombre d'années indiqué depuis leur acquisition).

5. Nature. Les points ne sont pas de l'argent, non convertibles en espèces ni transférables, sauf indication contraire.

6. Modifications. Nous pouvons ajuster le programme avec un préavis raisonnable.` },
    referrals: { title: 'Conditions du programme de parrainage', body: `PROGRAMME DE PARRAINAGE

1. Fonctionnement. Partagez votre lien ou code ; lorsque la personne parrainée finalise son adhésion, la récompense configurée est activée.

2. Récompense. La récompense est créditée comme SOLDE INTERNE, n'est pas de l'argent ni retirable en espèces, et s'applique aux futurs achats.

3. Conditions. L'auto-parrainage et les comptes frauduleux ou en double ne sont pas admis ; Legacy Fan peut annuler les récompenses obtenues de façon irrégulière.

4. Modifications. Nous pouvons modifier ou clôturer le programme avec un préavis raisonnable.

5. Contact. ${EMAIL}.` },
    'aviso-legal': { title: 'Mentions légales', body: `MENTIONS LÉGALES ET IDENTIFICATION DU PRESTATAIRE

Titulaire du site : Legacy Fan LLC.
Adresse : ${SEDE}.
Enregistrement : société à responsabilité limitée (LLC) constituée dans l'État du Delaware (États-Unis).
Contact : ${EMAIL}.
Site web : store.legacy-fan.com.

Objet. Ce site est une boutique en ligne d'abonnements de collection (Legacy Prime Club et Legacy Prestige Club) et de pièces de collection en métaux précieux.

Conditions d'utilisation. L'accès et l'utilisation du site impliquent l'acceptation des présentes mentions légales, des Conditions générales, de la Politique de confidentialité et de la Politique de cookies.

Propriété intellectuelle. Les contenus, marques, logos, designs et images appartiennent à Legacy Fan ou à des tiers sous licence et ne peuvent être reproduits sans autorisation.

Responsabilité. Legacy Fan n'est pas responsable de l'usage abusif du site ni des interruptions hors de son contrôle. Les liens vers des sites tiers sont fournis à titre informatif.

Loi et juridiction. Voir la section correspondante dans les Conditions générales.` },
  },
  it: {
    returns: { title: 'Politica di resi e recesso', body: `RESI E DIRITTO DI RECESSO

1. Recesso. I consumatori UE dispongono di 14 giorni di calendario dal ricevimento per recedere, salvo eccezioni legali (beni personalizzati/su misura, o servizi già forniti con il tuo consenso espresso).

2. Deposito di prenotazione. Il deposito di 50 €/$ è rimborsabile fino alla chiusura o al lancio indicato in ogni campagna; dopo tale momento potrebbe non essere rimborsabile.

3. Abbonamento. Puoi annullare il rinnovo automatico in qualsiasi momento dal tuo account; l'annullamento ferma gli addebiti futuri e non dà diritto al rimborso del periodo già iniziato, salvo quanto richiesto dalla legge.

4. Prodotti danneggiati o errati. Se ricevi un pezzo difettoso o errato, contattaci entro 14 giorni per sostituzione o rimborso.

5. Come richiederlo. Scrivi a ${EMAIL} indicando il numero di socio o ordine. Ti guideremo.

6. Rimborsi. Effettuati con lo stesso metodo di pagamento entro un tempo ragionevole dopo l'approvazione del reso.` },
    shipping: { title: 'Politica di spedizione', body: `POLITICA DI SPEDIZIONE

1. Ambito. Spediamo nei paesi abilitati in ogni campagna.

2. Tempi. I tempi dipendono dal lancio di ogni pezzo e dalla destinazione; indicati nella scheda e nel tuo account. I pezzi in prevendita si spediscono dopo la produzione.

3. Costi. Le spese di spedizione sono calcolate e mostrate prima di completare l'acquisto. Alcune categorie possono includere spedizione gratuita come indicato.

4. Dogana. Le spedizioni internazionali possono comportare dazi o imposte a destinazione, a carico del destinatario salvo diversa indicazione.

5. Tracciamento. Forniamo le informazioni di tracciamento alla partenza della spedizione.

6. Problemi. Per smarrimenti o danni in transito, contatta ${EMAIL}.` },
    membership: { title: 'Condizioni di abbonamento', body: `CONDIZIONI DI ABBONAMENTO

1. Livelli. Legacy Prime Club e Legacy Prestige Club, con i vantaggi descritti in ogni pagina di club.

2. Iscrizione. L'abbonamento si attiva con il pagamento completo, che assegna un numero di socio permanente e unico.

3. Durata e rinnovo. L'abbonamento è annuale. Se sottoscritto come abbonamento, si rinnova automaticamente ogni 12 mesi al prezzo vigente, salvo annullamento preventivo dal tuo account (sezione «Abbonamento»). Ti informeremo dell'importo prima di ogni rinnovo quando la legge lo richiede.

4. Annullamento. Puoi annullare il rinnovo in qualsiasi momento dal tuo account; mantieni l'accesso fino alla fine del periodo già pagato. Il numero di socio è permanente.

5. Vantaggi. Accesso a comunità privata, prevendite, contenuti e altri vantaggi del livello. La priorità di prevendita può collocarsi dopo i livelli superiori.

6. Mancato pagamento/sospensione. Il mancato pagamento di un rinnovo può sospendere i vantaggi fino alla regolarizzazione.

7. Modifiche. Potremo aggiornare vantaggi e condizioni con ragionevole preavviso.` },
    points: { title: 'Condizioni del programma punti', body: `PROGRAMMA PUNTI

1. Accumulo. Accumuli punti sugli acquisti secondo il rapporto vigente.

2. Base di calcolo. Punti e sconti si applicano SOLO sul premium, MAI sul valore spot del metallo.

3. Riscatto. I punti possono essere riscattati secondo le regole e il saldo disponibili nel tuo account.

4. Scadenza. I punti scadono secondo il periodo configurato (per impostazione predefinita, gli anni indicati dall'accumulo).

5. Natura. I punti non sono denaro, non riscattabili in contanti né trasferibili, salvo diversa indicazione.

6. Modifiche. Potremo modificare il programma con ragionevole preavviso.` },
    referrals: { title: 'Condizioni del programma referral', body: `PROGRAMMA REFERRAL

1. Funzionamento. Condividi il tuo link o codice; quando la persona segnalata completa l'iscrizione, si attiva la ricompensa configurata.

2. Ricompensa. La ricompensa è accreditata come SALDO INTERNO, non è denaro né prelevabile in contanti, e si applica ad acquisti futuri.

3. Condizioni. Non sono ammessi auto-referral né account fraudolenti o duplicati; Legacy Fan può annullare ricompense ottenute irregolarmente.

4. Modifiche. Potremo modificare o terminare il programma con ragionevole preavviso.

5. Contatto. ${EMAIL}.` },
    'aviso-legal': { title: 'Note legali', body: `NOTE LEGALI E IDENTIFICAZIONE DEL PRESTATORE

Titolare del sito: Legacy Fan LLC.
Indirizzo: ${SEDE}.
Registrazione: società a responsabilità limitata (LLC) costituita nello Stato del Delaware (USA).
Contatto: ${EMAIL}.
Sito web: store.legacy-fan.com.

Oggetto. Questo sito è un negozio online di abbonamenti da collezione (Legacy Prime Club e Legacy Prestige Club) e di pezzi da collezione in metalli preziosi.

Condizioni d'uso. L'accesso e l'uso del sito implicano l'accettazione delle presenti Note legali, dei Termini e condizioni, della Politica sulla privacy e della Politica sui cookie.

Proprietà intellettuale. Contenuti, marchi, loghi, design e immagini appartengono a Legacy Fan o a terzi su licenza e non possono essere riprodotti senza autorizzazione.

Responsabilità. Legacy Fan non è responsabile dell'uso improprio del sito né di interruzioni fuori dal proprio controllo. I link a siti di terzi sono forniti solo a titolo informativo.

Legge e foro. Vedi la sezione corrispondente nei Termini e condizioni.` },
  },
};

async function main() {
  for (const [locale, docs] of Object.entries(DOCS)) {
    for (const [slug, doc] of Object.entries(docs)) {
      await prisma.legalPage.upsert({
        where: { slug_locale: { slug, locale } },
        update: { title: doc.title, body: doc.body },
        create: { slug, locale, title: doc.title, body: doc.body },
      });
      console.log('guardado:', locale, slug);
    }
  }
  await prisma.$disconnect();
}
main();
