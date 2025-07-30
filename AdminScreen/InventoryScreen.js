import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TextInput, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');

// Helper function to format numbers with commas
const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US').format(number);
};

export default function Inventory({ navigation }) {
    const [itemName, setItemName] = useState('');
    const [itemType, setItemType] = useState('Food');
    const [customItemType, setCustomItemType] = useState('');
    const [quantity, setQuantity] = useState('');
    const [donorName, setDonorName] = useState('');
    const [donationDate, setDonationDate] = useState('');
    const [details, setDetails] = useState('');
    const [items, setItems] = useState([]);
    const [regularSearch, setRegularSearch] = useState('');
    const [monetarySearch, setMonetarySearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [customFilterType, setCustomFilterType] = useState('');
    const [sortOption, setSortOption] = useState('Newest');

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'items'),
            (snapshot) => {
                const itemList = [];
                snapshot.forEach((doc) => {
                    itemList.push({ id: doc.id, ...doc.data() });
                });

                if (sortOption === 'Newest') {
                    itemList.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
                } else if (sortOption === 'Oldest') {
                    itemList.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
                } else if (sortOption === 'Name') {
                    itemList.sort((a, b) => a.name.localeCompare(b.name));
                }

                setItems(itemList);
            },
            (error) => {
                console.error(error);
            }
        );

        return () => unsubscribe();
    }, [sortOption]);

