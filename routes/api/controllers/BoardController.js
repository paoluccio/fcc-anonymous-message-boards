const BoardModel = require('../models/BoardModel');

exports.get_boards = async (req, res, next) => {
  try {
    const response = await BoardModel.find({}, null, { collation: { 'locale': 'en' }, sort: { board: 1 } });
    const boards = response.reduce((acc, board) => {
      acc.push({
        id: board._id,
        board_name: board.board,
        threads_count: board.threads.length,
        replies_count: board.threads.reduce((total, thread) => total + thread.replies.length, 0)
      });
      return acc;
    }, []);
    res.json(boards);
  } catch (err) {
    next(err);
  }
}

exports.get_threads = async (req, res, next) => {
  const { board } = req.params;
  try {
    const fullThreadsList = await BoardModel.findOne({ board });
    if (!fullThreadsList) return res.status(400).json({ error: 'This board does not exist' });
    // Get 10 most recent and recently bumped threads
    const trimmedThreadsList = fullThreadsList.toObject().threads.sort((a, b) => b.bumped_on - a.bumped_on).slice(0, 10);
    // Get 3 most recent replies from each thread 
    trimmedThreadsList.forEach(thread => {
      thread['replies_total'] = thread.replies.length;
      thread.replies = thread.replies.sort((a, b) => b.created_on - a.created_on).slice(0, 3);
    });
    res.json(trimmedThreadsList);
  } catch (err) {
    next(err);
  }
}

exports.get_replies = async (req, res, next) => {
  const { board } = req.params;
  const { thread_id } = req.query;
  try {
    const foundBoard = await BoardModel.findOne({ board });
    if (!foundBoard) return res.status(400).json({ error: 'This board does not exist' });
    const foundThread = foundBoard.threads.id(thread_id);
    if (!foundThread) return res.status(400).json({ error: 'Thread with this ID does not exist' });
    // Code reached here then board and thread exist, continue on and get all replies
    const repliesList = foundThread.replies;
    repliesList.sort((a, b) => b.created_on - a.created_on).forEach(reply => {
      delete reply.reported;
      delete reply.delete_password;
    });
    res.json(repliesList);
  } catch (err) {
    next(err);
  }
}

exports.create_board = async (req, res, next) => {
  const { board, delete_password } = req.body;
  try {
    const foundBoard = await BoardModel.findOne({ board });
    if (foundBoard) return res.status(400).json({ error: 'This board already exists' });
    const newBoard = await BoardModel.create({ board, delete_password });
    res.status(201).json({ _id: newBoard._id, board: newBoard.board });
  } catch (err) {
    next(err);
  }
}

exports.create_thread = async (req, res, next) => {
  const { board } = req.params;
  const { thread_name } = req.body;
  try {
    const foundThread = await BoardModel.findOne({ board, 'threads.thread_name': thread_name });
    if (foundThread) return res.status(400).json({ error: 'This thread already exists' });
    // Code reached here then thread does not exist, continue on and create new thread
    const conditions = { board };
    const update = { $push: { threads: req.body } };
    const options = { new: true };
    const updatedBoard = await BoardModel.findOneAndUpdate(conditions, update, options);
    // If thread could not be added to the board, then board does not exist
    if (!updatedBoard) return res.status(400).json({ error: 'This board does not exist' });
    res.status(201).json(updatedBoard.threads.slice(-1)[0]);
  } catch (err) {
    next(err);
  }
}

exports.create_reply = async (req, res, next) => {
  const { thread_id, reply_text, delete_password } = req.body;
  try {
    const conditions = { board: req.params.board, 'threads._id': thread_id };
    const update = { $push: { 'threads.$.replies': { reply_text, delete_password } }, $set: { 'threads.$.bumped_on': Date.now() } };
    const options = { new: true };
    const updatedBoard = await BoardModel.findOneAndUpdate(conditions, update, options);
    if (!updatedBoard) return res.status(400).json({ error: 'Thread with this ID does not exist' });
    const lastReply = updatedBoard.threads.id(thread_id).replies.slice(-1)[0];
    res.status(201).json(lastReply);
  } catch (err) {
    next(err);
  }
}


