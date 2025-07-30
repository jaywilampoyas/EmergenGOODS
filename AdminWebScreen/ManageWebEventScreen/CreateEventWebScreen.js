import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, TextInput, Alert, Dimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust the path based on your Firebase config file
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import DateTimePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as ImagePicker from 'expo-image-picker';
import Checkbox from 'expo-checkbox';
import { Picker } from '@react-native-picker/picker';

const eventicon = require('../../Icons/eventicon.png');
const inventoryicon = require('../../Icons/inventoryicon.png');
const sendnotificationicon = require('../../Icons/sendnotificationicon.png');
const reporticon = require('../../Icons/reporticon.png');
const manageusericon = require('../../Icons/manageusericon.png');
const logouticon = require('../../Icons/logouticon.png');
const dashboardicon = require('../../Icons/dashboardicon.png');

export default function WebCreateEvent({ navigation }) {
  // State for AdminWebHome
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const [manageUserDropdown, setManageUserDropdown] = useState(false);
  const [eventDropdown, setEventDropdown] = useState(false);

  // State for WebCreateEvent
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [updatedDate, setUpdatedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [searchItemQuery, setSearchItemQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [itemInputs, setItemInputs] = useState({});
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('All'); // 'All' will show all items
  const [customType, setCustomType] = useState('');

  const formatDate = (date) => {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
    timeZone: 'Asia/Shanghai', // UTC+8 timezone
  };
  return date.toLocaleString('en-US', options);
};

  // Fetch notifications for AdminWebHome
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

  // Functions for WebCreateEvent
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      window.alert("Permission Denied", "You need to grant permission to access the gallery!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageBase64(result.assets[0].uri); // Temporarily store the selected image URI
      console.log("Selected Image URI: ", result.assets[0].uri);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'pendingVerifications');
      try {
        const querySnapshot = await getDocs(usersCollection);
        const usersList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.verificationStatus && user.verificationStatus.trim() !== 'Pending');
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchItems = async () => {
      const itemsCollection = collection(db, 'items');
      try {
        const querySnapshot = await getDocs(itemsCollection);
        const itemsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setItems(itemsList);
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    fetchUsers();
    fetchItems();
  }, []);

 const toggleUserSelection = (user) => {
  setSelectedUsers((prevSelected = {}) => {
    const isSelected = prevSelected[user.id];
    if (isSelected) {
      const { [user.id]: _, ...rest } = prevSelected;
      return rest; // Remove the deselected user
    } else {
      return {
        ...prevSelected,
        [user.id]: {
          id: user.id,
          firstName: user.firstName,
          middleName: user.middleName || "",
          lastName: user.lastName,
          phoneNumber: user.phoneNumber || "",
        },
      };
    }
  });
};

const toggleItemSelection = (item) => {
  setSelectedItems((prev) => {
    const isSelected = !!prev[item.id]; // Check if the item is already selected
    if (isSelected) {
      const updatedSelection = { ...prev };
      delete updatedSelection[item.id]; // Remove the item if already selected
      return updatedSelection;
    } else {
      return {
        ...prev,
        [item.id]: {
          id: item.id,
          name: item.name,
          type: item.type,
          amount: '', // Default values
          quantity: '',
        },
      };
    }
  });
};

const handleItemInputChange = (itemId, field, value) => {
  setSelectedItems((prevSelected) => ({
    ...prevSelected,
    [itemId]: {
      ...prevSelected[itemId],
      [field]: value,
    },
  }));
};

  const filteredUsers = users.filter(user =>
    `${user.firstName || ''} ${user.middleName ? `${user.middleName} ` : ''}${user.lastName || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

const filteredItems = items.filter(item => {
  const matchesSearch = item.name.toLowerCase().includes(searchItemQuery.toLowerCase());
  const matchesType = selectedType === 'All' || 
                      (selectedType === 'Others' ? 
                        !['Food', 'Water', 'Clothes', 'Money'].includes(item.type) : 
                        item.type === selectedType);
  return matchesSearch && matchesType;
});

const handleSubmit = async () => {
  if (!title || !details || !location || !updatedDate) {
    window.alert("Validation Error", "Please fill in all required fields.");
    return;
  }

  if (!imageBase64) {
    window.alert("No Image Selected", "Please upload an event image.");
    return;
  }

  // Validate selected items
  const selectedItemList = Object.values(selectedItems).map((item) => {
    if (
      (item.type === 'Money' || item.type === 'eMoney') &&
      (!item.amount || isNaN(item.amount))
    ) {
      window.alert("Validation Error", `Please enter a valid amount for ${item.name}.`);
      return null;
    } else if (
      ['Food', 'Water', 'Clothes', 'Others'].includes(item.type) &&
      (!item.quantity || isNaN(item.quantity))
    ) {
      window.alert("Validation Error", `Please enter a valid quantity for ${item.name}.`);
      return null;
    }
    return {
      itemId: item.id,
      name: item.name,
      type: item.type,
      quantity: item.quantity || '',
      amount: item.amount || '',
    };
  });

  // Check if any item validation failed
  if (selectedItemList.some((item) => item === null)) {
    return;
  }

  // Prepare selected users data
  const selectedUserIds = Object.keys(selectedUsers);
  const selectedUserPhoneNumbers = Object.values(selectedUsers).map(
    (user) => user.phoneNumber
  );
  const selectedUserNames = Object.values(selectedUsers).map(
    (user) => `${user.firstName} ${user.middleName || ''} ${user.lastName}`.trim()
  );

  try {
    // Convert image to Base64
    const response = await fetch(imageBase64);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);

    reader.onloadend = async () => {
      const base64data = reader.result;

      // Format the date
      const formattedDate = formatDate(updatedDate);

      // Prepare event data
      const eventData = {
        title,
        details,
        location,
        date: formattedDate, // Use the formatted date
        image: base64data,
        selectedItems: selectedItemList,
        selectedUserIds,
        selectedUserPhoneNumbers,
        selectedUsers: selectedUserNames,
        createdAt: new Date().toISOString(),
      };

      // Add the event to the events collection
      const eventDocRef = await addDoc(collection(db, 'events'), eventData);
      await updateDoc(doc(db, 'events', eventDocRef.id), { eventId: eventDocRef.id });

      // Add the same event to the eventArchive collection
      await addDoc(collection(db, 'eventArchive'), {
        ...eventData,
        archivedDate: new Date().toISOString(),
        eventId: eventDocRef.id,
      });

      // Add notifications for selected users
      const notificationPromises = selectedUserIds.map((userId) =>
        addDoc(collection(db, 'notifications'), {
          userId,
          title: `${title}`,
          message: `A new event, ${title}, has been posted! Check it out and see if you've been selected. Don't miss out!`,
          eventId: eventDocRef.id,
          timestamp: new Date(),
          isRead: false,
        })
      );
      await Promise.all(notificationPromises);

      window.alert("Success", "Event created successfully and archived!");
    };
  } catch (error) {
    console.error("Error creating event:", error);
    window.alert("Error", "Failed to create event. Please try again.");
  }
};


const toggleSelectAllUsers = () => {
  if (!filteredUsers || filteredUsers.length === 0) return; // Prevent errors

  const allSelected = Object.keys(selectedUsers).length === filteredUsers.length;

  if (allSelected) {
    setSelectedUsers({}); // Deselect all
  } else {
    const newSelectedUsers = {};
    filteredUsers.forEach(user => {
      newSelectedUsers[user.id] = {
        id: user.id,
        firstName: user.firstName,
        middleName: user.middleName || "",
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || "",
      };
    });

    setSelectedUsers(newSelectedUsers);
  }
};

const toggleSelectAllItems = () => {
  const allSelected = Object.keys(selectedItems).length === filteredItems.length;

  if (allSelected) {
    setSelectedItems({});
  } else {
    const newSelectedItems = {};
    filteredItems.forEach(item => {
      newSelectedItems[item.id] = {
        id: item.id,
        name: item.name,
        type: item.type,
        quantity: 0, // Default quantity
        amount: '', // Default amount
      };
    });
    setSelectedItems(newSelectedItems);
  }
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
          <Text style={styles.contentText}>Create Event</Text>
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

        {/* WebCreateEvent Form */}
        <View style={styles.scrollableContainer}>
          <FlatList
            data={[{ key: 'form' }]}
            renderItem={() => (
              <View style={styles.formcontainer}>

                <TextInput
                  style={styles.inputeventtitle}
                  placeholder="Event Title"
                  value={title}
                  onChangeText={setTitle}
                />
                <TextInput
                  style={styles.inputdetails}
                  placeholder="Event Details"
                  value={details}
                  onChangeText={setDetails}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <TextInput
                  style={styles.inputlocation}
                  placeholder="Location"
                  value={location}
                  onChangeText={setLocation}
                />
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                  <Ionicons name="calendar" size={40}/>
                  <Text style={styles.datebanner}>{updatedDate.toLocaleDateString()}</Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <View style={styles.datePickerContainer}>
                    <DateTimePicker
                      selected={updatedDate}
                      onChange={(date) => {
                        setUpdatedDate(date); // Update state with the selected date
                        setShowDatePicker(false); // Hide the date picker after selection
                      }}
                      dateFormat="MM/dd/yyyy"
                      className="react-datepicker" // Add custom class for styling, if needed
                    />
                  </View>
                )}

                <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
                  <Ionicons name="image" size={40} color="black" />
                  <Text style={styles.banner}>Upload Event Image</Text>
                </TouchableOpacity>

                {imageBase64 && (
  <TouchableOpacity onPress={() => setImageModalVisible(true)}>
    <Image source={{ uri: imageBase64 }} style={styles.imagePreview} />
  </TouchableOpacity>
)}


<Modal
  visible={isImageModalVisible}
  transparent={true}
  onRequestClose={() => setImageModalVisible(false)}
>
  <View style={styles.modalContainer}>
    <TouchableOpacity
      style={styles.modalBackground}
      activeOpacity={1}
      onPress={() => setImageModalVisible(false)}
    >
      <Image source={{ uri: imageBase64 }} style={styles.fullSizeImage} />
    </TouchableOpacity>
  </View>
</Modal>

               <View style={styles.rowContainer}>
  {/* Search and Scroll for Users */}
  <View style={styles.columnContainer}>
    <Text style={styles.sectionTitle}>Select Beneficiaries</Text>
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={24} color="#aaa" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search Beneficiaries..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
    <View style={styles.selectAllContainer}>
      <Checkbox
        value={Object.keys(selectedUsers).length === filteredUsers.length}
        onValueChange={toggleSelectAllUsers}
      />
      <Text style={styles.selectAllText}>Select All Beneficiaries</Text>

      <FlatList
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Checkbox
              value={!!selectedUsers[item.id]}
              onValueChange={() => toggleUserSelection(item)}
            />
            <Text style={styles.userName}>
              {item.firstName} {item.middleName ? `${item.middleName} ` : ''}{item.lastName}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.noDataText}>No users found</Text>}
      />
    </View>
  </View>

  {/* Search and Scroll for Items */}
  <View style={styles.columnContainer}>
    <Text style={styles.itemsectionTitle}>Select Items</Text>
    <View style={styles.itemsearchContainer}>
      <Ionicons name="search" size={24} color="#aaa" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search Items..."
        value={searchItemQuery}
        onChangeText={setSearchItemQuery}
      />
    </View>

    <View style={styles.itemList}>
      <View style={styles.filterContainer}>

  <Text style={styles.filterLabel}>Filter by Type:</Text>
  <Picker
    selectedValue={selectedType}
    style={styles.filterPicker}
    onValueChange={(itemValue) => {
      setSelectedType(itemValue);
      if (itemValue !== 'Others') {
        setCustomType(''); // Clear custom type when not selecting "Others"
      }
    }}>
    <Picker.Item label="All" value="All" />
    <Picker.Item label="Food" value="Food" />
    <Picker.Item label="Water" value="Water" />
    <Picker.Item label="Clothes" value="Clothes" />
    <Picker.Item label="Money" value="Money" />
    <Picker.Item label="Others" value="Others" />
  </Picker>
</View>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Checkbox
              value={!!selectedItems[item.id]}
              onValueChange={() => toggleItemSelection(item)}
            />
            <Text style={styles.itemName}>{item.name}</Text>
            {selectedItems[item.id] && (
              <View style={styles.inputGroup}>
                {['Food', 'Water', 'Clothes', 'Others'].includes(item.type) ? (
                  <TextInput
                    style={styles.qtyinput}
                    placeholder="Quantity"
                    keyboardType="numeric"
                    value={selectedItems[item.id]?.quantity || ''}
                    onChangeText={(value) => handleItemInputChange(item.id, 'quantity', value)}
                  />
                ) : item.type === 'Money' || item.type === 'eMoney' ? (
                  <TextInput
                    style={styles.amtinput}
                    placeholder="Amount"
                    keyboardType="numeric"
                    value={selectedItems[item.id]?.amount || ''}
                    onChangeText={(value) => handleItemInputChange(item.id, 'amount', value)}
                  />
                ) : item.customType === 'Others' ? (
                  <TextInput
                    style={styles.qtyinput}
                    placeholder="Quantity"
                    value={selectedItems[item.id]?.quantity || ''}
                    onChangeText={(value) => handleItemInputChange(item.id, 'quantity', value)}
                  />
                ) : null}
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.noDataText}>No items found</Text>}
      />
    </View>
  </View>
</View>
                <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>Create Event</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
}

// Styles for both components
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
  content: {
    flex: wp('100%'),
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollableContainer: {
    maxHeight: hp('85%'),
    marginBottom: hp('1%'),
    overflow: 'hidden',
  },
  formcontainer: {
    flex: wp('100%'),
  },
  inputeventtitle: {
    position: 'relative',
    top: hp('2%'),
    left: wp('0%'),
    width: wp('38%'),
    padding: hp('1%'),
    marginVertical: hp('1%'),
    borderWidth: wp('0.1%'),
    borderColor: '#ddd',
    borderRadius: hp('1%'),
    backgroundColor: '#f9f9f9',
    fontSize: hp('2%'),
    elevation: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: wp('0%'), height: hp('0.1%') },
    shadowOpacity: hp('0.03%'),
    shadowRadius: hp('0.1%'),
  },
  inputlocation: {
    position: 'relative',
    bottom: hp('36.9%'),
    left: wp('40%'),
    width: wp('38%'),
    padding: hp('1%'),
    marginVertical: hp('1%'),
    borderWidth: wp('0.1%'),
    borderColor: '#ddd',
    borderRadius: hp('1%'),
    backgroundColor: '#f9f9f9',
    fontSize: hp('2%'),
    elevation: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: wp('0%'), height: hp('0.1%') },
    shadowOpacity: hp('0.03%'),
    shadowRadius: hp('0.1%'),
  },
  inputdetails: {
    position: 'relative',
    top: hp('5%'),
    left: wp('0%'),
    width: wp('78%'),
    height: hp('30%'),
    padding: hp('1%'),
    marginVertical: hp('1%'),
    borderWidth: wp('0.1%'),
    borderColor: '#ddd',
    borderRadius: hp('1%'),
    backgroundColor: '#f9f9f9',
    fontSize: hp('2%'),
    elevation: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: wp('0%'), height: hp('0.1%') },
    shadowOpacity: hp('0.03%'),
    shadowRadius: hp('0.1%'),
  },
  uploadButton: {
    flexDirection: 'row',
    width: wp('15%'),
    bottom: hp('5%'),
    left: wp('0%'),
  },
  banner: {
    fontSize: 16,
    color: '#000',
    marginTop: hp('1%'),
  },
  imagePreview: {
    bottom: hp('5%'),  
    left: wp('0%'),
    width: wp('35%'),
    height: hp('35%'),
    padding: hp('1%'),
    borderWidth: wp('0.1%'),
    borderColor: '#ddd',
    borderRadius: hp('1%'),
    backgroundColor: '#f9f9f9',
    elevation: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: wp('0%'), height: hp('0.1%') },
    shadowOpacity: hp('0.03%'),
    shadowRadius: hp('0.1%'),
  },
  modalContainer: {
    flex: wp('100%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent black background
  },
  modalBackground: {
    flex:  wp('100%'),
    justifyContent: 'center',
    alignItems: 'center',
    width: wp('100%'),
  },
  fullSizeImage: {
    width: wp('90%'), // 90% of screen width
    height: hp('60%'), // 60% of screen height
    resizeMode: 'contain', // Ensure the image fits within the container
  },
  searchContainer: {
    left: wp('0%'),
    width: wp('38%'),
    padding: 10,
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
   itemsearchContainer: {
    width: wp('38%'),
    padding: 10,
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
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    position: 'absolute',
    left: '6%',
    width: '90%',
    height: 35,
    fontSize: 14,
  },
  userList: {
    maxHeight: 100,
    marginBottom: 15,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userName: {
    fontSize: 14,
    marginLeft: 8,
  },
  itemList: {
    width: wp('38%'),
    padding: 10,
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  inputGroup: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    left: wp('0%'),
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  itemsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
  submitButton: {
    width: '50%',
    paddingVertical: 15,
    backgroundColor: '#00A600',
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  submitButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qtyinput: {
    height: 30,
    width: 80,
    borderColor: '#ccc',
    borderWidth: 1,
    marginLeft: 10,
    textAlign: 'center',
    fontSize: 12,
  },
  amtinput: {
    height: 30,
    width: 80,
    borderColor: '#ccc',
    borderWidth: 1,
    marginLeft: 10,
    textAlign: 'center',
    fontSize: 12,
  },
  selectAllText: {
    top: -18,
    left: 10,
    marginLeft: 8,
    fontSize: 14,
    color: '#000',
  },
  selectAllContainer: {
    left: wp('0%'),
    width: wp('38%'),
    padding: 10,
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
  dateButton: {
    flexDirection: 'row',
    width: wp('10%'),
    top: hp('0.5%'),
    left: wp('40.5%'),
  },
  datebanner: {
    marginTop: hp('1.5%'),
    fontSize: wp('1%'),
    color: '#000',
  },
  datePickerContainer: {
    bottom: hp('5.5%'),
    left: wp('48%'),
    width: wp('14.9%'),
    borderWidth: wp('0.1%'),
    borderColor: '#ddd',
    borderRadius: hp('1%'),
    backgroundColor: '#f9f9f9',
    fontSize: hp('2%'),
    elevation: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: wp('0%'), height: hp('0.1%') },
    shadowOpacity: hp('0.03%'),
    shadowRadius: hp('0.1%'),
  },
  // Container for the row layout
  rowContainer: {
    flexDirection: 'row', // Place children side by side
    justifyContent: 'space-between', // Add space between the two columns
    marginHorizontal: 10, // Add horizontal margin for spacing
  },

  // Container for each column (Beneficiaries and Items)
  columnContainer: {
    flex: wp('100%'), // Each column takes equal space
    marginHorizontal: 5, // Add spacing between columns
  },
    filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  filterPicker: {
    marginTop: 3  ,
    height: 20,
    width: 100,
  },
});