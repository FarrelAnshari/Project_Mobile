/**
 * PARKIN — Smart Campus Parking
 * Component: ParkingPinWidget
 *
 * Widget "Pin Lokasi Parkirku" — mahasiswa bisa mencatat di mana mereka parkir.
 * Data persisted via AsyncStorage.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const STORAGE_KEY = '@parkin_pin_location';

interface PinData {
  zone: string;
  note: string;
  timestamp: string;
}

const PRESET_ZONES = [
  'Parkir A', 'Parkir B', 'Parkir C', 'Parkir D',
  'Parkir E', 'Gedung Rektorat', 'Lab Komputer', 'Kantin',
];

export default function ParkingPinWidget() {
  const colors = useThemeColors();
  const { isDark } = useTheme();
  const { isOffline } = useOnlineStatus();
  const [pin, setPin] = useState<PinData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputZone, setInputZone] = useState('');
  const [inputNote, setInputNote] = useState('');

  const cardScale = useSharedValue(1);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    loadPin();
  }, []);

  const loadPin = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPin(JSON.parse(stored));
        checkScale.value = withSpring(1);
      }
    } catch {}
  };

  const savePin = async () => {
    if (!inputZone.trim()) return;
    const data: PinData = {
      zone: inputZone.trim(),
      note: inputNote.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setPin(data);
      checkScale.value = withSpring(1, { damping: 10, stiffness: 200 });
      setModalVisible(false);
      setInputZone('');
      setInputNote('');
    } catch {}
  };

  const clearPin = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setPin(null);
      checkScale.value = withTiming(0);
    } catch {}
  };

  const handleNavigate = () => {
    if (!pin) return;
    const query = encodeURIComponent(`${pin.zone} Kampus Parkir`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  };

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <>
      <Animated.View style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isDark ? colors.border : colors.borderLight,
          borderWidth: isDark ? 1 : 0,
        },
        pressStyle,
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconBg, { backgroundColor: colors.primary + (isDark ? '25' : '15') }]}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Pin Lokasi Parkirku</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {pin ? `Disimpan ${pin.timestamp}` : 'Belum ada pin disimpan'}
              </Text>
            </View>
          </View>
          {pin && (
            <Animated.View style={checkStyle}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            </Animated.View>
          )}
        </View>

        {/* Content */}
        {pin ? (
          <View style={styles.pinInfo}>
            <View style={styles.pinZoneRow}>
              <Ionicons name="map-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.pinZone, { color: colors.textPrimary }]}>{pin.zone}</Text>
            </View>
            {pin.note ? (
              <Text style={[styles.pinNote, { color: colors.textSecondary }]} numberOfLines={2}>{pin.note}</Text>
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.navBtn, { backgroundColor: colors.primary }]}
                onPress={handleNavigate}
                accessibilityLabel="Navigasi ke lokasi parkir"
              >
                <Ionicons name="navigate-outline" size={14} color="#FFFFFF" />
                <Text style={styles.navBtnText}>Navigasi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.primary + (isDark ? '25' : '10') }]}
                onPress={() => {
                  setInputZone(pin.zone);
                  setInputNote(pin.note);
                  setModalVisible(true);
                }}
                accessibilityLabel="Ubah pin parkir"
              >
                <Ionicons name="create-outline" size={14} color={colors.primary} />
                <Text style={[styles.editBtnText, { color: colors.primary }]}>Ubah</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.clearBtn, { backgroundColor: colors.danger + (isDark ? '25' : '10') }]}
                onPress={clearPin}
                accessibilityLabel="Hapus pin parkir"
              >
                <Ionicons name="trash-outline" size={14} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary + (isDark ? '25' : '10') }]}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Tambah pin lokasi parkir"
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>Tandai Lokasi Parkir Sekarang</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Modal Input */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* Handle bar */}
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>📍 Tandai Lokasi Parkir</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalClose}
                accessibilityLabel="Tutup"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Area / Zona Parkir</Text>

            {/* Preset zone chips */}
            <View style={styles.presetRow}>
              {PRESET_ZONES.map((zone) => (
                <TouchableOpacity
                  key={zone}
                  style={[
                    styles.presetChip,
                    { backgroundColor: isDark ? colors.background : '#F3F4F6' },
                    inputZone === zone && [styles.presetChipActive, { backgroundColor: colors.primary }],
                  ]}
                  onPress={() => setInputZone(zone)}
                  accessibilityLabel={`Pilih zona: ${zone}`}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      { color: colors.textPrimary },
                      inputZone === zone && styles.presetChipTextActive,
                    ]}
                  >
                    {zone}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom input */}
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Atau ketik sendiri (misal: Slot B-12)"
              placeholderTextColor={colors.textTertiary}
              value={inputZone}
              onChangeText={setInputZone}
              accessibilityLabel="Input zona parkir"
            />

            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>
              Catatan (opsional)
            </Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Contoh: Dekat tiang merah, baris ke-3"
              placeholderTextColor={Colors.textTertiary}
              value={inputNote}
              onChangeText={setInputNote}
              multiline
              numberOfLines={2}
              accessibilityLabel="Catatan lokasi parkir"
            />

            {isOffline && (
              <View style={[styles.offlineWarningBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5' }]}>
                <Ionicons name="cloud-offline-outline" size={15} color={colors.danger} />
                <Text style={[styles.offlineWarningText, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>
                  Mode Offline: Penyimpanan pin lokasi dinonaktifkan sementara.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!inputZone.trim() || isOffline) && styles.saveBtnDisabled,
              ]}
              onPress={savePin}
              disabled={!inputZone.trim() || isOffline}
              accessibilityLabel={isOffline ? "Offline: Tombol dinonaktifkan" : "Simpan pin lokasi parkir"}
            >
              <Ionicons name={isOffline ? "cloud-offline-outline" : "location"} size={18} color={Colors.white} />
              <Text style={styles.saveBtnText}>
                {isOffline ? 'Offline — Dinonaktifkan' : 'Simpan Pin'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  pinInfo: {
    gap: Spacing.sm,
  },
  pinZoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pinZone: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  pinNote: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    flex: 1,
    justifyContent: 'center',
  },
  navBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  editBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.xl,
    paddingTop: Spacing.md,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.borderLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetChipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  presetChipTextActive: {
    color: Colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  inputMulti: {
    minHeight: 64,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm + 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.border,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  offlineWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  offlineWarningText: {
    fontSize: FontSize.xs,
    flex: 1,
    lineHeight: 16,
  },
});
