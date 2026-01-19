const display = document.getElementById("display");
const pokemonImage = document.getElementById("pokemonImage");
const pokemonName = document.getElementById("pokemonName");
const pokemonNumberEl = document.getElementById("pokemonNumber");
const core = typeof window !== "undefined" ? window.PokedexCore : null;

let currentValue = "0";
let previousValue = "";
let operator = null;
let shouldResetDisplay = false;
let activeAudio = null;
let fallbackAudioContext = null;
let nameRequestId = 0;
const nameCache = new Map();
const inFlightNameRequests = new Map();

const placeholderImage =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'>" +
  "<rect width='240' height='180' fill='%23dfe6ef'/>" +
  "<circle cx='120' cy='90' r='58' fill='%2399a6b6'/>" +
  "<circle cx='95' cy='75' r='12' fill='%23dfe6ef'/>" +
  "<circle cx='145' cy='75' r='12' fill='%23dfe6ef'/>" +
  "<path d='M85 115 Q120 135 155 115' stroke='%23dfe6ef' stroke-width='10' fill='none' stroke-linecap='round'/>" +
  "</svg>";

function setPokemonImage(number) {
  const primary = `https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/other/official-artwork/${number}.png`;
  const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${number}.png`;
  const pixelUpscaleClass = "pixel-upscale";

  pokemonImage.onerror = null;
  pokemonImage.classList.remove(pixelUpscaleClass);
  pokemonImage.src = primary;
  pokemonImage.onerror = () => {
    pokemonImage.onerror = () => {
      pokemonImage.classList.remove(pixelUpscaleClass);
      pokemonImage.src = placeholderImage;
    };
    pokemonImage.classList.add(pixelUpscaleClass);
    pokemonImage.src = fallback;
  };
}

function setPokemonDisplay(value, playSound) {
  if (!core || !pokemonImage || !pokemonName || !pokemonNumberEl) {
    return;
  }

  const requestId = (nameRequestId += 1);
  const number = core.normalizePokedexNumber(value);
  if (!number) {
    pokemonName.textContent = "Ungueltig";
    pokemonNumberEl.textContent = "???";
    setPokemonImage(1);
    return;
  }

  setPokemonImage(number);
  pokemonNumberEl.textContent = `#${number}`;
  setPokemonName(number, requestId);

  if (playSound) {
    playPokemonCry(number);
  }
}

function setPokemonName(number, requestId) {
  const cachedName = nameCache.get(number);
  if (cachedName) {
    pokemonName.textContent = cachedName;
    return;
  }

  const knownName = core ? core.getPokemonName(number) : null;
  if (knownName && knownName !== "Unbekannt") {
    nameCache.set(number, knownName);
    pokemonName.textContent = knownName;
    return;
  }

  pokemonName.textContent = "Lade...";
  fetchPokemonName(number)
    .then((name) => {
      if (requestId !== nameRequestId) {
        return;
      }
      if (name) {
        nameCache.set(number, name);
        pokemonName.textContent = name;
      } else {
        pokemonName.textContent = "Unbekannt";
      }
    })
    .catch(() => {
      if (requestId === nameRequestId) {
        pokemonName.textContent = "Unbekannt";
      }
    });
}

function fetchPokemonName(number) {
  if (inFlightNameRequests.has(number)) {
    return inFlightNameRequests.get(number);
  }

  const request = fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${number}`,
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Name request failed");
      }
      return response.json();
    })
    .then((data) => {
      if (!data) {
        return null;
      }
      const names = Array.isArray(data.names) ? data.names : [];
      const germanEntry = names.find(
        (entry) => entry && entry.language && entry.language.name === "de",
      );
      if (germanEntry && germanEntry.name) {
        return germanEntry.name;
      }
      const englishEntry = names.find(
        (entry) => entry && entry.language && entry.language.name === "en",
      );
      if (englishEntry && englishEntry.name) {
        return englishEntry.name;
      }
      if (data.name) {
        return data.name;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      inFlightNameRequests.delete(number);
    });

  inFlightNameRequests.set(number, request);
  return request;
}

function playButtonClick() {
  try {
    const AudioContextClass =
      typeof window !== "undefined"
        ? window.AudioContext || window.webkitAudioContext
        : null;
    if (!AudioContextClass) {
      return;
    }

    if (!fallbackAudioContext) {
      fallbackAudioContext = new AudioContextClass();
    }

    if (fallbackAudioContext.state === "suspended") {
      fallbackAudioContext.resume().catch(() => {});
    }

    const oscillator = fallbackAudioContext.createOscillator();
    const gainNode = fallbackAudioContext.createGain();
    const now = fallbackAudioContext.currentTime;

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(720, now);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.06, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(fallbackAudioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.085);
  } catch (e) {
    console.log("Button-Sound konnte nicht abgespielt werden");
  }
}

function playPokemonCry(pokedexNumber) {
  if (!core) {
    return;
  }

  const number = core.normalizePokedexNumber(pokedexNumber);
  if (!number) {
    return;
  }

  const audioSources = [
    `https://play.pokemonshowdown.com/audio/cries/${number}.mp3`,
    `https://www.smogon.com/data/audio/cries/${number}.mp3`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/cries/${number}.ogg`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon-cries/${number}.wav`,
  ];

  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }

  const audio = new Audio();
  activeAudio = audio;
  audio.volume = 0.7;
  audio.preload = "auto";

  let sourceIndex = 0;

  function tryNextSource() {
    if (sourceIndex >= audioSources.length) {
      playFallbackSound();
      return;
    }

    const currentUrl = audioSources[sourceIndex];
    sourceIndex += 1;

    audio.onerror = () => {
      tryNextSource();
    };

    audio.src = currentUrl;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        if (error && error.name === "NotAllowedError") {
          playFallbackSound();
          return;
        }
        tryNextSource();
      });
    }
  }

  tryNextSource();
}

