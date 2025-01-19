const userModel = require("../models/userModel.js");
const bcrypt = require("bcrypt");
const { verify } = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = {
  registerUser: async (req, res) => {
    const { password, email } = req.body;

    try {
      const user = await userModel.createUser(password, email);
      res.status(201).json({
        message: "User registered successfully",
        user,
      });
    } catch (error) {
      console.log(error);
      if (error.code === "23505") {
        res.status(400).json({
          message: "Email already exists",
        });
      } else {
        res.status(500).json({
          message: "Internal Server Error",
        });
      }
    }
  },
  loginUser: async (req, res) => {
    const { password, email } = req.body;

    try {
      const user = await userModel.getUserByEmail(email);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const passwordMatch = await bcrypt.compare(password + "", user.password);

      if (!passwordMatch) {
        res.status(404).json({ message: "Wrong password" });
        return;
      }

      const { ACCESS_TOKEN_SECRET } = process.env;

      /** generate the token */
      const accessToken = jwt.sign(
        { userid: user.id, email: user.email },
        ACCESS_TOKEN_SECRET,
        { expiresIn: "60s" }
      );

      /**  */
      res.cookie("token", accessToken, {
        httpOnly: true,
        maxAge: 60 * 1000,
        secure: true,
      });

      res.status(200).json({
        message: "Login successfully",
        user: { userid: user.id, email: user.email },
        token: accessToken,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },
  getAllUsers: async (req, res) => {
    try {
      const users = await userModel.getUsers();
      res.json(users);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  },
  logoutUser: (req, res) => {
    res.clearCookie("token");
    req.cookies["token"] = null;
    delete req.cookies["token"];
    /** set the column token to null */
    res.sendStatus(200);
  },
  verifyAuth: (req, res) => {
    const { userid, email } = req.user;
    const { ACCESS_TOKEN_SECRET } = process.env;

    const newAccessToken = jwt.sign({ userid, email }, ACCESS_TOKEN_SECRET, {
      expiresIn: "60s",
    });

    // const newRefreshToken = jwt.sign({ userid, email }, REFRESH_TOKEN_SECRET, {
    //   expiresIn: "7d",
    // });

    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 1000,
    });

    // res.cookie("refreshToken", newAccessToken, {
    //   httpOnly: true,
    //   secure: true,
    //   maxAge: 60 * 1000,
    // });

    res.json({
      message: "new access token",
      user: { userid, email },
      token: newAccessToken,
    });
  },
};
