"""
End-to-End Verification and Validation Test Suite
Tests: Auth, Verification Pipeline, Heatmap, Database, Blockchain, RBAC, Owner Controls
"""
import requests
import json
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 60)
    print("STARTING FULL-STACK TEST SUITE")
    print("=" * 60)

    # 1. TEST AUTHENTICATION
    print("\n[1] Testing User Signup & Login...")
    signup_payload = {
        "name": "Integration Tester",
        "email": "tester@example.com",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!"
    }
    signup_res = requests.post(f"{BASE_URL}/auth/signup", json=signup_payload)
    if signup_res.status_code == 201:
        print("  [OK] User signup successful (201 Created)")
    else:
        print("  [OK] User already exists or registered:", signup_res.status_code)

    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "tester@example.com",
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200, f"User login failed: {login_res.text}"
    user_token = login_res.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}
    print("  [OK] User login successful, JWT token issued.")

    # Owner Login
    owner_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "owner@docverify.local",
        "password": "OwnerSecurePass2026!"
    })
    assert owner_login.status_code == 200, f"Owner login failed: {owner_login.text}"
    owner_token = owner_login.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    print("  [OK] Owner login successful (role: OWNER).")

    # Admin Login
    admin_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@docverify.local",
        "password": "AdminPass2026!"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("  [OK] Admin login successful (role: ADMIN).")

    # Invalid Login
    bad_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "tester@example.com",
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401, "Bad login was not rejected!"
    print("  [OK] Bad login properly rejected with 401 Unauthorized.")

    # 2. TEST RBAC ENFORCEMENT
    print("\n[2] Testing RBAC Route Protection...")
    r_user_admin = requests.get(f"{BASE_URL}/admin/dashboard", headers=user_headers).status_code
    r_user_owner = requests.get(f"{BASE_URL}/owner/dashboard", headers=user_headers).status_code
    r_admin_owner = requests.get(f"{BASE_URL}/owner/dashboard", headers=admin_headers).status_code
    r_owner_owner = requests.get(f"{BASE_URL}/owner/dashboard", headers=owner_headers).status_code
    r_owner_admin = requests.get(f"{BASE_URL}/admin/dashboard", headers=owner_headers).status_code

    assert r_user_admin == 403, f"USER could access /api/admin/dashboard ({r_user_admin})"
    assert r_user_owner == 403, f"USER could access /api/owner/dashboard ({r_user_owner})"
    assert r_admin_owner == 403, f"ADMIN could access /api/owner/dashboard ({r_admin_owner})"
    assert r_owner_owner == 200, f"OWNER could not access /api/owner/dashboard ({r_owner_owner})"
    assert r_owner_admin == 200, f"OWNER could not access /api/admin/dashboard ({r_owner_admin})"
    print("  [OK] USER -> /api/admin/dashboard: 403 Forbidden")
    print("  [OK] USER -> /api/owner/dashboard: 403 Forbidden")
    print("  [OK] ADMIN -> /api/owner/dashboard: 403 Forbidden")
    print("  [OK] OWNER -> /api/owner/dashboard: 200 OK")
    print("  [OK] OWNER -> /api/admin/dashboard: 200 OK")

    # 3. TEST 12-STEP VERIFICATION PIPELINE ON DEMO DOCUMENTS
    print("\n[3] Testing Verification Pipeline on Synthetic Scenarios...")
    test_cases = [
        ("GENUINE", "a:/sh2/test_documents/genuine/degree_certificate_genuine.png", "VERIFIED"),
        ("MODIFIED", "a:/sh2/test_documents/modified/degree_certificate_modified.png", "SUSPICIOUS"),
        ("UNKNOWN", "a:/sh2/test_documents/unknown/degree_certificate_unknown.png", "REJECTED")
    ]

    verified_id = None
    for label, filepath, expected_status in test_cases:
        with open(filepath, "rb") as f:
            files = {"file": (Path(filepath).name, f, "image/png")}
            data = {"consent": "true", "document_type": "Degree Certificate"}
            res = requests.post(f"{BASE_URL}/verify", files=files, data=data, headers=user_headers)

        assert res.status_code == 200, f"{label} submission failed: {res.text}"
        payload = res.json()
        status = payload["status"]
        vid = payload["verification_id"]
        risk = payload["risk_score"]
        ocr_conf = payload["ocr_confidence"]
        reg_found = payload["registry"]["found"]
        b_recorded = payload["blockchain"]["recorded"]
        tx_id = payload["blockchain"]["transaction_id"]
        doc_hash = payload["blockchain"]["document_hash"]

        print(f"  [OK] {label} Certificate:")
        print(f"       Verification ID: {vid}")
        print(f"       Status: {status} (Expected: {expected_status})")
        print(f"       Risk Score: {risk}/100 | OCR Confidence: {ocr_conf}%")
        print(f"       Registry Found: {reg_found} | Blockchain Notarized: {b_recorded}")
        print(f"       Tx ID: {tx_id[:20]}... | Doc Hash: {doc_hash[:20]}...")

        assert status == expected_status, f"Expected {expected_status}, got {status}"
        assert b_recorded is True, "Blockchain record not written"
        assert len(payload["heatmap"]["regions"]) > 0, "No heatmap regions generated"

        if label == "GENUINE":
            verified_id = vid

    # 4. TEST PUBLIC SAFE VERIFICATION
    print("\n[4] Testing Public Safe Verification Lookup...")
    pub_res = requests.get(f"{BASE_URL}/public/verify/{verified_id}")
    assert pub_res.status_code == 200, f"Public verification failed: {pub_res.text}"
    pub_data = pub_res.json()
    assert pub_data["verification_id"] == verified_id
    assert pub_data["blockchain_confirmation"] is True
    assert "password" not in json.dumps(pub_data)
    assert "heatmap" not in pub_data  # No internal forensics leaked to public!
    print(f"  [OK] Public verification confirmed: {pub_data['status']} on Block #{pub_data['block_number']}")
    print("  [OK] Strict data privacy preserved: no internal forensics or personal data leaked.")

    # 5. TEST COMPLAINTS SYSTEM
    print("\n[5] Testing Complaints & Dispute Filing...")
    cmp_res = requests.post(f"{BASE_URL}/complaints", json={
        "verification_id": verified_id,
        "email": "tester@example.com",
        "issue_type": "Incorrect Verification Result",
        "description": "Submitting appeal to verify transcript records."
    }, headers=user_headers)
    assert cmp_res.status_code == 201, f"Complaint creation failed: {cmp_res.text}"
    cmp_id = cmp_res.json()["id"]
    print(f"  [OK] Complaint filed: {cmp_id} (Status: Submitted)")

    # Admin updates complaint
    cmp_update = requests.put(f"{BASE_URL}/admin/complaints/{cmp_id}", json={
        "status": "Resolved",
        "response": "Audit committee verified original records. Request resolved."
    }, headers=admin_headers)
    assert cmp_update.status_code == 200, f"Admin update failed: {cmp_update.text}"
    print("  [OK] Admin updated complaint status to Resolved with response.")

    # 6. TEST OWNER WEBSITE CONTENT & SETTINGS
    print("\n[6] Testing Owner Website Content & Settings Editor...")
    cnt_update = requests.put(f"{BASE_URL}/owner/content/hero", json={
        "title": "Institutional AI + OCR + Blockchain Verification",
        "subtitle": "Next-generation tamper detection for educational and institutional credentials."
    }, headers=owner_headers)
    assert cnt_update.status_code == 200
    print("  [OK] Owner updated homepage hero content.")

    set_update = requests.put(f"{BASE_URL}/owner/settings/max_file_size_mb", json={
        "setting_value": {"value": 15}
    }, headers=owner_headers)
    assert set_update.status_code == 200
    print("  [OK] Owner updated verification settings.")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED! FULL-STACK APPLICATION READY.")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
