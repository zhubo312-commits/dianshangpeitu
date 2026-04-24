// No API keys in frontend — all requests go through backend proxy

// DOM Elements
const promptInput = document.getElementById('prompt-input');
const sendButton = document.getElementById('send-button');
const fileInput = document.getElementById('file-upload');
const uploadArea = document.getElementById('upload-area');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const dragOverlay = document.getElementById('drag-overlay');
const downloadBtn = document.getElementById('download-btn');

// Right panel state elements
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');
const resultState = document.getElementById('result-state');
const queuedState = document.getElementById('queued-state');
const errorState = document.getElementById('error-state');
const resultImage = document.getElementById('result-image');
const resultText = document.getElementById('result-text');
const errorMessage = document.getElementById('error-message');

// Task detail
const taskDetail = document.getElementById('task-detail');
const detailQuery = document.getElementById('detail-query');
const detailThumb = document.getElementById('detail-thumb');
const detailImageRow = document.getElementById('detail-image-row');

// Queue panel
const queueList = document.getElementById('queue-list');
const queueEmpty = document.getElementById('queue-empty');
const queueCount = document.getElementById('queue-count');
const retryBtn = document.getElementById('retry-btn');
const previewArea = document.getElementById('preview-area');

// State
let selectedFile = null;
let taskQueue = [];
let taskIdCounter = 0;
let selectedTaskId = null;
let isProcessing = false;

const userId = 'local-user-' + Math.random().toString(36).substring(2, 9);

// ===================== UI Event Listeners =====================

sendButton.addEventListener('click', handleSubmit);

fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        setUploadedFile(e.target.files[0]);
    }
});

removeImageBtn.addEventListener('click', () => clearUploadedFile());

promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
    }
});

// Preview area fade transition helper
function triggerPreviewFade() {
    previewArea.classList.remove('switching');
    void previewArea.offsetWidth; // force reflow
    previewArea.classList.add('switching');
}

// ===================== Drag & Drop =====================

let dragCounter = 0;

uploadArea.addEventListener('dragenter', (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter++;
    uploadArea.classList.add('drag-active');
    uploadPlaceholder.style.display = 'none';
    dragOverlay.classList.remove('hidden');
});

uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter--;
    if (dragCounter <= 0) {
        dragCounter = 0;
        uploadArea.classList.remove('drag-active');
        dragOverlay.classList.add('hidden');
        if (!selectedFile) uploadPlaceholder.style.display = '';
    }
});

uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); });

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter = 0;
    uploadArea.classList.remove('drag-active');
    dragOverlay.classList.add('hidden');
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
        setUploadedFile(files[0]);
    } else {
        if (!selectedFile) uploadPlaceholder.style.display = '';
    }
});

// ===================== Paste Image =====================

document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
        if (item.type.startsWith('image/')) {
            e.preventDefault();
            const blob = item.getAsFile();
            if (blob) setUploadedFile(blob);
            return;
        }
    }
});

// ===================== Download =====================

