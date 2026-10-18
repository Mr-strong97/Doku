# Doku — contexte produit

## Produit

Doku est une caisse et un outil de gestion commerciale installable sur téléphone. Il aide un commerçant à vendre, gérer son catalogue et son stock, consulter ses résultats et conserver ses données même lorsqu'Internet est indisponible.

## Utilisateurs et situation d'usage

- Commerçants francophones, notamment à Kinshasa, parfois peu familiers avec le numérique.
- Téléphones Android d'entrée ou de milieu de gamme, utilisés debout et souvent d'une seule main.
- Réseau variable : une vente et les mouvements de stock ne doivent jamais être bloqués par une coupure d'Internet.

## Tâches essentielles

1. Ajouter des produits au panier et encaisser rapidement.
2. Retrouver, partager ou annuler une vente.
3. Créer des produits, surveiller le stock et réapprovisionner.
4. Lire le chiffre d'affaires et le bénéfice sans calculatrice.
5. Régler le compte, le taux USD/CDF et la synchronisation.

## Contraintes produit durables

- Application web PWA mobile-first ; français comme langue d'interface MVP.
- Deux monnaies : CDF et USD ; le taux du jour est une donnée de confiance visible dans la caisse.
- Écritures locales d'abord, synchronisation ensuite ; état de synchronisation explicite.
- Une page correspond à une tâche, les actions destructives sont confirmées et réversibles lorsque possible.
- Données et session protégées : aucune information technique ni secret n'est exposé dans l'interface.

## Plateforme et stack

- **Plateforme :** web mobile / PWA, et non React Native.
- **Interface :** Next.js 16 App Router, React, TypeScript, Lucide React, React Toastify.
- **Style :** CSS global à tokens et CSS Modules ; Tailwind est chargé mais les écrans sont principalement en CSS Modules.
- **Données :** Axios vers une API Django REST ; session locale IndexedDB/Dexie, jeton d'accès en mémoire et refresh HttpOnly.

## Source de vérité

La structure de navigation, les 20 écrans, les 21 modales et les règles offline-first sont définis dans `docs/Doku_Architecture_des_Interfaces.pdf`. Les éléments ci-dessus sont transcrits de ce document et du code existant le 18 octobre 2026.
