import re

with open("src/app/payment/[id]/page.tsx", "r") as f:
    content = f.read()

# 1. Faster polling
content = content.replace("setInterval(fetchData, 10000)", "setInterval(fetchData, 3000)")

# 2. Add uploadFile state
if "const [uploadFile" not in content:
    content = content.replace('const [sending, setSending] = useState(false);', 'const [sending, setSending] = useState(false);\n  const [uploadFile, setUploadFile] = useState<File | null>(null);')

# 3. Update sendMessage
old_send = """  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/payment/${orderId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: chatBody })
      });
      if (res.ok) {
        setChatBody("");
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
    setSending(false);
  };"""

new_send = """  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatBody.trim() && !uploadFile) return;
    setSending(true);

    let finalAttachments = [];
    if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
            const upJson = await uploadRes.json();
            finalAttachments.push({
                url: upJson.url,
                filename: upJson.filename,
                mimeType: upJson.contentType,
                size: upJson.size
            });
        }
    }

    const payload = {
        body: chatBody,
        attachments: finalAttachments.length > 0 ? finalAttachments : undefined
    };

    try {
      const res = await fetch(`/api/payment/${orderId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setChatBody("");
        setUploadFile(null);
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
    setSending(false);
  };"""

if old_send in content:
    content = content.replace(old_send, new_send)

# 4. Update the chat form
old_form = """              <form onSubmit={sendMessage} className="p-4 md:p-6 border-t border-[#222] bg-[#111]">
                <div className="flex gap-2 md:gap-4">
                  <input
                    type="text"
                    value={chatBody}
                    onChange={(e) => setChatBody(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 bg-[#222] border border-[#333] p-3 text-white focus:outline-none focus:border-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !chatBody.trim()}
                    className="bg-white text-black px-6 md:px-8 font-bold tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    SEND
                  </button>
                </div>
              </form>"""

new_form = """              <form onSubmit={sendMessage} className="p-4 md:p-6 border-t border-[#222] bg-[#111]">
                {uploadFile && (
                  <div className="mb-2 text-xs text-green-400">
                    Selected: {uploadFile.name} 
                    <button type="button" onClick={() => setUploadFile(null)} className="ml-2 text-red-400">X</button>
                  </div>
                )}
                <div className="flex gap-2 md:gap-4 items-center">
                  <label className="cursor-pointer bg-[#333] px-4 py-3 font-bold text-white hover:bg-[#444] transition-colors">
                    +
                    <input type="file" className="hidden" onChange={(e) => { if (e.target.files && e.target.files.length > 0) setUploadFile(e.target.files[0]) }} />
                  </label>
                  <input
                    type="text"
                    value={chatBody}
                    onChange={(e) => setChatBody(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 bg-[#222] border border-[#333] p-3 text-white focus:outline-none focus:border-gray-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || (!chatBody.trim() && !uploadFile)}
                    className="bg-white text-black px-6 md:px-8 font-bold tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    SEND
                  </button>
                </div>
              </form>"""

if old_form in content:
    content = content.replace(old_form, new_form)

with open("src/app/payment/[id]/page.tsx", "w") as f:
    f.write(content)
