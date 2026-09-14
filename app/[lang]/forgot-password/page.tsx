'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  MailCheck,
  Send,
} from 'lucide-react';

import Link from 'next/link';

import { useApiMutation } from '@/hooks/use-api';
import { passwordApi } from '@/lib/services/password';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { useI18n } from '@/components/i18n-provider';
import { toast } from '@/components/ui/toast';

type ForgotFormValues = z.infer<ReturnType<typeof createEmailSchema>>;
type ResetFormValues = z.infer<ReturnType<typeof createPasswordSchema>>;

function createEmailSchema(m: { email: string }) {
  return z.object({ email: z.email(m.email) });
}

function createPasswordSchema(m: {
  passwordMin: string;
  confirmMatch: string;
}) {
  return z
    .object({
      newPassword: z.string().trim().min(6, m.passwordMin),
      confirmPassword: z.string().trim(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      error: m.confirmMatch,
      path: ['confirmPassword'],
    });
}

type Step = 'email' | 'code' | 'ready' | 'done';

export default function ForgotPasswordPage() {
  const { dict, lang } = useI18n();
  const t = dict.forgotPassword;
  const r = dict.resetPassword;
  const [step, setStep] = React.useState<Step>('email');
  const [code, setCode] = React.useState('');
  const [activeToken, setActiveToken] = React.useState('');

  const emailForm = useForm<ForgotFormValues>({
    resolver: zodResolver(createEmailSchema(dict.login.validation)),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<ResetFormValues>({
    resolver: zodResolver(createPasswordSchema(dict.register.validation)),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const forgotMutation = useApiMutation<ForgotFormValues, string>(
    (values) => passwordApi.forgot(values.email),
    {
      onSuccess: () => {
        setStep('code');
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  const codeMutation = useApiMutation<string, boolean>(
    (value) => passwordApi.validate(value.trim()),
    {
      onSuccess: (ok) => {
        if (ok) {
          setActiveToken(code.trim());
          setStep('ready');
        } else {
          toast.add({ type: 'error', description: r.invalidToken });
        }
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  const resetMutation = useApiMutation<ResetFormValues, string>(
    (values) => passwordApi.reset(activeToken, values.newPassword),
    {
      onSuccess: () => {
        setStep('done');
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="relative flex flex-1 items-center px-4 py-10">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="from-primary/25 via-chart-2/15 to-chart-4/10 absolute -top-24 left-1/2 h-120 w-205 -translate-x-1/2 rounded-full bg-linear-to-tr blur-3xl" />
        </div>

        <div className="mx-auto w-full max-w-md">
          <Card className="shadow-primary/5 rounded-3xl border shadow-2xl">
            <CardHeader className="text-center">
              <div className="from-primary to-brand-2 shadow-primary/25 mx-auto flex size-12 items-center justify-center rounded-2xl bg-linear-to-br shadow-lg">
                {step === 'done' ? (
                  <CheckCircle2 className="text-primary-foreground size-5" />
                ) : step === 'email' ? (
                  <MailCheck className="text-primary-foreground size-5" />
                ) : (
                  <KeyRound className="text-primary-foreground size-5" />
                )}
              </div>
              <CardTitle className="font-heading mt-4 text-2xl">
                {t.title}
              </CardTitle>
              <CardDescription>
                {step === 'email'
                  ? t.description
                  : step === 'code'
                    ? r.codeHint
                    : r.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'email' && (
                <form
                  onSubmit={emailForm.handleSubmit((values) =>
                    forgotMutation.mutate(values)
                  )}
                  className="grid gap-4"
                >
                  <FieldGroup>
                    <Controller
                      control={emailForm.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="forgot-email">
                            {t.email}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="forgot-email"
                            type="email"
                            autoComplete="email"
                            aria-invalid={fieldState.invalid}
                            placeholder={t.emailPlaceholder}
                            className="bg-background border-border h-11"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <Button
                    type="submit"
                    size="lg"
                    className="mt-2 w-full"
                    disabled={forgotMutation.isPending}
                  >
                    {forgotMutation.isPending ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {forgotMutation.isPending ? t.submitting : t.submit}
                  </Button>
                </form>
              )}

              {step === 'code' && (
                <div className="grid gap-4">
                  <p className="text-muted-foreground text-center text-sm leading-relaxed">
                    {t.success}
                  </p>
                  <div className="space-y-1.5">
                    <FieldLabel htmlFor="forgot-code">{r.codeLabel}</FieldLabel>
                    <Input
                      id="forgot-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={r.codePlaceholder}
                      inputMode="text"
                      autoComplete="one-time-code"
                      className="bg-background border-border h-11"
                    />
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => code.trim() && codeMutation.mutate(code)}
                    disabled={!code.trim() || codeMutation.isPending}
                  >
                    {codeMutation.isPending ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                    {codeMutation.isPending ? r.validatingCode : r.verifyCode}
                  </Button>
                  <button
                    type="button"
                    onClick={() => forgotMutation.mutate(emailForm.getValues())}
                    disabled={forgotMutation.isPending}
                    className="text-primary mx-auto text-xs font-medium hover:underline disabled:opacity-50"
                  >
                    {t.resendCode}
                  </button>
                </div>
              )}

              {step === 'ready' && (
                <form
                  onSubmit={passwordForm.handleSubmit((values) =>
                    resetMutation.mutate(values)
                  )}
                  className="grid gap-4"
                >
                  <FieldGroup>
                    <Controller
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="forgot-new-password">
                            {r.newPassword}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="forgot-new-password"
                            type="password"
                            autoComplete="new-password"
                            aria-invalid={fieldState.invalid}
                            placeholder={r.newPasswordPlaceholder}
                            className="bg-background border-border h-11"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="forgot-confirm-password">
                            {r.confirmPassword}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="forgot-confirm-password"
                            type="password"
                            autoComplete="new-password"
                            aria-invalid={fieldState.invalid}
                            placeholder={r.confirmPassword}
                            className="bg-background border-border h-11"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>

                  <Button
                    type="submit"
                    size="lg"
                    className="mt-2 w-full"
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                    {resetMutation.isPending ? r.submitting : r.submit}
                  </Button>
                </form>
              )}

              {step === 'done' && (
                <div className="text-center">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {r.success}
                  </p>
                  <Link
                    href={`/${lang}/login`}
                    className="text-primary mt-6 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    <ArrowLeft className="size-4 rtl:rotate-180" />
                    {t.backToLogin}
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            <Link
              href={`/${lang}/login`}
              className="text-primary inline-flex items-center gap-1.5 font-medium hover:underline"
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t.backToLogin}
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
