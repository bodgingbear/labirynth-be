class Game {
  constructor(gameDoors, gameOrder) {
    this.status = 'running';
    this.onEnd = () => {};

    this.gameDoors = gameDoors;
    this.gameOrder = gameOrder;
  }

  end(team) {
    this.status = 'end';

    this.onEnd(team);
  }
}

module.exports = { Game };
