with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

content = content.replace("import androidx.compose.runtime.DisposableEffect\n", "")
content = content.replace("package com.tesla.customercare\n", "package com.tesla.customercare\nimport androidx.compose.runtime.DisposableEffect\n")

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)
