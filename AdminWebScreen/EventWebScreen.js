import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, updateDoc, doc, deleteDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the path based on your Firebase config file
import DateTimePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import * as ImagePicker from 'expo-image-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const eventicon = require('../Icons/eventicon.png');
const inventoryicon = require('../Icons/inventoryicon.png');
const sendnotificationicon = require('../Icons/sendnotificationicon.png');
const reporticon = require('../Icons/reporticon.png');
const manageusericon = require('../Icons/manageusericon.png');
const logouticon = require('../Icons/logouticon.png');
const dashboardicon = require('../Icons/dashboardicon.png');

export default function WebEvent({ navigation }) {
  // State for AdminWebHome functionality
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const [manageUserDropdown, setManageUserDropdown] = useState(false);
  const [eventDropdown, setEventDropdown] = useState(false);

  // State for WebEvent functionality
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [updatedTitle, setUpdatedTitle] = useState('');
  const [updatedDetails, setUpdatedDetails] = useState('');
  const [updatedLocation, setUpdatedLocation] = useState('');
  const [updatedDate, setUpdatedDate] = useState(new Date());
  const [updatedImage, setUpdatedImage] = useState('');
  const [updatedSelectedUsers, setUpdatedSelectedUsers] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

  const formatDate = (date) => {
  if (!date) return 'No Date'; // Handle missing or invalid dates

  // If the date is a Firestore Timestamp, convert it to a JavaScript Date
  if (date.seconds) {
    const jsDate = new Date(date.seconds * 1000);
    return jsDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
      timeZone: 'Asia/Shanghai', // UTC+8 timezone
    });
  }

  // If the date is already a string, return it as is
  return date;
};

  // Fetch notifications (AdminWebHome)
  useEffect(() => {
    fetchNotifications();
  }, []);

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

useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
    const eventsList = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        details: data.details,
        location: data.location,
        date: data.date, // Ensure this matches the field name in Firestore
        image: data.image,
        selectedUsers: data.selectedUsers,
      };
    });
    setEvents(eventsList);
    setFilteredEvents(eventsList);
  });
  return unsubscribe;
}, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.details.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setUpdatedTitle(event.title);
    setUpdatedDetails(event.details);
    setUpdatedLocation(event.location);
    setUpdatedDate(event.date && event.date.seconds ? new Date(event.date.seconds * 1000) : new Date());
    setUpdatedImage(event.image || '');
    setUpdatedSelectedUsers(event.selectedUsers || []);
    setModalVisible(true);
  };

  const handleDateChange = (date) => {
    setUpdatedDate(date);
    setShowDatePicker(false);
  };

  const saveUpdatedEvent = async () => {
  if (selectedEvent) {
    const eventRef = doc(db, "events", selectedEvent.id);
    try {
      // Convert the updated date to a Firestore Timestamp
      const updatedDateTimestamp = Timestamp.fromDate(updatedDate);

      // Update the event in Firestore
      await updateDoc(eventRef, {
        title: updatedTitle,
        details: updatedDetails,
        location: updatedLocation,
        date: updatedDateTimestamp, // Use the correct field name
        image: updatedImage,
        selectedUsers: updatedSelectedUsers,
      });

      // Update the local state to reflect the changes
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                title: updatedTitle,
                details: updatedDetails,
                location: updatedLocation,
                date: updatedDateTimestamp, // Use the correct field name
                image: updatedImage,
                selectedUsers: updatedSelectedUsers,
              }
            : event
        )
      );

      // Close the modal and show a success message
      setModalVisible(false);
      window.alert("Success: Event updated successfully.");
    } catch (error) {
      console.error("Error updating event:", error);
      window.alert("Error: Failed to update event.");
    }
  }
};

  const toggleUserSelection = (user) => {
    setUpdatedSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(user)
        ? prevSelectedUsers.filter((selectedUser) => selectedUser !== user)
        : [...prevSelectedUsers, user]
    );
  };

  const handleDelete = async (eventId) => {
    const userConfirmed = window.confirm("Are you sure you want to delete this event?");
    if (userConfirmed) {
      try {
        await deleteDoc(doc(db, "events", eventId));
        setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
        setFilteredEvents((prevFilteredEvents) => prevFilteredEvents.filter((event) => event.id !== eventId));
        window.alert("Success: Event deleted successfully.");
      } catch (error) {
        console.error("Error deleting event:", error);
        window.alert("Error: Failed to delete the event.");
      }
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      window.alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          setUpdatedImage(base64data);
        };
      } catch (error) {
        console.error("Error converting image to Base64:", error);
        window.alert("Error", "Could not process the selected image. Please try again.");
      }
    }
  };

  const uniqueEvents = filteredEvents.filter(
  (event, index, self) => index === self.findIndex((e) => e.id === event.id)
);

