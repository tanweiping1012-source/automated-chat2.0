const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

const state = {
  activeTab: "automated",
  expandedQuestionId: "q1",
  previewIndex: 0,
  addMenuOpen: false,
  questions: [
    {
      id: "q1",
      title: "Custom question 1",
      questionText:
        "Hello~ Thank you for your attention ❤️\nWe value every customer's needs and look forward to communicating with you further~\nMay I ask how old you are?",
      type: "custom",
      acceptOtherAnswers: false,
      answers: [
        { id: "a1", text: "<18", goTo: "next" },
        { id: "a2", text: "18-30", goTo: "next" },
        { id: "a3", text: "30-50", goTo: "next" },
        { id: "a4", text: "50-70", goTo: "next" },
        { id: "a5", text: ">70", goTo: "next" },
      ],
    },
    {
      id: "q2",
      title: "Phone number",
      questionText: "May I ask what your phone number is?",
      type: "userInfo",
      userInfoKind: "phone",
      answerValidation: true,
    },
    {
      id: "q3",
      title: "Custom question 3",
      questionText: "What is your preferred contact method?",
      type: "custom",
      acceptOtherAnswers: false,
      answers: [
        { id: "a1", text: "Phone", goTo: "complete" },
        { id: "a2", text: "Email", goTo: "complete" },
      ],
    },
    {
      id: "q4",
      title: "Custom question 4",
      questionText: "Anything else you want to share?",
      type: "custom",
      acceptOtherAnswers: true,
      answers: [
        { id: "a1", text: "No, thanks", goTo: "complete" },
        { id: "a2", text: "Talk to a human", goTo: "complete" },
      ],
    },
    {
      id: "q5",
      title: "Custom question 5",
      questionText: "Pick a time range that works for you.",
      type: "custom",
      acceptOtherAnswers: false,
      answers: [
        { id: "a1", text: "Morning", goTo: "next" },
        { id: "a2", text: "Afternoon", goTo: "next" },
        { id: "a3", text: "Evening", goTo: "next" },
      ],
    },
    {
      id: "q6",
      title: "Custom question 6",
      questionText: "Thanks! We'll follow up soon.",
      type: "custom",
      acceptOtherAnswers: false,
      answers: [{ id: "a1", text: "Done", goTo: "complete" }],
    },
  ],
}

