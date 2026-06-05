import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';

const LOGO = require('../assets/placeholder-logo.png');

const API_URL = process.env.EXPO_PUBLIC_API_URL;

function Requirement({ met, label }) {
  return (
    <View style={styles.requirementRow}>
      <View style={[styles.requirementBar, met ? styles.requirementMet : styles.requirementUnmet]} />
      <Text style={[styles.requirementText, met ? styles.requirementTextMet : styles.requirementTextUnmet]}>
        {label}
      </Text>
    </View>
  );
}

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordLong = password.length >= 8;
  const passwordHasNumber = /\d/.test(password);
  const passwordHasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordNoSpace = !password.includes(' ');
  const usernameNoSpace = !username.includes(' ');
  const usernameValid = username.length >= 3;

  async function handleSubmit() {
    if (!username || !password || (mode === 'register' && !name)) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (mode === 'register') {
      if (!usernameValid || !usernameNoSpace) {
        Alert.alert('Invalid username', 'Must be at least 3 characters with no spaces.');
        return;
      }
      if (!passwordLong || !passwordHasNumber || !passwordHasSpecial || !passwordNoSpace) {
        Alert.alert('Weak password', 'Password must be at least 8 characters, contain a number, a special character, and no spaces.');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login'
        ? { username, password }
        : { username, password, name };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert(mode === 'login' ? 'Login failed' : 'Registration failed', data.error || 'Something went wrong.');
        return;
      }

      onLogin(data.user, data.token);
    } catch (err) {
      Alert.alert('Error', 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(newMode) {
    setMode(newMode);
    setUsername('');
    setPassword('');
    setName('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={[styles.header, mode === 'register' && styles.headerCompact]}>
        <Image source={LOGO} style={[styles.logo, mode === 'register' && styles.logoCompact]} resizeMode="contain" />
        <Text style={styles.title}>Studia</Text>
        {mode === 'login' && <Text style={styles.subtitle}>Track sessions. Stay accountable.</Text>}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'login' && styles.tabActive]}
          onPress={() => switchMode('login')}
        >
          <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'register' && styles.tabActive]}
          onPress={() => switchMode('register')}
        >
          <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Register</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        {mode === 'register' && username.length > 0 && (
          <View style={styles.requirements}>
            <Requirement met={usernameValid} label="At least 3 characters" />
            <Requirement met={usernameNoSpace} label="No spaces" />
          </View>
        )}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {mode === 'register' && password.length > 0 && (
          <View style={[styles.strengthBar, passwordLong && passwordHasNumber && passwordHasSpecial && passwordNoSpace ? styles.strengthBarValid : styles.strengthBarInvalid]} />
        )}
        {mode === 'register' && password.length > 0 && (
          <View style={styles.requirements}>
            <Requirement met={passwordLong} label="At least 8 characters" />
            <Requirement met={passwordHasNumber} label="Contains a number" />
            <Requirement met={passwordHasSpecial} label="Contains a special character (!@#$...)" />
            <Requirement met={passwordNoSpace} label="No spaces" />
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>
          }
        </TouchableOpacity>
      </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  header: {
    backgroundColor: '#1A1F36',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  logoCompact: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  headerCompact: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#8892B0',
    marginTop: 6,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#4A90D9',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8892B0',
  },
  tabTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 20,
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
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  strengthBar: {
    height: 3,
    borderRadius: 2,
    marginBottom: 12,
    marginTop: -8,
  },
  strengthBarValid: {
    backgroundColor: '#34C759',
  },
  strengthBarInvalid: {
    backgroundColor: '#E05252',
  },
  requirements: {
    marginBottom: 12,
    gap: 4,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  requirementMet: {
    backgroundColor: '#34C759',
  },
  requirementUnmet: {
    backgroundColor: '#E05252',
  },
  requirementText: {
    fontSize: 12,
  },
  requirementTextMet: {
    color: '#34C759',
  },
  requirementTextUnmet: {
    color: '#E05252',
  },
});
