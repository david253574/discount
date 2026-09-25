import re

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "r") as f:
    content = f.read()

old_logic = """                    val isStaff = msg.optString("sender") != "CUSTOMER"
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
                            Text(if (isStaff) "CUSTOMER CARE" else "CUSTOMER", fontSize = 10.sp, color = Color.LightGray, fontWeight = FontWeight.Bold)"""

new_logic = """                    val senderValue = msg.optString("sender")
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
                            Text(senderDisplay, fontSize = 10.sp, color = Color.LightGray, fontWeight = FontWeight.Bold)"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
else:
    print("WARNING: Could not find old_logic chunk.")

with open("android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt", "w") as f:
    f.write(content)
