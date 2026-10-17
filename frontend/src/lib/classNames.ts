type ClassPart = string | false | null | undefined;

/** Assemble des noms de classes CSS en ignorant les valeurs vides (DRY : un seul assembleur). */
export function cx(...parts: ClassPart[]): string {
  return parts.filter(Boolean).join(" ");
}
