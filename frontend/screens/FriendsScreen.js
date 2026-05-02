import { View, Text, StyleSheet, FlatList } from 'react-native';
import FriendCard from '../components/FriendCard';

const testFriends = [
    { id: '1', username: 'andrew' },
    { id: '2', username: 'trevor' },
    { id: '3', username: 'arnav' },
    { id: '4', username: 'faris'},
    { id: '5', username: 'siran'}
  ];

export default function FriendsScreen() {
  return (
    <View style={styles.container}>
      <Text>Friends</Text>
      <FlatList
        data={testFriends}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => <FriendCard username={item.username} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1},
});
