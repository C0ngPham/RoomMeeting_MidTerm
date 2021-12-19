// const { create } = require("hbs");

window.onload = function () {
  gapi.load("auth2", function () {
    gapi.auth2.init();
  });
};
window.addEventListener("load", () => {});

document.getElementById("mainNavbar").style.visibility = "hidden";
// document.getElementById("roomItem").style.visibility = "hidden";
//Google User
function onSignIn(googleUser) {
  if (window.location.pathname == "/login") {
    console.log(window.location.pathname);

    $.ajax({
      url: "/login",
      method: "post",
      success: function (user) {
        window.location.replace("/");
      },
      error: function (user) {
        alert(user.error);
      },
    });
  }
  if (window.location.pathname == "/") {
    document.getElementById("mainNavbar").style.visibility = "";
    document.getElementById("roomItem").style.visibility = "hidden";
    document.getElementById("roomItem2").style.visibility = "hidden";
    document.getElementById("usnam").innerText = user_student.name;
    var profile = googleUser.getBasicProfile();
    console.log("test");
    var user_student = {
      id_gg: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
    };
    console.log(user_student);

    // Set username
  }

  if (window.location.pathname.includes("/room")) {
    document.getElementById("mainNavbar").style.visibility = "";
    //Get Room ID
    const ROOM_ID = $("#room_id").text();
    console.log(ROOM_ID);

    var profile = googleUser.getBasicProfile();
    var user_student = {
      id_gg: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
    };
    console.log(user_student);

    // Set username
    document.getElementById("usnam").innerText = user_student.name;
    const socket = io("/");
    const videoGrid = document.getElementById("video-grid");
    const myVideoGrid = document.getElementById("my-video");
    const nameGrid = document.getElementById("name-grid");
    const peers = {};
    let list_username = {};

    // const myPeer = new Peer(undefined, {
    //   host: "/",
    //   port: "3001",
    // });

    const myPeer = new Peer({
      key: "peerjs",
      host: "mypeers17050211.herokuapp.com",
      secure: true,
      port: 443,
    });
    const myVideo = document.createElement("video");
    var currentPeer;
    var myStream;
    var myShareScreen;
    var initiateBtn = document.getElementById("initiateBtn");
    var stopBtn = document.getElementById("stopBtn");
    var muteBtn = document.getElementById("muteBtn");
    var camBtn = document.getElementById("camBtn");

    myVideo.muted = true;
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        myStream = stream;
        addMyVideoStream(myVideo, stream);

        myPeer.on("call", (call) => {
          call.answer(stream);
          const video = document.createElement("video");
          video.className = "remote-video";

          // const p_name = document.createElement("P");
          // p_name.setAttribute("id", call.peer);
          // p_name.innerText = list_username[call.peer];
          // p_name.setAttribute("style", "text-align: center; color: white");

          // nameGrid.append(p_name);
          // peers[call.peer] = call;
          // console.log(call.peer);

          call.on("stream", (userVideoStream) => {
            currentPeer = call.peerConnection;
            initiateBtn.style.display = "block";
            console.log("event 1");
            addVideoStream(video, userVideoStream, call.peer);
          });

          call.on("close", () => {
            video.remove();
          });

          peers[call.peer] = call;
          console.log(call.peer);
        });

        socket.on("user-connected", (userId, name) => {
          // const p_name = document.createElement("P");
          // p_name.setAttribute("id", userId);
          // p_name.innerText = list_username[userId];
          // p_name.setAttribute("style", "text-align: center; color: white");

          // nameGrid.append(p_name);
          connecttoNewUser(userId, stream, userId);
          console.log("User connected " + userId, name);
        });
      });

    socket.on("user-disconnected", (userId) => {
      if (peers[userId]) {
        peers[userId].close();
        $("#name" + userId).remove();
        console.log("close real");
      }
      initiateBtn.style.display = "none";
      //alert('User disconnected: ', userId);
      console.log("User disconnected: ", userId);
    });

    myPeer.on("open", (id) => {
      socket.emit("join-room", ROOM_ID, id, user_student.name);
      socket.on("list-name", (list_name) => {
        list_username = list_name;
        console.log(list_username);
      });
    });
    function addMyVideoStream(video, stream) {
      video.srcObject = stream;
      video.addEventListener("loadedmetadata", () => {
        video.play();
      });
      myVideoGrid.append(video);
    }

    function addVideoStream(video, stream, id) {
      video.srcObject = stream;
      video.addEventListener("loadedmetadata", () => {
        video.play();
      });
      console.log(video);
      video.setAttribute("id", id);

      // let controlDiv = document.createElement("div");
      // controlDiv.className = "remote-video-controls";
      // controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
      //           <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

      // // //create a new div for card
      // // let cardDiv = document.createElement("div");
      // // cardDiv.className = "card card-sm";
      // // cardDiv.appendChild(video);
      // // cardDiv.appendChild(controlDiv);
      // // console.log(cardDiv);

      // videoGrid.append(video, controlDiv);

      const p_name = document.createElement("P");
      p_name.setAttribute("id", "id" + id);
      p_name.innerText = list_username[id];
      p_name.setAttribute("style", "text-align: center; color: white");

      // btnMute
      const btnMuteGuess = document.createElement("button");
      btnMuteGuess.className = "btn btn-outline-warning";
      btnMuteGuess.id = "btn" + id;
      btnMuteGuess.innerText = "Mute/Unmute";
      btnMuteGuess.setAttribute("onClick", "muteGuess(this.id)");
      // Btn expand

      const btnExpGuess = document.createElement("button");
      btnExpGuess.className = "btn btn-outline-info";
      btnExpGuess.id = "exp" + id;
      btnExpGuess.innerText = "Expand";
      btnExpGuess.setAttribute("onClick", "expGuess(this.id)");

      //video controls elements
      let controlDiv = document.createElement("div");
      controlDiv.className = "remote-video-controls";
      // controlDiv.innerHTML = `<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
      //                   <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`;

      //create a new div for card
      let cardDiv = document.createElement("div");
      cardDiv.className = "card card-sm";
      cardDiv.id = "card" + id;
      cardDiv.appendChild(video);
      controlDiv.appendChild(p_name);
      controlDiv.appendChild(btnMuteGuess);
      controlDiv.appendChild(btnExpGuess);
      cardDiv.appendChild(controlDiv);

      //put div in main-section elem
      document.getElementById("videos").appendChild(cardDiv);
    }

    function connecttoNewUser(userId, stream, userId) {
      const call = myPeer.call(userId, stream);
      const video = document.createElement("video");
      video.className = "remote-video";
      console.log("event 2");
      console.log(call);
      call.on("stream", (userVideoStream) => {
        currentPeer = call.peerConnection;
        initiateBtn.style.display = "block";
        addVideoStream(video, userVideoStream, userId);
      });
      call.on("close", () => {
        video.remove();
      });

      peers[userId] = call;
      console.log(peers);
    }

    initiateBtn.onclick = (e) => {
      if (currentPeer) {
        navigator.mediaDevices
          .getDisplayMedia({
            video: {
              cursor: "always",
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          })
          .then((stream) => {
            myShareScreen = stream;

            let vidtrack = myShareScreen.getVideoTracks()[0];
            vidtrack.onended = function () {
              stopShare();
            };
            let sender = currentPeer.getSenders().find(function (s) {
              return s.track.kind == vidtrack.kind;
            });
            sender.replaceTrack(vidtrack);

            // var video = document.querySelector('video');
            // if ('srcObject' in video) {
            //   video.srcObject = stream;
            // } else {
            //   video.src = window.URL.createObjectURL(stream); // for older browsers
            // }
            // video.play();

            stopBtn.style.display = "block";
            initiateBtn.style.display = "none";
          })
          .catch((err) => {
            console.log("Get display media got Error: ", err);
          });
      }
    };

    stopBtn.onclick = () => {
      myShareScreen.getVideoTracks()[0].stop();
      stopShare();
    };

    function stopShare() {
      let vidtrack = myStream.getVideoTracks()[0];
      let sender = currentPeer.getSenders().find(function (s) {
        return s.track.kind == vidtrack.kind;
      });
      sender.replaceTrack(vidtrack);
      stopBtn.style.display = "none";
      initiateBtn.style.display = "block";
    }

    //When the mute btn is clicked

    muteBtn.onclick = () => {
      console.log("clicked mute");
      if (myStream.getAudioTracks()[0].enabled) {
        myStream.getAudioTracks()[0].enabled = false;
      } else {
        myStream.getAudioTracks()[0].enabled = true;
      }
    };

    camBtn.onclick = () => {
      console.log("clicked cambtn");
      if (myStream.getVideoTracks()[0].enabled) {
        myStream.getVideoTracks()[0].enabled = false;
      } else {
        myStream.getVideoTracks()[0].enabled = true;
      }
    };
  }
}

// When guess btn is clicked
function muteGuess(id) {
  console.log("mute guess: ", id);
  let guessStream = document.getElementById(id.substring(3));

  // console.log(guessStream.videoWidth);
  // console.log(guessStream.videoHeight);
  console.log(guessStream.muted);
  if (guessStream.muted) {
    guessStream.muted = false;
    console.log(guessStream.muted);
  } else {
    guessStream.muted = true;
    console.log(guessStream.muted);
  }
}

// When exp btn is clicked
function expGuess(id) {
  console.log("expand guess: ", id);
  let guessStream = document.getElementById(id.substring(3));

  if (guessStream.requestFullscreen) {
    guessStream.requestFullscreen();
  } else if (guessStream.webkitRequestFullscreen) {
    /* Safari */
    guessStream.webkitRequestFullscreen();
  } else if (guessStream.msRequestFullscreen) {
    /* IE11 */
    guessStream.msRequestFullscreen();
  }
}
//Google signOut
function signOut() {
  gapi.auth2
    .getAuthInstance()
    .signOut()
    .then(function () {
      console.log("Sign Out");
      window.location.replace("/logout");
    });
}

//Create new room meeting
function creatRoom() {
  window.location.replace("/room/");
}
