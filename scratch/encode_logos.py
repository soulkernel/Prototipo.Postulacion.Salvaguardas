import base64
import json

with open('LogoGLF.png', 'rb') as f:
    b1 = base64.b64encode(f.read()).decode('utf-8')
with open('01-logo-horizontal-blanco.png', 'rb') as f:
    b2 = base64.b64encode(f.read()).decode('utf-8')

with open('scratch_logos.json', 'w') as out:
    json.dump({'logo': f'data:image/png;base64,{b1}', 'logo_white': f'data:image/png;base64,{b2}'}, out)

print('Successfully encoded logos!')
