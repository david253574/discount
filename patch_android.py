import re

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

# Add java.time imports if not present
if "import java.time.Instant" not in content:
    content = content.replace("import android.content.Intent", "import android.content.Intent\nimport java.time.Instant\nimport java.time.ZoneId\nimport java.time.format.DateTimeFormatter")

# Look for the message rendering code:
old_render = """                    Row(
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
                        }
                    }"""

new_render = """                    var timeDisplay = ""
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
                    }"""

if old_render in content:
    content = content.replace(old_render, new_render)
else:
    print("WARNING: Could not find old_render chunk.")

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)

