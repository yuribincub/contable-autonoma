// backend/src/routes/clients.js
const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clientsController');

router.get('/',       clientsController.getAll);
router.post('/',      clientsController.create);
router.get('/:id',    clientsController.getOne);
router.put('/:id',    clientsController.update);
router.delete('/:id', clientsController.remove);

module.exports = router;
