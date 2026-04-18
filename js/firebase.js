const firebaseConfig = {
  apiKey: "AIzaSyAi5OBCntog6fZF5dObhs_tHdyXWTgyP3M",
  authDomain: "neosap-89b7b.firebaseapp.com",
  projectId: "neosap-89b7b",
  storageBucket: "neosap-89b7b.firebasestorage.app",
  messagingSenderId: "326747393670",
  appId: "1:326747393670:web:6caf2aaeee0e701e26cb07"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
