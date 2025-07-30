import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import the Ionicons library

const { width, height } = Dimensions.get('window'); // Get the device dimensions

export default function ManageUser({ navigation }) {
    return (
        <View style={styles.container}>
            {/* Back arrow button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={width * 0.07} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.title}>Manage Users</Text>

            {/* Navigation buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('VolunteerAccount')}>
                    <Text style={styles.buttonText}>Create Volunteer Account</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ManageBeneficiary')}>
                    <Text style={styles.buttonText}>Manage Beneficiary</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ManageVolunteer')}>
                    <Text style={styles.buttonText}>Manage Volunteer</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PendingAccount')}>
                    <Text style={styles.buttonText}>Verify Beneficiary</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: height * 0.05, // Responsive vertical padding
    },
    title: {
        fontSize: width * 0.07, // Responsive font size
        fontWeight: 'bold',
        marginTop: height * 0.2, // Lower title position for spacing
        marginBottom: height * 0.04, // Additional space below the title
        textAlign: 'center',
    },
    buttonContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingTop: height * 0.02, // Spacing above the buttons
    },
    button: {
        width: width * 0.9,
        height: width * 0.16, // Responsive height
        paddingVertical: width * 0.03, // Responsive padding
        backgroundColor: '#FF7D05',
        borderRadius: 5,
        marginBottom: height * 0.02,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: width * 0.05, // Responsive font size
    },
    backButton: {
        position: 'absolute', // Place in the top-left corner
        top: height * 0.06, // Responsive top margin
        left: width * 0.05, // Responsive left margin
        padding: width * 0.02, // Responsive padding
        backgroundColor: '#00A600',
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
