import re
from typing import Dict, Any, List, Optional

class DocumentUnderstandingService:
    """
    Deterministic document understanding layer.
    Structures raw OCR text and contours into clean domain entities.
    Does NOT declare documents genuine or fraudulent.
    """

    @staticmethod
    def analyze_document(raw_text: str, boxes: List[Dict[str, Any]], declared_type: str = "Degree Certificate") -> Dict[str, Any]:
        text = raw_text.strip()
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        extracted_fields = {}
        field_positions = {}

        # 1. Certificate ID regex patterns
        cert_match = re.search(r"(?:Certificate\s*ID|Cert\s*No|Certificate\s*Number)[:\s\-#]*([A-Z0-9\-_]+)", text, re.IGNORECASE)
        if not cert_match:
            cert_match = re.search(r"\b(CERT[-–][0-9]{4}[-–][A-Z0-9\-]+)\b", text, re.IGNORECASE)
        if not cert_match:
            cert_match = re.search(r"\b(ID[-–:]?[0-9]{5,15})\b", text)

        if cert_match:
            extracted_fields["certificate_id"] = cert_match.group(1).strip()

        # 2. Candidate Name
        # Look for "This is to certify that" followed by name line
        name_found = False
        for idx, line in enumerate(lines):
            if re.search(r"certify that|conferred upon|awarded to|presented to", line, re.IGNORECASE):
                if idx + 1 < len(lines):
                    candidate_line = lines[idx + 1].strip()
                    # Filter out any non-name lines
                    if not candidate_line.lower().startswith("date of birth") and len(candidate_line.split()) >= 2:
                        extracted_fields["name"] = candidate_line.title()
                        name_found = True
                        break
        
        if not name_found:
            name_pattern = re.search(r"(?:certify that|conferred upon|awarded to)\s*[\r\n]+\s*([A-Za-z\s]{3,40})", text, re.IGNORECASE)
            if name_pattern:
                extracted_fields["name"] = name_pattern.group(1).splitlines()[0].strip().title()

        # 3. Date of Birth
        dob_match = re.search(r"(?:DOB|Date of Birth|Born on)[:\s]*([0-3]?[0-9][/\-\.][0-1]?[0-9][/\-\.][1-2][0-9]{3})", text, re.IGNORECASE)
        if not dob_match:
            dob_match = re.search(r"\b([0-3][0-9]/[0-1][0-9]/[1-2][0-9]{3})\b", text)
        if dob_match:
            extracted_fields["dob"] = dob_match.group(1).strip()

        # 4. Institution
        inst_match = re.search(r"\b((?:National Institute|Apex Institute|Central Polytechnic|St\. Xavier|University of|Delhi University|Indian Institute)[A-Za-z\s&]{3,50})\b", text, re.IGNORECASE)
        if not inst_match and lines:
            # Often first line of certificate
            for line in lines[:3]:
                if any(w in line.lower() for w in ["institute", "university", "college", "academy"]):
                    extracted_fields["institution"] = line.strip().title()
                    break
        elif inst_match:
            extracted_fields["institution"] = inst_match.group(0).splitlines()[0].strip().title()

        # 5. Course / Degree
        course_match = re.search(r"\b(Bachelor of [A-Za-z\s]+|Master of [A-Za-z\s]+|Diploma in [A-Za-z\s]+|Doctor of [A-Za-z\s]+|Honorary Doctor of [A-Za-z\s]+)\b", text, re.IGNORECASE)
        if course_match:
            extracted_fields["course"] = course_match.group(0).splitlines()[0].strip().title()

        # 6. Issue Year
        year_match = re.search(r"\b(20[1-3][0-9])\b", text)
        if year_match:
            try:
                extracted_fields["issue_year"] = int(year_match.group(1))
            except ValueError:
                pass

        # Match spatial coordinates from OCR boxes
        for f_name, f_val in extracted_fields.items():
            str_val = str(f_val).lower()
            matched_box = None
            for b in boxes:
                box_text = b.get("text", "").lower()
                if box_text and (box_text in str_val or str_val in box_text):
                    matched_box = b
                    break
            if matched_box:
                field_positions[f_name] = matched_box

        return {
            "document_type": declared_type,
            "extracted_fields": extracted_fields,
            "field_positions": field_positions,
            "field_count": len(extracted_fields),
            "explanation": f"Extracted {len(extracted_fields)} structured entities using optical layout mapping."
        }
