// components/DoseHistoryModal.js
// A simple timeline of doses actually given for one pet, newest first.
// Opens on top of the pet detail sheet the same way the medicine form
// does — see PetDetailModal.js for why only one Modal is ever visible.

import React from "react";
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { COLORS } from "../theme";

function formatGivenAt(timestamp) {
  const date = new Date(timestamp);
  const datePart = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timePart = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart} at ${timePart}`;
}

export default function DoseHistoryModal({ visible, petName, logs, medicinesById, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.sheet}>
          <Text style={styles.title}>{petName}'s dose history</Text>

          {logs.length === 0 ? (
            <Text style={styles.emptyText}>
              No doses logged yet. Tap the circle next to a medicine to mark it given.
            </Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.row}>
                <Text style={styles.medicineName}>
                  {medicinesById[log.medicineId]?.name ?? "Deleted medicine"}
                </Text>
                <Text style={styles.givenAt}>{formatGivenAt(log.givenAt)}</Text>
              </View>
            ))
          )}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(30, 42, 32, 0.4)",
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 16,
    textAlign: "center",
  },
  emptyText: {
    color: COLORS.inkSoft,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.ink,
  },
  givenAt: {
    fontSize: 13,
    color: COLORS.inkSoft,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeButtonText: {
    color: COLORS.inkSoft,
    fontWeight: "600",
  },
});
