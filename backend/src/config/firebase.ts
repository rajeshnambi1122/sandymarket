import * as admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = {
  "type": "service_account",
  "project_id": "sandymarket-4e8e9",
  "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
  "private_key": process.env.FIREBASE_PRIVATE_KEY,
  "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  "client_id": process.env.FIREBASE_CLIENT_ID,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
};

console.log('Initializing Firebase Admin with service account:', {
  projectId: serviceAccount.project_id,
  clientEmail: serviceAccount.client_email,
  privateKeyExists: !!serviceAccount.private_key, // Check if privateKey is present
  privateKeyLength: serviceAccount.private_key?.length || 0, // Check length
  privateKeyStart: serviceAccount.private_key?.substring(0, 30) + '...', // Log start of key
  privateKeyEnd: serviceAccount.private_key ? '...' + serviceAccount.private_key.slice(-30) : 'N/A', // Log end of key
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

export const firebaseAdmin = admin; 