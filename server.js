const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Images only!'));
        }
    }
});

// Ensure uploads directory and posts.json exist
async function initialize() {
    try {
        await fs.mkdir('uploads', { recursive: true });
        try {
            await fs.access('posts.json');
        } catch {
            await fs.writeFile('posts.json', '[]');
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
}
initialize();

// Routes
app.post('/api/posts', upload.single('image'), async (req, res) => {
    try {
        const { description } = req.body;
        const imagePath = `/uploads/${req.file.filename}`;

        const posts = JSON.parse(await fs.readFile('posts.json'));
        posts.push({
            imagePath,
            description,
            timestamp: new Date().toISOString()
        });

        await fs.writeFile('posts.json', JSON.stringify(posts, null, 2));
        res.status(201).json({ message: 'Post created' });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

app.get('/api/posts', async (req, res) => {
    try {
        const posts = JSON.parse(await fs.readFile('posts.json'));
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});