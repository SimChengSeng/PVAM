// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxrMTxCF2A22hYfpWpbYkkIhiq3wKxoAM",
  authDomain: "fyp-project-26d3b.firebaseapp.com",
  projectId: "fyp-project-26d3b",
  storageBucket: "fyp-project-26d3b.firebasestorage.app",
  messagingSenderId: "813972928973",
  appId: "1:813972928973:web:9e6e7bae8c9e854ad52c84",
  measurementId: "G-W68XEB8Y4S",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
