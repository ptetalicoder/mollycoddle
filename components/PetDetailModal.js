// components/PetDetailModal.js
// What you see when you tap a pet in the list: their profile, their
// medicine/supplement list (with a quick "given today" toggle on each),
// their vaccination records, and a link into dose history.

import React from "react";
import { Modal, View, Text, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import PetAvatar from "./PetAvatar";
import MedicineRow from "./MedicineRow";
import VaccineRow from "./VaccineRow";
import { COLORS } from "../theme";

export default function PetDetailModal({
  pet,
  medicines,
  vaccines,
  givenTodayIds,
  hidden,
  onClose,
  onEdit,
  onDelete,
  onAddMedicine,
  onEditMedicine,
  onToggleGiven,
  onViewHistory,
  onImportMedicines,
  onAddVaccine,
  onEditVaccine,
  onImportVaccines,
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
    // <Modal>s (this one and the medicine form or history modal) can
    // freeze touch handling. So when either of those opens, `hidden`
    // becomes true and this one steps aside without forgetting which pet
    // it was showing.
    <Modal visible={!!pet && !hidden} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          <View style={styles.profile}>
            <PetAvatar pet={pet} size={96} />
            <Text style={styles.name}>{pet.name}</Text>
            {!!pet.species && <Text style={styles.species}>{pet.species}</Text>}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Medicines</Text>
              <Pressable onPress={onAddMedicine}>
                <Text style={styles.addText}>+ Add</Text>
              </Pressable>
            </View>

            {medicines.length === 0 ? (
              <Text style={styles.emptyText}>
                No medicines yet. Tap "+ Add" to add {pet.name}'s first one.
              </Text>
            ) : (
              medicines.map((medicine) => (
                <MedicineRow
                  key={medicine.id}
                  medicine={medicine}
                  givenToday={givenTodayIds.includes(medicine.id)}
                  onPress={() => onEditMedicine(medicine)}
                  onToggleGiven={() => onToggleGiven(medicine)}
                />
              ))
            )}

            {medicines.length > 0 && (
              <Pressable onPress={onViewHistory} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>View dose history</Text>
              </Pressable>
            )}
            <Pressable onPress={onImportMedicines} style={styles.linkButton}>
              <Text style={styles.linkButtonText}>Import from photo/PDF</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vaccinations</Text>
              <Pressable onPress={onAddVaccine}>
                <Text style={styles.addText}>+ Add</Text>
              </Pressable>
            </View>

            {vaccines.length === 0 ? (
              <Text style={styles.emptyText}>
                No vaccination records yet. Tap "+ Add" to add {pet.name}'s first one.
              </Text>
            ) : (
              vaccines.map((vaccine) => (
                <VaccineRow
                  key={vaccine.id}
                  vaccine={vaccine}
                  onPress={() => onEditVaccine(vaccine)}
                />
              ))
            )}

            <Pressable onPress={onImportVaccines} style={styles.linkButton}>
              <Text style={styles.linkButtonText}>Import from photo/PDF</Text>
            </Pressable>
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
  section: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    width: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.ink,
  },
  addText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.moss,
  },
  emptyText: {
    color: COLORS.inkSoft,
    fontSize: 14,
    paddingVertical: 10,
  },
  linkButton: {
    marginTop: 8,
    alignItems: "center",
  },
  linkButtonText: {
    color: COLORS.moss,
    fontSize: 13,
    fontWeight: "600",
  },
  editButton: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: COLORS.moss,
    marginTop: 24,
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
