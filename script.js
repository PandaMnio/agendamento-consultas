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

const $ = (selector) => document.querySelector(selector);
const form = $("#booking-form");
const dateInput = form.elements.date;
const modalityField = $("#modality-fieldset");
const timeField = $("#time-fieldset");
const timeOptions = $("#time-options");
const quickDates = $("#quick-dates");
const summary = $("#selection-summary");
const dialog = $("#booking-dialog");
const dialogTitle = $("#dialog-title");
const confirmButton = $("#confirm-demo");
const confirmation = $("#confirmation-message");
let submitted = false;
let dateTouched = false;
let renderedDate = null;

// O dia atual é o de Brasília (en-CA formata como AAAA-MM-DD);
// o restante trata datas de calendário sem conversão de fuso.
const brasiliaToday = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

function dateAfter(days) {
  const [year, month, day] = brasiliaToday.format(new Date()).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function formatDate(value, options = { dateStyle: "long" }) {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC", ...options });
}

function availableTimes(value) {
  const weekday = new Date(`${value}T12:00:00Z`).getUTCDay();
  return (WEEKLY_SCHEDULE[weekday] || []).flatMap(([start, end]) =>
    Array.from({ length: end - start }, (_, index) => `${String(start + index).padStart(2, "0")}:00`),
  );
}

function renderTimes(times) {
  timeOptions.innerHTML = times
    .map(
      (time) => `<label class="choice time-choice">
        <input type="radio" name="time" value="${time}" required aria-describedby="time-error" />${time}
      </label>`,
    )
    .join("");
  $("#time-empty").hidden = times.length > 0;
}

function showError(field, errorId, message) {
  const invalid = String(Boolean(message));
  field.setAttribute("aria-invalid", invalid);
  field.querySelectorAll("input").forEach((input) => input.setAttribute("aria-invalid", invalid));
  $(errorId).textContent = message;
}

// Atualiza a agenda e devolve o primeiro campo que ainda precisa de resposta.
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

  for (const button of quickDates.children) {
    button.setAttribute("aria-pressed", String(button.value === date));
  }
  $("#availability-date").textContent = dateMessage
    ? "Escolha um dia com atendimento"
    : formatDate(date, { weekday: "long", day: "numeric", month: "long" });
  $("#availability-count").textContent = times.length
    ? `${times.length} horários disponíveis`
    : "Sem horários nesta data";

  showError(modalityField, "#modality-error", submitted ? modalityMessage : "");
  showError(dateInput, "#date-error", submitted || dateTouched ? dateMessage : "");
  showError(
    timeField,
    "#time-error",
    submitted && !dateMessage && !time ? "Escolha um horário para continuar." : "",
  );
  timeField.disabled = Boolean(dateMessage);

  if (modalityMessage) {
    summary.textContent = modalityMessage;
    return modalityField.querySelector("input");
  }
  if (dateMessage) {
    summary.textContent = "Selecione um dia com atendimento para continuar.";
    return dateInput;
  }
  if (!time) {
    summary.textContent = "Escolha um horário para revisar seu agendamento.";
    return timeOptions.querySelector("input");
  }
  summary.textContent = `${modality === "online" ? "Online" : "Presencial"} · ${formatDate(date)}, às ${time}`;
  return null;
}

function touchDate() {
  dateTouched = true;
  updateForm();
}

quickDates.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) {
    dateInput.value = button.value;
    touchDate();
  }
});
form.addEventListener("change", (event) => (event.target === dateInput ? touchDate() : updateForm()));
dateInput.addEventListener("blur", touchDate);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitted = true;
  const invalidField = updateForm();
  if (invalidField) {
    invalidField.focus();
    return;
  }
  $("#summary-modality").textContent =
    form.elements.modality.value === "online" ? "Online, por videochamada" : "Presencial, em consultório";
  $("#summary-date").textContent = formatDate(dateInput.value);
  $("#summary-time").textContent = `${form.elements.time.value} · Brasília · 50 minutos`;
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
  button.ariaLabel = formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  button.innerHTML = `<span>${formatDate(date, { weekday: "short" }).replace(".", "")}</span>
    <strong>${date.slice(-2)}</strong>
    <span>${formatDate(date, { month: "short" }).replace(".", "")}</span>`;
  quickDates.append(button);
}
dateInput.value = quickDates.firstElementChild?.value || "";
updateForm();
form.querySelector("[type='submit']").disabled = false;

// Menu expansível do cabeçalho em telas menores.
const siteHeader = $(".site-header");
const menuToggle = $(".menu-toggle");

function setMenu(open) {
  siteHeader.classList.toggle("menu-open", open);
  menuToggle.ariaExpanded = String(open);
  menuToggle.ariaLabel = open ? "Fechar menu" : "Abrir menu";
}
const menuIsOpen = () => siteHeader.classList.contains("menu-open");

menuToggle.addEventListener("click", () => setMenu(!menuIsOpen()));
document.addEventListener("click", (event) => {
  // Fecha ao escolher um link do menu ou ao clicar fora do cabeçalho.
  if (menuIsOpen() && (event.target.closest("#site-menu a") || !siteHeader.contains(event.target))) {
    setMenu(false);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuIsOpen()) {
    setMenu(false);
    menuToggle.focus();
  }
});
matchMedia("(min-width: 901px)").addEventListener("change", (event) => event.matches && setMenu(false));

// Observa a saída do topo da página, sem executar código a cada evento de rolagem.
new IntersectionObserver(([entry]) => siteHeader.classList.toggle("is-scrolled", !entry.isIntersecting)).observe(
  $(".scroll-marker"),
);

// Entradas suaves: o que já está na tela aparece direto; o restante é observado uma única vez.
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries.filter((item) => item.isIntersecting)) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    },
    { threshold: 0.08 },
  );
  for (const element of document.querySelectorAll("[data-reveal]")) {
    if (element.getBoundingClientRect().top < innerHeight) {
      element.classList.add("is-visible");
    } else {
      revealObserver.observe(element);
    }
  }
  document.documentElement.classList.add("reveal-ready");
}
