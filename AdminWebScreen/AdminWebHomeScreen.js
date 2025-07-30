import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the path based on your Firebase config file
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { BarChart} from 'react-native-chart-kit';

const eventicon = require('../Icons/eventicon.png');
const inventoryicon = require('../Icons/inventoryicon.png');
const sendnotificationicon = require('../Icons/sendnotificationicon.png');
const reporticon = require('../Icons/reporticon.png');
const manageusericon = require('../Icons/manageusericon.png');
const logouticon = require('../Icons/logouticon.png');
const dashboardicon = require('../Icons/dashboardicon.png');

export default function AdminWebHome({ navigation }) {
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const [eventDropdown, setEventDropdown] = useState(false);
  const [userData, setUserData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [eventData, setEventData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [itemData, setItemData] = useState({ labels: [], datasets: [{ data: [] }] }); // New state for item data
  const [moneyItemData, setMoneyItemData] = useState({ labels: [], datasets: [{ data: [] }] });

  useEffect(() => {
    fetchNotifications();
    fetchUserData();
    fetchEventData();
    fetchItemData();
    fetchMoneyItemData();
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
  
const fetchUserData = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const users = usersSnapshot.docs.map(doc => doc.data());

    const monthlyCounts = {};
    let totalUsers = 0; // Initialize total users counter

    users.forEach(user => {
      const createdAt = new Date(user.createdAt);
      const month = createdAt.toLocaleString('default', { month: 'short' }); // Short month name (e.g., "Jan")
      const year = createdAt.getFullYear(); // Year (e.g., 2025)
      const monthYear = `${month}. ${year}`; // Format: "Jan. 2025"

      if (!monthlyCounts[monthYear]) {
        monthlyCounts[monthYear] = 0;
      }
      monthlyCounts[monthYear]++;
      totalUsers++; // Increment total users
    });

    // Sort the months in ascending order
    const sortedLabels = Object.keys(monthlyCounts).sort((a, b) => new Date(a) - new Date(b));
    const data = sortedLabels.map(label => monthlyCounts[label]);

    setUserData({
      labels: sortedLabels,
      datasets: [{ data }]
    });

    // Display total users in the cardContainer
    document.getElementById('totalUsers').innerText = `${totalUsers}`;
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

const fetchEventData = async () => {
  try {
    const eventsCollection = collection(db, 'eventArchive'); // Fetch events collection
    const eventsSnapshot = await getDocs(eventsCollection);
    const events = eventsSnapshot.docs.map(doc => doc.data());

    const monthlyCounts = {};
    let totalEvents = 0; // Initialize total events counter

    events.forEach(event => {
      const eventDate = new Date(event.createdAt); // Assuming 'createdAt' is the field for event creation date
      const month = eventDate.toLocaleString('default', { month: 'short' }); // Short month name (e.g., "Jan")
      const year = eventDate.getFullYear(); // Year (e.g., 2025)
      const monthYear = `${month}. ${year}`; // Format: "Jan. 2025"

      if (!monthlyCounts[monthYear]) {
        monthlyCounts[monthYear] = 0;
      }
      monthlyCounts[monthYear]++;
      totalEvents++; // Increment total events
    });

    // Sort the months in ascending order
    const sortedLabels = Object.keys(monthlyCounts).sort((a, b) => new Date(a) - new Date(b));
    const data = sortedLabels.map(label => monthlyCounts[label]);

    setEventData({
      labels: sortedLabels,
      datasets: [{ data }]
    });

    // Display total events in the cardEventContainer
    document.getElementById('totalEvents').innerText = `${totalEvents}`;
  } catch (error) {
    console.error('Error fetching event data:', error);
  }
};

const fetchItemData = async () => {
  try {
    const itemsCollection = collection(db, 'items');
    const itemsSnapshot = await getDocs(itemsCollection);
    const items = itemsSnapshot.docs.map(doc => doc.data());

    const regularItems = items.filter(item => item.type !== "Money");

    const monthlyCounts = {};
    let totalRegularItems = 0;
    let totalQuantity = 0;

    regularItems.forEach(item => {
      const itemDate = new Date(item.createdAt);
      const month = itemDate.toLocaleString('default', { month: 'short' });
      const year = itemDate.getFullYear();
      const monthYear = `${month}. ${year}`;

      if (!monthlyCounts[monthYear]) {
        monthlyCounts[monthYear] = 0;
      }
      monthlyCounts[monthYear]++;
      totalRegularItems++;

      if (item.totalQuantity) {
        totalQuantity += parseFloat(item.totalQuantity);
      }
    });

    const sortedLabels = Object.keys(monthlyCounts).sort((a, b) => new Date(a) - new Date(b));
    const data = sortedLabels.map(label => monthlyCounts[label]);

    setItemData({
      labels: sortedLabels,
      datasets: [{ data }]
    });

    // Format total regular items and total quantity with commas
    document.getElementById('totalRegularItems').innerText = `${totalRegularItems.toLocaleString()}`;
    document.getElementById('totalQuantity').innerText = `${totalQuantity.toLocaleString()}`;
  } catch (error) {
    console.error('Error fetching item data:', error);
  }
};

const fetchMoneyItemData = async () => {
  try {
    const itemsCollection = collection(db, 'items');
    const itemsSnapshot = await getDocs(itemsCollection);
    const items = itemsSnapshot.docs.map(doc => doc.data());

    const moneyItems = items.filter(item => item.type === "Money");

    const monthlyCounts = {};
    let totalMoneyItems = 0;
    let totalAmount = 0;

    moneyItems.forEach(item => {
      const itemDate = new Date(item.createdAt);
      const month = itemDate.toLocaleString('default', { month: 'short' });
      const year = itemDate.getFullYear();
      const monthYear = `${month}. ${year}`;

      if (!monthlyCounts[monthYear]) {
        monthlyCounts[monthYear] = 0;
      }
      monthlyCounts[monthYear]++;
      totalMoneyItems++;

      if (item.totalAmount) {
        totalAmount += parseFloat(item.totalAmount);
      }
    });

    const sortedLabels = Object.keys(monthlyCounts).sort((a, b) => new Date(a) - new Date(b));
    const data = sortedLabels.map(label => monthlyCounts[label]);

    setMoneyItemData({
      labels: sortedLabels,
      datasets: [{ data }]
    });

    // Format total monetary items and total amount with commas
    document.getElementById('totalMoneyItems').innerText = `${totalMoneyItems.toLocaleString()}`;
    document.getElementById('totalAmount').innerText = `₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch (error) {
    console.error('Error fetching monetary item data:', error);
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
          <Text style={styles.contentText}>Admin Dashboard</Text>
          <TouchableOpacity onPress={toggleNotifications} style={styles.iconButton}>
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

        {/* Main Content Placeholder */}
        <ScrollView style={styles.scrollableContainer}>

        <View style={styles.sloganContainer}>
        <Text style={styles.title}>Welcome to the Admin Dashboard</Text>
      <Text style={styles.subtitle}>
       View and Track Users, Events, and Monthly Insights with Ease!
      </Text>
      </View>

    <View style={styles.totalsContainer}>
      {/* Box for Total Registered Users */}
      <View style={styles.totalBox}>
        <View style={styles.totalItem}>
          <Ionicons name="people" size={50} color="#FF7D05" />
          <Text style={styles.totalsTitle}>REGISTERED USERS</Text>
          <Text id="totalUsers" style={styles.totalsValue}>Loading...</Text>
        </View>
      </View>

      {/* Box for Total Events Created */}
      <View style={styles.totalBox}>
        <View style={styles.totalItem}>
          <Ionicons name="calendar" size={50} color="blue" />
          <Text style={styles.totalsTitle}>EVENTS</Text>
          <Text id="totalEvents" style={styles.totalsValue}>Loading...</Text>
        </View>
      </View>

      {/* Box for Total Regular Items Added */}
<View style={styles.totalBox}>
  <View style={styles.totalItem}>
    <Ionicons name="cube" size={50} color="brown" />
    <Text style={styles.totalsTitle}>REGULAR ITEMS</Text>
    <Text id="totalRegularItems" style={styles.totalsValue}>Loading...</Text>
    <Text id="totalQuantity" style={styles.totals}>Loading...</Text>
  </View>
</View>

      {/* Box for Total Monetary Items Added */}
<View style={styles.totalBox}>
  <View style={styles.totalItem}>
    <Ionicons name="cash" size={50} color="green" />
    <Text style={styles.totalsTitle}>MONETARY ITEMS</Text>
    <Text id="totalMoneyItems" style={styles.totalsValue}>Loading...</Text>
    <Text id="totalAmount" style={styles.totals}>Loading...</Text>
  </View>
</View>
    </View>

          <View style={styles.cardContainer}>
            <Text style={styles.chartTitle}>📊 User Registrations per Month</Text>
            <BarChart
              data={userData}
              width={wp('33%')} // Increased width for better visualization
              height={hp('30%')}
              fromZero
              withInnerLines={false}
              withVerticalLabels
              withHorizontalLabels
              chartConfig={{
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(34, 193, 195, ${opacity})`, // Cyan color
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                barPercentage: 0.5,
                fillShadowGradient: '#22C1C3',
                fillShadowGradientOpacity: 0.9,
                propsForBackgroundLines: { strokeWidth: 0 },
                propsForLabels: { fontSize: 13, fontWeight: 'bold' },
              }}
              style={styles.chart}
            />
          </View>

          <View style={styles.cardEventContainer}>
            <Text style={styles.chartTitle}>📅 Events Created per Month</Text>
            <BarChart
              data={eventData}
              width={wp('33%')}
              height={hp('30%')}
              fromZero
              withInnerLines={false}
              withVerticalLabels
              withHorizontalLabels
              chartConfig={{
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 140, 0, ${opacity})`, // Deep orange
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                barPercentage: 0.5,
                fillShadowGradient: '#FF8C00',
                fillShadowGradientOpacity: 0.9,
                propsForBackgroundLines: { strokeWidth: 0 },
                propsForLabels: { fontSize: 13, fontWeight: 'bold' },
              }}
              style={styles.chart}
            />
          </View>

          {/* New Card for Regular Items */}
          <View style={styles.cardItemContainer}>
            <Text style={styles.chartTitle}>📦 Regular Items Added per Month</Text>
            <BarChart
              data={itemData}
              width={wp('73%')}
              height={hp('30%')}
              fromZero
              withInnerLines={false}
              withVerticalLabels
              withHorizontalLabels
              chartConfig={{
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`, // Teal color
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                barPercentage: 0.5,
                fillShadowGradient: '#4BC0C0',
                fillShadowGradientOpacity: 0.9,
                propsForBackgroundLines: { strokeWidth: 0 },
                propsForLabels: { fontSize: 13, fontWeight: 'bold' },
              }}
              style={styles.chart}
            />
          </View>

          <View style={styles.cardMoneyContainer}>
  <Text style={styles.chartTitle}>💰 Monetary Items Added per Month</Text>
  <BarChart
    data={moneyItemData}
    width={wp('73%')}
    height={hp('30%')}
    fromZero
    withInnerLines={false}
    withVerticalLabels
    withHorizontalLabels
    chartConfig={{
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Red color
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      barPercentage: 0.5,
      fillShadowGradient: '#FF6384',
      fillShadowGradientOpacity: 0.9,
      propsForBackgroundLines: { strokeWidth: 0 },
      propsForLabels: { fontSize: 13, fontWeight: 'bold' },
    }}
    style={styles.chart}
  />
</View>
</ScrollView>
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
  scrollableContainer: {
    maxWidth: wp('100%'),
    maxHeight: hp('85%'), // Set a maximum height for scrollable content
    marginBottom: hp('0.01%'),
    overflow: 'hidden', // Ensure the scrolling area doesn't overflow
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
    title: {
    marginTop: hp('5%'),
    fontSize: wp('2.5%'),
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'flex-start',
  },
  subtitle: {
    fontSize: wp('1.5%'),
    color: '#000',
    marginTop: hp('0.9%'),
    textAlign: 'flex-start',
    marginBottom: hp('5%'),
  },
  cardContainer: {
    top: hp('1%'),
    left: wp('1%'),
    padding: wp('1%'), // Padding inside the card
    marginVertical: hp('1%'), // Margin to separate from other components
    shadowColor: '#000', // Shadow for the card
    shadowOffset: { width: wp('0%'), height: hp('0.5%') },
    shadowOpacity: wp('0.1%'),
    shadowRadius: wp('0.5%'),
    elevation: hp('0.5%'), // Elevation for Android shadow
    width: wp('35%'), // Card width (90% of screen width)
    backgroundColor: '#ffffff',
    borderRadius: 5,
  },
  cardEventContainer: {
    bottom: hp('40.5%'),
    left: wp('41%'),
    padding: wp('1%'), // Padding inside the card
    marginVertical: hp('1%'), // Margin to separate from other components
    shadowColor: '#000', // Shadow for the card
    shadowOffset: { width: wp('0%'), height: hp('0.5%') },
    shadowOpacity: wp('0.1%'),
    shadowRadius: wp('0.5%'),
    elevation: hp('0.5%'), // Elevation for Android shadow
    width: wp('35%'), // Card width (90% of screen width)
    backgroundColor: '#ffffff',
    borderRadius: 5,
  },
  cardItemContainer: {
    left: wp('1%'),
    bottom: hp('38%'),
    padding: wp('1%'), // Padding inside the card
    marginVertical: hp('1%'), // Margin to separate from other components
    shadowColor: '#000', // Shadow for the card
    shadowOffset: { width: wp('0%'), height: hp('0.5%') },
    shadowOpacity: wp('0.1%'),
    shadowRadius: wp('0.5%'),
    elevation: hp('0.5%'), // Elevation for Android shadow
    width: wp('75%'), // Card width (90% of screen width)
    backgroundColor: '#ffffff',
    borderRadius: 5,
    marginBottom: hp('4%'),
    marginTop: hp('4%'),
  },
    cardMoneyContainer: {
    bottom: hp('35%'),
    left: wp('1%'),
    padding: wp('1%'), // Padding inside the card
    marginVertical: hp('1%'), // Margin to separate from other components
    shadowColor: '#000', // Shadow for the card
    shadowOffset: { width: wp('0%'), height: hp('0.5%') },
    shadowOpacity: wp('0.1%'),
    shadowRadius: wp('0.5%'),
    elevation: hp('0.5%'), // Elevation for Android shadow
    width: wp('75%'), // Card width (90% of screen width)
    backgroundColor: '#ffffff',
    borderRadius: 5,
  },
  chartTitle: {
    fontSize: wp('1.5%'),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: hp('1%'),
  },
  chart: {
    borderRadius: wp('1%'),
  },
  totalText: {
    fontSize: wp('0.9%'),
    fontWeight: 'bold',
    color: '#333',
    marginTop: hp('1%'),
  },
totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  totalBox: {
    left: wp('-1%'),
    width: wp('15%'),
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    shadowColor: '#000', // Shadow for the card
    shadowOffset: { width: wp('0%'), height: hp('0.5%') },
    shadowOpacity: wp('0.1%'),
    shadowRadius: wp('0.5%'),
    elevation: hp('0.5%'), // Elevation for Android shadow
    backgroundColor: '#ffffff',
    marginBottom: hp('4%'),
  },
  totalItem: {
    alignItems: 'center',
  },
  totalsValue: {
    marginTop: 5,
    fontWeight: 'bold',
    fontSize: 24,
  },
  totals: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: '#ccc',
    fontSize: 20,
    color: '#000',
    marginTop: 10,
  },
  totalsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});