from playwright.sync_api import sync_playwright, expect
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        os.makedirs("./verification", exist_ok=True)

        print("Navigating to Dice Test page...")
        try:
            page.goto("http://localhost:3000/dice-test")

            page.wait_for_timeout(3000)

            page.screenshot(path="./verification/debug_initial.png")

            print("Locating Dice Tray...")
            # The title is visible
            expect(page.get_by_text("Dice Tray")).to_be_visible(timeout=5000)

            print("Clicking d20...")
            d20_btn = page.get_by_role("button", name="d20", exact=True)
            d20_btn.click()

            print("Waiting for roll...")
            page.wait_for_timeout(2000)

            print("Taking screenshot...")
            page.screenshot(path="./verification/dice_roll.png")
            print("Screenshot saved.")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="./verification/failure.png")
            print("Failure screenshot saved to ./verification/failure.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run()
