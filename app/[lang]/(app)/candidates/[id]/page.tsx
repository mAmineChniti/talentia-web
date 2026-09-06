'use client';

import * as React from 'react';
import NextLink from 'next/link';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  Briefcase,
  CalendarClock,
  CircleCheck,
  CircleX,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  LinkIcon,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { applicationsApi } from '@/lib/services/applications';
import { usersApi } from '@/lib/services/users';
import type { ApplicationResponse } from '@/lib/types/applications';
import { interviewsApi } from '@/lib/services/interviews';
import type { InterviewResponse } from '@/lib/types/interviews';
import { createInterviewSchema } from '@/lib/schemas/interviews';
import { fullName, initials, formatDate, parseList } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState } from '@/components/states';
import { StatusBadge } from '@/components/status-badge';
import { DateTimePicker } from '@/components/ui/date-picker';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';
import { cn } from '@/lib/utils';

type InterviewFormValues = z.infer<ReturnType<typeof createInterviewSchema>>;

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={
            i < Math.round(value)
              ? 'fill-chart-3 text-chart-3 size-3.5'
              : 'text-muted-foreground/30 size-3.5'
          }
        />
      ))}
    </div>
  );
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const clamped = Math.min(Math.max(score, 0), 100);
  const color =
    clamped >= 70
      ? 'var(--chart-2)'
      : clamped >= 40
        ? 'var(--chart-3)'
        : 'var(--chart-5)';
  const isSmall = size <= 44;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <RadialBarChart
        width={size}
        height={size}
        data={[{ name: 'score', value: clamped }]}
        innerRadius="80%"
        outerRadius="97%"
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar
          dataKey="value"
          fill={color}
          background={{ fill: 'var(--muted)' }}
          cornerRadius={999}
        />
      </RadialBarChart>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            'font-semibold tabular-nums',
            isSmall ? 'text-[10px]' : 'text-sm'
          )}
          style={{ color }}
        >
          {clamped}%
        </span>
      </div>
    </div>
  );
}

