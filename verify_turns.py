from playwright.sync_api import sync_playwright

def verify_turns():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Go to DM page
            print("Navigating to http://localhost:3000/dm")
            page.goto("http://localhost:3000/dm")

            # Check if we are redirected to create campaign (in case seed didn't work as expected or active=false)
            if "Begin Campaign" in page.content():
                print("No active campaign found. Filling form...")
                page.fill("input[name='name']", "Test Campaign")
                page.click("button[type='submit']")
                page.wait_for_selector("text=DM Control Station")

            # Wait for TurnTracker to load
            print("Waiting for Initiative tracker...")
            page.wait_for_selector("text=Initiative")

            # Take initial screenshot
            page.screenshot(path="initial_state.png")
            print("Initial state screenshot taken: initial_state.png")

            # Find active character (text "Taking Turn...")
            active_indicator = page.locator("text=Taking Turn...")
            if active_indicator.count() > 0:
                print("Found active turn indicator")
            else:
                print("No active turn initially.")

            # Click Next Turn
            print("Clicking Next Turn...")
            page.click("text=Next Turn")

            # Wait for network idle or just a bit for server action to complete
            page.wait_for_timeout(2000)

            # Take screenshot after click
            page.screenshot(path="after_next_turn.png")
            print("After next turn screenshot taken: after_next_turn.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_turns()
