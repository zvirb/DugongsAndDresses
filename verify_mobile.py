from playwright.sync_api import Page, expect, sync_playwright

def test_mobile_player_view(page: Page):
    # Set viewport to mobile size
    page.set_viewport_size({"width": 375, "height": 812}) # iPhone X

    # Navigate to player page
    page.goto("http://localhost:3000/player/mock-id")

    # Wait for content to load
    page.wait_for_selector("text=Mock Hero")

    # Verify key elements
    expect(page.get_by_text("Mock Hero")).to_be_visible()

    # Verify Quick Actions exist
    expect(page.get_by_role("button", name="Attack")).to_be_visible()
    expect(page.get_by_role("button", name="Cast")).to_be_visible()

    # Verify HP Controls exist
    expect(page.get_by_role("button", name="+1")).to_be_visible()

    # Take screenshot
    page.screenshot(path="/home/jules/verification/mobile_view.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_mobile_player_view(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            raise e
        finally:
            browser.close()
