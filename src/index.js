require('dotenv').config();

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const { Player } = require('./player');
const { Admin } = require('./admin');
const { Team } = require('./team');
const { Session } = require('./session');
const { Game } = require('./game');

const { APP_PORT } = process.env;

app.get('/health', (req, res) => {
  res.send('ok');
});

const teamA = new Team('teamA');
const teamB = new Team('teamB');

// const gameDoors = [4,8,4, 7,11,1, 4,4,0];
// const gameOrder = [0, 1, 4, 3, 6, 7, 8, 5, 9];

const gameDoors = [4];
const gameOrder = [0];

let players = [];

const wait = (t) => new Promise((resolve) => setTimeout(resolve, t));

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

  if (newGameOrder < gameOrder.length) {
    const session = new Session(
      game,
      team,
      (outcome) => createNewSession(game, outcome, team),
      newGameOrder,
    );

    team.setSession(session);
    console.log(`Next tile. Status: ${previousOutcome}`);
  } else {
    team.setSession(null);
    game.end(team);
    console.log('End tile');
  }
}

const adminNamespace = io.of('/admin');
adminNamespace.on('connection', function(socket){
  const admin = new Admin(socket.id, socket);
  console.log(`${admin.id} connected`);

  socket.on('disconnect', function () {
    console.log(`${admin.id} disconnected`);
  });

  socket.emit('teams', {
    teamA: teamA.serialize(),
    teamB: teamB.serialize(),
  });

  socket.on('game-init', async () => {
    const game = new Game(gameDoors, gameOrder);
    createNewSession(game, null, teamA);
    createNewSession(game, null, teamB);

    console.log('Starting game...');

    socket.emit('game-init', { game });

    await wait(1000);

    socket.emit('game-start');
  });
});

const userNamespace = io.of('/user');
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
    const { team } = JSON.parse(msg);

    playerTeam = teamA;

    // if (team !== 'teamA' && team !== 'teamB') {
    //   console.log(`${player.id} tried to join ${team} but didn't succeed`);

    //   return;
    // }

    // if (team === 'teamA') {
    //   playerTeam = teamA;
    // } else if (team === 'teamB') {
    //   playerTeam = teamB;
    // }

    playerTeam.addPlayer(player);
    console.log(`${player.id} joined ${team}`);
  });

  socket.on('submit', (msg) => {
    if (playerTeam.getSession() === null) {
      console.log(`${player.id} wanted to submit to finished session`);
    }

    const { doorIndex } = JSON.parse(msg);
    try {
      console.log(`${player.id} submitted`);

      const currentSession = playerTeam.getSession();
      currentSession.submit(player, doorIndex);
    } catch (error) {
      console.log(`${player.id} wanted to submit to not existing session`, error);
    }
  });
});


http.listen(APP_PORT, () => {
  console.log(`Listening on port ${APP_PORT}`);
});
