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

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "quiz-app",
  password: "Rajat@0607",
  port: 5432,
});
db.connect();

// Login Page Route
app.get("/", (req, res) => {
  res.render(__dirname + "/view/login.ejs");
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
