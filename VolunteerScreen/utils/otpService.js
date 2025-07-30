import * as SMS from 'expo-sms';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const sendOtpToBeneficiary = async (eventId, selectedBeneficiaryNumber) => {
    try {
        // Check if SMS service is available
        const isAvailable = await SMS.isAvailableAsync();
        if (!isAvailable) {
            console.log('SMS service is unavailable on this device.');
            return;
        }

        console.log('SMS Service is available.');

        // Validate the event ID
        if (!eventId) {
            console.log('No Event ID provided.');
            return;
        }

        console.log('Event ID:', eventId);

        // Fetch event document from Firestore
        const eventDocRef = doc(db, 'events', eventId);
        const eventDoc = await getDoc(eventDocRef);

        if (!eventDoc.exists()) {
            console.log('Event not found.');
            return;
        }

        const eventData = eventDoc.data();
        console.log('Event Data:', eventData);

        // Validate the phone number
        if (!selectedBeneficiaryNumber || typeof selectedBeneficiaryNumber !== 'string') {
            console.log('Invalid phone number:', selectedBeneficiaryNumber);
            return;
        }

        const formattedPhoneNumber = selectedBeneficiaryNumber.startsWith('9')
            ? `+63${selectedBeneficiaryNumber}`
            : selectedBeneficiaryNumber;

        if (!formattedPhoneNumber.startsWith('+63') || formattedPhoneNumber.length < 12) {
            console.log('Invalid phone number format:', formattedPhoneNumber);
            return;
        }

        console.log('Formatted Phone Number:', formattedPhoneNumber);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const message = `Your OTP for the event "${eventData.title}" is: ${otp}`;

        console.log('Generated OTP:', otp);
        console.log('OTP Message:', message);

        // Send SMS
        try {
            const smsResult = await SMS.sendSMSAsync([formattedPhoneNumber], message);
            console.log('SMS Result:', smsResult);
            
            if (smsResult.result === 'sent') {
                console.log(`SMS sent successfully to ${formattedPhoneNumber}`);
            } else if (smsResult.result === 'unknown') {
                console.log(`SMS delivery status unknown for ${formattedPhoneNumber}. The OTP has been handed off to the SMS app.`);
                // Optionally retry or provide alternative options here
            } else {
                console.error(`Failed to send SMS to ${formattedPhoneNumber}`);
            }
        } catch (smsError) {
            console.error(`Error sending SMS to ${formattedPhoneNumber}:`, smsError.message || smsError);
        }
    } catch (error) {
        console.error('Error in sendOtpToBeneficiary:', error.message || error);
    }
};
