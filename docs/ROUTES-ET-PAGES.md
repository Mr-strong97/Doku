# Doku — routes et pages

> Inventaire issu de `frontend/src/app` et croisé avec `Doku_Architecture_des_Interfaces.pdf` le 18 octobre 2026. Les routes métier sont protégées par le gabarit `(app)` : une session locale est restaurée avant leur affichage, y compris quand l’appareil est hors connexion.

| Route | Fichier / composant | Accès | Page de retour attendue | Objectif | Utilisation simple | Actualisation automatique actuelle |
|---|---|---|---|---|---|---|
| `/` | `app/page.tsx` · `RootRedirect` | Public, aiguillage selon session | — | Ouvrir la bonne première page. | 1. Ouvrir Doku. 2. Attendre l’aiguillage. | Oui : lecture de session au démarrage. |
| `/login` | `(public)/login/page.tsx` · `LoginForm` | Public | — | Ouvrir une session. | 1. Saisir téléphone. 2. Saisir mot de passe. 3. Se connecter. | Non. |
| `/register` | `(public)/register/page.tsx` · `RegisterForm` | Public | `/login` | Créer le compte et la boutique. | 1. Remplir les informations. 2. Créer le compte. | Non. |
| `/onboarding` | `(guided)/onboarding/page.tsx` · `OnboardingWizard` | Connecté, configuration incomplète | `/login` à l’étape initiale ; étape précédente sinon | Rendre la boutique prête à vendre. | 1. Renseigner boutique. 2. Saisir le taux. 3. Ajouter un produit facultatif. | Non ; valeurs conservées seulement pendant la session. |
| `/pos` | `(tabs)/pos/page.tsx` · `PosWorkspace` | Connecté | — (onglet racine) | Composer un panier rapidement. | 1. Chercher un produit. 2. L’ajouter. 3. Ouvrir le panier. | Oui : retour à l’app, reconnexion et 30 s ; panier local immédiat. |
| `/pos/checkout` | `(tabs)/pos/checkout/page.tsx` · `PosWorkspace` | Connecté | `/pos` | Vérifier et encaisser le panier. | 1. Vérifier les lignes. 2. Choisir la devise. 3. Encaisser. | Panier local instantané ; redirection après encaissement. |
| `/sales` | `(tabs)/sales/page.tsx` · `SalesHistoryScreen` | Connecté | — (onglet racine) | Retrouver les ventes passées. | 1. Chercher un reçu. 2. Ouvrir une vente. | Oui : retour à l’app, reconnexion et 30 s. |
| `/sales/[id]` | `(tabs)/sales/[id]/page.tsx` · `SaleReceiptScreen` | Connecté | `/sales` | Lire, partager ou annuler une vente. | 1. Lire le reçu. 2. Partager ou annuler si nécessaire. | Oui : retour à l’app, reconnexion et 30 s ; mise à jour après annulation. |
| `/products` | `(tabs)/products/page.tsx` · `ProductsScreen` | Connecté | — (onglet racine) | Gérer le catalogue actif. | 1. Chercher un produit. 2. Ouvrir ou archiver. 3. Ajouter un produit. | Oui : retour à l’app, reconnexion et 30 s ; mise à jour immédiate après archivage. |
| `/products/new` | `(tabs)/products/new/page.tsx` · `ProductFormScreen` | Connecté | `/products` | Ajouter un produit. | 1. Saisir le produit. 2. Ajouter prix et stock. 3. Enregistrer. | Non. |
| `/products/[id]` | `(tabs)/products/[id]/page.tsx` · `ProductDetailScreen` | Connecté | `/products` ou écran d’origine | Consulter un produit et agir sur son stock. | 1. Voir le stock. 2. Réapprovisionner ou ajuster. 3. Lire les mouvements. | Oui : retour à l’app, reconnexion et 30 s ; mise à jour après mouvement. |
| `/products/[id]/edit` | `(tabs)/products/[id]/edit/page.tsx` · `ProductFormScreen` | Connecté | `/products/[id]` | Modifier un produit. | 1. Modifier les champs. 2. Enregistrer. | Mise à jour après enregistrement et retour contrôlé avec confirmation. |
| `/products/categories` | `(tabs)/products/categories/page.tsx` · `CategoriesScreen` | Connecté | `/products` | Organiser le catalogue par catégories. | 1. Ajouter ou renommer. 2. Archiver si besoin. | Oui : retour à l’app, reconnexion et 30 s ; mise à jour après écriture. |
| `/stock` | `(tabs)/stock/page.tsx` · `StockScreen` | Connecté | — (onglet racine) | Surveiller les niveaux de stock. | 1. Filtrer les alertes. 2. Réapprovisionner ou ajuster. 3. Lire le journal. | Oui pour les niveaux : retour à l’app, reconnexion et 30 s ; journal à la demande. |
| `/stats` | `(tabs)/stats/page.tsx` · `StatsScreen` | Connecté | — (onglet racine) | Lire les chiffres de la boutique. | 1. Choisir une période. 2. Lire le résumé, les jours ou les produits. | Oui : retour à l’app, reconnexion, 30 s et changement de période. |
| `/settings` | `(app)/settings/page.tsx` · `SettingsScreen` | Connecté | `/pos` si ouverture directe | Accéder aux réglages. | 1. Choisir une rubrique. 2. Modifier si nécessaire. | Session réactive seulement. |
| `/settings/profile` | `(app)/settings/profile/page.tsx` · `ProfileScreen` | Connecté | `/settings` | Modifier profil et boutique. | 1. Modifier les informations. 2. Enregistrer. | Relecture initiale et actualisation manuelle pour préserver une saisie en cours. |
| `/settings/exchange-rate` | `(app)/settings/exchange-rate/page.tsx` · `ExchangeRateScreen` | Connecté | `/settings` | Mettre à jour et consulter le taux USD/CDF. | 1. Vérifier le taux. 2. Ajouter un nouveau taux. | Oui : retour à l’app, reconnexion et 30 s ; mise à jour après création. |
| `/settings/sync` | `(app)/settings/sync/page.tsx` · `SyncScreen` | Connecté | `/settings` | Rassurer sur la synchronisation. | 1. Vérifier l’état. 2. Synchroniser. 3. Lire une erreur si présente. | Événements navigateur online/offline ; synchronisation manuelle. |
| `/offline` | `app/offline/page.tsx` · `TechnicalFallback` | Public / repli PWA | `/pos` | Expliquer qu’une page distante nécessite Internet. | 1. Revenir à la caisse ou 2. Réessayer. | Non. |
| `(not-found)` | `app/not-found.tsx` · `TechnicalFallback` | Global | `/pos` | Rattraper une adresse ou ressource inconnue. | 1. Revenir à la caisse ou 2. Consulter les produits. | Non. |
| `(error)` et `(global-error)` | `app/error.tsx`, `app/global-error.tsx` · `TechnicalFallback` | Global | `/pos` | Rassurer après une erreur inattendue. | 1. Réessayer ou 2. Retourner à la caisse. | Non. |

