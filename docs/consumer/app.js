const $ = (sel, root = document) => root.querySelector(sel)

const flow = [
  {
    id: "q1",
    bot:
      "To help us recommend the right products, what kind of outfits do you usually prefer?",
    replies: [
      "I like relaxed cotton tees.",
      "I prefer sporty sets and sneakers.",
      "I mostly wear casual streetwear.",
    ],
  },
  {
    id: "q2",
    bot: "Got it. Which style do you like most right now?",
    replies: ["Sportswear", "Casual wear", "Elegant style"],
  },
  {
    id: "q3",
    bot: "Great choice. What’s your budget range for a full outfit?",
    replies: ["Under $50", "$50–$100", "$100–$200", "$200+"],
  },
  {
    id: "q4",
    bot: "Last question — what size do you usually wear?",
    replies: ["XS", "S", "M", "L", "XL"],
  },
]

const state = {
  step: 0,
  locked: false,
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function renderBubbleLeft(text) {
  return `
    <div class="row row--left">
      <div class="avatar" aria-hidden="true"></div>
      <div class="bubble">${escapeHtml(text)}</div>
    </div>
  `
}

function renderBubbleRight(text) {
  return `
    <div class="row row--right">
      <div class="bubble bubble--user">${escapeHtml(text)}</div>
    </div>
  `
}

function renderReplies(replies) {
  return `
    <div class="quickReplies" aria-label="Quick replies">
      ${replies
        .map(
          (t) =>
            `<button class="reply" type="button" data-action="reply" data-value="${escapeHtml(t)}">${escapeHtml(t)}</button>`
        )
        .join("")}
    </div>
  `
}

function scrollToBottom() {
  const el = $("#messages")
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function renderInitial() {
  const messages = $("#messages")
  const replies = $("#replies")
  if (!messages || !replies) return
  const cur = flow[state.step]
  messages.innerHTML = renderBubbleLeft(cur.bot)
  replies.innerHTML = renderReplies(cur.replies)
  scrollToBottom()
}

function disableReplies() {
  const replies = $("#replies")
  if (!replies) return
  replies.querySelectorAll(".reply").forEach((b) => (b.disabled = true))
}

function appendMessageHtml(html) {
  const messages = $("#messages")
  if (!messages) return
  const wrapper = document.createElement("div")
  wrapper.innerHTML = html
  while (wrapper.firstChild) messages.appendChild(wrapper.firstChild)
  scrollToBottom()
}

async function advanceWithReply(text, pressedEl) {
  if (state.locked) return
  state.locked = true
  if (pressedEl) pressedEl.classList.add("reply--pressed")
  await delay(180)
  disableReplies()
  await delay(120)

  const replies = $("#replies")
  if (replies) replies.innerHTML = ""
  appendMessageHtml(renderBubbleRight(text))
  await delay(260)

  const nextStep = state.step + 1
  if (nextStep >= flow.length) {
    appendMessageHtml(renderBubbleLeft("Thanks! We’ll tailor recommendations for you in the next message."))
    state.locked = false
    return
  }

  state.step = nextStep
  const cur = flow[state.step]
  appendMessageHtml(renderBubbleLeft(cur.bot))
  if (replies) replies.innerHTML = renderReplies(cur.replies)
  state.locked = false
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]")
  if (!btn) return
  if (btn.dataset.action !== "reply") return
  const value = btn.dataset.value || ""
  advanceWithReply(value, btn)
})

renderInitial()
