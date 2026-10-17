import type { Metadata } from "next";

import { messages } from "@/messages/fr";

import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: messages.register.pageTitle };

/** P02 · Créer un compte (route /register, gabarit L1, UC01). */
export default function RegisterPage() {
  return <RegisterForm />;
}
