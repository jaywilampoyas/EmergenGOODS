import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, Image, ScrollView } from 'react-native';
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons'; // Import Ionicons for icons
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const db = getFirestore();


const logouticon = require('../../Icons/logouticon.png');


export default function WebManageVolunteer({ navigation }) {
    // Volunteer Management State
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingVolunteer, setEditingVolunteer] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // AdminWebHome State
    const [isNotificationsVisible, setNotificationsVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [newNotification, setNewNotification] = useState(false);
    const [manageUserDropdown, setManageUserDropdown] = useState(false);
    const [eventDropdown, setEventDropdown] = useState(false);

    // Fetch Volunteers
    const fetchVolunteers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'volunteers'));
            const volunteerList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVolunteers(volunteerList);
        } catch (error) {
            console.error("Error fetching volunteers: ", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Notifications
    useEffect(() => {
        fetchNotifications();
    }, []);

     const fetchNotifications = async () => {
    try {
      const [accountHackedReports, bugReports] = await Promise.all([
        getDocs(collection(db, 'accountHackedReports')),
        getDocs(collection(db, 'bugReports')),
      ]);

      const hackedReportsData = accountHackedReports.docs.map((doc) => ({
        id: doc.id,
        type: 'Account Hacked',
        fullName: doc.data().fullName || 'No name provided',
        email: doc.data().email || 'No email provided',
        password: doc.data().password || 'No password provided',
        read: doc.data().read || false,
        submittedAt: doc.data().submittedAt || 'No timestamp available',
      }));

      const bugReportsData = bugReports.docs.map((doc) => ({
        id: doc.id,
        type: 'Bug Report',
        details: doc.data().details || 'No details provided',
        read: doc.data().read || false,
        submittedAt: doc.data().submittedAt || 'No timestamp available',
      }));

      const notificationsData = [
        ...hackedReportsData,
        ...bugReportsData,
      ];

      setNotifications(notificationsData);

      const hasNewNotifications = notificationsData.some((n) => !n.read);
      setNewNotification(hasNewNotifications);

      if (hasNewNotifications) {
        window.alert('You have new notifications. Check them now!');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      window.alert('Error: Failed to fetch notifications. Please try again later.');
    }
  };

    // Volunteer Management Functions
    const handleDeleteVolunteer = async (volunteerId) => {
        window.alert(
            "Confirm Deletion",
            "Are you sure you want to delete this volunteer?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: async () => {
                        await deleteDoc(doc(db, 'volunteers', volunteerId));
                        fetchVolunteers();
                    }
                },
            ]
        );
    };

    const handleEditVolunteer = (volunteer) => {
        setFullName(volunteer.fullName);
        setEmail(volunteer.email);
        setEditingVolunteer(volunteer.id);
        setPassword('');
        setModalVisible(true);
    };

    const updateVolunteer = async () => {
        if (!editingVolunteer) return;

        try {
            const volunteerRef = doc(db, 'volunteers', editingVolunteer);
            await updateDoc(volunteerRef, {
                fullName,
                email,
            });
            window.alert("Success", "Volunteer updated successfully!");
            setModalVisible(false);
            fetchVolunteers();
        } catch (error) {
            console.error("Error updating volunteer: ", error);
            window.alert("Error", error.message);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prevState => !prevState);
    };

    useEffect(() => {
        fetchVolunteers();
    }, []);
