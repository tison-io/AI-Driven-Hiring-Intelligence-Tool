import requests
import time
import statistics
import os

API_URL = "http://localhost:8000/analyze"
TEST_FILE_PATH = "sample pdfs/Accounting1.pdf"
ROLE_NAME = "Accounting"

SAMPLE_JD = """
This position is located in the Income Tax Unit of the Payroll and Accounts Payable Section, Division of Administration, Department of Operational Support (DOS). The Department of Operational Support was established to provide operational advisory services to operating entities across the Secretariat, including other departments, offices away from headquarters, field missions, and regional commissions. The Payroll and Accounts Payable Section processes global payroll and payments, income tax claims and provides policy advice and operational guidance, testing and implementation of enhancements to the payroll module and income tax portal of the ERP/UN Tax system. The Accounting Assistant will report to the Chief of the Income Tax Unit.
Responsibilities
Within delegated authority, the Accounting Assistant will be responsible for the following duties: • Scrutinizes source documents for completeness, accuracy and validity of charges. • Investigates erroneous charges and takes appropriate corrective accounting actions. • Records and reconciles more complex accounting transactions. • Audits various accounting transactions, e.g., payroll, final payments, income tax returns, travel claims, etc., to ensure correctness of disbursements and adherence to relevant staff rules, financial regulations and rules, ST/AI issuances or practices. • Examines and records financial transactions of Offices-away-from-Headquarters/Peacekeeping Missions/other UN organisations and prepares remittances for disbursement. • Reconciles more complex bank accounts in various currencies. • Extracts details of income, expenditure, assets and liability from accounting system in order to analyze and verify accuracy and validity. • Assists with the compliance data transmission to and from the US tax authorities • Assists in the processing of payments to governments and vendors for good and services. This includes, amongst other things, calculating, inputting, and checking payments for correctness and communicating discrepancies to supervisors. • Assists in processing payments to staff members for their entitlements including salaries, claims, education grants and income tax. • Examines the validity of requests for increases in imprest levels; prepares disbursement vouchers to replenish imprest accounts. • Communicates with field offices regarding missing documentation or any other issues related to discrepancies between their accounts and those maintained at Headquarters. • Reconciles and reviews suspense accounts and ensure proper clearance procedures have been followed. • Drafts/prepares memoranda to various offices, departments and overseas offices. • Responds to queries from staff members and third parties. • Assists with the collection and analysis of data as well as preparation of data presentations and reports for information sharing, responding to queries, knowledge management, planning and decision making. • Assists with visualizations and updating information material such as web pages or brochures. • Serves as Approving Officer for disbursements up to an authorized level. • Coordinates between business area as necessary. • Provides guidance and training to colleagues as required. • Supervises other General Service staff as required and in relation to a) the client service activities of the Income Tax Unit; b) the filing requirements of income tax files • Performs other duties as may be required.
Competencies
• Professionalism: Knowledge of the Organization's financial rules and regulations as well as accounting policies and practices. Ability to maintain accurate records, interpret and analyze a wide variety of data. Ability to identify and resolve data discrepancies and other problems. Shows pride in work and in achievements; demonstrates professional competence and mastery of subject matter; is conscientious and efficient in meeting commitments, observing deadlines and achieving results; is motivated by professional rather than personal concerns; shows persistence when faced with difficult problems or challenges; remains calm in stressful situations. Commitment to implementing the goal of gender equality by ensuring the equal participation and full involvement of women and men in all aspects of work. Able to perform analysis, modeling and interpretation of data in support of decision making. • Planning and Organizing: Develops clear goals that are consistent with agreed strategies; identifies priority activities and assignments; adjusts priorities as required; allocates appropriate amount of time and resources for completing work; foresees risks and allows for contingencies when planning; monitors and adjusts plans and actions as necessary; uses time efficiently. • Client Orientation: Considers all those to whom services are provided to be “clients” and seeks to see things from clients’ point of view; establishes and maintains productive partnerships with clients by gaining their trust and respect; identifies clients’ needs and matches them to appropriate solutions; monitors ongoing developments inside and outside the clients’ environment to keep informed and anticipate problems; keeps clients informed of progress or setbacks in projects; meets timeline for delivery of products or services to client.
Education
High school diploma or equivalent is required.
Job - Specific Qualification
Not available.
Work Experience
A minimum of five years of experience in accounting, finance, audit, administrative services or related area is required. The minimum years of relevant experience is reduced to three years for candidates who possess a first-level university degree or higher. Four years of experience focused on transactional based accounting activities such as payroll, United States income tax, vendor/travel claims processing is required. Experience working with the United Nations or a large organization with decentralized systems and procedures including staff rules and regulations, entitlements, financial regulations and procedures is desirable.
Languages
English and French are the working languages of the United Nations Secretariat. For this job opening, English is required. 
"""
NUM_RUNS = 3
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
