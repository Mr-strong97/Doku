import { messages } from "@/messages/fr";

/** Logotype « Doku » (titre principal des écrans publics). */
export function BrandHeader() {
  return (
    <h1 className="text-center text-[1.875rem] leading-none font-extrabold text-brand-900">
      {messages.brand.name}
    </h1>
  );
}
