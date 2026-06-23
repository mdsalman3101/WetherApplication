/* ===========================
   SKYPULSE — script.js
   Weather logic + API calls
   Full India coverage + Auto Location
   =========================== */

const API_KEY = "16176ebab674a9906d072bfc8436f1a9";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

let currentTempC = null;
let currentUnit  = "C";

const cityInput     = document.getElementById("cityInput");
const searchBtn     = document.getElementById("searchBtn");
const locationBtn   = document.getElementById("locationBtn");
const errorBanner   = document.getElementById("errorBanner");
const errorText     = document.getElementById("errorText");
const loadingState  = document.getElementById("loadingState");
const weatherCard   = document.getElementById("weatherCard");
const emptyState    = document.getElementById("emptyState");
const celsiusBtn    = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");
const quickBtns     = document.querySelectorAll(".quick-btn");

function toFahrenheit(c) { return Math.round((c * 9) / 5 + 32); }
function formatTemp(celsius) {
  return currentUnit === "C" ? `${Math.round(celsius)}` : `${toFahrenheit(celsius)}`;
}

function formatTime(unix, timezoneOffset) {
  const date = new Date((unix + timezoneOffset) * 1000);
  const h = date.getUTCHours().toString().padStart(2, "0");
  const m = date.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function getWeatherEmoji(iconCode) {
  const map = {
    "01d":"☀️","01n":"🌙","02d":"⛅","02n":"⛅","03d":"☁️","03n":"☁️",
    "04d":"☁️","04n":"☁️","09d":"🌧️","09n":"🌧️","10d":"🌦️","10n":"🌦️",
    "11d":"⛈️","11n":"⛈️","13d":"❄️","13n":"❄️","50d":"🌫️","50n":"🌫️",
  };
  return map[iconCode] || "🌡️";
}

function setSkyTheme(tempC) {
  document.body.classList.remove("sky-cold","sky-cool","sky-warm","sky-hot");
  if      (tempC <= 5)  document.body.classList.add("sky-cold");
  else if (tempC <= 18) document.body.classList.add("sky-cool");
  else if (tempC <= 30) document.body.classList.add("sky-warm");
  else                  document.body.classList.add("sky-hot");
}

function showLoading(msg) {
  document.getElementById("loadingText").textContent = msg || "Fetching weather data...";
  loadingState.classList.add("visible");
  weatherCard.classList.remove("visible");
  emptyState.classList.add("hidden");
  errorBanner.classList.remove("visible");
}
function showError(msg) {
  loadingState.classList.remove("visible");
  weatherCard.classList.remove("visible");
  emptyState.classList.add("hidden");
  errorText.textContent = msg;
  errorBanner.classList.add("visible");
}
function showWeather() {
  loadingState.classList.remove("visible");
  weatherCard.classList.add("visible");
  emptyState.classList.add("hidden");
  errorBanner.classList.remove("visible");
}

function generateStars() {
  const container = document.getElementById("stars");
  for (let i = 0; i < 80; i++) {
    const star = document.createElement("div");
    star.classList.add("star");
    const size = Math.random() * 2 + 1;
    star.style.cssText = `width:${size}px;height:${size}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--dur:${2+Math.random()*4}s;animation-delay:${Math.random()*4}s;`;
    container.appendChild(star);
  }
}

function updateDateTime(timezoneOffset) {
  const now = new Date();
  const cityMs = now.getTime() + now.getTimezoneOffset() * 60000 + timezoneOffset * 1000;
  const d = new Date(cityMs);
  const days   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  document.getElementById("currentDate").textContent =
    `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  document.getElementById("currentTime").textContent =
    `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
}

function renderWeather(data) {
  const { name, sys, main, weather, wind, visibility, timezone } = data;
  currentTempC = main.temp;
  setSkyTheme(currentTempC);

  const lat = data.coord.lat, lon = data.coord.lon;
  document.getElementById("cityName").textContent    = name;
  document.getElementById("countryName").textContent =
    `${sys.country} · ${Math.abs(lat).toFixed(2)}° ${lat>=0?'N':'S'}, ${Math.abs(lon).toFixed(2)}° ${lon>=0?'E':'W'}`;

  updateDateTime(timezone);

  document.getElementById("weatherIconLarge").textContent = getWeatherEmoji(weather[0].icon);
  document.getElementById("weatherDesc").textContent      = weather[0].description;
  document.getElementById("tempValue").textContent        = formatTemp(currentTempC);

  const flEl  = document.getElementById("feelsLike");
  const minEl = document.getElementById("tempMin");
  const maxEl = document.getElementById("tempMax");
  flEl.dataset.raw  = main.feels_like;
  minEl.dataset.raw = main.temp_min;
  maxEl.dataset.raw = main.temp_max;
  flEl.textContent  = `${formatTemp(main.feels_like)}°${currentUnit}`;
  minEl.textContent = `${formatTemp(main.temp_min)}°`;
  maxEl.textContent = `${formatTemp(main.temp_max)}°`;

  document.getElementById("humidity").textContent    = `${main.humidity}%`;
  document.getElementById("humidityBar").style.width = `${main.humidity}%`;
  document.getElementById("windSpeed").textContent   = `${Math.round(wind.speed * 3.6)} km/h`;
  document.getElementById("pressure").textContent    = `${main.pressure} hPa`;
  document.getElementById("visibility").textContent  = `${(visibility / 1000).toFixed(1)} km`;
  document.getElementById("sunrise").textContent     = formatTime(sys.sunrise, timezone);
  document.getElementById("sunset").textContent      = formatTime(sys.sunset,  timezone);

  const range    = main.temp_max - main.temp_min;
  const position = range > 0 ? ((currentTempC - main.temp_min) / range) * 100 : 50;
  document.getElementById("minmaxIndicator").style.left = `${Math.max(0, Math.min(100, position))}%`;

  showWeather();
  if (window._clockInterval) clearInterval(window._clockInterval);
  window._clockInterval = setInterval(() => updateDateTime(timezone), 1000);
}

function refreshTemperatureDisplay() {
  if (currentTempC === null) return;
  document.getElementById("tempValue").textContent = formatTemp(currentTempC);
  const flEl  = document.getElementById("feelsLike");
  const minEl = document.getElementById("tempMin");
  const maxEl = document.getElementById("tempMax");
  if (flEl.dataset.raw)  flEl.textContent  = `${formatTemp(parseFloat(flEl.dataset.raw))}°${currentUnit}`;
  if (minEl.dataset.raw) minEl.textContent = `${formatTemp(parseFloat(minEl.dataset.raw))}°`;
  if (maxEl.dataset.raw) maxEl.textContent = `${formatTemp(parseFloat(maxEl.dataset.raw))}°`;
}

async function fetchWeather(city) {
  if (!city.trim()) { showError("Please enter a city or town name."); return; }
  showLoading(`Searching weather for "${city}"...`);
  try {
    const res = await fetch(`${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
    if (!res.ok) {
      if (res.status === 404) throw new Error(`"${city}" not found. Check spelling or try a nearby town.`);
      if (res.status === 401) throw new Error("Invalid API key. Please update it in script.js.");
      throw new Error(`Server error (${res.status}). Please try again.`);
    }
    renderWeather(await res.json());
  } catch (err) {
    showError(err.message);
  }
}

async function fetchWeatherByCoords(lat, lon) {
  showLoading("Detecting your location...");
  try {
    const res = await fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    if (!res.ok) throw new Error(`Could not get weather for your location. (Error ${res.status})`);
    const data = await res.json();
    cityInput.value = data.name;
    renderWeather(data);
  } catch (err) {
    showError(err.message);
  }
}

function detectLocation() {
  if (!navigator.geolocation) {
    showError("Your browser does not support location. Please type a city name manually.");
    return;
  }
  locationBtn.innerHTML = `⏳ Detecting...`;
  locationBtn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      locationBtn.innerHTML = `📍 My Location`;
      locationBtn.disabled = false;
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      locationBtn.innerHTML = `📍 My Location`;
      locationBtn.disabled = false;
      const msgs = {
        1: "Location permission denied. Please allow location access in your browser settings.",
        2: "Could not detect location. Check your GPS or type a city name.",
        3: "Location request timed out. Please try again."
      };
      showError(msgs[err.code] || "Location error. Please type a city name manually.");
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

// Event Listeners
searchBtn.addEventListener("click", () => fetchWeather(cityInput.value.trim()));
cityInput.addEventListener("keydown", (e) => { if (e.key === "Enter") fetchWeather(cityInput.value.trim()); });
locationBtn.addEventListener("click", detectLocation);
quickBtns.forEach(btn => btn.addEventListener("click", () => {
  cityInput.value = btn.dataset.city;
  fetchWeather(btn.dataset.city);
}));
celsiusBtn.addEventListener("click", () => {
  if (currentUnit === "C") return;
  currentUnit = "C";
  celsiusBtn.classList.add("active");
  fahrenheitBtn.classList.remove("active");
  refreshTemperatureDisplay();
});
fahrenheitBtn.addEventListener("click", () => {
  if (currentUnit === "F") return;
  currentUnit = "F";
  fahrenheitBtn.classList.add("active");
  celsiusBtn.classList.remove("active");
  refreshTemperatureDisplay();
});

generateStars();