with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

content = content.replace("io.coil.compose.AsyncImage", "coil.compose.AsyncImage")
content = content.replace("io.coil.request.ImageRequest", "coil.request.ImageRequest")

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)
