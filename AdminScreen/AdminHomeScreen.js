import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions, Alert, BackHandler, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the path based on your Firebase config file
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');
const eventicon = require('../Icons/eventicon.png'); 
const inventoryicon = require('../Icons/inventoryicon.png');
const sendnotificationicon = require('../Icons/sendnotificationicon.png');
const reporticon = require('../Icons/reporticon.png');
const manageusericon = require('../Icons/manageusericon.png');
const logouticon = require('../Icons/logouticon.png');

export default function AdminHome({ navigation }) {
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const slideSettingsAnim = useState(new Animated.Value(width))[0];
  const slideNotificationsAnim = useState(new Animated.Value(-width))[0];

  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const toggleSettings = () => {
    if (isSettingsVisible) {
      Animated.timing(slideSettingsAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setSettingsVisible(false));
    } else {
      if (isNotificationsVisible) {
        Animated.timing(slideNotificationsAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setNotificationsVisible(false));
      }
      setSettingsVisible(true);
      Animated.timing(slideSettingsAnim, {
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
      if (isSettingsVisible) {
        Animated.timing(slideSettingsAnim, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setSettingsVisible(false));
      }

      fetchNotifications(); // Fetch notifications each time notifications screen is opened
      setNotificationsVisible(true);
      Animated.timing(slideNotificationsAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const fetchNotifications = async () => {
    try {
      const accountHackedReports = await getDocs(collection(db, 'accountHackedReports'));
      const bugReports = await getDocs(collection(db, 'bugReports'));
      const verificationNotifications = await getDocs(collection(db, 'verificationNotifications')); // Fetch verification notifications

      const hackedReportsData = accountHackedReports.docs.map(doc => ({
        id: doc.id,
        type: 'Account Hacked',
        read: doc.data().read || false,
        ...doc.data(),
      }));

      const bugReportsData = bugReports.docs.map(doc => ({
        id: doc.id,
        type: 'Bug Report',
        read: doc.data().read || false,
        ...doc.data(),
      }));

      const verificationNotificationsData = verificationNotifications.docs.map(doc => ({
      id: doc.id,
      type: 'Verification Pending',
      message: doc.data().message || 'No message',
      status: doc.data().status || 'No status',
      timestamp: doc.data().timestamp || 'No timestamp',
      read: doc.data().read || false,
    }));

      const combinedNotifications = [
        ...hackedReportsData,
        ...bugReportsData,
        ...verificationNotificationsData, // Include verification notifications
      ];

      // Check if there are any new unread notifications
      const hasNewNotification = combinedNotifications.some(notification => !notification.read);
      setNewNotification(hasNewNotification);

      // Show alert if there is a new notification
      if (hasNewNotification) {
        Alert.alert('New Notification', 'There are new unread notifications.');
      }

      setNotifications(combinedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to fetch notifications');
    }
  };

  const handleMarkAsRead = async (notification) => {
    try {
      const docRef = doc(db, notification.type === 'Account Hacked' ? 'accountHackedReports' :
                         notification.type === 'Bug Report' ? 'bugReports' : 'verificationNotifications', notification.id);
      await updateDoc(docRef, { read: !notification.read });
      
      setNotifications(notifications.map(item => 
        item.id === notification.id ? { ...item, read: !item.read } : item
      ));

      Alert.alert('Success', notification.read ? 'Marked as Unread' : 'Marked as Read');
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification status');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => navigation.navigate('Landing') }
      ],
      { cancelable: false }
    );
  };
const renderNotification = ({ item }) => {
  const timestamp = item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString() : 'No date available';

  return (
    <View style={styles.notificationCard}>
      <Text style={styles.notificationTitle}>{item.type}</Text>

      {item.type === 'Account Hacked' ? (
        <>
          <Text style={styles.notificationText}>Full Name: {item.fullName}</Text>
          <Text style={styles.notificationText}>Email: {item.email}</Text>
          <Text style={styles.notificationText}>Password: {item.password}</Text>
        </>
      ) : item.type === 'Bug Report' ? (
        <Text style={styles.notificationText}>Details: {item.details}</Text>
      ) : item.type === 'Verification Pending' ? (
        <>
          <Text style={styles.notificationText}>Message: {item.message}</Text>
          <Text style={styles.notificationText}>Status: {item.status}</Text>
        </>
      ) : null}

      <Text style={styles.notificationTimestamp}>
        Submitted at: {timestamp}
      </Text>

      <TouchableOpacity onPress={() => handleMarkAsRead(item)} style={styles.markAsReadButton}>
        <Text style={styles.markAsReadText}>{item.read ? 'Mark as Unread' : 'Mark as Read'}</Text>
      </TouchableOpacity>
    </View>
  );
};

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleNotifications} style={styles.bellIcon}>
        <Ionicons name="notifications-outline" size={32} color={newNotification ? 'red' : 'black'} />
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleSettings} style={styles.hamburgerButton}>
        <Text style={styles.SettingsOpen}>{isSettingsVisible ? '' : '☰'}</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Image source={require('../Logos/EGLogoNoName.png')} style={styles.logo} />

        <Text style={styles.title}>ADMINISTRATOR</Text>

        <TouchableOpacity onPress={() => navigation.navigate('Event')} style={styles.navButton}>
          <Image source={eventicon} style={styles.icon} />
          <Text style={styles.navButtonText}>Event</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Inventory')} style={styles.navButton}>
          <Image source={inventoryicon} style={styles.icon} />
          <Text style={styles.navButtonText}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('SendNotification')} style={styles.navButton}>
          <Image source={sendnotificationicon} style={styles.icon} />
          <Text style={styles.navButtonText}>Send Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Report')} style={styles.navButton}>
          <Image source={reporticon} style={styles.icon} />
          <Text style={styles.navButtonText}>Report</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ManageUser')} style={styles.navButton}>
          <Image source={manageusericon} style={styles.icon} />
          <Text style={styles.navButtonText}>Manage User</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.settingsContainer, { transform: [{ translateX: slideSettingsAnim }] }]}>
        <TouchableOpacity onPress={toggleSettings} style={styles.closeButton}>
          <Text style={styles.SettingsClose}>X</Text>
        </TouchableOpacity>
        <Text style={styles.settingsText}>Settings</Text>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Image source={logouticon} style={styles.logouticon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.notificationsContainer, { transform: [{ translateX: slideNotificationsAnim }] }]}>
        <TouchableOpacity onPress={toggleNotifications} style={styles.notificationcloseButton}>
          <Text style={styles.NotificationClose}>X</Text>
        </TouchableOpacity>
        <Text style={styles.notificationsText}>Notifications</Text>

        <FlatList style={styles.flatlistscreen}
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.notificationList}
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
    backgroundColor: '#fff',
  },
  logo: {
    position: 'absolute',
    top: hp ('-16%'),
    width: wp ('12%'),
    height: hp ('5.6%'),
    marginTop: hp ('3%'),
    marginBottom: hp ('-10%'),
    alignSelf: 'center',
  },
  bellIcon: {
    position: 'absolute',
    top: hp ('5.5%'),
    left: wp ('5.6%'),
  },
  hamburgerButton: {
    position: 'absolute',
    top: hp ('5%'),
    right: hp ('2%'),
  },
  SettingsOpen: {
    fontSize: 32,
    color: 'black',
  },
  SettingsClose: {
    fontSize: 30,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: height * 0.03,
  },
  navButton: {
    padding: height * 0.02,
    backgroundColor: '#FF7D05',
    borderRadius: 5,
    marginBottom: height * 0.015,
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  navButtonText: {
    color: 'black',
    textAlign: 'center',
    fontSize: 25,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  icon: {
    width: width * 0.15,
    height: width * 0.15,
    marginRight: 10,
  },
  settingsContainer: {
    position: 'absolute',
    width: '75%',
    height: '100%',
    backgroundColor: 'white',
    top: 0,
    left: 100,
    paddingTop: height * 0.07,
    borderLeftWidth: 1,
    borderLeftColor: '#000',
  },
  closeButton: {
    padding: 10,
    alignSelf: 'flex-end',
    bottom: 24,
    right: wp ('65%'),
  },
  settingsText: {
    fontSize: 30,
    fontWeight: 'bold',
    margin: 20,
    bottom: 93,
    left: wp ('40%'),
  },
  logoutButton: {
    position: 'absolute',
    top: hp ('80%'),
    left: wp ('17%'),
    padding: height * 0.015,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: 'red',
    marginLeft: 10,
    fontSize: 25,
  },
  logouticon: {
    width: width * 0.1,
    height: width * 0.1,
    marginRight: 10,
  },
  notificationsContainer: {
    position: 'absolute',
    width: '75%',
    height: '100%',
    backgroundColor: 'white',
    top: 0,
    right: 100,
    paddingTop: height * 0.07,
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  Button: {
    paddingLeft: 100,
    paddingRight: 10,
    paddingBottom: 50,
    alignSelf: 'flex-end',
    bottom: 16,
  },
  notificationsText: {
    fontSize: 32,
    bottom: 30,
    alignSelf: 'center',
    paddingBottom: 10,
  },
  notificationList: {
    paddingBottom: 100,
  },
  notificationCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    elevation: 2,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificatinotificationcloseonText: {
    fontSize: 16,
    marginVertical: 5,
  },
  notificationTimestamp: {
    fontSize: 14,
    color: '#666',
  },
  NotificationClose: {
    fontSize: 30,
  },
});
