const fs = require('fs');

let code = fs.readFileSync('src/app/payment/[id]/page.tsx', 'utf-8');

const sendMessageTarget = `  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatBody.trim()) return;
    setSending(true);
    try {
      const res = await fetch(\`/api/payment/\${orderId}/message\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: chatBody })
      });
      if (res.ok) {
        setChatBody("");
        fetchData();
      }
    } finally {
      setSending(false);
    }
  };`;

const sendMessageReplacement = `  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatBody.trim() && !uploadFile) return;
    setSending(true);
    try {
      let attachmentJson = null;
      if (uploadFile) {
        const uploadRes = await fetch(\`/api/upload?filename=\${encodeURIComponent(uploadFile.name)}\`, {
          method: 'POST',
          body: uploadFile
        });
        if (uploadRes.ok) {
          const upData = await uploadRes.json();
          attachmentJson = {
            filename: uploadFile.name,
            mimeType: uploadFile.type || 'application/octet-stream',
            size: uploadFile.size,
            url: upData.url
          };
        } else {
          alert('Failed to upload file');
          setSending(false);
          return;
        }
      }

      const res = await fetch(\`/api/payment/\${orderId}/message\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          body: chatBody,
          attachments: attachmentJson ? [attachmentJson] : undefined
        })
      });
      if (res.ok) {
        setChatBody("");
        setUploadFile(null);
        fetchData();
      }
    } finally {
      setSending(false);
    }
  };`;

code = code.replace(sendMessageTarget, sendMessageReplacement);

const uiTarget = `                  <form onSubmit={sendMessage} className="p-4 border-t border-[#222] bg-[#111111] flex gap-2">
                    <input type="text" placeholder="Type your message..." value={chatBody} onChange={e=>setChatBody(e.target.value)} className="flex-1 bg-transparent text-sm focus:outline-none" />
                    <button type="submit" disabled={sending} className="text-[#1d4ed8] font-bold text-sm uppercase tracking-wider disabled:opacity-50 flex items-center gap-2">
                      <Send className="w-4 h-4" /> Send
                    </button>
                  </form>`;

const uiReplacement = `                  {uploadFile && (
                    <div className="p-2 px-4 bg-[#1a1a1a] border-t border-[#222] flex items-center justify-between">
                      <span className="text-xs text-green-400">📎 {uploadFile.name}</span>
                      <button type="button" onClick={() => setUploadFile(null)} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  )}
                  <form onSubmit={sendMessage} className="p-4 border-t border-[#222] bg-[#111111] flex gap-2 items-center">
                    <label className="cursor-pointer text-gray-500 hover:text-white transition-colors" title="Attach file">
                      <input type="file" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) setUploadFile(e.target.files[0]); e.target.value = ''; }} />
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                    </label>
                    <input type="text" placeholder="Type your message..." value={chatBody} onChange={e=>setChatBody(e.target.value)} className="flex-1 bg-transparent text-sm focus:outline-none ml-2" />
                    <button type="submit" disabled={sending || (!chatBody.trim() && !uploadFile)} className="text-[#1d4ed8] font-bold text-sm uppercase tracking-wider disabled:opacity-50 flex items-center gap-2">
                      <Send className="w-4 h-4" />
                    </button>
                  </form>`;

code = code.replace(uiTarget, uiReplacement);

// Render attachments in chat history
const msgRenderTarget = `                        {msg.body && <p className="text-sm mt-1 leading-relaxed text-gray-200">{msg.body}</p>}
                      </div>
                    );`;

const msgRenderReplacement = `                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((att: any, i: number) => (
                              att.mimeType?.startsWith('image/') ? (
                                <img key={i} src={att.url} alt="Attachment" className="max-w-full rounded-lg max-h-48 object-cover border border-[#444]" />
                              ) : (
                                <a key={i} href={att.url} target="_blank" rel="noreferrer" className="block text-xs bg-black/20 p-2 rounded border border-[#444] text-[#60a5fa] hover:underline">
                                  📄 {att.filename}
                                </a>
                              )
                            ))}
                          </div>
                        )}
                        {msg.body && <p className="text-sm mt-2 leading-relaxed text-gray-200">{msg.body}</p>}
                      </div>
                    );`;

code = code.replace(msgRenderTarget, msgRenderReplacement);

fs.writeFileSync('src/app/payment/[id]/page.tsx', code);
