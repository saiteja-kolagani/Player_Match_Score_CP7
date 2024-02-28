const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

//Initializing Database and Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running')
    })
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
}
initializeDBAndServer()

//Converting DB Object TO Response Object
const convertDBObjectToResponseObject = dbObj => {
  return {
    playerId: dbObj.player_id,
    playerName: dbObj.player_name,
  }
}

//API FOR Returns a list of all the players in the player table
app.get('/players/', async (request, response) => {
  try {
    const getPlayersQuery = `
            SELECT 
            *
            FROM 
            player_details
            ORDER BY 
            player_id
        `
    const dbResponse = await db.all(getPlayersQuery)
    response.send(dbResponse.map(each => convertDBObjectToResponseObject(each)))
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

//API FOR Returns a specific player based on the player ID
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  try {
    const getPlayerQuery = `
        SELECT 
        *
        FROM 
        player_details
        WHERE 
        player_id = ?
      `
    const dbResponse = await db.get(getPlayerQuery, [playerId])
    response.send(convertDBObjectToResponseObject(dbResponse))
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

//API FOR Updates the details of a specific player based on the player ID
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const bodyDetails = request.body
  const {playerName} = bodyDetails
  try {
    const updatePlayerDetails = `
      UPDATE 
      player_details
      SET 
      player_name = ?
      WHERE 
      player_id = ?
    `
    const dbResponse = await db.run(updatePlayerDetails, [playerName, playerId])
    response.send('Player Details Updated')
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

//Convert Match Obj To Response Obj
const convertMatchObjToResponseObj = each => {
  return {
    matchId: each.match_id,
    match: each.match,
    year: each.year,
  }
}

//API FOR Returns the match details of a specific match
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  try {
    const getMatchDetailsQuery = `
      SELECT 
      *
      FROM
      match_details 
      WHERE 
      match_id = ?
    `
    const dbResponse = await db.get(getMatchDetailsQuery, [matchId])
    response.send(convertMatchObjToResponseObj(dbResponse))
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

//API FOR Returns a list of all the matches of a player
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  try {
    const getPlayerMatcheIdQuery = `
      SELECT
      match_details.match_id, match_details.match, match_details.year
      FROM 
      player_match_score NATURAL JOIN match_details
      WHERE 
      player_match_score.player_id = ?
    `
    const dbResponse = await db.all(getPlayerMatcheIdQuery, [playerId])
    response.send(dbResponse.map(each => convertMatchObjToResponseObj(each)))
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

//API FOR Returns a list of players of a specific match
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  try {
    const getPlayerDetailsQuery = `
      SELECT 
      player_details.player_id AS playerId,
      player_details.player_name AS playerName
      FROM 
      player_details NATURAL JOIN player_match_score
      WHERE 
      player_match_score.match_id = ?
    `
    const dbResponse = await db.all(getPlayerDetailsQuery, [matchId])
    response.send(dbResponse)
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

//API FOR Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  try {
    const getPlayerStatisticsQuery = `
      SELECT 
      player_details.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(player_match_score.fours) AS totalFours,
      SUM(player_match_score.sixes) AS totalSixes
      FROM 
      player_details INNER JOIN player_match_score
      ON player_details.player_id = player_match_score.player_id
      WHERE 
      player_match_score.player_id = ?
    `
    const dbResponse = await db.get(getPlayerStatisticsQuery, [playerId])
    response.send(dbResponse)
  } catch (e) {
    console.log(e.message)
    response.status(500).send('Internal Server Error')
  }
})

module.exports = app
