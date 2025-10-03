import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserContext } from '../contexts';
import decryptJWT from '../utils/decrypt';
import getEndpoint from '../utils/loadbalancer';


export default function LoginScreen({ purgeIDB, subscribeUserToPush }) {
  const [email, setEmail] = useState('');
  const [otpPage, setOtpPage] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('student'); // Add userType state
  const { setRole, setToken, setUserData, setSno } = useContext(UserContext);
  const navigation = useNavigation();


  const handleLogin = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email');
    if (email.split('.').pop() !== 'net') return Alert.alert('Error', 'Please use only cit college email !!');

    setRole(userType);
    setLoading(true);

    try {
      if (!otpPage) {
        const res = await fetch(`${getEndpoint('helper')}/api/auth/student/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        console.log(res);
        const data = await res.json();
        if (!res.ok) return Alert.alert('Login Error', data.error || 'Failed to send OTP');
        Alert.alert('Success', 'OTP sent to your email. Please check your inbox.');
        setOtpPage(true);
      } else {
        const res = await fetch(`${getEndpoint()}/api/auth/student/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error('Invalid OTP or email');

        setToken(data.token);
        setSno(data.sno);

        try {
          const decoded = await decryptJWT(data.token);
          setUserData(decoded);
        } catch (err) {
          console.warn('decode failed', err);
        }

        purgeIDB('notifications-db');
        navigation.replace('Home', { role: userType });
      }
    } catch (err) {
      Alert.alert('Login Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#2563EB', '#1E40AF']} style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="bus-outline" size={40} color="#FFFFFF" />
          <Text style={styles.title}>Welcome Back!</Text>
        </View>

        <View style={styles.form}>
          {/* User type selection */}
          <View style={styles.userTypeContainer}>
            <View style={styles.userTypeButtons}>
              {['student'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.userTypeButton, userType === type && styles.userTypeButtonActive]}
                  onPress={() => setUserType(type)}
                >
                  <Text style={[styles.userTypeButtonText, userType === type && styles.userTypeButtonTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Email input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#64748B" />
            <TextInput
              style={styles.input}
              placeholder="sample@citchennai.net"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* OTP input */}
          {otpPage && (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: loading ? '#94a3b8' : '#2563EB' }]}
            onPress={() =>
                    navigation.navigate("Main")
                  }
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginTop: 16, marginBottom: 8 },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  userTypeContainer: { marginBottom: 24 },
  userTypeButtons: { flexDirection: 'row', borderRadius: 8, backgroundColor: '#F3F4F6', padding: 4 },
  userTypeButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  userTypeButtonActive: { backgroundColor: '#2563EB' },
  userTypeButtonText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  userTypeButtonTextActive: { color: '#FFFFFF' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1F2937' },
  loginButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, height: 48, justifyContent: 'center' },
  loginButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
