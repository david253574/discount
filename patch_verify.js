const fs = require('fs');
let code = fs.readFileSync('src/lib/auth.ts', 'utf-8');

code = code.replace(
`    return null;
  }
}

export async function getSession()`,
`    return null;
  }
}

export async function getSession()`
); // Oops, I'll just use replace_file_content

