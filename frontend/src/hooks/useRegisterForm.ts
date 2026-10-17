import { useState, type FormEvent } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useCountdown } from "@/hooks/useCountdown";
import { useFormState } from "@/hooks/useFormState";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { classifyAuthError } from "@/lib/authErrors";
import { focusFirstInvalidField } from "@/lib/focus";
import { toInternationalNumber } from "@/lib/phone";
import { reportAuthFailure } from "@/lib/reportAuthFailure";
import { notifyError } from "@/lib/toast";
import { hasErrors, validateRegister, type FieldErrors, type RegisterValues } from "@/lib/validation";
import { messages } from "@/messages/fr";

/** Les champs dans l'ordre d'affichage (ce sont aussi leurs attributs `name`). */
const REGISTER_FIELDS: ReadonlyArray<keyof RegisterValues> = ["full_name", "phone", "shop_name", "password"];

/**
 * Logique de la page P02 « Créer un compte » (UC01). Le serveur crée l'utilisateur ET sa
 * boutique en une seule transaction, puis ouvre la session : <RedirectIfAuthenticated />
 * envoie ensuite vers la configuration initiale (P03).
 */
export function useRegisterForm() {
  const { register } = useAuth();
  const isOnline = useOnlineStatus();
  const { values, errors, setValue, setErrors } = useFormState<RegisterValues>({
    full_name: "",
    phone: "",
    shop_name: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { secondsLeft, start: startCountdown } = useCountdown();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget; // à capturer avant le premier « await »
    if (isSubmitting || secondsLeft > 0) return;

    function showFieldErrors(fieldErrors: FieldErrors<RegisterValues>) {
      setErrors(fieldErrors);
      focusFirstInvalidField(formElement, REGISTER_FIELDS, fieldErrors);
    }

    const validationErrors = validateRegister(values);
    if (hasErrors(validationErrors)) return showFieldErrors(validationErrors);
    if (!navigator.onLine) return notifyError(messages.register.offline);

    setIsSubmitting(true);
    try {
      await register({
        full_name: values.full_name.trim(),
        phone: toInternationalNumber(values.phone),
        shop_name: values.shop_name.trim(),
        password: values.password,
      });
    } catch (error) {
      setIsSubmitting(false);
      reportAuthFailure(classifyAuthError(error), {
        offlineMessage: messages.register.offline,
        knownFields: REGISTER_FIELDS,
        startCountdown,
        showFieldErrors,
      });
    }
  }

  return { values, errors, setValue, isSubmitting, isOnline, secondsLeft, submit };
}
