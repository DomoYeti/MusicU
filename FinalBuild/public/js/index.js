/* ------------------ Window and Document Functions ------------------ */
//Hide and show proper views when arriving at the site
$(document).ready(function() {
  $('#blahblah').hide();
  $("#chipbutton").click(function() {
    $('#blahblah').toggle('show');
  });
  $("#mainlink").click(function() {
    $('#submenu').toggle('show');
  });
});

//var dialogPolyfill = {};

// Get the modal
var receivedCallDialog = document.getElementById('receivedCallDialog');
var sendingCallDialog = document.getElementById('sendingCallDialog');
var MemberListModal = document.getElementById('groupMembersDialog');
var PendingListModal = document.getElementById('pendingMemberDialog');

//Listener to log out firebase user when closing window
// window.onunload = function() {
//   logMeOut();
//   console.log("on onload");
// }

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

function getHoursMinutes () {
  var totalSec = new Date().getTime() / 1000;
  var hours = parseInt(totalSec / 3600) % 24;
  var minutes = parseInt(totalSec / 60) % 60;
  var result;

  if (hours > 12) {
    hours = hours - 12;
    result = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' - pm';
  } else {
    result = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' - am';
  }
  return result;
}

function generateUUID () { // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

/* ------------------ Firebase User Functions ------------------ */

// Global firebase variables
var pathToUser;
var currentUser;
var currentUserInfo;
var currentGroup = 'b2bf2eb5-ecab-407a-bac9-71f88fdaa029';
var pathToOnline = 'online';
var pathToSignaling = 'signaling';
var pathToAllUsers = 'users';
var ConvoConnections = 'convoConnections';
var ConvoMessages = 'convoMessages';
var messages = 'messages';
var pathToGroups = 'groups';
var onlineUsers;
var myStatus;
var currentTab = null;

function logMeOut() {
  if (firebase.auth().currentUser) {

    console.log("User", currentUser.uid, "Status:", myStatus);
    if (myStatus == 0) {
      hangUp();
    }

    firebase.database().ref(pathToUser).off();
    firebase.database().ref(pathToOnline).off();
    firebase.database().ref(pathToOnline).child(currentUser.uid).remove();
    firebase.auth().signOut();

    // if (!receiverUid) {
    //   receiverUid = 'dummy';
    // }
    // // Delete all firebase listeners
    // firebase.database().ref(pathToSignaling+'/'+currentUser.uid + '/offer').off();
    // firebase.database().ref(pathToSignaling+'/'+receiverUid + '/answer').off();
    // firebase.database().ref(pathToSignaling+'/'+receiverUid+'/ice-to-offerer').off();
    // firebase.database().ref(pathToSignaling+ '/' + currentUser.uid + '/ice-to-answerer').off();
    //
    // var update = {};
    // update[pathToSignaling + "/" + receiverUid]  = null;
    // // Delete any offer left over
    // firebase.database().ref().update(update)
    // .then(function() {
    //   // delete listener for self and users online
    //   console.log('deleting listener for user');
    //   firebase.database().ref(pathToUser).off();
    //   firebase.database().ref(pathToOnline).off();
    //   // delete online entry
    //   var update = {};
    //   update[pathToOnline + "/" + currentUser.uid] = null;
    //   return firebase.database().ref().update(update);
    // })
    // .then(function () {
    //       firebase.auth().signOut();
    // })
    // .catch(function (e) {console.log('Error on logout process', e);});
  }
  //
  // receiverUid = '';
  // // Kill video streams and video elements.
  // var localvideo = document.getElementById('localVideo');
  // localvideo.srcObject = null;
  // var remotevideo = document.getElementById('remoteVideo');
  // remotevideo.srcObject = null;
  //
  // if (localTracks) {
  //   localTracks.forEach(function (track) {
  //     track.stop();
  //   });
  // }
  //
  //  // Semaphore to disable negotiation when logging out (onnegotiationneeded is triggered when removing streams)
  // negotiate = false;
  // if (pc1 && pc1.getLocalStreams) {
  //   pc1.getLocalStreams().forEach(function(stream){
  //     pc1.removeStream(stream);
  //   });
  // }
  //
  // if (pc2 && pc2.getLocalStreams) {
  //   pc2.getLocalStreams().forEach(function(stream){
  //     pc2.removeStream(stream);
  //   });
  // }
  //
  // activedc && activedc.close();
  //
  // if (pc1 && pc1.signalingState != 'closed') {
  //     pc1.close();
  //     setTimeout(function() {pc1 = null;}, 1000)
  // }
  //  if (pc2 && pc2.signalingState != 'closed') {
  //     pc2.close();
  //     setTimeout(function() {pc2 = null;}, 1000)
  // }
}

firebase.auth().onAuthStateChanged(function(user) {
  console.log('firebase state change: '/*, JSON.stringify(user)*/);
  if (user) {
    $("#login").hide();
    $("#landing").show();
    currentUser = user; // user object
    pathToUser = 'users/' + currentUser.uid;


    //Change this to: Check for a name in currentUserInfo, if none ask the use to make one, then set the status

    // Set user to "online" status
    firebase.database().ref(pathToUser).once('value', function (snapshot) {
      if (snapshot.val()) {
        currentUserInfo = snapshot.val();
        if (currentUserInfo.name == null) {
          var providerDisplayName = currentUser.providerData[String(0)].displayName;
          if (providerDisplayName) {
            update = {};
            update[pathToUser + "/name"] = providerDisplayName
            firebase.database().ref().update(update);
          } else {
            // ask the user to enter a name / update his profile
          }
        }
        console.log("Current user on load: ", currentUserInfo);
        // Set online status
        return firebase.database().ref(pathToOnline + "/" + currentUser.uid).set({
          status: 1,
          email: currentUserInfo.email,
        });

      }
    })
    .catch (function(error) {
      console.log("Error in getting user info " + error);
    });

    // Create listener for modifications of user info database node
    firebase.database().ref(pathToUser).on('value', function (snapshot) {
      if (snapshot.val()) {
        currentUserInfo = snapshot.val();
        console.log("Current user " + JSON.stringify(currentUserInfo));
      }
    });

    // Create listener for offers from someone else
    firebase.database().ref(pathToSignaling + "/" + currentUser.uid + "/offers").on('child_added', offerReceived);


    firebase.database().ref(pathToOnline).on('value', populateOnlineList);
    firebase.database().ref(pathToAllUsers).on('value', populatOfflineList);


    firebase.database().ref(ConvoConnections + "/" + currentUser.uid).on('child_added', generateConvoListener);
    firebase.database().ref(ConvoConnections + "/" + currentUser.uid).on('child_removed', updateConvoTabs);


    // Group Listeners
    firebase.database().ref(pathToUser + '/userGroups').on('value', displayMyGroups)
    //firebase.database().ref()


  } else {
    // User is logged out
    console.log("No one logged in")
    $("#landing").hide().find("*").off();
    $("#login").show('fast');
  }
}, function(error) {
  console.log(error);
});

/* ------------------ Singaling and Streaming Functions ------------------ */

// Global singaling variables
// stores the uid of Bob, the party receiving the offer. This global is ONLY used if you are Alice, the offerer
var receiverUid;
// WebRTC variables
var cfg = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]}
// var cfg = { iceServers: [
//             { urls: 'stun:stun.l.google.com:19302' },
//             { urls: 'stun:stun1.l.google.com:19302' },
//             { urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
//                 credential: 'webrtc',
//                 username: 'webrtc'
//             }
//           ]}

/* CALLER / SENDER / OFFERER */
var pc1 = null;
var dc1 = null;
var localTracks;
var localStream;
var negotiate = true;
//var myStatus = 1; // Available by default

// Since the same JS file contains code for both sides of the connection,
// activedc tracks which of the two possible datachannel variables we're using.
var activedc;

