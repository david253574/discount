import re

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

old_create = """    override fun onCreate(savedInstanceState: Bundle?) {
        askNotificationPermission()

        super.onCreate(savedInstanceState)"""

new_create = """    override fun onCreate(savedInstanceState: Bundle?) {
        askNotificationPermission()
        registerFCMToken()

        super.onCreate(savedInstanceState)"""

content = content.replace(old_create, new_create)

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)
