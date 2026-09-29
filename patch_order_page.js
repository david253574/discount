const fs = require('fs');
let code = fs.readFileSync('src/app/order/[id]/page.tsx', 'utf-8');

const replaceBlock = `
      if (res.ok) {
        const data = await res.json();
        router.push(\`/payment/\${data.order.id}\`);
      } else if (res.status === 401) {
        router.push(\`/login?redirect=/order/\${model.slug}\`);
      } else {
        const err = await res.json().catch(()=>({}));
        alert(err.error || 'An error occurred processing your request.');
      }
`;

code = code.replace(/if \(res\.ok\) \{[\s\S]*?\} else \{[\s\S]*?alert\([^)]+\);[\s\S]*?\}/, replaceBlock.trim());

fs.writeFileSync('src/app/order/[id]/page.tsx', code);
