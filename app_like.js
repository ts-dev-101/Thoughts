import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXysLXql-3xkmC40ahDCTXoj3lXKo8ZUs",
  authDomain: "anything-aaf47.firebaseapp.com",
  projectId: "anything-aaf47",
  storageBucket: "anything-aaf47.appspot.com",
  messagingSenderId: "580140263",
  appId: "1:580140263:web:03048fa1f8b5a9b0847642",
  measurementId: "G-JH13NF4J3P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Format timestamp
function formatTimestamp(timestamp) {
  const date = timestamp.toDate();
  return `${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(-2)} ${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}`;
}

// Fetch posts from Firestore and display them
function getPosts() {
  const postsContainer = document.getElementById('posts-container');
  onSnapshot(collection(db, 'posts'), (snapshot) => {
    postsContainer.innerHTML = '';
    snapshot.forEach((doc) => {
      const postData = doc.data();
      const postElement = document.createElement('div');
      postElement.className = 'post-box';
      postElement.innerHTML = `
        ${postData.text}
        <div class="timestamp">
          ${formatTimestamp(postData.timestamp)}
          <button class="like-btn" onclick="likePost('${doc.id}', ${postData.likes || 0})">Like</button>
          <span class="like-count">${postData.likes || 0}</span>
        </div>
      `;
      postsContainer.appendChild(postElement);
    });

    // Scroll to the bottom of the posts container
    postsContainer.scrollTop = postsContainer.scrollHeight;
  });
}

// Post a new message
function sendPost() {
  const message = document.getElementById('popup-message').value;
  if (message.trim() !== '') {
    addDoc(collection(db, 'posts'), {
      text: message,
      timestamp: serverTimestamp(),
      likes: 0 // Initialize likes count to 0
    }).then(() => {
      closePopup(); // Close the popup after posting
    }).catch((error) => {
      console.error("Error adding document: ", error);
    });
  }
}

// Function to handle likes
async function likePost(postId, currentLikes) {
  const postRef = doc(db, 'posts', postId);
  try {
    // Increment the like count in Firestore
    await updateDoc(postRef, {
      likes: currentLikes + 1
    });
  } catch (error) {
    console.error("Error updating like count: ", error);
  }
}

// Open the popup
function openPopup() {
  document.getElementById('popup').style.display = 'flex';
}

// Close the popup
function closePopup() {
  document.getElementById('popup').style.display = 'none';
}

// Expose functions to the global scope
window.sendPost = sendPost;
window.openPopup = openPopup;
window.closePopup = closePopup;
window.likePost = likePost;

// Call getPosts when the page loads
window.onload = getPosts;