var redirect_uri = "http://127.0.0.1:5500/UQ%20Dance%20Music%20Manager/index.html"; // change this your value
//var redirect_uri = "http://127.0.0.1:5500/index.html";
 

var client_id = "57c836e90173465799dfa73c062772f8"; 
var client_secret = "012bc29a568c4f97a585520445a7f9da"; // In a real app you should not expose your client_secret to the user

var access_token = null;
var refresh_token = null;
var playlistURLAddition = "?limit=5";
var playerURLAddition = "?market=US";
var radioButtons = [];
// Device, Playlist, Track, Album
var currentPlayingIDs = ["", "", "", ""];
var currentSelectedIDs = ["", "", "", ""];
var currentPlayingOBJs = [null, null, null, null];
var currentSelectedOBJs = [null, null, null, null];

var playbackActive = false;

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
const SHUFFLE = "https://api.spotify.com/v1/me/player/shuffle";
const CURRENTLYPLAYING = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENTLYPLAYED = "https://api.spotify.com/v1/me/player/recently-played";











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
    if (item.is_active) {
        currentPlayingOBJs[0] = item;
        currentPlayingIDs[0] = item.id;
    }
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
    return currentPlayingIDs[0];
}

function playlistSelected(id) {
    currentSelectedIDs[1] = id.target.id;
    updatePlaylistHighlight()
    refreshPlaylists();
    fetchTracks();
}

function deviceSelected(id) {
    // currentSelectedIDs[0] = id.target.id;
    currentSelectedIDs[0] = document.getElementById("devices").value;
}

function updatePlaylistHighlight(){
    if (document.getElementById(currentSelectedIDs[1]) != null) {
        document.getElementById(currentSelectedIDs[1]).className += " currentlyPlaying";
    } else if(document.getElementById(currentPlayingIDs[1]) != null) {
        document.getElementById(currentPlayingIDs[1]).className += " currentlyPlaying";
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
    let playlist_id = currentSelectedIDs[1];
    if ( playlist_id.length > 0 ){
        url = TRACKS.replace("{{PlaylistId}}", playlist_id);
        callApi( "GET", url, null, handleTracksResponse);
    }
    playlist_id = currentPlayingIDs[1];
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

// Potential model for getting more than the limit (must work together with a new handler function)
function recentlyPlayed(URL = RECENTLYPLAYED){
    callApi( "GET", URL + "?limit=50", null, handleRecentlyPlayedResponse);
}




// Playback Manipulation
function togglePauseResume(){
    // Updates currentTrackPlaying
    // Uses async/await to ensure correct order of operation
    currentlyPlaying()
    // If a track exists
    if (currentPlayingIDs[2] != null) {
        console.log(playbackActive)
        // If a track is currently playing
        if (playbackActive) {
            console.log("Was playing, now paused")
            pausePlayback();
        }
        // Track exists but is paused
        else {
            console.log("Was paused, now playing")
            // Plays on whatever device is currently playing
            resumePlayback(currentPlayingIDs[0]);
        }
    }

}

function shuffle(){
    callApi("PUT", SHUFFLE + "?state=true&device_id=" + deviceId(), null, handleApiResponse);
    togglePauseResume(); 
}

function pausePlayback(){
    callApi("PUT", PAUSE + "?device_id=" + deviceId(), null, handleApiResponse);
}

function resumePlayback(targetDeviceID = null){
    transfer(targetDeviceID);
    callApi("PUT", PLAY + "?device_id=" + deviceId(), null, handleApiResponse);
}

function next(){
    callApi("POST", NEXT + "?device_id=" + deviceId(), null, handleApiResponse);
}

function previous(){
    callApi("POST", PREVIOUS + "?device_id=" + deviceId(), null, handleApiResponse);
}

function transfer(targetDeviceID = null){
    let body = {};
    // Called without target
    if (targetDeviceID == null) {
        // Device selected
        if (currentSelectedIDs[0] != "") {
            // Target selected device
            targetDeviceID = currentSelectedIDs[0]
        }
        // No device selected
        else {
            // Target currently playing device
            targetDeviceID = currentPlayingIDs[0]
        }
    }
    body.device_ids = [];
    body.device_ids.push(deviceId)
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
            currentPlayingIDs[3] = data.item.album.id;
            currentPlayingOBJs[3] = data.item.album;
            currentPlayingIDs[2] = data.item.id;
            currentPlayingOBJs[2] = data.item;
            playbackActive = data.is_playing;
            document.getElementById("albumImage").src = currentPlayingOBJs[3].images[0].url;
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
            currentPlayingIDs[1] = data.context.uri.substring(data.context.uri.lastIndexOf(":") + 1,  data.context.uri.length );
            currentPlayingOBJs[1] = data.context;
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

// Currently overides tracks. To be changed
function handleRecentlyPlayedResponse() {
    // Good site response "200 OK"
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log("Recently Played handled");
        removeAllItems( "tracks" );
        data.items.forEach((item, index) => addTrack(item, index));
    }

    // Bad or expired token
    else if ( this.status == 401 ){
        refreshAccessToken()
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
    console.log(" ----- ----- ----- ");
    console.log("currentDevicePlaying: " + currentPlayingIDs[0]);
    console.log("currentPlaylistPlaying: " + currentPlayingIDs[1]);
    console.log("currentTrackPlaying: " + currentPlayingIDs[2]);
    console.log("currentAlbumPlaying: " + currentPlayingIDs[3]);
    // console.log("currentPlayingOBJs: " + currentPlayingOBJs);
    // currentPlayingOBJs.forEach(item =>{console.log(item)})
    console.log(" ----- ");
    console.log("currentDeviceSelected: " + currentSelectedIDs[0]);
    console.log("currentPlaylistSelected: " + currentSelectedIDs[1]);
    console.log("currentTrackSelected: " + currentSelectedIDs[2]);
    console.log("currentAlbumSelected: " + currentSelectedIDs[3]);
    console.log(" ----- ----- ----- ");

}


// All playback Manipulation buttons need debugging for proper functionality
//Debug album storage and display
// Debug refresh current tracks when currentPlaylistPlaying is empty
    // Impacted by 336 - handleResponses - refresh currently playing - track has playlist date
// TODO Auto song refresh at appropriate times (and on song change)
// TODO currentPlayingOBJs[1] should be a get playlist response, not a context object (for example, does not have id attribute)
// TODO handle case where no devices are available
// TODO Use async/await to debug togglePauseResume (to ensure currentlyPlaying is updated before continuing)
// TODO Debug device onchange function (not parsing 'id')