const MAX_QUESTION_LEN = 200

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2, 9)}`
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function renderAnswerRows(q) {
  if (q.type !== "custom") return ""
  return `
    <div class="answers" data-qid="${q.id}">
      ${q.answers
        .map(
          (a, idx) => `
        <div class="answerRow" data-aid="${a.id}">
          <input
            class="input"
            type="text"
            value="${escapeHtml(a.text)}"
            placeholder="Answer ${idx + 1}"
            data-action="updateAnswerText"
            data-qid="${q.id}"
            data-aid="${a.id}"
          />
          <span class="gotoLabel">go to</span>
          <select class="select" data-action="updateAnswerGoto" data-qid="${q.id}" data-aid="${a.id}">
            ${[
              { v: "next", label: "Next question" },
              { v: "complete", label: "Complete" },
              { v: "disqualify", label: "Disqualify" },
            ]
              .map(
                (opt) =>
                  `<option value="${opt.v}" ${opt.v === a.goTo ? "selected" : ""}>${opt.label}</option>`
              )
              .join("")}
          </select>
        </div>
      `
        )
        .join("")}
      <div class="field">
        <button class="btn btn--ghost" type="button" data-action="addAnswer" data-qid="${q.id}">+ Add answer</button>
      </div>
    </div>
  `
}

function renderContactHint() {
  return `
    <div class="contactHint">
      Create a message to invite people to share their contact information.
      People who have the “Autofill information” feature turned on will have their information pop up automatically for quick sharing.
    </div>
  `
}

function renderCheckRow({ qid, action, checked, label, showInfo = false }) {
  return `
    <div class="checkRow">
      <button
        class="checkbox ${checked ? "checkbox--checked" : ""}"
        type="button"
        data-action="${action}"
        data-qid="${qid}"
        aria-pressed="${checked}"
      ><span class="checkbox__mark"></span></button>
      <div class="checkLabel">
        <span>${escapeHtml(label)}</span>
        ${showInfo ? `<span class="infoDot" aria-hidden="true">i</span>` : ""}
      </div>
    </div>
  `
}

function renderQuestionCard(q, idx) {
  const expanded = q.id === state.expandedQuestionId
  const cls = expanded ? "accordion accordion--expanded" : "accordion accordion--collapsed"
  const qLen = (q.questionText ?? "").length

  const body =
    q.type === "userInfo"
      ? `
        <div class="field">
          <div class="field__label">Question text</div>
          <div class="textareaWrap">
            <textarea
              class="textarea"
              rows="3"
              maxlength="${MAX_QUESTION_LEN}"
              data-action="updateQuestionText"
              data-qid="${q.id}"
            >${escapeHtml(q.questionText)}</textarea>
            <div class="charCount">${qLen}/${MAX_QUESTION_LEN}</div>
          </div>
        </div>

        ${renderCheckRow({
          qid: q.id,
          action: "toggleAnswerValidation",
          checked: Boolean(q.answerValidation),
          label: "Answer validation",
          showInfo: true,
        })}

        ${
          q.answerValidation
            ? `
              <div class="helpBox">
                <div class="helpBox__icon" aria-hidden="true">i</div>
                <div>Enabling this may reduce the number of leads. Validation checks the accuracy of contact information.</div>
              </div>
            `
            : ""
        }
      `
      : `
        <div class="field">
          <div class="field__label">Question</div>
          <div class="field__helper">You can add up to 6 answers for each question.</div>
          <div class="textareaWrap">
            <textarea
              class="textarea"
              rows="4"
              maxlength="${MAX_QUESTION_LEN}"
              data-action="updateQuestionText"
              data-qid="${q.id}"
            >${escapeHtml(q.questionText)}</textarea>
            <div class="charCount">${qLen}/${MAX_QUESTION_LEN}</div>
          </div>
        </div>

        <div class="field">
          <div class="field__label">Select answer type</div>
          <div class="segmented" role="tablist" aria-label="Answer type">
            <button class="segBtn segBtn--active" type="button" role="tab" aria-selected="true">Text</button>
          </div>
        </div>

        ${renderAnswerRows(q)}

        ${renderCheckRow({
          qid: q.id,
          action: "toggleAcceptOtherAnswers",
          checked: Boolean(q.acceptOtherAnswers),
          label: "Accept other answers",
          showInfo: true,
        })}
      `

  return `
    <div class="${cls}" data-qid="${q.id}">
      <div class="accordion__header" data-action="toggleQuestion" data-qid="${q.id}">
        <div class="accordion__titleRow">
          <div class="accordion__title">${escapeHtml(q.title)}</div>
        </div>
        <div class="accordion__right">
          <button class="iconBtn" type="button" aria-label="Delete question" data-action="deleteQuestion" data-qid="${q.id}">
            <span class="trash"></span>
          </button>
          <button class="iconBtn" type="button" aria-label="Toggle question" data-action="toggleQuestion" data-qid="${q.id}">
            <span class="chev"></span>
          </button>
        </div>
      </div>
      <div class="accordion__body">
        ${body}
      </div>
    </div>
  `
}

function activePreviewQuestion() {
  if (state.questions.length === 0) return null
  const idx = clamp(state.previewIndex, 0, state.questions.length - 1)
  return state.questions[idx]
}

function renderMobilePreview() {
  const q = activePreviewQuestion()
  const total = state.questions.length
  const idx = clamp(state.previewIndex, 0, Math.max(0, total - 1))

  const bubbleText = q ? q.questionText : "No questions"
  const chipAnswers =
    q && q.type === "custom" ? q.answers.map((a) => a.text).filter(Boolean) : []
  const chips = q && q.type === "custom" ? (q.acceptOtherAnswers ? [...chipAnswers, "Other"] : chipAnswers) : []

  const chipsMarkup =
    q && q.type === "custom" && chips.length
      ? `<div class="chipWrap">${chips.map((t) => `<div class="chip">${escapeHtml(t)}</div>`).join("")}</div>`
      : ""

  const contactChoices =
    q && q.type === "userInfo"
      ? q.userInfoKind === "email"
        ? ["test@test.com"]
        : ["+1 (123) 456-7890", "customeremail@gmail.com"]
      : []

  return `
    <div class="mobileTop">
      <div class="navIcon" aria-hidden="true"><span class="backArrow"></span></div>
      <div class="profile">
        <div class="avatar" aria-hidden="true"></div>
        <div class="profileInfo">
          <div class="profileName">2129504_cn</div>
          <div class="profileStatus"> </div>
        </div>
      </div>
      <div class="topActions">
        <div class="topActionDot">⋯</div>
      </div>
    </div>

    <div class="mobileBody">
      <div class="mobileHero">
        <div class="mobileHeroAvatar" aria-hidden="true"></div>
        <div class="mobileHeroName">2129504_cn</div>
      </div>
      <div class="msgRow">
        <div class="avatar" aria-hidden="true" style="width:28px;height:28px"></div>
        <div class="bubble">${escapeHtml(bubbleText)}</div>
      </div>
      ${chipsMarkup}
      ${
        q && q.type === "userInfo"
          ? `
            <div class="mobileTapWrap">
              <div class="mobileTapRow">Tap to send</div>
              <div class="mobileTapClose" aria-hidden="true">×</div>
            </div>
            <div class="quickReplies">
              ${contactChoices.map((t) => `<div class="replyPill">${escapeHtml(t)}</div>`).join("")}
            </div>
          `
          : ""
      }
    </div>

    <div class="composer">
      <div class="composerIcon">+</div>
      <div class="composerField" aria-hidden="true"><span class="composerPlaceholder">Send a message...</span></div>
      <div class="composerIcon">☺</div>
    </div>

    <div class="pager">
      <button class="pagerBtn" type="button" data-action="pagerPrev" ${idx <= 0 ? "disabled" : ""} aria-label="Previous">
        <span class="pagerIcon pagerIcon--left"></span>
      </button>
      <div class="pagerText">${total === 0 ? "0/0" : `${idx + 1} / ${total}`}</div>
      <button class="pagerBtn" type="button" data-action="pagerNext" ${idx >= total - 1 ? "disabled" : ""} aria-label="Next">
        <span class="pagerIcon pagerIcon--right"></span>
      </button>
    </div>
  `
}

function render() {
  const questionsRoot = $("#questionsRoot")
  const mobileRoot = $("#mobileRoot")

  questionsRoot.innerHTML = state.questions.map(renderQuestionCard).join("")
  mobileRoot.innerHTML = renderMobilePreview()

  $$(".tab").forEach((btn) => {
    const active = btn.dataset.tab === state.activeTab
    btn.classList.toggle("tab--active", active)
    btn.setAttribute("aria-selected", String(active))
  })

  const addMenu = $("#addQuestionMenu")
  const addBtn = $("#addQuestionBtn")
  if (addMenu && addBtn) {
    addMenu.classList.toggle("menu--hidden", !state.addMenuOpen)
    addBtn.setAttribute("aria-expanded", String(state.addMenuOpen))
  }
}

function setExpandedQuestion(qid) {
  state.expandedQuestionId = qid
  const idx = state.questions.findIndex((q) => q.id === qid)
  if (idx >= 0) state.previewIndex = idx
}

function addQuestion(type) {
  const n = state.questions.filter((q) => q.type === "custom").length + 1
  const qid = uid("q")
  if (type === "userInfo") {
    state.questions.push({
      id: qid,
      title: "Phone number",
      questionText: "What is your phone number?",
      type: "userInfo",
      userInfoKind: "phone",
      answerValidation: true,
    })
  } else {
    state.questions.push({
      id: qid,
      title: `Custom question ${n}`,
      questionText: "New question",
      type: "custom",
      acceptOtherAnswers: false,
      answers: [{ id: uid("a"), text: "Option 1", goTo: "next" }],
    })
  }
  setExpandedQuestion(qid)
}

function deleteQuestion(qid) {
  const idx = state.questions.findIndex((q) => q.id === qid)
  if (idx < 0) return
  state.questions.splice(idx, 1)

  if (state.questions.length === 0) {
    state.expandedQuestionId = null
    state.previewIndex = 0
    return
  }

  const nextIdx = clamp(idx, 0, state.questions.length - 1)
  state.previewIndex = nextIdx
  state.expandedQuestionId = state.questions[nextIdx].id
}

function updateQuestionText(qid, text) {
  const q = state.questions.find((x) => x.id === qid)
  if (!q) return
  q.questionText = text
}

function toggleAnswerValidation(qid) {
  const q = state.questions.find((x) => x.id === qid)
  if (!q || q.type !== "userInfo") return
  q.answerValidation = !q.answerValidation
}

function toggleAcceptOtherAnswers(qid) {
  const q = state.questions.find((x) => x.id === qid)
  if (!q || q.type !== "custom") return
  q.acceptOtherAnswers = !q.acceptOtherAnswers
}

function toggleAddMenu(force) {
  if (typeof force === "boolean") {
    state.addMenuOpen = force
  } else {
    state.addMenuOpen = !state.addMenuOpen
  }
}

function addAnswer(qid) {
  const q = state.questions.find((x) => x.id === qid)
  if (!q) return
  q.answers.push({ id: uid("a"), text: "", goTo: "next" })
}

function updateAnswerText(qid, aid, text) {
  const q = state.questions.find((x) => x.id === qid)
  if (!q) return
  const a = q.answers.find((x) => x.id === aid)
  if (!a) return
  a.text = text
}

function updateAnswerGoto(qid, aid, value) {
  const q = state.questions.find((x) => x.id === qid)
  if (!q) return
  const a = q.answers.find((x) => x.id === aid)
  if (!a) return
  a.goTo = value
}

function toggleStaticAccordion(rootEl) {
  const acc = rootEl.closest(".accordion")
  if (!acc) return
  const expanded = acc.classList.contains("accordion--expanded")
  acc.classList.toggle("accordion--expanded", !expanded)
  acc.classList.toggle("accordion--collapsed", expanded)
}

function pager(delta) {
  state.previewIndex = clamp(state.previewIndex + delta, 0, Math.max(0, state.questions.length - 1))
  const q = activePreviewQuestion()
  if (q) state.expandedQuestionId = q.id
}

document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]")
  const clickedInMenu = Boolean(e.target.closest(".menuWrap"))
  if (!clickedInMenu && state.addMenuOpen) {
    toggleAddMenu(false)
    render()
  }
  if (!target) return
  const action = target.dataset.action

  if (action === "toggleQuestion") {
    const qid = target.dataset.qid
    if (!qid) return
    setExpandedQuestion(qid)
    render()
    return
  }

  if (action === "deleteQuestion") {
    const qid = target.dataset.qid
    if (!qid) return
    deleteQuestion(qid)
    render()
    return
  }

  if (action === "addAnswer") {
    const qid = target.dataset.qid
    if (!qid) return
    addAnswer(qid)
    render()
    return
  }

  if (action === "toggleAcceptOtherAnswers") {
    const qid = target.dataset.qid
    if (!qid) return
    toggleAcceptOtherAnswers(qid)
    render()
    return
  }

  if (action === "toggleAnswerValidation") {
    const qid = target.dataset.qid
    if (!qid) return
    toggleAnswerValidation(qid)
    render()
    return
  }

  if (action === "toggleAddMenu") {
    toggleAddMenu()
    render()
    return
  }

  if (action === "addQuestionType") {
    const value = target.dataset.value
    addQuestion(value)
    toggleAddMenu(false)
    render()
    return
  }

  if (action === "toggleStaticAccordion") {
    toggleStaticAccordion(target)
    return
  }

  if (action === "pagerPrev") {
    pager(-1)
    render()
    return
  }
  if (action === "pagerNext") {
    pager(1)
    render()
    return
  }
})

document.addEventListener("input", (e) => {
  const target = e.target
  if (!target || !target.dataset) return
  const action = target.dataset.action

  if (action === "updateQuestionText") {
    const qid = target.dataset.qid
    updateQuestionText(qid, target.value)
    const idx = state.questions.findIndex((q) => q.id === qid)
    if (idx >= 0) state.previewIndex = idx
    $("#mobileRoot").innerHTML = renderMobilePreview()
    return
  }

  if (action === "updateAnswerText") {
    const qid = target.dataset.qid
    const aid = target.dataset.aid
    updateAnswerText(qid, aid, target.value)
    $("#mobileRoot").innerHTML = renderMobilePreview()
    return
  }

  if (action === "updateAnswerGoto") {
    const qid = target.dataset.qid
    const aid = target.dataset.aid
    updateAnswerGoto(qid, aid, target.value)
    return
  }
})

$$(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.activeTab = btn.dataset.tab
    render()
  })
})

render()
