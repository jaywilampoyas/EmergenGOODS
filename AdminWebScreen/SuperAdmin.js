import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, Image, FlatList, ScrollView, } from 'react-native';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { BarChart } from 'react-native-chart-kit';

const logouticon = require('../Icons/logouticon.png');

export default function SuperAdmin({ navigation }) {
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0); // Added for registered users count
  const [adminsCount, setAdminsCount] = useState(0); // Added for admins count
  const [volunteersCount, setVolunteersCount] = useState(0); // Added for volunteers count
  const [bugReportsCount, setBugReportsCount] = useState(0); // Added for bug reports count
  const [accountHackedCount, setAccountHackedCount] = useState(0); // Added for account hacked reports count
  const [userData, setUserData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [adminData, setAdminData] = useState({ labels: [], datasets: [{ data: [] }] });
   const [volunteerData, setVolunteerData] = useState({ labels: [], datasets: [{ data: [] }] });
   const [bugReportsData, setBugReportsData] = useState({ labels: [], datasets: [{ data: [] }] });
   const [accountHackedData, setAccountHackedData] = useState({ labels: [], datasets: [{ data: [] }] });

  // Fetch notifications and counts
  useEffect(() => {
    fetchNotifications();
    fetchCounts();
    fetchUserData();
    fetchAdminData();
    fetchVolunteerData();
    fetchBugReportsData();
    fetchAccountHackedData();
  }, []);

   const fetchCounts = async () => {
    try {
      const [usersSnapshot, adminsSnapshot, volunteersSnapshot, bugReportsSnapshot, accountHackedSnapshot] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'adminAccounts')),
        getDocs(collection(db, 'volunteers')),
        getDocs(collection(db, 'bugReports')),
        getDocs(collection(db, 'accountHackedReports')),
      ]);

      setRegisteredUsersCount(usersSnapshot.size);
      setAdminsCount(adminsSnapshot.size);
      setVolunteersCount(volunteersSnapshot.size);
      setBugReportsCount(bugReportsSnapshot.size);
      setAccountHackedCount(accountHackedSnapshot.size);
    } catch (error) {
      console.error('Error fetching counts:', error);
      Alert.alert('Error', 'Failed to fetch counts. Please try again later.');
    }
  };

