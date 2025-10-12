import json

with open('mapping_fields.json', 'r', encoding='utf-8') as f:
    data = json.load(f)['data']

# 표준필드에서 field_31이 무엇인지 확인
standard = next((d for d in data if d['market_name'] == '표준필드'), None)
english = next((d for d in data if d['market_name'] == '영문필드명'), None)

if standard:
    print(f"표준필드 field_31 = {standard.get('field_31', '')}")
if english:
    print(f"영문필드명 field_31 = {english.get('field_31', '')}")

print("\n=== field_31 (할인금액/discount_amount) 각 마켓별 매핑 ===\n")

for row in data:
    market_name = row['market_name']
    field_31 = row.get('field_31', '')
    
    if field_31 and field_31.strip():
        print(f"{market_name:15s} → field_31 = {field_31}")
    else:
        print(f"{market_name:15s} → field_31 = (비어있음)")

