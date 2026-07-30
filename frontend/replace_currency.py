import os
import re

directories = ['src/components', 'src/app', 'src/hooks']

pattern = re.compile(r'R\$\s*\{([^}]+)\.toFixed\(2\)\.replace\(\'.\',\s*\',\',\?\)\}')
# Note: we will replace `R$ {val.toFixed(2).replace('.', ',')}` with `{formatCurrency(val)}`
# And `R$ {(val).toFixed(2).replace('.', ',')}` -> `{formatCurrency(val)}`

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r') as f:
                    content = f.read()
                
                if 'toFixed(2)' in content:
                    # Let's just do it manually with multi_replace_file_content if this fails.
                    pass
