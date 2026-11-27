import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { dateKey, eventDate, eventDayKey, eventInstant } from '../utils/event-agenda';

export function useEventDay() {
  const [today, setToday] = useState(() => eventDayKey());
  useFocusEffect(useCallback(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      const current = eventDayKey();
      setToday(current);
      const tomorrow = eventDate(current);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const midnight = eventInstant(dateKey(tomorrow), '00:00');
      timer = setTimeout(update, midnight ? Math.max(1000, midnight.getTime() - Date.now()) : 60_000);
    };
    update();
    return () => clearTimeout(timer);
  }, []));
  return today;
}
