/**
 * Tous les textes affichés au commerçant (dossier H-15 : libellés externalisés).
 * Ajouter une langue plus tard = ajouter un fichier jumeau, sans toucher aux composants.
 * Les textes viennent des maquettes P01 et P02.
 */

import { COUNTRY, NAME_MIN_LENGTH, PASSWORD_MIN_LENGTH } from "@/config/constants";

export const messages = {
  brand: {
    name: "Doku",
    tagline: "Votre caisse, même sans Internet",
  },

  common: {
    show: "Afficher",
    hide: "Masquer",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    offlineNow: "Vous êtes hors ligne.",
    genericError: "Une erreur est survenue. Réessayez.",
    throttled: (seconds: number | null) =>
      seconds === null
        ? "Trop d'essais. Patientez quelques instants."
        : `Trop d'essais. Réessayez dans ${seconds} s.`,
    retryIn: (seconds: number) => `Réessayer dans ${seconds} s`,
  },

  login: {
    pageTitle: "Connexion",
    formLabel: "Connexion à Doku",
    badge: "Prêt pour le mode hors-ligne",
    phoneLabel: "Numéro de téléphone",
    phoneAside: `${COUNTRY.label} (${COUNTRY.dialCode})`,
    phonePlaceholder: "81 000 0001",
    passwordLabel: "Mot de passe",
    forgot: "Oublié ?",
    forgotUnavailable: "La réinitialisation du mot de passe n'est pas encore disponible.",
    submit: "Se connecter",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte",
    firstLoginNote: "La première connexion nécessite Internet.",
    invalidCredentials: "Identifiants invalides",
    offline: "Une connexion Internet est nécessaire pour la première connexion",
    passwordRequired: "Entrez votre mot de passe",
  },

  register: {
    pageTitle: "Créer un compte",
    formLabel: "Création de votre compte Doku",
    intro: "Enregistrez votre commerce en quelques secondes et commencez à vendre",
    fullNameLabel: "Nom complet",
    fullNameAside: "Obligatoire",
    fullNamePlaceholder: "Ex: Exaucé Mukendi",
    phoneLabel: "Numéro de téléphone",
    phoneAside: "Identifiant principal",
    phonePlaceholder: "81 234 5678",
    phoneHint: "Sert à synchroniser votre caisse et récupérer vos accès",
    shopNameLabel: "Nom de la boutique",
    shopNameAside: "Sur vos reçus",
    shopNamePlaceholder: "Ex: Boutique La Grâce",
    passwordLabel: "Mot de passe sécurisé",
    passwordPlaceholder: `Au moins ${PASSWORD_MIN_LENGTH} caractères`,
    offlineInfo: {
      before: "En créant ce compte, vous activez le ",
      strong: "mode hors-ligne automatique",
      after: ". Toutes vos ventes sont préservées sans réseau.",
    },
    submit: "Créer mon compte",
    haveAccount: "Vous avez déjà un compte ?",
    signIn: "Se connecter à Doku",
    deviceNote: "Vos données de vente restent enregistrées sur votre appareil même hors ligne.",
    offline: "La création du compte nécessite une connexion Internet",
  },

  passwordStrength: {
    caption: "Robustesse :",
    tooShort: "Trop court",
    levels: ["À définir", "Faible", "Moyen", "Bon", "Fort"],
  },

  validation: {
    phoneIncomplete: `Entrez les ${COUNTRY.nationalNumberLength} chiffres de votre numéro`,
    fullNameRequired: `Entrez votre nom complet (${NAME_MIN_LENGTH} caractères minimum)`,
    shopNameRequired: `Entrez le nom de votre boutique (${NAME_MIN_LENGTH} caractères minimum)`,
    passwordTooShort: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`,
  },

  placeholderScreen: {
    comingSoon: "Cet écran sera construit à une prochaine étape.",
    signedInAs: "Connecté en tant que",
    logout: "Se déconnecter",
  },
} as const;
