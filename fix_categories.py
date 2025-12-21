#!/usr/bin/env python3
import re

with open('src/config/industries/industry-taxonomy.ts', 'r') as f:
    content = f.read()

# Category mappings
category_map = {
    "professional_services": "professional_services",
    "technology": "technology",
    "creative": "creative",
    "construction_property": "construction_property",
    "healthcare": "healthcare",
    "hospitality": "hospitality",
    "retail": "retail",
    "manufacturing": "manufacturing",
    "wholesale": "wholesale",
    "energy": "energy",
    "charity": "charity",
    "travel": "travel",
    "agriculture": "agriculture",
    "financial_services": "financial_services",
    "other_services": "other_services",
}

# For each category, find its industries section and add category property
for cat_code, cat_value in category_map.items():
    # Match: category: "X", ... industries: [ ... ]
    pattern = rf'(category:\s*"{cat_code}",[\s\S]*?industries:\s*\[)([\s\S]*?)(\s+\]\s+\}})'
    
    def add_category_property(match):
        header = match.group(1)
        industries = match.group(2)
        footer = match.group(3)
        
        # Add category to Industry objects that have sicCodes
        # Match: { code: "X", name: Y, sicCodes: (not preceded by category)
        def add_to_industry(m):
            return m.group(1) + f'\n        category: "{cat_value}",' + m.group(2)
        
        industries_fixed = re.sub(
            r'(\{\s*code:\s*"[^"]+",)\s+name:([^,]+,\s+sicCodes:)',
            add_to_industry,
            industries
        )
        
        return header + industries_fixed + footer
    
    content = re.sub(pattern, add_category_property, content, flags=re.MULTILINE)

with open('src/config/industries/industry-taxonomy.ts', 'w') as f:
    f.write(content)

print("Categories added successfully")

