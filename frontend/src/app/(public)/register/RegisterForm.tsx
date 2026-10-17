"use client";

import { ArrowRight, CircleArrowDown, RefreshCw, ShieldCheck, Store, User, UserCheck, WifiOff, Lock } from "lucide-react";
import { useId } from "react";

import { Badge } from "@/components/data/Badge/Badge";
import { Button, ButtonLink } from "@/components/forms/Button/Button";
import { PasswordStrength } from "@/components/forms/PasswordStrength/PasswordStrength";
import { PhoneField } from "@/components/forms/PhoneField/PhoneField";
import { TextField } from "@/components/forms/TextField/TextField";
import { Banner } from "@/components/overlays/Banner/Banner";
import { BrandHeader } from "@/components/structure/BrandHeader/BrandHeader";
import { PageEnter } from "@/components/structure/PageEnter/PageEnter";
import { NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH } from "@/config/constants";
import { ROUTES } from "@/config/routes";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { messages } from "@/messages/fr";

const text = messages.register;

/** Petite mention à droite d'un libellé (« Obligatoire », « Sur vos reçus »...). */
function Aside({ children, tone = "muted" }: { children: string; tone?: "muted" | "success" }) {
  const color = tone === "success" ? "font-semibold text-success-700" : "text-ink-muted";
  return <span className={`text-xs ${color}`}>{children}</span>;
}

/** Écran P02 : il affiche et déclenche, toute la logique est dans useRegisterForm. */
export function RegisterForm() {
  const form = useRegisterForm();
  const headingId = useId();
  const isLocked = form.secondsLeft > 0;

  return (
    <PageEnter>
      <header className="flex flex-col items-center gap-2.5">
        <BrandHeader />
        <Badge tone="info" size="md">
          {messages.brand.tagline}
        </Badge>
        <p className="max-w-80 text-center text-sm leading-5 text-ink-soft">{text.intro}</p>
      </header>

      {!form.isOnline && (
        <div className="mt-5 w-full">
          <Banner tone="warning" role="status" icon={<WifiOff className="size-5" />}>
            {text.offline}
          </Banner>
        </div>
      )}

      <form
        noValidate
        onSubmit={form.submit}
        aria-labelledby={headingId}
        className="mt-5 flex w-full flex-col gap-4.5 rounded-card bg-surface-card p-4 shadow-card"
      >
        <h2 id={headingId} className="sr-only">
          {text.formLabel}
        </h2>

        <TextField
          label={text.fullNameLabel}
          labelAside={<Aside>{text.fullNameAside}</Aside>}
          icon={<User className="size-5" />}
          name="full_name"
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
          placeholder={text.fullNamePlaceholder}
          value={form.values.full_name}
          onChange={(event) => form.setValue("full_name", event.target.value)}
          error={form.errors.full_name}
        />

        <PhoneField
          label={text.phoneLabel}
          labelAside={<Aside tone="success">{text.phoneAside}</Aside>}
          hint={
            <>
              <ShieldCheck aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {text.phoneHint}
            </>
          }
          name="phone"
          placeholder={text.phonePlaceholder}
          value={form.values.phone}
          onValueChange={(digits) => form.setValue("phone", digits)}
          error={form.errors.phone}
        />

        <TextField
          label={text.shopNameLabel}
          labelAside={<Aside>{text.shopNameAside}</Aside>}
          icon={<Store className="size-5" />}
          name="shop_name"
          autoComplete="organization"
          maxLength={NAME_MAX_LENGTH}
          placeholder={text.shopNamePlaceholder}
          value={form.values.shop_name}
          onChange={(event) => form.setValue("shop_name", event.target.value)}
          error={form.errors.shop_name}
        />

        <div className="flex flex-col gap-2.5">
          <TextField
            label={text.passwordLabel}
            icon={<Lock className="size-5" />}
            name="password"
            type="password"
            autoComplete="new-password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={PASSWORD_MAX_LENGTH}
            placeholder={text.passwordPlaceholder}
            revealToggle="icon-label"
            value={form.values.password}
            onChange={(event) => form.setValue("password", event.target.value)}
            error={form.errors.password}
          />
          <PasswordStrength password={form.values.password} />
        </div>

        <Banner tone="info" icon={<RefreshCw className="size-5" />}>
          {text.offlineInfo.before}
          <strong className="font-bold">{text.offlineInfo.strong}</strong>
          {text.offlineInfo.after}
        </Banner>

        <Button type="submit" fullWidth loading={form.isSubmitting} disabled={isLocked} icon={<UserCheck aria-hidden="true" className="size-5" />}>
          {isLocked ? messages.common.retryIn(form.secondsLeft) : text.submit}
        </Button>
      </form>

      <p className="mt-5 text-[13.5px] text-ink-soft">{text.haveAccount}</p>
      <ButtonLink href={ROUTES.login} className="mt-0.5 text-sm" trailingIcon={<ArrowRight aria-hidden="true" className="size-4" />}>
        {text.signIn}
      </ButtonLink>

      <p className="mt-6 flex items-start gap-3 text-center text-[12.5px] text-ink-muted italic">
        <CircleArrowDown aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {text.deviceNote}
      </p>
    </PageEnter>
  );
}