const fetchUserData = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const users = usersSnapshot.docs.map((doc) => doc.data());

    const monthlyCounts = {};
    users.forEach((user) => {
      if (user.createdAt) {
        // Parse the createdAt string into a Date object
        const createdAt = new Date(user.createdAt);
        if (!isNaN(createdAt.getTime())) { // Check if the date is valid
          const month = createdAt.toLocaleString('default', { month: 'short' });
          const year = createdAt.getFullYear();
          const monthYear = `${month}. ${year}`;

          if (!monthlyCounts[monthYear]) {
            monthlyCounts[monthYear] = 0;
          }
          monthlyCounts[monthYear]++;
        }
      }
    });

    // Sort the months in ascending order
    const sortedLabels = Object.keys(monthlyCounts).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA - dateB;
    });

    const data = sortedLabels.map((label) => monthlyCounts[label]);

    // Update state with the chart data
    setUserData({
      labels: sortedLabels,
      datasets: [{ data }],
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    Alert.alert('Error', 'Failed to fetch user data. Please try again later.');
  }
};

  const fetchAdminData = async () => {
    try {
      const adminsCollection = collection(db, 'adminAccounts');
      const adminsSnapshot = await getDocs(adminsCollection);
      const admins = adminsSnapshot.docs.map((doc) => doc.data());

      const monthlyCounts = {};
      admins.forEach((admin) => {
        if (admin.createdAt && admin.createdAt.toDate) {
          const createdAt = admin.createdAt.toDate();
          const month = createdAt.toLocaleString('default', { month: 'short' });
          const year = createdAt.getFullYear();
          const monthYear = `${month}. ${year}`;

          if (!monthlyCounts[monthYear]) {
            monthlyCounts[monthYear] = 0;
          }
          monthlyCounts[monthYear]++;
        }
      });

      const sortedLabels = Object.keys(monthlyCounts).sort((a, b) => new Date(a) - new Date(b));
      const data = sortedLabels.map((label) => monthlyCounts[label]);

      setAdminData({
        labels: sortedLabels,
        datasets: [{ data }],
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      Alert.alert('Error', 'Failed to fetch admin data. Please try again later.');
    }
  };
  
const fetchVolunteerData = async () => {
  try {
    const volunteersCollection = collection(db, 'volunteers');
    const volunteersSnapshot = await getDocs(volunteersCollection);
    const volunteers = volunteersSnapshot.docs.map((doc) => doc.data());

    console.log('Fetched volunteers:', volunteers); // Debugging: Log fetched volunteers

    const monthlyCounts = {};
    volunteers.forEach((volunteer) => {
      if (volunteer.createdAt && volunteer.createdAt.toDate) {
        const createdAt = volunteer.createdAt.toDate();
        const month = createdAt.toLocaleString('default', { month: 'short' });
        const year = createdAt.getFullYear();
        const monthYear = `${month}. ${year}`;
        

        if (!monthlyCounts[monthYear]) {
          monthlyCounts[monthYear] = 0;
        }
        monthlyCounts[monthYear]++;
      }
    });
    const sortedLabels = Object.keys(monthlyCounts).sort((a, b) => new Date(a) - new Date(b));
    const data = sortedLabels.map((label) => monthlyCounts[label]);

    setVolunteerData({
      labels: sortedLabels,
      datasets: [{ data }],
    });
  } catch (error) {
    console.error('Error fetching volunteer data:', error);
    Alert.alert('Error', 'Failed to fetch volunteer data. Please try again later.');
  }
};
const fetchBugReportsData = async () => {
    try {
      const bugReportsCollection = collection(db, 'bugReports');
      const bugReportsSnapshot = await getDocs(bugReportsCollection);
      const bugReports = bugReportsSnapshot.docs.map((doc) => doc.data());

      const monthlyCounts = {};
      bugReports.forEach((bug) => {
        if (bug.submittedAt && bug.submittedAt.toDate) {
          const submittedAt = bug.submittedAt.toDate();
          const month = submittedAt.toLocaleString('default', { month: 'short' });
          const year = submittedAt.getFullYear();
          const monthYear = `${month}. ${year}`;

          if (!monthlyCounts[monthYear]) {
            monthlyCounts[monthYear] = 0;
          }
          monthlyCounts[monthYear]++;
        }
      });

      const sortedLabels = Object.keys(monthlyCounts).sort((a, b) => new Date(a) - new Date(b));
      const data = sortedLabels.map((label) => monthlyCounts[label]);

      setBugReportsData({
        labels: sortedLabels,
        datasets: [{ data }],
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      Alert.alert('Error', 'Failed to fetch admin data. Please try again later.');
    }
  };

const fetchAccountHackedData = async () => {
    try {
      const accountHackedCollection = collection(db, 'accountHackedReports');
      const accountHackedSnapshot = await getDocs(accountHackedCollection);
      const accountHackedReports = accountHackedSnapshot.docs.map((doc) => doc.data());

      const monthlyCounts = {};
     accountHackedReports.forEach((hack) => {
        if (hack.submittedAt && hack.submittedAt.toDate) {
          const submittedAt = hack.submittedAt.toDate();
          const month = submittedAt.toLocaleString('default', { month: 'short' });
          const year = submittedAt.getFullYear();
          const monthYear = `${month}. ${year}`;

          if (!monthlyCounts[monthYear]) {
            monthlyCounts[monthYear] = 0;
          }
          monthlyCounts[monthYear]++;
        }
      });

      const sortedLabels = Object.keys(monthlyCounts).sort((a, b) => new Date(a) - new Date(b));
      const data = sortedLabels.map((label) => monthlyCounts[label]);

      setAccountHackedData({
        labels: sortedLabels,
        datasets: [{ data }],
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      Alert.alert('Error', 'Failed to fetch admin data. Please try again later.');
    }
  };

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
          <Text style={styles.contentText}>Super Admin Dashboard</Text>
          <TouchableOpacity onPress={toggleNotifications} style={styles.iconButton}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={newNotification ? 'red' : 'black'}
            />
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

<ScrollView style={styles.mainContent}>
        {/* Title and Subtitle */}
        <Text style={styles.title}>Welcome to the Super Admin Dashboard</Text>
        <Text style={styles.subtitle}>Effortlessly Manage Admins, Volunteers, Beneficiaries, and User Reports!</Text>

        {/* Count Boxes */}
   <View style={styles.countContainer}>
  {/* Registered Users Box */}
  <View style={styles.countBox}>
    <Ionicons name="people-outline" size={40} color="#00A600" />
    <Text style={styles.countBoxTitle}>Registered Users</Text>
    <Text style={styles.countBoxNumber}>{registeredUsersCount}</Text>
  </View>

  {/* Admins Box */}
  <View style={styles.countBox}>
    <Ionicons name="shield-outline" size={40} color="#FF7D05" />
    <Text style={styles.countBoxTitle}>Admins</Text>
    <Text style={styles.countBoxNumber}>{adminsCount}</Text>
  </View>

  {/* Volunteers Box */}
  <View style={styles.countBox}>
    <Ionicons name="person-outline" size={40} color="#007BFF" />
    <Text style={styles.countBoxTitle}>Volunteers</Text>
    <Text style={styles.countBoxNumber}>{volunteersCount}</Text>
  </View>

  {/* Bug Reports Box */}
  <View style={styles.countBox}>
    <Ionicons name="bug-outline" size={40} color="#FF0000" />
    <Text style={styles.countBoxTitle}>Bug Reports</Text>
    <Text style={styles.countBoxNumber}>{bugReportsCount}</Text>
  </View>

  {/* Account Hacked Reports Box */}
  <View style={styles.countBox}>
    <Ionicons name="alert-circle-outline" size={40} color="#FFA500" />
    <Text style={styles.countBoxTitle}>Hacked Reports</Text>
    <Text style={styles.countBoxNumber}>{accountHackedCount}</Text>
  </View>
</View>

<View style={styles.cardContainer}>
      <Text style={styles.chartTitle}>📊 User Registrations per Month</Text>
            <BarChart
              data={userData}
              width={wp('33%')} // Adjust width as needed
              height={hp('30%')}
              fromZero
              withInnerLines={false}
              withVerticalLabels
              withHorizontalLabels
              chartConfig={{
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(34, 193, 195, ${opacity})`,
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
    <View style={styles.admincardContainer}>
          <Text style={styles.chartTitle}>📊 Admin Registrations per Month</Text>
            <BarChart
              data={adminData}
              width={wp('33')} // Adjust width as needed
              height={hp('30%')}
              fromZero
              withInnerLines={false}
              withVerticalLabels
              withHorizontalLabels
              chartConfig={{
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 125, 5, ${opacity})`, // Orange color
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                barPercentage: 0.5,
                fillShadowGradient: '#FF7D05',
                fillShadowGradientOpacity: 0.9,
                propsForBackgroundLines: { strokeWidth: 0 },
                propsForLabels: { fontSize: 13, fontWeight: 'bold' },
              }}
              style={styles.chart}
            />
        </View>
        <View style={styles.volunteercardContainer}>
          <Text style={styles.chartTitle}>📊 Volunteer Registrations per Month</Text>
            <BarChart
              data={volunteerData}
             width={wp('33%')} // Adjust width as needed
              height={hp('30%')}
              fromZero
              withInnerLines={false}
              withVerticalLabels
              withHorizontalLabels
              chartConfig={{
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(34, 193, 195, ${opacity})`,
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
        <View style={styles.bugReportCardContainer}>
  <Text style={styles.chartTitle}>📊 Bug Reports per Month</Text>
  <BarChart
    data={bugReportsData}
    width={wp('73%')} // Adjust width as needed
    height={hp('30%')}
    fromZero
    withInnerLines={false}
    withVerticalLabels
    withHorizontalLabels
    chartConfig={{
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // Red color for bug reports
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      barPercentage: 0.5,
      fillShadowGradient: '#FF0000',
      fillShadowGradientOpacity: 0.9,
      propsForBackgroundLines: { strokeWidth: 0 },
      propsForLabels: { fontSize: 13, fontWeight: 'bold' },
    }}
    style={styles.chart}
  />
</View>
<View style={styles.accountHackedCardContainer}>
  <Text style={styles.chartTitle}>📊 Account Hacked Reports per Month</Text>
  <BarChart
    data={accountHackedData}
    width={wp('73%')} // Adjust width as needed
    height={hp('30%')}
    fromZero
    withInnerLines={false}
    withVerticalLabels
    withHorizontalLabels
    chartConfig={{
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`, // Orange color for hacked reports
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
      barPercentage: 0.5,
      fillShadowGradient: '#FFA500',
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
  mainContent: {
    maxWidth: wp('100%'),
    maxHeight: hp('85%'), // Set a maximum height for scrollable content
    marginBottom: hp('0.01%'),
    overflow: 'hidden', // Ensure the scrolling area doesn't overflow
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.1%'),
    borderBottomWidth: wp('0.1%'),
    borderColor: '#ddd',
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
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    maxWidth: wp('100%'),
    maxHeight: hp('85%'), // Set a maximum height for scrollable content
    marginBottom: hp('0.01%'),
    overflow: 'hidden', // Ensure the scrolling area doesn't overflow
  },
  countBox: {
    width: wp('12%'),
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
    alignItems: 'center',
  },
  countBoxTitle: {
    fontSize: wp('1.2%'),
    fontWeight: 'bold',
    marginTop: hp('1%'),
  },
  countBoxNumber: {
    fontSize: wp('2%'),
    fontWeight: 'bold',
    color: '#333',
    marginTop: hp('0.5%'),
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
  cardContainer: {
    top: hp('1%'),
    left: wp('2%'),
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
  admincardContainer: {
    bottom: hp('40%'),
    left: wp('42%'),
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
  volunteercardContainer: {
    bottom: hp('35%'),
    left: wp('22%'),
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
  bugReportCardContainer: {
  bottom: hp('30%'),
  left: wp('2%'),
  width: wp('75%'),
  padding: wp('1%'), // Padding inside the card
  marginVertical: hp('1%'), // Margin to separate from other components
  shadowColor: '#000', // Shadow for the card
  shadowOffset: { width: wp('0%'), height: hp('0.5%') },
  shadowOpacity: wp('0.1%'),
  shadowRadius: wp('0.5%'),
  elevation: hp('0.5%'), // Elevation for Android shadow
  backgroundColor: '#ffffff',
  borderRadius: 5,
},
accountHackedCardContainer: {
  bottom: hp('25%'),
  left: wp('2%'), // Adjust this value to position it appropriately on your screen
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
});