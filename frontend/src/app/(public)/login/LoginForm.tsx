"use client";

import { ArrowRight, Info, WifiOff } from "lucide-react";
import { useId } from "react";

import { Badge } from "@/components/data/Badge/Badge";
import { Button, ButtonLink } from "@/components/forms/Button/Button";
import { PhoneField } from "@/components/forms/PhoneField/PhoneField";
import { TextField } from "@/components/forms/TextField/TextField";
import { Banner } from "@/components/overlays/Banner/Banner";
import { BrandHeader } from "@/components/structure/BrandHeader/BrandHeader";
import { PageEnter } from "@/components/structure/PageEnter/PageEnter";
import { ROUTES } from "@/config/routes";
import { useLoginForm } from "@/hooks/useLoginForm";
import { messages } from "@/messages/fr";

const text = messages.login;

/** Écran P01 : il affiche et déclenche, toute la logique est dans useLoginForm. */
export function LoginForm() {
  const form = useLoginForm();
  const headingId = useId();
  const isLocked = form.secondsLeft > 0;

  return (
    <PageEnter>
      <header className="flex flex-col items-center">
        <BrandHeader />
        <p className="mt-2 text-sm leading-5 text-ink-soft">{messages.brand.tagline}</p>
        <div className="mt-4">
          <Badge tone="success">{text.badge}</Badge>
        </div>
      </header>

      {!form.isOnline && (
        <div className="mt-6 w-full">
          <Banner tone="warning" role="status" icon={<WifiOff className="size-5" />}>
            {text.offline}
          </Banner>
        </div>
      )}

      <form noValidate onSubmit={form.submit} aria-labelledby={headingId} className="mt-8 flex w-full flex-col gap-4.5">
        <h2 id={headingId} className="sr-only">
          {text.formLabel}
        </h2>

        <PhoneField
          appearance="elevated"
          label={text.phoneLabel}
          labelAside={<span className="text-xs text-ink-muted">{text.phoneAside}</span>}
          name="phone"
          autoComplete="username"
          placeholder={text.phonePlaceholder}
          value={form.values.phone}
          onValueChange={(digits) => form.setValue("phone", digits)}
          error={form.errors.phone}
        />

        <TextField
          appearance="elevated"
          label={text.passwordLabel}
          labelAside={
            <Button variant="text" className="text-xs" onClick={form.explainForgottenPassword}>
              {text.forgot}
            </Button>
          }
          name="password"
          type="password"
          autoComplete="current-password"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          revealToggle="label"
          value={form.values.password}
          onChange={(event) => form.setValue("password", event.target.value)}
          error={form.errors.password}
        />

        <Button
          type="submit"
          fullWidth
          loading={form.isSubmitting}
          disabled={isLocked}
          trailingIcon={<ArrowRight aria-hidden="true" className="size-5" />}
        >
          {isLocked ? messages.common.retryIn(form.secondsLeft) : text.submit}
        </Button>
      </form>

      <p className="mt-5 flex flex-wrap items-center justify-center gap-x-2 text-[13.5px] text-ink-soft">
        {text.noAccount}
        <ButtonLink href={ROUTES.register} className="text-[13.5px]">
          {text.createAccount}
        </ButtonLink>
      </p>

      <p className="mt-9 flex items-center gap-2 text-[12.5px] text-ink-muted italic">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        {text.firstLoginNote}
      </p>
    </PageEnter>
  );
}
