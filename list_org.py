import os

org_dir = os.path.join('images', 'Myroniuk', 'ORG')
out_file = 'images_org_list.txt'

files = []
if os.path.exists(org_dir):
    for f in os.listdir(org_dir):
        files.append(f)

with open(out_file, 'w', encoding='utf-8') as out:
    for f in sorted(files):
        out.write(f + '\n')

print(f"Listed {len(files)} files into {out_file}")