function playFallbackSound() {
  try {
    if (!fallbackAudioContext) {
      fallbackAudioContext = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }

    if (fallbackAudioContext.state === "suspended") {
      fallbackAudioContext.resume().catch(() => {});
    }

    const oscillator = fallbackAudioContext.createOscillator();
    const gainNode = fallbackAudioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(fallbackAudioContext.destination);

    oscillator.frequency.value = 400;
    gainNode.gain.setValueAtTime(0.3, fallbackAudioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      fallbackAudioContext.currentTime + 0.5,
    );

    oscillator.start(fallbackAudioContext.currentTime);
    oscillator.stop(fallbackAudioContext.currentTime + 0.5);
  } catch (e) {
    console.log("Auch Fallback-Sound konnte nicht abgespielt werden");
  }
}

function appendNumber(num) {
  playButtonClick();
  if (shouldResetDisplay) {
    currentValue = num === "." ? "0." : num;
    shouldResetDisplay = false;
  } else {
    if (num === ".") {
      if (currentValue.includes(".")) {
        return;
      }
      currentValue += num;
    } else {
      if (currentValue === "0" && num !== ".") {
        currentValue = num;
      } else {
        currentValue += num;
      }
    }
  }
  updateDisplay();
  setPokemonDisplay(currentValue, false);
}

function updateDisplay() {
  if (!display) {
    return;
  }
  display.value = currentValue;
}

function appendOperator(op) {
  playButtonClick();
  if (operator !== null && !shouldResetDisplay) {
    calculate(false);
  }

  previousValue = currentValue;
  operator = op;
  shouldResetDisplay = true;
}

function calculate(playClickSound = true) {
  if (playClickSound) {
    playButtonClick();
  }
  if (!core || operator === null || previousValue === "") {
    return;
  }

  const result = core.calculateResult(previousValue, currentValue, operator);
  if (!result.ok) {
    if (result.error === "divide-by-zero") {
      currentValue = "Fehler: Division durch Null";
      operator = null;
      previousValue = "";
      shouldResetDisplay = true;
      updateDisplay();
      setPokemonDisplay(null, false);
    }
    return;
  }

  currentValue = `${result.value}`;
  operator = null;
  previousValue = "";
  shouldResetDisplay = true;
  updateDisplay();
  setPokemonDisplay(result.value, true);
}

function clearDisplay() {
  playButtonClick();
  currentValue = "0";
  previousValue = "";
  operator = null;
  shouldResetDisplay = false;
  updateDisplay();
  setPokemonDisplay(1, false);
}

function deleteLast() {
  playButtonClick();
  if (shouldResetDisplay) {
    return;
  }
  currentValue = currentValue.slice(0, -1);
  if (currentValue === "") {
    currentValue = "0";
  }
  updateDisplay();
  setPokemonDisplay(currentValue, false);
}

function initPokedex() {
  updateDisplay();
  setPokemonDisplay(1, false);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPokedex);
} else {
  initPokedex();
}

if (typeof window !== "undefined") {
  window.appendNumber = appendNumber;
  window.appendOperator = appendOperator;
  window.calculate = calculate;
  window.clearDisplay = clearDisplay;
  window.deleteLast = deleteLast;
}
