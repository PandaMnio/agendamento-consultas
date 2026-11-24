"use strict";

// Cada horário inclui 50 minutos de sessão e 10 de intervalo. O fim da faixa é exclusivo.
const WEEKLY_SCHEDULE = {
  1: [
    [9, 12],
    [14, 17],
  ],
  2: [[13, 18]],
  3: [[9, 12]],
  4: [
    [10, 13],
    [15, 19],
  ],
  5: [[9, 12]],
};

const form = document.querySelector("#booking-form");
const dateInput = form.elements.date;
const modalityField = document.querySelector("#modality-fieldset");
const timeField = document.querySelector("#time-fieldset");
const timeOptions = document.querySelector("#time-options");
const quickDates = document.querySelector("#quick-dates");
const dateError = document.querySelector("#date-error");
const timeError = document.querySelector("#time-error");
const modalityError = document.querySelector("#modality-error");
const summary = document.querySelector("#selection-summary");
const dialog = document.querySelector("#booking-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const confirmButton = document.querySelector("#confirm-demo");
const confirmation = document.querySelector("#confirmation-message");
let submitted = false;
let dateTouched = false;
let renderedDate = null;

// O dia atual é o de Brasília; o restante trata datas de calendário sem conversão de fuso.
function dateAfter(days) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const part = (name) => Number(parts.find((item) => item.type === name).value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day") + days))
    .toISOString()
    .slice(0, 10);
}

function formatDate(value, options = { dateStyle: "long" }) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
    ...options,
  });
}

function availableTimes(value) {
  const weekday = new Date(`${value}T12:00:00Z`).getUTCDay();
  return (WEEKLY_SCHEDULE[weekday] || []).flatMap(([start, end]) =>
    Array.from(
      { length: end - start },
      (_, index) => `${String(start + index).padStart(2, "0")}:00`,
    ),
  );
}

function renderTimes(times) {
  timeOptions.replaceChildren(
    ...times.map((time) => {
      const label = document.createElement("label");
      label.className = "choice time-choice";
      const input = document.createElement("input");
      Object.assign(input, { type: "radio", name: "time", value: time, required: true });
      input.setAttribute("aria-describedby", "time-error");
      label.append(input, document.createTextNode(time));
      return label;
    }),
  );
  document.querySelector("#time-empty").hidden = times.length > 0;
}

function showError(field, element, message) {
  field.setAttribute("aria-invalid", String(Boolean(message)));
  element.textContent = message;
  field.querySelectorAll("input").forEach((input) => {
    input.setAttribute("aria-invalid", String(Boolean(message)));
  });
}

function updateForm() {
  dateInput.min = dateAfter(1);
  dateInput.max = dateAfter(90);
  const date = dateInput.value;
  const modality = form.elements.modality.value;
  const modalityMessage = modality ? "" : "Escolha atendimento online ou presencial.";
  let dateMessage = "";

  if (dateInput.validity.badInput) {
    dateMessage = "Complete a data com dia, mês e ano.";
  } else if (!date) {
    dateMessage = "Escolha o dia da sua consulta.";
  } else if (dateInput.validity.rangeUnderflow) {
    dateMessage = `Escolha uma data a partir de ${formatDate(dateInput.min)}.`;
  } else if (dateInput.validity.rangeOverflow) {
    dateMessage = "A agenda contempla os próximos 90 dias. Escolha uma data mais próxima.";
  }

  const times = dateMessage ? [] : availableTimes(date);
  if (!dateMessage && !times.length) {
    dateMessage = "Não há atendimento neste dia. Escolha outro dia da semana.";
  }
  const dateKey = `${date}|${dateMessage}`;
  if (renderedDate !== dateKey) {
    renderTimes(times);
    renderedDate = dateKey;
  }
  const time = timeOptions.querySelector("input:checked")?.value || "";
  quickDates.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.value === date));
  });
  document.querySelector("#availability-date").textContent =
    date && !dateMessage
      ? formatDate(date, { weekday: "long", day: "numeric", month: "long" })
      : "Escolha um dia com atendimento";
  document.querySelector("#availability-count").textContent = times.length
    ? `${times.length} horários disponíveis`
    : "Sem horários nesta data";

  showError(modalityField, modalityError, submitted ? modalityMessage : "");
  showError(dateInput, dateError, submitted || dateTouched ? dateMessage : "");
  showError(
    timeField,
    timeError,
    submitted && !dateMessage && !time ? "Escolha um horário para continuar." : "",
  );
  timeField.disabled = Boolean(dateMessage);
  if (modalityMessage) {
    summary.textContent = modalityMessage;
  } else if (dateMessage) {
    summary.textContent = "Selecione um dia com atendimento para continuar.";
  } else if (time) {
    summary.textContent = `${modality === "online" ? "Online" : "Presencial"} · ${formatDate(date)}, às ${time}`;
  } else {
    summary.textContent = "Escolha um horário para revisar seu agendamento.";
  }

  if (modalityMessage) {
    return modalityField.querySelector("input");
  }
  if (dateMessage) {
    return dateInput;
  }
  return time ? null : timeOptions.querySelector("input");
}

quickDates.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  dateInput.value = button.value;
  dateTouched = true;
  updateForm();
});
form.addEventListener("change", (event) => {
  if (event.target === dateInput) {
    dateTouched = true;
  }
  updateForm();
});
dateInput.addEventListener("blur", () => {
  dateTouched = true;
  updateForm();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitted = true;
  const invalidField = updateForm();
  if (invalidField) {
    invalidField.focus();
    return;
  }

  document.querySelector("#summary-modality").textContent =
    form.elements.modality.value === "online"
      ? "Online, por videochamada"
      : "Presencial, em consultório";
  document.querySelector("#summary-date").textContent = formatDate(dateInput.value);
  document.querySelector("#summary-time").textContent =
    `${timeOptions.querySelector("input:checked").value} · Brasília · 50 minutos`;
  dialogTitle.textContent = "Confira seu encontro.";
  confirmation.hidden = true;
  confirmButton.hidden = false;
  dialog.showModal();
  dialogTitle.focus();
});
confirmButton.addEventListener("click", () => {
  dialogTitle.textContent = "Sua escolha está completa.";
  confirmation.hidden = false;
  confirmButton.hidden = true;
  dialogTitle.focus();
});

// Cinco próximos dias de atendimento: a seleção manual continua disponível para os demais.
for (let offset = 1; offset <= 90 && quickDates.children.length < 5; offset++) {
  const date = dateAfter(offset);
  if (!availableTimes(date).length) {
    continue;
  }
  const button = document.createElement("button");
  button.type = "button";
  button.value = date;
  button.setAttribute(
    "aria-label",
    formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  );
  for (const [tag, text] of [
    ["span", formatDate(date, { weekday: "short" }).replace(".", "")],
    ["strong", date.slice(-2)],
    ["span", formatDate(date, { month: "short" }).replace(".", "")],
  ]) {
    const part = document.createElement(tag);
    part.textContent = text;
    button.append(part);
  }
  quickDates.append(button);
}
dateInput.value = quickDates.querySelector("button")?.value || "";
updateForm();
form.querySelector("[type='submit']").disabled = false;

// Observa a saída do topo da página, sem executar código a cada evento de rolagem.
if ("IntersectionObserver" in window) {
  const header = document.querySelector(".site-header");
  const headerObserver = new IntersectionObserver(([entry]) => {
    header.classList.toggle("is-scrolled", !entry.isIntersecting);
  });
  headerObserver.observe(document.querySelector(".scroll-marker"));
}

if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08 },
  );
  document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
}
