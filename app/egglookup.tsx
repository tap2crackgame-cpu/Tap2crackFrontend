import { useState, useCallback, useMemo } from "react";
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Shield, Check, Users, Trophy, Zap, DollarSign, Clock, Crown, Ban, Gift, Video, Search } from "lucide-react-native";
import {
  fetchAdminAds,
  createAdminAd,
  updateAdminAd,
  deleteAdminAd,
  type PromoAd,
  type PromoAdMediaType,
} from "@/services/ads";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  AdminStats, 
  UserProfile, 
  DbWinner,
  DbPayment,
  Price
} from "@/types/game";
import { AUTH_API } from "@/utils/api";
import { showAlertAsToast } from "@/context/ToastContext";

type Tab = 'overview' | 'users' | 'winners' | 'payments' | 'Coupons' | 'prizes' | 'ads';
type PrizeSettleFilter = 'all' | 'unsettled' | 'settled';



export default function AdminDashboard() {
  const router = useRouter();
  const { authUser, token } = useAuth();
  const [newCompany, setNewCompany] = useState('');
  const [description, setDescription] = useState('');
  const [newExpiry, setNewExpiry] = useState(''); 
  const [newCode, setNewCode] = useState('');
  const [creatingCode, setCreatingCode] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adMediaUrl, setAdMediaUrl] = useState('');
  const [adMediaType, setAdMediaType] = useState<PromoAdMediaType>('image');
  const [adSortOrder, setAdSortOrder] = useState('0');
  const [creatingAd, setCreatingAd] = useState(false);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [fulfillingPrizeId, setFulfillingPrizeId] = useState<string | null>(null);
  const [prizePhoneSearchDraft, setPrizePhoneSearchDraft] = useState('');
  const [prizePhoneSearch, setPrizePhoneSearch] = useState('');
  const [prizeSettleFilter, setPrizeSettleFilter] = useState<PrizeSettleFilter>('all');
  const BASE_URL = AUTH_API;


  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
  queryKey: ['admin-stats'],
  queryFn: async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      return data.stats;
    } catch (err) {
      console.error("AdminStats: Network or Fetch Error:", err);
      throw err;
    }
  },
  staleTime: 10000,
  enabled: !!token && !!authUser?.isAdmin && activeTab === 'overview',
});



const { data: users = [], isLoading: usersLoading } = useQuery<UserProfile[]>({
  queryKey: ['admin-users'],
  queryFn: async () => {
    
    const response = await fetch(`${BASE_URL}/admin/users?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    const data = await response.json();
    return data.users || [];
  },
  staleTime: 30000,
  enabled: !!token && (activeTab === 'users' || activeTab === 'overview'),
});


const { data: winnersData, isLoading: winnersLoading } = useQuery<{
  winners: DbWinner[];
  distinctWinnerCount: number;
  totalMatchWins: number;
}>({
  queryKey: ['admin-winners'],
  queryFn: async () => {
    const response = await fetch(`${BASE_URL}/admin/winners?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch winners');
    }

    const data = await response.json();

    return {
      winners: (data.winners || []).map((w: any) => ({
        ...w,
        won_at: new Date(w.won_at),
      })),
      distinctWinnerCount: data.distinct_winner_count ?? 0,
      totalMatchWins: data.total_match_wins ?? (data.winners || []).length,
    };
  },
  staleTime: 30000,
  enabled: !!token && activeTab === 'winners',
});

const winners = winnersData?.winners ?? [];
const distinctWinnerCount = winnersData?.distinctWinnerCount ?? 0;
const totalMatchWins = winnersData?.totalMatchWins ?? winners.length;


const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{
  payouts: DbPayment[];
  totalPaid: number;
  totalAirtime: number;
  totalCash: number;
  payoutCount: number;
}>({
  queryKey: ['admin-payments'],
  queryFn: async () => {
    const response = await fetch(`${BASE_URL}/admin/payments?limit=100`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch payouts');
    const data = await response.json();
    return {
      payouts: data.payouts || [],
      totalPaid: data.total_paid ?? 0,
      totalAirtime: data.total_airtime ?? 0,
      totalCash: data.total_cash ?? 0,
      payoutCount: data.payout_count ?? (data.payouts || []).length,
    };
  },
  staleTime: 30000,
  enabled: !!token && activeTab === 'payments',
});

const payouts = paymentsData?.payouts ?? [];
const totalPaidOut = paymentsData?.totalPaid ?? 0;

  const createCode = async () => {
  if (!newCode || !newCompany || !description || !newExpiry) {
    showAlertAsToast("Error", "Fill all fields");
    return;
  }

  setCreatingCode(true);
  try {
    const response = await fetch(`${BASE_URL}/admin/coupons`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: newCode,
        name: newCompany,
        description: description,
        expiresAt: newExpiry ? new Date(newExpiry).toISOString() : null
      })
    });

    if (response.ok) {
      setNewCode('');
      setNewCompany('');
      setDescription('');
      setNewExpiry('');
      queryClient.invalidateQueries({ queryKey: ['admin-coupon-codes'] });
      showAlertAsToast("Success", "Coupon created");
    }
  } catch (err) {
    showAlertAsToast("Error", "Failed to create coupon");
  } finally {
    setCreatingCode(false);
  }
};


