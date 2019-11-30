class Team {
  players = [];

  currentSession = null

  constructor(name) {
    this.name = name;
  }

  setSession(session) {
    this.currentSession = session;
  }

  getSession() {
    return this.currentSession;
  }

  serialize() {
    return {
      name: this.name,
    }
  }

  addPlayer(player) {
    this.players.push(player);
  }

  removePlayer(player) {
    this.players = this.players.filter(currentPlayer => currentPlayer.id !== player.id);
  }
}

module.exports = { Team };
