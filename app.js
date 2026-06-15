let watchId = null;
let breadcrumbs = [];

function startTracking() {
  if (!navigator.geolocation) {
    document.getElementById("status").textContent = "GPS not supported";
    return;
  }

  document.getElementById("status").textContent = "Tracking started";

  watchId = navigator.geolocation.watchPosition(
    savePosition,
    showError,
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
}

function savePosition(position) {
  const point = {
    time: new Date().toISOString(),
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy
  };

  breadcrumbs.push(point);
  localStorage.setItem("beastScoutBreadcrumbs", JSON.stringify(breadcrumbs));

  document.getElementById("lat").textContent = point.latitude;
  document.getElementById("lon").textContent = point.longitude;
  document.getElementById("accuracy").textContent = point.accuracy;
  document.getElementById("count").textContent = breadcrumbs.length;
  document.getElementById("status").textContent = "Tracking";
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    document.getElementById("status").textContent = "Tracking stopped";
  }
}

function showError(error) {
  document.getElementById("status").textContent = "GPS error: " + error.message;
}

function downloadCSV() {
  let csv = "time,latitude,longitude,accuracy\n";

  breadcrumbs.forEach(point => {
    csv += `${point.time},${point.latitude},${point.longitude},${point.accuracy}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "beast_scout_breadcrumbs.csv";
  link.click();
}