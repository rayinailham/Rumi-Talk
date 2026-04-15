
import sys
import os
import re

def categorize_quote(text):
    text = text.lower()
    if any(word in text for word in ['love', 'heart', 'beloved', 'lover', 'friend', 'companion']):
        return 'Love'
    if any(word in text for word in ['god', 'faith', 'soul', 'spirit', 'divine', 'prayer', 'allah', 'lord', 'religion', 'prophet', 'heaven', 'angel']):
        return 'Spirituality'
    if any(word in text for word in ['wisdom', 'intellect', 'reason', 'knowledge', 'learning', 'mind', 'thought', 'sense']):
        return 'Wisdom'
    if any(word in text for word in ['self', 'ego', 'id', 'man', 'human']):
        return 'Self'
    if any(word in text for word in ['rose', 'sea', 'sun', 'water', 'garden', 'tree', 'nature', 'flower', 'ocean', 'river', 'sky', 'night', 'day']):
        return 'Nature'
    if any(word in text for word in ['pain', 'grief', 'sorrow', 'patience', 'suffering', 'grieve', 'weep', 'tears', 'wound']):
        return 'Patience'
    return 'Miscellaneous'

def parse_quotes(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    quotes = []
    current_quote_lines = []
    source_patterns = [
        re.compile(r'^".*", no\. \d+'),
        re.compile(r'.*\(tr\. .*\)'),
        re.compile(r'.*\(ed\. .*\)'),
        re.compile(r'.*, no\. \d+'),
        re.compile(r'^([I|V|X|L]+, \d+.*)'),
        re.compile(r'.*p\. \d+.*'),
        re.compile(r'.*pp\. \d+.*'),
        re.compile(r'.*\(\d{4}\)'),
        re.compile(r'^Reported in .*'),
        re.compile(r'^Compare: .*'),
        re.compile(r'^(Masnavi|Divan-i Shams|Attributed|Quotes|.*Edited by .*)', re.IGNORECASE)
    ]

    def is_source(line):
        return any(p.match(line) for p in source_patterns)

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if is_source(line):
            if current_quote_lines:
                quote_text = " ".join(current_quote_lines)
                if len(quote_text) > 20: 
                    category = categorize_quote(quote_text)
                    quotes.append({"quote_text": quote_text, "category": category})
                current_quote_lines = []
        else:
            current_quote_lines.append(line)
    return quotes

if __name__ == "__main__":
    quotes = parse_quotes('quotes.txt')
    print(f"Parsed {len(quotes)} quotes.")
    
    # Generate batch SQL scripts
    batch_size = 50
    for i in range(0, len(quotes), batch_size):
        batch = quotes[i:i + batch_size]
        filename = f'scripts/populate_batch_{i//batch_size}.sql'
        with open(filename, 'w', encoding='utf-8') as f:
            if i == 0:
                f.write("TRUNCATE TABLE public.rumi_quotes;\n")
            f.write("INSERT INTO public.rumi_quotes (quote_text, category) VALUES\n")
            values = []
            for q in batch:
                text = q['quote_text'].replace("'", "''")
                values.append(f"('{text}', '{q['category']}')")
            f.write(",\n".join(values))
            f.write(";\n")
    print(f"Generated { (len(quotes) + batch_size - 1) // batch_size } batch SQL files in scripts/")
