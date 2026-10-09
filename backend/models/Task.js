const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: 1,
            maxlength: 120
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },
        completed: {
            type: Boolean,
            default: false
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
