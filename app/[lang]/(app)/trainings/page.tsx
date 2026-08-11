'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod';
import {
  CalendarDays,
  Check,
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
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

type TrainingFormValues = z.infer<ReturnType<typeof createTrainingSchema>>;

export default function TrainingsPage() {
  const { dict } = useI18n();
  const t = dict.trainings;
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
        title={t.title}
        description={t.description
          .split('{count}')
          .join(String(trainings?.length ?? 0))}
        actions={<AddTrainingDialog />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.active}
          value={(trainings ?? []).filter((t) => t.status === 'PLANNED').length}
          hint={t.activeHint}
          icon={<GraduationCap className="size-5" />}
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
          icon={<Check className="size-5" />}
          accent="success"
        />
      </div>

      {error ? (
        <ErrorState onRetry={refetch} description={error.message} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => {
            return <Skeleton key={i} className="h-56 w-full" />;
          })}
        </div>
      ) : (trainings ?? []).length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="size-6" />}
          title={t.noTrainings}
          description={t.noTrainingsDesc}
          action={<AddTrainingDialog />}
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
  onDeleted,
}: {
  training: Training;
  employees: EmployeeResponse[];
  userMap: Map<number, User>;
  onDeleted: () => void;
}) {
  const { dict } = useI18n();
  const t = dict.trainings;
  const participants = training.numberOfParticipants ?? 0;
  const fill = Math.min((participants / training.capacity) * 100, 100);
  const isFull = participants >= training.capacity;

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
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{training.title}</CardTitle>
            <p className="text-muted-foreground mt-0.5 text-xs">
              <span className="text-muted-foreground">
                {t.by} {training.trainer || '—'}
              </span>
            </p>
          </div>
          <StatusBadge status={training.status} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <p className="text-muted-foreground line-clamp-3 text-sm">
          {training.description}
        </p>
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {training.location || '—'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDate(training.startDate)} → {formatDate(training.endDate)}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t.inscriptions}</span>
            <span className="font-medium">
              {participants}/{training.capacity}
            </span>
          </div>
          <Progress value={fill} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <EnrollDialog
          training={training}
          employees={employees}
          userMap={userMap}
          disabled={isFull || training.status === 'DONE'}
        />
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive ml-auto"
          onClick={() => removeMutation.mutate(training.id)}
          disabled={removeMutation.isPending}
        >
          <Trash2 /> {t.delete}
        </Button>
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
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled}>
          <UserPlus /> {t.enroll}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t.enrollDialogTitle.split('{title}').join(training.title)}
          </DialogTitle>
          <DialogDescription>{t.enrollDialogDesc}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-1">
          <div className="space-y-2">
            <label
              htmlFor="enroll-employee"
              className="text-sm leading-none font-medium"
            >
              {t.employee}
            </label>
            <Select
              value={employeeId ? String(employeeId) : ''}
              onValueChange={(v) => setEmployeeId(Number(v))}
            >
              <SelectTrigger id="enroll-employee">
                <SelectValue placeholder={t.selectEmployee} />
              </SelectTrigger>
              <SelectContent position="item-aligned">
                {employeeOptions(employees, userMap).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t.newTraining}
        </Button>
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
