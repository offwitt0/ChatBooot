const sessionKey = "chat_session_id";
const historyKey = "chat_history";
const phoneKey = "chat_user_phone";

// Web Speech API setup
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;

let currentLang = 'en-US';  // default language

function setRecognitionLang(langCode) {
  recognition.lang = langCode;
}

// Set initial language
setRecognitionLang(currentLang);

// When speech is recognized
recognition.onresult = function (event) {
  const transcript = event.results[0][0].transcript;
  document.getElementById("message").value = transcript;
  sendMessage();
};

recognition.onerror = function (event) {
  alert("❌ Voice recognition error: " + event.error);
};

function toggleVoice() {
  recognition.start();
}

function toggleLanguage() {
  if (currentLang === 'en-US') {
    currentLang = 'ar-EG';  // Arabic (Egypt)
    document.getElementById("lang-btn").innerText = "🌐 EN";
  } else {
    currentLang = 'en-US';
    document.getElementById("lang-btn").innerText = "🌐 AR";
  }
  setRecognitionLang(currentLang);
}


const sessionId = localStorage.getItem(sessionKey) || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem(sessionKey, id);
  return id;
})();

const chatBox = document.getElementById("chat-box");

window.onload = () => {
  localStorage.removeItem("chat_history");
  addMessage("🤖 Hello! I’m your vacation assistant. Ask me where to stay on your next trip.", "bot");
  saveToHistory({ sender: "bot", text: "🤖 Hello! I’m your vacation assistant. Ask me where to stay on your next trip." });
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
    phone = phone.replace(/^\+/, "");
    localStorage.setItem(phoneKey, phone);
  }

  // 🔁 Always check if user linked Telegram
  const precheck = await fetch("https://chatboot-production-8e99.up.railway.app/check-phone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  const check = await precheck.json();
  if (!check.linked && localStorage.getItem("telegram_modal_dismissed") !== "true") {
    const modal = document.getElementById("telegram-modal");
    if (modal) modal.style.display = "flex";
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
    console.error("❌ Chatbot request failed:", err);
    removeLastBotMessage();
    addMessage("❌ Error talking to chatbot.", "bot");
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
    const last = messages[messages.length - 1];
    if (last.innerText.includes("⏳")) {
      chatBox.removeChild(last);
    }
  }
}

function resetChat() {
  localStorage.removeItem(historyKey); // 🧹 Only clear chat messages
  location.reload();                   // 🔄 Reload the page to show fresh UI
}

function dismissTelegramModal() {
  const modal = document.getElementById("telegram-modal");
  if (modal) modal.style.display = "none";
  localStorage.setItem("telegram_modal_dismissed", "true");
}