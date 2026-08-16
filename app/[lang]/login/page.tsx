'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import { ArrowRight, LoaderCircle, Sparkles } from 'lucide-react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useApiMutation } from '@/hooks/use-api';
import { createLoginSchema } from '@/lib/schemas/auth';
import { authApi } from '@/lib/services/auth';
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
import { setSessionCookie } from '@/actions/cookies';
import { toast } from 'sonner';

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export default function LoginPage() {
  const router = useRouter();
  const { dict, lang } = useI18n();
  const t = dict.login;
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(createLoginSchema(t.validation)),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useApiMutation<LoginFormValues, LoginResponse>(
    (values) => authApi.login(values),
    {
      invalidate: [['session.me'], ['session.user']],
      onSuccess: async (res) => {
        toast.success(t.welcome.split('{name}').join(res.name));

        await setSessionCookie({
          id: res.id,
          name: res.name,
          email: res.email,
          role: res.role,
        });

        const params = new URLSearchParams(location.search);
        const from = params.get('from');
        const target =
          from && from.startsWith('/') && !from.startsWith('//')
            ? from
            : `/${lang}/dashboard`;
        router.replace(target);
      },
      onError: (err) => toast.error(err.message),
    }
  );

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
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
              id="login-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4"
            >
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-email">{t.email}</FieldLabel>
                      <Input
                        {...field}
                        id="login-email"
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
                      <div className="flex items-center justify-between">
                        <FieldLabel htmlFor="login-password">
                          {t.password}
                        </FieldLabel>
                        <Link
                          href="#"
                          className="text-primary text-xs font-medium hover:underline"
                        >
                          {t.forgot}
                        </Link>
                      </div>
                      <Input
                        {...field}
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                        placeholder={t.passwordPlaceholder}
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
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <ArrowRight />
                )}
                {loginMutation.isPending ? t.submitLoading : t.submit}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-sm">
          {t.noAccount}{' '}
          <Link
            href={`/${lang}/register`}
            className="text-primary font-medium hover:underline"
          >
            {t.createAccount}
          </Link>
        </p>
      </div>
    </div>
  );
}
