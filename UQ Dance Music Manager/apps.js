var redirect_uri = "http://127.0.0.1:5500/UQ%20Dance%20Music%20Manager/index.html"; // change this your value
//var redirect_uri = "http://127.0.0.1:5500/index.html";
 

var client_id = "57c836e90173465799dfa73c062772f8"; 
var client_secret = "012bc29a568c4f97a585520445a7f9da"; // In a real app you should not expose your client_secret to the user

var access_token = null;
var refresh_token = null;
var playlistURLAddition = "?limit=5";
var playerURLAddition = "?market=US";
var currentPlaylistPlaying = "";
var currentPlaylistSelected = "";
var currentDevicePlaying = [];
var currentAlbum = "";
var radioButtons = [];

const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PLAY = "https://api.spotify.com/v1/me/player/play";
const PAUSE = "https://api.spotify.com/v1/me/player/pause";
const NEXT = "https://api.spotify.com/v1/me/player/next";
const PREVIOUS = "https://api.spotify.com/v1/me/player/previous";
const PLAYER = "https://api.spotify.com/v1/me/player";
const TRACKS = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";
const CURRENTLYPLAYING = "https://api.spotify.com/v1/me/player/currently-playing";
const SHUFFLE = "https://api.spotify.com/v1/me/player/shuffle";











function onPageLoad(){
    // client_id = localStorage.getItem("client_id");
    // client_secret = localStorage.getItem("client_secret");
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret); // In a real app you should not expose your client_secret to the user
    if ( window.location.search.length > 0 ){
        handleRedirect();
    }
    else{
        access_token = localStorage.getItem("access_token");
        if ( access_token == null ){
            // we don't have an access token so present token section
            document.getElementById("userDetails").style.display = "block";  
            document.getElementById("heading").textContent = "No access Token"
        }
        else {
            // we have an access token so present device section
            document.getElementById("heading").textContent = "Access Token!!!"
            document.getElementById("deviceSection").style.display = "block";  
            document.getElementById("userDetails").style.display = "none";
            refreshDevices();
            refreshPlaylists();
            currentlyPlaying();
        }
    }
}

// Networking and Authentication
function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri); // remove param from url
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization(){
    // client_id = document.getElementById("clientId").value;
    // client_secret = document.getElementById("clientSecret").value;
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret); // In a real app you should not expose your client_secret to the user

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
}

function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}




// Utility Functions
function addDevice(item){
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById("devices").appendChild(node); 
}

function addPlaylist(item){
    let node = document.createElement("li");
    node.id = item.id;
    node.className = "playlistItem";
    node.onclick = playlistSelected;
    node.innerHTML = item.name + " (" + item.tracks.total + ")";
    document.getElementById("playlists").appendChild(node); 
}

function removeAllItems( elementId ){
    let node = document.getElementById(elementId);
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function addTrack(item, index){
    let node = document.createElement("option");
    node.value = index;
    node.innerHTML = item.track.name + " (" + item.track.artists[0].name + ")";
    document.getElementById("tracks").appendChild(node); 
}

function deviceId(){
    return document.getElementById("devices").value;
}

function playlistSelected(id) {
    currentPlaylistSelected = id.target.id;
    updatePlaylistHighlight()
    refreshPlaylists();
    fetchTracks();
}

function updatePlaylistHighlight(){
    if (document.getElementById(currentPlaylistSelected) != null) {
        document.getElementById(currentPlaylistSelected).className += " currentlyPlaying";
    } else if(document.getElementById(currentPlaylistPlaying) != null) {
        document.getElementById(currentPlaylistPlaying).className += " currentlyPlaying";
    }
}




// Refresh Functions
function refreshDevices(){
    callApi( "GET", DEVICES, null, handleDeviceResponse);
}

function refreshPlaylists(){
    callApi( "GET", PLAYLISTS + playlistURLAddition, null, handlePlaylistResponse);
}

function fetchTracks(){
    let playlist_id = currentPlaylistSelected;
    if ( playlist_id.length > 0 ){
        url = TRACKS.replace("{{PlaylistId}}", playlist_id);
        callApi( "GET", url, null, handleTracksResponse);
    }
    playlist_id = currentPlaylistPlaying;
    if ( playlist_id.length > 0 ){
        url = TRACKS.replace("{{PlaylistId}}", playlist_id);
        callApi( "GET", url, null, handleTracksResponse);
    }
}

function currentlyPlaying(){
    callApi( "GET", PLAYER + playerURLAddition, null, handleCurrentlyPlayingResponse);
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.onload = callback;
    xhr.send(body);
}




// Playback Manipulation
function play(){
    console.log(document.getElementById("playlists").value);
    let playlist_id = document.getElementById("playlists").value;
    let trackindex = document.getElementById("tracks").value;
    // let album = document.getElementById("album").name;
    let album = currentAlbum;
    let body = {};
    if (album.length > 0){
        body.context_uri = album;
    }
    else{
        body.context_uri = "spotify:playlist:" + playlist_id;
    }
    body.offset = {};
    body.offset.position = trackindex.length > 0 ? Number(trackindex) : 0;
    body.offset.position_ms = 0;
    callApi("PUT", PLAY + "?device_id=" + deviceId(), JSON.stringify(body), handleApiResponse);
}

function shuffle(){
    callApi("PUT", SHUFFLE + "?state=true&device_id=" + deviceId(), null, handleApiResponse);
    play(); 
}

function pause(){
    callApi("PUT", PAUSE + "?device_id=" + deviceId(), null, handleApiResponse);
}

function next(){
    callApi("POST", NEXT + "?device_id=" + deviceId(), null, handleApiResponse);
}

function previous(){
    callApi("POST", PREVIOUS + "?device_id=" + deviceId(), null, handleApiResponse);
}

function transfer(){
    let body = {};
    body.device_ids = [];
    body.device_ids.push(deviceId())
    callApi("PUT", PLAYER, JSON.stringify(body), handleApiResponse);
}



// Response Management
function handleApiResponse() {
    if ( this.status == 200){
        console.log(this.responseText);
        setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 204 ){
        setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }    
}

function handleDeviceResponse() {
    // Good site response "200 OK"
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log("Devices handled");
        removeAllItems( "devices" );
        data.devices.forEach(item => addDevice(item));        
    }

    // Bad or expired token
    else if ( this.status == 401 ){
        refreshAccessToken()
    }

    // Playback is not active, or command has been sent
    else if ( this.status == 204 ){
        if (this.responseURL == PLAYER + playerURLAddition) {
            // document.getElementById("currentlyPlaying").display = "none";
            console.log("No song currently playing");
        }
    }
    
    // Unexpected site response
    else {
        console.log(this.responseText);
        console.log(PLAYER + playerURLAddition);
        // alert(this.responseText);
    }
}

