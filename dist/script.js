"use strict";

const form = document.querySelector("#booking-form");
const dateInput = form.elements.date;
const dateError = document.querySelector("#date-error");
const summary = document.querySelector("#selection-summary");
const dialog = document.querySelector("#booking-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const confirmButton = document.querySelector("#confirm-demo");
const confirmation = document.querySelector("#confirmation-message");

// O calendário usa o dia de Brasília, mesmo quando o visitante está em outro fuso.
function dateAfter(days) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "numeric", day: "numeric"
  }).formatToParts(new Date());
  const part = (name) => Number(parts.find((item) => item.type === name).value);
  const date = new Date(Date.UTC(part("year"), part("month") - 1, part("day") + days));
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("pt-BR", {
    timeZone: "UTC", dateStyle: "long"
  });
}

function updateForm() {
  dateInput.min = dateAfter(1);
  dateInput.max = dateAfter(90);
  const date = dateInput.value;
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  let error = "";

  if (!date) error = "Escolha uma data para ver os horários.";
  else if (date < dateInput.min || date > dateInput.max) error = "Escolha uma data entre amanhã e os próximos 90 dias.";
  else if (day === 0 || day === 6) error = "Escolha um dia de segunda a sexta.";

  dateInput.setCustomValidity(error);
  dateInput.setAttribute("aria-invalid", String(Boolean(error)));
  dateError.textContent = error;
  document.querySelector("#time-fieldset").disabled = Boolean(error);
  const time = form.elements.time.value;
  const modality = form.elements.modality.value === "online" ? "Online" : "Presencial";
  summary.textContent = error || (time
    ? `${modality} · ${formatDate(date)}, às ${time} · Brasília`
    : "Selecione um horário para continuar.");
  return !error;
}

dateInput.addEventListener("change", () => {
  form.querySelectorAll("[name='time']").forEach((input) => { input.checked = false; });
});
form.addEventListener("change", updateForm);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!updateForm() || !form.reportValidity()) return;

  document.querySelector("#summary-modality").textContent = form.elements.modality.value === "online"
    ? "Online, por videochamada" : "Presencial, em consultório";
  document.querySelector("#summary-date").textContent = formatDate(dateInput.value);
  document.querySelector("#summary-time").textContent = `${form.elements.time.value} · Brasília · 50 minutos`;
  dialogTitle.textContent = "Vamos conferir?";
  confirmation.hidden = true;
  confirmButton.hidden = false;
  dialog.showModal();
  dialogTitle.focus();
});

confirmButton.addEventListener("click", () => {
  dialogTitle.textContent = "Simulação concluída.";
  confirmation.hidden = false;
  confirmButton.hidden = true;
  dialogTitle.focus();
});

dateInput.value = dateAfter(1);
while ([0, 6].includes(new Date(`${dateInput.value}T12:00:00Z`).getUTCDay())) {
  const nextDay = new Date(`${dateInput.value}T12:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  dateInput.value = nextDay.toISOString().slice(0, 10);
}
updateForm();
