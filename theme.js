// theme.js
// Shared colors used across every screen. Pulling this out of App.js means
// any component in the app can `import { COLORS } from "./theme"` and stay
// visually consistent, instead of every file inventing its own hex codes.

export const COLORS = {
  bg: "#F1F4EE",
  card: "#FFFFFF",
  border: "#DDE3D8",
  ink: "#1E2A20",
  inkSoft: "#4B5A4D",
  moss: "#37503E",
  amber: "#E7A33B",
  danger: "#C1462F",
};

// A small rotation of colors for icon avatars (used when a pet has no
// photo). Picking a color based on the pet's name means the same pet
// always gets the same color, instead of it changing randomly every time.
export const AVATAR_COLORS = ["#37503E", "#E7A33B", "#5B7FBA", "#B2554D", "#7A5FA6", "#3E8E7E"];

export function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
