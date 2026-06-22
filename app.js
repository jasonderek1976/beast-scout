import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  get,
  child
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC3CTeSgEoHxw7HCjRDauTCDtGtFXEgNH8",
  authDomain: "beast-scout.firebaseapp.com",
  databaseURL: "https://beast-scout-default-rtdb.firebaseio.com",
  projectId: "beast-scout",
  storageBucket: "beast-scout.firebasestorage.app",
  messagingSenderId: "370332990396",
  appId: "1:370332990396:web:c42366b466c362bd3589b9",
  measurementId: "G-0D6N7EBY2T"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let currentLatitude = null;
let currentLongitude = null;
let currentAccuracy = null;
let selectedTroubleLevel = null;

const getLocationBtn = document.getElementById("getLocationBtn");
const comeGetMeBtn = document.getElementById("comeGetMeBtn");
const locationText = document.getElementById("locationText");
const accuracyText = document.getElementById("accuracyText");
const selectedTrouble = document.getElementById("selectedTrouble");
const sendStatus = document.getElementById("sendStatus");
const troubleButtons = document.querySelectorAll(".trouble-btn");

getLocationBtn.addEventListener("click", getMyLocation);
comeGetMeBtn.addEventListener("click", sendComeGetMeAlert);

troubleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedTroubleLevel = button.dataset.level;
    selectedTrouble.textContent = `Selected: ${selectedTroubleLevel}`;

    troubleButtons.forEach((btn) => {
      btn.classList.remove("selected");
    });

    button.classList.add("selected");
  });
});

function getMyLocation() {
  if (!navigator.geolocation) {
    locationText.textContent = "GPS is not supported on this device.";
    return;
  }

  locationText.textContent = "Getting location...";
  accuracyText.textContent = "";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentLatitude = position.coords.latitude;
      currentLongitude = position.coords.longitude;
      currentAccuracy = position.coords.accuracy;

      locationText.textContent = `Latitude: ${currentLatitude.toFixed(6)}, Longitude: ${currentLongitude.toFixed(6)}`;
      accuracyText.textContent = `Accuracy: ${Math.round(currentAccuracy)} meters`;
    },
    (error) => {
      locationText.textContent = `Location error: ${error.message}`;
      accuracyText.textContent = "";
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

async function sendComeGetMeAlert() {
  if (!selectedTroubleLevel) {
    sendStatus.textContent = "Pick a trouble level first.";
    return;
  }

  if (currentLatitude === null || currentLongitude === null) {
    sendStatus.textContent = "Get your location first.";
    return;
  }

  try {
    sendStatus.textContent = "Sending alert...";

    const incidentId = await createIncidentId();
    const sentAt = new Date().toISOString();

    const alertData = {
      incidentId: incidentId,
      status: "ACTIVE",

      alertActive: true,
      missionStarted: true,
      found: false,

      troubleLevel: selectedTroubleLevel,

      latitude: currentLatitude,
      longitude: currentLongitude,
      accuracyMeters: currentAccuracy,

      scoutRoute1: "Self-Rescue Route",
      scoutRoute2: "Responder Access Route",
      scoutRoute3: "Intercept Route",

      agencyRoute1: "Subject Self-Rescue",
      agencyRoute2: "Responder Access",
      agencyRoute3: "Containment Route",

      confidenceRoute1: "Medium",
      confidenceRoute2: "High",
      confidenceRoute3: "Medium",

      sentAt: sentAt,
      foundAt: null,
      timeToLocate: null
    };

    await set(ref(database, "activeAlert"), alertData);
    await set(ref(database, `incidents/${incidentId}`), alertData);

    sendStatus.textContent = `Alert sent. Incident ID: ${incidentId}`;
  } catch (error) {
    sendStatus.textContent = `Alert failed: ${error.message}`;
  }
}

async function createIncidentId() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const dateCode = `${year}${month}${day}`;
  const counterPath = `incidentCounter/${dateCode}`;

  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, counterPath));

  let nextNumber = 1;

  if (snapshot.exists()) {
    nextNumber = Number(snapshot.val()) + 1;
  }

  await set(ref(database, counterPath), nextNumber);

  const paddedNumber = String(nextNumber).padStart(3, "0");

  return `BEAST-${dateCode}-${paddedNumber}`;
}