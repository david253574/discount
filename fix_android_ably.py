import re

with open('android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt', 'r') as f:
    content = f.read()

# Fix TokenDetails import/usage
content = content.replace("io.ably.lib.types.TokenDetails()", "io.ably.lib.rest.Auth.TokenDetails()")

# Fix missing cancel import
if "import kotlinx.coroutines.cancel" not in content:
    content = content.replace("import kotlinx.coroutines.withContext", "import kotlinx.coroutines.withContext\nimport kotlinx.coroutines.cancel")

with open('android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt', 'w') as f:
    f.write(content)
