const RSVP_API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:8000/api'
    : 'https://rsvp.rachelandjett.com/api';

const searchForm = document.getElementById('rsvp-search-form');
const nameInput = document.getElementById('rsvp-name-input');
const searchingMsg = document.getElementById('rsvp-searching');
const resultsList = document.getElementById('rsvp-results');
const emptyMsg = document.getElementById('rsvp-empty');
const errorMsg = document.getElementById('rsvp-error');

const stepSearch = document.getElementById('rsvp-step-search');
const stepForm = document.getElementById('rsvp-step-form');
const stepSuccess = document.getElementById('rsvp-step-success');

const backBtn = document.getElementById('rsvp-back');
const detailForm = document.getElementById('rsvp-detail-form');
const guestListEl = document.getElementById('rsvp-guest-list');
const messageInput = document.getElementById('rsvp-message');
const submitErrorMsg = document.getElementById('rsvp-submit-error');

let currentParty = null;

function hide(el) { el.hidden = true; }
function show(el) { el.hidden = false; }

function showStep(step) {
    [stepSearch, stepForm, stepSuccess].forEach((s) => hide(s));
    show(step);
}

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = nameInput.value.trim();
    if (query.length < 2) return;

    hide(emptyMsg);
    hide(errorMsg);
    hide(resultsList);
    resultsList.innerHTML = '';
    show(searchingMsg);
    searchForm.querySelector('button').disabled = true;

    try {
        const res = await fetch(`${RSVP_API_BASE}/guests/search/?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        renderResults(data.parties || []);
    } catch (err) {
        show(errorMsg);
    } finally {
        hide(searchingMsg);
        searchForm.querySelector('button').disabled = false;
    }
});

function renderResults(parties) {
    if (!parties.length) {
        show(emptyMsg);
        return;
    }

    parties.forEach((party) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'rsvp-result-btn';

        const names = party.guests.map((g) => `${g.first_name} ${g.last_name}`).join(', ');
        const nameEl = document.createElement('span');
        nameEl.className = 'rsvp-result-name';
        nameEl.textContent = names;
        btn.appendChild(nameEl);

        if (party.label) {
            const labelEl = document.createElement('span');
            labelEl.className = 'rsvp-result-party';
            labelEl.textContent = party.label;
            btn.appendChild(labelEl);
        }

        btn.addEventListener('click', () => selectParty(party));
        li.appendChild(btn);
        resultsList.appendChild(li);
    });

    show(resultsList);
}

function selectParty(party) {
    currentParty = party;
    guestListEl.innerHTML = '';

    party.guests.forEach((guest) => {
        const row = document.createElement('div');
        row.className = 'rsvp-guest';
        row.dataset.guestId = guest.id;

        const nameEl = document.createElement('div');
        nameEl.className = 'rsvp-guest-name';
        nameEl.textContent = `${guest.first_name} ${guest.last_name}`;
        row.appendChild(nameEl);

        const toggle = document.createElement('div');
        toggle.className = 'rsvp-attend-toggle';

        const yesBtn = document.createElement('button');
        yesBtn.type = 'button';
        yesBtn.className = 'attend-btn';
        yesBtn.dataset.value = 'yes';
        yesBtn.textContent = 'Joyfully Accepts';

        const noBtn = document.createElement('button');
        noBtn.type = 'button';
        noBtn.className = 'attend-btn';
        noBtn.dataset.value = 'no';
        noBtn.textContent = 'Regretfully Declines';

        const mealSelect = document.createElement('select');
        mealSelect.className = 'rsvp-meal';
        mealSelect.hidden = true;
        ['', 'Chicken', 'Beef', 'Fish', 'Vegetarian'].forEach((meal) => {
            const opt = document.createElement('option');
            opt.value = meal;
            opt.textContent = meal || 'Choose a meal';
            mealSelect.appendChild(opt);
        });
        if (guest.meal_choice) mealSelect.value = guest.meal_choice;

        function selectAttendance(value) {
            row.dataset.attending = value;
            yesBtn.classList.toggle('selected', value === 'yes');
            noBtn.classList.toggle('selected', value === 'no');
            mealSelect.hidden = value !== 'yes';
        }

        yesBtn.addEventListener('click', () => selectAttendance('yes'));
        noBtn.addEventListener('click', () => selectAttendance('no'));

        if (guest.attendance === 'attending') selectAttendance('yes');
        else if (guest.attendance === 'declined') selectAttendance('no');

        toggle.appendChild(yesBtn);
        toggle.appendChild(noBtn);
        row.appendChild(toggle);
        row.appendChild(mealSelect);
        guestListEl.appendChild(row);
    });

    hide(submitErrorMsg);
    showStep(stepForm);
}

backBtn.addEventListener('click', () => {
    currentParty = null;
    showStep(stepSearch);
});

detailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentParty) return;

    const guestRows = [...guestListEl.querySelectorAll('.rsvp-guest')];
    const guests = [];
    for (const row of guestRows) {
        if (!row.dataset.attending) {
            hide(submitErrorMsg);
            submitErrorMsg.textContent = 'Please respond for each guest before submitting.';
            show(submitErrorMsg);
            return;
        }
        guests.push({
            id: Number(row.dataset.guestId),
            attending: row.dataset.attending === 'yes',
            meal_choice: row.querySelector('.rsvp-meal').value,
        });
    }

    const submitBtn = detailForm.querySelector('.rsvp-submit');
    submitBtn.disabled = true;
    hide(submitErrorMsg);

    try {
        const res = await fetch(`${RSVP_API_BASE}/rsvp/submit/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                party_id: currentParty.party_id,
                guests,
                notes: messageInput.value.trim(),
            }),
        });
        if (!res.ok) throw new Error('Submit failed');
        showStep(stepSuccess);
    } catch (err) {
        submitErrorMsg.textContent = 'Something went wrong submitting your RSVP. Please try again.';
        show(submitErrorMsg);
    } finally {
        submitBtn.disabled = false;
    }
});
