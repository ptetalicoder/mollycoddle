// lib/weekDays.js
// Single source of truth for how we label and order days of the week, so
// the medicine form (where you pick days) and the scheduling math (which
// has to match Date.getDay()'s 0=Sun..6=Sat order) never disagree.

export const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
