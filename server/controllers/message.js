const Chat = require("../model/Chat");
const FCM = require("fcm-node");
const serverKey =
  "AAAAxcHH52k:APA91bFbWz7jFU5cZ5Mi8Da6ljq-NcfN0lim-9HD9IFWH3203joBGVzzlY6vo0RNBM2cWiCxiGRQB3gcvinmszfnp19gb2widnE2bgmqynct9wpn9cQC9MC6zbEaiT3-Ah9ZK0wjM9p6";
const fcm = new FCM(serverKey);

const createMessage = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate(
      "members creatorId messages.senderId",
      "-password"
    );
    chat.messages.push({
      senderId: req.userId,
      message: req.body.message,
    });

    await chat.populate("members creatorId messages.senderId");

    await chat.save();
    const users = chat.members.filter((member) => member._id != req.userId);

    console.log("users", users);

    const senderName = chat.members.find((member) => member._id == req.userId);

    users.map((members) => {
      const message = {
        to: members.notificationToken,
        collapse_key: "green",

        notification: {
          title: senderName.username,
          body: req.body.message,
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

module.exports = { createMessage, deleteMessage };
