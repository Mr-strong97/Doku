---
name: Doku
description: Caisse mobile rassurante, lisible et utilisable même sans Internet.
colors:
  brand-deep-teal: "#00494c"
  brand-teal: "#0e6266"
  ink: "#0b1c30"
  ink-secondary: "#446274"
  surface: "#f8f9ff"
  surface-card: "#ffffff"
  surface-field: "#eff4ff"
  surface-chip: "#e5eeff"
  line: "#bec8c9"
  danger: "#ba1a1a"
  danger-surface: "#ffdad6"
  warning: "#c77700"
  warning-surface: "#fff0c9"
typography:
  body:
    fontFamily: "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif"
rounded:
  field: "12px"
  card: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.field}"
    padding: "16px"
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.card}"
    padding: "16px"
---

# Design System: Doku

## Overview

**État documenté : système visuel existant, avant refonte UX/UI.** Doku privilégie un fond bleuté très clair, une accentuation vert-bleu et des cartes blanches. La police locale Plus Jakarta Sans préserve un fonctionnement PWA sans dépendance externe.

La prochaine refonte doit conserver la lisibilité et le sentiment de sécurité propre à une caisse hors ligne, sans figer les incohérences actuelles entre les écrans.

## Colors

- **Vert-bleu Doku** (`#0e6266`) : action principale, navigation active et états de confiance.
- **Encre profonde** (`#0b1c30`) : titres et informations de valeur.
- **Bleu de champ** (`#eff4ff`) : saisie et panneaux secondaires.
- **Surfaces claires** (`#f8f9ff`, `#ffffff`) : fond et cartes.
- **États** : rouge (`#ba1a1a`) pour une action destructrice, ambre (`#c77700`) pour une vigilance.

## Typography

**Police :** Plus Jakarta Sans locale, avec la pile système comme repli.

La base typographique actuellement observée est compacte et hétérogène selon les écrans. La refonte doit normaliser les rôles titre, section, corps et libellé tout en gardant un texte courant d'au moins 16 px sur mobile.

## Layout

La largeur maximale observée est 430 px. Les écrans utilisent `min-height: 100dvh`, des marges de 20 px et des cartes espacées d'environ 10 à 16 px. Les cinq destinations principales utilisent une barre inférieure ; les tâches secondaires sont en pile avec retour.

## Elevation & Depth

Le système existant combine bordures fines et ombres diffuses très légères : `0 1px 3px rgb(11 28 48 / 0.06)` pour un champ et `0 2px 14px rgb(11 28 48 / 0.06)` pour une carte. La refonte doit appliquer cette profondeur avec parcimonie et de façon uniforme.

## Shapes

Les champs et boutons utilisent 12 px de rayon, les cartes 16 px. Les feuilles inférieures et les dialogs emploient des coins plus généreux. Ces rôles doivent être transformés en composants partagés afin de supprimer les nombreuses variations manuelles.

## Components

### Boutons

- Primaire : fond vert-bleu, texte blanc, hauteur tactile minimale de 48 px.
- Secondaire : surface bleu pâle, texte vert-bleu.
- Destructif : surface rouge pâle, texte rouge ; jamais action par défaut.

### Cartes et listes

Cartes blanches à bordure discrète ; les lignes doivent rendre l'action entière cliquable, avec valeur importante alignée à droite.

### Navigation

La barre inférieure comporte Caisse, Produits, Stock, Ventes et Bilan. Le gabarit de pile utilise une flèche Retour et une action contextuelle.

## Do's and Don'ts

### Do:

- **Do** réserver le vert-bleu aux actions et statuts porteurs de sens.
- **Do** rendre l'état hors ligne et la synchronisation compréhensibles en quelques mots.
- **Do** préserver l'accès à l'action principale dans le tiers inférieur de l'écran.

### Don't:

- **Don't** introduire une couleur, une icône ou un rayon arbitraire pour un écran isolé.
- **Don't** cacher une action essentielle dans une icône sans libellé ou `aria-label`.
- **Don't** utiliser une modale pour un formulaire long.
