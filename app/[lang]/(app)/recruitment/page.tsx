'use client';

import * as React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  Briefcase,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  CircleX,
  MapPin,
  Plus,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { createInterviewSchema } from '@/lib/schemas/interviews';
import { applicationsApi } from '@/lib/services/applications';
import { interviewsApi } from '@/lib/services/interviews';
import { postsApi } from '@/lib/services/posts';
import type { ApplicationResponse } from '@/lib/types/applications';
import type { PostResponse } from '@/lib/types/posts';
import type {
  InterviewRequest,
  InterviewResponse,
} from '@/lib/types/interviews';
import {
  formatDate,
  formatDateTime,
  fullName,
  initials,
  parseList,
} from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  const posts = useApi('posts.list', () => postsApi.list());

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
              posts={posts.data ?? []}
              disabled={
                (posts.data?.filter((p) => p.typePost === 'POSTE_TRAVAIL')
                  .length ?? 0) === 0
              }
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
                {
                  (posts.data ?? []).filter(
                    (p) => p.typePost === 'POSTE_TRAVAIL'
                  ).length
                }
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
      </div>

      {tab === 'applications' ? (
        <ApplicationsView
          posts={posts.data ?? []}
          applications={applications.data ?? []}
        />
      ) : (
        <InterviewsView
          interviews={interviews}
          applicationMap={applicationMap}
          posts={posts.data ?? []}
        />
      )}
    </div>
  );
}

