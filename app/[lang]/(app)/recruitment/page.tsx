'use client';

import * as React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  Briefcase,
  CalendarClock,
  CircleCheck,
  CircleX,
  MapPin,
  Plus,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { createInterviewSchema } from '@/lib/schemas/interviews';
import { applicationsApi } from '@/lib/services/applications';
import { interviewsApi } from '@/lib/services/interviews';
import type { ApplicationResponse } from '@/lib/types/applications';
import type {
  InterviewRequest,
  InterviewResponse,
} from '@/lib/types/interviews';
import { formatDate, formatDateTime, initials } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DateTimePicker } from '@/components/ui/date-picker';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type InterviewFormValues = z.infer<ReturnType<typeof createInterviewSchema>>;

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className ?? ''}`}>
      {Array.from({ length: 5 }, (_, i) => {
        return (
          <Star
            key={i}
            className={
              i < Math.round(value)
                ? 'fill-chart-3 text-chart-3 size-3.5'
                : 'text-muted-foreground/30 size-3.5'
            }
          />
        );
      })}
    </div>
  );
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;
  const color =
    clamped >= 70
      ? 'var(--color-chart-2)'
      : clamped >= 40
        ? 'var(--color-chart-3)'
        : 'var(--color-chart-5)';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-heading text-sm font-semibold tabular-nums"
          style={{ color }}
        >
          {clamped}%
        </span>
      </div>
    </div>
  );
}

const recommendationTone: Record<string, string> = {
  ACCEPTER: 'bg-chart-2/10 text-chart-2 ring-chart-2/25',
  ENTRETIEN: 'bg-info/10 text-info ring-info/25',
  REFUSER: 'bg-destructive/10 text-destructive ring-destructive/25',
};

export default function RecruitmentPage() {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const [tab, setTab] = React.useState<'applications' | 'interviews'>(
    'applications'
  );

  const applications = useApi('applications.list', () =>
    applicationsApi.list()
  );
  const interviews = useApi('interviews.list', () => interviewsApi.list());

  const avgScore = React.useMemo(() => {
    const list = applications.data ?? [];
    if (list.length === 0) return 0;
    return Math.round(list.reduce((s, a) => s + a.score, 0) / list.length);
  }, [applications.data]);

  const applicationMap = React.useMemo(() => {
    const m = new Map<number, ApplicationResponse>();
    if (applications.data != undefined) {
      for (const a of applications.data) m.set(a.id, a);
    }
    return m;
  }, [applications.data]);

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={t.aiAnalysis.replace(':', '')}
        title={t.title}
        description={t.description}
        icon={<Briefcase className="size-6" />}
        actions={
          tab === 'interviews' ? (
            <ScheduleInterviewDialog
              applications={applications.data ?? []}
              disabled={(applications.data?.length ?? 0) === 0}
            />
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.applications}
          value={applications.data?.length ?? 0}
          hint={t.applicationsHint}
          icon={<Briefcase className="size-5" />}
          accent="info"
        />
        <StatCard
          label={t.averageScore}
          value={`${avgScore}%`}
          hint={t.averageScoreHint}
          icon={<Star className="size-5" />}
          accent="warning"
        />
        <StatCard
          label={t.interviews}
          value={interviews.data?.length ?? 0}
          hint={t.interviewsHint}
          icon={<Video className="size-5" />}
          accent="success"
        />
        <StatCard
          label={t.recommended}
          value={(applications.data ?? []).filter((a) => a.score >= 70).length}
          hint={t.recommendedHint}
          icon={<ThumbsUp className="size-5" />}
          accent="success"
        />
      </div>

      <div className="flex items-center justify-between">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as 'applications' | 'interviews')}
        >
          <TabsList className="bg-muted/50">
            <TabsTrigger value="applications">
              {t.applicationsTab}
              <span className="bg-primary/10 text-primary ms-1.5 rounded-full px-1.5 text-[10px] font-semibold">
                {applications.data?.length ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="interviews">
              {t.interviewsTab}
              <span className="bg-chart-2/15 text-chart-2 ms-1.5 rounded-full px-1.5 text-[10px] font-semibold">
                {interviews.data?.length ?? 0}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === 'interviews' && (
          <ScheduleInterviewDialog
            applications={applications.data ?? []}
            disabled={(applications.data?.length ?? 0) === 0}
            className="hidden sm:inline-flex"
          />
        )}
      </div>

      {tab === 'applications' ? (
        <ApplicationsView applications={applications} />
      ) : (
        <InterviewsView
          interviews={interviews}
          applicationMap={applicationMap}
          applications={applications.data ?? []}
        />
      )}
    </div>
  );
}

function ApplicationsView({
  applications,
}: {
  applications: ReturnType<typeof useApi<ApplicationResponse[]>>;
}) {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const { data, loading, error, refetch } = applications;
  return (
    <>
      {error ? (
        <ErrorState onRetry={refetch} description={error.message} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => {
            return <Skeleton key={i} className="h-80 w-full" />;
          })}
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={<Briefcase className="size-6" />}
          title={t.noApplications}
          description={t.noApplicationsDesc}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(data ?? []).map((app) => {
            return <ApplicationCard key={app.id} app={app} />;
          })}
        </div>
      )}
    </>
  );
}

function ApplicationCard({ app }: { app: ApplicationResponse }) {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const recommendationLabels: Record<string, string> = {
    ACCEPTER: t.accept,
    ENTRETIEN: t.interview,
    REFUSER: t.refuse,
  };
  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="bg-muted/25 border-b pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="from-primary/20 to-brand-2/20 ring-primary/15 size-11 rounded-xl bg-linear-to-br ring-1">
              <AvatarFallback className="rounded-xl">
                {initials(...app.candidateName.split(' '))}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate text-[15px]">
                {app.candidateName}
              </CardTitle>
              <p className="text-muted-foreground truncate text-xs">
                {app.candidateEmail}
              </p>
            </div>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <ScoreRing score={app.score} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Stars value={app.stars} />
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <CalendarClock className="size-3.5" />
              {formatDate(app.datePostulation)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 p-4 text-sm">
        {app.strengths && (
          <div className="border-chart-2/20 bg-chart-2/5 rounded-xl border p-3">
            <p className="text-chart-2 mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
              <CircleCheck className="size-3.5" /> {t.strengths}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {app.strengths}
            </p>
          </div>
        )}
        {app.weaknesses && (
          <div className="border-chart-3/20 bg-chart-3/5 rounded-xl border p-3">
            <p className="text-chart-3 mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
              <CircleX className="size-3.5" /> {t.weaknesses}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {app.weaknesses}
            </p>
          </div>
        )}
        {app.feedback && (
          <div className="bg-primary/5 ring-primary/10 rounded-xl p-3 ring-1 ring-inset">
            <p className="text-primary mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
              <Sparkles className="size-3.5" /> {t.aiAnalysis}
            </p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {app.feedback}
            </p>
          </div>
        )}
        {app.recommendation && (
          <div className="mt-auto flex items-center gap-2 pt-1">
            <span className="text-muted-foreground text-xs">
              {t.recommendation}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                recommendationTone[app.recommendation] ??
                  'bg-muted text-muted-foreground'
              )}
            >
              {app.recommendation
                ? (recommendationLabels[app.recommendation] ??
                  app.recommendation)
                : '—'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InterviewsView({
  interviews,
  applicationMap,
  applications,
}: {
  interviews: ReturnType<typeof useApi<InterviewResponse[]>>;
  applicationMap: Map<number, ApplicationResponse>;
  applications: ApplicationResponse[];
}) {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const { data, loading, error, refetch } = interviews;

  return (
    <>
      {error ? (
        <ErrorState onRetry={refetch} description={error.message} />
      ) : loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => {
            return <Skeleton key={i} className="h-12 w-full" />;
          })}
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={<Video className="size-6" />}
          title={t.noInterviews}
          description={t.noInterviewsDesc}
          action={
            <ScheduleInterviewDialog
              applications={applications}
              disabled={applications.length === 0}
            />
          }
        />
      ) : (
        <Card className="overflow-hidden rounded-2xl shadow-sm">
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.candidate}</TableHead>
                  <TableHead>{t.dateAndTime}</TableHead>
                  <TableHead>{t.type}</TableHead>
                  <TableHead>{t.location}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...(data ?? [])]
                  .toSorted((a, b) => {
                    return (b.interviewDate ?? '').localeCompare(
                      a.interviewDate ?? ''
                    );
                  })
                  .map((interview) => {
                    const app = applicationMap.get(interview.applicationId);
                    const name =
                      app?.candidateName ??
                      t.candidateName
                        .split('{id}')
                        .join(String(interview.applicationId));
                    return (
                      <TableRow key={interview.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="from-primary/15 to-brand-2/15 size-9 rounded-lg bg-linear-to-br ring-1 ring-black/5">
                              <AvatarFallback className="rounded-lg text-[11px] font-semibold">
                                {initials(...name.split(' '))}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {name}
                              </p>
                              {app && (
                                <p className="text-muted-foreground truncate text-xs">
                                  {app.candidateEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="bg-muted/60 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium tabular-nums">
                            <CalendarClock className="text-muted-foreground size-3.5" />
                            {formatDateTime(interview.interviewDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={interview.type} />
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[220px] truncate">
                          {interview.type === 'ONLINE' &&
                          interview.meetingLink ? (
                            <a
                              href={interview.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:bg-primary/10 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:underline"
                            >
                              <Video className="size-3.5" /> {t.meetingLink}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="size-3.5" />{' '}
                              {interview.location || '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={interview.status} />
                        </TableCell>
                        <TableCell className="text-end">
                          <InterviewDeleteButton
                            interview={interview}
                            onDeleted={refetch}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground text-xs"
                  >
                    {t.interviewsHint}: {data?.length ?? 0}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function InterviewDeleteButton({
  interview,
  onDeleted,
}: {
  interview: InterviewResponse;
  onDeleted: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const [open, setOpen] = React.useState(false);

  const deleteMutation = useApiMutation<number, string>(
    (id) => interviewsApi.remove(id),
    {
      invalidate: ['interviews.list'],
      onSuccess: () => {
        toast.success(t.successDeleted);
        onDeleted();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={t.delete} />}
      >
        <Trash2 className="text-muted-foreground hover:text-destructive size-4" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteInterviewTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.deleteInterviewDesc}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={() => deleteMutation.mutate(interview.id)}
            disabled={deleteMutation.isPending}
          >
            {t.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ScheduleInterviewDialog({
  applications,
  disabled,
  className,
}: {
  applications: ApplicationResponse[];
  disabled: boolean;
  className?: string;
}) {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const [open, setOpen] = React.useState(false);
  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(createInterviewSchema(dict.validation)),
    defaultValues: {
      applicationId: 0,
      interviewDate: '',
      type: 'ONLINE',
      location: '',
    },
  });
  const watchType = useWatch({ control: form.control, name: 'type' });

  const createMutation = useApiMutation<InterviewFormValues, InterviewResponse>(
    (body) => {
      const payload: InterviewRequest = {
        applicationId: body.applicationId,
        interviewDate: body.interviewDate,
        type: body.type,
        ...(body.type === 'ONSITE' && { location: body.location }),
      };
      return interviewsApi.create(payload);
    },
    {
      invalidate: ['interviews.list', 'dashboard.get'],
      onSuccess: () => {
        toast.success(t.successScheduled);
        setOpen(false);
        form.reset();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) form.reset();
      }}
    >
      <DialogTrigger
        render={<Button disabled={disabled} className={className} />}
      >
        <Plus /> {t.scheduleInterview}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.scheduleDialogTitle}</DialogTitle>
          <DialogDescription>{t.scheduleDialogDesc}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate(values)
          )}
          className="grid gap-4 py-1"
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="applicationId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="interview-application">
                    {t.candidate}
                  </FieldLabel>
                  <Select
                    name={field.name}
                    value={String(field.value || '')}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger
                      id="interview-application"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder={t.selectCandidate} />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {`${a.candidateName} (${a.score}%)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="type"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="interview-type">
                      {t.typeLabel}
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="interview-type"
                        aria-invalid={fieldState.invalid}
                      >
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
                control={form.control}
                name="interviewDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="interview-date">
                      {t.dateLabel}
                    </FieldLabel>
                    <DateTimePicker
                      id="interview-date"
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

            {watchType === 'ONSITE' && (
              <Controller
                control={form.control}
                name="location"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="interview-location">
                      {t.locationLabel}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="interview-location"
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

            {watchType === 'ONLINE' && (
              <p className="bg-muted/60 text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
                <Video className="size-3.5" />
                {t.autoMeetingLink}
              </p>
            )}
          </FieldGroup>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t.scheduling : t.schedule}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
