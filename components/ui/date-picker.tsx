'use client';

import * as React from 'react';
import { format, type Locale } from 'date-fns';
import { fr, enUS, arSA } from 'date-fns/locale';
import {
  fr as frDayPicker,
  enUS as enUSDayPicker,
  arSA as arSADayPicker,
} from 'react-day-picker/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useI18n } from '@/components/i18n-provider';
import type { Locale as I18nLocale } from '@/i18n-config';

const dateFnsLocales: Record<I18nLocale, Locale> = {
  fr,
  en: enUS,
  ar: arSA,
};

const dayPickerLocales: Record<I18nLocale, any> = {
  fr: frDayPicker,
  en: enUSDayPicker,
  ar: arSADayPicker,
};

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  id,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const { lang, dir } = useI18n();
  const [open, setOpen] = React.useState(false);
  const date = value ? new Date(value) : undefined;

  const dateFnsLocale = dateFnsLocales[lang];
  const dayPickerLocale = dayPickerLocales[lang];

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Use local date to avoid timezone issues
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      const day = String(newDate.getDate()).padStart(2, '0');
      const isoString = `${year}-${month}-${day}`;
      onChange?.(isoString);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          className={cn(
            'w-full justify-start text-start font-normal',
            !date && 'text-muted-foreground',
            className
          )}
          dir={dir}
        >
          <CalendarIcon
            className={cn(dir === 'rtl' ? 'ml-2' : 'mr-2', 'size-4')}
          />
          {date ? (
            format(date, 'PPP', { locale: dateFnsLocale as any })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" dir={dir}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date}
          locale={dayPickerLocale}
          dir={dir}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DatePickerRange({
  value,
  onChange,
  placeholder = 'Pick a date range',
  className,
  id,
}: {
  value?: { from?: string; to?: string };
  onChange?: (value: { from?: string; to?: string }) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const { lang, dir } = useI18n();
  const [open, setOpen] = React.useState(false);
  const dateRange = React.useMemo(() => {
    if (!value) return undefined;
    return {
      from: value.from ? new Date(value.from) : undefined,
      to: value.to ? new Date(value.to) : undefined,
    };
  }, [value]);

  const dateFnsLocale = dateFnsLocales[lang];
  const dayPickerLocale = dayPickerLocales[lang];

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    const isoRange = {
      from: range?.from
        ? `${range.from.getFullYear()}-${String(range.from.getMonth() + 1).padStart(2, '0')}-${String(range.from.getDate()).padStart(2, '0')}`
        : undefined,
      to: range?.to
        ? `${range.to.getFullYear()}-${String(range.to.getMonth() + 1).padStart(2, '0')}-${String(range.to.getDate()).padStart(2, '0')}`
        : undefined,
    };
    onChange?.(isoRange);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          className={cn(
            'w-full justify-start text-start font-normal',
            !dateRange?.from && 'text-muted-foreground',
            className
          )}
          dir={dir}
        >
          <CalendarIcon
            className={cn(dir === 'rtl' ? 'ml-2' : 'mr-2', 'size-4')}
          />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, 'LLL dd, y', {
                  locale: dateFnsLocale as Locale,
                })}{' '}
                -{' '}
                {format(dateRange.to, 'LLL dd, y', {
                  locale: dateFnsLocale as Locale,
                })}
              </>
            ) : (
              format(dateRange.from, 'LLL dd, y', {
                locale: dateFnsLocale as Locale,
              })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" dir={dir}>
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          defaultMonth={dateRange?.from}
          numberOfMonths={2}
          locale={dayPickerLocale}
          dir={dir}
        />
      </PopoverContent>
    </Popover>
  );
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Pick a date and time',
  className,
  id,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) {
  const { lang, dir } = useI18n();
  const [open, setOpen] = React.useState(false);
  const date = value ? new Date(value) : undefined;

  const dateFnsLocale = dateFnsLocales[lang];
  const dayPickerLocale = dayPickerLocales[lang];

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      // Preserve the time from the existing value if available
      const existingTime = value ? new Date(value) : new Date();
      newDate.setHours(
        existingTime.getHours(),
        existingTime.getMinutes(),
        existingTime.getSeconds()
      );
      // Use local time and convert to ISO string for datetime-local input (with seconds)
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      const day = String(newDate.getDate()).padStart(2, '0');
      const hours = String(newDate.getHours()).padStart(2, '0');
      const minutes = String(newDate.getMinutes()).padStart(2, '0');
      const seconds = String(newDate.getSeconds()).padStart(2, '0');
      const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      onChange?.(isoString);
      setOpen(false);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    if (date && timeValue) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      const year = newDate.getFullYear();
      const month = String(newDate.getMonth() + 1).padStart(2, '0');
      const day = String(newDate.getDate()).padStart(2, '0');
      const hoursStr = String(newDate.getHours()).padStart(2, '0');
      const minutesStr = String(newDate.getMinutes()).padStart(2, '0');
      const secondsStr = String(newDate.getSeconds()).padStart(2, '0');
      const isoString = `${year}-${month}-${day}T${hoursStr}:${minutesStr}:${secondsStr}`;
      onChange?.(isoString);
    }
  };

  const formatDateTimeDisplay = (date: Date | undefined) => {
    if (!date) return placeholder;
    return (
      format(date, 'PPP', { locale: dateFnsLocale as any }) +
      ' at ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className={cn('flex gap-2', className)} dir={dir}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className={cn(
              'flex-1 justify-start text-start font-normal',
              !date && 'text-muted-foreground'
            )}
            dir={dir}
          >
            <CalendarIcon
              className={cn(dir === 'rtl' ? 'ml-2' : 'mr-2', 'size-4')}
            />
            {formatDateTimeDisplay(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" dir={dir}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            defaultMonth={date}
            locale={dayPickerLocale}
            dir={dir}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        step="1"
        value={date ? date.toTimeString().slice(0, 8) : ''}
        onChange={handleTimeChange}
        className="w-32"
      />
    </div>
  );
}