function handlePlaylistResponse() {
    // Good site response "200 OK"
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log("Playlist handled");
        removeAllItems( "playlists" );
        data.items.forEach(item => addPlaylist(item));
        updatePlaylistHighlight();
        fetchTracks();
    // document.getElementById('playlists').value=currentPlaylistPlaying;      
    }

    // Bad or expired token
    else if ( this.status == 401 ){
        refreshAccessToken()
    }

    // Playback is not active, or command has been sent
    else if ( this.status == 204 ){
        if (this.responseURL == PLAYER + playerURLAddition) {
            // document.getElementById("currentlyPlaying").display = "none";
            console.log("No song currently playing");
        }
    }
    
    // Unexpected site response
    else {
        console.log(this.responseText);
        console.log(PLAYER + playerURLAddition);
        // alert(this.responseText);
    }
}

function handleTracksResponse() {
    // Good site response "200 OK"
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log("Tracks handled");
        removeAllItems( "tracks" );
        data.items.forEach((item, index) => addTrack(item, index));
    }

    // Bad or expired token
    else if ( this.status == 401 ){
        refreshAccessToken()
    }

    // Playback is not active, or command has been sent
    else if ( this.status == 204 ){
        if (this.responseURL == PLAYER + playerURLAddition) {
            // document.getElementById("currentlyPlaying").display = "none";
            console.log("No song currently playing");
        }
    }
    
    // Unexpected site response
    else {
        console.log(this.responseText);
        console.log(PLAYER + playerURLAddition);
        // alert(this.responseText);
    }
}

function handleCurrentlyPlayingResponse() {
    // Good site response "200 OK"
    if ( this.status == 200 ){
        // Means an active player exists, else 204 status would have been thrown
        var data = JSON.parse(this.responseText);
        console.log("Currently Playing handled");

        // Unhides Currently playing div
        document.getElementById("currentlyPlaying").style.display = "block";
        
        
        if ( data.item != null ){
            currentAlbum = data.item.album;
            document.getElementById("albumImage").src = currentAlbum.images[0].url;
            document.getElementById("trackTitle").innerHTML = data.item.name;
            document.getElementById("trackArtist").innerHTML = data.item.artists[0].name;
        }
        
        if ( data.device != null ){
            // select device
            currentDevice = data.device.id;
            document.getElementById('devices').value=currentDevice;
        }
        
        // If the track has playlist data
        if ( data.context != null ){
            // select playlist
            currentPlaylistPlaying = data.context.uri;
            currentPlaylistPlaying = data.context.uri.substring(currentPlaylistPlaying.lastIndexOf(":") + 1,  currentPlaylistPlaying.length );
            // console.log(currentPlaylistPlaying);
            // console.log(data);
            // Display the playlist name
            // document.getElementById('playlists').value=currentPlaylistPlaying;
        }

        // Updates Playlist Highlight
        updatePlaylistHighlight();
    }

    // Bad or expired token
    else if ( this.status == 401 ){
        refreshAccessToken()
    }

    // Playback is not active, or command has been sent
    else if ( this.status == 204 ){
        if (this.responseURL == PLAYER + playerURLAddition) {
            // document.getElementById("currentlyPlaying").display = "none";
            console.log("No song currently playing");
        }
    }
    
    // Unexpected site response
    else {
        console.log(this.responseText);
        console.log(PLAYER + playerURLAddition);
        // alert(this.responseText);
    }
}



// Debug Functions
function verboseData(){
    console.log("currentPlaylistPlaying: " + currentPlaylistPlaying);
    console.log("currentPlaylistSelected: " + currentPlaylistSelected);
}


// All playback Manipulation buttons need debugging for propper functionality
//Debug album storage and display
// Debug refresh current tracks when currentPlaylistPlaying is empty
    // Impacted by 336 - handleResponses - refresh currently playing - track has playlist date
// TODO Auto song refresh at appropriate times (and on song change)