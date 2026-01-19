(() => {
  const pokemonNames = {
    1: "Bisasam",
    2: "Bisaknosp",
    3: "Bisaflor",
    4: "Glumanda",
    5: "Glutexo",
    6: "Glurak",
    7: "Schiggy",
    8: "Schillok",
    9: "Turtok",
    25: "Pikachu",
    26: "Raichu",
    35: "Piepi",
    36: "Pixi",
    39: "Pummeluff",
    40: "Knuddeluff",
    54: "Enton",
    55: "Entoron",
    58: "Fukano",
    59: "Arkani",
    63: "Abra",
    64: "Kadabra",
    65: "Simsala",
    100: "Voltobal",
    101: "Lektrobal",
    147: "Dratini",
    148: "Dragonir",
    149: "Dragoran",
    150: "Mewtu",
    151: "Mew",
  };

  function getPokemonName(number) {
    return pokemonNames[number] || "Unbekannt";
  }

  function normalizePokedexNumber(value) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return null;
    }

    const number = Math.abs(Math.floor(numericValue));
    if (number < 1 || number > 1025) {
      return null;
    }

    return number;
  }

  function calculateResult(prevValue, currentValue, operator) {
    const prev = Number(prevValue);
    const current = Number(currentValue);

    if (!Number.isFinite(prev) || !Number.isFinite(current)) {
      return { ok: false, error: "invalid-number" };
    }

    let result;
    switch (operator) {
      case "+":
        result = prev + current;
        break;
      case "-":
        result = prev - current;
        break;
      case "*":
        result = prev * current;
        break;
      case "/":
        if (current === 0) {
          return { ok: false, error: "divide-by-zero" };
        }
        result = prev / current;
        break;
      default:
        return { ok: false, error: "invalid-operator" };
    }

    const rounded = Math.round(result * 100000000) / 100000000;
    return { ok: true, value: rounded };
  }

  const api = {
    getPokemonName,
    normalizePokedexNumber,
    calculateResult,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof window !== "undefined") {
    window.PokedexCore = api;
  }
})();
