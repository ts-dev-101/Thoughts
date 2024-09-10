import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, doc, updateDoc, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase configuration
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

// Fetch posts and display them in reverse order
function getPosts() {
  const postsContainer = document.getElementById('posts-container');
  const lastVisit = localStorage.getItem('lastVisit') || new Date().toISOString();  // Get last visit from localStorage
  localStorage.setItem('lastVisit', new Date().toISOString());  // Update last visit for next time

  onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc')), (snapshot) => {
    postsContainer.innerHTML = '';
    snapshot.forEach((doc) => {
      const postData = doc.data();
      const postElement = document.createElement('div');
      postElement.className = 'post-box';

      // Highlight new posts
      const postDate = new Date(postData.timestamp.seconds * 1000);  // Convert Firestore timestamp to JS Date
      if (postDate > new Date(lastVisit)) {
        postElement.classList.add('new-post');  // Add dark color class to new posts
      }

      postElement.innerHTML = `
        ${postData.text}
        <div class="timestamp">
          <p>${formatTimestamp(postData.timestamp)}</p>
          <button class="like-btn" onclick="likePost('${doc.id}', ${postData.likes || 0})">Like</button>
          <span class="like-count">${postData.likes || 0}</span>
          <button class="comment-btn" onclick="openCommentPopup('${doc.id}')">Comment</button>
        </div>
      `;
      postsContainer.appendChild(postElement);
    });

    // Scroll to the top of the posts container
    postsContainer.scrollTop = 0;
  }, (error) => {
    console.error('Error fetching posts:', error);
  });
}

// Post a new thought
function sendPost() {
  const message = document.getElementById('popup-message').value;
  if (message.trim() !== '') {
    addDoc(collection(db, 'posts'), {
      text: message,
      timestamp: serverTimestamp(),
      likes: 0
    }).then(() => {
      closePopup();
    }).catch((error) => {
      console.error("Error adding document: ", error);
    });
  }
}

// Function to handle likes
async function likePost(postId, currentLikes) {
  const postRef = doc(db, 'posts', postId);
  try {
    await updateDoc(postRef, {
      likes: currentLikes + 1
    });
  } catch (error) {
    console.error("Error updating like count: ", error);
  }
}

// Open the popup for adding a new thought
function openPopup() {
  document.getElementById('popup').style.display = 'flex';
}

// Close the popup
function closePopup() {
  document.getElementById('popup').style.display = 'none';
}

// Open the comment popup and set the current postId
let currentPostId = null;
function openCommentPopup(postId) {
  currentPostId = postId;  // Set the current post ID
  document.getElementById('comment-popup').style.display = 'flex';
  getComments(postId);
}

// Close the comment popup
function closeCommentPopup() {
  document.getElementById('comment-popup').style.display = 'none';
}

// Send a new comment for the current post
function sendComment() {
  const commentMessage = document.getElementById('comment-message').value;
  if (commentMessage.trim() !== '') {
    addDoc(collection(db, 'comments'), {
      postId: currentPostId,  // Use the stored current post ID
      text: commentMessage,
      timestamp: serverTimestamp()
    }).then(() => {
      getComments(currentPostId);  // Reload comments
    }).catch((error) => {
      console.error("Error adding comment: ", error);
    });
  }
}

// Fetch and display comments for a specific post
function getComments(postId) {
  const commentsContainer = document.getElementById('comments-container');
  const commentsQuery = query(collection(db, 'comments'), where('postId', '==', postId));
  getDocs(commentsQuery).then((querySnapshot) => {
    commentsContainer.innerHTML = '';
    querySnapshot.forEach((doc) => {
      const commentData = doc.data();
      const commentElement = document.createElement('div');
      commentElement.className = 'comment-box';
      commentElement.innerHTML = `
        ${commentData.text}
        <div class="timestamp">${formatTimestamp(commentData.timestamp)}</div>
      `;
      commentsContainer.appendChild(commentElement);
    });
  }).catch((error) => {
    console.error("Error fetching comments: ", error);
  });
}

// Open the search popup
function openSearchPopup() {
  document.getElementById('search-popup').style.display = 'flex';
}

// Close the search popup
function closeSearchPopup() {
  document.getElementById('search-popup').style.display = 'none';
}

// Search posts based on input text
async function searchPosts() {
  const searchText = document.getElementById('search-input').value.trim().toLowerCase();
  const searchResults = document.getElementById('search-results');
  searchResults.innerHTML = '';

  if (searchText === '') {
    searchResults.innerHTML = '<p>Please enter a search term.</p>';
    return; // Exit if search input is empty
  }

  try {
    // Fetch all posts from Firestore
    const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(postsQuery);

    if (querySnapshot.empty) {
      searchResults.innerHTML = '<p>No posts found.</p>';
    } else {
      let resultsFound = false;
      querySnapshot.forEach((doc) => {
        const postData = doc.data();
        const postText = postData.text.toLowerCase();

        // Check if post text includes the search term
        if (postText.includes(searchText)) {
          resultsFound = true;
          const postElement = document.createElement('div');
          postElement.className = 'post-box';
          postElement.innerHTML = `
            ${highlightText(postData.text, searchText)}
            <div class="timestamp">
              <p>${formatTimestamp(postData.timestamp)}</p>
              <span class="like-count">${postData.likes || 0}</span>
          
              <button class="like-btn" onclick="likePost('${doc.id}', ${postData.likes || 0})" style="background: transparent; border: none; border-radius: 8px; color: #007bff; font-size: 10px; padding: 10px; width: 30px;">Like</button>
          
              <button class="comment-btn" onclick="openCommentPopup('${doc.id}')" style="background: #000; border: none; border-radius: 8px; color: white; font-size: 10px; padding: 10px; width: 70px;">Comment</button>
          
            </div>
          `;
          searchResults.appendChild(postElement);
        }
      });

      if (!resultsFound) {
        searchResults.innerHTML = '<p>No posts found matching your criteria.</p>';
      }
    }
  } catch (error) {
    console.error("Error searching posts:", error);
  }
}

// Function to highlight search terms in the text
function highlightText(text, query) {
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}


// Function to get user browser info and IP
function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  return { userAgent, platform };
}

// Function to get IP address (requires a server-side solution, here we'll use a mock function)
async function getIpAddress() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error fetching IP:', error);
    return 'Unknown IP';
  }
}

// Save visitor data in Firestore
async function saveVisitData() {
  const { userAgent, platform } = getBrowserInfo();
  const ip = await getIpAddress();
  try {
    await addDoc(collection(db, 'visit'), {
      userAgent,
      platform,
      ip,
      timestamp: serverTimestamp()
    });
    console.log('Visitor data saved successfully');
  } catch (error) {
    console.error('Error saving visitor data:', error);
  }
}


// Expose functions to the global scope
window.sendPost = sendPost;
window.openPopup = openPopup;
window.closePopup = closePopup;
window.likePost = likePost;
window.openCommentPopup = openCommentPopup;
window.closeCommentPopup = closeCommentPopup;
window.sendComment = sendComment;
window.openSearchPopup = openSearchPopup;
window.closeSearchPopup = closeSearchPopup;
window.searchPosts = searchPosts;




// Save visitor data when the page loads
window.onload = function() {
  saveVisitData();
};

// Load posts when the page loads
getPosts();
