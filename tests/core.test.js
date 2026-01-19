const assert = require("assert");
const {
  getPokemonName,
  normalizePokedexNumber,
  calculateResult,
} = require("../js/core");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

test("normalizePokedexNumber accepts valid values", () => {
  assert.strictEqual(normalizePokedexNumber(1), 1);
  assert.strictEqual(normalizePokedexNumber("25"), 25);
  assert.strictEqual(normalizePokedexNumber(-7), 7);
  assert.strictEqual(normalizePokedexNumber(151.9), 151);
});

test("normalizePokedexNumber rejects invalid values", () => {
  assert.strictEqual(normalizePokedexNumber(0), null);
  assert.strictEqual(normalizePokedexNumber("abc"), null);
  assert.strictEqual(normalizePokedexNumber(2000), null);
  assert.strictEqual(normalizePokedexNumber(Infinity), null);
});

test("getPokemonName falls back to Unbekannt", () => {
  assert.strictEqual(getPokemonName(1), "Bisasam");
  assert.strictEqual(getPokemonName(999), "Unbekannt");
});

test("calculateResult handles operations", () => {
  assert.deepStrictEqual(calculateResult("2", "3", "+"), {
    ok: true,
    value: 5,
  });
  assert.deepStrictEqual(calculateResult("7", "4", "-"), {
    ok: true,
    value: 3,
  });
  assert.deepStrictEqual(calculateResult("6", "5", "*"), {
    ok: true,
    value: 30,
  });
});

test("calculateResult handles divide-by-zero", () => {
  assert.deepStrictEqual(calculateResult("10", "0", "/"), {
    ok: false,
    error: "divide-by-zero",
  });
});

test("calculateResult rounds to 8 decimals", () => {
  const result = calculateResult("0.1", "0.2", "+");
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value, 0.3);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
