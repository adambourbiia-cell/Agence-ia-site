# Dicta — devis et factures à la voix

L'artisan dicte son chantier en sortant de chez le client ; Dicta en fait un devis propre,
le client le signe en ligne depuis son téléphone, et le devis devient une facture en un tap.

**Cible** : artisans et indépendants (BTP, dépannage, services). **Modèle** : abonnement 19–29 €/mois,
puis paiement intégré (commission sur les factures encaissées).

## Contenu du dépôt

| Dossier | Rôle |
|---|---|
| `app/` | Application mobile iOS + Android (Expo / React Native, TypeScript, Expo Router) |
| `app/supabase/migrations/` | Base de données : profils, documents, sécurité par ligne (RLS) |
| `app/supabase/functions/parse-quote/` | IA : transforme la dictée en lignes de devis avec Claude (comptes connectés uniquement) |
| `app/supabase/functions/sign/` | API publique de la page de signature (+ notification à l'artisan) |
| `app/supabase/functions/remind/` | Relances quotidiennes des factures impayées par e-mail (Resend) |
| `app/supabase/functions/revenuecat-webhook/` | Met à jour l'abonnement Pro à chaque événement App Store / Google Play |
| `sign/index.html` | Page web où le client lit et signe le devis (un seul fichier, hébergeable partout) |

## Fonctionnalités

- **Dictée → devis** : lignes structurées par l'IA, prix dictés repris tels quels, prix manquants
  estimés et **surlignés en orange** à vérifier
- **Devis et factures** : totaux HT / TVA / TTC, franchise de TVA (art. 293 B), numérotation continue
  (`D-2026-001`, `F-2026-001`), PDF avec mentions légales, devis → facture en un tap, suivi des paiements
- **Compte sans mot de passe** (code reçu par e-mail) et **sauvegarde dans le cloud** : synchro automatique
  après chaque modification et à l'ouverture de l'app, fusion « la modification la plus récente gagne »,
  données restaurées en changeant de téléphone
- **Signature en ligne** : l'artisan envoie un lien (SMS, WhatsApp, e-mail…), le client lit le devis,
  signe au doigt et coche « bon pour accord ». La signature, la date, le nom et l'IP sont enregistrés
  côté serveur ; le devis est ensuite **verrouillé** (même la base refuse de modifier les prestations)
  et le PDF inclut la signature
- **Notifications push** : « Devis signé ✍️ » dès que le client signe, « Relance envoyée » ; toucher la
  notification ouvre le document. L'autorisation n'est demandée qu'à l'envoi du premier devis à signer
- **Relances automatiques** des factures impayées : e-mail au client à J+1, J+8 et J+15 après l'échéance,
  au nom de l'artisan (réponse directe à son adresse), la 3ᵉ rappelle les pénalités légales ; désactivable
  par facture, arrêt dès que la facture est marquée payée
- **Mode hors ligne** : sans compte, l'app reste utilisable (données sur le téléphone, sans IA)

## Offre

| | Gratuit | **Dicta Pro** |
|---|---|---|
| Devis, factures, PDF, synchro cloud | ✓ | ✓ |
| Dictées IA | 5 / mois | illimitées |
| Signature en ligne + alerte de signature | | ✓ |
| Relances automatiques des impayés | | ✓ |

Abonnement mensuel via l'App Store / Google Play (RevenueCat), prix et essai gratuit réglés dans les stores
(suggestion : 24,99 €/mois, 14 jours d'essai). Les règles sont appliquées **côté serveur** : quota IA dans
`parse-quote`, lien de signature refusé par la base sans abonnement actif, relances envoyées seulement aux
comptes Pro. Les liens déjà envoyés restent valables si l'abonnement s'arrête.

## Lancer l'app

```bash
cd app
npm install
npx expo start        # scanne le QR code avec l'app Expo Go (iOS / Android)
```

## Mise en service du cloud (Supabase)

1. Crée un projet sur [supabase.com](https://supabase.com) et installe la CLI Supabase.
2. Depuis `app/` :
   ```bash
   supabase link --project-ref <ton-projet>
   supabase db push                                   # crée les tables et la sécurité
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy parse-quote
   supabase functions deploy sign --no-verify-jwt     # page publique : pas de compte côté client
   ```
3. **Connexion par code** : dans Supabase, *Authentication > Emails > Magic Link*, mets le code dans
   le modèle d'e-mail, par exemple : `Ton code Dicta : {{ .Token }}`.
4. **Page de signature** : dans `sign/index.html`, remplace `API_URL` par
   `https://<ton-projet>.supabase.co/functions/v1/sign`, puis héberge ce fichier (Netlify, Vercel,
   GitHub Pages…).
5. Copie `app/.env.example` en `app/.env.local`, renseigne l'URL du projet, la clé publiable et
   l'adresse de la page de signature, puis relance `npx expo start`.

### Notifications push

6. `npm i -g eas-cli && eas init` (depuis `app/`) : ajoute le `projectId` EAS dans la config.
7. Les push ne marchent que dans un **build de développement** (pas dans Expo Go) :
   `eas build --profile development`. Android : configurer FCM (`eas credentials`) ; iOS : compte Apple
   Developer payant. Optionnel : `supabase secrets set EXPO_ACCESS_TOKEN=...` si l'accès sécurisé aux push
   est activé sur le compte Expo.

### Relances automatiques

8. Crée un compte [Resend](https://resend.com), vérifie ton domaine d'envoi, puis :
   ```bash
   supabase secrets set RESEND_API_KEY=re_... REMINDER_FROM="Dicta <factures@ton-domaine.fr>" CRON_SECRET=<long-secret-aleatoire>
   supabase functions deploy remind --no-verify-jwt
   ```
9. Planifie l'appel quotidien (SQL Editor, extensions `pg_cron` et `pg_net` activées) :
   ```sql
   select cron.schedule('dicta-relances', '0 8 * * *', $$
     select net.http_post(
       url := 'https://<ton-projet>.supabase.co/functions/v1/remind',
       headers := jsonb_build_object('x-cron-secret', '<long-secret-aleatoire>')
     );
   $$);
   ```

### Abonnement Pro (RevenueCat)

10. Crée l'abonnement mensuel dans App Store Connect et Google Play Console, puis dans RevenueCat :
    un droit (entitlement) nommé **`pro`**, une offre courante (*current offering*) avec un package mensuel.
11. Webhook RevenueCat → URL `https://<ton-projet>.supabase.co/functions/v1/revenuecat-webhook`,
    en-tête d'autorisation = une valeur secrète, puis :
    ```bash
    supabase secrets set REVENUECAT_WEBHOOK_AUTH=<la-meme-valeur>
    supabase functions deploy revenuecat-webhook --no-verify-jwt
    ```
12. Renseigne les clés `EXPO_PUBLIC_REVENUECAT_*` et les liens CGU / confidentialité dans `app/.env.local`.
    Dans Expo Go, RevenueCat fonctionne en mode simulé ; les vrais achats demandent un build EAS.

La clé Claude et la clé secrète Supabase restent côté serveur, jamais dans l'app.

## Tests

```bash
cd app
npm test              # base de données (Postgres en mémoire) + fusion de la synchro
npx tsc --noEmit      # typage
```

- `tests/db.test.mjs` : 30 vérifications des migrations sur un vrai Postgres (PGlite) : isolation
  entre artisans, signature impossible à falsifier ou à rejouer, prestations verrouillées après signature,
  abonnement non falsifiable, lien de signature réservé à Pro, jetons push, quota IA.
- `tests/merge.test.ts` : la fusion téléphone ↔ cloud (Deno).
- `tests/server.test.ts` : calendrier et contenu des relances, traitement des webhooks RevenueCat (Deno).

## Feuille de route

1. ~~Comptes + synchro cloud~~ ✓ · ~~Signature en ligne~~ ✓ · ~~Notifications~~ ✓ · ~~Relances~~ ✓ · ~~Abonnement Pro~~ ✓
2. **Publication** : icône, captures, fiche App Store / Google Play, CGU et politique de confidentialité
3. **Paiement des factures par lien** (Stripe) : le client paie depuis l'e-mail de relance
4. **Reconnaissance vocale intégrée** (bouton micro dans l'app)
5. **Facturation électronique** (plateforme agréée) pour la réforme 2026–2027
6. Bibliothèque de prix personnelle apprise à partir des devis passés