downloadBtn.addEventListener('click', async () => {
    const imgSrc = resultImage.src;
    if (!imgSrc) return;
    try {
        const response = await fetch(imgSrc);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'generated_' + Date.now() + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch {
        window.open(imgSrc, '_blank');
    }
});

// ===================== Retry =====================

retryBtn.addEventListener('click', () => {
    const task = taskQueue.find(t => t.id === selectedTaskId);
    if (!task) return;

    // Create a new task with the same prompt and image
    const retryTask = {
        id: ++taskIdCounter,
        query: task.query,
        file: task.file,
        filePreviewSrc: task.filePreviewSrc,
        status: 'queued',
        resultImageUrl: null,
        resultText: null,
        errorMessage: null,
    };

    taskQueue.push(retryTask);
    renderQueueList();
    selectTask(retryTask.id);
    processQueue();
});

// ===================== File Helpers =====================

function setUploadedFile(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
        imagePreview.src = ev.target.result;
        imagePreviewContainer.classList.remove('hidden');
        uploadPlaceholder.style.display = 'none';
        dragOverlay.classList.add('hidden');
        removeImageBtn.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function clearUploadedFile() {
    selectedFile = null;
    imagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
    uploadPlaceholder.style.display = '';
    dragOverlay.classList.add('hidden');
    removeImageBtn.classList.add('hidden');
    fileInput.value = '';
}

// ===================== Submit → Enqueue =====================

function handleSubmit() {
    const query = promptInput.value.trim();
    if (!query && !selectedFile) return;

    // Create task
    const task = {
        id: ++taskIdCounter,
        query: query || '根据参考图生成图片',
        file: selectedFile,
        filePreviewSrc: selectedFile ? imagePreview.src : null,
        status: 'queued',
        resultImageUrl: null,
        resultText: null,
        errorMessage: null,
    };

    taskQueue.push(task);

    // Clear inputs
    promptInput.value = '';
    clearUploadedFile();

    // Render & select
    renderQueueList();
    selectTask(task.id);

    // Try processing
    processQueue();
}

// ===================== Queue Processor =====================

async function processQueue() {
    if (isProcessing) return;

    const nextTask = taskQueue.find(t => t.status === 'queued');
    if (!nextTask) return;

    isProcessing = true;
    nextTask.status = 'processing';
    renderQueueList();

    // If this task is currently selected, update the right panel
    if (selectedTaskId === nextTask.id) {
        showPreviewState('loading');
    }

    try {
        let uploadedFileId = null;

        // Upload file if exists
        if (nextTask.file) {
            const formData = new FormData();
            formData.append('file', nextTask.file);
            formData.append('user', userId);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json().catch(() => ({}));
                throw new Error(errData.message || '图片上传失败');
            }

            const uploadData = await uploadRes.json();
            uploadedFileId = uploadData.id;
        }

        // Call chat-messages
        const payload = {
            inputs: {},
            query: nextTask.query,
            response_mode: 'blocking',
            user: userId,
            files: []
        };

        if (uploadedFileId) {
            payload.files.push({
                type: 'image',
                transfer_method: 'local_file',
                upload_file_id: uploadedFileId
            });
        }

        const chatRes = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!chatRes.ok) {
            const errData = await chatRes.json().catch(() => ({}));
            throw new Error(errData.message || '生成失败');
        }

        const chatData = await chatRes.json();
        const answer = chatData.answer || '未能生成内容';

        // Extract image
        const imgMatch = answer.match(/!\[([^\]]*)\]\((.*?)\)/);
        nextTask.resultImageUrl = imgMatch ? imgMatch[2] : null;
        nextTask.resultText = answer.replace(/!\[([^\]]*)\]\((.*?)\)/g, '').trim();
        nextTask.status = 'done';

    } catch (error) {
        nextTask.status = 'error';
        nextTask.errorMessage = error.message;
    }

    isProcessing = false;
    renderQueueList();

    // Update right panel if this task is selected
    if (selectedTaskId === nextTask.id) {
        showTaskInPreview(nextTask);
    }

    // Process next
    processQueue();
}

// ===================== Queue Rendering =====================

