//Hide and show proper views when arriving at the site
$(document).ready(function() {
  $("#mainlink").click(function() {
    $('#submenu').toggle('show');
  });
});

window.onload = function(e){
  $('#submenu').toggle('show');
  $("#landing").hide();
};


// Initialize the MIDI system
var midisystem;
navigator.requestMIDIAccess && navigator.requestMIDIAccess().then(
  function success(midiAccess) {
	// Initialize MIDI system
	midisystem = new MidiSystem(midiAccess);
  // Create a MIDI listener
  midisystem.stateChange.attach(function () {
    console.log("created MIDI listener for", midisystem.selectedMidiInput.name);
    midisystem.selectedMidiInput.onmidimessage = onMidiMessage;
  });

	midisystem.init();
	console.log("Input ", midisystem.selectedMidiInput.name);
	console.log("Output ", midisystem.selectedMidiOutput.name);
  },
  function failure () {// Failed accessing MIDI
	console.log("Error initializing MIDI!");
	// @TODO Warn user that MIDI is not available. Stop app?
  }
);

// Handler for incoming midi messages
function onMidiMessage(receivedEvent) {
  if ((receivedEvent.data[0] & 0xF0) != 0xF0) { // filter out SysEx messages, Active Sensing and other undesired messages.
    // console.log("Sent midi: " + JSON.stringify(receivedEvent.data));
    activedc.send(JSON.stringify({
      message: receivedEvent.data,
      type: "midi"
    }));
  }
}

// Get the modal
var modal1 = document.getElementById('dialog1');
var modal2 = document.getElementById('dialog2');

// Get the button that opens the modal
var btn1 = document.getElementById("myBtn1");
var btn2 = document.getElementById("myBtn2");

// When the user clicks on the button, open the modal
btn1.onclick = function() {
    modal1.showModal();
}
btn2.onclick = function() {
    modal2.showModal();
}

/*  --------FIREBASE STUFF--------- */
function logMeOut() {
  if (firebase.auth().currentUser) {
    if (!receiverUid) {
      receiverUid = 'dummy';
    }
    // Delete all firebase listeners
    firebase.database().ref(pathToSignaling+'/'+currentUser.uid + '/offer').off();
    firebase.database().ref(pathToSignaling+'/'+receiverUid + '/answer').off();
    firebase.database().ref(pathToSignaling+'/'+receiverUid+'/ice-to-offerer').off();
    firebase.database().ref(pathToSignaling+ '/' + currentUser.uid + '/ice-to-answerer').off();

    var update = {};
    update[pathToSignaling + "/" + receiverUid]  = null;
    // Delete any offer left over
    firebase.database().ref().update(update)
    .then(function() {
      // delete listener for self and users online
      console.log('deleting listener for user');
      firebase.database().ref(pathToUser).off();
      firebase.database().ref(pathToOnline).off();
      // delete online entry
      var update = {};
      update[pathToOnline + "/" + currentUser.uid] = null;
      return firebase.database().ref().update(update);
    })
    .then(
        function () {
          firebase.auth().signOut();
    })
    .catch(function (e) {console.log('Error on logout process', e);});
  }

  receiverUid = '';
  // Kill video streams and video elements.
  var localvideo = document.getElementById('localVideo');
  localvideo.srcObject = null;
  var remotevideo = document.getElementById('remoteVideo');
  remotevideo.srcObject = null;

  if (localTracks) {
    localTracks.forEach(function (track) {
      track.stop();
    });
  }

   // Semaphore to disable negotiation when logging out (onnegotiationneeded is triggered when removing streams)
  negotiate = false;
  if (pc1 && pc1.getLocalStreams) {
    pc1.getLocalStreams().forEach(function(stream){
      pc1.removeStream(stream);
    });
  }

  if (pc2 && pc2.getLocalStreams) {
    pc2.getLocalStreams().forEach(function(stream){
      pc2.removeStream(stream);
    });
  }

  activedc && activedc.close();

  if (pc1 && pc1.signalingState != 'closed') {
      pc1.close();
      setTimeout(function() {pc1 = null;}, 1000)
  }
   if (pc2 && pc2.signalingState != 'closed') {
      pc2.close();
      setTimeout(function() {pc2 = null;}, 1000)
  }
}

