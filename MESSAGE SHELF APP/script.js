// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDyour-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM elements
const shelfContainer = document.getElementById('shelfContainer');
const toysMenu = document.querySelector('.absolute.bottom-0');
const shareBtn = document.getElementById('shareBtn');
const noteModal = document.getElementById('noteModal');
const noteText = document.getElementById('noteText');
const saveNoteBtn = document.getElementById('saveNote');
const cancelNoteBtn = document.getElementById('cancelNote');
const confirmationAlert = document.getElementById('confirmationAlert');

// Global variables
let currentTreeId = null;
let selectedToy = null;
let toys = [];

// Initialize the app
function initApp() {
    setupURL();
    loadToys();
    setupEventListeners();
}

// Handle URL and treeId
function setupURL() {
    const urlParams = new URLSearchParams(window.location.search);
    currentTreeId = urlParams.get('tree');
    
    if (!currentTreeId) {
        currentTreeId = generateTreeId();
        window.history.replaceState(null, null, `?tree=${currentTreeId}`);
    }
}

// Generate random treeId
function generateTreeId() {
    return Math.random().toString(36).substring(2, 8);
}

// Load toys from Firestore
async function loadToys() {
    try {
        const snapshot = await db.collection('trees').doc(currentTreeId).collection('toys').get();
        
        // Render saved toys
        snapshot.forEach(doc => {
            const toy = doc.data();
            createDraggableToy(toy.item, toy.x, toy.y, toy.note, doc.id);
        });
        
        // Create toy menu
        createToyMenu();
    } catch (error) {
        console.error("Error loading toys:", error);
    }
}

// Create toy menu at the bottom
function createToyMenu() {
    for (let i = 1; i <= 12; i++) {
        const toy = document.createElement('div');
        toy.className = 'toy-item';
        toy.dataset.item = i;
        toy.innerHTML = `<img src="${i}item.png" alt="Toy ${i}" class="w-full h-full object-contain">`;
        toysMenu.appendChild(toy);
    }
}

// Create a draggable toy on the shelf
function createDraggableToy(item, x, y, note, docId = null) {
    const toy = document.createElement('div');
    toy.className = 'draggable-toy';
    toy.dataset.item = item;
    if (docId) toy.dataset.docId = docId;
    toy.innerHTML = `<img src="${item}item.png" alt="Toy ${item}" class="w-full h-full object-contain">`;
    
    // Set position
    toy.style.left = `${x}px`;
    toy.style.top = `${y}px`;
    
    // Add to shelf
    shelfContainer.appendChild(toy);
    
    // Make draggable
    makeDraggable(toy);
    
    // Add click event for note
    toy.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedToy = toy;
        noteText.value = note || '';
        noteModal.classList.remove('hidden');
    });
    
    return toy;
}

// Make element draggable within shelf boundaries
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    element.onmousedown = dragMouseDown;
    element.ontouchstart = dragTouchStart;
    
    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    
    function dragTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        pos3 = touch.clientX;
        pos4 = touch.clientY;
        document.ontouchend = closeDragElement;
        document.ontouchmove = elementDrag;
    }
    
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        
        // Calculate new position
        let clientX, clientY;
        if (e.type === 'touchmove') {
            const touch = e.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;
        
        // Set new position with boundary checks
        let newTop = (element.offsetTop - pos2);
        let newLeft = (element.offsetLeft - pos1);
        
        // Boundary checks
        newTop = Math.max(0, Math.min(newTop, shelfContainer.offsetHeight - element.offsetHeight));
        newLeft = Math.max(0, Math.min(newLeft, shelfContainer.offsetWidth - element.offsetWidth));
        
        element.style.top = newTop + 'px';
        element.style.left = newLeft + 'px';
        
        // Save position to Firestore
        saveToyPosition(element, newLeft, newTop);
    }
    
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchend = null;
        document.ontouchmove = null;
    }
}

// Save toy position to Firestore
async function saveToyPosition(toy, x, y, note = '') {
    const toyData = {
        item: toy.dataset.item,
        x: x,
        y: y,
        note: note
    };
    
    try {
        if (toy.dataset.docId) {
            await db.collection('trees').doc(currentTreeId).collection('toys').doc(toy.dataset.docId).update(toyData);
        } else {
            const docRef = await db.collection('trees').doc(currentTreeId).collection('toys').add(toyData);
            toy.dataset.docId = docRef.id;
        }
    } catch (error) {
        console.error("Error saving toy position:", error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Toy menu items
    document.querySelectorAll('.toy-item').forEach(toy => {
        toy.addEventListener('click', () => {
            const item = toy.dataset.item;
            const newToy = createDraggableToy(item, 50, 50, '');
        });
    });
    
    // Share button
    shareBtn.addEventListener('click', () => {
        const url = `${window.location.origin}${window.location.pathname}?tree=${currentTreeId}`;
        navigator.clipboard.writeText(url).then(() => {
            confirmationAlert.classList.remove('hidden');
            setTimeout(() => {
                confirmationAlert.classList.add('hidden');
            }, 3000);
        });
    });
    
    // Modal buttons
    saveNoteBtn.addEventListener('click', () => {
        const note = noteText.value;
        saveToyPosition(selectedToy, selectedToy.offsetLeft, selectedToy.offsetTop, note);
        noteModal.classList.add('hidden');
    });
    
    cancelNoteBtn.addEventListener('click', () => {
        noteModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    noteModal.addEventListener('click', (e) => {
        if (e.target === noteModal) {
            noteModal.classList.add('hidden');
        }
    });
}
// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    document.title = "Shelfie Shenanigans 🎭";
    initApp();
});
