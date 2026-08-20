'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  CalendarClock,
  HandCoins,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { createRegisterSchema } from '@/lib/schemas/auth';
import { useApiMutation } from '@/hooks/use-api';
import { authApi } from '@/lib/services/auth';
import { usersApi } from '@/lib/services/users';
import type { LoginResponse } from '@/lib/types/auth';
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
import { setSessionCookie } from '@/actions/cookies';

type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;

const panelIcons = [Users, CalendarClock, HandCoins];

export default function RegisterPage() {
  const router = useRouter();
  const { dict, lang } = useI18n();
  const t = dict.register;
  const landing = dict.landing;
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(createRegisterSchema(t.validation)),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registerMutation = useApiMutation<RegisterFormValues, LoginResponse>(
    async (values) => {
      await usersApi.create({
        name: values.firstName,
        lastname: values.lastName,
        email: values.email,
        password: values.password,
      });
      return authApi.login({ email: values.email, password: values.password });
    },
    {
      invalidate: [['session.me'], ['session.user']],
      onSuccess: (res) => {
        void (async () => {
          await setSessionCookie({
            id: res.id,
            name: res.name,
            email: res.email,
            role: res.role,
          });
          toast.success(t.success);
          router.replace(`/${lang}/dashboard`);
        })();
      },
      onError: (error) => {
        toast.error(Error.isError(error) ? error.message : t.createError);
      },
    }
  );

  function onSubmit(values: RegisterFormValues) {
    registerMutation.mutate(values);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="relative flex flex-1 items-center px-4 py-10">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="from-primary/25 via-chart-2/15 to-chart-4/10 absolute -top-24 left-1/2 h-120 w-205 -translate-x-1/2 rounded-full bg-linear-to-tr blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-5xl">
          <div className="bg-card shadow-primary/5 grid w-full overflow-hidden rounded-3xl border shadow-2xl md:grid-cols-[1fr_1.1fr]">
            <div className="from-primary via-primary to-brand-2 relative hidden flex-col justify-between overflow-hidden bg-linear-to-br p-8 text-white md:flex">
              <div className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
              <div className="bg-brand-2/40 pointer-events-none absolute -start-20 -bottom-32 size-80 rounded-full blur-3xl" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.14),transparent_45%)]" />

              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25 backdrop-blur">
                  <Sparkles className="size-3.5" /> {landing.badge}
                </span>
                <h1 className="font-heading mt-5 text-3xl leading-tight font-bold tracking-tight">
                  {landing.hero.title}
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  {landing.hero.subtitle}
                </p>
              </div>

              <div className="relative mt-10 space-y-4">
                {landing.features.items.slice(0, 3).map((item, i) => {
                  const Icon = panelIcons[i] ?? Sparkles;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs leading-relaxed text-white/70">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="relative mt-10 flex items-center gap-2 text-xs text-white/70">
                <ShieldCheck className="size-4" /> {dict.common.secureWorkspace}
              </p>
            </div>

            <Card className="rounded-none border-0 bg-transparent shadow-none">
              <CardHeader className="text-center">
                <div className="from-primary to-brand-2 shadow-primary/25 mx-auto flex size-12 items-center justify-center rounded-2xl bg-linear-to-br shadow-lg">
                  <UserPlus className="text-primary-foreground size-5" />
                </div>
                <CardTitle className="font-heading mt-4 text-2xl">
                  {t.title}
                </CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  id="register-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid gap-4"
                >
                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Controller
                        control={form.control}
                        name="firstName"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="register-firstName">
                              {t.firstName}
                            </FieldLabel>
                            <Input
                              {...field}
                              id="register-firstName"
                              autoComplete="given-name"
                              aria-invalid={fieldState.invalid}
                              placeholder={t.firstNamePlaceholder}
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
                        name="lastName"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="register-lastName">
                              {t.lastName}
                            </FieldLabel>
                            <Input
                              {...field}
                              id="register-lastName"
                              autoComplete="family-name"
                              aria-invalid={fieldState.invalid}
                              placeholder={t.lastNamePlaceholder}
                              className="bg-background border-border h-11"
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </div>

                    <Controller
                      control={form.control}
                      name="email"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="register-email">
                            {t.email}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="register-email"
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

                    <Controller
                      control={form.control}
                      name="password"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="register-password">
                            {t.password}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="register-password"
                            type="password"
                            autoComplete="new-password"
                            aria-invalid={fieldState.invalid}
                            placeholder={t.passwordPlaceholder}
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
                          <FieldLabel htmlFor="register-confirmPassword">
                            {t.confirmPassword}
                          </FieldLabel>
                          <Input
                            {...field}
                            id="register-confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            aria-invalid={fieldState.invalid}
                            placeholder={t.confirmPasswordPlaceholder}
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
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <LoaderCircle className="animate-spin" />
                    ) : undefined}
                    {registerMutation.isPending ? t.submitLoading : t.submit}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          <p className="text-muted-foreground mt-6 text-center text-sm">
            {t.hasAccount}{' '}
            <Link
              href={`/${lang}/login`}
              className="text-primary font-medium hover:underline"
            >
              {t.signIn}
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
