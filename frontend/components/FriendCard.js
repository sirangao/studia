import {View, Text} from 'react-native';

export default function FriendCard({ username }) {                                                                                           
    return (                                                                                                                                   
      <View>
        <Text>{username}</Text>                                                                                                                
      </View>     
    );
}