import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, Image, ScrollView } from 'react-native';
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const db = getFirestore();

const logouticon = require('../../Icons/logouticon.png');

export default function WebManageBeneficiary({ navigation }) {
    // Beneficiary Management State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // AdminWebHome State
    const [isNotificationsVisible, setNotificationsVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [newNotification, setNewNotification] = useState(false);
    const [manageUserDropdown, setManageUserDropdown] = useState(false);
    const [eventDropdown, setEventDropdown] = useState(false);

    // Fetch Beneficiaries
    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users: ", error);
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
    // Beneficiary Management Functions
    const handleResetPasswordEmail = async (email) => {
        if (!email) {
            window.alert("Error", "Email address is required.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            window.alert("Success", `Password reset email sent to ${email}`);
        } catch (error) {
            let errorMessage = "Failed to send password reset email.";
            if (error.code === 'auth/user-not-found') {
                errorMessage = "No user found with this email address.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address.";
            }
            window.alert("Error", errorMessage);
        }
    };

    const handleEditUser = (user) => {
        setFirstName(user.firstName);
        setMiddleName(user.middleName);
        setLastName(user.lastName);
        setEmail(user.email);
        setEditingUser(user.id);
        setModalVisible(true);
    };

    const updateUser = async () => {
        if (!editingUser) return;

        try {
            const userRef = doc(db, 'users', editingUser);
            await updateDoc(userRef, {
                firstName,
                middleName,
                lastName,
                email,
            });
            window.alert("Success", "Beneficiary updated successfully!");
            setModalVisible(false);
            fetchUsers();
        } catch (error) {
            window.alert("Error", error.message);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Notification Functions
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

    const filteredUsers = users.filter(user =>
  user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>Manage Beneficiaries</Text>
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

                <TextInput
  style={styles.searchBar}
  placeholder="Search by name or email..."
  value={searchQuery}
  onChangeText={setSearchQuery}
/>

                {/* Beneficiary List */}
                {loading ? (
                    <ActivityIndicator size="large" color="#00A600" style={styles.loader} />
                ) : (
                    <View style={styles.scrollableContainer}>
<FlatList
  style={styles.listContainer}
  data={filteredUsers} // Use the filtered list
  keyExtractor={(item) => item.id}
  numColumns={3}
  renderItem={({ item }) => (
    <View style={styles.userCard}>
      {/* User Information */}
      <View style={styles.userInfoContainer}>
        <Text style={styles.userName}>
          {item.firstName} {item.middleName} {item.lastName}
        </Text>
        <Text style={styles.userEmail}>Email: {item.email}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.resetPasswordButton]}
          onPress={() => handleResetPasswordEmail(item.email)}
        >
          <Icon name="mail-outline" size={16} color="#00A600" />
          <Text style={styles.actionText}>Reset Password</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditUser(item)}
        >
          <Icon name="pencil-outline" size={16} color="#FF4D4D" />
          <Text style={styles.editactionText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
/>
</View>
                )}

                {/* Edit Beneficiary Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Edit Beneficiary</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="First Name"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Middle Name"
                                value={middleName}
                                onChangeText={setMiddleName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Last Name"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                            />
                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.saveButton} onPress={updateUser}>
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
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
        maxHeight: hp('80%'), // Set a maximum height for scrollable content
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
    headerContainer: {
flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.1%'),
    borderBottomWidth: wp('0.1%'),
    borderColor: '#ddd',
    },
    header: {
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
        paddingTop: 10,
    },
    userCard: {
        backgroundColor: '#fff',
        width: wp('25%'),
        padding: 16,
        borderRadius: 8,
        marginBottom: 15,
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 14,
        color: '#555',
        marginBottom: 10,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        borderRadius: 5,
        borderColor: '#00A600',
        borderWidth: 1,
        backgroundColor: '#F9FAFB',
    },
    actionText: {
        marginLeft: 5,
        fontSize: 14,
        color: '#00A600',
    },
    editactionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 5,
        borderColor: '#FF4D4D',
        borderWidth: 1,
        backgroundColor: '#F9FAFB',
    },
    editactionText: {
        marginLeft: 5,
        fontSize: 14,
        color: '#FF4D4D',
    },
    modalOverlay: {
        flex: 1,
    },
    modalContainer: {
        top: hp('30%'),
        left: wp('42%'),
        width: wp('30%'),
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    saveButton: {
        backgroundColor: '#00A600',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#ff4d4d',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
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