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
  const result = await db.query("SELECT * FROM subjects;");
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
  const subjects = await getSubjects();
  if (userDetail.length === 0) {
    res.render(__dirname + "/view/login.ejs");
  } else {
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
  const subjects = await getSubjects();
  try {
    const result = await db.query("SELECT * FROM users WHERE email = ($1);", [
      req.body.email,
    ]);
    let password = result.rows[0].password;
    if (password === req.body.password) {
      result.rows.forEach((user) => {
        userDetail.push(user);
      });
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

// Home Page Route  To be Deleted
app.get("/home", async (req, res) => {
  const subjects = await getSubjects();
  res.render(__dirname + "/view/index.ejs", {
    subjects: subjects,
    user: userDetail[0],
  });
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

app.get("/logout", (req, res) => {
  userDetail.pop();
  res.render(__dirname + "/view/login.ejs");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
