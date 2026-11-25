/**
 * PARKIN — Smart Campus Parking
 * Screen: Operasional Parkir (Todo List Async & Monitoring Area Parkir)
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_CONFIG } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { parkingAreas as localParkingAreas } from '../data/parkingData';
import { ParkingArea as DomainParkingArea } from '../models/parking';

// ============================================================
// Types
// ============================================================

export interface ParkingTodo {
  id: number;
  title: string;
  completed: boolean;
  userId?: number;
  category?: string;
  time?: string;
}

export interface ApiParkingArea {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  occupancy: number;
  status: 'AVAILABLE' | 'BUSY' | 'FULL';
  type: 'MOTOR' | 'MOBIL';
}

type TabType = 'todos' | 'areas';

const JSONPLACEHOLDER_TODOS_URL = 'https://jsonplaceholder.typicode.com/todos';

// Tugas operasional realistis yang terhubung ke area parkir PARKIN (PARKIRAN 1–5)
const PARKIN_DEFAULT_TASKS: { title: string; category: string }[] = [
  { title: 'Cek slot tersedia & palang pintu masuk utama', category: 'PARKIRAN 1' },
  { title: 'Patroli area parkir motor Fakultas Teknik', category: 'PARKIRAN 2' },
  { title: 'Pantau kepadatan & arahkan kendaraan dekat Kantin Pusat', category: 'PARKIRAN 3' },
  { title: 'Periksa penerangan & marka area parkir terbuka', category: 'PARKIRAN 4' },
  { title: 'Verifikasi parkir tamu & staf dekat Gedung Rektorat', category: 'PARKIRAN 5' },
  { title: 'Kalibrasi kamera pemindai QR tiket pintu masuk', category: 'PARKIRAN 1' },
  { title: 'Atur antrean keluar mahasiswa jam pulang kuliah', category: 'PARKIRAN 2' },
  { title: 'Siapkan jalur alternatif saat kapasitas hampir penuh', category: 'PARKIRAN 3' },
  { title: 'Bersihkan rambu & pembatas slot parkir kapasitas besar', category: 'PARKIRAN 4' },
  { title: 'Rekap laporan okupansi harian area Rektorat', category: 'PARKIRAN 5' },
];

// ============================================================
// Helpers
// ============================================================

function normalizeAreaStatus(status: string, occupancy: number): 'AVAILABLE' | 'BUSY' | 'FULL' {
  const upper = status.toUpperCase();
  if (upper === 'FULL' || occupancy >= 95) return 'FULL';
  if (upper === 'BUSY' || upper === 'NEAR FULL' || occupancy >= 70) return 'BUSY';
  return 'AVAILABLE';
}

function mapLocalParkingAreas(areas: DomainParkingArea[]): ApiParkingArea[] {
  return areas.map((area, idx) => ({
    id: area.id,
    name: area.name,
    capacity: area.capacity,
    occupied: area.occupied,
    available: area.available,
    occupancy: area.occupancy,
    status: normalizeAreaStatus(area.status, area.occupancy),
    type: idx % 2 === 0 ? 'MOTOR' : 'MOBIL',
  }));
}

function normalizeRemoteArea(raw: Partial<ApiParkingArea>, idx: number): ApiParkingArea {
  const capacity = Math.max(1, Number(raw.capacity) || 100);
  const occupied = Math.min(capacity, Math.max(0, Number(raw.occupied) || 0));
  const available =
    typeof raw.available === 'number' ? Math.max(0, raw.available) : Math.max(0, capacity - occupied);
  const occupancy =
    typeof raw.occupancy === 'number' ? raw.occupancy : Math.round((occupied / capacity) * 100);

  return {
    id: String(raw.id ?? idx + 1),
    name: raw.name || `PARKIRAN ${idx + 1}`,
    capacity,
    occupied,
    available,
    occupancy,
    status: normalizeAreaStatus(String(raw.status || ''), occupancy),
    type: raw.type === 'MOBIL' ? 'MOBIL' : raw.type === 'MOTOR' ? 'MOTOR' : idx % 2 === 0 ? 'MOTOR' : 'MOBIL',
  };
}

function formatCurrentClock(): string {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ============================================================
// Sub-komponen: TodoItemCard
// ============================================================

interface TodoItemCardProps {
  todo: ParkingTodo;
  isPatching: boolean;
  isDeleting: boolean;
  onToggle: (todo: ParkingTodo) => void;
  onDelete: (id: number) => void;
}

function TodoItemCard({
  todo,
  isPatching,
  isDeleting,
  onToggle,
  onDelete,
}: TodoItemCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.todoCard,
        {
          backgroundColor: todo.completed
            ? isDark
              ? 'rgba(34, 197, 94, 0.08)'
              : '#F0FDF4'
            : colors.surface,
          borderColor: todo.completed ? colors.success + '44' : colors.border,
          opacity: todo.completed ? 0.9 : 1,
        },
      ]}
    >
      {/* Tombol Centang / Toggle */}
      <TouchableOpacity
        style={[
          styles.checkboxBtn,
          {
            borderColor: todo.completed ? colors.success : colors.primary,
            backgroundColor: todo.completed ? colors.success : 'transparent',
          },
        ]}
        onPress={() => onToggle(todo)}
        disabled={isPatching}
        activeOpacity={0.7}
        accessibilityLabel={`Tandai tugas ${todo.title} ${todo.completed ? 'belum selesai' : 'selesai'}`}
      >
        {isPatching ? (
          <ActivityIndicator size="small" color={todo.completed ? '#fff' : colors.primary} />
        ) : todo.completed ? (
          <Ionicons name="checkmark" size={16} color="#fff" />
        ) : (
          <View style={styles.checkboxEmpty} />
        )}
      </TouchableOpacity>

      {/* Konten Tugas */}
      <TouchableOpacity
        style={styles.todoContent}
        onPress={() => onToggle(todo)}
        disabled={isPatching}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.todoTitle,
            {
              color: todo.completed ? colors.textTertiary : colors.textPrimary,
              textDecorationLine: todo.completed ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={2}
        >
          {todo.title}
        </Text>
        <View style={styles.todoMetaRow}>
          {todo.category && (
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '1A' }]}>
              <Text style={[styles.categoryBadgeTxt, { color: colors.primary }]}>
                {todo.category}
              </Text>
            </View>
          )}
          {todo.time && (
            <Text style={[styles.todoTimeTxt, { color: colors.textTertiary }]}>
              <Ionicons name="time-outline" size={11} color={colors.textTertiary} /> {todo.time}
            </Text>
          )}
          <View
            style={[
              styles.statusTag,
              {
                backgroundColor: todo.completed
                  ? colors.successBg
                  : colors.warningBg,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: todo.completed ? colors.success : colors.warning },
              ]}
            />
            <Text
              style={[
                styles.statusTagTxt,
                { color: todo.completed ? colors.success : colors.warning },
              ]}
            >
              {todo.completed ? 'Selesai' : 'Belum Selesai'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Tombol Hapus */}
      <TouchableOpacity
        style={[styles.deleteTodoBtn, { backgroundColor: colors.dangerBg }]}
        onPress={() => onDelete(todo.id)}
        disabled={isDeleting}
        activeOpacity={0.7}
        accessibilityLabel={`Hapus tugas ${todo.title}`}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color={colors.danger} />
        ) : (
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// Sub-komponen: AreaCard
// ============================================================

interface AreaCardProps {
  area: ApiParkingArea;
  isPatching: boolean;
  onPatch: (area: ApiParkingArea) => void;
  onCheckin: (area: ApiParkingArea) => void;
}

function AreaCard({ area, isPatching, onPatch, onCheckin }: AreaCardProps) {
  const { colors } = useTheme();
  const sColor =
    area.status === 'AVAILABLE'
      ? colors.success
      : area.status === 'BUSY'
      ? colors.warning
      : colors.danger;
  const sLabel =
    area.status === 'AVAILABLE' ? 'Tersedia' : area.status === 'BUSY' ? 'Ramai' : 'Penuh';

  return (
    <View
      style={[
        styles.areaCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.areaCardHeader}>
        <View style={[styles.areaTypeBadge, { backgroundColor: colors.primary + '1A' }]}>
          <Ionicons
            name={area.type === 'MOTOR' ? 'bicycle-outline' : 'car-outline'}
            size={13}
            color={colors.primary}
          />
          <Text style={[styles.areaTypeTxt, { color: colors.primary }]}>{area.type}</Text>
        </View>

        <View
          style={[
            styles.statusTag,
            { backgroundColor: sColor + '20', borderColor: sColor + '50', borderWidth: 1 },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: sColor }]} />
          <Text style={[styles.statusTagTxt, { color: sColor }]}>{sLabel}</Text>
        </View>
      </View>

      <Text style={[styles.areaName, { color: colors.textPrimary }]}>{area.name}</Text>

      {/* Stat Bar */}
      <View style={styles.statGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.textPrimary }]}>{area.capacity}</Text>
          <Text style={[styles.statSub, { color: colors.textTertiary }]}>Kapasitas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.warning }]}>{area.occupied}</Text>
          <Text style={[styles.statSub, { color: colors.textTertiary }]}>Terisi</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.success }]}>{area.available}</Text>
          <Text style={[styles.statSub, { color: colors.textTertiary }]}>Tersedia</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: sColor }]}>{area.occupancy}%</Text>
          <Text style={[styles.statSub, { color: colors.textTertiary }]}>Occupancy</Text>
        </View>
      </View>

      {/* Occupancy Progress */}
      <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(area.occupancy, 100)}%`,
              backgroundColor: sColor,
            },
          ]}
        />
      </View>

      {/* Aksi */}
      <View style={styles.areaActionsRow}>
        <TouchableOpacity
          style={[
            styles.areaBtnPrimary,
            { backgroundColor: colors.primary, opacity: area.available <= 0 ? 0.5 : 1 },
          ]}
          onPress={() => onCheckin(area)}
          disabled={area.available <= 0}
        >
          <Ionicons name="log-in-outline" size={14} color="#fff" />
          <Text style={styles.areaBtnPrimaryTxt}>Check-in</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.areaBtnSecondary,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={() => onPatch(area)}
          disabled={isPatching}
        >
          {isPatching ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="swap-horizontal-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.areaBtnSecondaryTxt, { color: colors.textSecondary }]}>
                Ganti Status
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// Main Screen: ParkingApiScreen
// ============================================================

export default function ParkingApiScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const toast = useToast();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [todos, setTodos] = useState<ParkingTodo[]>([]);
  const [areas, setAreas] = useState<ApiParkingArea[]>(() =>
    mapLocalParkingAreas(localParkingAreas)
  );
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [patchingIds, setPatchingIds] = useState<Set<number | string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number | string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Form input tugas baru
  const [newTodoTitle, setNewTodoTitle] = useState('');

  // Modal check-in parkir
  const [selectedArea, setSelectedArea] = useState<ApiParkingArea | null>(null);
  const [vehicleType, setVehicleType] = useState<'MOTOR' | 'MOBIL'>('MOTOR');
  const [plateNumber, setPlateNumber] = useState('');
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const abortControllerRef = useRef<AbortController | null>(null);

  const triggerSpin = useCallback(() => {
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Fetch Area Parkir dengan fallback otomatis tanpa memicu toast error saat localhost:5000 mati
  const fetchAreasWithFallback = useCallback(async (parentSignal?: AbortSignal) => {
    const localController = new AbortController();
    const timeoutId = setTimeout(() => localController.abort(), 2500);
    const onParentAbort = () => localController.abort();

    if (parentSignal) {
      if (parentSignal.aborted) {
        clearTimeout(timeoutId);
        return mapLocalParkingAreas(localParkingAreas);
      }
      parentSignal.addEventListener('abort', onParentAbort);
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/parking-areas`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: localController.signal,
      });
      if (!response.ok) {
        return mapLocalParkingAreas(localParkingAreas);
      }
      const raw = await response.json();
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : null;
      if (list && list.length > 0) {
        return list.map((item: Partial<ApiParkingArea>, idx: number) =>
          normalizeRemoteArea(item, idx)
        );
      }
      return mapLocalParkingAreas(localParkingAreas);
    } catch {
      // Server lokal tidak aktif -> gunakan data lokal dengan mulus tanpa toast spam
      return mapLocalParkingAreas(localParkingAreas);
    } finally {
      clearTimeout(timeoutId);
      parentSignal?.removeEventListener('abort', onParentAbort);
    }
  }, []);

  // GET daftar Todo dari JSONPlaceholder + Area Parkir (dengan fallback)
  const loadAllData = useCallback(
    async (isRefreshAction = false) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (isRefreshAction) {
        setIsRefreshing(true);
        triggerSpin();
      } else {
        setIsInitialLoading(true);
      }
      setErrorMsg(null);

      try {
        const [todosResponse, resolvedAreas] = await Promise.all([
          fetch(`${JSONPLACEHOLDER_TODOS_URL}?_limit=10`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          }),
          fetchAreasWithFallback(controller.signal),
        ]);

        if (!todosResponse.ok) {
          throw new Error(`Server mengembalikan status ${todosResponse.status}`);
        }

        const todosJson: ParkingTodo[] = await todosResponse.json();
        if (controller.signal.aborted) return;

        setTodos(
          Array.isArray(todosJson)
            ? todosJson.map((item, idx) => {
                const parkinTask = PARKIN_DEFAULT_TASKS[idx % PARKIN_DEFAULT_TASKS.length];
                return {
                  id: Number(item.id),
                  title: parkinTask.title,
                  completed: Boolean(item.completed),
                  userId: item.userId,
                  category: parkinTask.category,
                };
              })
            : []
        );
        setAreas(resolvedAreas);
        setLastUpdated(formatCurrentClock());
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const msg =
          err instanceof Error && err.message
            ? `Gagal memuat daftar tugas: ${err.message}`
            : 'Gagal memuat daftar tugas. Periksa koneksi internet Anda.';
        setErrorMsg(msg);
      } finally {
        if (!controller.signal.aborted) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [fetchAreasWithFallback, triggerSpin]
  );

  useEffect(() => {
    loadAllData(false);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [loadAllData]);

  // POST: Tambah tugas baru ke JSONPlaceholder
  const handleAddTodo = async () => {
    const trimmed = newTodoTitle.trim();
    if (!trimmed) {
      toast.warning('Tuliskan judul tugas terlebih dahulu.', { title: 'Input Kosong' });
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch(JSONPLACEHOLDER_TODOS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          title: trimmed,
          completed: false,
          userId: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Permintaan gagal (${response.status})`);
      }

      await response.json();
      const createdTodo: ParkingTodo = {
        id: Date.now(),
        title: trimmed,
        completed: false,
        userId: 1,
        category: 'Operasional',
        time: formatCurrentClock().slice(0, 5),
      };

      setTodos((prev) => [createdTodo, ...prev]);
      setNewTodoTitle('');
      toast.success(`Tugas "${trimmed}" berhasil ditambahkan!`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal menambahkan tugas baru.';
      toast.error(msg, { title: 'Gagal Menambah Tugas' });
    } finally {
      setIsPosting(false);
    }
  };

  // PATCH: Toggle status selesai tugas ke JSONPlaceholder
  const handleToggleTodo = async (todo: ParkingTodo) => {
    const nextCompleted = !todo.completed;
    setPatchingIds((prev) => new Set(prev).add(todo.id));

    try {
      const targetId = todo.id > 200 ? 1 : todo.id;
      const response = await fetch(`${JSONPLACEHOLDER_TODOS_URL}/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          Accept: 'application/json',
        },
        body: JSON.stringify({ completed: nextCompleted }),
      });

      if (!response.ok) {
        throw new Error(`Gagal memperbarui status (${response.status})`);
      }

      await response.json();
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, completed: nextCompleted } : t))
      );
      toast.info(
        `Tugas ditandai ${nextCompleted ? 'Selesai' : 'Belum Selesai'}`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal mengubah status tugas.';
      toast.error(msg, { title: 'Gagal Memperbarui' });
    } finally {
      setPatchingIds((prev) => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
    }
  };

  // DELETE: Hapus tugas dari JSONPlaceholder & state lokal
  const handleDeleteTodo = async (id: number) => {
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      const targetId = id > 200 ? 1 : id;
      const response = await fetch(`${JSONPLACEHOLDER_TODOS_URL}/${targetId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Gagal menghapus tugas (${response.status})`);
      }
      setTodos((prev) => prev.filter((t) => t.id !== id));
      toast.success('Tugas berhasil dihapus.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus tugas.';
      toast.error(msg, { title: 'Gagal Menghapus' });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Update status area parkir (coba API lokal dulu, lalu fallback update state)
  const handlePatchAreaStatus = async (area: ApiParkingArea) => {
    setPatchingIds((prev) => new Set(prev).add(area.id));
    const nextStatus: ApiParkingArea['status'] =
      area.status === 'AVAILABLE' ? 'BUSY' : area.status === 'BUSY' ? 'FULL' : 'AVAILABLE';

    const applyLocalStatus = (): ApiParkingArea => {
      const nextOccupied =
        nextStatus === 'FULL'
          ? area.capacity
          : nextStatus === 'BUSY'
          ? Math.round(area.capacity * 0.75)
          : Math.round(area.capacity * 0.35);
      return {
        ...area,
        status: nextStatus,
        occupied: nextOccupied,
        available: area.capacity - nextOccupied,
        occupancy: Math.round((nextOccupied / area.capacity) * 100),
      };
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/parking-areas/${area.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
          signal: controller.signal,
        }
      );
      if (response.ok) {
        const resJson = await response.json();
        const updated = resJson?.data ? normalizeRemoteArea(resJson.data, 0) : applyLocalStatus();
        setAreas((prev) => prev.map((a) => (a.id === area.id ? updated : a)));
      } else {
        setAreas((prev) => prev.map((a) => (a.id === area.id ? applyLocalStatus() : a)));
      }
      toast.info(`Status ${area.name} diperbarui ke ${nextStatus}`);
    } catch {
      setAreas((prev) => prev.map((a) => (a.id === area.id ? applyLocalStatus() : a)));
      toast.info(`Status ${area.name} diperbarui ke ${nextStatus}`);
    } finally {
      clearTimeout(timeoutId);
      setPatchingIds((prev) => {
        const next = new Set(prev);
        next.delete(area.id);
        return next;
      });
    }
  };

  // Check-in Parkir (coba API lokal dulu, lalu fallback update state + masukkan ke daftar tugas)
  const handleConfirmCheckin = async () => {
    if (!selectedArea) return;
    const plate = plateNumber.trim().toUpperCase();
    if (!plate) {
      toast.warning('Nomor plat kendaraan wajib diisi.', { title: 'Validasi' });
      return;
    }

    setIsPosting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      await fetch(`${API_CONFIG.BASE_URL}/parking-checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          areaId: selectedArea.id,
          vehicleType,
          plateNumber: plate,
        }),
        signal: controller.signal,
      }).catch(() => null);

      setAreas((prev) =>
        prev.map((a) => {
          if (a.id !== selectedArea.id) return a;
          const occupied = Math.min(a.occupied + 1, a.capacity);
          const available = Math.max(0, a.capacity - occupied);
          const occupancy = Math.round((occupied / a.capacity) * 100);
          return {
            ...a,
            occupied,
            available,
            occupancy,
            status: normalizeAreaStatus(a.status, occupancy),
          };
        })
      );

      const verificationTodo: ParkingTodo = {
        id: Date.now(),
        title: `Verifikasi Kendaraan: ${plate} (${vehicleType}) di ${selectedArea.name}`,
        completed: false,
        category: 'Check-in',
        time: formatCurrentClock().slice(0, 5),
      };
      setTodos((prev) => [verificationTodo, ...prev]);

      setShowCheckinModal(false);
      setPlateNumber('');
      setSelectedArea(null);
      setActiveTab('todos');
      toast.success(`Check-in ${plate} berhasil dicatat!`);
    } finally {
      clearTimeout(timeoutId);
      setIsPosting(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.headerBtn,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={handleGoBack}
          activeOpacity={0.7}
          accessibilityLabel="Kembali ke Beranda"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Operasional Parkir
          </Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Tugas Operasional & Data Parkir Real-Time
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.headerBtn,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={() => loadAllData(true)}
          disabled={isRefreshing || isInitialLoading}
          activeOpacity={0.7}
          accessibilityLabel="Muat ulang data"
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="reload" size={18} color={colors.primary} />
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      {/* TAB NAVIGATOR (Todo List Tugas vs Area Parkir) */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabBtn,
            {
              backgroundColor: activeTab === 'todos' ? colors.primary : colors.background,
              borderColor: activeTab === 'todos' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setActiveTab('todos')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="checkbox-outline"
            size={16}
            color={activeTab === 'todos' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabBtnTxt,
              { color: activeTab === 'todos' ? '#fff' : colors.textSecondary },
            ]}
          >
            Todo List Tugas ({todos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            {
              backgroundColor: activeTab === 'areas' ? colors.primary : colors.background,
              borderColor: activeTab === 'areas' ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setActiveTab('areas')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="car-sport-outline"
            size={16}
            color={activeTab === 'areas' ? '#fff' : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabBtnTxt,
              { color: activeTab === 'areas' ? '#fff' : colors.textSecondary },
            ]}
          >
            Area Parkir ({areas.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* LOADING STATE */}
      {isInitialLoading ? (
        <View style={styles.centerLoadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.centerLoadingTitle, { color: colors.textPrimary }]}>
            Memuat Data Operasional...
          </Text>
          <Text style={[styles.centerLoadingSub, { color: colors.textSecondary }]}>
            Mengambil daftar tugas & status area parkir
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadAllData(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {lastUpdated ? (
            <Text style={[styles.lastUpdateText, { color: colors.textTertiary }]}>
              Terakhir diperbarui: {lastUpdated} (Tarik layar untuk refresh)
            </Text>
          ) : null}

          {/* INLINE ERROR CARD (Tidak menutupi header atau tab) */}
          {errorMsg && activeTab === 'todos' && (
            <View
              style={[
                styles.inlineErrorCard,
                { backgroundColor: colors.dangerBg, borderColor: colors.danger },
              ]}
            >
              <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.errorTitle, { color: colors.danger }]}>
                  Gagal Memuat Tugas
                </Text>
                <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
                  {errorMsg}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.retryBtnSmall, { backgroundColor: colors.primary }]}
                onPress={() => loadAllData(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={15} color="#fff" />
                <Text style={styles.retryBtnTxt}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 1: TODO LIST TUGAS */}
          {activeTab === 'todos' && (
            <View>
              <View
                style={[
                  styles.addTodoBox,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.sectionHeaderTitle, { color: colors.textPrimary }]}>
                  Tambah Tugas Operasional
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.inputField,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="Contoh: Cek slot parkir gedung utama..."
                    placeholderTextColor={colors.textTertiary}
                    value={newTodoTitle}
                    onChangeText={setNewTodoTitle}
                    onSubmitEditing={handleAddTodo}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      { backgroundColor: colors.primary, opacity: isPosting ? 0.7 : 1 },
                    ]}
                    onPress={handleAddTodo}
                    disabled={isPosting}
                    activeOpacity={0.8}
                  >
                    {isPosting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={styles.addBtnTxt}>Tambah</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.listHeaderRow}>
                <Text style={[styles.sectionHeaderTitle, { color: colors.textPrimary }]}>
                  Daftar Tugas Parkir ({todos.filter((t) => t.completed).length}/{todos.length} Selesai)
                </Text>
                <Text style={[styles.listHeaderSubtitle, { color: colors.textSecondary }]}>
                  Klik centang untuk tandai selesai
                </Text>
              </View>

              {todos.length === 0 ? (
                <View style={styles.emptyList}>
                  <Ionicons name="clipboard-outline" size={40} color={colors.textTertiary} />
                  <Text style={[styles.emptyListTxt, { color: colors.textSecondary }]}>
                    Belum ada tugas operasional.
                  </Text>
                </View>
              ) : (
                todos.map((todo) => (
                  <TodoItemCard
                    key={todo.id}
                    todo={todo}
                    isPatching={patchingIds.has(todo.id)}
                    isDeleting={deletingIds.has(todo.id)}
                    onToggle={handleToggleTodo}
                    onDelete={handleDeleteTodo}
                  />
                ))
              )}
            </View>
          )}

          {/* TAB 2: AREA PARKIR */}
          {activeTab === 'areas' && (
            <View>
              <View style={styles.listHeaderRow}>
                <Text style={[styles.sectionHeaderTitle, { color: colors.textPrimary }]}>
                  Status Area Parkir ({areas.length})
                </Text>
                <Text style={[styles.listHeaderSubtitle, { color: colors.textSecondary }]}>
                  Tekan Ganti Status untuk memperbarui kondisi area
                </Text>
              </View>

              {areas.map((area) => (
                <AreaCard
                  key={area.id}
                  area={area}
                  isPatching={patchingIds.has(area.id)}
                  onPatch={handlePatchAreaStatus}
                  onCheckin={(a) => {
                    setSelectedArea(a);
                    setShowCheckinModal(true);
                  }}
                />
              ))}
            </View>
          )}

          {/* MODAL POPUP CHECK-IN PARKIR */}
          <Modal
            visible={showCheckinModal && !!selectedArea}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCheckinModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalHeaderIcon,
                      { backgroundColor: colors.primary + '1A' },
                    ]}
                  >
                    <Ionicons name="car-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                      Check-in Parkir
                    </Text>
                    <Text style={[styles.modalAreaName, { color: colors.primary }]}>
                      {selectedArea?.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowCheckinModal(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Pilih Jenis Kendaraan:
                </Text>
                <View style={styles.toggleRow}>
                  {(['MOTOR', 'MOBIL'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.toggleBtn,
                        {
                          backgroundColor:
                            vehicleType === type ? colors.primary : colors.background,
                          borderColor:
                            vehicleType === type ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setVehicleType(type)}
                    >
                      <Ionicons
                        name={type === 'MOTOR' ? 'bicycle-outline' : 'car-outline'}
                        size={16}
                        color={vehicleType === type ? '#fff' : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.toggleBtnTxt,
                          {
                            color: vehicleType === type ? '#fff' : colors.textSecondary,
                            fontWeight: vehicleType === type ? '700' : '600',
                          },
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Nomor Plat Kendaraan:
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Contoh: B 1234 ABC"
                  placeholderTextColor={colors.textTertiary}
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                  autoCapitalize="characters"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.cancelBtn,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                    onPress={() => setShowCheckinModal(false)}
                  >
                    <Text style={[styles.cancelBtnTxt, { color: colors.textSecondary }]}>
                      Batal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                    onPress={handleConfirmCheckin}
                    disabled={isPosting}
                  >
                    {isPosting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={15} color="#fff" />
                        <Text style={styles.confirmBtnTxt}>Konfirmasi Check-in</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  tabBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  centerLoadingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  centerLoadingSub: {
    fontSize: 12,
  },
  inlineErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  errorSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  retryBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  retryBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  lastUpdateText: {
    fontSize: 11,
    textAlign: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  listHeaderRow: {
    marginTop: 6,
    marginBottom: 8,
  },
  listHeaderSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  addTodoBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 4,
  },
  addBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  todoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  checkboxBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: {
    width: 8,
    height: 8,
  },
  todoContent: {
    flex: 1,
    gap: 4,
  },
  todoTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  todoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
  todoTimeTxt: {
    fontSize: 10,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusTagTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
  deleteTodoBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyListTxt: {
    fontSize: 13,
  },
  areaCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 10,
  },
  areaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  areaTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  areaTypeTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  areaName: {
    fontSize: 14,
    fontWeight: '700',
  },
  statGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 15,
    fontWeight: '800',
  },
  statSub: {
    fontSize: 10,
    marginTop: 2,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  areaActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  areaBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 5,
  },
  areaBtnPrimaryTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  areaBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 5,
  },
  areaBtnSecondaryTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalAreaName: {
    fontSize: 12,
    marginTop: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: -4,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  toggleBtnTxt: {
    fontSize: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  confirmBtnTxt: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
});
