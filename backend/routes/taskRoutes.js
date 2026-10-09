const express = require("express");
const {
    listTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask
} = require("../controllers/taskController");
const requireAuth = require("../middleware/authMiddleware");
const { validateTask } = require("../middleware/validationMiddleware");

const router = express.Router();

router.use(requireAuth);
router.get("/", listTasks);
router.get("/:id", getTask);
router.post("/", validateTask(), createTask);
router.put("/:id", validateTask({ partial: true }), updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
