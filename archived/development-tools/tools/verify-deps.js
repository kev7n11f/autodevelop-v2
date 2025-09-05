const fs = require('fs');
const out = [];
function check(name) {
  try {
    require(name);
    out.push({module: name, ok: true});
  } catch (e) {
    out.push({module: name, ok: false, error: e && e.code ? e.code : e.message});
  }
}
['bcrypt','multer','express','winston'].forEach(check);
fs.writeFileSync('tools/deps-result.json', JSON.stringify(out, null, 2));
console.log('WROTE tools/deps-result.json');
