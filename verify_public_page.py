from playwright.sync_api import sync_playwright

def verify_public_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to public page...")
            page.goto("http://localhost:3000/public")

            # Wait for content to load
            page.wait_for_selector("text=SYSTEM STATUS", timeout=10000)

            print("Taking screenshot...")
            # Take a screenshot of the full viewport
            page.screenshot(path="/home/jules/verification/public_page_enhanced.png", full_page=True)
            print("Screenshot saved to /home/jules/verification/public_page_enhanced.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_public_page()
