import { View, Text, StyleSheet, FlatList } from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import { useFocusEffect } from '@react-navigation/native';
import FriendCard from '../components/FriendCard';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

//while on friends screen, update friends list every five seconds
//and display their profile
export default function FriendsScreen({ user, token }) {
  const [friends, setFriends] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const loadFriends = async () => {
        try{
          const data = await fetch(`${API_URL}/friends/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          const friendsList = await data.json();
          setFriends(friendsList.friends || []);
        }
        catch (err){
          console.error('ERROR: could not fetch list of friends;', err);
        }
      };
      // load friends on startup
      loadFriends();

      //update friends list every 5 seconds
      const interval = setInterval(() => {
        loadFriends();
      }, 5000);

      return () => clearInterval(interval);



    }, [user.id, token])
  );


  return (
    <View style={styles.container}>
      <View style={styles.header}> 
        <Text style={styles.headerTitle}>My Friends</Text>
      </View>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => (
          <FriendCard
            username={item.username}
            name={item.name}
            hoursStudied={item.hoursStudied}
            avatarURL={item.avatarURL}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1},
  header: {
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e5e5',
      borderTopColor: '#e5e5e5',
      backgroundColor: '#fff',
      textAlign: 'center'
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#111',
    },
    list: { paddingVertical: 8 },
});
