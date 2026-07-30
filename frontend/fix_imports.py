import os
import re

files = [
    'src/app/gerente/historico/page.tsx',
    'src/app/gerente/page.tsx'
]

for path in files:
    with open(path, 'r') as f:
        content = f.read()

    # Add import at the top
    if 'import { formatCurrency }' not in content:
        import_match = list(re.finditer(r'^import .*?;$', content, re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            insert_pos = last_import.end()
            content = content[:insert_pos] + "\nimport { formatCurrency } from '@/utils/formatters';" + content[insert_pos:]
            
    # Remove inline formatCurrency definitions
    # Either:
    # const formatCurrencyLocal = (val: string | number) => {
    #   return formatCurrency(val);
    # };
    # Or:
    # const formatCurrency = (val: string | number) => {
    #   return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    # };
    content = re.sub(r'\s*const formatCurrency(?:Local)? = \(val: string \| number\) => \{[\s\S]*?\};\n', '\n', content)

    with open(path, 'w') as f:
        f.write(content)
