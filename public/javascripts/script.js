window.onload = function () {
  gapi.load("auth2", function () {
    gapi.auth2.init();
  });
};

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
  if (window.location.pathname != "/login") {
    var profile = googleUser.getBasicProfile();
    console.log("test");
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
    const peers = {};
    // const myPeer = new Peer(undefined, {
    //   host: "/",
    //   port: "3001",
    // });

    const myPeer = new Peer({
      key: "peerjs",
      port: "https://mypeers17050211.herokuapp.com",
      secure: true,
      port: 443
    });
    const myVideo = document.createElement("video");
    myVideo.muted = true;

    var currentPeer;
    var myStream;
    var myShareScreen;
    var initiateBtn = document.getElementById('initiateBtn');
    var stopBtn = document.getElementById('stopBtn');

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        myStream = stream;
        addVideoStream(myVideo, stream);

        myPeer.on("call", (call) => {
          call.answer(stream);
          const video = document.createElement("video");
          call.on("stream", (userVideoStream) => {
            currentPeer = call.peerConnection;
            initiateBtn.style.display = 'block';
            addVideoStream(video, userVideoStream);
          });
        });

        socket.on("user-connected", (userId) => {
          connecttoNewUser(userId, stream);
          //alert("new User " + userId)
          console.log("User connected " + userId);
        });
      });

    socket.on("user-disconnected", (userId) => {
      if (peers[userId]) {
        peers[userId].close();
      }
      initiateBtn.style.display = 'none';
      //alert('User disconnected: ', userId);
      console.log("User disconnected: ", userId);
    });

    myPeer.on("open", (id) => {
      socket.emit("join-room", ROOM_ID, id);
    });

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
        initiateBtn.style.display = 'block';
        addVideoStream(video, userVideoStream);
      });
      call.on("close", () => {
        video.remove();
      });

      peers[userId] = call;
    }

    initiateBtn.onclick = (e) => {
      if(currentPeer) {
        navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        }).then((stream) => {
          myShareScreen = stream;
  
          let vidtrack = myShareScreen.getVideoTracks()[0];
          vidtrack.onended = function() {
            stopShare();
          };
          let sender = currentPeer.getSenders().find(function(s) {
            return s.track.kind == vidtrack.kind;
          })
          sender.replaceTrack(vidtrack);
  
          // var video = document.querySelector('video');
          // if ('srcObject' in video) {
          //   video.srcObject = stream;
          // } else {
          //   video.src = window.URL.createObjectURL(stream); // for older browsers
          // }
          // video.play();
  
          stopBtn.style.display = 'block';
        }).catch((err) => {
          console.log('Get display media got Error: ', err);
        })
      }
    }

    stopBtn.onclick = () => {
      myShareScreen.getVideoTracks()[0].stop();
      stopShare();
    }

    function stopShare() {
      let vidtrack = myStream.getVideoTracks()[0];
      let sender = currentPeer.getSenders().find(function(s) {
        return s.track.kind == vidtrack.kind;
      })
      sender.replaceTrack(vidtrack);
      stopBtn.style.display = 'none';
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
