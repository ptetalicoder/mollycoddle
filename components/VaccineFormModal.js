// components/VaccineFormModal.js
// Add or edit a vaccination record for a pet. Same shared-form pattern as
// the other forms: one component for both add and edit, switching on
// whether a `vaccine` was passed in.
//
// Dates need a real calendar picker (unlike medicine reminder times, which
// are fine as a handful of presets) since "date given" and "next due" can
// be any day — this is the first form in the app to use
// @react-native-community/datetimepicker.
//
// A PDF record can be attached for reference (via expo-document-picker).
// Bulk-extracting several vaccines from a PDF at once is a separate flow
// — see VaccineImportModal.js — since reviewing a list is a better fit for
// "here are 4 vaccines, which do you want" than repeating this one-at-a-
// time form.

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { COLORS } from "../theme";
import { REMINDER_TIMES } from "../lib/notifications";
import { formatDate } from "../lib/vaccineSchedule";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export default function VaccineFormModal({ visible, vaccine, onClose, onSave, onDelete }) {
  const isEditing = !!vaccine;

  const [name, setName] = useState("");
  const [dateGiven, setDateGiven] = useState(Date.now());
  const [nextDueDate, setNextDueDate] = useState(Date.now() + ONE_YEAR_MS);
  const [reminderTime, setReminderTime] = useState("morning");
  const [notes, setNotes] = useState("");
  const [documentUri, setDocumentUri] = useState(null);
  const [documentName, setDocumentName] = useState(null);
  const [pickerField, setPickerField] = useState(null); // "given" | "due" | null

  useEffect(() => {
    if (visible) {
      const now = Date.now();
      setName(vaccine?.name ?? "");
      setDateGiven(vaccine?.dateGiven ?? now);
      setNextDueDate(vaccine?.nextDueDate ?? now + ONE_YEAR_MS);
      setReminderTime(vaccine?.reminderTime ?? "morning");
      setNotes(vaccine?.notes ?? "");
      setDocumentUri(vaccine?.documentUri ?? null);
      setDocumentName(vaccine?.documentName ?? null);
      setPickerField(null);
    }
  }, [visible, vaccine]);

  async function handleAttachDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    setDocumentUri(file.uri);
    setDocumentName(file.name);
  }

  function handleRemoveDocument() {
    setDocumentUri(null);
    setDocumentName(null);
  }

  function handleDatePicked(event, selectedDate) {
    const field = pickerField;
    // Android's picker is a transient dialog that closes itself on its
    // own; iOS's inline picker stays open until "Done" is tapped below.
    if (Platform.OS === "android") setPickerField(null);
    if (event.type === "dismissed" || !selectedDate) return;
    if (field === "given") {
      setDateGiven(selectedDate.getTime());
    } else {
      setNextDueDate(selectedDate.getTime());
    }
  }

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Give the vaccine a name before saving.");
      return;
    }
    onSave({
      name: trimmedName,
      dateGiven,
      nextDueDate,
      reminderTime,
      notes: notes.trim(),
      documentUri,
      documentName,
    });
  }

  function handleDelete() {
    Alert.alert(
      "Remove vaccination record?",
      `This will remove ${vaccine.name} and can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => onDelete(vaccine.id) },
      ]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{isEditing ? "Edit vaccination" : "Add vaccination"}</Text>

          <Text style={styles.label}>Vaccine name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rabies"
            placeholderTextColor={COLORS.inkSoft}
            autoFocus={!isEditing}
          />

          <Text style={styles.label}>Date given</Text>
          <Pressable style={styles.dateInput} onPress={() => setPickerField("given")}>
            <Text style={styles.dateInputText}>{formatDate(dateGiven)}</Text>
          </Pressable>

          <Text style={styles.label}>Next due</Text>
          <Pressable style={styles.dateInput} onPress={() => setPickerField("due")}>
            <Text style={styles.dateInputText}>{formatDate(nextDueDate)}</Text>
          </Pressable>
          <Pressable
            onPress={() => setNextDueDate(dateGiven + ONE_YEAR_MS)}
            style={styles.quickLink}
          >
            <Text style={styles.quickLinkText}>Set to 1 year after given date</Text>
          </Pressable>

          {pickerField && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={new Date(pickerField === "given" ? dateGiven : nextDueDate)}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDatePicked}
              />
              {Platform.OS === "ios" && (
                <Pressable onPress={() => setPickerField(null)} style={styles.doneButton}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              )}
            </View>
          )}

          <Text style={styles.label}>Reminder time</Text>
          <View style={styles.chipRow}>
            {Object.entries(REMINDER_TIMES).map(([key, option]) => (
              <Pressable
                key={key}
                style={[styles.chip, reminderTime === key && styles.chipSelected]}
                onPress={() => setReminderTime(key)}
              >
                <Text style={[styles.chipText, reminderTime === key && styles.chipTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Record (optional)</Text>
          {documentName ? (
            <View style={styles.documentRow}>
              <Text style={styles.documentName} numberOfLines={1}>
                {documentName}
              </Text>
              <Pressable onPress={handleRemoveDocument}>
                <Text style={styles.removeDocumentText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.attachButton} onPress={handleAttachDocument}>
              <Text style={styles.attachButtonText}>+ Attach PDF record</Text>
            </Pressable>
          )}

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            placeholderTextColor={COLORS.inkSoft}
            multiline
          />

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>

          {isEditing && (
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Remove record</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.moss,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  dateInputText: {
    fontSize: 16,
    color: COLORS.ink,
  },
  quickLink: {
    marginBottom: 16,
  },
  quickLinkText: {
    color: COLORS.moss,
    fontSize: 13,
    fontWeight: "600",
  },
  pickerWrap: {
    marginBottom: 16,
  },
  doneButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneButtonText: {
    color: COLORS.moss,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: COLORS.moss,
    borderColor: COLORS.moss,
  },
  chipText: {
    color: COLORS.inkSoft,
    fontSize: 14,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  documentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  documentName: {
    flexShrink: 1,
    color: COLORS.ink,
    fontSize: 14,
    marginRight: 10,
  },
  removeDocumentText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "600",
  },
  attachButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  attachButtonText: {
    color: COLORS.moss,
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.inkSoft,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: COLORS.moss,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  deleteButton: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontWeight: "600",
  },
});
