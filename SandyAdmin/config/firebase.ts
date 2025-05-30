import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyANVivOQ_XKvdOJbscn6W242V5q20Ww7wk",
  projectId: "sandymarket-4e8e9",
  storageBucket: "sandymarket-4e8e9.firebasestorage.app",
  messagingSenderId: "757306243529",
  appId: "1:757306243529:android:5539ca0738eb5eee3f9018"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app; 