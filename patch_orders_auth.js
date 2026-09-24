const fs = require('fs');

const path = 'src/app/api/orders/route.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('const session = await getSession()') && content.includes('export async function POST(request: Request) {')) {
  content = content.replace(
    'export async function POST(request: Request) {',
    `import { getSession } from '@/lib/auth'\n\nexport async function POST(request: Request) {`
  );
  
  content = content.replace(
    `let orderData: any = {`,
    `const session = await getSession();\n    let orderData: any = {\n      userId: session ? session.id : null,`
  );
  
  // Remove the duplicate getSession import I appended earlier
  content = content.replace(/import \{ getSession \} from '@\/lib\/auth'/g, (match, offset, str) => {
    return offset === str.indexOf(match) ? match : ''; // keep first only
  });
  
  fs.writeFileSync(path, content);
}
