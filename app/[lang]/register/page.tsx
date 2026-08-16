'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import { LoaderCircle, Sparkles } from 'lucide-react';

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
import { SiteHeader } from '@/components/site-header';
import { useI18n } from '@/components/i18n-provider';
import { toast } from 'sonner';
import { setSessionCookie } from '@/actions/cookies';

type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export default function RegisterPage() {
  const router = useRouter();
  const { dict, lang } = useI18n();
  const t = dict.register;
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="bg-primary/15 absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full blur-3xl" />
          <div className="bg-chart-2/10 absolute right-0 bottom-0 h-72 w-72 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-primary text-primary-foreground shadow-primary/25 mx-auto flex size-11 items-center justify-center rounded-xl shadow-lg">
              <Sparkles className="size-5" />
            </div>
            <CardTitle className="mt-4 text-xl">{t.title}</CardTitle>
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

        <p className="text-muted-foreground text-sm">
          {t.hasAccount}{' '}
          <Link
            href={`/${lang}/login`}
            className="text-primary font-medium hover:underline"
          >
            {t.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
