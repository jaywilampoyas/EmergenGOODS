import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Animated, FlatList, Alert, BackHandler, Modal, TextInput, ScrollView, ActivityIndicator} from 'react-native';
import { collection, getDocs, doc, setDoc, arrayUnion, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { sendOtpToBeneficiary } from '../VolunteerScreen/utils/otpService';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');
const logouticon = require('../Icons/logouticon.png');

export default function VolunteerHome({ navigation }) {
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [slideSettingsAnim] = useState(new Animated.Value(width));
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [beneficiarySearchQuery, setBeneficiarySearchQuery] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState([]);
  const [scannedUsers, setScannedUsers] = useState([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [volunteerName, setVolunteerName] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventCollection = collection(db, 'events');
        const eventSnapshot = await getDocs(eventCollection);
        const eventData = eventSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          scannedUsers: [],
        }));
        setEvents(eventData);
        setFilteredEvents(eventData);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    const fetchScannedUsers = async () => {
      try {
        const scannedUsersCollection = collection(db, 'scannedUsers');
        const scannedUsersSnapshot = await getDocs(scannedUsersCollection);
        const scannedData = scannedUsersSnapshot.docs.map(doc => doc.data());
        setScannedUsers(scannedData);
      } catch (error) {
        console.error("Error fetching scanned users:", error);
      }
    };

    fetchEvents();
    fetchScannedUsers();

    const backAction = () => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (mainSearchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event =>
        event.title.toLowerCase().includes(mainSearchQuery.toLowerCase()) ||
        event.details?.toLowerCase().includes(mainSearchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [mainSearchQuery, events]);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

const handleQrCodeScanned = async ({ type, data }) => {
  setScanned(true);
  setScannerModalVisible(false);

  const scannedUserId = data.trim().toLowerCase();

  if (!selectedEvent || !Array.isArray(selectedEvent.selectedUserIds)) {
    Alert.alert('Error', 'The event data is not properly loaded or structured.');
    return;
  }

  const userIndex = selectedEvent.selectedUserIds.findIndex(userId => {
    return userId.trim().toLowerCase() === scannedUserId;
  });

  if (userIndex === -1) {
    Alert.alert('Alert', 'This beneficiary is not part of this event!');
    return;
  }

  try {
    const userFullName = selectedEvent.selectedUsers[userIndex];
    const eventDocRef = doc(db, 'scannedUsers', selectedEvent.id);
    const eventDocSnap = await getDoc(eventDocRef);

    if (eventDocSnap.exists()) {
      const scannedUsersFirestore = eventDocSnap.data().users || [];
      const alreadyScannedFirestore = scannedUsersFirestore.some(user => {
        return user.userId.trim().toLowerCase() === scannedUserId;
      });

      if (alreadyScannedFirestore) {
        Alert.alert('Alert', 'This beneficiary has already been scanned!');
        return;
      }
    }

    const userItems = selectedEvent.selectedItems.map(item => ({
      itemId: item.itemId,
      name: item.name,
      quantity: item.quantity || 0,
      amount: item.amount || 0,
      type: item.type || 'item',
    }));

    const userData = {
      userId: scannedUserId,
      fullName: userFullName,
      items: userItems,
      timestamp: new Date(),
    };

    if (eventDocSnap.exists()) {
      await updateDoc(eventDocRef, {
        users: arrayUnion(userData),
      });
    } else {
      await setDoc(eventDocRef, {
        eventId: selectedEvent.id,
        users: [userData],
      });
    }

    // 🔥 **Update Inventory AND Amount in Firestore**
    for (const item of userItems) {
      const itemRef = doc(db, 'items', item.itemId);
      console.log(`Fetching item: ${item.itemId} - ${item.name}`);

      const itemDoc = await getDoc(itemRef);

      if (!itemDoc.exists()) {
        console.warn(`❌ Item ${item.itemId} does not exist in Firestore.`);
        continue;
      }

      const itemData = itemDoc.data();
      const currentQuantity = itemData.quantity || 0;
      const currentAmount = itemData.amount || 0;

      let updatedFields = {};

      if (currentQuantity > 0 && item.quantity > 0) {
        if (currentQuantity < item.quantity) {
          Alert.alert(
            'Error',
            `Not enough stock for: ${item.name}. Available: ${currentQuantity}, Required: ${item.quantity}`
          );
          continue; 
        }
        updatedFields.quantity = currentQuantity - item.quantity;
        console.log(`✅ Deducting stock for ${item.name}: ${currentQuantity} → ${updatedFields.quantity}`);
      }

      if (currentAmount > 0 && item.amount > 0) {
        if (currentAmount < item.amount) {
          Alert.alert(
            'Error',
            `Not enough funds for: ${item.name}. Available: ${currentAmount}, Required: ${item.amount}`
          );
          continue; 
        }
        updatedFields.amount = currentAmount - item.amount;
        console.log(`✅ Deducting money for ${item.name}: ${currentAmount} → ${updatedFields.amount}`);
      }

      if (Object.keys(updatedFields).length > 0) {
        await updateDoc(itemRef, updatedFields);
      }
    }

    // ✅ **Update Local State After Successful Deduction**
    setSelectedEvent(prevEvent => ({
      ...prevEvent,
      scannedUsers: [...(prevEvent.scannedUsers || []), userData],
    }));

    setScannedUsers(prev => [
      ...prev,
      {
        eventId: selectedEvent.id,
        ...userData,
      },
    ]);

    Alert.alert('Success', 'QR code has been scanned successfully!');
  } catch (error) {
    console.error('🚨 Error processing scanned data:', error);
    Alert.alert('Error', 'Failed to process scanned data.');
  }
};

  const handleOtpSubmit = async () => {
  if (otpCode.trim() === '') {
    Alert.alert('Error', 'Please enter the OTP.');
    return;
  }

  const isOtpValid = true; // Replace with actual OTP validation logic

  if (isOtpValid) {
    try {
      if (!selectedBeneficiary || !selectedBeneficiary.eventId || !selectedBeneficiary.phoneNumber) {
        Alert.alert('Error', 'Invalid beneficiary selected.');
        return;
      }

      const docRef = doc(db, 'scannedUsers', selectedBeneficiary.eventId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const scannedUsers = docSnap.data().users || [];
        const alreadyClaimed = scannedUsers.some(user => user.userId === selectedBeneficiary.phoneNumber);

        if (alreadyClaimed) {
          Alert.alert('Alert', 'This beneficiary has already claimed items for this event.');
          return;
        }
      }

      const claimedItems = selectedEvent.selectedItems.map(item => ({
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
        amount: item.amount,
        type: item.type || 'item', // Ensure the item has a "type" field
      }));

      const beneficiaryData = {
        userId: selectedBeneficiary.phoneNumber,
        fullName: selectedBeneficiary.name,
        eventId: selectedBeneficiary.eventId,
        timestamp: new Date(),
        claimedItems: claimedItems,
      };

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          users: arrayUnion(beneficiaryData),
        });
      } else {
        await setDoc(docRef, {
          eventId: selectedBeneficiary.eventId,
          users: [beneficiaryData],
        });
      }

      // Update the inventory or monetary donations in Firestore
      for (const item of claimedItems) {
        const itemRef = doc(db, 'items', item.itemId); // Ensure your Firestore has an 'items' collection
        console.log(`Attempting to fetch item with ID: ${item.itemId}`); // Debugging log
        const itemDoc = await getDoc(itemRef);

        if (itemDoc.exists()) {
          const currentQuantity = itemDoc.data().quantity || 0;
          const currentAmount = itemDoc.data().amount || 0;

          if (item.type === 'money') {
            // Decrease the monetary amount
            if (currentAmount < item.amount) {
              Alert.alert(
                'Error',
                `Not enough funds for: ${item.name}. Available: ${currentAmount}, Required: ${item.amount}`
              );
              continue; // Skip this item if funds are insufficient
            }

            const updatedAmount = currentAmount - item.amount;

            await updateDoc(itemRef, {
              amount: updatedAmount,
            });
            console.log(`Updated amount for item ${item.itemId}: ${updatedAmount}`);
          } else {
            // Decrease the quantity for physical items
            if (currentQuantity < item.quantity) {
              Alert.alert(
                'Error',
                `Not enough stock for: ${item.name}. Available: ${currentQuantity}, Required: ${item.quantity}`
              );
              continue; // Skip this item if stock is insufficient
            }

            const updatedQuantity = currentQuantity - item.quantity;

            await updateDoc(itemRef, {
              quantity: updatedQuantity,
            });
            console.log(`Updated quantity for item ${item.itemId}: ${updatedQuantity}`);
          }
        } else {
          console.warn(`Item with ID ${item.itemId} does not exist in the 'items' collection.`);
        }
      }

      Alert.alert('Success', 'Beneficiary has successfully claimed the item.');
      setOtpModalVisible(false);
      setOtpCode('');
    } catch (error) {
      console.error('Error storing beneficiary data or updating inventory:', error);
      Alert.alert('Error', 'Failed to store beneficiary data.');
    }
  } else {
    Alert.alert('Error', 'Invalid OTP. Please try again.');
  }
};

  const toggleSettings = () => {
    if (isSettingsVisible) {
      Animated.timing(slideSettingsAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setSettingsVisible(false));
    } else {
      setSettingsVisible(true);
      Animated.timing(slideSettingsAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => signOut(auth).then(() => navigation.navigate('Landing')) }
      ],
      { cancelable: false }
    );
  };

  const openModal = (event) => {
    setSelectedEvent(event);
    if (event.selectedUsers) {
      setFilteredBeneficiaries(
        event.selectedUsers.map(user => ({
          name: user,
          scanned: scannedUsers.some(scannedUser => scannedUser.eventId === event.id && scannedUser.userId === user),
        }))
      );
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
    setBeneficiarySearchQuery('');
    setFilteredBeneficiaries([]);
  };

  const openScannerModal = () => {
    setScannerModalVisible(true);
    setScanned(false);
  };

  const closeScannerModal = () => {
    setScannerModalVisible(false);
  };

  const handleBeneficiarySearch = (text) => {
    setBeneficiarySearchQuery(text);
    if (selectedEvent?.selectedUsers) {
      const filtered = selectedEvent.selectedUsers.filter(user =>
        user.toLowerCase().includes(text.toLowerCase())
      ).map(user => ({
        name: user,
        scanned: scannedUsers.some(scannedUser => scannedUser.eventId === selectedEvent.id && scannedUser.userId === user),
      }));
      setFilteredBeneficiaries(filtered);
    }
  };

  const handleSelectBeneficiary = (beneficiary) => {
    if (!selectedEvent) {
      Alert.alert('Error', 'No event is currently selected.');
      return;
    }

    if (!selectedEvent.selectedUserPhoneNumbers || selectedEvent.selectedUserPhoneNumbers.length === 0) {
      Alert.alert('Error', 'No phone numbers found for this event.');
      return;
    }

    const userIndex = selectedEvent.selectedUsers.findIndex(user => user === beneficiary.name);

    if (userIndex === -1 || userIndex >= selectedEvent.selectedUserPhoneNumbers.length) {
      Alert.alert('Error', 'The selected beneficiary does not have a matching phone number.');
      return;
    }

    const phoneNumber = selectedEvent.selectedUserPhoneNumbers[userIndex];

    const updatedBeneficiary = {
      ...beneficiary,
      phoneNumber: phoneNumber,
      eventId: selectedEvent.id
    };

    setSelectedBeneficiary(updatedBeneficiary);
  };

  const handleSendOtp = async () => {
    if (!selectedBeneficiary || !selectedBeneficiary.phoneNumber || !selectedBeneficiary.eventId) {
      Alert.alert('Error', 'Please select a valid beneficiary with a phone number and event ID.');
      return;
    }

    try {
      await sendOtpToBeneficiary(selectedBeneficiary.eventId, selectedBeneficiary.phoneNumber);
      Alert.alert(
        'OTP Sent',
        'An OTP has been sent to the selected beneficiary. Click "OK" to enter the OTP.',
        [
          {
            text: 'OK',
            onPress: () => {
              setOtpModalVisible(true);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send OTP.');
    }
  };

  const renderBeneficiaryItem = ({ item, index }) => (
    <TouchableOpacity
      key={index}
      onPress={() => handleSelectBeneficiary(item)}
      style={[
        styles.beneficiaryItem,
        selectedBeneficiary?.name === item.name ? { backgroundColor: 'lightblue' } : {},
        item.scanned ? { backgroundColor: 'lightgreen' } : {},
      ]}
    >
      <Text>{index + 1}</Text>
      <Text style={styles.beneficiaryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
  const fetchVolunteerName = async () => {
    try {
      // Get the current user's UID
      const userId = auth.currentUser.uid;
      if (!userId) {
        console.error('No user is logged in.');
        return;
      }

      // Fetch the volunteer document
      const volunteerDocRef = doc(db, 'volunteers', userId);
      const volunteerDoc = await getDoc(volunteerDocRef);

      if (volunteerDoc.exists()) {
        const volunteerData = volunteerDoc.data();
        setVolunteerName(volunteerData.fullName || 'Volunteer'); // Use "fullName" field
      } else {
        console.error('Volunteer document not found.');
      }
    } catch (error) {
      console.error('Error fetching volunteer name:', error);
    }
  };

  fetchVolunteerName();
}, []);

  return (
    <View style={styles.container}>
     <View style={styles.header}>
      <TouchableOpacity onPress={toggleSettings} style={styles.hamburgerButton}>
        <Text style={styles.SettingsOpen}>{isSettingsVisible ? '' : '☰'}</Text>
      </TouchableOpacity>
      <Image source={require('../Logos/EGLogoNoName.png')} style={styles.logo} />
      </View>

      <View style={styles.content}>

        <TextInput
          style={styles.searchBar}
          placeholder="Search events..."
          value={mainSearchQuery}
          onChangeText={setMainSearchQuery}
        />

        <FlatList
          style={styles.flatlist}
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openModal(item)} style={styles.eventCard}>
              {item.image && <Image source={{ uri: item.image }} style={styles.eventImage} />}
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventDate}>Date: {new Date(item.date.seconds * 1000).toLocaleDateString()}</Text>
              <Text style={styles.eventLocation}>Location: {item.location || 'N/A'}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.eventList}
        />
      </View>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.eventModalContent}>
            <TouchableOpacity onPress={closeModal} style={styles.closeModalButton}>
              <Ionicons name="close-outline" size={wp ('8%')} color="black" />
            </TouchableOpacity>
            <Text style={styles.eventModalTitle}>{selectedEvent?.title || 'Event'}</Text>

            <ScrollView style={styles.distributionDetailsContainer}>
              <Text style={styles.distributionDetailsText}>
                {selectedEvent?.details || 'No distribution details provided.'}
              </Text>
            </ScrollView>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={openScannerModal}>
                <Ionicons name="qr-code-outline" size={wp ('8%')} color="black" />
                <Text style={styles.actionButtonText}>Scan QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSendOtp}>
                <Ionicons name="mail-outline" size={wp ('8%')} color="black" />
                <Text style={styles.actionButtonText}>OTP</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.usersearchBar}
              placeholder="Search beneficiaries..."
              value={beneficiarySearchQuery}
              onChangeText={handleBeneficiarySearch}
            />

            <Text style={styles.beneficiariesTitle}>List of Beneficiaries:</Text>
            <ScrollView style={styles.beneficiariesList}>
              {filteredBeneficiaries && filteredBeneficiaries.length > 0 ? (
                filteredBeneficiaries.map((user, index) =>
                  renderBeneficiaryItem({ item: user, index })
                )
              ) : (
                <Text>No beneficiaries found</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={scannerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeScannerModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.scannerModalContent}>
            <TouchableOpacity onPress={closeScannerModal} style={styles.qrcloseModalButton}>
              <Text style={styles.qrcloseModalText}>Close Scanner</Text>
            </TouchableOpacity>
            {!scanned && (
              <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleQrCodeScanned}
                style={{ width: wp ('80%'), height: wp ('100%') }}
                barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={otpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.otpModalContent}>
            <Text style={styles.otpModalTitle}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleOtpSubmit}>
              <Text style={styles.submitButtonText}>Submit OTP</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

     <Animated.View style={[styles.settingsContainer, { transform: [{ translateX: slideSettingsAnim }] }]}>
  <TouchableOpacity onPress={toggleSettings} style={styles.closeButton}>
    <Text style={styles.SettingsClose}>X</Text>
  </TouchableOpacity>
  <Text style={styles.settingsText}>Settings</Text>
  <Text style={styles.volunteerName}>{volunteerName}</Text>
  <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
    <Image source={logouticon} style={styles.logouticon} />
    <Text style={styles.logoutText}>Logout</Text>
  </TouchableOpacity>
</Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp ('15%'),
        marginTop: hp ('-0.1%'),
    },
  logo: {
     position: 'absolute',
    top: hp ('-16%'),
    width: wp ('12%'),
    height: hp ('5.6%'),
    marginTop: hp ('20%'),
    marginBottom: hp ('-10%'),
    alignSelf: 'center',
  },
  content: {
    alignItems: 'center',
    width: wp ('100%'),
    paddingHorizontal: wp ('5%'),
  },
  searchBar: {
    borderColor: '#ccc',
    borderWidth: wp ('0.5%'),
    borderRadius: wp('3%'),
    padding: wp ('2%'),
    marginBottom: hp ('1%'),
    width: wp ('90%'),
  },
  flatlist: {
    width: wp ('90%'),
    marginTop: hp ('1%'),
  },
  eventList: {
    paddingBottom: hp ('20%'),
  },
  eventCard: {
    backgroundColor: '#FF7D05',
    borderRadius: wp('3%'),
    padding: wp ('2%'),
    marginVertical: hp ('2%'),
    width: wp ('90%'),
  },
  eventImage: {
    width: wp ('86%'),
    height:  hp ('20%'),
    borderRadius: wp('3%'),
    marginBottom: hp ('1%'),
  },
  eventTitle: {
    fontSize: wp ('5%'),
    fontWeight: 'bold',
    marginBottom: hp ('1%'),
  },
  eventLocation: {
    fontSize: wp ('3.5%'),
    color: '#333',
    marginBottom: hp ('1%'),
  },
  hamburgerButton: {
    position: 'absolute',
    top: hp ('3.5%'),
    left: hp ('18%'),
  },
  SettingsOpen: {
    fontSize: wp ('10%'),
    color: 'black',
  },
  settingsContainer: {
    position: 'absolute',
    top: hp ('0%'),
    left: wp ('25%'),
    width: wp ('75%'),
    height: hp ('110%'),
    backgroundColor: 'white',
    paddingTop: hp ('7%'),
    borderLeftWidth: wp ('0.5%'),
    borderLeftColor: '#000',
  },
  closeButton: {
    padding: wp ('1%'),
    alignSelf: 'flex-end',
    bottom: hp ('3.3%'),
    right: wp ('65%'),
  },
  SettingsClose: {
    fontSize: wp ('8%'),
    color: 'black',
  },
  settingsText: {
    position: 'absolute',
    top: hp ('2%'),
    left: wp ('20%'),
    fontSize: wp ('8%'),
    fontWeight: 'bold',
    margin: wp ('4.5%'),
   
  },
  logoutButton: {
    position: 'absolute',
    top: hp ('90%'),
    left: wp ('20%'),
    padding: hp ('1%'),
    borderRadius: wp ('20%'),
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: hp ('1%'),
  },
  logoutText: {
    color: 'red',
    marginLeft: wp ('1%'),
    fontSize: wp ('7%'),
  },
  logouticon: {
    width: wp ('10%'),
    height: hp ('5%'),
    marginRight: wp ('1%'),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  eventModalContent: {
    width: wp ('90%'),
    backgroundColor: 'white',
    padding: wp ('5%'),
    borderRadius: wp ('5%'),
    alignItems: 'center',
  },
  closeModalButton: {
    alignSelf: 'flex-end',
  },
  qrcloseModalButton: {
    paddingBottom: hp ('1%'),
    alignSelf: 'flex-end',
  },
  qrcloseModalText: {
    fontSize: wp ('5%'),
    color: 'red',
  },
  eventModalTitle: {
    fontSize: wp ('8%'),
    fontWeight: 'bold',
    marginBottom:  hp ('2%'),
  },
  distributionDetailsContainer: {
    width: wp ('80%'),
    height: hp ('20%'),
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: hp ('2%'),
    padding:  wp ('10%'),
  },
  distributionDetailsText: {
    color: '#000',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width:  wp ('100%'),
    marginBottom: hp ('2%'),
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonText: {
    marginTop: hp ('1%'),
    fontSize: wp ('3%'),
  },
  usersearchBar: {
    borderColor: '#ccc',
    borderWidth:  wp ('0.3%'),
    borderRadius: wp ('2%'),
    padding: wp ('2%'),
    marginBottom: hp ('2%'),
    width: wp ('80%'),
    alignSelf: 'center',
  },
  beneficiariesTitle: {
    fontWeight: 'bold',
    marginBottom: hp ('1%'),
    alignSelf: 'flex-start',
  },
  beneficiariesList: {
    width: wp ('80%'),
    height: hp ('20%'),
    borderWidth: wp ('0.3%'),
    borderColor: '#ccc',
    padding: 5,
  },
  beneficiaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: wp ('0.3%'),
    borderBottomColor: '#eee',
    paddingVertical:hp ('1%'),
  },
  beneficiaryName: {
    marginLeft: wp ('10%'),
  },
  scannerModalContent: {
    width: wp ('90%'),
    backgroundColor: 'white',
    padding: wp ('10%'),
    borderRadius: wp ('5%'),
    alignItems: 'center',
  },
   otpModalContent: {
    backgroundColor: 'white',
    padding: wp ('5%'),
    borderRadius: wp ('5%'),
    alignItems: 'center',
    width:  wp ('60%'),
  },
  otpModalTitle: {
    fontSize: wp ('5%'),
    fontWeight: 'bold',
    marginBottom: hp ('1%'),
  },
  input: {
    borderWidth: wp ('0.3%'),
    borderColor: '#ccc',
    borderRadius: wp ('0.3%'),
    padding: wp ('2%'),
    marginBottom: hp ('2%'),
    width: wp ('50%'),
  },
  submitButton: {
    backgroundColor: '#00A600',
    padding: wp ('5%'),
    borderRadius: wp ('2%'),
    alignItems: 'center',
    width: wp ('50%'),
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  volunteerName: {
  fontSize: wp ('10%'),
  fontWeight: 'bold',
  textAlign: 'center',
  color: '#333',
},
});
