package com.tesla.customercare
import androidx.compose.runtime.DisposableEffect

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import android.content.Context
import android.content.SharedPreferences
import android.content.Intent
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import io.ably.lib.realtime.AblyRealtime
import io.ably.lib.realtime.Channel
import io.ably.lib.realtime.ChannelState
import io.ably.lib.types.ClientOptions

import android.os.Bundle
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessaging
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.cancel
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

// Simple in-memory cookie jar for session
lateinit var appContext: Context

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
}

val client = OkHttpClient.Builder()
    .cookieJar(cookieJar)
    .build()

val BASE_URL: String get() = BuildConfig.BASE_URL


fun clearSessionCookies() {
    val prefs = appContext.getSharedPreferences("cookie_prefs", Context.MODE_PRIVATE)
    prefs.edit().clear().apply()
}

class MainActivity : ComponentActivity() {
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            Log.d("FCM", "Notification permission granted")
        } else {
            Log.d("FCM", "Notification permission denied")
        }
    }

    private fun askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
                // FCM SDK (and your app) can post notifications.
            } else if (shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) {
                // UI to explain to user why you need notification
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                // Directly ask for the permission
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun registerFCMToken() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w("FCM", "Fetching FCM registration token failed", task.exception)
                return@addOnCompleteListener
            }
            val token = task.result
            Log.d("FCM", "FCM Token: $token")
            
            // Send token to backend
            val json = JSONObject()
            json.put("fcmToken", token)
            json.put("platform", "android")
            
            val requestBody = json.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("${BASE_URL}/auth/fcm-token")
                .post(requestBody)
                .build()
                
            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {}
                override fun onResponse(call: Call, response: Response) {}
            })
        }
    }

    
    override fun onCreate(savedInstanceState: Bundle?) {
        appContext = this.applicationContext
        askNotificationPermission()
        registerFCMToken()

        super.onCreate(savedInstanceState)
        
        var initialOrderId: String? = intent?.getStringExtra("orderId")

        setContent {
            CustomerCareApp(initialOrderId = initialOrderId)
        }
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
    }
}

object AppState { var currentOrderId: String? = null }

sealed class Screen { object Login : Screen(); object Dashboard : Screen(); object Payments : Screen(); object Conversations : Screen(); data class Chat(val orderId: String) : Screen() }

@Composable
fun CustomerCareApp(initialOrderId: String? = null) {
    
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Login) }
    
    LaunchedEffect(initialOrderId) {
        if (initialOrderId != null && cookieJar.loadForRequest("$BASE_URL".toHttpUrlOrNull()!!).isNotEmpty()) {
            currentScreen = Screen.Chat(initialOrderId)
        }
    }

    
    MaterialTheme(
        colorScheme = darkColorScheme(
            background = Color(0xFF0a0a0a),
            surface = Color(0xFF111111),
            primary = Color(0xFF1d4ed8),
            onPrimary = Color.White,
            onBackground = Color.White,
            onSurface = Color.White
        )
    ) {
        Surface(modifier = Modifier.fillMaxSize()) {
            when (val s = currentScreen) {
                is Screen.Login -> LoginScreen(onLoginSuccess = { 
                    currentScreen = if (initialOrderId != null) Screen.Chat(initialOrderId) else Screen.Dashboard 
                })
                is Screen.Dashboard -> DashboardScreen(
                    onNavigate = { currentScreen = it },
                    onLogout = { clearSessionCookies(); currentScreen = Screen.Login }
                )
                is Screen.Payments -> PaymentsScreen(
                    onBack = { currentScreen = Screen.Dashboard }
                )
                is Screen.Conversations -> ConversationsScreen(
                    onBack = { currentScreen = Screen.Dashboard },
                    onChat = { currentScreen = Screen.Chat(it) }
                )
                is Screen.Chat -> ConversationDetailScreen(
                    orderId = s.orderId,
                    onBack = { currentScreen = Screen.Conversations }
                )
            }
        }
    }
}

