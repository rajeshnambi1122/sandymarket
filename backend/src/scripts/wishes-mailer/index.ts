import mongoose from 'mongoose';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { User } from '../../models/User';
import path from 'path';

// Load environment variables from the backend root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Sandy's Market <orders@sandysmarket.net>";

const sendThanksgivingEmail = async () => {
    try {
        // Connect to MongoDB
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Fetch all users
        const users = await User.find({});
        console.log(`Found ${users.length} users`);

        let successCount = 0;
        let failureCount = 0;

        for (const user of users) {
            if (!user.email) {
                console.log(`Skipping user ${user._id} - No email`);
                continue;
            }

            try {
                const { data, error } = await resend.emails.send({
                    from: FROM_EMAIL,
                    to: user.email,
                    subject: "🦃 Happy Thanksgiving from Sandy's Market!",
                    html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Happy Thanksgiving!</title>
              <style>
                body {
                  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background-color: #f9f9f9;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .header {
                  background-color: #F97316;
                  color: white;
                  padding: 30px 20px;
                  text-align: center;
                }
                .logo {
                  width: 80px;
                  height: 80px;
                  border-radius: 50%;
                  margin-bottom: 15px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                  background-color: white;
                  padding: 2px;
                }
                .header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 700;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .content {
                  padding: 40px 30px;
                  text-align: center;
                }
                .message {
                  font-size: 18px;
                  color: #555;
                  margin-bottom: 30px;
                }
                .highlight {
                  color: #d35400;
                  font-weight: bold;
                }
                .footer {
                  background-color: #f0f0f0;
                  padding: 20px;
                  text-align: center;
                  font-size: 14px;
                  color: #888;
                }
                .btn {
                  display: inline-block;
                  background-color: #d35400;
                  color: white;
                  padding: 12px 30px;
                  text-decoration: none;
                  border-radius: 25px;
                  font-weight: bold;
                  margin-top: 20px;
                  transition: background-color 0.3s;
                }
                .btn:hover {
                  background-color: #a04000;
                }
                .emoji-divider {
                  font-size: 24px;
                  margin: 20px 0;
                  letter-spacing: 10px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <img src="https://www.sandysmarket.net/images/favi.png" alt="Sandy's Market Logo" class="logo">
                  <h1>Happy Thanksgiving! 🦃</h1>
                </div>
                <div class="content">
                  <p class="message">
                    Dear <strong>${user.name || 'Valued Customer'}</strong>,
                  </p>
                  
                  <p class="message">
                    As we gather to celebrate this season of gratitude, we want to take a moment to say <span class="highlight">thank you</span>.
                  </p>
                  
                  <div class="emoji-divider">🍂 🥧 🧡</div>

                  <p class="message">
                    We are incredibly grateful for your support and for being a part of the Sandy's Market family. Wishing you and your loved ones a warm, joyful, and delicious Thanksgiving filled with happiness!
                  </p>

                  <a href="https://sandysmarket.net" class="btn">Visit Our Store</a>
                </div>
                <div class="footer">
                  <p>With gratitude, From Sandy's Market</p>
                </div>
              </div>
            </body>
            </html>
          `
                });

                if (error) {
                    console.error(`Failed to send email to ${user.email}:`, error);
                    failureCount++;
                } else {
                    console.log(`Email sent to ${user.email} (ID: ${data?.id})`);
                    successCount++;
                }
            } catch (err) {
                console.error(`Error processing user ${user.email}:`, err);
                failureCount++;
            }

            // Add a delay to avoid hitting rate limits (limit is 2 req/sec, so 1000ms is safe)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n--- Summary ---');
        console.log(`Total Users: ${users.length}`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed: ${failureCount}`);

    } catch (error) {
        console.error('Script execution failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    }
};

sendThanksgivingEmail();
