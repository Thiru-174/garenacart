// Firebase configuration and initialization (unchanged)
const firebaseConfig = {
  apiKey: "AIzaSyCONCCtzR6bsEbbruuCmcGlpvCtehfhcb4",
  authDomain: "procart-3e4ca.firebaseapp.com",
  projectId: "procart-3e4ca",
  storageBucket: "procart-3e4ca.firebasestorage.app",
  messagingSenderId: "1025919263927",
  appId: "1:1025919263927:web:72cff3ed976d95d54b1932",
  measurementId: "G-4HT5YF32WZ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

// Navigation function (unchanged)
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  if (sectionId === 'products') loadProducts();
  if (sectionId === 'cart') loadCart();
  if (sectionId === 'history') loadHistory();
  if (sectionId === 'wishlist') loadWishlist();
}

// Function to revert back to the Login form
function showLogin(event) {
  if (event) event.preventDefault();
  const loginFormContainer = document.querySelector('#login .form-container');
  loginFormContainer.innerHTML = `
    <h2>Login</h2>
    <form id="loginForm">
      <input type="email" id="loginEmail" placeholder="Email" required>
      <input type="password" id="loginPassword" placeholder="Password" required>
      <select id="loginRole" required>
        <option value="" disabled selected>Select Role</option>
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" class="btn">Login</button>
    </form>
    <div id="loginMessage" class="message"></div>
    <div class="new-user">
      New user? <a href="#signup" onclick="showSignUp(event)" class="signup-link">Sign Up</a>
    </div>
  `;

  // Attach event listener after form is created
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
        currentUser = cred.user;
        document.getElementById('loginMessage').innerText = "Login successful!";

        // Admin check: hardcoded admin email
        const isAdmin = email === "thiru@gmail.com";

        if (role === "admin") {
          if (isAdmin) {
            window.location.href = "admin.html"; // Redirect to admin panel
          } else {
            document.getElementById('loginMessage').innerText = "Not authorized as admin.";
            auth.signOut();
          }
        } else {
          showSection('products'); // Stay on index.html for users
        }
      })
      .catch(err => {
        document.getElementById('loginMessage').innerText = err.message;
      });
  });
}

// Dynamically show Sign Up form when "Sign Up" link is clicked
function showSignUp(event) {
  event.preventDefault();
  const loginFormContainer = document.querySelector('#login .form-container');
  loginFormContainer.innerHTML = `
    <h2>Sign Up</h2>
    <form id="signUpForm">
      <input type="email" id="signUpEmail" placeholder="Email" required>
      <input type="password" id="signUpPassword" placeholder="Password" required>
      <button type="submit" class="btn">Sign Up</button>
    </form>
    <div id="signUpMessage" class="message"></div>
    <div class="back-to-login">
      <a href="#login" onclick="showLogin(event)" class="back-link">Back to Login</a>
    </div>
  `;

  document.getElementById('signUpForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => {
        currentUser = cred.user;
        document.getElementById('signUpMessage').innerText = "Registration successful! Please sign in.";
        return db.collection('users').doc(currentUser.uid).set({
          email: email,
          credit: 0
        });
      })
      .then(() => {
        showLogin(event); // Switch back to login form after signup
      })
      .catch(err => {
        document.getElementById('signUpMessage').innerText = err.message;
      });
  });
}

// Initial call to show login form when page loads
document.addEventListener('DOMContentLoaded', () => {
  showLogin(); // Ensure login form is loaded on page start
});

// Rest of your code (loadProducts, addToCart, etc.) remains unchanged...

// Login existing user with role check
document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;

  auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
          currentUser = cred.user;
          document.getElementById('loginMessage').innerText = "Login successful!";

          // Admin check: hardcoded admin email
          const isAdmin = email === "thiru@gmail.com"; // Set admin email here 

          if (role === "admin") {
              if (isAdmin) {
                  window.location.href = "admin.html"; // Redirect to admin panel
              } else {
                  document.getElementById('loginMessage').innerText = "Not authorized as admin.";
                  auth.signOut(); // Log out if not an admin
              }
          } else {
              showSection('products'); // Stay on index.html for users
          }
      })
      .catch(err => {
          document.getElementById('loginMessage').innerText = err.message;
      });
});

