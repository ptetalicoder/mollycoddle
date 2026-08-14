// App.js
// This is the entry point of the app — the first file that runs.
// AppContent is the actual home screen: a list of your pets, a button to
// add one, and tapping a pet opens their profile. The default export at
// the bottom wraps it in an ErrorBoundary before Expo renders it.

import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { COLORS } from "./theme";
import { loadPets, savePets } from "./lib/petStorage";
import { loadMedicines, saveMedicines } from "./lib/medicineStorage";
import { loadDoseLogs, saveDoseLogs, findTodayLog } from "./lib/doseLogStorage";
import { loadVaccines, saveVaccines } from "./lib/vaccineStorage";
import { getNextDoseDate } from "./lib/schedule";
import { makeId } from "./lib/id";
import { WEEK_DAYS } from "./lib/weekDays";
import {
  hasNotificationPermission,
  requestNotificationPermission,
  rescheduleForMedicine,
  cancelForMedicine,
  rescheduleForVaccine,
  cancelForVaccine,
} from "./lib/notifications";
import PetAvatar from "./components/PetAvatar";
import PetFormModal from "./components/PetFormModal";
import PetDetailModal from "./components/PetDetailModal";
import MedicineFormModal from "./components/MedicineFormModal";
import VaccineFormModal from "./components/VaccineFormModal";
import DoseHistoryModal from "./components/DoseHistoryModal";
import ErrorBoundary from "./components/ErrorBoundary";

