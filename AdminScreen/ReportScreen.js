import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, TextInput, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Print from 'expo-print';
import { collection, getDocs, doc, getDoc,} from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart } from 'react-native-chart-kit';
import { Svg, Text as SvgText } from 'react-native-svg';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width } = Dimensions.get('window');

export default function Report({ navigation }) {fa
    const [events, setEvents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [scannedData, setScannedData] = useState([]);
    const [userChartData, setUserChartData] = useState({ labels: ['Selected Beneficiaries'], datasets: [{ data: [0] }] });
    const [itemChartData, setItemChartData] = useState({ labels: [], datasets: [{ data: [] }] });

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'events'));
                const fetchedEvents = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setEvents(fetchedEvents);
                setFilteredEvents(fetchedEvents);
            } catch (error) {
                console.error('Error fetching events:', error);
            }
        };

        fetchEvents();
    }, []);

    useEffect(() => {
        const fetchScannedUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'scannedUsers'));
                const fetchedScannedData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setScannedData(fetchedScannedData);
            } catch (error) {
                console.error('Error fetching scanned users:', error);
            }
        };

        fetchScannedUsers();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEvents(events);
        } else {
            const filtered = events.filter(event =>
                event.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredEvents(filtered);
        }
    }, [searchQuery, events]);

    const handleEventPress = (event) => {
        setSelectedEvent(event);
        setModalVisible(true);
        const chartInfo = getScannedUsersCountAndItems(event.id);

        setUserChartData({
            labels: ['Selected Beneficiaries'],
            datasets: [
                {
                    data: [chartInfo.userCount]
                }
            ]
        });

        setItemChartData({
            labels: Object.keys(chartInfo.itemsClaimed),
            datasets: [
                {
                    data: Object.values(chartInfo.itemsClaimed)
                }
            ]
        });
    };

    const getScannedUsersCountAndItems = (eventId) => {
    const eventScannedData = scannedData.filter(data => data.eventId === eventId);
    const uniqueUsers = new Set();
    let totalItemsClaimed = 0;
    const itemsClaimed = {};

    eventScannedData.forEach(data => {
        if (Array.isArray(data.users)) { // Validate data.users
            data.users.forEach(user => {
                uniqueUsers.add(user.userId);
                if (Array.isArray(user.items)) { // Validate user.items
                    user.items.forEach(item => {
                        totalItemsClaimed += parseInt(item.quantity, 10) || 0;
                        if (itemsClaimed[item.name]) {
                            itemsClaimed[item.name] += parseInt(item.quantity, 10) || 0;
                        } else {
                            itemsClaimed[item.name] = parseInt(item.quantity, 10) || 0;
                        }
                    });
                }
            });
        }
    });

    const userCount = uniqueUsers.size;
    return { userCount, totalItemsClaimed, itemsClaimed };
};

   const renderCustomLabel = ({ datasets }) => ({
    x,
    y,
    index,
    value,
}) => {
    if (datasets[0].data[index]) {
        return (
            <SvgText
                key={`label-${index}`}
                x={x(index) + value + 10} // Adjust this for positioning at the end of the bar
                y={y(index) + 15} // Center the label vertically with the bar
                fontSize="12"
                fill="black"
                textAnchor="start"
            >
                {value.toLocaleString()} {/* Display the value with a thousands separator */}
            </SvgText>
        );
    }
    return null;
};

// Applying the `decorator` in the `BarChart` component

<BarChart
    data={userChartData}
    width={width - 40}
    height={220}
    horizontal={true} // Display chart as horizontal
    chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(255, 125, 5, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16,
        },
    }}
    style={{
        marginVertical: 8,
        borderRadius: 16,
    }}
    decorator={renderCustomLabel(userChartData)}
/>