function hangUp() {
  // First take care of offer and online status
  if (currentUser) {
    if (!receiverUid) {
      receiverUid = 'dummy';
    }
    // Delete all firebase listeners
    firebase.database().ref(pathToSignaling+'/'+receiverUid + '/answer').off();
    firebase.database().ref(pathToSignaling+'/'+receiverUid+'/ice-to-offerer').off();
    firebase.database().ref(pathToSignaling+ '/' + currentUser.uid + '/ice-to-answerer').off();

    var update = {};
    update[pathToSignaling + "/" + receiverUid]  = null;
    // Delete any offer left over
    firebase.database().ref().update(update)
    .then(function() {
     // set status to online
      myStatus = 1;
      var update = {};
      update[pathToOnline + "/" + currentUser.uid +"/status"] = 1;
      firebase.database().ref().update(update);
    });
  }

  receiverUid = '';

  // Kill video streams and video elements.
  var localvideo = document.getElementById('localVideo');
  localvideo.srcObject = null;
  var remotevideo = document.getElementById('remoteVideo');
  remotevideo.srcObject = null;
  remotevideo.src = '';
  if (localTracks) {
    localTracks.forEach(function (track) {
      track.stop();
    });
  }
   // Semaphore to disable negotiation when logging out (onnegotiationneeded is triggered when removing streams)
  negotiate = false;
  if (pc1 && pc1.getLocalStreams) {
    pc1.getLocalStreams().forEach(function(stream){
      pc1.removeStream(stream);
    });
  }

  if (pc2 && pc2.getLocalStreams) {
    pc2.getLocalStreams().forEach(function(stream){
      pc2.removeStream(stream);
    });
  }

  activedc && activedc.close();
  if (pc1 && pc1.signalingState != 'closed') {
      pc1.close();
      setTimeout(function() {pc1 = null;}, 1000)
  }
   if (pc2 && pc2.signalingState != 'closed') {
      pc2.close();
      setTimeout(function() {pc2 = null;}, 1000)
  }
}

// Listener to log out firebase user when closing window
window.addEventListener("beforeunload", function() {
  logMeOut();
  console.log("Before unload");
});

// Add listener to log in form.
$('#login').on('submit',function(e) {
  e.preventDefault();
  var username=$("#username").val();
  var passw = $("#password").val();
  firebase.auth().signInWithEmailAndPassword(username, passw).catch(function(error) {
    bootbox.alert("<strong>Error:</strong> "+error.message + " (Error code: " + error.code+")");
  });
});

/*
// Add listeners to sign up button
document.querySelector("#sign-up").addEventListener("click", function (e) {
  e.preventDefault();
  var signUp = new SignUp();
  $('#login').hide();
  signUp.render();
});

// Add listener to reset password button
document.querySelector("#reset-password").addEventListener("click", function (e) {
  e.preventDefault();
  var passReset = new UserPasswordReset();
  $('#login').hide();
  passReset.render();
});
*/

// Global firebase variables
var pathToUser, currentUser, currentUserInfo,
  pathToOnline = 'online';
  pathToSignaling = 'signaling';

/* Detects log in */
firebase.auth().onAuthStateChanged(function(user) {
  console.log('firebase state change: ' + JSON.stringify(user));
  if (user) {
    $("#login").hide();
    $("#landing").show();
    currentUser = user; // user object
    pathToUser = 'users/' + currentUser.uid;

    // create user account form
    var userAccountForm = new UserAccountForm($("#modals"));

    // create user admin menu
    var userMenu = new UserMenu(userAccountForm, $("#user-menu"));
    userMenu.show();

    // Set user to "online" status
    firebase.database().ref(pathToUser).once('value')
    .then (function (snapshot) {
      if (snapshot.val()) {
	      currentUserInfo = snapshot.val();
	      console.log("Current user (once) " + JSON.stringify(currentUserInfo));
	       // Set online status
         myStatus = 1;
	      return firebase.database().ref(pathToOnline + "/" + currentUser.uid).set({
	        status: 1,
	        nick: currentUserInfo.nick,
	      });
      }
    })
    .catch (function(error) {
      console.log("Error in getting user info "+error);
    });

    // Create listener for modifications of user info database node
    firebase.database().ref(pathToUser).on('value', function (snapshot) {
      if (snapshot.val()) {
        currentUserInfo = snapshot.val();
        console.log("Current user " + JSON.stringify(currentUserInfo));
      }
    });

    var onlineUsersModel = new userHandlingModel();
    var onlineUsersView = new userHandlingView(onlineUsersModel, $('#userlist'));
    var onlineUsersController = new userHandlingController(onlineUsersModel, onlineUsersView);

    // Create listener for offers from someone else
    firebase.database().ref(pathToSignaling + "/" + currentUser.uid + "/offers").on('child_added', offerReceived);

  } else {
    // User is logged out
    $("#landing").hide().find("*").off();
    $("#login").show('fast');
    $("#modals").find("*").off();  // turn off all modal listeners
  }
}, function(error) { // handle errors
  console.log(error);
});


function getTimestamp () {
  var totalSec = new Date().getTime() / 1000;
  var hours = parseInt(totalSec / 3600) % 24;
  var minutes = parseInt(totalSec / 60) % 60;
  var seconds = parseInt(totalSec % 60);

  var result = (hours < 10 ? '0' + hours : hours) + ':' +
    (minutes < 10 ? '0' + minutes : minutes) + ':' +
    (seconds < 10 ? '0' + seconds : seconds);

  return result;
}

function writeToChatLog (message, message_type) {
  document.getElementById('chatlog').innerHTML += '<p class="' + message_type + '">' + '[' + getTimestamp() + '] ' + message + '</p>';
}

//function writeToMIDILog (message, message_type) {
//  document.getElementById('midilog').innerHTML += '<p class="' + message_type + '">' + '[' + getTimestamp() + '] ' + message + '</p>';
//}
