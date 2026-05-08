import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';

const CURRENT_USER = { id: '1', username: 'alice', name: 'Alice' };

function SessionTimer({ subject, onEndSession }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const intervalIdRef = useRef(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (isRunning) {
      intervalIdRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 10);
    }

    return () => {
      clearInterval(intervalIdRef.current);
    };
  }, [isRunning]);

  function start() {
    setIsRunning(true);
    startTimeRef.current = Date.now() - elapsedTime;
  }

  function stop() {
    setIsRunning(false);
  }

  function reset() {
    setElapsedTime(0);
    setIsRunning(false);
  }

  function endSession() {
    setIsRunning(false);

    onEndSession({
      id: String(Date.now()),
      userId: CURRENT_USER.id,
      subject,
      durationMs: elapsedTime,
      startTime: new Date(Date.now() - elapsedTime).toISOString(),
      endTime: new Date().toISOString(),
      active: false,
    });
  }

  function displayTime() {
    let hours = Math.floor(elapsedTime / (1000 * 60 * 60));
    let minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
    let seconds = Math.floor((elapsedTime / 1000) % 60);

    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    seconds = String(seconds).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }

  return (
    <SafeAreaView style={styles.timerContainer}>
      <Text style={styles.timerSubject}>Studying</Text>
      <Text style={styles.timerSubjectName}>{subject}</Text>

      <Text style={styles.timerDisplay}>{displayTime()}</Text>

      <TouchableOpacity onPress={start} style={styles.startControls}>
        <Text style={styles.buttonText}>Start / Resume Session</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={stop} style={styles.stopControls}>
        <Text style={styles.buttonText}>Pause Session</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={reset} style={styles.resetControls}>
        <Text style={styles.buttonText}>Restart Session</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={endSession} style={styles.endControls}>
        <Text style={styles.buttonText}>End Session</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function formatDurationMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function SessionCard({ session }) {
  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionCardRow}>
        <Text style={styles.sessionSubject}>{session.subject}</Text>
        <Text style={styles.sessionDuration}>
          {formatDurationMs(session.durationMs)}
        </Text>
      </View>
      <Text style={styles.sessionDate}>
        {new Date(session.endTime).toLocaleString()}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const [screen, setScreen] = useState('home');

  const [sessions, setSessions] = useState([]);
  const [activeSubject, setActiveSubject] = useState('');

  const [classes, setClasses] = useState(['CS 35L', 'Math 115A']);
  const [classInput, setClassInput] = useState('');
  const [editingClasses, setEditingClasses] = useState(false);

  const [subjectInput, setSubjectInput] = useState('');
  const [showSubjectInput, setShowSubjectInput] = useState(false);

  function handleStartSession() {
    if (!subjectInput.trim()) {
      Alert.alert('Enter a subject', 'What are you studying?');
      return;
    }

    setActiveSubject(subjectInput.trim());
    setSubjectInput('');
    setShowSubjectInput(false);
    setScreen('timer');
  }

  function handleEndSession(session) {
    setSessions([session, ...sessions]);
    setActiveSubject('');
    setScreen('home');
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

  if (screen === 'timer') {
    return (
      <SessionTimer
        subject={activeSubject}
        onEndSession={handleEndSession}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.greeting}>Hey, {CURRENT_USER.name} 👋</Text>
              <Text style={styles.subGreeting}>Ready to study?</Text>
            </View>

            <View style={styles.section}>
              {showSubjectInput ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="What are you studying? e.g. CS 35L"
                    placeholderTextColor="#aaa"
                    value={subjectInput}
                    onChangeText={setSubjectInput}
                    autoFocus
                  />

                  <View style={styles.row}>
                    <TouchableOpacity
                      style={[styles.sessionBtn, { flex: 1, marginRight: 8 }]}
                      onPress={handleStartSession}
                    >
                      <Text style={styles.sessionBtnText}>▶ Start</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.sessionBtn, styles.sessionBtnCancel, { flex: 1 }]}
                      onPress={() => {
                        setShowSubjectInput(false);
                        setSubjectInput('');
                      }}
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
                  <Text style={styles.sessionBtnText}>▶ Start Study Session</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Classes</Text>

                <TouchableOpacity onPress={() => setEditingClasses(!editingClasses)}>
                  <Text style={styles.sectionAction}>
                    {editingClasses ? 'Done' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.classPills}>
                {classes.map((cls) => (
                  <View key={cls} style={styles.pill}>
                    <Text style={styles.pillText}>{cls}</Text>

                    {editingClasses && (
                      <TouchableOpacity
                        onPress={() => handleRemoveClass(cls)}
                        style={styles.pillRemove}
                      >
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
                    placeholder="Add a class"
                    placeholderTextColor="#aaa"
                    value={classInput}
                    onChangeText={setClassInput}
                    onSubmitEditing={handleAddClass}
                  />

                  <TouchableOpacity style={styles.addBtn} onPress={handleAddClass}>
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.sectionHeader2}>
              <Text style={styles.sectionTitle}>Study Log</Text>
            </View>

            {sessions.length === 0 && (
              <Text style={styles.emptyText}>
                No sessions yet. Start your first one!
              </Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },

  listContent: {
    paddingBottom: 40,
  },

  header: {
    backgroundColor: '#1A1F36',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },

  greeting: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },

  subGreeting: {
    color: '#8892B0',
    fontSize: 14,
    marginTop: 4,
  },

  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionHeader2: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1F36',
  },

  sectionAction: {
    fontSize: 14,
    color: '#4A90D9',
    fontWeight: '600',
  },

  sessionBtn: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },

  sessionBtnCancel: {
    backgroundColor: '#8892B0',
  },

  sessionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

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

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  classPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  pill: {
    backgroundColor: '#EAF4FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pillText: {
    color: '#4A90D9',
    fontWeight: '600',
    fontSize: 13,
  },

  pillRemove: {
    marginLeft: 6,
  },

  pillRemoveText: {
    color: '#4A90D9',
    fontSize: 11,
    fontWeight: '700',
  },

  addBtn: {
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
    justifyContent: 'center',
  },

  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  sessionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
  },

  sessionCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sessionSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1F36',
  },

  sessionDuration: {
    fontSize: 14,
    color: '#8892B0',
    fontWeight: '600',
  },

  sessionDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },

  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 16,
    fontSize: 14,
  },

  timerContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  timerSubject: {
    fontSize: 18,
    color: '#8892B0',
    marginBottom: 4,
  },

  timerSubjectName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 20,
  },

  timerDisplay: {
    fontSize: 56,
    fontWeight: '700',
    color: 'white',
    marginBottom: 20,
    backgroundColor: 'blue',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    overflow: 'hidden',
  },

  startControls: {
    marginTop: 10,
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'green',
    justifyContent: 'center',
    alignItems: 'center',
    height: 70,
    width: '80%',
  },

  stopControls: {
    marginTop: 10,
    marginBottom: 12,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'red',
    height: 70,
    width: '80%',
  },

  resetControls: {
    marginTop: 10,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'purple',
    height: 70,
    width: '80%',
  },

  endControls: {
    marginTop: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#1A1F36',
    height: 70,
    width: '80%',
  },

  buttonText: {
    color: 'white',
    fontSize: 20,
  },
});