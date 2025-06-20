let wszystkiePytania = [];
let shuffledQuestions = [];

fetch('pytania.json')
    .then(response => response.json())
    .then(data => {
        wszystkiePytania = data;
    })
    .catch(error => console.error('Błąd wczytywania pytań:', error));

document.getElementById('generateQuestionsBtn').addEventListener('click', generateQuestions);

function generateQuestions() {
  if (wszystkiePytania.length === 0) {
    alert("Pytania jeszcze się ładują. Spróbuj za chwilę.");
    return;
  }

  shuffledQuestions = wszystkiePytania.map(grupa => {
    const idx = Math.floor(Math.random() * grupa.pytania.length);
    const pytanie = { ...grupa.pytania[idx], _grupa: grupa.grupa };
    return pytanie;
  });

  for (let i = 0; i < 2; i++) {
    const grupaIdx = Math.floor(Math.random() * wszystkiePytania.length);
    const grupa = wszystkiePytania[grupaIdx];
    const pytanieIdx = Math.floor(Math.random() * grupa.pytania.length);
    const pytanie = { ...grupa.pytania[pytanieIdx], _grupa: grupa.grupa };
    shuffledQuestions.push(pytanie);
  }

  const list = document.getElementById("questionList");
  list.innerHTML = "";

  shuffledQuestions.forEach((item, index) => {
    const li = document.createElement("li");
    let html = `<strong>${index + 1}. ${item.pytanie || ""}</strong><br>`;

    if (item.schematHtml) {
      html += item.schematHtml;
    } else if (item.graf && item.graf.schemat) {
      html += `<div class="graf-schemat"><pre>${item.graf.schemat}</pre></div>`;
    }

    if (item.graf && item._grupa !== "PytaniaDwa") {
      html += `<div class="graf-wezly"><b>Sieci:</b> ${item.graf.węzły.join(", ")}</div>`;
      html += `<div class="graf-polaczenia"><b>Połączenia:</b> ${item.graf.połączenia.map(p => p.join("–")).join(", ")}</div>`;
    }

    html += `<div class="graf-odpowiedzi"></div>`;
    li.innerHTML = html;

    if (item.typ === "zamknięte") {
      const answers = Object.entries(item.odpowiedzi)
        .map(([key, text]) => ({ key, text }))
        .sort(() => Math.random() - 0.5);

      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      answers.forEach((ans, i) => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="radio" name="q${index}" value="${ans.key}"> ${letters[i]}: ${ans.text}<br>`;
        li.appendChild(label);
      });
    } else if (item.typ === "otwarte") {
      const input = document.createElement("input");
      input.type = "text";
      input.name = `q${index}`;
      input.placeholder = "Twoja odpowiedź...";
      li.appendChild(input);
    } else if (item.typ === "otwarte-wiele") {
      item.podpytania.forEach((pod, i) => {
        const label = document.createElement("label");
        label.innerHTML = `${pod.skrot} <input type="text" name="q${index}_sub${i}" placeholder="Odpowiedź..."><br>`;
        li.appendChild(label);
      });
    } else if (item.typ === "tabela") {
      let table = `<table border="1" style="margin:12px 0; color:white;"><tr>`;
      item.tabela.naglowki.forEach(h => table += `<th>${h}</th>`);
      table += `</tr>`;
      item.tabela.adresy.forEach((adres, rowIdx) => {
        table += `<tr><td>${adres}</td>`;
        for (let col = 1; col < item.tabela.naglowki.length; col++) {
          table += `<td><input type="radio" name="q${index}_r${rowIdx}" value="${col}"></td>`;
        }
        table += `</tr>`;
      });
      table += `</table>`;
      li.innerHTML += table;
    } else if (item.typ === "tak-nie-wiele") {
      item.podpytania.forEach((pod, i) => {
        const label = document.createElement("label");
        label.innerHTML = `${pod.skrot} 
          <input type="radio" name="q${index}_sub${i}" value="tak">tak
          <input type="radio" name="q${index}_sub${i}" value="nie">nie<br>`;
        li.appendChild(label);
      });
    }

    list.appendChild(li);
  });

  document.getElementById('checkAnswersBtn').disabled = false;
  document.getElementById("wynik").textContent = "";
}

function checkAnswers() {
  let score = 0;
  const questionList = document.getElementById("questionList");
  const items = questionList.querySelectorAll("li");

  items.forEach((item, index) => {
    const current = shuffledQuestions[index];

    if (current.typ === "zamknięte") {
      const selected = item.querySelector(`input[name="q${index}"]:checked`);
      let poprawnaLabel = null;
      item.querySelectorAll('label').forEach(label => {
        const input = label.querySelector('input[type="radio"]');
        if (input && input.value === current.poprawna) {
          poprawnaLabel = label;
        }
      });
      if (selected && selected.value === current.poprawna) {
        score++;
        item.style.backgroundColor = "#44c763";
      } else {
        item.style.backgroundColor = "#e63e4d";
        if (poprawnaLabel) {
          poprawnaLabel.style.backgroundColor = "#44c763";
          if (!item.querySelector('.poprawna-odpowiedz')) {
            const div = document.createElement('div');
            div.className = 'poprawna-odpowiedz';
            div.style.marginTop = '6px';
            div.style.color = '#44c763';
            div.innerHTML = `Poprawna odpowiedź: <b>${current.poprawna}</b> – ${current.odpowiedzi[current.poprawna]}`;
            item.appendChild(div);
          }
        }
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
        if (!item.querySelector('.poprawna-odpowiedz')) {
          const div = document.createElement('div');
          div.className = 'poprawna-odpowiedz';
          div.style.marginTop = '6px';
          div.style.color = '#44c763';
          div.innerHTML = `Poprawna odpowiedź: <b>${current.poprawna[0]}</b>`;
          item.appendChild(div);
        }
      }
    } else if (current.typ === "tabela") {
      let poprawnychAdresow = 0;
      const poprawne = current.tabela.poprawne;
      const liczbaAdresow = current.tabela.adresy.length;

      for (let row = 0; row < liczbaAdresow; row++) {
        const checked = item.querySelector(`input[name="q${index}_r${row}"]:checked`);
        const poprawneOdp = poprawne[row];
        let poprawny = false;
        for (let col = 1; col < current.tabela.naglowki.length; col++) {
          const radio = item.querySelector(`input[name="q${index}_r${row}"][value="${col}"]`);
          if (radio) {
            const td = radio.closest('td');
            td.classList.remove('tabela-poprawna', 'tabela-bledna', 'tabela-poprawna-wskaznik');
            if (radio.checked) {
              if (poprawneOdp.includes(Number(radio.value))) {
                td.classList.add('tabela-poprawna');
                poprawny = true;
              } else {
                td.classList.add('tabela-bledna');
              }
            }
            if (!poprawny && poprawneOdp.includes(Number(radio.value))) {
              td.classList.add('tabela-poprawna-wskaznik');
            }
          }
        }
        if (poprawny) poprawnychAdresow++;
      }
      const czesciowyWynik = poprawnychAdresow / liczbaAdresow;
      score += czesciowyWynik;

      if (czesciowyWynik === 1) {
        item.style.backgroundColor = "#44c763";
      } else if (czesciowyWynik > 0) {
        item.style.backgroundColor = "#f2c513";
      } else {
        item.style.backgroundColor = "#e63e4d";
      }
    } else if (current.typ === "otwarte-wiele") {
      let poprawnych = 0;
      current.podpytania.forEach((pod, i) => {
        const input = item.querySelector(`input[name="q${index}_sub${i}"]`);
        const user = input.value.trim().toLowerCase();
        const isOk = pod.poprawna.some(ans => user === ans.toLowerCase());
        if (isOk) {
          poprawnych++;
          input.style.backgroundColor = "#44c763";
        } else {
          input.style.backgroundColor = "#e63e4d";
          if (!input.parentElement.querySelector('.poprawna-odpowiedz')) {
            const div = document.createElement('div');
            div.className = 'poprawna-odpowiedz';
            div.style.color = '#44c763';
            div.style.marginTop = '4px';
            div.innerHTML = `Poprawna: <b>${pod.poprawna[0]}</b>`;
            input.parentElement.appendChild(div);
          }
        }
      });
      const czesciowy = poprawnych / current.podpytania.length;
      score += czesciowy;
      if (czesciowy === 1) {
        item.style.backgroundColor = "#44c763";
      } else if (czesciowy > 0) {
        item.style.backgroundColor = "#ffe066";
      } else {
        item.style.backgroundColor = "#e63e4d";
      }
    } else if (current.typ === "tak-nie-wiele") {
      let poprawnych = 0;
      current.podpytania.forEach((pod, i) => {
        const checked = item.querySelector(`input[name="q${index}_sub${i}"]:checked`);
        if (checked && checked.value === pod.poprawna) {
          poprawnych++;
          checked.parentElement.style.backgroundColor = "#44c763";
        } else {
          if (checked) checked.parentElement.style.backgroundColor = "#e63e4d";
          if (!item.querySelector(`.poprawna-odpowiedz-sub${i}`)) {
            const div = document.createElement('div');
            div.className = `poprawna-odpowiedz poprawna-odpowiedz-sub${i}`;
            div.style.color = '#44c763';
            div.innerHTML = `Poprawna: <b>${pod.poprawna}</b>`;
            checked ? checked.parentElement.appendChild(div) : item.appendChild(div);
          }
        }
      });
      const czesciowy = poprawnych / current.podpytania.length;
      score += czesciowy;
      if (czesciowy === 1) {
        item.style.backgroundColor = "#44c763";
      } else if (czesciowy > 0) {
        item.style.backgroundColor = "#f2c513";
      } else {
        item.style.backgroundColor = "#e63e4d";
      }
    }
  });

  const wynik = document.getElementById("wynik");
  wynik.textContent = `Twój wynik: ${score} / ${shuffledQuestions.length}`;

  document.getElementById('checkAnswersBtn').disabled = true;
}