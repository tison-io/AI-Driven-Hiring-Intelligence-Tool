import requests
import time
import statistics
import os

API_URL = "http://localhost:8000/analyze"
TEST_FILE_PATH = "sample pdfs/Overqualified..pdf"
ROLE_NAME = "Lead AWS Engineer with Python and MLOps"

SAMPLE_JD = """
At Quest Global, it's not just what we do but how and why we do it that makes us different. With over 25 years as an engineering services provider, we believe in the power of doing things differently to make the impossible possible. Spanning 18 countries and speaking 51 languages, our 21,000+ extraordinary employees are driven by the desire to make the world a better place. We bring together technologies and industries, alongside the contributions of diverse individuals who are empowered by an intentional workplace culture, to solve problems better and faster.
Job Requirements
Job Title: Lead AWS Engineer with Python and MLOps

At Quest Global, it's not just what we do but how and why we do it that makes us different. With over 25 years as an engineering services provider, we believe in the power of doing things differently to make the impossible possible. Our people are driven by the desire to make the world a better place—to make a positive difference that contributes to a brighter future. We bring together technologies and industries, alongside the contributions of diverse individuals who are empowered by an intentional workplace culture, to solve problems better and faster.
 
Key Responsibilities
• Need to play both individual and lead role in all aspect.  
We are known for our extraordinary people who make the impossible possible every day. Questians are driven by hunger, humility, and aspiration. We believe that our company culture is the key to our ability to make a true difference in every industry we reach. Our teams regularly invest time and dedicated effort into internal culture work, ensuring that all voices are heard.
We wholeheartedly believe in the diversity of thought that comes with fostering a culture rooted in respect, where everyone belongs, is valued, and feels inspired to share their ideas. We know embracing our unique differences makes us better, and that solving the worlds hardest engineering problems requires diverse ideas, perspectives, and backgrounds. We shine the brightest when we tap into the many dimensions that thrive across over 21,000 difference-makers in our workplace.



Work Experience
Mandate Skills: AWS, Python, MLOps, Docker or Kubernetes, SQL/NoSQL/Vector Database, LLM AND Prompt Engineering

Optional Skills: CI/CD, LangChain or AgentGPT or any AI Agent Framework, ML Frameworks: PyTorch or TensorFlow or scikit-learn

 Detailed JD Info:

We are looking for a highly skilled Senior AI/ML Engineer with a strong background in designing, deploying, and operationalizing AI/ML services in production environments. You will be a key contributor in building and maintaining robust, scalable systems that support machine learning workflows, including Large Language Models (LLMs) and AI agent frameworks. This position requires deep expertise in MLOps, distributed systems, cloud infrastructure (particularly AWS), and modern software development practices. You’ll collaborate with cross-functional teams, drive outcomes by “thinking backward” from business objectives, and deliver impactful results under specific timelines.

 

Key Responsibilities

Design & Implement AI/ML Solutions
Architect and develop end-to-end ML solutions from data ingestion to model deployment, including LLM-based applications.
Evaluate and select appropriate frameworks, libraries, and tools to meet both short-term project goals and long-term scalability.
LLM & Prompt Engineering
Develop and optimize prompts for Large Language Models (e.g., Openai/Claude/Llama) to improve the quality and relevance of outputs.
Conduct experiments to evaluate LLM performance and apply prompt engineering best practices to ensure high-impact results.
AI Agent Frameworks
Incorporate AI agent frameworks (e.g., LangChain, AgentGPT, or similar) to enable autonomous or semi-autonomous decision-making within applications.
Integrate AI agents with existing systems, ensuring robust communication and secure data handling.
MLOps & Production Operations
Set up and optimize CI/CD pipelines for ML models, ensuring continuous integration, testing, and deployment.
Monitor, troubleshoot, and refine production ML systems for performance, cost-efficiency, and reliability.
Cloud Development (AWS)
Leverage AWS services (e.g., EC2, S3, Lambda, SageMaker, EKS) to design and maintain scalable, secure, and cost-efficient ML infrastructure.
Implement best practices for cloud resource allocation, scaling, and maintenance.
Software Engineering & Distributed Systems
Write clean, maintainable, and well-documented code in Python and other modern languages (e.g., Go or Rust).
Develop and maintain distributed systems, focusing on reliability, fault tolerance, and performance.
Work with databases (SQL/NoSQL) to handle large-scale data processing and storage.
Front-End Integration
Collaborate on front-end projects using React/Next.js to build user interfaces or internal tools that interact with AI/ML services.
Cross-Team Collaboration
Work closely with product managers, data scientists, DevOps engineers, and other stakeholders to define requirements and deliver high-impact solutions.
Communicate technical decisions effectively, balancing trade-offs between short-term needs and long-term product vision.
Autonomy & Time Management
Operate with minimal supervision, proactively identifying issues and taking ownership to drive solutions.
Manage multiple priorities in a fast-paced environment, and effectively escalate blockers to ensure timely delivery.
Continuous Learning & Adaptability
Stay updated with emerging AI/ML technologies, LLM advancements, and best practices, sharing insights with the team.
Adapt quickly to new domains, frameworks, and technologies as project needs evolve.
 

Qualifications & Requirements

Experience: 5+ years of professional software engineering experience, including distributed systems and databases.
Education: Bachelor's or Master's degree in Computer Science, Engineering, or a related field (or equivalent industry experience).
Technical Skills:
Required:
AWS (or other major cloud provider) with hands-on experience in deploying, monitoring, and scaling production services.
Python (preferred) and proficiency in at least one other modern programming language (e.g., Go, Java, Rust).
Strong understanding of MLOps concepts, CI/CD pipelines, containerization (Docker), and orchestration (Kubernetes).
Experience with SQL/NoSQL/Vector databases and data processing frameworks.
Demonstrated knowledge of LLMs and prompt engineering.
Familiarity with AI agent frameworks such as LangChain, AgentGPT, or similar.
Experience with open-source ML tools and libraries (PyTorch, TensorFlow, scikit-learn, etc.).
Nice to Have:
Front-end development skills (React, Next.js) or familiarity with web frameworks.
Soft Skills:
Excellent interpersonal and communication skills, with the ability to collaborate across diverse teams.
Strong problem-solving aptitude and a results-oriented mindset.
Proven time management skills, ability to prioritize tasks, and meet tight deadlines.
Self-starter who seeks out solutions independently but knows when to escalate for help.
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

                    if isinstance(skill, (int, float)):
                        skill_scores.append(skill)
                    if isinstance(exp, (int, float)):
                        exp_scores.append(exp)
                    if isinstance(edu, (int, float)):
                        edu_scores.append(edu)
                    if isinstance(cert, (int, float)):
                        cert_scores.append(cert)

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
    if skill_scores:
        print(
            f"  - Skill Match:      {statistics.mean(skill_scores):.2f} | {(max(skill_scores) - min(skill_scores)):.2f}"
        )
    if exp_scores:
        print(
            f"  - Exp. Relevance:   {statistics.mean(exp_scores):.2f} | {(max(exp_scores) - min(exp_scores)):.2f}"
        )
    if edu_scores:
        print(
            f"  - Education Fit:    {statistics.mean(edu_scores):.2f} | {(max(edu_scores) - min(edu_scores)):.2f}"
        )
    if cert_scores:
        print(
            f"  - Certifications:   {statistics.mean(cert_scores):.2f} | {(max(cert_scores) - min(cert_scores)):.2f}"
        )
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
