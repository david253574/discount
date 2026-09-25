import re

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    lines = f.readlines()

# Fix 1: Missing Intent import
# Add import android.content.Intent at the top
found_intent = False
for line in lines:
    if "import android.content.Intent" in line:
        found_intent = True

if not found_intent:
    lines.insert(2, "import android.content.Intent\n")

content = "".join(lines)

# Fix 2: HttpUrl.parse -> "$BASE_URL".toHttpUrlOrNull()!!
content = content.replace("HttpUrl.parse(\"$BASE_URL\")!!", "\"$BASE_URL\".toHttpUrlOrNull()!!")

# Wait, HttpUrl.Companion.parse or .toHttpUrlOrNull requires okhttp3.HttpUrl.Companion.toHttpUrlOrNull
# Better to use HttpUrl.parse if it's deprecated, but it says "Using 'parse(String): HttpUrl?' is an error."
# Oh okhttp 4 changed this. 
# We need import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
content = content.replace('HttpUrl.parse("$BASE_URL")!!', '"$BASE_URL".toHttpUrlOrNull()!!')

# Wait, is `toHttpUrlOrNull()` imported? It's an extension function in okhttp3.
if "import okhttp3.HttpUrl.Companion.toHttpUrlOrNull" not in content:
    lines = content.split('\n')
    lines.insert(2, "import okhttp3.HttpUrl.Companion.toHttpUrlOrNull\n")
    content = "\n".join(lines)

# Fix 3: Top level declaration error on line 130
# Looking around line 130... It's probably because of my replacement of onCreate.
# I had: 
# override fun onCreate(savedInstanceState: Bundle?) { ... }
# override fun onNewIntent(intent: Intent) { ... }
# Wait! They need to be INSIDE the MainActivity class!
# My regex was:
# content = re.sub(r'override fun onCreate.*?setContent \{.*?CustomerCareApp\(\).*?\}', on_create_code, content, flags=re.DOTALL)
# But `setContent { CustomerCareApp() }` was followed by `}` that closes onCreate, and then `}` that closes MainActivity!!
# Let's check original MainActivity.kt structure.