const addItem = async () => {
    try {
        // Check if an item with the same name already exists in the database
        const existingItem = items.find(item => item.name.toLowerCase() === itemName.toLowerCase());

        if (existingItem) {
            // If item exists, update its quantity
            await updateDoc(doc(db, 'items', existingItem.id), {
                quantity: existingItem.quantity + (parseInt(quantity, 10) || 0),
            });
        } else {
            // If item does not exist, add a new document
            await addDoc(collection(db, 'items'), {
                name: itemName,
                type: itemType === 'Others' ? customItemType : itemType,
                quantity: parseInt(quantity, 10) || 0,
                donorName,
                donationDate,
                details,
                timestamp: new Date(),
            });
        }

        // Clear input fields after adding or updating
        setItemName('');
        setItemType('Food');
        setCustomItemType('');
        setQuantity('');
        setDonorName('');
        setDonationDate('');
        setDetails('');
    } catch (e) {
        console.error('Error adding or updating document: ', e);
    }
};

    const filteredItems = items.filter((item) => {
        if (filterType === 'All') return true;
        if (filterType === 'Custom') return item.type.toLowerCase() === customFilterType.toLowerCase();
        return item.type === filterType;
    });

    const regularItems = filteredItems.filter(item => item.type !== 'Money' && item.name.toLowerCase().includes(regularSearch.toLowerCase()));
    const moneyItems = filteredItems.filter(item => item.type === 'Money' && item.name.toLowerCase().includes(monetarySearch.toLowerCase()));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Inventory</Text>
            </View>

            {/* Dropdown for Filtering */}
            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Filter by Category:</Text>
                <Picker
                    selectedValue={filterType}
                    onValueChange={(value) => setFilterType(value)}
                    style={styles.picker}
                >
                    <Picker.Item label="All" value="All" />
                    <Picker.Item label="Food" value="Food" />
                    <Picker.Item label="Water" value="Water" />
                    <Picker.Item label="Clothes" value="Clothes" />
                    <Picker.Item label="Money" value="Money" />
                    <Picker.Item label="Custom" value="Custom" />
                </Picker>
            </View>

            {filterType === 'Custom' && (
                <TextInput
                    style={styles.input}
                    placeholder="Enter Custom Type"
                    value={customFilterType}
                    onChangeText={setCustomFilterType}
                />
            )}

            {/* Dropdown for Sorting */}
            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Sort by:</Text>
                <Picker
                    selectedValue={sortOption}
                    onValueChange={(value) => setSortOption(value)}
                    style={styles.picker}
                >
                    <Picker.Item label="Newest" value="Newest" />
                    <Picker.Item label="Oldest" value="Oldest" />
                    <Picker.Item label="Name" value="Name" />
                </Picker>
            </View>

            {/* Add Item Section */}
            <TextInput
                style={styles.input}
                placeholder="Item Name"
                value={itemName}
                onChangeText={setItemName}
            />
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={itemType}
                    onValueChange={(itemValue) => setItemType(itemValue)}
                >
                    <Picker.Item label="Food" value="Food" />
                    <Picker.Item label="Water" value="Water" />
                    <Picker.Item label="Clothes" value="Clothes" />
                    <Picker.Item label="Money" value="Money" />
                    <Picker.Item label="Others" value="Others" />
                </Picker>
            </View>

            {itemType === 'Others' && (
                <TextInput
                    style={styles.input}
                    placeholder="Enter Item Type"
                    value={customItemType}
                    onChangeText={setCustomItemType}
                />
            )}

            <TextInput
                style={styles.input}
                placeholder="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Donor Name"
                value={donorName}
                onChangeText={setDonorName}
            />
            <TextInput
                style={styles.input}
                placeholder="Date of Donation (YYYY-MM-DD)"
                value={donationDate}
                onChangeText={setDonationDate}
            />
            <TextInput
                style={styles.input}
                placeholder="Additional Details"
                value={details}
                onChangeText={setDetails}
            />

            <TouchableOpacity style={styles.addButton} onPress={addItem}>
                <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>

            {/* Regular Items Section */}
            <Text style={styles.sectionHeader}>Regular Items</Text>
            <TextInput
                style={styles.searchInput}
                placeholder="Search Regular Items"
                value={regularSearch}
                onChangeText={setRegularSearch}
            />
            <ScrollView style={styles.list}>
                <View style={styles.listHeader}>
                    <Text style={styles.columnHeader}>Name</Text>
                    <Text style={styles.columnHeader}>Type</Text>
                    <Text style={styles.columnHeader}>Quantity</Text>
                    <Text style={styles.columnHeader}>Donor</Text>
                    <Text style={styles.columnHeader}>Date</Text>
                </View>
                {regularItems.map((item) => (
                    <View key={item.id} style={styles.item}>
                        <Text>{item.name}</Text>
                        <Text>{item.type}</Text>
                        <Text>{formatNumber(item.quantity)}</Text>
                        <Text>{item.donorName || 'N/A'}</Text>
                        <Text>{item.donationDate || 'N/A'}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* Monetary Items Section */}
            <Text style={styles.sectionHeader}>Monetary Items</Text>
            <TextInput
                style={styles.searchInput}
                placeholder="Search Monetary Items"
                value={monetarySearch}
                onChangeText={setMonetarySearch}
            />
            <ScrollView style={styles.list}>
                <View style={styles.listHeader}>
                    <Text style={styles.columnHeader}>Name</Text>
                    <Text style={styles.columnHeader}>Amount (₱)</Text>
                </View>
                {moneyItems.map((item) => (
                    <View key={item.id} style={styles.item}>
                        <Text>{item.name}</Text>
                        <Text>{`₱${formatNumber(item.quantity)}`}</Text>
                    </View>
                ))}
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
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp ('5%'),
        marginTop: hp ('2%'),
    },
    backButton: {
        position: 'absolute',
        right: wp ('83%'),
        width: wp ('10%'),
        height: hp ('4.5%'),
        borderRadius: 20,
        backgroundColor: '#00A600',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
        marginLeft: 56,
        marginRight: 40,
    },
    input: {
        height: hp ('5%'),
        borderWidth: 1,
        padding: 10,
        marginBottom: hp ('1%'),
    },
    searchInput: {
        height: hp ('4%'),
        borderWidth: 1,
        padding: 10,
        marginBottom: hp ('1%'),
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: 'black',
        marginBottom: hp ('1%'),
        backgroundColor: 'lightgray',
    },
    addButton: {
        backgroundColor: '#00A600',
        padding: 10,
        alignItems: 'center',
        borderRadius: 50,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    list: {
        maxHeight: hp ('50%'), // Set a max height for scrollable area
        marginBottom: hp ('1%'),
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        padding: 10,
        borderWidth: 1,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        backgroundColor: '#f0f0f0',
    },
    columnHeader: {
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        textAlign: 'center',
    },
     filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('2%'),
    },
    filterLabel: {
        fontSize: 16,
        marginRight: 10,
    },
    picker: {
        flex: 1,
    },
});
