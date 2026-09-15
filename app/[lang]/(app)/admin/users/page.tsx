'use client';

import * as React from 'react';
import {
  Ban,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

import { useApi, useApiMutation } from '@/hooks/use-api';
import { useI18n } from '@/components/i18n-provider';
import { useSession } from '@/hooks/use-session';
import { employeesApi } from '@/lib/services/employees';
import { usersApi } from '@/lib/services/users';
import type { Role, RoleChangeProvisioning, User } from '@/lib/types/users';
import { fullName, initials } from '@/lib/format';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState } from '@/components/states';
import { DatePicker } from '@/components/ui/date-picker';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const ROLES: Role[] = ['CANDIDATE', 'EMPLOYEE', 'HR', 'ADMIN'];

const CONTRACT_TYPES = ['CDI', 'CDD', 'Freelance', 'Internship'];

const roleTones: Record<Role, string> = {
  CANDIDATE: 'bg-chart-4/10 text-chart-4 ring-chart-4/20',
  EMPLOYEE: 'bg-chart-2/10 text-chart-2 ring-chart-2/20',
  HR: 'bg-primary/10 text-primary ring-primary/20',
  ADMIN: 'bg-chart-5/10 text-chart-5 ring-chart-5/20',
};

function RoleChip({ role }: { role: Role | undefined }) {
  if (!role) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        roleTones[role]
      )}
    >
      {role}
    </span>
  );
}

function StatusChip({
  banned,
  t,
}: {
  banned: boolean;
  t: { statusActive: string; statusBanned: string };
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
        banned
          ? 'bg-destructive/10 text-destructive ring-destructive/25'
          : 'bg-chart-2/10 text-chart-2 ring-chart-2/25'
      )}
    >
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          banned ? 'bg-destructive' : 'bg-chart-2'
        )}
      />
      {banned ? t.statusBanned : t.statusActive}
    </span>
  );
}

