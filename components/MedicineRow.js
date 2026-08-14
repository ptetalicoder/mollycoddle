// components/MedicineRow.js
// One line in a pet's medicine list. Tapping the name/details opens the
// edit form; tapping the circle on the right marks (or unmarks) today's
// dose as given — two separate tap targets sharing one row.

import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme";
import { describeFrequency } from "../lib/medicineStorage";
import { describeNextDose } from "../lib/schedule";
import { describeExpiration, isExpired } from "../lib/medicineExpiry";

export default function MedicineRow({ medicine, givenToday, onPress, onToggleGiven }) {
  const dueText = describeNextDose(medicine);
  const dueToday = dueText === "Due today";
  const statusText = dueToday && givenToday ? "Given today" : dueText;
  const expirationText = describeExpiration(medicine);
  const expired = isExpired(medicine);

  return (
    <View style={styles.row}>
      <Pressable style={styles.info} onPress={onPress}>
        <Text style={styles.name} numberOfLines={1}>
          {medicine.name}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {[medicine.dosage, describeFrequency(medicine)].filter(Boolean).join(" · ")}
        </Text>
        <Text style={[styles.dueBadge, dueToday && styles.dueBadgeToday]}>{statusText}</Text>
        {expirationText && (
          <Text style={[styles.expiration, expired && styles.expirationExpired]}>
            {expirationText}
          </Text>
        )}
      </Pressable>
      <Pressable
        style={[styles.checkCircle, givenToday && styles.checkCircleFilled]}
        onPress={onToggleGiven}
        hitSlop={8}
      >
        {givenToday && <Text style={styles.checkMark}>✓</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  info: {
    flexShrink: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.ink,
  },
  detail: {
    fontSize: 13,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  dueBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.inkSoft,
    marginTop: 4,
  },
  dueBadgeToday: {
    color: COLORS.moss,
  },
  expiration: {
    fontSize: 12,
    color: COLORS.inkSoft,
    marginTop: 1,
  },
  expirationExpired: {
    color: COLORS.danger,
    fontWeight: "600",
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleFilled: {
    backgroundColor: COLORS.moss,
    borderColor: COLORS.moss,
  },
  checkMark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
