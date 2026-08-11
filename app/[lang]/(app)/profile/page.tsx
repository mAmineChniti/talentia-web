'use client';

import * as React from 'react';
import { useForm, Controller, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="grid gap-6">
      <PageHeader title={t.title} description={t.description} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-2 text-center">
            <Avatar className="size-24">
              <AvatarImage
                src={user?.profileImageUrl}
                alt={fullName(user?.name, user?.lastname)}
              />
              <AvatarFallback className="text-2xl">
                {initials(user?.name, user?.lastname)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-base font-semibold">
                {fullName(user?.name, user?.lastname)}
              </p>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <div className="bg-muted mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium">
                {user?.role}
              </div>
            </div>
            <FileDrop
              onFileSelect={handlePhotoSelect}
              currentPreview={user?.profileImageUrl}
              disabled={photoMutation.isPending}
              className="w-full"
            />
          </CardContent>
        </Card>

        <form
          onSubmit={form.handleSubmit((values) =>
            updateMutation.mutate(values)
          )}
          className="grid gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>{t.personal}</CardTitle>
              <CardDescription>{t.personalHint}</CardDescription>
            </CardHeader>
            <CardContent>
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

          <Card>
            <CardHeader>
              <CardTitle>{t.professional}</CardTitle>
              <CardDescription>{t.professionalHint}</CardDescription>
            </CardHeader>
            <CardContent>
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
                        className="min-h-24"
                      />
                    )}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.security}</CardTitle>
              <CardDescription>{t.securityHint}</CardDescription>
            </CardHeader>
            <CardContent>
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
                    <div className="bg-muted flex h-9 items-center rounded-lg px-2.5 text-sm">
                      {user?.role}
                    </div>
                  </div>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save />
              {updateMutation.isPending ? t.saving : t.save}
            </Button>
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
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
