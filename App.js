import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native'; // Import Platform for platform detection
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import LandingPage from './LoginSignupScreen/landingpagescreen';
import SignInScreen from './LoginSignupScreen/signinscreen';
import SignUpScreen from './LoginSignupScreen/signupscreen';
import BeneficiaryHomeScreen from './BeneficiaryScreen/BeneficiaryHomeScreen';
import VerifyAccountScreen from './BeneficiaryScreen/VerifyAccountScreen';
import QR from './BeneficiaryScreen/QRScreen';
import BeneficiarySettings from './BeneficiaryScreen/BeneficiarySettingsScreen';
import AdminHomeScreen from './AdminScreen/AdminHomeScreen';
import EventScreen from './AdminScreen/EventScreen';
import CreateEventScreen from './AdminScreen/ManageEventScreen/CreateEventScreen';
import InventoryScreen from './AdminScreen/InventoryScreen';
import SendNotificationScreen from './AdminScreen/SendNotificationScreen';
import ReportScreen from './AdminScreen/ReportScreen';
import ManageUserScreen from './AdminScreen/ManageUserScreen';
import VolunteerAccountScreen from './AdminScreen/ManageUserScreen/VolunteerAccountScreen';
import ManageBeneficiaryScreen from './AdminScreen/ManageUserScreen/ManageBeneficiaryScreen';
import ManageVolunteerScreen from './AdminScreen/ManageUserScreen/ManageVolunteerScreen';
import PendingAccountScreen from './AdminScreen/ManageUserScreen/PendingAccountScreen';
import VolunteerHomeScreen from './VolunteerScreen/VolunteerHomeScreen';

//WEB VIEW ADMIN
import WebSignInScreen from './AdminWebScreen/websigninscreen';
import AdminWebHomeScreen from './AdminWebScreen/AdminWebHomeScreen';
import InventoryWebScreen from './AdminWebScreen/InventoryWebScreen';
import ReportWebScreen from './AdminWebScreen/ReportWebScreen';
import SendNotificationWebScreen from './AdminWebScreen/SendNotificationWebScreen';
import EventWebScreen from './AdminWebScreen/EventWebScreen';
import CreateEventWebScreen from './AdminWebScreen/ManageWebEventScreen/CreateEventWebScreen';
import ManageUserWebScreen from './AdminWebScreen/ManageUserWebScreen';
import VolunteerAccountWebScreen from './AdminWebScreen/ManageWebUserScreen/VolunteerAccountWebScreen';
import ManageBeneficiaryWebScreen from './AdminWebScreen/ManageWebUserScreen/ManageBeneficiaryWebScreen';
import ManageVolunteerWebScreen from './AdminWebScreen/ManageWebUserScreen/ManageVolunteerWebScreen';
import PendingAccountWebScreen from './AdminWebScreen/ManageWebUserScreen/PendingAccountWebScreen';
import SuperAdminScreen from './AdminWebScreen/SuperAdmin';
import CreateAdminScreen from './AdminWebScreen/CreateAdmin';
import ManageAdminScreen from './AdminWebScreen/ManageAdmin';

const Stack = createStackNavigator();

export default function App() {
  // Font loading state
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await Font.loadAsync({
          'KronaOne': require('./assets/fonts/KronaOne-Regular.ttf'),
          'Inter': require('./assets/fonts/Inter-VariableFont.ttf'),
          'Inter-Italic': require('./assets/fonts/Inter-Italic-VariableFont.ttf'),
        });
        setFontLoaded(true);
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn(e);
      }
    }
    loadResources();
  }, []);

  if (!fontLoaded) {
    return null; // Show nothing while fonts are loading
  }

  // Check if the app is running in the web environment
  if (Platform.OS === 'web') {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="WebSignIn">
          <Stack.Screen name="WebSignIn" component={WebSignInScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AdminWebHome" component={AdminWebHomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebInventory" component={InventoryWebScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebReport" component={ReportWebScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebSendNotification" component={SendNotificationWebScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebEvent" component={EventWebScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebCreateEvent" component={CreateEventWebScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebManageUser" component={ManageUserWebScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebVolunteerAccount" component={VolunteerAccountWebScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebManageBeneficiary" component={ManageBeneficiaryWebScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebManageVolunteer" component={ManageVolunteerWebScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WebPendingAccount" component={PendingAccountWebScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SuperAdmin" component={SuperAdminScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CreateAdmin" component={CreateAdminScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ManageAdmin" component={ManageAdminScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing">
        <Stack.Screen name="Landing" component={LandingPage} options={{ headerShown: false }} />
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BeneficiaryHome" component={BeneficiaryHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VerifyAccount" component={VerifyAccountScreen} options={{ headerShown: false }} />
        <Stack.Screen name="QR" component={QR} options={{ headerShown: false }} />
        <Stack.Screen name="BeneficiarySettings" component={BeneficiarySettings} options={{ headerShown: false }} />
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Event" component={EventScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SendNotification" component={SendNotificationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Report" component={ReportScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ManageUser" component={ManageUserScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VolunteerAccount" component={VolunteerAccountScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ManageBeneficiary" component={ManageBeneficiaryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ManageVolunteer" component={ManageVolunteerScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PendingAccount" component={PendingAccountScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VolunteerHome" component={VolunteerHomeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
