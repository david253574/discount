with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

content = content.replace("import okhttp3.HttpUrl.Companion.toHttpUrlOrNull\n", "")
content = "import okhttp3.HttpUrl.Companion.toHttpUrlOrNull\nimport android.content.Intent\n" + content

content = content.replace('HttpUrl.parse("$BASE_URL")!!', '"$BASE_URL".toHttpUrlOrNull()!!')

content = content.replace("""    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Note: For a real app, handling onNewIntent dynamically in Compose requires a bit more wiring,
        // but since we clear top on notification tap, onCreate is usually called.
    }

    }
}""", """    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
    }
}""")

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)
