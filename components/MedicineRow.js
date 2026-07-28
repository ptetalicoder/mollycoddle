// components/MedicineRow.js
// One line in a pet's medicine list. Tapping it opens the edit form —
// there's no separate "view" screen for a medicine, since name + dosage +
// frequency is already the whole picture at this stage.

import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme";
import { describeFrequency } from "../lib/medicineStorage";
import { describeNextDose } from "../lib/schedule";

export default function MedicineRow({ medicine, onPress }) {
  const dueText = describeNextDose(medicine);
  const dueToday = dueText === "Due today";

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.info}>
        <Text style={styles.name}>{medicine.name}</Text>
        <Text style={styles.detail}>
          {[medicine.dosage, describeFrequency(medicine)].filter(Boolean).join(" · ")}
        </Text>
      </View>
      <Text style={[styles.dueBadge, dueToday && styles.dueBadgeToday]}>{dueText}</Text>
    </Pressable>
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
  },
  dueBadgeToday: {
    color: COLORS.moss,
  },
});
