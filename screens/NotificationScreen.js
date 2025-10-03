import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Switch,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { UserContext } from '../contexts';
import getEndpoint from '../utils/loadbalancer';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';

// ---------- AsyncStorage Helpers ----------
const STORAGE_KEY = 'notifications';

const saveNotifications = async (notifs) => {
  try {
    const existing = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
    const combined = [...notifs, ...existing].slice(0, 30); // keep latest 30
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
  } catch (err) {
    console.error(err);
  }
};

const getAllNotifications = async () => {
  try {
    const all = JSON.parse(await AsyncStorage.getItem(STORAGE_KEY)) || [];
    return all.sort((a, b) => new Date(b.time) - new Date(a.time));
  } catch (err) {
    return [];
  }
};

const getLatestNotificationTime = async () => {
  const all = await getAllNotifications();
  if (!all.length) return 0;
  return Math.max(...all.map((n) => new Date(n.time).getTime()));
};

// ---------- NotificationScreen ----------
export default function NotificationScreen({ subscribeUserToPush, unsubscribeUserFromPush }) {
  const { role, token, userData } = useContext(UserContext);
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({ title: '', description: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [issub, setIssub] = useState(false);
  const [imageModal, setImageModal] = useState({ visible: false, uri: null });

  // useEffect(() => {
  //   if (!userData) navigation.navigate('Home');
  // }, [userData]);

  // Fetch notifications from backend + AsyncStorage
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const storedNotifications = await getAllNotifications();
      setNotifications(storedNotifications);

      const latestTime = await getLatestNotificationTime();
      const res = await fetch(`${getEndpoint()}/api/notifications?after=${latestTime}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const newNotifs = await res.json();
      if (newNotifs.length > 0) {
        setNotifications((prev) => [...newNotifs, ...prev]);
        await saveNotifications(newNotifs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setSelectedImage(result.assets[0]);
  };

  const sendNotification = async () => {
    if (!newNotification.title.trim() || !newNotification.description.trim()) {
      Alert.alert('Please enter both title and description');
      return;
    }
    const formData = new FormData();
    formData.append('title', newNotification.title);
    formData.append('message', newNotification.description);
    formData.append('sender', 'Transport Incharge');
    formData.append('type', 'info');
    formData.append('targetStudentIds', 'all');
    if (selectedImage) {
      const uriParts = selectedImage.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('image', {
        uri: selectedImage.uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    setLoading(true);
    try {
      const res = await fetch(`${getEndpoint()}/api/notifications`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = await res.json();
      if (data.success) {
        setNewNotification({ title: '', description: '' });
        setSelectedImage(null);
        setNotifications((prev) => [data.notif, ...prev]);
        await saveNotifications([data.notif]);
      }
    } catch (err) {
      Alert.alert('Error sending notification');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Delete Notification', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const res = await fetch(`${getEndpoint()}/api/notifications/${id}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
              },
            });
            const data = await res.json();
            if (data.success) {
              setNotifications((prev) => prev.filter((n) => n._id !== id));
            } else throw new Error(data.error || 'Delete failed');
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <Feather name="alert-triangle" size={20} color="#F59E0B" />;
      case 'alert':
        return <Feather name="alert-circle" size={20} color="#EF4444" />;
      case 'success':
        return <Feather name="check-circle" size={20} color="#10B981" />;
      default:
        return <Feather name="info" size={20} color="#3B82F6" />;
    }
  };

  const getNotificationBorder = (type) => {
    switch (type) {
      case 'warning':
        return '#F59E0B';
      case 'alert':
        return '#EF4444';
      case 'success':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Notifications</Text>
          {notifications.filter((n) => !n.read).length > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{notifications.filter((n) => !n.read).length}</Text>
            </View>
          )}
        </View>
        {role === 'student' && (
          <Switch value={issub} onValueChange={() => Alert.alert('Push toggle not implemented')} />
        )}
      </View>

      {/* Send Notification */}
      {role === 'incharge@cit@chennai@0409' && (
        <View style={styles.sendSection}>
          <Text style={styles.sendTitle}>Send Notification</Text>
          <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
            <Text style={styles.uploadText}>{selectedImage ? 'Change Image' : 'Upload Image'}</Text>
          </TouchableOpacity>
          {selectedImage && <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />}
          <TextInput
            placeholder="Enter title..."
            value={newNotification.title}
            onChangeText={(text) => setNewNotification({ ...newNotification, title: text })}
            style={styles.titleInput}
          />
          <TextInput
            placeholder="Type your description..."
            value={newNotification.description}
            onChangeText={(text) => setNewNotification({ ...newNotification, description: text })}
            style={styles.input}
            multiline
          />
          <TouchableOpacity onPress={sendNotification} style={styles.sendButton}>
            <Text style={{ color: 'white' }}>Send</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {loading && <ActivityIndicator size="large" color="#2563EB" />}
      <ScrollView style={styles.notificationsList}>
        {notifications.map((notification) => (
          <View
            key={notification._id}
            style={[
              styles.notificationCard,
              !notification.read && styles.unreadCard,
              { borderLeftColor: getNotificationBorder(notification.type) },
            ]}
          >
            {role === 'incharge@cit@chennai@0409' && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(notification._id)}>
                <AntDesign name="delete" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                if (!notification.read) {
                  notification.read = true;
                  setNotifications([...notifications]);
                }
                if (notification.imageUrl) setImageModal({ visible: true, uri: `${getEndpoint()}/api/img?id=${notification.imageUrl}` });
              }}
              style={{ padding: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 12 }}>{getNotificationIcon(notification.type)}</View>
                <View>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationSender}>From: {notification.sender}</Text>
                </View>
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              {notification.imageUrl && (
                <Image source={{ uri: `${getEndpoint()}/api/img?id=${notification.imageUrl}` }} style={styles.notificationImage} />
              )}
              <Text style={styles.notificationTime}>{new Date(notification.time).toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Image Modal */}
      <Modal visible={imageModal.visible} transparent={true} onRequestClose={() => setImageModal({ visible: false, uri: null })}>
        <View style={styles.modalBackground}>
          <Image source={{ uri: imageModal.uri }} style={styles.modalImage} />
          <TouchableOpacity style={styles.modalClose} onPress={() => setImageModal({ visible: false, uri: null })}>
            <Text style={{ color: 'white', fontSize: 18 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  unreadBadge: { backgroundColor: '#EF4444', borderRadius: 10, marginLeft: 12, paddingHorizontal: 6 },
  unreadCount: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sendSection: { padding: 20, backgroundColor: '#fff', marginBottom: 10 },
  sendTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  uploadButton: { backgroundColor: '#E0ECFF', padding: 6, borderRadius: 8, marginBottom: 10 },
  uploadText: { color: '#2563EB', fontWeight: '600' },
  imagePreview: { width: 100, height: 100, borderRadius: 8, marginBottom: 10 },
  titleInput: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 12 },
  input: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 12 },
  sendButton: { backgroundColor: '#2563EB', padding: 12, borderRadius: 12, alignItems: 'center' },
  notificationsList: { flex: 1, padding: 20 },
  notificationCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, padding: 0 },
  unreadCard: { backgroundColor: '#F0F9FF' },
  notificationTitle: { fontWeight: '600', fontSize: 16, color: '#1F2937' },
  notificationSender: { fontSize: 12, color: '#6B7280' },
  notificationMessage: { fontSize: 14, color: '#4B5563', marginTop: 8 },
  notificationImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 10 },
  notificationTime: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  deleteButton: { position: 'absolute', top: 12, right: 12 },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '90%', height: '70%', borderRadius: 12 },
  modalClose: { marginTop: 20, padding: 10, backgroundColor: '#2563EB', borderRadius: 8 },
});
