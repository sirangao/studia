import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';

const SERVER_URL = 'http://172.26.136.215:3000';

// Hardcoded for now. once auth is connected, this will come from a login context/prop
const CURRENT_USER = { id: '1', username: 'alice', name: 'Alice' };

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return 'In progress...';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SessionCard({ session }) {
  const isActive = session.active;
  return (
    <View style={[styles.sessionCard, isActive && styles.sessionCardActive]}>
      <View style={styles.sessionCardRow}>
        <Text style={styles.sessionSubject}>{session.subject}</Text>
        <Text style={[styles.sessionDuration, isActive && styles.sessionDurationActive]}>
          {isActive ? '🟢 Live' : formatDuration(session.duration)}
        </Text>
      </View>
      <Text style={styles.sessionDate}>{formatDate(session.startTime)}</Text>
    </View>
  );
}
//main screen
export default function HomeScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);

  //Classes state stored locally for now
  const [classes, setClasses] = useState(['CS 35L', 'Math 115A']);
  const [classInput, setClassInput] = useState('');
  const [editingClasses, setEditingClasses] = useState(false);

  //Start session subject input
  const [subjectInput, setSubjectInput] = useState('');
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const res = await fetch(`${SERVER_URL}/sessions/${CURRENT_USER.id}`);
      const data = await res.json();
      const sorted = (data.sessions || []).sort(
        (a, b) => new Date(b.startTime) - new Date(a.startTime)
      );
      setSessions(sorted);
      setActiveSession(sorted.find(s => s.active) || null);
    } catch (e) {
      Alert.alert('Connection error', 'Could not reach the server. Make sure it is running and YOUR_IP_HERE is set correctly.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSession() {
    if (!subjectInput.trim()) {
      Alert.alert('Enter a subject', 'What are you studying?');
      return;
    }
    setSessionLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/sessions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: CURRENT_USER.id, subject: subjectInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Could not start session');
        return;
      }
      setSubjectInput('');
      setShowSubjectInput(false);
      await fetchSessions();
    } catch (e) {
      Alert.alert('Connection error', 'Could not reach the server.');
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleStopSession() {
    setSessionLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/sessions/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: CURRENT_USER.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.error || 'Could not stop session');
        return;
      }
      await fetchSessions();
    } catch (e) {
      Alert.alert('Connection error', 'Could not reach the server.');
    } finally {
      setSessionLoading(false);
    }
  }

  function handleAddClass() {
    const trimmed = classInput.trim();
    if (!trimmed) return;
    if (classes.includes(trimmed)) {
      Alert.alert('Already added', `${trimmed} is already in your list.`);
      return;
    }
    setClasses([...classes, trimmed]);
    setClassInput('');
  }

  function handleRemoveClass(cls) {
    setClasses(classes.filter(c => c !== cls));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/*Header*/}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Hey, {CURRENT_USER.name} 👋</Text>
                <Text style={styles.subGreeting}>Ready to study?</Text>
              </View>
            </View>

            {/*Study Session Button*/}
            <View style={styles.section}>
              {activeSession ? (
                <>
                  <View style={styles.activeSessionBanner}>
                    <Text style={styles.activeSessionText}>
                      📖 Studying: <Text style={{ fontWeight: '700' }}>{activeSession.subject}</Text>
                    </Text>
                    <Text style={styles.activeSessionSince}>
                      Since {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.sessionBtn, styles.sessionBtnStop]}
                    onPress={handleStopSession}
                    disabled={sessionLoading}
                  >
                    {sessionLoading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.sessionBtnText}>⏹  End Session</Text>
                    }
                  </TouchableOpacity>
                </>
              ) : showSubjectInput ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="What are you studying? (e.g. CS 35L)"
                    placeholderTextColor="#aaa"
                    value={subjectInput}
                    onChangeText={setSubjectInput}
                    autoFocus
                  />
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={[styles.sessionBtn, { flex: 1, marginRight: 8 }]}
                      onPress={handleStartSession}
                      disabled={sessionLoading}
                    >
                      {sessionLoading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.sessionBtnText}>▶  Start</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sessionBtn, styles.sessionBtnCancel, { flex: 1 }]}
                      onPress={() => { setShowSubjectInput(false); setSubjectInput(''); }}
                    >
                      <Text style={styles.sessionBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.sessionBtn}
                  onPress={() => setShowSubjectInput(true)}
                >
                  <Text style={styles.sessionBtnText}>▶  Start Study Session</Text>
                </TouchableOpacity>
              )}
            </View>

            {/*My Classes*/}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Classes</Text>
                <TouchableOpacity onPress={() => setEditingClasses(!editingClasses)}>
                  <Text style={styles.sectionAction}>{editingClasses ? 'Done' : 'Edit'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.classPills}>
                {classes.map((cls) => (
                  <View key={cls} style={styles.pill}>
                    <Text style={styles.pillText}>{cls}</Text>
                    {editingClasses && (
                      <TouchableOpacity onPress={() => handleRemoveClass(cls)} style={styles.pillRemove}>
                        <Text style={styles.pillRemoveText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {editingClasses && (
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8, marginTop: 10 }]}
                    placeholder="Add a class (e.g. Phys 1A)"
                    placeholderTextColor="#aaa"
                    value={classInput}
                    onChangeText={setClassInput}
                    onSubmitEditing={handleAddClass}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddClass}>
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/*Session Log header*/}
            <View style={styles.sectionHeader2}>
              <Text style={styles.sectionTitle}>Study Log</Text>
              {!loading && (
                <TouchableOpacity onPress={fetchSessions}>
                  <Text style={styles.sectionAction}>Refresh</Text>
                </TouchableOpacity>
              )}
            </View>

            {loading && <ActivityIndicator style={{ marginTop: 20 }} color="#4A90D9" />}
            {!loading && sessions.length === 0 && (
              <Text style={styles.emptyText}>No sessions yet. Start your first one!</Text>
            )}
          </>
        }
        renderItem={({ item }) => <SessionCard session={item} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F4F8' },
  listContent: { paddingBottom: 40 },

  //Header
  header: {
    backgroundColor: '#1A1F36',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  greeting: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subGreeting: { color: '#8892B0', fontSize: 14, marginTop: 4 },

  //Sections
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A1F36' },
  sectionAction: { fontSize: 14, color: '#4A90D9', fontWeight: '600' },

  //Session button
  sessionBtn: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sessionBtnStop: { backgroundColor: '#E05252' },
  sessionBtnCancel: { backgroundColor: '#8892B0' },
  sessionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  //Active session banner
  activeSessionBanner: {
    backgroundColor: '#EAF4FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  activeSessionText: { fontSize: 15, color: '#1A1F36' },
  activeSessionSince: { fontSize: 12, color: '#8892B0', marginTop: 4 },

  //Classes pills
  classPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: '#EAF4FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillText: { color: '#4A90D9', fontWeight: '600', fontSize: 13 },
  pillRemove: { marginLeft: 6 },
  pillRemoveText: { color: '#4A90D9', fontSize: 11, fontWeight: '700' },

  //Input
  input: {
    borderWidth: 1,
    borderColor: '#E0E4EF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1F36',
    backgroundColor: '#F8F9FC',
  },
  addBtn: {
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  //Session cards
  sessionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sessionCardActive: { borderLeftWidth: 4, borderLeftColor: '#4A90D9' },
  sessionCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionSubject: { fontSize: 15, fontWeight: '700', color: '#1A1F36' },
  sessionDuration: { fontSize: 14, color: '#8892B0', fontWeight: '600' },
  sessionDurationActive: { color: '#4A90D9' },
  sessionDate: { fontSize: 12, color: '#aaa', marginTop: 4 },

  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 16, fontSize: 14 },

  row: { flexDirection: 'row', alignItems: 'center' },
});