// Load products from Firestore with hover "Add to Cart" and in-card quantity
// Load products from Firestore with hover "Add to Cart" and in-card quantity
function loadProducts() {
  const productsListDiv = document.getElementById('productsList');
  productsListDiv.innerHTML = "Loading products...";
  
  db.collection('products').get()
    .then(snapshot => {
      productsListDiv.innerHTML = "";
      if (snapshot.empty) {
        showNotification("No products available.", true);
        return;
      }
      
      snapshot.forEach(doc => {
        const prod = doc.data();
        const imageUrl = prod.imageUrl || 'assets/images/broken.jpg';
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        
        if (prod.disabled) {
          productDiv.classList.add('disabled');
        }
        
        productDiv.innerHTML = `
          <img src="${imageUrl}" alt="${prod.name}" width="100" onerror="this.src='assets/images/broken.jpg'"/>
          <button class="add-to-cart" onclick="toggleQuantityControls('${doc.id}')">Add to Cart</button>
          <div class="product-details">
            <strong>${prod.name}</strong>
            <div class="description">${prod.description || 'No description available'}</div>
            <div class="price">₹${prod.price || 0}</div>
          </div>
          <div class="quantity-controls">
            <button onclick="decreaseQuantity('${doc.id}')">-</button>
            <span id="quantity-${doc.id}">1</span>
            <button onclick="increaseQuantity('${doc.id}')">+</button>
            <button class="confirm-btn" onclick="addToCart('${doc.id}')">Confirm</button>
          </div>
          <div id="stock-message-${doc.id}" class="stock-message"></div>
        `;
        
        // Display stock message if quantity is low
        if (prod.quantity < 10 && prod.quantity > 0) {
          const stockMsg = document.createElement('p');
          stockMsg.id = `stock-message-${doc.id}`;
          stockMsg.style.color = "red";
          stockMsg.style.fontWeight = "bold";
          stockMsg.innerText = `${prod.quantity} available`;
          productDiv.appendChild(stockMsg);
        } else if (prod.quantity === 0) {
          const stockMsg = document.createElement('p');
          stockMsg.id = `stock-message-${doc.id}`;
          stockMsg.style.color = "red";
          stockMsg.style.fontWeight = "bold";
          stockMsg.innerText = "Out of stock";
          productDiv.querySelector('.add-to-cart').disabled = true;
          productDiv.querySelector('.quantity-controls').style.display = 'none';
          productDiv.appendChild(stockMsg);
        }
        
        productsListDiv.appendChild(productDiv);
      });
    })
    .catch(err => {
      console.error("Error loading products:", err);
      showNotification("Error loading products.", true);
    });
}

// Toggle Quantity Controls
function toggleQuantityControls(productId) {
  const quantityControls = document.querySelector(`.product-item:has(#quantity-${productId}) .quantity-controls`);
  const stockMessage = document.getElementById(`stock-message-${productId}`);
  if (quantityControls) {
    quantityControls.classList.toggle('active');
    if (!quantityControls.classList.contains('active')) {
      // Reset quantity to 1 when closing
      document.getElementById(`quantity-${productId}`).innerText = 1;
    } else {
      // Check stock when opening
      checkStock(productId);
    }
  }
}

// Increase quantity (max 10, check stock)
function increaseQuantity(productId) {
  const qtySpan = document.getElementById(`quantity-${productId}`);
  let currentQty = parseInt(qtySpan.innerText);
  checkStock(productId, currentQty + 1, qtySpan);
}

// Decrease quantity (min 1)
function decreaseQuantity(productId) {
  const qtySpan = document.getElementById(`quantity-${productId}`);
  let currentQty = parseInt(qtySpan.innerText);
  if (currentQty > 1) {
    qtySpan.innerText = currentQty - 1;
    updateStockMessage(productId, currentQty - 1);
  }
}

// Check stock availability
function checkStock(productId, requestedQty = null, qtySpan = null) {
  db.collection('products').doc(productId).get()
    .then(doc => {
      if (doc.exists) {
        const prod = doc.data();
        const currentQty = requestedQty !== null ? requestedQty : parseInt(document.getElementById(`quantity-${productId}`).innerText);
        const availableQty = prod.quantity || 0;

        if (currentQty > availableQty) {
          showNotification(`Only ${availableQty} available.`, true);
          if (qtySpan) qtySpan.innerText = availableQty;
          updateStockMessage(productId, availableQty);
        } else {
          if (qtySpan) qtySpan.innerText = currentQty;
          updateStockMessage(productId, currentQty);
        }
      }
    })
    .catch(err => {
      console.error("Error checking stock:", err);
      showNotification("Error checking stock.", true);
    });
}

