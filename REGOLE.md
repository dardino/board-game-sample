# La Città Perduta di Eldorasia — Regole

> **Stato del documento:** queste regole descrivono l'ambientazione, i contenuti e il flusso previsti dal prototipo. Il motore e l'interfaccia sono ancora incompleti: le parti non disponibili sono indicate esplicitamente, senza presentarle come già giocabili.

## Obiettivo e ambientazione

I giocatori sono esploratori che collaborano per attraversare le rovine di Eldorasia, raggiungere la Torre e sconfiggere il boss che custodisce il Cuore di Eldorasia. L'obiettivo narrativo è recuperare l'artefatto.

Nel motore, le condizioni di fine partita previste sono la sconfitta del boss oppure la morte di tutti i personaggi. Il recupero del Cuore e la gestione del risultato finale non sono ancora implementati.

## Giocatori e personaggi

Una partita può essere creata con **2–4 giocatori**. All'avvio, i giocatori hanno **30 secondi** per indicare una preferenza. Le preferenze non sono confermate subito: più giocatori possono scegliere lo stesso personaggio, il contatore sulla carta mostra quante preferenze ha ricevuto e la scelta del giocatore corrente è evidenziata in giallo. Premendo **Ready** la preferenza viene bloccata; se tutti sono pronti, la fase termina in anticipo.

Alla scadenza, per ogni personaggio conteso il sistema sceglie casualmente un solo vincitore; chi perde il conflitto e chi non ha espresso una preferenza riceve casualmente uno dei personaggi rimasti. Gli abbinamenti definitivi restano visibili per **10 secondi** prima dell'avvio della partita. Anche in questa fase tutti i giocatori possono premere **Ready** per iniziare prima. Il prototipo definisce cinque classi:

| Classe | Forza | Intelligenza | Agilità | Vita iniziale / massima | Energia iniziale / massima | Movimento | Armatura fisica / magica |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Chierico | 2 | 3 | 1 | 7 / 7 | 5 / 10 | 2 | 0 / 2 |
| Barbaro | 3 | 1 | 2 | 8 / 8 | 5 / 10 | 2 | 2 / 0 |
| Mago | 1 | 3 | 2 | 7 / 7 | 5 / 10 | 2 | 2 / 0 |
| Ladro | 1 | 2 | 3 | 7 / 7 | 5 / 10 | 2 | 2 / 0 |
| Bardo | 2 | 2 | 2 | 7 / 7 | 5 / 10 | 2 | 1 / 1 |

Ogni personaggio ha difesa 1, due attacchi iniziali a mani nude e l'incantesimo Fireball. La risoluzione finale assegna personaggi distinti; le preferenze possono invece coincidere durante la scelta.

### Armi definite

| Arma | Attributo | Tipo | Dado configurato | Portata |
| --- | --- | --- | ---: | ---: |
| Pugno | Forza | Fisico | 4 | 0 |
| Pugnale | Forza | Fisico | 6 | 0 |
| Spada | Forza | Fisico | 8 | 0 |
| Ascia | Forza | Fisico | 8 | 0 |
| Arco | Agilità | Fisico | 6 | 2 |
| Fireball | Intelligenza | Magico | 6 | 1 |

Il codice definisce questi valori, ma non ancora la formula per effettuare un attacco, tirare i dadi, applicare armatura e difesa o consumare energia.

## Preparazione

