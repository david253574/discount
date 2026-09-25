#!/bin/bash

# Extract the file excluding the stub ConversationsScreen
sed -i '/fun ConversationsScreen/,/^[}]/d' android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt

# Append the real ConversationsScreen and ConversationDetailScreen
cat << 'INNER_EOF' >> android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt

@Composable
fun ConversationsScreen(onBack: () -> Unit) {
    var conversations by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var selectedOrderId by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun fetchConversations() {
        scope.launch(Dispatchers.IO) {
            try {
                val request = Request.Builder().url("$BASE_URL/admin/conversations").get().build()
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    val str = response.body?.string()
                    val arr = JSONObject(str ?: "{}").optJSONArray("conversations")
                    val list = mutableListOf<JSONObject>()
                    if (arr != null) {
                        for (i in 0 until arr.length()) list.add(arr.getJSONObject(i))
                    }
                    withContext(Dispatchers.Main) { conversations = list }
                }
            } catch (e: Exception) {}
        }
    }

    LaunchedEffect(Unit) {
        while (true) {
            fetchConversations()
            kotlinx.coroutines.delay(5000)
        }
    }

    if (selectedOrderId != null) {
        ConversationDetailScreen(
            orderId = selectedOrderId!!,
            onBack = { selectedOrderId = null }
        )
    } else {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(modifier = Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("CONVERSATIONS", fontSize = 20.sp, fontWeight = FontWeight.Bold)
                Text("Back", color = Color.Gray, modifier = Modifier.clickable { onBack() })
            }
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(conversations) { c ->
                    val order = c.optJSONObject("order")
                    val customerName = order?.optString("name", "Unknown") ?: "Unknown"
                    val orderIdStr = order?.optString("id", "") ?: ""
                    
                    val msgs = c.optJSONArray("messages")
                    val lastMsg = if (msgs != null && msgs.length() > 0) msgs.getJSONObject(0).optString("body", "") else "No messages yet"

                    Surface(
                        color = Color(0xFF1a1a1a),
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 8.dp).clickable { selectedOrderId = orderIdStr },
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(customerName, fontWeight = FontWeight.Bold)
                                Text(c.optString("status", ""), color = Color(0xFF3b82f6), fontSize = 12.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(lastMsg, color = Color.Gray, fontSize = 14.sp, maxLines = 1)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ConversationDetailScreen(orderId: String, onBack: () -> Unit) {
    var messages by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var inputText by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    var sending by remember { mutableStateOf(false) }
    
    fun fetchMessages() {
        scope.launch(Dispatchers.IO) {
            try {
                val request = Request.Builder().url("$BASE_URL/payment/$orderId").get().build()
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    val str = response.body?.string()
                    val obj = JSONObject(str ?: "{}")
                    val conv = obj.optJSONObject("conversation")
                    val arr = conv?.optJSONArray("messages")
                    val list = mutableListOf<JSONObject>()
                    if (arr != null) {
                        for (i in 0 until arr.length()) list.add(arr.getJSONObject(i))
                    }
                    withContext(Dispatchers.Main) { messages = list }
                }
            } catch (e: Exception) {}
        }
    }

    LaunchedEffect(orderId) {
        while (true) {
            fetchMessages()
            kotlinx.coroutines.delay(3000)
        }
    }

    fun sendMessage() {
        if (inputText.isBlank()) return
        sending = true
        val textToSend = inputText
        inputText = "" // optimistic clear
        scope.launch(Dispatchers.IO) {
            try {
                val json = JSONObject().apply {
                    put("body", textToSend)
                    put("sender", "CUSTOMER_CARE")
                }
                val body = json.toString().toRequestBody("application/json".toMediaType())
                val request = Request.Builder().url("$BASE_URL/payment/$orderId/message").post(body).build()
                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    fetchMessages()
                }
            } catch (e: Exception) {}
            finally {
                withContext(Dispatchers.Main) { sending = false }
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(modifier = Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("ORDER #${orderId.take(8).uppercase()}", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            Text("Back", color = Color.Gray, modifier = Modifier.clickable { onBack() })
        }
        
        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 24.dp),
            reverseLayout = false
        ) {
            items(messages) { msg ->
                val isStaff = msg.optString("sender") == "CUSTOMER_CARE"
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = if (isStaff) Arrangement.End else Arrangement.Start
                ) {
                    Surface(
                        color = if (isStaff) Color(0xFF1d4ed8) else Color(0xFF262626),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.widthIn(max = 280.dp)
                    ) {
                        Text(
                            text = msg.optString("body", ""),
                            modifier = Modifier.padding(12.dp),
                            color = Color.White,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
        
        Row(
            modifier = Modifier.fillMaxWidth().background(Color(0xFF111111)).padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Type a message...") },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color.Transparent,
                    unfocusedBorderColor = Color.Transparent
                )
            )
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = { sendMessage() },
                enabled = !sending && inputText.isNotBlank(),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("SEND")
            }
        }
    }
}
INNER_EOF

chmod +x update_inbox.sh
./update_inbox.sh
