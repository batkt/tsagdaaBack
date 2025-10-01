const express = require('express');
const router = express.Router();
const {
  medegdelAvya,
  medegdelBurtgeh,
  medegdelUnshsan,
} = require('../controller/medegdelController');
const { tokenShalgakh } = require('zevback');

router.get('/medegdelAvya', tokenShalgakh, medegdelAvya);

router.post('/medegdelBurtgeh', tokenShalgakh, medegdelBurtgeh);

router.put('/medegdelUnshsan/:id', tokenShalgakh, medegdelUnshsan);

module.exports = router;
