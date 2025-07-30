import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

export default function WebManageUser({ navigation }) {
    return (
        <View style={styles.Maincontainer}>

                    <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#F5F5F5" />
            </TouchableOpacity>

            {/* Title */}
            <Text style={styles.title}>Manage Users</Text>
            </View>

        <View style={styles.container}>
            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('WebVolunteerAccount')}
                >
                    <Text style={styles.buttonText}>Create Volunteer Account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('WebManageBeneficiary')}
                >
                    <Text style={styles.buttonText}>Manage Beneficiary</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('WebManageVolunteer')}
                >
                    <Text style={styles.buttonText}>Manage Volunteer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('WebPendingAccount')}
                >
                    <Text style={styles.buttonText}>Verify Beneficiary</Text>
                </TouchableOpacity>
            </View>
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    Maincontainer: {
        flex: 1,
        backgroundColor: '#F9FAFB', 
    },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Light and clean background
        alignItems: 'center',
        paddingHorizontal: '10%', // Added horizontal padding for desktop
        paddingTop: '5%', // Added top padding for spacing
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 32,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB', // Light border for separation
        paddingTop: 32,
        paddingBottom: 32,
    },
    backButton: {
    backgroundColor: '#00A600',
    padding: 10,
    borderRadius: 50,
    marginLeft: 20,
    },
    title: {
        fontSize: 20, // Larger font for desktop
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        flex: 1, // Center-align the title
    },
    buttonContainer: {
        width: '100%',
        maxWidth: 900, // Center content and limit its width for readability
        marginTop: 24,
    },
    button: {
        width: '100%',
        paddingVertical: 16, // Comfortable padding for larger screens
        backgroundColor: '#FF7D05',
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB', // Subtle border for desktop structure
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Subtle shadow for buttons
        transition: 'all 0.3s ease', // Smooth hover effect
    },
    buttonText: {
        fontSize: 18, // Slightly larger font for desktop
        fontWeight: '500',
        color: '#FFFFFF',
    },
});