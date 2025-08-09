const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Middleware
const { verifyToken } = require('../middleware/auth.middleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: creatorId_documentType_timestamp.ext
    const ext = path.extname(file.originalname);
    const filename = `${req.creator.id}_${req.body.documentType || 'document'}_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only specific file types
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPEG, PNG, and GIF files are allowed.'));
    }
  }
});

/**
 * Upload tax form (W9/W8)
 */
router.post('/tax-form', verifyToken, upload.single('taxForm'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    
    res.json({
      message: 'Tax form uploaded successfully',
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

  } catch (error) {
    console.error('Tax form upload error:', error);
    res.status(500).json({ error: 'Failed to upload tax form' });
  }
});

/**
 * Upload identity verification document
 */
router.post('/identity', verifyToken, upload.single('identityDocument'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    
    res.json({
      message: 'Identity document uploaded successfully',
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

  } catch (error) {
    console.error('Identity document upload error:', error);
    res.status(500).json({ error: 'Failed to upload identity document' });
  }
});

/**
 * Upload general compliance document
 */
router.post('/document', verifyToken, upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { documentType } = req.body;
    const fileUrl = `/uploads/documents/${req.file.filename}`;
    
    res.json({
      message: 'Document uploaded successfully',
      documentType: documentType,
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });

  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

/**
 * Get uploaded documents for a creator
 */
router.get('/documents', verifyToken, (req, res) => {
  try {
    const creatorId = req.creator.id;
    const uploadsDir = path.join(__dirname, '../uploads/documents');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ documents: [] });
    }

    const files = fs.readdirSync(uploadsDir);
    const creatorFiles = files.filter(file => file.startsWith(creatorId));
    
    const documents = creatorFiles.map(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        fileName: file,
        originalName: file.split('_').slice(2).join('_'), // Remove creatorId and documentType prefix
        uploadDate: stats.mtime,
        size: stats.size,
        url: `/uploads/documents/${file}`
      };
    });

    res.json({ documents });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

/**
 * Delete a document
 */
router.delete('/document/:filename', verifyToken, (req, res) => {
  try {
    const { filename } = req.params;
    const creatorId = req.creator.id;
    
    // Security check: ensure the file belongs to the requesting creator
    if (!filename.startsWith(creatorId)) {
      return res.status(403).json({ error: 'Unauthorized access to document' });
    }

    const filePath = path.join(__dirname, '../uploads/documents', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Document deleted successfully' });
    } else {
      res.status(404).json({ error: 'Document not found' });
    }

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;


