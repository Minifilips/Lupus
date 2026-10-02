# 🐺 Lupus – l'app del narratore

Web app da installare sull'iPhone per fare da master a **Lupus** (Lupus in Tabula / Lupi mannari). Funziona offline, senza App Store e senza Mac.

## Cosa fa

- **🔊 Soundbar**
  - Atmosfere in loop: grilli e battito cardiaco (sintetizzati dall'app, funzionano offline).
  - Puoi caricare i tuoi mp3 (ululato, canzoni…): si scelgono tutti insieme e restano sul telefono, non nel repo.
  - Ogni mp3 viene assegnato da solo a un momento della partita in base al nome del file (ululato → lupi, "Here Comes the Sun" → mattina, "Annuncio dei morti" → annuncio, "Cotton Eye Joe" → discussione, "Brahms" → il villaggio si addormenta). Il pannello "📌 Parte da solo" permette di cambiare le assegnazioni.
  - Frasi del narratore lette dalla voce italiana del telefono.
- **🎵 Musica**: per ogni momento della partita e per ogni ruolo, una lista di brani con link a YouTube e Spotify, più una lista di effetti sonori. Sono link di ricerca, non file: nessun mp3 protetto da copyright nel repo. Le scelte già fatte hanno ✅.
- **🎭 Personaggi**
  - Quelli che giocate di solito: Lupo, Contadino, Veggente, Puttana (dorme da qualcuno e lo salva dai lupi), Prete kamikaze (una sola volta può lanciarsi su un giocatore: se è un lupo muore il lupo, altrimenti muore lui) e Folle (scemo del villaggio).
  - Altri ruoli già pronti: Cortigiana, Medium, Strega, Cacciatore, Cupido, Massone, Gufo, Criceto mannaro, Indemoniato, Mitomane, Bambina, Sindaco. Puoi anche crearne di tuoi.
- **🎲 Distribuzione dei ruoli**
  - Il bottone "Bilancia" propone una composizione adatta al numero di giocatori.
  - Il telefono passa di mano in mano e ognuno gira la propria carta.
- **🌙 Notte guidata**
  - L'app chiama i ruoli nell'ordine giusto con la voce, e tu tocchi le scelte di ogni ruolo.
  - Chiama anche i ruoli morti (si può disattivare), così nessuno capisce chi è uscito.
  - All'alba calcola da sola chi è morto: puttana, prete, cortigiana, criceto, strega, innamorati, mitomane, cacciatore.
- **☀️ Giorno**: timer della discussione con bip finali, conteggio dei voti, rogo e controllo automatico della vittoria.
- **👁 Master**: riepilogo segreto dei ruoli, correzione manuale di chi è vivo o morto e cronaca della partita.

## Regole della notte usate

| Situazione | Esito |
|---|---|
| La puttana dorme da chi i lupi attaccano | Nessuno muore |
| Il prete si lancia su un lupo | Il lupo muore, il prete si salva |
| Il prete si lancia su chiunque altro | Il prete muore |
| I lupi attaccano la cortigiana mentre è da qualcun altro | La cortigiana si salva |
| La cortigiana è a casa della vittima dei lupi | Muoiono entrambe |
| La cortigiana va a casa di un lupo | La cortigiana muore |
| I lupi attaccano il criceto | Non muore |
| La veggente scruta il criceto | Il criceto muore |
| Muore uno degli innamorati | Muore anche l'altro |
| Muore il cacciatore | Spara subito a qualcuno |

Se al tuo tavolo giocate con regole diverse, puoi correggere tutto a mano dal pulsante **👁 Master**.

## Installarla sull'iPhone

1. Su GitHub apri il repo, vai in **Settings → Pages**, scegli il branch da pubblicare e la cartella `/ (root)`, poi premi **Save**.
2. Dopo un minuto l'app è online su `https://<utente>.github.io/<repo>/`.
3. Apri quel link con **Safari** sull'iPhone.
4. Tocca **Condividi** (il quadrato con la freccia) e poi **Aggiungi alla schermata Home**.
5. Apri Lupus dall'icona: si apre a tutto schermo e funziona anche offline.

> Togli la modalità silenziosa (l'interruttore laterale dell'iPhone), altrimenti i suoni non si sentono.

## Sviluppo

Nessuna build: HTML, CSS e JavaScript (moduli ES).

```bash
npm start   # server locale su http://localhost:8000
npm test    # test delle regole (node --test)
```

- `js/roles.js`: i personaggi e il bilanciamento automatico
- `js/rules.js`: la logica pura (sequenza della notte, risoluzione dell'alba, vittoria)
- `js/audio.js`: grilli, battito e bip del timer con Web Audio, più la riproduzione degli mp3 caricati
- `js/screens/`: le schermate dell'app
- `sw.js`: la cache offline. Quando rilasci modifiche, aumenta `VERSION`.
- `scripts/make-icons.cjs`: rigenera le icone da `scripts/icon.svg` (serve Playwright)
