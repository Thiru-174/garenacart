
// Firebase configuration
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
document.getElementById('generateSalesReportBtn').addEventListener('click', function() {
  window.location.href = 'sales-report.html'; // Redirect to new sales report page
});
// Admin Login Form Event Listener
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  const loginMessage = document.getElementById('loginMessage');
  
  // Admin email validation
  const adminEmail = "thiru@gmail.com"; // Same as in your app.js
  
  if (email !== adminEmail) {
    loginMessage.innerText = "Not authorized as admin.";
    return;
  }
  
  // Attempt login
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      currentUser = userCredential.user;
      loginMessage.innerText = "Login successful!";
      showSection('adminPanel');
    })
    .catch((error) => {
      loginMessage.innerText = error.message;
    });
});

// Load cart items with credits display
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
        snapshot.forEach(doc => {
          const item = doc.data();
          const itemTotal = item.price * item.quantity;
          totalPrice += itemTotal;
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('cart-item');
          itemDiv.innerHTML = `
            ${item.name} - ₹${item.price} x ${item.quantity} = ₹${itemTotal}
            <button onclick="removeFromCart('${doc.id}')">Remove</button>
          `;
          cartListDiv.appendChild(itemDiv);
        });
        totalPriceSpan.innerText = totalPrice.toFixed(2);
        useCreditsCheckbox.disabled = false;
        updateTotalWithCredits(); // Initial call to update total with credits if checked
      })
      .catch(err => {
        console.error("Error loading cart:", err);
        cartListDiv.innerHTML = "Error loading cart.";
      });
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

// Load Products
function loadProducts() {
  const productsListDiv = document.getElementById('productsList');
  productsListDiv.innerHTML = "Loading products...";
  
  db.collection('products').get()
    .then(snapshot => {
      productsListDiv.innerHTML = "";
      if (snapshot.empty) {
        productsListDiv.innerHTML = "No products available.";
        return;
      }
      
      snapshot.forEach(doc => {
        const prod = doc.data();
        const imageUrl = prod.imageUrl || 'assets/images/broken.jpg';
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        productDiv.innerHTML = `
          <img src="${imageUrl}" alt="${prod.name}" width="100" onerror="this.src='assets/images/broken.jpg'"/>
          <div class="product-details">
            <strong>${prod.name}</strong> - ₹${prod.price}
            <br><small>Credit: ${prod.credit}</small>
          </div>
          <div class="product-actions">
            <button onclick="editProduct('${doc.id}')">Edit</button>
            <button onclick="deleteProductConfirm('${doc.id}')">Delete</button>
          </div>
        `;
        productsListDiv.appendChild(productDiv);
      });
    })
    .catch(err => {
      console.error("Error loading products:", err);
      productsListDiv.innerHTML = "Error loading products.";
    });
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

// Add Product Form Event Listener
document.getElementById('addProductForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const name = document.getElementById('productName').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const credit = parseFloat(document.getElementById('productCredit').value);
  const imageUrl = document.getElementById('productImageUrl').value;
  const description = document.getElementById('productDescription').value;
  const subCategory = document.getElementById('productSubCategory').value;
  const quantity = parseInt(document.getElementById('productQuantity').value, 10);
  const disabled = document.getElementById('productDisabled').checked; // New field
  
  db.collection('products').add({
    name: name,
    price: price,
    credit: credit,
    imageUrl: imageUrl,
    description: description,
    subCategory: subCategory,
    quantity: quantity,
    disabled: disabled
  })
  .then(() => {
    document.getElementById('productMessage').innerText = "Product added successfully!";
    document.getElementById('addProductForm').reset();
    showSection('adminPanel');
  })
  .catch(error => {
    document.getElementById('productMessage').innerText = `Error: ${error.message}`;
  });
});
// Edit Product
function editProduct(productId) {
  currentProductId = productId;
  
  db.collection('products').doc(productId).get()
    .then(doc => {
      if (doc.exists) {
        const product = doc.data();
        document.getElementById('updateProductName').value = product.name;
        document.getElementById('updateProductPrice').value = product.price;
        document.getElementById('updateProductCredit').value = product.credit;
        document.getElementById('updateProductImageUrl').value = product.imageUrl || '';
        document.getElementById('updateProductDescription').value = product.description || '';
        document.getElementById('updateProductSubCategory').value = product.subCategory || '';
        document.getElementById('updateProductQuantity').value = product.quantity || 0;
        document.getElementById('updateProductDisabled').checked = product.disabled || false;
        
        showSection('updateProductSection');
      } else {
        alert("Product not found.");
      }
    })
    .catch(error => {
      console.error("Error fetching product:", error);
      alert("Error fetching product details.");
    });
}

