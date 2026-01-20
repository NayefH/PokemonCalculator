# Pokedex Rechner

## Uebersicht
Ein Pokedex-inspirierter Taschenrechner, der Zahlen als Pokedex-Nummern interpretiert
und dazu Artwork, Namen und Soundeffekte anzeigt.

## Features
- Rechner mit Grundrechenarten (+, -, *, /), Loeschen und Reset
- Pokemon-Artwork mit Fallback auf Sprite und Platzhaltergrafik
- Namensanzeige per lokaler Liste plus PokeAPI (de/en)
- Pokemon-Schrei bei Ergebnissen und Button-Klick-Sounds

## Start
1. `index.html` im Browser oeffnen.
2. Zahlen eintippen oder rechnen und das passende Pokemon ansehen.

Hinweis: Fuer Namensabfrage, Bilder und Sounds ist eine Internetverbindung noetig.
Falls dein Browser `file://` blockiert, starte die Seite ueber einen lokalen Server.

## Tests
- `npm test`
- alternativ: `node tests/core.test.js`

## Projektstruktur
- `index.html` Layout und UI-Struktur
- `css/style.css` Styles fuer das Pokedex-Design
- `js/core.js` Berechnungen und Pokedex-Helfer
- `js/app.js` UI-Logik, API-Abfragen und Audio
- `tests/core.test.js` Basis-Tests fuer die Kernlogik
