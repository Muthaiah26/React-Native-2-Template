import React, { useEffect, useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../contexts";
import { getRecentBuses, removeRecentBus } from "../utils/recentBuses";
import getTrackPageURL from "../utils/trackpagebalancer";

// Expo vector icons
import { Ionicons, Feather } from "@expo/vector-icons";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { token } = useContext(UserContext);
  const [recent, setRecent] = useState([]);

 useEffect(() => {
  // if (!token) {
  //   navigation.replace("Login");
  //   return;
  // }

  let isMounted = true; // avoid setting state on unmounted component

  const fetchRecent = async () => {
    const buses = await getRecentBuses();
    if (isMounted) setRecent(buses || []);
  };

  fetchRecent();

  

  return () => {
    isMounted = false;
    
  };
}, [token]);


  function getLocationFromBus(bus) {
    const stops = bus.stops;
    if (Array.isArray(stops) && stops.length > 0) return stops[0];
    if (typeof stops === "string" && stops.trim().length > 0) {
      try {
        const parsed = JSON.parse(stops);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch {}
      return stops.split(",")[0].trim();
    }
    return bus.route || bus.regnNumber || "—";
  }

 const handleDelete = async (bus) => {
  await removeRecentBus(bus);
  const buses = await getRecentBuses(); 
  setRecent(buses);
};

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello Everyone!</Text>
        <Text style={styles.welcomeText}>Welcome to CIT Transport</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Feather name="truck" size={28} color="#FFF" />
            <Text style={styles.statNumber}>95</Text>
            <Text style={styles.statLabel}>Active Buses</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="users" size={28} color="#FFF" />
            <Text style={styles.statNumber}>5200</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statItem}>
            <Feather name="map-pin" size={28} color="#FFF" />
            <Text style={styles.statNumber}>85</Text>
            <Text style={styles.statLabel}>Routes</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Recently searched */}
        <Text style={styles.sectionTitle}>Recently searched</Text>
        {recent.length === 0 ? (
          <Text style={{ color: "#6B7280" }}>No recent searches yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recent.map((bus) => {
              const id =
                bus.regnNumber || bus.route || bus.obu_id || bus.vi || "UNKNOWN";
              const location = getLocationFromBus(bus);
              return (
                <TouchableOpacity
                  key={id}
                  style={styles.busCard}
                  onPress={() =>
                    navigation.navigate("RouteDetail", { clgNo: bus.clgNo })
                  }
                >
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(bus)}
                  >
                    <Feather name="x" size={14} color="#111" />
                  </TouchableOpacity>
                  <Text style={styles.busId}>{id}</Text>
                  <Text style={styles.busRoute}>{bus.route || "Route"}</Text>
                  <Text style={styles.busClg}>BUS NO: {bus.clgNo ?? "—"}</Text>

                  <View style={styles.busDetailRow}>
                    <Feather name="map-pin" size={14} color="#6B7280" />
                    <Text style={styles.busDetailText}>{location}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("Search")}
            >
              <Feather name="search" size={32} color="#2563EB" />
              <Text style={styles.actionText}>Search Bus</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() =>
                navigation.navigate("Profile", { redirectToMap: true })
              }
            >
              <Feather name="map-pin" size={32} color="#24a972" />
              <Text style={styles.actionText}>Set Boarding Point</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("Profile")}
            >
              <Feather name="user" size={32} color="#24a972" />
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Feather name="bell" size={32} color="#7C3AED" />
              <Text style={styles.actionText}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: "#2563EB",
  },
  greeting: { fontSize: 20, fontWeight: "500", color: "#FFF", marginBottom: 4 },
  welcomeText: {
    fontSize: 16,
    fontWeight: "400",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statItem: { alignItems: "center" },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    marginTop: 8,
  },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  content: { padding: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  busCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 200,
    elevation: 3,
  },
  deleteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    padding: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },
  busId: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  busRoute: { fontSize: 12, color: "#6B7280" },
  busClg: { fontSize: 12, fontWeight: "600", color: "#374151" },
  busDetailRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  busDetailText: { fontSize: 12, color: "#6B7280", marginLeft: 4 },
  quickActions: { marginTop: 40 },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    marginTop: 8,
    textAlign: "center",
  },
});
