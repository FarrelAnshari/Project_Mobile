/**
 * PARKIN — Smart Campus Parking
 * Component: ProgramsList (Task 02 — Protected Data UI Component)
 *
 * Menampilkan data yang diambil dari endpoint terproteksi (GET /programs)
 * Menggunakan Bearer Token yang tersimpan di SecureStore.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { getPrograms, ProgramItem } from '../services/programService';
import { getAccessToken } from '../services/secureStorageService';

interface ProgramsListProps {
  onSelectProgram?: (program: ProgramItem) => void;
}

export default function ProgramsList({ onSelectProgram }: ProgramsListProps) {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [tokenMasked, setTokenMasked] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Cek token yang digunakan untuk autentikasi
      const token = await getAccessToken();
      if (token) {
        setTokenMasked(`${token.substring(0, 10)}...${token.slice(-6)}`);
      } else {
        setTokenMasked('Tidak ada token');
      }

      // 2. Ambil data program terproteksi
      const res = await getPrograms();
      setPrograms(res.data);
      setIsFallback(res.isDemoFallback);
    } catch (err: any) {
      setError(err?.message || 'Gagal mengambil data program dari server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderBadge = (category: ProgramItem['category']) => {
    const config = {
      MAHASISWA: { color: Colors.primary, bg: Colors.primary + '15', label: 'Mahasiswa' },
      DOSEN: { color: Colors.secondary, bg: Colors.secondary + '15', label: 'Dosen/Staf' },
      RAMAH_LINGKUNGAN: { color: Colors.success, bg: Colors.success + '15', label: 'Ramah Lingkungan' },
      UMUM: { color: Colors.textSecondary, bg: Colors.surface, label: 'Umum' },
    }[category] || { color: Colors.textSecondary, bg: Colors.surface, label: category };

    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ProgramItem }) => (
    <TouchableOpacity
      style={[styles.card, Shadow.sm]}
      activeOpacity={0.8}
      onPress={() => onSelectProgram?.(item)}
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

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.dateText}>Berlaku s/d: {item.validUntil}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Info Endpoint Terproteksi */}
      <View style={styles.headerInfo}>
        <View style={styles.endpointBadge}>
          <Ionicons name="lock-closed" size={14} color={Colors.success} />
          <Text style={styles.endpointText}>Protected: GET /programs</Text>
        </View>
        {tokenMasked ? (
          <Text style={styles.tokenText}>Auth: Bearer {tokenMasked}</Text>
        ) : null}
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Memuat program dengan Bearer Token...</Text>
        </View>
      ) : error ? (
        /* Error State */
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={42} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Data List */
        <FlatList
          data={programs}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="folder-open-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>Tidak ada program aktif saat ini.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerInfo: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  endpointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  endpointText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  tokenText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: Colors.textTertiary,
  },
  listContent: {
    paddingBottom: Spacing.xl,
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
    fontSize: FontSize.xs,
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
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
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
    gap: 6,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  centerContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.md,
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
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
});
