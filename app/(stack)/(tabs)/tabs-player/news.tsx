import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, StyleSheet, ImageBackground, Image, RefreshControl, Modal, TextInput,KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform, useColorScheme} from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import { BASE_URL } from '@/hooks/api';
import { useFetchWithAuth } from '@/hooks/fetchWithAuth';
import { useRouter } from 'expo-router';
import ProfileCompletionBanner from "@/components/ProfileCompletionBanner";

type Training = {
  id: number;
  description: string;
  date: string;
  location: string;
  category: number;
  category_name: string;
  attendance_summary: {
    goalies: number;
    present: number;
    absent: number;
    unknown: number;
  };
  user_status: 'present' | 'absent' | 'unknown';
};

// doplniť hore medzi importy
type Match = {
  id: number;
  date: string;
  location: string;
  opponent: string;
  category: number;
  category_name: string;
  description: string;
  is_substitute: boolean;
  confirmed: boolean | null;
};






export default function TreningyScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const themeColors = {
    background: isDarkMode ? '#121212' : '#f4f4f8',
    card: isDarkMode ? '#1E1E1E' : '#fff',
    text: isDarkMode ? '#fff' : '#000',
    secondaryText: isDarkMode ? '#aaa' : '#333',
    accent: '#D32F2F',
    border: isDarkMode ? '#333' : '#ccc',
  };

  const {
    isLoggedIn,
    userRoles,
    accessToken,
    setUserRoles,
    setUserCategories,
  } = useContext(AuthContext);
  const [matches, setMatches] = useState<Match[]>([]);
  const { fetchWithAuth } = useFetchWithAuth();
  const router = useRouter();
  const { userDetails } = useContext(AuthContext);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const fetchTrainings = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/player-trainings/`);
      const data = await res.json();
      setTrainings(data);
    } catch (error) {
      console.error('fetchTrainings error:', error);
    } finally {
      setLoading(false);
    }
  };


  // nový fetch zápasov
  const fetchMatches = async () => {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/player-nominated-matches/`);
      const data = await res.json();
      setMatches(data);
    } catch (error) {
      console.error('fetchMatches error:', error);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTrainings();
      await fetchMatches();

      const meRes = await fetchWithAuth(`${BASE_URL}/me/`);
      if (meRes.ok) {
        const meData = await meRes.json();
        await setUserRoles(Array.isArray(meData.roles) ? meData.roles : []);
        await setUserCategories(Array.isArray(meData.categories) ? meData.categories : []);
      } else {
        console.warn('Nepodarilo sa načítať /me počas refreshu');
      }
    } catch (error) {
      console.error('Chyba počas refreshu:', error);
    }
    setRefreshing(false);
  };

// v useEffect:
  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;
    void fetchTrainings();
    void fetchMatches();
  }, [isLoggedIn, accessToken]);

