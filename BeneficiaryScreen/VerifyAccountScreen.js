import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Alert, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Import Picker component
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { auth } from '../firebase';
import * as FileSystem from 'expo-file-system';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');

export default function VerifyAccount({ navigation }) {
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        gender: '',
        age: '',
        homeAddress: '',
        emailAddress: '',
        phoneNumber: '',
        birthDay: '',
        placeOfBirth: '',
        occupation: '',
        civilStatus: '',
    });

    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [verifiedID, setVerifiedID] = useState(null);
    const [barangayClearance, setBarangayClearance] = useState(null);
    const [selectedIDType, setSelectedIDType] = useState(''); // State for selected ID type

    const idTypes = [
        'e-Card / UMID',
        'Employee’s ID / Office ID',
        'Driver’s License',
        'Professional Regulation Commission (PRC) ID',
        'Passport',
        'Senior Citizen ID',
        'SSS ID',
        'COMELEC / Voter’s ID / Registration Form',
        'Philippine Identification (PhilID / ePhilID)',
        'NBI Clearance',
        'Integrated Bar of the Philippines (IBP) ID',
        'Firearms License',
        'AFPSLAI ID',
        'PVAO ID',
        'AFP Beneficiary ID',
        'BIR (TIN)',
        'Pag-ibig ID',
        'Person’s With Disability (PWD) ID',
        'Solo Parent ID',
        'Pantawid Pamilya Pilipino Program (4Ps) ID',
        'Barangay ID',
        'Philippine Postal ID',
        'Phil-health ID',
        'School ID',
        'Other valid government-issued IDs or documents with picture and signature',
    ];

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const db = getFirestore();
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const userSnapshot = await getDoc(userRef);

            if (userSnapshot.exists()) {
                const userData = userSnapshot.data();

                setFormData((prevData) => ({
                    ...prevData,
                    firstName: userData.firstName || '',
                    middleName: userData.middleName || '',
                    lastName: userData.lastName || '',
                    suffix: userData.suffix || '',
                    emailAddress: userData.email || '',
                    phoneNumber: userData.mobileNumber || '',
                }));
            } else {
                Alert.alert('Error', 'No user data found for the current account.');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            Alert.alert('Error', 'An error occurred while fetching user data.');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData((prevData) => ({ ...prevData, [field]: value }));
    };

    const handleDateChange = (event, selectedDate) => {
        setDatePickerVisible(false);
        if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            handleInputChange('birthDay', formattedDate);
        }
    };

    const handleImageUpload = async (imageType) => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission to access media library is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const uri = result.assets[0].uri;

            // Convert image URI to Base64
            const base64Data = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Store the base64 string in the appropriate state
            if (imageType === 'verifiedID') {
                setVerifiedID(`data:image/jpeg;base64,${base64Data}`);
            } else if (imageType === 'barangayClearance') {
                setBarangayClearance(`data:image/jpeg;base64,${base64Data}`);
            }
        } else {
            Alert.alert("Image selection cancelled or failed. Please try again.");
        }
    };

    const handleSubmit = async () => {
    try {
        const db = getFirestore();
        const pendingVerificationsRef = collection(db, 'pendingVerifications');
        const verificationNotificationsRef = collection(db, 'verificationNotifications'); // For notifying admin
        const verificationArchiveRef = collection(db, 'verificationArchive'); // Archive collection

        const verificationData = {
            ...formData,
            verifiedID,
            barangayClearance,
            selectedIDType, // Include the selected ID type in the data
            userId: auth.currentUser.uid, // To track the user for admin verification
            verificationStatus: 'Pending', // Initial status for admin to verify
            submittedAt: new Date(), // Timestamp for submission
        };

        // Set document in 'pendingVerifications' with user UID as ID
        await setDoc(doc(pendingVerificationsRef, auth.currentUser.uid), verificationData);

        // Archive the verification data
        await setDoc(doc(verificationArchiveRef, auth.currentUser.uid), {
            ...verificationData,
            archivedAt: new Date(), // Timestamp for archiving
        });

        // Add notification for the admin about the new pending account
        await setDoc(doc(verificationNotificationsRef, auth.currentUser.uid), {
            message: `New pending account added for verification: ${formData.firstName} ${formData.lastName}`,
            userId: auth.currentUser.uid, // Store a reference to the user
            timestamp: new Date(), // Timestamp of when the notification is added
            status: 'Pending', // Pending notification status
        });

        Alert.alert('Success', 'Account verification details submitted successfully');
        navigation.goBack();
    } catch (error) {
        console.error('Error saving data:', error);
        Alert.alert('Error', 'There was an issue submitting your information. Please try again.');
    }
};

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Verify Account</Text>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
                {/* Form fields */}
                <TextInput placeholder="First Name" value={formData.firstName} onChangeText={(value) => handleInputChange('firstName', value)} style={styles.input} />
                <TextInput placeholder="Middle Name" value={formData.middleName} onChangeText={(value) => handleInputChange('middleName', value)} style={styles.input} />
                <TextInput placeholder="Last Name" value={formData.lastName} onChangeText={(value) => handleInputChange('lastName', value)} style={styles.input} />
                <TextInput placeholder="Suffix (e.g., Jr., Sr., III)" value={formData.suffix} onChangeText={(value) => handleInputChange('suffix', value)} style={styles.input} />
                <TextInput placeholder="Gender" value={formData.gender} onChangeText={(value) => handleInputChange('gender', value)} style={styles.input} />
                <TextInput placeholder="Age" value={formData.age} onChangeText={(value) => handleInputChange('age', value)} keyboardType="numeric" style={styles.input} />
                <TextInput placeholder="Home Address (Building Number, Street Name, Barangay, City/Municipality, Province)" value={formData.homeAddress} onChangeText={(value) => handleInputChange('homeAddress', value)} style={styles.inputaddress} />
                <TextInput placeholder="Email Address" value={formData.emailAddress} onChangeText={(value) => handleInputChange('emailAddress', value)} keyboardType="email-address" style={styles.input} />
                <View style={styles.input}>
                <Text style={{ fontSize: 16, color: '#000', marginRight: 5 }}>+63</Text>
                                <TextInput
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(value) => {
                    // Remove non-numeric characters
                    const numericValue = value.replace(/\D/g, '');
                    
                    // Limit input to 10 digits
                    const limitedValue = numericValue.slice(0, 10);

                    // Format for display (XXX XXX XXXX)
                    const formattedValue = limitedValue
                    .replace(/(\d{3})(\d{3})(\d{0,4})/, '$1 $2 $3')
                    .trim();

                    // Store only raw numbers (without spaces)
                    handleInputChange('phoneNumber', limitedValue);
                }}
                keyboardType="phone-pad"
                />

                </View>

                <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.input}>
                    <Text>{formData.birthDay || 'Select Birthday'}</Text>
                </TouchableOpacity>
                {datePickerVisible && (
                    <DateTimePicker
                        value={new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                    />
                )}

                <TextInput placeholder="Place of Birth" value={formData.placeOfBirth} onChangeText={(value) => handleInputChange('placeOfBirth', value)} style={styles.input} />
                <TextInput placeholder="Occupation" value={formData.occupation} onChangeText={(value) => handleInputChange('occupation', value)} style={styles.input} />
                <TextInput placeholder="Civil Status" value={formData.civilStatus} onChangeText={(value) => handleInputChange('civilStatus', value)} style={styles.input} />

                {/* Dropdown for ID type */}
                <Text>Select ID Type:</Text>
                <Picker  style={styles.pickerInput}
                    selectedValue={selectedIDType}
                    onValueChange={(itemValue) => setSelectedIDType(itemValue)}
                >
                    {idTypes.map((idType, index) => (
                        <Picker.Item key={index} label={idType} value={idType}/>
                    ))}
                </Picker>

                {/* Upload buttons */}
                <TouchableOpacity onPress={() => handleImageUpload('verifiedID')} style={styles.uploadButton}>
                    <Text style={styles.uploadButtonText}>Upload Verified ID</Text>
                </TouchableOpacity>

                {verifiedID && (
                    <Image source={{ uri: verifiedID }} style={styles.uploadedImage} />
                )}

                <TouchableOpacity onPress={() => handleImageUpload('barangayClearance')} style={styles.uploadButton}>
                    <Text style={styles.uploadButtonText}>Upload Barangay Clearance</Text>
                </TouchableOpacity>

                {barangayClearance && (
                    <Image source={{ uri: barangayClearance }} style={styles.uploadedImage} />
                )}

                {/* Submit button */}
                <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                    <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
            </ScrollView>
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
    title: {
        position: 'absolute',
        top: hp ('2.5%'),
        left: wp ('30%'),
        fontSize: wp ('6%'),
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    formContainer: {
        padding: 20,
    }, 
    pickerInput: {
        fontSize: 16,
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginVertical: 5,
        color: '#000',
        backgroundColor: '#f8f8f8',
    },
    input: {
        width: '100%',
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginVertical: 5,
        flexDirection: 'row', 
        alignItems: 'center',
    },
    inputaddress: {
        width: '100%',
        padding: 10,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginVertical: 5,
        height: 60,
    },
    uploadButton: {
        backgroundColor: '#FF7D05',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginVertical: 5,
    },
    uploadButtonText: {
        color: '#fff',
    },
    uploadedImage: {
               width: 100,
        height: 100,
        borderRadius: 5,
        marginTop: 10,
    },
    submitButton: {
        backgroundColor: 'green',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
