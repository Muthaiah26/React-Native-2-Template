// ProfileScreen.js (React Native - Expo)
import React, { useEffect, useState, useContext, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView } from "react-native";
import MapView, { Marker } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { UserContext } from "../contexts";

export default function ProfileScreen({ userData: propUserData, logoutPurge }) {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, userData: ctxUserData, role, setRole, setToken, setSno } = useContext(UserContext);

  const userData = propUserData || ctxUserData;

  const [shareLink, setShareLink] = useState("");
  const [scheduleLink, setScheduleLink] = useState("");
  const [clgNo, setclgNo] = useState("Not Set");
  const [userBusNo, setUserBusNo] = useState("");
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 12.98,
    longitude: 80.22,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // useEffect(() => {
  //   if (!token) {
  //     navigation.replace("Login");
  //   }
  // }, [token]);

  useEffect(() => {
    (async () => {
      const savedLocation = await AsyncStorage.getItem("user_pinned_location");
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation);
        setPinnedLocation(parsed);
        setMapRegion({ ...mapRegion, latitude: parsed.lat, longitude: parsed.lng });
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setPinnedLocation({ lat: latitude, lng: longitude });
            setMapRegion({ ...mapRegion, latitude, longitude });
          },
          (err) => console.warn("Location error", err.message),
          { enableHighAccuracy: true }
        );
      }
    })();
  }, []);

  const saveUserLocation = async () => {
    if (!pinnedLocation) {
      Alert.alert("Error", "Please select a location on the map first.");
      return;
    }
    try {
      await AsyncStorage.setItem("user_pinned_location", JSON.stringify(pinnedLocation));
      Alert.alert("Success", "Location saved ✅");
    } catch (err) {
      Alert.alert("Error", "Failed to save location.");
    }
  };

  const parseEmail = (email) => {
    if (!email) return { name: "", dept: "", batch: "" };
    const [beforeAt] = email.split("@");
    const [name, deptBatch] = (beforeAt || "").split(".");
    const dept = deptBatch ? deptBatch.slice(0, 4).toUpperCase() : "";
    const year = deptBatch ? parseInt(deptBatch.slice(4, 8), 10) : NaN;
    const batch = !isNaN(year) ? `${year}-${year + 4}` : "";
    const formattedName = name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
    return { name: formattedName, dept, batch };
  };

  if (!userData) return null;
  const { name, dept, batch } = parseEmail(userData.email);
  const userInitial = name ? name.charAt(0).toUpperCase() : "S";

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Banner */}
      <View style={styles.banner}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{userInitial}</Text></View>
        <Text style={styles.greeting}>Hello, {name || "Student"}!</Text>
        <Text>{userData.email}</Text>
      </View>

      {/* Details */}
      <View style={styles.card}>
        <Text>Department: {dept || "Not Available"}</Text>
        <Text>Batch: {batch || "Not Available"}</Text>
        <Text>Role: {role || userData.role || "student"}</Text>
        <Text>Bus No: {userBusNo || "Not Set"}</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your bus number..."
          value={clgNo}
          onChangeText={setclgNo}
        />
        <TouchableOpacity style={styles.button} onPress={() => setUserBusNo(clgNo)}>
          <Text style={styles.buttonText}>Save Bus No</Text>
        </TouchableOpacity>
      </View>

      {/* Map Section */}
      <View style={{ height: 300, marginTop: 15 }}>
        <MapView
          style={{ flex: 1 }}
          region={mapRegion}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setPinnedLocation({ lat: latitude, lng: longitude });
            setMapRegion({ ...mapRegion, latitude, longitude });
          }}
        >
          {pinnedLocation && (
            <Marker coordinate={{ latitude: pinnedLocation.lat, longitude: pinnedLocation.lng }} />
          )}
        </MapView>
        <TouchableOpacity style={styles.button} onPress={saveUserLocation}>
          <Text style={styles.buttonText}>Save Location</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={[styles.button, { backgroundColor: "red", marginTop: 20 }]} onPress={() => logoutPurge()}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold" },
  banner: { alignItems: "center", backgroundColor: "#1E40AF", padding: 16, borderRadius: 12, marginTop: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#E0E0E0", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 30, fontWeight: "bold" },
  greeting: { fontSize: 18, fontWeight: "600", marginTop: 8, color: "white" },
  card: { backgroundColor: "white", padding: 16, borderRadius: 12, marginTop: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginTop: 8 },
  button: { backgroundColor: "#1E40AF", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
  buttonText: { color: "white", fontWeight: "600" },
});
