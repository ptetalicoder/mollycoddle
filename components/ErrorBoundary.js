// components/ErrorBoundary.js
// Catches JavaScript errors anywhere below it in the app and shows a
// friendly recovery screen instead of a blank or frozen app with no
// explanation. This has to be a class component — React only supports
// error boundaries this way, there's no hook equivalent.

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS } from "../theme";

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled error caught by ErrorBoundary:", error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            Mollycoddle ran into an unexpected error. Your saved pets and medicines are safe on
            your phone — tap below to try again.
          </Text>
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: COLORS.bg,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.ink,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: COLORS.inkSoft,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.moss,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
