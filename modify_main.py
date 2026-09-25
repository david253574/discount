import re

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

# 1. Add Screen types and variables
content = content.replace("enum class Screen { Login, Dashboard, Payments, Conversations }", "sealed class Screen { object Login : Screen(); object Dashboard : Screen(); object Payments : Screen(); object Conversations : Screen(); data class Chat(val orderId: String) : Screen() }")
content = content.replace("var currentScreen by remember { mutableStateOf(Screen.Login) }", "var currentScreen by remember { mutableStateOf<Screen>(Screen.Login) }")
content = content.replace("currentScreen = Screen.Dashboard", "currentScreen = Screen.Dashboard") # no-op

# 2. Modify onCreate to read intent
on_create_code = """
    override fun onCreate(savedInstanceState: Bundle?) {
        askNotificationPermission()

        super.onCreate(savedInstanceState)
        
        var initialOrderId: String? = intent?.getStringExtra("orderId")

        setContent {
            CustomerCareApp(initialOrderId = initialOrderId)
        }
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Note: For a real app, handling onNewIntent dynamically in Compose requires a bit more wiring,
        // but since we clear top on notification tap, onCreate is usually called.
    }
"""
content = re.sub(r'override fun onCreate.*?setContent \{.*?CustomerCareApp\(\).*?\}', on_create_code, content, flags=re.DOTALL)
content = content.replace("fun CustomerCareApp() {", "fun CustomerCareApp(initialOrderId: String? = null) {")

# 3. Add initial navigation effect
nav_effect = """
    var currentScreen by remember { mutableStateOf<Screen>(Screen.Login) }
    
    LaunchedEffect(initialOrderId) {
        if (initialOrderId != null && cookieJar.loadForRequest(HttpUrl.parse("$BASE_URL")!!).isNotEmpty()) {
            currentScreen = Screen.Chat(initialOrderId)
        }
    }
"""
content = content.replace("var currentScreen by remember { mutableStateOf<Screen>(Screen.Login) }", nav_effect)

# 4. Update the 'when' block
old_when = """            when (currentScreen) {
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
            }"""

new_when = """            when (val s = currentScreen) {
                is Screen.Login -> LoginScreen(onLoginSuccess = { 
                    currentScreen = if (initialOrderId != null) Screen.Chat(initialOrderId) else Screen.Dashboard 
                })
                is Screen.Dashboard -> DashboardScreen(
                    onNavigate = { currentScreen = it },
                    onLogout = { currentScreen = Screen.Login }
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
            }"""
content = content.replace(old_when, new_when)

# 5. Remove old ConversationsScreen and replace with the real code
real_screens = """
@Composable
fun ConversationsScreen(onBack: () -> Unit, onChat: (String) -> Unit) {
    var conversations by remember { mutableStateOf<org.json.JSONArray?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    fun fetchConversations() {
        loading = true
        error = null
        kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
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
        fetchConversations()
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
        kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
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
        
        kotlinx.coroutines.GlobalScope.launch(Dispatchers.IO) {
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

    LaunchedEffect(Unit) {
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
                    val isStaff = msg.optString("sender") != "CUSTOMER"
                    val atts = msg.optJSONArray("attachments")
                    
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
                            Text(if (isStaff) "CUSTOMER CARE" else "CUSTOMER", fontSize = 10.sp, color = Color.LightGray, fontWeight = FontWeight.Bold)
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
                                        io.coil.compose.AsyncImage(
                                            model = io.coil.request.ImageRequest.Builder(context)
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
"""

content = re.sub(r'@Composable\nfun ConversationsScreen.*?\{.*?\}\n\}', real_screens, content, flags=re.DOTALL)

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)
