const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.ts', 'utf-8');
code = code.replace(
  "algorithms: ['HS256'],",
  "algorithms: ['HS256'],\n      clockTolerance: 120,"
);
fs.writeFileSync('src/lib/auth.ts', code);
