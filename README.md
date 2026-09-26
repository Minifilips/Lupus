# 🐺 Lupus – l'app del narratore

Web app da installare sull'iPhone per fare da master a **Lupus** (Lupus in Tabula / Lupi mannari). Funziona offline, senza App Store e senza Mac.

## Cosa fa

- **🔊 Soundbar**
  - Effetti: ululato, gufo, campana, morte, urlo, porta, magia, fantasma, amore, scudo, alba.
  - Atmosfere in loop: grilli, vento, pioggia, tensione, battito, branco di lupi.
  - Tutti i suoni sono generati dall'app, quindi niente file e niente copyright.
  - Puoi caricare i tuoi mp3 e far leggere frasi alla voce italiana del telefono.
- **🎭 17 personaggi**: Lupo, Contadino, Veggente, Puttana, Guardia, Medium, Strega, Cacciatore, Cupido, Massone, Gufo, Criceto mannaro, Indemoniato, Mitomane, Bambina, Scemo del villaggio, Sindaco. In più puoi creare **ruoli personalizzati**.
- **🎲 Distribuzione dei ruoli**
  - Il bottone "Bilancia" propone una composizione adatta al numero di giocatori.
  - Il telefono passa di mano in mano e ognuno gira la propria carta.
- **🌙 Notte guidata**
  - L'app chiama i ruoli nell'ordine giusto, con voce e suono, e tu tocchi le scelte di ogni ruolo.
  - Chiama anche i ruoli morti (si può disattivare), così nessuno capisce chi è uscito.
  - All'alba calcola da sola chi è morto: guardia, puttana, criceto, strega, innamorati, mitomane, cacciatore.
- **☀️ Giorno**: timer della discussione con bip finali, conteggio dei voti, rogo e controllo automatico della vittoria.
- **👁 Master**: riepilogo segreto dei ruoli, correzione manuale di chi è vivo o morto e cronaca della partita.

## Regole della notte usate

| Situazione | Esito |
|---|---|
| La guardia protegge la vittima dei lupi | Nessuno muore |
| I lupi attaccano la puttana mentre è da qualcun altro | La puttana si salva |
| La puttana è a casa della vittima dei lupi | Muoiono entrambe |
| La puttana va a casa di un lupo | La puttana muore |
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
- `js/audio.js`: i suoni sintetizzati con Web Audio
- `js/screens/`: le schermate dell'app
- `sw.js`: la cache offline. Quando rilasci modifiche, aumenta `VERSION`.
- `scripts/make-icons.cjs`: rigenera le icone da `scripts/icon.svg` (serve Playwright)
