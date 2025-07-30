import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, ScrollView, Alert, Modal, TextInput, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { collection, getDocs, deleteDoc, doc, updateDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from '../firebase'; // Adjust the path based on your Firebase config file
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');

export default function Event({ navigation }) {
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

    useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "events"), (snapshot) => {
        const eventsList = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Event data:', data); // Debugging
            return { id: doc.id, ...data };
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
            const filtered = events.filter(event =>
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

    // Check for valid date and set it; fallback to current date
    const eventDate = event.date && event.date.seconds ? 
        new Date(event.date.seconds * 1000) : 
        new Date();
    setUpdatedDate(eventDate);

    setUpdatedImage(event.image || '');
    setUpdatedSelectedUsers(event.selectedUsers || []);
    setModalVisible(true);
};


    const saveUpdatedEvent = async () => {
    if (selectedEvent) {
        const eventRef = doc(db, "events", selectedEvent.id);

        try {
            await updateDoc(eventRef, {
                title: updatedTitle,
                details: updatedDetails,
                location: updatedLocation,
                date: Timestamp.fromDate(updatedDate),
                image: updatedImage, // Save the Base64 image to Firestore
                selectedUsers: updatedSelectedUsers,
            });

            setEvents(events.map(event =>
                event.id === selectedEvent.id ? {
                    ...event,
                    title: updatedTitle,
                    details: updatedDetails,
                    location: updatedLocation,
                    date: { seconds: updatedDate.getTime() / 1000 },
                    image: updatedImage,
                    selectedUsers: updatedSelectedUsers,
                } : event
            ));
            setModalVisible(false);
            Alert.alert("Success", "Event updated successfully.");
        } catch (error) {
            console.error("Error updating event:", error);
            Alert.alert("Error", "Failed to update event.");
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
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete this event?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "events", eventId));
                            setEvents(events.filter(event => event.id !== eventId));
                            setFilteredEvents(filteredEvents.filter(event => event.id !== eventId));
                            Alert.alert("Success", "Event deleted successfully.");
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete event.");
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
        Alert.alert("Permission to access camera roll is required!");
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
                const base64data = reader.result; // Base64 string of the image
                setUpdatedImage(base64data); // Update the state with Base64 data
            };
        } catch (error) {
            console.error("Error converting image to Base64:", error);
            Alert.alert("Error", "Could not process the selected image. Please try again.");
        }
    }
};

    return (
        <View style={styles.container}>
           
            <View style={styles.headerContainer}>
             <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
                <Text style={styles.header}>Manage Events</Text>
            </View>

            <TouchableOpacity
                style={styles.createEventButton}
                onPress={() => navigation.navigate('CreateEvent')}
            >
                <Text style={styles.buttonText}>Create Event</Text>
            </TouchableOpacity>

                        <TextInput
                style={styles.searchBar}
                placeholder="Search events..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <ScrollView contentContainerStyle={styles.eventList}>
                {filteredEvents.map((event) => (
                    <View key={event.id} style={styles.eventCard}>
                        {event.image && <Image source={{ uri: event.image }} style={styles.eventImage} />}
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventDetails}>{event.details}</Text>
                        <Text style={styles.eventLocation}>Location: {event.location}</Text>
                        <Text style={styles.eventDate}>
    Date: {event.date && event.date.seconds ? 
        new Date(event.date.seconds * 1000).toLocaleDateString() : 
        'No Date'}
</Text>

                        <View style={styles.selectedUsersContainer}>
                            <Text style={styles.eventUsers}>Selected Users:</Text>
                            <ScrollView showsVerticalScrollIndicator={false} style={styles.usersList}>
                                {event.selectedUsers && event.selectedUsers.length > 0 ? (
                                    event.selectedUsers.map((user, index) => (
                                        <Text key={index} style={styles.userItem}>{user}</Text>
                                    ))
                                ) : (
                                    <Text style={styles.userItem}>None</Text>
                                )}
                            </ScrollView>
                        </View>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(event)}>
                                <Text style={styles.buttonText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(event.id)}>
                                <Text style={styles.buttonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

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
    <Image source={{ uri: updatedImage.startsWith('data:image') ? updatedImage : `data:image/jpeg;base64,${updatedImage}` }} style={styles.eventImage} />
)}
                        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.input}>
                                Date: {updatedDate.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
    <DateTimePicker
        value={updatedDate}
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
            setShowDatePicker(false); // Hide the date picker
            if (selectedDate) {
                setUpdatedDate(selectedDate); // Update state with the selected date
            }
        }}
    />
)}

                        <View style={styles.userSelectionContainer}>
                            <Text style={styles.userSelectionTitle}>Select Beneficiaries:</Text>
                            <ScrollView>
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    backButton: {
        position: 'absolute',
        right: wp ('87%'),
        width: wp ('10%'),
        height: hp ('4.5%'),
        borderRadius: 20,
        backgroundColor: '#00A600',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp ('5%'),
        marginTop: hp ('4.5%'),
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    searchBar: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginHorizontal: 20,
        marginBottom: 10,
    },
    createEventButton: {
        backgroundColor: '#00A600',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
        marginHorizontal: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    eventList: {
        paddingBottom: 80,
    },
    eventCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 2,
    },
    eventImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    eventTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    eventDetails: {
        fontSize: 16,
        marginBottom: 4,
    },
    eventLocation: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    eventDate: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    selectedUsersContainer: {
        marginVertical: 8,
    },
    eventUsers: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userItem: {
        fontSize: 14,
        color: '#555',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    editButton: {
        backgroundColor: '#00A600',
        borderRadius: 8,
        padding: 12,
        flex: 1,
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: '#f44336',
        borderRadius: 8,
        padding: 12,
        flex: 1,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        margin: 20,
        borderRadius: 8,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
    },
    userSelectionContainer: {
        marginTop: 20,
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
});
