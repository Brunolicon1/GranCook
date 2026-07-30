import os
import re

directories = ['src/components', 'src/app', 'src/hooks']

pattern = re.compile(r'R\$\s*\{([^}]+)\.toFixed\(2\)\.replace\([\'"]\.[\'"],\s*[\'"],[\'"]\)\}')

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    content = f.read()
                
                new_content, count = pattern.subn(lambda m: '{formatCurrency(' + m.group(1) + ')}', content)
                
                # Also replace  R$ {Number(val).toFixed(2).replace('.', ',')} if it spans multiple nodes but wait, regex handles it.
                # Just to be sure, let's also do a second pass for `R$ {Number(produto.preco_venda).toFixed(2).replace('.', ',')}`
                
                if count > 0:
                    if 'import { formatCurrency' not in new_content:
                        # Find last import
                        import_match = list(re.finditer(r'^import .*?;$', new_content, re.MULTILINE))
                        if import_match:
                            last_import = import_match[-1]
                            insert_pos = last_import.end()
                            new_content = new_content[:insert_pos] + "\nimport { formatCurrency } from '@/utils/formatters';" + new_content[insert_pos:]
                        else:
                            new_content = "import { formatCurrency } from '@/utils/formatters';\n" + new_content
                            
                    with open(path, 'w') as f:
                        f.write(new_content)
                    print(f"Refactored {count} instances in {path}")
