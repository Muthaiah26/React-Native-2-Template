import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// 👉 Instead of react-icons, use react-native-vector-icons
import Icon from 'react-native-vector-icons/Feather';

export default function WelcomeScreen({ installPrompt, handleInstallClick }) {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate('Login'); // screen name in your stack navigator
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.iconContainer}>
            <Image
              source={require('../assets/cit-logo.png')} // Put image in /assets folder
              style={styles.logoImage}
            />
          </View>
          <Text style={styles.title}>CIT Transport</Text>
          <Text style={styles.subtitle}>Smart Transportation System</Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Icon name="map-pin" size={24} color="#FFFFFF" />
            <Text style={styles.featureText}>Live Notifications</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="users" size={24} color="#FFFFFF" />
            <Text style={styles.featureText}>Multi-User Support</Text>
          </View>
          <View style={styles.feature}>
            <Icon name="navigation" size={24} color="#FFFFFF" />
            <Text style={styles.featureText}>Route Management</Text>
          </View>
        </View>

        {/* Buttons */}
        {installPrompt ? (
          <TouchableOpacity style={styles.getStartedButton} onPress={handleInstallClick}>
            <Text style={styles.getStartedText}>Install App</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuresContainer: {
    marginBottom: 60,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  getStartedButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
  },
});