// Creates a local offer to be sent via firebase to the receiver. uid is the id of the receiver. Called when you click the nickname in the chatroom
function createLocalOffer (uid) {
  // If my online status is "unavailable", the abort

  // if (myStatus == 0) {
  //   bootbox.alert("You are currently on a call.");
  //   return false;
  // }

  receiverUid = uid;
  pc1 = new RTCPeerConnection(cfg);
  pc1.ontrack = handleOnaddstream;
  pc1.onsignalingstatechange = onsignalingstatechange;
  pc1.oniceconnectionstatechange = function (e) {
    console.log("Ice connection state change", e);
    if (pc1.iceConnectionState == 'disconnected') {
      hangUp();
    }

  };
  pc1.onconnectionstatechange = function (e) {
    console.info('connection state change:', e);
  };
  //pc1.onnegotiationneeded = onnegotiationneeded;

  pc1.onicecandidate = function (e) {
    console.log('ICE candidate (pc1)', e);
    if (!e.candidate) {
      console.log('returning cause not candidate',e);
      return;
    }
    // send ice candidate to answere
    console.log('The actual ice candidate is', e.candidate);
    setTimeout(function() {
      var iceRef = firebase.database().ref(pathToSignaling + '/' + receiverUid + '/ice-to-answerer').push();
      iceRef.set(JSON.stringify(e.candidate));
    },1000);
  };


  // pc1.createOffer()
  // .then(function (desc) {
  //    // Limit bandwidth
  //   desc.sdp = updateBandwidthRestriction(desc.sdp, 250);
  //   return pc1.setLocalDescription(desc);
  // }).then (function () {
  //   console.log('created local offer', pc1.localDescription);
  //   // add the new offer to firebase. By pushing it, we actually keep previous offers (avoid overwriting old offers, in case they are not yet processed by Bob)
  //   var offerRef = firebase.database().ref(pathToSignaling + '/' + receiverUid + '/offers').push();
  //   descString = JSON.stringify(pc1.localDescription);
  //   offerRef.set({localdescription: descString, offerer: currentUserInfo.nick, offererID: currentUser.uid});
  // })
  // .catch(function (error) {
  //   console.log('Error somewhere in chain: ' + error);
  // });

  // Create a listener for an answer from Bob
  firebase.database().ref(pathToSignaling + '/' + receiverUid + '/answers').on('child_added', answerListener);
  firebase.database().ref(pathToSignaling + '/' + receiverUid + '/ice-to-offerer').on('child_added', iceReceivedPc1);

  // set up data channel for chat and midi
  setupDC1();

  // Need to check if camera is allowed here
  // Get camera stream for offerer (local video)
  navigator.mediaDevices.getUserMedia({video: { width: {max: 320}, height: {max: 240} }, audio: true})
  .then(function (stream) {
    localTracks = stream.getTracks();
    localStream = stream;
    negotiate = true;
    var video = document.getElementById('localVideo');
    video.srcObject = stream;
    video.play();


    if (typeof pc1.addTrack !== 'undefined') {
      // Firefox already supports addTrack. Chrome not yet
      stream.getTracks().forEach(track => pc1.addTrack(track, stream));
      console.log("added stream to pc1:", stream);
    } else {
      // Adding the stream will trigger a negotiationneeded event
      pc1.addStream(stream);
      console.log("added stream to pc1:", stream);
    }

    pc1.createOffer().then(function (desc) {
      // Limit bandwidth
      desc.sdp = updateBandwidthRestriction(desc.sdp, 250);
      return pc1.setLocalDescription(desc);
    }).then (function () {
      console.log('created local offer', pc1.localDescription);
      // add the new offer to firebase. By pushing it, we actually keep previous offers (avoid overwriting old offers, in case they are not yet processed by Bob)
      var offerRef = firebase.database().ref(pathToSignaling + '/' + receiverUid + '/offers').push();
      descString = JSON.stringify(pc1.localDescription);
      offerRef.set({localdescription: descString, offerer: currentUserInfo.email, offererID: currentUser.uid});
    })
    .catch(function (error) {
      console.log('Error somewhere in chain: ' + error);
    });
  });
}

// Sets up a data stream to Bob
function setupDC1 () {
  try {
    dc1 = pc1.createDataChannel('test', {reliable: false});
    activedc = dc1;  // declared in another file
    console.log('Created datachannel (pc1)');
    dc1.onopen = function () {
      console.log('data channel connect');
    };
    dc1.onmessage = function (e) {
      //console.log('Got message (pc1)', e.data);
      // console.log(e);
      var data = JSON.parse(e.data);
      if (data.type === 'message') {
        writeToChatLog(data.message, 'remoteChatMessage');
        // Scroll chat text area to the bottom on new input.
        $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight);
      } else {
        midisystem.selectedMidiOutput.send([data.message[0], data.message[1], data.message[2]]);
      }
    };
  } catch (e) { console.warn('No data channel (pc1)', e); }
}

// Triggered when adding stream from Bob
function handleOnaddstream (e) {
  console.log('Got remote stream', e.streams);
  var remoteVideo = document.getElementById('remoteVideo');
  remoteVideo.srcObject = e.streams[0];
}

// Triggered when we receive an ice candidate from pc2 through Firebase
function iceReceivedPc1(snapshot) {
  console.log('Adding ICE from pc2',snapshot.val());
  var can = new RTCIceCandidate(JSON.parse(snapshot.val()));
  pc1.addIceCandidate(can)
  .catch(function(error) {console.log("error when adding ice pc1", error);});

}

// This is triggered when we add (or remove) a stream to pc1 and also when setting the data channel
function onnegotiationneeded (state) {
  if (negotiate) { // this semaphore is here to avoid sending an offer when hanging up
    console.info('Negotiation needed:', state);
    pc1.createOffer()
    .then(function (desc) {
      // Limit bandwidth
      desc.sdp = updateBandwidthRestriction(desc.sdp, 250);
      return pc1.setLocalDescription(desc);
    })
    .then (function () {
      // console.log('Now Dprecated!!!!');
      console.log('created local offer', pc1.localDescription);
      // add the new offer to firebase. By pushing it, we actually keep previous offers (avoid overwriting old offers, in case they are not yet processed by Bob)
      var offerRef = firebase.database().ref(pathToSignaling + '/' + receiverUid + '/offers').push();
      descString = JSON.stringify(pc1.localDescription);
      offerRef.set({localdescription: descString, offerer: currentUserInfo.nick, offererID: currentUser.uid});
    })
    .catch(function (error) {
      console.log('Error somewhere in chain: ' + error);
    });

  } else {
    console.log('skip negotiation because we are hanging up');
  }
}

// Gets triggered when Bob creates an answer. Triggered by firebase answer listener
function answerListener(snapshot) {
  console.log('prelim answer:', JSON.parse(snapshot.val()));
  if (snapshot.val()) {
    //add removal of dialog here
    sendingCallDialog.close();
    bootbox.hideAll();
    var answer = 8; /* JSON.parse(snapshot.val()); */
    var answerData = JSON.parse(snapshot.val());
    if (answer != -1) {
      console.log("sdp: ", answerData.sdp);
      var answerDesc = answerData;
      writeToChatLog('Received remote answer', 'systemChatMessage');

      // Limit bandwidth
      answerDesc.sdp = updateBandwidthRestriction(answerDesc.sdp, 250);

      pc1.setRemoteDescription(answerDesc)
      .then (function() {
        // Create a Firebase listener for ICE candidates sent by pc2
        firebase.database().ref(pathToSignaling + '/' + receiverUid + '/ice-to-offerer').on('child_added', iceReceivedPc1);
        console.log('Successfully added the remote description to pc1');
      })
      .catch (function(error) {console.log("Problem setting the remote description for PC1 " + error);});
    } else {
      // call rejected. This is not an option anymore. DELETE!
      firebase.database().ref(pathToSignaling+'/'+receiverUid+'/answer').off();
      var update = {};
      update.offer = null;
      firebase.database().ref(pathToSignaling + '/' + receiverUid).update(update);
      bootbox.alert("Call rejected");
    }
  }
}

