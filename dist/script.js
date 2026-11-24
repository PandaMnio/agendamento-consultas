"use strict";

const TIME_ZONE = "America/Sao_Paulo";
// Horários ilustrativos, sem vínculo com uma agenda real.
const DEMO_TIMES = ["09:00", "11:00", "14:00", "16:00"];
const form = document.querySelector("#booking-form");
const dateInput = document.querySelector("#appointment-date");
const dateError = document.querySelector("#date-error");
const timeFieldset = document.querySelector("#time-fieldset");
const timeOptions = document.querySelector("#time-options");
const selectionSummary = document.querySelector("#selection-summary");
const dialog = document.querySelector("#booking-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");
const dialogEyebrow = document.querySelector("#dialog-eyebrow");
const appointmentSummary = document.querySelector("#appointment-summary");
const confirmButton = document.querySelector("#confirm-demo");
const editButton = document.querySelector("#edit-choice");

// Datas de calendário são tratadas em UTC; o dia atual vem de Brasília.
// Isso evita que o navegador altere o dia ao converter fusos horários.
function todayInBrasilia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function calendarDate(value) {
  return new Date(`${value}T12:00:00Z`);
}

function addDays(value, amount) {
  const date = calendarDate(value);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function isWeekday(value) {
  const day = calendarDate(value).getUTCDay();
  return day > 0 && day < 6;
}

function formatDate(value, options) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", ...options }).format(calendarDate(value));
}

function updateDateBounds() {
  const today = todayInBrasilia();
  dateInput.min = addDays(today, 1);
  dateInput.max = addDays(today, 90);
}

function validateDate() {
  updateDateBounds();
  const value = dateInput.value;
  let error = "";
  if (!value) error = "Escolha uma data para ver os horários.";
  else if (value < dateInput.min || value > dateInput.max) error = "Escolha uma data a partir de amanhã, dentro dos próximos 90 dias.";
  else if (!isWeekday(value)) error = "O atendimento acontece de segunda a sexta. Escolha um dia útil.";
  dateInput.setCustomValidity(error);
  dateInput.setAttribute("aria-invalid", String(Boolean(error)));
  dateError.textContent = error;
  timeFieldset.disabled = Boolean(error);
  return !error;
}

function renderTimes() {
  timeOptions.replaceChildren();
  for (const time of DEMO_TIMES) {
    const label = document.createElement("label");
    label.className = "choice time-choice";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "time";
    input.value = time;
    input.required = true;
    const text = document.createElement("span");
    text.textContent = time;
    label.append(input, text);
    timeOptions.append(label);
  }
}

function updateSummary() {
  const data = new FormData(form);
  if (!dateInput.value || !dateInput.validity.valid) {
    selectionSummary.textContent = "Escolha uma data válida para continuar.";
    return;
  }
  if (!data.get("time")) {
    selectionSummary.textContent = "Selecione um horário para continuar.";
    return;
  }
  const modality = data.get("modality") === "online" ? "Online" : "Presencial";
  const day = formatDate(dateInput.value, { day: "numeric", month: "long" });
  selectionSummary.textContent = `${modality} · ${day}, às ${data.get("time")} · Brasília`;
}

function addSummaryRow(label, value) {
  const row = document.createElement("div");
  row.className = "summary-row";
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value;
  row.append(term, description);
  appointmentSummary.append(row);
}

function openReview() {
  const data = new FormData(form);
  dialogEyebrow.textContent = "Sua escolha";
  dialogTitle.textContent = "Vamos conferir?";
  dialogDescription.textContent = "Revise os detalhes da sua sessão demonstrativa.";
  appointmentSummary.replaceChildren();
  addSummaryRow("Profissional", "Helena Costa · Perfil fictício");
  addSummaryRow("Modalidade", data.get("modality") === "online" ? "Online, por videochamada" : "Presencial, em consultório");
  addSummaryRow("Data", formatDate(dateInput.value, { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  addSummaryRow("Horário", `${data.get("time")} · Brasília · 50 minutos`);
  confirmButton.hidden = false;
  editButton.textContent = "Alterar minha escolha";
  document.body.classList.add("dialog-open");
  dialog.showModal();
  dialogTitle.focus();
}

dateInput.addEventListener("change", () => {
  renderTimes();
  validateDate();
  updateSummary();
});

form.addEventListener("change", updateSummary);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (validateDate() && form.reportValidity()) openReview();
});

// O modal nativo mantém o foco dentro da revisão e oferece fechamento por Escape.
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
editButton.addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  form.querySelector("[type='submit']").focus({ preventScroll: true });
});

confirmButton.addEventListener("click", () => {
  dialogEyebrow.textContent = "Demonstração concluída";
  dialogTitle.textContent = "Seu primeiro passo.";
  dialogDescription.textContent = "Você chegou ao fim do fluxo demonstrativo. Nenhuma consulta foi marcada e nenhum dado foi enviado.";
  confirmButton.hidden = true;
  editButton.textContent = "Voltar à agenda";
  dialogTitle.focus();
});

// Se a página ficar aberta até o dia seguinte, os limites precisam acompanhar a data.
window.addEventListener("focus", () => {
  validateDate();
  updateSummary();
});

updateDateBounds();
let initialDate = dateInput.min;
while (!isWeekday(initialDate)) initialDate = addDays(initialDate, 1);
dateInput.value = initialDate;
renderTimes();
validateDate();
updateSummary();
