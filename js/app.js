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
  const primary =
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/other/official-artwork/${number}.png`;
  const fallback =
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${number}.png`;

  pokemonImage.onerror = null;
  pokemonImage.src = primary;
  pokemonImage.onerror = () => {
    pokemonImage.onerror = () => {
      pokemonImage.src = placeholderImage;
    };
    pokemonImage.src = fallback;
  };
}

function setPokemonDisplay(value, playSound) {
  if (!core || !pokemonImage || !pokemonName || !pokemonNumberEl) {
    return;
  }

  const number = core.normalizePokedexNumber(value);
  if (!number) {
    pokemonName.textContent = "Ungueltig";
    pokemonNumberEl.textContent = "???";
    setPokemonImage(1);
    return;
  }

  setPokemonImage(number);
  pokemonName.textContent = core.getPokemonName(number);
  pokemonNumberEl.textContent = `#${number}`;

  if (playSound) {
    playPokemonCry(number);
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
  if (operator !== null && !shouldResetDisplay) {
    calculate();
  }

  previousValue = currentValue;
  operator = op;
  shouldResetDisplay = true;
}

function calculate() {
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
  currentValue = "0";
  previousValue = "";
  operator = null;
  shouldResetDisplay = false;
  updateDisplay();
  setPokemonDisplay(1, false);
}

function deleteLast() {
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
