const User = require("../model/User");
const bcrypt = require("bcryptjs");
const cloudinary = require("../utils/cloudinary");

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users) {
      return res.status(404).json({ message: "Users Not Found", users: null });
    }
    res.json({ message: "ok", users: users });
  } catch (err) {
    res.json({ message: "Users Not Found", users: null });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "-password");

    if (!user) {
      return res.status(404).json({ message: "User Not Found", user: null });
    }
    res.status(201).json({ message: "ok", user: user });
  } catch (err) {
    res.status(404).json({ message: err, user: null });
  }
};

const deleteUser = async (req, res) => {
  try {
    const removedUser = await User.deleteOne({ _id: req.params.id });
    res.json(removedUser);
  } catch (err) {
    res.json({ message: err });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).exec();

    if (!user) {
      return res.status(404).json({
        message: "The User with the given ID was not found.",
        user: null,
      });
    }

    const { phone, username, password, avatar } = req.body;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (avatar !== user.avatar) {
      const result = await cloudinary.uploader.upload(avatar, {
        folder: "users",
      });
      user.avatar = result.url;
    }
    const userId = req.params.id;
    if (username !== user.username) {
      if (id !== userId) {
        const existingUser = await User.findOne({
          $or: [
            {
              username: req.body.username,
            },
          ],
        });
        if (existingUser) {
          return res.status(400).send({ message: "User already exits" });
        }
        return res.status(400).send({ message: "User already exits" });
      } else {
        user.username = username;
      }
      // if (user._id !== userId) {
      //   username = user.username;
      // }
    }
    user.username = username || user.username;
    user.phone = phone || user.phone;

    await user.save();

    res.status(201).json({ message: "ok", user: user });
  } catch (err) {
    res.status(404).json({ message: err, user: null });
  }
};
exports.getUsers = getUsers;
exports.getUser = getUser;
exports.deleteUser = deleteUser;
exports.updateUser = updateUser;
