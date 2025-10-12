import json

with open('mapping_fields.json', 'r', encoding='utf-8') as f:
    data = json.load(f)['data']

english = next((d for d in data if d['id'] == 12), None)

if english:
    print("=== DB 규칙 (영문필드명) ===")
    for i in range(1, 45):
        field_key = f'field_{i}'
        value = english.get(field_key, '')
        if value:
            print(f"{field_key} = {value}")