// Update stock message dynamically
function updateStockMessage(productId, qty) {
  const stockMessage = document.getElementById(`stock-message-${productId}`);
  if (stockMessage) {
    if (qty < 10 && qty > 0) {
      stockMessage.innerText = `${qty} available`;
      stockMessage.style.display = 'block';
    } else if (qty === 0) {
      stockMessage.innerText = "Out of stock";
      stockMessage.style.display = 'block';
      document.querySelector(`.product-item:has(#quantity-${productId}) .add-to-cart`).disabled = true;
      document.querySelector(`.product-item:has(#quantity-${productId}) .quantity-controls`).style.display = 'none';
    } else {
      stockMessage.style.display = 'none';
    }
  }
}

// Add to cart with selected quantity, update stock, and in-app notification
function addToCart(productId) {
  if (!currentUser) {
    showNotification("Please log in to add items to cart.", true);
    return;
  }

  const qtySpan = document.getElementById(`quantity-${productId}`);
  const quantity = parseInt(qtySpan.innerText);

  db.collection('products').doc(productId).get()
    .then(doc => {
      if (doc.exists) {
        const prod = doc.data();
        const availableQty = prod.quantity || 0;

        if (quantity > availableQty) {
          showNotification(`Only ${availableQty} available.`, true);
          qtySpan.innerText = availableQty;
          return;
        }

        const newStock = availableQty - quantity;
        db.collection('products').doc(productId).update({ quantity: newStock })
          .then(() => {
            const cartRef = db.collection('cart').doc(currentUser.uid).collection('items');
            cartRef.where('productId', '==', productId).get()
              .then(snapshot => {
                if (!snapshot.empty) {
                  const doc = snapshot.docs[0];
                  const newQty = Math.min(doc.data().quantity + quantity, 10);
                  doc.ref.update({ quantity: newQty })
                    .then(() => {
                      showNotification("Cart updated successfully!", false);
                      toggleQuantityControls(productId);
                      loadProducts(); // Refresh to update stock
                    })
                    .catch(err => {
                      showNotification("Error updating cart: " + err.message, true);
                    });
                } else {
                  cartRef.add({
                    productId: productId,
                    name: prod.name,
                    price: prod.price,
                    credit: prod.credit,
                    imageUrl: prod.imageUrl || 'assets/images/broken.jpg',
                    quantity: quantity
                  }).then(() => {
                    showNotification("Added to cart successfully!", false);
                    toggleQuantityControls(productId);
                    loadProducts(); // Refresh to update stock
                  })
                  .catch(err => {
                    showNotification("Error adding to cart: " + err.message, true);
                  });
                }
              })
              .catch(err => {
                showNotification("Error accessing cart: " + err.message, true);
              });
          })
          .catch(err => {
            showNotification("Error updating stock: " + err.message, true);
          });
      } else {
        showNotification("Product not found.", true);
      }
    })
    .catch(err => {
      showNotification("Error fetching product: " + err.message, true);
    });
}

// Show Notification Function
function showNotification(message, isError) {
  const notification = document.getElementById('notification');
  notification.innerText = message;
  notification.className = 'notification';
  if (isError) {
    notification.classList.add('error');
  }
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 3000); // Hide after 3 seconds
}

 // Load Wishlist with improved styling and images
function loadWishlist() {
    if (!currentUser) {
      alert("Please login first!");
      return;
    }
    
    const wishlistListDiv = document.getElementById('wishlistList');
    wishlistListDiv.innerHTML = "Loading wishlist..."; // Add loading state
    
    db.collection('users').doc(currentUser.uid).collection('wishlist').get()
      .then(snapshot => {
        wishlistListDiv.innerHTML = ""; // Clear previous content
        
        if (snapshot.empty) {
          wishlistListDiv.innerHTML = "Your wishlist is empty.";
          return;
        }
        
        snapshot.forEach(doc => {
          const item = doc.data();
          const imageUrl = item.imageUrl || 'assets/images/broken.jpg';
          
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('wishlist-item');
          itemDiv.innerHTML = `
            <div class="wishlist-item-content">
              <img src="${imageUrl}" alt="${item.name}" width="100" onerror="this.src='assets/images/broken.jpg'"/>
              <div class="wishlist-item-details">
                <div class="wishlist-item-name">${item.name}</div>
                <div class="wishlist-item-price">₹${item.price}</div>
                <div class="wishlist-item-credit">Credit: ${item.credit || 0}</div>
                <div class="wishlist-actions">
                  <button onclick="addToCartFromWishlist('${doc.id}')">Add to Cart</button>
                  <button onclick="removeFromWishlist('${doc.id}')">Remove</button>
                </div>
              </div>
            </div>
          `;
          wishlistListDiv.appendChild(itemDiv);
        });
      })
      .catch(err => {
        console.error("Error loading wishlist:", err);
        wishlistListDiv.innerHTML = "Error loading wishlist.";
      });
}

