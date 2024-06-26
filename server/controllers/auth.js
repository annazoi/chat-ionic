const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const cloudinary = require("../utils/cloudinary");
const uploadImage = require("../lib/uploadImage");

const register = async (req, res, next) => {
  const { phone, username, password, avatar } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({
      $or: [
        {
          username: username,
        },
      ],
    });
  } catch (err) {
    return res
      .status(400)
      .send({ message: "Signing up failed, please try again later. 1" });
  }

  if (existingUser) {
    return res.status(400).send({ message: "User already exits" });
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    console.log(err);

    return res.status(400).send({ message: "Could not create user" });
  }

  try {
    let result;
    if (avatar) {
      result = await uploadImage(avatar);
    }
    const createdUser = await User.create({
      phone,
      username,
      password: hashedPassword,
      avatar: result || "",
    });

    let token;

    token = jwt.sign(
      {
        userId: createdUser.id,
        username: createdUser.username,
      },
      process.env.JWT_SECRET
      // { expiresIn: "" }
    );
    res.status(201).json({
      userId: createdUser.id,
      token: token,
      avatar: result || "",
      username: createdUser.username,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ message: "Could not create user" });
  }
};

const login = async (req, res, next) => {
  const { username, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({
      $or: [
        {
          username: username,
        },
      ],
    });
  } catch (err) {
    return res
      .status(400)
      .send({ message: "Logging in failed, please try again later." });
  }

  if (!existingUser) {
    return res
      .status(400)
      .send({ message: "Invalid credentials, could not log you in." });
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return res
      .status(400)
      .send({ message: "Invalid credentials, could not log you in." });
  }

  if (!isValidPassword) {
    return res
      .status(400)
      .send({ message: "Invalid credentials, could not log you in." });
  }

  let token;
  try {
    token = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET);
  } catch (err) {
    return res
      .status(400)
      .send({ message: "Logging in failed, please try again later.2" });
  }

  res.status(200).json({
    userId: existingUser.id,
    token: token,
    avatar: existingUser.avatar,
    username: existingUser.username,
  });
};

exports.register = register;
exports.login = login;
