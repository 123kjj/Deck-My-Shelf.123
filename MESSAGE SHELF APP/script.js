
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBmBmX4GQ2ZQZQZQZQZQZQZQZQZQZQZQZQ",
    authDomain: "shelfie-stories.firebaseapp.com",
    projectId: "shelfie-stories",
    storageBucket: "shelfie-stories.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdefghijklmnopqrstuv"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // Generate or get treeId from URL
  function getTreeId() {
    const urlParams = new URLSearchParams(window.location.search);
    let treeId = urlParams.get('tree');
    
    if (!treeId) {
      treeId = 'tree-' + Math.random().toString(36).substring(2, 11);
      window.history.replaceState({}, '', `?tree=${treeId}`);
    }
    
    return treeId;
  }
  async function saveToys(treeId, toys) {
    const batch = db.batch();
    const toysRef = db.collection('trees').doc(treeId).collection('toys');
    
    // Clear existing toys
    const snapshot = await toysRef.get();
    snapshot.forEach(doc => batch.delete(doc.ref));
    
    // Save new toys
    toys.forEach(toy => {
      const newToyRef = toysRef.doc();
      batch.set(newToyRef, {
        item: `${toy.id}item.png`,
        x: toy.x,
        y: toy.y,
        note: toy.message
      });
      
      // Auto-save every 30 seconds
      setInterval(() => {
          if (toys.length > 0) {
              saveToys(treeId, toys);
          }
      }, 30000);
  });
    
    await batch.commit();
  }
  
  async function loadToys(treeId, toyContainer) {
    const snapshot = await db.collection('trees').doc(treeId).collection('toys').get();
    
    snapshot.forEach(doc => {
      const toyData = doc.data();
      const toyId = toyData.item.replace('item.png', '');
      
      const toyElement = document.createElement('div');
      toyElement.className = 'toy-item';
      toyElement.dataset.id = toyId;
      toyElement.style.left = `${toyData.x}px`;
      toyElement.style.top = `${toyData.y}px`;
      toyElement.style.pointerEvents = 'auto';
      
      const img = document.createElement('img');
      img.src = toyData.item;
      img.style.width = '100%';
      img.style.height = '100%';
      toyElement.appendChild(img);
      
      toyContainer.appendChild(toyElement);
      
      toys.push({
        id: toyId,
        x: toyData.x,
        y: toyData.y,
        message: toyData.note || '',
        element: toyElement
      });
      
      toyElement.addEventListener('click', openMessagePopup);
      toyElement.addEventListener('touchstart', startMove);
      toyElement.addEventListener('mousedown', startMove);
    });
  }
  
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
      
      // Load toy items
      for (let i = 1; i <= 12; i++) {
          const toyImg = document.createElement('img');
          toyImg.src = `${i}item.png`;
          toyImg.dataset.id = i;
          toyImg.classList.add('toy-thumb');
          toyMenu.appendChild(toyImg);
          
          toyImg.addEventListener('touchstart', startDrag);
          toyImg.addEventListener('mousedown', startDrag);
      }
      
      // Initialize drag and drop
      function startDrag(e) {
          e.preventDefault();
          const toyId = e.target.dataset.id;
          currentToy = document.createElement('div');
          currentToy.className = 'toy-item';
          currentToy.dataset.id = toyId;
          
          const img = document.createElement('img');
          img.src = `${toyId}item.png`;
          img.style.width = '100%';
          img.style.height = '100%';
          currentToy.appendChild(img);
          
          toyContainer.appendChild(currentToy);
          
          const rect = toyContainer.getBoundingClientRect();
          let x, y;
          
          if (e.type.includes('touch')) {
              x = e.touches[0].clientX - rect.left - 25;
              y = e.touches[0].clientY - rect.top - 25;
          } else {
              x = e.clientX - rect.left - 25;
              y = e.clientY - rect.top - 25;
          }
          
          currentToy.style.left = `${x}px`;
          currentToy.style.top = `${y}px`;
          
          document.addEventListener('touchmove', dragToy);
          document.addEventListener('mousemove', dragToy);
          document.addEventListener('touchend', endDrag);
          document.addEventListener('mouseup', endDrag);
      }
      
      function dragToy(e) {
          if (!currentToy) return;
          e.preventDefault();
          
          const rect = toyContainer.getBoundingClientRect();
          let x, y;
          
          if (e.type.includes('touch')) {
              x = e.touches[0].clientX - rect.left - 25;
              y = e.touches[0].clientY - rect.top - 25;
          } else {
              x = e.clientX - rect.left - 25;
              y = e.clientY - rect.top - 25;
          }
          
          // Constrain to shelf area
          x = Math.max(0, Math.min(rect.width - 50, x));
          y = Math.max(0, Math.min(rect.height - 50, y));
          
          currentToy.style.left = `${x}px`;
          currentToy.style.top = `${y}px`;
      }
      const treeId = getTreeId();
      
      // Load saved toys
      await loadToys(treeId, toyContainer);
      
      function endDrag(e) {
  if (!currentToy) return;
          e.preventDefault();
          
          document.removeEventListener('touchmove', dragToy);
          document.removeEventListener('mousemove', dragToy);
          document.removeEventListener('touchend', endDrag);
          document.removeEventListener('mouseup', endDrag);
          
          // Add event listeners for moving existing toys
          currentToy.addEventListener('click', openMessagePopup);
          currentToy.addEventListener('touchstart', startMove);
          currentToy.addEventListener('mousedown', startMove);
          currentToy.style.pointerEvents = 'auto';
          
          // Update or add toy position
          const existingToyIndex = toys.findIndex(t => t.element === currentToy);
          if (existingToyIndex !== -1) {
              toys[existingToyIndex].x = parseFloat(currentToy.style.left);
              toys[existingToyIndex].y = parseFloat(currentToy.style.top);
          } else {
              toys.push({
                  id: currentToy.dataset.id,
                  x: parseFloat(currentToy.style.left),
                  y: parseFloat(currentToy.style.top),
                  message: '',
                  element: currentToy
              });
          }
          currentToy = null;
          saveToys(treeId, toys);
      }
  function startMove(e) {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          e.stopPropagation();
          
          currentToy = e.currentTarget;
          activeToy = currentToy;
          
          document.addEventListener('touchmove', dragToy);
          document.addEventListener('mousemove', dragToy);
          document.addEventListener('touchend', endMove);
          document.addEventListener('mouseup', endMove);
      }
      function endMove(e) {
          saveToys(treeId, toys);
  if (!currentToy) return;
          e.preventDefault();
          
          document.removeEventListener('touchmove', dragToy);
          document.removeEventListener('mousemove', dragToy);
          document.removeEventListener('touchend', endMove);
          document.removeEventListener('mouseup', endMove);
          
          // Update toy position
          const toyIndex = toys.findIndex(t => t.element === currentToy);
          if (toyIndex !== -1) {
              toys[toyIndex].x = parseFloat(currentToy.style.left);
              toys[toyIndex].y = parseFloat(currentToy.style.top);
          }
          
          currentToy = null;
      }
  function openMessagePopup(e) {
          e.stopPropagation();
          activeToy = e.currentTarget;
          const toyId = activeToy.dataset.id;
          const toyData = toys.find(t => t.id === toyId);
          
          if (toyData) {
              messageInput.value = toyData.message || '';
              messageInput.focus();
          }
          
          messagePopup.classList.remove('hidden');
      }
      saveBtn.addEventListener('click', async () => {
          await saveToys(treeId, toys);
  const message = messageInput.value;
          const toyId = activeToy.dataset.id;
          
          const toyIndex = toys.findIndex(t => t.id === toyId);
          if (toyIndex !== -1) {
              toys[toyIndex].message = message;
          }
          
          messagePopup.classList.add('hidden');
      });
      
      cancelBtn.addEventListener('click', () => {
          messagePopup.classList.add('hidden');
      });
      shareBtn.addEventListener('click', async () => {
          const treeId = getTreeId();
          const shareUrl = `${window.location.origin}${window.location.pathname}?tree=${treeId}`;
          
          try {
              await navigator.clipboard.writeText(shareUrl);
              alert('Link copied to clipboard! Share it with friends.');
          } catch (err) {
              alert('Failed to copy link. Please manually copy this URL:\n\n' + shareUrl);
          }
      });
  // Close popup when clicking outside
      messagePopup.addEventListener('click', (e) => {
          if (e.target === messagePopup) {
              messagePopup.classList.add('hidden');
          }
      });
  });