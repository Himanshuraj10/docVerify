import re
from typing import Dict, Any, List, Optional

class DocumentUnderstandingService:
    """
    Layout-aware & spatial Document Understanding Layer for PAN Cards and Aadhaar Cards.
    Extracts ID Number, Cardholder Name, Date of Birth, and Document Type from the exact
    structural and spatial positions used on Indian Aadhaar Cards and PAN Cards.
    """

    NOISE_WORDS = (
        "GOVERNMENT", "GOVEMENT", "GOVEMMENT", "GOVT", "INDIA", "UNIQUE", "UNIGUE",
        "IDENTIFICATION", "AUTHORITY", "AADHAAR", "AADHAR", "ENROLMENT", "ISSUED",
        "ISSUE", "ADDRESS", "ADLRE", "AALRE", "PROOF", "CITIZENSHIP", "IDENTITY",
        "VERIFICATION", "ONLINE", "AUTHENTICATION", "SCANNING", "INCOME", "DEPARTMENT",
        "PERMANENT", "ACCOUNT", "NUMBER", "CARD", "FATHER", "SIGNATURE", "DIGITALLY",
        "SIGNED", "PHYSICAL", "PHYSICALLY", "VALID", "VALIDITY", "UNKNOWN", "CROP",
        "MARKUP", "SHARE", "MORE", "DEVICE", "IMAGE", "TEXT", "MALE", "FEMALE",
        "TEMALE", "VID", "HELP", "WWW", "UIDAI", "DIST", "PRADESH", "MADHYA"
    )

    @staticmethod
    def _clean_person_name(raw: str) -> Optional[str]:
        """Cleans OCR text of a person's name and filters out non-name headers/addresses."""
        s = raw.strip()
        # Fix common leading digit-for-letter OCR confusion in Title-case names (e.g. '5aloni' -> 'Saloni')
        s = re.sub(r"\b5([a-z]{2,})", r"S\1", s)
        s = re.sub(r"\b0([a-z]{2,})", r"O\1", s)
        s = re.sub(r"\b1([a-z]{2,})", r"I\1", s)
        # Keep only letters, spaces, and dots
        s = re.sub(r"[^A-Za-z\s\.]", " ", s)
        s = re.sub(r"\s+", " ", s).strip()
        if len(s) < 3 or len(s) > 45:
            return None
        u = s.upper()
        if any(nw in u for nw in DocumentUnderstandingService.NOISE_WORDS):
            return None
        words = [w for w in s.split() if len(w) >= 2 or (len(w) == 1 and w.isalpha())]
        if not words or len(words) > 5:
            return None
        return " ".join(words).title()

    @staticmethod
    def detect_document_type(raw_text: str, extracted_fields: Dict[str, Any], declared_type: str = "Auto-Detect") -> str:
        joined = raw_text.upper().replace(" ", "")
        cert_id = str(extracted_fields.get("certificate_id", "")).upper()

        # Check for PAN Card indicators
        is_pan_id = bool(re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", cert_id))
        if is_pan_id or "INCOMETAX" in joined or "PERMANENTACCOUNT" in joined or "ACCOUNTNUMBERCARD" in joined or "PANCARD" in joined:
            return "PAN Card"

        # Check for Aadhaar Card indicators
        is_aadhaar_id = bool(re.match(r"^\d{4}-\d{4}-\d{4}$", cert_id))
        if is_aadhaar_id or "UIDAI" in joined or "UNIQUEIDENTIFICATION" in joined or "UNIGUELDENT" in joined or "UNIQUERDANT" in joined or "AADHAAR" in joined or "AADHAR" in joined or "VID:" in joined:
            return "Aadhaar Card"

        # Check for Academic / Institutional Certificate indicators
        if any(w in joined for w in ["BACHELOROF", "MASTEROF", "DIPLOMAIN", "UNIVERSITY", "INSTITUTE"]):
            return "Degree Certificate"

        if declared_type and declared_type.lower() not in ("auto-detect", "auto", "automatic"):
            return declared_type

        return "Identity Document"

    @staticmethod
    def analyze_document(raw_text: str, boxes: List[Dict[str, Any]], declared_type: str = "Auto-Detect") -> Dict[str, Any]:
        text = raw_text.strip()
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        extracted_fields: Dict[str, Any] = {}
        field_positions: Dict[str, Any] = {}

        # ---------------------------------------------------------------------
        # 1. Extract Identity / Document Number (PAN 10-char or Aadhaar 12-digit)
        # ---------------------------------------------------------------------
        # A. Check explicit 10-char PAN pattern first (5 letters + 4 digits + 1 letter)
        pan_match = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b", text.upper())
        if pan_match:
            extracted_fields["certificate_id"] = pan_match.group(1).strip()

        # B. Check 12-digit Aadhaar number (excluding 16-digit VID numbers)
        if "certificate_id" not in extracted_fields:
            for line in lines:
                if "VID" in line.upper() or "ENROLMENT" in line.upper():
                    continue
                aadhaar_m = re.search(r"(?<!\d)(\d{4}[\s\-]?\d{4}[\s\-]?\d{4})(?!\d)", line)
                if aadhaar_m:
                    digits = re.sub(r"\D", "", aadhaar_m.group(1))
                    # Ignore 10-digit phone numbers or 12-digit numbers starting with 0/1
                    if len(digits) == 12 and digits[0] not in ("0", "1"):
                        extracted_fields["certificate_id"] = f"{digits[:4]}-{digits[4:8]}-{digits[8:]}"
                        break

        # C. Check labeled ID fallback
        if "certificate_id" not in extracted_fields:
            id_match = re.search(
                r"(?:Aadhaar\s*No|Aadhaar\s*Number|PAN\s*No|PAN\s*Number|Permanent\s*Account\s*Number|Document\s*ID|Certificate\s*ID|ID\s*No)[:\s\-#]*([A-Z0-9\-_ ]{8,18})",
                text,
                re.IGNORECASE
            )
            if id_match:
                candidate_id = id_match.group(1).strip()
                if not re.match(r"^(?:CARD|NUMBER|INDIA|GOVT|NAME)$", candidate_id, re.IGNORECASE):
                    extracted_fields["certificate_id"] = candidate_id

        # ---------------------------------------------------------------------
        # 2. Extract Date of Birth (DOB) — ignoring "Issued:" / "Issue Date:" / "Details as on:"
        # ---------------------------------------------------------------------
        dob_box: Optional[Dict[str, Any]] = None
        for b in boxes:
            b_txt = b.get("text", "").strip()
            u_txt = b_txt.upper()
            # Skip card issue date / download date lines on Aadhaar left border
            if any(skip_w in u_txt for skip_w in ("ISSUED", "ISSUEDATE", "ISSUEDALA", "IMSUED", "DETAILS", "ASON")):
                continue

            # Match explicit DOB line (including OCR variants like 'DOB:', '00B:', '0B:')
            if any(k in u_txt for k in ("DOB", "00B", "0B:", "BIRTH")):
                # Standard DD/MM/YYYY
                m1 = re.search(r"([0-3][0-9])[/\-\.]([0-1][0-9])[/\-\.]([1-2][0-9]{3})", b_txt)
                if m1:
                    extracted_fields["dob"] = f"{m1.group(1)}/{m1.group(2)}/{m1.group(3)}"
                    dob_box = b
                    break
                # Low-res OCR where first '/' was missed or read as '6' or '0' (e.g., '1009/2008' or '1069/2008')
                m2 = re.search(r"([0-3][0-9])[60]?([0-1][0-9])[/\-\.]([1-2][0-9]{3})", b_txt)
                if m2:
                    extracted_fields["dob"] = f"{m2.group(1)}/{m2.group(2)}/{m2.group(3)}"
                    dob_box = b
                    break
                m3 = re.search(r"([0-3][0-9])[6]([1-9])[/\-\.]([1-2][0-9]{3})", b_txt)
                if m3:
                    extracted_fields["dob"] = f"{m3.group(1)}/0{m3.group(2)}/{m3.group(3)}"
                    dob_box = b
                    break

        # Fallback: standalone DD/MM/YYYY box (e.g., on PAN Cards where 'Date of Birth' and '08/10/2006' are separate boxes)
        if "dob" not in extracted_fields:
            for b in boxes:
                b_txt = b.get("text", "").strip()
                u_txt = b_txt.upper()
                if any(skip_w in u_txt for skip_w in ("ISSUED", "ISSUEDATE", "ISSUEDALA", "IMSUED", "DETAILS", "ASON")):
                    continue
                m_date = re.search(r"\b([0-3][0-9]/[0-1][0-9]/[1-2][0-9]{3})\b", b_txt)
                if m_date:
                    extracted_fields["dob"] = m_date.group(1)
                    dob_box = b
                    break

        if "dob" not in extracted_fields:
            if re.search(r"DD[/\s]*MM[/\s]*YYYY|DOMMYYYY", text, re.IGNORECASE):
                extracted_fields["dob"] = "DD/MM/YYYY (Placeholder)"

        # ---------------------------------------------------------------------
        # 3. Extract Cardholder Name (Spatial & Layout-Aware for PAN & Aadhaar)
        # ---------------------------------------------------------------------
        detected_type = DocumentUnderstandingService.detect_document_type(text, extracted_fields, declared_type)

        # Check placeholder first
        for line in lines:
            u_line = line.upper().replace(" ", "")
            if "FIRSTNAME" in u_line or "FRSTNAME" in u_line or "MIDDLENAME" in u_line:
                extracted_fields["name"] = "FIRST NAME MIDDLE NAME SURNAME (Placeholder)"
                break

        # Strategy A (PAN Card): Look for box/line right after '/Name' or 'Name' (excluding Father's Name)
        if "name" not in extracted_fields:
            for idx, line in enumerate(lines):
                u_line = line.upper().replace(" ", "")
                if ("/NAME" in u_line or u_line in ("NAME", "NAM/NAME")) and "FATHER" not in u_line:
                    # Check next line first, then previous line (in case of rotated reading order)
                    for neighbor_idx in (idx + 1, idx - 1):
                        if 0 <= neighbor_idx < len(lines):
                            cand = DocumentUnderstandingService._clean_person_name(lines[neighbor_idx])
                            if cand:
                                extracted_fields["name"] = cand
                                break
                    if "name" in extracted_fields:
                        break

        # Strategy B (Aadhaar Card Front): Spatially find the English name box directly above the DOB box in the same column
        if "name" not in extracted_fields and dob_box is not None and boxes:
            dob_x = dob_box.get("x", 0)
            dob_y = dob_box.get("y", 0)
            above_candidates = []
            for b in boxes:
                bx, by = b.get("x", 0), b.get("y", 0)
                # Same horizontal column on card & located above DOB line
                if abs(bx - dob_x) <= 100 and 5 <= (dob_y - by) <= 120:
                    cand = DocumentUnderstandingService._clean_person_name(b.get("text", ""))
                    if cand:
                        above_candidates.append((dob_y - by, cand, b))
            if above_candidates:
                above_candidates.sort(key=lambda item: item[0])
                extracted_fields["name"] = above_candidates[0][1]
                field_positions["name"] = above_candidates[0][2]

        # Strategy C (e-Aadhaar Address Block): Line immediately before 'S/O:', 'D/O:', 'W/O:', 'C/O:' or immediately after 'To'
        if "name" not in extracted_fields:
            for idx, line in enumerate(lines):
                if re.match(r"^(?:S/O|D/O|W/O|C/O|Djo)\s*[:\-]", line.strip(), re.IGNORECASE):
                    if idx - 1 >= 0:
                        cand = DocumentUnderstandingService._clean_person_name(lines[idx - 1])
                        if cand:
                            extracted_fields["name"] = cand
                            break
                if line.strip().lower() == "to" and idx + 1 < len(lines):
                    cand = DocumentUnderstandingService._clean_person_name(lines[idx + 1])
                    if cand:
                        extracted_fields["name"] = cand
                        break

        # Strategy D: Explicit 'Holder Name: ...' or 'Full Name: ...'
        if "name" not in extracted_fields:
            direct_name = re.search(
                r"(?:Holder\s*Name|Full\s*Name|Citizen\s*Name|^Name)\s*[:\-]\s*([A-Za-z\s\[\]]{3,45})",
                text,
                re.IGNORECASE | re.MULTILINE
            )
            if direct_name:
                clean_name = re.sub(r"\s*\[EDITED\]\s*", "", direct_name.group(1), flags=re.IGNORECASE).splitlines()[0].strip().title()
                if clean_name:
                    extracted_fields["name"] = clean_name

        # ---------------------------------------------------------------------
        # 4. Issuing Authority & Document Category (with accurate Gender detection)
        # ---------------------------------------------------------------------
        joined_upper = text.upper().replace(" ", "")
        if detected_type == "Aadhaar Card":
            extracted_fields["institution"] = "UIDAI - Government of India"
            if any(fem in joined_upper for fem in ("FEMALE", "TEMALE", "D/O:", "DJO:", "W/O:")):
                extracted_fields["course"] = "Aadhaar Card (Female)"
            elif "MALE" in joined_upper or "S/O:" in joined_upper:
                extracted_fields["course"] = "Aadhaar Card (Male)"
            else:
                extracted_fields["course"] = "Aadhaar Card"
        elif detected_type == "PAN Card":
            extracted_fields["institution"] = "Income Tax Department - Govt of India"
            extracted_fields["course"] = "Permanent Account Number (PAN Card)"
        else:
            extracted_fields["institution"] = "Government of India"
            extracted_fields["course"] = detected_type

        # 5. Match spatial coordinates from OCR boxes
        if dob_box is not None:
            field_positions["dob"] = dob_box

        for b in boxes:
            b_txt = b.get("text", "").upper().replace(" ", "")
            if not b_txt:
                continue
            if "certificate_id" not in field_positions and extracted_fields.get("certificate_id"):
                cid_clean = str(extracted_fields["certificate_id"]).upper().replace("-", "").replace(" ", "")
                if cid_clean[:6] in b_txt:
                    field_positions["certificate_id"] = b
            if "name" not in field_positions and extracted_fields.get("name"):
                first_tok = extracted_fields["name"].split()[0].upper()
                if len(first_tok) >= 3 and first_tok in b_txt:
                    field_positions["name"] = b
            if "institution" not in field_positions and ("INCOMETAX" in b_txt or "GOVT" in b_txt or "UIDAI" in b_txt or "UNIQUE" in b_txt):
                field_positions["institution"] = b

        was_auto_corrected = (
            declared_type.lower() not in ("auto-detect", "auto", "automatic")
            and declared_type.lower() != detected_type.lower()
        )

        return {
            "document_type": detected_type,
            "declared_type": declared_type,
            "auto_detected_type": detected_type,
            "was_auto_corrected": was_auto_corrected,
            "extracted_fields": extracted_fields,
            "field_positions": field_positions,
            "field_count": len(extracted_fields),
            "raw_lines": lines,
            "explanation": f"Auto-detected '{detected_type}' and extracted {len(extracted_fields)} document fields."
        }
