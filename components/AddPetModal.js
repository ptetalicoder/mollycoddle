// components/AddPetModal.js
// The "add a pet" form. It slides up over the home screen using React
// Native's built-in <Modal>, so we don't need a navigation library just
// for this one screen.

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../theme";

const SPECIES_OPTIONS = ["Dog", "Cat", "Other"];

export default function AddPetModal({ visible, onClose, onSave }) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [photoUri, setPhotoUri] = useState(null);

  // Every time the modal opens, clear out whatever was typed last time.
  useEffect(() => {
    if (visible) {
      setName("");
      setSpecies("");
      setPhotoUri(null);
    }
  }, [visible]);

  async function handlePickPhoto() {
    // Ask permission to look at the phone's photo library. The user can
    // say no — if they do, we just tell them and back out instead of
    // crashing or silently failing.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Photo access needed",
        "Mollycoddle needs permission to your photo library to set a pet photo. You can still use an icon instead."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Give your pet a name before saving.");
      return;
    }
    onSave({ name: trimmedName, species: species.trim(), photoUri });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Add a pet</Text>

          <Pressable style={styles.photoPicker} onPress={handlePickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoPickerText}>+ Add photo{"\n"}(optional)</Text>
            )}
          </Pressable>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Biscuit"
            placeholderTextColor={COLORS.inkSoft}
            autoFocus
          />

          <Text style={styles.label}>Species</Text>
          <View style={styles.chipRow}>
            {SPECIES_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={[styles.chip, species === option && styles.chipSelected]}
                onPress={() => setSpecies(option)}
              >
                <Text style={[styles.chipText, species === option && styles.chipTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
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
  photoPicker: {
    alignSelf: "center",
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  photoPreview: {
    width: 88,
    height: 88,
  },
  photoPickerText: {
    fontSize: 12,
    color: COLORS.inkSoft,
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
  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
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
  actions: {
    flexDirection: "row",
    gap: 12,
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
});