// Update Product Form Event Listener
document.getElementById('updateProductForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  if (!currentProductId) {
    alert("No product selected for update.");
    return;
  }
  
  const name = document.getElementById('updateProductName').value;
  const price = parseFloat(document.getElementById('updateProductPrice').value);
  const credit = parseFloat(document.getElementById('updateProductCredit').value);
  const imageUrl = document.getElementById('updateProductImageUrl').value;
  const description = document.getElementById('updateProductDescription').value;
  const subCategory = document.getElementById('updateProductSubCategory').value;
  const quantity = parseInt(document.getElementById('updateProductQuantity').value, 10);
  const disabled = document.getElementById('updateProductDisabled').checked; // New field
  
  db.collection('products').doc(currentProductId).update({
    name: name,
    price: price,
    credit: credit,
    imageUrl: imageUrl,
    description: description,
    subCategory: subCategory,
    quantity: quantity,
    disabled: disabled
  })
  .then(() => {
    alert("Product updated successfully!");
    document.getElementById('updateProductForm').reset();
    showSection('readProductsSection');
    loadProducts();
  })
  .catch(error => {
    alert(`Error updating product: ${error.message}`);
  });
});

// Delete Product Confirmation
function deleteProductConfirm(productId) {
  currentProductId = productId;
  
  db.collection('products').doc(productId).get()
    .then(doc => {
      if (doc.exists) {
        const product = doc.data();
        const detailsDiv = document.getElementById('deleteProductDetails');
        detailsDiv.innerHTML = `
          <p><strong>Name:</strong> ${product.name}</p>
          <p><strong>Price:</strong> ₹${product.price}</p>
        `;
        
        showSection('deleteProductSection');
      } else {
        alert("Product not found.");
      }
    })
    .catch(error => {
      console.error("Error fetching product:", error);
      alert("Error fetching product details.");
    });
}

// Confirm Delete Button Event Listener
document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
  if (!currentProductId) {
    alert("No product selected for deletion.");
    return;
  }
  
  db.collection('products').doc(currentProductId).delete()
    .then(() => {
      alert("Product deleted successfully!");
      showSection('readProductsSection');
      loadProducts();
    })
    .catch(error => {
      alert(`Error deleting product: ${error.message}`);
    });
});


// 🔹 Display Sales Summary Table
function displayTable(data) {
  let container = document.getElementById('salesTableContainer');
  let totalSales = Object.values(data).reduce((sum, value) => sum + value, 0);

  let tableHTML = `<table border="1">
      <tr><th>Category</th><th>Sales ($)</th></tr>`;
  
  for (let category in data) {
      tableHTML += `<tr><td>${category}</td><td>$${data[category]}</td></tr>`;
  }

  tableHTML += `<tr><td><strong>Total Sales</strong></td><td><strong>$${totalSales}</strong></td></tr>`;
  tableHTML += `</table>`;

  container.innerHTML = tableHTML;
}

// 🔹 Draw Sales Chart
function drawChart(data) {
  let ctx = document.getElementById('salesChart').getContext('2d');

  if (window.salesChart) {
      window.salesChart.destroy(); // Remove previous chart
  }

  window.salesChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: Object.keys(data),
          datasets: [{
              label: 'Sales by Category',
              data: Object.values(data),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: { display: true }
          }
      }
  });
}


// Logout
function logout() {
  auth.signOut()
    .then(() => {
      currentUser = null;
      // Redirect to index.html instead of showing the login section
      window.location.href = "index.html";
    })
    .catch(error => {
      console.error("Error signing out:", error);
    });
}

// Monitor authentication state
auth.onAuthStateChanged(user => {
  currentUser = user;
  
  // If user is logged in and we're on the login page, go to admin panel
  if (user && document.getElementById('loginSection').classList.contains('active')) {
    // Check if user is admin
    if (user.email === "thiru@gmail.com") {
      showSection('adminPanel');
    } else {
      // Not an admin, log them out
      auth.signOut().then(() => {
        alert("You are not authorized as an admin.");
        showSection('loginSection');
      });
    }
  } else if (!user && !document.getElementById('loginSection').classList.contains('active')) {
    // If not logged in and not on login page, redirect to login
    showSection('loginSection');
  }
});
