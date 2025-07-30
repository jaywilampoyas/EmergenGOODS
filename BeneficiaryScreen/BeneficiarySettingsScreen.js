import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Modal, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');
const firestore = getFirestore();

export default function BeneficiarySettings({ navigation }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
    
    const [emailAddress, setEmailAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [occupation, setOccupation] = useState('');
    const [civilStatus, setCivilStatus] = useState('');

    const handleChangePassword = async () => {
        const auth = getAuth();
        const user = auth.currentUser;
        try {
            await updatePassword(user, newPassword);
            Alert.alert('Success', 'Password has been updated successfully!');
            setModalVisible(false);
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const fetchUserData = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const docRef = doc(firestore, 'pendingVerifications', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setEmailAddress(data.emailAddress || '');
                    setPhoneNumber(data.phoneNumber || '');
                    setOccupation(data.occupation || '');
                    setCivilStatus(data.civilStatus || '');
                } else {
                    Alert.alert('Error', 'No data found for the user.');
                }
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const updateUserProfile = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const docRef = doc(firestore, 'pendingVerifications', user.uid);
                await updateDoc(docRef, {
                    emailAddress: emailAddress,
                    phoneNumber: phoneNumber,
                    occupation: occupation,
                    civilStatus: civilStatus,
                });
                Alert.alert('Success', 'Profile has been updated successfully!');
                setEditProfileModalVisible(false);
            }
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const handleEditProfileOpen = () => {
        fetchUserData();
        setEditProfileModalVisible(true);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Settings</Text>
            </View>

            <TouchableOpacity style={styles.changebutton} onPress={() => setModalVisible(true)}>
                <Icon name="key" size={30} color="black" style={{ marginRight: 8 }} />
                <Text style={styles.changebuttonText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.editButton} onPress={handleEditProfileOpen}>
                <Icon name="create" size={30} color="black" style={{ marginRight: 8 }} />
                <Text style={styles.changebuttonText}>Edit Profile</Text>
            </TouchableOpacity>

<Modal
    animationType="slide"
    transparent={true}
    visible={modalVisible}
    onRequestClose={() => {
        setModalVisible(!modalVisible);
    }}
>
    <View style={styles.centeredView}>
        <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Current Password"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!currentPasswordVisible}
                />
                <TouchableOpacity
                    style={styles.icon}
                    onPress={() => setCurrentPasswordVisible(!currentPasswordVisible)}
                >
                    <Icon name={currentPasswordVisible ? "eye" : "eye-off"} size={24} color="grey" />
                </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!newPasswordVisible}
                />
                <TouchableOpacity
                    style={styles.icon}
                    onPress={() => setNewPasswordVisible(!newPasswordVisible)}
                >
                    <Icon name={newPasswordVisible ? "eye" : "eye-off"} size={24} color="grey" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
                <Text style={styles.buttonText}>Update Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    </View>
</Modal>

<Modal
    animationType="slide"
    transparent={true}
    visible={editProfileModalVisible}
    onRequestClose={() => {
        setEditProfileModalVisible(!editProfileModalVisible);
    }}
>
    <View style={styles.centeredView}>
        <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={emailAddress}
                onChangeText={setEmailAddress}
            />
            <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
            />
            <TextInput
                style={styles.input}
                placeholder="Occupation"
                value={occupation}
                onChangeText={setOccupation}
            />
            <TextInput
                style={styles.input}
                placeholder="Civil Status"
                value={civilStatus}
                onChangeText={setCivilStatus}
            />
            <TouchableOpacity style={styles.button} onPress={updateUserProfile}>
                <Text style={styles.buttonText}>Update Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditProfileModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    </View>
</Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp ('5%'),
        paddingTop: hp ('2%'),
    },
    backButton: {
        width: wp ('10%'),
        height: hp ('4.6%'),
        borderRadius: 20,
        backgroundColor: '#00A600',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        position: 'absolute',
        top: hp ('2.5%'),
        left: wp ('37%'),
        fontSize: wp ('6%'),
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },

    cancelbutton: {
        flexDirection: 'row',
        backgroundColor: 'red',
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 12,
        borderRadius: 50,
    },
    changebutton: {
        flexDirection: 'row',
        padding: 10,
        justifyContent: 'left',
        alignItems: 'left',
        marginVertical: 12,
        borderRadius: 50,
    },
    changebuttonText: {
        color: 'black',
        fontSize: 25,    
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
    },
    input: {
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        flex: 1,
    },
    icon: {
        position: 'absolute',
        right: 10,
        height: 40,
        justifyContent: 'center',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        position: 'relative',
        width: '100%',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        width: '100%',
        backgroundColor: '#f9f9f9',
        marginBottom: 10,
    },
    icon: {
        position: 'absolute',
        right: 15,
        height: 40,
        justifyContent: 'center',
    },
    button: {
        backgroundColor: '#00A600',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    cancelButton: {
        backgroundColor: 'red',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    editButton: {
       flexDirection: 'row',
    padding: 10,
    justifyContent: 'flex-start', // Align the button's content to the left
    alignItems: 'center',
    marginVertical: 12,
    borderRadius: 50,
    alignSelf: 'flex-start', // Align the button itself to the left within the parent container
},

});
