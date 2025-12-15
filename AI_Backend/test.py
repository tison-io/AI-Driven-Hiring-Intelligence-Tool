import requests
import time
import statistics
import os

API_URL = "http://localhost:8000/analyze"
TEST_FILE_PATH = "sample pdfs/MAYA HENDERSON HR FIT.pdf"
ROLE_NAME = "HR"

SAMPLE_JD = """
Our client is seeking a strategic and people-focused Human Resources Business Partner to support organizational growth, talent development, and employee engagement initiatives. This fully remote role requires a strong HR generalist who can partner with leadership, coach managers, and implement HR best practices across the employee lifecycle. The ideal candidate has extensive experience in employee relations, performance management, talent acquisition, HR data analysis, and policy development.

You will play a key role in shaping the culture, supporting workforce planning, resolving complex HR issues, and ensuring compliance with employment laws. This role requires excellent communication, strong interpersonal skills, and the ability to build trust at all levels of the organization. The ideal candidate thrives in a fast-paced, collaborative, and highly dynamic remote environment.

Responsibilities

Serve as a strategic partner to business leaders, providing guidance on workforce planning, organizational structure, and team development.

Manage employee relations cases, including conflict resolution, coaching, and performance issues.

Lead performance management processes, including goal-setting, evaluation cycles, and manager support.

Support end-to-end talent acquisition and onboarding in partnership with the recruitment team.

Develop and implement HR policies, processes, and compliance programs.

Conduct HR data analysis and provide insights on attrition, engagement, and talent metrics.

Facilitate employee engagement initiatives and culture-building programs.

Provide guidance on compensation, promotions, and career development.

Deliver training to managers on HR best practices and leadership fundamentals.

Ensure compliance with federal, state, and local employment laws.

Support diversity, equity, and inclusion (DEI) programs and initiatives.

Partner with leadership on change management initiatives.

Qualifications

Bachelor's degree in Human Resources, Business, Psychology, or a related field.

Minimum of 7 years of experience in Human Resources or HR Business Partnering.

Experience working effectively in a fully remote environment.

Proven expertise in employee relations, performance management, and talent development.

Strong understanding of HR best practices, policies, and employment law.

Experience with HRIS platforms (e.g., Workday, BambooHR, SAP SuccessFactors).

Strong analytical and problem-solving skills, including HR data interpretation.

Excellent communication, conflict resolution, and interpersonal skills.

Experience supporting managers and senior leaders through coaching.

Knowledge of recruitment, onboarding, and workforce planning processes.

Experience supporting DEI initiatives and culture programs.

Required Certifications

SHRM-CP or SHRM-SCP

Professional in Human Resources (PHR)

Certified ScrumMaster (CSM)
"""
NUM_RUNS = 5
MAX_LATENCY_THRESHOLD = 10.0


def run_stress_test():
    if not os.path.exists(TEST_FILE_PATH):
        print(f"Error: File '{TEST_FILE_PATH}' does not exist.")
        return

    print(f"Starting Performance Test: {NUM_RUNS} runs...")
    print(f" Target: Latency < {MAX_LATENCY_THRESHOLD}s | Variance < 5 points")
    print("-" * 120)
    print(
        f"{'Run':<5} | {'Time (s)':<10} | {'Score':<8} | {'Conf':<8} | {'Skill':<8} | {'Experience':<12} | {'Education':<12} | {'Certs':<8} | {'Status'}"
    )
    print("-" * 120)

    scores = []
    times = []
    skill_scores = []
    exp_scores = []
    edu_scores = []
    cert_scores = []

    for i in range(NUM_RUNS):
        start_time = time.time()
        try:
            with open(TEST_FILE_PATH, "rb") as f:
                response = requests.post(
                    API_URL,
                    files={"file": f},
                    data={"role_name": ROLE_NAME, "job_description": SAMPLE_JD},
                )

            end_time = time.time()
            duration = end_time - start_time
            times.append(duration)

            if response.status_code == 200:
                data = response.json()

                if "evaluation" in data and data["evaluation"]:
                    eval_data = data["evaluation"]
                    score = eval_data.get("role_fit_score", 0)
                    conf = eval_data.get("confidence_score", 0)
                    scores.append(score)

                    breakdown = eval_data.get("scoring_breakdown", {})
                    skill = breakdown.get("skill_match", "N/A")
                    exp = breakdown.get("experience_relevance", "N/A")
                    edu = breakdown.get("education_fit", "N/A")
                    cert = breakdown.get("certifications", "N/A")

                    if isinstance(skill, (int, float)): skill_scores.append(skill)
                    if isinstance(exp, (int, float)): exp_scores.append(exp)
                    if isinstance(edu, (int, float)): edu_scores.append(edu)
                    if isinstance(cert, (int, float)): cert_scores.append(cert)

                    time_status = "OK" if duration <= MAX_LATENCY_THRESHOLD else "SLOW"
                    print(
                        f"{i+1:<5} | {duration:<10.2f} | {score:<8} | {conf:<8} | {skill:<8} | {exp:<12} | {edu:<12} | {cert:<8} | {time_status}"
                    )
                else:
                    print(
                        f"{i+1:<5} | {duration:<10.2f} | KEY ERR  | N/A      | N/A      | N/A          | N/A        | N/A      | RESPONSE ERROR"
                    )
                    print(f"Data received: {data.keys()}")
            else:
                print(
                    f"{i+1:<5} | {duration:<10.2f} | ERROR    | N/A      | N/A      | N/A          | N/A        | N/A      | {response.status_code}"
                )
                print(response.text)

        except Exception as e:
            print(f"An error occurred during run {i+1}: {e}")

        time.sleep(1)

    print("-" * 120)

    if not scores:
        print("No successful runs.")
        return

    avg_time = statistics.mean(times) if times else 0
    avg_score = statistics.mean(scores) if scores else 0
    spread = max(scores) - min(scores) if scores else 0

    print("SUMMARY REPORT:")
    print(f" Average Latency: {avg_time:.2f}s (Target: < {MAX_LATENCY_THRESHOLD}s)")
    print(f" Overall Score Spread: {spread:.2f} points (Target: < 5)")
    print("-" * 65)
    print(" Breakdown Score Analysis (Avg | Spread):")
    if skill_scores: print(f"  - Skill Match:      {statistics.mean(skill_scores):.2f} | {(max(skill_scores) - min(skill_scores)):.2f}")
    if exp_scores: print(f"  - Exp. Relevance:   {statistics.mean(exp_scores):.2f} | {(max(exp_scores) - min(exp_scores)):.2f}")
    if edu_scores: print(f"  - Education Fit:    {statistics.mean(edu_scores):.2f} | {(max(edu_scores) - min(edu_scores)):.2f}")
    if cert_scores: print(f"  - Certifications:   {statistics.mean(cert_scores):.2f} | {(max(cert_scores) - min(cert_scores)):.2f}")
    print("-" * 65)

    latency_pass = avg_time <= MAX_LATENCY_THRESHOLD if times else False

    if not latency_pass:
        print("FAILURE: Latency target not met.")
    else:
        print("SUCCESS: Latency target met.")


if __name__ == "__main__":
    try:
        requests.get("http://localhost:8000/")
        run_stress_test()
    except:
        print(
            "Error: API server is not reachable. Please ensure the server is running."
        )
