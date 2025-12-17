import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBmBmX4GQ2ZQZQZQZQZQZQZQZQZQZQZQZQZQ",
    authDomain: "shelfie-stories.firebaseapp.com",
    projectId: "shelfie-stories",
    storageBucket: "shelfie-stories.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdefghijklmnopqrstuv"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// get or create treeId
function getTreeId() {
  const urlParams = new URLSearchParams(window.location.search);
  let treeId = urlParams.get('tree');
  if (!treeId) {
    treeId = 'tree-' + Math.random().toString(36).substring(2, 11);
    window.history.replaceState({}, '', `?tree=${treeId}`);
  }
  return treeId;
}

// Save toys to Firestore
async function saveToys(treeId, toys) {
  const toysRef = collection(db, 'trees', treeId, 'toys');
  const snapshot = await getDocs(toysRef);

  // Clear existing toys
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'trees', treeId, 'toys', docSnap.id));
  }

  // Save new toys
  for (const toy of toys) {
    const newToyRef = doc(db, 'trees', treeId, 'toys', toy.id);
    await setDoc(newToyRef, {
      item: `${toy.id}item.png`,
      x: toy.x,
      y: toy.y,
      note: toy.message || ''
    });
  }
}

// Load toys from Firestore
async function loadToys(treeId, toyContainer, toys) {
  const toysRef = collection(db, 'trees', treeId, 'toys');
  const snapshot = await getDocs(toysRef);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const toyElement = document.createElement('div');
    toyElement.className = 'toy-item';
    toyElement.dataset.id = docSnap.id;
    toyElement.style.left = `${data.x}px`;
    toyElement.style.top = `${data.y}px`;
    toyElement.style.pointerEvents = 'auto';

    const img = document.createElement('img');
    img.src = data.item;
    img.style.width = '100%';
    img.style.height = '100%';
    toyElement.appendChild(img);

    toyContainer.appendChild(toyElement);

    toys.push({
      id: docSnap.id,
      x: data.x,
      y: data.y,
      message: data.note || '',
      element: toyElement
    });

    toyElement.addEventListener('click', openMessagePopup);
    toyElement.addEventListener('touchstart', startMove);
    toyElement.addEventListener('mousedown', startMove);
  }
}

// main
document.addEventListener('DOMContentLoaded', async () => {
  const toyMenu = document.getElementById('toy-menu');
  const toyContainer = document.getElementById('toy-container');
  const messagePopup = document.getElementById('message-popup');
  const messageInput = document.getElementById('message-input');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const shareBtn = document.getElementById('share-btn');

  let currentToy = null;
  let activeToy = null;
  let toys = [];

  const treeId = getTreeId();

  // Load toys from Firestore
  await loadToys(treeId, toyContainer, toys);

  // Toy menu
  for (let i = 1; i <= 12; i++) {
    const toyImg = document.createElement('img');
    toyImg.src = `${i}item.png`;
    toyImg.dataset.id = `toy-${i}-${Date.now()}`;
    toyImg.classList.add('toy-thumb');
    toyMenu.appendChild(toyImg);
    toyImg.addEventListener('touchstart', startDrag);
    toyImg.addEventListener('mousedown', startDrag);
  }

  // Drag and drop functions
  function startDrag(e) {
    e.preventDefault();
    const toyId = e.target.dataset.id;
    currentToy = document.createElement('div');
    currentToy.className = 'toy-item';
    currentToy.dataset.id = toyId;

    const img = document.createElement('img');
    img.src = e.target.src;
    img.style.width = '100%';
    img.style.height = '100%';
    currentToy.appendChild(img);
    toyContainer.appendChild(currentToy);

    moveToy(e);
    document.addEventListener('touchmove', dragToy);
    document.addEventListener('mousemove', dragToy);
    document.addEventListener('touchend', endDrag);
    document.addEventListener('mouseup', endDrag);
  }

  function dragToy(e) { if(currentToy) { e.preventDefault(); moveToy(e); } }

  function moveToy(e) {
    const rect = toyContainer.getBoundingClientRect();
    let x = e.type.includes('touch') ? e.touches[0].clientX - rect.left - 25 : e.clientX - rect.left - 25;
    let y = e.type.includes('touch') ? e.touches[0].clientY - rect.top - 25 : e.clientY - rect.top - 25;
    x = Math.max(0, Math.min(rect.width - 50, x));
    y = Math.max(0, Math.min(rect.height - 50, y));
    currentToy.style.left = `${x}px`;
    currentToy.style.top = `${y}px`;
  }

  function endDrag(e) {
    if(!currentToy) return;
    document.removeEventListener('touchmove', dragToy);
    document.removeEventListener('mousemove', dragToy);
    document.removeEventListener('touchend', endDrag);
    document.removeEventListener('mouseup', endDrag);

    currentToy.addEventListener('click', openMessagePopup);
    currentToy.addEventListener('touchstart', startMove);
    currentToy.addEventListener('mousedown', startMove);
    currentToy.style.pointerEvents = 'auto';

    toys.push({ id: currentToy.dataset.id, x: parseFloat(currentToy.style.left), y: parseFloat(currentToy.style.top), message: '', element: currentToy });
    saveToys(treeId, toys);
    currentToy = null;
  }

  // Move existing toy
  function startMove(e) {
    if(e.target !== e.currentTarget) return;
    e.preventDefault();
    activeToy = currentToy = e.currentTarget;
    document.addEventListener('touchmove', dragToy);
    document.addEventListener('mousemove', dragToy);
    document.addEventListener('touchend', endMove);
    document.addEventListener('mouseup', endMove);
  }

  function endMove(e) {
    if(!currentToy) return;
    document.removeEventListener('touchmove', dragToy);
    document.removeEventListener('mousemove', dragToy);
    document.removeEventListener('touchend', endMove);
    document.removeEventListener('mouseup', endMove);

    const toyIndex = toys.findIndex(t => t.element === currentToy);
    if(toyIndex !== -1) {
      toys[toyIndex].x = parseFloat(currentToy.style.left);
      toys[toyIndex].y = parseFloat(currentToy.style.top);
    }

    saveToys(treeId, toys);
    currentToy = null;
  }

  // Messages
  function openMessagePopup(e) {
    e.stopPropagation();
    activeToy = e.currentTarget;
    const toyData = toys.find(t => t.element === activeToy);
    if(toyData) messageInput.value = toyData.message || '';
    messagePopup.classList.remove('hidden');
  }

  saveBtn.addEventListener('click', () => {
    const toyData = toys.find(t => t.element === activeToy);
    if(toyData) toyData.message = messageInput.value;
    messagePopup.classList.add('hidden');
    saveToys(treeId, toys);
  });

  cancelBtn.addEventListener('click', () => messagePopup.classList.add('hidden'));

  messagePopup.addEventListener('click', e => { if(e.target === messagePopup) messagePopup.classList.add('hidden'); });

  // Share button
  shareBtn.addEventListener('click', async () => {
    const shareUrl = `https://123kjj.github.io/Deck-My-Shelf.123/?tree=${treeId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard! Share it with friends.');
    } catch {
      alert('Copy manually: ' + shareUrl);
    }
  });

  // Auto-save every 30 seconds
  setInterval(() => { if(toys.length > 0) saveToys(treeId, toys); }, 30000);
});

