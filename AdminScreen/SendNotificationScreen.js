import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');
const db = getFirestore();

export default function SendNotification({ navigation }) {
  const [notificationTitle, setNotificationTitle] = useState(''); // Notification title state
  const [notificationText, setNotificationText] = useState(''); // Notification text state

  // Function to send notification and store in Firestore
  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationText) {
      Alert.alert("Error", "Title and notification text cannot be empty.");
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        title: notificationTitle,
        text: notificationText,
        timestamp: new Date().toISOString(),
      });
      Alert.alert("Success", "Notification sent to the Beneficiaries!");
      setNotificationTitle('');
      setNotificationText('');
    } catch (error) {
      Alert.alert("Error", "Failed to send notification. Please try again.");
      console.error("Error sending notification: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Send Notification</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter notification title..."
        placeholderTextColor="#666"
        value={notificationTitle}
        onChangeText={setNotificationTitle}
      />

      <TextInput
        style={[styles.input, styles.textArea]} // Apply textArea style
        placeholder="Enter notification details..."
        placeholderTextColor="#666"
        value={notificationText}
        onChangeText={setNotificationText}
        multiline={true} // Allow multiline input
        textAlignVertical="top" // Start text at the top
      />

      <TouchableOpacity style={styles.sendButton} onPress={handleSendNotification}>
        <Text style={styles.sendButtonText}>Send Notification</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp ('4%'),
        paddingTop: hp ('2%'),
    },
    backButton: {
        width: wp ('10%'),
        height: hp ('4.5%'),
        borderRadius: 20,
        backgroundColor: '#00A600',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1, // Allow the title to take remaining space
    },
    input: {
    width: '100%',
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: width * 0.04,
  },
    textArea: {
    height: hp ('60%'), // Make the text area taller
  },
  sendButton: {
    width: '100%',
    paddingVertical: 15,
    marginVertical: 10,
    backgroundColor: '#00A600',
    borderRadius: 50,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
});
