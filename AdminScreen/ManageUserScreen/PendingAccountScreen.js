import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList, Alert, ScrollView, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');

export default function PendingAccount({ navigation }) {
    const [pendingAccounts, setPendingAccounts] = useState([]);
    const db = getFirestore();

    useEffect(() => {
        const fetchPendingAccounts = async () => {
            try {
                const accountsRef = collection(db, 'pendingVerifications');
                const snapshot = await getDocs(accountsRef);
                const accounts = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(account => account.verificationStatus === 'Pending'); // Only keep pending accounts

                setPendingAccounts(accounts);
            } catch (error) {
                console.error('Error fetching pending accounts:', error);
                Alert.alert('Error', 'Failed to load pending accounts.');
            }
        };

        fetchPendingAccounts();
    }, []);

    const handleVerify = async (accountId) => {
        try {
            const accountRef = doc(db, 'pendingVerifications', accountId);
            await updateDoc(accountRef, { verificationStatus: 'Verified' });

            setPendingAccounts(prevAccounts =>
                prevAccounts.filter(account => account.id !== accountId)
            );

            Alert.alert('Success', 'Account verified successfully.');
        } catch (error) {
            console.error('Error verifying account:', error);
            Alert.alert('Error', 'Failed to verify account.');
        }
    };

    const handleDecline = async (accountId) => {
        try {
            const accountRef = doc(db, 'pendingVerifications', accountId);
            await updateDoc(accountRef, { verificationStatus: 'Declined' });

            setPendingAccounts(prevAccounts =>
                prevAccounts.filter(account => account.id !== accountId)
            );

            Alert.alert('Success', 'Account declined successfully.');
        } catch (error) {
            console.error('Error declining account:', error);
            Alert.alert('Error', 'Failed to decline account.');
        }
    };

    const renderAccountItem = ({ item }) => (
        <View style={styles.accountCard}>
            <Text style={styles.accountInfo}><Text style={styles.label}>First Name:</Text> {item.firstName}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Middle Name:</Text> {item.middleName}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Last Name:</Text> {item.lastName}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Gender:</Text> {item.gender}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Age:</Text> {item.age}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Home Address:</Text> {item.homeAddress}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Email Address:</Text> {item.emailAddress}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Phone Number:</Text> {item.phoneNumber}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Birth Day:</Text> {item.birthDay}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Place of Birth:</Text> {item.placeOfBirth}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Occupation:</Text> {item.occupation}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>Civil Status:</Text> {item.civilStatus}</Text>
            <Text style={styles.accountInfo}><Text style={styles.label}>ID Type:</Text> {item.selectedIDType}</Text>

            <Text style={styles.label}>Verified ID:</Text>
            {item.verifiedID ? (
                <Image source={{ uri: item.verifiedID }} style={styles.uploadedImage} />
            ) : (
                <Text style={styles.noImageText}>No ID Uploaded</Text>
            )}

            <Text style={styles.label}>Barangay Clearance:</Text>
            {item.barangayClearance ? (
                <Image source={{ uri: item.barangayClearance }} style={styles.uploadedImage} />
            ) : (
                <Text style={styles.noImageText}>No Barangay Clearance Uploaded</Text>
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => handleVerify(item.id)}
                >
                    <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => handleDecline(item.id)}
                >
                    <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Pending Accounts</Text>
            </View>

            <FlatList style={styles.list}
                data={pendingAccounts}
                keyExtractor={item => item.id}
                renderItem={renderAccountItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={<Text style={styles.emptyText}>No pending accounts to verify.</Text>}
            />
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
        left: wp ('27%'),
        fontSize: wp ('6%'),
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    listContainer: {
        paddingVertical: 20,
    },
    accountCard: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderRadius: 10,
        marginVertical: 10,
        elevation: 2,
    },
    accountInfo: {
        fontSize: 16,
        marginBottom: 5,
    },
    label: {
        fontWeight: 'bold',
    },
    uploadedImage: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginVertical: 10,
    },
    verifyButton: {
        marginTop: 10,
        backgroundColor: '#00A600',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 10,
        flex: 1,
    },
    verifyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    declineButton: {
        marginTop: 10,
        backgroundColor: '#FF0000',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginLeft: 10,
        flex: 1,
    },
    declineButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    noImageText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
});