function renderQueueList() {
    // Clear existing items (keep queueEmpty)
    queueList.querySelectorAll('.queue-item').forEach(el => el.remove());

    const queuedCount = taskQueue.filter(t => t.status === 'queued').length;
    const processingCount = taskQueue.filter(t => t.status === 'processing').length;

    if (taskQueue.length === 0) {
        queueEmpty.style.display = '';
        queueCount.textContent = '';
        return;
    }

    queueEmpty.style.display = 'none';
    queueCount.textContent = processingCount > 0 || queuedCount > 0
        ? `${processingCount > 0 ? '生成中' : ''}${queuedCount > 0 ? ` · 排队 ${queuedCount}` : ''}`
        : `共 ${taskQueue.length} 项`;

    // Render in reverse order (newest first)
    for (let i = taskQueue.length - 1; i >= 0; i--) {
        const task = taskQueue[i];
        const item = document.createElement('div');
        item.className = `queue-item${selectedTaskId === task.id ? ' selected' : ''}`;
        item.dataset.taskId = task.id;

        const statusConfig = {
            queued:     { icon: 'schedule',    cls: 'status-queued',     label: '排队中' },
            processing: { icon: 'sync',        cls: 'status-processing', label: '生成中' },
            done:       { icon: 'check_circle',cls: 'status-done',       label: '已完成' },
            error:      { icon: 'error',       cls: 'status-error',      label: '失败' },
        };

        const sc = statusConfig[task.status];

        const thumbHtml = task.filePreviewSrc
            ? `<img src="${task.filePreviewSrc}" class="queue-item-thumb" alt="thumb"/>`
            : '';

        item.innerHTML = `
            <div class="queue-item-status ${sc.cls}">
                <span class="material-icons">${sc.icon}</span>
            </div>
            <div class="queue-item-info">
                <div class="queue-item-title">#${task.id} ${escapeHtml(task.query)}</div>
                <div class="queue-item-label">${sc.label}</div>
            </div>
            ${thumbHtml}
        `;

        item.addEventListener('click', () => selectTask(task.id));
        queueList.appendChild(item);
    }
}

// ===================== Task Selection =====================

function selectTask(taskId) {
    selectedTaskId = taskId;
    const task = taskQueue.find(t => t.id === taskId);
    if (!task) return;

    // Update queue item highlight
    queueList.querySelectorAll('.queue-item').forEach(el => {
        el.classList.toggle('selected', Number(el.dataset.taskId) === taskId);
    });

    showTaskInPreview(task);
    triggerPreviewFade();
}

function showTaskInPreview(task) {
    // Show task detail
    taskDetail.classList.remove('hidden');
    detailQuery.textContent = task.query;

    if (task.filePreviewSrc) {
        detailImageRow.style.display = '';
        detailThumb.src = task.filePreviewSrc;
    } else {
        detailImageRow.style.display = 'none';
    }

    // Show appropriate state
    switch (task.status) {
        case 'queued':
            showPreviewState('queued');
            break;
        case 'processing':
            showPreviewState('loading');
            break;
        case 'done':
            if (task.resultImageUrl) {
                // Clear old image immediately to avoid flash
                resultImage.src = '';
                resultImage.style.opacity = '0';
                resultImage.style.display = 'block';
                resultText.innerHTML = escapeHtml(task.resultText || '');
                showPreviewState('result');

                // Load new image, then reveal
                const img = new Image();
                img.onload = () => {
                    resultImage.src = task.resultImageUrl;
                    resultImage.style.opacity = '1';
                };
                img.src = task.resultImageUrl;
            } else {
                resultImage.style.display = 'none';
                resultText.innerHTML = escapeHtml(task.resultText || '');
                showPreviewState('result');
            }
            break;
        case 'error':
            errorMessage.textContent = task.errorMessage || '未知错误';
            showPreviewState('error');
            break;
    }
}

// ===================== State Management =====================

function showPreviewState(state) {
    emptyState.classList.add('hidden');
    loadingState.classList.add('hidden');
    resultState.classList.add('hidden');
    queuedState.classList.add('hidden');
    errorState.classList.add('hidden');

    switch (state) {
        case 'empty':   emptyState.classList.remove('hidden'); break;
        case 'loading': loadingState.classList.remove('hidden'); break;
        case 'result':  resultState.classList.remove('hidden'); break;
        case 'queued':  queuedState.classList.remove('hidden'); break;
        case 'error':   errorState.classList.remove('hidden'); break;
    }
}

// ===================== Helpers =====================

function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/\n/g, "<br>");
}
