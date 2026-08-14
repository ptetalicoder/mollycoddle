// components/MedicineImportModal.js
// Bulk import: take a photo of a prescription label, vet discharge
// summary, or supplement bottle (or attach a PDF), let Claude read every
// medicine it can find in one pass, then review the whole list at once —
// uncheck anything wrong or unwanted, and add the rest in a single tap.
// Same pattern as VaccineImportModal.js.
//
// If a found medicine's name matches one you already have on file for
// this pet, it defaults to *updating* that record's dosage/frequency (the
// common case: you photograph a renewed prescription with a changed dose)
// instead of creating a duplicate — tap the note under a matched row to
// switch it to "add as new" if the match is wrong.
//
// The app's medicine model only supports one reminder per day — there's
// no "twice daily" concept, for extracted medicines any more than for ones
// you type in yourself. Claude sets those to a daily reminder and puts the
// exact wording (e.g. "twice daily", "give with food") in notes instead.

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../theme";
import { extractFromFile, parseLocalDate } from "../lib/documentExtraction";
import { describeFrequency } from "../lib/medicineStorage";
import { formatDate } from "../lib/vaccineSchedule";

function findExistingMatch(name, existingMedicines) {
  const normalized = name.trim().toLowerCase();
  return existingMedicines.find((m) => m.name.trim().toLowerCase() === normalized) ?? null;
}

