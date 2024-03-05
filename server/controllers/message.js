const Chat = require("../model/Chat");

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

    // await chat
    //   .find()
    //   .populate("members creatorId messages.senderId", "-password");

    // const updatedChat = await chat
    //   .findById(req.params.chatId)
    //   .populate("members creatorId messages.senderId", "-password");
    // await updatedChat.save();

    res.status(200).json({ message: "ok", chat: chat });
  } catch (err) {
    res.status(500).json({ message: err, chat: null });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate(
      "members creatorId messages.senderId",
      "-password"
    );
    chat.messages.pull(req.params.messageId);
    await chat.save();
    res.status(200).json({ message: "ok", chat: chat });
  } catch (err) {
    res.status(500).json({ message: err, chat: null });
  }
};

module.exports = { createMessage, deleteMessage };
