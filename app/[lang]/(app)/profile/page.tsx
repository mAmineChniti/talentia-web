'use client';

import * as React from 'react';
import { useForm, Controller, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  Building2,
  Camera,
  Globe,
  Link,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';

import { useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import {
  createProfileSchema,
  type ProfileFormValues,
} from '@/lib/schemas/profile';
import { usersApi } from '@/lib/services/users';
import type { User } from '@/lib/types/users';
import { fullName, initials } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { FileDrop } from '@/components/file-drop';

export default function ProfilePage() {
  const { dict } = useI18n();
  const t = dict.profile;
  const { user } = useSession();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(createProfileSchema(dict.validation)),
    defaultValues: profileDefaults(user),
  });

  const updateMutation = useApiMutation<ProfileFormValues, User>(
    (values) =>
      usersApi.update(user?.id as number, profilePayload(values, user)),
    {
      invalidate: [['session.user']],
      onSuccess: () => {
        toast.success(t.saved);
        form.resetField('newPassword');
      },
      onError: (err) => toast.error(err.message),
    }
  );

  const photoMutation = useApiMutation<File, User>(
    (image) => usersApi.uploadPhoto(user?.id as number, image),
    {
      invalidate: [['session.user']],
      onSuccess: () => toast.success(t.photoUpdated),
      onError: (err) => toast.error(err.message),
    }
  );

  function handlePhotoSelect(file: File) {
    photoMutation.mutate(file);
  }

  const meta = [
    { icon: <Mail className="size-3.5" />, value: user?.email },
    {
      icon: <MapPin className="size-3.5" />,
      value: [user?.city, user?.country].filter(Boolean).join(', '),
    },
    {
      icon: <Phone className="size-3.5" />,
      value: user?.telephone ? String(user.telephone) : undefined,
    },
    { icon: <Globe className="size-3.5" />, value: user?.linkedinUrl },
    { icon: <Link className="size-3.5" />, value: user?.githubUrl },
  ].filter((m) => m.value);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t.title}
        description={t.description}
        icon={<UserRound className="size-6" />}
      />

      <div className="from-primary via-primary/90 to-brand-2 shadow-primary/10 relative overflow-hidden rounded-2xl bg-linear-to-br shadow-lg">
        <div className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="bg-brand-2/30 pointer-events-none absolute -start-16 -bottom-28 size-80 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <Avatar className="ring-background/40 size-24 rounded-2xl border-4 border-white/25 shadow-xl backdrop-blur">
            <AvatarImage
              src={user?.profileImageUrl}
              alt={fullName(user?.name, user?.lastname)}
            />
            <AvatarFallback className="from-primary/20 to-brand-2/20 rounded-2xl text-2xl font-semibold">
              {initials(user?.name, user?.lastname)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-white/70 uppercase">
              {user?.role}
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white">
              {fullName(user?.name, user?.lastname)}
            </h2>
            <p className="mt-0.5 line-clamp-1 text-sm text-white/80">
              {user?.profession}
              {user?.entreprise ? ` · ${user.entreprise}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.map((m, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur"
                >
                  {m.icon}
                  <span className="max-w-44 truncate">{m.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden rounded-2xl shadow-sm">
          <CardHeader className="bg-muted/25 border-b">
            <CardTitle className="text-base">{t.photo}</CardTitle>
            <CardDescription>{t.photoHint}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <Avatar className="ring-background size-28 rounded-2xl shadow-md ring-4">
              <AvatarImage
                src={user?.profileImageUrl}
                alt={fullName(user?.name, user?.lastname)}
              />
              <AvatarFallback className="from-primary/10 to-brand-2/10 rounded-2xl text-3xl font-semibold">
                {initials(user?.name, user?.lastname)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">
                {fullName(user?.name, user?.lastname)}
              </p>
              <p className="text-muted-foreground text-xs">{user?.email}</p>
            </div>
            <div className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold">
              <ShieldCheck className="size-3.5" /> {user?.role}
            </div>
            <FileDrop
              onFileSelect={handlePhotoSelect}
              currentPreview={user?.profileImageUrl}
              disabled={photoMutation.isPending}
              className="w-full"
            />
            <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
              <Camera className="size-3.5" /> {t.photoHint}
            </p>
          </CardContent>
        </Card>

        <form
          onSubmit={form.handleSubmit((values) =>
            updateMutation.mutate(values)
          )}
          className="grid gap-6"
        >
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <CardHeader className="bg-muted/25 border-b">
              <div className="flex items-center gap-3">
                <span className="from-primary/15 to-brand-2/15 text-primary flex size-9 items-center justify-center rounded-xl bg-linear-to-br ring-1 ring-black/5">
                  <UserRound className="size-4.5" />
                </span>
                <div>
                  <CardTitle className="text-base">{t.personal}</CardTitle>
                  <CardDescription>{t.personalHint}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextController
                    name="name"
                    label={t.fields.name}
                    placeholder={t.placeholders.name}
                    form={form}
                    required
                  />
                  <TextController
                    name="lastname"
                    label={t.fields.lastname}
                    placeholder={t.placeholders.lastname}
                    form={form}
                    required
                  />
                </div>
                <TextController
                  name="email"
                  label={t.fields.email}
                  placeholder={t.placeholders.email}
                  form={form}
                  type="email"
                  required
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextController
                    name="city"
                    label={t.fields.city}
                    placeholder={t.placeholders.city}
                    form={form}
                  />
                  <TextController
                    name="country"
                    label={t.fields.country}
                    placeholder={t.placeholders.country}
                    form={form}
                  />
                </div>
                <TextController
                  name="telephone"
                  label={t.fields.telephone}
                  placeholder={t.placeholders.telephone}
                  form={form}
                  type="tel"
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <CardHeader className="bg-muted/25 border-b">
              <div className="flex items-center gap-3">
                <span className="from-primary/15 to-brand-2/15 text-primary flex size-9 items-center justify-center rounded-xl bg-linear-to-br ring-1 ring-black/5">
                  <Briefcase className="size-4.5" />
                </span>
                <div>
                  <CardTitle className="text-base">{t.professional}</CardTitle>
                  <CardDescription>{t.professionalHint}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextController
                    name="profession"
                    label={t.fields.profession}
                    placeholder={t.placeholders.profession}
                    form={form}
                  />
                  <TextController
                    name="posteActuel"
                    label={t.fields.posteActuel}
                    placeholder={t.placeholders.posteActuel}
                    form={form}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextController
                    name="entreprise"
                    label={t.fields.entreprise}
                    placeholder={t.placeholders.entreprise}
                    form={form}
                  />
                  <TextController
                    name="niveauExperience"
                    label={t.fields.niveauExperience}
                    placeholder={t.placeholders.niveauExperience}
                    form={form}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextController
                    name="linkedinUrl"
                    label={t.fields.linkedinUrl}
                    placeholder={t.placeholders.url}
                    form={form}
                    type="url"
                  />
                  <TextController
                    name="githubUrl"
                    label={t.fields.githubUrl}
                    placeholder={t.placeholders.url}
                    form={form}
                    type="url"
                  />
                </div>
                <TextController
                  name="cvUrl"
                  label={t.fields.cvUrl}
                  placeholder={t.placeholders.url}
                  form={form}
                  type="url"
                />
                <Field>
                  <FieldLabel htmlFor="profile-aboutme">
                    {t.fields.aboutme}
                  </FieldLabel>
                  <Controller
                    control={form.control}
                    name="aboutme"
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        id="profile-aboutme"
                        placeholder={t.placeholders.aboutme}
                        className="bg-background border-border min-h-24"
                      />
                    )}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <CardHeader className="bg-muted/25 border-b">
              <div className="flex items-center gap-3">
                <span className="from-primary/15 to-brand-2/15 text-primary flex size-9 items-center justify-center rounded-xl bg-linear-to-br ring-1 ring-black/5">
                  <Lock className="size-4.5" />
                </span>
                <div>
                  <CardTitle className="text-base">{t.security}</CardTitle>
                  <CardDescription>{t.securityHint}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <FieldGroup>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextController
                    name="newPassword"
                    label={t.fields.newPassword}
                    placeholder={t.placeholders.newPassword}
                    form={form}
                    type="password"
                  />
                  <div className="flex flex-col justify-end gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-muted-foreground size-4" />
                      <span className="text-sm font-medium">{t.role}</span>
                    </div>
                    <div className="from-primary/10 to-brand-2/10 text-primary flex h-9 items-center gap-2 rounded-lg bg-linear-to-r px-2.5 text-sm font-semibold ring-1 ring-black/5">
                      <Building2 className="size-4" /> {user?.role}
                    </div>
                  </div>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <div className="sticky bottom-4 z-10 flex justify-end">
            <div className="bg-card/90 flex items-center gap-3 rounded-2xl border p-2 shadow-lg backdrop-blur">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6"
              >
                <Save />
                {updateMutation.isPending ? t.saving : t.save}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function profileDefaults(user: User | undefined): ProfileFormValues {
  return {
    name: user?.name ?? '',
    lastname: user?.lastname ?? '',
    email: user?.email ?? '',
    city: user?.city ?? '',
    country: user?.country ?? '',
    telephone: String(user?.telephone ?? ''),
    profession: user?.profession ?? '',
    posteActuel: user?.posteActuel ?? '',
    entreprise: user?.entreprise ?? '',
    niveauExperience: user?.niveauExperience ?? '',
    aboutme: user?.aboutme ?? '',
    cvUrl: user?.cvUrl ?? '',
    linkedinUrl: user?.linkedinUrl ?? '',
    githubUrl: user?.githubUrl ?? '',
    newPassword: '',
  };
}

function profilePayload(
  values: ProfileFormValues,
  user: User | undefined
): Partial<User> {
  const payload: Partial<User> = {
    name: values.name,
    lastname: values.lastname,
    email: values.email,
    city: values.city,
    country: values.country,
    telephone: values.telephone ? Number(values.telephone) : undefined,
    profession: values.profession,
    posteActuel: values.posteActuel,
    entreprise: values.entreprise,
    niveauExperience: values.niveauExperience,
    aboutme: values.aboutme,
    cvUrl: values.cvUrl,
    linkedinUrl: values.linkedinUrl,
    githubUrl: values.githubUrl,
    role: user?.role,
  };
  if (values.newPassword) payload.password = values.newPassword;
  return payload;
}

type FieldName = keyof Omit<ProfileFormValues, 'aboutme'>;

function TextController({
  name,
  label,
  placeholder,
  form,
  type = 'text',
  required,
}: {
  name: FieldName;
  label: string;
  placeholder?: string;
  form: UseFormReturn<ProfileFormValues>;
  type?: string;
  required?: boolean;
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`profile-${name}`}>
            {label}
            {required && <span className="text-destructive"> *</span>}
          </FieldLabel>
          <Input
            {...field}
            id={`profile-${name}`}
            type={type}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            className="bg-background border-border"
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
