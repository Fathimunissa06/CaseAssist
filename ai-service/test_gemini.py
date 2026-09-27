import os

from google import genai


print("Checking Gemini connection...")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY is not set.")
    raise SystemExit(1)

print("API key found.")

client = genai.Client(
    api_key=api_key
)

try:

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents="Say exactly: Gemini connection successful."
    )

    print("\n==============================")
    print("GEMINI RESPONSE")
    print("==============================")
    print(response.text)
    print("==============================")

except Exception as e:

    print("\n==============================")
    print("GEMINI ERROR")
    print("==============================")
    print(type(e).__name__)
    print(str(e))
    print("==============================")