function AppCard({
  app,
  candidateName,
}: {
  app: ApplicationResponse;
  candidateName: string;
}) {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const canSchedule = app.status === 'PENDING' || app.status === 'HR_INTERVIEW';
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const scheduleForm = useForm<InterviewFormValues>({
    resolver: zodResolver(createInterviewSchema(dict.validation)),
    defaultValues: {
      applicationId: app.id,
      interviewDate: '',
      type: 'ONLINE',
      location: '',
    },
  });
  const scheduleType = useWatch({
    control: scheduleForm.control,
    name: 'type',
  });
  const scheduleMutation = useApiMutation<
    InterviewFormValues,
    InterviewResponse
  >(
    (body) =>
      interviewsApi.create({
        applicationId: body.applicationId,
        interviewDate: body.interviewDate,
        type: body.type,
        ...(body.type === 'ONSITE' && { location: body.location }),
      }),
    {
      invalidate: ['interviews.list', 'dashboard.get'],
      onSuccess: () => {
        toast.success(t.successScheduled);
        setScheduleOpen(false);
        scheduleForm.reset();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <div className="bg-muted/30 space-y-4 rounded-xl p-4">
      <div className="flex items-center gap-4">
        <ScoreRing score={app.score} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {t.candidateName.split('{id}').join(String(app.id))}
          </p>
          <Stars value={app.stars} />
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
            <CalendarClock className="size-3.5" />
            {formatDate(app.datePostulation)}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {parseList(app.strengths).length > 0 && (
        <div className="border-chart-2/20 bg-chart-2/5 rounded-xl border p-3">
          <p className="text-chart-2 mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
            <CircleCheck className="size-3.5" /> {t.strengths}
          </p>
          <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-xs leading-relaxed">
            {parseList(app.strengths).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {parseList(app.weaknesses).length > 0 && (
        <div className="border-chart-3/20 bg-chart-3/5 rounded-xl border p-3">
          <p className="text-chart-3 mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
            <CircleX className="size-3.5" /> {t.weaknesses}
          </p>
          <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-xs leading-relaxed">
            {parseList(app.weaknesses).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {app.feedback && (
        <div className="bg-primary/5 ring-primary/10 rounded-xl p-3 ring-1 ring-inset">
          <p className="text-primary mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
            <Sparkles className="size-3.5" /> {t.aiAnalysis}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">
            {app.feedback}
          </p>
        </div>
      )}

      {app.recommendation && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {t.recommendation}
          </span>
          <span className="bg-primary/10 text-primary ring-primary/20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset">
            {app.recommendation}
          </span>
        </div>
      )}

      {app.motivationLetter && (
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
            {t.motivationLetter}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-line">
            {app.motivationLetter}
          </p>
        </div>
      )}

      {canSchedule && (
        <div className="pt-1">
          <Dialog
            open={scheduleOpen}
            onOpenChange={(o) => {
              setScheduleOpen(o);
              if (!o) scheduleForm.reset();
            }}
          >
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              <CalendarClock className="size-3.5" /> {t.scheduleInterview}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {t.scheduleDialogTitle} — {candidateName}
                </DialogTitle>
                <DialogDescription>{t.scheduleDialogDesc}</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={scheduleForm.handleSubmit((values) =>
                  scheduleMutation.mutate(values)
                )}
                className="grid gap-4 py-1"
              >
                <FieldGroup>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Controller
                      control={scheduleForm.control}
                      name="type"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t.typeLabel}</FieldLabel>
                          <Select
                            name={field.name}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger aria-invalid={fieldState.invalid}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ONLINE">{t.online}</SelectItem>
                              <SelectItem value="ONSITE">{t.onsite}</SelectItem>
                            </SelectContent>
                          </Select>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      control={scheduleForm.control}
                      name="interviewDate"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t.dateLabel}</FieldLabel>
                          <DateTimePicker
                            value={field.value}
                            onChange={field.onChange}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </div>
                  {scheduleType === 'ONSITE' && (
                    <Controller
                      control={scheduleForm.control}
                      name="location"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>{t.locationLabel}</FieldLabel>
                          <Input
                            {...field}
                            placeholder={t.locationPlaceholder}
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  )}
                  {scheduleType === 'ONLINE' && (
                    <p className="bg-muted/60 text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
                      <Video className="size-3.5" />
                      {t.autoMeetingLink}
                    </p>
                  )}
                </FieldGroup>
                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={scheduleMutation.isPending}>
                    {scheduleMutation.isPending ? t.scheduling : t.schedule}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

export default function CandidateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { dict } = useI18n();

  const {
    data: user,
    loading: userLoading,
    error: userError,
  } = useApi(['users', id], () => usersApi.get(Number(id)));

  const { data: applications, loading: appsLoading } = useApi(
    ['applications.list'],
    () => applicationsApi.list()
  );

  const userApps = React.useMemo(() => {
    if (!applications || !user) return [];
    return applications.filter((a) => a.userId === user.id);
  }, [applications, user]);

  if (userLoading || appsLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (userError) {
    return <ErrorState description={userError.message} />;
  }

  if (!user) {
    return <EmptyState />;
  }

  const meta = [
    { icon: <Mail className="size-3.5" />, value: user.email },
    {
      icon: <MapPin className="size-3.5" />,
      value: [user.city, user.country].filter(Boolean).join(', '),
    },
    {
      icon: <Phone className="size-3.5" />,
      value: user.telephone ? String(user.telephone) : undefined,
    },
    { icon: <Globe className="size-3.5" />, value: user.linkedinUrl },
    { icon: <LinkIcon className="size-3.5" />, value: user.githubUrl },
  ].filter((m) => m.value);

  return (
    <div className="grid gap-6">
      <PageHeader
        title={fullName(user.name, user.lastname)}
        description={user.email}
        icon={<Briefcase className="size-6" />}
      />

      <div className="from-primary via-primary/90 to-brand-2 shadow-primary/10 relative overflow-hidden rounded-2xl bg-linear-to-br shadow-lg">
        <div className="pointer-events-none absolute -inset-e-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="bg-brand-2/30 pointer-events-none absolute -inset-s-16 -bottom-28 size-80 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <Avatar className="ring-background/40 size-24 rounded-2xl border-4 border-white/25 shadow-xl backdrop-blur">
            <AvatarImage
              src={user.profileImageUrl}
              alt={fullName(user.name, user.lastname)}
              className="object-cover"
            />
            <AvatarFallback className="from-primary/20 to-brand-2/20 rounded-2xl text-2xl font-semibold">
              {initials(user.name, user.lastname)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide text-white/70 uppercase">
              {user.role}
            </p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white">
              {fullName(user.name, user.lastname)}
            </h2>
            <p className="mt-0.5 line-clamp-1 text-sm text-white/80">
              {user.profession}
              {user.entreprise ? ` · ${user.entreprise}` : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.map((m, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur"
                >
                  {m.icon}
                  <span className="max-w-xs truncate">{m.value}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {user.aboutme && (
        <Card className="overflow-hidden rounded-2xl pt-0 shadow-sm">
          <CardHeader className="bg-muted/25 border-b pt-(--card-spacing)">
            <div className="flex items-center gap-3">
              <span className="from-primary/15 to-brand-2/15 text-primary flex size-9 items-center justify-center rounded-xl bg-linear-to-br ring-1 ring-black/5">
                <Sparkles className="size-4.5" />
              </span>
              <CardTitle className="text-base">
                {dict.profile.candidateProfile.about}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {user.aboutme}
            </p>
          </CardContent>
        </Card>
      )}

      {(user.profession ||
        user.posteActuel ||
        user.entreprise ||
        user.niveauExperience) && (
        <Card className="overflow-hidden rounded-2xl pt-0 shadow-sm">
          <CardHeader className="bg-muted/25 border-b pt-(--card-spacing)">
            <div className="flex items-center gap-3">
              <span className="from-primary/15 to-brand-2/15 text-primary flex size-9 items-center justify-center rounded-xl bg-linear-to-br ring-1 ring-black/5">
                <Briefcase className="size-4.5" />
              </span>
              <CardTitle className="text-base">
                {dict.profile.candidateProfile.professionalInfo}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {user.profession && (
                <div>
                  <p className="text-muted-foreground text-xs">
                    {dict.profile.fields.profession}
                  </p>
                  <p className="text-sm font-medium">{user.profession}</p>
                </div>
              )}
              {user.posteActuel && (
                <div>
                  <p className="text-muted-foreground text-xs">
                    {dict.profile.fields.posteActuel}
                  </p>
                  <p className="text-sm font-medium">{user.posteActuel}</p>
                </div>
              )}
              {user.entreprise && (
                <div>
                  <p className="text-muted-foreground text-xs">
                    {dict.profile.fields.entreprise}
                  </p>
                  <p className="text-sm font-medium">{user.entreprise}</p>
                </div>
              )}
              {user.niveauExperience && (
                <div>
                  <p className="text-muted-foreground text-xs">
                    {dict.profile.fields.niveauExperience}
                  </p>
                  <p className="text-sm font-medium">{user.niveauExperience}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(user.linkedinUrl || user.githubUrl || user.cvUrl) && (
        <Card className="overflow-hidden rounded-2xl pt-0 shadow-sm">
          <CardHeader className="bg-muted/25 border-b pt-(--card-spacing)">
            <div className="flex items-center gap-3">
              <span className="from-primary/15 to-brand-2/15 text-primary flex size-9 items-center justify-center rounded-xl bg-linear-to-br ring-1 ring-black/5">
                <LinkIcon className="size-4.5" />
              </span>
              <CardTitle className="text-base">
                {dict.profile.candidateProfile.links}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex flex-wrap gap-2">
              {user.linkedinUrl && (
                <NextLink
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Globe className="size-3.5" />
                    LinkedIn
                    <ExternalLink className="size-3" />
                  </Button>
                </NextLink>
              )}
              {user.githubUrl && (
                <NextLink
                  href={user.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <LinkIcon className="size-3.5" />
                    GitHub
                    <ExternalLink className="size-3" />
                  </Button>
                </NextLink>
              )}
              {user.cvUrl && (
                <NextLink
                  href={user.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <FileText className="size-3.5" />
                    {dict.profile.candidateProfile.cv}
                    <ExternalLink className="size-3" />
                  </Button>
                </NextLink>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {userApps.length > 0 && (
        <Card className="rounded-2xl pt-0 shadow-sm">
          <CardHeader className="bg-muted/25 border-b pt-(--card-spacing)">
            <div className="flex items-center gap-3">
              <span className="from-primary/15 to-brand-2/15 text-primary flex size-9 items-center justify-center rounded-xl bg-linear-to-br ring-1 ring-black/5">
                <GraduationCap className="size-4.5" />
              </span>
              <CardTitle className="text-base">
                {dict.profile.candidateProfile.applications}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-5">
            {userApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                candidateName={fullName(user.name, user.lastname)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
