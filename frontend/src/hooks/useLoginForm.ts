import { useState, type FormEvent } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCountdown } from "@/hooks/useCountdown";
import { useFormState } from "@/hooks/useFormState";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { classifyAuthError } from "@/lib/authErrors";
import { focusField, focusFirstInvalidField } from "@/lib/focus";
import { toInternationalNumber } from "@/lib/phone";
import { reportAuthFailure } from "@/lib/reportAuthFailure";
import { notifyError, notifyInfo } from "@/lib/toast";
import { hasErrors, validateLogin, type FieldErrors, type LoginValues } from "@/lib/validation";
import { messages } from "@/messages/fr";

/** Les champs dans l'ordre d'affichage (ce sont aussi leurs attributs `name`). */
const LOGIN_FIELDS: ReadonlyArray<keyof LoginValues> = ["phone", "password"];

/**
 * Logique de la page P01 « Connexion » (UC02). L'écran ne fait qu'afficher : tout le
 * comportement est ici (règle 6 : hooks React, et aucune règle métier dans les écrans).
 * Après une connexion réussie, <RedirectIfAuthenticated /> ouvre la caisse (P04) ou la
 * configuration initiale (P03).
 */
export function useLoginForm() {
  const { login } = useAuth();
  const isOnline = useOnlineStatus();
  const { values, errors, setValue, setErrors } = useFormState<LoginValues>({ phone: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { secondsLeft, start: startCountdown } = useCountdown();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget; // à capturer avant le premier « await »
    if (isSubmitting || secondsLeft > 0) return; // pas de double envoi, ni pendant l'attente 429

    function showFieldErrors(fieldErrors: FieldErrors<LoginValues>) {
      setErrors(fieldErrors);
      focusFirstInvalidField(formElement, LOGIN_FIELDS, fieldErrors);
    }

    const validationErrors = validateLogin(values);
    if (hasErrors(validationErrors)) return showFieldErrors(validationErrors);
    if (!navigator.onLine) return notifyError(messages.login.offline);

    setIsSubmitting(true);
    try {
      await login({ phone: toInternationalNumber(values.phone), password: values.password });
      // Succès : on reste « en chargement » le temps de la redirection (pas de second envoi)
    } catch (error) {
      setIsSubmitting(false);
      reportAuthFailure(classifyAuthError(error), {
        offlineMessage: messages.login.offline,
        knownFields: LOGIN_FIELDS,
        startCountdown,
        showFieldErrors,
        onInvalidCredentials: () => focusField(formElement, "password"),
      });
    }
  }

  /** La récupération de mot de passe est hors MVP (dossier H-17) : on le dit clairement. */
  function explainForgottenPassword() {
    notifyInfo(messages.login.forgotUnavailable);
  }

  return { values, errors, setValue, isSubmitting, isOnline, secondsLeft, submit, explainForgottenPassword };
}
