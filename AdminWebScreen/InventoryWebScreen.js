import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, updateDoc, doc, addDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the path based on your Firebase config file
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Picker } from '@react-native-picker/picker';
import moment from 'moment';

const eventicon = require('../Icons/eventicon.png');
const inventoryicon = require('../Icons/inventoryicon.png');
const sendnotificationicon = require('../Icons/sendnotificationicon.png');
const reporticon = require('../Icons/reporticon.png');
const manageusericon = require('../Icons/manageusericon.png');
const logouticon = require('../Icons/logouticon.png');
const dashboardicon = require('../Icons/dashboardicon.png');

// Helper function to format numbers with commas
const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

// Helper function to format timestamps
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'No timestamp available';
  return moment(timestamp.toDate()).format('MMMM D, YYYY, h:mm A');
};

export default function WebInventory({ navigation }) {
  // State for AdminWebHome
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const [eventDropdown, setEventDropdown] = useState(false); // State for Event dropdown

  // State for WebInventory
  const [itemName, setItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [quantity, setQuantity] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donationDate, setDonationDate] = useState('');
  const [items, setItems] = useState([]);
  const [regularSearch, setRegularSearch] = useState('');
  const [monetarySearch, setMonetarySearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [customFilterType, setCustomFilterType] = useState('');
  const [sortOption, setSortOption] = useState('Newest');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState(['Food', 'Water', 'Clothes', 'Money']);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [otherName, setOtherName] = useState(''); // is the input type

  // Fetch notifications and items
  useEffect(() => {
    fetchNotifications();
    fetchEvents();
    fetchCategories();
  }, []);

  // Re-sort items whenever sortOption changes
  useEffect(() => {
    const sortedItems = [...items];
    if (sortOption === 'Newest') {
      sortedItems.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
    } else if (sortOption === 'Oldest') {
      sortedItems.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
    } else if (sortOption === 'Name') {
      sortedItems.sort((a, b) => a.name.localeCompare(b.name));
    }
    setItems(sortedItems);
  }, [sortOption]);

  // Functions for AdminWebHome
  const toggleNotifications = () => {
    setNotificationsVisible(!isNotificationsVisible);
  };

  const toggleEventDropdown = () => {
    setEventDropdown(!eventDropdown);
  };

  // Fetch notifications
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

  // Mark a notification as read or unread
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

  // Render a single notification item
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
  const handleDateChange = (text) => {
    const formattedDate = moment(text, "YYYY-MM-DD", true).isValid()
      ? moment(text).format("MMMM D, YYYY")
      : text;
    setDonationDate(formattedDate);
  };

  const fetchEvents = async () => {
    const unsubscribe = onSnapshot(collection(db, 'items'), (snapshot) => {
      const itemList = [];
      snapshot.forEach((doc) => {
        itemList.push({ id: doc.id, ...doc.data() });
      });

      // Apply sorting based on the selected sortOption
      let sortedItems = [...itemList];
      if (sortOption === 'Newest') {
        sortedItems.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      } else if (sortOption === 'Oldest') {
        sortedItems.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
      } else if (sortOption === 'Name') {
        sortedItems.sort((a, b) => a.name.localeCompare(b.name));
      }

      setItems(sortedItems); // Update the state with sorted items
    });

    return () => unsubscribe();
  };

  const addItem = async () => {
  try {
    let newQuantity = parseInt(quantity, 10) || 0;

    // Check if the selected category is a custom category
    const isCustomCategory = !['Food', 'Water', 'Clothes', 'Money'].includes(selectedCategory);

    if (selectedCategory === 'Money') {
      // Logic for monetary items (unchanged)
      let existingMoneyItem = items.find((item) =>
        item.name.toLowerCase() === itemName.toLowerCase() && item.type === 'Money'
      );

      if (existingMoneyItem) {
        await updateDoc(doc(db, 'items', existingMoneyItem.id), {
          amount: (existingMoneyItem.amount || 0) + newQuantity,
          totalAmount: (existingMoneyItem.totalAmount || 0) + newQuantity,
          donorName: donorName || existingMoneyItem.donorName || 'N/A',
          donationDate: donationDate || existingMoneyItem.donationDate || 'N/A',
          otherName: otherName || existingMoneyItem.otherName || 'N/A', // Add otherName
        });
      } else {
        await addDoc(collection(db, 'items'), {
          name: itemName,
          type: 'Money',
          amount: newQuantity,
          totalAmount: newQuantity,
          donorName: donorName || 'N/A',
          donationDate: donationDate || 'N/A',
          otherName: otherName || 'N/A', // Add otherName
          createdAt: new Date().toISOString(),
          customType: isCustomCategory ? selectedCategory : '', // No custom type for monetary items
        });
      }
    } else {
      // Logic for regular items
      let existingItem = items.find((item) =>
        item.name.toLowerCase() === itemName.toLowerCase() && item.type === selectedCategory
      );

      if (existingItem) {
        // Update the existing regular item
        await updateDoc(doc(db, 'items', existingItem.id), {
          quantity: (existingItem.quantity || 0) + newQuantity,
          totalQuantity: (existingItem.totalQuantity || 0) + newQuantity,
          donorName: donorName || existingItem.donorName || 'N/A',
          donationDate: donationDate || existingItem.donationDate || 'N/A',
          otherName: otherName || existingItem.otherName || 'N/A', // Add otherName
        });
      } else {
        // Add a new regular item
        await addDoc(collection(db, 'items'), {
          name: itemName,
          type: selectedCategory, // Use the selected category
          customType:  isCustomCategory ? selectedCategory : '', // Set customType to "Others" for custom categories
          quantity: newQuantity,
          totalQuantity: newQuantity,
          donorName: donorName || 'N/A',
          donationDate: donationDate || 'N/A',
          otherName: otherName || 'N/A', // Add otherName
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Reset form fields
    setItemName('');
    setSelectedCategory('Food');
    setQuantity('');
    setDonorName('');
    setDonationDate('');
    setOtherName(''); // Reset otherName
  } catch (e) {
    console.error('Error adding or updating document: ', e);
  }
};

  // Filter items based on search and type
const filteredItems = items.filter((item) => {
  if (filterType === 'All') {
    return true; // Show all items
  } else if (filterType === 'Custom') {
    // Filter by customType when filterType is 'Custom'
    return (
      item.customType &&
      item.customType.toLowerCase().includes(customFilterType.toLowerCase())
    );
  } else {
    // Filter by type for other cases (e.g., 'Food', 'Water', etc.)
    return item.type === filterType;
  }
});

const sortedRegularItems = filteredItems
  .filter((item) => 
    item.type !== 'Money' && 
    (
      item.name.toLowerCase().includes(regularSearch.toLowerCase()) || // Search by name
      (item.otherName && item.otherName.toLowerCase().includes(regularSearch.toLowerCase())) || // Search by otherName
      item.type.toLowerCase().includes(regularSearch.toLowerCase()) // Search by type
    )
  )
  .sort((a, b) => {
    if (sortOption === 'Newest') {
      return new Date(b.createdAt) - new Date(a.createdAt); // Sort by createdAt (newest first)
    } else if (sortOption === 'Oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt); // Sort by createdAt (oldest first)
    } else if (sortOption === 'Name') {
      return a.name.localeCompare(b.name); // Sort by name
    }
    return 0;
  });

// Updated search logic for monetary items
const sortedMoneyItems = filteredItems
  .filter((item) => 
    item.type === 'Money' && 
    (
      item.name.toLowerCase().includes(monetarySearch.toLowerCase()) || // Search by name
      (item.otherName && item.otherName.toLowerCase().includes(monetarySearch.toLowerCase())) || // Search by otherName
      item.type.toLowerCase().includes(monetarySearch.toLowerCase()) // Search by type
    )
  )
  .sort((a, b) => {
    if (sortOption === 'Newest') {
      return new Date(b.createdAt) - new Date(a.createdAt); // Sort by createdAt (newest first)
    } else if (sortOption === 'Oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt); // Sort by createdAt (oldest first)
    } else if (sortOption === 'Name') {
      return a.name.localeCompare(b.name); // Sort by name
    }
    return 0;
  });

  const saveCategoryToFirestore = async (newCategory) => {
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategory,
        createdAt: new Date().toISOString(),
      });
      console.log('Category saved to Firestore:', newCategory);
    } catch (error) {
      console.error('Error saving category to Firestore:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categoriesList = categoriesSnapshot.docs.map((doc) => doc.data().name);
      setCategories(['Food', 'Water', 'Clothes', 'Money', ...categoriesList]); // Merge default and Firestore categories
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const addCategory = async (newCategory) => {
    if (newCategory && !categories.includes(newCategory)) {
      await saveCategoryToFirestore(newCategory); // Save to Firestore
      setCategories([...categories, newCategory]); // Update local state
      setNewCategory(''); // Clear the input field
    }
  };

    const filteredCategories = categories.filter((category) =>
    category.toLowerCase().includes(searchTerm.toLowerCase())
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

        {/* Filter by Type and Sort by Dropdowns */}
        <View style={styles.filterSortContainer}>
          <View>
            <Text style={styles.filterLabel}>Filter by Category:</Text>
            <Picker
              selectedValue={filterType}
              onValueChange={(value) => setFilterType(value)}
              style={styles.filterpicker}
            >
              <Picker.Item label="All" value="All" />
              <Picker.Item label="Food" value="Food" />
              <Picker.Item label="Water" value="Water" />
              <Picker.Item label="Clothes" value="Clothes" />
              <Picker.Item label="Money" value="Money" />
              <Picker.Item label="Custom" value="Custom" />
            </Picker>
          </View>

          {filterType === 'Custom' && (
            <TextInput
              style={styles.customFilterInput}
              placeholder="Enter Custom Categories"
              value={customFilterType}
              onChangeText={setCustomFilterType}
            />
          )}

          <View>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <Picker
              selectedValue={sortOption}
              onValueChange={(value) => setSortOption(value)}
              style={styles.sortpicker}
            >
              <Picker.Item label="Newest" value="Newest" />
              <Picker.Item label="Oldest" value="Oldest" />
              <Picker.Item label="Name" value="Name" />
            </Picker>
          </View>
        </View>

        {/* Event Creation Form */}
        <View style={styles.eventForm}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.infoButton}>
            <Ionicons name="information-circle-outline" size={30} color="#000" />
          </TouchableOpacity>

          {/* Modal for Instructions */}
          <Modal
            visible={isModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Instructions</Text>
                </View>

                {/* Modal Body */}
                <ScrollView style={styles.modalBody}>
                  {/* Strict Instructions for Name Input */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Name Input:</Text>
                    <Text style={styles.sectionText}>
                      - The name must be unique for each item.
                      {"\n"}- Avoid special characters (e.g., @, #, $).
                      {"\n"}- Use descriptive names (e.g., "Rice Donation" or "Water Bottles").
                    </Text>
                  </View>

                  {/* Exact Matching Instructions */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Adding to Existing Items:</Text>
                    <Text style={styles.sectionText}>
                      - <Text style={styles.highlight}>Important:</Text> Names are case-sensitive and must match exactly, including spaces and punctuation.
                      {"\n"}- To add a quantity or amount to an existing item, ensure the <Text style={styles.highlight}>name and type</Text> match exactly.
                      {"\n"}- For example, "Rice Donation" and "Rice donation" are treated as different items.
                      {"\n"}- Similarly, "Water Bottles" and "Water.Bottles" are considered different.
                    </Text>
                  </View>

                  {/* Regular Items Instructions */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Regular Items:</Text>
                    <Text style={styles.sectionText}>
                      - Select the type (e.g., Food, Water, Clothes).
                      {"\n"}- Enter the quantity.
                      {"\n"}- Optionally, provide the donor name and donation date.
                    </Text>
                  </View>

                  {/* Monetary Items Instructions */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Monetary Items:</Text>
                    <Text style={styles.sectionText}>
                      - Select "Money" as the type.
                      {"\n"}- Enter the amount.
                      {"\n"}- Optionally, provide the donor name and donation date.
                    </Text>
                  </View>
                </ScrollView>

                {/* Close Button */}
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TextInput
            style={styles.Nameinput}
            placeholder="Item Name"
            value={itemName}
            onChangeText={setItemName}
          />

                      <TextInput
            style={styles.OtherNameinput}
            placeholder="Type"
            value={otherName}
            onChangeText={setOtherName}
          />

          <TouchableOpacity
  onPress={() => setDropdownVisible(true)}
  style={styles.Typepicker}
>
  <Text style={styles.dropdownButtonText}>
    {selectedCategory || 'Select Category'}
  </Text>
  <Ionicons name="chevron-down" size={20} color="#000" />
</TouchableOpacity>
          <TouchableOpacity onPress={() => setCategoryModalVisible(true)} style={styles.addCategoryButton}>
            <Text style={styles.addCategoryButtonText}>Add Category</Text>
          </TouchableOpacity>
          <Modal
            visible={isCategoryModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setCategoryModalVisible(false)}
          >
            <View style={styles.catmodalOverlay}>
              <View style={styles.catmodalContainer}>
                <Text style={styles.catmodalTitle}>Add New Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter New Category"
                  value={newCategory}
                  onChangeText={setNewCategory}
                />
                <TouchableOpacity onPress={() => {
                  addCategory(newCategory);
                  setCategoryModalVisible(false);
                }} style={styles.cataddButton}>
                  <Text style={styles.catbuttonText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.catcloseButton}>
                  <Text style={styles.catcloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TextInput
            style={styles.QMinput}
            placeholder={selectedCategory === 'Money' ? "Amount" : "Quantity"}
            value={quantity}
            onChangeText={(text) => setQuantity(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.Donorinput}
            placeholder="Donor Name (Optional)"
            value={donorName}
            onChangeText={setDonorName}
          />

          <TextInput
            style={styles.Dateinput}
            placeholder="Date of Donation (MM/DD/YYYY)"
            value={donationDate}
            onChangeText={handleDateChange}
          />

          <TouchableOpacity style={styles.addButton} onPress={addItem}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Container */}
      {isDropdownVisible && (
        <View style={styles.dropdownContainer}>
        <TouchableOpacity onPress={() => setDropdownVisible(false)} style={styles.xButton}>
                  <Text style={styles.xButtonText}>x</Text>
                </TouchableOpacity>
          {/* Search Bar */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={searchTerm}
            onChangeText={(text) => setSearchTerm(text)}
          />

          {/* Scrollable List of Categories */}
          <ScrollView style={styles.categoryList}>
            {filteredCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedCategory(category);
                  setDropdownVisible(false);
                  setSearchTerm(''); // Clear search term after selection
                }}
                style={styles.categoryItem}
              >
                <Text style={styles.categoryItemText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

        <View style={styles.sideBySideContainer}>
          {/* Regular Items Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.RegularSectionHeader}>Regular Items</Text>
            <TextInput
              style={styles.searchRegularInput}
              placeholder="Search Regular Items"
              value={regularSearch}
              onChangeText={setRegularSearch}
            />
            <View style={styles.Regularlist}>
              <View style={styles.listHeader}>
                <Text style={styles.labelcell}>Name</Text>
                <Text style={styles.labelcell}>Type</Text>
                <Text style={styles.labelcell}>Category</Text>
                <Text style={styles.labelcell}>Quantity</Text>
                <Text style={styles.labelcell}>Donor</Text>
                <Text style={styles.labelcell}>Date</Text>
                <Text style={styles.labelcell}>Total Quantity</Text>
              </View>
              <ScrollView style={styles.scrollableContainer}>
                {sortedRegularItems.map((item) => (
                  <View key={item.id} style={styles.dataRow}>
                    <Text style={styles.cell}>{item.name}</Text>
                    <Text style={styles.cell}>{item.otherName}</Text>
                    <Text style={styles.cell}>{item.type}</Text>
                    <Text style={styles.cell}>{formatNumber(item.quantity)}</Text>
                    <Text style={styles.cell}>{item.donorName || 'N/A'}</Text>
                    <Text style={styles.cell}>{item.donationDate || 'N/A'}</Text>
                    <Text style={styles.cell}>{formatNumber(item.totalQuantity)}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Monetary Items Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.MonetarySectionHeader}>Monetary</Text>
            <TextInput
              style={styles.searchMonetaryInput}
              placeholder="Search Monetary"
              value={monetarySearch}
              onChangeText={setMonetarySearch}
            />
            <View style={styles.monetarylist}>
              <View style={styles.listHeader}>
                <Text style={styles.labelcell}>Name</Text>
                <Text style={styles.labelcell}>Type</Text>
                <Text style={styles.labelcell}>Category</Text>
                <Text style={styles.labelcell}>Amount (₱)</Text>
                <Text style={styles.labelcell}>Donor</Text>
                <Text style={styles.labelcell}>Date</Text>
                <Text style={styles.labelcell}>Total Amount (₱)</Text>
              </View>
              <ScrollView style={styles.scrollableContainer}>
                {sortedMoneyItems.map((item) => (
                  <View key={item.id} style={styles.dataRow}>
                    <Text style={styles.cell}>{item.name}</Text>
                    <Text style={styles.cell}>{item.otherName}</Text>
                    <Text style={styles.cell}>{item.type}</Text>
                    <Text style={styles.cell}>{`₱${formatNumber(item.amount)}`}</Text>
                    <Text style={styles.cell}>{item.donorName || 'N/A'}</Text>
                    <Text style={styles.cell}>{item.donationDate || 'N/A'}</Text>
                    <Text style={styles.cell}>{`₱${formatNumber(item.totalAmount)}`}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
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
    width: wp('18%'),
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
  filterLabel: {
    position: 'absolute',
    top: hp('1%'),
    left: wp('28%'),
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  filterpicker: {
    position: 'absolute',
    top: hp('0.3%'),
    right: wp('26%'),
    height: hp('4.6%'),
    width: wp('15%'),
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2, // For shadow in Android
    shadowColor: '#000', // For shadow in iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customFilterInput: {
    position: 'absolute',
    top: hp('6%'),
    right: wp('26%'),
    height: hp('1%'),
    width: wp('15%'),
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2, // For shadow in Android
    shadowColor: '#000', // For shadow in iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sortLabel: {
    position: 'absolute',
    top: hp('1%'),
    left: wp('57%'),
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  sortpicker: {
    position: 'absolute',
    top: hp('0.3%'),
    right: wp('3%'),
    height: hp('4.6%'),
    width: wp('15%'),
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2, // For shadow in Android
    shadowColor: '#000', // For shadow in iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  Nameinput: {
    position: 'absolute',
    top: hp('12%'),
    right: wp('55%'),
    height: hp('4%'),
    width: wp('20%'),
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2, // For shadow in Android
    shadowColor: '#000', // For shadow in iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  Typepicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: hp('19%'),
    right: wp('55%'),
    height: hp('4 %'),
    width: wp('20%'),
    marginVertical: 10,
    paddingTop: 1,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2, // For shadow in Android
    shadowColor: '#000', // For shadow in iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  Typeinput: {
    position: 'absolute',
    top: hp('25.5%'),
    right: wp('55%'),
    height: hp('4%'),
    width: wp('20%'),
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2, // For shadow in Android
    shadowColor: '#000', // For shadow in iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  OtherNameinput: {
    position: 'absolute',
    top: hp('19%'),
    right: wp('30%'),
    height: hp('4%'),
    width: wp('20%'),
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2, // For shadow in Android
    shadowColor: '#000', // For shadow in iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  QMinput: {
    position: 'absolute',
    top: hp('12%'),
    left: wp('30%'),
    height: hp('4%'),
    width: wp('20%'),
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2, // For shadow in Android
    shadowColor: '#000', // For shadow in iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  Donorinput: {
    position: 'absolute',
    top: hp('12%'),
    left: wp('55%'),
    height: hp('4%'),
    width: wp('20%'),
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2, // For shadow in Android
    shadowColor: '#000', // For shadow in iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  Dateinput: {
    position: 'absolute',
    top: hp('19%'),
    left: wp('55%'),
    height: hp('4%'),
    width: wp('20%'),
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    elevation: 2, // For shadow in Android
    shadowColor: '#000', // For shadow in iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButton: {
    position: 'absolute',
    top: hp('28%'),
    left: wp('35%'),
    width: wp('10%'),
    backgroundColor: '#00A600',
    padding: 5,
    alignItems: 'center',
    borderRadius: 50,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sideBySideContainer: {
    top: hp('33%'),
    flexDirection: 'row', // Arrange sections side by side
    justifyContent: 'space-between', // Add space between sections
    paddingHorizontal: 10, // Add horizontal padding
  },
  sectionContainer: {
    flex: 1, // Each section takes equal width
    marginHorizontal: 5, // Add margin between sections
  },
  RegularSectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
  },
  MonetarySectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
  },
  searchRegularInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    margin: 10,
    backgroundColor: '#fff',
  },
  searchMonetaryInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    margin: 10,
    backgroundColor: '#fff',
  },
  Regularlist: {
    flex: wp('100%'),
    height: hp('30%'),
    backgroundColor: '#fff',
    borderRadius: wp('0.5%'),
    borderWidth: 1,
  },
  monetarylist: {
    flex: wp('100%'),
    backgroundColor: '#fff',
    borderRadius: wp('0.5%'),
    borderWidth: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderRadius: wp('0.5%'),
    borderBottomColor: 'black',
    backgroundColor: '#E5E4E2',
  },
  labelcell: {
    flex: 1,
    fontSize: wp('0.8%'),
    fontWeight: 'bold',
    textAlign: 'center',
    borderRightWidth: 1,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  cell: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
    borderRightWidth: 1,
  },
  infoButton: {
    position: 'absolute',
    top: hp('1%'),
    left: wp('-1%'),
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    left: '9%',
    width: '45%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalBody: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#ff6f61', // Coral color for highlights
  },
  closeButton: {
    backgroundColor: '#ff6f61', // Coral color for the button
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollableContainer: {
    maxHeight: hp('35%'), // Adjust the height as needed
  },
  addCategoryButton: {
    position: 'absolute',
    top: hp('1.8%'),
    left: wp('5%'),
    height: hp('4.6%'),
    width: wp('20%'),
    backgroundColor: '#00A600',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  addCategoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
  position: 'absolute', // Make the dropdown float above other elements
  top: hp('35%'), // Adjust the top position as needed
  left: wp('6%'), // Adjust the left position as needed
  width: wp('20%'), // Adjust the width as needed
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  backgroundColor: '#fff',
  overflow: 'hidden', // Ensure the content is clipped to the border radius
  zIndex: 1000, // Ensure the dropdown appears on top of other elements
  elevation: 5, // Add elevation for Android (shadow)
},
  searchInput: {
    height: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 2,
    paddingHorizontal: 10,
    margin: 2,
    backgroundColor: '#f9f9f9',
  },
  categoryList: {
    maxHeight: 150, // Limit the height of the scrollable list
  },
  categoryItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  xButtonText: {
    alignSelf: 'flex-end',
    marginRight: 10,
    fontSize: 22,
    color: '#000',
  },
  catmodalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catmodalContainer: {
    left: '9%',
    width: '30%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
    catmodalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  cataddButton: {
    top: hp('3.3%'),
    left: wp('0%'),
    width: wp('10%'),
    backgroundColor: '#00A600',
    padding: 5,
    alignItems: 'center',
    borderRadius: 50,
  },
  catbuttonText: {
        fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
   catcloseButton: {
    backgroundColor: '#ff6f61', // Coral color for the button
    top: hp('-1%'),
    left: wp('17%'),
    width: wp('10%'),
    padding: 5,
    alignItems: 'center',
    borderRadius: 50,
  },
  catcloseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});