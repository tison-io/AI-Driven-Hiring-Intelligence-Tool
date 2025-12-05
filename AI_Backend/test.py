import requests
import time
import statistics
import os

API_URL = "http://localhost:8000/analyze"
TEST_FILE_PATH = "Sample Resume6.pdf"
ROLE_NAME = "Senior Software Engineer"
NUM_RUNS = 5
MAX_LATENCY_THRESHOLD = 10.0


def run_stress_test():
    if not os.path.exists(TEST_FILE_PATH):
        print(f"Error: File '{TEST_FILE_PATH}' does not exist.")
        return

    print(f"Starting Performance Test: {NUM_RUNS} runs...")
    print(f" Target: Latency < {MAX_LATENCY_THRESHOLD}s | Variance < 5 points")
    print("-" * 65)
    print(f"{'Run':<5} | {'Time (s)':<10} | {'Score':<8} | {'Conf':<8} | {'Status'}")
    print("-" * 65)

    scores = []
    times = []

    for i in range(NUM_RUNS):

        start_time = time.time()
        try:

            with open(TEST_FILE_PATH, "rb") as f:
                response = requests.post(
                    API_URL, files={"file": f}, data={"role_name": ROLE_NAME}
                )

            end_time = time.time()
            duration = end_time - start_time
            times.append(duration)

            if response.status_code == 200:
                data = response.json()

                score = data["evaluation"]["role_fit_score"]
                conf = data["evaluation"]["confidence_score"]
                scores.append(score)

                time_status = "OK" if duration <= MAX_LATENCY_THRESHOLD else "SLOW"
                print(
                    f"{i+1:<5} | {duration:.2f}s    | {score:<8}| {conf:<8} | {time_status}"
                )
            else:
                print(
                    f"{i+1:<5} | {duration:.2f}s    | ERROR: | N/A | {response.status_code}"
                )

        except Exception as e:
            print(f"Error: {e}")

        time.sleep(1)

    print("-" * 65)

    if not scores:
        print("No successful runs.")
    return

    avg_time = statistics.mean(times)
    avg_score = statistics.mean(scores)
    spread = max(scores) - min(scores)

    print(f"SUMMARY REPORT:")
    print(f" Average Latency: {avg_time:.2f}s (Target: < {MAX_LATENCY_THRESHOLD}s)")
    print(f" Average Score: {avg_score:.2f}")
    print(f" Score Spread: {spread:.2f} points (Target: < 5)")
    print("-" * 65)

    latency_pass = avg_time <= MAX_LATENCY_THRESHOLD
    consistency_pass = spread <= 5

    if latency_pass and consistency_pass:
        print("SUCCESS: All performance targets met.")
    elif not latency_pass:
        print("FAILURE: Latency target not met.")
    elif not consistency_pass:
        print("FAILURE: Consistency target not met.")
    else:
        print("FAILURE: System is both slow and inconsistent.")


if __name__ == "__main__":
    try:
        requests.get("http://localhost:8000/")
        run_stress_test()
    except:
        print(
            "Error: API server is not reachable. Please ensure the server is running."
        )
