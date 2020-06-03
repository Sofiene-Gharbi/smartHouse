  // Your web app's Firebase configuration
  var firebaseConfig = {
      apiKey: "AIzaSyDWWN0o0lG5PqIfxfOTsGsM7EwaZXtsgek",
      authDomain: "tareksmarthouse-96df4.firebaseapp.com",
      databaseURL: "https://tareksmarthouse-96df4.firebaseio.com",
      projectId: "tareksmarthouse-96df4",
      storageBucket: "tareksmarthouse-96df4.appspot.com",
      messagingSenderId: "41301764620",
      appId: "1:41301764620:web:f2c46bbe47f28e771bdc29",
      measurementId: "G-PDRZZPYEJX"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // make auth and firestore references
  const auth = firebase.auth();
  const database = firebase.database();
  const databaseRef = database.ref();
  const lightsRef = database.ref("Lights");
  const interiorLightsRef = database.ref("Lights/Interior_Lights");
  const exteriorLightsRef = database.ref("Lights/Exterior_Lights");
  const timerRef = database.ref("Timer");