# A sample of a Board Game

## STEP 1

Il gioco che vogliamo costruire è un gioco da tavolo in cui i giocatori collaborano per esplorare un luogo che non conoscono alla ricerca di un MacGuffin

### Prerequisiti per lo sviluppo e l'esecuzione

Installare globalmente questi pacchetti:

- [Git]
- [Visual_Studio_Code]
- [NodeJS]
- [pnpm]
- [Typescript]

### Inizializzazione del progetto

per iniziare possiamo scegliere se partire completamente da un progetto vuoto o se clonare questo repository per facilitarci le cose.

#### Da progetto vuoto

Per creare un progetto vuoto, segui i seguenti passaggi:

1. Crea una nuova cartella per il progetto.
2. Apri il terminale nella cartella appena creata.
3. Esegui il comando `pnpm init` per inizializzare un nuovo progetto vuoto.
4. Crea una cartella chiamata `server` per il server e una cartella chiamata `client` per il client.
5. Apri il file `package.json` appena generato ed aggiungi la configurazione per il workspace:
   `"workspaces": [ "server", "client" ]`
6. Ora sei pronto per iniziare a sviluppare il tuo progetto!

#### Clonando questo progetto

Per clonare questo progetto, segui i seguenti passaggi:

1. Apri il terminale nella cartella in cui desideri clonare il progetto.
2. Esegui il comando `git clone https://github.com/gbrunori/board-game-sample.git` per clonare il repository.
3. Entra nella cartella del progetto con il comando `cd board-game-sample`.
4. esegui `git switch step-01`
5. Ora sei pronto per iniziare a sviluppare il tuo progetto!

<!-- Link Mapper -->
[Git]: https://git-scm.com/downloads
[NodeJS]: https://nodejs.org/en/download/
[pnpm]: https://pnpm.io/installation
[Typescript]: https://www.typescriptlang.org/download
[Visual_Studio_Code]: https://code.visualstudio.com/download