const handleMarkAsRead = async (notification) => {
  try {
    const collectionName =
      notification.type === 'Account Hacked'
        ? 'accountHackedReports'
        : 'bugReports'; // Removed 'verificationNotifications'

    const docRef = doc(db, collectionName, notification.id);
    await updateDoc(docRef, { read: !notification.read });

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, read: !item.read } : item
      )
    );

    setNewNotification(notifications.some((n) => !n.read));
  } catch (error) {
    showAlert('Error', 'Failed to update notification status');
  }
};

    const renderNotification = ({ item }) => (
         <View style={styles.notificationCard}>
           <Text style={styles.notificationTitle}>{item.type}</Text>
           {item.type === 'Account Hacked' && (
             <>
               <Text style={styles.notificationText}>Full Name: {item.fullName}</Text>
               <Text style={styles.notificationText}>Email: {item.email}</Text>
               <Text style={styles.notificationText}>Password: {item.password}</Text>
             </>
           )}
           {item.type === 'Bug Report' && (
             <Text style={styles.notificationText}>Details: {item.details}</Text>
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

    const filteredVolunteers = volunteers.filter(volunteer =>
  volunteer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  volunteer.email.toLowerCase().includes(searchQuery.toLowerCase())
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

                            <View style={styles.menuContainer}>
                            {/* Super Admin Dashboard Button */}
                              <TouchableOpacity
                                onPress={() => navigation.navigate('SuperAdmin')} // Update the route as needed
                                style={styles.menuItem}
                              >
                                <Ionicons name="grid-outline" size={24} color="#333" style={styles.icon} />
                                <Text style={styles.menuText}>Super Admin Dashboard</Text>
                              </TouchableOpacity>
                
                {/* Create Admin Button */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate('CreateAdmin')} // Update the route as needed
                    style={styles.menuItem}
                  >
                    <Ionicons name="person-add-outline" size={24} color="#333" style={styles.icon} />
                    <Text style={styles.menuText}>Create Admin</Text>
                  </TouchableOpacity>
                
                  {/* Manage Admin Button */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ManageAdmin')} // Update the route as needed
                    style={styles.menuItem}
                  >
                    <Ionicons name="people-outline" size={24} color="#333" style={styles.icon} />
                    <Text style={styles.menuText}>Manage Admin</Text>
                  </TouchableOpacity>
                
                  {/* Other menu items */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate('WebVolunteerAccount')}
                    style={styles.menuItem}
                  >
                    <Ionicons name="person-outline" size={24} color="#333" style={styles.icon} />
                    <Text style={styles.menuText}>Create Volunteer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('WebManageVolunteer')}
                    style={styles.menuItem}
                  >
                    <Ionicons name="people-sharp" size={24} color="#333" style={styles.icon} />
                    <Text style={styles.menuText}>Manage Volunteer</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => navigation.navigate('WebManageBeneficiary')}
                    style={styles.menuItem}
                  >
                    <Ionicons name="people-circle-outline" size={24} color="#333" style={styles.icon} />
                    <Text style={styles.menuText}>Manage Beneficiary</Text>
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
                    <Text style={styles.title}>Manage Volunteers</Text>
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

                {/* Search Bar */}
  <TextInput
    style={styles.searchBar}
    placeholder="Search by name or email..."
    value={searchQuery}
    onChangeText={setSearchQuery}
  />


                {/* Volunteer List */}
                {loading ? (
                    <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
                ) : (
                    <View style={styles.scrollableContainer}>
  <FlatList
  style={styles.listContainer}
  data={filteredVolunteers} // Use the filtered list
  numColumns={5} // Render in 2 columns
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={styles.userCard}>
      {/* User Information */}
      <View style={styles.userInfoContainer}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userEmail}>Email: {item.email}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditVolunteer(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteVolunteer(item.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
  contentContainerStyle={{ paddingBottom: 20 }}
/>
</View>
                )}

                {/* Edit Volunteer Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Edit Volunteer</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                        />
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="New Password (optional)"
                                value={password}
                                secureTextEntry={!showPassword}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={togglePasswordVisibility}>
                                <Icon name={showPassword ? 'eye' : 'eye-off'} size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.saveButton} onPress={updateVolunteer}>
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </View>
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
    container: {
    flex: wp('100%'),
    flexDirection: 'row',
        backgroundColor: '#F4F6F8',
    },
    scrollableContainer: {
        maxHeight: 670, // Set a maximum height for scrollable content
        marginBottom: 15,
        borderColor: '#ccc',
        borderRadius: 5,
        overflow: 'hidden', // Ensure the scrolling area doesn't overflow
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
  menuContainer: {
    flexDirection: 'column', // Stack items vertically
    padding: 10, // Add some padding
  },
  menuItem: {
    flexDirection: 'row', // Align icon and text horizontally
    alignItems: 'center', // Center items vertically
    paddingVertical: 12, // Vertical padding
    paddingHorizontal: 10, // Horizontal padding
    borderBottomColor: '#ddd', // Border color
  },
  icon: {
    marginRight: 10, // Space between icon and text
  },
  menuText: {
    fontSize: 16, // Font size
    color: '#333', // Text color
    fontWeight: 'bold', // Bold text
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
  iconButton: {
    padding: wp('1%'),
  },
    title: {
    fontSize: wp('1.5%'),
    fontWeight: 'bold',
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
  scrollableContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16, // Add horizontal padding
    paddingVertical: 16, // Add vertical padding
  },
  listContainer: {
    width: '100%',
  },
  userCard: {
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android
  },
  userInfoContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8, // Space between buttons
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50', // Green color for edit
  },
  deleteButton: {
    backgroundColor: '#F44336', // Red color for delete
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
    modalContainer: {
        top: hp('25%'),
        left: wp('20%'),
        backgroundColor: '#FFFFFF',
        padding: wp('1%'),
        borderRadius: 10,
        marginHorizontal: '20%',
        width: wp('40%'),
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
    },
    saveButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        width: '100%',
        padding: 15,
        backgroundColor: '#F44336',
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    searchBar: {
  marginHorizontal: 16,
  marginVertical: 8,
  padding: 8,
  backgroundColor: '#fff',
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#ddd',
  fontSize: 14,
},
loader: {
    top: hp('40%'),
},
});