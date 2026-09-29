const fs = require('fs');

let code = fs.readFileSync('android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt', 'utf-8');

const target = `                            if (response.isSuccessful) {
                                onLoginSuccess()
                            } else {`;

const replacement = `                            if (response.isSuccessful) {
                                // Now logged in, send FCM token
                                com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                                    if (task.isSuccessful) {
                                        val fcmToken = task.result
                                        val json = org.json.JSONObject().apply {
                                            put("fcmToken", fcmToken)
                                            put("platform", "android")
                                        }
                                        val req = okhttp3.Request.Builder()
                                            .url("\${BASE_URL}/auth/fcm-token")
                                            .post(json.toString().toRequestBody("application/json".toMediaType()))
                                            .build()
                                        client.newCall(req).enqueue(object : okhttp3.Callback {
                                            override fun onFailure(call: okhttp3.Call, e: java.io.IOException) {}
                                            override fun onResponse(call: okhttp3.Call, resp: okhttp3.Response) {}
                                        })
                                    }
                                }
                                onLoginSuccess()
                            } else {`;

code = code.replace(target, replacement);
fs.writeFileSync('android_app/app/src/main/java/com/tesla/customercare/MainActivity.kt', code);
