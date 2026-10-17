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
| `app/supabase/functions/sign/` | API publique de la page de signature |
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
- **Mode hors ligne** : sans compte, l'app reste utilisable (données sur le téléphone, sans IA)

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

La clé Claude et la clé secrète Supabase restent côté serveur, jamais dans l'app.

## Tests

```bash
cd app
npm test              # base de données (Postgres en mémoire) + fusion de la synchro
npx tsc --noEmit      # typage
```

- `tests/db.test.mjs` : 15 vérifications de la migration sur un vrai Postgres (PGlite) : isolation
  entre artisans, signature impossible à falsifier ou à rejouer, prestations verrouillées après signature.
- `tests/merge.test.ts` : la fusion téléphone ↔ cloud (Deno).

## Feuille de route

1. ~~Comptes + synchro cloud~~ ✓ · ~~Signature en ligne~~ ✓
2. **Notification push** à l'artisan quand le client signe, **relances automatiques** des impayés
3. **Reconnaissance vocale intégrée** (bouton micro dans l'app, nécessite un build EAS)
4. **Abonnement** (RevenueCat / in-app) et **paiement des factures par lien** (Stripe)
5. **Facturation électronique** (plateforme agréée) pour la réforme 2026–2027
6. Bibliothèque de prix personnelle apprise à partir des devis passés
