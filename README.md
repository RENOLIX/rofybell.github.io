# Rofybell Cosmetics

Boutique React locale pour Rofybell avec catalogue cosmetique, panier, commande, paiement a la livraison et espace d'administration.

## Fonctionnalites

- Boutique responsive avec 3 produits cosmetiques principaux
- Panier persistant et parcours de commande
- Administration locale des produits, commandes, utilisateurs et tarifs de livraison
- Favicon et charte graphique Rofybell
- Possibilite de connecter une vraie base Supabase via `.env.local`

## Acces admin local

- Email : `admin@rofybell.dz`
- Mot de passe : `Rofybell2026`

## Installation locale

```bash
npm install
npm run dev
```

Le site fonctionne en local sans Supabase. Pour connecter Supabase, renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local`.
