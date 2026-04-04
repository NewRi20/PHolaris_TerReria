"""
Mappings for standardizing and normalizing data across the application.

Includes region codes/names, subject categories, and other lookup tables.
"""

# Region code to full name mapping with multiple format variations
REGION_MAPPING = {
    # Code format (R1, R2, etc.)
    "R1": "Region I (Ilocos Region)",
    "R2": "Region II (Cagayan Valley)",
    "R3": "Region III (Central Luzon)",
    "R4": "Region IV-A (CALABARZON)",
    "R4A": "Region IV-A (CALABARZON)",
    "R5": "Region V (Bicol Region)",
    "R6": "Region VI (Western Visayas)",
    "R7": "Region VII (Central Visayas)",
    "R8": "Region VIII (Eastern Visayas)",
    "R9": "Region IX (Zamboanga Peninsula)",
    "R10": "Region X (Northern Mindanao)",
    "R11": "Region XI (Davao Region)",
    "R12": "Region XII (SOCCSKSARGEN)",
    "R13": "Region XIII (CARAGA)",
    "NCR": "National Capital Region",
    # Simplified format (Region 1, Region 2, etc.) from AI generation
    "Region 1": "Region I (Ilocos Region)",
    "Region 2": "Region II (Cagayan Valley)",
    "Region 3": "Region III (Central Luzon)",
    "Region 4": "Region IV-A (CALABARZON)",
    "Region 4A": "Region IV-A (CALABARZON)",
    "Region 5": "Region V (Bicol Region)",
    "Region 6": "Region VI (Western Visayas)",
    "Region 7": "Region VII (Central Visayas)",
    "Region 8": "Region VIII (Eastern Visayas)",
    "Region 9": "Region IX (Zamboanga Peninsula)",
    "Region 10": "Region X (Northern Mindanao)",
    "Region 11": "Region XI (Davao Region)",
    "Region 12": "Region XII (SOCCSKSARGEN)",
    "Region 13": "Region XIII (CARAGA)",
    # Special administrative regions
    "BARMM": "Bangsamoro Autonomous Region in Muslim Mindanao",
    "CAR": "Cordillera Administrative Region",
    "MIMAROPA": "MIMAROPA (Mimaropa Provinces)",
    "NIR": "Northern Island Region",
}

# Reverse mapping for quick code lookup
CODE_MAP = {
    "R1": "1",
    "R2": "2",
    "R3": "3",
    "R4": "4",
    "R4A": "4A",
    "R5": "5",
    "R6": "6",
    "R7": "7",
    "R8": "8",
    "R9": "9",
    "R10": "10",
    "R11": "11",
    "R12": "12",
    "R13": "13",
}

# Subject category mapping - maps broad categories to specific subjects in database
SUBJECT_CATEGORY_MAPPING = {
    "Science": [
        "Science",
        "Biology",
        "Physics",
        "Chemistry",
        "Earth Science",
        "Environmental Science",
        "General Science",
    ],
    "Math": [
        "Math",
        "Mathematics",
        "Algebra",
        "Geometry",
        "Statistics",
        "Calculus",
    ],
    "English": ["English"],
    "Cross-Curricular": [
        "Science",
        "Biology",
        "Physics",
        "Chemistry",
        "Earth Science",
        "Environmental Science",
        "General Science",
        "Math",
        "Mathematics",
        "Algebra",
        "Geometry",
        "Statistics",
        "Calculus",
        "English",
    ],
    "Earth Science": ["Earth Science"],
    "Algebra": ["Algebra"],
    "Biology": ["Biology"],
    "Calculus": ["Calculus"],
    "Chemistry": ["Chemistry"],
    "Environmental Science": ["Environmental Science"],
    "General Science": ["General Science"],
    "Geometry": ["Geometry"],
    "Mathematics": ["Mathematics", "Math"],
    "Physics": ["Physics"],
    "Statistics": ["Statistics"],
}
