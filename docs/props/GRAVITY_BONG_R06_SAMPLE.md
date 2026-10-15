# Gravity bong R06 — originele "Bong Rippie" opname

De gebruiker heeft toestemming voor het gebruik van de opname bevestigd.

- Bron: https://www.myinstants.com/en/instant/bong-rippie-91413/
- Originele MP3: `public/audio/bong-rippie.mp3` (85.632 bytes, SHA-256 `40650070b15db27fcf49d8b7e497cd574dff959e54cd35e0f4040aa6763bbe88`).
- Na Start laadt/decodeert de browser de MP3 eenmalig via `import.meta.env.BASE_URL`; het bestand staat op GitHub Pages en vereist tijdens het spelen geen Myinstants-verbinding.
- Bij `Neem een hit` speelt uitsluitend het originele bestand (ongewijzigde duur en toonhoogte). Synthetisch geluid wordt alleen gebruikt wanneer de browser het bestand niet kan afspelen.
- Cooldown: 5,6 seconden zodat een tweede hit de opname niet overlapt.
- Bestaande 3D-geometrie, rookpluimen, handpan, overige audio en progressie blijven onaangeroerd.
- De tijdelijke importworkflow is uit de branch verwijderd en gaat niet mee naar productie.
- CI verifieert audiobestand-bytecount en -hash, TypeScript, Vitest en productiebuild.