/* CALLEE / RECIEVER / ANSWERER */
var pc2 = null;
var dc2 = null;
var offererId = null;

function offerReceived(snapshot) {
  if (snapshot.val()) {
    var snap = snapshot.val();
    receivedCallDialog.showModal();
    console.log("This path Exists!!!!! --> I have an Offer from someone");
    console.log("I have and offer from:", snap.offererID);
    offererId = snap.offererID;

    $("#accept-call-button").bind('click', function() {
      console.log("Now Accepting the Offer");
      answerTheOffer(snap.localdescription);
      receivedCallDialog.close();
    });
    $("#decline-call-button").bind('click', function() {
      console.log("Now Declining the Offer");
      purgeOffer();
      receivedCallDialog.close();
    });
  }
}

function answerTheOffer(offerString) {

  // Since this function is called twice (once when Alice creates a datachannel, and then when Alice adds a stream to her pc1),
  // we need to STOP the local camera stream if it already exists, since a new stream is created here for a second time.
  // Otherwise we end up with the 2 local streams for the local camera, which makes it impossible to "kill" when hanging up
  // Only ONE stream of the camera must exist


  // Stop ICE listeners in case they were added before (we don't want several listeners to the same thing)
  firebase.database().ref(pathToSignaling + '/' + currentUser.uid + '/ice-to-answerer').off('child_added');
  // Add listener for ICE candidates from pc1
  firebase.database().ref(pathToSignaling + '/' + currentUser.uid + '/ice-to-answerer').on('child_added', iceReceivedPc2);


  if (localTracks) {
    localTracks.forEach(function (track) {
      track.stop();
    });
  }

  if (!pc2) {
    pc2 = new RTCPeerConnection(cfg);
    pc2.ontrack = handleOnaddstream;
    pc2.onsignalingstatechange = onsignalingstatechange;
    pc2.oniceconnectionstatechange = function (e) {
      console.info('ice connection state change:', e);
      // I have to check if the following lines work at all
      if (pc2.iceConnectionState == 'disconnected') {
        hangUp();
      }
    };
    pc2.onconnectionstatechange = function (e) {
      console.info('connection state change:', e);
    };
    pc2.ondatachannel = handleOnDataChannel;
  }

  pc2.onicecandidate = function (e) {
    console.log('ICE candidate (pc2)', e);
    if (!e.candidate) {
      console.log('returning cause not candidate',e);
      return;
    }
    // send ice candidate to offerer through Firebase. TImeout seems to work well here to give time for initial connection to be established
    setTimeout(function() {
      var iceRef = firebase.database().ref(pathToSignaling + '/' + currentUser.uid + '/ice-to-offerer').push();
      iceRef.set(JSON.stringify(e.candidate));
    }, 1000);
  };

  var offerDesc = JSON.parse(offerString);
  // Limit bandwidth
  offerDesc.sdp = updateBandwidthRestriction(offerDesc.sdp, 250);

  pc2.setRemoteDescription(offerDesc)
  .then(function() {
    writeToChatLog('Received remote offer','systemChatMessage');
    return navigator.mediaDevices.getUserMedia({video: { width: {max: 320}, height: {max: 240} }, audio: true});
  })
  .then(function (stream) {
    // Set online status to unavailable
    // myStatus = 0;
    var update = {};
    update[pathToOnline + "/" + currentUser.uid + "/status"] = 0;
    firebase.database().ref().update(update);

    // Store tracks and stream in globals to kill them when hanging up
    localTracks = stream.getTracks();
    localStream = stream;

    // Attach stream to video element
    var video = document.getElementById('localVideo');
    video.srcObject = stream;

    // Add (local) stream to peer connection
    pc2.addStream(stream);

    // Create answer
    return pc2.createAnswer();
  })
  .then (function(answerDesc) {
    writeToChatLog('Created local answer', 'systemChatMessage');
    console.log('Created local answer: ', answerDesc);
    // Limit bandwidth
    answerDesc.sdp = updateBandwidthRestriction(answerDesc.sdp, 250);
    return pc2.setLocalDescription(answerDesc);
  })
  .then (function() {
    // Add an answer to firebase
    var answerRef = firebase.database().ref(pathToSignaling + '/' + currentUser.uid + '/answers').push();
    answerRef.set(JSON.stringify(pc2.localDescription));

    // Add listener for ICE candidates from pc1
    //firebase.database().ref(pathToSignaling + '/' + currentUser.uid + '/ice-to-answerer').on('child_added', iceReceivedPc2);

  })
  .catch (function (error) {
    console.log("Error in the answer-the-offer chain", error);
  });
}

function iceReceivedPc2(snapshot) {
  console.log('Received ICe from PC1', snapshot.val());
  var can = new RTCIceCandidate(JSON.parse(snapshot.val()));
  pc2.addIceCandidate(can)
  .catch(function(error) {console.log("error when adding ice pc2", error);});
}

function handleOnDataChannel (e) {
  var datachannel = e.channel || e; // Chrome sends event, FF sends raw channel
  console.log('Received datachannel (pc2)', arguments);
  dc2 = datachannel;
  activedc = dc2;
  dc2.onopen = function () {
    console.log('data channel connect');
  };
  dc2.onmessage = function (e) {
    var data = JSON.parse(e.data);
    if (data.type === 'message') {
      writeToChatLog(data.message, 'remoteChatMessage');
      // Scroll chat text area to the bottom on new input.
      $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight);
    } else { // we got a midi message!
      midisystem.selectedMidiOutput.send([data.message[0], data.message[1], data.message[2]]);
    }
  };
}

function purgeOffer() {
  console.log("receiverUid: ", receiverUid);
  console.log("offererId: ", offererId);
  if (!receiverUid) {
    console.log("CALEE -> purgeing now")
    firebase.database().ref(pathToSignaling + '/' + currentUser.uid).off();

    var updates = {};
    updates[pathToSignaling + "/" + currentUser.uid]  = null;
    updates[pathToOnline + "/" + currentUser.uid + "/status"] = 1;
    updates[pathToOnline + "/" + offererId + "/status"] = 1;
    firebase.database().ref().update(updates);

    // I am the caller / offerer
  } else {
    console.log("CALLER -> purgeing now")
    // Delete all firebase listeners
    firebase.database().ref(pathToSignaling+ '/' + receiverUid).off();
    firebase.database().ref(pathToSignaling+ '/' + receiverUid+'/ice-to-offerer').off();
    firebase.database().ref(pathToSignaling+ '/' + currentUser.uid + '/ice-to-answerer').off();

    var updates = {};
    updates[pathToSignaling + "/" + receiverUid]  = null;
    updates[pathToOnline + "/" + currentUser.uid + "/status"] = 1;
    updates[pathToOnline + "/" + receiverUid + "/status"] = 1;
    firebase.database().ref().update(updates);
  }

  receiverUid = '';
  offererId = '';

  if (localTracks) {
    localTracks.forEach(function (track) {
      track.stop();
    });
  }
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

  // iAmThe = null;
  // var update = {};
  // //update[pathToSignaling + "/" + receiverUid]  = null;
  // update[pathToSignaling + "/" + currentUser.uid]  = null;
  // firebase.database().ref().update(update)
  // .then(function() {
  //   // set my status to online
  //   // myStatus = 1;
  //   var updates = {};
  //   updates[pathToOnline + "/" + currentUser.uid + "/status"] = 1;
  //   updates[pathToOnline + "/" + offererId + "/status"] = 1;
  //   firebase.database().ref().update(update);
  //
  // });
}

