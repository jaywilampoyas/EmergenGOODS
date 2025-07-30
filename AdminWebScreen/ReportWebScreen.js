import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, Dimensions, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

const eventicon = require('../Icons/eventicon.png');
const inventoryicon = require('../Icons/inventoryicon.png');
const sendnotificationicon = require('../Icons/sendnotificationicon.png');
const reporticon = require('../Icons/reporticon.png');
const manageusericon = require('../Icons/manageusericon.png');
const logouticon = require('../Icons/logouticon.png');
const dashboardicon = require('../Icons/dashboardicon.png');

const { width } = Dimensions.get('window');

export default function WebReport({ navigation }) {
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState(false);
  const [manageUserDropdown, setManageUserDropdown] = useState(false);
  const [eventDropdown, setEventDropdown] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scannedData, setScannedData] = useState([]);
  const [itemsData, setItemsData] = useState([]);
  const [userChartData, setUserChartData] = useState({ labels: ['Claimed Beneficiaries', 'Unclaimed Beneficiaries'], datasets: [{ data: [0, 0] }] });
  const [chartInfo, setChartInfo] = useState({
    totalClaimedBeneficiaries: 0,
    totalUnclaimedBeneficiaries: 0,
    regularItemsClaimed: {},
    regularItemsUnclaimed: {},
    monetaryItemsClaimed: {},
    monetaryItemsUnclaimed: {},
  });
  const [printOptionModalVisible, setPrintOptionModalVisible] = useState(false);
  const [monthlyBreakdownModalVisible, setMonthlyBreakdownModalVisible] = useState(false);
  const [monthlyData, setMonthlyData] = useState({
    monetaryItemsByMonth: {},
    regularItemsByMonth: {},
  });
  const [overallTotals, setOverallTotals] = useState({
    regularItemsTotal: 0,
    monetaryItemsTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const regularClaimedRef = useRef();
  const regularUnclaimedRef = useRef();
  const monetaryClaimedRef = useRef();
  const monetaryUnclaimedRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching events...');
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        const fetchedEvents = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(fetchedEvents);
        setFilteredEvents(fetchedEvents);
        console.log('Events fetched:', fetchedEvents.length);

        console.log('Fetching scanned data...');
        const scannedUsersSnapshot = await getDocs(collection(db, 'scannedUsers'));
        const fetchedScannedData = scannedUsersSnapshot.docs.map((doc) => ({
          id: doc.id,
          eventId: doc.data().eventId || doc.id,
          users: doc.data().users || [],
        }));
        setScannedData(fetchedScannedData);
        console.log('Scanned data fetched:', fetchedScannedData.length);

        console.log('Fetching items data...');
        const itemsSnapshot = await getDocs(collection(db, 'items'));
        const fetchedItemsData = itemsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItemsData(fetchedItemsData);
        console.log('Items data fetched:', fetchedItemsData.length);

        // Calculate monthly breakdown based on event dates
        console.log('Calculating monthly breakdown...');
        const processedEvents = new Set();
        const monetaryItemsByMonth = {};
        const regularItemsByMonth = {};

        for (const event of fetchedEvents) {
          if (processedEvents.has(event.id)) continue;
          processedEvents.add(event.id);

          const eventDate = event.date.toDate ? event.date.toDate() : new Date(event.date);
          const monthYear = eventDate.toLocaleString('default', { month: 'short', year: 'numeric' });

          const eventScannedData = fetchedScannedData.find((data) => data.eventId === event.id) || { users: [] };
          eventScannedData.users.forEach((user) => {
            if (user.items) {
              user.items.forEach((item) => {
                const itemDetails = fetchedItemsData.find((i) => i.id === item.itemId);
                if (itemDetails) {
                  if (itemDetails.type === 'Money' || itemDetails.type === 'Crypto') {
                    const amount = parseInt(item.amount || '0', 10) || 0;
                    monetaryItemsByMonth[monthYear] = (monetaryItemsByMonth[monthYear] || 0) + amount;
                  } else {
                    const quantity = parseInt(item.quantity || '0', 10) || 0;
                    regularItemsByMonth[monthYear] = (regularItemsByMonth[monthYear] || 0) + quantity;
                  }
                }
              });
            }
          });
        }
        console.log('Monthly Data:', { monetaryItemsByMonth, regularItemsByMonth }); // Debug log
        setMonthlyData({ monetaryItemsByMonth, regularItemsByMonth });

        // Calculate overall totals
        const regularItemsTotal = Object.values(regularItemsByMonth).reduce((sum, value) => sum + (value || 0), 0);
        const monetaryItemsTotal = Object.values(monetaryItemsByMonth).reduce((sum, value) => sum + (value || 0), 0);
        setOverallTotals({ regularItemsTotal, monetaryItemsTotal });
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert("Error", "Failed to fetch data. Please check your internet connection or data structure.");
      } finally {
        setIsLoading(false);
        console.log('Data loading completed');
      }
    };
    fetchData();
    fetchNotifications();
  }, []);

  const getScannedUsersCountAndItems = (eventId) => {
    console.log("Processing eventId:", eventId);
    const event = events.find((event) => event.id === eventId);
    if (!event) {
      console.error("Event not found for eventId:", eventId);
      return {
        totalClaimedBeneficiaries: 0,
        totalUnclaimedBeneficiaries: 0,
        regularItemsClaimed: {},
        regularItemsUnclaimed: {},
        monetaryItemsClaimed: {},
        monetaryItemsUnclaimed: {},
      };
    }

    const selectedUsers = [...new Set(event.selectedUsers || [])];
    const totalSelectedUsers = selectedUsers.length;
    console.log("Selected Users:", selectedUsers, "Total Selected Users:", totalSelectedUsers);

    const eventScannedData = scannedData.find((data) => data.eventId === eventId) || { users: [] };
    console.log("Matched Scanned Data:", eventScannedData);

    let claimedBeneficiaries = new Set();
    eventScannedData.users.forEach((user) => {
      if (user.fullName && user.items && user.items.length > 0) {
        claimedBeneficiaries.add(user.fullName);
      }
    });
    const totalClaimedBeneficiaries = claimedBeneficiaries.size;
    const totalUnclaimedBeneficiaries = Math.max(totalSelectedUsers - totalClaimedBeneficiaries, 0);
    console.log("Total Claimed Beneficiaries:", totalClaimedBeneficiaries, "Total Unclaimed Beneficiaries:", totalUnclaimedBeneficiaries);

    let regularItemsClaimed = {};
    let regularItemsUnclaimed = {};
    let monetaryItemsClaimed = {};
    let monetaryItemsUnclaimed = {};

    eventScannedData.users.forEach((user) => {
      if (user.items) {
        user.items.forEach((item) => {
          const itemDetails = itemsData.find((i) => i.id === item.itemId);
          if (itemDetails) {
            if (itemDetails.type === 'Money' || itemDetails.type === 'Crypto') {
              const amount = parseInt(item.amount || '0', 10);
              monetaryItemsClaimed[item.itemId] = (monetaryItemsClaimed[item.itemId] || 0) + amount;
            } else {
              const quantity = parseInt(item.quantity || '0', 10);
              regularItemsClaimed[item.itemId] = (regularItemsClaimed[item.itemId] || 0) + quantity;
            }
          } else {
            console.warn("Item not found in itemsData:", item.itemId);
          }
        });
      }
    });

    itemsData.forEach((item) => {
      const itemId = item.id;
      const totalQuantity = parseInt(item.totalQuantity || '0', 10) || 0;
      const totalAmount = parseInt(item.totalAmount || '0', 10) || 0;

      if (item.type !== 'Money' && item.type !== 'Crypto') {
        const claimedQuantity = regularItemsClaimed[itemId] || 0;
        if (claimedQuantity > 0) {
          regularItemsUnclaimed[itemId] = Math.max(totalQuantity - claimedQuantity, 0);
        }
      } else {
        const claimedAmount = monetaryItemsClaimed[itemId] || 0;
        if (claimedAmount > 0) {
          monetaryItemsUnclaimed[itemId] = Math.max(totalAmount - claimedAmount, 0);
        }
      }
    });

    console.log("Regular Items Claimed:", regularItemsClaimed);
    console.log("Regular Items Unclaimed:", regularItemsUnclaimed);
    console.log("Monetary Items Claimed:", monetaryItemsClaimed);
    console.log("Monetary Items Unclaimed:", monetaryItemsUnclaimed);

    return {
      totalClaimedBeneficiaries,
      totalUnclaimedBeneficiaries,
      regularItemsClaimed,
      regularItemsUnclaimed,
      monetaryItemsClaimed,
      monetaryItemsUnclaimed,
    };
  };

  const handleEventPress = (event) => {
    console.log("Event pressed:", event);
    setSelectedEvent(event);
    setModalVisible(true);

    try {
      const chartInfo = getScannedUsersCountAndItems(event.id);
      console.log("Chart Info:", chartInfo);
      setChartInfo(chartInfo);

      setUserChartData({
        labels: ['Claimed Beneficiaries', 'Unclaimed Beneficiaries'],
        datasets: [{ data: [chartInfo.totalClaimedBeneficiaries, chartInfo.totalUnclaimedBeneficiaries] }],
      });
    } catch (error) {
      console.error("Error in handleEventPress:", error);
      Alert.alert("Error", "Failed to load event details. Please try again.");
    }
  };

  const handlePrintOption = (option) => {
    setPrintOptionModalVisible(false);
    if (option === 'table') {
      handlePrint();
    } else if (option === 'chart') {
      handleChartPrint();
    } else if (option === 'both') {
      handlePrintBoth();
    }
  };

  const handlePrint = async () => {
    if (!selectedEvent) {
      console.error('No selected event for printing');
      Alert.alert('Error', 'No event selected for printing.');
      return;
    }

    const { totalClaimedBeneficiaries, totalUnclaimedBeneficiaries, regularItemsClaimed, regularItemsUnclaimed, monetaryItemsClaimed, monetaryItemsUnclaimed } = chartInfo;

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
              <td>${user.fullName || 'Unknown'}</td>
            </tr>`
        )
        .join('');
    } else {
      beneficiariesTable = `
        <tr>
          <td colspan="2">No scanned users found.</td>
        </tr>`;
    }

    const regularItemsClaimedTable = Object.entries(regularItemsClaimed)
      .map(
        ([itemId, quantity]) => {
          const item = itemsData.find((i) => i.id === itemId);
          const itemName = item ? item.name : itemId;
          return `
            <tr>
              <td>${itemName}</td>
              <td>${quantity.toLocaleString() || 0}</td>
            </tr>`;
        }
      )
      .join('');

    const regularItemsUnclaimedTable = Object.entries(regularItemsUnclaimed)
      .map(
        ([itemId, quantity]) => {
          const item = itemsData.find((i) => i.id === itemId);
          const itemName = item ? item.name : itemId;
          return `
            <tr>
              <td>${itemName}</td>
              <td>${quantity.toLocaleString() || 0}</td>
            </tr>`;
        }
      )
      .join('');

    const monetaryItemsClaimedTable = Object.entries(monetaryItemsClaimed)
      .map(
        ([itemId, amount]) => {
          const item = itemsData.find((i) => i.id === itemId);
          const itemName = item ? item.name : itemId;
          return `
            <tr>
              <td>${itemName}</td>
              <td>${amount.toLocaleString() || 0}</td>
            </tr>`;
        }
      )
      .join('');

    const monetaryItemsUnclaimedTable = Object.entries(monetaryItemsUnclaimed)
      .map(
        ([itemId, amount]) => {
          const item = itemsData.find((i) => i.id === itemId);
          const itemName = item ? item.name : itemId;
          return `
            <tr>
              <td>${itemName}</td>
              <td>${amount.toLocaleString() || 0}</td>
            </tr>`;
        }
      )
      .join('');

    const printableContent = `
      <html>
        <head>
          <title>${selectedEvent.title} - Report</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 20px;
              color: #333;
            }
            .header-container {
              text-align: center;
              padding-bottom: 15px;
              border-bottom: 2px solid #000;
            }
            .report-title {
              font-size: 22px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .event-details {
              font-size: 14px;
              color: #555;
            }
            .section-container {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 15px;
              margin-top: 20px;
              background-color: #f9f9f9;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              text-transform: uppercase;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
              color: #333;
            }
            .signature-container {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              page-break-inside: avoid;
            }
            .signature-label {
              width: 45%;
              text-align: center;
              font-size: 14px;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 20px;
              padding-top: 10px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #555;
              margin-top: 50px;
              padding-top: 10px;
              border-top: 2px solid #000;
            }
            .footer p {
              margin: 5px 0;
            }
            @media print {
              .footer {
                position: fixed;
                bottom: 0;
                width: 100%;
                text-align: center;
              }
              .signature-container {
                position: relative;
                bottom: auto;
                left: auto;
                right: auto;
              }
              .section-container {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="report-title">${selectedEvent.title} - Event Report</div>
            <div class="event-details">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="section-container">
            <p><strong>Total Claimed Beneficiaries:</strong> ${totalClaimedBeneficiaries || 0}</p>
            <p><strong>Total Unclaimed Beneficiaries:</strong> ${totalUnclaimedBeneficiaries || 0}</p>
            <p><strong>Total Claimed Regular Items:</strong> ${Object.values(regularItemsClaimed).reduce((a, b) => a + (b || 0), 0).toLocaleString()}</p>
            <p><strong>Total Unclaimed Regular Items:</strong> ${Object.values(regularItemsUnclaimed).reduce((a, b) => a + (b || 0), 0).toLocaleString()}</p>
            <p><strong>Total Claimed Monetary Items:</strong> ${Object.values(monetaryItemsClaimed).reduce((a, b) => a + (b || 0), 0).toLocaleString()}</p>
            <p><strong>Total Unclaimed Monetary Items:</strong> ${Object.values(monetaryItemsUnclaimed).reduce((a, b) => a + (b || 0), 0).toLocaleString()}</p>
          </div>

          <div class="section-container">
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

          <div class="section-container">
            <p class="section-title">Regular Items Claimed</p>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${regularItemsClaimedTable}
              </tbody>
            </table>
          </div>

          <div class="section-container">
            <p class="section-title">Regular Items Unclaimed</p>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${regularItemsUnclaimedTable}
              </tbody>
            </table>
          </div>

          <div class="section-container">
            <p class="section-title">Monetary Items Claimed</p>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                ${monetaryItemsClaimedTable}
              </tbody>
            </table>
          </div>

          <div class="section-container">
            <p class="section-title">Monetary Items Unclaimed</p>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                ${monetaryItemsUnclaimedTable}
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

          <div class="footer">
            <p>EmergenGOODS | Contact: emergengoods@gmail.com</p>
            <p>Page <span class="page-number"></span> | Report generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>`;

    try {
      if (window && window.print) {
        const printWindow = window.open('', 'PrintWindow', 'width=800,height=600');
        if (printWindow) {
          printWindow.document.write(printableContent);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
          }, 100);
        } else {
          console.error('Failed to open print window');
          await Print.printAsync({ html: printableContent });
        }
      } else {
        await Print.printAsync({ html: printableContent });
      }
    } catch (error) {
      console.error('Error printing:', error);
      Alert.alert('Error', 'Failed to print the report. Check console for details.');
    }
  };

  const handlePrintBoth = async () => {
    if (!selectedEvent) {
      console.error('No selected event for printing both');
      Alert.alert('Error', 'No event selected for printing both.');
      return;
    }

    const { totalClaimedBeneficiaries, totalUnclaimedBeneficiaries, regularItemsClaimed, regularItemsUnclaimed, monetaryItemsClaimed, monetaryItemsUnclaimed } = chartInfo;

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
              <td>${user.fullName || 'Unknown'}</td>
            </tr>`
        )
        .join('');
    } else {
      beneficiariesTable = `
        <tr>
          <td colspan="2">No scanned users found.</td>
        </tr>`;
    }

    const regularItemsClaimedTable = Object.entries(regularItemsClaimed)
      .map(
        ([itemId, quantity]) => {
          const item = itemsData.find((i) => i.id === itemId);
          const itemName = item ? item.name : itemId;
          return `
            <tr>
              <td>${itemName}</td>
              <td>${quantity.toLocaleString() || 0}</td>
            </tr>`;
        }
      )
      .join('');

    const regularItemsUnclaimedTable = Object.entries(regularItemsUnclaimed)
      .map(
        ([itemId, quantity]) => {
          const item = itemsData.find((i) => i.id === itemId);
          const itemName = item ? item.name : itemId;
          return `
            <tr>
              <td>${itemName}</td>
              <td>${quantity.toLocaleString() || 0}</td>
            </tr>`;
        }
      )
      .join('');

    const monetaryItemsClaimedTable = Object.entries(monetaryItemsClaimed)
      .map(
        ([itemId, amount]) => {
          const item = itemsData.find((i) => i.id === itemId);
          const itemName = item ? item.name : itemId;
          return `
            <tr>
              <td>${itemName}</td>
              <td>${amount.toLocaleString() || 0}</td>
            </tr>`;
        }
      )
      .join('');

    const monetaryItemsUnclaimedTable = Object.entries(monetaryItemsUnclaimed)
      .map(
        ([itemId, amount]) => {
          const item = itemsData.find((i) => i.id === itemId);
          const itemName = item ? item.name : itemId;
          return `
            <tr>
              <td>${itemName}</td>
              <td>${amount.toLocaleString() || 0}</td>
            </tr>`;
        }
      )
      .join('');

    const printableContent = `
      <html>
        <head>
          <title>${selectedEvent.title} - Report</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 20px;
              color: #333;
            }
            .header-container {
              text-align: center;
              padding-bottom: 15px;
              border-bottom: 2px solid #000;
            }
            .report-title {
              font-size: 22px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .event-details {
              font-size: 14px;
              color: #555;
            }
            .section-container {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 15px;
              margin-top: 20px;
              background-color: #f9f9f9;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              text-transform: uppercase;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
              color: #333;
            }
            .chart-container {
              margin-top: 30px;
              width: 100%;
              height: 450px;
              max-width: 900px;
              margin-left: auto;
              margin-right: auto;
            }
            .chart-bar {
              fill: rgba(255, 165, 0, 0.7);
            }
            .chart-label {
              font-size: 15px;
              fill: #000000;
              text-anchor: middle;
              alignment-baseline: middle;
            }
            .chart-value-label {
              font-size: 12px;
              fill: #000000;
              text-anchor: middle;
              alignment-baseline: middle;
            }
            .signature-container {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
              page-break-inside: avoid;
            }
            .signature-label {
              width: 45%;
              text-align: center;
              font-size: 14px;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 20px;
              padding-top: 10px;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #555;
              margin-top: 50px;
              padding-top: 10px;
              border-top: 2px solid #000;
            }
            .footer p {
              margin: 5px 0;
            }
            .page-break {
              page-break-before: always;
            }
            @media print {
              .footer {
                position: fixed;
                bottom: 0;
                width: 100%;
                text-align: center;
              }
              .signature-container {
                position: relative;
                bottom: auto;
                left: auto;
                right: auto;
              }
              .section-container {
                page-break-inside: avoid;
              }
              .chart-container {
                margin: 40px 0;
                page-break-inside: avoid;
              }
              .chart-container svg {
                width: 100% !important;
                height: 450px !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="report-title">${selectedEvent.title} - Combined Report</div>
            <div class="event-details">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="section-container">
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

          <div class="section-container">
            <p class="section-title">Regular Items Claimed</p>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${regularItemsClaimedTable}
              </tbody>
            </table>
            ${generateChartSVG(regularItemsClaimed, itemsData, 'Regular Items Claimed')}
          </div>

          <div class="section-container">
            <p class="section-title">Regular Items Unclaimed</p>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${regularItemsUnclaimedTable}
              </tbody>
            </table>
            ${generateChartSVG(regularItemsUnclaimed, itemsData, 'Regular Items Unclaimed')}
          </div>

          <div class="section-container">
            <p class="section-title">Monetary Items Claimed</p>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                ${monetaryItemsClaimedTable}
              </tbody>
            </table>
            ${generateChartSVG(monetaryItemsClaimed, itemsData, 'Monetary Items Claimed', true)}
          </div>

          <div class="section-container">
            <p class="section-title">Monetary Items Unclaimed</p>
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Amount (₱)</th>
                </tr>
              </thead>
              <tbody>
                ${monetaryItemsUnclaimedTable}
              </tbody>
            </table>
            ${generateChartSVG(monetaryItemsUnclaimed, itemsData, 'Unclaimed Monetary Items', true)}
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

          <div class="footer">
            <p>EmergenGOODS | Contact: emergengoods@gmail.com</p>
            <p>Page <span class="page-number"></span> | Report generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>`;

    try {
      if (window && window.print) {
        const printWindow = window.open('', 'PrintBothWindow', 'width=800,height=600');
        if (printWindow) {
          printWindow.document.write(printableContent);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
          }, 100);
        } else {
          console.error('Failed to open print both window');
          await Print.printAsync({ html: printableContent });
        }
      } else {
        await Print.printAsync({ html: printableContent });
      }
    } catch (error) {
      console.error('Error printing both:', error);
      Alert.alert('Error', 'Failed to print the combined report. Check console for details.');
    }
  };

  const handleChartPrint = async () => {
    if (!selectedEvent) {
      console.error('No selected event for chart printing');
      Alert.alert('Error', 'No event selected for chart printing.');
      return;
    }

    const { totalClaimedBeneficiaries, totalUnclaimedBeneficiaries, regularItemsClaimed, regularItemsUnclaimed, monetaryItemsClaimed, monetaryItemsUnclaimed } = chartInfo || {};
    console.log('Chart Data:', { totalClaimedBeneficiaries, totalUnclaimedBeneficiaries, regularItemsClaimed, regularItemsUnclaimed, monetaryItemsClaimed, monetaryItemsUnclaimed });

    // Prepare totals for bar chart representation
    const totalLabels = [
      'Total Claimed Beneficiaries',
      'Total Unclaimed Beneficiaries',
      'Total Claimed Regular Items',
      'Total Unclaimed Regular Items',
      'Total Claimed Monetary Items',
      'Total Unclaimed Monetary Items',
    ];
    const totalValues = [
      totalClaimedBeneficiaries || 0,
      totalUnclaimedBeneficiaries || 0,
      Object.values(regularItemsClaimed).reduce((a, b) => a + (b || 0), 0) || 0,
      Object.values(regularItemsUnclaimed).reduce((a, b) => a + (b || 0), 0) || 0,
      Object.values(monetaryItemsClaimed).reduce((a, b) => a + (b || 0), 0) || 0,
      Object.values(monetaryItemsUnclaimed).reduce((a, b) => a + (b || 0), 0) || 0,
    ];

    const printableContent = `
      <html>
        <head>
          <title>${selectedEvent.title} - Bar Chart Report</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 20px; }
            .section-title { font-size: 18px; font-weight: bold; margin-top: 40px; }
            .chart-container {
              margin-top: 20px;
              width: 100%;
              height: 500px;
              max-width: 900px;
              margin-left: auto;
              margin-right: auto;
            }
            .chart-bar {
              fill: rgba(255, 165, 0, 0.7);
            }
            .chart-label {
              font-size: 12px;
              fill: #000000;
              text-anchor: middle;
              alignment-baseline: middle;
            }
            .chart-value-label {
              font-size: 12px;
              fill: #000000;
              text-anchor: middle;
              alignment-baseline: middle;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .chart-container { margin: 40px 0; page-break-inside: avoid; }
              .chart-container svg { width: 100% !important; height: 500px !important; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <h2>${selectedEvent.title} - Bar Chart Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>

          <div class="section-title">Claimed Regular Items</div>
          ${generateChartSVG(regularItemsClaimed, itemsData, 'Claimed Regular Items')}
          <div class="page-break"></div>

          <div class="section-title">Unclaimed Regular Items</div>
          ${generateChartSVG(regularItemsUnclaimed, itemsData, 'Unclaimed Regular Items')}
          <div class="page-break"></div>

          <div class="section-title">Claimed Monetary Items</div>
          ${generateChartSVG(monetaryItemsClaimed, itemsData, 'Claimed Monetary Items', true)}
          <div class="page-break"></div>

          <div class="section-title">Unclaimed Monetary Items</div>
          ${generateChartSVG(monetaryItemsUnclaimed, itemsData, 'Unclaimed Monetary Items', true)}
          <div class="page-break"></div>

          <div class="section-title">Totals</div>
          ${generateChartSVGForTotals(totalLabels, totalValues)}

          <div class="footer-label">Report generated by EmergenGOODS</div>
        </body>
      </html>`;

    console.log('Printable Content:', printableContent);
    try {
      const printWindow = window.open('', 'ChartPrintWindow', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(printableContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 100);
      } else {
        console.error('Failed to open chart print window');
        await Print.printAsync({ html: printableContent });
      }
    } catch (error) {
      console.error('Error printing chart:', error);
      Alert.alert('Error', 'Failed to print the chart report. Check console for details.');
    }
  };

  const generateChartSVG = (items, itemsData, title, isMonetary = false) => {
    try {
      const safeItems = items || {};
      const safeItemsData = itemsData || [];
      const itemLabels = Object.keys(safeItems).map(id => {
        const item = safeItemsData.find(i => i.id === id);
        return item ? item.name || id : id;
      }) || [];
      const values = Object.values(safeItems) || [];
      if (itemLabels.length === 0 || values.length === 0) {
        return '<div class="chart-container"><p>No data available for this chart.</p></div>';
      }

      console.log(`Generating SVG for ${title}: Labels=${itemLabels}, Values=${values}`);
      const maxValue = Math.max(...values.map(v => v || 1), 1);
      const barWidth = 70;
      const barSpacing = 50;
      const chartWidth = (barWidth + barSpacing) * itemLabels.length - barSpacing;
      const chartHeight = 450;

      const bars = itemLabels.map((label, index) => {
        const value = values[index] || 0;
        const barHeight = (value / maxValue) * chartHeight || 1;
        const x = index * (barWidth + barSpacing);
        const displayValue = isMonetary ? `₱${value.toLocaleString()}` : value.toLocaleString();
        const truncatedValue = displayValue.length > 6 ? `${displayValue.slice(0, 6)}...` : displayValue;

        return `
          <g>
            <rect class="chart-bar" x="${x}" y="${chartHeight - barHeight}" width="${barWidth}" height="${barHeight}"></rect>
            <text class="chart-label" x="${x + barWidth / 2}" y="${chartHeight + 30}">${label}</text>
            <text class="chart-value-label" x="${x + barWidth / 2}" y="${chartHeight - (barHeight / 2)}">${truncatedValue}</text>
          </g>`;
      }).join('');

      return `
        <div class="chart-container">
          <svg width="${chartWidth}" height="${chartHeight + 60}">
            ${bars}
          </svg>
        </div>`;
    } catch (error) {
      console.error(`Error generating SVG for ${title}:`, error);
      return '<div class="chart-container"><p>Error generating chart. Check console for details.</p></div>';
    }
  };

  const generateChartSVGForTotals = (labels, values) => {
    try {
      if (labels.length === 0 || values.length === 0 || labels.length !== values.length) {
        return '<div class="chart-container"><p>No data available for totals chart.</p></div>';
      }

      console.log(`Generating SVG for Totals: Labels=${labels}, Values=${values}`);
      const maxValue = Math.max(...values.map(v => v || 1), 1);
      const barWidth = 70;
      const barSpacing = 50;
      const chartWidth = (barWidth + barSpacing) * labels.length - barSpacing;
      const chartHeight = 500;
      const minBarHeight = 50;

      const bars = labels.map((label, index) => {
        const value = values[index] || 0;
        let barHeight;
        if (value < 1000) {
          barHeight = minBarHeight;
        } else {
          barHeight = (value / maxValue) * chartHeight || 1;
        }
        const x = index * (barWidth + barSpacing);
        const displayValue = label.includes('Monetary Items') ? `₱${value.toLocaleString()}` : value.toLocaleString();

        return `
          <g>
            <rect class="chart-bar" x="${x}" y="${chartHeight - barHeight}" width="${barWidth}" height="${barHeight}"></rect>
            <text class="chart-label" x="${x + barWidth / 2}" y="${chartHeight + 30}">${label}</text>
            <text class="chart-value-label" x="${x + barWidth / 2}" y="${chartHeight - (barHeight / 2)}">${displayValue}</text>
          </g>`;
      }).join('');

      return `
        <div class="chart-container">
          <svg width="${chartWidth}" height="${chartHeight + 60}">
            ${bars}
          </svg>
        </div>`;
    } catch (error) {
      console.error(`Error generating SVG for totals:`, error);
      return '<div class="chart-container"><p>Error generating totals chart. Check console for details.</p></div>';
    }
  };

  const renderBarChart = (items, itemLabels, maxHeight = 250, slimFactor = 1) => {
    const containerWidth = Math.min(width - wp('18%'), wp('95%') - wp('4%'));
    const maxVisibleItems = 4; // Base design for 4 items
    const barWidth = (containerWidth / maxVisibleItems * 0.8) * 0.7 * slimFactor;
    const maxValue = Math.max(...Object.values(items || {}).map(v => v || 1), 1);
    const barSpacing = (containerWidth / maxVisibleItems) * 0.2;
    const calculatedChartWidth = (barWidth + barSpacing) * itemLabels.length - barSpacing;

    // Use ScrollView only if items >= 5
    const shouldScroll = itemLabels.length >= 5;
    const chartWidth = shouldScroll ? calculatedChartWidth : containerWidth; // Use full width for < 5 items

    return (
      <View style={styles.chartContainer}>
        {shouldScroll ? (
          <ScrollView horizontal={true} style={styles.chartScroll} contentContainerStyle={{ width: calculatedChartWidth }}>
            <Svg height={maxHeight + 40} width={calculatedChartWidth}>
              {itemLabels.map((label, index) => {
                const itemId = itemsData.find(i => i.name === label)?.id;
                const value = itemId ? (items[itemId] || 0) : 0;
                const barHeight = (value / maxValue) * maxHeight || 1;
                const x = index * (barWidth + barSpacing);
                const textY = maxHeight - (barHeight / 2);
                const displayValue = (itemsData.find(i => i.id === itemId)?.type === 'Money' || itemsData.find(i => i.id === itemId)?.type === 'Crypto') ? `₱${value}` : value;
                return (
                  <React.Fragment key={index}>
                    <Rect
                      x={x}
                      y={maxHeight - barHeight}
                      width={barWidth}
                      height={barHeight}
                      fill="rgba(255, 165, 0, 0.7)"
                    />
                    <SvgText
                      x={x + barWidth / 2}
                      y={maxHeight + 20}
                      fontSize="16"
                      fill="#000"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {label.length > 10 ? `${label.slice(0, 10)}...` : label}
                    </SvgText>
                    <SvgText
                      x={x + barWidth / 2}
                      y={textY}
                      fontSize="14"
                      fill="#000"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {displayValue}
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </ScrollView>
        ) : (
          <Svg height={maxHeight + 40} width={chartWidth}>
            {itemLabels.map((label, index) => {
              const itemId = itemsData.find(i => i.name === label)?.id;
              const value = itemId ? (items[itemId] || 0) : 0;
              const barHeight = (value / maxValue) * maxHeight || 1;
              const x = (index * (barWidth + barSpacing)) * (containerWidth / calculatedChartWidth);
              const textY = maxHeight - (barHeight / 2);
              const displayValue = (itemsData.find(i => i.id === itemId)?.type === 'Money' || itemsData.find(i => i.id === itemId)?.type === 'Crypto') ? `₱${value}` : value;
              return (
                <React.Fragment key={index}>
                  <Rect
                    x={x}
                    y={maxHeight - barHeight}
                    width={barWidth * (containerWidth / Math.max(calculatedChartWidth, containerWidth))}
                    height={barHeight}
                    fill="rgba(255, 165, 0, 0.7)"
                  />
                  <SvgText
                    x={x + (barWidth * (containerWidth / Math.max(calculatedChartWidth, containerWidth))) / 2}
                    y={maxHeight + 20}
                    fontSize="16"
                    fill="#000"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {label.length > 10 ? `${label.slice(0, 10)}...` : label}
                  </SvgText>
                  <SvgText
                    x={x + (barWidth * (containerWidth / Math.max(calculatedChartWidth, containerWidth))) / 2}
                    y={textY}
                    fontSize="14"
                    fill="#000"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {displayValue}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        )}
      </View>
    );
  };

  const renderMonthlyBreakdownChart = (data, title, isMonetary = false) => {
    const itemLabels = Object.keys(data || {});
    const values = itemLabels.map(key => data[key] || 0);
    if (itemLabels.length === 0 || values.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text>No data available for this chart.</Text>
        </View>
      );
    }

    const containerWidth = Math.min(width - wp('18%'), wp('95%') - wp('4%'));
    const maxVisibleItems = 6; // Base design for 6 items
    const barWidth = (containerWidth / maxVisibleItems * 0.8) * 0.7;
    const maxValue = Math.max(...values.map(v => v || 1), 1);
    const barSpacing = (containerWidth / maxVisibleItems) * 0.2;
    const calculatedChartWidth = (barWidth + barSpacing) * itemLabels.length - barSpacing;

    // Use ScrollView only if items >= 5
    const shouldScroll = itemLabels.length >= 5;
    const chartWidth = shouldScroll ? calculatedChartWidth : containerWidth; // Use full width for < 5 items

    return (
      <View style={styles.chartContainer}>
        {shouldScroll ? (
          <ScrollView horizontal={true} style={styles.chartScroll} contentContainerStyle={{ width: calculatedChartWidth }}>
            <Svg height={250 + 40} width={calculatedChartWidth}>
              {itemLabels.map((label, index) => {
                const value = values[index] || 0;
                const barHeight = (value / maxValue) * 250 || 1;
                const x = index * (barWidth + barSpacing);
                const textY = 250 - (barHeight / 2);
                const displayValue = isMonetary ? `₱${value.toLocaleString()}` : value.toLocaleString();
                return (
                  <React.Fragment key={index}>
                    <Rect x={x} y={250 - barHeight} width={barWidth} height={barHeight} fill="rgba(255, 165, 0, 0.7)" />
                    <SvgText x={x + barWidth / 2} y={250 + 20} fontSize="16" fill="#000" textAnchor="middle" alignmentBaseline="middle">{label}</SvgText>
                    <SvgText x={x + barWidth / 2} y={textY} fontSize="14" fill="#000" textAnchor="middle" alignmentBaseline="middle">{displayValue}</SvgText>
                  </React.Fragment>
                );
              })}
            </Svg>
          </ScrollView>
        ) : (
          <Svg height={250 + 40} width={chartWidth}>
            {itemLabels.map((label, index) => {
              const value = values[index] || 0;
              const barHeight = (value / maxValue) * 250 || 1;
              const x = (index * (barWidth + barSpacing)) * (containerWidth / Math.max(calculatedChartWidth, containerWidth));
              const textY = 250 - (barHeight / 2);
              const displayValue = isMonetary ? `₱${value.toLocaleString()}` : value.toLocaleString();
              return (
                <React.Fragment key={index}>
                  <Rect
                    x={x}
                    y={250 - barHeight}
                    width={barWidth * (containerWidth / Math.max(calculatedChartWidth, containerWidth))}
                    height={barHeight}
                    fill="rgba(255, 165, 0, 0.7)"
                  />
                  <SvgText
                    x={x + (barWidth * (containerWidth / Math.max(calculatedChartWidth, containerWidth))) / 2}
                    y={250 + 20}
                    fontSize="16"
                    fill="#000"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {label}
                  </SvgText>
                  <SvgText
                    x={x + (barWidth * (containerWidth / Math.max(calculatedChartWidth, containerWidth))) / 2}
                    y={textY}
                    fontSize="14"
                    fill="#000"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {displayValue}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>
        )}
      </View>
    );
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
          <Ionicons name="chevron-forward-outline" size={24} color="#000" />
        </View>
      </TouchableOpacity>
    );
  };

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const verificationNotifications = await getDocs(collection(db, 'verificationNotifications'));
      const verificationNotificationsData = verificationNotifications.docs.map((doc) => ({
        id: doc.id,
        type: 'Verification Pending',
        message: doc.data().message || 'No message provided',
        status: doc.data().status || 'No status provided',
        read: doc.data().read || false,
        submittedAt: doc.data().timestamp || 'No timestamp available',
      }));
      setNotifications(verificationNotificationsData);
      const hasNewNotifications = verificationNotificationsData.some((n) => !n.read);
      setNewNotification(hasNewNotifications);
      if (hasNewNotifications) {
        Alert.alert('You have new notifications. Check them now!');
      }
      console.log('Notifications fetched:', verificationNotificationsData.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to fetch notifications. Please try again later.');
    }
  };

  const handleMarkAsRead = async (notification) => {
    try {
      console.log('Marking notification as read:', notification.id);
      const collectionName = 'verificationNotifications';
      const docRef = doc(db, collectionName, notification.id);
      await updateDoc(docRef, { read: !notification.read });
      setNotifications((prev) =>
        prev.map((item) => (item.id === notification.id ? { ...item, read: !item.read } : item))
      );
      setNewNotification(notifications.some((n) => !n.read));
      console.log('Notification updated:', notification.id);
    } catch (error) {
      showAlert('Error', 'Failed to update notification status');
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      if (navigation && navigation.navigate) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'WebSignIn' }],
        });
      } else {
        console.error("Navigation object is not defined or 'WebSignIn' route does not exist.");
      }
    }
  };

  const showAlert = (title, message) => {
    window.alert(`${title}: ${message}`);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'No timestamp available';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString();
  };

  const renderNotification = ({ item }) => (
    <View style={styles.notificationCard}>
      <Text style={styles.notificationTitle}>{item.type}</Text>
      {item.type === 'Verification Pending' && (
        <>
          <Text style={styles.notificationText}>Message: {item.message}</Text>
          <Text style={styles.notificationText}>Status: ${item.status}</Text>
        </>
      )}
      <Text style={styles.notificationTimestamp}>Submitted at: {formatTimestamp(item.submittedAt)}</Text>
      <TouchableOpacity onPress={() => handleMarkAsRead(item)} style={styles.markAsReadButton}>
        <Text style={styles.markAsReadText}>{item.read ? 'Mark as Unread' : 'Mark as Read'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHiddenCharts = () => (
    <View style={{ position: 'absolute', top: 0, left: -9999 }}>
      <View ref={regularClaimedRef}>
        {renderBarChart(chartInfo.regularItemsClaimed, Object.keys(chartInfo.regularItemsClaimed).map(id => {
          const item = itemsData.find(i => i.id === id);
          return item ? item.name : id;
        }))}
      </View>
      <View ref={regularUnclaimedRef}>
        {renderBarChart(chartInfo.regularItemsUnclaimed, Object.keys(chartInfo.regularItemsUnclaimed).map(id => {
          const item = itemsData.find(i => i.id === id);
          return item ? item.name : id;
        }))}
      </View>
      <View ref={monetaryClaimedRef}>
        {renderBarChart(chartInfo.monetaryItemsClaimed, Object.keys(chartInfo.monetaryItemsClaimed).map(id => {
          const item = itemsData.find(i => i.id === id);
          return item ? item.name : id;
        }), 250, 0.6)}
      </View>
      <View ref={monetaryUnclaimedRef}>
        {renderBarChart(chartInfo.monetaryItemsUnclaimed, Object.keys(chartInfo.monetaryItemsUnclaimed).map(id => {
          const item = itemsData.find(i => i.id === id);
          return item ? item.name : id;
        }), 250, 0.6)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHiddenCharts()}
      <View style={styles.sidebar}>
        <Image source={require('../Logos/EGLogoNoName.png')} style={styles.logo} />
        <Text style={styles.logoName}>
          <Text style={{ color: '#00A600' }}>Emergen</Text>
          <Text style={{ color: '#FF7D05' }}>GOODS</Text>
        </Text>

        <View style={styles.navButtons}>
          <TouchableOpacity onPress={() => navigation.navigate('AdminWebHome')} style={styles.navButton}>
            <Image source={dashboardicon} style={styles.icon} />
            <Text style={styles.navButtonText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setEventDropdown(!eventDropdown)} style={styles.navButton}>
            <Image source={eventicon} style={styles.icon} />
            <Text style={styles.navButtonText}>Event</Text>
            <Ionicons name={eventDropdown ? 'chevron-up' : 'chevron-down'} size={20} />
          </TouchableOpacity>

          {eventDropdown && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity onPress={() => navigation.navigate('WebCreateEvent')} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>Create Event</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('WebEvent')} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>View Events</Text>
              </TouchableOpacity>
            </View>
          )}

          {[
            { name: 'Inventory', icon: inventoryicon, route: 'WebInventory' },
            { name: 'Send Notification', icon: sendnotificationicon, route: 'WebSendNotification' },
            { name: 'Report', icon: reporticon, route: 'WebReport' },
          ].map((item, index) => (
            <TouchableOpacity key={index} onPress={() => navigation.navigate(item.route)} style={styles.navButton}>
              <Image source={item.icon} style={styles.icon} />
              <Text style={styles.navButtonText}>{item.name}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity onPress={() => navigation.navigate('WebPendingAccount')} style={styles.navButton}>
            <Image source={manageusericon} style={styles.icon} />
            <Text style={styles.navButtonText}>Pending Account</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Image source={logouticon} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.contentText}>Reports</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => setMonthlyBreakdownModalVisible(true)} style={styles.iconButton}>
              <Ionicons name="bar-chart-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNotificationsVisible(!isNotificationsVisible)} style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={newNotification ? 'red' : 'black'} />
            </TouchableOpacity>
          </View>
        </View>

        {isNotificationsVisible && (
          <View style={styles.notificationsDropdown}>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderNotification}
              style={styles.notificationList}
            />
          </View>
        )}

        <TextInput
          style={styles.searchBar}
          placeholder="Search Event..."
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
        />

        <ScrollView style={styles.eventList}>
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
          />
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <View style={styles.modalContent}>
              {selectedEvent ? (
                <>
                  <Text style={styles.modalTitle}>{selectedEvent.title || 'No Title'}</Text>
                  <View style={styles.iconRow}>
                    <TouchableOpacity onPress={() => setPrintOptionModalVisible(true)} style={styles.printiconButton}>
                      <Ionicons name="print-outline" size={30} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.XiconButton}>
                      <Ionicons name="close-outline" size={30} color="#000" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 20 }}>
                    <View style={styles.card}>
                      <Ionicons name="checkmark-done-circle" size={50} color="#4CAF50" />
                      <Text style={styles.cardTitle}>CLAIMED BENEFICIARIES</Text>
                      <Text style={styles.cardNumber}>{chartInfo.totalClaimedBeneficiaries || 0}</Text>
                    </View>
                    <View style={styles.card}>
                      <Ionicons name="close-circle" size={50} color="#F44336" />
                      <Text style={styles.cardTitle}>UNCLAIMED BENEFICIARIES</Text>
                      <Text style={styles.cardNumber}>{chartInfo.totalUnclaimedBeneficiaries || 0}</Text>
                    </View>
                  </View>

                  <View style={styles.chartWrapper}>
                    <Text style={styles.chartTitle}>Regular Items Claimed:</Text>
                    {renderBarChart(chartInfo.regularItemsClaimed, Object.keys(chartInfo.regularItemsClaimed).map(id => {
                      const item = itemsData.find(i => i.id === id);
                      return item ? item.name : id;
                    }))}
                  </View>

                  <View style={styles.chartWrapper}>
                    <Text style={styles.chartTitle}>Regular Items Unclaimed:</Text>
                    {renderBarChart(chartInfo.regularItemsUnclaimed, Object.keys(chartInfo.regularItemsUnclaimed).map(id => {
                      const item = itemsData.find(i => i.id === id);
                      return item ? item.name : id;
                    }))}
                  </View>

                  <View style={styles.chartWrapper}>
                    <Text style={styles.chartTitle}>Monetary Items Claimed:</Text>
                    {renderBarChart(chartInfo.monetaryItemsClaimed, Object.keys(chartInfo.monetaryItemsClaimed).map(id => {
                      const item = itemsData.find(i => i.id === id);
                      return item ? item.name : id;
                    }), 250, 0.6)}
                  </View>

                  <View style={styles.chartWrapper}>
                    <Text style={styles.chartTitle}>Monetary Items Unclaimed:</Text>
                    {renderBarChart(chartInfo.monetaryItemsUnclaimed, Object.keys(chartInfo.monetaryItemsUnclaimed).map(id => {
                      const item = itemsData.find(i => i.id === id);
                      return item ? item.name : id;
                    }), 250, 0.6)}
                  </View>
                </>
              ) : (
                <Text style={styles.modalTitle}>No event selected</Text>
              )}
            </View>
          </ScrollView>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={monthlyBreakdownModalVisible}
          onRequestClose={() => setMonthlyBreakdownModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Monthly Breakdown</Text>
              <View style={styles.iconRow}>
                <TouchableOpacity onPress={() => setMonthlyBreakdownModalVisible(false)} style={styles.XiconButton}>
                  <Ionicons name="close-outline" size={30} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.monthlyBreakdownScroll}>
                <View style={styles.chartWrapper}>
                  <Text style={styles.totalText}>Overall Regular Items claimed: {overallTotals.regularItemsTotal}</Text>
                  <Text style={styles.chartTitle}>Regular Items by Month:</Text>
                  {renderMonthlyBreakdownChart(monthlyData.regularItemsByMonth, 'Regular Items by Month')}
                </View>

                <View style={styles.chartWrapper}>
                  <Text style={styles.totalText}>Overall Monetary Items claimed: ₱{overallTotals.monetaryItemsTotal.toLocaleString()}</Text>
                  <Text style={styles.chartTitle}>Monetary Items by Month:</Text>
                  {renderMonthlyBreakdownChart(monthlyData.monetaryItemsByMonth, 'Monetary Items by Month', true)}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={printOptionModalVisible}
          onRequestClose={() => setPrintOptionModalVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.modalprintContainer}>
              <Text style={styles.modalTitle}>Select Print Option</Text>
              <TouchableOpacity style={styles.optionButton} onPress={() => handlePrintOption('table')}>
                <Text style={styles.optionButtonText}>Print Tabular Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionButton} onPress={() => handlePrintOption('chart')}>
                <Text style={styles.optionButtonText}>Print Bar Chart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionButton} onPress={() => handlePrintOption('both')}>
                <Text style={styles.optionButtonText}>Print Both Tabular and Bar Chart</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setPrintOptionModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: wp('100%'),
    flexDirection: 'row',
  },
  sidebar: {
    width: wp('18%'),
    backgroundColor: '#fff',
    padding: wp('2%'),
    borderRightWidth: wp('0.1%'),
    borderRightColor: '#ddd',
  },
  logo: {
    width: wp('2.5%'),
    height: hp('5%'),
    alignSelf: 'center',
  },
  logoName: {
    fontSize: wp('1%'),
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: hp('1%'),
  },
  navButtons: {
    marginTop: hp('2%'),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('0.1%'),
    marginBottom: hp('1.2%'),
  },
  icon: {
    width: wp('2%'),
    height: hp('4%'),
    marginRight: 10,
  },
  navButtonText: {
    fontSize: wp('1%'),
    fontWeight: 'bold',
    flex: 1,
  },
  dropdownMenu: {
    marginLeft: wp('1.7%'),
  },
  dropdownItem: {
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('1%'),
  },
  dropdownText: {
    fontSize: wp('0.9%'),
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('1%'),
    borderRadius: wp('1%'),
  },
  logoutIcon: {
    width: wp('2%'),
    height: hp('4%'),
    marginRight: wp('1%'),
  },
  logoutText: {
    fontSize: wp('1%'),
    fontWeight: 'bold',
    color: 'red',
  },
  mainContent: {
    flex: wp('100%'),
    backgroundColor: '#F4F6F8',
    padding: wp('1%'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.1%'),
    borderBottomWidth: wp('0.1%'),
    borderColor: '#ddd',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: wp('1%'),
  },
  content: {
    maxWidth: wp('100%'),
    maxHeight: hp('85%'),
    marginBottom: hp('0.01%'),
    overflow: 'hidden',
  },
  contentText: {
    fontSize: wp('1.5%'),
    fontWeight: 'bold',
  },
  notificationsDropdown: {
    position: 'absolute',
    top: hp('9%'),
    right: wp('0.1%'),
    width: wp('25%'),
    maxHeight: hp('90%'),
    backgroundColor: '#f8f8f8',
    padding: wp('1%'),
    shadowColor: '#000',
    shadowOpacity: wp('0.1%'),
    shadowRadius: wp('0.1%'),
    elevation: hp('0.1%'),
    zIndex: hp('1000%'),
    borderRadius: wp('1%'),
  },
  notificationList: {
    marginTop: hp('1%'),
  },
  notificationCard: {
    padding: wp('1%'),
    borderBottomWidth: wp('0.1%'),
    borderBottomColor: '#ddd',
  },
  notificationTitle: {
    fontSize: wp('1%'),
    fontWeight: 'bold',
  },
  notificationText: {
    fontSize: wp('0.9%'),
  },
  notificationTimestamp: {
    fontSize: wp('0.8%'),
    color: '#666',
  },
  markAsReadButton: {
    marginTop: hp('1%'),
    padding: wp('0.1%'),
    backgroundColor: '#ddd',
    borderRadius: wp('1%'),
  },
  markAsReadText: {
    fontSize: wp('0.9%'),
    fontWeight: 'bold',
  },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 16,
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: wp('2%'),
  },
  modalContent: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F4F6F8',
    padding: wp('2%'),
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minHeight: hp('80%'),
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
    margintop: 20,
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
    textAlign: 'center',
  },
  chartWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  chartContainer: {
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 5,
    padding: 10,
    width: '95%',
    maxWidth: wp('95%'),
    minHeight: 300,
    alignSelf: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  chartScroll: {
    width: '100%',
    maxWidth: width - wp('18%'),
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalprintContainer: {
    width: '85%',
    maxWidth: 600,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 'auto',
    position: 'relative',
  },
  optionButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  optionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    width: '100%',
    backgroundColor: '#FF3B3B',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  eventList: {
    maxHeight: hp('80%'),
    marginBottom: hp('1%'),
    overflow: 'hidden',
  },
  card: {
    width: 150,
    height: 150,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    margin: 10,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 10,
    color: '#333',
    textAlign: 'center',
  },
  cardNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333',
  },
  totalIndicators: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 5,
  },
  monthlyBreakdownScroll: {
    maxHeight: hp('75%'),
  },
});