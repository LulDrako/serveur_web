const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const port = 4001;

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/todo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Gérer l'événement de connexion
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("We're connected to the database!");
});

// Définition du schéma et du modèle Mongoose directement dans server.js
const taskSchema = new mongoose.Schema({
  description: String,
  is_completed: { type: Boolean, default: false }
});
const Task = mongoose.model('Task', taskSchema);
app.use(express.json());

// Serveur des fichiers statiques depuis le dossier 'todo'
app.use(express.static(path.join(__dirname, 'todo')));

// Route pour la page d'accueil - sert 'index.html' depuis le dossier 'todo'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour obtenir toutes les tâches
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ... (les autres parties de votre fichier server.js restent inchangées)

// Route pour obtenir toutes les tâches avec pagination
// Route pour obtenir toutes les tâches avec pagination
app.get('/taskslimit', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  try {
    const totalCount = await Task.countDocuments();
    const tasks = await Task.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Si la page demandée est supérieure au nombre total de pages, renvoyez une erreur
    if ((page - 1) * limit >= totalCount) {
      return res.status(404).json({ message: "Page not found" });
    }

    res.json({
      tasks: tasks,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Route pour ajouter une nouvelle tâche
app.post('/tasks', async (req, res) => {
  try {
    const newTask = new Task({ description: req.body.description });
    const task = await newTask.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour marquer une tâche comme complétée
app.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { is_completed: true }, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour supprimer une tâche
app.delete('/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});