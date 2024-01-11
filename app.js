import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
var users = [];
var user;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "quiz-app",
  password: "Rajat@0607",
  port: 5432,
});
db.connect();

// Function to check existence of user
async function chkUser(email) {
  const result = await db.query("SELECT email FROM users WHERE email = $1;", [
    email,
  ]);
  if (result.rows.length == 0) {
    return false;
  } else {
    return true;
  }
}

// Login Page Route
app.get("/", (req, res) => {
  res.render(__dirname + "/view/login.ejs");
});

// Signup Page Route
app.post("/signup", async (req, res) => {
  const status = await chkUser(req.body.email);
  if (status) {
    res.render(__dirname + "/view/login.ejs", {
      error: "Entered Email is already registered, Please Login",
    });
  } else {
    try {
      await db.query(
        "INSERT INTO users (name, email, password, sec_ques, sec_ans) VALUES ($1,$2,$3,$4,$5)",
        [
          req.body.name,
          req.body.email,
          req.body.password,
          req.body.sec_ques,
          req.body.sec_ans,
        ]
      );
      res.render(__dirname + "/view/login.ejs");
    } catch (error) {
      console.log(error);
    }
  }
});

// Login Page Route
app.post("/login", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT password FROM users WHERE email = ($1);",
      [req.body.email]
    );
    let password = result.rows[0].password;
    if (password === req.body.password) {
      res.render(__dirname + "/view/index.ejs");
    } else {
      res.render(__dirname + "/view/login.ejs", {
        error: "Entered Password or Email is Incorrect",
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// Forgot Page Route
app.get("/forgot", (req, res) => {
  res.render(__dirname + "/view/forgot.ejs");
});

// Home Page Route
app.get("/home", (req, res) => {
  res.render(__dirname + "/view/index.ejs");
});

// Quiz Page Route
app.get("/quiz", (req, res) => {
  res.render(__dirname + "/view/quiz.ejs");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
