import requests
import time
import statistics
import os

API_URL = "http://localhost:8000/analyze"
TEST_FILE_PATH = "sample pdfs/Underqualified.docx"
ROLE_NAME = "Accounting"

SAMPLE_JD = """
our client is seeking a highly skilled and motivated Senior Software Engineer to join their agile development team. This is a fully remote position, empowering you to build innovative software solutions from the convenience of your home office. You will be responsible for designing, developing, testing, and deploying robust and scalable software applications across the full stack. The ideal candidate will possess a strong understanding of software development principles, data structures, algorithms, and best practices in both front-end and back-end development. You will leverage your expertise in programming languages and frameworks to create high-quality code, contribute to architectural decisions, and mentor junior engineers. Your responsibilities will include collaborating with product managers and designers to translate requirements into technical solutions, writing clean and maintainable code, conducting code reviews, and participating in agile ceremonies. This role requires excellent problem-solving skills, a passion for technology, and the ability to work independently and effectively in a remote environment. Our client is committed to building cutting-edge software and seeks individuals who are eager to contribute to impactful projects and drive technical excellence. Responsibilities: Design, develop, and maintain scalable and robust software applications. Write clean, efficient, and well-documented code across the full technology stack. Collaborate with cross-functional teams to define, design, and ship new features. Participate in code reviews, providing constructive feedback to peers. Identify and resolve software defects and performance issues. Contribute to architectural design discussions and technical decision-making. Develop and maintain unit tests and integration tests to ensure code quality. Stay up-to-date with emerging software development trends and technologies. Mentor junior software engineers and foster a culture of learning. Optimize application performance and ensure system reliability. Qualifications: Bachelor's degree in Computer Science, Engineering, or a related field. Minimum of 7 years of experience in software development. Proven experience working effectively in a fully remote capacity. Proficiency in one or more modern programming languages (e.g., Python, Java, JavaScript, C#). Experience with front-end frameworks (e.g., React, Angular, Vue.js). Experience with back-end frameworks and technologies (e.g., Node.js, Django, Spring Boot, .NET). Strong understanding of database systems (e.g., SQL, NoSQL). Familiarity with cloud platforms (e.g., AWS, Azure, GCP). Excellent problem-solving, analytical, and debugging skills. Strong communication and interpersonal skills. Experience with Agile development methodologies. Our client provides a collaborative and supportive remote work environment, encouraging professional growth and innovation.
Also the candidate should have certifications in Certified ScrumMaster (CSM), Oracle Certified Professional: Java SE 11 Developer, and AWS Certified Solutions Architect – Associate.
"""
NUM_RUNS = 2
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
