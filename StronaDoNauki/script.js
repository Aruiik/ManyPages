let wszystkiePytania = [];
let shuffledQuestions = [];

fetch('pytania.json')
    .then(response => response.json())
    .then(data => {
        wszystkiePytania = data;
    })
    .catch(error => console.error('Błąd wczytywania pytań:', error));

function generateQuestions() {
  if (wszystkiePytania.length === 0) {
    alert("Pytania jeszcze się ładują. Spróbuj za chwilę.");
    return;
  }

  shuffledQuestions = [...wszystkiePytania].sort(() => Math.random() - 0.5).slice(0, 30);
  const list = document.getElementById("questionList");
  list.innerHTML = "";

  shuffledQuestions.forEach((item, index) => {
    const li = document.createElement("li");
    let html = `<strong>${index + 1}. ${item.pytanie}</strong><br>`;

    if (item.graf) {
      if (item.graf.schemat) {
        html += `<div class="graf-schemat"><pre>${item.graf.schemat}</pre></div>`;
      }
      html += `<div class="graf-wezly"><b>Sieci:</b> ${item.graf.węzły.join(", ")}</div>`;
      html += `<div class="graf-polaczenia"><b>Połączenia:</b> ${item.graf.połączenia.map(p => p.join("–")).join(", ")}</div>`;
    }

    html += `<div class="graf-odpowiedzi"></div>`;

    li.innerHTML = html;

    if (item.typ === "zamknięte") {
      for (const [key, text] of Object.entries(item.odpowiedzi)) {
        const label = document.createElement("label");
        label.innerHTML = `<input type="radio" name="q${index}" value="${key}"> ${key}: ${text}<br>`;
        li.appendChild(label);
      }
    } else if (item.typ === "otwarte") {
      const input = document.createElement("input");
      input.type = "text";
      input.name = `q${index}`;
      input.placeholder = "Twoja odpowiedź...";
      li.appendChild(input);
    }

    list.appendChild(li);
  });

  document.getElementById('checkAnswersBtn').disabled = false;
  document.getElementById("wynik").textContent = "";
};

function checkAnswers() {
  let score = 0;
  const questionList = document.getElementById("questionList");
  const items = questionList.querySelectorAll("li");

  items.forEach((item, index) => {
    const current = shuffledQuestions[index];

    if (current.typ === "zamknięte") {
      const selected = item.querySelector(`input[name="q${index}"]:checked`);
      if (selected && selected.value === current.poprawna) {
        score++;
        item.style.backgroundColor = "#44c763";
      } else {
        item.style.backgroundColor = "#e63e4d";
      }
    } else if (current.typ === "otwarte") {
      const input = item.querySelector(`input[name="q${index}"]`);
      const userAnswer = input.value.trim().toLowerCase().replace(/\s+/g, "");

      const isCorrect = current.poprawna.some(ans =>
        userAnswer === ans.trim().toLowerCase().replace(/\s+/g, "")
      );

      if (isCorrect) {
        score++;
        item.style.backgroundColor = "#44c763";
      } else {
        item.style.backgroundColor = "#e63e4d";
      }
    }
  });

  document.getElementById('checkAnswersBtn').disabled = true;
  document.getElementById("wynik").textContent = `Twój wynik: ${score} / ${shuffledQuestions.length}`;
}

