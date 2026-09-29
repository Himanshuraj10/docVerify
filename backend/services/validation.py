from typing import Dict, Any, List
import re

class DocumentValidator:
    """Validates completeness, syntax, and presence of mandatory fields."""

    @staticmethod
    def validate_fields(extracted_fields: Dict[str, Any], document_type: str = "Degree Certificate") -> Dict[str, Any]:
        required_fields = ["certificate_id", "name"]
        recommended_fields = ["dob", "institution", "course", "issue_year"]

        errors = []
        warnings = []

        for req in required_fields:
            if req not in extracted_fields or not extracted_fields[req]:
                errors.append(f"Mandatory field '{req}' could not be identified.")

        for rec in recommended_fields:
            if rec not in extracted_fields or not extracted_fields[rec]:
                warnings.append(f"Recommended field '{rec}' was not found.")

        # Check DOB format if present
        if "dob" in extracted_fields and extracted_fields["dob"]:
            dob_val = str(extracted_fields["dob"])
            if not re.match(r"^[0-3]?[0-9][/\-\.][0-1]?[0-9][/\-\.][1-2][0-9]{3}$", dob_val):
                warnings.append(f"Date of birth '{dob_val}' does not conform to standard DD/MM/YYYY format.")

        # Check Year
        if "issue_year" in extracted_fields and extracted_fields["issue_year"]:
            year = extracted_fields["issue_year"]
            if not (1950 <= year <= 2030):
                warnings.append(f"Issue year {year} is outside plausible academic issue range.")

        total_checks = len(required_fields) + len(recommended_fields)
        present_count = len([k for k in (required_fields + recommended_fields) if k in extracted_fields and extracted_fields[k]])
        completeness = round((present_count / total_checks) * 100, 1)

        is_valid = len(errors) == 0

        return {
            "is_valid": is_valid,
            "completeness_score": completeness,
            "errors": errors,
            "warnings": warnings,
            "required_fields_present": len(errors) == 0
        }