## Écarts avec le document de structure et décisions d’audit

1. La route `/` est présente dans le code mais ne fait pas partie des 21 routes d’inventaire : c’est un aiguillage de démarrage légitime.
2. Un `PageHeader`, une navigation principale centralisée, une feuille modale accessible, des états vide/erreur et une actualisation automatique sont désormais partagés. Les en-têtes conservent toutefois leur information métier propre ; il n’y a pas de TopBar factice identique partout.
3. Les pages attendues sous `(stack)` sont rangées sous `(tabs)` dans les fichiers. La barre est maintenant masquée automatiquement sur ces sous-écrans ; les URL sont inchangées.
4. La garde `(app)` a été ajoutée : elle attend la session locale et redirige une session absente vers `/login`.
5. Les écrans empilés utilisent `PageHeader` avec repli parent. Une navigation issue de l’historique reste prioritaire.
6. Les dialogues métier utilisent une feuille commune avec rôle modal, focus initial, boucle Tab, Échap, clic extérieur et verrouillage du défilement. Le bouton Android système ne peut pas être intercepté par une PWA web sans intégration native.
7. Les listes actualisées se rechargent au retour au premier plan, à la reconnexion et toutes les 30 secondes en écran visible ; les données affichées sont conservées pendant cette relecture.
8. `global-error.tsx` a été ajouté en complément de `error.tsx`.

## Points restant à traiter lors de la refonte

- Vérifier visuellement chaque écran aux largeurs 360×640, 375×812, 390×844 et 412×915 dès qu’un serveur Next peut ouvrir un port dans l’environnement de test.
- Le Service Worker et la file de synchronisation locale restent les sources d’autorité pour une vraie synchronisation hors ligne ; l’interface ne modifie pas leurs contrats.
- Conserver le français simple et l’approche offline-first ; ne pas ajouter de mode sombre sans demande dédiée.