exports.delete_board = async (req, res, next) => {
  const { _id, delete_password } = req.body;
  try {
    const foundBoard = await BoardModel.findById(_id);
    if (!foundBoard) return res.status(400).json({ error: 'Board with this ID does not exist' });
    // Code reached here then board exists, continue on and match passwords
    const deletedBoard = await BoardModel.findOneAndDelete({ _id, delete_password });
    if (!deletedBoard) return res.status(400).json({ error: 'Incorrect password' });
    res.json({ success: `Successfully deleted board - ${_id}` });
  } catch (err) {
    next(err);
  }
}

exports.delete_thread = async (req, res, next) => {
  const { board } = req.params;
  const { thread_id, delete_password } = req.body;
  if (!delete_password) return res.status(400).json({ error: 'Password is required' });
  try {
    const foundThread = await BoardModel.findOne({ board, 'threads._id': thread_id });
    if (!foundThread) return res.status(400).json({ error: 'Thread with this ID does not exist' });
    // Code reached here then thread exists, continue on and match passwords
    const conditions = { board, 'threads._id': thread_id, 'threads.delete_password': delete_password };
    const update = { $pull: { threads: { _id: thread_id } } };
    const updatedBoard = await BoardModel.findOneAndUpdate(conditions, update);
    // If nothing was returned, then passwords dont't match. Abort!
    if (!updatedBoard) return res.status(400).json({ error: 'Incorrect password' });
    res.json({ success: `Successfully deleted thread - ${thread_id}` });
  } catch (err) {
    next(err);
  }
}

exports.delete_reply = async (req, res, next) => {
  const { board } = req.params;
  const { thread_id, reply_id, delete_password, } = req.body;
  if (!delete_password) return res.status(400).json({ error: 'Password is required' });
  try {
    const foundThread = await BoardModel.findOne({ board, 'threads._id': thread_id });
    if (!foundThread) return res.status(400).json({ error: 'Thread with this ID does not exist' });
    const foundReply = foundThread.threads.id(thread_id).replies.id(reply_id);
    if (!foundReply) return res.status(400).json({ error: 'Reply with this ID does not exist' });
    //  Code reached here then thread and reply exist, continue on and match passwords
    const conditions = { board, 'threads._id': thread_id, 'threads.replies.delete_password': delete_password };
    const update = { $pull: { 'threads.$[].replies': { _id: reply_id } } };
    const updatedBoard = await BoardModel.findOneAndUpdate(conditions, update);
    if (!updatedBoard) return res.status(400).json({ error: 'Incorrect password' });
    res.json({ success: `Successfully deleted reply - ${reply_id}` });
  } catch (err) {
    next(err);
  }
}

exports.report_thread = async (req, res, next) => {
  const { board } = req.params;
  const { thread_id } = req.body;
  try {
    const conditions = { board, 'threads._id': thread_id };
    const update = { $set: { 'threads.$.reported': true } };
    const updatedBoard = await BoardModel.findOneAndUpdate(conditions, update);
    if (!updatedBoard) return res.status(400).json({ error: 'Thread with this ID does not exist' });
    res.json({ success: `Successfully reported on thread - ${thread_id}` });
  } catch (err) {
    next(err);
  }
}

exports.report_reply = async (req, res, next) => {
  const { board } = req.params;
  const { thread_id, reply_id } = req.body;
  try {
    const foundThread = await BoardModel.findOne({ board, 'threads._id': thread_id });
    if (!foundThread) return res.status(400).json({ error: 'Thread with this ID does not exist' });
    // Code reached here then thread exists, continue on and try to report on the reply
    const conditions = { board, 'threads._id': thread_id, 'threads.replies._id': reply_id };
    const update = { $set: { 'threads.$.replies.$[reply].reported': true } };
    const options = { arrayFilters: [{ 'reply._id': reply_id }] };
    const updatedBoard = await BoardModel.findOneAndUpdate(conditions, update, options);
    if (!updatedBoard) return res.status(400).json({ error: 'Reply with this ID does not exist' });
    res.json({ success: `Successfully reported on reply - ${reply_id}` });
  } catch (err) {
    next(err);
  }
}