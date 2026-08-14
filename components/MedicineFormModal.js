// components/MedicineFormModal.js
// Add or edit a medicine/supplement for a pet. Same shared-form pattern as
// PetFormModal: one component handles both jobs, switching on whether a
// `medicine` was passed in.
//
// Frequency is kept simple on purpose — daily, weekly (pick the days), or
// every N days — paired with a reminder time of day picked from a handful
// of presets (see lib/notifications.js), rather than an exact hour:minute.

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
import { COLORS } from "../theme";
import { WEEK_DAYS } from "../lib/weekDays";
import { REMINDER_TIMES, requestNotificationPermission, sendTestNotification } from "../lib/notifications";
import { formatDate } from "../lib/vaccineSchedule";

const FREQUENCY_OPTIONS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "interval", label: "Every few days" },
];

export default function MedicineFormModal({ visible, medicine, onClose, onSave, onDelete }) {
  const isEditing = !!medicine;

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequencyType, setFrequencyType] = useState("daily");
  const [weeklyDays, setWeeklyDays] = useState([]);
  const [intervalDays, setIntervalDays] = useState("");
  const [reminderTime, setReminderTime] = useState("morning");
  const [expirationDate, setExpirationDate] = useState(null);
  const [showExpirationPicker, setShowExpirationPicker] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (visible) {
      setName(medicine?.name ?? "");
      setDosage(medicine?.dosage ?? "");
      setFrequencyType(medicine?.frequencyType ?? "daily");
      setWeeklyDays(medicine?.weeklyDays ?? []);
      setIntervalDays(medicine?.intervalDays ? String(medicine.intervalDays) : "");
      setReminderTime(medicine?.reminderTime ?? "morning");
      setExpirationDate(medicine?.expirationDate ?? null);
      setShowExpirationPicker(false);
      setNotes(medicine?.notes ?? "");
    }
  }, [visible, medicine]);

  function handleExpirationPicked(event, selectedDate) {
    // Android's picker is a transient dialog that closes itself on its
    // own; iOS's inline picker stays open until "Done" is tapped below.
    if (Platform.OS === "android") setShowExpirationPicker(false);
    if (event.type === "dismissed" || !selectedDate) return;
    setExpirationDate(selectedDate.getTime());
  }

  function toggleWeeklyDay(day) {
    setWeeklyDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    );
  }

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Give the medicine or supplement a name before saving.");
      return;
    }
    if (frequencyType === "weekly" && weeklyDays.length === 0) {
      Alert.alert("Pick at least one day", "Choose which day(s) of the week this is given.");
      return;
    }
    const parsedInterval = parseInt(intervalDays, 10);
    if (frequencyType === "interval" && (!parsedInterval || parsedInterval < 1)) {
      Alert.alert("Enter a valid interval", "How many days between doses? e.g. 3");
      return;
    }

    onSave({
      name: trimmedName,
      dosage: dosage.trim(),
      frequencyType,
      weeklyDays: frequencyType === "weekly" ? weeklyDays : [],
      intervalDays: frequencyType === "interval" ? parsedInterval : null,
      reminderTime,
      expirationDate,
      notes: notes.trim(),
    });
  }

  async function handleTestNotification() {
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(
        "Notifications are off",
        "Mollycoddle can't send reminders without permission. You can enable this in your phone's Settings app."
      );
      return;
    }
    await sendTestNotification();
    Alert.alert("Test sent", "A test notification will arrive in about 5 seconds.");
  }

  function handleDelete() {
    Alert.alert("Remove medicine?", `This will remove ${medicine.name} and can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onDelete(medicine.id) },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{isEditing ? "Edit medicine" : "Add medicine"}</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Heartgard"
            placeholderTextColor={COLORS.inkSoft}
            autoFocus={!isEditing}
          />

          <Text style={styles.label}>Dosage</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g. 1 tablet, 5mg"
            placeholderTextColor={COLORS.inkSoft}
          />

          <Text style={styles.label}>Expiration date (optional)</Text>
          <Pressable style={styles.dateInput} onPress={() => setShowExpirationPicker(true)}>
            <Text style={styles.dateInputText}>
              {expirationDate ? formatDate(expirationDate) : "Not set"}
            </Text>
          </Pressable>
          {expirationDate && (
            <Pressable onPress={() => setExpirationDate(null)} style={styles.quickLink}>
              <Text style={styles.quickLinkText}>Clear expiration date</Text>
            </Pressable>
          )}
          {showExpirationPicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={new Date(expirationDate ?? Date.now())}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleExpirationPicked}
              />
              {Platform.OS === "ios" && (
                <Pressable onPress={() => setShowExpirationPicker(false)} style={styles.doneButton}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              )}
            </View>
          )}

          <Text style={styles.label}>Frequency</Text>
          <View style={styles.chipRow}>
            {FREQUENCY_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                style={[styles.chip, frequencyType === option.key && styles.chipSelected]}
                onPress={() => setFrequencyType(option.key)}
              >
                <Text
                  style={[
                    styles.chipText,
                    frequencyType === option.key && styles.chipTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {frequencyType === "weekly" && (
            <View style={styles.chipRow}>
              {WEEK_DAYS.map((day) => (
                <Pressable
                  key={day}
                  style={[styles.dayChip, weeklyDays.includes(day) && styles.chipSelected]}
                  onPress={() => toggleWeeklyDay(day)}
                >
                  <Text
                    style={[styles.chipText, weeklyDays.includes(day) && styles.chipTextSelected]}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {frequencyType === "interval" && (
            <View style={styles.intervalRow}>
              <Text style={styles.intervalLabel}>Every</Text>
              <TextInput
                style={styles.intervalInput}
                value={intervalDays}
                onChangeText={setIntervalDays}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor={COLORS.inkSoft}
              />
              <Text style={styles.intervalLabel}>days</Text>
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
          <Pressable onPress={handleTestNotification} style={styles.testLink}>
            <Text style={styles.testLinkText}>Send a test notification</Text>
          </Pressable>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional — e.g. give with food"
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
              <Text style={styles.deleteButtonText}>Remove medicine</Text>
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
  dayChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
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
  testLink: {
    marginBottom: 16,
  },
  testLinkText: {
    color: COLORS.moss,
    fontSize: 13,
    fontWeight: "600",
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  intervalLabel: {
    fontSize: 15,
    color: COLORS.ink,
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    color: COLORS.ink,
    width: 64,
    textAlign: "center",
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
