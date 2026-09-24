import re

with open('src/app/order/[id]/page.tsx', 'r') as f:
    content = f.read()

# Remove step 3 block entirely
content = re.sub(r'\{step === 3 && paymentType !== \'BITCOIN\' && \((.*?)\)\}', '', content, flags=re.DOTALL)

# Remove step 4 block entirely
content = re.sub(r'\{step === 4 && paymentType !== \'BITCOIN\' && \((.*?)\)\}', '', content, flags=re.DOTALL)

with open('src/app/order/[id]/page.tsx', 'w') as f:
    f.write(content)
