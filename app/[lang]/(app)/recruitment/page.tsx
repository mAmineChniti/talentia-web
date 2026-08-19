'use client';

import * as React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  Briefcase,
  Plus,
  Star,
  Video,
  MapPin,
  MessageSquareText,
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
import { formatDate, formatDateTime } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
                : 'text-muted-foreground/40 size-3.5'
            }
          />
        );
      })}
    </div>
  );
}

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
        title={t.title}
        description={t.description}
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
          icon={<MessageSquareText className="size-5" />}
          accent="success"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as 'applications' | 'interviews')}
      >
        <TabsList>
          <TabsTrigger value="applications">{t.applicationsTab}</TabsTrigger>
          <TabsTrigger value="interviews">{t.interviewsTab}</TabsTrigger>
        </TabsList>
      </Tabs>

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
            return <Skeleton key={i} className="h-72 w-full" />;
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
    <Card className="flex flex-col rounded-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              {app.candidateName}
            </CardTitle>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {app.candidateEmail}
            </p>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-lg font-semibold">{app.score}%</span>
          <Stars value={app.stars} />
          <span className="text-muted-foreground ml-auto text-xs">
            {formatDate(app.datePostulation)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm">
        {app.strengths && (
          <div className="border-chart-2/20 bg-chart-2/5 rounded-lg border p-3">
            <p className="text-chart-2 mb-1 text-xs font-semibold tracking-wide uppercase">
              {t.strengths}
            </p>
            <p className="text-muted-foreground text-xs">{app.strengths}</p>
          </div>
        )}
        {app.weaknesses && (
          <div className="border-chart-3/20 bg-chart-3/5 rounded-lg border p-3">
            <p className="text-chart-3 mb-1 text-xs font-semibold tracking-wide uppercase">
              {t.weaknesses}
            </p>
            <p className="text-muted-foreground text-xs">{app.weaknesses}</p>
          </div>
        )}
        {app.feedback && (
          <p className="bg-muted/60 text-muted-foreground rounded-lg p-3 text-xs">
            <span className="text-foreground font-medium">{t.aiAnalysis}</span>
            {app.feedback}
          </p>
        )}
        {app.recommendation && (
          <p className="text-xs font-medium">
            {`${t.recommendation} ${
              app.recommendation
                ? (recommendationLabels[app.recommendation] ??
                  app.recommendation)
                : '—'
            }`}
          </p>
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
        <Card className="rounded-lg py-0">
          <CardContent className="py-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.candidate}</TableHead>
                    <TableHead>{t.dateAndTime}</TableHead>
                    <TableHead>{t.type}</TableHead>
                    <TableHead>{t.location}</TableHead>
                    <TableHead>{t.status}</TableHead>
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
                      return (
                        <TableRow key={interview.id}>
                          <TableCell className="text-sm font-medium">
                            {app?.candidateName ??
                              `Candidature #${interview.applicationId}`}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(interview.interviewDate)}
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
                                className="text-primary inline-flex items-center gap-1.5 hover:underline"
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
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function ScheduleInterviewDialog({
  applications,
  disabled,
}: {
  applications: ApplicationResponse[];
  disabled: boolean;
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
      <DialogTrigger render={<Button disabled={disabled} />}>
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
