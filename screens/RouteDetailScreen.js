// RouteDetailScreen.js (React Native Version)

import React, { useState, useEffect, useRef, useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, AnimatedRegion } from "react-native-maps";
import { UserContext } from "../contexts";
import getEndpoint from "../utils/loadbalancer";
import useBusLocation from "../components/LocationSSE";

const { width, height } = Dimensions.get("window");

export default function RouteDetailScreen({ route, navigation }) {
  const { clgNo } = route.params; // React Navigation params
  const { token } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [mapView, setMapView] = useState("street");
  const { loc, lastUpdateTimestamp } = useBusLocation(clgNo, token, setLoading);
  const [path, setPath] = useState([]);

  const markerRef = useRef(null);
  const animatedRegion = useRef(
    new AnimatedRegion({
      latitude: loc ? loc.lat : 0,
      longitude: loc ? loc.long : 0,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  ).current;

  // Fetch route path
  const fetchPath = async () => {
    try {
      const res = await fetch(`${getEndpoint()}/getpath?clgNo=${clgNo}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        console.error(`Could not fetch route path, status: ${res.status}`);
        return;
      }

      const data = await res.json();
      if (data && Array.isArray(data.path)) {
        setPath(
          data.path.map(([lat, lng]) => ({
            latitude: lat,
            longitude: lng,
          }))
        );
      }
    } catch (e) {
      console.error("Fetch path error", e);
    }
  };

  // Fetch path on load
  useEffect(() => {
    if (!clgNo) {
      Alert.alert("Error", "No bus number provided.");
      navigation.navigate("Search");
      return;
    }
    fetchPath();
  }, [clgNo, token]);

  // Animate marker when location updates
  useEffect(() => {
    if (loc && animatedRegion) {
      animatedRegion.timing({
        latitude: loc.lat,
        longitude: loc.long,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    }
  }, [loc]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.statusText}>Loading live location...</Text>
      </View>
    );
  }

  if (!loc) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusText}>⚠ Live location not available yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bus No: {clgNo}</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.btn, mapView === "street" && styles.btnActive]}
            onPress={() => setMapView("street")}
          >
            <Text style={[styles.btnText, mapView === "street" && styles.btnTextActive]}>
              Street
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, mapView === "satellite" && styles.btnActive]}
            onPress={() => setMapView("satellite")}
          >
            <Text style={[styles.btnText, mapView === "satellite" && styles.btnTextActive]}>
              Satellite
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Last Updated:{" "}
          <Text style={styles.boldText}>
            {new Date(lastUpdateTimestamp).toLocaleString()}
          </Text>
        </Text>
      </View>

      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapType={mapView === "street" ? "standard" : "satellite"}
        initialRegion={{
          latitude: loc.lat,
          longitude: loc.long,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Route Path */}
        {path.length > 0 && (
          <Polyline
            coordinates={path}
            strokeColor="blue"
            strokeWidth={5}
          />
        )}

        {/* Bus Marker */}
        <Marker.Animated
          ref={markerRef}
          coordinate={animatedRegion}
          title={`Bus No: ${clgNo}`}
          description="Live Location"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E40AF",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f3f4f6",
  },
  btnActive: {
    backgroundColor: "#2563EB",
  },
  btnText: {
    fontSize: 14,
    color: "#333",
  },
  btnTextActive: {
    color: "white",
  },
  statusBar: {
    padding: 10,
    backgroundColor: "#fff9db",
  },
  statusText: {
    fontSize: 14,
    color: "#444",
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  map: {
    width: width,
    height: height * 0.8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
