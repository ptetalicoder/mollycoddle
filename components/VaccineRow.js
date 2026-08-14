// components/VaccineRow.js
// One line in a pet's vaccination list. Tapping it opens the edit form —
// same pattern as MedicineRow, but with an "overdue" state medicines don't
// have (a vaccine can genuinely be past due, not just "due today").

import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme";
import { describeVaccineStatus, isOverdue } from "../lib/vaccineSchedule";

export default function VaccineRow({ vaccine, onPress }) {
  const statusText = describeVaccineStatus(vaccine);
  const overdue = isOverdue(vaccine);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.name} numberOfLines={1}>
        {vaccine.name}
      </Text>
      <Text style={styles.detail} numberOfLines={1}>
        {vaccine.documentName ? `Record attached` : "No record attached"}
      </Text>
      <Text style={[styles.status, overdue && styles.statusOverdue]}>{statusText}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  status: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.inkSoft,
    marginTop: 4,
  },
  statusOverdue: {
    color: COLORS.danger,
  },
});
