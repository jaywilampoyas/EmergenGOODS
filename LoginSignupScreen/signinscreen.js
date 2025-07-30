import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Image, Keyboard, Alert } from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import Icon from 'react-native-vector-icons/Ionicons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';


const { width } = Dimensions.get('window');
const isSmallScreen = width < 350;
const isMediumScreen = width >= 350 && width <= 450;

export default function SignIn({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            if (email.endsWith('@super.com')) {
                // For super admin, show a choice for navigation
                Alert.alert(
                    'Select Home Screen',
                    'Where would you like to go?',
                    [
                        { text: 'Admin Home', onPress: () => navigation.navigate('AdminHome') },
                        { text: 'Volunteer Home', onPress: () => navigation.navigate('VolunteerHome') },
                        { text: 'Beneficiary Home', onPress: () => navigation.navigate('BeneficiaryHome') },
                        { text: 'Cancel', style: 'cancel' },
                    ],
                    { cancelable: true }
                );
            } else if (email.endsWith('@admin.com')) {
                navigation.navigate('AdminHome');
            } else if (email.endsWith('@volunteer.com')) {
                navigation.navigate('VolunteerHome');
            } else if (email.endsWith('@gmail.com')) {
                navigation.navigate('BeneficiaryHome');
            } else {
                setError('Email domain not recognized.');
            }
        })
        .catch(error => {
            setError(error.message);
        });
};
  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  const forgotPassword = () => {
    if (!email) {
      Alert.alert("Please enter your email to reset password.");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert("Password Reset", "Check your email for a password reset link.");
      })
      .catch(error => {
        Alert.alert("Error", error.message);
      });
  };

  return (
    <View style={styles.container}>
      {!keyboardVisible && (
        <View style={styles.header}>
          <Image source={require('../Logos/EGLogoNoName.png')} style={styles.logo} />
          <Text style={styles.logoDescription}>Sign in to EmergenGOODS</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
          <Icon name={showPassword ? 'eye' : 'eye-off'} size={24} color="#666" />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={forgotPassword}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
container: {
    flex: 1,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    backgroundColor: '#fff', // White background color
    padding: wp('5%'), // Add padding for better spacing
  },
  header: {
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    marginBottom: hp('5%'), // Add spacing below the header
  },
  logo: {
    position: 'absolute', 
    top: hp('-30%'), // Place 5% from top of the screen
    width: wp('35%'), // 35% of screen width
    height: wp('35%'), // Maintain aspect ratio
    marginBottom: hp('2%'), // Add spacing below the logo
  },
  logoDescription: {
    position: 'absolute', 
    top: hp('-13%'), // Place 5% from top of the screen
    fontSize: hp('3%'), // Font size as 3% of screen height
    textAlign: 'center', // Center the text
    fontWeight: 'bold', // Bold text
    color: '#333', // Dark text color
    marginBottom: hp('3%'), // Add spacing below the description
  },
  input: {
    width: wp('80%'), // 80% of screen width
    paddingVertical: hp('1.5%'), // Vertical padding for input fields
    paddingHorizontal: wp('4%'), // Horizontal padding for input fields
    marginBottom: hp('2%'), // Add spacing below the input fields
    borderWidth: 1, // Add border
    borderColor: '#ddd', // Light gray border color
    borderRadius: wp('2%'), // Rounded corners
    backgroundColor: '#f9f9f9', // Light gray background color
    fontSize: hp('2%'), // Font size for input text
  },
  passwordContainer: {
    width: wp('80%'), // 80% of screen width
    flexDirection: 'row', // Align password input and icon horizontally
    alignItems: 'center', // Center content vertically
    borderWidth: 1, // Add border
    borderColor: '#ddd', // Light gray border color
    borderRadius: wp('2%'), // Rounded corners
    backgroundColor: '#f9f9f9', // Light gray background color
    marginBottom: hp('2%'), // Add spacing below
  },
  passwordInput: {
    flex: 1, // Take up remaining space
    paddingVertical: hp('1.5%'), // Vertical padding
    paddingHorizontal: wp('4%'), // Horizontal padding
    fontSize: hp('2%'), // Font size for input text
  },
  eyeIcon: {
    padding: wp('2.5%'), // Add padding for touchable icon
  },
  error: {
    color: 'red', // Red text for error
    marginVertical: hp('1%'), // Add vertical spacing
    textAlign: 'center', // Center the error message
    fontSize: hp('2%'), // Font size for error text
  },
  buttonWrapper: {
    width: wp('80%'), // 80% of screen width
    justifyContent: 'center', // Center buttons vertically
    alignItems: 'center', // Center buttons horizontally
    marginTop: hp('2%'), // Add spacing above buttons
  },
  button: {
    position: 'absolute', 
    top: hp('66%'), // Place 5% from top of the screen
    backgroundColor: '#FF7D05', // Orange button color
    paddingVertical: hp('1.5%'), // Vertical padding for buttons
    paddingHorizontal: wp('35%'), // Horizontal padding for buttons
    borderRadius: wp('10%'), // Rounded corners
    marginBottom: hp('2%'), // Space between buttons
  },
  buttonText: {
    color: '#fff', // White text color
    fontSize: hp('2.5%'), // Font size for button text
    fontWeight: 'bold', // Bold text
    textAlign: 'center', // Center the text inside the button
  },
  forgotPasswordText: {
    position: 'absolute', 
    top: hp('-2%'), // Place 5% from top of the screen
    left: wp('10%'), // Place 5% from the left of the screen
    fontSize: hp('2%'), // Font size for forgot password text
    color: '#333', // Dark text color
    textAlign: 'center', // Center the text
    marginTop: hp('1%'), // Add spacing above
  },
});
