import { useState, useEffect } from 'react';
import {View, Text, Image, Alert, TouchableOpacity, StyleSheet} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const DEFAULT_AVATAR = require('../assets/default-avatar.png');

export default function FriendProfile({ user, friend, token, exitProfile}){
    const [friendProfile, setFriendProfile] = useState(null);
    const [sendingRequest, setSendingRequest] = useState(false);

    useEffect(() => {
        const loadFriends = async () => {
            try{
                const data = await fetch(`${API_URL}/friends/profile/${friend.id}`, { // TODO
                headers: { 'Authorization': `Bearer ${token}` },
                });
                const profile = await data.json();
                setFriendProfile(profile);
            }
            catch (err){
                console.error('ERROR: could not fetch user;', err);
                exitProfile();
            } 
        };
        loadFriends();
    }, []);

    async function sendFriendRequest(){
        setSendingRequest(true);
        try{
            const data = await fetch(`${API_URL}/friends/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({friendId: friend.id})
            });
            if(!data.ok) throw new Error('/friends/add request error');
            setFriendProfile((prev) => ({
                ...prev, 
                status: 'pending',
                isRequester: true,
            }));
        }
        catch(err){
            Alert.alert('Friend request error', 'Could not send friend request');
        }
        finally{
            setSendingRequest(false);
        }
    }

    async function acceptFriendRequest(){
        setSendingRequest(true);
        try{
            const data = await fetch(`${API_URL}/friends/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({friendId: friend.id})
            });
            if(!data.ok) throw new Error('/friends/add request error');
            setFriendProfile((prev) => ({
                ...prev, 
                status: 'accepted',
            }));
        }
        catch(err){
            Alert.alert('Friend request error', 'Could not accept friend request');
        }
        finally{
            setSendingRequest(false);
        }
    }

    if(!friendProfile)
        return <View style={styles.container}/>;
    
    let buttonText = 'Request Friend';
    let disableButton = false;
    const buttonHandler = (friendProfile.status === 'pending' && !friendProfile.isRequester) ? acceptFriendRequest : sendFriendRequest;
    if(friendProfile.status === 'accepted'){
        buttonText = 'Friends';
        disableButton = true;
    }
    else if(friendProfile.status === 'pending' && friendProfile.isRequester){
        buttonText = 'Requested';
        disableButton = true;
    }
    else if(friendProfile.status === 'pending' && !friendProfile.isRequester){
        buttonText = 'Accept Request';
        disableButton = false;
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={exitProfile}
                style={styles.exitButton}
            >
                <Text>X</Text>
            </TouchableOpacity>

            <View style={styles.profileCard}>
                <Image 
                    style={styles.profileAvatar}
                    source={friendProfile.user.avatar_url ? {uri: friendProfile.user.avatar_url} : DEFAULT_AVATAR}
                />

                <View style={styles.profileInfo}>
                
                    <Text style={styles.profileName}>{friendProfile.user.name}</Text>
                    <Text style={styles.profileUsername}>@{friendProfile.user.username}</Text>
                    <Text style={styles.profileStat}>{friendProfile.friendCount} Friends</Text>
                
                </View>
            </View>

            <TouchableOpacity
                onPress={buttonHandler}
                disabled={disableButton || sendingRequest}
            >
                <Text style={styles.reqButtonText}>{buttonText}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },

    exitButton:{
        fontSize: 18,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 18,
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        margin: 4,
        backgroundColor: '#b4b4b4',
    },

    profileCard: {
        backgroundColor: '#1A1F36',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },

    profileInfo: {
        flex: 1,
        paddingHorizontal: 16,
    },

    profileName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
    },

    profileUsername: {
        color: '#8892B0',
        fontSize: 14,
        marginTop: 6,
    },

    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 80/2,
        borderWidth: 1.5,
        borderColor: 'dimgray',
    },

    profileStat:{
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 8,
        fontSize: 14,
        color: '#8892B0'
    },

    reqButtonText: {
        alignSelf: 'center',
        borderWidth: 1,
        borderRadius: 8,
        borderColor: 'black',
        backgroundColor: '#8892B0',
        padding: 4,
        margin: 4,
    },
});