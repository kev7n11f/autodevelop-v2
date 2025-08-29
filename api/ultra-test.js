// Ultra-minimal test function for Vercel debugging
module.exports = function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  var data = {
    status: 'ok',
    message: 'Ultra-minimal API test',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  };
  
  res.status(200).json(data);
};