import json

with open('mapping_fields.json', 'r', encoding='utf-8') as f:
    data = json.load(f)['data']

print("=== field_27 (정산예정금액/settlement_amount) 각 마켓별 매핑 ===\n")

for row in data:
    market_name = row['market_name']
    field_27 = row.get('field_27', '')
    
    if field_27 and field_27.strip():
        print(f"{market_name:15s} → field_27 = {field_27}")
    else:
        print(f"{market_name:15s} → field_27 = (비어있음)")

