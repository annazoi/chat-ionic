const Chat = require("../model/Chat");
const FCM = require("fcm-node");
const fcm = new FCM(process.env.SERVER_KEY);
const cloudinary = require("../utils/cloudinary");

const createMessage = async (req, res) => {
  try {
    const { image } = req.body;
    let result;
    if (image) {
      result = await cloudinary.uploader.upload(image, {
        folder: "chat",
      });
    }

    const chat = await Chat.findById(req.params.chatId);
    chat.messages.push({
      senderId: req.userId,
      message: req.body.message,
      image: result?.url || "",
    });

    await chat.populate("members creatorId messages.senderId", "-password");

    await chat.save();
    const users = chat.members.filter((member) => member._id != req.userId);

    const sender = chat.members.find((member) => member._id == req.userId);

    users.map((members) => {
      const message = {
        to: members.notificationToken,
        collapse_key: "green",

        notification: {
          title: sender.username,
          body: req.body.message,
          // image: sender.avatar,
        },

        data: {
          my_key: "my value",
          my_another_key: "my another value",
        },
      };

      fcm.send(message, function (err, response) {
        if (err) {
          console.log("Something has gone wrong!");
        }
      });
    });

    res.status(200).json({ message: "ok", chat: chat });
  } catch (err) {
    res.status(500).json({ message: err, chat: null });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    // chat.messages.pull(req.params.messageId);
    const message = chat.messages.find(
      (message) => message._id == req.params.messageId
    );
    message.message = "";
    await chat.save();
    res.status(200).json({ message: "ok", chat: chat });
  } catch (err) {
    res.status(500).json({ message: err, chat: null });
  }
};

const readMessage = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    const message = chat.messages.find(
      (message) => message._id == req.params.messageId
    );
    message.read = true;
    await chat.save();
    res.status(200).json({ message: "ok", chat: chat });
  } catch (err) {
    res.status(500).json({ message: err, chat: null });
  }
};

module.exports = { createMessage, deleteMessage, readMessage };
