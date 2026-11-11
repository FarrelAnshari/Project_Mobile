/**
 * PARKIN – Smart Campus Parking
 * Screen: Async API Parkir (Week 8)
 *
 * Implementasi 6 Fitur Wajib Asynchronous API (Sesuai Slide 15 PPT Week 8):
 *  01. GET  – Mengambil data tugas operasional parkir & area parkir via fetch() + useEffect()
 *  02. Loading Indicator – Menampilkan <ActivityIndicator /> saat aplikasi menunggu respons
 *  03. POST – Form input teks untuk menambahkan tugas baru / check-in kendaraan
 *  04. PATCH – Centang / toggle untuk menandai tugas selesai atau belum selesai secara dinamis
 *  05. Error Handling – Blok try...catch dengan feedback ramah pengguna & tombol coba lagi
 *  06. Refresh – Tombol reload & pull-to-refresh untuk mengambil ulang data terbaru
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from '../context/ToastContext';
import { apiClient, ApiError } from '../services/apiClient';

// ============================================================
// Types
// ============================================================

export interface ParkingTodo {
  id: number;
  title: string;
  completed: boolean;
  category?: string;
  time?: string;
}

export interface ParkingArea {
  id: string;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  occupancy: number;
  status: 'AVAILABLE' | 'BUSY' | 'FULL';
  type: 'MOTOR' | 'MOBIL';
}

export interface CheckinResult {
  id: string;
  areaId: string;
  areaName: string;
  vehicleType: string;
  plateNumber: string;
  checkinTime: string;
  status: string;
}

type TabType = 'todos' | 'areas';

// ============================================================
// Theme Colors
// ============================================================

const C = {
  bg:        '#0B0D17',
  surface:   '#14172B',
  card:      '#1E223D',
  cardBorder:'#2E3460',
  textPrim:  '#F8FAFC',
  textSec:   '#94A3B8',
  textMuted: '#64748B',
  primary:   '#6366F1',
  primaryLight: '#818CF8',
  success:   '#10B981',
  warning:   '#F59E0B',
  danger:    '#EF4444',
};

// ============================================================
// Sub-komponen: TodoItemCard (Fitur 04: Centang / Toggle PATCH)
// ============================================================

interface TodoItemCardProps {
  todo: ParkingTodo;
  isPatching: boolean;
  isDeleting: boolean;
  onToggle: (todo: ParkingTodo) => void;
  onDelete: (id: number) => void;
}

function TodoItemCard({ todo, isPatching, isDeleting, onToggle, onDelete }: TodoItemCardProps) {
  return (
    <View style={[styles.todoCard, todo.completed && styles.todoCardCompleted]}>
      {/* 04: Tombol Centang / Toggle PATCH */}
      <TouchableOpacity
        style={[styles.checkboxBtn, todo.completed && styles.checkboxBtnChecked]}
        onPress={() => onToggle(todo)}
        disabled={isPatching}
        activeOpacity={0.7}
        accessibilityLabel={`Tandai tugas ${todo.title} ${todo.completed ? 'belum selesai' : 'selesai'}`}
      >
        {isPatching ? (
          <ActivityIndicator size="small" color={todo.completed ? '#fff' : C.primary} />
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
          style={[styles.todoTitle, todo.completed && styles.todoTitleCompleted]}
          numberOfLines={2}
        >
          {todo.title}
        </Text>
        <View style={styles.todoMetaRow}>
          {todo.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeTxt}>{todo.category}</Text>
            </View>
          )}
          {todo.time && (
            <Text style={styles.todoTimeTxt}>
              <Ionicons name="time-outline" size={11} color={C.textMuted} /> {todo.time}
            </Text>
          )}
          <View
            style={[
              styles.statusTag,
              { backgroundColor: todo.completed ? C.success + '22' : C.warning + '22' },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: todo.completed ? C.success : C.warning },
              ]}
            />
            <Text
              style={[
                styles.statusTagTxt,
                { color: todo.completed ? C.success : C.warning },
              ]}
            >
              {todo.completed ? 'Selesai (PATCH)' : 'Belum Selesai'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Tombol Hapus (DELETE) */}
      <TouchableOpacity
        style={styles.deleteTodoBtn}
        onPress={() => onDelete(todo.id)}
        disabled={isDeleting}
        activeOpacity={0.7}
        accessibilityLabel={`Hapus tugas ${todo.title}`}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color={C.danger} />
        ) : (
          <Ionicons name="trash-outline" size={16} color={C.danger} />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ============================================================
// Sub-komponen: AreaCard (Monitoring Area Parkir)
// ============================================================

interface AreaCardProps {
  area: ParkingArea;
  isPatching: boolean;
  onPatch: (area: ParkingArea) => void;
  onCheckin: (area: ParkingArea) => void;
}

function AreaCard({ area, isPatching, onPatch, onCheckin }: AreaCardProps) {
  const sColor = area.status === 'AVAILABLE' ? C.success : area.status === 'BUSY' ? C.warning : C.danger;
  const sLabel = area.status === 'AVAILABLE' ? 'Tersedia' : area.status === 'BUSY' ? 'Ramai' : 'Penuh';

  return (
    <View style={styles.areaCard}>
      <View style={styles.areaCardHeader}>
        <View style={[styles.areaTypeBadge, { backgroundColor: area.type === 'MOTOR' ? C.primary + '22' : '#8B5CF622' }]}>
          <Ionicons
            name={area.type === 'MOTOR' ? 'bicycle-outline' : 'car-outline'}
            size={13}
            color={area.type === 'MOTOR' ? C.primaryLight : '#A78BFA'}
          />
          <Text style={[styles.areaTypeTxt, { color: area.type === 'MOTOR' ? C.primaryLight : '#A78BFA' }]}>
            {area.type}
          </Text>
        </View>

        <View style={[styles.statusTag, { backgroundColor: sColor + '22', borderColor: sColor + '55', borderWidth: 1 }]}>
          <View style={[styles.statusDot, { backgroundColor: sColor }]} />
          <Text style={[styles.statusTagTxt, { color: sColor }]}>{sLabel}</Text>
        </View>
      </View>

      <Text style={styles.areaName}>{area.name}</Text>

      {/* Stat Bar */}
      <View style={styles.statGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{area.capacity}</Text>
          <Text style={styles.statSub}>Kapasitas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: C.warning }]}>{area.occupied}</Text>
          <Text style={styles.statSub}>Terisi</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: C.success }]}>{area.available}</Text>
          <Text style={styles.statSub}>Tersedia</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: sColor }]}>{area.occupancy}%</Text>
          <Text style={styles.statSub}>Occupancy</Text>
        </View>
      </View>

      {/* Occupancy Progress */}
      <View style={styles.progressTrack}>
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
          style={[styles.areaBtnPrimary, { opacity: area.available <= 0 ? 0.5 : 1 }]}
          onPress={() => onCheckin(area)}
          disabled={area.available <= 0}
        >
          <Ionicons name="log-in-outline" size={14} color="#fff" />
          <Text style={styles.areaBtnPrimaryTxt}>Check-in (POST)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.areaBtnSecondary}
          onPress={() => onPatch(area)}
          disabled={isPatching}
        >
          {isPatching ? (
            <ActivityIndicator size="small" color={C.primaryLight} />
          ) : (
            <>
              <Ionicons name="swap-horizontal-outline" size={14} color={C.textSec} />
              <Text style={styles.areaBtnSecondaryTxt}>Ganti Status (PATCH)</Text>
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

  // ── State ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [todos, setTodos] = useState<ParkingTodo[]>([]);
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [patchingIds, setPatchingIds] = useState<Set<number | string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number | string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Form input todo baru (Fitur 03)
  const [newTodoTitle, setNewTodoTitle] = useState('');

  // Form check-in parkir
  const [selectedArea, setSelectedArea] = useState<ParkingArea | null>(null);
  const [vehicleType, setVehicleType] = useState<'MOTOR' | 'MOBIL'>('MOTOR');
  const [plateNumber, setPlateNumber] = useState('');
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  // Animasi rotasi tombol refresh
  const spinAnim = useRef(new Animated.Value(0)).current;

  const triggerSpin = () => {
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── 01. GET – Mengambil Data dari API ─────────────────────
  const loadAllData = useCallback(async (isRefreshAction = false) => {
    // Tampilkan loading screen penuh baik saat masuk awal maupun saat tombol refresh diklik
    setIsInitialLoading(true);
    if (isRefreshAction) {
      triggerSpin();
    }
    setErrorMsg(null);

    // Minimum delay agar Loading Screen terlihat jelas oleh pengguna & dosen (Fitur 02)
    const minDelay = new Promise(resolve => setTimeout(resolve, isRefreshAction ? 600 : 500));

    try {
      // Panggilan asinkron paralel untuk data Todos dan Data Area Parkir
      const [todosData, areasData] = await Promise.all([
        apiClient.get<ParkingTodo[]>('/todos', { requiresAuth: false }).catch(() => null),
        apiClient.get<ParkingArea[]>('/parking-areas', { requiresAuth: false }).catch(() => null),
        minDelay,
      ]);

      if (todosData && Array.isArray(todosData)) {
        setTodos(todosData);
      }
      if (areasData && Array.isArray(areasData)) {
        setAreas(areasData);
      }

      const now = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastUpdated(now);
      // Tanpa toast popup saat refresh sesuai permintaan pengguna (hanya loading screen)
    } catch (err: any) {
      // 05. Error Handling – try...catch menangani kegagalan koneksi
      const msg = err instanceof ApiError ? err.message : 'Gagal terhubung ke REST API Server.';
      setErrorMsg(msg);
      toast.error('Gagal mengambil data dari server. Pastikan mock API aktif.', {
        title: 'Error Koneksi',
      });
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadAllData(false);
  }, [loadAllData]);

  // ── 03. POST – Menambahkan Todo Baru ──────────────────────
  const handleAddTodo = async () => {
    const trimmed = newTodoTitle.trim();
    if (!trimmed) {
      toast.warning('Tuliskan judul tugas terlebih dahulu.', { title: 'Input Kosong' });
      return;
    }

    setIsPosting(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: ParkingTodo }>(
        '/todos',
        { title: trimmed, category: 'Operasional' },
        { requiresAuth: false }
      );

      if (res?.data) {
        setTodos(prev => [res.data, ...prev]);
        setNewTodoTitle('');
        toast.success(`Tugas "${trimmed}" berhasil ditambahkan!`, { title: 'POST Sukses' });
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menambahkan tugas baru.';
      toast.error(msg, { title: 'POST Gagal' });
    } finally {
      setIsPosting(false);
    }
  };

  // ── 04. PATCH – Centang / Toggle Status Selesai ───────────
  const handleToggleTodo = async (todo: ParkingTodo) => {
    const newStatus = !todo.completed;
    setPatchingIds(prev => new Set(prev).add(todo.id));

    try {
      const res = await apiClient.patch<{ success: boolean; data: ParkingTodo }>(
        `/todos/${todo.id}`,
        { completed: newStatus },
        { requiresAuth: false }
      );

      if (res?.data) {
        setTodos(prev => prev.map(t => (t.id === todo.id ? res.data : t)));
        toast.info(
          `Tugas ditandai: ${newStatus ? 'Selesai ✓' : 'Belum Selesai'}`,
          { title: 'PATCH Sukses' }
        );
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Gagal mengubah status tugas.';
      toast.error(msg, { title: 'PATCH Gagal' });
    } finally {
      setPatchingIds(prev => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
    }
  };

  // ── DELETE – Menghapus Todo ───────────────────────────────
  const handleDeleteTodo = async (id: number) => {
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await apiClient.delete(`/todos/${id}`, { requiresAuth: false });
      setTodos(prev => prev.filter(t => t.id !== id));
      toast.success('Tugas berhasil dihapus dari server.', { title: 'DELETE Sukses' });
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Gagal menghapus tugas.';
      toast.error(msg, { title: 'DELETE Gagal' });
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ── PATCH Area Parkir: Siklus Status Logis ────────────────
  const handlePatchAreaStatus = async (area: ParkingArea) => {
    setPatchingIds(prev => new Set(prev).add(area.id));
    // Transisi status: AVAILABLE -> BUSY -> FULL -> AVAILABLE
    const nextStatus =
      area.status === 'AVAILABLE' ? 'BUSY' : area.status === 'BUSY' ? 'FULL' : 'AVAILABLE';

    try {
      const res = await apiClient.patch<{ success: boolean; data: ParkingArea }>(
        `/parking-areas/${area.id}/status`,
        { status: nextStatus },
        { requiresAuth: false }
      );

      if (res?.data) {
        setAreas(prev => prev.map(a => (a.id === area.id ? res.data : a)));
        toast.info(`Status ${area.name} diubah ke ${nextStatus}`, { title: 'PATCH Sukses' });
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Gagal memperbarui status area.';
      toast.error(msg, { title: 'PATCH Gagal' });
    } finally {
      setPatchingIds(prev => {
        const next = new Set(prev);
        next.delete(area.id);
        return next;
      });
    }
  };

  // ── POST Check-in Parkir ─────────────────────────────────
  const handleConfirmCheckin = async () => {
    if (!selectedArea) return;
    const plate = plateNumber.trim().toUpperCase();
    if (!plate) {
      toast.warning('Nomor plat kendaraan wajib diisi.', { title: 'Validasi' });
      return;
    }

    setIsPosting(true);
    try {
      const res = await apiClient.post<{ success: boolean; message: string; data: CheckinResult }>(
        '/parking-checkin',
        { areaId: selectedArea.id, vehicleType, plateNumber: plate },
        { requiresAuth: false }
      );

      if (res?.data) {
        setShowCheckinModal(false);
        setPlateNumber('');
        setSelectedArea(null);
        // Refresh seluruh data
        await loadAllData(false);
        // Langsung arahkan ke halaman yang dituju (Tab Todo List Tugas hasil check-in)!
        setActiveTab('todos');
        toast.success(`Check-in ${plate} berhasil & langsung masuk ke Todo List!`, {
          title: 'Check-in Berhasil',
        });
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Gagal melakukan check-in.';
      toast.error(msg, { title: 'Check-in Gagal' });
    } finally {
      setIsPosting(false);
    }
  };

  // ── Handle Navigasi Kembali Aman ─────────────────────────
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  // ── RENDER ───────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleGoBack}
          activeOpacity={0.7}
          accessibilityLabel="Kembali ke Beranda"
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Async API Week 8</Text>
          <Text style={styles.headerSub}>Komputasi Asinkron & REST API</Text>
        </View>

        {/* 06. Tombol Refresh / Reload */}
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => loadAllData(true)}
          disabled={isRefreshing || isInitialLoading}
          activeOpacity={0.7}
          accessibilityLabel="Muat ulang data dari server"
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={C.primaryLight} />
          ) : (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="reload" size={18} color={C.primaryLight} />
            </Animated.View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── BANNER 6 FITUR ASYNC ── */}
      <View style={styles.bannerRow}>
        <Ionicons name="code-working-outline" size={16} color={C.primaryLight} />
        <Text style={styles.bannerTxt}>
          6 Fitur: GET (useEffect) · Loading · POST · PATCH (Centang) · Error · Refresh
        </Text>
      </View>

      {/* ── TAB NAVIGATOR (Todo List vs Area Parkir) ── */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'todos' && styles.tabBtnActive]}
          onPress={() => setActiveTab('todos')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="checkbox-outline"
            size={16}
            color={activeTab === 'todos' ? '#fff' : C.textMuted}
          />
          <Text style={[styles.tabBtnTxt, activeTab === 'todos' && styles.tabBtnTxtActive]}>
            Todo List Tugas ({todos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'areas' && styles.tabBtnActive]}
          onPress={() => setActiveTab('areas')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="car-sport-outline"
            size={16}
            color={activeTab === 'areas' ? '#fff' : C.textMuted}
          />
          <Text style={[styles.tabBtnTxt, activeTab === 'areas' && styles.tabBtnTxtActive]}>
            Area Parkir ({areas.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 02. LOADING INDICATOR SAAT PERTAMA KALI MASUK ── */}
      {isInitialLoading ? (
        <View style={styles.centerLoadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.centerLoadingTitle}>Mengambil Data dari Server...</Text>
          <Text style={styles.centerLoadingSub}>GET /todos & GET /parking-areas (async/await)</Text>
        </View>
      ) : errorMsg ? (
        /* ── 05. ERROR STATE (try/catch) ── */
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={56} color={C.danger} />
          <Text style={styles.errorTitle}>Koneksi Gagal</Text>
          <Text style={styles.errorSubtitle}>{errorMsg}</Text>
          <Text style={styles.errorHint}>
            Pastikan Mock REST API server aktif di port 5000 (npm run mock-api).
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadAllData(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryBtnTxt}>Coba Lagi (Re-fetch)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── KONTEN UTAMA DENGAN PULL-TO-REFRESH (06) ── */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadAllData(true)}
              tintColor={C.primaryLight}
              colors={[C.primary]}
            />
          }
        >
          {lastUpdated ? (
            <Text style={styles.lastUpdateText}>
              Terakhir diperbarui: {lastUpdated} (Tarik layar untuk refresh)
            </Text>
          ) : null}

          {/* ======================================================== */}
          {/* TAB 1: TODO LIST TUGAS OPERASIONAL (SLIDE 15 PPT)        */}
          {/* ======================================================== */}
          {activeTab === 'todos' && (
            <View>
              {/* 03. FORM INPUT MENAMBAHKAN TODO (POST) */}
              <View style={styles.addTodoBox}>
                <Text style={styles.sectionHeaderTitle}>Tambah Tugas Operasional (POST)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="Contoh: Cek slot parkir gedung A..."
                    placeholderTextColor={C.textMuted}
                    value={newTodoTitle}
                    onChangeText={setNewTodoTitle}
                    onSubmitEditing={handleAddTodo}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[styles.addBtn, isPosting && { opacity: 0.7 }]}
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

              {/* DAFTAR TODO ITEM (04: CENTANG / TOGGLE PATCH) */}
              <View style={styles.listHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>
                  Daftar Tugas Parkir ({todos.filter(t => t.completed).length}/{todos.length} Selesai)
                </Text>
                <Text style={styles.listHeaderSubtitle}>
                  Klik centang untuk toggle selesai (PATCH)
                </Text>
              </View>

              {todos.length === 0 ? (
                <View style={styles.emptyList}>
                  <Ionicons name="clipboard-outline" size={40} color={C.textMuted} />
                  <Text style={styles.emptyListTxt}>Belum ada tugas operasional.</Text>
                </View>
              ) : (
                todos.map(todo => (
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

          {/* ======================================================== */}
          {/* TAB 2: MONITORING AREA PARKIR                            */}
          {/* ======================================================== */}
          {activeTab === 'areas' && (
            <View>
              <View style={styles.listHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>Status Area Parkir ({areas.length})</Text>
                <Text style={styles.listHeaderSubtitle}>
                  Tekan "Ganti Status" untuk transisi logis (PATCH)
                </Text>
              </View>

              {areas.map(area => (
                <AreaCard
                  key={area.id}
                  area={area}
                  isPatching={patchingIds.has(area.id)}
                  onPatch={handlePatchAreaStatus}
                  onCheckin={a => {
                    setSelectedArea(a);
                    setShowCheckinModal(true);
                  }}
                />
              ))}
            </View>
          )}

          {/* ======================================================== */}
          {/* MODAL POPUP CHECK-IN PARKIR (POST)                       */}
          {/* ======================================================== */}
          <Modal
            visible={showCheckinModal && !!selectedArea}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCheckinModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderIcon}>
                    <Ionicons name="car-outline" size={20} color={C.primaryLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTitle}>Check-in Parkir (POST)</Text>
                    <Text style={styles.modalAreaName}>{selectedArea?.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowCheckinModal(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={20} color={C.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Pilih Jenis Kendaraan:</Text>
                <View style={styles.toggleRow}>
                  {(['MOTOR', 'MOBIL'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.toggleBtn, vehicleType === type && styles.toggleBtnActive]}
                      onPress={() => setVehicleType(type)}
                    >
                      <Ionicons
                        name={type === 'MOTOR' ? 'bicycle-outline' : 'car-outline'}
                        size={16}
                        color={vehicleType === type ? '#fff' : C.textSec}
                      />
                      <Text
                        style={[
                          styles.toggleBtnTxt,
                          vehicleType === type && styles.toggleBtnTxtActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Nomor Plat Kendaraan:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Contoh: B 1234 ABC"
                  placeholderTextColor={C.textMuted}
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                  autoCapitalize="characters"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowCheckinModal(false)}
                  >
                    <Text style={styles.cancelBtnTxt}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirmCheckin}
                    disabled={isPosting}
                  >
                    {isPosting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={15} color="#fff" />
                        <Text style={styles.confirmBtnTxt}>Konfirmasi & Ke Todo List</Text>
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
    backgroundColor: C.bg,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
    gap: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrim,
  },
  headerSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },
  // Banner
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary + '18',
    borderBottomWidth: 1,
    borderBottomColor: C.primary + '33',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  bannerTxt: {
    flex: 1,
    fontSize: 11,
    color: C.primaryLight,
    fontWeight: '600',
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: C.surface,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: C.primary,
    borderColor: C.primaryLight,
  },
  tabBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSec,
  },
  tabBtnTxtActive: {
    color: '#fff',
    fontWeight: '700',
  },
  // Loading Center
  centerLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  centerLoadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrim,
  },
  centerLoadingSub: {
    fontSize: 12,
    color: C.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  // Error Container
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.danger,
  },
  errorSubtitle: {
    fontSize: 13,
    color: C.textSec,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
    marginTop: 12,
  },
  retryBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  lastUpdateText: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: -4,
  },
  // Section Headers
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textPrim,
  },
  listHeaderRow: {
    marginBottom: 4,
  },
  listHeaderSubtitle: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  // 03. Add Todo Form (POST)
  addTodoBox: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 10,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.textPrim,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 4,
  },
  addBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  // 04. Todo Card & Checkbox (PATCH)
  todoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 12,
  },
  todoCardCompleted: {
    backgroundColor: '#121626',
    borderColor: C.success + '33',
    opacity: 0.85,
  },
  checkboxBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBtnChecked: {
    backgroundColor: C.success,
    borderColor: C.success,
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
    color: C.textPrim,
    lineHeight: 18,
  },
  todoTitleCompleted: {
    color: C.textMuted,
    textDecorationLine: 'line-through',
  },
  todoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: C.primary + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primaryLight,
  },
  todoTimeTxt: {
    fontSize: 10,
    color: C.textMuted,
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
    backgroundColor: C.danger + '15',
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
    color: C.textMuted,
  },
  // Area Cards
  areaCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
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
    color: C.textPrim,
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
    color: C.textPrim,
  },
  statSub: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 2,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.surface,
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
    backgroundColor: C.primary,
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
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 5,
  },
  areaBtnSecondaryTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSec,
  },
  // Modal Check-in
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
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
    backgroundColor: C.primary + '22',
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
    color: C.textPrim,
  },
  modalAreaName: {
    fontSize: 12,
    color: C.primaryLight,
    marginTop: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textSec,
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
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  toggleBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSec,
  },
  toggleBtnTxtActive: {
    color: '#fff',
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: C.textPrim,
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
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  cancelBtnTxt: {
    fontSize: 12,
    color: C.textSec,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: C.primary,
  },
  confirmBtnTxt: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
});
