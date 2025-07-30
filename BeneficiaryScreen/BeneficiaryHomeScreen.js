import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, BackHandler, Animated, Dimensions, Image, FlatList, Modal, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc, arrayUnion, onSnapshot, query, orderBy } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');

export default function BeneficiaryHome({ navigation }) {
  const [isProfileVisible, setProfileVisible] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedUserNames, setSelectedUserNames] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState(null); // New state for verification status
  const [emailAddress, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [birthDay, setBirthDay] = useState('');

  const [isEditModalVisible, setEditModalVisible] = useState(false); 
  const [profileImageUrl, setProfileImageUrl] = useState(null); // State to display profile image URL
  const [selectedImageUri, setSelectedImageUri] = useState(null); // State to store the selected image URI temporarily
  const scale = size => (width / 375) * size;
  const verticalScale = size => (height / 667) * size;

  
  const slideProfileAnim = useState(new Animated.Value(width))[0];
  const slideNotificationsAnim = useState(new Animated.Value(-width))[0];
  const toggleEditModal = () => setEditModalVisible(!isEditModalVisible);
  
  const currentUser = auth.currentUser; // Assuming the user is already authenticated

  const [searchBeneficiaryQuery, setSearchBeneficiaryQuery] = useState('');
const [filteredUserNames, setFilteredUserNames] = useState([]);

const handleSearchBeneficiaries = (query) => {
    setSearchBeneficiaryQuery(query);
    if (query.trim() === '') {
        setFilteredUserNames(selectedUserNames);
    } else {
        const filtered = selectedUserNames.filter((name) =>
            name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredUserNames(filtered);
    }
};

useEffect(() => {
  const fetchUserData = async () => {
    if (currentUser) {
      const db = getFirestore();
      const userDocRef = doc(db, 'pendingVerifications', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileImageUrl(userData.profileImageUrl || null); // Load the profile image URL or Base64 data
      } else {
        console.log("User data not found in Firestore.");
      }
    }
  };

  fetchUserData();
}, []);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "You need to grant permission to access the gallery!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri); // Temporarily store the selected image URI
    }
  };

  // Function to save the selected image URI to Firestore and display it
  const saveProfileImage = async () => {
  if (!selectedImageUri) {
    Alert.alert("No Image Selected", "Please select an image to upload.");
    return;
  }

  try {
    const db = getFirestore();
    const userDocRef = doc(db, 'pendingVerifications', currentUser.uid);

    // Optionally convert the image to Base64 if needed
    const response = await fetch(selectedImageUri);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result; // This is the Base64 string

      await updateDoc(userDocRef, { profileImageUrl: base64data });
      setProfileImageUrl(base64data); // Update state with the new Base64 image
      setSelectedImageUri(null); // Clear the selected image URI
      Alert.alert("Success", "Profile image updated successfully.");
      toggleEditModal();
    };
  } catch (error) {
    console.error("Error saving image URL to Firestore:", error);
    Alert.alert("Save Error", "Failed to save profile image.");
  }
};


