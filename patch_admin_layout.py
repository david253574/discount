with open('src/app/admin/layout.tsx', 'r') as f:
    content = f.read()

if "export const dynamic = 'force-dynamic'" not in content:
    content = "export const dynamic = 'force-dynamic';\n" + content

with open('src/app/admin/layout.tsx', 'w') as f:
    f.write(content)
