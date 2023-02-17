const express = require("express");

const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();

////task routes

//task create/post request
router.post("/tasks", auth, async (req, res) => {
  // const task = new Task(req.body);

  const task = new Task({ ...req.body, owner: req.user._id });
  //
  try {
    const myAwait = await task.save();
    //
    res.status(201).send(myAwait);
  } catch (e) {
    res.status(400).send(e);
  }
});

//

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

// one task get
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const myAwait = await Task.findOne({ _id, owner: req.user._id });

    if (!myAwait) {
      return res.status(404).send();
    }
    //
    res.send(myAwait);
  } catch (e) {
    res.status(500).send();
  }
});

// update task

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

//
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const myAwait = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!myAwait) {
      res.status(404).send();
    }

    res.send(myAwait);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
