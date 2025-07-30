import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
  Image,
  FlatList,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const db = getFirestore();

const eventicon = require('../Icons/eventicon.png');
const inventoryicon = require('../Icons/inventoryicon.png');
const sendnotificationicon = require('../Icons/sendnotificationicon.png');
const reporticon = require('../Icons/reporticon.png');
const manageusericon = require('../Icons/manageusericon.png');
const logouticon = require('../Icons/logouticon.png');
const dashboardicon = require('../Icons/dashboardicon.png');

export default function WebSendNotification({ navigation }) {
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationText, setNotificationText] = useState('');
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const [manageUserDropdown, setManageUserDropdown] = useState(false);
  const [eventDropdown, setEventDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const toggleNotifications = () => {
    setNotificationsVisible(!isNotificationsVisible);
  };

  const toggleEventDropdown = () => {
    setEventDropdown(!eventDropdown);
  };

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

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationText) {
      window.alert('Error', 'Title and notification text cannot be empty.');
      return;
    }

    try {
      await addDoc(collection(db, 'notifications'), {
        title: notificationTitle,
        text: notificationText,
        timestamp: new Date().toISOString(),
      });
      window.alert('Success', 'Notification sent to the Beneficiaries!');
      setNotificationTitle('');
      setNotificationText('');
    } catch (error) {
      window.alert('Error', 'Failed to send notification. Please try again.');
      console.error('Error sending notification: ', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar Navigation */}
      <View style={styles.sidebar}>
        <Image source={require('../Logos/EGLogoNoName.png')} style={styles.logo} />
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
          <TouchableOpacity onPress={toggleEventDropdown} style={styles.navButton}>
            <Image source={eventicon} style={styles.icon} />
            <Text style={styles.navButtonText}>Event</Text>
            <Icon name={eventDropdown ? 'chevron-up' : 'chevron-down'} size={20} />
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

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Image source={logouticon} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Header Icons */}
        <View style={styles.header}>
          <Text style={styles.contentText}>Send Notification</Text>
          <TouchableOpacity onPress={toggleNotifications} style={styles.iconButton}>
            <Icon name="notifications-outline" size={24} color={newNotification ? 'red' : 'black'} />
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

        {/* Notification Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Enter notification title..."
            placeholderTextColor="#666"
            value={notificationTitle}
            onChangeText={setNotificationTitle}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter notification details..."
            placeholderTextColor="#666"
            value={notificationText}
            onChangeText={setNotificationText}
            multiline={true}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendNotification}
          >
            <Text style={styles.sendButtonText}>Send Notification</Text>
          </TouchableOpacity>
        </View>
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
  iconButton: {
    padding: wp('1%'),
  },
  contentText: {
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
  form: {
    flex: 1,
    alignSelf: 'center',
    marginTop: '10%',
    width: '50%',
  },
  input: {
    width: '100%',
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textArea: {
    height: 150,
  },
  sendButton: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: '#00A600',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
