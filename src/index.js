require('dotenv').config();

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const { Player } = require('./player');
const { Admin } = require('./admin');
const { Team } = require('./team');
const { Session } = require('./session');
const { Game } = require('./game');

const { PORT, TIME_FOR_LOOKING } = process.env;

app.get('/health', (req, res) => {
  res.send('ok');
});

const wait = (t) => new Promise((resolve) => setTimeout(resolve, t));

const teamIds = ['teamA', 'teamB'];
const teams = teamIds.map(teamId => new Team(teamId));

// /*
const gameDoors = [4,8,4, 7,11,1, 4,4,0];
const gameOrder = [0, 1, 4, 3, 6, 7, 8, 5, 9];

// const gameDoors = [6, 4, 4, 3, 4, 1, 4, 4, 1];
// const gameOrder = [0, 3, 4, 5, 2];
/*/
const gameDoors = [4];
const gameOrder = [0];
//*/

let globalGame;
const adminNamespace = io.of('/admin');
const userNamespace = io.of('/user');

const getNewOrder = (previousOutcome, gameOrderIndex) => {
  if (previousOutcome === 'success') {
    return gameOrderIndex + 1;
  }

  return gameOrderIndex;
}

const createNewSession = (game, previousOutcome, team) => {
  const previousSession = team.getSession();
  const newGameOrder = getNewOrder(
    previousOutcome,
    (previousSession && previousSession.gameOrderIndex) || 0
  );

  if (previousOutcome !== 'end') {
    const session = new Session(
      game,
      team,
      (outcome) => createNewSession(game, outcome, team),
      newGameOrder,
    );

    team.setSession(session);
    console.log(`Next tile. Status: ${previousOutcome}`);

    adminNamespace.emit(
      'game-update',
      {
        team: team.serialize(),
        previousOutcome,
      }
    )
    userNamespace.emit(
      'game-update',
      {
        team: team.serialize(),
        previousOutcome,
        gameOrder: game.gameOrder[newGameOrder]
      }
    )
  } else {
    team.setSession(null);
    game.end(team);

    adminNamespace.emit(
      'game-update',
      { team: team.serialize() }
    )
    userNamespace.emit(
      'game-update',
      { team: team.serialize() }
    )

    console.log('End tile');
  }
}

adminNamespace.on('connection', async (socket) => {
  const admin = new Admin(socket.id, socket);
  console.log(`${admin.id} connected`);

  socket.on('disconnect', function () {
    console.log(`${admin.id} disconnected`);
  });

  socket.emit('teams', Object.fromEntries(
    teams.map((team) => [team.id, team.serialize()])
  ));

  socket.on('game-init', async () => {
    try {
      globalGame = new Game(gameDoors, gameOrder);
      console.log('Starting game...');

      teams.forEach(team => {
        createNewSession(globalGame, null, team);
        createNewSession(globalGame, null, team);
      })

      socket.emit('game-init', { game: globalGame });

      await wait(TIME_FOR_LOOKING);

      socket.emit('game-start');
      console.log('Game started...');
    } catch (error) {
      console.error('An error occurred while starting game', error);
    }
  });
});

userNamespace.on('connection', (socket) => {
  const player = new Player(socket.id, socket);
  let playerTeam;
  console.log(`${player.id} connected`);

  socket.on('disconnect', function () {
    console.log(`${player.id} disconnected`);

    if (playerTeam) {
      playerTeam.removePlayer(player);
    }
  });

  socket.on('join', (msg) => {
    if (globalGame && globalGame.status === 'end') {
      return console.log(`${player.id} tried to join game but the game isn't started`);
    }

    try {
      const { team: teamID } = JSON.parse(msg);

      if (!teamIds.includes(teamID)) {
        console.log(`${player.id} tried to join ${teamID} but didn't succeed`);

        return;
      }

      playerTeam = teams.find((team) => team.id === teamID);

      playerTeam.addPlayer(player);
      console.log(`${player.id} joined ${teamID}`);
    } catch (error) {
      console.error('An error occurred while joining', error);
    }
  });

  socket.on('submit', (msg) => {
    if (globalGame && globalGame.status === 'end') {
      console.log(`${player.id} wanted to submit to finished session`);

      return;
    }

    try {
      const parsed = JSON.parse(msg);
      const doorIndex = Number.parseInt(parsed, 10);
      console.log(`${player.id} submitted`);

      const currentSession = playerTeam.getSession();
      currentSession.submit(player, doorIndex);
    } catch (error) {
      console.log(`${player.id} wanted to submit to not existing session`, error);
    }
  });
});

http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
