from playwright.sync_api import sync_playwright
import time

def verify_visuals():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to public page...")
        # Go to the public page
        try:
            page.goto("http://localhost:3000/public", timeout=60000)
        except Exception as e:
            print(f"Failed to load page: {e}")
            browser.close()
            return

        print("Waiting for content to load...")
        # Wait for the system status to be visible (part of the header)
        try:
            page.wait_for_selector("text=SYSTEM STATUS: ONLINE", timeout=30000)
        except Exception as e:
            print(f"Timeout waiting for content: {e}")
            page.screenshot(path="/home/jules/verification/timeout_debug.png")
            browser.close()
            return

        # Wait a bit for animations to settle
        time.sleep(2)

        print("Taking screenshot...")
        # Take a screenshot of the full page
        page.screenshot(path="/home/jules/verification/public_page.png", full_page=True)

        print("Screenshot saved to /home/jules/verification/public_page.png")
        browser.close()

if __name__ == "__main__":
    verify_visuals()
