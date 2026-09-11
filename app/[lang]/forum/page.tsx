'use client';

import * as React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleX,
  GraduationCap,
  Heart,
  MapPin,
  MessagesSquare,
  Plus,
  Send,
  Sparkles,
  Star,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';

import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { hasMinimumRole } from '@/lib/rbac';
import { applicationsApi } from '@/lib/services/applications';
import { commentairesApi, postsApi } from '@/lib/services/posts';
import { trainingsApi } from '@/lib/services/trainings';
import { employeesApi } from '@/lib/services/employees';
import { interviewsApi } from '@/lib/services/interviews';
import { usersApi } from '@/lib/services/users';
import type { InterviewResponse } from '@/lib/types/interviews';
import { createInterviewSchema } from '@/lib/schemas/interviews';
import type { PostResponse, TypePost } from '@/lib/types/posts';
import type { ApplicationResponse } from '@/lib/types/applications';
import type { User } from '@/lib/types/users';
import { FileDrop } from '@/components/file-drop';
import {
  formatDateTime,
  formatDate,
  fullName,
  initials,
  parseList,
} from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState } from '@/components/states';
import { StatusBadge } from '@/components/status-badge';
import { DateTimePicker, DatePicker } from '@/components/ui/date-picker';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const POSTS_PER_PAGE = 5;

