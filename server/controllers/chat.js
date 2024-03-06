const Chat = require("../model/Chat");

const createChat = async (req, res) => {
  const { name, type, avatar, members } = req.body;

  try {
    if (type === "private") {
      const existingChat = await Chat.findOne({
        members: { $all: members },
        type: "private",
      });
      if (existingChat) {
        return res.status(200).json({ message: "ok", chat: existingChat });
      }
    }

    const chat = await Chat.create({
      name,
      type,
      avatar,
      members,
      creatorId: req.userId,
    });

    res.status(200).json({ message: "ok", chat: chat });
  } catch (err) {
    res.status(500).json({ message: err, chat: null });
  }
};
const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.userId }).populate(
      "members creatorId messages.senderId",
      "-password"
    );
    res.status(200).json({ message: "ok", chats: chats });
  } catch (err) {
    res.status(500).json({ message: err, chats: null });
  }
};

const getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate(
      "members creatorId messages.senderId",
      "-password"
    );
    res.status(200).json({ message: "ok", chat: chat });
  } catch (err) {
    res.status(500).json(err);
  }
};

const updateChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat)
      return res.status(404).json({
        message: "The Chat with the given ID was not found.",
        chat: null,
      });

    let query = { $set: {} };
    for (let key in req.body) {
      query.$set[key] = req.body[key];
    }
    await Chat.updateOne({ _id: req.params.chatId }, query).exec();

    const updatedChat = await Chat.findById(req.params.chatId).exec();

    res.status(201).json({ message: "ok", chat: updatedChat });
  } catch (err) {
    res.status(404).json({ message: err, chat: null });
  }
};

const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.chatId).exec();
    res.status(200).json({ message: "ok", chat: chat });
  } catch (err) {
    res.status(404).json({ message: err, chat: null });
  }
};

const addMember = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat)
      return res.status(404).json({
        message: "The Chat with the given ID was not found.",
        chat: null,
      });

    const { members } = req.body;
    const existingMembers = chat.members.map((member) => member.toString());
    if (members.some((member) => existingMembers.includes(member.toString()))) {
      return res
        .status(400)
        .json({ message: "Some members already exist in chat", chat: null });
    }
    chat.members.push(...members);
    await chat.save();

    res.status(201).json({ message: "ok", chat: chat });
  } catch (err) {
    res.status(404).json({ message: err, chat: null });
  }
};

const removeMember = async (req, res) => {
  const memberId = req.params.memberId;
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat)
      return res.status(404).json({
        message: "The Chat with the given ID was not found.",
        chat: null,
      });

    console.log("req.body", memberId);

    chat.members = chat.members.filter(
      (member) => member.toString() !== memberId
    );

    await chat.save();
    res.status(200).json({ message: "ok", chat: chat });
  } catch (err) {
    res.status(404).json({ message: err, chat: null });
  }
};

module.exports = {
  createChat,
  getChats,
  getChat,
  updateChat,
  deleteChat,
  addMember,
  removeMember,
};
