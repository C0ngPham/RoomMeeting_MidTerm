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

    const socket = io("/");
    const videoGrid = document.getElementById("video-grid");
    const peers = {};
    const myPeer = new Peer(undefined, {
      host: "/",
      port: "3001",
    });
    const myVideo = document.createElement("video");
    myVideo.muted = true;

    var currentPeer;
    var myStream;
    var initiateBtn = document.getElementById('initiateBtn');
    var stopBtn = document.getElementById('stopBtn');

    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      })
      .then((stream) => {
        myStream = stream;
        addVideoStream(myVideo, stream);
        
        myPeer.on("call", (call) => {
          call.answer(stream);
          const video = document.createElement("video");
          call.on("stream", (userVideoStream) => {
            currentPeer = call.peerConnection;
            console.log('ccpeer: ', currentPeer);
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
        addVideoStream(video, userVideoStream);
      });
      call.on("close", () => {
        video.remove();
      });

      peers[userId] = call;
    }

    initiateBtn.onclick = (e) => {
      navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      }).then((stream) => {
        let vidtrack = stream.getVideoTracks()[0];
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
      }).catch((err) => {
        console.log('Get display media got Error: ', err);
      })
      // stopBtn.style.display = 'block';
    }

    function stopShare() {
      let vidtrack = myStream.getVideoTracks()[0];
      let sender = currentPeer.getSenders().find(function(s) {
        return s.track.kind == vidtrack.kind;
      })
      sender.replaceTrack(vidtrack);
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