// Increase/decrease cart quantity functions
function increaseCartQuantity(itemId) {
    if (!currentUser) return;
    
    const qtySpan = document.getElementById(`cart-quantity-${itemId}`);
    let currentQty = parseInt(qtySpan.innerText);
    let newQty = currentQty + 1;
    
    db.collection('cart').doc(currentUser.uid).collection('items').doc(itemId).update({
      quantity: newQty
    })
    .then(() => {
      qtySpan.innerText = newQty;
      loadCart(); // Refresh cart to update totals
    })
    .catch(err => {
      console.error("Error updating quantity:", err);
    });
  }
  
  function decreaseCartQuantity(itemId) {
    if (!currentUser) return;
    
    const qtySpan = document.getElementById(`cart-quantity-${itemId}`);
    let currentQty = parseInt(qtySpan.innerText);
    
    if (currentQty > 1) {
      let newQty = currentQty - 1;
      
      db.collection('cart').doc(currentUser.uid).collection('items').doc(itemId).update({
        quantity: newQty
      })
      .then(() => {
        qtySpan.innerText = newQty;
        loadCart(); // Refresh cart to update totals
      })
      .catch(err => {
        console.error("Error updating quantity:", err);
      });
    }
  }

// Add to Wishlist
function addToWishlist(productId) {
  if (!currentUser) {
      alert("Please login first!");
      return;
  }

  db.collection('products').doc(productId).get()
      .then(doc => {
          if (doc.exists) {
              const product = doc.data();
              const wishlistRef = db.collection('users').doc(currentUser.uid).collection('wishlist');

              // Check if the product is already in the wishlist
              wishlistRef.where('name', '==', product.name).get()
                  .then(snapshot => {
                      if (snapshot.empty) {
                          // Product not found in wishlist, add it
                          wishlistRef.add(product)
                              .then(() => {
                                  alert(`${product.name} added to wishlist.`);
                                  loadWishlist(); // Refresh wishlist after adding
                              })
                              .catch(err => {
                                  alert(err.message);
                              });
                      } else {
                          // Product already exists in wishlist
                          alert(`${product.name} is already in your wishlist.`);
                      }
                  })
                  .catch(err => {
                      alert(err.message);
                  });
          } else {
              alert("Product not found.");
          }
      })
      .catch(err => {
          alert("Error fetching product: " + err.message);
      });
}

// Load Wishlist
function loadWishlist() {
  if (!currentUser) {
      alert("Please login first!");
      return;
  }
  const wishlistListDiv = document.getElementById('wishlistList');
  wishlistListDiv.innerHTML = "Loading wishlist..."; // Add loading state
  db.collection('users').doc(currentUser.uid).collection('wishlist').get()
      .then(snapshot => {
          wishlistListDiv.innerHTML = ""; // Clear previous content
          if (snapshot.empty) {
              wishlistListDiv.innerHTML = "Your wishlist is empty.";
              return;
          }
          snapshot.forEach(doc => {
              const item = doc.data();
              const itemDiv = document.createElement('div');
              itemDiv.classList.add('wishlist-item');
              itemDiv.innerHTML = `
                  <img src="${item.imageUrl}" alt="${item.name}" width="100" onerror="this.src='assets/images/broken.jpg'"/>
                  <br>
                  ${item.name} - ₹${item.price}
                  <br>
                  <button onclick="removeFromWishlist('${doc.id}')">Remove</button>
              `;
              wishlistListDiv.appendChild(itemDiv);
          });
      })
      .catch(err => {
          console.error("Error loading wishlist:", err);
          wishlistListDiv.innerHTML = "Error loading wishlist.";
      });
}

