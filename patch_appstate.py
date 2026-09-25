import re

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

# Add AppState object
if "object AppState {" not in content:
    content = content.replace("sealed class Screen {", "object AppState { var currentOrderId: String? = null }\n\nsealed class Screen {")

# Update AppState in ConversationDetailScreen
old_chat = """@Composable
fun ConversationDetailScreen(orderId: String, onBack: () -> Unit) {"""
new_chat = """@Composable
fun ConversationDetailScreen(orderId: String, onBack: () -> Unit) {
    DisposableEffect(orderId) {
        AppState.currentOrderId = orderId
        onDispose {
            if (AppState.currentOrderId == orderId) {
                AppState.currentOrderId = null
            }
        }
    }"""
if old_chat in content:
    content = content.replace(old_chat, new_chat)

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)

with open("android_app/app/src/main/java/com/tesla/customercare/service/MyFirebaseMessagingService.kt", "r") as f:
    fcm_content = f.read()

fcm_old = """    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val title = remoteMessage.notification?.title ?: "New Request"
        val body = remoteMessage.notification?.body ?: ""
        val type = remoteMessage.data["type"]
        val orderId = remoteMessage.data["orderId"]

        showNotification(title, body, orderId)
    }"""

fcm_new = """    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val type = remoteMessage.data["type"]
        val orderId = remoteMessage.data["orderId"]
        
        // Suppress notification if we are currently looking at this exact conversation
        if (com.tesla.customercare.AppState.currentOrderId != null && com.tesla.customercare.AppState.currentOrderId == orderId) {
            return
        }

        val title = remoteMessage.notification?.title ?: "New Request"
        val body = remoteMessage.notification?.body ?: ""

        showNotification(title, body, orderId)
    }"""

if fcm_old in fcm_content:
    fcm_content = fcm_content.replace(fcm_old, fcm_new)

with open("android_app/app/src/main/java/com/tesla/customercare/service/MyFirebaseMessagingService.kt", "w") as f:
    f.write(fcm_content)

