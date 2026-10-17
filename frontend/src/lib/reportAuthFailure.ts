/**
 * Affiche le bon message pour chaque cas d'échec d'authentification (Interfaces §5.3 :
 * messages d'erreur en notification, erreurs de champ sous le champ concerné).
 * Partagé par les deux formulaires (DRY) : chacun fournit ses propres réactions.
 */

import type { AuthFailure } from "@/lib/authErrors";
import { notifyError } from "@/lib/toast";
import { hasErrors, pickFieldErrors, type FieldErrors } from "@/lib/validation";
import { messages } from "@/messages/fr";

type FailureHandlers<Values> = {
  /** Message affiché quand le réseau est injoignable (différent à la connexion et à l'inscription). */
  offlineMessage: string;
  /** Les champs du formulaire : seules leurs erreurs serveur sont affichées sous les champs. */
  knownFields: ReadonlyArray<keyof Values>;
  startCountdown: (seconds: number) => void;
  showFieldErrors: (errors: FieldErrors<Values>) => void;
  onInvalidCredentials?: () => void;
};

export function reportAuthFailure<Values>(failure: AuthFailure, handlers: FailureHandlers<Values>): void {
  switch (failure.type) {
    case "offline":
      notifyError(handlers.offlineMessage);
      return;
    case "throttled":
      handlers.startCountdown(failure.retryAfterSeconds);
      notifyError(messages.common.throttled(failure.retryAfterSeconds));
      return;
    case "invalid-credentials":
      notifyError(messages.login.invalidCredentials); // message volontairement générique
      handlers.onInvalidCredentials?.();
      return;
    case "validation": {
      const fieldErrors = pickFieldErrors<Values>(failure.fieldErrors, handlers.knownFields);
      if (hasErrors(fieldErrors)) handlers.showFieldErrors(fieldErrors);
      else notifyError(messages.common.genericError);
      return;
    }
    default:
      notifyError(messages.common.genericError);
  }
}
