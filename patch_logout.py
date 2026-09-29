import re

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

# Add clearSessionCookies function
clear_func = """
fun clearSessionCookies() {
    val prefs = appContext.getSharedPreferences("cookie_prefs", Context.MODE_PRIVATE)
    prefs.edit().clear().apply()
}

class MainActivity : ComponentActivity() {"""
content = content.replace("class MainActivity : ComponentActivity() {", clear_func)

# Call clearSessionCookies in onLogout
old_logout = "onLogout = { currentScreen = Screen.Login }"
new_logout = "onLogout = { clearSessionCookies(); currentScreen = Screen.Login }"
content = content.replace(old_logout, new_logout)

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)
