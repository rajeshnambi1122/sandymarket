# Setting Up SMS Notifications for Sandy's Market

This guide will help you set up SMS notifications for new orders using Twilio.

## Prerequisites

1. A Twilio account (you can sign up for a free trial at [twilio.com](https://www.twilio.com))
2. A Twilio phone number capable of sending SMS
3. The store's phone number that will receive notifications

## Step 1: Set Up Twilio Account

1. Sign up for a Twilio account at [twilio.com](https://www.twilio.com)
2. Purchase a phone number or use the free trial number
3. Locate your Account SID and Auth Token from the Twilio dashboard

## Step 2: Configure Environment Variables

Add the following variables to your backend `.env` file:

```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number with country code
STORE_PHONE_NUMBER=+1987654321   # Store's phone number to receive notifications
```

Make sure to replace the placeholder values with your actual Twilio credentials and phone numbers.

## Step 3: Verify Phone Numbers (Trial Accounts Only)

If you're using a Twilio trial account, you'll need to verify any phone numbers you want to send SMS to:

1. Go to the Twilio console
2. Navigate to Phone Numbers > Verified Caller IDs
3. Add and verify the store's phone number

## Step 4: Testing

To test the SMS notifications:

1. Place a test order through the application
2. Check that the store phone number receives an SMS notification
3. Verify that the SMS contains all the relevant order information

## Troubleshooting

If SMS notifications aren't working:

1. Check the server logs for any Twilio-related errors
2. Verify that all environment variables are correctly set
3. Ensure the store's phone number is in the correct format (include the country code)
4. If using a trial account, confirm the store's phone number is verified in your Twilio account

## Production Considerations

- Monitor your Twilio usage and costs
- Set up error handling and notification retries
- Consider implementing rate limiting for SMS notifications

## Support

If you encounter any issues with the SMS notification system, please contact the development team. 