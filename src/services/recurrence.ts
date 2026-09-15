import { RecurrenceRule } from '../types';

export function calculateNextOccurrence(currentDateStr: string, rule: RecurrenceRule): string | null {
  if (rule.type === 'NONE') return null;

  const current = new Date(currentDateStr + 'T00:00:00');
  const next = new Date(current);

  switch (rule.type) {
    case 'DAILY':
      next.setDate(next.getDate() + (rule.interval || 1));
      break;

    case 'EVERY_N_DAYS':
      next.setDate(next.getDate() + (rule.interval || 1));
      break;

    case 'WEEKLY':
    case 'EVERY_N_WEEKS': {
      const days = rule.daysOfWeek || [];
      if (days.length === 0) {
        next.setDate(next.getDate() + 7 * (rule.interval || 1));
      } else {
        // Find next day in the week
        let found = false;
        const candidate = new Date(current);
        for (let i = 1; i <= 7; i++) {
          candidate.setDate(candidate.getDate() + 1);
          // JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat
          // Rule daysOfWeek: 1=Mon .. 7=Sun
          const jsDay = candidate.getDay();
          const ruleDay = jsDay === 0 ? 7 : jsDay;
          if (days.includes(ruleDay)) {
            next.setTime(candidate.getTime());
            found = true;
            break;
          }
        }
        if (!found) {
          next.setDate(next.getDate() + 7 * (rule.interval || 1));
        }
      }
      break;
    }

    case 'WEEKDAY_MASK': {
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      break;
    }

    case 'MONTHLY': {
      const targetDay = rule.dayOfMonth || current.getDate();
      next.setMonth(next.getMonth() + (rule.interval || 1));
      // Clamp to month length
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(targetDay, daysInMonth));
      break;
    }

    case 'YEARLY':
      next.setFullYear(next.getFullYear() + (rule.interval || 1));
      break;
  }

  const resultStr = next.toISOString().split('T')[0];
  if (rule.endDate && resultStr > rule.endDate) {
    return null;
  }
  return resultStr;
}
