/**
 * PARKIN — Smart Campus Parking
 * Component: ProgramsList (Task 02 — Attach Token to API Request)
 *
 * Menampilkan data program dari protected API (GET /programs).
 * Sesuai alur Task 02:
 * 1. Secure Storage: Ambil token dari SecureStore (SecureStore.getItemAsync("access_token"))
 * 2. Get Token: Membaca access token dari secure storage
 * 3. API Request: Mengirim request ke endpoint yang dilindungi
 * 4. Authorization: Menambahkan token pada header Authorization: Bearer <token>
 * 5. Protected API: Mengembalikan data program
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { getPrograms, ProgramItem } from '../services/programService';
import { getAccessToken } from '../services/secureStorageService';
import { API_CONFIG } from '../config/api';

interface ProgramsListProps {
  onSelectProgram?: (program: ProgramItem) => void;
}

export default function ProgramsList({ onSelectProgram }: ProgramsListProps) {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'PRIORITAS' | 'KAMPUS'>('ALL');
  const [tokenRaw, setTokenRaw] = useState<string | null>(null);
  const [tokenMasked, setTokenMasked] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [inspectorVisible, setInspectorVisible] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramItem | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [isSimulatingNoAuth, setIsSimulatingNoAuth] = useState(false);

  const loadData = useCallback(async (simulateNoAuth = false) => {
    setLoading(true);
    setError(null);
    setIsSimulatingNoAuth(simulateNoAuth);

    try {
      // 1. Ambil token dari SecureStore (Task 02 Step 1 & 2)
      const token = await getAccessToken();
      setTokenRaw(token);
      if (token) {
        setTokenMasked(`${token.substring(0, 14)}...${token.slice(-8)}`);
      } else {
        setTokenMasked('Token tidak ditemukan');
      }

      // 2. Kirim request dengan/tanpa token untuk membuktikan proteksi
      const res = await getPrograms(simulateNoAuth);
      setPrograms(res.data);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengambil data dari protected API.');
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  const handleCopyToken = () => {
    if (!tokenRaw) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(tokenRaw);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    } else {
      Alert.alert('Access Token Disalin', `${tokenRaw.substring(0, 32)}...`);
    }
  };

  const filteredPrograms = programs.filter((p) => {
    if (filterCategory === 'PRIORITAS') return p.category === 'PRIORITAS';
    if (filterCategory === 'KAMPUS') return p.category !== 'PRIORITAS';
    return true;
  });

  const renderBadge = (category: ProgramItem['category']) => {
    const config = {
      PRIORITAS: { color: Colors.primary, bg: Colors.primary + '18', label: 'Program Prioritas' },
      MAHASISWA: { color: '#0284C7', bg: '#0284C718', label: 'Mahasiswa' },
      DOSEN: { color: Colors.secondary, bg: Colors.secondary + '18', label: 'Dosen & Staf' },
      RAMAH_LINGKUNGAN: { color: Colors.success, bg: Colors.success + '18', label: 'Ramah Lingkungan' },
      UMUM: { color: Colors.textSecondary, bg: Colors.surface, label: 'Umum' },
    }[category] || { color: Colors.textSecondary, bg: Colors.surface, label: category };

    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Info Protected Endpoint (Task 02) */}
      <View style={[styles.headerCard, Shadow.sm]}>
        <View style={styles.headerTopRow}>
          <View style={styles.endpointBadge}>
            <View style={styles.lockCircle}>
              <Ionicons name="lock-closed" size={14} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.endpointTitle}>Protected API: GET /programs</Text>
              <Text style={styles.endpointSubtitle}>
                {isSimulatingNoAuth ? 'Simulasi: Request Tanpa Token (401)' : 'Otorisasi: Bearer Token (SecureStore)'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.inspectorBtn}
            onPress={() => setInspectorVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Buka detail inspeksi token API"
          >
            <Ionicons name="code-working" size={16} color={Colors.primary} />
            <Text style={styles.inspectorBtnText}>Inspeksi</Text>
          </TouchableOpacity>
        </View>

        {/* Token status banner */}
        <View style={styles.tokenStatusRow}>
          <Ionicons
            name={tokenRaw && !isSimulatingNoAuth ? 'shield-checkmark' : 'alert-circle'}
            size={14}
            color={tokenRaw && !isSimulatingNoAuth ? Colors.success : Colors.danger}
          />
          <Text style={styles.tokenStatusText} numberOfLines={1}>
            {tokenRaw && !isSimulatingNoAuth
              ? `Bearer ${tokenMasked}`
              : 'Tanpa Authorization Header (Ditolak)'}
          </Text>
        </View>

        {/* Action testing buttons for Task 02 verification */}
        <View style={styles.testingRow}>
          <TouchableOpacity
            style={[styles.testBtn, !isSimulatingNoAuth && styles.testBtnActive]}
            onPress={() => loadData(false)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Muat data dengan Bearer Token (200 OK)"
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={13}
              color={!isSimulatingNoAuth ? Colors.white : Colors.textSecondary}
            />
            <Text
              style={[
                styles.testBtnText,
                !isSimulatingNoAuth && styles.testBtnTextActive,
              ]}
            >
              Dengan Token (200 OK)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testBtn, isSimulatingNoAuth && styles.testBtnDanger]}
            onPress={() => loadData(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Uji akses tanpa token untuk membuktikan proteksi endpoint (401)"
          >
            <Ionicons
              name="close-circle-outline"
              size={13}
              color={isSimulatingNoAuth ? Colors.white : Colors.danger}
            />
            <Text
              style={[
                styles.testBtnText,
                isSimulatingNoAuth ? styles.testBtnTextActive : { color: Colors.danger },
              ]}
            >
              Tanpa Token (Uji 401)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterCategory === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilterCategory('ALL')}
          accessibilityRole="tab"
          accessibilityLabel="Tampilkan semua program"
        >
          <Text
            style={[
              styles.filterChipText,
              filterCategory === 'ALL' && styles.filterChipTextActive,
            ]}
          >
            Semua ({programs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterCategory === 'PRIORITAS' && styles.filterChipActive]}
          onPress={() => setFilterCategory('PRIORITAS')}
          accessibilityRole="tab"
          accessibilityLabel="Tampilkan Program Prioritas"
        >
          <Text
            style={[
              styles.filterChipText,
              filterCategory === 'PRIORITAS' && styles.filterChipTextActive,
            ]}
          >
            Program Prioritas (Slide 11)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterCategory === 'KAMPUS' && styles.filterChipActive]}
          onPress={() => setFilterCategory('KAMPUS')}
          accessibilityRole="tab"
          accessibilityLabel="Tampilkan Program Fasilitas Kampus"
        >
          <Text
            style={[
              styles.filterChipText,
              filterCategory === 'KAMPUS' && styles.filterChipTextActive,
            ]}
          >
            Layanan Kampus
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Rendering (No nested FlatList inside ScrollView) */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>
            Membaca SecureStore & Mengirim Bearer Token...
          </Text>
        </View>
      ) : error ? (
        <View style={[styles.errorCard, Shadow.sm]}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="lock-closed-outline" size={26} color={Colors.danger} />
          </View>
          <Text style={styles.errorTitle}>Akses Ditolak (401 Unauthorized)</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <Text style={styles.errorSubDesc}>
            Endpoint ini terproteksi. Data hanya bisa diakses ketika Bearer Token disertakan pada header permintaan.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadData(false)}
            accessibilityRole="button"
            accessibilityLabel="Muat ulang dengan Bearer Token valid"
          >
            <Ionicons name="key-outline" size={16} color={Colors.white} />
            <Text style={styles.retryText}>Kirim Ulang dengan Token</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPrograms.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="folder-open-outline" size={36} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>Tidak ada program dalam kategori ini.</Text>
        </View>
      ) : (
        <View style={styles.cardsList}>
          {filteredPrograms.map((item) => (
            <TouchableOpacity
              key={String(item.id)}
              style={[styles.card, Shadow.sm]}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedProgram(item);
                onSelectProgram?.(item);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Program ${item.title}`}
              accessibilityHint="Tekan untuk melihat rincian program"
            >
              <View style={styles.cardHeader}>
                {renderBadge(item.category)}
                <View style={styles.quotaPill}>
                  <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
                  <Text style={styles.quotaText}>
                    Sisa: <Text style={styles.quotaBold}>{item.remainingQuota}</Text>/{item.quota}
                  </Text>
                </View>
              </View>

              <View style={styles.titleRow}>
                {item.iconName ? (
                  <View style={styles.programIconBox}>
                    <Ionicons name={item.iconName as any} size={18} color={Colors.primary} />
                  </View>
                ) : null}
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>

              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.textTertiary} />
                  <Text style={styles.dateText}>Berlaku s/d: {item.validUntil}</Text>
                </View>
                <View style={styles.actionArrow}>
                  <Text style={styles.detailText}>Rincian</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ===== MODAL INSPEKTOR TOKEN & HTTP REQUEST (TASK 02) ===== */}
      <Modal
        visible={inspectorVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setInspectorVisible(false)}
        accessibilityViewIsModal
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadow.md]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIcon}>
                  <Ionicons name="terminal-outline" size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Inspektor Protected API</Text>
                  <Text style={styles.modalSubtitle}>Task 02: Attach Token to API Request</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setInspectorVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Tutup inspektor"
              >
                <Ionicons name="close" size={22} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Endpoint Information */}
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>HTTP Request Method & Endpoint:</Text>
                <Text style={styles.codeSnippet}>
                  GET {API_CONFIG.BASE_URL}{API_CONFIG.ENDPOINTS.PROGRAMS}
                </Text>
              </View>

              {/* SecureStore Token Source */}
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Sumber Access Token:</Text>
                <Text style={styles.infoValue}>
                  Expo SecureStore (Key: <Text style={styles.monoBold}>access_token</Text>)
                </Text>
              </View>

              {/* HTTP Headers */}
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>HTTP Headers yang Disertakan:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeLine}>Accept: application/json</Text>
                  <Text style={styles.codeLine}>Content-Type: application/json</Text>
                  <Text style={[styles.codeLine, { color: Colors.primary, fontWeight: FontWeight.bold }]}>
                    Authorization: Bearer {tokenRaw ? `${tokenRaw.substring(0, 24)}...` : '(tidak ada)'}
                  </Text>
                </View>
              </View>

              {/* Token Value & Copy */}
              <View style={styles.infoBox}>
                <View style={styles.tokenHeaderRow}>
                  <Text style={styles.infoLabel}>Access Token (Raw JWT):</Text>
                  <TouchableOpacity
                    onPress={handleCopyToken}
                    style={styles.copyBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Salin token ke clipboard"
                  >
                    <Ionicons name={copiedNotification ? 'checkmark' : 'copy-outline'} size={14} color={Colors.primary} />
                    <Text style={styles.copyBtnText}>{copiedNotification ? 'Tersalin!' : 'Salin Token'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tokenContainer}>
                  <Text style={styles.tokenRawText} selectable>
                    {tokenRaw || 'Token kosong. Silakan login kembali.'}
                  </Text>
                </View>
              </View>

              {/* Alur Eksekusi */}
              <View style={styles.stepList}>
                <Text style={styles.stepTitle}>Alur Task 02:</Text>
                <Text style={styles.stepItem}>{"1. Ambil token dari SecureStore via SecureStore.getItemAsync('access_token')"}</Text>
                <Text style={styles.stepItem}>{"2. Tambahkan header Authorization: Bearer <token>"}</Text>
                <Text style={styles.stepItem}>3. Kirim request ke endpoint /programs</Text>
                <Text style={styles.stepItem}>4. Server memverifikasi token dan mengembalikan status 200 OK</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setInspectorVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===== MODAL DETAIL PROGRAM ===== */}
      <Modal
        visible={!!selectedProgram}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedProgram(null)}
        accessibilityViewIsModal
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadow.md]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.programIconBig}>
                  <Ionicons
                    name={(selectedProgram?.iconName as any) || 'document-text-outline'}
                    size={24}
                    color={Colors.primary}
                  />
                </View>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedProgram?.title}
                  </Text>
                  <Text style={styles.modalSubtitle}>ID: {selectedProgram?.id}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedProgram(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Tutup rincian program"
              >
                <Ionicons name="close" size={22} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.detailBadgeRow}>
                {selectedProgram && renderBadge(selectedProgram.category)}
                <View style={styles.statusActiveBadge}>
                  <Text style={styles.statusActiveText}>STATUS: {selectedProgram?.status}</Text>
                </View>
              </View>

              <Text style={styles.detailDesc}>{selectedProgram?.description}</Text>

              <View style={styles.quotaBox}>
                <View style={styles.quotaCol}>
                  <Text style={styles.quotaColLabel}>Sisa Kuota</Text>
                  <Text style={styles.quotaColValue}>{selectedProgram?.remainingQuota}</Text>
                </View>
                <View style={styles.quotaDivider} />
                <View style={styles.quotaCol}>
                  <Text style={styles.quotaColLabel}>Total Kuota</Text>
                  <Text style={styles.quotaColValue}>{selectedProgram?.quota}</Text>
                </View>
                <View style={styles.quotaDivider} />
                <View style={styles.quotaCol}>
                  <Text style={styles.quotaColLabel}>Batas Waktu</Text>
                  <Text style={styles.quotaColValueDate}>{selectedProgram?.validUntil}</Text>
                </View>
              </View>

              <View style={styles.authNoticeRow}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                <Text style={styles.authNoticeText}>
                  Data program ini diotorisasi secara aman melalui Bearer Token Task 02.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedProgram(null)}
            >
              <Text style={styles.modalCloseBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  endpointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  lockCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endpointTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  endpointSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  inspectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '14',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  inspectorBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  tokenStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  tokenStatusText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
    flex: 1,
  },
  testingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  testBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  testBtnDanger: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  testBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  testBtnTextActive: {
    color: Colors.white,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primary + '18',
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  cardsList: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  quotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quotaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  quotaBold: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  programIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  actionArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
  centerContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  errorCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
    alignItems: 'center',
  },
  errorIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.danger + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
    marginBottom: 4,
  },
  errorDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  errorSubDesc: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  modalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  programIconBig: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  modalBody: {
    marginBottom: Spacing.md,
  },
  infoBox: {
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: FontWeight.semibold,
  },
  infoValue: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
  },
  monoBold: {
    fontFamily: 'monospace',
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  codeSnippet: {
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    color: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  codeBlock: {
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  codeLine: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
    marginVertical: 1,
  },
  tokenHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  tokenContainer: {
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tokenRawText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  stepList: {
    backgroundColor: Colors.primary + '0A',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  stepItem: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
    lineHeight: 14,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  detailBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  statusActiveBadge: {
    backgroundColor: Colors.success + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusActiveText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  detailDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  quotaBox: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quotaCol: {
    flex: 1,
    alignItems: 'center',
  },
  quotaDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderLight,
  },
  quotaColLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  quotaColValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  quotaColValueDate: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  authNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success + '10',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  authNoticeText: {
    fontSize: 11,
    color: Colors.success,
    flex: 1,
    lineHeight: 15,
  },
});
