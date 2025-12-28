import mongoose from 'mongoose';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { User } from '../../models/User';
import path from 'path';

// Load environment variables from the backend root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "Sandy's Market <orders@sandysmarket.net>";

const sendChristmasEmail = async () => {
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
                    subject: "🎄 Merry Christmas from Sandy's Market!",
                    html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Merry Christmas!</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background: linear-gradient(135deg, #c2410c 0%, #7c2d12 100%);
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                }
                .email-wrapper {
                  width: 100%;
                  padding: 10px;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .header {
                  background: linear-gradient(135deg, #F97316 0%, #ea580c 100%);
                  color: white;
                  padding: 30px 20px;
                  text-align: center;
                  position: relative;
                }
                .header-image {
                  width: 100%;
                  height: 250px;
                  object-fit: cover;
                  display: block;
                }
                .logo {
                  width: 70px;
                  height: 70px;
                  border-radius: 50%;
                  margin: 15px auto;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                  background-color: white;
                  padding: 3px;
                  border: 3px solid #FFD700;
                  display: block;
                }
                .header h1 {
                  margin: 15px 0 10px 0;
                  font-size: 32px;
                  font-weight: 700;
                  text-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  letter-spacing: 1px;
                  line-height: 1.2;
                }
                .snow {
                  font-size: 28px;
                  margin: 8px 0;
                  display: block;
                }
                .content {
                  padding: 30px 20px;
                  text-align: center;
                  background: linear-gradient(to bottom, #ffffff 0%, #fff7ed 100%);
                }
                .message {
                  font-size: 16px;
                  color: #555;
                  margin-bottom: 20px;
                  line-height: 1.8;
                }
                .highlight {
                  color: #ea580c;
                  font-weight: bold;
                }
                .special-offer {
                  background: linear-gradient(135deg, #F97316 0%, #ea580c 100%);
                  color: white;
                  padding: 20px;
                  border-radius: 12px;
                  margin: 25px 0;
                  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
                }
                .special-offer h3 {
                  margin: 0 0 12px 0;
                  font-size: 22px;
                  font-weight: bold;
                }
                .special-offer p {
                  margin: 0;
                  font-size: 16px;
                  line-height: 1.6;
                }
                .footer {
                  background: linear-gradient(135deg, #7c2d12 0%, #431407 100%);
                  padding: 25px 20px;
                  text-align: center;
                  font-size: 14px;
                  color: white;
                }
                .footer p {
                  margin: 8px 0;
                  line-height: 1.5;
                }
                .btn {
                  display: inline-block;
                  background: linear-gradient(135deg, #F97316 0%, #ea580c 100%);
                  color: white !important;
                  padding: 16px 40px;
                  text-decoration: none;
                  border-radius: 30px;
                  font-weight: bold;
                  font-size: 16px;
                  margin-top: 20px;
                  box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
                  transition: all 0.3s ease;
                }
                .emoji-divider {
                  font-size: 28px;
                  margin: 20px 0;
                  letter-spacing: 12px;
                  display: block;
                }
                .greeting {
                  font-size: 22px;
                  font-weight: bold;
                  color: #ea580c;
                  margin-bottom: 20px;
                }
                
                /* Mobile Responsive Styles */
                @media only screen and (max-width: 600px) {
                  .email-wrapper {
                    padding: 5px;
                  }
                  .container {
                    border-radius: 12px;
                  }
                  .header {
                    padding: 20px 15px;
                  }
                  .header h1 {
                    font-size: 24px;
                  }
                  .header-image {
                    height: 200px;
                  }
                  .logo {
                    width: 60px;
                    height: 60px;
                  }
                  .snow {
                    font-size: 24px;
                  }
                  .content {
                    padding: 25px 15px;
                  }
                  .message {
                    font-size: 15px;
                    margin-bottom: 18px;
                  }
                  .greeting {
                    font-size: 20px;
                  }
                  .special-offer {
                    padding: 18px 15px;
                    margin: 20px 0;
                  }
                  .special-offer h3 {
                    font-size: 20px;
                  }
                  .special-offer p {
                    font-size: 15px;
                  }
                  .btn {
                    padding: 14px 30px;
                    font-size: 15px;
                    display: block;
                    width: 100%;
                    max-width: 280px;
                    margin: 20px auto 0;
                  }
                  .emoji-divider {
                    font-size: 24px;
                    letter-spacing: 8px;
                  }
                  .footer {
                    padding: 20px 15px;
                    font-size: 13px;
                  }
                }
                
                @media only screen and (max-width: 400px) {
                  .header h1 {
                    font-size: 22px;
                  }
                  .message {
                    font-size: 14px;
                  }
                  .greeting {
                    font-size: 18px;
                  }
                }
              </style>
            </head>
            <body>
              <div class="email-wrapper">
                <div class="container">
                  <img src="https://i.pinimg.com/1200x/8a/99/7b/8a997b41eb939d4b72ce1a51bec49de2.jpg" alt="Merry Christmas" class="header-image">
                  
                  <div class="header">
                    <img src="https://www.sandysmarket.net/images/favi.png" alt="Sandy's Market Logo" class="logo">
                    <div class="snow">❄️ ✨ ❄️</div>
                    <h1>Merry Christmas! 🎄</h1>
                  </div>
                <div class="content">
                  <p class="greeting">
                    🎅 Season's Greetings! 🎅
                  </p>
                  
                  <p class="message">
                    Dear <strong>${user.name || 'Valued Customer'}</strong>,
                  </p>
                  
                  <p class="message">
                    As the magic of Christmas fills the air, we want to take a moment to wish you and your loved ones a season filled with <span class="highlight">joy, love, and warmth</span>!
                  </p>
                  
                  <div class="emoji-divider">🎄 🎁 ⭐</div>

                  <p class="message">
                    Thank you for being a cherished part of the Sandy's Market.
                  </p>

                  <div class="special-offer">
                    <h3>🎁 Holiday Special!</h3>
                    <p style="margin: 10px 0; font-size: 16px;">
                      Order your favorite pizza and enjoy the festive season with delicious food.
                    </p>
                  </div>

                  <p class="message">
                    May your Christmas be merry and bright, and may the New Year bring you health, happiness, and prosperity!
                  </p>

                  <a href="https://sandysmarket.net" class="btn">🎄 Order Now 🎄</a>
                </div>
                <div class="footer">
                  <p style="font-size: 18px; font-weight: bold; margin-bottom: 12px;">🎄 Merry Christmas & Happy New Year! 🎄</p>
                  <p style="margin: 8px 0;">With warm wishes,</p>
                  <p style="font-weight: bold; font-size: 16px; margin: 8px 0;">The Sandy's Market</p>
                  <p style="margin-top: 18px; font-size: 13px; opacity: 0.9;">
                    📍 1057 Estey Road, Beaverton, MI<br>
                    📞 (989) 435-9688<br>
                    🌐 <a href="https://sandysmarket.net" style="color: #fed7aa; text-decoration: none;">sandysmarket.net</a>
                  </p>
                </div>
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

sendChristmasEmail();
