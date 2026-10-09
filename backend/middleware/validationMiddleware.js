const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TASK_FIELDS = ["title", "description", "completed", "priority"];

function reject(res, message) {
    return res.status(400).json({ error: { message } });
}

function validateRegistration(req, res, next) {
    const { name, email, password } = req.body || {};

    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 50) {
        return reject(res, "Name must be between 2 and 50 characters.");
    }
    if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
        return reject(res, "A valid email address is required.");
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
        return reject(res, "Password must be between 8 and 72 characters.");
    }

    req.body = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
    };
    return next();
}

function validateLogin(req, res, next) {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim())) {
        return reject(res, "A valid email address is required.");
    }
    if (typeof password !== "string" || password.length === 0 || password.length > 72) {
        return reject(res, "Password is required and must not exceed 72 characters.");
    }

    req.body = { email: email.trim().toLowerCase(), password };
    return next();
}

function validateTask({ partial = false } = {}) {
    return (req, res, next) => {
        const body = req.body;
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return reject(res, "A JSON object is required.");
        }

        const suppliedFields = Object.keys(body).filter((field) => TASK_FIELDS.includes(field));
        if (Object.keys(body).some((field) => !TASK_FIELDS.includes(field))) {
            return reject(res, "Request contains unsupported task fields.");
        }
        if (partial && suppliedFields.length === 0) {
            return reject(res, "Provide at least one task field to update.");
        }
        if (!partial && (typeof body.title !== "string" || !body.title.trim())) {
            return reject(res, "Task title is required.");
        }
        if (body.title !== undefined &&
            (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 120)) {
            return reject(res, "Title must be between 1 and 120 characters.");
        }
        if (body.description !== undefined &&
            (typeof body.description !== "string" || body.description.trim().length > 1000)) {
            return reject(res, "Description must not exceed 1000 characters.");
        }
        if (body.completed !== undefined && typeof body.completed !== "boolean") {
            return reject(res, "Completed must be a boolean.");
        }
        if (body.priority !== undefined && !["low", "medium", "high"].includes(body.priority)) {
            return reject(res, "Priority must be low, medium, or high.");
        }

        req.body = Object.fromEntries(
            suppliedFields.map((field) => [
                field,
                typeof body[field] === "string" ? body[field].trim() : body[field]
            ])
        );
        return next();
    };
}

module.exports = { validateRegistration, validateLogin, validateTask };
