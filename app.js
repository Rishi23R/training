const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,

      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//registeruser

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashpass = await bcrypt.hash(password, 10);
  const checkuserquery = `select * from
    user 
    where username=${username};`;
  const dbuser = await db.get(checkuserquery);
  if (dbuser === undefined) {
    if (password.length >= 5) {
      const createuser = `
       insert into
       user (username,name,password,gender,location)
       values(${username},${name},${hashpass},${gender},${location});`;
      await db.run(createuser);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
//loginuser
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const loginuser = `
    select *
    from user
    where username =${username};`;
  const userfound = await db.get(loginuser);
  if (userfound === undefined) {
    response.code(400);
    response.send("Invalid User");
  } else {
    const ispasssame = await bcrypt.compare(password, userfound.password);
    if (ispasssame === true) {
      response.code(200);
      response.send("Login Success");
    } else {
      response.code(400);
      response.send("Invalid Password");
    }
  }
});

//chanegpassword

app.put("/change-password", async (request, respone) => {
  const { username, oldPassword, newPassword } = request.body;
  const findusername = `
    select password from user
    where username =${username};`;
  const userinfo = await db.get(findusername);
  if (userinfo.password === oldPassword) {
    if (newPassword.length > 5) {
      const updatepass = `
            update table user
            set password=${newPassword}
            where username=${username};`;
      await db.run(updatepass);
      response.code(200);
      respone.send("Password Updated");
    } else {
      response.code(400);
      respone.send("Password is too short");
    }
  } else {
    respone.code(400);
    respone.send("Invalid current password");
  }
});
module.exports = app;
