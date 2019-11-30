class Team {
  players = [];

  currentSession = null

  constructor(id) {
    this.id = id;
  }

  setSession(session) {
    this.currentSession = session;
  }

  getSession() {
    return this.currentSession;
  }

  serialize() {
    return {
      id: this.id,
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
