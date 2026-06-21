const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { User, Course } = require("./project_model");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/project3";

app.use(cors());
app.use(express.json());

function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : value;
}

function handleError(res, error) {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ message: "Validation failed", errors: messages });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "Duplicate value found", error: error.message });
  }

  return res.status(500).json({ message: "Server error", error: error.message });
}

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
}

connectDB();

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Backend is running" });
});

app.post("/api/users", async (req, res) => {
  try {
    const user = await User.create({
      name: sanitizeText(req.body.name),
      email: sanitizeText(req.body.email),
      age: req.body.age !== undefined ? Number(req.body.age) : undefined,
    });

    res.status(201).json(user);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/users", async (_req, res) => {
  try {
    const users = await User.find().populate("courseIds").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("courseIds");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    handleError(res, error);
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const updates = {};

    if (req.body.name !== undefined) {
      updates.name = sanitizeText(req.body.name);
    }

    if (req.body.email !== undefined) {
      updates.email = sanitizeText(req.body.email);
    }

    if (req.body.age !== undefined) {
      updates.age = Number(req.body.age);
    }

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

app.post("/api/courses", async (req, res) => {
  try {
    const course = await Course.create({
      title: sanitizeText(req.body.title),
      description: sanitizeText(req.body.description || ""),
      price: req.body.price !== undefined ? Number(req.body.price) : undefined,
      instructor: req.body.instructor,
      students: Array.isArray(req.body.students) ? req.body.students : [],
    });

    await User.findByIdAndUpdate(
      course.instructor,
      { $addToSet: { courseIds: course._id } },
      { new: true }
    );

    res.status(201).json(course);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/courses", async (_req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor")
      .populate("students")
      .sort({ createdAt: -1 });

    res.status(200).json(courses);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor")
      .populate("students");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error) {
    handleError(res, error);
  }
});

app.put("/api/courses/:id", async (req, res) => {
  try {
    const updates = {};

    if (req.body.title !== undefined) {
      updates.title = sanitizeText(req.body.title);
    }

    if (req.body.description !== undefined) {
      updates.description = sanitizeText(req.body.description);
    }

    if (req.body.price !== undefined) {
      updates.price = Number(req.body.price);
    }

    if (req.body.instructor !== undefined) {
      updates.instructor = req.body.instructor;
    }

    if (req.body.students !== undefined) {
      updates.students = req.body.students;
    }

    const course = await Course.findByIdAndUpdate(req.params.id, { $set: updates }, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(course);
  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await User.findByIdAndUpdate(
      course.instructor,
      { $pull: { courseIds: course._id } },
      { new: true }
    );

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    handleError(res, error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

