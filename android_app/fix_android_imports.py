with open('app/src/main/java/com/tesla/customercare/MainActivity.kt', 'r') as f:
    content = f.read()

if 'import androidx.compose.foundation.rememberScrollState' not in content:
    content = content.replace('import androidx.compose.foundation.layout.*', 'import androidx.compose.foundation.layout.*\nimport androidx.compose.foundation.rememberScrollState\nimport androidx.compose.foundation.verticalScroll')

with open('app/src/main/java/com/tesla/customercare/MainActivity.kt', 'w') as f:
    f.write(content)
