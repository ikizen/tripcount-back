// import { Express } from "express";
// import axios from "axios";
// import mongoose from "mongoose";
const mongoose = require("mongoose");
const express = require("express");
require("dotenv").config();

const app = express();
app.use(express.json());

const port = 3000;
const uri = process.env.MONGODB_CONNECTION_STRING;

mongoose.connect(uri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.once("open", () => {
    console.log("MongoDB connected!");
});

app.listen(port, () => {
    console.log(`NEW port is running ${port}`);
});
