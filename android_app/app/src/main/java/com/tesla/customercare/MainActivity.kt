package com.tesla.customercare

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
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

// Simple in-memory cookie jar for session
val cookieJar = object : CookieJar {
    private var cookies = mutableListOf<Cookie>()
    override fun saveFromResponse(url: HttpUrl, newCookies: List<Cookie>) {
        cookies.clear()
        cookies.addAll(newCookies)
    }
    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        return cookies
    }
}

val client = OkHttpClient.Builder()
    .cookieJar(cookieJar)
    .build()

// Change this to actual IP if testing on device, 10.0.2.2 is emulator localhost
const val BASE_URL = "http://10.0.2.2:3000/api" 

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
                .url("${BASE_URL}/api/auth/fcm-token")
                .post(requestBody)
                .build()
                
            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {}
                override fun onResponse(call: Call, response: Response) {}
            })
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        askNotificationPermission()

        super.onCreate(savedInstanceState)
        setContent {
            CustomerCareApp()
        }
    }
}

enum class Screen { Login, Dashboard, Payments, Conversations }

@Composable
fun CustomerCareApp() {
    var currentScreen by remember { mutableStateOf(Screen.Login) }
    
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
            when (currentScreen) {
                Screen.Login -> LoginScreen(onLoginSuccess = { currentScreen = Screen.Dashboard })
                Screen.Dashboard -> DashboardScreen(
                    onNavigate = { currentScreen = it },
                    onLogout = { currentScreen = Screen.Login }
                )
                Screen.Payments -> PaymentsScreen(
                    onBack = { currentScreen = Screen.Dashboard }
                )
                Screen.Conversations -> ConversationsScreen(
                    onBack = { currentScreen = Screen.Dashboard }
                )
            }
        }
    }
}

@Composable
fun LoginScreen(onLoginSuccess: () -> Unit) {
    var email by remember { mutableStateOf("admin@tesla.com") } // default for ease
    var password by remember { mutableStateOf("password") }
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
fun ConversationsScreen(onBack: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("CONVERSATIONS", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text("Back", color = Color.Gray, modifier = Modifier.clickable { onBack() })
        }
        Spacer(modifier = Modifier.height(24.dp))
        Text("Inbox interface would be populated here.", color = Color.Gray)
    }
}