type InterviewFormValues = z.infer<ReturnType<typeof createInterviewSchema>>;

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className ?? ''}`}>
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
          background={{ className: 'fill-muted' }}
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

const typeStyles: Record<TypePost, string> = {
  PUBLICITE: 'bg-chart-4/15 text-chart-4 ring-chart-4/20',
  POSTE_TRAVAIL: 'bg-chart-2/15 text-chart-2 ring-chart-2/20',
  FORMATION: 'bg-chart-3/15 text-chart-3 ring-chart-3/20',
};

export default function ForumPage() {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession({ redirectToLoginOnMissing: false });
  const [visibleCount, setVisibleCount] = React.useState(POSTS_PER_PAGE);
  const [activeFilter, setActiveFilter] = React.useState<TypePost | 'ALL'>(
    'ALL'
  );
  const [dateFilter, setDateFilter] = React.useState<
    'ALL' | 'TODAY' | 'WEEK' | 'MONTH'
  >('ALL');
  const {
    data: posts,
    loading,
    error,
    refetch,
  } = useApi('posts.list', () => postsApi.list());

  const { data: users } = useApi('users.list', () => usersApi.list());
  const userMap = React.useMemo(() => {
    const m = new Map<number, User>();
    if (users) {
      for (const u of users) m.set(u.id, u);
    }
    return m;
  }, [users]);

  const { data: allApplications } = useApi(
    'applications.list',
    () => applicationsApi.list(),
    { enabled: !!user }
  );
  const appliedPostIds = React.useMemo(
    () =>
      new Set(
        (allApplications ?? [])
          .filter((a) => a.candidateEmail === user?.email)
          .map((a) => a.postId)
      ),
    [allApplications, user?.email]
  );

  const sortedPosts = React.useMemo(() => {
    const list = posts ?? [];
    return list.toSorted((a, b) => {
      const aDate = new Date(a.dateCreation);
      const bDate = new Date(b.dateCreation);
      return bDate.getTime() - aDate.getTime();
    });
  }, [posts]);

  const filteredPosts = React.useMemo(() => {
    let result = sortedPosts;

    result =
      activeFilter === 'ALL'
        ? [
            ...result.filter((p) => p.typePost === 'POSTE_TRAVAIL'),
            ...result.filter((p) => p.typePost !== 'POSTE_TRAVAIL'),
          ]
        : result.filter((p) => p.typePost === activeFilter);

    if (dateFilter !== 'ALL') {
      const now = new Date();
      let cutoff: Date;
      if (dateFilter === 'TODAY') {
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'WEEK') {
        cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - 7);
      } else {
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      result = result.filter((p) => new Date(p.dateCreation) >= cutoff);
    }

    return result;
  }, [sortedPosts, activeFilter, dateFilter]);

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={t.community}
        title={t.title}
        description={t.description}
        icon={<MessagesSquare className="size-6" />}
        actions={user ? <NewPostDialog onCreated={refetch} /> : undefined}
      />

      {error ? (
        <ErrorState onRetry={refetch} description={error.message} />
      ) : loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }, (_, i) => {
            return <Skeleton key={i} className="h-48 w-full" />;
          })}
        </div>
      ) : (posts ?? []).length === 0 ? (
        <EmptyState
          icon={<MessagesSquare className="size-6" />}
          title={t.emptyTitle}
          description={t.emptyDesc}
          action={user ? <NewPostDialog onCreated={refetch} /> : undefined}
        />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Select
              value={activeFilter}
              onValueChange={(v) => {
                setActiveFilter(v as TypePost | 'ALL');
                setVisibleCount(POSTS_PER_PAGE);
              }}
              items={[
                { value: 'ALL', label: t.filterAll },
                { value: 'POSTE_TRAVAIL', label: t.filterJobOpenings },
                { value: 'PUBLICITE', label: t.filterAnnouncements },
                { value: 'FORMATION', label: t.filterTrainings },
              ]}
            >
              <SelectTrigger className="h-10 w-55">
                <SelectValue placeholder={t.filterAll} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t.filterAll}</SelectItem>
                <SelectItem value="POSTE_TRAVAIL">
                  {t.filterJobOpenings}
                </SelectItem>
                <SelectItem value="PUBLICITE">
                  {t.filterAnnouncements}
                </SelectItem>
                <SelectItem value="FORMATION">{t.filterTrainings}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={dateFilter}
              onValueChange={(v) => {
                setDateFilter(v as 'ALL' | 'TODAY' | 'WEEK' | 'MONTH');
                setVisibleCount(POSTS_PER_PAGE);
              }}
              items={[
                { value: 'ALL', label: t.filterAllDates },
                { value: 'TODAY', label: t.filterToday },
                { value: 'WEEK', label: t.filterThisWeek },
                { value: 'MONTH', label: t.filterThisMonth },
              ]}
            >
              <SelectTrigger className="h-10 w-40">
                <SelectValue placeholder={t.filterAllDates} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t.filterAllDates}</SelectItem>
                <SelectItem value="TODAY">{t.filterToday}</SelectItem>
                <SelectItem value="WEEK">{t.filterThisWeek}</SelectItem>
                <SelectItem value="MONTH">{t.filterThisMonth}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4">
            {filteredPosts.slice(0, visibleCount).map((post) => (
              <PostCard
                key={post.id}
                post={post}
                applied={appliedPostIds.has(post.id)}
                onChanged={refetch}
                userMap={userMap}
              />
            ))}
            {filteredPosts.length > visibleCount && (
              <Button
                variant="outline"
                className="mx-auto rounded-full px-6"
                onClick={() =>
                  setVisibleCount((count) => count + POSTS_PER_PAGE)
                }
              >
                {t.loadMore} ({filteredPosts.length - visibleCount})
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PostCard({
  post,
  applied,
  onChanged,
  userMap,
}: {
  post: PostResponse;
  applied: boolean;
  onChanged: () => void;
  userMap: Map<number, User>;
}) {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession({ redirectToLoginOnMissing: false });
  const canModerate = hasMinimumRole(user?.role, 'HR');
  const canDelete = canModerate || post.auteurId === user?.id;
  const [showComments, setShowComments] = React.useState(true);
  const [showApplicants, setShowApplicants] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(post.nombreLikes);
  const [liked, setLiked] = React.useState(post.likedByCurrentUser);

  const authorName = fullName(post.auteurName, post.auteurLastname);
  const authorUser = userMap.get(post.auteurId);

  const likeMutation = useApiMutation<number, PostResponse>(
    (postId) => postsApi.like(postId, user?.id ?? 0),
    {
      onError: (err) => toast.add({ type: 'error', description: err.message }),
      onSuccess: (data) => {
        setLikeCount(data.nombreLikes);
        setLiked(data.likedByCurrentUser);
      },
    }
  );

  const deleteMutation = useApiMutation<number, string>(
    (id) => postsApi.remove(id),
    {
      invalidate: ['posts.list'],
      onSuccess: () => {
        toast.add({ type: 'success', description: t.successDeleted });
        onChanged();
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  return (
    <Card className="overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-lg">
      <CardHeader className="gap-4 p-6 pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="ring-background size-12 ring-2">
            <AvatarImage src={authorUser?.profileImageUrl} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {authorName.replace('—', '').trim().charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <p className="text-base font-semibold">{authorName}</p>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-medium ring-1',
                  typeStyles[post.typePost]
                )}
              >
                {t.types[post.typePost]}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {formatDateTime(post.dateCreation)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4">
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {post.contenu}
        </p>
        {post.typePost === 'FORMATION' && post.trainingId && (
          <div className="bg-muted/40 mt-4 space-y-2 rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="text-muted-foreground size-4" />
              <p className="text-sm font-semibold">{post.trainingTitle}</p>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {post.trainingTrainer && (
                <span>
                  {t.by} {post.trainingTrainer}
                </span>
              )}
              {post.trainingLocation && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {post.trainingLocation}
                </span>
              )}
              {post.trainingCapacity != undefined &&
                post.trainingEnrollmentCount != undefined && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3" /> {post.trainingEnrollmentCount}/
                    {post.trainingCapacity}
                  </span>
                )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/30 justify-center gap-2 border-t px-6 py-3">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'text-muted-foreground hover:text-primary gap-2',
            liked && 'text-primary'
          )}
          onClick={() => user && likeMutation.mutate(post.id)}
          disabled={!user || likeMutation.isPending}
        >
          {liked ? (
            <Heart className="size-4 fill-current" />
          ) : (
            <Heart className="size-4" />
          )}{' '}
          {likeCount} {t.likes}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-2"
          onClick={() => setShowComments((v) => !v)}
        >
          <MessagesSquare className="size-4" /> {t.comments}
        </Button>
        {canDelete && (
          <DeletePostDialog
            onConfirm={() => deleteMutation.mutate(post.id)}
            pending={deleteMutation.isPending}
          />
        )}
        {user &&
          !canModerate &&
          post.typePost === 'POSTE_TRAVAIL' &&
          post.auteurId !== user.id && (
            <ApplyDialog post={post} applied={applied} />
          )}
        {user &&
          !canModerate &&
          post.typePost === 'FORMATION' &&
          post.trainingId &&
          post.auteurId !== user.id && <TrainingApplyButton post={post} />}
        {canModerate && post.typePost === 'POSTE_TRAVAIL' && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-2"
            onClick={() => setShowApplicants((v) => !v)}
          >
            <Users className="size-4" />{' '}
            {showApplicants ? t.hideApplicants : t.viewApplicants}
            {showApplicants ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        )}
        {canModerate && post.typePost === 'FORMATION' && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-2"
            onClick={() => setShowApplicants((v) => !v)}
          >
            <Users className="size-4" />{' '}
            {showApplicants ? t.trainingHideManage : t.trainingManage}
            {showApplicants ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
        )}
      </CardFooter>

      {showApplicants && canModerate && post.typePost === 'POSTE_TRAVAIL' && (
        <div className="bg-muted/20 border-t px-6 py-4">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            {t.applicants}
          </p>
          <ApplicantsList postId={post.id} />
        </div>
      )}

      {showApplicants && canModerate && post.typePost === 'FORMATION' && (
        <div className="bg-muted/20 border-t px-6 py-4">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            {t.trainingEnrollments}
          </p>
          {post.trainingId ? (
            <TrainingEnrollmentsPanel trainingId={post.trainingId} />
          ) : (
            <p className="text-muted-foreground py-2 text-center text-xs">
              {t.noLinkedTraining}
            </p>
          )}
        </div>
      )}

      {showComments && (
        <div className="bg-muted/20 border-t px-6 py-4">
          <CommentsList postId={post.id} />
        </div>
      )}
    </Card>
  );
}

function ApplyDialog({
  post,
  applied,
  className,
}: {
  post: PostResponse;
  applied: boolean;
  className?: string;
}) {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession({ redirectToLoginOnMissing: false });
  const [open, setOpen] = React.useState(false);
  const [cv, setCv] = React.useState<File | undefined>(undefined);
  const [motivation, setMotivation] = React.useState('');
  const [error, setError] = React.useState<string | undefined>(undefined);

  const applyMutation = useApiMutation<
    {
      cv: File;
      motivationLetter: string;
      poste: string;
      userId: number;
      postId: number;
    },
    unknown
  >((data) => applicationsApi.apply(data), {
    invalidate: ['applications.list'],
    onSuccess: () => {
      toast.add({ type: 'success', description: t.successApplied });
      setOpen(false);
      setCv(undefined);
      setMotivation('');
    },
    onError: (err) => {
      if (err.message.includes('déjà')) {
        setError(t.alreadyApplied);
      } else {
        toast.add({ type: 'error', description: err.message });
      }
    },
  });

  if (applied) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className={cn('text-muted-foreground', className)}
      >
        <CheckCircle2 className="size-4" /> {t.appliedState}
      </Button>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setError(undefined);
          setCv(undefined);
          setMotivation('');
        }
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" className={className}>
            <Briefcase className="size-4" /> {t.apply}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.applyDialogTitle}</DialogTitle>
          <DialogDescription>{t.applyDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.cvLabel}</label>
            <FileDrop
              accept={{ 'application/pdf': ['.pdf'] }}
              maxSize={10 * 1024 * 1024}
              onFileSelect={setCv}
              onClear={() => setCv(undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.motivationLabel}</label>
            <Textarea
              className="resize-none"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder={t.motivationPlaceholder}
              rows={4}
            />
          </div>
          {error && <p className="text-destructive text-xs">{error}</p>}
          <DialogFooter className="pt-2">
            <Button
              onClick={() =>
                user &&
                cv &&
                applyMutation.mutate({
                  cv,
                  motivationLetter: motivation,
                  poste: post.contenu,
                  userId: user.id,
                  postId: post.id,
                })
              }
              disabled={!cv || !user || applyMutation.isPending}
            >
              {applyMutation.isPending ? t.submittingApply : t.apply}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TrainingApplyButton({ post }: { post: PostResponse }) {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession({ redirectToLoginOnMissing: false });
  const { data: employees } = useApi('employees.list', () =>
    employeesApi.list()
  );

  const myEmployee = React.useMemo(() => {
    if (!user || !employees) return;
    return employees.find((e) => e.userId === user.id);
  }, [user, employees]);

  const { data: myEnrollments } = useApi(
    ['trainings.employee', String(myEmployee?.id)],
    () => trainingsApi.listByEmployee(myEmployee!.id),
    { enabled: !!myEmployee }
  );

  const isEnrolled = React.useMemo(() => {
    if (!myEnrollments || !post.trainingId) return false;
    return myEnrollments.some(
      (e) =>
        e.training?.id === post.trainingId &&
        e.status !== 'CANCELLED' &&
        e.status !== 'REJECTED'
    );
  }, [myEnrollments, post.trainingId]);

  const enrollMutation = useApiMutation<
    { trainingId: number; employeeId: number; status: string },
    unknown
  >(
    ({ trainingId, employeeId, status }) =>
      trainingsApi.enroll(trainingId, employeeId, status as never),
    {
      invalidate: ['trainings.list'],
      onSuccess: () => {
        toast.add({ type: 'success', description: t.trainingApplySuccess });
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  if (isEnrolled) {
    return (
      <Button size="sm" variant="outline" disabled>
        <CheckCircle2 className="size-4" /> {t.trainingApplied}
      </Button>
    );
  }

  const isFull =
    post.trainingCapacity != undefined &&
    post.trainingEnrollmentCount != undefined &&
    post.trainingEnrollmentCount >= post.trainingCapacity;

  return (
    <Button
      size="sm"
      disabled={!myEmployee || isFull || enrollMutation.isPending}
      onClick={() => {
        if (myEmployee && post.trainingId) {
          enrollMutation.mutate({
            trainingId: post.trainingId,
            employeeId: myEmployee.id,
            status: 'PENDING',
          });
        }
      }}
    >
      <GraduationCap className="size-4" />{' '}
      {isFull ? t.trainingFull : t.trainingApply}
    </Button>
  );
}

function forumEnrollmentStatusColor(s: string) {
  if (s === 'PENDING') return 'bg-chart-3/15 text-chart-3';
  if (s === 'APPROVED' || s === 'REGISTERED')
    return 'bg-chart-2/15 text-chart-2';
  if (s === 'REJECTED') return 'bg-destructive/15 text-destructive';
  return 'bg-muted text-muted-foreground';
}

function TrainingEnrollmentsPanel({ trainingId }: { trainingId: number }) {
  const { dict } = useI18n();
  const t = dict.forum;
  const {
    data: enrollments,
    loading,
    error,
    refetch,
  } = useApi(['trainings.enrollments', String(trainingId)], () =>
    trainingsApi.listEnrollments(trainingId)
  );

  const statusMutation = useApiMutation<
    { enrollmentId: number; status: string },
    unknown
  >(
    ({ enrollmentId, status }) =>
      trainingsApi.updateEnrollmentStatus(
        enrollmentId,
        status as 'APPROVED' | 'REJECTED' | 'CANCELLED'
      ),
    {
      invalidate: [['trainings.enrollments', String(trainingId)]],
      onSuccess: () => {
        refetch();
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  const removeMutation = useApiMutation<number, unknown>(
    (enrollmentId) => trainingsApi.removeEnrollment(enrollmentId),
    {
      invalidate: [['trainings.enrollments', String(trainingId)]],
      onSuccess: () => {
        toast.add({ type: 'success', description: t.trainingRemoved });
        refetch();
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-xs">{error.message}</p>;
  }

  const list = enrollments ?? [];

  if (list.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-center text-xs">
        {t.noApplicants}
      </p>
    );
  }

  const statusLabel = (s: string) => {
    if (s === 'PENDING') return t.trainingPending;
    if (s === 'APPROVED' || s === 'REGISTERED') return t.trainingApprovedStatus;
    if (s === 'REJECTED') return t.trainingRejectedStatus;
    return s;
  };

  return (
    <div className="space-y-2">
      {list.map((enrollment) => (
        <div
          key={enrollment.id}
          className="bg-muted/40 flex items-center gap-3 rounded-xl p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              {enrollment.employee
                ? `${enrollment.employee.department} — ${
                    fullName(
                      enrollment.employee.user?.name,
                      enrollment.employee.user?.lastname
                    ) || enrollment.employee.employeeCode
                  }`
                : '—'}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDate(enrollment.enrollmentDate)}
            </p>
          </div>
          <span
            className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
              forumEnrollmentStatusColor(enrollment.status)
            )}
          >
            {statusLabel(enrollment.status)}
          </span>
          {enrollment.status === 'PENDING' && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="text-chart-2 hover:bg-chart-2/10 hover:text-chart-2"
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    enrollmentId: enrollment.id,
                    status: 'APPROVED',
                  })
                }
              >
                <CircleCheck className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    enrollmentId: enrollment.id,
                    status: 'REJECTED',
                  })
                }
              >
                <CircleX className="size-4" />
              </Button>
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={removeMutation.isPending}
            onClick={() => removeMutation.mutate(enrollment.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function DeletePostDialog({
  onConfirm,
  pending,
}: {
  onConfirm: () => void;
  pending: boolean;
}) {
  const { dict } = useI18n();
  const t = dict.forum;
  const [open, setOpen] = React.useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" /> {t.delete}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deletePostTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.deletePostDesc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
            disabled={pending}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {t.delete}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function NewPostDialog({ onCreated }: { onCreated: () => void }) {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession({ redirectToLoginOnMissing: false });
  const canManage = hasMinimumRole(user?.role, 'HR');
  const [open, setOpen] = React.useState(false);
  const [typePost, setTypePost] = React.useState<TypePost>('PUBLICITE');
  const [contenu, setContenu] = React.useState('');
  const [trainingTitle, setTrainingTitle] = React.useState('');
  const [trainingTrainer, setTrainingTrainer] = React.useState('');
  const [trainingLocation, setTrainingLocation] = React.useState('');
  const [trainingStartDate, setTrainingStartDate] = React.useState('');
  const [trainingEndDate, setTrainingEndDate] = React.useState('');
  const [trainingCapacity, setTrainingCapacity] = React.useState(20);

  const isFormation = typePost === 'FORMATION';

  const postTypeOptions: { value: TypePost; label: string }[] = canManage
    ? (Object.keys(t.types) as TypePost[]).map((key) => ({
        value: key,
        label: t.types[key],
      }))
    : [{ value: 'PUBLICITE', label: t.types.PUBLICITE }];

  const createMutation = useApiMutation<PostResponse, PostResponse>(
    (body) => postsApi.create(body),
    {
      invalidate: ['posts.list'],
      onSuccess: () => {
        toast.add({ type: 'success', description: t.successCreated });
        setOpen(false);
        setContenu('');
        setTypePost('PUBLICITE');
        setTrainingTitle('');
        setTrainingTrainer('');
        setTrainingLocation('');
        setTrainingStartDate('');
        setTrainingEndDate('');
        setTrainingCapacity(20);
        onCreated();
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus /> {t.newPost}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.createDialogTitle}</DialogTitle>
          <DialogDescription>{t.createDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_180px]">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t.typeLabel}</label>
              {canManage ? (
                <Select
                  value={typePost}
                  onValueChange={(v) => setTypePost(v as TypePost)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {postTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="bg-muted/50 flex h-10 items-center rounded-md border px-3 text-sm">
                  {t.types.PUBLICITE}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.contentLabel}</label>
            <Textarea
              className="resize-none"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder={t.contentPlaceholder}
              rows={isFormation ? 3 : 5}
            />
          </div>

          {isFormation && (
            <div className="bg-muted/30 space-y-4 rounded-xl border p-4">
              <p className="text-sm font-medium">{t.types.FORMATION}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">
                    {t.trainingTitleLabel}
                  </label>
                  <Input
                    value={trainingTitle}
                    onChange={(e) => setTrainingTitle(e.target.value)}
                    placeholder={t.trainingTitlePlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">
                    {t.trainingTrainerLabel}
                  </label>
                  <Input
                    value={trainingTrainer}
                    onChange={(e) => setTrainingTrainer(e.target.value)}
                    placeholder={t.trainingTrainerPlaceholder}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">
                    {t.trainingLocationLabel}
                  </label>
                  <Input
                    value={trainingLocation}
                    onChange={(e) => setTrainingLocation(e.target.value)}
                    placeholder={t.trainingLocationPlaceholder}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">
                    {t.trainingCapacityLabel}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={trainingCapacity}
                    onChange={(e) =>
                      setTrainingCapacity(
                        e.target.value === '' ? 1 : Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">
                    {t.trainingStartDateLabel}
                  </label>
                  <DatePicker
                    value={trainingStartDate}
                    onChange={(v) => setTrainingStartDate(v ?? '')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">
                    {t.trainingEndDateLabel}
                  </label>
                  <DatePicker
                    value={trainingEndDate}
                    onChange={(v) => setTrainingEndDate(v ?? '')}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              onClick={async () => {
                if (!user) return;
                let trainingId: number | undefined;
                if (isFormation) {
                  const training = await trainingsApi.create({
                    title: trainingTitle || contenu,
                    description: contenu,
                    trainer: trainingTrainer,
                    location: trainingLocation,
                    startDate: trainingStartDate || undefined,
                    endDate: trainingEndDate || undefined,
                    capacity: trainingCapacity,
                  } as never);
                  trainingId = training.id;
                }
                createMutation.mutate({
                  contenu,
                  typePost,
                  auteurId: user.id,
                  trainingId,
                } as PostResponse);
              }}
              disabled={
                !contenu.trim() ||
                !user ||
                createMutation.isPending ||
                (isFormation && !trainingTitle.trim())
              }
            >
              {createMutation.isPending ? t.submitting : t.submit}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommentsList({ postId }: { postId: number }) {
  const { dict } = useI18n();
  const t = dict.forum;
  const { user } = useSession({ redirectToLoginOnMissing: false });
  const canModerate = hasMinimumRole(user?.role, 'HR');
  const [text, setText] = React.useState('');
  const [showAll, setShowAll] = React.useState(false);

  const {
    data: comments,
    loading,
    error,
    refetch,
  } = useApi(['posts.comments', String(postId)], () =>
    commentairesApi.listByPost(postId)
  );

  const visibleComments = showAll
    ? (comments ?? [])
    : (comments ?? []).slice(0, 2);
  const hasMore = (comments ?? []).length > 2;

  const createMutation = useApiMutation<
    { postId: number; userId: number; contenu: string },
    unknown
  >(({ postId: p, userId: u, contenu: c }) => commentairesApi.create(p, u, c), {
    invalidate: [['posts.comments', String(postId)], 'posts.list'],
    onSuccess: () => {
      setText('');
      refetch();
    },
    onError: (err) => toast.add({ type: 'error', description: err.message }),
  });

  const deleteMutation = useApiMutation<number, string>(
    (id) => commentairesApi.remove(id),
    {
      invalidate: [['posts.comments', String(postId)]],
      onSuccess: () => {
        toast.add({ type: 'success', description: t.commentDeleted });
        refetch();
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  return (
    <div className="space-y-3">
      {user && (
        <div className="flex items-end gap-2">
          <Textarea
            className="min-h-[38px] flex-1 resize-none text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.commentPlaceholder}
            rows={1}
          />
          <Button
            size="sm"
            className="h-[38px] px-4"
            onClick={() =>
              createMutation.mutate({
                postId,
                userId: user.id,
                contenu: text,
              })
            }
            disabled={!text.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? t.posting : t.addComment}
            <Send className="size-4" />
          </Button>
        </div>
      )}

      {error ? (
        <p className="text-destructive text-xs">{error.message}</p>
      ) : loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (comments ?? []).length === 0 ? (
        <p className="text-muted-foreground text-xs">{t.noComments}</p>
      ) : (
        <div className="space-y-2">
          {visibleComments.map((comment) => {
            const name = fullName(
              comment.auteur?.name,
              comment.auteur?.lastname
            );
            const canDelete = canModerate || comment.auteur?.id === user?.id;
            return (
              <div
                key={comment.id}
                className="bg-muted/40 flex items-start gap-2.5 rounded-xl p-3"
              >
                <Avatar className="size-7">
                  <AvatarImage src={comment.auteur?.profileImageUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {name.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">{name}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {formatDateTime(comment.dateCreation)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed whitespace-pre-wrap">
                    {comment.contenu}
                  </p>
                </div>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-7"
                    onClick={() => deleteMutation.mutate(comment.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
          {hasMore && !showAll && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary w-full"
              onClick={() => setShowAll(true)}
            >
              {t.loadMoreCount
                .split('{count}')
                .join(String((comments ?? []).length - 2))}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ApplicantsList({ postId }: { postId: number }) {
  const { dict } = useI18n();
  const t = dict.forum;
  const [selectedApp, setSelectedApp] = React.useState<
    ApplicationResponse | undefined
  >(undefined);
  const [scheduleAppId, setScheduleAppId] = React.useState<number | undefined>(
    undefined
  );
  const {
    data: applicants,
    loading,
    error,
  } = useApi(['posts.applicants', String(postId)], () =>
    applicationsApi.getByPostId(postId)
  );

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-xs">{error.message}</p>;
  }

  if ((applicants ?? []).length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted-foreground text-xs">{t.noApplicants}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {(applicants ?? []).map((app) => (
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

      {selectedApp && (
        <ForumApplicantDialog
          app={selectedApp}
          onClose={() => setSelectedApp(undefined)}
          onSchedule={(appId) => {
            setSelectedApp(undefined);
            setScheduleAppId(appId);
          }}
        />
      )}

      {scheduleAppId && (
        <ScheduleInterviewInline
          applicationId={scheduleAppId}
          onClose={() => setScheduleAppId(undefined)}
        />
      )}
    </>
  );
}

const recommendationTone: Record<string, string> = {
  ACCEPTER: 'bg-chart-2/10 text-chart-2 ring-chart-2/25',
  ENTRETIEN: 'bg-info/10 text-info ring-info/25',
  REFUSER: 'bg-destructive/10 text-destructive ring-destructive/25',
};

function ScheduleInterviewInline({
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
  const type = useWatch({ control: form.control, name: 'type' });
  const mutation = useApiMutation<InterviewFormValues, InterviewResponse>(
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
        toast.add({ type: 'success', description: t.successScheduled });
        onClose();
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
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
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
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
            {type === 'ONSITE' && (
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
            {type === 'ONLINE' && (
              <p className="bg-muted/60 text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
                <Video className="size-3.5" />
                {t.autoMeetingLink}
              </p>
            )}
          </FieldGroup>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t.scheduling : t.schedule}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ForumApplicantDialog({
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

  const canSchedule = app.status === 'PENDING' || app.status === 'HR_INTERVIEW';

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
              <Stars value={app.stars} />
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

          {canSchedule && (
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
