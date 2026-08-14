// lib/notifications.js
// Turns a medicine's schedule (from lib/schedule.js) into actual local
// notifications on the phone. "Local" means scheduled entirely on-device —
// no server, no push tokens — which fits the app's local-only v1 design
// (see docs/SDLC.md).
//
// Daily and weekly medicines use notifications that repeat forever on
// their own once scheduled — the OS handles that, we never touch them
// again until the medicine is edited or deleted.
//
// Interval medicines ("every N days") can't repeat that way, since the OS
// only understands "every day" or "every week," not "every N days." So we
// schedule the next few upcoming doses as one-off notifications, and
// `topUpInterval` (called each time the app opens) tops that queue back
// up — meaning interval reminders stay accurate as long as you open the
// app at least occasionally, which is a reasonable ask for a pet meds app.

import * as Notifications from "expo-notifications";
import { getNextDoseDate } from "./schedule";

const REMINDER_TIMES = {
  morning: { label: "Morning", hour: 8, minute: 0 },
  midday: { label: "Midday", hour: 12, minute: 0 },
  evening: { label: "Evening", hour: 18, minute: 0 },
  night: { label: "Night", hour: 21, minute: 0 },
};

export { REMINDER_TIMES };

// How this behaves when a notification arrives while the app is open —
// without this, foreground notifications are silent by default.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Checks the current permission status without ever showing the system
// prompt — safe to call anytime, e.g. on app startup.
export async function hasNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

// Shows the system permission prompt, but only the first time — iOS and
// Android both remember a prior answer and skip straight to returning it
// on every call after that, so it's safe to call this before every save.
export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Expo's weekly trigger numbers weekdays 1 (Sunday) through 7 (Saturday);
// our WEEK_DAYS array is 0 (Sun) through 6 (Sat) — this bridges the two.
function toExpoWeekday(weekDayIndex) {
  return weekDayIndex + 1;
}

async function scheduleOne(medicine, trigger) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${medicine.name} is due`,
      body: medicine.dosage ? `Give ${medicine.dosage}` : "Time for a dose",
    },
    trigger,
  });
}

// Cancels whatever this medicine was previously scheduled to send, then
// schedules fresh notifications matching its current fields. Called
// whenever a medicine is saved, and every time the app starts (to keep
// interval medicines topped up). Returns the new list of notification ids
// to store on the medicine record, so we know what to cancel next time.
export async function rescheduleForMedicine(medicine, weekDayIndexes) {
  if (medicine.notificationIds?.length) {
    await Promise.all(
      medicine.notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id))
    );
  }

  const time = REMINDER_TIMES[medicine.reminderTime] ?? REMINDER_TIMES.morning;
  const ids = [];

  if (medicine.frequencyType === "daily") {
    ids.push(
      await scheduleOne(medicine, {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      })
    );
  } else if (medicine.frequencyType === "weekly") {
    for (const day of medicine.weeklyDays) {
      const weekday = toExpoWeekday(weekDayIndexes.indexOf(day));
      ids.push(
        await scheduleOne(medicine, {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: time.hour,
          minute: time.minute,
        })
      );
    }
  } else if (medicine.frequencyType === "interval") {
    // Queue up the next 4 occurrences rather than just 1, so reminders
    // keep firing even if the app isn't reopened for a little while.
    const intervalMs = medicine.intervalDays * 24 * 60 * 60 * 1000;
    let cursor = getNextDoseDate(medicine);
    let fireDate = new Date(cursor);
    fireDate.setHours(time.hour, time.minute, 0, 0);

    // getNextDoseDate only reasons in whole days, so "today" can still
    // land at a clock time that's already passed (e.g. it's evening and
    // the reminder time is morning) — a one-off notification can't be
    // scheduled for a moment already in the past, so skip forward a
    // cycle until the very first one is genuinely still ahead of now.
    while (fireDate <= new Date()) {
      cursor = new Date(cursor.getTime() + intervalMs);
      fireDate = new Date(cursor);
      fireDate.setHours(time.hour, time.minute, 0, 0);
    }

    for (let i = 0; i < 4; i++) {
      ids.push(
        await scheduleOne(medicine, {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireDate,
        })
      );
      cursor = new Date(cursor.getTime() + intervalMs);
      fireDate = new Date(cursor);
      fireDate.setHours(time.hour, time.minute, 0, 0);
    }
  }

  return ids;
}

export async function cancelForMedicine(medicine) {
  if (!medicine.notificationIds?.length) return;
  await Promise.all(
    medicine.notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id))
  );
}

// Vaccines get one one-off reminder for their next-due date, rather than a
// repeating schedule — there's no "every N days" here, just a single date
// that changes each time a booster is logged.
export async function rescheduleForVaccine(vaccine) {
  if (vaccine.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(vaccine.notificationId);
  }

  const time = REMINDER_TIMES[vaccine.reminderTime] ?? REMINDER_TIMES.morning;
  const fireDate = new Date(vaccine.nextDueDate);
  fireDate.setHours(time.hour, time.minute, 0, 0);

  // A due date already in the past can't be scheduled as a future
  // reminder — better to skip it than crash or fire immediately.
  if (fireDate <= new Date()) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${vaccine.name} vaccine is due`,
      body: "Time to book your pet's next vaccination.",
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate },
  });
}

export async function cancelForVaccine(vaccine) {
  if (!vaccine.notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(vaccine.notificationId);
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Mollycoddle test",
      body: "If you see this, reminders are working.",
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
}
