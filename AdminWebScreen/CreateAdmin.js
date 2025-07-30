import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const logouticon = require('../Icons/logouticon.png');

export default function CreateAdmin({ navigation }) {
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

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
        Alert.alert('You have new notifications. Check them now!');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to fetch notifications. Please try again later.');
    }
  };

  const handleMarkAsRead = async (notification) => {
    try {
      const collectionName =
        notification.type === 'Account Hacked' ? 'accountHackedReports' : 'bugReports';

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
    Alert.alert(title, message);
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
    const confirmed = window.confirm("Are you sure you want to logout?");
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

  const createAdminAccount = async () => {
    try {
      if (!email.endsWith('@admin.com')) {
        showAlert('Error', 'Admin email must end with @admin.com');
        return;
      }

      if (password.length < 6 || password.length > 20) {
        showAlert('Error', 'Password must be between 6 and 20 characters.');
        return;
      }

      if (password !== confirmPassword) {
        showAlert('Error', 'Password and Confirm Password do not match.');
        return;
      }

      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await addDoc(collection(db, 'adminAccounts'), {
        uid: user.uid,
        email: email,
        createdAt: new Date(),
      });

      await addDoc(collection(db, 'adminArchive'), {
        uid: user.uid,
        email: email,
        createdAt: new Date(),
        archivedAt: new Date(),
      });

      showAlert('Success', 'Admin account created and archived successfully!');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error creating admin account:', error);
      showAlert('Error', 'Failed to create admin account. Please try again later.');
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
        {/* Super Admin Dashboard Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('SuperAdmin')} // Update the route as needed
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
          <Text style={styles.contentText}>Create Admin Account</Text>

          <TouchableOpacity onPress={toggleNotifications} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={newNotification ? 'red' : 'black'} />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email (e.g., admin@admin.com)"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (6-20 characters)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            maxLength={20}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password (6-20 characters)"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            maxLength={20}
          />
          <TouchableOpacity onPress={createAdminAccount} style={styles.createButton}>
            <Text style={styles.createButtonText}>Create Admin</Text>
          </TouchableOpacity>
        </View>

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
  formContainer: {
    width: wp('40%'),
    top: hp('20%'),
    alignSelf: 'center',
    padding: 25,
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 5,
    marginHorizontal: 20,
    marginTop: 30,
  },
  input: {
    height: 55,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 18,
    fontSize: 17,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  createButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#00A600",
    shadowColor: "gray",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});