const applyPrizePhoneSearch = useCallback(() => {
  setPrizePhoneSearch(prizePhoneSearchDraft.trim());
}, [prizePhoneSearchDraft]);

const clearPrizePhoneSearch = useCallback(() => {
  setPrizePhoneSearchDraft('');
  setPrizePhoneSearch('');
}, []);

const { data: prizeData = [], isLoading: prizesLoading } = useQuery<Price[]>({
  queryKey: ['admin-prizes', token],
  queryFn: async () => {
    const response = await fetch(`${BASE_URL}/admin/prizes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch prizes');
    }

    const data = await response.json();
    return data.prizes || [];
  },
  staleTime: 30000,
  enabled: !!token && activeTab.toLowerCase() === 'prizes',
});

const filteredPrizes = useMemo(() => {
  let list = prizeData.filter((p) => p.priceType !== 'coupon');
  const digits = prizePhoneSearch.replace(/\D/g, '');
  if (digits) {
    list = list.filter((p) => {
      const phone = (p.user?.phone_number || p.user_phone || '').replace(/\D/g, '');
      return phone.includes(digits);
    });
  }
  if (prizeSettleFilter === 'unsettled') {
    list = list.filter((p) => String(p.status).toUpperCase() !== 'CLAIMED');
  } else if (prizeSettleFilter === 'settled') {
    list = list.filter((p) => String(p.status).toUpperCase() === 'CLAIMED');
  }
  return list;
}, [prizeData, prizePhoneSearch, prizeSettleFilter]);


const handleFulfillPrize = (prizeId: string) => {
  Alert.alert(
    'Confirm Payout',
    'Mark this prize as settled? This confirms you have paid the user.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Confirm', 
        onPress: () => {
          void (async () => {
            setFulfillingPrizeId(prizeId);
            try {
              const response = await fetch(`${BASE_URL}/admin/prizes/${prizeId}/fulfill`, {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              const raw = await response.text();
              let result: { error?: string; prize?: Price } = {};
              try {
                result = raw ? JSON.parse(raw) : {};
              } catch {
                result = {};
              }

              if (response.ok) {
                await queryClient.invalidateQueries({ queryKey: ['admin-prizes'] });
                await queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
                await queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
                showAlertAsToast('Success', 'Prize marked as settled!');
              } else {
                showAlertAsToast('Failed', result.error || `Could not fulfill prize (${response.status}).`);
              }
            } catch (err) {
              console.error('Fulfill prize error:', err);
              showAlertAsToast('Error', 'A network error occurred. Check that the backend is running.');
            } finally {
              setFulfillingPrizeId(null);
            }
          })();
        }
      }
    ]
  );
};
  
 const prizeStats = useMemo(() => {
  const cashAirtime = prizeData.filter((p) => p.priceType !== 'coupon');
  const settled = cashAirtime.filter((p) => String(p.status).toUpperCase() === 'CLAIMED');

  const totalAirtime = settled
    .filter((p) => p.priceType === 'airtime')
    .reduce((sum: number, p: Price) => sum + parseInt(p.priceValue || '0', 10), 0);

  const totalCash = settled
    .filter((p) => p.priceType === 'cash')
    .reduce((sum: number, p: Price) => sum + parseInt(p.priceValue || '0', 10), 0);

  return { totalAirtime, totalCash };
}, [prizeData]);

const filteredPrizeStats = useMemo(() => {
  const settled = filteredPrizes.filter((p) => String(p.status).toUpperCase() === 'CLAIMED');
  const unsettled = filteredPrizes.filter((p) => String(p.status).toUpperCase() !== 'CLAIMED');
  return {
    settledCount: settled.length,
    unsettledCount: unsettled.length,
    totalCount: filteredPrizes.length,
  };
}, [filteredPrizes]);

const { data: promoAds = [], isLoading: adsLoading } = useQuery<PromoAd[]>({
  queryKey: ['admin-ads'],
  queryFn: async () => {
    if (!token) return [];
    return fetchAdminAds(token);
  },
  staleTime: 30000,
  enabled: !!token && !!authUser?.isAdmin && activeTab === 'ads',
});

const resetAdForm = useCallback(() => {
  setAdTitle('');
  setAdDescription('');
  setAdMediaUrl('');
  setAdMediaType('image');
  setAdSortOrder('0');
}, []);

const handleCreateAd = useCallback(async () => {
  if (!token) return;
  if (!adTitle.trim() || !adMediaUrl.trim()) {
    showAlertAsToast('Missing fields', 'Title and media URL are required.');
    return;
  }

  setCreatingAd(true);
  try {
    await createAdminAd(token, {
      title: adTitle.trim(),
      description: adDescription.trim(),
      mediaUrl: adMediaUrl.trim(),
      mediaType: adMediaType,
      isActive: true,
      sortOrder: Number(adSortOrder) || 0,
    });
    resetAdForm();
    queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
    showAlertAsToast('Success', 'Promo ad saved. Users can watch it for free 2x tap.');
  } catch (err: any) {
    showAlertAsToast('Error', err?.message || 'Failed to create ad');
  } finally {
    setCreatingAd(false);
  }
}, [token, adTitle, adDescription, adMediaUrl, adMediaType, adSortOrder, resetAdForm, queryClient]);

const handleToggleAdActive = useCallback(async (ad: PromoAd) => {
  if (!token) return;
  try {
    await updateAdminAd(token, ad.id, { isActive: !ad.isActive });
    queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
  } catch (err: any) {
    showAlertAsToast('Error', err?.message || 'Failed to update ad');
  }
}, [token, queryClient]);

const handleDeleteAd = useCallback((ad: PromoAd) => {
  if (!token) return;
  Alert.alert(
    'Delete ad',
    `Remove "${ad.title}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminAd(token, ad.id);
            queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
          } catch (err: any) {
            showAlertAsToast('Error', err?.message || 'Failed to delete ad');
          }
        },
      },
    ]
  );
}, [token, queryClient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-winners'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-prize-codes'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-prizes'] });
    await queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
    setRefreshing(false);
  }, [queryClient]);

  const handleToggleAdmin = useCallback(async (userId: string, currentAdmin: boolean) => {
    const action = currentAdmin ? 'remove admin from' : 'make admin';
    Alert.alert(
      'Confirm',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const response = await fetch(`${BASE_URL}/admin/users/${userId}/admin`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ isAdmin: !currentAdmin }),
            });
            if (!response.ok) {
              const err = await response.json().catch(() => ({}));
              showAlertAsToast("Error", err.error || "Failed to update admin status");
              return;
            }
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          },
        },
      ]
    );
  }, [queryClient, token, BASE_URL]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Shield size={16} color={activeTab === 'overview' ? '#FFD700' : 'rgba(255,255,255,0.5)'} /> },
    { key: 'users', label: 'Users', icon: <Users size={16} color={activeTab === 'users' ? '#4ECDC4' : 'rgba(255,255,255,0.5)'} /> },
    { key: 'winners', label: 'Winners', icon: <Trophy size={16} color={activeTab === 'winners' ? '#FFD700' : 'rgba(255,255,255,0.5)'} /> },
    { key: 'payments', label: 'Payouts', icon: <DollarSign size={16} color={activeTab === 'payments' ? '#27AE60' : 'rgba(255,255,255,0.5)'} /> },
    { key: 'Coupons', label: 'Coupons', icon: <Gift size={16} color={activeTab === 'Coupons' ? '#FF6B6B' : 'rgba(255,255,255,0.5)'} /> },
    { key: 'prizes', label: 'Prizes', icon: <Check size={16} color={activeTab === 'prizes' ? '#FFD700' : 'rgba(255,255,255,0.5)'} /> },
    { key: 'ads', label: 'Ads', icon: <Video size={16} color={activeTab === 'ads' ? '#4ECDC4' : 'rgba(255,255,255,0.5)'} /> },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const handleDateChange = (text: string) => {
   const cleaned = text.replace(/[^0-9-]/g, '');
 
   if (cleaned.length <= 10) {
     setNewExpiry(cleaned);
   }
  };


   if (!authUser?.isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
          <View style={styles.accessDenied}>
            <Ban size={64} color="#FF6B6B" />
            <Text style={styles.accessDeniedTitle}>Access Denied</Text>
            <Text style={styles.accessDeniedText}>This area is restricted.</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
        <View style={styles.header}>
          <Shield size={28} color="#FFD700" />
          <Text style={styles.title}>Egg Lookup</Text>
        </View>

        <View style={styles.tabBar}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />}
        >
          {activeTab === 'overview' && (
            <>
              {statsLoading ? (
                <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
              ) : (
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, { borderLeftColor: '#4ECDC4' }]}>
                    <Users size={20} color="#4ECDC4" />
                    <Text style={styles.statValue}>{stats?.total_users ?? 0}</Text>
                    <Text style={styles.statLabel}>Total Users</Text>
                  </View>
                  <View style={[styles.statCard, { borderLeftColor: '#FFD700' }]}>
                    <Trophy size={20} color="#FFD700" />
                    <Text style={styles.statValue}>{stats?.total_winners ?? 0}</Text>
                    <Text style={styles.statLabel}>Unique Winners</Text>
                  </View>
                  <View style={[styles.statCard, { borderLeftColor: '#FF6B6B' }]}>
                    <Zap size={20} color="#FF6B6B" />
                    <Text style={styles.statValue}>{(stats?.total_taps ?? 0).toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Total Taps</Text>
                  </View>
                  <View style={[styles.statCard, { borderLeftColor: '#27AE60' }]}>
                    <DollarSign size={20} color="#27AE60" />
                    <Text style={styles.statValue}>{'\u20A6'}{(stats?.total_revenue ?? 0).toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                  </View>
                  <View style={[styles.statCard, { borderLeftColor: '#9B59B6' }]}>
                    <Clock size={20} color="#9B59B6" />
                    <Text style={styles.statValue}>{stats?.active_users_now ?? 0}</Text>
                    <Text style={styles.statLabel}>Active Today</Text>
                  </View>
                  <View style={[styles.statCard, { borderLeftColor: '#E67E22' }]}>
                    <DollarSign size={20} color="#E67E22" />
                    <Text style={styles.statValue}>{'\u20A6'}{(stats?.total_payout ?? 0).toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Paid to Users</Text>
                  </View>
                </View>
              )}

              <Text style={styles.sectionTitle}>Recent Users</Text>
              {users.slice(0, 5).map(u => (
                <View key={u.id} style={styles.userRow}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{(u.name || '?')[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.name || 'Anonymous'}</Text>
                    <Text style={styles.userEmail}>{u.email || 'Guest'}</Text>
                  </View>
                  <View style={styles.userStats}>
                    <Text style={styles.userWins}>{u.wins} wins</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {activeTab === 'users' && (
            <>
              <Text style={styles.sectionTitle}>All Users ({users.length})</Text>
              {usersLoading ? (
                <ActivityIndicator size="large" color="#4ECDC4" style={styles.loader} />
              ) : (
                users.map(u => (
                  <View key={u.id} style={styles.userCard}>
                    <View style={styles.userCardHeader}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{(u.name || '?')[0]?.toUpperCase()}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.userName}>{u.name || 'Anonymous'}</Text>
                          {u.isAdmin && (
                            <View style={styles.adminBadge}>
                              <Crown size={10} color="#FFD700" />
                              <Text style={styles.adminBadgeText}>Admin</Text>
                            </View>
                          )}
                          {u.isGuest && (
                            <View style={styles.guestBadge}>
                              <Text style={styles.guestBadgeText}>Guest</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.userEmail}>{u.email || 'No email'}</Text>
                      </View>
                    </View>
                    <View style={styles.userCardStats}>
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatVal}>{u.cracked}</Text>
                        <Text style={styles.miniStatLbl}>Cracked</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatVal}>{u.wins}</Text>
                        <Text style={styles.miniStatLbl}>Wins</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Text style={styles.miniStatVal}>{(u.lifetime_taps || 0).toLocaleString()}</Text>
                        <Text style={styles.miniStatLbl}>Taps</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Text style={[styles.miniStatVal, { color: '#4ECDC4' }]}>{u.rank}</Text>
                        <Text style={styles.miniStatLbl}>Rank</Text>
                      </View>
                    </View>
                    <View style={styles.userCardActions}>
                      <Text style={styles.joinedDate}>Joined: {formatDate(u.createdAt)}</Text>
                      <TouchableOpacity
                        style={[styles.actionBtn, u.isAdmin && styles.removeAdminBtn]}
                        onPress={() => handleToggleAdmin(u.id, u.isAdmin)}
                      >
                        <Text style={[styles.actionBtnText, u.isAdmin && styles.removeAdminBtnText]}>
                          {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'winners' && (
            <>
              <Text style={styles.sectionTitle}>
                Match Winners ({distinctWinnerCount} unique · {totalMatchWins} wins)
              </Text>
              {winnersLoading ? (
                <ActivityIndicator size="large" color="#FFD700" style={styles.loader} />
              ) : winners.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>{"\u{1F3C6}"}</Text>
                  <Text style={styles.emptyText}>No winners yet</Text>
                </View>
              ) : (
                winners.map((w: DbWinner) => (
                  <View key={w.id} style={styles.winnerCard}>
                    <View style={styles.winnerHeader}>
                      <Text style={styles.winnerName}>{w.user_name}</Text>
                      <Text style={styles.winnerTime}>{formatDate(w.won_at)}</Text>
                    </View>
                    <View style={styles.winnerDetails}>
                      <View style={styles.winnerPrize}>
                        <Text style={styles.winnerPrizeText}>{w.prize_description}</Text>
                      </View>
                      <View style={[styles.eggTypeBadge, { backgroundColor: getEggColor(w.egg_type) + '30' }]}>
                        <Text style={[styles.eggTypeText, { color: getEggColor(w.egg_type) }]}>{w.egg_type}</Text>
                      </View>
                      <Text style={styles.winnerValue}>{'\u20A6'}{w.prize_value.toLocaleString()}</Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'payments' && (
            <>
              <View style={styles.payoutSummary}>
                <View style={[styles.payoutCard, { borderLeftWidth: 3, borderLeftColor: '#27AE60' }]}>
                  <Text style={styles.payoutLabel}>Total Paid to Users</Text>
                  <Text style={[styles.payoutValue, { color: '#27AE60' }]}>
                    {'\u20A6'}{totalPaidOut.toLocaleString()}
                  </Text>
                  <Text style={styles.payoutHint}>{paymentsData?.payoutCount ?? 0} settled prizes</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Settled Payouts ({payouts.length})</Text>
              {paymentsLoading ? (
                <ActivityIndicator size="large" color="#27AE60" style={styles.loader} />
              ) : payouts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>{"\u{1F4B3}"}</Text>
                  <Text style={styles.emptyText}>No prize payouts yet</Text>
                </View>
              ) : (
                payouts.map((p) => (
                  <View key={p.id} style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.paymentRef}>{p.user_name || 'User'}</Text>
                        <Text style={styles.userPhone}>{p.user_phone || 'No phone'}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(39,174,96,0.2)' }]}>
                        <Text style={[styles.statusText, { color: '#27AE60' }]}>
                          {p.price_type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.paymentDetails}>
                      <Text style={styles.paymentAmount}>{'\u20A6'}{(p.amount || 0).toLocaleString()}</Text>
                      <Text style={styles.paymentType}>{p.prize_name || 'Prize payout'}</Text>
                      <Text style={styles.paymentDate}>{formatDate(p.settled_at || p.created_at)}</Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'Coupons' && (
            <>
              <View style={styles.prizeForm}
               key="admin-coupon-form">
                <Text style={styles.formTitle}>Coupon Management</Text>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Company name</Text>
                  <TextInput
                    value={newCompany}
                    onChangeText={setNewCompany}
                    placeholder="e.g. Acme Foods"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.input}
                    autoCapitalize="words"
                    blurOnSubmit={false}
                    autoCorrect={false}
                     spellCheck={false}
                  />
                </View>

                <View style={styles.inputRow}>
                   <Text style={styles.inputLabel}>Coupon Description</Text>
                   <TextInput
                     value={description}
                     onChangeText={setDescription}
                     placeholder="e.g. Jumia 20% Discount"
                     placeholderTextColor="rgba(255,255,255,0.35)"
                     style={styles.input}
                     blurOnSubmit={false}
                     autoCorrect={false}
                     spellCheck={false}
                   />
                   </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Code</Text>
                  <TextInput
                    value={newCode}
                    onChangeText={setNewCode}
                    placeholder="e.g. EGG-123-COUPON"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.input}
                    autoCapitalize="characters"
                    blurOnSubmit={false}
                    autoCorrect={false}
                     spellCheck={false}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    value={newExpiry}
                    onChangeText={handleDateChange}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={10}
                    blurOnSubmit={false}
                    autoCorrect={false}
                     spellCheck={false}
                  />
                  </View>

                <TouchableOpacity
                  style={[styles.createBtn, creatingCode && styles.disabledBtn]}
                  onPress={createCode}
                  disabled={creatingCode}
                >
                  {creatingCode ? (
                    <ActivityIndicator color="#1a1a2e" />
                  ) : (
                    <Text style={styles.createBtnText}>Add code</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {activeTab === 'ads' && (
            <>
              <View style={styles.prizeForm} key="admin-ads-form">
                <Text style={styles.formTitle}>Promo Ads ( Watch Ads for free 2x tap)</Text>
                <Text style={styles.adHint}>
                  Add ads using direct image/video links only.
                </Text>

                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typePill, adMediaType === 'image' && styles.typePillActive]}
                    onPress={() => {
                      setAdMediaType('image');
                    }}
                  >
                    <Text style={[styles.typePillText, adMediaType === 'image' && styles.typePillTextActive]}>
                      Image
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typePill, adMediaType === 'video' && styles.typePillActive]}
                    onPress={() => {
                      setAdMediaType('video');
                    }}
                  >
                    <Text style={[styles.typePillText, adMediaType === 'video' && styles.typePillTextActive]}>
                      Video
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    value={adTitle}
                    onChangeText={setAdTitle}
                    placeholder="e.g. Sponsor promo"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.input}
                    blurOnSubmit={false}
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Description (optional)</Text>
                  <TextInput
                    value={adDescription}
                    onChangeText={setAdDescription}
                    placeholder="Short message shown during the ad"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.input}
                    blurOnSubmit={false}
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Media URL</Text>
                  <TextInput
                    value={adMediaUrl}
                    onChangeText={setAdMediaUrl}
                    placeholder="https://… image or mp4 link"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.input}
                    autoCapitalize="none"
                    blurOnSubmit={false}
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Sort order</Text>
                  <TextInput
                    value={adSortOrder}
                    onChangeText={setAdSortOrder}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.input}
                    keyboardType="numeric"
                    blurOnSubmit={false}
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.createBtn, creatingAd && styles.disabledBtn]}
                  onPress={handleCreateAd}
                  disabled={creatingAd}
                >
                  {creatingAd ? (
                    <ActivityIndicator color="#1a1a2e" />
                  ) : (
                    <Text style={styles.createBtnText}>Save ad</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>
                Active ads ({promoAds.filter((a) => a.isActive).length}/{promoAds.length})
              </Text>

              {adsLoading ? (
                <ActivityIndicator size="large" color="#4ECDC4" style={{ marginTop: 20 }} />
              ) : promoAds.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📺</Text>
                  <Text style={styles.emptyText}>No promo ads yet. Add one above.</Text>
                </View>
              ) : (
                promoAds.map((ad) => (
                  <View key={ad.id} style={styles.adCard}>
                    <View style={styles.adCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adTitle}>{ad.title}</Text>
                        {!!ad.description && (
                          <Text style={styles.adDescription} numberOfLines={2}>
                            {ad.description}
                          </Text>
                        )}
                        <Text style={styles.adMeta} numberOfLines={1}>
                          {ad.mediaType.toUpperCase()} · order {ad.sortOrder}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: ad.isActive ? 'rgba(39,174,96,0.2)' : 'rgba(255,255,255,0.08)' }]}>
                        <Text style={[styles.statusText, { color: ad.isActive ? '#27AE60' : 'rgba(255,255,255,0.5)' }]}>
                          {ad.isActive ? 'Active' : 'Off'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.adUrl} numberOfLines={1}>{ad.mediaUrl}</Text>
                    <View style={styles.adActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleToggleAdActive(ad)}
                      >
                        <Text style={styles.actionBtnText}>
                          {ad.isActive ? 'Deactivate' : 'Activate'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.removeAdminBtn]}
                        onPress={() => handleDeleteAd(ad)}
                      >
                        <Text style={[styles.actionBtnText, styles.removeAdminBtnText]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'prizes' && (
  <>
    <View style={styles.payoutSummary}>
      <View style={styles.payoutCard}>
        <Text style={styles.payoutLabel}>Airtime Sent</Text>
        <Text style={[styles.payoutValue, { color: '#4ECDC4' }]}>
          ₦{prizeStats.totalAirtime.toLocaleString()}
        </Text>
      </View>
      <View style={styles.payoutCard}>
        <Text style={styles.payoutLabel}>Cash Sent</Text>
        <Text style={[styles.payoutValue, { color: '#FFD700' }]}>
          ₦{prizeStats.totalCash.toLocaleString()}
        </Text>
      </View>
    </View>

    <View style={styles.searchRow}>
      <Search size={18} color="rgba(255,255,255,0.45)" />
      <TextInput
        value={prizePhoneSearchDraft}
        onChangeText={setPrizePhoneSearchDraft}
        placeholder="Search by phone number…"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={styles.searchInput}
        keyboardType="phone-pad"
        returnKeyType="search"
        onSubmitEditing={applyPrizePhoneSearch}
        blurOnSubmit={false}
        autoCorrect={false}
        spellCheck={false}
      />
      <TouchableOpacity style={styles.searchBtn} onPress={applyPrizePhoneSearch}>
        <Text style={styles.searchBtnText}>Search</Text>
      </TouchableOpacity>
      {(prizePhoneSearchDraft.length > 0 || prizePhoneSearch.length > 0) ? (
        <TouchableOpacity onPress={clearPrizePhoneSearch}>
          <Text style={styles.searchClear}>Clear</Text>
        </TouchableOpacity>
      ) : null}
    </View>

    <View style={styles.filterRow}>
      {([
        { key: 'all' as const, label: 'All' },
        { key: 'unsettled' as const, label: 'Unsettled' },
        { key: 'settled' as const, label: 'Settled' },
      ]).map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[
            styles.filterPill,
            prizeSettleFilter === opt.key && styles.filterPillActive,
          ]}
          onPress={() => setPrizeSettleFilter(opt.key)}
        >
          <Text style={[
            styles.filterPillText,
            prizeSettleFilter === opt.key && styles.filterPillTextActive,
          ]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text style={styles.sectionTitle}>
      Prize Wins ({filteredPrizeStats.totalCount})
      {prizePhoneSearch.trim() ? ` · ${filteredPrizeStats.settledCount} settled · ${filteredPrizeStats.unsettledCount} unsettled` : ''}
    </Text>

    {prizesLoading ? (
      <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} />
    ) : filteredPrizes.length === 0 ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>{"\u{1F381}"}</Text>
        <Text style={styles.emptyText}>
          {prizePhoneSearch.trim()
            ? 'No prizes match that phone number'
            : prizeSettleFilter === 'unsettled'
              ? 'No unsettled prizes'
              : prizeSettleFilter === 'settled'
                ? 'No settled prizes yet'
                : 'No prize wins yet'}
        </Text>
      </View>
    ) : (
      filteredPrizes.map((p) => {
          const userPhone =
            p.user?.phone_number?.trim() || p.user_phone?.trim() || '';
          const hasPhone = userPhone.length > 0;
          const isCash = p.priceType === 'cash';
          const isAirtime = p.priceType === 'airtime';
          const isSettled = String(p.status).toUpperCase() === 'CLAIMED';
          const isFulfilling = fulfillingPrizeId === p.id;

          const buttonDisabled =
            isSettled ||
            isFulfilling ||
            (isAirtime && !hasPhone);
          let buttonText = isSettled ? 'Settled' : 'Mark settled';
          if (isFulfilling) buttonText = '...';
          else if (isAirtime && !hasPhone && !isSettled) buttonText = 'No phone';

          return (
            <View key={p.id} style={styles.winnerCard}>
  <View style={styles.winnerRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.winnerName}>{p.user?.name || 'User'}</Text>
      <Text style={styles.userPhone}>{hasPhone ? userPhone : 'No phone'}</Text>
    </View>
    <View style={{ alignItems: 'flex-end', gap: 6 }}>
      <View style={[styles.typeBadge, { backgroundColor: isCash ? 'rgba(255, 215, 0, 0.15)' : 'rgba(78, 205, 196, 0.2)' }]}>
        <Text style={[styles.typeText, { color: isCash ? '#FFD700' : '#4ECDC4' }]}>
          {p.priceType.toUpperCase()}
        </Text>
      </View>
      <View style={[
        styles.settleBadge,
        { backgroundColor: isSettled ? 'rgba(39,174,96,0.18)' : 'rgba(251,191,36,0.15)' },
      ]}>
        <Text style={[
          styles.settleBadgeText,
          { color: isSettled ? '#27AE60' : '#FBBF24' },
        ]}>
          {isSettled ? 'Settled' : 'Unsettled'}
        </Text>
      </View>
    </View>
  </View>

  <View style={styles.actionRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.prizeValueDisplay}>
        ₦{parseInt(p.priceValue, 10).toLocaleString()}
      </Text>
    </View>

    <View style={{ alignItems: 'flex-end' }}>
      <TouchableOpacity
        style={[
          styles.smallFulfillBtn,
          buttonDisabled && styles.disabledBtn,
          isSettled && { backgroundColor: 'rgba(39,174,96,0.1)', borderColor: 'transparent' }
        ]}
        onPress={() => handleFulfillPrize(p.id)}
        disabled={buttonDisabled}
      >
        {isFulfilling ? (
          <ActivityIndicator size="small" color="#FFD700" />
        ) : (
          <Text style={[
            styles.smallBtnText,
            isSettled && { color: '#30e69a' }
          ]}>
            {buttonText}
          </Text>
        )}
      </TouchableOpacity>
      <Text style={styles.winnerAt}>{formatDate(p.createdAt)}</Text>
    </View>
  </View>
</View>
          );
        })
    )}
  </>
)}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function getEggColor(type: string): string {
  switch (type) {
    case 'golden': return '#FFD700';
    case 'silver': return '#C0C0C0';
    case 'company': return '#FF6B6B';
    case 'business': return '#4ECDC4';
    default: return '#F4A460';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "bold" as const, color: "#FFF" },
  tabBar: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)" },
  activeTab: { backgroundColor: "rgba(255,255,255,0.15)" },
  tabText: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: "600" as const },
  activeTabText: { color: "#FFF" },
  content: { padding: 16, paddingBottom: 40 },
  loader: { marginVertical: 40 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: { width: "47%" as any, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, borderLeftWidth: 3 },
  statValue: { fontSize: 22, fontWeight: "bold" as const, color: "#FFF", marginTop: 8 },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "bold" as const, color: "#FFF", marginBottom: 12, marginTop: 8 },
  userRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 12, marginBottom: 8, gap: 10 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(78,205,196,0.2)", justifyContent: "center", alignItems: "center" },
  userAvatarText: { fontSize: 16, fontWeight: "bold" as const, color: "#4ECDC4" },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  userName: { fontSize: 14, fontWeight: "600" as const, color: "#FFF" },
  userEmail: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  userStats: { alignItems: "flex-end" },
  userWins: { fontSize: 12, fontWeight: "bold" as const, color: "#FFD700" },
  userCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  userCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255,215,0,0.2)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  adminBadgeText: { fontSize: 9, fontWeight: "bold" as const, color: "#FFD700" },
  guestBadge: { backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  guestBadgeText: { fontSize: 9, color: "rgba(255,255,255,0.5)" },
  userCardStats: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 10, padding: 10, marginBottom: 10 },
  miniStat: { alignItems: "center" },
  miniStatVal: { fontSize: 14, fontWeight: "bold" as const, color: "#FFF" },
  miniStatLbl: { fontSize: 9, color: "rgba(255,255,255,0.4)" },
  userCardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  joinedDate: { fontSize: 10, color: "rgba(255,255,255,0.4)" },
  actionBtn: { backgroundColor: "rgba(78,205,196,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { fontSize: 11, fontWeight: "600" as const, color: "#4ECDC4" },
  removeAdminBtn: { backgroundColor: "rgba(255,107,107,0.2)" },
  removeAdminBtnText: { color: "#FF6B6B" },
  winnerCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2, padding: 8, marginBottom: 8, borderLeftWidth: 2, borderLeftColor: "#FFD700" },
  winnerHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  winnerName: { fontSize: 14, fontWeight: "bold" as const, color: "#FFF" },
  winnerTime: { fontSize: 10, color: "rgba(255,255,255,0.4)" },
  winnerDetails: { flexDirection: "row", alignItems: "center", gap: 8 },
  winnerPrize: { flex: 1 },
  winnerPrizeText: { fontSize: 13, color: "#FFD700", fontWeight: "600" as const },
  eggTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  eggTypeText: { fontSize: 10, fontWeight: "bold" as const },
  winnerValue: { fontSize: 14, fontWeight: "bold" as const, color: "#27AE60" },
  paymentCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 14, marginBottom: 8 },
  paymentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  paymentRef: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "bold" as const, textTransform: "uppercase" },
  paymentDetails: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentAmount: { fontSize: 16, fontWeight: "bold" as const, color: "#27AE60" },
  paymentType: { fontSize: 12, color: "rgba(255,255,255,0.5)" },
  paymentDate: { fontSize: 10, color: "rgba(255,255,255,0.4)" },
  prizeForm: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 14 },
  formTitle: { fontSize: 13, fontWeight: "800" as const, color: "#FFF", marginBottom: 10 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  typePill: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  typePillActive: { backgroundColor: "rgba(255,215,0,0.16)", borderColor: "rgba(255,215,0,0.35)" },
  typePillText: { color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: "700" as const, textTransform: "uppercase" },
  typePillTextActive: { color: "#FFD700" },
  inputRow: { marginBottom: 10 },
  inputLabel: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 6, fontWeight: "700" as const },
  input: { height: 46, borderRadius: 12, paddingHorizontal: 12, color: "#FFF", backgroundColor: "rgba(0,0,0,0.25)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", fontWeight: "600" as const },
  createBtn: { marginTop: 6, backgroundColor: "#FFD700", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  createBtnText: { color: "#1a1a2e", fontWeight: "900" as const },
  adHint: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginBottom: 12, lineHeight: 18 },
  adCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  adCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  adTitle: { color: "#FFF", fontSize: 15, fontWeight: "700" as const },
  adDescription: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 4 },
  adMeta: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 6, fontWeight: "600" as const },
  adUrl: { color: "rgba(78,205,196,0.85)", fontSize: 10, marginBottom: 10, fontFamily: "monospace" },
  adActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: "rgba(255,255,255,0.5)" },
  disabledBtn: { backgroundColor: "rgba(255,255,255,0.2)" },
  accessDenied: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  accessDeniedTitle: { fontSize: 24, fontWeight: "bold" as const, color: "#FF6B6B", marginTop: 20, marginBottom: 8 },
  accessDeniedText: { fontSize: 14, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 24 },
  backBtn: { backgroundColor: "rgba(255,255,255,0.1)", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  backBtnText: { color: "#FFF", fontWeight: "600" as const },
  payoutSummary: {
  flexDirection: 'row',
  gap: 12,
  marginBottom: 20,
},
payoutCard: {
  flex: 1,
  backgroundColor: 'rgba(255,255,255,0.05)',
  padding: 15,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
},
payoutLabel: {
  color: 'rgba(255,255,255,0.5)',
  fontSize: 12,
  marginBottom: 4,
},
payoutValue: {
  fontSize: 18,
  fontWeight: '800',
},
payoutHint: {
  color: 'rgba(255,255,255,0.45)',
  fontSize: 11,
  marginTop: 6,
},
searchRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  paddingHorizontal: 14,
  paddingVertical: 10,
  marginBottom: 16,
},
searchInput: {
  flex: 1,
  color: '#FFF',
  fontSize: 15,
  paddingVertical: 0,
},
searchBtn: {
  backgroundColor: 'rgba(255,215,0,0.18)',
  borderWidth: 1,
  borderColor: 'rgba(255,215,0,0.5)',
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 6,
},
searchBtnText: {
  color: '#FFD700',
  fontSize: 12,
  fontWeight: '700',
},
searchClear: {
  color: '#4ECDC4',
  fontSize: 13,
  fontWeight: '600',
},
filterRow: {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 16,
},
filterPill: {
  flex: 1,
  paddingVertical: 10,
  borderRadius: 10,
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
},
filterPillActive: {
  backgroundColor: 'rgba(255,215,0,0.14)',
  borderColor: 'rgba(255,215,0,0.45)',
},
filterPillText: {
  color: 'rgba(255,255,255,0.55)',
  fontSize: 12,
  fontWeight: '700',
},
filterPillTextActive: {
  color: '#FFD700',
},
settleBadge: {
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 8,
},
settleBadgeText: {
  fontSize: 10,
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
},

userPhone: {
  color: '#4ECDC4',
  fontSize: 12,
  marginTop: 4,
},

fulfillBtn: {
  marginTop: 12,
  flexDirection: 'row',
  backgroundColor: '#27AE60',
  paddingVertical: 10,
  borderRadius: 10,
  justifyContent: 'center',
  alignItems: 'center',

},
winnerRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
typeBadge: {
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 6,
  marginLeft: 10,
},
typeText: {
  fontSize: 10,
  fontWeight: '700',
  letterSpacing: 0.5,
},
actionRow: {
  flexDirection: 'row',
  alignItems: 'flex-end', 
  justifyContent: 'space-between',
},
prizeValueDisplay: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '800',
  marginTop: 4,
},
smallFulfillBtn: {
  backgroundColor: '#27AE60',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
  marginBottom: 4, 
  minWidth: 100,
  alignItems: 'center',
},
smallBtnText: {
  color: 'hsl(0, 98%, 49%)',
  fontSize: 14,
  fontWeight: '900',
},
winnerAt: {
  fontSize: 10,
  color: 'rgba(250, 246, 246, 0.91)',
  fontWeight: '600',
},
});
