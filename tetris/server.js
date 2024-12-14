const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const highScoreFilePath = path.join(__dirname, 'highscore.txt');

app.use(express.static('public'));

app.get('/get-high-score', (req, res) => {
    fs.readFile(highScoreFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Ошибка чтения файла');
        }
        const highScore = parseInt(data, 10) || 0;
        res.json({ highScore });
    });
});

app.post('/save-high-score', express.json(), (req, res) => {
    const { score } = req.body;
    fs.writeFile(highScoreFilePath, score.toString(), 'utf8', (err) => {
        if (err) {
            return res.status(500).send('Ошибка записи в файл');
        }
        res.send('Счет сохранен');
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