// Load cart items with quantity controls
function loadCart() {
    if (!currentUser) {
      alert("Please login first!");
      return;
    }
    const cartListDiv = document.getElementById('cartList');
    const totalPriceSpan = document.getElementById('totalPrice');
    const availableCreditsSpan = document.getElementById('availableCredits');
    const creditValueSpan = document.getElementById('creditValue');
    const useCreditsCheckbox = document.getElementById('useCredits');
    cartListDiv.innerHTML = "";
    let totalPrice = 0;
  
    // Fetch user's credits
    db.collection('users').doc(currentUser.uid).get().then(userDoc => {
      const userCredits = userDoc.data().credit || 0; // Credits in ₹
      const creditPoints = Math.floor(userCredits / 100); // Convert ₹ to credit points
      availableCreditsSpan.innerText = creditPoints;
      creditValueSpan.innerText = userCredits.toFixed(2);
  
      // Fetch cart items
      db.collection('cart').doc(currentUser.uid).collection('items').get()
        .then(snapshot => {
          if (snapshot.empty) {
            cartListDiv.innerHTML = "Your cart is empty.";
            totalPriceSpan.innerText = "0";
            useCreditsCheckbox.disabled = true;
            return;
          }
          
          // Process each cart item
          const promises = [];
          snapshot.forEach(doc => {
            const item = doc.data();
            
            // If the item doesn't have an imageUrl, fetch it from the products collection
            if (!item.imageUrl && item.productId) {
              const promise = db.collection('products').doc(item.productId).get()
                .then(productDoc => {
                  if (productDoc.exists) {
                    item.imageUrl = productDoc.data().imageUrl || 'assets/images/broken.jpg';
                  }
                  return { doc, item };
                });
              promises.push(promise);
            } else {
              // If the item already has an imageUrl or no productId, just use what we have
              item.imageUrl = item.imageUrl || 'assets/images/broken.jpg';
              promises.push(Promise.resolve({ doc, item }));
            }
          });
          
          // Once all product images are fetched, display the cart items
          return Promise.all(promises);
        })
        .then(results => {
          if (!results || results.length === 0) return;
          
          results.forEach(({ doc, item }) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('cart-item');
            itemDiv.innerHTML = `
              <div class="cart-item-content">
                <img src="${item.imageUrl}" alt="${item.name}" width="80" onerror="this.src='assets/images/broken.jpg'"/>
                <div class="cart-item-details">
                  <div class="cart-item-name">${item.name}</div>
                  <div class="cart-item-price">₹${item.price}</div>
                  <div class="quantity-controls">
                    <button onclick="decreaseCartQuantity('${doc.id}')">-</button>
                    <span id="cart-quantity-${doc.id}">${item.quantity}</span>
                    <button onclick="increaseCartQuantity('${doc.id}')">+</button>
                  </div>
                  <div class="cart-item-total">Total: ₹${itemTotal}</div>
                  <button class="remove-btn" onclick="removeFromCart('${doc.id}')">Remove</button>
                </div>
              </div>
            `;
            cartListDiv.appendChild(itemDiv);
          });
          
          totalPriceSpan.innerText = totalPrice.toFixed(2);
          useCreditsCheckbox.disabled = false;
          updateTotalWithCredits(); // Update total with credits if checked
        })
        .catch(err => {
          console.error("Error loading cart:", err);
          cartListDiv.innerHTML = "Error loading cart.";
        });
    });
  }
  
  // Add to Cart from Wishlist
function addToCartFromWishlist(wishlistItemId) {
    if (!currentUser) {
      alert("Please login first!");
      return;
    }
    
    // Get the wishlist item
    db.collection('users').doc(currentUser.uid).collection('wishlist').doc(wishlistItemId).get()
      .then(doc => {
        if (doc.exists) {
          const item = doc.data();
          
          // Add to cart
          db.collection('cart').doc(currentUser.uid).collection('items').add({
            productId: item.id || wishlistItemId,
            name: item.name,
            price: item.price,
            credit: item.credit || 0,
            imageUrl: item.imageUrl || 'assets/images/broken.jpg',
            quantity: 1
          })
          .then(() => {
            alert(`${item.name} added to cart!`);
          })
          .catch(err => {
            console.error("Error adding to cart:", err);
            alert("Error adding item to cart.");
          });
        } else {
          alert("Wishlist item not found.");
        }
      })
      .catch(err => {
        console.error("Error fetching wishlist item:", err);
        alert("Error fetching wishlist item.");
      });
  }
  
  // Update total price with credits if checkbox is checked
  function updateTotalWithCredits() {
    const useCreditsCheckbox = document.getElementById('useCredits');
    const totalPriceSpan = document.getElementById('totalPrice');
    const creditValueSpan = document.getElementById('creditValue');
    const discountAmountSpan = document.getElementById('discountAmount');
    const creditDiscountDiv = document.getElementById('creditDiscount');
    const finalTotalDiv = document.getElementById('finalTotal');
    const finalPriceSpan = document.getElementById('finalPrice');
  
    const totalPrice = parseFloat(totalPriceSpan.innerText);
    const availableCreditValue = parseFloat(creditValueSpan.innerText);
  
    if (useCreditsCheckbox.checked && availableCreditValue > 0) {
      const discount = Math.min(availableCreditValue, totalPrice); // Use credits up to total price
      discountAmountSpan.innerText = discount.toFixed(2);
      creditDiscountDiv.style.display = 'block';
      finalPriceSpan.innerText = (totalPrice - discount).toFixed(2);
      finalTotalDiv.style.display = 'block';
    } else {
      creditDiscountDiv.style.display = 'none';
      finalTotalDiv.style.display = 'none';
    }
  }
  
  // Remove item from cart (refresh cart after removal)
  function removeFromCart(itemId) {
    if (!currentUser) {
      alert("Please login first!");
      return;
    }
    db.collection('cart').doc(currentUser.uid).collection('items').doc(itemId).delete()
      .then(() => {
        alert("Item removed from cart!");
        loadCart(); // Refresh cart display with updated total
      })
      .catch(err => {
        console.error("Error removing item from cart:", err);
        alert("Error removing item from cart.");
      });
  }



