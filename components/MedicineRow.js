// components/MedicineRow.js
// One line in a pet's medicine list. Tapping it opens the edit form —
// there's no separate "view" screen for a medicine, since name + dosage +
// frequency is already the whole picture at this stage.

import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme";
import { describeFrequency } from "../lib/medicineStorage";

export default function MedicineRow({ medicine, onPress }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.name}>{medicine.name}</Text>
      <Text style={styles.detail}>
        {[medicine.dosage, describeFrequency(medicine)].filter(Boolean).join(" · ")}
      </Text>
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
});
