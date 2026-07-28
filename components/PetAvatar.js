// components/PetAvatar.js
// Shows a pet's photo if they have one, otherwise falls back to a colored
// circle with their first initial — so the list never has an empty gap
// where a picture "should" be.

import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { colorForName } from "../theme";

export default function PetAvatar({ pet, size = 48 }) {
  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (pet.photoUri) {
    return <Image source={{ uri: pet.photoUri }} style={[styles.circle, circleStyle]} />;
  }

  const initial = pet.name ? pet.name.trim().charAt(0).toUpperCase() : "?";
  return (
    <View
      style={[
        styles.circle,
        circleStyle,
        { backgroundColor: colorForName(pet.name || "?"), alignItems: "center", justifyContent: "center" },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: "hidden",
  },
  initial: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
