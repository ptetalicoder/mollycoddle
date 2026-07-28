// App.js
// This is the entry point of the app — the first file that runs.
// It's now the home screen: a list of your pets, a button to add one,
// and tapping a pet opens their profile.

import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, SafeAreaView, FlatList, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";

import { COLORS } from "./theme";
import { loadPets, savePets } from "./lib/petStorage";
import { loadMedicines, saveMedicines } from "./lib/medicineStorage";
import { makeId } from "./lib/id";
import PetAvatar from "./components/PetAvatar";
import PetFormModal from "./components/PetFormModal";
import PetDetailModal from "./components/PetDetailModal";
import MedicineFormModal from "./components/MedicineFormModal";

export default function App() {
  // `pets` is the list shown on screen. `loading` is true only while we're
  // reading from AsyncStorage for the first time, so we don't flash an
  // empty-state message before we actually know if there are pets or not.
  const [pets, setPets] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);

  // The form modal is shared between "add" and "edit". When `formPet` is a
  // pet object, the form opens pre-filled to edit that pet. When it's
  // `null`, the form still opens (because `formVisible` is true) but blank,
  // for adding a new one.
  const [formVisible, setFormVisible] = useState(false);
  const [formPet, setFormPet] = useState(null);

  // Same shared-form idea, but for the medicine form. This one opens on
  // top of the pet detail sheet (rather than replacing it), so you stay in
  // context and immediately see the updated medicine list after saving.
  const [medicineFormVisible, setMedicineFormVisible] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  // useEffect with an empty [] dependency array runs once, right after the
  // very first render — the standard React way to say "load my data now."
  useEffect(() => {
    Promise.all([loadPets(), loadMedicines()]).then(([storedPets, storedMedicines]) => {
      setPets(storedPets);
      setMedicines(storedMedicines);
      setLoading(false);
    });
  }, []);

  // Only the medicines belonging to whichever pet's detail sheet is open.
  const petMedicines = selectedPet ? medicines.filter((m) => m.petId === selectedPet.id) : [];

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
      : [...pets, { id: makeId(), name, species, photoUri, createdAt: Date.now() }];
    setPets(next);
    setFormVisible(false);
    await savePets(next);
  }

  async function handleDeletePet(id) {
    const nextPets = pets.filter((pet) => pet.id !== id);
    // A pet's medicines are meaningless without the pet, so they go too —
    // otherwise they'd sit around forever as orphaned data no screen shows.
    const nextMedicines = medicines.filter((m) => m.petId !== id);
    setPets(nextPets);
    setMedicines(nextMedicines);
    setSelectedPet(null);
    await savePets(nextPets);
    await saveMedicines(nextMedicines);
  }

  function openAddMedicineForm() {
    setEditingMedicine(null);
    setMedicineFormVisible(true);
  }

  function openEditMedicineForm(medicine) {
    setEditingMedicine(medicine);
    setMedicineFormVisible(true);
  }

  async function handleSaveMedicine(fields) {
    const next = editingMedicine
      ? medicines.map((m) => (m.id === editingMedicine.id ? { ...m, ...fields } : m))
      : [...medicines, { id: makeId(), petId: selectedPet.id, ...fields, createdAt: Date.now() }];
    setMedicines(next);
    setMedicineFormVisible(false);
    await saveMedicines(next);
  }

  async function handleDeleteMedicine(id) {
    const next = medicines.filter((m) => m.id !== id);
    setMedicines(next);
    setMedicineFormVisible(false);
    await saveMedicines(next);
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
        medicines={petMedicines}
        hidden={medicineFormVisible}
        onClose={() => setSelectedPet(null)}
        onEdit={openEditForm}
        onDelete={handleDeletePet}
        onAddMedicine={openAddMedicineForm}
        onEditMedicine={openEditMedicineForm}
      />

      <MedicineFormModal
        visible={medicineFormVisible}
        medicine={editingMedicine}
        onClose={() => setMedicineFormVisible(false)}
        onSave={handleSaveMedicine}
        onDelete={handleDeleteMedicine}
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
