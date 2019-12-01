const combinations = [
  // {
  //   gameDoors: [4,8,4, 7,11,1, 4,4,0],
  //   gameOrder: [0, 1, 4, 3, 6, 7, 8, 5, 2],
  //   time: 10000,
  // },
  {
    gameDoors: [7,3,5,6,3,0,6,11,8,10,5,8,10,0,10,9],
    gameOrder: [0,4,5,1,2,3,7,6,10,11,15,14,13,9,8,12],
    time: 40000,
  },
];

let usedCombinations = [];

class Game {
  constructor() {
    this.status = 'running';
    this.onEnd = () => {};

    const filteredCombinations = combinations.reduce((acc, curr, i) => {
      if (usedCombinations.includes(i)) {
        return acc;
      }

      return [...acc, curr];
    }, []);

    const currentCombinationIndex = Math.floor(Math.random() * filteredCombinations.length);
    usedCombinations.push(currentCombinationIndex);

    if (usedCombinations.length === combinations.length) {
      usedCombinations = [];
    }

    this.gameDoors = filteredCombinations[currentCombinationIndex].gameDoors;
    this.gameOrder = filteredCombinations[currentCombinationIndex].gameOrder;
    this.time = filteredCombinations[currentCombinationIndex].time;
  }

  end(team) {
    this.status = 'end';

    this.onEnd(team);
  }
}

module.exports = { Game };