useEffect(() => {
  const fetchNotifications = async () => {
    const db = getFirestore();
    const notificationsCollection = collection(db, 'notifications');

    try {
      const notificationsQuery = query(notificationsCollection, orderBy('timestamp', 'desc'));
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationsData = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter notifications to only include those for the current user or events they are selected for
      const userNotifications = notificationsData.filter(notification => {
        const isEventNotification = notification.notifiedUsers && notification.notifiedUsers.includes(currentUser.uid);
        const isAdminNotification = !notification.notifiedUsers; // Admin notifications may not have notifiedUsers
        return isEventNotification || isAdminNotification;
      });

      setNotifications(userNotifications);

      // Alert for unread notifications
      const unreadNotifications = userNotifications.filter(
        notification => !notification.readBy || !notification.readBy.includes(currentUser.uid)
      );

      if (unreadNotifications.length > 0) {
        Alert.alert(
          "New Notification",
          `You have ${unreadNotifications.length} unread notifications.`
        );
      } else {
        console.log("No unread notifications for the current user");
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to fetch notifications. Please try again later.');
    }
  };

  
  fetchNotifications();
}, [currentUser]);

useEffect(() => {
  const fetchUserData = async () => {
    if (currentUser) {
      const db = getFirestore();
      const userDocRef = doc(db, 'pendingVerifications', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const { firstName, middleName, lastName, emailAddress, phoneNumber, homeAddress, gender, birthDay } = userData;
        setFullName(`${firstName || ''} ${middleName || ''} ${lastName || ''}`);
        setEmail(emailAddress || 'N/A');
        setPhoneNumber(phoneNumber || 'N/A');
        setAddress(homeAddress || 'N/A');
        setGender(gender || 'N/A');
        setBirthDay(birthDay || 'N/A');
      } else {
        console.log('No such document!');
      }
    }
  };

const fetchEvents = async () => {
  try {
    const db = getFirestore();
    const eventCollection = collection(db, 'events');
    const eventSnapshot = await getDocs(eventCollection);
    const eventData = eventSnapshot.docs.map(doc => {
      const data = doc.data();
      if (data.date && data.date.seconds) {
        const date = new Date(data.date.seconds * 1000);
        data.date = date.toLocaleDateString();
      }
      return { id: doc.id, ...data };
    });

    setEvents(eventData);

    // Fetch the notifications for selected users
    eventData.forEach(event => {
      if (currentUser && event.selectedUsers && event.selectedUsers.includes(currentUser.uid)) {
        // Check if the user is selected for this event and not already notified
        const alreadyNotified = event.notifiedUsers && event.notifiedUsers.includes(currentUser.uid);

        if (!alreadyNotified) {
          // Show notification if the current user is selected but hasn't been notified
          Alert.alert(
            "Event Notification",
            `You have been selected for the event: ${event.title}`
          );

          // Update the event to include the current user in the notified list
          const eventRef = doc(db, 'events', event.id);
          updateDoc(eventRef, {
            notifiedUsers: arrayUnion(currentUser.uid),
          });

          // Add a notification to the notifications collection
          const notificationsCollection = collection(db, 'notifications');
          addDoc(notificationsCollection, {
            eventId: event.id,
            message: `You have been selected for the event: ${event.title}`,
            read: false,
            status: "Pending",
            timestamp: new Date().toISOString(),
            userId: currentUser.uid,
          });
        }
      }
    });
  } catch (error) {
    console.error('Error fetching events: ', error);
  }
};

  fetchUserData();
  fetchEvents();
}, []);

 const handleEventPress = (event) => {
  console.log("Selected Event:", event); // Debugging: Check the event data
  console.log("Selected Users:", event.selectedUsers); // Debugging: Check the selectedUsers array

  setSelectedEvent(event);
  setSelectedUserNames(event.selectedUsers || []); // Use the selectedUsers field directly
  setFilteredUserNames(event.selectedUsers || []); // Initialize filtered names for search
  setModalVisible(true);
};

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
    setSelectedUserNames([]); // Clear selected user names
  };

  const toggleProfile = () => {
    if (isProfileVisible) {
      Animated.timing(slideProfileAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setProfileVisible(false));
    } else {
      if (isNotificationsVisible) {
        Animated.timing(slideNotificationsAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setNotificationsVisible(false));
      }

      setProfileVisible(true);
      Animated.timing(slideProfileAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const toggleNotifications = () => {
    if (isNotificationsVisible) {
      Animated.timing(slideNotificationsAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setNotificationsVisible(false));
    } else {
      if (isProfileVisible) {
        Animated.timing(slideProfileAnim, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setProfileVisible(false));
      }

      setNotificationsVisible(true);
      Animated.timing(slideNotificationsAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const markAsRead = async (notificationId) => {
  const db = getFirestore();
  const notificationRef = doc(db, 'notifications', notificationId);

  try {
    await updateDoc(notificationRef, {
      readBy: arrayUnion(currentUser.uid)
    });

    // Update local state after marking as read
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, readBy: [...(notification.readBy || []), currentUser.uid] }
          : notification
      )
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

const renderNotification = ({ item }) => {
  const isRead = item.readBy && item.readBy.includes(currentUser.uid);
  const isEventNotification = item.eventId; // Event notifications will have an eventId
  const isAdminNotification = !item.eventId; // Admin notifications don't have an eventId

  const handleNotificationPress = async () => {
    if (isEventNotification) {
      const event = await fetchEventById(item.eventId);
      if (event) {
        handleEventPress(event); // Open the modal with the event details
      } else {
        Alert.alert('Error', 'Event details not found.');
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        handleNotificationPress(); // Perform your primary action
        markAsRead(item.id); // Mark the notification as read
      }}
    >
      <View
        style={[
          styles.notificationCard,
          isRead && styles.notificationCardRead, // Apply different styles if read
        ]}
      >
        <Text style={styles.notificationTitle}>{item.title}</Text>

        <Text style={styles.notificationText}>
          {isEventNotification ? item.message : item.text}
        </Text>

        {isRead && <Text style={styles.readText}>Read</Text>}
      </View>
    </TouchableOpacity>
  );
};


  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => {
            signOut(auth)
              .then(() => navigation.navigate('Landing'))
              .catch((error) => console.error("Logout error:", error.message));
          }
        }
      ],
      { cancelable: false }
    );
  };

  const handleBackPress = () => {
    return true; // Prevents the default action (going back)
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => backHandler.remove(); // Cleanup the event listener
  }, []);

  const fetchEventById = async (eventId) => {
  try {
    const db = getFirestore();
    const eventDocRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventDocRef);

    if (eventDoc.exists()) {
      const eventData = eventDoc.data();
      if (eventData.date && eventData.date.seconds) {
        const date = new Date(eventData.date.seconds * 1000);
        eventData.date = date.toLocaleDateString();
      }
      return { id: eventDoc.id, ...eventData };
    } else {
      console.error('Event not found');
      return null;
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
};

useEffect(() => {
  let unsubscribe;

  const fetchUserVerificationStatus = () => {
    if (currentUser) {
      const db = getFirestore();
      const userDocRef = doc(db, 'pendingVerifications', currentUser.uid);

      // Listen for real-time updates
      unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const status = userData.verificationStatus || 'Pending';

          setVerificationStatus(status);

          // Clear profile data if status is Declined
          if (status === 'Declined') {
            setFullName('');
            setEmail('N/A');
            setPhoneNumber('N/A');
            setAddress('N/A');
            setGender('N/A');
            setAge('N/A');
            setProfileImageUrl(null);
          }
        } else {
          console.log('User document does not exist');
          setVerificationStatus(null);
        }
      }, (error) => {
        console.error('Error fetching verification status:', error);
      });
    }
  };

  fetchUserVerificationStatus();

  // Cleanup listener on unmount
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [currentUser]);


  return (
    <View style={styles.container}>
      <Image source={require('../Logos/EGLogoNoName.png')} style={styles.logo} />

      <TouchableOpacity onPress={toggleNotifications} style={styles.bellIcon}>
        <Ionicons name="notifications-outline" size={32} color="black" />
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleProfile} style={styles.profileIcon}>
      {profileImageUrl ? (
          <Image source={{ uri: profileImageUrl }} style={styles.profileImagebutton} />
        ) : (
          <Ionicons name="person-circle-outline" size={32} color="black" />
        )}
      </TouchableOpacity>

      <FlatList style={styles.flatlist}
        data={events}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleEventPress(item)} style={styles.eventCard}>
            <Image source={{ uri: item.image }} style={styles.eventImage} />
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text>Date: {item.date}</Text>
            <Text>Location: {item.location}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.eventList}
      />

