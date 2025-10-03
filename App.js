// App.js (Expo React Native with Notifications + Integrated Bottom Nav)

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert,insets } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Feather } from "@expo/vector-icons"; // ✅ use Expo vector icons

// Context
import { UserProvider } from "./contexts";

// Screens
import WelcomeScreen from "./screens/WelcomeScreen";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import SearchScreen from "./screens/SearchScreen";
import NotificationScreen from "./screens/NotificationScreen";
import ProfileScreen from "./screens/ProfileScreen";
import RouteDetailScreen from "./screens/RouteDetailScreen";
import TrackingScreen from "./screens/TrackingScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState("Welcome");

  // ---- Version Purge Logic ----
  useEffect(() => {
    const checkVersion = async () => {
      try {
        const currentVersion = "1.0.0";
        const storedVersion = await AsyncStorage.getItem("__v");

        if (storedVersion !== currentVersion) {
          await AsyncStorage.clear();
          await AsyncStorage.setItem("__v", currentVersion);
        }
      } catch (e) {
        console.log("Error checking version:", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkVersion();
  }, []);

  // ---- Push Notification Setup ----
  useEffect(() => {
    const registerForPushNotifications = async () => {
      if (!Device.isDevice) {
        Alert.alert("Error", "Push Notifications require a physical device");
        return;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert("Permission required", "Enable notifications to subscribe");
        return;
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig.extra.eas.projectId,
        });
        const token = tokenData.data;

        console.log("Expo Push Token:", token);

        await AsyncStorage.setItem("pushToken", token);
      } catch (error) {
        console.log("Error getting push token:", error);
      }
    };

    registerForPushNotifications();

    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text>Loading...</Text>
      </View>
    );
  }

  // ---- Bottom Navigation ----
  function BottomTabs() {
     const insets = useSafeAreaInsets(); 
    return (
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 60 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ size, color }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ size, color }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{
          title: 'Track',
          tabBarIcon: ({ size, color }) => (
            <Feather name="map-pin" size={size} color={color} />
          ),
        }}
      />
       <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        initialParams={{ role:"student" }}                
        options={{
          tabBarIcon: ({ size, color }) => (
            <Feather name="bell" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ size, color }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
    );
  }

  return (
    <SafeAreaProvider>
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={BottomTabs} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="RouteDetail" component={RouteDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
});
