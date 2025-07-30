import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, FlatList } from 'react-native';
import { auth } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc, collection, getDocs, updateDoc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons'; // For back arrow icon
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const db = getFirestore();


const logouticon = require('../../Icons/logouticon.png');

export default function WebVolunteerAccount({ navigation }) {
    // Volunteer Account State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // AdminWebHome State
    const [isNotificationsVisible, setNotificationsVisible] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [newNotification, setNewNotification] = useState(false);
    const [manageUserDropdown, setManageUserDropdown] = useState(false);
    const [eventDropdown, setEventDropdown] = useState(false);

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

    // Volunteer Account Functions
    const handleCreateAccount = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            window.alert('Error', 'Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            window.alert('Error', 'Passwords do not match.');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (email.endsWith('@volunteer.com')) {
                const volunteerData = {
                    fullName,
                    email: user.email,
                    uid: user.uid,
                    createdAt: new Date(), // Timestamp for when the account was created
                };

                // Add to the volunteers collection
                await setDoc(doc(db, 'volunteers', user.uid), volunteerData);

                // Add to the archiveVolunteers collection
                await setDoc(doc(db, 'archiveVolunteers', user.uid), {
                    ...volunteerData,
                    archivedAt: new Date(), // Timestamp for when it was archived
                });
            }

            window.alert('Success', 'Volunteer account created successfully.');
            setFullName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            window.alert('Error', error.message);
        }
    };

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
                    <Text style={styles.title}>Create Volunteer Account</Text>
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

                {/* Volunteer Account Form */}
                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email (e.g., example@volunteer.com)"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password (6-20 characters)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={true}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password (6-20 characters)"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={true}
                    />

                    <TouchableOpacity style={styles.submitButton} onPress={handleCreateAccount}>
                        <Text style={styles.submitButtonText}>Create Account</Text>
                    </TouchableOpacity>
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
    formContainer: {
        top: hp('15%'),
        width: '35%',
        backgroundColor: '#FFFFFF',
        padding: 40,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 5,
        alignSelf: 'center',
    },
    input: {
        width: '100%',
        height: 45,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        color: '#333333',
    },
    submitButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 10,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});