<Modal
    visible={isModalVisible}
    transparent={true}
    animationType="slide"
    onRequestClose={closeModal}
>
    <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>

            {/* Date Box */}
            <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>{selectedEvent?.date}</Text>
            </View>

            {/* Location Box */}
            <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{selectedEvent?.location}</Text>
            </View>

            {/* Details Box */}
            <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Details:</Text>
                <Text style={styles.infoValue}>{selectedEvent?.details}</Text>
            </View>

            {/* Search Bar */}
            <TextInput
                style={styles.searchBar}
                placeholder="Search Beneficiaries..."
                value={searchBeneficiaryQuery}
                onChangeText={handleSearchBeneficiaries}
            />

            {/* Selected Beneficiaries */}
            <View style={[styles.infoBox, { height: 150 }]}>
                <Text style={styles.infoLabel}>Selected Beneficiaries:</Text>
                <ScrollView style={styles.selectedUsersContainer}>
                    {filteredUserNames.length > 0 ? (
                        filteredUserNames.map((name, index) => (
                            <Text key={index} style={styles.selectedUserName}>
                                {name || 'YOU'}
                            </Text>
                        ))
                    ) : (
                        <Text style={styles.noUsersText}>No beneficiaries found.</Text>
                    )}
                </ScrollView>
            </View>

            <TouchableOpacity onPress={closeModal} style={styles.closeModalButton}>
                <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
        </View>
    </View>
