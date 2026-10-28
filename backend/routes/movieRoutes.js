const express = require('express');
const c = require('../controllers/movieController');

const router = express.Router();

// fixed paths must come before '/:id'
router.get('/watch-next', c.watchNext);
router.get('/stats', c.getStats);

router.route('/').get(c.listMovies).post(c.createMovie);
router.route('/:id').put(c.updateMovie).delete(c.deleteMovie);
router.patch('/:id/status', c.changeStatus);
router.patch('/:id/rating', c.rateMovie);

module.exports = router;