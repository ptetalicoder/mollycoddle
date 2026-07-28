// components/PetDetailModal.js
// What you see when you tap a pet in the list: their profile plus their
// medicine/supplement list. Dose reminders and dose history come later
// (see docs/SDLC.md) — this screen is just where medicines get managed.

import React from "react";
import { Modal, View, Text, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import PetAvatar from "./PetAvatar";
import MedicineRow from "./MedicineRow";
import { COLORS } from "../theme";

export default function PetDetailModal({
  pet,
  medicines,
  hidden,
  onClose,
  onEdit,
  onDelete,
  onAddMedicine,
  onEditMedicine,
}) {
  if (!pet) return null;

  function handleDelete() {
    Alert.alert("Remove pet?", `This will remove ${pet.name} and can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onDelete(pet.id) },
    ]);
  }

  return (
    // Only one native Modal can safely be visible at a time — two stacked
    // <Modal>s (this one and the medicine form) can freeze touch handling.
    // So when the medicine form opens, `hidden` becomes true and this one
    // steps aside without forgetting which pet it was showing.
    <Modal visible={!!pet && !hidden} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          <View style={styles.profile}>
            <PetAvatar pet={pet} size={96} />
            <Text style={styles.name}>{pet.name}</Text>
            {!!pet.species && <Text style={styles.species}>{pet.species}</Text>}
          </View>

          <View style={styles.medicinesSection}>
            <View style={styles.medicinesHeader}>
              <Text style={styles.medicinesTitle}>Medicines</Text>
              <Pressable onPress={onAddMedicine}>
                <Text style={styles.addMedicineText}>+ Add</Text>
              </Pressable>
            </View>

            {medicines.length === 0 ? (
              <Text style={styles.emptyMedicinesText}>
                No medicines yet. Tap "+ Add" to add {pet.name}'s first one.
              </Text>
            ) : (
              medicines.map((medicine) => (
                <MedicineRow
                  key={medicine.id}
                  medicine={medicine}
                  onPress={() => onEditMedicine(medicine)}
                />
              ))
            )}
          </View>

          <Pressable style={styles.editButton} onPress={() => onEdit(pet)}>
            <Text style={styles.editButtonText}>Edit pet</Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Remove pet</Text>
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
  profile: {
    alignItems: "center",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.ink,
    marginTop: 14,
  },
  species: {
    fontSize: 14,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  medicinesSection: {
    marginTop: 20,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    width: "100%",
  },
  medicinesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  medicinesTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
  },
  addMedicineText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.moss,
  },
  emptyMedicinesText: {
    color: COLORS.inkSoft,
    fontSize: 14,
    paddingVertical: 10,
  },
  editButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: COLORS.moss,
    marginBottom: 10,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  closeButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  closeButtonText: {
    color: COLORS.inkSoft,
    fontWeight: "600",
  },
  deleteButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: "600",
  },
});