</Modal>

      <Animated.View style={[styles.profileContainer, { transform: [{ translateX: slideProfileAnim }] }]}>

       <View style={styles.profileImageContainer}>
       <TouchableOpacity onPress={toggleEditModal} style={styles.editProfileButton}>
      {profileImageUrl ? (
  <Image
    source={
      profileImageUrl.startsWith('data:image/') // Check if it's Base64
        ? { uri: profileImageUrl }
        : { uri: profileImageUrl } // If it's a URL
    }
    style={styles.profileImage}
  />
) : (
  <Ionicons name="person-circle-outline" size={100} color="gray" />
)}

         </TouchableOpacity>
      </View>

        <Modal
          visible={isEditModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={toggleEditModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Picture</Text>

              {selectedImageUri ? (
              <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
            ) : (
              <TouchableOpacity onPress={pickImage} style={styles.uploadImageButton}>
                        <Ionicons name="person-circle-outline" size={100} color="gray" />
            </TouchableOpacity>
            )}

              <TouchableOpacity onPress={saveProfileImage} style={styles.saveModalButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleEditModal} style={styles.closeModalButton}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>

            </View>
          </View>
        </Modal>

         <Text style={styles.profileText}>
          {fullName ? (
            <Text style={styles.userName}>
              {fullName}
            </Text>
          ) : (
            <Text style={styles.userName}>Loading...</Text>
          )}
        </Text>

              <View style={styles.iconRow}>
  <TouchableOpacity onPress={() => navigation.navigate('QR')} style={styles.iconButton}>
    <Ionicons name="qr-code-outline" size={32} color="black" />
    <Text style={styles.iconLabel}>QR Code</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={() => navigation.navigate('BeneficiarySettings')} style={styles.iconButton}>
    <Ionicons name="settings-outline" size={32} color="black" />
    <Text style={styles.iconLabel}>Settings</Text>
  </TouchableOpacity>
</View>
                        
         <View style={styles.profileDetails}>
  {(verificationStatus === 'Verified') && (
    <>
      <Text style={styles.detailLabel}>-Email:------------------------------------------------------</Text>
      <Text style={styles.detailValue}>{emailAddress}</Text>
      <Text style={styles.detailLabel}>-Contact Number:---------------------------------------</Text>
      <Text style={styles.detailValue}>{phoneNumber}</Text>
      <Text style={styles.detailLabel}>-Address:---------------------------------------------------</Text>
      <Text style={styles.detailValue}>{address}</Text>
      <Text style={styles.detailLabel}>-Gender:----------------------------------------------------</Text>
      <Text style={styles.detailValue}>{gender}</Text>
      <Text style={styles.detailLabel}>-Date of Birth:------------------------------------------</Text>
      <Text style={styles.detailValue}>{birthDay}</Text>
    </>
  )}
</View>


        {verificationStatus === 'Pending' ? (
  <View style={styles.verifyAccountButton}>
    <Text style={[styles.verifyAccountButtonTextPending, { color: 'orange' }]}>Verification Pending</Text>
  </View>
) : verificationStatus === 'Verified' ? (
  <View style={styles.verifyAccountButton}>
    <Text style={[styles.verifyAccountButtonText, { color: 'green' }]}>Account Verified</Text>
  </View>
) : verificationStatus === 'Declined' ? (
  <View style={styles.verifyAccountButton}>
    <Text style={[styles.verifyAccountButtonText, { color: 'red' }]}>Account Declined</Text>
  </View>
) : null}

        <TouchableOpacity onPress={toggleProfile} style={styles.closeButton}>
          <Text style={styles.closeText}>X</Text>
        </TouchableOpacity>
        <Text style={styles.profiletitle}> Profile</Text>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Image source={require('../Icons/logouticon.png')} style={styles.logouticon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
      </Animated.View>

<Animated.View style={[styles.notificationsContainer, { transform: [{ translateX: slideNotificationsAnim }] }]}>
  <Text style={styles.notificationsText}>Notifications</Text>
  <TouchableOpacity onPress={toggleNotifications} style={styles.notificationCloseButton}>
    <Text style={styles.closeText}>X</Text>
  </TouchableOpacity>

  <FlatList
    data={notifications}
    keyExtractor={(item) => item.id}
    renderItem={renderNotification}
    contentContainerStyle={styles.notificationList}
    style={styles.notificationsDisplay}
  />
</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: wp ('12%'),
    height: hp ('5.6%'),
    marginTop: hp ('2%'),
    marginBottom: hp ('-7%'),
    alignSelf: 'center',
  },
  profileIcon: {
    position: 'absolute',
    top: hp ('5.5%'),
    right: wp ('5%'),
  },
    profileImagebutton: {
    width: wp ('8%'),
    height: hp ('4%'),
    borderRadius: wp ('10.5%'),
    borderWidth: wp ('0.5%'),
    borderColor: 'gray',
  },
  bellIcon: {
    position: 'absolute',
    top: hp ('5.6%'),
    left: wp ('5.6%'),
  },
  profileContainer: {
    position: 'absolute',
    top: hp ('0.1%'),
    right: wp ('1%'),
    width: wp ('68%'),
    height: hp ('105%'),
    backgroundColor: 'white',
    paddingTop: hp ('1%'),
    borderLeftWidth: wp ('0.3%'),
    borderLeftColor: '#000',
    justifyContent: 'flex-end',
  },
  closeButton: {
    position: 'absolute',
    bottom: hp ('93.5%'),
    right: wp ('58%'),
    padding: wp ('3%'),
    alignSelf: 'flex-end',
  },
  closeText: {
    fontSize: wp ('7%'),
  },
  profileText: {
    bottom: hp ('79%'),
    position: 'absolute',
    alignSelf: 'center',
    fontSize: wp ('4%'),
    fontWeight: 'bold',
    margin: wp ('1%'),
  },
  logoutButton: {
    position: 'absolute',
    bottom: hp ('5%'),
    right: wp ('20%'),
    padding: hp ('1%'),
    borderRadius: wp ('1%'),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: hp ('2.5%'),
  },
  logoutButtonText: {
    color: 'red',
    marginLeft: wp ('1%'),
    fontSize: wp ('6%'),
  },
  logouticon: {
    width: wp ('10%'),
    height: hp ('5%'),
    marginRight: wp ('1%'),
  },
  notificationsContainer: {
    position: 'absolute',
    top: hp ('0.1%'),
    left: wp ('1%'),
    width: wp ('68%'),
    height: hp ('105%'),
    backgroundColor: 'white',
    paddingTop: hp ('11.5%'),
    borderRightWidth: wp ('0.5%'),
    borderRightColor: '#000',
  },
  notificationsText: {
    fontSize: wp ('8%'),
    bottom: hp ('6%'),
  },
  notificationCloseButton: {
    position: 'absolute',
    paddingLeft: wp ('10%'),
    paddingRight: wp ('2%'),
    paddingBottom: hp ('10%'),
    alignSelf: 'flex-end',
    bottom: hp ('85%'),
  },
  flatlist: {
    width: wp ('90%'),
    marginTop: hp ('11%'),
  },
  eventList: {
    paddingBottom: hp ('1%'),
  },
  eventCard: {
    backgroundColor: '#FF7D05',
    borderRadius: wp ('3%'),
    padding: wp ('5%'),
    marginVertical: hp ('1%'),
    width:  wp ('90%'),
    elevation: hp ('0.5%'),
  },
  eventImage: {
    width: wp ('80%'),
    height: hp ('20%'),
    borderRadius: wp ('2%'),
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: wp ('5%'),
    fontWeight: 'bold',
    marginBottom: hp ('1%'),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  notificationsdisplay: {
    position: 'absolute',
    width: wp('68%'),
  },
  notificationList: {
     paddingBottom: hp('5%'),
     paddingHorizontal: wp('3%'),
  },
  notificationCard: {
    backgroundColor: '#f9f9f9', // Default color for unread notifications
    borderRadius: wp ('2%'),
    padding: wp ('2%'),
    marginVertical: hp ('1%'),
    elevation: hp ('0.5%'),
  },
  notificationCardRead: {
    backgroundColor: '#FF7D05', // Light green for read notifications
  },
  notificationTitle: {
    fontSize: wp ('4%'),
    fontWeight: 'bold',
  },
  notificationText: {
    fontSize: wp ('4%'),
    marginVertical: hp ('0.1%'),
  },

  readText: {
    color: '#f9f9f9',
    marginTop: hp ('0.5%'),
    fontWeight: 'bold',
  },
  verifyAccountButton: {
    position: 'absolute',
    left: wp ('18%'),
    bottom: hp ('75%'),
    marginTop: hp ('0.5%'),
    padding: wp ('2.5%'),
    borderRadius: 5,
    width: wp ('50%'),
    alignSelf: 'center',
  },
  verifyAccountButtonText: {
    color: 'blue',
    fontSize: wp ('4%'),
  },
  verifyAccountButtonTextPending: {
    right: wp ('3%'),
    color: 'blue',
    fontSize: wp ('4%'),
  },
  iconRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginTop: hp ('7%'),
  marginBottom: hp ('69%'),
  width:  wp ('60%'),
  alignSelf: 'center',
},
 profileDetails: {
  position: 'absolute',
  top: hp ('10%'),
  paddingHorizontal: wp ('2.8%'),
  marginTop: hp ('28%'),
},
detailLabel: {
  fontSize: wp ('3.3%'),
  color: 'gray',
  marginBottom: hp ('1%'),
},
detailValue: {
  fontSize: wp ('4%'),
  fontWeight: '500',
  marginBottom: hp ('1%'),
},

iconButton: {
  alignItems: 'center',
},

iconLabel: {
  fontSize: wp ('4%'),
  color: 'black',
  marginTop: hp ('0.1%'),
},
profiletitle: {
    position: 'absolute',
    left: wp ('20%'),
    bottom: hp ('93%'),
    fontSize: wp ('6%'),
    fontWeight: 'bold',
    margin: wp ('4%'),
},
profileImageContainer: {
    alignSelf: 'center',
  },
  profileImage: {
    width: wp ('25%'),
    height: hp ('11.5%'),
    borderRadius:  wp ('25%'),
    borderWidth:  wp ('0.5%'),
    borderColor: 'gray',
  },
    modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: wp ('85%'),
    backgroundColor: '#FFFFFF',
    borderRadius: wp ('2%'),
    padding: wp ('3%'),
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: wp ('5%'),
    fontWeight: 'bold',
    marginBottom: hp ('1%'),
  },
  previewImage: {
    width: wp ('25%'),
    height: hp ('11.5%'),
    borderRadius: wp ('100%'),
    borderWidth: wp ('0.5%'),
    borderColor: 'gray',
    marginBottom: hp ('1%'),
  },
  noImageText: {
    color: 'gray',
    marginBottom: hp ('1%'),
  },
  uploadImageButton: {
    padding: wp ('0.5%'),
    borderRadius: wp ('0.5%'),
    marginBottom: hp ('1%'),
  },
  closeModalButton: {
    position: 'absolute',
    top: hp ('1%'),
    right: wp ('1%'),
    borderRadius: wp ('1%'),
    padding: wp ('2%'),
  },
  closeModalText: {
    color: 'red',
    fontSize: wp ('4%'),
  },
  saveModalButton: {
    padding: wp ('2%'),
    backgroundColor: '#00A600',
    borderRadius: wp ('2%'),
    width: wp ('20%'),
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: wp ('4%'),
  },
infoBox: {
    backgroundColor: '#f9f9f9',
    padding: wp ('3%'),
    borderRadius: wp ('2%'),
    marginVertical: hp ('1%'),
    width: wp ('80%'),
    elevation: hp ('0.5%'),
},
infoLabel: {
    fontSize: wp ('4%'),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: hp ('1%'),
},
infoValue: {
    fontSize: wp ('3.5%'),
    color: '#555',
},
selectedUsersContainer: {
    flex: 1,
    marginTop: hp ('1%'),
},
selectedUserName: {
    fontSize:  wp ('3.5%'),
    color: '#333',
    marginBottom: hp ('1%'),
},
noUsersText: {
    fontSize: wp ('3.5%'),
    color: '#999',
},
searchBar: {
    height: hp ('5%'),
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: wp ('3.5%'),
    marginBottom: hp ('1%'),
    width: wp ('80%'),
},
});