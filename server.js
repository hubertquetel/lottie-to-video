const express = require('express');
const multer = require('multer');
const renderLottie = require('puppeteer-lottie');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

// Configuration multer pour l'upload de fichiers
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(express.json());

// Route de conversion Lottie vers MP4
app.post('/convert', upload.single('lottie'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier Lottie fourni' });
    }

    const inputPath = req.file.path;
    const outputPath = `output/video_${Date.now()}.mp4`;
    
    // Options configurables avec désactivation du sandbox
    const options = {
      path: inputPath,
      output: outputPath,
      width: parseInt(req.body.width) || 640,
      height: parseInt(req.body.height) || 480,
      quiet: false,
      launchOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    };

    // Conversion avec puppeteer-lottie
    await renderLottie(options);

    // Retour du fichier vidéo
    res.download(outputPath, (err) => {
      if (err) {
        console.error('Erreur lors du téléchargement:', err);
      }
      // Nettoyage des fichiers temporaires
      fs.unlink(inputPath).catch(console.error);
      fs.unlink(outputPath).catch(console.error);
    });

  } catch (error) {
    console.error('Erreur conversion:', error);
    res.status(500).json({ error: 'Erreur durant la conversion' });
  }
});

// Route pour conversion via URL JSON
app.post('/convert-url', async (req, res) => {
  try {
    const { jsonUrl, width = 640, height = 480 } = req.body;
    
    if (!jsonUrl) {
      return res.status(400).json({ error: 'URL JSON manquante' });
    }

    const outputPath = `output/video_${Date.now()}.mp4`;
    
    // Téléchargement du JSON depuis l'URL
    const response = await fetch(jsonUrl);
    const animationData = await response.json();

    const options = {
      animationData,
      output: outputPath,
      width: parseInt(width),
      height: parseInt(height),
      launchOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    };

    await renderLottie(options);

    res.download(outputPath, (err) => {
      if (err) console.error(err);
      fs.unlink(outputPath).catch(console.error);
    });

  } catch (error) {
    console.error('Erreur conversion URL:', error);
    res.status(500).json({ error: 'Erreur durant la conversion' });
  }
});

// Création du dossier output
fs.mkdir('output', { recursive: true }).catch(console.error);

// Endpoint de santé
app.get('/health', (req, res) => res.status(200).send('OK'));

// Endpoint racine
app.get('/', (req, res) => res.status(200).send('API Lottie to Video is running'));

app.listen(port, () => {
  console.log(`API Lottie vers Vidéo sur http://localhost:${port}`);
});
