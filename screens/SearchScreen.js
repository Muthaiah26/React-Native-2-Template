// SearchScreen.js (React Native version)

import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { useNavigation } from "@react-navigation/native";
import getEndpoint from "../utils/loadbalancer";
import { UserContext } from "../contexts";
import { addRecentBus } from "../utils/recentBuses";
import getTrackPageURL from "../utils/trackpagebalancer";

export default function SearchScreen() {
  const navigation = useNavigation();
  const { token } = useContext(UserContext);

  // useEffect(() => {
  //   if (!token) {
  //     navigation.replace("Welcome"); // redirect if not authenticated
  //   }
  // }, [token, navigation]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a bus number to search");
      return;
    }

    setIsSearching(true);
    try {
      const endpoint = await getEndpoint(); 
      const resp = await fetch(
        `${endpoint}/api/buses?q=${encodeURIComponent(searchQuery)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (resp.status === 404) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      if (!resp.ok) {
        let errText = `Server responded with ${resp.status}`;
        try {
          const errBody = await resp.json();
          if (errBody && errBody.error) errText = errBody.error;
        } catch (_) {}
        throw new Error(errText);
      }

      const data = await resp.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert("Network error", e.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleViewBus = (bus) => {
    addRecentBus(bus);
    // Navigate to tracking page
    navigation.navigate("RouteDetail", { clgNo: bus.clgNo });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search Buses</Text>
        <Text style={styles.subtitle}>Find bus routes and schedules</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter a Bus Number (e.g., 20)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={clearSearch}>
              <Feather name="x" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isSearching}
        >
          <Text style={styles.searchButtonText}>
            {isSearching ? "Searching..." : "Search"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        {isSearching && (
          <ActivityIndicator size="large" color="#2563EB" style={{ margin: 20 }} />
        )}

        {!isSearching && searchResults.length > 0 ? (
          <>
            <Text style={styles.resultsTitle}>
              Search Results ({searchResults.length})
            </Text>
            {searchResults.map((bus) => (
              <View key={bus.regnNumber} style={styles.busCard}>
                <View style={styles.busHeader}>
                  <View style={styles.busInfo}>
                    <Text style={styles.busId}>{bus.regnNumber}</Text>
                    <Text style={styles.busRoute}>{bus.route}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => handleViewBus(bus)}
                  >
                    <Feather name="map" size={16} color="#FFF" />
                    <Text style={styles.trackButtonText}>Track Now</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.busDetails}>
                  <View style={styles.detailRow}>
                    <Feather name="map-pin" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Current: {bus.currentLocation ?? "---"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="users" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      RouteNo: {bus.clgNo ?? "---"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather name="user" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                      Driver: {bus.driver ?? "---"}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeSection}>
                  <Text style={styles.routeTitle}>Route Stops:</Text>
                  <View style={styles.stopsContainer}>
                    {Array.isArray(bus.stops) &&
                      bus.stops.map((stop, index) => (
                        <View key={index} style={styles.stopItem}>
                          <View
                            style={
                              stop === bus.currentLocation
                                ? styles.currentStopDot
                                : styles.stopDot
                            }
                          />
                          <Text
                            style={
                              stop === bus.currentLocation
                                ? styles.currentStopText
                                : styles.stopText
                            }
                          >
                            {stop}
                          </Text>
                          <Text style={styles.stopTime}>
                            {bus.schedule?.[index] ?? "--:--"}
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : !isSearching && searchQuery.length > 0 ? (
          <View style={styles.noResults}>
            <Feather name="alert-triangle" size={48} color="#9CA3AF" />
            <Text style={styles.noResultsText}>No buses found</Text>
            <Text style={styles.noResultsSubtext}>
              Try searching with a different bus number
            </Text>
          </View>
        ) : (
          <View style={styles.searchPrompt}>
            <Feather name="search" size={48} color="#9CA3AF" />
            <Text style={styles.promptText}>Search for buses</Text>
            <Text style={styles.promptSubtext}>
              Enter a bus number to see routes and schedules
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#FFF",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: { fontSize: 24, fontWeight: "700", color: "#1F2937" },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 4 },
  searchContainer: { padding: 20, backgroundColor: "#FFF" },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  searchInput: { flex: 1, padding: 12, fontSize: 16, color: "#1F2937" },
  clearButton: { paddingHorizontal: 8 },
  searchButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  searchButtonText: { fontSize: 16, fontWeight: "600", color: "#FFF" },
  resultsContainer: { padding: 20 },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  busCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  busHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  busInfo: { flex: 1 },
  busId: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  busRoute: { fontSize: 16, fontWeight: "500", color: "#050505" },
  busDetails: { marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  detailText: { marginLeft: 8, fontSize: 14, color: "#6B7280" },
  routeSection: { marginBottom: 16 },
  routeTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, color: "#1F2937" },
  stopsContainer: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 16 },
  stopItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
    marginRight: 12,
  },
  currentStopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563EB",
    marginRight: 12,
  },
  stopText: { flex: 1, fontSize: 14, color: "#6B7280" },
  currentStopText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#2563EB" },
  stopTime: { fontSize: 12, color: "#9CA3AF" },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    borderRadius: 12,
    padding: 12,
  },
  trackButtonText: { marginLeft: 8, fontSize: 16, fontWeight: "600", color: "#FFF" },
  noResults: { alignItems: "center", padding: 40 },
  noResultsText: { fontSize: 18, fontWeight: "600", color: "#6B7280" },
  noResultsSubtext: { fontSize: 14, color: "#9CA3AF", marginTop: 8 },
  searchPrompt: { alignItems: "center", padding: 60 },
  promptText: { fontSize: 18, fontWeight: "600", color: "#6B7280" },
  promptSubtext: { fontSize: 14, color: "#9CA3AF", marginTop: 8 },
});
