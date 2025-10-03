import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview"; // ✅ WebView instead of Pdf
import getEndpoint from "../utils/loadbalancer";
import { UserContext } from "../contexts";

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(UserContext);

  // useEffect(() => {
  //   if (!token) {
  //     navigation.replace("Welcome"); // redirect if not logged in
  //   }
  // }, [token]);

  const fetchRouteChart = async () => {
    try {
      const res = await fetch(`${getEndpoint()}/get-route-chart`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      if (data.route_chart) {
        setPdfUrl(data.route_chart);
      } else {
        console.error("No route chart in response:", data);
        Alert.alert("Error", data.error || "No route chart found.");
      }
    } catch (e) {
      console.error("Fetch error", e);
      Alert.alert("Error", "Could not fetch route chart.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouteChart();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text>Loading Route Chart...</Text>
      </View>
    );
  }

  if (!pdfUrl) {
    return (
      <View style={styles.centered}>
        <Text>No route chart available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="arrow-back" size={22} color="#1976d2" />
        </TouchableOpacity>
        <Text style={styles.title}>Bus Route Chart</Text>
      </View>

      {/* PDF Viewer using WebView */}
      <WebView
        source={{ uri: pdfUrl }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator size="large" color="#1976d2" style={{ flex: 1 }} />
        )}
        onError={(error) => {
          console.error(error);
          Alert.alert("Error", "Failed to load PDF");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f0f0ff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1976d2",
    elevation: 4,
  },
  backButton: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  title: { fontSize: 18, fontWeight: "bold", color: "white" },
  webview: { flex: 1, width: "100%" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
