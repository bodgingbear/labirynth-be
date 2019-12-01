class Session {
  constructor(game, team, onSessionFinish, gameOrderIndex = 0) {
    this.game = game;
    this.team = team;
    this.gameOrderIndex = gameOrderIndex;
    this.onSessionFinish = onSessionFinish;

    this.votes = {};
    this.listeners = [];
    this.disabled = false;
  }

  checkValidity(doorIndex) {
    return doorIndex === this.game.gameDoors[
      this.game.gameOrder[this.gameOrderIndex]
    ];
  }

  notifyWatcher() {
    if (this.disabled) {
      return;
    }

    const {
      valid,
      invalid
    } = Object.values(this.votes)
      .reduce((
        {
          valid: accValid,
          invalid: accInvalid,
        },
        curr
      ) => {
        if (curr === -1) {
          return { valid: accValid, invalid: accInvalid };
        }

        if (this.checkValidity(curr)) {
          return { valid: accValid + 1, invalid: accInvalid };
        }

        return { valid: accValid, invalid: accInvalid + 1 };
      },
      {
        valid: 0,
        invalid: 0,
      }
    );

    if (valid <= invalid) {
      return this.onSessionFinish('error');
    }

    if (this.gameOrderIndex < this.game.gameOrder.length - 1) {
      return this.onSessionFinish('success');
    }

    return this.onSessionFinish('end');
  }

  submit(player, doorIndex) {
    this.votes[player.id] = doorIndex;

    if (Object.keys(this.votes).length >= this.team.players.length) {
      this.notifyWatcher(doorIndex);
    }
  }

  removeVote(player) {
    delete this.votes[player.id];
  }

  disable() {
    this.disabled = true;
  }
}

module.exports = { Session };
