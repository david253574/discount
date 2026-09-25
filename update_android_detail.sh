#!/bin/bash

sed -i '/fun ConversationDetailScreen/,/^[}]/d' android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt

cat << 'INNER_EOF' >> android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt

@Composable
fun ConversationDetailScreen(orderId: String, onBack: () -> Unit) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var messages by remember { mutableStateOf<List<JSONObject>>(emptyList()) }
    var inputText by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    var sending by remember { mutableStateOf(false) }
    var pendingAttachmentUri by remember { mutableStateOf<android.net.Uri?>(null) }
    var pendingMimeType by remember { mutableStateOf<String>("") }
    var pendingFilename by remember { mutableStateOf<String>("") }
    
    val launcher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: android.net.Uri? ->
        if (uri != null) {
            pendingAttachmentUri = uri
            val cr = context.contentResolver
            pendingMimeType = cr.getType(uri) ?: "application/octet-stream"
            pendingFilename = "attachment_${System.currentTimeMillis()}"
            
            cr.query(uri, null, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (nameIndex != -1 && cursor.moveToFirst()) {
                    pendingFilename = cursor.getString(nameIndex)
                }
            }
        }
    }

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
        if (inputText.isBlank() && pendingAttachmentUri == null) return
        sending = true
        val textToSend = inputText
        val uriToSend = pendingAttachmentUri
        val mimeToSend = pendingMimeType
        val nameToSend = pendingFilename
        inputText = ""
        pendingAttachmentUri = null
        
        scope.launch(Dispatchers.IO) {
            try {
                var attachmentJson: JSONObject? = null
                
                if (uriToSend != null) {
                    val cr = context.contentResolver
                    val inputStream = cr.openInputStream(uriToSend)
                    val bytes = inputStream?.readBytes() ?: ByteArray(0)
                    inputStream?.close()
                    
                    val uploadRequest = Request.Builder()
                        .url("$BASE_URL/upload?filename=$nameToSend")
                        .post(bytes.toRequestBody(mimeToSend.toMediaType()))
                        .build()
                        
                    val uploadResponse = client.newCall(uploadRequest).execute()
                    if (uploadResponse.isSuccessful) {
                        val uploadRespJson = JSONObject(uploadResponse.body?.string() ?: "{}")
                        val url = uploadRespJson.optString("url")
                        
                        attachmentJson = JSONObject().apply {
                            put("filename", nameToSend)
                            put("mimeType", mimeToSend)
                            put("size", bytes.size)
                            put("url", url)
                        }
                    }
                }
                
                val json = JSONObject().apply {
                    put("body", textToSend)
                    put("sender", "CUSTOMER_CARE")
                    if (attachmentJson != null) {
                        put("attachments", org.json.JSONArray().put(attachmentJson))
                    }
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
                val attachArr = msg.optJSONArray("attachments")
                val attachment = if (attachArr != null && attachArr.length() > 0) attachArr.getJSONObject(0) else null
                
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = if (isStaff) Arrangement.End else Arrangement.Start
                ) {
                    Surface(
                        color = if (isStaff) Color(0xFF1d4ed8) else Color(0xFF262626),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.widthIn(max = 280.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            if (attachment != null) {
                                val url = attachment.optString("url")
                                val mime = attachment.optString("mimeType", "")
                                if (mime.startsWith("image/")) {
                                    coil.compose.AsyncImage(
                                        model = url,
                                        contentDescription = "Attachment",
                                        modifier = Modifier.fillMaxWidth().heightIn(max = 200.dp).padding(bottom = if (msg.optString("body", "").isNotBlank()) 8.dp else 0.dp)
                                    )
                                } else {
                                    Surface(
                                        color = Color.Black.copy(alpha = 0.2f),
                                        shape = RoundedCornerShape(4.dp),
                                        modifier = Modifier.fillMaxWidth().padding(bottom = if (msg.optString("body", "").isNotBlank()) 8.dp else 0.dp).clickable {
                                            val i = android.content.Intent(android.content.Intent.ACTION_VIEW)
                                            i.data = android.net.Uri.parse(url)
                                            context.startActivity(i)
                                        }
                                    ) {
                                        Text("📄 ${attachment.optString("filename")}", modifier = Modifier.padding(8.dp), fontSize = 12.sp, color = Color.White)
                                    }
                                }
                            }
                            if (msg.optString("body", "").isNotBlank()) {
                                Text(
                                    text = msg.optString("body", ""),
                                    color = Color.White,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            }
        }
        
        if (pendingAttachmentUri != null) {
            Row(modifier = Modifier.fillMaxWidth().background(Color(0xFF1a1a1a)).padding(horizontal = 24.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("📎 $pendingFilename", color = Color.Gray, fontSize = 12.sp, modifier = Modifier.weight(1f), maxLines = 1)
                Text("Remove", color = Color.Red, fontSize = 12.sp, modifier = Modifier.clickable { pendingAttachmentUri = null })
            }
        }
        
        Row(
            modifier = Modifier.fillMaxWidth().background(Color(0xFF111111)).padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("+", color = Color.Gray, fontSize = 24.sp, modifier = Modifier.clickable { launcher.launch("*/*") }.padding(8.dp))
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
                enabled = !sending && (inputText.isNotBlank() || pendingAttachmentUri != null),
                shape = RoundedCornerShape(8.dp)
            ) {
                if (sending) Text("...") else Text("SEND")
            }
        }
    }
}
INNER_EOF

chmod +x update_android_detail.sh
./update_android_detail.sh