/* Shared functions between the ANSWERER and the OFFERER */
function hangUp() {
  console.log("receiverUid: ", receiverUid);
  console.log("offererId: ", offererId);
  // First take care of offer and online status
  if (currentUser) {

    // I am the reciever / callee
    if (!receiverUid) {
      console.log("CALEE -> hanging up now")
      firebase.database().ref(pathToSignaling + '/' + currentUser.uid).off();

      // var update = {};
      // update[pathToSignaling + "/" + currentUser.uid]  = null;
      // // Delete any offer left over
      // firebase.database().ref().update(update);
      //
      // firebase.database().ref(pathToOnline + "/" + currentUser.uid).set({
      //   status: 1
      // });
      //
      // firebase.database().ref(pathToOnline + "/" + offererId).set({
      //   status: 1
      // });

      var updates = {};
      updates[pathToSignaling + "/" + currentUser.uid]  = null;
      updates[pathToOnline + "/" + currentUser.uid + "/status"] = 1;
      updates[pathToOnline + "/" + offererId + "/status"] = 1;
      firebase.database().ref().update(updates);

      // I am the caller / offerer
    } else {
      console.log("CALLER -> hanging up now")

      // firebase.database().ref(pathToSignaling+'/'+receiverUid + '/answer').off();

      // Delete all firebase listeners
      firebase.database().ref(pathToSignaling+ '/' + receiverUid + '/answer').off();
      firebase.database().ref(pathToSignaling+ '/' + receiverUid+'/ice-to-offerer').off();
      firebase.database().ref(pathToSignaling+ '/' + currentUser.uid + '/ice-to-answerer').off();

      var updates = {};
      updates[pathToSignaling + "/" + receiverUid]  = null;
      updates[pathToOnline + "/" + currentUser.uid +"/status"] = 1;
      updates[pathToOnline + "/" + receiverUid +"/status"] = 1;
      firebase.database().ref().update(updates);

      // var update = {};
      // update[pathToSignaling + "/" + receiverUid]  = null;
      // // Delete any offer left over
      // firebase.database().ref().update(update)
      // .then(function() {
      //   // set my status to online
      //   myStatus = 1;
      //   var update = {};
      //   update[pathToOnline + "/" + currentUser.uid + "/status"] = 1;
      //   firebase.database().ref().update(update);
      //
      //   //set the receiver's staus to available
      //   update = {};
      //   update[pathToOnline + "/" + receiverUid + "/status"] = 1;
      //   firebase.database().ref().update(update);
      // });
    }
  }

  receiverUid = '';
  offererId = '';

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
  if (pc1 && pc1.getLocalStreams()) {
    pc1.getLocalStreams().forEach(function(stream){
      pc1.removeStream(stream);
    });
  }

  if (pc2 && pc2.getLocalStreams()) {
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

function sendMessage () {
  if ($('#messageTextBox').val()) {
    writeToChatLog($('#messageTextBox').val(), 'localChatMessage');
    activedc.send(JSON.stringify({message: $('#messageTextBox').val(), type: 'message'}));
    $('#messageTextBox').val('');

    // Scroll chat text area to the bottom on new input.
    $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight);
  }
  return false;
}

function writeToChatLog (message, message_type) {
  document.getElementById('chatlog').innerHTML += '<p class="' + message_type + '">' + '[' + getHoursMinutes() + '] ' + message + '</p></br>';
}

// Borrowed from https://github.com/webrtc/samples/tree/gh-pages/src/content/peerconnection/bandwidth
function updateBandwidthRestriction(sdp, bandwidth) {
  if (sdp.indexOf('b=AS:') === -1) {
    // insert b=AS after c= line.
    sdp = sdp.replace(/c=IN IP4 (.*)\r\n/,
    'c=IN IP4 $1\r\nb=AS:' + bandwidth + '\r\n');
  } else {
    sdp = sdp.replace(/b=AS:(.*)\r\n/, 'b=AS:' + bandwidth + '\r\n');
  }
  return sdp;
}

function onsignalingstatechange (state) {
  console.info('signaling state change:', state);
}

function SpEvent(sender) {
  this._sender = sender;
  this._listeners = [];
}

SpEvent.prototype = {
  attach : function (listener) {
    this._listeners.push(listener);
  },
  notify : function (args) {
    var index;
    for (index = 0; index < this._listeners.length; index += 1) {
      this._listeners[index](this._sender, args);
    }
  }
}

/* ------------------ MIDI Functions ------------------ */

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

function MidiSystem(midiAccess) {

  this.midiAccess = midiAccess;
  this.selectedMidiInput = {};
  this.selectedMidiOutput = {};
  // Events fired by this object
  this.stateChange = new SpEvent(this);
  var _this = this;


  this.getInputs = function() {
    var midiInputIDs = [];
    this.midiAccess.inputs.forEach(function(port){
      midiInputIDs.push(port.id);
    });
    if (midiInputIDs[0]) {
      this.selectedMidiInput = this.midiAccess.inputs.get(midiInputIDs[0]);
      // $("#midiin").html(_this.selectedMidiInput.name);
      // document.querySelector("#midi-menu").style ="";
    } else {
      this.selectedMidiInput = {};
      // $("#midiin").html("Disconnected");
      // document.querySelector("#midi-menu").style.color = "red";
    }
  };

  this.getOutputs= function() {
    var midiOutputsIDs = [];
    this.midiAccess.outputs.forEach(function(port){
      midiOutputsIDs.push(port.id);
    });
    if (midiOutputsIDs[0]) {
      this.selectedMidiOutput = this.midiAccess.outputs.get(midiOutputsIDs[0]);
      // $("#midiout").html(_this.selectedMidiOutput.name);
      // document.querySelector("#midi-menu").style ="";
    } else {
      this.selectedMidiOutput = {};
      // $("#midiout").html("Disconnected");
      // document.querySelector("#midi-menu").style.color ="red";
    }
  };


  this.MIDIStateChange= function(event) {
    _this.getInputs();
    _this.getOutputs();
    console.log("MIDI State Change on port: "+event.port);
    console.log("MIDI State Change state: "+event.port.state);
    _this.stateChange.notify(event); // receivers need to check event.port.type (input, output)
    //and event.port.state (when state changes, something got disconnected
  };

  this.init= function() {
    this.getInputs();
    this.getOutputs();
    this.midiAccess.onstatechange = _this.MIDIStateChange;
    this.stateChange.notify();
  }
}

/* ------------------ Online Users Menu Functions ------------------ */

function hideContactButtons(itemID1, itemID2, itemID3) {
  console.log("itemID1, itemID2, itemID3: ", itemID1, itemID2, itemID3)
  $('#' + itemID1).toggle('show');
  $('#' + itemID2).toggle('show');
  $('#' + itemID3).toggle('show');
}

// staus == 1 --> available
function callThisUser(userID, userStatus) {
  console.log("calling userID: ", userID);
  if (userStatus) {

    sendingCallDialog.showModal();

    $("#sendingCallHangUp").bind('click', function() {
      console.log("aborting my call!!");
      purgeOffer();
      sendingCallDialog.close();
    });

    var updates = {};
    updates[pathToOnline + "/" + currentUser.uid + "/status"] = 0;
    updates[pathToOnline + "/" + userID + "/status"] = 0;
    firebase.database().ref().update(updates);

    createLocalOffer(userID);

  } else {
    bootbox.alert("User not available");
  }
}

function populatOfflineList(snapshot) {
  if (snapshot.val()) {
    var offlineUsers = {users: snapshot.val() };

    for (var key in offlineUsers.users) {
      if (onlineUsers.users.hasOwnProperty(key)) {
        delete offlineUsers.users[String(key)];
      }
    }

    delete offlineUsers.users[String(currentUser.uid)];

    console.log("Offline Users: ", offlineUsers)
    var offlineUsersHTML = offlineUsersHTMLGen(offlineUsers);
    document.getElementById('offlineUserListTarget').innerHTML = offlineUsersHTML
  }
}

function populateOnlineList(snapshot) {
  if (snapshot.val()) {
    onlineUsers = { users: snapshot.val() };
    myStatus = onlineUsers.users[String(currentUser.uid)].status;
    delete onlineUsers.users[String(currentUser.uid)];
    console.log("onlineUsers: ", onlineUsers)

    var onlineUsersHTML = onlineUsersHTMLGen(onlineUsers);
    $('#onlineUserListTarget').html(onlineUsersHTML);

    firebase.database().ref(pathToAllUsers).once('value', populatOfflineList);
  }
}

/*-----General Chat Functions------*/

function generateConvoListener(snapshot) {
  var otherMessanger = snapshot.val().receiver;
  var otherEmail;

  firebase.database().ref("/users/" + otherMessanger + "/email").once('value', function(snapshot) {
    otherEmail = snapshot.val()
    console.log("otherEmail: ", otherEmail);
  });

  console.log("generating convo listener for: ", otherMessanger);

  var tabGenInput = {user: {
    onlyOneUser: {
      receiverName: otherEmail,
      tabID: otherMessanger,
  }}};

  console.log("currentTab: ", currentTab);

  var convoTabHTML = convoSingleTabGen(tabGenInput);
  document.getElementById('conversationsArrayTarget').innerHTML += convoTabHTML;

  firebase.database().ref(ConvoMessages + "/" +  currentUser.uid + "/" + otherMessanger + "/" + messages).on('child_added', function(snapshot) {
    // check for termination here, if true delete tab and return
    // gice the user a message in the chat log saying:
    // mr. blank has ended the conversation, feel free to message him anytime from the user list

    console.log("message found: ", snapshot.val());
    console.log("message type: ", snapshot.val().format);
    console.log("currentTab: ", currentTab)
    console.log("otherMessanger", otherMessanger)

    if (currentTab == null) {
      console.log("site onload");
      if (snapshot.val() === "true") {
        $('#' + otherMessanger + '-tab-ID').attr('data-badge', '!');
      }
      // try to check if you recieved messages while offline here???
      //$('#' + otherMessanger + '-tab-ID').attr('data-badge', '!');
    }
    if (currentTab == otherMessanger) {
      //$('#otherMessanger-tab-ID').removeAttr('data-badge')
      document.getElementById('currentConvoTarget').innerHTML += '<p class="' + snapshot.val().format + '">' + snapshot.val().text + '</p>';
    } else {
      if (currentTab != null) {
        $('#' + otherMessanger + '-tab-ID').attr('data-badge', '!');
      }
    }
  });
}

function createConversation(userID) {
  var receiverID;
  firebase.database().ref(ConvoConnections + "/" + currentUser.uid + "/" + userID).once('value', function(snapshot) {
    console.log("already exists???: ", snapshot.val());
    receiverID = snapshot.val().receiver;
  });

  if (receiverID) {
    console.log("convo already exists!: ", receiverID);
    return;

  } else {

    console.log("created conversation with: ", userID);
    // Add your ID to target user's chat path
    currentTab = userID;
    firebase.database().ref(ConvoConnections + "/" + userID + "/" + currentUser.uid).set({
      receiver: currentUser.uid
    });
    firebase.database().ref(ConvoConnections + "/" + currentUser.uid + "/" + userID).set({
      receiver: userID
    });
    firebase.database().ref(ConvoMessages + "/" + userID + "/" + currentUser.uid + "/" + messages).set({
      new: 'true'
    });
    firebase.database().ref(ConvoMessages + "/" + currentUser.uid + "/" + userID + "/" + messages).set({
      new: 'false'
    });
    document.getElementById('currentConvoTarget').innerHTML = '';
    // changes tab style here

  }
}

function sendGeneralMessage() {

  // if they are offline - set new to true

  if (currentTab == null) {
    //tell user to either select a conversation or start a new one
  } else {

    var receiverID = currentTab;
    var update = {};
    update[ConvoMessages + "/" + receiverID + "/" + currentUser.uid + "/" + messages + "/new"] = 'true';
    firebase.database().ref().update(update);
    var messageText = $('#convoTextForm').val();
    if (messageText) {
      var messageSendTime = getTimestamp();
      console.log("messageSendTime: ", messageSendTime);
      var theirConvoPath = firebase.database().ref(ConvoMessages + "/" + receiverID + "/" + currentUser.uid + "/messages" + "/" + messageSendTime).set({
        text: '[' + getHoursMinutes() + '] ' + messageText,
        format: 'remoteChatMessage'
      });
      var myConvoPath = firebase.database().ref(ConvoMessages + "/" + currentUser.uid + "/" + receiverID + "/messages" + "/" + messageSendTime).set({
        text: '[' + getHoursMinutes() + '] ' + messageText,
        format: 'localChatMessage'
      });
    }
    $('#convoTextForm').val('');
  }
}

function changeConversationTab(convoID) {
  // set new to false for your path only!!

  var update = {};
  update[ConvoMessages + "/" + currentUser.uid + "/" + convoID + "/" + messages + "/new"] = 'false';
  firebase.database().ref().update(update);

  // change tab style here

  $('#' + convoID + '-tab-ID').removeAttr('data-badge')
  console.log("changing to tab -> ", convoID);
  currentTab = convoID;
  firebase.database().ref(ConvoMessages + "/" + currentUser.uid + "/" + convoID + "/messages").once('value', function(snapshot) {
    var messageTree = { messages: snapshot.val() }
    delete messageTree.messages['init'];
    console.log("all messages for this tab: ", messageTree);
    var wholeConvoHTML = wholeConversationGen(messageTree);
    document.getElementById('currentConvoTarget').innerHTML = wholeConvoHTML;
  });
}

function deleteConversation() {
  if (currentTab == null) {
    console.log("either select A conversation or make one")
    // either sleect A conversation or make one
  } else {
    firebase.database().ref(ConvoMessages + '/' + currentTab + '/' + currentUser.uid + "/" + messages).off();
    firebase.database().ref(ConvoMessages + '/' + currentUser.uid + '/' + currentTab + "/" + messages).off();
    firebase.database().ref(ConvoConnections + '/' + currentTab + '/' + currentUser.uid).off();
    firebase.database().ref(ConvoConnections + '/' + currentUser.uid + '/' + currentTab).off();
    firebase.database().ref(ConvoMessages + '/' + currentTab).child(currentUser.uid).remove();
    firebase.database().ref(ConvoMessages + '/' + currentUser.uid).child(currentTab).remove();
    firebase.database().ref(ConvoConnections + '/' + currentTab).child(currentUser.uid).remove();
    firebase.database().ref(ConvoConnections + '/' + currentUser.uid).child(currentTab).remove();

    document.getElementById('currentConvoTarget').innerHTML = '<p>Select one of your conversation or create a new conversation from the User List</p>';
    currentTab = null;
  }
}

function updateConvoTabs(snapshot) {
  //Conversation Was Ended
  if (currentTab == snapshot.val().receiver) {
    currentTab = null;
  }
  console.log("removing this tab: ", snapshot.val())
  $('#' + snapshot.val().receiver + '-tab-ID').remove();
}

/* -------   Group Functions  ---------*/
function creatGroup(currentUserID) {
  var uuid = generateUUID()
  var groupNameForm = $('#creatGroupName').val();
  var groupDescriptionForm = $('#creatGroupDescription').val();
  var groupImageForm = $('#createGroupImage').val();

  if(!groupNameForm || !groupDescriptionForm) {
    bootbox.alert("A name and description are required!");
    return;
  }

  firebase.database().ref(pathToGroups + '/' + uuid).set({
    groupName: groupNameForm,
    groupDescription: groupDescriptionForm,
    groupOwner: currentUserInfo.name,
    groupImage: groupImageForm
  });
  firebase.database().ref(pathToGroups + '/' + uuid + '/' + 'groupMembers' + '/' + currentUser.uid).set({
    authority: 2,
    name: currentUserInfo.name
  })
  firebase.database().ref(pathToUser + '/' + '/userGroups/' + uuid).set({
    lastPost: 'temp'
  })

  $('#creatGroupName').val('');
  $('#creatGroupDescription').val('');

  goToGroup(uuid);
}

function createPost(groupID) {

  var uuid = generateUUID();
  var postTitleForm = $('#createPostTitle').val();
  var postTextForm = $('#createPostText').val();

  if (!postTitleForm || !postTextForm) {
    bootbox.alert("A name and description are required!");
    console.log("Incomplete Form!")
    return;
  }

  firebase.database().ref(pathToGroups + '/' + groupID + '/groupPosts/' + uuid).set({
    postTitle: postTitleForm,
    postText: postTextForm,
    postTime: 'temp',
    postOwner: {
      ownerID: currentUser.uid,
      ownerName: currentUserInfo.name
    },
    postContent: 'temp',
    postID: uuid
  });

  $('#createPostTitle').val('');
  $('#createPostText').val('');
  //$('#creatGroupForm').hide();
  //$('#creatGroupImage')
}

function createComment(postID) {
  console.log("called create comment function");
  console.log("postID: ", postID);
  console.log("event: ", event);
  if (event.keyCode == 13) {
    var uuid = generateUUID();
    var commentTextForm = $('#comment-form-' + postID).val();
    if (!commentTextForm) {
      bootbox.alert("You didn't type anything!");
      return;
    }

    firebase.database().ref(pathToGroups + '/' + currentGroup + '/groupPosts/' + postID + '/comments/' + uuid).set({
      commentText: commentTextForm,
      commentTime: 'temp',
      commentName: currentUserInfo.name
    });

    $('#comment-form-' + postID).val('');
  }
}

function displayMyGroups(snapshot) {
  // this is looking at all YOUR groups
  // add: image, name, descrition, time
  var userGroupsList = { userGroups: snapshot.val() };
  firebase.database().ref(pathToGroups).once('value', function(snapshot) {
    var userRequestedGroupsList = { requestedGroups: snapshot.val() };
    console.log("All the Groups!!", userRequestedGroupsList);
    if(userRequestedGroupsList) {
      for (var key in userRequestedGroupsList.requestedGroups) {
        if(userGroupsList.userGroups) {
          if (userGroupsList.userGroups.hasOwnProperty(key)) {
            //delete userRequestedGroupsList.requestedGroups[String(key)];
            userGroupsList.userGroups[String(key)] = {
              owner: userRequestedGroupsList.requestedGroups[String(key)].groupOwner,
              name: userRequestedGroupsList.requestedGroups[String(key)].groupName,
              image: userRequestedGroupsList.requestedGroups[String(key)].groupImage,
              desc: userRequestedGroupsList.requestedGroups[String(key)].groupDescription
              //date: userRequestedGroupsList.requestedGroups.key.groupTimestamp
            }
            delete userRequestedGroupsList.requestedGroups[String(key)];
          }
        }
      }
    }
    userGroupListHTML = userGroupListHTMLGen(userGroupsList);
    // add buttons in the headers of each fo these to go back and forth
    document.getElementById('myGroups').innerHTML = userGroupListHTML;
    userGroupRequestListHTML = userGroupRequestListHTMLGen(userRequestedGroupsList);
    document.getElementById('joinGroups').innerHTML = userGroupRequestListHTML;
  });
}

function togglePostForm() {
  $('#createPostForm').toggle('show');
}

function toggleGroupForm() {
  $('#createGroupForm').toggle('show')
}

function goToGroup(groupID) {
  $('#myGroups').hide();
  $('#joinGroups').hide();
  currentGroup = groupID

  // create header
  firebase.database().ref(pathToGroups + '/' + groupID).once('value', function(snapshot) {
    var headerHTML;
    var groupObject = snapshot.val();
    groupObject['groupID'] = groupID;
    groupObject['myID'] = currentUser.uid;
    console.log("groupObject: ", groupObject)
    var userPrivaleges = groupObject.groupMembers[String(currentUser.uid)].authority;
    //var userRequestList = groupObject.joinRequests;
    //var userList = groupObject.groupMembers;
    //var headerDict = {userRequestListGen: {userRequestList}, userListGen: {userList}};
    if (userPrivaleges == 0) {
      headerHTML = headerHTMLGen0(groupObject);
      document.getElementById('currentGroupHeader').innerHTML = headerHTML;
    }
    if (userPrivaleges == 1) {
      headerHTML = headerHTMLGen1(groupObject);
      document.getElementById('currentGroupHeader').innerHTML = headerHTML;
    }
    if (userPrivaleges == 2) {
      headerHTML = headerHTMLGen2(groupObject);
      document.getElementById('currentGroupHeader').innerHTML = headerHTML;
    }
  });

  // update feed
  firebase.database().ref(pathToGroups + '/' + groupID + '/groupPosts/').on('child_added', function(snapshot) {
    singlePost = snapshot.val()
    console.log("singlePost: ", singlePost)
    singlePostHTML = singlePostHTMLGen(singlePost);
    document.getElementById('currentGroupPostFeed').innerHTML += singlePostHTML;
    $('#comment-form-' + singlePost.postID).bind('keydown', function (e) {
      if (e.keyCode == 13) {
        console.log("function finally called");
        createComment(singlePost.postID);
      }
    });
    // this will also generate all comment html

  })
}

function redirectToMyGroups(groupID) {
  if (groupID == null) {
    $('#myGroups').show();
    $('#joinGroups').hide();
  } else {
    firebase.database().ref(pathToGroups + '/' + groupID).off();
    firebase.database().ref(pathToGroups + '/' + groupID + '/groupPosts/').off();
    document.getElementById('currentGroupHeader').innerHTML = '';
    document.getElementById('currentGroupPostFeed').innerHTML = '';
    // everything here should already be generated -> but we coud change this to generate automatically
    $('#myGroups').show();
    $('#joinGroups').hide();
  }
}

function showJoinGroups() {
  $('#joinGroups').show();
  $('#myGroups').hide();
}

function requestToJoinGroup(groupID) {
  firebase.database().ref(pathToGroups + '/' + groupID + '/groupMembers').once('value', function(snapshot) {
    if (snapshot.val().hasOwnProperty[String(currentUser.uid)]) {
      console.log("already in the group")
    } else {
      firebase.database().ref(pathToGroups + '/' + groupID + '/groupRequests/' + currentUser.uid).set({
        name: currentUserInfo.name
      });
    }
  });
}

function deleteGroup(groupID) {
  firebase.database().ref(pathToGroups + '/' + groupID + '/groupMembers').once('value', function(snapshot) {
    console.log("deleting group: ", snapshot.val());
    var groupMembers = snapshot.val()
    for (key in groupMembers) {
      firebase.database().ref('users' + '/' + key + '/userGroups/' + groupID).remove();
    }
    firebase.database().ref(pathToGroups + '/' + groupID).remove();
    redirectToMyGroups(groupID);
  });
}

function removeMember(userID, groupID) {
  MemberListModal.close();
  //PendingListModal.close();
  if (currentUser.uid == userID) {
    console.log("can't remove yourself from your own group")
  } else {
    firebase.database().ref('users' + '/' + userID + '/userGroups/' + groupID).remove();
    firebase.database().ref(pathToGroups + '/' + groupID + '/' + '/groupMembers/' + userID).remove();
  }
}

function acceptPendingMember(userID, groupID, userName) {
  //MemberListModal.close();
  PendingListModal.close();
  if (currentUser.uid == userID) {
    console.log("You are already in the group")
  } else {
    firebase.database().ref('users' + '/' + userID + '/userGroups/' + groupID).set({
      lastPost: 'temp'
    });
    firebase.database().ref(pathToGroups + '/' + groupID + '/' + '/groupMembers/' + userID).set({
      authority: 0,
      name: userName
    });
    firebase.database().ref(pathToGroups + '/' + groupID + '/' + '/groupRequests/' + userID).remove();
  }
}

// To do
function viewProfile(userID) {
  console.log("viewProfile: ", viewProfile);
  MemberListModal.close();
  PendingListModal.close();
  if (userID == currentUser.uid) {
    // show my profile with option to edit
  } else {
    // show dialog with generated info
  }
}


// To do
function showPostComments(postID) {

}

// To do
function deletePost(postID) {

}

// To do
function grantAdminPermissions() {

}

function showMemberListModal(userID, groupID) {
  MemberListModal.showModal();
  $('#memberDialogRemoveButton').bind('click', function() {
    removeMember(userID, groupID);
  });
  $('#memberDialogProfileButton').bind('click', function() {
    viewProfile(userID);
  });
}

function showPendingListModal(userID, groupID, userName) {
  PendingListModal.showModal();
  $('#pendingDialogAcceptButton').bind('click', function() {
    acceptPendingMember(userID, groupID, userName);
  });
}

function closeGroupMembersDialog() {
  MemberListModal.close();
}

function closPendingMemberDialog() {
  PendingListModal.close();
}

/* -------   TEMPLATES  ---------*/
// Helper to select the correct status option in Select element
window.Handlebars.registerHelper('select', function( value, options ){
  var $el = $('<select />').html( options.fn(this) );
  $el.find('[value="' + value + '"]').attr({'selected':'selected'});
  return $el.html();
});

// Helper to produce the correct status text
window.Handlebars.registerHelper('statusText', function( value, options ){
  var statusText;
  switch (value) {
    case 0:
    //statusText = 'Unavailable';
    statusText = 'yellow';
    break;
    case 1:
    //statusText = 'Available';
    statusText = 'green';
    break;
    case 2:
    statusText = 'Invisible';
    break;
  }
  return new Handlebars.SafeString(statusText);
});

var selfUserUI = Handlebars.compile(`
      <div class="selfUser"><span class="nick">{{nick}} - ME </span>
      <span class="status"> ({{#statusText status}}{{/statusText}})</span>
      </div>
`);

/* --------- User List Handlebars --------- */
var userListUI = Handlebars.compile(`
        {{#each users}}
        <div class="onlineUser">
        <a href="#" id={{@key}} class="userNick">{{this.nick}}</a>
        <span class="status"> ({{#statusText this.status}}{{/statusText}})</span>
        </div>
        {{/each}}
`);

var onlineUsersHTMLGen = Handlebars.compile(`
      {{#each users}}
      <button type="button" class="mdl-chip mdl-chip--contact mdl-chip-parent" onclick="hideContactButtons('{{@key}}button11', '{{@key}}-text-chat', '{{@key}}button33')">
      <span class="mdl-chip__contact mdl-color--{{#statusText this.status}}{{/statusText}} mdl-color-text--white">-</span>
      <span class="mdl-chip__text">{{this.email}}</span>
      </button>

      <button id="{{@key}}button11" type="button" class="mdl-chip mdl-chip-mini-online" onclick="callThisUser('{{@key}}', '{{this.status}}')">
      <span class="mdl-chip__text">Call</span>
      </button>

      <button id="{{@key}}-text-chat" type="button" class="mdl-chip mdl-chip-mini-online" onclick="createConversation('{{@key}}')">
      <span class="mdl-chip__text">Text Chat</span>
      </button>

      <button id="{{@key}}button33" type="button" class="mdl-chip mdl-chip-mini-online">
      <span class="mdl-chip__text">View Profile</span>
      </button>

      <hr>
      {{/each}}
`);

var offlineUsersHTMLGen = Handlebars.compile(`
        {{#each users}}
        <button type="button" class="mdl-chip mdl-chip--contact" onclick="hideContactButtons('{{@key}}button1', '{{@key}}-text-chat', '{{@key}}button3')">
        <span class="mdl-chip__contact mdl-color--red mdl-color-text--white">-</span>
        <span class="mdl-chip__text">{{this.email}}</span>
        </button>
        <button id="{{@key}}-text-chat" type="button" class="mdl-chip mdl-chip-mini-offline" onclick="createConversation('{{@key}}')">
        <span class="mdl-chip__text">Text Chat</span>
        </button>
        <button id="{{@key}}button3" type="button" class="mdl-chip mdl-chip-mini-offline">
        <span class="mdl-chip__text">View Profile</span>
        </button>

        <hr>
        {{/each}}
`);

/* --------- Conversation Handlebars --------- */
//var convoSingleTabGen = Handlebars.compile(`{{#each user}}<button id="{{this.tabID}}-tab-ID" type="button" class="badge1" onclick="changeConversationTab('{{this.tabID}}')"><span class="mdl-chip__text">{{this.receiverName}}</span></button>{{/each}}`);
var convoSingleTabGen = Handlebars.compile(`
  {{#each user}}
  <li id="{{this.tabID}}-tab-ID" class="badge1" onmousedown="changeConversationTab('{{this.tabID}}')">{{this.receiverName}}</li>
  {{/each}}
`);

var wholeConversationGen = Handlebars.compile(`
  {{#each messages}}
  <p class="{{this.format}}">{{this.text}}</p>
  {{/each}}
`);

/* --------- Group Handlebars --------- */
var userGroupListHTMLGen = Handlebars.compile(`

  <div class="myGroupsNav">
    <button class="createGroupButton mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="createGroupFormSubmit" onclick="toggleGroupForm()">
      Create A Group
    </button>
    <button class="joinGroupButton mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="createGroupFormSubmit" onclick="showJoinGroups()">
      Join a Group
    </button>
  </div>

  <div id="createGroupForm" class="createPostForm mdl-shadow--2dp">
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <input class="mdl-textfield__input" id="creatGroupName" type="text" placeholder="Name your Group">
    </div>
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <input class="mdl-textfield__input" id="creatGroupDescription" type="text" placeholder="What is your group about?">
    </div>
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <input class="mdl-textfield__input" id="createGroupImage" type="text" placeholder="Image URL (optional)">
    </div>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatGroupFormSubmit" onclick="creatGroup()">
      Submit
    </button>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="toggleGroupForm()">
      Cancel
    </button>
  </div>

  {{#each userGroups}}

  <div class="myGroupsList row mdl-shadow--2dp">
    <div class="col-4">
      <img class="groupImage" src="{{this.image}}" alt="Mountain View" onerror="this.src='http://sfems.org/wp-content/uploads/2015/01/Bach-square.jpg';">
    </div>

    <div class="col-8">
      <h3 class="groupHeader">{{this.name}}</h3>
      <p>Created by: ({{this.owner}}) on ({{this.date}})</p>
      <hr>
      <p class="groupDescription">{{this.desc}}</p>
      <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="goToGroup('{{@key}}')">
        Enter Group
      </button>
    </div>
  </div>

  {{/each}}
`)

var userGroupRequestListHTMLGen = Handlebars.compile(`
  <div class="groupBackButtonContainer">
    <button class="groupBackButton mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatGroupFormSubmit" onclick="redirectToMyGroups('{{this.groupID}}')">
      back to My Groups
    </button>
  </div>

  {{#each requestedGroups}}
  <div class="myGroupsList row mdl-shadow--2dp">
    <div class="col-4">
      <img class="groupImage" src="{{this.groupImage}}" alt="Mountain View" onerror="this.src='http://sfems.org/wp-content/uploads/2015/01/Bach-square.jpg';">
    </div>

    <div class="col-8">
      <h3 class="groupHeader">{{this.groupName}}</h3>
      <p>Created by: ({{this.groupOwner}}) on ({{this.date}})</p>
      <hr>
      <p class="groupDescription">{{this.groupDescription}}</p>
      <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="requestToJoinGroup('{{@key}}')">
        Join?
      </button>
    </div>
  </div>
  {{/each}}


`)

var singlePostHTMLGen = Handlebars.compile(`
  <div class="singlePost mdl-shadow--2dp">
    <div class="row">
      <div class="col-5">
      <h4 class="groupHeader">{{this.postTitle}}</h4>
      <p>Created by: ({{this.postOwner.ownerName}}) on ({{this.postDate}})</p>
      <hr>
      </div>
      <div class="col-7">
      <p class="groupDescription">{{this.postText}}</p>
      <hr>
      </div>
    </div>

    <div class="row">
      <div class="col-12">
      <h1>Content</h1>
      </div>
    </div>

    <div class="row">
      <div class="col-12 commentContainer">
      <input class="commentInput mdl-textfield__input" id="comment-form-{{this.postID}}" type="text" placeholder="Write a comment"/>

        <div class="commentFeed">
        {{#each comments}}
        <p class="commentStyle">{{this.commentName}}:  {{this.commentText}}</p>
        {{/each}}
        </div>

      </div>
    </div>
  </div>


`);

// No Permissions
var headerHTMLGen0 = Handlebars.compile(`
  <div class="groupBackButtonContainer">
    <button class="groupBackButton mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatGroupFormSubmit" onclick="redirectToMyGroups('{{this.groupID}}')">
      back to My Groups
    </button>
  </div>

  <div class="currentGroupHeaderStyle row mdl-shadow--2dp">
    <div class="col-4">
      <img class="groupImage" src="{{this.groupImage}}" alt="Mountain View" onerror="this.src='http://sfems.org/wp-content/uploads/2015/01/Bach-square.jpg';">
    </div>

    <div class="col-8">
      <h3 class="groupHeader">{{this.groupName}}</h3>
      <p>Created by: ({{this.groupOwner}}) on ({{this.groupDate}})</p>
      <hr>
      <p class="groupDescription">{{this.groupDescription}}</p>

      <div class="groupMembersContainer">
      <div class="groupMembersText">Group Members</div>
      <div class="groupMembersContent">

      <ul id="groupMembersDropdown" class="groupMembersList">
      {{#each groupMembers}}
      <li><a class="listItem" href = "#" onmousedown="viewProfile('{{@key}}')">{{this.name}}</a></li>
      {{/each}}
      </ul>

      </div>
      </div>

      <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="removeMember('{{this.myID}}')">
        Leave Group
      </button>

    </div>
  </div>

  <div class="postButtonContainer">
    <button class="postButton mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatGroupFormSubmit" onclick="togglePostForm()">
      Post Something
    </button>
  </div>

  <div id="createPostForm" class="createPostForm mdl-shadow--2dp">
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <input class="mdl-textfield__input" id="createPostTitle" type="text" placeholder="Give a Name to your post">
    </div>
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <input class="mdl-textfield__input" id="createPostText" type="text" placeholder="Text">
    </div>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatPostFormSubmit" onclick="createPost('{{this.groupID}}')">
      Submit
    </button>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="togglePostForm()">
      Cancel
    </button>
  </div>

`);

// Admin Permissions
var headerHTMLGen1 = Handlebars.compile(`
  <div class="groupBackButtonContainer">
    <button class="groupBackButton mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatGroupFormSubmit" onclick="redirectToMyGroups('{{this.groupID}}')">
      back to My Groups
    </button>
  </div>

  <div class="currentGroupHeaderStyle row mdl-shadow--2dp">
    <div class="col-4">
      <img class="groupImage" src="{{this.groupImage}}" alt="Mountain View" onerror="this.src='http://sfems.org/wp-content/uploads/2015/01/Bach-square.jpg';">
    </div>

    <div class="col-8">
      <h3 class="groupHeader">{{this.groupName}}</h3>
      <p>Created by: ({{this.groupOwner}}) on ({{this.groupDate}})</p>
      <hr>
      <p class="groupDescription">{{this.groupDescription}}</p>

      <div class="groupMembersContainer">
      <div class="groupMembersText">
        Group Members
      </div>
      <div class="groupMembersContent">
      <ul id="groupMembersDropdown" class="groupMembersList">
      {{#each groupMembers}}
      <li><a class="listItem" href = "#" onmousedown="viewProfile('{{@key}}')">{{this.name}}</a></li>
      {{/each}}
      </ul>
      </div>
      </div>

      <div class="groupRequestsContainer">
        <div class="groupRequestsText">Group Requests</div>
      <div class="groupRequestsContent">
      <ul id="groupRequestsDropdown" class="groupRequestsList">
      {{#each groupRequests}}
      <li><a class="listItem" href = "#" onmousedown="showPendingListModal('{{@key}}', '{{../groupID}}', '{{this.name}}')">{{this.name}}</a></li>
      {{/each}}
      </ul>
      </div>
      </div>

      <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="removeMember('{{this.myID}}')">
        Leave Group
      </button>

    </div>
  </div>

  <div class="postButtonContainer">
    <button class="postButton mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatGroupFormSubmit" onclick="togglePostForm()">
      Post Something
    </button>
  </div>

  <div id="createPostForm" class="createPostForm mdl-shadow--2dp">
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <input class="mdl-textfield__input" id="createPostTitle" type="text" placeholder="Give a Name to your post">
    </div>
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <input class="mdl-textfield__input" id="createPostText" type="text" placeholder="Text">
    </div>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatPostFormSubmit" onclick="createPost('{{this.groupID}}')">
      Submit
    </button>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="togglePostForm()">
      Cancel
    </button>
  </div>

`);

// Group Owner Permissions
var headerHTMLGen2 = Handlebars.compile(`
  <div class="groupBackButtonContainer">
    <button class="groupBackButton mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatGroupFormSubmit" onclick="redirectToMyGroups('{{this.groupID}}')">
      back to My Groups
    </button>
  </div>

  <div class="currentGroupHeaderStyle row mdl-shadow--2dp">
    <div class="col-4">
      <img class="groupImage" src="{{this.groupImage}}" alt="Mountain View" onerror="this.src='http://sfems.org/wp-content/uploads/2015/01/Bach-square.jpg';">
    </div>

    <div class="col-8">
      <h3 class="groupHeader">{{this.groupName}}</h3>
      <p>Created by: ({{this.groupOwner}}) on ({{this.groupDate}})</p>
      <hr>
      <p class="groupDescription">{{this.groupDescription}}</p>

      <div class="groupMembersContainer">
        <div class="groupMembersText">
          Group Members
        </div>
      <div class="groupMembersContent">

      <ul id="groupMembersDropdown" class="groupMembersList">
      {{#each groupMembers}}
      <li><a class="listItem" href = "#" onmousedown="showMemberListModal('{{@key}}', '{{../groupID}}')">{{this.name}}</a></li>
      {{/each}}
      </ul>

      </div>
      </div>

      <div class="groupRequestsContainer">
      <div class="groupRequestsText">Group Requests</div>
      <div class="groupRequestsContent">

      <ul id="groupRequestsDropdown" class="groupRequestsList">
      {{#each groupRequests}}
      <li><a class="listItem" href="#" onmousedown="showPendingListModal('{{@key}}', '{{../groupID}}', '{{this.name}}')">{{this.name}}</a></li>
      {{/each}}
      </ul>

      </div>
      </div>

      <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="deleteGroup('{{this.groupID}}')">
        Delete Group
      </button>

    </div>
  </div>

  <div class="postButtonContainer">
    <button class="postButton mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatGroupFormSubmit" onclick="togglePostForm()">
      Post Something
    </button>
  </div>

  <div id="createPostForm" class="createPostForm mdl-shadow--2dp">
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <input class="mdl-textfield__input" id="createPostTitle" type="text" placeholder="Give a Name to your post">
    </div>
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <input class="mdl-textfield__input" id="createPostText" type="text" placeholder="Text">
    </div>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" id="creatPostFormSubmit" onclick="createPost('{{this.groupID}}')">
      Submit
    </button>
    <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="togglePostForm()">
      Cancel
    </button>
  </div>

`);

// <div class="singlePost">
// <ul>
// <li>{{this.postTitle}}</li>
// <li>{{this.postText}}</li>
// <li>{{this.postOwner.ownerName}}</li>
// </ul>
// <input class="mdl-textfield__input" id="comment-form-{{this.postID}}" type="text"/>
// <div>
// {{#each comments}}
// Comment:
// <li>{{this.commentName}}</li>
// <li>{{this.commentText}}</li>
// {{/each}}
// <div>
// </div>

// <ul>
// <li>{{this.name}}</li>
// <li>{{this.desc}}</li>
// {{this.owner}}
// </ul>
// <button class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" onclick="goToGroup('{{@key}}')">
//   GoToThisGroup
// </button>
