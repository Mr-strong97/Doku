import type { Metadata } from "next";

import { messages } from "@/messages/fr";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: messages.login.pageTitle };

/** P01 · Connexion (route /login, gabarit L1, UC02). */
export default function LoginPage() {
  return <LoginForm />;
}
