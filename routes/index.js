var express = require("express");
var router = express.Router();

var app = express();

const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

// /* GET home page. */
router.get("/", function (req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("index", { title: "Home" });
});

router.get("/login", function (req, res, next) {
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("login");
});

router.post("/login", function (req, res, next) {
  req.session.user = "1";
  return res.status(200).json({ message: "Student login sucessfull" });
});

router.get("/logout", function (req, res, next) {
  delete req.session.user;
  res.redirect("/login");
});

router.get("/room", (req, res) => {
  if (!req.session.user) {
    res.redirect("/login");
  }
  res.redirect(`/room/${uuidV4()}`);
});

router.get("/room/:room", (req, res) => {
  if (!req.session.user) {
    res.redirect("/login");
  }
  res.render("room", { roomId: req.params.room });
});


router.post("/enter", (req, res) => {
  // console.log(req.body.roomcode);
  let room = "room/";
  res.redirect(room.concat(req.body.roomcode));
});


module.exports = router;
