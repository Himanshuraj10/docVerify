import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any

class MLAnomalyDetector:
    """
    Lightweight, explainable Machine Learning Anomaly Detector using Isolation Forest.
    Trained on synthetic academic document feature vectors.
    Produces an ML anomaly score (0.0 to 1.0) distinct from the business rule risk score.
    """

    def __init__(self):
        # 10 features:
        # [ocr_conf_norm, reg_found, cert_match, name_match, dob_match, inst_match, qr_consistent, tamper_score, ela_score, completeness]
        rng = np.random.RandomState(42)

        # Baseline: 200 normal genuine document samples
        normal_samples = rng.normal(
            loc=[0.95, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.05, 0.08, 1.0],
            scale=[0.04, 0.0, 0.0, 0.05, 0.0, 0.05, 0.0, 0.03, 0.03, 0.05],
            size=(200, 10)
        )
        normal_samples = np.clip(normal_samples, 0.0, 1.0)

        # 40 synthetic anomalous / altered document samples
        anomaly_samples = rng.uniform(low=0.0, high=1.0, size=(40, 10))

        X_train = np.vstack([normal_samples, anomaly_samples])

        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.15,
            random_state=42
        )
        self.model.fit(X_train)

    def detect(
        self,
        ocr_confidence: float,
        registry_result: Dict[str, Any],
        tamper_result: Dict[str, Any],
        validation_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        ocr_norm = max(0.0, min(ocr_confidence / 100.0, 1.0))
        reg_found = 1.0 if registry_result.get("found", False) else 0.0
        cert_match = 1.0 if registry_result.get("certificate_id_match", False) else 0.0
        name_match = 1.0 if registry_result.get("name_match", False) else 0.0
        dob_match = 1.0 if registry_result.get("dob_match", False) else 0.0
        inst_match = 1.0 if registry_result.get("institution_match", False) else 0.0
        
        qr_info = tamper_result.get("qr_analysis", {})
        qr_consistent = 1.0 if qr_info.get("matches_document", True) else 0.0

        tamper_score = tamper_result.get("tamper_score", 0.05)
        ela_score = tamper_result.get("ela_variance", 0.08)
        completeness = validation_result.get("completeness_score", 100.0) / 100.0

        feature_vector = np.array([[
            ocr_norm, reg_found, cert_match, name_match, dob_match,
            inst_match, qr_consistent, tamper_score, ela_score, completeness
        ]], dtype=np.float32)

        # Decision function: lower values mean more anomalous
        score_val = self.model.decision_function(feature_vector)[0]
        # Invert & scale to standard 0.0 (normal) -> 1.0 (highly anomalous)
        # Score_val is typically in [-0.3, 0.3]
        anomaly_prob = float(np.clip(0.5 - (score_val * 1.5), 0.02, 0.98))

        is_outlier = self.model.predict(feature_vector)[0] == -1

        return {
            "ml_anomaly_score": round(anomaly_prob, 2),
            "is_outlier": bool(is_outlier),
            "features_analyzed": {
                "ocr_confidence_factor": round(ocr_norm, 2),
                "registry_found": bool(reg_found),
                "certificate_id_match": bool(cert_match),
                "name_match": bool(name_match),
                "tamper_score": round(tamper_score, 2),
                "compression_variance": round(ela_score, 3)
            },
            "model_type": "Isolation Forest (Synthetic Benchmark)"
        }

# Global singleton instance
anomaly_detector = MLAnomalyDetector()
