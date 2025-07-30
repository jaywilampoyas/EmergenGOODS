import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Alert as NativeAlert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const db = getFirestore();

export default function ManageVolunteer({ navigation }) {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingVolunteer, setEditingVolunteer] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    // State for volunteer input fields
    const [fullName, setFullName] = useState(''); // Added fullName state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
     const [showPassword, setShowPassword] = useState(false);

    const fetchVolunteers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'volunteers'));
            const volunteerList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVolunteers(volunteerList);
        } catch (error) {
            console.error("Error fetching volunteers: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVolunteer = async (volunteerId) => {
        try {
            Alert.alert(
                "Confirm Deletion",
                "Are you sure you want to delete this volunteer?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", onPress: async () => {
                        await deleteDoc(doc(db, 'volunteers', volunteerId));
                        fetchVolunteers();
                    }},
                ]
            );
        } catch (error) {
            console.error("Error deleting volunteer: ", error);
            NativeAlert.alert("Error", error.message);
        }
    };

    const handleEditVolunteer = (volunteer) => {
        setFullName(volunteer.fullName); // Use fullName from the volunteer object
        setEmail(volunteer.email);
        setEditingVolunteer(volunteer.id); // Changed from volunteer.uid to volunteer.id
        setPassword(''); // Clear password field
        setModalVisible(true);
    };

    const updateVolunteer = async () => {
        if (!editingVolunteer) return;

        try {
            const volunteerRef = doc(db, 'volunteers', editingVolunteer);
            await updateDoc(volunteerRef, {
                fullName,
                email,
            });
            if (password) {
                // Reset password if provided
                await auth().sendPasswordResetEmail(email);
                NativeAlert.alert("Success", "Password reset email sent!");
            }
            NativeAlert.alert("Success", "Volunteer updated successfully!");
            setModalVisible(false);
            fetchVolunteers();
        } catch (error) {
            console.error("Error updating volunteer: ", error);
            NativeAlert.alert("Error", error.message);
        }
    };

        const togglePasswordVisibility = () => {
        setShowPassword(prevState => !prevState);
    };

    useEffect(() => {
        fetchVolunteers();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
             <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
                <Text style={styles.header}>Volunteers</Text>
            </View>
           

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    style={styles.listContainer}
                    data={volunteers}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.userCard}>
                            <Text style={styles.userName}>{item.fullName}</Text>
                            <Text>Email: {item.email}</Text>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleEditVolunteer(item)}
                            >
                                <Text style={styles.editButtonText}>Edit Volunteer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteVolunteer(item.id)}
                            >
                                <Text style={styles.deleteButtonText}>Delete Volunteer</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }} 
                />
            )}

            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>Edit Volunteer</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        value={fullName} // Reference the fullName state
                        onChangeText={setFullName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="New Password (leave empty if not changing)"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                            <Icon name={showPassword ? 'eye' : 'eye-off'} size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.saveButton} onPress={updateVolunteer}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp ('4%'),
        paddingTop: hp ('2%'),  
    },
    backButton: {
        width: wp ('10%'),
        height: hp ('4.5%'),
        borderRadius: 20,
        backgroundColor: '#00A600',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        position: 'absolute',
        top: hp ('2.5%'),
        left: wp ('35%'),
        fontSize: wp ('6%'),
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    listContainer: {
        paddingTop: 40,
    },
    userCard: {
        padding: 16,
        marginVertical: 8,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    userName: {
        fontWeight: 'bold',
    },
    editButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#00A600',
        borderRadius: 5,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    deleteButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: 'red',
        borderRadius: 5,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        padding: 16,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    modalTitle: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
passwordContainer: {
    flexDirection: 'row', // Align items horizontally
    alignItems: 'center', // Center items vertically
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
},
passwordInput: {
    flex: 1, // Allow the TextInput to take up the available space
    marginRight: 10, // Space between the input and the icon
},
eyeIcon: {
    padding: 5, // Optional: Add some padding for better touch area
},
    saveButton: {
        padding: 10,
        backgroundColor: '#FF7D05',
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        padding: 10,
        backgroundColor: 'red',
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
