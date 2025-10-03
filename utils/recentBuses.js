// utils/recentBuses.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventEmitter from 'eventemitter3'; // ✅


const STORAGE_KEY = 'recentBuses';
const MAX_RECENT = 5;

// Create a global event emitter
const emitter = new EventEmitter();

function _getKey(bus) {
  if (!bus) return null;
  return bus.obu_id ?? bus._id ?? bus.regnNumber ?? JSON.stringify(bus);
}

export async function getRecentBuses() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.warn('Failed to read recent buses from storage', e);
    return [];
  }
}

export async function addRecentBus(bus) {
  if (!bus) return;
  try {
    const key = _getKey(bus);
    if (!key) return;

    const list = await getRecentBuses();
    const filtered = list.filter((b) => _getKey(b) !== key);
    filtered.unshift(bus);

    const trimmed = filtered.slice(0, MAX_RECENT);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

    _notifyRecentChanged();
  } catch (e) {
    console.warn('Failed to add recent bus', e);
  }
}

export async function removeRecentBus(busOrKey) {
  try {
    const key = typeof busOrKey === 'string' ? busOrKey : _getKey(busOrKey);
    if (!key) return;

    const list = await getRecentBuses();
    const next = list.filter((b) => _getKey(b) !== key);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    _notifyRecentChanged();
  } catch (e) {
    console.warn('Failed to remove recent bus', e);
  }
}

export async function clearRecentBuses() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    _notifyRecentChanged();
  } catch (e) {
    console.warn('Failed to clear recent buses', e);
  }
}

// Notify listeners inside the app
function _notifyRecentChanged() {
  emitter.emit('recentBuses:changed');
}

// Subscribe to changes
export function onRecentBusesChanged(callback) {
  emitter.on('recentBuses:changed', callback);
  return () => emitter.removeListener('recentBuses:changed', callback);
}
