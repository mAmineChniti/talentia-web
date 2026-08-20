'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, KeyRound, LoaderCircle, ShieldAlert } from 'lucide-react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { useApi, useApiMutation } from '@/hooks/use-api';
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
import { toast } from 'sonner';

type ResetFormValues = z.infer<ReturnType<typeof createSchema>>;

function createSchema(m: { passwordMin: string; confirmMatch: string }) {
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

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={undefined}>
      <ResetPasswordInner />
    </React.Suspense>
  );
}

function ResetPasswordInner() {
  const { dict, lang } = useI18n();
  const t = dict.resetPassword;
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token') ?? '';
  const [activeToken, setActiveToken] = React.useState(urlToken);
  const [code, setCode] = React.useState('');
  const [done, setDone] = React.useState(false);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(createSchema(dict.register.validation)),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const {
    data: isValid,
    loading: validating,
    error: validateError,
  } = useApi(
    ['password.validate', activeToken],
    () => passwordApi.validate(activeToken),
    { enabled: activeToken !== '' }
  );

  const codeMutation = useApiMutation<string, boolean>(
    (value) => passwordApi.validate(value),
    {
      onSuccess: (ok) => {
        if (ok) {
          setActiveToken(code);
        } else {
          toast.error(t.invalidToken);
        }
      },
      onError: (err) => toast.error(err.message),
    }
  );

  const state = done
    ? 'done'
    : activeToken === ''
      ? 'code'
      : validateError
        ? 'invalid'
        : validating
          ? 'validating'
          : isValid
            ? 'ready'
            : 'invalid';

  const resetMutation = useApiMutation<ResetFormValues, string>(
    (values) => passwordApi.reset(activeToken, values.newPassword),
    {
      onSuccess: () => {
        setDone(true);
      },
      onError: (err) => toast.error(err.message),
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
                <KeyRound className="text-primary-foreground size-5" />
              </div>
              <CardTitle className="font-heading mt-4 text-2xl">
                {t.title}
              </CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {state === 'code' && (
                <div className="grid gap-4">
                  <div className="space-y-1.5">
                    <FieldLabel htmlFor="reset-code">{t.codeLabel}</FieldLabel>
                    <Input
                      id="reset-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={t.codePlaceholder}
                      inputMode="text"
                      autoComplete="one-time-code"
                      className="bg-background border-border h-11"
                    />
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => code && codeMutation.mutate(code)}
                    disabled={!code.trim() || codeMutation.isPending}
                  >
                    {codeMutation.isPending ? (
                      <LoaderCircle className="animate-spin" />
                    ) : (
                      <KeyRound className="size-4" />
                    )}
                    {codeMutation.isPending ? t.validatingCode : t.verifyCode}
                  </Button>
                  <p className="text-muted-foreground text-center text-xs">
                    {t.codeHint}
                  </p>
                </div>
              )}

              {state === 'validating' && (
                <div className="flex justify-center py-6">
                  <LoaderCircle className="text-primary size-6 animate-spin" />
                </div>
              )}

              {state === 'invalid' && (
                <div className="text-center">
                  <ShieldAlert className="text-destructive mx-auto size-10" />
                  <p className="text-muted-foreground mt-4 text-sm">
                    {t.invalidToken}
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

              {state === 'ready' && (
                <form
                  onSubmit={form.handleSubmit((values) =>
                    resetMutation.mutate(values)
                  )}
                  className="grid gap-4"
                >
                  <FieldGroup>
                    <Controller
                      control={form.control}
                      name="newPassword"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="reset-password">
                            {t.newPassword}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="reset-password"
                            type="password"
                            autoComplete="new-password"
                            aria-invalid={fieldState.invalid}
                            placeholder={t.newPasswordPlaceholder}
                            className="bg-background border-border h-11"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="confirmPassword"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="reset-confirm">
                            {t.confirmPassword}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="reset-confirm"
                            type="password"
                            autoComplete="new-password"
                            aria-invalid={fieldState.invalid}
                            placeholder={t.confirmPassword}
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
                    {resetMutation.isPending ? t.submitting : t.submit}
                  </Button>
                </form>
              )}

              {state === 'done' && (
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">{t.success}</p>
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
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
