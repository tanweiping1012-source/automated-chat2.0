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
  const el = $("#chat")
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function renderInitial() {
  const chat = $("#chat")
  if (!chat) return
  const cur = flow[state.step]
  chat.innerHTML = renderBubbleLeft(cur.bot) + renderReplies(cur.replies)
  scrollToBottom()
}

function disableReplies() {
  const chat = $("#chat")
  if (!chat) return
  chat.querySelectorAll(".reply").forEach((b) => (b.disabled = true))
}

function appendHtml(html) {
  const chat = $("#chat")
  if (!chat) return
  const wrapper = document.createElement("div")
  wrapper.innerHTML = html
  while (wrapper.firstChild) chat.appendChild(wrapper.firstChild)
  scrollToBottom()
}

function advanceWithReply(text) {
  if (state.locked) return
  state.locked = true
  disableReplies()

  appendHtml(renderBubbleRight(text))

  const nextStep = state.step + 1
  if (nextStep >= flow.length) {
    appendHtml(renderBubbleLeft("Thanks! We’ll tailor recommendations for you in the next message."))
    state.locked = false
    return
  }

  state.step = nextStep
  const cur = flow[state.step]
  appendHtml(renderBubbleLeft(cur.bot) + renderReplies(cur.replies))
  state.locked = false
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]")
  if (!btn) return
  if (btn.dataset.action !== "reply") return
  const value = btn.dataset.value || ""
  advanceWithReply(value)
})

renderInitial()
