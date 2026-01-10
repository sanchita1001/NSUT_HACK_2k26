# -*- coding: utf-8 -*-
"""
Ollama Integration for Vendor/Agency Profile Generation
Uses Ollama llama3:8b for AI-generated fraud analysis summaries
"""

from typing import Dict, Any, Optional


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
    def generate_vendor_profile(tx_data: Dict[str, Any], prediction: Dict[str, Any], vendor_context: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate vendor/agency profile using Ollama llama3:8b
        
        READ-ONLY: Uses existing fraud results for explanatory profiling
        Includes vendor historical context from MongoDB for accurate analysis
        """
        try:
            import ollama
            
            vendor = tx_data.get("vendor", "Unknown")
            agency = tx_data.get("agency", "Unknown")
            amount = tx_data.get("amount", 0)
            fraud_score = prediction.get("fraud_score", 0)
            risk_score = prediction["risk_score"]
            reasons = prediction.get("reasons", [])
            
            # Build vendor context section from MongoDB data
            vendor_history = ""
            if vendor_context:
                vendor_history = f"""

Vendor Historical Data (from MongoDB):
- Total Transactions: {vendor_context.get('totalTransactions', 0)}
- Average Transaction Amount: ₹{vendor_context.get('averageAmount', 0):,.2f}
- Total Volume: ₹{vendor_context.get('totalVolume', 0):,.2f}
- High Risk Transactions (≥70): {vendor_context.get('highRiskCount', 0)}
- Average Risk Score: {vendor_context.get('averageRiskScore', 0):.1f}/100
"""
                recent = vendor_context.get('recentTransactions', [])
                if recent:
                    vendor_history += "\nRecent Transactions:\n"
                    for i, tx in enumerate(recent[:3], 1):
                        vendor_history += f"  {i}. ₹{tx.get('amount', 0):,.2f} - Risk: {tx.get('riskScore', 0)} - {tx.get('scheme', 'N/A')}\n"
            
            prompt = f"""You are a government fraud investigation assistant analyzing procurement transactions.

Transaction Details:
- Vendor: {vendor}
- Agency: {agency}
- Amount: ₹{amount:,.2f}
- ML Fraud Score: {fraud_score} (0.0-1.0 scale, higher = more anomalous)
- Risk Score: {risk_score}/99 (rule-based assessment)
- Flagged as Anomaly: {prediction['is_anomaly']}
{vendor_history}
Risk Indicators Detected:
{chr(10).join(f"• {r}" for r in reasons) if reasons else "• No specific risk indicators"}

Generate a professional 3-4 sentence profile explaining:
1. Why this vendor/agency combination was flagged (reference both ML and rule-based scores)
2. The key risk factors identified, INCLUDING vendor historical patterns from the database
3. Recommended next steps for investigators

Be concise, factual, and focus only on the provided risk indicators and vendor history. Explain the difference between the ML fraud score (subtle patterns) and risk score (explicit rules). Reference the vendor's historical data when relevant. Do not speculate beyond the given data."""

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

    @staticmethod
    def chat_response(message: str) -> str:
        """
        Interative Chat with PFMS Sahayak
        """
        try:
            import ollama
            
            system_prompt = """You are PFMS Sahayak, an intelligent government assistant for the Public Financial Management System (PFMS) of India.
Your role is to assist officers in detecting fraud, understanding scheme performance, and analyzing vendor risks.

Capabilities:
- You help explain complex fraud indicators.
- You provide guidance on government schemes (PM-KISAN, MGNREGA, etc.).
- You are professional, concise, and authoritative.

Current Context:
The user is an oversight officer monitoring real-time transactions.

If the user asks about specific vendors or schemes, explain that you can analyze them if they navigate to the respective dashboard or provide an ID.
Do not hallucinate specific data unless provided in the context."""

            response = ollama.chat(
                model='llama3:8b',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': message},
                ]
            )
            
            return response['message']['content']
            
        except ImportError:
            return "I am currently running in offline mode. Please install the 'ollama' python package to enable AI chat."
        except Exception as e:
            print(f"Chat error: {e}")
            return "I am having trouble accessing the neural network. Please ensure the Ollama service is running on port 11434."
