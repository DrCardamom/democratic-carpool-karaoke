const express = require('express');
const app = express();
const request = require('request');
const cors = require('cors');
const dotenvConfig = require('dotenv').config();
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');

const login = require('./controllers/login/login');
const callback = require('./controllers/callback/callback');
const chooseGenerations = require('./controllers/firstClick/chooseGenerations');
const playlistUrl = require('./controllers/firstClick/playlistUrl');
const merge = require('./controllers/secondClick/merge');
const completePlaylist = require('./controllers/secondClick/completePlaylist');

const env = process.env.NODE_ENV || 'development';
const config = require('./config/config')[env];
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const port = process.env.PORT || 5000;
const sharedVar = require('./config/sharedVariables');
const stateKey = 'spotify_auth_state';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cookieParser())
   .use(cors());

/**
 * Spotify authorization process step 1/3;
 * get an authorization code
 */
app.get('/login', (req, res) => {  
  login.handleLogin(req, res, stateKey, querystring, client_id)
});

/**
 * Spotify authorization process step 2&3/3;
 */
app.get('/callback', (req, res) => {
  callback.handleCallback(req, res, stateKey, querystring, client_id, client_secret,request)
});

/**
 * Receive users input from front end, create a playlist placeholder, make 2 trackIdarrays based on that
 */
app.post('/firstClick', (req, res) => {
  console.log('🦄Playlist Name: ' + req.body.playlistName);
  console.log('☘️ User1 generation: ' + req.body.gen1);
  console.log('🌸 User2 generation: ' + req.body.gen2);

  // generate a playlist address, nothing in it yet
  playlistUrl.generatePlaylistUrl(req, res, request)
  // make an API call to fetch track IDs then put them into an 2 arrays 
  chooseGenerations.generate2TrackIdArrays(req, res, request, app, bodyParser)

  res.send('true'); 
});   

/**
 * Actually add songs to the playlist placeholder 
 */
app.get('/secondClick', (req, res) => {

  merge.mix2Arrays();
  completePlaylist.pushSongsIntoPlaylist(req, res, request);
});

if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));
  // Handle React routing, return all requests to React app
  app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.listen(port, () => console.log(`Listening on port ${port}`));
