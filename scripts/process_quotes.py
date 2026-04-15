
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
    
    # Improved regex for source lines
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
                # Filter out very short things that might just be headers
                if len(quote_text) > 20: 
                    category = categorize_quote(quote_text)
                    quotes.append({
                        "quote_text": quote_text,
                        "category": category,
                        "source": line
                    })
                current_quote_lines = []
            # Sometimes a source line is followed by another source line, we just ignore them
        else:
            current_quote_lines.append(line)
            
    return quotes

if __name__ == "__main__":
    quotes = parse_quotes('quotes.txt')
    print(f"Parsed {len(quotes)} quotes.")
    
    # Generate SQL
    with open('populate_quotes.sql', 'w', encoding='utf-8') as f:
        # Clear table first to avoid duplication on re-run
        f.write("TRUNCATE TABLE public.rumi_quotes;\n")
        f.write("INSERT INTO public.rumi_quotes (quote_text, category) VALUES\n")
        values = []
        for q in quotes:
            text = q['quote_text'].replace("'", "''")
            values.append(f"('{text}', '{q['category']}')")
        
        f.write(",\n".join(values))
        f.write(";\n")
    
    print("Generated populate_quotes.sql")
