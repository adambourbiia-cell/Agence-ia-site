# Dicta — devis et factures à la voix

L'artisan dicte son chantier en sortant de chez le client ; Dicta en fait un devis PDF propre,
l'envoie, le transforme en facture et suit ce qui reste à encaisser.

**Cible** : artisans et indépendants (BTP, dépannage, services). **Modèle** : abonnement 19–29 €/mois,
puis paiement intégré (commission sur les factures encaissées).

## Contenu du dépôt

| Dossier | Rôle |
|---|---|
| `app/` | Application mobile iOS + Android (Expo / React Native, TypeScript, Expo Router) |
| `app/supabase/functions/parse-quote/` | Fonction serveur qui appelle Claude pour transformer la dictée en lignes de devis |

## Ce que fait la v0

- Dictée du chantier (micro du clavier du téléphone) → lignes de devis structurées par l'IA,
  prix dictés repris tels quels, prix manquants **estimés et surlignés en orange** à vérifier
- Édition des lignes (quantité, unité, prix), totaux HT / TVA / TTC, franchise de TVA (art. 293 B)
- Numérotation continue par année (`D-2026-001`, `F-2026-001`)
- PDF conforme (mentions légales, bon pour accord, échéance, pénalités de retard) partagé par
  e-mail, WhatsApp, etc. via la feuille de partage du téléphone
- Devis → facture en un tap, facture figée et non supprimable, suivi « payée / à encaisser »
- Données stockées sur le téléphone (fonctionne hors ligne)

## Lancer l'app

```bash
cd app
npm install
npx expo start        # scanne le QR code avec l'app Expo Go (iOS / Android)
```

Sans backend, l'app tourne en **mode hors ligne** : la dictée devient une seule ligne à chiffrer à la main.

## Brancher l'IA (Supabase + Claude)

1. Crée un projet sur [supabase.com](https://supabase.com) et installe la CLI Supabase.
2. Depuis `app/` :
   ```bash
   supabase link --project-ref <ton-projet>
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   supabase functions deploy parse-quote
   ```
3. Copie `app/.env.example` en `app/.env.local` et renseigne l'URL et la clé `anon` du projet,
   puis relance `npx expo start`.

La clé Claude reste côté serveur, elle n'est jamais embarquée dans l'app.

## Feuille de route

1. **Comptes + synchro cloud** (Supabase Auth + Postgres) pour ne rien perdre en changeant de téléphone
2. **Reconnaissance vocale intégrée** (bouton micro dans l'app, `expo-speech-recognition`, nécessite un build EAS)
3. **Signature du devis en ligne** par le client + relances automatiques des impayés
4. **Facturation électronique** (plateforme agréée) pour la réforme 2026–2027
5. **Abonnement** (RevenueCat / in-app) et **paiement des factures par lien** (Stripe)
6. Bibliothèque de prix personnelle apprise à partir des devis passés
