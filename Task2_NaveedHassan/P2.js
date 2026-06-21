const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let users = [];

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend API is running'
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    count: users.length,
    users
  });
});

app.post('/api/users', (req, res) => {
  const { name, email, age } = req.body;

  if (!name || !email || age === undefined) {
    return res.status(400).json({
      message: 'Name, email, and age are required'
    });
  }

  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      message: 'Name must be a string with at least 2 characters'
    });
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      message: 'Email must be a valid email address'
    });
  }

  if (!Number.isInteger(age) || age < 0 || age > 120) {
    return res.status(400).json({
      message: 'Age must be a whole number between 0 and 120'
    });
  }

  const newUser = {
    id: users.length + 1,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    age
  };

  users.push(newUser);

  res.status(201).json({
    message: 'User created successfully',
    user: newUser
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

