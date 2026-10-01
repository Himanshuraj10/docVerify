import json
from backend.database import SessionLocal
from backend.models.models import RegistryRecord, VerificationResult, FAQ, Complaint
from backend.services.supabase_service import supabase_service


def sql_str(val):
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"


def main():
    db = SessionLocal()
    reg_rows = db.query(RegistryRecord).all()
    ver_rows = db.query(VerificationResult).order_by(VerificationResult.created_at.desc()).limit(30).all()
    faq_rows = db.query(FAQ).all()
    comp_rows = db.query(Complaint).all()

    lines = [
        "-- ============================================================================",
        "-- SUPABASE COMPLETE SCHEMA AND DATA EXPORT (Project: qplrpyjfxiddhezjutqa)",
        "-- Paste into Supabase SQL Editor and click RUN",
        "-- ============================================================================",
        "",
        "CREATE TABLE IF NOT EXISTS public.registry_records (",
        "    id SERIAL PRIMARY KEY,",
        "    certificate_id VARCHAR(64) UNIQUE NOT NULL,",
        "    name VARCHAR(128) NOT NULL,",
        "    dob VARCHAR(32) NOT NULL,",
        "    institution VARCHAR(255) NOT NULL,",
        "    course VARCHAR(255) NOT NULL,",
        "    issue_year INTEGER NOT NULL,",
        "    created_at TIMESTAMPTZ DEFAULT NOW()",
        ");",
        "",
        "CREATE TABLE IF NOT EXISTS public.verification_results (",
        "    id VARCHAR(64) PRIMARY KEY,",
        "    document_type VARCHAR(64) DEFAULT 'Identity Document',",
        "    status VARCHAR(32) NOT NULL,",
        "    risk_score INTEGER NOT NULL,",
        "    ocr_confidence FLOAT NOT NULL,",
        "    certificate_id VARCHAR(64),",
        "    holder_name VARCHAR(128),",
        "    dob VARCHAR(32),",
        "    result_data JSONB NOT NULL,",
        "    created_at TIMESTAMPTZ DEFAULT NOW()",
        ");",
        "",
        "CREATE TABLE IF NOT EXISTS public.faqs (",
        "    id SERIAL PRIMARY KEY,",
        "    question TEXT NOT NULL,",
        "    answer TEXT NOT NULL,",
        "    category VARCHAR(64) DEFAULT 'General',",
        "    is_enabled BOOLEAN DEFAULT TRUE,",
        "    sort_order INTEGER DEFAULT 0",
        ");",
        "",
        "CREATE TABLE IF NOT EXISTS public.complaints (",
        "    id VARCHAR(64) PRIMARY KEY,",
        "    verification_id VARCHAR(64),",
        "    email VARCHAR(128) NOT NULL,",
        "    issue_type VARCHAR(64) NOT NULL,",
        "    description TEXT NOT NULL,",
        "    status VARCHAR(32) DEFAULT 'OPEN',",
        "    response TEXT,",
        "    created_at TIMESTAMPTZ DEFAULT NOW()",
        ");",
        "",
        "ALTER TABLE public.registry_records ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE public.verification_results ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;",
        "",
        'DROP POLICY IF EXISTS "Allow public access registry_records" ON public.registry_records;',
        'CREATE POLICY "Allow public access registry_records" ON public.registry_records FOR ALL USING (true) WITH CHECK (true);',
        "",
        'DROP POLICY IF EXISTS "Allow public access verification_results" ON public.verification_results;',
        'CREATE POLICY "Allow public access verification_results" ON public.verification_results FOR ALL USING (true) WITH CHECK (true);',
        "",
        'DROP POLICY IF EXISTS "Allow public access faqs" ON public.faqs;',
        'CREATE POLICY "Allow public access faqs" ON public.faqs FOR ALL USING (true) WITH CHECK (true);',
        "",
        'DROP POLICY IF EXISTS "Allow public access complaints" ON public.complaints;',
        'CREATE POLICY "Allow public access complaints" ON public.complaints FOR ALL USING (true) WITH CHECK (true);',
        "",
        f"-- 1. INSERT ALL REGISTRY RECORDS ({len(reg_rows)} records)"
    ]

    for r in reg_rows:
        lines.append(
            f"INSERT INTO public.registry_records (certificate_id, name, dob, institution, course, issue_year) "
            f"VALUES ({sql_str(r.certificate_id)}, {sql_str(r.name)}, {sql_str(r.dob)}, "
            f"{sql_str(r.institution)}, {sql_str(r.course)}, {int(r.issue_year or 2024)}) "
            f"ON CONFLICT (certificate_id) DO UPDATE SET name = EXCLUDED.name, dob = EXCLUDED.dob, "
            f"institution = EXCLUDED.institution, course = EXCLUDED.course;"
        )

    lines.append("")
    lines.append(f"-- 2. INSERT ALL VERIFICATION RESULTS ({len(ver_rows)} records)")
    for v in ver_rows:
        d = v.result_data or {}
        ef = d.get("extracted_fields", {})
        st = v.status.value if hasattr(v.status, "value") else str(v.status)
        doc_type = d.get("document_type", "Identity Document")
        json_str = json.dumps(d).replace("'", "''")
        lines.append(
            f"INSERT INTO public.verification_results (id, document_type, status, risk_score, ocr_confidence, "
            f"certificate_id, holder_name, dob, result_data) VALUES ({sql_str(v.id)}, {sql_str(doc_type)}, "
            f"{sql_str(st)}, {int(v.risk_score or 0)}, {float(v.ocr_confidence or 0.0)}, "
            f"{sql_str(ef.get('certificate_id'))}, {sql_str(ef.get('name'))}, {sql_str(ef.get('dob'))}, "
            f"'{json_str}'::jsonb) ON CONFLICT (id) DO UPDATE SET result_data = EXCLUDED.result_data, "
            f"holder_name = EXCLUDED.holder_name, dob = EXCLUDED.dob, certificate_id = EXCLUDED.certificate_id;"
        )

    lines.append("")
    lines.append(f"-- 3. INSERT ALL FAQS ({len(faq_rows)} records)")
    for f in faq_rows:
        lines.append(
            f"INSERT INTO public.faqs (id, question, answer, category, is_enabled, sort_order) "
            f"VALUES ({f.id}, {sql_str(f.question)}, {sql_str(f.answer)}, {sql_str(f.category)}, "
            f"{str(bool(f.is_enabled)).upper()}, {int(f.sort_order or 0)}) ON CONFLICT (id) DO NOTHING;"
        )

    lines.append("")
    lines.append(f"-- 4. INSERT ALL COMPLAINTS ({len(comp_rows)} records)")
    for c in comp_rows:
        st = c.status.value if hasattr(c.status, "value") else str(c.status)
        lines.append(
            f"INSERT INTO public.complaints (id, verification_id, email, issue_type, description, status, response) "
            f"VALUES ({sql_str(c.id)}, {sql_str(c.verification_id)}, {sql_str(c.email)}, {sql_str(c.issue_type)}, "
            f"{sql_str(c.description)}, {sql_str(st)}, {sql_str(c.response)}) ON CONFLICT (id) DO NOTHING;"
        )

    with open("supabase_schema.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(
        f"Exported all local data to supabase_schema.sql "
        f"(Registry: {len(reg_rows)}, Verifications: {len(ver_rows)}, FAQs: {len(faq_rows)}, Complaints: {len(comp_rows)})"
    )

    sync_res = supabase_service.sync_all_local_data(db)
    print("Live REST Sync Result:", sync_res)
    db.close()


if __name__ == "__main__":
    main()
