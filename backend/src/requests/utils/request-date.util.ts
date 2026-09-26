import { BadRequestException } from '@nestjs/common';

const BUSINESS_TIME_ZONE = 'America/Panama';

export function currentBusinessDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

export function validateRequestDates(
  requestDate?: string,
  deadline?: string | null,
  today = currentBusinessDate(),
): void {
  if (requestDate && !isCalendarDate(requestDate)) {
    throw new BadRequestException('La fecha de solicitud debe ser una fecha válida');
  }
  if (deadline && !isCalendarDate(deadline)) {
    throw new BadRequestException('La fecha límite debe ser una fecha válida');
  }
  if (requestDate && requestDate > today) {
    throw new BadRequestException('La fecha de solicitud no puede ser posterior a hoy');
  }
  if (deadline && deadline < today) {
    throw new BadRequestException('La fecha límite no puede ser anterior a hoy');
  }
}
