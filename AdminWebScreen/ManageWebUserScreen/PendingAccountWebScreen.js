import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList, Alert, ScrollView, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');

// Icons for sidebar
const eventicon = require('../../Icons/eventicon.png');
const inventoryicon = require('../../Icons/inventoryicon.png');
const sendnotificationicon = require('../../Icons/sendnotificationicon.png');
const reporticon = require('../../Icons/reporticon.png');
const manageusericon = require('../../Icons/manageusericon.png');
const logouticon = require('../../Icons/logouticon.png');
const dashboardicon = require('../../Icons/dashboardicon.png');

export default function WebPendingAccount({ navigation }) {
    // Pending Account State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [pendingAccounts, setPendingAccounts] = useState([]);
    const db = getFirestore();

    // AdminWebHome State
    const [isNotificationsVisible, setNotificationsVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [newNotification, setNewNotification] = useState(false);
    const [manageUserDropdown, setManageUserDropdown] = useState(false);
    const [eventDropdown, setEventDropdown] = useState(false);

    // Fetch Pending Accounts
    useEffect(() => {
        const fetchPendingAccounts = async () => {
            try {
                const accountsRef = collection(db, 'pendingVerifications');
                const snapshot = await getDocs(accountsRef);
                const accounts = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(account => account.verificationStatus === 'Pending'); // Only keep pending accounts

                setPendingAccounts(accounts);
            } catch (error) {
                console.error('Error fetching pending accounts:', error);
                window.alert('Error', 'Failed to load pending accounts.');
            }
        };

        fetchPendingAccounts();
    }, []);

    // Fetch Notifications
    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
     try {
       // Fetch only verificationNotifications
       const verificationNotifications = await getDocs(collection(db, 'verificationNotifications'));
   
       // Process verificationNotifications data
       const verificationNotificationsData = verificationNotifications.docs.map((doc) => ({
         id: doc.id,
         type: 'Verification Pending',
         message: doc.data().message || 'No message provided',
         status: doc.data().status || 'No status provided',
         read: doc.data().read || false,
         submittedAt: doc.data().timestamp || 'No timestamp available',
       }));
   
       // Set notifications data
       setNotifications(verificationNotificationsData);
   
       // Check for new notifications
       const hasNewNotifications = verificationNotificationsData.some((n) => !n.read);
       setNewNotification(hasNewNotifications);
   
       // Alert if there are new notifications
       if (hasNewNotifications) {
         Alert.alert('You have new notifications. Check them now!');
       }
     } catch (error) {
       console.error('Error fetching notifications:', error);
       Alert.alert('Error', 'Failed to fetch notifications. Please try again later.');
     }
   };

    // Pending Account Functions
    const openImageModal = (imageUri) => {
        setSelectedImage(imageUri);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedImage('');
    };

    const handleVerify = async (accountId) => {
        try {
            const accountRef = doc(db, 'pendingVerifications', accountId);
            await updateDoc(accountRef, { verificationStatus: 'Verified' });

            setPendingAccounts(prevAccounts =>
                prevAccounts.filter(account => account.id !== accountId)
            );

            window.alert('Success', 'Account verified successfully.');
        } catch (error) {
            console.error('Error verifying account:', error);
            window.alert('Error', 'Failed to verify account.');
        }
    };

    const handleDecline = async (accountId) => {
        try {
            const accountRef = doc(db, 'pendingVerifications', accountId);
            await updateDoc(accountRef, { verificationStatus: 'Declined' });

            setPendingAccounts(prevAccounts =>
                prevAccounts.filter(account => account.id !== accountId)
            );

            window.alert('Success', 'Account declined successfully.');
        } catch (error) {
            console.error('Error declining account:', error);
            window.alert('Error', 'Failed to decline account.');
        }
    };

const handleMarkAsRead = async (notification) => {
      try {
        // Set the collection name to 'verificationNotifications'
        const collectionName = 'verificationNotifications';
    
        // Get the document reference
        const docRef = doc(db, collectionName, notification.id);
    
        // Update the document's 'read' status
        await updateDoc(docRef, { read: !notification.read });
    
        // Update the local state
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, read: !item.read } : item
          )
        );
    
        // Check if there are any unread notifications
        setNewNotification(notifications.some((n) => !n.read));
      } catch (error) {
        showAlert('Error', 'Failed to update notification status');
      }
    };


    const renderNotification = ({ item }) => (
    <View style={styles.notificationCard}>
      <Text style={styles.notificationTitle}>{item.type}</Text>
      {item.type === 'Verification Pending' && (
        <>
          <Text style={styles.notificationText}>Message: {item.message}</Text>
          <Text style={styles.notificationText}>Status: {item.status}</Text>
        </>
      )}
      <Text style={styles.notificationTimestamp}>
        Submitted at: {formatTimestamp(item.submittedAt)}
      </Text>
      <TouchableOpacity
        onPress={() => handleMarkAsRead(item)}
        style={styles.markAsReadButton}
      >
        <Text style={styles.markAsReadText}>
          {item.read ? 'Mark as Unread' : 'Mark as Read'}
        </Text>
      </TouchableOpacity>
    </View>
  );
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'No timestamp available';
        const date = timestamp.seconds
            ? new Date(timestamp.seconds * 1000)
            : new Date(timestamp);
        return date.toLocaleString();
    };

    const renderAccountItem = ({ item }) => (
<View style={styles.accountCard}>
  {/* Personal Information Section */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{item.firstName}'s Personal Information</Text>
    <View style={styles.infoRow}>
      <Text style={styles.label}>First Name:</Text>
      <Text style={styles.value}>{item.firstName}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>Middle Name:</Text>
      <Text style={styles.value}>{item.middleName}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>Last Name:</Text>
      <Text style={styles.value}>{item.lastName}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>Gender:</Text>
      <Text style={styles.value}>{item.gender}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>Home Address:</Text>
      <Text style={styles.value}>{item.homeAddress}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>Email Address:</Text>
      <Text style={styles.value}>{item.email}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>Phone Number:</Text>
      <Text style={styles.value}>{item.mobileNumber}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>Birth Day:</Text>
      <Text style={styles.value}>{item.birthDay}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>Place of Birth:</Text>
      <Text style={styles.value}>{item.placeOfBirth}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>Occupation:</Text>
      <Text style={styles.value}>{item.occupation}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>Civil Status:</Text>
      <Text style={styles.value}>{item.civilStatus}</Text>
    </View>
    <View style={styles.infoRow}>
      <Text style={styles.label}>ID Type:</Text>
      <Text style={styles.value}>{item.selectedIDType}</Text>
    </View>
  </View>

  {/* Verified ID Section */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Verified ID</Text>
    {item.verifiedID ? (
      <TouchableOpacity onPress={() => openImageModal(item.verifiedID)}>
        <Image source={{ uri: item.verifiedID }} style={styles.uploadedImage} />
      </TouchableOpacity>
    ) : (
      <Text style={styles.noImageText}>No ID Uploaded</Text>
    )}
  </View>

  {/* Barangay Clearance Section */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Barangay Clearance</Text>
    {item.barangayClearance ? (
      <TouchableOpacity onPress={() => openImageModal(item.barangayClearance)}>
        <Image source={{ uri: item.barangayClearance }} style={styles.uploadedImage} />
      </TouchableOpacity>
    ) : (
      <Text style={styles.noImageText}>No Barangay Clearance Uploaded</Text>
    )}
  </View>

  {/* Modal to display the image in full view */}
  <Modal visible={modalVisible} transparent={true} onRequestClose={closeModal}>
    <View style={styles.modalContainer}>
      <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
      <Image source={{ uri: selectedImage }} style={styles.modalImage} />
    </View>
  </Modal>

  {/* Action Buttons */}
  <View style={styles.buttonContainer}>
    <TouchableOpacity style={styles.verifyButton} onPress={() => handleVerify(item.id)}>
      <Text style={styles.verifyButtonText}>Verify</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.declineButton} onPress={() => handleDecline(item.id)}>
      <Text style={styles.declineButtonText}>Decline</Text>
    </TouchableOpacity>
  </View>
</View>
    );

    return (
        <View style={styles.container}>
            {/* Sidebar Navigation */}
            <View style={styles.sidebar}>
                <Image source={require('../../Logos/EGLogoNoName.png')} style={styles.logo} />
                <Text style={styles.logoName}>
                    <Text style={{ color: '#00A600' }}>Emergen</Text>
                    <Text style={{ color: '#FF7D05' }}>GOODS</Text>
                </Text>

                <View style={styles.navButtons}>
                    {/* Dashboard Button */}
                    <TouchableOpacity onPress={() => navigation.navigate('AdminWebHome')} style={styles.navButton}>
                        <Image source={dashboardicon} style={styles.icon} />
                        <Text style={styles.navButtonText}>Dashboard</Text>
                    </TouchableOpacity>

                    {/* Event Dropdown */}
                    <TouchableOpacity onPress={() => setEventDropdown(!eventDropdown)} style={styles.navButton}>
                        <Image source={eventicon} style={styles.icon} />
                        <Text style={styles.navButtonText}>Event</Text>
                        <Ionicons name={eventDropdown ? 'chevron-up' : 'chevron-down'} size={20} />
                    </TouchableOpacity>

                    {eventDropdown && (
                        <View style={styles.dropdownMenu}>
                            <TouchableOpacity onPress={() => navigation.navigate('WebCreateEvent')} style={styles.dropdownItem}>
                                <Text style={styles.dropdownText}>Create Event</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('WebEvent')} style={styles.dropdownItem}>
                                <Text style={styles.dropdownText}>View Events</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Other Navigation Buttons */}
                    {[
                        { name: 'Inventory', icon: inventoryicon, route: 'WebInventory' },
                        { name: 'Send Notification', icon: sendnotificationicon, route: 'WebSendNotification' },
                        { name: 'Report', icon: reporticon, route: 'WebReport' },
                    ].map((item, index) => (
                        <TouchableOpacity key={index} onPress={() => navigation.navigate(item.route)} style={styles.navButton}>
                            <Image source={item.icon} style={styles.icon} />
                            <Text style={styles.navButtonText}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}

                    {/* Pending Account Button */}
                    <TouchableOpacity
                      onPress={() => navigation.navigate('WebPendingAccount')}
                      style={styles.navButton}
                    >
                      <Image source={manageusericon} style={styles.icon} />
                      <Text style={styles.navButtonText}>Pending Account</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity onPress={() => navigation.navigate('WebSignIn')} style={styles.logoutButton}>
                    <Image source={logouticon} style={styles.logoutIcon} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Main Content Area */}
            <View style={styles.mainContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Pending Accounts</Text>
                    <TouchableOpacity onPress={() => setNotificationsVisible(!isNotificationsVisible)} style={styles.iconButton}>
                        <Ionicons name="notifications-outline" size={24} color={newNotification ? 'red' : 'black'} />
                    </TouchableOpacity>
                </View>

                {/* Notifications Dropdown */}
                {isNotificationsVisible && (
                    <View style={styles.notificationsDropdown}>
                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => item.id}
                            renderItem={renderNotification}
                            style={styles.notificationList}
                        />
                    </View>
                )}

                {/* Pending Accounts List */}
                <View style={styles.scrollableContainer}>
                <FlatList
  style={styles.list}
  data={pendingAccounts}
  keyExtractor={item => item.id}
  renderItem={renderAccountItem}
  numColumns={3} // Render in 2 columns
  contentContainerStyle={styles.listContainer}
  ListEmptyComponent={<Text style={styles.emptyText}>No pending accounts to verify.</Text>}
/>
                </View>
            </View>
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: wp('100%'),
    flexDirection: 'row',
  },
  sidebar: {
    width: wp ('18%'),
    backgroundColor: '#fff',
    padding: wp('2%'),
    borderRightWidth: wp('0.1%'),
    borderRightColor: '#ddd',
  },
  logo: {
    width: wp('2.5%'),
    height: hp('5%'),
    alignSelf: 'center',
  },
  logoName: {
    fontSize: wp('1%'),
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: hp('1%'),
  },
  navButtons: {
    marginTop: hp('2%'),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('0.1%'),
    marginBottom: hp('1.2%'),
  },
  icon: {
    width: wp('2%'),
    height: hp('4%'),
    marginRight: 10,
  },
  navButtonText: {
    fontSize: wp('1%'),
    fontWeight: 'bold',
    flex: 1,
  },
  dropdownMenu: {
    marginLeft: wp('1.7%'),
  },
  dropdownItem: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('1%'),
  },
  dropdownText: {
    fontSize: wp('0.9%'),
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('1%'),
    borderRadius: wp('1%'),
  },
  logoutIcon: {
    width: wp('2%'),
    height: hp('4%'),
    marginRight: wp('1%'),
  },
  logoutText: {
    fontSize: wp('1%'),
    fontWeight: 'bold',
    color: 'red',
  },
  mainContent: {
    flex: wp('100%'),
    backgroundColor: '#F4F6F8',
    padding: wp('1%'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.1%'),
    borderBottomWidth: wp('0.1%'),
    borderColor: '#ddd',
  },
    scrollableContainer: {
        maxHeight: 670, // Set a maximum height for scrollable content
        marginBottom: 15,
        borderColor: '#ccc',
        borderRadius: 5,
        overflow: 'hidden', // Ensure the scrolling area doesn't overflow
    },
    title: {
    fontSize: wp('1.5%'),
    fontWeight: 'bold',
    },
 iconButton: {
    padding: wp('1%'),
  },
notificationsDropdown: {
    position: 'absolute',
    top: hp('9%'),
    right: wp('0.1%'),
    width: wp('25%'),
    maxHeight: hp('90%'),
    backgroundColor: '#f8f8f8',
    padding: wp('1%'),
    shadowColor: '#000',
    shadowOpacity: wp('0.1%'),
    shadowRadius: wp('0.1%'),
    elevation: hp('0.1%'),
    zIndex: hp('1000%'),
    borderRadius: wp('1%'),
  },
  notificationList: {
    marginTop: hp('1%'),
  },
  notificationCard: {
    padding: wp('1%'),
    borderBottomWidth: wp('0.1%'),
    borderBottomColor: '#ddd',
  },
  notificationTitle: {
    fontSize: wp('1%'),
    fontWeight: 'bold',
  },
  notificationText: {
    fontSize: wp('0.9%'),
  },
  notificationTimestamp: {
    fontSize: wp('0.8%'),
    color: '#666',
  },
  markAsReadButton: {
    marginTop: hp('1%'),
    padding: wp('0.1%'),
    backgroundColor: '#ddd',
    borderRadius: wp('1%'),
  },
  markAsReadText: {
    fontSize: wp('0.9%'),
    fontWeight: 'bold',
  },
    listContainer: {
        paddingBottom: 30,
    },
   accountCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 12,
    width: '30%', // Reduced width for a more compact look
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  section: {
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  value: {
    fontSize: 15,
    fontWeight: '400',
    color: '#333',
  },
  uploadedImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginTop: 10,
    resizeMode: 'cover',
  },
  noImageText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '75%',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 5,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 16,
  },
  verifyButton: {
    flex: 1,
    backgroundColor: '#00A600',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#D32F2F',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
    emptyText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalImage: {
        width: '90%',
        height: '80%',
        resizeMode: 'contain',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 5,
        zIndex: 1,
    },
    closeButtonText: {
        color: '#000',
        fontWeight: 'bold',
    },
});