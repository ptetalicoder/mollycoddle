// components/VaccineImportModal.js
// Bulk import: take a photo of a vaccination sheet (or attach a PDF), let
// Claude read every vaccine it can find in one pass, then review the whole
// list at once — uncheck anything wrong or unwanted, and add the rest in a
// single tap. This replaces having to re-attach the same document over and
// over to pull vaccines out one at a time.
//
// If a found vaccine's name matches one you already have on file for this
// pet, it defaults to *updating* that record's dates (the common case: you
// photograph an updated card after a booster) instead of creating a
// duplicate — tap the note under a matched row to switch it to "add as new"
// if the match is wrong.
//
// This screen only picks *which* extracted vaccines to keep and whether
// each updates or adds — it doesn't let you edit individual fields. If a
// date needs fixing after import, open that vaccine from the list and edit
// it normally.

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
import { extractVaccinesFromFile, parseLocalDate } from "../lib/vaccineExtraction";
import { formatDate as formatKnownDate } from "../lib/vaccineSchedule";

function formatDate(timestamp) {
  return timestamp === null ? "No date found" : formatKnownDate(timestamp);
}

function findExistingMatch(name, existingVaccines) {
  const normalized = name.trim().toLowerCase();
  return existingVaccines.find((v) => v.name.trim().toLowerCase() === normalized) ?? null;
}

export default function VaccineImportModal({ visible, existingVaccines, onClose, onImport }) {
  const [documentUri, setDocumentUri] = useState(null);
  const [documentName, setDocumentName] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [found, setFound] = useState(null); // null = not extracted yet
  const [selected, setSelected] = useState({}); // index -> boolean (include it?)
  const [updateMode, setUpdateMode] = useState({}); // index -> boolean (update match vs add new)

  useEffect(() => {
    if (visible) {
      setDocumentUri(null);
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
    setDocumentUri(file.uri);
    setDocumentName(file.name);
    await runExtraction(file.uri, "application/pdf");
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera access needed",
        "Mollycoddle needs camera permission to photograph a vaccination record."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    const photo = result.assets[0];
    const mediaType = photo.mimeType || "image/jpeg";
    setDocumentUri(photo.uri);
    setDocumentName(`Photo — ${new Date().toLocaleDateString()}`);
    await runExtraction(photo.uri, mediaType);
  }

  async function runExtraction(uri, mediaType) {
    setExtracting(true);
    setFound(null);
    try {
      const vaccines = await extractVaccinesFromFile(uri, mediaType);
      const parsed = vaccines.map((v) => {
        const name = v.name || "Unnamed vaccine";
        const match = findExistingMatch(name, existingVaccines);
        return {
          name,
          dateGiven: parseLocalDate(v.dateGiven),
          nextDueDate: parseLocalDate(v.nextDueDate),
          matchedVaccineId: match?.id ?? null,
          matchedVaccineName: match?.name ?? null,
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
        dateGiven: item.dateGiven,
        nextDueDate: item.nextDueDate,
        // Only treat it as an update if it matched AND the row is still in
        // update mode — flipping the toggle makes it a plain new record.
        matchedVaccineId: item.matchedVaccineId && updateMode[i] ? item.matchedVaccineId : null,
      }));
    if (chosen.length === 0) {
      Alert.alert("Nothing selected", "Check at least one vaccine to import.");
      return;
    }
    onImport(chosen, documentUri, documentName);
  }

  const selectedCount = found ? found.filter((_, i) => selected[i]).length : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.sheet}>
          <Text style={styles.title}>Import vaccinations</Text>

          {!documentName && (
            <>
              <Text style={styles.helpText}>
                Take a photo of a vaccination sheet, or attach a PDF — Claude will pull out every
                vaccine it can find, for you to review before adding.
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
              No vaccines found. Try a clearer photo or a different file, or add one manually.
            </Text>
          )}

          {found && found.length > 0 && (
            <>
              <Text style={styles.label}>
                Found {found.length} vaccine{found.length === 1 ? "" : "s"} — uncheck any you
                don't want
              </Text>
              {found.map((item, index) => (
                <View key={index} style={styles.vaccineRow}>
                  <Pressable style={styles.vaccineRowMain} onPress={() => toggleSelected(index)}>
                    <View style={[styles.checkbox, selected[index] && styles.checkboxChecked]}>
                      {selected[index] && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.vaccineInfo}>
                      <Text style={styles.vaccineName}>{item.name}</Text>
                      <Text style={styles.vaccineDates}>
                        Given: {formatDate(item.dateGiven)} · Due: {formatDate(item.nextDueDate)}
                      </Text>
                    </View>
                  </Pressable>
                  {item.matchedVaccineId && (
                    <Pressable onPress={() => toggleUpdateMode(index)} style={styles.matchNote}>
                      <Text style={styles.matchNoteText}>
                        {updateMode[index]
                          ? `↻ Updates existing "${item.matchedVaccineName}" — tap to add as new instead`
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
  vaccineRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  vaccineRowMain: {
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
  vaccineInfo: {
    flex: 1,
  },
  vaccineName: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.ink,
  },
  vaccineDates: {
    fontSize: 13,
    color: COLORS.inkSoft,
    marginTop: 2,
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