function AppContent() {
  // `pets` is the list shown on screen. `loading` is true only while we're
  // reading from AsyncStorage for the first time, so we don't flash an
  // empty-state message before we actually know if there are pets or not.
  const [pets, setPets] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doseLogs, setDoseLogs] = useState([]);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [historyVisible, setHistoryVisible] = useState(false);

  // Same shared-form idea as the medicine form, opening on top of the pet
  // detail sheet rather than replacing it.
  const [vaccineFormVisible, setVaccineFormVisible] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState(null);

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
    Promise.all([loadPets(), loadMedicines(), loadDoseLogs(), loadVaccines()]).then(
      ([storedPets, storedMedicines, storedDoseLogs, storedVaccines]) => {
        setPets(storedPets);
        setMedicines(storedMedicines);
        setDoseLogs(storedDoseLogs);
        setVaccines(storedVaccines);
        setLoading(false);
      }
    );
  }, []);

  // "Every N days" medicines only ever have their next few doses scheduled
  // (the OS can't repeat on a custom day count the way it can for daily or
  // weekly). So each time the app opens, top that queue back up — but only
  // if notifications were already allowed; we never want to trigger the
  // permission prompt just from opening the app.
  useEffect(() => {
    if (loading) return;
    const intervalMedicines = medicines.filter((m) => m.frequencyType === "interval");
    if (intervalMedicines.length === 0) return;

    hasNotificationPermission().then((granted) => {
      if (!granted) return;
      Promise.all(
        intervalMedicines.map(async (medicine) => ({
          ...medicine,
          notificationIds: await rescheduleForMedicine(medicine, WEEK_DAYS),
        }))
      ).then((refreshed) => {
        const next = medicines.map((m) => refreshed.find((r) => r.id === m.id) ?? m);
        setMedicines(next);
        saveMedicines(next);
      });
    });
    // Only re-run when the initial load finishes, not on every edit —
    // handleSaveMedicine already reschedules immediately after a save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Only the medicines belonging to whichever pet's detail sheet is open,
  // soonest-due first — so the thing you're most likely checking on
  // (what's due today) is always at the top.
  const petMedicines = selectedPet
    ? medicines
        .filter((m) => m.petId === selectedPet.id)
        .sort((a, b) => getNextDoseDate(a) - getNextDoseDate(b))
    : [];

  // Which of this pet's medicines already have a dose logged today —
  // drives the "Given today" label and the filled-in checkmark circle.
  const givenTodayIds = petMedicines
    .filter((m) => findTodayLog(doseLogs, m.id))
    .map((m) => m.id);

  // This pet's dose history, newest first, for the history screen.
  const petDoseLogs = selectedPet
    ? doseLogs
        .filter((log) => log.petId === selectedPet.id)
        .sort((a, b) => b.givenAt - a.givenAt)
    : [];
  const medicinesById = Object.fromEntries(medicines.map((m) => [m.id, m]));

  // This pet's vaccination records, most overdue/soonest-due first —
  // ascending by due date naturally puts overdue (past) dates ahead of
  // upcoming ones.
  const petVaccines = selectedPet
    ? vaccines
        .filter((v) => v.petId === selectedPet.id)
        .sort((a, b) => a.nextDueDate - b.nextDueDate)
    : [];

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
    // A pet's medicines, dose history, and vaccination records are
    // meaningless without the pet, so they go too — otherwise they'd sit
    // around forever as orphaned data no screen shows.
    const medicinesToRemove = medicines.filter((m) => m.petId === id);
    const nextMedicines = medicines.filter((m) => m.petId !== id);
    const nextDoseLogs = doseLogs.filter((log) => log.petId !== id);
    const vaccinesToRemove = vaccines.filter((v) => v.petId === id);
    const nextVaccines = vaccines.filter((v) => v.petId !== id);
    await Promise.all(medicinesToRemove.map((m) => cancelForMedicine(m)));
    await Promise.all(vaccinesToRemove.map((v) => cancelForVaccine(v)));
    setPets(nextPets);
    setMedicines(nextMedicines);
    setDoseLogs(nextDoseLogs);
    setVaccines(nextVaccines);
    setSelectedPet(null);
    await savePets(nextPets);
    await saveMedicines(nextMedicines);
    await saveDoseLogs(nextDoseLogs);
    await saveVaccines(nextVaccines);
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
    const baseMedicine = editingMedicine
      ? { ...editingMedicine, ...fields }
      : { id: makeId(), petId: selectedPet.id, ...fields, createdAt: Date.now(), notificationIds: [] };

    // Ask for notification permission right at the point it becomes
    // relevant (saving a medicine that needs reminders), not at launch.
    // If it's been asked before, this resolves instantly with no prompt.
    let notificationIds = [];
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        notificationIds = await rescheduleForMedicine(baseMedicine, WEEK_DAYS);
      } else {
        await cancelForMedicine(baseMedicine);
      }
    } catch (error) {
      // Scheduling the reminder failed, but the medicine info itself is
      // still valid — save it without a working reminder rather than
      // silently losing the user's input.
      Alert.alert(
        "Couldn't schedule reminder",
        "The medicine was saved, but its reminder notification couldn't be set up: " + error.message
      );
    }
    const savedMedicine = { ...baseMedicine, notificationIds };

    const next = editingMedicine
      ? medicines.map((m) => (m.id === savedMedicine.id ? savedMedicine : m))
      : [...medicines, savedMedicine];
    setMedicines(next);
    setMedicineFormVisible(false);
    await saveMedicines(next);
  }

  async function handleDeleteMedicine(id) {
    const medicine = medicines.find((m) => m.id === id);
    if (medicine) await cancelForMedicine(medicine);
    const next = medicines.filter((m) => m.id !== id);
    const nextDoseLogs = doseLogs.filter((log) => log.medicineId !== id);
    setMedicines(next);
    setDoseLogs(nextDoseLogs);
    setMedicineFormVisible(false);
    await saveMedicines(next);
    await saveDoseLogs(nextDoseLogs);
  }

  async function handleToggleGiven(medicine) {
    const existing = findTodayLog(doseLogs, medicine.id);
    const next = existing
      ? doseLogs.filter((log) => log.id !== existing.id)
      : [...doseLogs, { id: makeId(), medicineId: medicine.id, petId: medicine.petId, givenAt: Date.now() }];
    setDoseLogs(next);
    await saveDoseLogs(next);
  }

  function openAddVaccineForm() {
    setEditingVaccine(null);
    setVaccineFormVisible(true);
  }

  function openEditVaccineForm(vaccine) {
    setEditingVaccine(vaccine);
    setVaccineFormVisible(true);
  }

  async function handleSaveVaccine(fields) {
    const baseVaccine = editingVaccine
      ? { ...editingVaccine, ...fields }
      : { id: makeId(), petId: selectedPet.id, ...fields, createdAt: Date.now(), notificationId: null };

    let notificationId = null;
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        notificationId = await rescheduleForVaccine(baseVaccine);
      } else {
        await cancelForVaccine(baseVaccine);
      }
    } catch (error) {
      Alert.alert(
        "Couldn't schedule reminder",
        "The vaccination record was saved, but its reminder couldn't be set up: " + error.message
      );
    }
    const savedVaccine = { ...baseVaccine, notificationId };

    const next = editingVaccine
      ? vaccines.map((v) => (v.id === savedVaccine.id ? savedVaccine : v))
      : [...vaccines, savedVaccine];
    setVaccines(next);
    setVaccineFormVisible(false);
    await saveVaccines(next);
  }

  async function handleDeleteVaccine(id) {
    const vaccine = vaccines.find((v) => v.id === id);
    if (vaccine) await cancelForVaccine(vaccine);
    const next = vaccines.filter((v) => v.id !== id);
    setVaccines(next);
    setVaccineFormVisible(false);
    await saveVaccines(next);
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

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={COLORS.moss} size="large" />
        </View>
      ) : pets.length === 0 ? (
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
                <Text style={styles.petName} numberOfLines={1}>
                  {item.name}
                </Text>
                {!!item.species && (
                  <Text style={styles.petSpecies} numberOfLines={1}>
                    {item.species}
                  </Text>
                )}
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
        vaccines={petVaccines}
        givenTodayIds={givenTodayIds}
        hidden={medicineFormVisible || historyVisible || vaccineFormVisible}
        onClose={() => setSelectedPet(null)}
        onEdit={openEditForm}
        onDelete={handleDeletePet}
        onAddMedicine={openAddMedicineForm}
        onEditMedicine={openEditMedicineForm}
        onToggleGiven={handleToggleGiven}
        onViewHistory={() => setHistoryVisible(true)}
        onAddVaccine={openAddVaccineForm}
        onEditVaccine={openEditVaccineForm}
      />

      <MedicineFormModal
        visible={medicineFormVisible}
        medicine={editingMedicine}
        onClose={() => setMedicineFormVisible(false)}
        onSave={handleSaveMedicine}
        onDelete={handleDeleteMedicine}
      />

      <VaccineFormModal
        visible={vaccineFormVisible}
        vaccine={editingVaccine}
        onClose={() => setVaccineFormVisible(false)}
        onSave={handleSaveVaccine}
        onDelete={handleDeleteVaccine}
      />

      <DoseHistoryModal
        visible={historyVisible}
        petName={selectedPet?.name}
        logs={petDoseLogs}
        medicinesById={medicinesById}
        onClose={() => setHistoryVisible(false)}
      />
    </SafeAreaView>
  );
}

// The actual entry point Expo renders. Wrapping AppContent in
// ErrorBoundary means a bug anywhere below shows a recovery screen
// instead of a blank or frozen app.
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
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
    flex: 1,
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