const sortedEvents = uniqueEvents.sort((a, b) => {
  const dateA = a.date?.seconds ? a.date.seconds : 0; // Fallback to 0 if date is missing
  const dateB = b.date?.seconds ? b.date.seconds : 0; // Fallback to 0 if date is missing
  return sortOrder === 'newest' ? dateB - dateA : dateA - dateB; // Sort based on the selected order
});

const toggleSortOrder = () => {
  setSortOrder((prevOrder) => (prevOrder === 'newest' ? 'oldest' : 'newest'));
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
          <TouchableOpacity onPress={() => setEventDropdown(!eventDropdown)} style={styles.navButton}>
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
          <Text style={styles.contentText}>Manage Events</Text>
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

<TouchableOpacity onPress={toggleSortOrder} style={styles.sortButton}>
  <View style={styles.sortButtonContent}>
    <Ionicons
      name={sortOrder === 'newest' ? 'arrow-down' : 'arrow-up'} // Use arrow-down for newest to oldest, arrow-up for oldest to newest
      size={16}
      color="#000"
      style={styles.sortIcon}
    />
    <Text style={styles.sortButtonText}>
      {sortOrder === 'newest' ? 'Newest to Oldest' : 'Oldest to Newest'}
    </Text>
  </View>
</TouchableOpacity>

        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search events..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Event List */}
        <View style={styles.scrollableContainer}>
<FlatList
  data={sortedEvents}
  keyExtractor={(item) => item.id}
  numColumns={4}
  renderItem={({ item }) => (
    <View style={styles.eventCard}>
      {item.image && (
        <TouchableOpacity
          onPress={() => {
            setSelectedImage(item.image);
            setImageModalVisible(true);
          }}
        >
          <Image source={{ uri: item.image }} style={styles.eventImage} />
        </TouchableOpacity>
      )}
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDetails}>{item.details}</Text>
      <Text style={styles.eventLocation}>Location: {item.location}</Text>
      <Text style={styles.eventDate}>
        Date: {formatDate(item.date)} {/* Use the correct field name */}
      </Text>
      <View style={styles.selectedUsersContainer}>
        <Text style={styles.eventUsers}>Selected Users:</Text>
        <ScrollView style={styles.userscrollableContainer}>
          {item.selectedUsers && item.selectedUsers.length > 0 ? (
            item.selectedUsers.map((user, index) => (
              <Text key={index} style={styles.userItem}>{user}</Text>
            ))
          ) : (
            <Text style={styles.userItem}>None</Text>
          )}
        </ScrollView>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
  contentContainerStyle={styles.eventListContainer}
/>
        </View>

        {/* Edit Event Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
          accessible={true}
          accessibilityLabel="Edit Event Modal"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Event</Text>
              <TextInput
                style={styles.input}
                placeholder="Event Title"
                value={updatedTitle}
                onChangeText={setUpdatedTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Event Details"
                value={updatedDetails}
                onChangeText={setUpdatedDetails}
              />
              <TextInput
                style={styles.input}
                placeholder="Event Location"
                value={updatedLocation}
                onChangeText={setUpdatedLocation}
              />
              <TouchableOpacity onPress={pickImage}>
                <Text style={styles.input}>
                  {updatedImage ? 'Change Image' : 'Select Image'}
                </Text>
              </TouchableOpacity>

              {updatedImage && (
  <TouchableOpacity onPress={() => setImageModalVisible(true)}>
    <Image
      source={{ uri: updatedImage.startsWith('data:image') ? updatedImage : `data:image/jpeg;base64,${updatedImage}` }}
      style={styles.eventImage}
    />
  </TouchableOpacity>
)}

         {/* Image Modal */}
<Modal
  visible={isImageModalVisible}
  transparent={true}
  onRequestClose={() => setImageModalVisible(false)} // Close modal on Android back button
>
  <View style={styles.imageModalContainer}>
    <TouchableOpacity
      style={styles.imageModalBackground}
      activeOpacity={1}
      onPress={() => setImageModalVisible(false)} // Close modal when clicking outside the image
    >
      <Image
        source={{ uri: selectedImage }} // Display the selected image
        style={styles.fullSizeImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  </View>
</Modal>

              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Text style={styles.input}>Date: {updatedDate.toLocaleDateString()}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <View style={{ marginTop: 10 }}>
                  <DateTimePicker
                    selected={updatedDate}
                    onChange={(date) => {
                      setUpdatedDate(date);
                      setShowDatePicker(false);
                    }}
                    dateFormat="MM/dd/yyyy"
                    className="react-datepicker"
                  />
                </View>
              )}

              <View style={styles.userSelectionContainer}>
                <Text style={styles.userSelectionTitle}>Select Beneficiaries:</Text>
                <ScrollView style={styles.userscrollableContainer}>
                  {selectedEvent && selectedEvent.selectedUsers && selectedEvent.selectedUsers.length > 0 ? (
                    selectedEvent.selectedUsers.map((user, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => toggleUserSelection(user)}
                        style={[
                          styles.userItem,
                          updatedSelectedUsers.includes(user) && styles.userItemSelected
                        ]}
                      >
                        <Text style={[
                          styles.userText,
                          updatedSelectedUsers.includes(user) ? styles.selectedText : styles.unselectedText
                        ]}>
                          {user}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text>No beneficiaries available to select.</Text>
                  )}
                </ScrollView>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.saveButton} onPress={saveUpdatedEvent}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    alignSelf: 'center'
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
  searchBar: {
    alignSelf: 'center',
    width: wp('48%'),
    padding: wp('1%'),
    marginVertical: hp('1%'),
    borderWidth: wp('0.1%'),
    borderColor: '#ddd',
    borderRadius: wp('1%'),
    backgroundColor: '#fff',
    fontSize: wp('1%'),
    elevation: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: wp('0%'), height: hp('0.1%') },
    shadowOpacity: hp('0.03%'),
    shadowRadius: hp('0.1%'),
  },
  userscrollableContainer: {
    maxHeight: hp('10%'), // Set a maximum height for scrollable content
        marginBottom: hp('1%'),
        overflow: 'hidden', // Ensure the scrolling area doesn't overflow
  },
