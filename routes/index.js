const express = require('express');
const router  = express.Router();

/* GET home page */
router.get('/', (req, res, next) => {
  res.render('index');
});

router.post('/test', (req, res, next) => {
  console.log(req);
  res.send('sup');
})

module.exports = router;