function ApplicationsView({
  posts,
  applications,
}: {
  posts: PostResponse[];
  applications: ApplicationResponse[];
}) {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const [expandedPostId, setExpandedPostId] = React.useState<
    number | undefined
  >(undefined);
  const [selectedApp, setSelectedApp] = React.useState<
    ApplicationResponse | undefined
  >(undefined);
  const [scheduleAppId, setScheduleAppId] = React.useState<number | undefined>(
    undefined
  );

  const jobPosts = React.useMemo(
    () => posts.filter((p) => p.typePost === 'POSTE_TRAVAIL'),
    [posts]
  );

  const applicationsByPost = React.useMemo(() => {
    const map = new Map<number, ApplicationResponse[]>();
    for (const app of applications) {
      const list = map.get(app.postId) ?? [];
      list.push(app);
      map.set(app.postId, list);
    }
    return map;
  }, [applications]);

  if (jobPosts.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="size-6" />}
        title={t.noApplications}
        description={t.noApplicationsDesc}
      />
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {jobPosts.map((post) => {
          const postApps = applicationsByPost.get(post.id) ?? [];
          const isExpanded = expandedPostId === post.id;
          return (
            <Card
              key={post.id}
              className="overflow-hidden rounded-2xl shadow-sm"
            >
              <CardHeader className="gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug font-semibold">
                      {fullName(post.auteurName, post.auteurLastname)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(post.dateCreation)}
                    </p>
                    <p className="text-foreground/80 mt-1 text-[15px] leading-snug">
                      {post.contenu.length > 150
                        ? post.contenu.slice(0, 150) + '…'
                        : post.contenu}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() =>
                      setExpandedPostId(isExpanded ? undefined : post.id)
                    }
                  >
                    <Users className="size-3.5" />
                    {postApps.length} {t.candidate.toLowerCase()}(s)
                    {isExpanded ? (
                      <ChevronUp className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="border-t p-4">
                  {postApps.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-xs">
                      {t.noApplicationsDesc}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {postApps.map((app) => (
                        <Button
                          key={app.id}
                          variant="ghost"
                          className="bg-muted/40 hover:bg-muted/70 flex h-auto w-full cursor-pointer items-center justify-start gap-3 rounded-xl p-3 text-left"
                          onClick={() => setSelectedApp(app)}
                        >
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                              {initials(
                                app.candidateName.split(' ', 1)[0],
                                app.candidateName.split(' ', 2)[1]
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {app.candidateName}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {app.candidateEmail}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <ScoreRing score={app.score} size={40} />
                            <StatusBadge status={app.status} />
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {selectedApp && (
        <ApplicationDetailDialog
          app={selectedApp}
          onClose={() => setSelectedApp(undefined)}
          onSchedule={(appId) => {
            setSelectedApp(undefined);
            setScheduleAppId(appId);
          }}
        />
      )}

      {scheduleAppId && (
        <ScheduleInterviewSimple
          applicationId={scheduleAppId}
          onClose={() => setScheduleAppId(undefined)}
        />
      )}
    </>
  );
}

function ApplicationDetailDialog({
  app,
  onClose,
  onSchedule,
}: {
  app: ApplicationResponse;
  onClose: () => void;
  onSchedule?: (appId: number) => void;
}) {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const recommendationLabels: Record<string, string> = {
    ACCEPTER: t.accept,
    ENTRETIEN: t.interview,
    REFUSER: t.refuse,
  };

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="from-primary/20 to-brand-2/20 ring-primary/15 size-10 rounded-xl bg-linear-to-br ring-1">
              <AvatarFallback className="rounded-xl text-sm">
                {initials(
                  app.candidateName.split(' ', 1)[0],
                  app.candidateName.split(' ', 2)[1]
                )}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link
                href={`/candidates/${app.userId}`}
                className="truncate text-[15px] font-semibold hover:underline"
                target="_blank"
              >
                {app.candidateName}
              </Link>
              <p className="text-muted-foreground truncate text-xs">
                {app.candidateEmail}
              </p>
            </div>
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex items-center gap-4">
            <ScoreRing score={app.score} />
            <div>
              <div className="flex items-center gap-1.5">
                <Stars value={app.stars} />
              </div>
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                <CalendarClock className="size-3.5" />
                {formatDate(app.datePostulation)}
              </p>
            </div>
            <div className="ms-auto">
              <StatusBadge status={app.status} />
            </div>
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
              <p className="text-muted-foreground text-xs leading-relaxed">
                {app.feedback}
              </p>
            </div>
          )}

          {app.recommendation && (
            <div className="flex items-center gap-2 pt-1">
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
                {recommendationLabels[app.recommendation] ?? app.recommendation}
              </span>
            </div>
          )}

          {(app.status === 'PENDING' || app.status === 'HR_INTERVIEW') && (
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSchedule?.(app.id)}
              >
                <CalendarClock className="size-3.5" /> {t.scheduleInterview}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleInterviewSimple({
  applicationId,
  onClose,
}: {
  applicationId: number;
  onClose: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const form = useForm<InterviewFormValues>({
    resolver: zodResolver(createInterviewSchema(dict.validation)),
    defaultValues: {
      applicationId,
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
        onClose();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
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
                control={form.control}
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

            {watchType === 'ONSITE' && (
              <Controller
                control={form.control}
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

function InterviewsView({
  interviews,
  applicationMap,
  posts,
}: {
  interviews: ReturnType<typeof useApi<InterviewResponse[]>>;
  applicationMap: Map<number, ApplicationResponse>;
  posts: PostResponse[];
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
              posts={posts}
              disabled={
                (posts.filter((p) => p.typePost === 'POSTE_TRAVAIL').length ??
                  0) === 0
              }
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
                        <TableCell className="text-muted-foreground max-w-55 truncate">
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
  posts,
  disabled,
  className,
}: {
  posts: PostResponse[];
  disabled: boolean;
  className?: string;
}) {
  const { dict } = useI18n();
  const t = dict.recruitment;
  const [open, setOpen] = React.useState(false);

  const jobPosts = React.useMemo(
    () => posts.filter((p) => p.typePost === 'POSTE_TRAVAIL'),
    [posts]
  );

  const [step, setStep] = React.useState<'post' | 'applicant' | 'schedule'>(
    'post'
  );
  const [selectedPost, setSelectedPost] = React.useState<
    PostResponse | undefined
  >(undefined);
  const [selectedApp, setSelectedApp] = React.useState<
    ApplicationResponse | undefined
  >(undefined);

  const applicants = useApi(
    ['applications.post', String(selectedPost?.id ?? '')],
    () =>
      selectedPost
        ? applicationsApi.getByPostId(selectedPost.id)
        : Promise.resolve([]),
    { enabled: !!selectedPost }
  );

  const eligibleApplicants = React.useMemo(() => {
    return (applicants.data ?? []).filter(
      (a) => a.status === 'PENDING' || a.status === 'HR_INTERVIEW'
    );
  }, [applicants.data]);

  const reset = () => {
    setStep('post');
    setSelectedPost(undefined);
    setSelectedApp(undefined);
  };

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
        reset();
        form.reset();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  const stepIndicator = (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full font-semibold',
          step === 'post'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        1
      </span>
      <span
        className={cn(
          'h-px w-4',
          step === 'applicant' || step === 'schedule'
            ? 'bg-primary'
            : 'bg-muted'
        )}
      />
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full font-semibold',
          step === 'applicant' || step === 'schedule'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        2
      </span>
      <span
        className={cn(
          'h-px w-4',
          step === 'schedule' ? 'bg-primary' : 'bg-muted'
        )}
      />
      <span
        className={cn(
          'flex size-6 items-center justify-center rounded-full font-semibold',
          step === 'schedule'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        3
      </span>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
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
          <DialogDescription>
            {step === 'post' && t.step1Desc}
            {step === 'applicant' && t.step2Desc}
            {step === 'schedule' && t.step3Desc}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-1">{stepIndicator}</div>

        {step === 'post' && (
          <div className="grid max-h-80 gap-2 overflow-y-auto py-2">
            {jobPosts.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {t.noJobPostings}
              </p>
            ) : (
              jobPosts.map((post) => (
                <Button
                  key={post.id}
                  variant="ghost"
                  className="h-auto justify-start gap-3 rounded-xl p-3 text-left"
                  onClick={() => {
                    setSelectedPost(post);
                    setStep('applicant');
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {post.contenu.length > 100
                        ? post.contenu.slice(0, 100) + '…'
                        : post.contenu}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {fullName(post.auteurName, post.auteurLastname)} ·{' '}
                      {formatDateTime(post.dateCreation)}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Button>
              ))
            )}
          </div>
        )}

        {step === 'applicant' && (
          <div className="grid max-h-80 gap-2 overflow-y-auto py-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground mb-1 w-fit gap-1.5"
              onClick={() => setStep('post')}
            >
              <ChevronLeft className="size-3.5" /> {t.back}
            </Button>
            {applicants.loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : eligibleApplicants.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {t.noApplicantsForPost}
              </p>
            ) : (
              eligibleApplicants.map((app) => (
                <Button
                  key={app.id}
                  variant="ghost"
                  className="h-auto justify-start gap-3 rounded-xl p-3 text-left"
                  onClick={() => {
                    setSelectedApp(app);
                    form.setValue('applicationId', app.id);
                    setStep('schedule');
                  }}
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {initials(
                        app.candidateName.split(' ', 1)[0],
                        app.candidateName.split(' ', 2)[1]
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {app.candidateName}
                    </p>
                    <div className="flex items-center gap-2">
                      <Stars value={app.stars} />
                      <span className="text-muted-foreground text-xs">
                        {app.score}%
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Button>
              ))
            )}
          </div>
        )}

        {step === 'schedule' && selectedApp && (
          <form
            onSubmit={form.handleSubmit((values) =>
              createMutation.mutate(values)
            )}
            className="grid gap-4 py-1"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground w-fit gap-1.5"
              onClick={() => setStep('applicant')}
            >
              <ChevronLeft className="size-3.5" /> {t.back}
            </Button>

            <div className="bg-muted/40 flex items-center gap-3 rounded-xl p-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                  {initials(
                    selectedApp.candidateName.split(' ', 1)[0],
                    selectedApp.candidateName.split(' ', 2)[1]
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {selectedApp.candidateName}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {selectedApp.candidateEmail}
                </p>
              </div>
              <StatusBadge status={selectedApp.status} />
            </div>

            <FieldGroup>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
