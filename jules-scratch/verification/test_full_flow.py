import asyncio
from playwright.async_api import async_playwright, expect
import random
import string
import re

# Generate a random username to ensure the test is repeatable
random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
test_user = f"testuser_{random_suffix}"
test_pass = "testpassword"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # --- 1. Registration ---
        await page.goto("file:///app/register.html")
        await page.locator("#username").fill(test_user)
        await page.locator("#password").fill(test_pass)
        await page.get_by_role("button", name="Register").click()
        await page.wait_for_url("**/login.html?registered=true")
        print("✅ Step 1/7: User Registration Successful")

        # --- 2. Admin Login & Set Wallet Addresses ---
        await page.goto("file:///app/login.html")
        await page.locator("#username").fill("admin")
        await page.locator("#password").fill("anamaka")
        await page.get_by_role("button", name="Login").click()
        await page.wait_for_url("**/admin.html")
        await page.locator("#btc-addr").fill("TEST_BTC_ADDRESS_123")
        await page.locator("#eth-addr").fill("TEST_ETH_ADDRESS_456")
        await page.get_by_role("button", name="Save Addresses").click()
        await expect(page.get_by_text("Addresses saved successfully!")).to_be_visible()
        print("✅ Step 2/7: Admin Login & Wallet Setup Successful")

        # --- 3. Admin Logout ---
        await page.get_by_role("button", name="Logout").click()
        await page.wait_for_url("**/login.html")
        print("✅ Step 3/7: Admin Logout Successful")

        # --- 4. User Login & Dashboard Verification ---
        await page.locator("#username").fill(test_user)
        await page.locator("#password").fill(test_pass)
        await page.get_by_role("button", name="Login").click()
        await page.wait_for_url("**/dashboard.html")
        await expect(page.locator(".balance-display")).to_contain_text("$0.00")
        await page.screenshot(path="jules-scratch/verification/final_check_dashboard.png")
        print("✅ Step 4/7: User Login & Zero Balance Verified")

        # --- 5. Deposit Page & QR Code Verification ---
        await page.get_by_role("link", name="Deposit").click()
        await page.wait_for_url("**/deposit.html")
        await expect(page.locator("#qr-code-img")).to_be_visible()
        await expect(page.locator("#qr-code-img")).to_have_attribute("src", re.compile(r".*TEST_BTC_ADDRESS_123.*"))
        await page.screenshot(path="jules-scratch/verification/final_check_deposit.png")
        print("✅ Step 5/7: Deposit Page & QR Code Verified")

        # --- 6. Support Ticket Creation ---
        await page.get_by_role("link", name="Support").click()
        await page.wait_for_url("**/support.html")
        await page.locator("#ticket-subject").fill("Test Ticket Subject")
        await page.locator("#ticket-message").fill("This is a test ticket message.")
        await page.get_by_role("button", name="Submit Ticket").click()
        await expect(page.get_by_text("Test Ticket Subject")).to_be_visible()
        await page.screenshot(path="jules-scratch/verification/final_check_support.png")
        print("✅ Step 6/7: Support Ticket Creation Verified")

        # --- 7. Admin Verification of Ticket ---
        await page.get_by_role("button", name="Logout").click()
        await page.wait_for_url("**/login.html")
        await page.locator("#username").fill("admin")
        await page.locator("#password").fill("anamaka")
        await page.get_by_role("button", name="Login").click()
        await page.wait_for_url("**/admin.html")
        await expect(page.get_by_text("Test Ticket Subject")).to_be_visible()
        await page.screenshot(path="jules-scratch/verification/final_check_admin.png")
        print("✅ Step 7/7: Admin Verification of Ticket Successful")

        await browser.close()
        print("🎉 Full flow verification complete!")

asyncio.run(main())
