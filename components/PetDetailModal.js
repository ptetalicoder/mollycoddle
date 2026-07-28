// components/PetDetailModal.js
// What you see when you tap a pet in the list. Right now it's just a
// profile card — medicine schedules and dose history get added here in
// later steps (see docs/SDLC.md).

import React from "react";
import { Modal, View, Text, Pressable, StyleSheet, Alert } from "react-native";
import PetAvatar from "./PetAvatar";
import { COLORS } from "../theme";

export default function PetDetailModal({ pet, onClose, onEdit, onDelete }) {
  if (!pet) return null;

  function handleDelete() {
    Alert.alert("Remove pet?", `This will remove ${pet.name} and can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onDelete(pet.id) },
    ]);
  }

  return (
    <Modal visible={!!pet} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <PetAvatar pet={pet} size={96} />
          <Text style={styles.name}>{pet.name}</Text>
          {!!pet.species && <Text style={styles.species}>{pet.species}</Text>}

          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Medicines & dose reminders for {pet.name} are coming in the next step.
            </Text>
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
        </View>
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
  placeholder: {
    marginTop: 20,
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    width: "100%",
  },
  placeholderText: {
    color: COLORS.inkSoft,
    fontSize: 14,
    textAlign: "center",
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
