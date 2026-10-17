/**
 * Place le curseur dans le premier champ en erreur (clavier et lecteurs d'écran).
 * On retrouve les champs par leur attribut `name` dans le <form> : aucun « ref » à transmettre.
 *
 * @param form        le formulaire (event.currentTarget, à capturer avant tout `await`)
 * @param fieldNames  les champs dans l'ordre d'affichage
 * @param errors      les erreurs par champ : le premier champ qui en a une reçoit le curseur
 */
export function focusFirstInvalidField(
  form: HTMLFormElement,
  fieldNames: ReadonlyArray<string>,
  errors: Partial<Record<string, string>>,
): void {
  const firstInvalid = fieldNames.find((name) => errors[name]);
  if (firstInvalid) focusField(form, firstInvalid);
}

export function focusField(form: HTMLFormElement, name: string): void {
  const element = form.elements.namedItem(name);
  if (element instanceof HTMLElement) element.focus();
}
