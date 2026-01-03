const ws = new WebSocket(`ws://${location.host}`);
const chat = document.getElementById('chat');
const progress = document.getElementById('progress');
const fileInput = document.getElementById('file');
const fileBox = document.getElementById('files');
const textarea = document.getElementById('msg');
let id = localStorage.getItem('lan_chat_id');
let fileQueue = [];

if (!id) {
    id = uuid();
    localStorage.setItem('lan_chat_id', id);
}

ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.clear) chat.innerHTML = '';
    else if (msg.history) msg.history.forEach(render);
    else if (msg.delete) document.querySelector(`[data-id='${msg.delete}']`)?.remove();
    else render(msg);
};

function uuid() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function render(msg) {
    const side = msg.from === id;
    const div = document.createElement('div');
    div.className = `msg ${side ? 'me' : 'other'}`;
    div.dataset.id = msg.id;

    if (msg.file) {
        div.innerHTML = `<a href='/download/${msg.file}/${encodeURIComponent(msg.name)}'>${msg.name}</a>`;
    }
    else {
        div.textContent = msg.text;
    }

    if (side) {
        const del = document.createElement('span');
        del.className = 'del';
        del.textContent = '❌';
        del.onclick = () => {
            ws.send(JSON.stringify({ delete: msg.id }));
            div.remove();
        };
        div.appendChild(del);
    }

    chat.appendChild(div);
    window.scroll(0, chat.scrollHeight);
}

function pickFile() { fileInput.click(); }

async function uploadFile(file) {
    const form = new FormData();
    form.append('file', file);
    progress.hidden = false;
    const res = await fetch('/upload', { method: 'POST', body: form });
    progress.hidden = true;
    return await res.json();
}

async function send() {
    const text = textarea.value.trim();

    if (text) {
        ws.send(JSON.stringify({ id: uuid(), from: id, text }));
        textarea.value = '';
        textarea.focus();
    }

    for (const file of fileQueue) {
        const uploaded = await uploadFile(file);
        ws.send(JSON.stringify({ ...uploaded, id: uuid(), from: id }));
    }

    fileQueue = [];
    renderFiles();
}

fileInput.onchange = () => {
    for (const f of fileInput.files) fileQueue.push(f);
    renderFiles();
    fileInput.value = '';
};

function renderFiles() {
    fileBox.innerHTML = '';
    fileQueue.forEach((f, i) => {
        const div = document.createElement('div');
        const del = document.createElement('div');
        div.className = 'file-chip';
        div.textContent = f.name;
        del.textContent = '❌';
        div.onclick = () => {
            fileQueue.splice(i, 1);
            renderFiles();
        };
        div.appendChild(del);
        fileBox.appendChild(div);
    });
}

textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
    }
});

function clearAll() {
    if (!confirm('This will delete ALL messages and ALL files. Are you sure?')) return;
    ws.send(JSON.stringify({ clear: true }));
}