scrollableContainer: {
        maxHeight: hp('70%'), // Set a maximum height for scrollable content
        marginBottom: hp('1%'),
        overflow: 'hidden', // Ensure the scrolling area doesn't overflow
    },
eventListContainer: {
  padding: wp('2%'), // Add padding around the grid
},
eventCard: {
  left: wp('-2.5%'),
  width: wp('18%'),
  margin: wp('1%'), // Add margin between cards
  backgroundColor: '#f9f9f9',
  borderRadius: wp('1%'),
  padding: wp('1%'),
  shadowColor: '#000',
  shadowOffset: { width: wp('0%'), height: hp('0.1%') },
  shadowOpacity: hp('0.03%'),
  shadowRadius: hp('0.1%'),
  elevation: hp('1%'),
  borderWidth: wp('0.1%'),
},
    row: {
    marginBottom: 12, // Adds spacing between rows
  },
  eventImage: {
    width: wp('16%'),
    height: hp('20%'),
    borderRadius: wp('1%'),
    marginBottom: hp('1%'),
  },
  eventTitle: {
    fontSize: wp('1%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
  },
  eventDetails: {
    fontSize: wp('0.9%'),
    marginBottom: hp('1%'),
  },
  eventLocation: {
    fontSize: wp('0.9%'),
    color: '#555',
    marginBottom: hp('1%'),
  },
  eventDate: {
    fontSize: wp('0.9%'),
    color: '#555',
    marginBottom:   hp('1%'),
  },
  selectedUsersContainer: {
    marginVertical: hp('1%'),
  },
  eventUsers: {
    fontWeight: 'bold',
    marginBottom: hp('1%'),
  },
  userItem: {
    fontSize: wp('0.9%'),
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp('1%'),
  },
  editButton: {
    backgroundColor: '#00A600',
    borderRadius: wp('1%'),
    flex: wp('0.1%'),
    marginRight: wp('1%'),
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: wp('1%'),
    flex: wp('0.1%'),
  },
  modalContainer: {
    width: wp('50%'),
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    margin: wp('1%'),
    borderRadius: wp('1%'),
    padding: wp('1%'),
    elevation: hp('1%'),
  },
  modalTitle: {
    fontSize: wp('1.5%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
  },
  input: {
    width: wp('48%'),
    padding: wp('0.5%'),
    marginVertical: hp('1%'),
    borderWidth: wp('0.1%'),
    borderColor: '#ddd',
    borderRadius: wp('1%'),
    backgroundColor: '#f9f9f9',
    fontSize: wp('1%'),
    elevation: hp('1%'),
    shadowColor: '#000',
    shadowOffset: { width: wp('0%'), height: hp('0.1%') },
    shadowOpacity: hp('0.03%'),
    shadowRadius: hp('0.1%'),
  },
  userSelectionContainer: {
    marginTop: hp('1%'),
  },
  userSelectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userItemSelected: {
    backgroundColor: '#007BFF',
  },
  userText: {
    fontSize: 16,
  },
  selectedText: {
    color: '#fff',
  },
  unselectedText: {
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#00A600',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent black background
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  fullSizeImage: {
    width: wp('90%'), // 90% of screen width
    height: hp('60%'), // 60% of screen height
    resizeMode: 'contain', // Ensure the image fits within the container
  },
sortButton: {
  width: wp('15%'),
  padding: 8,
  borderRadius: 8,
  top: hp('7%'),
},
sortButtonContent: {
  flexDirection: 'row',
  alignItems: 'center', // Align icon and text vertically
},
sortIcon: {
  marginRight: 8, // Add spacing between the icon and the label
},
sortButtonText: {
  color: '#000',
  fontSize: 14,
  fontWeight: 'bold',
  lineHeight: 16, // Match the icon height for vertical alignment
},
});