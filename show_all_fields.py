import json

with open('mapping_fields.json', 'r', encoding='utf-8') as f:
    data = json.load(f)['data']

print("=== mapping_settings_standard_fields 전체 내용 ===\n")

for row in data:
    print(f"market_name: {row['market_name']}")
    print(f"id: {row['id']}")
    
    non_empty_fields = []
    for i in range(1, 45):
        field_key = f'field_{i}'
        value = row.get(field_key, '')
        if value and value.strip():
            non_empty_fields.append(f"  {field_key} = {value}")
    
    if non_empty_fields:
        print("\n".join(non_empty_fields))
    
    print("-" * 80)
    print()