export default function MedicineImportModal({ visible, existingMedicines, onClose, onImport }) {
  const [documentName, setDocumentName] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [found, setFound] = useState(null); // null = not extracted yet
  const [selected, setSelected] = useState({}); // index -> boolean (include it?)
  const [updateMode, setUpdateMode] = useState({}); // index -> boolean (update match vs add new)

  useEffect(() => {
    if (visible) {
      setDocumentName(null);
      setExtracting(false);
      setFound(null);
      setSelected({});
      setUpdateMode({});
    }
  }, [visible]);

  async function handleAttachPdf() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    setDocumentName(file.name);
    await runExtraction(file.uri, "application/pdf");
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera access needed",
        "Mollycoddle needs camera permission to photograph a medicine label."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    const photo = result.assets[0];
    const mediaType = photo.mimeType || "image/jpeg";
    setDocumentName(`Photo — ${new Date().toLocaleDateString()}`);
    await runExtraction(photo.uri, mediaType);
  }

  async function runExtraction(uri, mediaType) {
    setExtracting(true);
    setFound(null);
    try {
      const medicines = await extractFromFile(uri, mediaType, "medicines");
      const parsed = medicines.map((m) => {
        const name = m.name || "Unnamed medicine";
        const match = findExistingMatch(name, existingMedicines);
        return {
          name,
          dosage: m.dosage || "",
          frequencyType: m.frequencyType === "interval" ? "interval" : "daily",
          intervalDays: m.frequencyType === "interval" ? m.intervalDays || 1 : null,
          expirationDate: parseLocalDate(m.expirationDate),
          notes: m.notes || "",
          matchedMedicineId: match?.id ?? null,
          matchedMedicineName: match?.name ?? null,
        };
      });
      setFound(parsed);
      // Everything starts checked, and any match starts in "update" mode —
      // you can flip either per row before importing.
      setSelected(Object.fromEntries(parsed.map((_, i) => [i, true])));
      setUpdateMode(Object.fromEntries(parsed.map((_, i) => [i, true])));
    } catch (error) {
      Alert.alert("Couldn't read this", error.message);
    } finally {
      setExtracting(false);
    }
  }

  function toggleSelected(index) {
    setSelected((current) => ({ ...current, [index]: !current[index] }));
  }

  function toggleUpdateMode(index) {
    setUpdateMode((current) => ({ ...current, [index]: !current[index] }));
  }

  function handleImport() {
    const chosen = found
      .filter((_, i) => selected[i])
      .map((item, i) => ({
        name: item.name,
        dosage: item.dosage,
        frequencyType: item.frequencyType,
        intervalDays: item.intervalDays,
        expirationDate: item.expirationDate,
        notes: item.notes,
        matchedMedicineId: item.matchedMedicineId && updateMode[i] ? item.matchedMedicineId : null,
      }));
    if (chosen.length === 0) {
      Alert.alert("Nothing selected", "Check at least one medicine to import.");
      return;
    }
    onImport(chosen);
  }

  const selectedCount = found ? found.filter((_, i) => selected[i]).length : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.sheet}>
          <Text style={styles.title}>Import medicines</Text>

          {!documentName && (
            <>
              <Text style={styles.helpText}>
                Take a photo of a prescription label or medicine list, or attach a PDF — Claude
                will pull out every medicine it can find, for you to review before adding.
              </Text>
              <Pressable style={styles.attachButton} onPress={handleTakePhoto}>
                <Text style={styles.attachButtonText}>📷 Take a photo</Text>
              </Pressable>
              <Pressable style={styles.attachButton} onPress={handleAttachPdf}>
                <Text style={styles.attachButtonText}>+ Attach PDF record</Text>
              </Pressable>
            </>
          )}

          {documentName && (
            <View style={styles.documentRow}>
              <Text style={styles.documentName} numberOfLines={1}>
                {documentName}
              </Text>
              <Pressable onPress={() => setDocumentName(null)}>
                <Text style={styles.changeText}>Change</Text>
              </Pressable>
            </View>
          )}

          {extracting && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.moss} />
              <Text style={styles.loadingText}>Reading…</Text>
            </View>
          )}

          {found && found.length === 0 && (
            <Text style={styles.helpText}>
              No medicines found. Try a clearer photo or a different file, or add one manually.
            </Text>
          )}

          {found && found.length > 0 && (
            <>
              <Text style={styles.label}>
                Found {found.length} medicine{found.length === 1 ? "" : "s"} — uncheck any you
                don't want
              </Text>
              {found.map((item, index) => (
                <View key={index} style={styles.medicineRow}>
                  <Pressable style={styles.medicineRowMain} onPress={() => toggleSelected(index)}>
                    <View style={[styles.checkbox, selected[index] && styles.checkboxChecked]}>
                      {selected[index] && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.medicineInfo}>
                      <Text style={styles.medicineName}>{item.name}</Text>
                      <Text style={styles.medicineDetail}>
                        {[item.dosage, describeFrequency(item)].filter(Boolean).join(" · ")}
                      </Text>
                      {item.expirationDate !== null && (
                        <Text style={styles.medicineDetail}>
                          Expires: {formatDate(item.expirationDate)}
                        </Text>
                      )}
                      {!!item.notes && (
                        <Text style={styles.medicineNotes} numberOfLines={2}>
                          {item.notes}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                  {item.matchedMedicineId && (
                    <Pressable onPress={() => toggleUpdateMode(index)} style={styles.matchNote}>
                      <Text style={styles.matchNoteText}>
                        {updateMode[index]
                          ? `↻ Updates existing "${item.matchedMedicineName}" — tap to add as new instead`
                          : "+ Will add as a new record — tap to update the existing one instead"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </>
          )}

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            {found && found.length > 0 && (
              <Pressable style={[styles.button, styles.importButton]} onPress={handleImport}>
                <Text style={styles.importButtonText}>Import {selectedCount}</Text>
              </Pressable>
            )}
          </View>
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
  helpText: {
    color: COLORS.inkSoft,
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  attachButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  attachButtonText: {
    color: COLORS.moss,
    fontSize: 14,
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
  changeText: {
    color: COLORS.moss,
    fontSize: 13,
    fontWeight: "600",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  loadingText: {
    color: COLORS.inkSoft,
    fontSize: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.moss,
    marginBottom: 10,
  },
  medicineRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  medicineRowMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.moss,
    borderColor: COLORS.moss,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.ink,
  },
  medicineDetail: {
    fontSize: 13,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  medicineNotes: {
    fontSize: 12,
    color: COLORS.inkSoft,
    marginTop: 2,
    fontStyle: "italic",
  },
  matchNote: {
    marginTop: 6,
    marginLeft: 36,
  },
  matchNoteText: {
    fontSize: 12,
    color: COLORS.moss,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
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
  importButton: {
    backgroundColor: COLORS.moss,
  },
  importButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