export default function AdminUsersPage() {
  const { dict } = useI18n();
  const t = dict.admin;
  const {
    data: users,
    loading,
    error,
    refetch,
  } = useApi('users.list', () => usersApi.list());
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const { data: employees } = useApi('employees.list', () =>
    employeesApi.list()
  );
  const employeeUserIds = React.useMemo(
    () => new Set((employees ?? []).map((e) => e.userId)),
    [employees]
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && u.banned === true) return false;
      if (statusFilter === 'banned' && u.banned !== true) return false;
      if (!q) return true;
      return (
        fullName(u.name, u.lastname).toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const bannedCount = (users ?? []).filter((u) => u.banned === true).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        kicker={t.kicker}
        title={t.title}
        description={t.description
          .split('{count}')
          .join(String(users?.length ?? 0))}
        icon={<ShieldCheck className="size-6" />}
      />

      <div className="border-chart-3/25 bg-chart-3/8 flex items-start gap-3 rounded-2xl border p-4 text-sm">
        <ShieldCheck className="text-chart-3 mt-0.5 size-4 shrink-0" />
        <p className="text-muted-foreground leading-relaxed">{t.ghostNote}</p>
      </div>

      <Card className="overflow-hidden rounded-2xl py-0 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="text-muted-foreground absolute inset-s-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-muted/40 ps-9"
              />
            </div>
            <Combobox
              items={['all', ...ROLES]}
              value={roleFilter}
              onValueChange={(v) => setRoleFilter(v ?? 'all')}
            >
              <ComboboxInput
                placeholder={t.allRoles}
                className="w-full sm:w-52"
              />
              <ComboboxContent>
                <ComboboxEmpty>No results found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item === 'all' ? t.allRoles : item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <Combobox
              items={['all', 'active', 'banned']}
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v ?? 'all')}
            >
              <ComboboxInput
                placeholder={t.allStatuses}
                className="w-full sm:w-52"
              />
              <ComboboxContent>
                <ComboboxEmpty>No results found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item === 'all'
                        ? t.allStatuses
                        : item === 'active'
                          ? t.statusActive
                          : t.statusBanned}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <span className="text-muted-foreground ms-auto hidden text-xs sm:inline">
              {filtered.length}/{users?.length ?? 0}
              {bannedCount > 0 &&
                ` · ${bannedCount} ${t.statusBanned.toLowerCase()}`}
            </span>
          </div>

          {error ? (
            <ErrorState onRetry={refetch} description={error.message} />
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => {
                return <Skeleton key={i} className="h-14 w-full" />;
              })}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="size-6" />}
              title={
                search || roleFilter !== 'all' || statusFilter !== 'all'
                  ? t.noResults
                  : t.emptyTitle
              }
              description={undefined}
            />
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>{t.colUser}</TableHead>
                    <TableHead>{t.colRole}</TableHead>
                    <TableHead>{t.colStatus}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="ring-primary/10 size-9 ring-1">
                            <AvatarImage src={u.profileImageUrl} />
                            <AvatarFallback>
                              {initials(u.name, u.lastname)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {fullName(u.name, u.lastname)}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RoleChip role={u.role} />
                      </TableCell>
                      <TableCell>
                        <StatusChip banned={u.banned === true} t={t} />
                      </TableCell>
                      <TableCell>
                        <RowActions
                          target={u}
                          hasEmployee={employeeUserIds.has(u.id)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-muted/30">
                  <TableRow>
                    <TableCell colSpan={4} className="py-2.5 text-xs">
                      <span className="text-muted-foreground">
                        {filtered.length}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RowActions({
  target,
  hasEmployee,
}: {
  target: User;
  hasEmployee: boolean;
}) {
  const { dict } = useI18n();
  const t = dict.admin;
  const { user: me } = useSession();
  const isSelf = me?.id === target.id;
  const isBanned = target.banned === true;
  const [banOpen, setBanOpen] = React.useState(false);
  const [roleOpen, setRoleOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [nextRole, setNextRole] = React.useState<Role>(target.role);
  const [department, setDepartment] = React.useState('');
  const [position, setPosition] = React.useState('');
  const [contractType, setContractType] = React.useState('CDI');
  const [salary, setSalary] = React.useState(0);
  const [contractStart, setContractStart] = React.useState('');
  const [contractEnd, setContractEnd] = React.useState('');
  const [workingHours, setWorkingHours] = React.useState('');

  const isDemotion = target.role !== 'CANDIDATE' && nextRole === 'CANDIDATE';
  const isNeedsProvisioning = nextRole !== 'CANDIDATE' && !hasEmployee;
  const isProvisioningValid =
    department.trim() !== '' && position.trim() !== '' && salary > 0;

  const banMutation = useApiMutation<number, User>((id) => usersApi.ban(id), {
    invalidate: ['users.list'],
    onSuccess: () => {
      toast.add({ type: 'success', description: t.successBanned });
      setBanOpen(false);
    },
    onError: (err) => toast.add({ type: 'error', description: err.message }),
  });

  const unbanMutation = useApiMutation<number, User>(
    (id) => usersApi.unban(id),
    {
      invalidate: ['users.list'],
      onSuccess: () => {
        toast.add({ type: 'success', description: t.successUnbanned });
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  const roleMutation = useApiMutation<
    { id: number; role: Role; provisioning?: RoleChangeProvisioning },
    User
  >(
    ({ id, role, provisioning }) => usersApi.changeRole(id, role, provisioning),
    {
      invalidate: ['users.list', 'employees.list', 'dashboard.get'],
      onSuccess: (_data, vars) => {
        toast.add({
          type: 'success',
          description: vars.provisioning ? t.successProvisioned : t.successRole,
        });
        setRoleOpen(false);
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  const deleteMutation = useApiMutation<number, string>(
    (id) => usersApi.remove(id),
    {
      invalidate: ['users.list'],
      onSuccess: () => {
        toast.add({ type: 'success', description: t.successDeleted });
        setDeleteOpen(false);
      },
      onError: (err) => toast.add({ type: 'error', description: err.message }),
    }
  );

  function handleBanClick() {
    if (isSelf) {
      toast.add({ type: 'error', description: t.cannotSelfBan });
      return;
    }
    setBanOpen(true);
  }

  function handleRoleClick() {
    if (isSelf) {
      toast.add({ type: 'error', description: t.cannotSelfRole });
      return;
    }
    setNextRole(target.role);
    setDepartment('');
    setPosition('');
    setContractType('CDI');
    setSalary(0);
    setContractStart('');
    setContractEnd('');
    setWorkingHours('');
    setRoleOpen(true);
  }

  function handleRoleConfirm() {
    if (isNeedsProvisioning && !isProvisioningValid) return;
    const provisioning: RoleChangeProvisioning | undefined = isNeedsProvisioning
      ? {
          department: department.trim(),
          position: position.trim(),
          contractType,
          salary,
          ...(contractStart && { contractStartDate: contractStart }),
          ...(contractEnd && { contractEndDate: contractEnd }),
          ...(workingHours !== '' && { workingHours: Number(workingHours) }),
        }
      : undefined;
    roleMutation.mutate({ id: target.id, role: nextRole, provisioning });
  }

  const isBusy =
    banMutation.isPending ||
    unbanMutation.isPending ||
    roleMutation.isPending ||
    deleteMutation.isPending;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={t.actions} />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isBanned ? (
            <DropdownMenuItem
              onClick={() => unbanMutation.mutate(target.id)}
              disabled={unbanMutation.isPending}
            >
              <RotateCcw /> {t.unban}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleBanClick}
            >
              <Ban /> {t.ban}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleRoleClick}>
            <Pencil /> {t.changeRole}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 /> {t.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.banTitle}</DialogTitle>
            <DialogDescription>{t.banDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => banMutation.mutate(target.id)}
              disabled={isBusy}
            >
              {t.confirmBan}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.changeRole}</DialogTitle>
            <DialogDescription>
              {fullName(target.name, target.lastname)}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>{t.colRole}</FieldLabel>
              <Select
                value={nextRole}
                onValueChange={(v) => setNextRole(v as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {isDemotion && (
            <div className="border-destructive/25 bg-destructive/8 rounded-xl border p-3.5 text-sm">
              <p className="text-muted-foreground leading-relaxed">
                {t.demoteWarning}
              </p>
            </div>
          )}

          {isNeedsProvisioning && (
            <div className="bg-muted/30 space-y-4 rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">{t.provisionTitle}</p>
                <p className="text-muted-foreground text-xs">
                  {t.provisionDesc}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="provision-department">
                    {t.fieldDepartment}
                  </FieldLabel>
                  <Input
                    id="provision-department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="provision-position">
                    {t.fieldPosition}
                  </FieldLabel>
                  <Input
                    id="provision-position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>{t.fieldContractType}</FieldLabel>
                  <Select
                    value={contractType}
                    onValueChange={(v) => setContractType(v ?? 'CDI')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="provision-salary">
                    {t.fieldSalary}
                  </FieldLabel>
                  <Input
                    id="provision-salary"
                    type="number"
                    min="0"
                    step="0.01"
                    value={salary === 0 ? '' : salary}
                    onChange={(e) =>
                      setSalary(
                        e.target.value === '' ? 0 : e.target.valueAsNumber
                      )
                    }
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>{t.fieldStartDate}</FieldLabel>
                  <DatePicker
                    value={contractStart}
                    onChange={(v) => setContractStart(v ?? '')}
                  />
                </Field>
                <Field>
                  <FieldLabel>{t.fieldEndDate}</FieldLabel>
                  <DatePicker
                    value={contractEnd}
                    onChange={(v) => setContractEnd(v ?? '')}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="provision-hours">
                  {t.fieldWorkingHours}
                </FieldLabel>
                <Input
                  id="provision-hours"
                  type="number"
                  min="0"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                />
              </Field>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleRoleConfirm}
              disabled={
                isBusy ||
                nextRole === target.role ||
                (isNeedsProvisioning && !isProvisioningValid)
              }
            >
              {t.changeRole}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.deleteTitle}</DialogTitle>
            <DialogDescription>{t.deleteDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(target.id)}
              disabled={isBusy}
            >
              {t.confirmDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
