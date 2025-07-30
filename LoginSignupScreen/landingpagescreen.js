import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Image, Alert, BackHandler, Modal, TextInput, useWindowDimensions, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');
export default function Landing ({ navigation }) {
  const { width, height } = useWindowDimensions();
  const [isHelpModalVisible, setHelpModalVisible] = useState(false);
  const [selectedModal, setSelectedModal] = useState('');
  const [bugDetails, setBugDetails] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const backAction = () => {
      Alert.alert("Exit App", "Are you sure you want to exit this app?", [
        { text: "Cancel", onPress: () => null, style: "cancel" },
        { text: "YES", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  const toggleHelpModal = () => {
    setHelpModalVisible(!isHelpModalVisible);
    setSelectedModal(''); // Reset selected modal
  };

  const openModal = (modalType) => {
    setSelectedModal(modalType);
  };

  const handleBugReportSubmit = async () => {
    if (bugDetails.trim() === '') {
      Alert.alert('Error', 'Please enter the bug details.');
      return;
    }
    try {
      await addDoc(collection(db, 'bugReports'), {
        details: bugDetails,
        submittedAt: new Date(),
      });
      Alert.alert('Success', 'Your bug report has been submitted.');
      setBugDetails(''); // Clear input after submission
      setSelectedModal(''); // Close modal
    } catch (error) {
      Alert.alert('Error', 'Failed to submit the bug report.');
    }
  };

  // New function to handle the "Account Got Hacked?" form submission
  const handleAccountHackedSubmit = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'accountHackedReports'), {
        fullName,
        email,
        password,
        submittedAt: new Date(),
      });
      Alert.alert('Success', 'Your account recovery request has been submitted.');
      setFullName(''); // Clear input fields after submission
      setEmail('');
      setPassword('');
      setSelectedModal(''); // Close modal
    } catch (error) {
      Alert.alert('Error', 'Failed to submit account recovery request.');
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../Logos/LogoEmergenGOODS.png')}
        style={styles.logo}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('SignIn')}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <Text style={styles.signupText}>
        Don't have an account?
      </Text>
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.signupButton}>
        <Text style={[styles.signupLinkText, { fontSize: width * 0.04 }]}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleHelpModal} style={styles.iconButton}>
        <Icon name="help-circle-outline" size={32} color="#000" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={isHelpModalVisible}
        animationType="slide"
        onRequestClose={toggleHelpModal}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: width * 0.8 }]}>
            <Text style={styles.modalTitle}>Help Information</Text>
            <TouchableOpacity onPress={() => openModal('reportBugs')} style={styles.textButton}>
              <Text style={[styles.textButtonText, { fontSize: width * 0.045 }]}>Report Bugs</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openModal('accountHacked')} style={styles.textButton}>
              <Text style={[styles.textButtonText, { fontSize: width * 0.045 }]}>Account Got Hacked?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openModal('about')} style={styles.textButton}>
              <Text style={[styles.textButtonText, { fontSize: width * 0.045 }]}>About EmergenGOODS</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleHelpModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Account Got Hacked Modal */}
      <Modal
        transparent={true}
        visible={selectedModal === 'accountHacked'}
        animationType="slide"
        onRequestClose={() => setSelectedModal('')}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: width * 0.8 }]}>
            <Text style={styles.modalTitle}>Account Got Hacked?</Text>
            <TextInput
              style={[styles.input, { fontSize: width * 0.04 }]}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={[styles.input, { fontSize: width * 0.04 }]}
              placeholder="Recovery Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={[styles.input, { fontSize: width * 0.04 }]}
              placeholder="Password you remember"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity onPress={handleAccountHackedSubmit} style={styles.submitButton}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedModal('')} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Report Bug Modal */}
      <Modal
        transparent={true}
        visible={selectedModal === 'reportBugs'}
        animationType="slide"
        onRequestClose={() => setSelectedModal('')}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: width * 0.8 }]}>
            <Text style={styles.modalTitle}>Report Bugs</Text>
            <TextInput
              style={[styles.inputbug, { fontSize: width * 0.04 }]}
              placeholder="Describe the bug..."
              value={bugDetails}
              onChangeText={setBugDetails}
              multiline
            />
            <TouchableOpacity onPress={handleBugReportSubmit} style={styles.submitButton}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedModal('')} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        transparent={true}
        visible={selectedModal === 'about'}
        animationType="slide"
        onRequestClose={() => setSelectedModal('')}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { width: width * 0.8 }]}>
            <Text style={styles.modalTitle}>About EmergenGOODS</Text>
            <Text style={styles.modalText}>
               EmergenGOODS is a versatile mobile application designed to simplify the distribution and claiming of relief goods, 
  financial aid (ayuda), and any kind of donation. This app ensures a smooth and transparent process for managing essential 
  supplies, making it easier for organizations and individuals to deliver assistance effectively during emergencies or 
  community outreach programs. With user-friendly features and real-time tracking, EmergenGOODS helps ensure that aid reaches 
  the intended recipients quickly and fairly. All rights are reserved by the dedicated creators of this platform, committed 
  to improving emergency response and donation management.
            </Text>
            <TouchableOpacity onPress={() => setSelectedModal('')} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logo: {
    resizeMode: 'contain',
    position: 'absolute',
    width: wp('60%'),
    height: hp('25%'),
    top: hp('20%'),
  },
  button: {
    backgroundColor: '#FF7D05',
    borderRadius: wp('12.5%'),
    alignItems: 'center',
    position: 'absolute',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('30%'),
    top: hp('70%'),
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'web' ? 'Arial' : 'KronaOne',
    fontSize: wp('4.5%'),
  },
  signupText: {
    color: '#000000',
    position: 'absolute',
    left: wp('19%'),
    fontFamily: Platform.OS === 'web' ? 'Arial' : 'Inter',
    fontSize: wp('4%'),
    top: hp('79.4%'),
  },
  signupButton: {
    alignItems: 'center',
    position: 'absolute',
    left: wp('64%'),
    top: hp('79.3%'),
  },
  signupLinkText: {
    color: '#0000ff',
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'web' ? 'Arial' : 'Inter-Italic',
    fontSize: wp('4%'),
  },
  iconButton: {
    position: 'absolute',
    bottom: hp('96%'),
    right: wp('5%'),
  },
  textButton: {
    marginTop: hp('1%'),
    alignItems: 'center',
  },
  textButtonText: {
    color: '#FF7D05',
    textDecorationLine: 'underline',
    fontSize: wp('4.5%'),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: wp('5%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    width: wp('80%'),
  },
  modalTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginBottom: hp('1%'),
  },
  modalText: {
    fontSize: wp('4%'),
    textAlign: 'center',
    marginBottom: hp('2%'),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp('2%'),
    padding: wp('2.5%'),
    marginBottom: hp('1.2%'),
    width: '100%',
    fontSize: wp('4%'),
  },
  inputbug: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: wp('2%'),
    padding: wp('2.5%'),
    marginBottom: hp('1.2%'),
    width: '100%',
    height: hp('10%'),
    fontSize: wp('4%'),
  },
  submitButton: {
    backgroundColor: '#FF7D05',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('7.5%'),
    borderRadius: wp('5%'),
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'red',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('7.5%'),
    borderRadius: wp('5%'),
    marginTop: hp('1%'),
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: wp('4%'),
  },
});
