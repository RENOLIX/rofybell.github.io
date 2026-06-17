# Rofybell Cosmetics

Boutique React locale pour Rofybell avec catalogue cosmetique, panier, commande, paiement a la livraison et espace d'administration.

## Fonctionnalites

- Boutique responsive avec 3 produits cosmetiques principaux
- Panier persistant et parcours de commande
- Administration locale des produits, commandes, utilisateurs et tarifs de livraison
- Favicon et charte graphique Rofybell
- Possibilite de connecter une vraie base Supabase via `.env.local`

## Acces admin

- Email : `admin@rofybell.dz`
- Mot de passe : `Rofybell2026`

Pour que cet acces marche avec Supabase :

1. Dans Supabase SQL Editor, executer `supabase/schema.sql`.
2. Dans Authentication > Users, creer un utilisateur :
   - Email : `admin@rofybell.dz`
   - Mot de passe : `Rofybell2026`
   - Email confirmed : active
3. Relancer dans SQL Editor le bloc final du fichier `supabase/schema.sql`, a partir de :
   `update auth.users set raw_user_meta_data...`

## Installation locale

```bash
npm install
npm run dev
```

Le site est branche par defaut sur le projet Supabase Rofybell. Pour changer de projet, renseigner `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env.local`.
