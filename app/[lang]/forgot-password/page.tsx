'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, LoaderCircle, MailCheck, Send } from 'lucide-react';

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
import { toast } from 'sonner';

type ForgotFormValues = z.infer<ReturnType<typeof createSchema>>;

function createSchema(m: { email: string }) {
  return z.object({ email: z.email(m.email) });
}

export default function ForgotPasswordPage() {
  const { dict, lang } = useI18n();
  const t = dict.forgotPassword;
  const [sent, setSent] = React.useState(false);

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(createSchema(dict.login.validation)),
    defaultValues: { email: '' },
  });

  const forgotMutation = useApiMutation<ForgotFormValues, string>(
    (values) => passwordApi.forgot(values.email),
    {
      onSuccess: () => {
        setSent(true);
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
                <MailCheck className="text-primary-foreground size-5" />
              </div>
              <CardTitle className="font-heading mt-4 text-2xl">
                {t.title}
              </CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="text-center">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t.success}
                  </p>
                  <Link
                    href={`/${lang}/login`}
                    className="text-primary mt-6 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    <ArrowLeft className="size-4 rtl:rotate-180" />
                    {t.backToLogin}
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={form.handleSubmit((values) =>
                    forgotMutation.mutate(values)
                  )}
                  className="grid gap-4"
                >
                  <FieldGroup>
                    <Controller
                      control={form.control}
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
