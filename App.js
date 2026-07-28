// App.js
// This is the entry point of the app — the first file that runs.
// It's now the home screen: a list of your pets, a button to add one,
// and tapping a pet opens their profile.

import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, FlatList, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";

import { COLORS } from "./theme";
import { loadPets, savePets, makePetId } from "./lib/petStorage";
import PetAvatar from "./components/PetAvatar";
import PetFormModal from "./components/PetFormModal";
import PetDetailModal from "./components/PetDetailModal";

export default function App() {
  // `pets` is the list shown on screen. `loading` is true only while we're
  // reading from AsyncStorage for the first time, so we don't flash an
  // empty-state message before we actually know if there are pets or not.
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);

  // The form modal is shared between "add" and "edit". When `formPet` is a
  // pet object, the form opens pre-filled to edit that pet. When it's
  // `null`, the form still opens (because `formVisible` is true) but blank,
  // for adding a new one.
  const [formVisible, setFormVisible] = useState(false);
  const [formPet, setFormPet] = useState(null);

  // useEffect with an empty [] dependency array runs once, right after the
  // very first render — the standard React way to say "load my data now."
  useEffect(() => {
    loadPets().then((stored) => {
      setPets(stored);
      setLoading(false);
    });
  }, []);

  function openAddForm() {
    setFormPet(null);
    setFormVisible(true);
  }

  function openEditForm(pet) {
    setSelectedPet(null);
    setFormPet(pet);
    setFormVisible(true);
  }

  async function handleSavePet({ name, species, photoUri }) {
    // `formPet` tells us whether this save is an edit (update the matching
    // pet in place) or an add (append a brand new one).
    const next = formPet
      ? pets.map((p) => (p.id === formPet.id ? { ...p, name, species, photoUri } : p))
      : [...pets, { id: makePetId(), name, species, photoUri, createdAt: Date.now() }];
    setPets(next);
    setFormVisible(false);
    await savePets(next);
  }

  async function handleDeletePet(id) {
    const next = pets.filter((pet) => pet.id !== id);
    setPets(next);
    setSelectedPet(null);
    await savePets(next);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>MOLLYCODDLE</Text>
          <Text style={styles.title}>Your pets</Text>
        </View>
        <Pressable style={styles.addButton} onPress={openAddForm}>
          <Text style={styles.addButtonText}>+ Add pet</Text>
        </Pressable>
      </View>

      {!loading && pets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No pets yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap "+ Add pet" to add your first pet and start tracking their care.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(pet) => pet.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.petRow} onPress={() => setSelectedPet(item)}>
              <PetAvatar pet={item} size={52} />
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{item.name}</Text>
                {!!item.species && <Text style={styles.petSpecies}>{item.species}</Text>}
              </View>
            </Pressable>
          )}
        />
      )}

      <PetFormModal
        visible={formVisible}
        pet={formPet}
        onClose={() => setFormVisible(false)}
        onSave={handleSavePet}
      />

      <PetDetailModal
        pet={selectedPet}
        onClose={() => setSelectedPet(null)}
        onEdit={openEditForm}
        onDelete={handleDeletePet}
      />
    </SafeAreaView>
  );
}

// StyleSheet.create is React Native's version of CSS.
// Instead of a .css file, styles live in a JS object right here.
const styles = StyleSheet.create({
  container: {
    flex: 1, // fill the whole screen
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    color: COLORS.moss,
    fontWeight: "600",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.ink,
  },
  addButton: {
    backgroundColor: COLORS.moss,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  petRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  petInfo: {
    marginLeft: 14,
  },
  petName: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.ink,
  },
  petSpecies: {
    fontSize: 13,
    color: COLORS.inkSoft,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.inkSoft,
    textAlign: "center",
  },
});
