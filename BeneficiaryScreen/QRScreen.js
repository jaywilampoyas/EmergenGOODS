import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import { auth, db } from '../firebase';
import { doc, getDoc } from "firebase/firestore";
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');

export default function QR({ navigation }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [userName, setUserName] = useState(null);
  const qrContainerRef = useRef(); // Reference to capture qrContainer

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, 'pendingVerifications', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();

            // Check the verification status and only set QR data if approved
            if (userData.verificationStatus === 'Pending' || userData.verificationStatus === 'Declined') {
              setQrData(null);
              Alert.alert("Notice", "Your verification status is Pending or Declined. No QR code available.");
            } else {
              setQrData(user.uid);
            }

            if (userData.profileImageUrl) {
              setProfileImageUrl(userData.profileImageUrl);
            }
            const fullName = `${userData.firstName || ''} ${userData.middleName || ''} ${userData.lastName || ''}`;
            setUserName(fullName.trim());
          } else {
            console.error("User document does not exist");
            setQrData(null);
            Alert.alert("Notice", "You are not verified yet. No QR code available.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.error("No user is currently logged in");
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const downloadQRCode = async () => {
    if (!qrData) {
      Alert.alert('No QR Code', 'There is no QR code to download.');
      return;
    }

    try {
      // Request permission to save the image to the gallery
      const { granted } = await MediaLibrary.requestPermissionsAsync();

      if (!granted) {
        Alert.alert('Permission Denied', 'Permission to save images to the gallery was denied.');
        return;
      }

      // Ensure the qrContainerRef is valid
      if (qrContainerRef.current) {
        // Capture the qrContainer view
        const uri = await captureRef(qrContainerRef, {
          format: 'png',
          quality: 1,
        });

        // Save the image to the default gallery
        await MediaLibrary.createAssetAsync(uri);
        Alert.alert('Success', 'QR code saved to your phone gallery!');
      } else {
        Alert.alert('Error', 'Failed to capture the QR code. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      Alert.alert('Error', 'An error occurred while trying to save the QR code.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>QR Code</Text>
      </View>

      <View style={styles.backgroundContainer} ref={qrContainerRef}>
        <View style={styles.qrContainer}>
          {profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
          ) : (
            <Icon name="person-circle-outline" size={100} color="gray" />
          )}

          {userName && (
            <Text style={styles.userNameText}>{userName}</Text>
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#FF7D05" />
          ) : qrData ? (
            <QRCode
              value={qrData}
              size={200}
              backgroundColor="white"
              color="black"
            />
          ) : (
            <Text style={styles.errorText}>No QR data available</Text>
          )}

          {qrData && <Text style={styles.qrDataText}>User ID: {qrData}</Text>}
        </View>
      </View>

      <TouchableOpacity style={styles.downloadButton} onPress={downloadQRCode}>
        <Icon name="download-outline" size={50} color="black" style={styles.downloadIcon} />
        <Text style={styles.downloadButtonText}>Download</Text>
      </TouchableOpacity>

      <View style={styles.profileback}>
        <TouchableOpacity style={styles.profilebackButton} onPress={() => navigation.goBack()}>
          <Icon name="person-circle-outline" size={60} color="black" style={styles.profilebackIcon} />
        </TouchableOpacity>
        <Text style={styles.profilebackText}>Profile</Text>
      </View>
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
    marginBottom: hp('4%'),
    paddingTop: hp('2%'),
  },
  backButton: {
    width: wp('10%'),
    height: hp('4.5%'),
    borderRadius: 20,
    backgroundColor: '#00A600',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    position: 'absolute',
    top: hp('2.5%'),
    left: wp('35%'),
    fontSize: wp('6%'),
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  backgroundContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    padding: 20,
  },
  qrText: {
    fontSize: 18,
    marginBottom: 20,
  },
  qrDataText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'black',
  },
  userNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 30,
  },
  downloadButton: {
    bottom: 40,
    left: 30,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  downloadIcon: {
    marginRight: 8,
  },
  downloadButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    top: 30,
    left: -75,
  },
  profileback: {
    bottom: 125,
    left: 50,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  profilebackIcon: {
    marginRight: 8,
  },
  profilebackText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    top: 65,
    left: -67,
  },
});