// pomocná funkcia na zmenu účasti
  async function handleMatchConfirmation(matchId: number, confirmed: boolean) {
    try {
      const res = await fetchWithAuth(`${BASE_URL}/match-participation/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: matchId, confirmed }),  // napr. confirmed: true
      });
      console.log("Posielam na match-participations:", {
        match_id: matchId,
        confirmed,
      });

      if (!res.ok) throw new Error();

      setMatches(prev =>
          prev.map(m =>
              m.id === matchId ? { ...m, confirmed } : m
          )
      );
    } catch (error) {
      Alert.alert('Chyba', 'Nepodarilo sa uložiť tvoju účasť.');
    }
  }


  const groupedTrainings = (userRoles || [])
      .filter(r => r.role.toLowerCase() === 'player' || r.role.toLowerCase() === 'hráč')
      .map(r => r.category.name)
      .filter((v, i, a) => a.indexOf(v) === i) // unikátne kategórie
      .reduce((acc, category) => {
        const filtered = trainings.filter(t => t.category_name === category);
        if (filtered.length > 0) acc[category] = filtered;
        return acc;
      }, {} as Record<string, Training[]>);

  const totalUpcoming =
      Object.values(groupedTrainings).reduce((sum, arr) => sum + arr.length, 0);

  if (!isLoggedIn || loading) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  // ===== EMPTY STATE =====
  const totalMatches = matches.length;

  if (totalUpcoming === 0 && totalMatches === 0) {
    return (
        <View style={{ flex: 1 }}>
          <ProfileCompletionBanner />

          <ScrollView
              contentContainerStyle={styles.emptyWrap}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <Image
                source={require('@/assets/images/emptytg.png')}
                style={styles.emptyImage}
            />
            <Text style={styles.emptySub}>Nemáš žiadne nové udalosti</Text>
            <Text style={styles.emptySub}>Potiahni nadol pre obnovenie, alebo sa sem pozri neskôr.</Text>
          </ScrollView>
        </View>
    );
  }

  // ===== LIST =====
  return (

  <ScrollView
          style={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
    <ProfileCompletionBanner />



    {/*Zápasy*/}
        {Object.entries(
            matches.reduce((acc, m) => {
              if (!acc[m.category_name]) acc[m.category_name] = [];
              acc[m.category_name].push(m);
              return acc;
            }, {} as Record<string, Match[]>)
        ).map(([category, categoryMatches]) => (
            <View key={category + '-matches'} style={{ marginBottom: 30 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 15 }}>
                {category} - Zápas
              </Text>

              {categoryMatches.map(match => {
                const dateObj = new Date(match.date);
                const formattedDate = dateObj.toLocaleDateString('sk-SK', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                const formattedTime = dateObj.toLocaleTimeString('sk-SK', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });

                const now = new Date();
                const matchTime = new Date(match.date);
                const lockHours = userDetails?.club?.training_lock_hours ?? 3;
                const canChangeStatus =
                  matchTime.getTime() - now.getTime() > lockHours * 60 * 60 * 1000;
                return (
                    <ImageBackground
                        key={`match-${match.id}`}
                        source={require('@/assets/images/zapas_pozadie.png')}
                        imageStyle={{ borderRadius: 10 }}
                        style={{
                          marginBottom: 15,
                          padding: 15,
                          backgroundColor: '#fff',
                          borderRadius: 10,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 5,
                          elevation: 3,
                        }}
                    >
                      <TouchableOpacity
                          onPress={() => router.push({ pathname: '/(stack)/match/[id]', params: { id: String(match.id) } })}
                      >
                        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8C1919', marginBottom: 6 }}>
                          Nominácia na {match.opponent}
                        </Text>

                      <Text style={{ color: '#555', marginBottom: 4, fontSize: 17, fontWeight: 'bold' }}>
                        {formattedTime} • {formattedDate}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                        <Text style={{ fontSize: 16, color: '#D32F2F' }}>📍</Text>
                        <Text style={{ fontSize: 16, color: '#333' }}>{match.location}</Text>
                      </View>

                      <Text
                          style={{
                            marginTop: 4,
                            color: match.is_substitute ? '#fbc02d' : '#388e3c',
                            fontWeight: 'bold',
                          }}
                      >
                        {match.is_substitute ? '🟡 Nominovaný ako náhradník' : '🟢 Nominovaný do základu'}
                      </Text>

                      <Text style={{ marginTop: 10 }}>
                        {match.confirmed === true && '🟢 Potvrdené'}
                        {match.confirmed === false && '🔴 Odmietnuté'}
                        {match.confirmed === null && '⚫ Nepotvrdené'}
                      </Text>



                      {canChangeStatus ? (
                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            {[true, false].map(value => {
                              const label = value ? 'Prídem' : 'Neprídem';
                              const selected = match.confirmed === value;

                              return (
                                  <TouchableOpacity
                                      key={String(value)}
                                      onPress={() => handleMatchConfirmation(match.id, value)}
                                      style={{
                                        backgroundColor: selected ? (value ? '#4caf50' : '#f44336') : '#e0e0e0',
                                        paddingVertical: 6,
                                        paddingHorizontal: 14,
                                        borderRadius: 20,
                                      }}
                                  >
                                    <Text style={{ color: selected ? '#fff' : '#000' }}>{label}</Text>
                                  </TouchableOpacity>
                              );
                            })}
                          </View>
                      ) : (
                          <Text style={{ marginTop: 10, color: 'gray', fontStyle: 'italic' }}>
                            Zmena účasti nie je možná - pri potrebe zmeny kontaktujte Trénera
                          </Text>
                      )}
                      </TouchableOpacity>
                    </ImageBackground>
                );
              })}
            </View>
        ))}

        {/*Tréningy */}
        {Object.entries(groupedTrainings).map(([category, trainings]) => (
            <View key={category} style={{ marginBottom: 30 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 15 }}>{category}</Text>

              {trainings.map(t => {
                const dateObj = new Date(t.date);
                const formattedDate = dateObj.toLocaleDateString('sk-SK', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                const formattedTime = dateObj.toLocaleTimeString('sk-SK', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });
                
                const now = new Date();
                const trainingDate = new Date(t.date);
                const lockHours = userDetails?.club?.training_lock_hours ?? 0;
                const canChangeStatus =
                  trainingDate.getTime() - now.getTime() > lockHours * 60 * 60 * 1000;

                return (
                    <ImageBackground
                        key={t.id}
                        source={require('@/assets/images/tgpozadie.png')}
                        imageStyle={{
                          borderRadius: 10,
                          resizeMode: 'cover',
                        }}
                        style={{
                          marginBottom: 15,
                          padding: 15,
                          backgroundColor: '#fff',
                          borderRadius: 10,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 5,
                          elevation: 3,
                        }}
                    >
                      <View key={t.id}>
                        <TouchableOpacity
                            onPress={() =>
                                router.push({
                                  pathname: '/(stack)/training/[id]',
                                  params: { id: String(t.id) },
                                })
                            }
                        >
                          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8C1919', marginBottom: 6 }}>
                            {t.description || 'Tréning'}
                          </Text>

                        {/* Dátum a čas */}
                        <Text style={{ color: '#555', marginBottom: 4, fontSize: 17, fontWeight: 'bold' }}>
                          {formattedTime} • {formattedDate}
                        </Text>

                        {/* Miesto */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 5 }}>
                          <Text style={{ fontSize: 16, color: '#D32F2F' }}>📍</Text>
                          <Text style={{ fontSize: 16, color: '#333' }}>{t.location}</Text>
                        </View>

                        <Text style={styles.attendance_present}>
                          🟢 PRÍDE: {t.attendance_summary.present}+{t.attendance_summary.goalies || 0}
                        </Text>
                        <Text style={styles.attendance_absent}>🔴 NEPRÍDE: {t.attendance_summary.absent}</Text>
                        <Text style={styles.attendance_unknown}>⚫ NEHLASOVALO: {t.attendance_summary.unknown}</Text>

                        <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                          {canChangeStatus ? (
                              <View style={{ flexDirection: 'row', gap: 10 }}>
                              {['present', 'absent'].map(status => {
                                const label = status === 'present' ? 'Prídem' : 'Neprídem';
                                const backgroundColor =
                                    t.user_status === status
                                        ? status === 'present'
                                            ? '#4caf50'
                                            : '#f44336'
                                        : '#e0e0e0';
                                const textColor = t.user_status === status ? '#fff' : '#000';

                                return (
                                    <TouchableOpacity
                                        key={status}
                                        onPress={() => {
                                            if (status === 'absent') {
                                                setSelectedTrainingId(t.id);
                                                setShowReasonModal(true);
                                            } else {
                                                handleAttendanceChange(t.id, 'present');
                                            }
                                        }}
                                        style={{
                                            backgroundColor,
                                            paddingVertical: 6,
                                            paddingHorizontal: 14,
                                            borderRadius: 20,
                                        }}
                                    >
                                        <Text style={{ color: textColor, fontWeight: '600' }}>{label}</Text>
                                    </TouchableOpacity>
                                );
                              })}
                              </View>
                          ) : (
                              <Text style={{ marginTop: 10, color: 'gray', fontStyle: 'italic' }}>
                                Zmena účasti už nie je možná - pri potrebnej zmene kontaktujte Trénera
                              </Text>
                          )}
                        </View>
                        </TouchableOpacity>
                      </View>
                    </ImageBackground>


                );
              })}
            </View>
        ))}

{showReasonModal && (
  <Modal
    transparent
    animationType="slide"
    onRequestClose={() => setShowReasonModal(false)}
  >
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalOverlay}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Vyber dôvod neprítomnosti</Text>

          {['Škola', 'Práca', 'Choroba', 'Zranenie', 'Tréning v inej kategórii', 'Iné'].map(reason => (
            <TouchableOpacity
              key={reason}
              style={[
                styles.reasonButton,
                { backgroundColor: selectedReason === reason ? '#D32F2F' : '#e0e0e0' },
              ]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text style={{ color: selectedReason === reason ? '#fff' : '#000' }}>
                {reason}
              </Text>
            </TouchableOpacity>
          ))}

          {selectedReason === 'Iné' && (
            <TextInput
              style={styles.input}
              placeholder="Zadaj dôvod..."
              placeholderTextColor="#666" // ← lepšia čitateľnosť v dark mode
              value={customReason}
              onChangeText={setCustomReason}
              multiline
            />
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
            <TouchableOpacity
              onPress={() => {
                setShowReasonModal(false);
                setSelectedReason(null);
                setCustomReason('');
                Keyboard.dismiss();
              }}
              style={[styles.reasonButton, { backgroundColor: '#ccc' }]}
            >
              <Text style={{ color: '#000', margin: 7 }}>Zrušiť</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (!selectedReason) {
                  Alert.alert('Chyba', 'Vyber prosím dôvod.');
                  return;
                }

                if (selectedReason === 'Iné' && !customReason.trim()) {
                  Alert.alert('Chyba', 'Prosím, napíš dôvod, keď vyberieš možnosť "Iné".');
                  return;
                }

                const finalReason =
                  selectedReason === 'Iné' ? customReason.trim() : selectedReason;

                handleAttendanceChange(selectedTrainingId!, 'absent', finalReason);
                setShowReasonModal(false);
                setSelectedReason(null);
                setCustomReason('');
                Keyboard.dismiss();
              }}
              style={[styles.reasonButton, { backgroundColor: '#D32F2F' }]}
            >
              <Text style={{ color: '#fff', margin: 7 }}>Potvrdiť</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </Modal>
)}
      </ScrollView>
  );


    
    async function handleAttendanceChange(
      trainingId: number,
      newStatus: 'present' | 'absent' | 'unknown',
      reason?: string
    ) {
      try {
        const res = await fetchWithAuth(`${BASE_URL}/set-training-attendance/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            training_id: trainingId,
            status: newStatus,
            reason: reason ?? null, // ← odosielame dôvod
          }),
        });

      if (!res.ok) {
        Alert.alert('Chyba', 'Nepodarilo sa zmeniť status účasti.');
        return;
      }

      setTrainings(prev =>
          prev.map(t => {
            if (t.id !== trainingId) return t;

            if (t.user_status === newStatus) {
              return t; // žiadna zmena
            }

            const oldStatus = t.user_status;
            const updatedSummary = { ...t.attendance_summary };

            if (oldStatus === 'present') updatedSummary.present -= 1;
            if (oldStatus === 'absent') updatedSummary.absent -= 1;
            if (oldStatus === 'unknown') updatedSummary.unknown -= 1;

            if (newStatus === 'present') updatedSummary.present += 1;
            if (newStatus === 'absent') updatedSummary.absent += 1;
            if (newStatus === 'unknown') updatedSummary.unknown += 1;

            return {
              ...t,
              user_status: newStatus,
              attendance_summary: updatedSummary,
            };
          })
      );
    } catch (error) {
      console.error('Attendance error:', error);
      Alert.alert('Chyba', 'Nepodarilo sa zmeniť status účasti.');
    }
  }
}

const styles = StyleSheet.create({
  attendance_present: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
    color: 'green',
  },
  attendance_absent: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
    color: 'red',
  },
  attendance_unknown: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 6,
    color: 'grey',
  },
  // Empty state
  emptyWrap: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f8',
  },
  emptyImage: {
    width: 350,
    height: 350,
    resizeMode: 'contain',
    marginBottom: 16,
    opacity: 0.9,
  },
  emptySub: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  width: '85%',
  elevation: 5,
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 15,
  textAlign: 'center',
},
reasonButton: {
  paddingVertical: 10,
  borderRadius: 8,
  alignItems: 'center',
  marginVertical: 5,
},
input: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  padding: 10,
  marginTop: 10,
  backgroundColor: '#fff', // ← biele pozadie pre dark mode
  color: '#000', // ← text bude čierny
},

});

