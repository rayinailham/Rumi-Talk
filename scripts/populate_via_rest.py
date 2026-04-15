import requests
import json
import os
import time

def populate():
    json_path = "scripts/quotes_with_embeddings.json"
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        quotes = json.load(f)

    url_base = "https://mstqmqxtqgmorqaynnpn.supabase.co/rest/v1/rumi_quotes"
    anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdHFtcXh0cWdtb3JxYXlubnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTcyNjYsImV4cCI6MjA5MTgzMzI2Nn0.KDWuBGFw9CAv-OoeguGn0TbQDM6YFBdP45JRvbx5pZo"
    
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    total = len(quotes)
    print(f"Starting population of {total} quotes...")

    for i, quote in enumerate(quotes):
        id = quote.get('id')
        embedding = quote.get('embedding')
        
        if not id or not embedding:
            continue
            
        url = f"{url_base}?id=eq.{id}"
        data = {"embedding": embedding}
        
        try:
            response = requests.patch(url, headers=headers, json=data)
            if response.status_code == 204:
                if (i + 1) % 50 == 0:
                    print(f"Processed {i + 1}/{total}...")
            else:
                print(f"Error updating {id}: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Exception for {id}: {e}")
            
    print("Population complete!")

if __name__ == "__main__":
    populate()
