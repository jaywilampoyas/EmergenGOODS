import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
} from 'react-native';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { getAuth, updateEmail, updatePassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const logouticon = require('../Icons/logouticon.png');

export default function ManageAdmin({ navigation }) {
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState([]); // Added for admin management
  const [editingAdmin, setEditingAdmin] = useState(null); // Added for admin management
  const [newEmail, setNewEmail] = useState(''); // Added for admin management
  const [newPassword, setNewPassword] = useState(''); // Added for admin management
  const [searchQuery, setSearchQuery] = useState(''); // Added for search functionality

  // Fetch admin accounts and notifications
  useEffect(() => {
    fetchAdminAccounts(); // Added for admin management
    fetchNotifications();
  }, []);

  // Fetch admin accounts from Firestore
  const fetchAdminAccounts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'adminAccounts'));
      const accounts = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAdminAccounts(accounts);
    } catch (error) {
      console.error('Error fetching admin accounts:', error);
      Alert.alert('Error', 'Failed to fetch admin accounts. Please try again later.');
    }
  };

  // Filter admin accounts based on search query
  const filteredAdminAccounts = adminAccounts.filter(admin =>
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle edit button click
  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setNewEmail(admin.email);
    setNewPassword('');
  };

  // Handle delete button click
  const handleDelete = async (adminId) => {
    try {
      await deleteDoc(doc(db, 'adminAccounts', adminId));
      setAdminAccounts(adminAccounts.filter((admin) => admin.id !== adminId));
      Alert.alert('Success', 'Admin account deleted successfully.');
    } catch (error) {
      console.error('Error deleting admin account:', error);
      Alert.alert('Error', 'Failed to delete admin account. Please try again later.');
    }
  };

  // Handle confirm edit button click
  const handleConfirmEdit = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      // Update email in Firebase Authentication
      await updateEmail(user, newEmail);

      // Update password in Firebase Authentication (if provided)
      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      // Update email in Firestore
      await updateDoc(doc(db, 'adminAccounts', editingAdmin.id), { email: newEmail });

      // Update local state
      setAdminAccounts(
        adminAccounts.map((admin) =>
          admin.id === editingAdmin.id ? { ...admin, email: newEmail } : admin
        )
      );

      // Reset editing state
      setEditingAdmin(null);
      setNewEmail('');
      setNewPassword('');
      Alert.alert('Success', 'Admin account updated successfully.');
    } catch (error) {
      console.error('Error updating admin account:', error);
      Alert.alert('Error', 'Failed to update admin account. Please try again later.');
    }
  };

  // Render each admin account in a grid
  const renderAdminAccount = ({ item }) => (
    <View style={styles.adminCard}>
      <Text style={styles.adminEmail}>{item.email}</Text>
      <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
        <Text style={styles.buttonText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  // Your existing functions and code below...
  const toggleNotifications = () => {
    setNotificationsVisible(!isNotificationsVisible);
  };

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

      const notificationsData = [...hackedReportsData, ...bugReportsData];
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

  const handleMarkAsRead = async (notification) => {
    try {
      const collectionName =
        notification.type === 'Account Hacked'
          ? 'accountHackedReports'
          : 'bugReports';

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

  const showAlert = (title, message) => {
    window.alert(`${title}: ${message}`);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'No timestamp available';
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);
    return date.toLocaleString();
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

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      if (navigation && navigation.navigate) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'WebSignIn' }],
        });
      } else {
        console.error("Navigation object is not defined or 'WebSignIn' route does not exist.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <Image source={require('../Logos/EGLogoNoName.png')} style={styles.logo} />
        <Text style={styles.logoName}>
          <Text style={{ color: '#00A600' }}>Emergen</Text>
          <Text style={{ color: '#FF7D05' }}>GOODS</Text>
        </Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SuperAdmin')}
            style={styles.menuItem}
          >
            <Ionicons name="grid-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.menuText}>Super Admin Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('CreateAdmin')}
            style={styles.menuItem}
          >
            <Ionicons name="person-add-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.menuText}>Create Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('ManageAdmin')}
            style={styles.menuItem}
          >
            <Ionicons name="people-outline" size={24} color="#333" style={styles.icon} />
            <Text style={styles.menuText}>Manage Admin</Text>
          </TouchableOpacity>

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

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Image source={logouticon} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.contentText}>Manage Admin</Text>
          <TouchableOpacity onPress={toggleNotifications} style={styles.iconButton}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={newNotification ? 'red' : 'black'}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by email"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Admin Accounts Grid */}
        <FlatList
          data={filteredAdminAccounts}
          keyExtractor={(item) => item.id}
          renderItem={renderAdminAccount}
          numColumns={4}
          contentContainerStyle={styles.grid}
        />

        {/* Edit Modal */}
        {editingAdmin && (
          <View style={styles.editModal}>
            <TextInput
              style={styles.input}
              placeholder="New Email"
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Button title="Confirm" onPress={handleConfirmEdit} color={'green'}/>
            <Button title="Cancel" onPress={() => setEditingAdmin(null)} color={'red'}/>
          </View>
        )}

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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: wp('100%'),
    flexDirection: 'row',
    backgroundColor: '#F4F6F8',
  },
  sidebar: {
    width: wp('18%'),
    backgroundColor: '#fff',
    padding: wp('2%'),
    borderRightWidth: wp('0.1%'),
    borderRightColor: '#ddd',
  },
  content: {
        flex: wp('100%'),
    backgroundColor: '#F4F6F8',
    padding: wp('1%'),
  },
  contentText: {
    fontSize: wp('1.5%'),
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.1%'),
    borderBottomWidth: wp('0.1%'),
    borderColor: '#ddd',
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
  menuContainer: {
    flexDirection: 'column',
    padding: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomColor: '#ddd',
  },
  icon: {
    marginRight: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  adminCard: {
    
    width: '23%',
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  adminEmail: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  deleteButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F44336',
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
  editModal: {
    position: 'absolute',
    top: '45%',
    left: '35%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    width: '40%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  input: {
    marginBottom: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  confirmButton: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  cancelButton: {
    marginTop: 16,
    padding: 8,
    backgroundColor: '#F44336',
    borderRadius: 4,
  },
  searchContainer: {
    padding: 16,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
});