from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time

def send_email(username, password, from_name, recipient, subject, message):
    # Create a new instance of the Chrome driver
    driver = webdriver.Chrome()

    try:
        # Navigate to the email portal
        driver.get("https://messagerie.ac-aix-marseille.fr/plog/public/login")

        # Enter username and password
        driver.find_element(By.ID, "form_identifiant").send_keys(username)
        driver.find_element(By.ID, "form_motdepasse").send_keys(password)
        time.sleep(5)
        # Submit the login form
        driver.find_element(By.ID, "form_Valider").click()
        time.sleep(30)  
        # Wait for the inbox page to load
        WebDriverWait(driver, 5).until(EC.title_contains("Inbox"))

        # Navigate to the compose email page
        driver.get("https://messagerie.ac-aix-marseille.fr/roundcube/?_task=mail&_action=compose&_id=")

        # Enter recipient, subject, and message
        driver.find_element(By.CSS_SELECTOR, 'li.input input[type="text"]').send_keys(recipient)
        driver.find_element(By.ID, "compose-subject").send_keys(subject)

        # Switch to the message compose frame
        frame = driver.find_element(By.NAME, "messagecompose")
        driver.switch_to.frame(frame)

        # Enter the message content
        driver.find_element(By.ID, "tinymce").send_keys(message)

        # Switch back to the default content
        driver.switch_to.default_content()

        # Click the send button
        driver.find_element(By.XPATH, "//button[text()='Send']").click()

        # Wait for the email to be sent
        time.sleep(5)  # You can adjust the delay as needed

        print(f"Email sent successfully to {recipient}")
    except Exception as e:
        print(f"Failed to send email to {recipient}: {str(e)}")
    finally:
        # Close the browser
        driver.quit()

# Read email leads from leads.txt
with open("leads.txt", "r") as file:
    leads = file.read().splitlines()

# Read configuration from config.json
with open("config.json", "r") as file:
    config = json.load(file)

# Read email body from letter.txt
with open("letter.txt", "r") as file:
    message = file.read()

# Send emails to each lead
for lead in leads:
    username = config["username"]
    password = config["password"]
    from_name = config["fromName"]
    subject = config["subject"]

    send_email(username, password, from_name, lead, subject, message)
