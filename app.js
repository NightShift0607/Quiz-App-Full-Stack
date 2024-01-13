import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { get } from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
const userDetail = [];

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

// Function to get subjects
async function getSubjects() {
  const result = await db.query(
    "SELECT subjects.id,sub_name,score FROM max_score JOIN subjects ON subjects.id = max_score.sub_id WHERE user_id = ($1);",
    [userDetail[0].id]
  );
  var subjects = [];
  result.rows.forEach((subject) => {
    subjects.push(subject);
  });
  return subjects;
}

// Function to get question
async function getQuestions(sub_id) {
  const result = await db.query(
    "SELECT * FROM questions WHERE sub_id = ($1);",
    [sub_id]
  );
  let questions = [];
  result.rows.forEach((question) => {
    questions.push(question);
  });
  return questions;
}

// Start Page Route
app.get("/", async (req, res) => {
  if (userDetail.length === 0) {
    res.render(__dirname + "/view/login.ejs");
  } else {
    const subjects = await getSubjects();
    res.render(__dirname + "/view/index.ejs", {
      subjects: subjects,
      user: userDetail[0],
    });
  }
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
      const result = await db.query(
        "INSERT INTO users (name, email, password, sec_ques, sec_ans) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [
          req.body.name,
          req.body.email,
          req.body.password,
          req.body.sec_ques,
          req.body.sec_ans,
        ]
      );
      let id = result.rows[0].id;
      await db.query(
        "INSERT INTO max_score (score, user_id, sub_id) VALUES ($1,$2,$3),($4,$5,$6),($7,$8,$9),($10,$11,$12),($13,$14,$15)",
        [0, id, 1, 0, id, 2, 0, id, 3, 0, id, 4, 0, id, 5]
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
    const result = await db.query("SELECT * FROM users WHERE email = ($1);", [
      req.body.email,
    ]);
    let password = result.rows[0].password;
    if (password === req.body.password) {
      result.rows.forEach((user) => {
        userDetail.push(user);
      });
      const subjects = await getSubjects();
      res.render(__dirname + "/view/index.ejs", {
        subjects: subjects,
        user: userDetail[0],
      });
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

// Verify for forgot password route
app.post("/verify", async (req, res) => {
  const result = await db.query(
    "SELECT sec_ques,sec_ans FROM users WHERE email = ($1);",
    [req.body.email]
  );
  if (
    result.rows[0].sec_ques === req.body.sec_ques &&
    result.rows[0].sec_ans === req.body.sec_ans
  ) {
    res.render(__dirname + "/view/forgot.ejs", {
      email: req.body.email,
    });
  } else {
    res.render(__dirname + "/view/forgot.ejs", {
      error: "Email or Security Question or Answer is incorrect.",
    });
  }
});

// Change Password Route
app.post("/forgot", async (req, res) => {
  if (req.body.newPassword === req.body.cnfPassword) {
    try {
      await db.query("UPDATE users SET password = ($1) WHERE email = ($2)", [
        req.body.newPassword,
        req.body.email,
      ]);
      res.render(__dirname + "/view/login.ejs");
    } catch (error) {
      console.log(error);
    }
  } else {
    res.render(__dirname + "/view/forgot.ejs", {
      email: req.body.email,
      error: "Both The New Password and Confirm Password Must Match",
    });
  }
});

// Quiz Page Route
app.post("/quiz", async (req, res) => {
  if (userDetail.length === 0) {
    res.render(__dirname + "/view/login.ejs");
  } else {
    const sub_id = req.body.sub_id;
    const quesData = await getQuestions(sub_id);
    res.render(__dirname + "/view/quiz.ejs", {
      quesData: quesData,
      user: userDetail[0],
    });
  }
});

// Save Score Route
app.post("/score", async (req, res) => {
  const newScore = parseInt(req.body.score);
  const sub_id = parseInt(req.body.sub_id);
  const result = await db.query(
    "SELECT score FROM max_score WHERE user_id = ($1) AND sub_id = ($2);",
    [userDetail[0].id, sub_id]
  );
  const oldScore = result.rows[0].score;
  if (newScore > oldScore) {
    await db.query(
      "UPDATE max_score SET score = ($1) WHERE user_id = ($2) AND sub_id = ($3);",
      [newScore, userDetail[0].id, sub_id]
    );
  }
  const subjects = await getSubjects();
  res.render(__dirname + "/view/index.ejs", {
    subjects: subjects,
    user: userDetail[0],
  });
});

app.get("/logout", (req, res) => {
  userDetail.pop();
  res.render(__dirname + "/view/login.ejs");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