@Composable
fun LoginScreen(onLoginSuccess: () -> Unit) {
    var email by remember { mutableStateOf("admin@tesla.com") } // default for ease
    var password by remember { mutableStateOf("admin123") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("CUSTOMER CARE", fontSize = 24.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Sign in to continue", color = Color.Gray)
        Spacer(modifier = Modifier.height(32.dp))
        
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )
        
        if (error != null) {
            Spacer(modifier = Modifier.height(16.dp))
            Text(error!!, color = Color.Red)
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        Button(
            onClick = {
                loading = true
                error = null
                scope.launch(Dispatchers.IO) {
                    try {
                        val json = JSONObject().apply {
                            put("email", email)
                            put("password", password)
                        }
                        val body = json.toString().toRequestBody("application/json".toMediaType())
                        val request = Request.Builder().url("$BASE_URL/auth/login").post(body).build()
                        val response = client.newCall(request).execute()
                        val resBody = response.body?.string()
                        withContext(Dispatchers.Main) {
                            if (response.isSuccessful) {
                                // Now logged in, send FCM token
                                com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                                    if (task.isSuccessful) {
                                        val fcmToken = task.result
                                        val json = org.json.JSONObject().apply {
                                            put("fcmToken", fcmToken)
                                            put("platform", "android")
                                        }
                                        val req = okhttp3.Request.Builder()
                                            .url("${BASE_URL}/auth/fcm-token")
                                            .post(json.toString().toRequestBody("application/json".toMediaType()))
                                            .build()
                                        client.newCall(req).enqueue(object : okhttp3.Callback {
                                            override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {}
                                            override fun onResponse(call: okhttp3.Call, resp: okhttp3.Response) {}
                                        })
                                    }
                                }
                                onLoginSuccess()
                            } else {
                                error = JSONObject(resBody ?: "{}").optString("error", "Login failed")
                            }
                            loading = false
                        }
                    } catch (e: Exception) {
                        withContext(Dispatchers.Main) {
                            error = e.message ?: "Network error"
                            loading = false
                        }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(50.dp),
            enabled = !loading
        ) {
            Text(if (loading) "SIGNING IN..." else "SIGN IN")
        }
    }
}

@Composable
fun DashboardScreen(onNavigate: (Screen) -> Unit, onLogout: () -> Unit) {
    var stats by remember { mutableStateOf<JSONObject?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        scope.launch(Dispatchers.IO) {
            try {
                val request = Request.Builder().url("$BASE_URL/admin/dashboard").get().build()
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    val str = response.body?.string()
                    withContext(Dispatchers.Main) {
                        stats = JSONObject(str ?: "{}")
                    }
                }
            } catch (e: Exception) {}
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Good afternoon", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text("Logout", color = Color.Gray, modifier = Modifier.clickable { onLogout() })
        }
        Spacer(modifier = Modifier.height(32.dp))
        
        val p = stats?.optInt("paymentsToReview", 0) ?: 0
        val c = stats?.optInt("openConversations", 0) ?: 0
        
        DashboardCard("PAYMENTS TO REVIEW", p.toString(), onClick = { onNavigate(Screen.Payments) })
        Spacer(modifier = Modifier.height(16.dp))
        DashboardCard("OPEN CONVERSATIONS", c.toString(), onClick = { onNavigate(Screen.Conversations) })
    }
}

@Composable
fun DashboardCard(title: String, value: String, onClick: () -> Unit) {
    Surface(
        color = Color(0xFF1a1a1a),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth().clickable { onClick() }
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(title, color = Color.Gray, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text(value, fontSize = 32.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun PaymentsScreen(onBack: () -> Unit) {
    var payments by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var selectedPayment by remember { mutableStateOf<JSONObject?>(null) }
    val scope = rememberCoroutineScope()

    fun fetchPayments() {
        scope.launch(Dispatchers.IO) {
            try {
                val request = Request.Builder().url("$BASE_URL/admin/payments").get().build()
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    val str = response.body?.string()
                    val arr = JSONObject(str ?: "{}").optJSONArray("payments")
                    val list = mutableListOf<JSONObject>()
                    if (arr != null) {
                        for (i in 0 until arr.length()) {
                            list.add(arr.getJSONObject(i))
                        }
                    }
                    withContext(Dispatchers.Main) { payments = list }
                }
            } catch (e: Exception) {}
        }
    }

    LaunchedEffect(Unit) { fetchPayments() }

    if (selectedPayment != null) {
        PaymentReviewScreen(
            payment = selectedPayment!!,
            onBack = { selectedPayment = null },
            onUpdate = { fetchPayments(); selectedPayment = null }
        )
    } else {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(modifier = Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("PAYMENTS", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Text("Back", color = Color.Gray, modifier = Modifier.clickable { onBack() })
            }
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(payments) { p ->
                    val order = p.optJSONObject("order")
                    val status = p.optString("status", "")
                    Surface(
                        color = Color(0xFF1a1a1a),
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp).clickable { selectedPayment = p },
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text(order?.optString("name", "Unknown") ?: "Unknown", fontWeight = FontWeight.Bold)
                                Text("$" + p.optDouble("amountDue", 0.0).toString(), color = Color.Gray, fontSize = 14.sp)
                            }
                            Text(status, color = if (status == "UNDER_REVIEW") Color(0xFF3b82f6) else Color.Gray, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PaymentReviewScreen(payment: JSONObject, onBack: () -> Unit, onUpdate: () -> Unit) {
    val scope = rememberCoroutineScope()
    var loading by remember { mutableStateOf(false) }
    var showManualConfirmDialog by remember { mutableStateOf(false) }
    var internalNote by remember { mutableStateOf("") }

    val order = payment.optJSONObject("order")
    val orderId = payment.optString("orderId")
    val method = payment.optString("method")
    val amountDue = payment.optDouble("amountDue", 0.0)
    val status = payment.optString("status")
    
    fun updateStatus(newStatus: String, reason: String = "", isManual: Boolean = false) {
        loading = true
        scope.launch(Dispatchers.IO) {
            try {
                val json = JSONObject().apply {
                    put("status", newStatus)
                    put("reason", reason)
                    if (isManual) {
                        put("isManualConfirmation", true)
                        put("internalNote", internalNote)
                    }
                }
                val body = json.toString().toRequestBody("application/json".toMediaType())
                val request = Request.Builder().url("$BASE_URL/admin/payments/${payment.optString("id")}").patch(body).build()
                val response = client.newCall(request).execute()
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) onUpdate()
                    loading = false
                    showManualConfirmDialog = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { 
                    loading = false 
                    showManualConfirmDialog = false
                }
            }
        }
    }

    if (showManualConfirmDialog) {
        AlertDialog(
            onDismissRequest = { if (!loading) showManualConfirmDialog = false },
            title = { Text("CONFIRM MANUAL PAYMENT", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text("You are about to mark this payment as received.")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Amount: $${amountDue} USD")
                    Text("Order: #${orderId.take(10).uppercase()}")
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("This should only be done after independently verifying that the payment was received.", color = Color.Gray, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = internalNote,
                        onValueChange = { internalNote = it },
                        label = { Text("Optional Internal Note") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !loading
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = { updateStatus("CONFIRMED", isManual = true) },
                    enabled = !loading,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16a34a))
                ) {
                    Text(if (loading) "PROCESSING..." else "CONFIRM PAYMENT")
                }
            },
            dismissButton = {
                TextButton(onClick = { if (!loading) showManualConfirmDialog = false }) {
                    Text("CANCEL")
                }
            }
        )
    }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp).verticalScroll(rememberScrollState())) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("PAYMENT REVIEW", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text("Close", color = Color.Gray, modifier = Modifier.clickable { onBack() })
        }
        Spacer(modifier = Modifier.height(24.dp))
        
        Text("Order #${orderId.take(10).uppercase()}", fontSize = 14.sp, color = Color.Gray)
        Spacer(modifier = Modifier.height(16.dp))
        Text("AMOUNT DUE", fontSize = 12.sp, color = Color.Gray, letterSpacing = 1.sp)
        Text("$${amountDue} USD", fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        
        Text("PAYMENT METHOD", fontSize = 12.sp, color = Color.Gray, letterSpacing = 1.sp)
        Text(method.replace("_", " "), fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        
        Text("STATUS", fontSize = 12.sp, color = Color.Gray, letterSpacing = 1.sp)
        Text(status.replace("_", " "), fontWeight = FontWeight.Bold, color = if (status == "CONFIRMED") Color.Green else Color.White)
        Spacer(modifier = Modifier.height(24.dp))
        
        if (method == "CUSTOMER_CARE") {
            Surface(
                color = Color(0xFF1a1a1a),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("CUSTOMER CARE", fontWeight = FontWeight.Bold, letterSpacing = 1.sp, color = Color(0xFF3b82f6))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Customer has requested payment assistance.", fontSize = 14.sp, color = Color.LightGray)
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
            
            if (status == "PENDING" || status == "REJECTED") {
                Surface(
                    color = Color(0xFF1a1a1a),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("MANUAL PAYMENT", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Customer says payment has been made through Customer Care.", fontSize = 14.sp, color = Color.LightGray)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = { 
                                internalNote = ""
                                showManualConfirmDialog = true 
                            },
                            modifier = Modifier.fillMaxWidth().height(50.dp),
                            shape = RoundedCornerShape(4.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3b82f6))
                        ) {
                            Text("MARK PAYMENT AS RECEIVED", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        }
                    }
                }
            }
        }
        
        // Show Bitcoin TXID and review controls if a TXID was submitted, OR if method is strictly BITCOIN
        if (method == "BITCOIN" || payment.optString("txid", "").isNotEmpty()) {
            Spacer(modifier = Modifier.height(24.dp))
            Text("BITCOIN TXID", fontSize = 12.sp, color = Color.Gray, letterSpacing = 1.sp)
            Text(payment.optString("txid", "N/A").takeIf { it.isNotBlank() } ?: "N/A", color = Color.LightGray)
            Spacer(modifier = Modifier.height(32.dp))
            
            if (status == "UNDER_REVIEW") {
                Button(
                    onClick = { updateStatus("CONFIRMED") },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    enabled = !loading,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16a34a))
                ) {
                    Text("CONFIRM BITCOIN PAYMENT")
                }
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedButton(
                    onClick = { updateStatus("REJECTED", "Transaction could not be verified") },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    enabled = !loading
                ) {
                    Text("REJECT BITCOIN PAYMENT", color = Color.Red)
                }
            }
        }
    }
}


@Composable
fun ConversationsScreen(onBack: () -> Unit, onChat: (String) -> Unit) {
    var conversations by remember { mutableStateOf<org.json.JSONArray?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    fun fetchConversations() {
        loading = true
        error = null
        kotlinx.coroutines.CoroutineScope(Dispatchers.IO).launch {
            try {
                val request = Request.Builder().url("$BASE_URL/admin/conversations").build()
                val response = client.newCall(request).execute()
                val respStr = response.body?.string()
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful && respStr != null) {
                        conversations = JSONObject(respStr).optJSONArray("conversations")
                    } else {
                        error = "Failed to load conversations (HTTP ${response.code})"
                    }
                    loading = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    error = e.message
                    loading = false
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        while (true) {
            fetchConversations()
            kotlinx.coroutines.delay(5000)
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("CONVERSATIONS", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Row {
                Text("Refresh", color = Color(0xFF3b82f6), modifier = Modifier.clickable { fetchConversations() })
                Spacer(modifier = Modifier.width(16.dp))
                Text("Back", color = Color.Gray, modifier = Modifier.clickable { onBack() })
            }
        }
        Spacer(modifier = Modifier.height(24.dp))
        
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
        } else if (error != null) {
            Text("Error: $error", color = Color.Red)
        } else if (conversations == null || conversations!!.length() == 0) {
            Text("No conversations found.", color = Color.Gray)
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                items(conversations!!.length()) { i ->
                    val conv = conversations!!.getJSONObject(i)
                    val order = conv.optJSONObject("order")
                    val orderId = conv.optString("orderId")
                    val name = order?.optString("name", "Unknown") ?: "Unknown"
                    val msgs = conv.optJSONArray("messages")
                    val latestMsg = if (msgs != null && msgs.length() > 0) msgs.getJSONObject(0).optString("body") else "No messages"
                    
                    Surface(
                        color = Color(0xFF1a1a1a),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().clickable { onChat(orderId) }
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(name, fontWeight = FontWeight.Bold)
                                Text(conv.optString("status"), color = if (conv.optString("status") == "OPEN") Color.Green else Color.Gray, fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Order #${orderId.take(8).uppercase()}", fontSize = 12.sp, color = Color.Gray)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(latestMsg, fontSize = 14.sp, color = Color.LightGray, maxLines = 1)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ConversationDetailScreen(orderId: String, onBack: () -> Unit) {
    DisposableEffect(orderId) {
        AppState.currentOrderId = orderId
        onDispose {
            if (AppState.currentOrderId == orderId) {
                AppState.currentOrderId = null
            }
        }
    }
    var messages by remember { mutableStateOf<org.json.JSONArray?>(null) }
    var paymentCtx by remember { mutableStateOf<JSONObject?>(null) }
    var loading by remember { mutableStateOf(true) }
    var sending by remember { mutableStateOf(false) }
    var chatBody by remember { mutableStateOf("") }
    
    val context = androidx.compose.ui.platform.LocalContext.current
    var uploadUri by remember { mutableStateOf<android.net.Uri?>(null) }

    val filePickerLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: android.net.Uri? ->
        uploadUri = uri
    }

    fun fetchChat() {
        // Called from DisposableEffect scope (Dispatchers.IO) or LaunchedEffect.
        // No GlobalScope — lifecycle managed by the caller's coroutine scope.
        kotlinx.coroutines.CoroutineScope(Dispatchers.IO).launch {
            try {
                val request = Request.Builder().url("$BASE_URL/payment/$orderId").build()
                val response = client.newCall(request).execute()
                val respStr = response.body?.string()
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful && respStr != null) {
                        val json = JSONObject(respStr)
                        paymentCtx = json.optJSONObject("payment")
                        messages = json.optJSONObject("conversation")?.optJSONArray("messages")
                    }
                    loading = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { loading = false }
            }
        }
    }

    fun sendMsg() {
        if (chatBody.isBlank() && uploadUri == null) return
        sending = true
        val textToSend = chatBody
        val uriToSend = uploadUri
        
        kotlinx.coroutines.CoroutineScope(Dispatchers.IO).launch {
            try {
                var finalAttachments = org.json.JSONArray()
                
                if (uriToSend != null) {
                    val cr = context.contentResolver
                    val mime = cr.getType(uriToSend) ?: "application/octet-stream"
                    val bytes = cr.openInputStream(uriToSend)?.readBytes()
                    if (bytes != null) {
                        val requestBody = MultipartBody.Builder()
                            .setType(MultipartBody.FORM)
                            .addFormDataPart("file", "upload", RequestBody.create(mime.toMediaType(), bytes))
                            .build()
                        val uploadReq = Request.Builder().url("$BASE_URL/upload").post(requestBody).build()
                        val uploadRes = client.newCall(uploadReq).execute()
                        if (uploadRes.isSuccessful) {
                            val upStr = uploadRes.body?.string()
                            if (upStr != null) {
                                val upJson = JSONObject(upStr)
                                finalAttachments.put(JSONObject().apply {
                                    put("url", upJson.optString("url"))
                                    put("filename", upJson.optString("filename"))
                                    put("mimeType", upJson.optString("contentType"))
                                    put("size", upJson.optInt("size", 0))
                                })
                            }
                        }
                    }
                }
                
                val payload = JSONObject().apply {
                    put("body", textToSend)
                    if (finalAttachments.length() > 0) put("attachments", finalAttachments)
                }
                val reqBody = payload.toString().toRequestBody("application/json".toMediaType())
                val req = Request.Builder().url("$BASE_URL/payment/$orderId/message").post(reqBody).build()
                val res = client.newCall(req).execute()
                
                withContext(Dispatchers.Main) {
                    if (res.isSuccessful) {
                        chatBody = ""
                        uploadUri = null
                        fetchChat()
                    } else {
                        android.widget.Toast.makeText(context, "Failed to send", android.widget.Toast.LENGTH_SHORT).show()
                    }
                    sending = false
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    sending = false
                    android.widget.Toast.makeText(context, "Error: ${e.message}", android.widget.Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // ─── Realtime: Ably subscription (lifecycle-aware, no GlobalScope) ────────
    // This DisposableEffect runs when orderId changes and cleans up on exit.
    // It fetches an Ably token from /api/ably/auth (using the OkHttp client
    // that carries the session cookie), subscribes to the private order channel,
    // and calls fetchChat() when a message.created event arrives.
    //
    // The Ably event payload is NOT trusted for authorization — fetchChat()
    // calls GET /api/payment/[orderId] which validates the session server-side.
    DisposableEffect(orderId) {
        var ablyRealtime: AblyRealtime? = null

        val scope = kotlinx.coroutines.CoroutineScope(Dispatchers.IO)
        scope.launch {
            // 1. Initial data load
            fetchChat()

            // 2. Request Ably token from the server (session cookie is sent automatically)
            try {
                val tokenReq = Request.Builder()
                    .url("$BASE_URL/ably/auth?orderId=$orderId")
                    .build()
                val tokenRes = client.newCall(tokenReq).execute()
                val tokenBody = tokenRes.body?.string()

                if (!tokenRes.isSuccessful || tokenBody == null) {
                    Log.w("Ably", "Token request failed (${tokenRes.code}) — no realtime for this session")
                    return@launch
                }

                val tokenJson = JSONObject(tokenBody)

                // 3. Build Ably ClientOptions with the scoped token
                val opts = ClientOptions().apply {
                    authCallback = io.ably.lib.rest.Auth.TokenCallback { _ ->
                        io.ably.lib.rest.Auth.TokenDetails().apply {
                            token = tokenJson.optString("token")
                        }
                    }
                    echoMessages = false
                }

                // 4. Connect to Ably and subscribe to the private order channel
                ablyRealtime = AblyRealtime(opts)
                val channelName = "private:customer-care:order:$orderId"
                val channel = ablyRealtime!!.channels.get(channelName)

                channel.subscribe("message.created") { _ ->
                    // Do NOT trust the event payload — fetch authoritative data
                    scope.launch { fetchChat() }
                }

                // 5. Reconcile state after reconnect (events may have been missed)
                ablyRealtime!!.connection.on(io.ably.lib.realtime.ConnectionState.connected) { _ ->
                    scope.launch { fetchChat() }
                }

                Log.d("Ably", "Subscribed to $channelName")
            } catch (e: Exception) {
                Log.e("Ably", "Subscription error: ${e.message}")
                // No crash — screen still shows data from the initial fetchChat()
            }
        }

        onDispose {
            scope.cancel()
            try { ablyRealtime?.close() } catch (_: Exception) {}
            if (AppState.currentOrderId == orderId) {
                AppState.currentOrderId = null
            }
            Log.d("Ably", "Unsubscribed from order $orderId")
        }
    }

    // Initial load fallback: if Ably takes a moment to connect the screen
    // is not blank — the DisposableEffect above calls fetchChat() immediately.
    LaunchedEffect(orderId) {
        fetchChat()
    }

    Column(modifier = Modifier.fillMaxSize().background(Color(0xFF0a0a0a))) {
        Row(modifier = Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("ORDER #${orderId.take(8).uppercase()}", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text("Back", color = Color.Gray, modifier = Modifier.clickable { onBack() })
        }
        
        if (loading && messages == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(modifier = Modifier.weight(1f).padding(horizontal = 24.dp), reverseLayout = false) {
                val len = messages?.length() ?: 0
                items(len) { i ->
                    val msg = messages!!.getJSONObject(i)
                    val senderValue = msg.optString("sender")
                    val isStaff = senderValue == "CUSTOMER_CARE" || senderValue == "ADMIN"
                    
                    val senderDisplay = when (senderValue) {
                        "CUSTOMER" -> "CUSTOMER"
                        "CUSTOMER_CARE" -> "CUSTOMER CARE"
                        "ADMIN" -> "ADMIN"
                        else -> "UNKNOWN"
                    }

                    val atts = msg.optJSONArray("attachments")
                    
                    var timeDisplay = ""
                    try {
                        val dateStr = msg.optString("createdAt")
                        if (dateStr.isNotBlank()) {
                            val instant = Instant.parse(dateStr)
                            val formatter = DateTimeFormatter.ofPattern("h:mm a").withZone(ZoneId.systemDefault())
                            timeDisplay = formatter.format(instant)
                        }
                    } catch (e: Exception) {}

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        horizontalArrangement = if (isStaff) Arrangement.End else Arrangement.Start
                    ) {
                        Column(
                            modifier = Modifier
                                .background(if (isStaff) Color(0xFF1d4ed8) else Color(0xFF222222), RoundedCornerShape(8.dp))
                                .padding(12.dp)
                                .fillMaxWidth(0.85f)
                        ) {
                            Text(senderDisplay, fontSize = 10.sp, color = Color.LightGray, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            if (msg.optString("body").isNotBlank()) {
                                Text(msg.optString("body"), color = Color.White)
                            }
                            
                            if (atts != null && atts.length() > 0) {
                                Spacer(modifier = Modifier.height(8.dp))
                                for (j in 0 until atts.length()) {
                                    val att = atts.getJSONObject(j)
                                    val url = "https://christmasdiscounts.vercel.app" + att.optString("url")
                                    val mime = att.optString("mimeType")
                                    if (mime.startsWith("image/")) {
                                        coil.compose.AsyncImage(
                                            model = coil.request.ImageRequest.Builder(context)
                                                .data(url)
                                                .build(),
                                            imageLoader = coil.ImageLoader.Builder(context).okHttpClient(client).build(),
                                            contentDescription = "Attachment",
                                            modifier = Modifier.height(150.dp).fillMaxWidth().background(Color.Black)
                                        )
                                    } else {
                                        Text("📎 ${att.optString("filename")}", color = Color(0xFF60a5fa), modifier = Modifier.clickable {
                                            // Handle file download
                                            android.widget.Toast.makeText(context, "Downloading file...", android.widget.Toast.LENGTH_SHORT).show()
                                        })
                                    }
                                }
                            }
                            
                            if (timeDisplay.isNotBlank()) {
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(timeDisplay, fontSize = 9.sp, color = Color.Gray, modifier = Modifier.align(Alignment.End))
                            }
                        }
                    }
                }
            }
            
            Column(modifier = Modifier.fillMaxWidth().background(Color(0xFF111111)).padding(16.dp)) {
                if (uploadUri != null) {
                    Text("Selected: ${uploadUri!!.lastPathSegment}", color = Color.Green, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Button(onClick = { filePickerLauncher.launch("*/*") }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF333333))) {
                        Text("+")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    OutlinedTextField(
                        value = chatBody,
                        onValueChange = { chatBody = it },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text("Reply...") }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(onClick = { sendMsg() }, enabled = !sending && (chatBody.isNotBlank() || uploadUri != null)) {
                        Text("Send")
                    }
                }
            }
        }
    }
}

