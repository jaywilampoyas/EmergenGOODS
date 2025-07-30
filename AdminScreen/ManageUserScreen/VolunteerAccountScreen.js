import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { auth } from '../../firebase'; // Adjusted Firebase config import path
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc } from 'firebase/firestore'; // Import Firestore
import Icon from 'react-native-vector-icons/Ionicons'; // Import Ionicons

const { width, height } = Dimensions.get('window'); // Get the device dimensions
const db = getFirestore(); // Initialize Firestore

export default function VolunteerAccount({ navigation }) {
    const [fullName, setFullName] = useState(''); // State for full name
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Function to handle account creation
    const handleCreateAccount = async () => {
        if (fullName === '' || email === '' || password === '' || confirmPassword === '') {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if the email ends with @volunteer.com
            if (email.endsWith('@volunteer.com')) {
                // Store user data in Firestore
                await setDoc(doc(db, 'volunteers', user.uid), {
                    fullName, // Store full name
                    email: user.email,
                    uid: user.uid,
                });
            }

            Alert.alert('Success', 'Volunteer account created successfully');
            setFullName(''); // Clear input fields
            setEmail(''); 
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prevState => !prevState);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(prevState => !prevState);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.title}>Create Volunteer Account</Text>

            {/* Full Name Input */}
            <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
            />
            {/* Email Input */}
            <TextInput
                style={styles.input}
                placeholder="example@volunteer.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            {/* Password Input */}
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
                    <Icon name={showPassword ? 'eye' : 'eye-off'} size={24} color="#666" />
                </TouchableOpacity>
            </View>
            {/* Confirm Password Input */}
            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.eyeIcon}>
                    <Icon name={showConfirmPassword ? 'eye' : 'eye-off'} size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleCreateAccount}>
                <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        paddingHorizontal: width * 0.1, // Responsive horizontal padding
    },
    backButton: {
        position: 'absolute',
        top: height * 0.060, // Responsive top position
        left: width * 0.05, // Responsive left position
        padding: 10,
        backgroundColor: '#00A600',
        borderRadius: 50,
        elevation: 5,
    },
    title: {
        fontSize: width * 0.06, // Responsive font size
        fontWeight: 'bold',
        marginBottom: height * 0.03, // Responsive margin
    },
    input: {
        width: '100%', // Full width
        height: height * 0.06, // Responsive height
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: height * 0.02, // Responsive margin
    },
    passwordContainer: {
        width: '100%', // Full width
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: height * 0.02, // Responsive margin
    },
    passwordInput: {
        flex: 1,
        height: height * 0.06, // Responsive height
        paddingHorizontal: 10,
    },
    eyeIcon: {
        padding: 10,
    },
    button: {
        width: '100%', // Full width
        height: height * 0.06, // Responsive height
        backgroundColor: '#00A600',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: width * 0.05, // Responsive font size
        fontWeight: 'bold',
    },
});
