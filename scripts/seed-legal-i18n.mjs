// Traducciones EN/FR/IT de los documentos legales principales (terms, privacy,
// cookies). Base orientativa; revisar con asesor legal. Los demás documentos
// usan ES por fallback hasta traducirse.
// Uso: NODE_OPTIONS=--use-system-ca node scripts/seed-legal-i18n.mjs
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const EMAIL = 'info@legacy-fan.com';

const DOCS = {
  en: {
    terms: {
      title: 'Terms and conditions',
      body: `TERMS AND CONDITIONS OF SALE AND USE

1. Provider. Owner: Legacy Fan [legal name], registered office in Dover, Delaware (USA), contact ${EMAIL}.

2. Purpose. These terms govern membership sign-up, the reservation, payment and delivery of the Legacy Prime Club and Legacy Prestige Club memberships and their associated collectible pieces.

3. Nature of the product. Products are COLLECTIBLE items in precious metals. They are NOT a financial product, an investment, or a promise of profitability or appreciation.

4. Purchase process. (a) Reservation: a 50 €/$ deposit that secures your spot, is refundable per section 8 and is deducted from the full payment. (b) Full payment: pays the membership price; once completed a permanent member number is assigned. Price and applicable taxes are shown before you confirm.

5. Membership and renewal. Membership is ANNUAL. When taken as a subscription, it RENEWS AUTOMATICALLY every 12 months at the then-current price, charged to your payment method unless you cancel before the renewal date from your account ("Subscription" section). The member number is permanent even if you do not renew.

6. Second coin (Prestige). You may reserve the second coin with a deposit or purchase it at the stated discount; discounts apply to the premium, never to the metal spot value.

7. Prices and taxes. Prices are shown in EUR or USD as selected. Applicable taxes and shipping costs are shown before completing the purchase.

8. Right of withdrawal. EU consumers have 14 calendar days to withdraw, except for legal exceptions (e.g. custom-made or personalised goods, or services already performed with your consent). The reservation deposit is refundable until closing/launch as indicated. To exercise it, write to ${EMAIL}.

9. Mystery Box. Contents keep a surprise factor, always guaranteeing the stated minimum.

10. Points, discounts and referrals. Governed by their specific terms. Points and discounts apply only to the premium. Referral balance is internal and not cash-withdrawable.

11. Delivery. Times and shipping costs are detailed in the Shipping Policy.

12. Cancellation and refunds. See the Returns Policy and section 5 for the subscription.

13. Data protection. We process your data per the Privacy Policy.

14. Governing law and jurisdiction. [State the applicable law and competent courts; mandatory consumer-protection rules of EU consumers' country of residence will be respected.]

15. Contact. ${EMAIL}.`,
    },
    privacy: {
      title: 'Privacy policy',
      body: `PRIVACY POLICY (GDPR)

1. Controller: Legacy Fan [legal name], Dover, Delaware. Contact: ${EMAIL}.

2. Data we process. Sign-up and profile data (first name, last name, email, phone, country), purchase and membership data, and technical browsing data. We do not store full card data: payment is processed by the gateway (PayPal).

3. Purposes and legal basis. (a) Manage your account, reservation, payment and membership — contract performance. (b) Service communications — contract performance. (c) Newsletter and marketing — consent. (d) Legal and tax compliance — legal obligation. (e) Fraud prevention and security — legitimate interest.

4. Retention. We keep data while the relationship lasts and, afterwards, for the applicable legal periods (tax, accounting).

5. Recipients and processors. We share data with service providers: payment gateway (PayPal), email delivery (Resend), hosting (Railway) and, where applicable, carriers. They act as processors under contract.

6. International transfers. Some providers may be outside the EEA; in that case appropriate safeguards apply (standard contractual clauses or others).

7. Your rights. Access, rectification, erasure, objection, restriction and portability. To exercise them write to ${EMAIL}. You may lodge a complaint with the competent supervisory authority.

8. Security. We apply reasonable technical and organisational measures (hashed passwords, access control, secure connections).

9. Minors. The service is not directed at minors.

10. Changes. We may update this policy; the current version will be published on this page.`,
    },
    cookies: {
      title: 'Cookie policy',
      body: `COOKIE POLICY

1. What they are. Cookies and similar technologies are small files stored on your device so the site works and to remember your preferences.

2. Cookies we use. (a) Technical/necessary: session and login, language and currency preference, light/dark theme and cookie consent. They are essential and do not require consent. (b) Analytics or third-party: only enabled if we add them and with your prior consent.

3. Consent management. On entry you will see a notice to accept or reject non-necessary cookies. You can change your choice by deleting cookies in your browser.

4. How to disable them. You can set your browser to block or delete cookies; some features may stop working properly.

5. Third parties. Services such as PayPal may set their own cookies when you use their gateway; check their policies.

6. Contact. ${EMAIL}.`,
    },
  },
  fr: {
    terms: {
      title: 'Conditions générales',
      body: `CONDITIONS GÉNÉRALES DE VENTE ET D'UTILISATION

1. Prestataire. Titulaire : Legacy Fan [raison sociale], siège à Dover, Delaware (États-Unis), contact ${EMAIL}.

2. Objet. Ces conditions régissent l'adhésion, la réservation, le paiement et la livraison des abonnements Legacy Prime Club et Legacy Prestige Club et des pièces de collection associées.

3. Nature du produit. Les produits sont des articles DE COLLECTION en métaux précieux. Ils NE constituent PAS un produit financier, un investissement, ni une promesse de rentabilité ou de plus-value.

4. Processus d'achat. (a) Réservation : un acompte de 50 €/$ qui garantit votre place, remboursable selon le point 8 et déduit du paiement complet. (b) Paiement complet : règle le prix de l'abonnement ; une fois effectué, un numéro de membre permanent est attribué. Le prix et les taxes applicables sont affichés avant la confirmation.

5. Abonnement et renouvellement. L'abonnement est ANNUEL. Souscrit en tant qu'abonnement, il SE RENOUVELLE AUTOMATIQUEMENT tous les 12 mois au prix en vigueur, prélevé sur votre moyen de paiement sauf annulation avant la date de renouvellement depuis votre compte (section « Abonnement »). Le numéro de membre est permanent même sans renouvellement.

6. Deuxième pièce (Prestige). Vous pouvez réserver la deuxième pièce avec un acompte ou l'acquérir avec la remise indiquée ; les remises s'appliquent sur le premium, jamais sur la valeur spot du métal.

7. Prix et taxes. Les prix sont affichés en EUR ou USD selon la sélection. Les taxes et frais de port applicables sont indiqués avant de finaliser l'achat.

8. Droit de rétractation. Les consommateurs de l'UE disposent de 14 jours calendaires pour se rétracter, sauf exceptions légales (biens personnalisés ou confectionnés sur mesure, ou services déjà exécutés avec votre accord). L'acompte de réservation est remboursable jusqu'à la clôture/au lancement comme indiqué. Pour l'exercer, écrivez à ${EMAIL}.

9. Mystery Box. Le contenu conserve un facteur surprise, garantissant toujours le minimum indiqué.

10. Points, remises et parrainage. Régis par leurs conditions spécifiques. Les points et remises s'appliquent uniquement sur le premium. Le solde de parrainage est interne et non retirable en espèces.

11. Livraison. Les délais et frais de port sont détaillés dans la Politique d'expédition.

12. Annulation et remboursements. Voir la Politique de retours et le point 5 pour l'abonnement.

13. Protection des données. Nous traitons vos données conformément à la Politique de confidentialité.

14. Loi applicable et juridiction. [Indiquer la loi applicable et les tribunaux compétents ; les règles impératives de protection des consommateurs de leur pays de résidence dans l'UE seront respectées.]

15. Contact. ${EMAIL}.`,
    },
    privacy: {
      title: 'Politique de confidentialité',
      body: `POLITIQUE DE CONFIDENTIALITÉ (RGPD)

1. Responsable du traitement : Legacy Fan [raison sociale], Dover, Delaware. Contact : ${EMAIL}.

2. Données traitées. Données d'inscription et de profil (prénom, nom, e-mail, téléphone, pays), données d'achat et d'adhésion, et données techniques de navigation. Nous ne stockons pas les données complètes de carte : le paiement est traité par la passerelle (PayPal).

3. Finalités et base juridique. (a) Gérer votre compte, réservation, paiement et adhésion — exécution du contrat. (b) Communications de service — exécution du contrat. (c) Newsletter et communications commerciales — consentement. (d) Obligations légales et fiscales — obligation légale. (e) Prévention de la fraude et sécurité — intérêt légitime.

4. Conservation. Nous conservons les données pendant la relation puis pendant les délais légaux applicables (fiscaux, comptables).

5. Destinataires et sous-traitants. Nous partageons des données avec des prestataires : passerelle de paiement (PayPal), envoi d'e-mails (Resend), hébergement (Railway) et, le cas échéant, transporteurs. Ils agissent comme sous-traitants par contrat.

6. Transferts internationaux. Certains prestataires peuvent être hors EEE ; dans ce cas, des garanties appropriées s'appliquent (clauses contractuelles types ou autres).

7. Vos droits. Accès, rectification, effacement, opposition, limitation et portabilité. Pour les exercer, écrivez à ${EMAIL}. Vous pouvez réclamer auprès de l'autorité de contrôle compétente.

8. Sécurité. Nous appliquons des mesures techniques et organisationnelles raisonnables (mots de passe hachés, contrôle d'accès, connexions sécurisées).

9. Mineurs. Le service ne s'adresse pas aux mineurs.

10. Modifications. Nous pouvons mettre à jour cette politique ; la version en vigueur sera publiée sur cette page.`,
    },
    cookies: {
      title: 'Politique de cookies',
      body: `POLITIQUE DE COOKIES

1. Définition. Les cookies et technologies similaires sont de petits fichiers stockés sur votre appareil pour faire fonctionner le site et mémoriser vos préférences.

2. Cookies utilisés. (a) Techniques/nécessaires : session et connexion, préférence de langue et de devise, thème clair/sombre et consentement aux cookies. Ils sont indispensables et ne requièrent pas de consentement. (b) Analytiques ou tiers : activés uniquement si nous les ajoutons et avec votre consentement préalable.

3. Gestion du consentement. À l'entrée, un avis vous permet d'accepter ou de refuser les cookies non nécessaires. Vous pouvez modifier votre choix en supprimant les cookies de votre navigateur.

4. Désactivation. Vous pouvez configurer votre navigateur pour bloquer ou supprimer les cookies ; certaines fonctions peuvent cesser de fonctionner.

5. Tiers. Des services comme PayPal peuvent installer leurs propres cookies lors de l'utilisation de leur passerelle ; consultez leurs politiques.

6. Contact. ${EMAIL}.`,
    },
  },
  it: {
    terms: {
      title: 'Termini e condizioni',
      body: `TERMINI E CONDIZIONI DI VENDITA E USO

1. Prestatore. Titolare: Legacy Fan [ragione sociale], sede a Dover, Delaware (USA), contatto ${EMAIL}.

2. Oggetto. Questi termini regolano l'iscrizione, la prenotazione, il pagamento e la consegna degli abbonamenti Legacy Prime Club e Legacy Prestige Club e dei pezzi da collezione associati.

3. Natura del prodotto. I prodotti sono articoli DA COLLEZIONE in metalli preziosi. NON costituiscono un prodotto finanziario, un investimento, né una promessa di redditività o rivalutazione.

4. Processo di acquisto. (a) Prenotazione: un deposito di 50 €/$ che assicura il posto, rimborsabile secondo il punto 8 e detratto dal pagamento completo. (b) Pagamento completo: salda il prezzo dell'abbonamento; al completamento si assegna un numero di socio permanente. Prezzo e imposte applicabili si mostrano prima di confermare.

5. Abbonamento e rinnovo. L'abbonamento è ANNUALE. Se sottoscritto come abbonamento, SI RINNOVA AUTOMATICAMENTE ogni 12 mesi al prezzo vigente, addebitato sul tuo metodo di pagamento salvo annullamento prima della data di rinnovo dal tuo account (sezione «Abbonamento»). Il numero di socio è permanente anche senza rinnovo.

6. Seconda moneta (Prestige). Puoi prenotare la seconda moneta con un deposito o acquistarla con lo sconto indicato; gli sconti si applicano sul premium, mai sul valore spot del metallo.

7. Prezzi e imposte. I prezzi sono mostrati in EUR o USD secondo la selezione. Imposte e spese di spedizione applicabili si indicano prima di completare l'acquisto.

8. Diritto di recesso. I consumatori UE dispongono di 14 giorni di calendario per recedere, salvo eccezioni legali (beni personalizzati o su misura, o servizi già eseguiti con il tuo consenso). Il deposito di prenotazione è rimborsabile fino alla chiusura/al lancio come indicato. Per esercitarlo, scrivi a ${EMAIL}.

9. Mystery Box. Il contenuto mantiene un fattore sorpresa, garantendo sempre il minimo indicato.

10. Punti, sconti e referral. Regolati dalle loro condizioni specifiche. Punti e sconti si applicano solo sul premium. Il saldo referral è interno e non prelevabile in contanti.

11. Consegna. Tempi e costi di spedizione sono dettagliati nella Politica di spedizione.

12. Annullamento e rimborsi. Vedi la Politica di resi e il punto 5 per l'abbonamento.

13. Protezione dei dati. Trattiamo i tuoi dati secondo la Politica sulla privacy.

14. Legge applicabile e foro. [Indicare la legge applicabile e il foro competente; saranno rispettate le norme imperative di tutela dei consumatori del loro paese di residenza nell'UE.]

15. Contatto. ${EMAIL}.`,
    },
    privacy: {
      title: 'Politica sulla privacy',
      body: `POLITICA SULLA PRIVACY (GDPR)

1. Titolare del trattamento: Legacy Fan [ragione sociale], Dover, Delaware. Contatto: ${EMAIL}.

2. Dati trattati. Dati di registrazione e profilo (nome, cognome, email, telefono, paese), dati di acquisto e abbonamento e dati tecnici di navigazione. Non conserviamo i dati completi della carta: il pagamento è gestito dalla passerella (PayPal).

3. Finalità e base giuridica. (a) Gestire account, prenotazione, pagamento e abbonamento — esecuzione del contratto. (b) Comunicazioni di servizio — esecuzione del contratto. (c) Newsletter e comunicazioni commerciali — consenso. (d) Obblighi legali e fiscali — obbligo legale. (e) Prevenzione frodi e sicurezza — interesse legittimo.

4. Conservazione. Conserviamo i dati per la durata del rapporto e, successivamente, per i termini legali applicabili (fiscali, contabili).

5. Destinatari e responsabili. Condividiamo dati con fornitori di servizi: passerella di pagamento (PayPal), invio email (Resend), hosting (Railway) e, se del caso, corrieri. Agiscono come responsabili del trattamento per contratto.

6. Trasferimenti internazionali. Alcuni fornitori possono trovarsi fuori dal SEE; in tal caso si applicano garanzie adeguate (clausole contrattuali tipo o altre).

7. I tuoi diritti. Accesso, rettifica, cancellazione, opposizione, limitazione e portabilità. Per esercitarli scrivi a ${EMAIL}. Puoi reclamare presso l'autorità di controllo competente.

8. Sicurezza. Applichiamo misure tecniche e organizzative ragionevoli (password cifrate, controllo accessi, connessioni sicure).

9. Minori. Il servizio non è rivolto ai minori.

10. Modifiche. Potremo aggiornare questa politica; la versione vigente sarà pubblicata in questa pagina.`,
    },
    cookies: {
      title: 'Politica sui cookie',
      body: `POLITICA SUI COOKIE

1. Cosa sono. I cookie e tecnologie simili sono piccoli file memorizzati sul tuo dispositivo affinché il sito funzioni e per ricordare le tue preferenze.

2. Cookie utilizzati. (a) Tecnici/necessari: sessione e accesso, preferenza di lingua e valuta, tema chiaro/scuro e consenso ai cookie. Sono indispensabili e non richiedono consenso. (b) Analitici o di terzi: attivati solo se li integriamo e con il tuo consenso preventivo.

3. Gestione del consenso. All'ingresso vedrai un avviso per accettare o rifiutare i cookie non necessari. Puoi cambiare la scelta eliminando i cookie dal browser.

4. Come disattivarli. Puoi configurare il browser per bloccare o eliminare i cookie; alcune funzioni potrebbero non operare correttamente.

5. Terzi. Servizi come PayPal possono installare propri cookie usando la loro passerella; consulta le loro politiche.

6. Contatto. ${EMAIL}.`,
    },
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
