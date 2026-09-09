'use client';

import * as React from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import type { EmployeeResponse } from '@/lib/types/employees';
import type { User } from '@/lib/types/users';
import { fullName } from '@/lib/format';

type EmployeeOption = {
  id: number;
  label: string;
  userId: number;
  active: boolean;
};

type UserOption = {
  id: number;
  label: string;
};

function toOptions(
  employees: EmployeeResponse[],
  userMap: Map<number, User>,
  requiresActive?: boolean
): EmployeeOption[] {
  return employees
    .filter((e) => userMap.has(e.userId))
    .filter((e) => !requiresActive || e.active)
    .map((e) => {
      const user = userMap.get(e.userId);
      return {
        id: e.id,
        label: fullName(user?.name, user?.lastname),
        userId: e.userId,
        active: e.active,
      };
    })
    .toSorted((a, b) => a.label.localeCompare(b.label));
}

interface EmployeeComboboxProps {
  employees: EmployeeResponse[];
  userMap: Map<number, User>;
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  requiresActive?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
}

export function EmployeeCombobox({
  employees,
  userMap,
  value,
  onValueChange,
  placeholder,
  disabled,
  requiresActive,
  id,
  'aria-invalid': ariaInvalid,
}: EmployeeComboboxProps) {
  const options = React.useMemo(
    () => toOptions(employees, userMap, requiresActive),
    [employees, userMap, requiresActive]
  );

  return (
    <Combobox
      key={value}
      items={options}
      defaultValue={options.find((o) => o.id === value)}
      onValueChange={(item) => onValueChange(item?.id)}
      itemToStringValue={(item) => item.label}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={placeholder}
        id={id}
        aria-invalid={ariaInvalid}
      />
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

interface TrainerComboboxProps {
  employees: EmployeeResponse[];
  userMap: Map<number, User>;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
}

export function TrainerCombobox({
  employees,
  userMap,
  value,
  onValueChange,
  placeholder,
  disabled,
  id,
  'aria-invalid': ariaInvalid,
}: TrainerComboboxProps) {
  const options = React.useMemo(
    () => toOptions(employees, userMap, true),
    [employees, userMap]
  );

  return (
    <Combobox
      key={value}
      items={options}
      defaultValue={options.find((o) => o.label === value)}
      onValueChange={(item) => onValueChange(item?.label ?? '')}
      itemToStringValue={(item) => item.label}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={placeholder}
        id={id}
        aria-invalid={ariaInvalid}
      />
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export { toOptions as employeeComboboxOptions };

interface UserComboboxProps {
  users: User[];
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-invalid'?: boolean;
}

export function UserCombobox({
  users,
  value,
  onValueChange,
  placeholder,
  disabled,
  id,
  'aria-invalid': ariaInvalid,
}: UserComboboxProps) {
  const options: UserOption[] = React.useMemo(
    () =>
      users
        .map((u) => ({
          id: u.id,
          label: `${fullName(u.name, u.lastname)} — ${u.email}`,
        }))
        .toSorted((a, b) => a.label.localeCompare(b.label)),
    [users]
  );

  return (
    <Combobox
      key={value}
      items={options}
      defaultValue={options.find((o) => o.id === value)}
      onValueChange={(item) => onValueChange(item?.id)}
      itemToStringValue={(item) => item.label}
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={placeholder}
        id={id}
        aria-invalid={ariaInvalid}
      />
      <ComboboxContent>
        <ComboboxEmpty>No results found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
