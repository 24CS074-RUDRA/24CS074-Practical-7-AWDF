const Task = require("../models/Task");

async function listTasks(req, res, next) {
    try {
        const tasks = await Task.find({ owner: req.user.id }).sort({ createdAt: -1 });
        return res.status(200).json({ tasks });
    } catch (error) {
        return next(error);
    }
}

async function getTask(req, res, next) {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });
        if (!task) {
            return res.status(404).json({ error: { message: "Task not found." } });
        }
        return res.status(200).json({ task });
    } catch (error) {
        return next(error);
    }
}

async function createTask(req, res, next) {
    try {
        const task = await Task.create({ ...req.body, owner: req.user.id });
        return res.status(201).json({
            message: "Task created successfully.",
            task
        });
    } catch (error) {
        return next(error);
    }
}

async function updateTask(req, res, next) {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!task) {
            return res.status(404).json({ error: { message: "Task not found." } });
        }
        return res.status(200).json({
            message: "Task updated successfully.",
            task
        });
    } catch (error) {
        return next(error);
    }
}

async function deleteTask(req, res, next) {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id
        });
        if (!task) {
            return res.status(404).json({ error: { message: "Task not found." } });
        }
        return res.status(200).json({ message: "Task deleted successfully." });
    } catch (error) {
        return next(error);
    }
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };
