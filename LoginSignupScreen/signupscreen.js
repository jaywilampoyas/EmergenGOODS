import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
  Keyboard,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { getFirestore, setDoc, doc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker'; // Import Picker component
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');
const db = getFirestore();

export default function SignUp({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState(''); // Optional middle name
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState(''); // Suffix field (e.g., Jr, III)
  const [birthDay, setBirthDay] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [gender, setGender] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [mobileNumber, setMobileNumber] = useState(''); // Mobile number state
  const [occupation, setOccupation] = useState('');
  const [civilStatus, setCivilStatus] = useState('');
  const [selectedIDType, setSelectedIDType] = useState('');
  const [verifiedID, setVerifiedID] = useState(null);
  const [barangayClearance, setBarangayClearance] = useState(null);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const idTypes = [
    'Select ID Type',
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
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

const handleSignup = async () => {
  // Ensure mobile number contains only digits
  const cleanedMobileNumber = mobileNumber.replace(/\D/g, '');

  if (password !== confirmPassword) {
    setError("Passwords do not match!");
    return;
  }

  if (cleanedMobileNumber.length !== 10) {
    setError("Please enter a valid 10-digit mobile number.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const db = getFirestore();

    // Build the user data with verificationStatus included
    const userData = {
      email: user.email,
      uid: user.uid,
      firstName,
      middleName: middleName || null,
      lastName,
      suffix: suffix || null,
      birthDay,
      gender,
      homeAddress,
      placeOfBirth,
      mobileNumber: cleanedMobileNumber, // Store only the 10-digit number
      occupation,
      civilStatus,
      selectedIDType,
      verifiedID: verifiedID || null,
      barangayClearance: barangayClearance || null,
      createdAt: new Date().toISOString(),
      verificationStatus: "Pending", // Set initial verification status
      submittedAt: new Date(),       // Timestamp for submission
    };

    // Save user data in multiple collections
    await setDoc(doc(db, 'users', user.uid), userData);
    await setDoc(doc(db, 'usersArchive', user.uid), userData);
    await setDoc(doc(db, 'pendingVerifications', user.uid), userData);

    // Archive the verification data in a separate collection
    await setDoc(doc(db, 'verificationArchive', user.uid), {
      ...userData,
      archivedAt: new Date(), // Timestamp for archiving
    });

    // Create an admin notification document
    await setDoc(doc(db, 'verificationNotifications', user.uid), {
      message: `New pending account added for verification: ${firstName} ${lastName}`,
      userId: user.uid,
      timestamp: new Date(),
      status: "Pending", // Notification status
    });

    Alert.alert(
      "Success",
      "Your account has been created successfully! It will be verified by an admin.",
      [{ text: "OK", onPress: () => navigation.navigate('SignIn') }]
    );
  } catch (error) {
    setError(error.message);
  }
};

  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prevState => !prevState);
  };

  const handleDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setBirthDay(formattedDate);
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

  const openImageViewer = (imageUri) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {!keyboardVisible && (
          <>
            <Image source={require('../Logos/EGLogoNoName.png')} style={styles.logo} />
            <Text style={styles.logoDescription}>Sign up to EmergenGOODS</Text>
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#666"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Middle Name (Optional)"
          placeholderTextColor="#666"
          value={middleName}
          onChangeText={setMiddleName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#666"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Suffix (e.g., Jr, III, Optional)"
          placeholderTextColor="#666"
          value={suffix}
          onChangeText={setSuffix}
        />
        <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.input}>
          <Text>{birthDay || 'Select Birthday'}</Text>
        </TouchableOpacity>

        {datePickerVisible && (
          <DateTimePicker
            value={birthDay ? new Date(birthDay) : new Date()} // Keep previous selection
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        <View style={styles.inputgender}>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
            style={{ height: hp('6%'), width: wp('90%') }}
            mode="dropdown" // Optional, for dropdown mode on Android
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <TextInput
          placeholder="Home Address (Building Number, Street Name, Barangay, City/Municipality, Province)"
          value={homeAddress}
          onChangeText={setHomeAddress}
          style={styles.input}
          multiline={true}
        />
        <TextInput
          placeholder="Place of Birth"
          value={placeOfBirth}
          onChangeText={setPlaceOfBirth}
          style={styles.input}
        />
        <View style={styles.input}>
          <TextInput
            style={{ flex: 1, fontSize: 16, color: '#000' }}
            placeholder="Enter Email"
            placeholderTextColor="#666"
            value={email.replace('@gmail.com', '')} // Only show the username while typing
            onChangeText={(text) => {
              const cleanedText = text.replace(/@gmail\.com$/, ''); // Prevent duplicate @gmail.com
              setEmail(cleanedText.trim() + '@gmail.com'); // Ensure it's stored correctly
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={{ fontSize: 16, color: '#000', marginLeft: 2 }}>@gmail.com</Text>
        </View>

        <View style={styles.input}>
          <Text style={{ fontSize: 16, color: '#000', marginRight: 5 }}>+63</Text>
          <TextInput
            style={{ flex: 1, fontSize: 16, color: '#000' }}
            placeholder="Mobile Number"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={mobileNumber}
            onChangeText={(text) => {
              // Remove non-numeric characters
              const numericText = text.replace(/\D/g, '');

              // Limit input to 10 digits
              const limitedText = numericText.slice(0, 10);

              // Format for display (XXX XXX XXXX)
              const formattedText = limitedText
                .replace(/(\d{3})(\d{3})(\d{0,4})/, '$1 $2 $3')
                .trim();

              // Update state with formatted text (for display)
              setMobileNumber(formattedText);
            }}
            maxLength={12} // Adjusted for spaces in formatting
          />
        </View>

        <TextInput
          placeholder="Occupation"
          value={occupation}
          onChangeText={setOccupation}
          style={styles.input}
        />
        <View style={styles.inputcivilStatus}>
          <Picker
            selectedValue={civilStatus}
            onValueChange={(itemValue) => setCivilStatus(itemValue)}
            style={{ height: hp('6%'), width: wp('90%') }}
            mode="dropdown"
          >
            <Picker.Item label="Select Civil Status" value="" />
            <Picker.Item label="Single" value="single" />
            <Picker.Item label="Married" value="married" />
            <Picker.Item label="Widowed" value="widowed" />
            <Picker.Item label="Divorced" value="divorced" />
          </Picker>
        </View>
        <View style={styles.pickerInput}>
          <Picker
            selectedValue={selectedIDType}
            onValueChange={(itemValue) => setSelectedIDType(itemValue)}
            style={{ height: hp('6%'), width: wp('90%') }}
            mode="dropdown"
          >
            {idTypes.map((idType, index) => (
              <Picker.Item key={index} label={idType} value={idType} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity onPress={() => handleImageUpload('verifiedID')} style={styles.input}>
          <Text style={styles.uploadButtonText}>Upload Verified ID</Text>
        </TouchableOpacity>

        {verifiedID && (
          <TouchableOpacity onPress={() => openImageViewer(verifiedID)}>
            <Image source={{ uri: verifiedID }} style={styles.uploadedImage} />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => handleImageUpload('barangayClearance')} style={styles.input}>
          <Text style={styles.uploadButtonText}>Upload Barangay Clearance</Text>
        </TouchableOpacity>

        {barangayClearance && (
          <TouchableOpacity onPress={() => openImageViewer(barangayClearance)}>
            <Image source={{ uri: barangayClearance }} style={styles.uploadedImage} />
          </TouchableOpacity>
        )}

        <View style={styles.passwordContainer}>
  <TextInput
    style={styles.passwordInput}
    placeholder="Password (6-20 characters)"
    placeholderTextColor="#666"
    secureTextEntry={!showPassword}
    value={password}
    maxLength={20}  // Limits to 20 characters
    onChangeText={setPassword}
  />
  <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
    <Icon name={showPassword ? 'eye' : 'eye-off'} size={24} color="#666" />
  </TouchableOpacity>
</View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password (6-20 characters)"
            placeholderTextColor="#666"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            maxLength={20}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={toggleConfirmPasswordVisibility} style={styles.eyeIcon}>
            <Icon name={showConfirmPassword ? 'eye' : 'eye-off'} size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for viewing images */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalContainer} onPress={() => setModalVisible(false)}>
          <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('5%'),
    backgroundColor: '#fff',
  },
  logo: {
    top: hp('2%'),
    width: wp('20%'),
    height: wp('20%'),
    marginBottom: hp('2%'),
  },
  logoDescription: {
    top: hp('2%'),
    fontWeight: 'bold',
    fontSize: wp('5%'),
    marginBottom: hp('3%'),
    textAlign: 'center',
  },
  input: {
    width: wp('90%'),
    padding: hp('2%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('3%'),
    backgroundColor: '#f9f9f9',
    fontSize: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputgender: {
    width: wp('90%'),
    padding: hp('0.5%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('3%'),
    backgroundColor: '#f9f9f9',
    fontSize: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputcivilStatus: {
    width: wp('90%'),
    padding: hp('0.5%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('3%'),
    backgroundColor: '#f9f9f9',
    fontSize: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerInput: {
    width: wp('90%'),
    padding: hp('0.5%'),
    marginVertical: hp('1%'),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('3%'),
    backgroundColor: '#f9f9f9',
    fontSize: wp('4%'),
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordContainer: {
    width: wp('90%'),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: wp('3%'),
    backgroundColor: '#f9f9f9',
    marginVertical: hp('1%'),
  },
  passwordInput: {
    flex: 1,
    padding: hp('2%'),
    fontSize: wp('4%'),
  },
  eyeIcon: {
    padding: hp('1.5%'),
  },
  error: {
    color: 'red',
    marginVertical: hp('1%'),
    textAlign: 'center',
  },
  button: {
    width: wp('90%'),
    paddingVertical: hp('2%'),
    marginVertical: hp('1%'),
    backgroundColor: '#FF7D05',
    borderRadius: wp('10%'),
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: wp('4%'),
    fontWeight: 'bold',
  },
  uploadButtonText: {
    fontSize: wp('4%'),
    color: '#000',
  },
  uploadedImage: {
    width: wp('90%'),
    height: wp('40%'),
    marginVertical: hp('1%'),
    borderRadius: wp('2%'),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
});

