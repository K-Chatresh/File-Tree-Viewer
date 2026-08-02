const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files in current directory
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'tree_viewer.html'));
});

app.listen(PORT, () => {
  console.log(`Tree Viewer running at http://localhost:${PORT}`);
});
