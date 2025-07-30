import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TextInput, Image, Alert, StatusBar, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import Checkbox from 'expo-checkbox';
import * as FileSystem from 'expo-file-system';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');

export default function CreateEvent({ navigation }) {
    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const [date, setDate] = useState(new Date());
    const [show, setShow] = useState(false);
    const [location, setLocation] = useState('');
    const [imageBase64, setImageBase64] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState([]);
    const [searchItemQuery, setSearchItemQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState({});
    const [itemInputs, setItemInputs] = useState({});

    const onChange = (_, selectedDate) => {
        setShow(false);
        if (selectedDate) setDate(selectedDate);
    };

    const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
        Alert.alert("Permission Denied", "You need to grant permission to access the gallery!");
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
    setSelectedUsers((prevSelected) => {
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
                    middleName: user.middleName,
                    lastName: user.lastName,
                    phoneNumber: user.phoneNumber,
                },
            };
        }
    });
};

const toggleItemSelection = (item) => {
    setSelectedItems((prevSelected) => {
        const isSelected = prevSelected[item.id];
        if (isSelected) {
            const { [item.id]: _, ...rest } = prevSelected;
            return rest; // Remove the deselected item
        } else {
            return {
                ...prevSelected,
                [item.id]: {
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    amount: '',
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

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchItemQuery.toLowerCase())
    );

const handleSubmit = async () => {
    if (!title || !details || !location || !date) {
        Alert.alert("Validation Error", "Please fill in all required fields.");
        return;
    }

    if (!imageBase64) {
        Alert.alert("No Image Selected", "Please upload an event image.");
        return;
    }

    const selectedUserIds = Object.keys(selectedUsers);
    const selectedUserPhoneNumbers = Object.values(selectedUsers).map(user => user.phoneNumber);
    const selectedUserNames = Object.values(selectedUsers).map(
        user => `${user.firstName} ${user.middleName || ''} ${user.lastName}`.trim()
    );

    const selectedItemList = Object.values(selectedItems).map(item => ({
        itemId: item.id,
        name: item.name,
        quantity: item.quantity || '0',
        amount: item.amount || null,
    }));

    try {
        const response = await fetch(imageBase64);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);

        reader.onloadend = async () => {
            const base64data = reader.result;

            const eventData = {
                title,
                details,
                location,
                date, // Use raw date object here
                image: base64data,
                selectedItems: selectedItemList,
                selectedUserIds,
                selectedUserPhoneNumbers,
                selectedUsers: selectedUserNames,
                createdAt: new Date().toISOString(),
            };

            // Add the event to the events collection
            const eventDocRef = await addDoc(collection(db, 'events'), eventData);
            await updateDoc(eventDocRef, { eventId: eventDocRef.id });

            // Add notification for selected users
            const notificationPromises = selectedUserIds.map(userId =>
                addDoc(collection(db, 'notifications'), {
                    userId, // ID of the user being notified
                    title: `${title}`,
                    message: `You have been selected for the event ${title}. Please click the event for more details.`,
                    eventId: eventDocRef.id,
                    timestamp: new Date(),
                    isRead: false,
                })
            );
            await Promise.all(notificationPromises);

            Alert.alert("Success", "Event created successfully!");
            navigation.goBack();
        };
    } catch (error) {
        console.error("Error creating event:", error);
        Alert.alert("Error", "Failed to create event. Please try again.");
    }
};

const toggleSelectAllUsers = () => {
    const allSelected = Object.keys(selectedUsers).length === filteredUsers.length;
    if (allSelected) {
        setSelectedUsers({});
    } else {
        const newSelectedUsers = {};
        filteredUsers.forEach(user => {
            newSelectedUsers[user.id] = true;
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
            newSelectedItems[item.id] = true;
        });
        setSelectedItems(newSelectedItems);
    }
};


    return (
        <FlatList
            data={[{ key: 'form' }]}
            renderItem={() => (
                <View style={styles.container}>

                    <View style={styles.titleContainer}>
                     <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                        <Text style={styles.title}>Create Event</Text>
                    </View>

                    <TextInput
                        style={styles.input}
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
                        style={styles.input}
                        placeholder="Location"
                        value={location}
                        onChangeText={setLocation}
                    />
                    <View style={styles.dateAndUploadContainer}></View>
                    <TouchableOpacity onPress={() => setShow(true)} style={styles.datePickerButton}>
                        <Icon name="calendar" size={40} color="#000" />
                        <Text style={styles.datePickerText}>{date.toLocaleDateString()}</Text>
                    </TouchableOpacity>
                    {show && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            mode="date"
                            is24Hour={true}
                            onChange={onChange}
                        />
                    )}
<TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
    <Icon name="image" size={40} color="black" />
    <Text style={styles.banner}>Upload Event Image</Text>
</TouchableOpacity>

{imageBase64 && (
    <Image source={{ uri: imageBase64 }} style={styles.imagePreview} />
)}
                    {/* Search and Scroll for Users */}
                    <Text style={styles.sectionTitle}>Select Beneficiaries</Text>
                    <View style={styles.searchContainer}>
                        <Icon name="search" size={24} color="#aaa" style={styles.searchIcon} />
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
                    </View>
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

                    {/* Search and Scroll for Items */}
                    <Text style={styles.sectionTitle}>Select Items</Text>
                    <View style={styles.searchContainer}>
                        <Icon name="search" size={24} color="#aaa" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search Items..."
                            value={searchItemQuery}
                            onChangeText={setSearchItemQuery}
                        />
                    </View>

                        <View style={styles.selectAllContainer}>
    <Checkbox
        value={Object.keys(selectedItems).length === filteredItems.length}
        onValueChange={toggleSelectAllItems}
    />
    <Text style={styles.selectAllText}>Select All Items</Text>
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
                    {['Food', 'Water', 'Clothes'].includes(item.type) ? (
                        <TextInput
                            style={styles.qtyinput}
                            placeholder="Quantity"
                            keyboardType="numeric"
                            value={selectedItems[item.id]?.quantity || ''}
                            onChangeText={(value) => handleItemInputChange(item.id, 'quantity', value)}
                        />
                    ) : item.type === 'Money' ? (
                        <TextInput
                            style={styles.amtinput}
                            placeholder="Amount"
                            keyboardType="numeric"
                            value={selectedItems[item.id]?.amount || ''}
                            onChangeText={(value) => handleItemInputChange(item.id, 'amount', value)}
                        />
                    ) : null}
                </View>
            )}
        </View>
    )}
    ListEmptyComponent={<Text style={styles.noDataText}>No items found</Text>}
/>

                    <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                        <Text style={styles.submitButtonText}>Create Event</Text>
                    </TouchableOpacity>
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    backButton: {
        position: 'absolute',
        right: wp ('80%'),
        width: wp ('10%'),
        height: hp ('4.5%'),
        borderRadius: 20,
        backgroundColor: '#00A600',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp ('4.5%'),
        marginTop: hp ('2%'),
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 16,
    },
    inputdetails: {
        height: 150,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 16,
    },
    dateAndUploadContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    datePickerText: {
        fontSize: 20,
        color: '#000',
        marginLeft: 15,
    },
    uploadButton: {
        bottom: 40,
        flexDirection: 'row',
        alignSelf: 'flex-end'
    },
    banner: {
        top: 6,
        fontSize: 20,
        color: '#000',
        marginLeft: 5,
    },
    imagePreview: {
        width: width - 32,
        height: 200,
        borderRadius: 8,
        alignSelf: 'center',
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    searchIcon: {
        marginRight: 5,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
    },
    userList: {
        maxHeight: 150,
        marginBottom: 20,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    userName: {
        fontSize: 16,
        marginLeft: 10,
    },
    itemList: {
        maxHeight: 150,
        marginBottom: 20,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemName: {
        marginLeft: 10,
        fontSize: 16,
        flex: 1,
    },
    inputGroup: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    noDataText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        marginTop: 10,
    },
    submitButton: {
        backgroundColor: '#00A600',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    qtyinput: {
        height: 20,
        width: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        left: 70,
        textAlign: 'center',
    },
    amtinput: {
        height: 20,
         width: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        left: 70,
        textAlign: 'center',
    },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
},
selectAllText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
},
});
