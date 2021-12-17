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
    myVideo.muted = true;

    var currentPeer;
    var myStream;
    var myShareScreen;
    var initiateBtn = document.getElementById("initiateBtn");
    var stopBtn = document.getElementById("stopBtn");

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      })
      .then((stream) => {
        myStream = stream;
        addMyVideoStream(myVideo, stream);

        myPeer.on("call", (call) => {
          call.answer(stream);
          const video = document.createElement("video");
          call.on("stream", (userVideoStream) => {
            currentPeer = call.peerConnection;
            initiateBtn.style.display = "block";
            addVideoStream(video, userVideoStream);
          });
          const p_name = document.createElement("P");
          p_name.setAttribute("id", "name" + call.peer);
          p_name.innerText = list_username[call.peer];
          nameGrid.append(p_name);
          peers[call.peer] = call;
          console.log(call.peer);
        });

        socket.on("user-connected", (userId, name) => {
          const p_name = document.createElement("P");
          p_name.setAttribute("id", "name" + userId);
          p_name.innerText = list_username[userId];
          nameGrid.append(p_name);
          connecttoNewUser(userId, stream);
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

    function addVideoStream(video, stream) {
      video.srcObject = stream;
      video.addEventListener("loadedmetadata", () => {
        video.play();
      });
      videoGrid.append(video);
    }

    function connecttoNewUser(userId, stream) {
      const call = myPeer.call(userId, stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        currentPeer = call.peerConnection;
        initiateBtn.style.display = "block";
        addVideoStream(video, userVideoStream);
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
    }
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
