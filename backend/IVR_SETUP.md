# IVR Setup Guide
# ================
# 1. Download ngrok from https://ngrok.com/download
#    - Extract ngrok.exe to C:\ngrok\
#    - Run: ngrok config add-authtoken <your-token>
#    - Run: ngrok http 5000
#    - Copy the HTTPS URL shown (e.g. https://abc123.ngrok-free.app)
#
# 2. In Twilio Console → Phone Numbers → Your Number → Voice:
#    Set "A Call Comes In" → Webhook → GET/POST:
#    https://abc123.ngrok-free.app/api/ivr/welcome
#
# 3. Call +14472841552 — the IVR will answer!
