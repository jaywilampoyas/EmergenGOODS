import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Ionicons } from '@expo/vector-icons'; // Ensure compatibility with web
import { 
  widthPercentageToDP as wp, 
  heightPercentageToDP as hp 
} from 'react-native-responsive-screen';

export default function WebSignIn({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Handle login logic
  const handleLogin = () => {
    if (!email || !password) {
      showAlert('Error', 'Please fill out all fields.');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        if (email.endsWith('@super.com')) {
          navigation.navigate('SuperAdmin');
        } else if (email.endsWith('@admin.com')) {
          navigation.navigate('AdminWebHome');
        } else {
          showAlert('Access Denied', 'Only admins and super admins are allowed to log in.');
          setError('Access Denied: Only admins and super admins are allowed to log in.');
          auth.signOut();
        }
      })
      .catch((error) => {
        setError(error.message || 'Something went wrong.');
      });
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  // Alert handler (web-compatible)
  const showAlert = (title, message) => {
    window.alert(`${title}: ${message}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        {/* Left Half: Green side with Logo & Branding */}
        <View style={styles.formLeft}>
          <Image source={require('../Logos/EGLogoNoName.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.logoName}>
            <Text style={{ color: '#00A600' }}>Emergen</Text>
            <Text style={{ color: '#FF7D05' }}>GOODS</Text>
          </Text>
        </View>

        {/* Right Half: White side with Login Form */}
        <View style={styles.formRight}>
         <Text style={styles.logoDescription}>Admin Login Portal</Text>
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
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

       <View style={styles.footer}>
      <Text style={styles.footerText}>© 2025 EmergenGOODS. All rights reserved.</Text>
      <Text style={styles.footerText}>Developed by Cipher One</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    width: wp('60%'),
    height: hp('60%'),
    flexDirection: 'row',
    borderRadius: wp('2%'),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: wp('0.5%'), height: wp('0.5%') },
    shadowRadius: wp('2%'),
    elevation: 3,
  },
  formLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('3%'),
    borderRightWidth: 1,
    borderColor: '#ddd',
  },
  formRight: {
    flex: 1,
    justifyContent: 'center',
    padding: wp('5%'),
  },
  logo: {
    width: wp('35%'),
    height: hp('35%'),
    marginBottom: hp('2%'),
  },
  logoName: {
    fontSize: wp('3%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
    textAlign: 'center',
  },
  logoDescription: {
    marginBottom: hp('5%'),
    fontSize: wp('2%'),
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('2%'),
    marginBottom: hp('2%'),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('1.5%'),
    fontSize: wp('1.3%'),
    backgroundColor: '#f9f9f9',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('1.5%'),
    backgroundColor: '#f9f9f9',
    marginBottom: hp('2%'),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: hp('1.2%'),
    paddingHorizontal: wp('1.5%'),
    fontSize: wp('1.3%'),
    borderRadius: wp('1.5%'),
  },
  eyeIcon: {
    paddingHorizontal: wp('1.5%'),
  },
  error: {
    color: 'red',
    marginBottom: hp('2%'),
    textAlign: 'center',
    fontSize: wp('1.8%'),
  },
  button: {
    backgroundColor: '#00A600',
    paddingVertical: hp('1%'),
    borderRadius: wp('2%'),
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  buttonText: {
    color: '#fff',
    fontSize: wp('1%'),
    fontWeight: 'bold',
  },
  footer: {
  position: 'absolute',
  bottom: hp('2%'),
  alignItems: 'center',
  width: '100%',
},

footerText: {
  fontSize: wp('1%'),
  color: '#000',
  textAlign: 'center',
},
});