// Remove item from wishlist
function removeFromWishlist(itemId) {
  if (!currentUser) {
      alert("Please login first!");
      return;
  }
  db.collection('users').doc(currentUser.uid).collection('wishlist').doc(itemId).delete()
      .then(() => {
          alert("Item removed from wishlist!");
          loadWishlist(); // Refresh wishlist display
      })
      .catch(err => {
          console.error("Error removing item from wishlist:", err);
          alert("Error removing item from wishlist.");
      });
}

// Place an order with bill generation and credit deduction
function placeOrder() {
    if (!currentUser) {
      alert("Please login first!");
      return;
    }
    const userCartRef = db.collection('cart').doc(currentUser.uid).collection('items');
    const userRef = db.collection('users').doc(currentUser.uid);
    const billDetailsDiv = document.getElementById('billDetails');
    const creditsEarnedSpan = document.getElementById('creditsEarned');
    const useCreditsCheckbox = document.getElementById('useCredits');
    const totalPriceSpan = document.getElementById('totalPrice');
    const discountAmountSpan = document.getElementById('discountAmount');
  
    userCartRef.get().then(snapshot => {
      let cartItems = [];
      let totalPrice = 0;
      let totalCredit = 0;
  
      if (snapshot.empty) {
        alert("Your cart is empty!");
        return;
      }
  
      snapshot.forEach(doc => {
        const item = doc.data();
        cartItems.push(item);
        totalPrice += item.price * item.quantity;
        totalCredit += item.credit * item.quantity; // Credits earned
      });
  
      // Calculate credit discount if used
      let discount = 0;
      let finalAmount = totalPrice;
      if (useCreditsCheckbox.checked) {
        const availableCredits = parseFloat(document.getElementById('creditValue').innerText);
        discount = Math.min(availableCredits, totalPrice);
        finalAmount = totalPrice - discount;
      }
  
      // Save order to Firestore and get the Order ID
      db.collection('orders').add({
        userId: currentUser.uid,
        items: cartItems,
        totalPrice: totalPrice,
        totalCredit: totalCredit,
        creditDiscount: discount,
        finalAmount: finalAmount,
        orderDate: new Date()
      }).then(docRef => {
        const orderId = docRef.id; // Get the generated Order ID
  
        // Generate bill details with a table for items
        let billContent = `
          <h2>Your Bill</h2>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Customer ID:</strong> ${currentUser.uid}</p>
          <p><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
          <table class="bill-table" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #6a11cb; color: white;">
                <th>#</th>
                <th>Product</th>
                <th>Price (₹)</th>
                <th>Quantity</th>
                <th>Total (₹)</th>
                <th>Credits Earned</th>
              </tr>
            </thead>
            <tbody>
              ${cartItems.map((item, index) => {
                const itemTotal = item.price * item.quantity;
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.price.toLocaleString('en-IN')}</td>
                    <td>${item.quantity}</td>
                    <td>${itemTotal.toLocaleString('en-IN')}</td>
                    <td>${item.credit * item.quantity}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <p><strong>Total Price:</strong> ₹${totalPrice.toLocaleString('en-IN')}</p>
          ${discount > 0 ? `<p><strong>Credit Discount:</strong> ₹${discount.toLocaleString('en-IN')}</p>` : ''}
          <p><strong>Final Amount:</strong> ₹${finalAmount.toLocaleString('en-IN')}</p>
        `;
        function downloadInvoice() {
          // Fix: Ensure html2pdf.js is loaded
          if (typeof html2pdf !== 'function') {
              alert("Error: html2pdf.js not loaded!");
              return;
          }
      
          // Set current date and time
          document.getElementById("invoiceDate").innerText = new Date().toLocaleDateString();
          document.getElementById("invoiceTime").innerText = new Date().toLocaleTimeString();
      
          // Example data: Fetch from actual order history
          let orders = [
              { item: "Laptop", qty: 1, price: 800, total: 800 },
              { item: "Mouse", qty: 2, price: 20, total: 40 }
          ];
      
          let subtotal = 0;
          let taxRate = 0.05; // 5% tax
          let invoiceTable = document.getElementById("invoiceItems");
          invoiceTable.innerHTML = ""; // Clear previous data
      
          orders.forEach(order => {
              let row = `<tr>
                          <td>${order.item}</td>
                          <td>${order.qty}</td>
                          <td>$${order.price}</td>
                          <td>$${order.total}</td>
                         </tr>`;
              invoiceTable.innerHTML += row;
              subtotal += order.total;
          });
      
          let tax = subtotal * taxRate;
          let grandTotal = subtotal + tax;
      
          document.getElementById("invoiceSubtotal").innerText = `$${subtotal.toFixed(2)}`;
          document.getElementById("invoiceTax").innerText = `$${tax.toFixed(2)}`;
          document.getElementById("invoiceTotal").innerText = `$${grandTotal.toFixed(2)}`;
      
          // Convert HTML to PDF
          const invoiceElement = document.getElementById("invoice");
          invoiceElement.style.display = "block"; // Make visible for PDF
      
          const options = {
              margin: 10,
              filename: 'GarenaCart_Invoice.pdf',
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
      
          html2pdf().from(invoiceElement).set(options).save().then(() => {
              invoiceElement.style.display = "none"; // Hide again after downloading
          });
      }
      
        // Update credits earned
        creditsEarnedSpan.innerText = totalCredit;
        const creditValueEarned = totalCredit * 100;
        billContent += `
          <p><strong>Credits Earned:</strong> ${totalCredit} (₹${creditValueEarned.toLocaleString('en-IN')})</p>
        `;
  
        billDetailsDiv.innerHTML = billContent;
  
        // Show bill section
        document.getElementById('billSection').style.display = 'block';
  
        // Update user credits
        userRef.get().then(userDoc => {
          const currentCredit = userDoc.data().credit || 0;
          const newCredit = currentCredit - discount + creditValueEarned; // Deduct used credits, add earned credits
          userRef.update({ credit: newCredit });
        });
  
        // Clear cart
        snapshot.forEach(doc => doc.ref.delete());
        alert("Order placed successfully! Check your bill below.");
        loadCart(); // Refresh cart
      }).catch(err => {
        console.error("Error placing order:", err);
        alert("Error placing order.");
      });
    }).catch(err => {
      console.error("Error fetching cart:", err);
      alert("Error processing cart.");
    });
  }

// Print bill
function printBill() {
    const billSection = document.getElementById('billSection').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>GarenaCart🛒 Shopping Bill</title>
          <style>
            body { font-family: 'Poppins', sans-serif; padding: 20px; }
            p { margin: 5px 0; }
            strong { margin-right: 10px; }
          </style>
        </head>
        <body>
          <h1>GarenaCart🛒 Bill</h1>
          ${billSection}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

// Load order history with bill details and product images
function loadHistory() {
    if (!currentUser) {
      alert("Please login first!");
      return;
    }
    const historyListDiv = document.getElementById('historyList');
    historyListDiv.innerHTML = "";
    db.collection('orders')
      .where("userId", "==", currentUser.uid)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          historyListDiv.innerHTML = "No order history available.";
          return;
        }
        snapshot.forEach(doc => {
          const order = doc.data();
          const orderId = doc.id; // Get the Order ID
          const orderDiv = document.createElement('div');
          orderDiv.classList.add('order-item');
          
          // Format order date
          const orderDate = order.orderDate && order.orderDate.seconds
            ? new Date(order.orderDate.seconds * 1000).toLocaleString()
            : new Date(order.orderDate).toLocaleString();
  
          // Generate bill content with table including images
          let billContent = `
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Customer ID:</strong> ${currentUser.uid}</p>
            <p><strong>Order Date:</strong> ${orderDate}</p>
            <table class="bill-table" style="border-collapse: collapse; width: 100%;">
              <thead>
                <tr style="background-color: #2a9d4f; color: white;">
                  <th>Image</th>
                  <th>Product</th>
                  <th>Price (₹)</th>
                  <th>Quantity</th>
                  <th>Total (₹)</th>
                  <th>Credits Earned</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => {
                  const itemTotal = item.price * item.quantity;
                  const imageUrl = item.imageUrl || 'assets/images/broken.jpg';
                  return `
                    <tr>
                      <td><img src="${imageUrl}" alt="${item.name}" width="50" onerror="this.src='assets/images/broken.jpg'"/></td>
                      <td>${item.name}</td>
                      <td>${item.price.toLocaleString('en-IN')}</td>
                      <td>${item.quantity}</td>
                      <td>${itemTotal.toLocaleString('en-IN')}</td>
                      <td>${item.credit * item.quantity}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <p><strong>Total Price:</strong> ₹${order.totalPrice.toLocaleString('en-IN')}</p>
            ${order.creditDiscount > 0 ? `<p><strong>Credit Discount:</strong> ₹${order.creditDiscount.toLocaleString('en-IN')}</p>` : ''}
            <p><strong>Final Amount:</strong> ₹${order.finalAmount.toLocaleString('en-IN')}</p>
          `;
  
          // Add order details and bill to the history
          orderDiv.innerHTML = `
            <strong>Order on ${orderDate}:</strong><br>
            <div class="bill-details">
              ${billContent}
            </div>
          `;
          historyListDiv.appendChild(orderDiv);
        });
      })
      .catch(err => {
        console.error("Error loading history:", err);
        historyListDiv.innerHTML = "Error loading order history.";
      });
  }

// Firebase configuration (replace with your actual config)

// Function to fetch products from Firestore
async function fetchProducts() {
  try {
      const productsSnapshot = await db.collection("products").get();
      return productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
      console.error("Error fetching products:", error);
      return [];
  }
}

// Function to display products
function displayProducts(products) {
  const productGrid = document.getElementById("productsList");
  productGrid.innerHTML = ""; // Clear current products
  products.forEach(product => {
      const productItem = document.createElement("div");
      productItem.classList.add("product-item");
      productItem.innerHTML = `
          <h3>${product.name}</h3>
          <p>Category: ${product.category}</p>
          <p>Price: ₹${product.price}</p>
          <button onclick="addToCart('${product.id}')">Add to Cart</button>
      `;
      productGrid.appendChild(productItem);
  });
}

// Function to populate categories dynamically
async function populateCategories() {
  const products = await fetchProducts();
  const categories = [...new Set(products.map(p => p.category))];
  const categorySelect = document.getElementById("category-select");
  categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
  });
}

// Function to filter and sort products
async function updateProductDisplay() {
  let products = await fetchProducts();

  // Filter by category
  const category = document.getElementById("category-select").value;
  if (category !== "all") {
      products = products.filter(product => product.category === category);
  }

  // Filter by search query
  const searchQuery = document.getElementById("search-bar").value.toLowerCase();
  if (searchQuery) {
      products = products.filter(product =>
          product.name.toLowerCase().includes(searchQuery) ||
          product.category.toLowerCase().includes(searchQuery)
      );
  }

  // Sort products
  const sortOption = document.getElementById("sort-select").value;
  if (sortOption === "price-asc") {
      products.sort((a, b) => a.price - b.price);
  } else if (sortOption === "price-desc") {
      products.sort((a, b) => b.price - a.price);
  }

  displayProducts(products);
}

// Event listeners
document.getElementById("search-btn").addEventListener("click", updateProductDisplay);
document.getElementById("category-select").addEventListener("change", updateProductDisplay);
document.getElementById("sort-select").addEventListener("change", updateProductDisplay);

// Initial setup
document.addEventListener("DOMContentLoaded", async () => {
  await populateCategories();
  await updateProductDisplay();
});

// Placeholder for addToCart (implement as needed)
function addToCart(productId) {
  console.log(`Added product ${productId} to cart`);
  // Add your cart logic here (e.g., update Firestore or local cart state)
}

// Logout
function logout() {
  auth.signOut().then(() => {
      currentUser = null;
      alert("Logged out successfully.");
      showSection('home');
  });
}

// Monitor authentication state
auth.onAuthStateChanged(user => {
  currentUser = user;
});

// Add event listener for Wishlist section
document.addEventListener('DOMContentLoaded', () => {
  // Wishlist link event listener
  const wishlistLink = document.querySelector('.nav-link[onclick^="showSection(\'wishlist\'"]');
  if (wishlistLink) {
      wishlistLink.addEventListener('click', () => {
          loadWishlist();
      });
  }
});

function completePurchase(userId, totalAmount) {
  let creditPoints = Math.floor(totalAmount / 10); // 10% of total amount as credits

  let userRef = firebase.firestore().collection("users").doc(userId);
  userRef.get().then(doc => {
      let currentCredits = doc.data().credits || 0;
      userRef.update({ credits: currentCredits + creditPoints })
          .then(() => alert("Purchase successful! Credits updated."))
          .catch(error => console.error("Error updating credits:", error));
  });
}