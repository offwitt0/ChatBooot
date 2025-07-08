const sessionKey = "chat_session_id";
const historyKey = "chat_history";
const phoneKey = "chat_user_phone";

const sessionId = localStorage.getItem(sessionKey) || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem(sessionKey, id);
  return id;
})();

const chatBox = document.getElementById("chat-box");

window.onload = () => {
  const history = JSON.parse(localStorage.getItem(historyKey)) || [];
  if (history.length === 0) {
    addMessage("🤖 Hello! I’m your vacation assistant. Ask me where to stay on your next trip.", "bot");
    saveToHistory({ sender: "bot", text: "🤖 Hello! I’m your vacation assistant. Ask me where to stay on your next trip." });
  } else {
    history.forEach(msg => addMessage(msg.text, msg.sender));
  }
};

async function sendMessage() {
  const textarea = document.getElementById("message");
  const userMsg = textarea.value.trim();
  if (!userMsg) return;

  let phone = localStorage.getItem(phoneKey);
  if (!phone) {
    phone = prompt("📱 Please enter your phone number (e.g., +201234567890):");
    if (!/^\+?[0-9]{10,15}$/.test(phone)) {
      alert("❌ Invalid phone number format.");
      return;
    }
      localStorage.setItem(phoneKey, phone.replace(/^\+/, ""));
  }

  addMessage("🧑 " + userMsg, "user");
  saveToHistory({ sender: "user", text: "🧑 " + userMsg });
  textarea.value = "";

  addMessage("⏳ Waiting for response...", "bot");

  try {
    const res = await fetch("https://chatboot-production-8e99.up.railway.app/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMsg,
        lang: "en",
        session_id: sessionId,
        phone: phone
      }),
    });

    const data = await res.json();
    const botText = "🤖 " + (data.response || "No response received.");

    removeLastBotMessage();
    addMessage(botText, "bot");
    saveToHistory({ sender: "bot", text: botText });
  } catch (err) {
    console.error(err);
    removeLastBotMessage();
    const errorMsg = "❌ Error talking to chatbot.";
    addMessage(errorMsg, "bot");
    saveToHistory({ sender: "bot", text: errorMsg });
  }
}

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.innerHTML = text.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank">$1</a>'
  );
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function saveToHistory(entry) {
  const history = JSON.parse(localStorage.getItem(historyKey)) || [];
  history.push(entry);
  localStorage.setItem(historyKey, JSON.stringify(history));
}

function removeLastBotMessage() {
  const messages = [...document.querySelectorAll(".bot")];
  if (messages.length > 0) {
    chatBox.removeChild(messages[messages.length - 1]);
  }
}

function resetChat() {
  localStorage.removeItem(historyKey);
  localStorage.removeItem(sessionKey);
  localStorage.removeItem(phoneKey);
  location.reload();
}