const handlePrint = async () => {
    if (selectedEvent) {
        const { userCount, totalItemsClaimed, itemsClaimed } = getScannedUsersCountAndItems(selectedEvent.id);

        // Fetch scanned users and their details (name) from Firestore
        const eventDocRef = doc(db, 'scannedUsers', selectedEvent.id);
        const eventDocSnap = await getDoc(eventDocRef);

        let beneficiariesTable = '';
        if (eventDocSnap.exists()) {
            const scannedUsers = eventDocSnap.data().users || [];
            beneficiariesTable = scannedUsers
                .map(
                    (user, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${user.fullName}</td>
                    </tr>`
                )
                .join('');
        } else {
            beneficiariesTable = `
            <tr>
                <td colspan="2">No scanned users found.</td>
            </tr>`;
        }

        // Create a table for items
        const itemsTable = Object.entries(itemsClaimed)
            .map(
                ([itemName, quantity]) => `
                <tr>
                    <td>${itemName}</td>
                    <td>${quantity.toLocaleString()}</td>
                </tr>`
            )
            .join('');

        const printableContent = `
            <html>
                <head>
                    <title>${selectedEvent.title} - Report</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 40px;
                            padding: 20px;
                            border: 1px solid #ddd;
                            border-radius: 10px;
                            background-color: #fefefe;
                            color: #333;
                        }
                        h1 {
                            text-align: center;
                            font-size: 26px;
                            margin-bottom: 15px;
                            color: #222;
                        }
                        .section-title {
                            font-size: 18px;
                            font-weight: bold;
                            margin-top: 20px;
                            border-bottom: 1px solid #ddd;
                            padding-bottom: 5px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 10px;
                        }
                        table, th, td {
                            border: 1px solid #ddd;
                        }
                        th, td {
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f4f4f4;
                        }
                        .signature-container {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 40px;
                        }
                        .signature-label {
                            width: 45%;
                            text-align: center;
                            font-size: 14px;
                        }
                        .signature-line {
                            border-top: 1px solid #333;
                            margin-bottom: 5px;
                            margin-top: 20px;
                        }
                        .footer-label {
                            text-align: center;
                            font-size: 12px;
                            color: #555;
                            margin-top: 50px;
                            font-style: italic;
                        }
                    </style>
                </head>
                <body>
                    <h1>${selectedEvent.title} - Event Report</h1>
                    <p><strong>Total Beneficiaries:</strong> ${userCount}</p>
                    <p><strong>Total Items Claimed:</strong> ${totalItemsClaimed.toLocaleString()}</p>

                    <div>
                        <p class="section-title">Beneficiaries</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${beneficiariesTable}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <p class="section-title">Items Claimed</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Item Name</th>
                                    <th>Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsTable}
                            </tbody>
                        </table>
                    </div>

                    <div class="signature-container">
                        <div class="signature-label">
                            <div class="signature-line"></div>
                            Authorized Signature
                        </div>
                        <div class="signature-label">
                            <div class="signature-line"></div>
                            Supervisor's Signature
                        </div>
                    </div>

                    <div class="footer-label">
                        Report generated by EmergenGOODS
                    </div>
                </body>
            </html>
        `;

        try {
            await Print.printAsync({
                html: printableContent,
            });
        } catch (error) {
            console.error('Error printing:', error);
        }
    }
};

    const renderItem = ({ item }) => {
        const eventDate = item.date.toDate ? item.date.toDate() : new Date(item.date);
        return (
            <TouchableOpacity style={styles.eventCard} onPress={() => handleEventPress(item)}>
                <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>{eventDate.getDate()}</Text>
                    <Text style={styles.monthText}>{eventDate.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
                </View>
                <View style={styles.detailsContainer}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Icon name="chevron-forward-outline" size={24} color="#000" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Reports</Text>
            </View>

            <TextInput
                style={styles.searchBar}
                placeholder="Search Event..."
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
            />

            <FlatList
                data={filteredEvents}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <ScrollView contentContainerStyle={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {selectedEvent && (
                            <>
                                <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                                <View style={styles.iconRow}>
                                    <TouchableOpacity onPress={handlePrint} style={styles.printiconButton}>
                                        <Icon name="print-outline" size={30} color="#000" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.XiconButton}>
                                        <Icon name="close-outline" size={30} color="#000" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.chartTitle}>Total Beneficiaries:</Text>
                                <BarChart
                                    data={userChartData}
                                    width={width - 40}
                                    height={220}
                                    horizontal={true} // Display chart as horizontal
                                    chartConfig={{
                                        backgroundColor: '#ffffff',
                                        backgroundGradientFrom: '#ffffff',
                                        backgroundGradientTo: '#ffffff',
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(255, 125, 5, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                        style: {
                                            borderRadius: 16
                                        }
                                    }}
                                    style={{
                                        marginVertical: 8,
                                        borderRadius: 16
                                    }}
                                    decorator={renderCustomLabel(userChartData)}
                                />

                                <Text style={styles.chartTitle}>Total Items Claimed:</Text>
                                <BarChart
                                    data={itemChartData}
                                    width={width - 40}
                                    height={220}
                                    horizontal={true} // Display chart as horizontal
                                    chartConfig={{
                                        backgroundColor: '#ffffff',
                                        backgroundGradientFrom: '#ffffff',
                                        backgroundGradientTo: '#ffffff',
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(0, 100, 0, ${opacity})`,
                                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                        style: {
                                            borderRadius: 16
                                        }
                                    }}
                                    style={{
                                        marginVertical: 8,
                                        borderRadius: 16
                                    }}
                                    decorator={renderCustomLabel(itemChartData)}
                                />
                            </>
                        )}
                    </View>
                </ScrollView>
            </Modal>
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
        left: wp ('37%'),
        fontSize: wp ('6%'),
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    searchBar: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#ccc',
        marginBottom: 8,
    },
    dateContainer: {
        alignItems: 'center',
        marginRight: 12,
    },
    dateText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    monthText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    detailsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    eventTitle: {
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        height: '100%',
        width: '100%',
        backgroundColor: '#fff',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    printiconButton: {
        position: 'absolute',
        right: 0,
        bottom: 15,
        padding: 10,
    },
    XiconButton: {
        position: 'absolute',
        left: 0,
        bottom: 15,
        padding: 10,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginVertical: 10,
    },
});
