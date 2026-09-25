import re

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

# Polling for ConversationsScreen
old_launch1 = """    LaunchedEffect(Unit) {
        fetchConversations()
    }"""
new_launch1 = """    LaunchedEffect(Unit) {
        while (true) {
            fetchConversations()
            kotlinx.coroutines.delay(5000)
        }
    }"""
content = content.replace(old_launch1, new_launch1)

# Polling for ConversationDetailScreen
old_launch2 = """    LaunchedEffect(Unit) {
        fetchChat()
    }"""
new_launch2 = """    LaunchedEffect(Unit) {
        while (true) {
            fetchChat()
            kotlinx.coroutines.delay(3000)
        }
    }"""
content = content.replace(old_launch2, new_launch2)

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)