1. Si sceglie casualmente uno dei dieci boss elencati nella sezione [Boss disponibili](#boss-disponibili).
2. Si mescolano separatamente le tessere dei tre anelli. La tessera del boss viene aggiunta al mazzo dell'anello 3.
3. Si piazza la tessera iniziale, con sei possibili collegamenti.
4. Si determina casualmente l'ordine dei giocatori.
5. I giocatori scelgono le preferenze per 30 secondi, poi vengono risolti i conflitti e assegnati i personaggi mancanti.
6. Si mostrano gli abbinamenti definitivi per 10 secondi, quindi si avvia il primo turno.

L'ordine dei passaggi riflette il flusso del motore. La preparazione automatica della partita non è ancora collegata completamente al servizio di gioco.

## Plancia ed esplorazione

La plancia è composta da tessere esagonali con sei lati: alto-sinistra, alto-destra, destra, basso-destra, basso-sinistra e sinistra. Ogni tessera definisce quali lati hanno un passaggio. Può essere ruotata in sei orientamenti.

La mappa si espande dalla partenza in tre anelli:

- **Anello 1:** tessere iniziali, con eventuali nemici Base.
- **Anello 2:** tessere intermedie, con nemici Base e Advanced.
- **Anello 3:** tessere più interne, con nemici Advanced e la tessera del boss.

Nel prototipo, quando un giocatore si muove attraverso un passaggio ancora inesplorato, viene pescata una tessera dal mazzo dell'anello corrispondente alla posizione. La tessera va ruotata in modo che il suo ingresso combaci con il passaggio aperto, poi viene collegata alla mappa. Se la tessera contiene nemici, vengono aggiunti nemici casuali della classe indicata.

Il boss viene collocato sulla tessera dedicata, che ha un solo collegamento.

## Turno dei giocatori

Il turno segue l'ordine casuale stabilito durante la preparazione. Il motore definisce queste azioni:

- **Muovere:** il giocatore di turno può muoversi lungo un passaggio esistente o esplorare un passaggio aperto. La velocità di movimento di tutti i personaggi attualmente definiti è 2. Il movimento è bloccato se nella tessera i nemici sono almeno tanti quanti i giocatori presenti; il personaggio non può superare il proprio limite di movimento.
- **Pescare e piazzare una tessera:** l'esplorazione di un passaggio aperto avvia la pesca della tessera dell'anello corrispondente. La nuova tessera deve essere ruotata e collegata correttamente; il personaggio viene collocato sulla tessera appena esplorata.
- **Combattere:** l'azione è prevista dal flusso, ma la risoluzione del combattimento non è implementata.
- **Passare:** conclude il turno e avvia la fase di controllo di fine turno.

Le verifiche disponibili nel codice sono parziali: in particolare, non sono ancora implementati tutti i controlli relativi a vita, combattimento, nemici e fine turno. Il flusso non va quindi considerato una procedura di gioco completa.

## Nemici e fine partita

Le tessere possono contenere nemici **Base**, **Advanced** o **Boss**. Le schede dati definiscono tre Goblin Base, tre Undead Advanced e dieci boss. I nemici Base e Advanced vengono scelti casualmente dai rispettivi gruppi; durante la preparazione viene scelto casualmente un boss, che sarà collocato sulla tessera Boss.

### Boss disponibili

I boss condividono la tessera e le regole di base, ma hanno statistiche e attacchi diversi. I valori sono quelli configurati nel prototipo:

| Boss | Vita | Movimento | Armatura fisica / magica | Attacchi configurati |
| ---- | ---- | --------- | ------------------------ | -------------------- |
| BigBoss | 15 | 3 | 4 / 4 | Spada, Fireball |
| Re Goblin | 16 | 2 | 3 / 2 | Spada |
| Regina Spettrale | 14 | 2 | 1 / 4 | Ascia, Fireball |
| Drago di Pietra | 20 | 1 | 5 / 2 | Ascia |
| Oracolo delle Ceneri | 13 | 2 | 1 / 5 | Fireball |
| Minotauro delle Rovine | 18 | 2 | 4 / 1 | Ascia, Spada |
| Custode Abissale | 17 | 2 | 3 / 4 | Fireball, Spada |
| Idra delle Catacombe | 16 | 3 | 2 / 3 | Due Asce |
| Cavaliere Senza Volto | 17 | 2 | 5 / 2 | Spada |
| Ent Antico | 19 | 1 | 3 / 4 | Ascia, Fireball |

Il sorteggio seleziona un elemento dall'array dei boss a ogni preparazione della partita. Gli attacchi sono dati configurati: le loro regole di risoluzione non sono ancora implementate.

Le condizioni previste dal motore per terminare la partita sono:

- **Vittoria prevista:** la vita del boss arriva a zero.
- **Sconfitta prevista:** tutti i personaggi hanno vita pari o inferiore a zero.

La gestione dei turni dei nemici, la risoluzione dei danni, il calcolo del risultato e l'assegnazione del rating sono ancora incompleti.

## Stato attuale del prototipo

Il server permette di creare una lobby, far entrare 2–4 partecipanti e avviare la partita. La selezione dei personaggi include timer, preferenze modificabili fino a **Ready**, risoluzione casuale dei conflitti e visualizzazione temporizzata degli abbinamenti. Durante una partita, un aggiornamento della pagina sulle route in-progress ripristina la connessione usando l'ID della partita nell'URL e il cookie HTTP-only dell'account. Se un client si disconnette, il gioco sospende le azioni e i timer per un massimo di **15 secondi**: il rientro del giocatore riprende subito la partita; se il tempo scade, la partita riprende comunque e il giocatore può rientrare successivamente. Il motore contiene inoltre modelli e reducer per alcune fasi di preparazione, movimento ed esplorazione; non è ancora integrato nel flusso completo delle azioni di gioco.

Perciò questo documento è una base verificabile per il regolamento, non ancora un manuale sufficiente per giocare una partita completa. Le regole di combattimento, le abilità, l'equipaggiamento, le trappole e i tesori, il comportamento dei nemici e le condizioni pratiche di vittoria devono essere definite e implementate prima del rilascio.

## Riferimenti nel progetto

- [Ambientazione](./Ambientazione.md)
- [Contenuti e statistiche](./server/src/gameone/gameone-contents.ts)
- [Flusso delle azioni](./server/src/gameone/rules/gameone.flow.ts)
- [Reducer di movimento](./server/src/gameone/rules/2_PlayerActions/move.reducer.ts)
- [Reducer di combattimento](./server/src/gameone/rules/2_PlayerActions/fight.reducer.ts)
- [Controllo di fine partita](./server/src/gameone/rules/3_PhaseFeed/checkEndGame.reducer.ts)
