import re

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

# Add Context import
if "import android.content.Context" not in content:
    content = content.replace("import android.content.Intent", "import android.content.Context\nimport android.content.SharedPreferences\nimport android.content.Intent")

# Replace cookieJar
old_cookie_jar = """val cookieJar = object : CookieJar {
    private var cookies = mutableListOf<Cookie>()
    override fun saveFromResponse(url: HttpUrl, newCookies: List<Cookie>) {
        cookies.clear()
        cookies.addAll(newCookies)
    }
    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        return cookies
    }
}"""

new_cookie_jar = """lateinit var appContext: Context

val cookieJar = object : CookieJar {
    private val PREFS_NAME = "cookie_prefs"
    private val prefs: SharedPreferences by lazy {
        appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    override fun saveFromResponse(url: HttpUrl, newCookies: List<Cookie>) {
        val editor = prefs.edit()
        for (cookie in newCookies) {
            editor.putString(cookie.name, cookie.toString())
        }
        editor.apply()
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val validCookies = mutableListOf<Cookie>()
        val allEntries = prefs.all
        for ((_, value) in allEntries) {
            val cookieString = value as? String ?: continue
            val parsed = Cookie.parse(url, cookieString)
            if (parsed != null) {
                validCookies.add(parsed)
            }
        }
        return validCookies
    }
}"""

content = content.replace(old_cookie_jar, new_cookie_jar)

# Add appContext initialization
on_create_old = """    override fun onCreate(savedInstanceState: Bundle?) {
        askNotificationPermission()"""

on_create_new = """    override fun onCreate(savedInstanceState: Bundle?) {
        appContext = this.applicationContext
        askNotificationPermission()"""

content = content.replace(on_create_old, on_create_new)

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)

