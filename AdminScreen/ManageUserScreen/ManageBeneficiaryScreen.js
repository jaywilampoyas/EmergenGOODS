import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../../firebase'; // Import your initialized auth from firebase.js
import { sendPasswordResetEmail } from 'firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const db = getFirestore();

export default function ManageBeneficiary({ navigation }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    // State for user input fields
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');

    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const userList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPasswordEmail = async (email) => {
        if (!email) {
            Alert.alert("Error", "Email address is required.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Error", "Please enter a valid email address.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert("Success", `Password reset email sent to ${email}`);
        } catch (error) {
            console.error("Error sending password reset email:", error);

            let errorMessage = "Failed to send password reset email.";
            if (error.code === 'auth/user-not-found') {
                errorMessage = "No user found with this email address.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address.";
            }

            Alert.alert("Error", errorMessage);
        }
    };

    const handleEditUser = (user) => {
        setFirstName(user.firstName);
        setMiddleName(user.middleName);
        setLastName(user.lastName);
        setEmail(user.email);
        setMobileNumber(user.mobileNumber);
        setEditingUser(user.id);
        setModalVisible(true);
    };

    const updateUser = async () => {
        if (!editingUser) return;

        try {
            const userRef = doc(db, 'users', editingUser);
            await updateDoc(userRef, {
                firstName,
                middleName,
                lastName,
                email,
            });
            Alert.alert("Success", "Beneficiary updated successfully!");
            setModalVisible(false);
            fetchUsers();
        } catch (error) {
            console.error("Error updating user: ", error);
            Alert.alert("Error", error.message);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
             <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
                <Text style={styles.header}>Beneficiaries</Text>
            </View>
           

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    style={styles.listContainer}
                    data={users}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.userCard}>
                            <Text style={styles.userName}>{item.firstName} {item.middleName} {item.lastName}</Text>
                            <Text>Email: {item.email}</Text>
                            <TouchableOpacity
                                style={styles.resetButton}
                                onPress={() => handleResetPasswordEmail(item.email)}
                            >
                                <Text style={styles.resetButtonText}>Reset Password via Email</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => handleEditUser(item)}
                            >
                                <Text style={styles.editButtonText}>Edit Beneficiary</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDeleteUser(item.id)}
                            >
                                <Text style={styles.deleteButtonText}>Delete Beneficiary</Text>
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
                    <Text style={styles.modalTitle}>Edit Beneficiary</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Middle Name"
                        value={middleName}
                        onChangeText={setMiddleName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={updateUser}>
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
        marginBottom: hp ('2%'),
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
        left: wp ('30%'),
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
    resetButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#ff5722',
        borderRadius: 5,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    editButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#28a745',
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
