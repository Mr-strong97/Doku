import { useCallback, useState } from "react";

import type { FieldErrors } from "@/lib/validation";

function withoutKey<T extends object>(source: T, key: keyof T): T {
  const copy = { ...source };
  delete copy[key];
  return copy;
}

/**
 * Valeurs et erreurs d'un formulaire. Taper dans un champ efface SON erreur : la personne
 * voit tout de suite que sa correction est prise en compte.
 */
export function useFormState<Values extends Record<string, string>>(initialValues: Values) {
  const [values, setValues] = useState<Values>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<Values>>({});

  const setValue = useCallback(<Name extends keyof Values>(name: Name, value: Values[Name]) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => withoutKey(current, name));
  }, []);

  return { values, errors, setValue, setErrors };
}
