const express = require("express");
const { open } = require("sqlite");

const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();

app.use(express.json());
let db = null;

const dbConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Database server started at http://localhost:3000/");
    });
  } catch (err) {
    console.log(`Database error is ${err.message}`);
    process.exit(1);
  }
};

dbConnection();

const convertPlayerObj = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

const convertMatchDetailsObj = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

const convertPlayerMatch = (obj) => {
  return {
    playerMatchId: obj.player_match_id,
    playerId: obj.player_id,
    matchId: obj.match_id,
    score: obj.score,
    fours: obj.fours,
    sixes: obj.sixes,
  };
};

// 1. GET PLAYER API

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `select * from player_details`;

  const playersArray = await db.all(getPlayerQuery);

  response.send(playersArray.map((each) => convertPlayerObj(each)));
});

//  2. GET PLAYERS API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `select * from player_details where player_id = ${playerId}`;

  const getPlayersArray = await db.get(getPlayersQuery);

  response.send(convertPlayerObj(getPlayersArray));
});

// 3. PUT PLAYER API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updateQuery = `update player_details set player_name = '${playerName}'
            where player_id = ${playerId}`;

  await db.run(updateQuery);
  response.send("Player Details Updated");
});

// 4. GET MATCHES API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchGetQuery = `select * from match_details where match_id = ${matchId}`;

  const matchesArray = await db.get(matchGetQuery);

  response.send(convertMatchDetailsObj(matchesArray));
});

// 5 . GET MATCH API

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const playersQuery = `select * from player_match_score natural join
                match_details where player_id = ${playerId}`;

  const playerMatches = await db.all(playersQuery);
  response.send(playerMatches.map((each) => convertMatchDetailsObj(each)));
});

// 6. MATCHES API

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchesQuery = `select * from player_match_score natural join
                        player_details where match_id = ${matchId}`;
  const matchesArray = await db.all(matchesQuery);
  response.send(matchesArray.map((each) => convertPlayerObj(each)));
});

// 7. PLAYER SCORE API

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;

  const playerDetailsQuery = `select player_id as playerId,
                                player_name as playerName,
                                sum(score) as totalScore,
                                sum(fours) as totalFours,
                                sum(sixes) as totalSixes from player_match_score
                                NATURAL JOIN player_details where player_id = ${playerId}`;
  const playersArray = await db.get(playerDetailsQuery);
  response.send(playersArray);
});

module.exports = app;
