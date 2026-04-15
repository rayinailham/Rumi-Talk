import json
import os

# Create scripts directory if it doesn't exist
os.makedirs('scripts', exist_ok=True)

input_file = r'C:\Users\rayin\.gemini\antigravity\brain\c84fad2c-92fe-46f1-bfea-f9591b629e26\.system_generated\steps\180\output.txt'
output_file = r'd:\(program-projects)\Rumi-Talk\scripts\quotes.json'

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)
    result_text = data['result']
    
    # Extract JSON part from the result text
    start_marker = '<untrusted-data-656283c0-4b88-434b-8c37-79fccef7ca6a>\n'
    end_marker = '\n</untrusted-data-656283c0-4b88-434b-8c37-79fccef7ca6a>'
    
    start_idx = result_text.find(start_marker) + len(start_marker)
    end_idx = result_text.find(end_marker)
    
    json_str = result_text[start_idx:end_idx]
    quotes = json.loads(json_str)

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(quotes, f, indent=2)

print(f"Successfully saved {len(quotes)} quotes to {output_file}")
