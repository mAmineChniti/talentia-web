'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { hasMinimumRole } from '@/lib/rbac';
import { createTrainingSchema } from '@/lib/schemas/trainings';
import { employeesApi } from '@/lib/services/employees';
import { trainingsApi } from '@/lib/services/trainings';
import { usersApi } from '@/lib/services/users';
import type { EmployeeResponse } from '@/lib/types/employees';
import type { Training } from '@/lib/types/trainings';
import type { User } from '@/lib/types/users';
import { formatDate, fullName } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { Progress } from '@/components/ui/progress';
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
import { cn } from '@/lib/utils';

type TrainingFormValues = z.infer<ReturnType<typeof createTrainingSchema>>;

const statusGradient: Record<string, string> = {
  PLANNED: 'from-chart-4/25 to-chart-4/5 text-chart-4',
  DONE: 'from-chart-2/25 to-chart-2/5 text-chart-2',
  CANCELLED: 'from-destructive/20 to-destructive/5 text-destructive',
};

export default function TrainingsPage() {
  const { dict } = useI18n();
  const t = dict.trainings;
  const { user } = useSession();
  const canManage = hasMinimumRole(user?.role, 'HR');
  const {
    data: trainings,
    loading,
    error,
    refetch,
  } = useApi('trainings.list', () => trainingsApi.list());
  const employees = useApi('employees.list', () => employeesApi.list());
  const users = useApi('users.list', () => usersApi.list());

  const userMap = React.useMemo(() => {
    const m = new Map<number, User>();
    if (users.data != undefined) {
      for (const u of users.data) m.set(u.id, u);
    }
    return m;
  }, [users.data]);

  const enrolled = (trainings ?? []).reduce(
    (s, t) => s + (t.numberOfParticipants ?? 0),
    0
  );
  const capacity = (trainings ?? []).reduce((s, t) => s + t.capacity, 0);
  const completed = (trainings ?? []).filter((t) => t.status === 'DONE').length;

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={t.completed}
        title={t.title}
        description={t.description
          .split('{count}')
          .join(String(trainings?.length ?? 0))}
        icon={<GraduationCap className="size-6" />}
        actions={canManage ? <AddTrainingDialog /> : undefined}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.active}
          value={(trainings ?? []).filter((t) => t.status === 'PLANNED').length}
          hint={t.activeHint}
          icon={<Clock3 className="size-5" />}
          accent="info"
        />
        <StatCard
          label={t.enrolled}
          value={enrolled}
          hint={t.enrolledHint}
          icon={<Users className="size-5" />}
          accent="success"
        />
        <StatCard
          label={t.available}
          value={Math.max(capacity - enrolled, 0)}
          hint={t.availableHint.split('{capacity}').join(String(capacity))}
          icon={<GraduationCap className="size-5" />}
          accent="warning"
        />
        <StatCard
          label={t.completed}
          value={completed}
          hint={t.completedHint}
          icon={<CheckCircle2 className="size-5" />}
          accent="success"
        />
      </div>

      {error ? (
        <ErrorState onRetry={refetch} description={error.message} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => {
            return <Skeleton key={i} className="h-72 w-full" />;
          })}
        </div>
      ) : (trainings ?? []).length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="size-6" />}
          title={t.noTrainings}
          description={t.noTrainingsDesc}
          action={canManage ? <AddTrainingDialog /> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(trainings ?? []).map((training) => {
            return (
              <TrainingCard
                key={training.id}
                training={training}
                employees={employees.data ?? []}
                userMap={userMap}
                canManage={canManage}
                onDeleted={refetch}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrainingCard({
  training,
  employees,
  userMap,
  canManage,
  onDeleted,
}: {
  training: Training;
  employees: EmployeeResponse[];
  userMap: Map<number, User>;
  canManage: boolean;
  onDeleted: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.trainings;
  const participants = training.numberOfParticipants ?? 0;
  const fill = Math.min((participants / training.capacity) * 100, 100);
  const isFull = participants >= training.capacity;
  const isDone = training.status === 'DONE';

  const removeMutation = useApiMutation<number, string>(
    (id) => trainingsApi.remove(id),
    {
      invalidate: ['trainings.list'],
      onSuccess: () => {
        toast.success(t.successDeleted);
        onDeleted();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={cn(
          'relative flex items-center gap-3 bg-linear-to-br p-4',
          statusGradient[training.status] ??
            'from-primary/15 to-primary/5 text-primary'
        )}
      >
        <div className="bg-card/80 text-foreground flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5">
          <GraduationCap className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading truncate text-[15px] font-semibold tracking-tight">
            {training.title}
          </h3>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {t.by} {training.trainer || '—'}
          </p>
        </div>
        <StatusBadge status={training.status} />
      </div>

      <CardContent className="flex-1 space-y-4 p-4">
        <p className="text-muted-foreground line-clamp-2 text-[13px] leading-relaxed">
          {training.description}
        </p>
        <div className="space-y-2 text-xs">
          <div className="text-muted-foreground flex items-center gap-2">
            <span className="bg-muted/60 flex size-6 items-center justify-center rounded-md">
              <MapPin className="size-3" />
            </span>
            {training.location || '—'}
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            <span className="bg-muted/60 flex size-6 items-center justify-center rounded-md">
              <CalendarDays className="size-3" />
            </span>
            <span className="inline-flex items-center gap-1">
              {formatDate(training.startDate)}
              <ArrowRight className="size-3 rtl:rotate-180" />
              {formatDate(training.endDate)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t.inscriptions}</span>
            <span className="font-semibold tabular-nums">
              {participants}/{training.capacity}
              <span className="text-muted-foreground ms-1.5 font-normal">
                ({Math.round(fill)}%)
              </span>
            </span>
          </div>
          <Progress
            value={fill}
            className={cn(
              'h-1.5',
              isDone
                ? '[&>div]:bg-chart-2'
                : isFull
                  ? '[&>div]:bg-chart-3'
                  : '[&>div]:bg-chart-4'
            )}
          />
        </div>
      </CardContent>

      <CardFooter className="bg-muted/20 gap-2 border-t px-4 py-3">
        <EnrollDialog
          training={training}
          employees={employees}
          userMap={userMap}
          disabled={isFull || isDone}
        />
        {canManage && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 ms-auto"
            onClick={() => removeMutation.mutate(training.id)}
            disabled={removeMutation.isPending}
          >
            <Trash2 /> {t.delete}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function EnrollDialog({
  training,
  employees,
  userMap,
  disabled,
}: {
  training: Training;
  employees: EmployeeResponse[];
  userMap: Map<number, User>;
  disabled: boolean;
}) {
  const { dict } = useI18n();
  const t = dict.trainings;
  const [open, setOpen] = React.useState(false);
  const [employeeId, setEmployeeId] = React.useState<number>(0);

  const enrollMutation = useApiMutation<
    { trainingId: number; employeeId: number },
    unknown
  >(
    ({ trainingId, employeeId }) => trainingsApi.enroll(trainingId, employeeId),
    {
      invalidate: ['trainings.list'],
      onSuccess: () => {
        toast.success(t.successEnrolled);
        setOpen(false);
        setEmployeeId(0);
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setEmployeeId(0);
      }}
    >
      <DialogTrigger render={<Button size="sm" disabled={disabled} />}>
        <UserPlus /> {t.enroll}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t.enrollDialogTitle.split('{title}').join(training.title)}
          </DialogTitle>
          <DialogDescription>{t.enrollDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <Field>
            <FieldLabel htmlFor="enroll-employee">{t.employee}</FieldLabel>
            <Select
              value={employeeId ? String(employeeId) : ''}
              onValueChange={(v) => setEmployeeId(Number(v))}
            >
              <SelectTrigger id="enroll-employee">
                <SelectValue placeholder={t.selectEmployee} />
              </SelectTrigger>
              <SelectContent>
                {employeeOptions(employees, userMap).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter className="pt-2">
            <Button
              onClick={() =>
                enrollMutation.mutate({ trainingId: training.id, employeeId })
              }
              disabled={!employeeId || enrollMutation.isPending}
            >
              {enrollMutation.isPending ? t.enrolling : t.enrollEmployee}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddTrainingDialog() {
  const { dict } = useI18n();
  const t = dict.trainings;
  const [open, setOpen] = React.useState(false);
  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(createTrainingSchema(dict.validation)),
    defaultValues: {
      title: '',
      description: '',
      trainer: '',
      location: '',
      startDate: '',
      endDate: '',
      capacity: 20,
    },
  });

  const createMutation = useApiMutation<TrainingFormValues, Training>(
    (body) => trainingsApi.create(body),
    {
      invalidate: ['trainings.list'],
      onSuccess: () => {
        toast.success(t.successCreated);
        setOpen(false);
        form.reset();
      },
      onError: (err) => toast.error(err.message),
    }
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus /> {t.newTraining}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.createDialogTitle}</DialogTitle>
          <DialogDescription>{t.createDialogDesc}</DialogDescription>
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
                name="title"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="training-title">
                      {t.titleLabel}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="training-title"
                      placeholder={t.titlePlaceholder}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="trainer"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="training-trainer">
                      {t.trainer}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="training-trainer"
                      placeholder={t.trainerPlaceholder}
                      aria-invalid={fieldState.invalid}
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
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="training-description">
                    {t.descriptionLabel}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="training-description"
                    placeholder={t.descriptionPlaceholder}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="location"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="training-location">
                      {t.location}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="training-location"
                      placeholder={t.locationPlaceholder}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="capacity"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="training-capacity">
                      {t.capacity}
                    </FieldLabel>
                    <Input
                      {...field}
                      id="training-capacity"
                      type="number"
                      min="1"
                      aria-invalid={fieldState.invalid}
                      value={field.value || ''}
                      onChange={(e) => {
                        return field.onChange(
                          e.target.value === '' ? 0 : e.target.valueAsNumber
                        );
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="startDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="training-start">{t.start}</FieldLabel>
                    <DatePicker
                      id="training-start"
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
              <Controller
                control={form.control}
                name="endDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="training-end">{t.end}</FieldLabel>
                    <DatePicker
                      id="training-end"
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
          </FieldGroup>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t.creating : t.createTraining}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function employeeOptions(
  employees: EmployeeResponse[],
  userMap: Map<number, User>
) {
  return employees
    .filter((e) => userMap.has(e.userId))
    .map((e) => {
      const user = userMap.get(e.userId);
      return {
        id: e.id,
        name: fullName(user?.name, user?.lastname),
      };
    })
    .toSorted((a, b) => a.name.localeCompare(b.name));
}
