# -*- coding: utf-8 -*-
"""
Ollama Integration for Vendor/Agency Profile Generation
Uses Ollama llama3:8b for AI-generated fraud analysis summaries
"""

from typing import Dict, Any


class SummaryGenerator:
    """
    READ-ONLY component using Ollama llama3:8b for vendor/agency profiling
    
    CRITICAL: Does NOT modify fraud decisions - only generates explanations
    """
    
    @staticmethod
    def generate_basic_summary(prediction: Dict[str, Any]) -> str:
        """Deterministic fallback summary"""
        risk_score = prediction["risk_score"]
        fraud_score = prediction.get("fraud_score", 0)
        reasons = prediction.get("reasons", [])
        
        if risk_score >= 70:
            severity = "HIGH RISK"
        elif risk_score >= 40:
            severity = "MODERATE RISK"
        else:
            severity = "LOW RISK"
        
        if not reasons:
            return f"{severity} (ML Score: {fraud_score}): Transaction appears normal."
        
        reason_text = "; ".join(reasons[:3])
        return f"{severity} (ML Score: {fraud_score}): {reason_text}. Recommend human review."
    
    @staticmethod
    def generate_vendor_profile(tx_data: Dict[str, Any], prediction: Dict[str, Any]) -> str:
        """
        Generate vendor/agency profile using Ollama llama3:8b
        
        READ-ONLY: Uses existing fraud results for explanatory profiling
        """
        try:
            import ollama
            
            vendor = tx_data.get("vendor", "Unknown")
            agency = tx_data.get("agency", "Unknown")
            amount = tx_data.get("amount", 0)
            fraud_score = prediction.get("fraud_score", 0)
            risk_score = prediction["risk_score"]
            reasons = prediction.get("reasons", [])
            
            prompt = f"""You are a government fraud investigation assistant analyzing procurement transactions.

Transaction Details:
- Vendor: {vendor}
- Agency: {agency}
- Amount: ${amount:,.2f}
- ML Fraud Score: {fraud_score} (0.0-1.0 scale, higher = more anomalous)
- Risk Score: {risk_score}/99 (rule-based assessment)
- Flagged as Anomaly: {prediction['is_anomaly']}

Risk Indicators Detected:
{chr(10).join(f"• {r}" for r in reasons) if reasons else "• No specific risk indicators"}

Generate a professional 3-4 sentence profile explaining:
1. Why this vendor/agency combination was flagged (reference both ML and rule-based scores)
2. The key risk factors identified
3. Recommended next steps for investigators

Be concise, factual, and focus only on the provided risk indicators. Explain the difference between the ML fraud score (subtle patterns) and risk score (explicit rules). Do not speculate beyond the given data."""

            response = ollama.generate(
                model='llama3:8b',
                prompt=prompt,
                options={
                    'temperature': 0.3,
                    'top_p': 0.9,
                    'num_predict': 250
                }
            )
            
            summary = response['response'].strip()
            return f"{summary}\n\n[Note: AI-generated profile from automated fraud detection. ML score represents subtle pattern detection (Isolation Forest + Autoencoder), while risk score represents explicit rule violations. Both layers provide defense in government enquiries.]"
            
        except ImportError:
            return SummaryGenerator.generate_basic_summary(prediction) + " [Ollama unavailable]"
        except Exception as e:
            print(f"Ollama generation failed: {e}")
            return SummaryGenerator.generate_basic_summary(prediction) + " [LLM failed]"
