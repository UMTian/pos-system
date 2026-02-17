// ============================================
// RESTAURANT POS SYSTEM - COMPLETE JAVASCRIPT
// ============================================

// Global Variables
let currentOrder = [];
let selectedMenuItem = null;
let orderCounter = 1;
let recentOrders = [];
let todaySales = 0;
let totalOrders = 0;
let currentSheetUrl = '';
let currentSheetId = '';
let serverOnline = false;
let tablesStatus = {};

// Menu Items Data
const menuItems = [
    {
        id: 1,
        name: "Classic Burger",
        category: "main",
        price: 12.99,
        description: "Beef patty with lettuce, tomato, and cheese",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 2,
        name: "Margherita Pizza",
        category: "main",
        price: 14.99,
        description: "Fresh tomatoes, mozzarella, and basil",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 3,
        name: "Caesar Salad",
        category: "appetizer",
        price: 9.99,
        description: "Romaine lettuce, croutons, parmesan",
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 4,
        name: "French Fries",
        category: "appetizer",
        price: 5.99,
        description: "Crispy golden fries with seasoning",
        image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 5,
        name: "Chocolate Cake",
        category: "dessert",
        price: 7.99,
        description: "Rich chocolate cake with ganache",
        image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 6,
        name: "Ice Cream Sundae",
        category: "dessert",
        price: 6.99,
        description: "Vanilla ice cream with toppings",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 7,
        name: "Coca Cola",
        category: "drink",
        price: 2.99,
        description: "Regular or diet",
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 8,
        name: "Fresh Lemonade",
        category: "drink",
        price: 3.99,
        description: "Made with fresh lemons",
        image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 9,
        name: "Grilled Salmon",
        category: "main",
        price: 18.99,
        description: "Atlantic salmon with herbs",
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 10,
        name: "Garlic Bread",
        category: "appetizer",
        price: 4.99,
        description: "Toasted bread with garlic butter",
        image: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 11,
        name: "Chicken Wings",
        category: "appetizer",
        price: 11.99,
        description: "Spicy buffalo wings with dip",
        image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop&auto=format"
    },
    {
        id: 12,
        name: "Pasta Carbonara",
        category: "main",
        price: 13.99,
        description: "Creamy pasta with bacon",
        image: "https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=400&h=300&fit=crop&auto=format"
    }
];

// Initialize tables status
function initializeTables() {
    for (let i = 1; i <= 8; i++) {
        tablesStatus[i] = Math.random() > 0.5 ? 'available' : 'occupied';
    }
    tablesStatus[9] = 'available'; // Takeaway
    tablesStatus[10] = 'available'; // Delivery
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateDateTime();
    loadMenuItems();
    generateOrderNumber();
    initializeTables();
    checkServerStatus();
    
    // Update time every minute
    setInterval(updateDateTime, 60000);
    
    // Check server status every 30 seconds
    setInterval(checkServerStatus, 30000);
    
    // Load recent orders
    loadRecentOrders();
    
    // Load sales stats
    loadSalesStats();
    
    console.log('Restaurant POS System initialized');
});

// Update date and time display
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('datetime').textContent = now.toLocaleDateString('en-US', options);
}

// Check server status
async function checkServerStatus() {
    try {
        const response = await fetch('http://localhost:5000/test');
        if (response.ok) {
            serverOnline = true;
            document.getElementById('serverStatus').textContent = 'Connected';
            document.getElementById('serverStatus').style.color = '#10b981';
            
            // Check Google Sheets connection
            checkSheetsConnection();
        } else {
            throw new Error('Server not responding');
        }
    } catch (error) {
        serverOnline = false;
        document.getElementById('serverStatus').textContent = 'Disconnected';
        document.getElementById('serverStatus').style.color = '#ef4444';
        document.getElementById('sheetStatus').textContent = 'Offline';
        document.getElementById('sheetStatus').style.color = '#ef4444';
    }
}

// Check Google Sheets connection
async function checkSheetsConnection() {
    try {
        const response = await fetch('http://localhost:5000/get_sheet_info');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('sheetStatus').textContent = 'Connected';
            document.getElementById('sheetStatus').style.color = '#10b981';
            currentSheetUrl = data.sheet_url;
            currentSheetId = data.sheet_id;
        } else {
            throw new Error('Sheets not connected');
        }
    } catch (error) {
        document.getElementById('sheetStatus').textContent = 'Disconnected';
        document.getElementById('sheetStatus').style.color = '#ef4444';
    }
}

// Load menu items
function loadMenuItems(category = 'all') {
    const menuItemsDiv = document.getElementById('menuItems');
    menuItemsDiv.innerHTML = '';
    
    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);
    
    if (filteredItems.length === 0) {
        menuItemsDiv.innerHTML = `
            <div class="empty" style="grid-column: 1 / -1;">
                <i class="fas fa-utensils"></i>
                <p>No items found in this category</p>
            </div>
        `;
        return;
    }
    
    filteredItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';
        itemDiv.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'">
            <div class="item-category">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-footer">
                <div class="item-price">$${item.price.toFixed(2)}</div>
                <button class="btn-add" onclick="showQuantityModal(${item.id})">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        menuItemsDiv.appendChild(itemDiv);
    });
}

// Filter menu by category
function filterCategory(category) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Load filtered items
    loadMenuItems(category);
}

// Search menu items
function searchItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const menuItemsDiv = document.getElementById('menuItems');
    
    if (!searchTerm) {
        const activeCategory = document.querySelector('.category-btn.active').textContent;
        if (activeCategory.includes('All')) {
            loadMenuItems('all');
        } else {
            const category = activeCategory.toLowerCase().replace('s', '');
            loadMenuItems(category);
        }
        return;
    }
    
    const filteredItems = menuItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.description.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );
    
    menuItemsDiv.innerHTML = '';
    
    if (filteredItems.length === 0) {
        menuItemsDiv.innerHTML = `
            <div class="empty" style="grid-column: 1 / -1;">
                <i class="fas fa-search"></i>
                <p>No items found for "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    filteredItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';
        itemDiv.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'">
            <div class="item-category">${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-footer">
                <div class="item-price">$${item.price.toFixed(2)}</div>
                <button class="btn-add" onclick="showQuantityModal(${item.id})">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;
        menuItemsDiv.appendChild(itemDiv);
    });
}

// Show quantity modal
function showQuantityModal(itemId) {
    selectedMenuItem = menuItems.find(item => item.id === itemId);
    
    if (!selectedMenuItem) {
        showMessage('Item not found!', 'error');
        return;
    }
    
    // Fill modal with item details
    document.getElementById('modalItemImage').src = selectedMenuItem.image;
    document.getElementById('modalItemImage').alt = selectedMenuItem.name;
    document.getElementById('modalItemName').textContent = selectedMenuItem.name;
    document.getElementById('modalItemDesc').textContent = selectedMenuItem.description;
    document.getElementById('modalItemPrice').textContent = selectedMenuItem.price.toFixed(2);
    
    // Reset inputs
    document.getElementById('quantityInput').value = 1;
    document.getElementById('instructions').value = '';
    
    // Show modal
    document.getElementById('quantityModal').style.display = 'flex';
}

// Change quantity in modal
function changeQuantity(delta) {
    const input = document.getElementById('quantityInput');
    let value = parseInt(input.value) + delta;
    if (value < 1) value = 1;
    if (value > 99) value = 99;
    input.value = value;
}

// Add item to order
function addToOrder() {
    if (!selectedMenuItem) {
        showMessage('No item selected!', 'error');
        return;
    }
    
    const quantity = parseInt(document.getElementById('quantityInput').value);
    const instructions = document.getElementById('instructions').value;
    
    // Check if item already exists in order
    const existingItemIndex = currentOrder.findIndex(item => 
        item.id === selectedMenuItem.id && item.instructions === instructions
    );
    
    if (existingItemIndex > -1) {
        // Update quantity of existing item
        currentOrder[existingItemIndex].quantity += quantity;
        currentOrder[existingItemIndex].total = currentOrder[existingItemIndex].quantity * currentOrder[existingItemIndex].price;
    } else {
        // Add new item
        currentOrder.push({
            ...selectedMenuItem,
            quantity: quantity,
            instructions: instructions,
            total: selectedMenuItem.price * quantity
        });
    }
    
    closeModal();
    updateOrderDisplay();
    showMessage(`${quantity} x ${selectedMenuItem.name} added to order`, 'success');
}

// Update order display
function updateOrderDisplay() {
    const orderItemsDiv = document.getElementById('orderItems');
    
    if (currentOrder.length === 0) {
        orderItemsDiv.innerHTML = `
            <div class="empty-order">
                <i class="fas fa-cart-plus"></i>
                <p>No items in order</p>
                <p class="hint">Add items from the menu on the left</p>
            </div>
        `;
    } else {
        orderItemsDiv.innerHTML = '';
        currentOrder.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'order-item';
            itemDiv.innerHTML = `
                <div class="order-item-name">
                    ${item.name}
                    ${item.instructions ? `<br><small style="color: #666; font-size: 12px;">(${item.instructions})</small>` : ''}
                </div>
                <div class="order-item-quantity">
                    <div class="qty-control">
                        <button class="qty-btn-small" onclick="updateQuantity(${index}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                        <button class="qty-btn-small" onclick="updateQuantity(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="order-item-price">$${item.price.toFixed(2)}</div>
                <div class="order-item-total">$${item.total.toFixed(2)}</div>
                <div class="order-item-action">
                    <button class="remove-item" onclick="removeItem(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            orderItemsDiv.appendChild(itemDiv);
        });
    }
    
    updateTotals();
}

// Update item quantity in order
function updateQuantity(index, delta) {
    if (index < 0 || index >= currentOrder.length) return;
    
    currentOrder[index].quantity += delta;
    
    if (currentOrder[index].quantity < 1) {
        const itemName = currentOrder[index].name;
        currentOrder.splice(index, 1);
        showMessage(`${itemName} removed from order`, 'info');
    } else {
        currentOrder[index].total = currentOrder[index].quantity * currentOrder[index].price;
    }
    
    updateOrderDisplay();
}

// Remove item from order
function removeItem(index) {
    if (index < 0 || index >= currentOrder.length) return;
    
    const itemName = currentOrder[index].name;
    currentOrder.splice(index, 1);
    
    updateOrderDisplay();
    showMessage(`${itemName} removed from order`, 'info');
}

// Update order totals
function updateTotals() {
    const subtotal = currentOrder.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountInput').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * 0.10; // 10% tax
    const total = taxableAmount + tax;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('discountAmount').textContent = `$${discountAmount.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    
    // Update split bill modal if open
    if (document.getElementById('splitBillModal').style.display === 'flex') {
        updateSplitAmount();
    }
}

// Apply discount
function applyDiscount() {
    const discountInput = document.getElementById('discountInput');
    let discount = parseInt(discountInput.value);
    
    if (isNaN(discount) || discount < 0) {
        discount = 0;
        discountInput.value = 0;
    }
    
    if (discount > 100) {
        discount = 100;
        discountInput.value = 100;
    }
    
    updateTotals();
    showMessage(`${discount}% discount applied`, 'success');
}

// Close modal
function closeModal() {
    document.getElementById('quantityModal').style.display = 'none';
    selectedMenuItem = null;
}

// Process payment
async function processPayment(method) {
    if (currentOrder.length === 0) {
        showMessage('Please add items to order first!', 'error');
        return;
    }
    
    if (!serverOnline) {
        showMessage('Server is offline. Cannot process payment.', 'error');
        return;
    }
    
    const tableNumber = document.getElementById('tableNumber').value;
    const customerName = document.getElementById('customerName').value || 'Walk-in';
    const subtotal = currentOrder.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountInput').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * 0.10;
    const total = taxableAmount + tax;
    
    const orderData = {
        order_number: document.getElementById('orderNumber').textContent,
        table_number: tableNumber,
        customer_name: customerName,
        items: currentOrder,
        subtotal: subtotal,
        tax: tax,
        total: total,
        discount: discountAmount,
        payment_method: method,
        notes: '',
        timestamp: new Date().toISOString()
    };
    
    showMessage('Processing payment...', 'info');
    
    try {
        const response = await fetch('http://localhost:5000/save_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update table status if it's a table order
            if (tableNumber <= 8) {
                tablesStatus[tableNumber] = 'occupied';
            }
            
            // Add to recent orders
            recentOrders.unshift({
                ...orderData,
                order_id: result.order_id,
                sheet_url: result.sheet_url
            });
            
            if (recentOrders.length > 10) recentOrders.pop();
            
            // Update stats
            todaySales += total;
            totalOrders++;
            
            // Show success message
            const paymentMethods = {
                'cash': 'Cash',
                'card': 'Card',
                'upi': 'UPI'
            };
            
            showMessage(`Payment successful! ${paymentMethods[method]} payment of $${total.toFixed(2)} processed.`, 'success');
            
            // Save sheet info
            if (result.sheet_url) {
                currentSheetUrl = result.sheet_url;
                currentSheetId = result.sheet_id;
                
                // Show sheet link
                setTimeout(() => {
                    if (confirm('Order saved to Google Sheets! Would you like to view it?')) {
                        openGoogleSheet();
                    }
                }, 500);
            }
            
            // Clear current order and generate new number
            currentOrder = [];
            generateOrderNumber();
            updateOrderDisplay();
            loadRecentOrders();
            updateStats();
            document.getElementById('customerName').value = '';
            document.getElementById('discountInput').value = '0';
            
        } else {
            throw new Error(result.error || 'Payment failed');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(`Payment failed: ${error.message}`, 'error');
    }
}

// Save order without payment
async function saveOrder() {
    if (currentOrder.length === 0) {
        showMessage('Please add items to order first!', 'error');
        return;
    }
    
    if (!serverOnline) {
        showMessage('Server is offline. Cannot save order.', 'error');
        return;
    }
    
    const tableNumber = document.getElementById('tableNumber').value;
    const customerName = document.getElementById('customerName').value || 'Walk-in';
    const subtotal = currentOrder.reduce((sum, item) => sum + item.total, 0);
    const discountPercent = parseFloat(document.getElementById('discountInput').value) || 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * 0.10;
    const total = taxableAmount + tax;
    
    const orderData = {
        order_number: document.getElementById('orderNumber').textContent,
        table_number: tableNumber,
        customer_name: customerName,
        items: currentOrder,
        subtotal: subtotal,
        tax: tax,
        total: total,
        discount: discountAmount,
        payment_method: 'pending',
        notes: 'Saved for later payment',
        timestamp: new Date().toISOString()
    };
    
    showMessage('Saving order...', 'info');
    
    try {
        const response = await fetch('http://localhost:5000/save_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Order saved successfully! You can process payment later.', 'success');
            
            // Add to recent orders
            recentOrders.unshift({
                ...orderData,
                order_id: result.order_id,
                sheet_url: result.sheet_url
            });
            
            if (recentOrders.length > 10) recentOrders.pop();
            
            // Clear current order
            currentOrder = [];
            generateOrderNumber();
            updateOrderDisplay();
            loadRecentOrders();
            document.getElementById('customerName').value = '';
            document.getElementById('discountInput').value = '0';
            
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(`Failed to save order: ${error.message}`, 'error');
    }
}

// Print bill
function printBill() {
    if (currentOrder.length === 0) {
        showMessage('No items to print!', 'error');
        return;
    }
    
    const tableNumber = document.getElementById('tableNumber').value;
    const customerName = document.getElementById('customerName').value || 'Walk-in';
    const orderNumber = document.getElementById('orderNumber').textContent;
    const subtotal = document.getElementById('subtotal').textContent;
    const tax = document.getElementById('tax').textContent;
    const discount = document.getElementById('discountAmount').textContent;
    const total = document.getElementById('total').textContent;
    const now = new Date();
    
    let billContent = `
        <html>
        <head>
            <title>Restaurant Bill - Order ${orderNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .bill-header { text-align: center; margin-bottom: 20px; }
                .bill-header h2 { color: #333; margin: 0; }
                .bill-info { margin-bottom: 20px; }
                .bill-info p { margin: 5px 0; }
                .bill-items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .bill-items th { background: #f5f5f5; padding: 10px; text-align: left; }
                .bill-items td { padding: 8px 10px; border-bottom: 1px solid #ddd; }
                .bill-total { text-align: right; margin-top: 20px; }
                .bill-total p { margin: 5px 0; }
                .bill-footer { text-align: center; margin-top: 30px; color: #666; }
            </style>
        </head>
        <body>
            <div class="bill-header">
                <h2>Restaurant POS System</h2>
                <p>Order Receipt</p>
            </div>
            
            <div class="bill-info">
                <p><strong>Order #:</strong> ${orderNumber}</p>
                <p><strong>Table:</strong> ${tableNumber}</p>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Date:</strong> ${now.toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${now.toLocaleTimeString()}</p>
            </div>
            
            <table class="bill-items">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    currentOrder.forEach(item => {
        billContent += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    billContent += `
                </tbody>
            </table>
            
            <div class="bill-total">
                <p><strong>Subtotal:</strong> ${subtotal}</p>
                <p><strong>Discount:</strong> ${discount}</p>
                <p><strong>Tax (10%):</strong> ${tax}</p>
                <p style="font-size: 18px; font-weight: bold; margin-top: 10px;">Total: ${total}</p>
            </div>
            
            <div class="bill-footer">
                <p>Thank you for your business!</p>
                <p>Generated by Restaurant POS System</p>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(billContent);
    printWindow.document.close();
    printWindow.print();
}

// Clear order
function clearOrder() {
    if (currentOrder.length === 0) {
        showMessage('Order is already empty!', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear the current order? This cannot be undone.')) {
        currentOrder = [];
        document.getElementById('discountInput').value = '0';
        document.getElementById('customerName').value = '';
        updateOrderDisplay();
        showMessage('Order cleared', 'success');
    }
}

// Split bill
function splitBill() {
    if (currentOrder.length === 0) {
        showMessage('No items to split!', 'error');
        return;
    }
    
    const total = parseFloat(document.getElementById('total').textContent.replace('$', ''));
    document.getElementById('splitTotalAmount').textContent = `$${total.toFixed(2)}`;
    document.getElementById('splitBillModal').style.display = 'flex';
    updateSplitAmount();
}

// Update split amount
function updateSplitAmount() {
    const total = parseFloat(document.getElementById('total').textContent.replace('$', ''));
    const splitCount = parseInt(document.getElementById('splitCount').value);
    const splitAmount = total / splitCount;
    
    document.getElementById('splitAmount').textContent = `$${splitAmount.toFixed(2)}`;
}

// Confirm split
function confirmSplit() {
    const total = parseFloat(document.getElementById('total').textContent.replace('$', ''));
    const splitCount = parseInt(document.getElementById('splitCount').value);
    const splitAmount = total / splitCount;
    
    showMessage(`Bill split into ${splitCount} parts. Each person pays: $${splitAmount.toFixed(2)}`, 'success');
    closeSplitModal();
}

// Close split modal
function closeSplitModal() {
    document.getElementById('splitBillModal').style.display = 'none';
}

// Generate order number
function generateOrderNumber() {
    const orderNum = orderCounter.toString().padStart(3, '0');
    document.getElementById('orderNumber').textContent = orderNum;
    orderCounter++;
    
    // Save to localStorage to persist across page reloads
    if (localStorage.getItem('orderCounter')) {
        orderCounter = parseInt(localStorage.getItem('orderCounter')) + 1;
    }
    localStorage.setItem('orderCounter', orderCounter.toString());
}

// Load recent orders
async function loadRecentOrders() {
    if (!serverOnline) {
        // Show local recent orders
        displayRecentOrders();
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/get_recent_orders');
        const data = await response.json();
        
        if (data.success && data.orders) {
            recentOrders = data.orders.slice(0, 10);
            displayRecentOrders();
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
        displayRecentOrders(); // Show local orders as fallback
    }
}

// Display recent orders
function displayRecentOrders() {
    const recentOrdersList = document.getElementById('recentOrdersList');
    
    if (recentOrders.length === 0) {
        recentOrdersList.innerHTML = `
            <div class="empty">
                <i class="fas fa-receipt"></i>
                <p>No recent orders</p>
            </div>
        `;
        return;
    }
    
    recentOrdersList.innerHTML = '';
    
    recentOrders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'recent-order-item';
        
        const itemsText = order.items 
            ? order.items.map(item => `${item.name} x${item.quantity}`).join(', ')
            : 'No items listed';
        
        const time = order.timestamp ? new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
        
        orderDiv.innerHTML = `
            <div class="recent-order-header">
                <span>Order #${order.order_number || 'N/A'}</span>
                <span>${time}</span>
            </div>
            <div class="recent-order-items">${itemsText}</div>
            <div class="recent-order-footer">
                <span class="recent-order-total">$${order.total ? order.total.toFixed(2) : '0.00'}</span>
                <span class="recent-order-payment">${order.payment_method ? order.payment_method.toUpperCase() : 'Pending'}</span>
            </div>
        `;
        
        recentOrdersList.appendChild(orderDiv);
    });
}

// Load sales stats
async function loadSalesStats() {
    if (!serverOnline) {
        updateStats();
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/get_sales_stats');
        const data = await response.json();
        
        if (data.success) {
            todaySales = data.today_sales || 0;
            totalOrders = data.total_orders || 0;
            updateStats();
        }
    } catch (error) {
        console.error('Error loading sales stats:', error);
        updateStats();
    }
}

// Update stats display
function updateStats() {
    document.getElementById('todaySales').textContent = `$${todaySales.toFixed(2)}`;
    document.getElementById('totalOrders').textContent = totalOrders;
    
    // Save to localStorage
    const today = new Date().toDateString();
    if (localStorage.getItem('lastSalesDate') === today) {
        todaySales = parseFloat(localStorage.getItem('todaySales')) || 0;
        totalOrders = parseInt(localStorage.getItem('totalOrders')) || 0;
    } else {
        // New day, reset stats
        localStorage.setItem('lastSalesDate', today);
        todaySales = 0;
        totalOrders = 0;
    }
    
    localStorage.setItem('todaySales', todaySales.toString());
    localStorage.setItem('totalOrders', totalOrders.toString());
}

// Open table management modal
function openTableManagement() {
    const tablesGrid = document.getElementById('tablesGrid');
    tablesGrid.innerHTML = '';
    
    // Create table items
    for (let i = 1; i <= 8; i++) {
        const tableDiv = document.createElement('div');
        tableDiv.className = `table-item ${tablesStatus[i]}`;
        tableDiv.innerHTML = `
            <h4>Table ${i}</h4>
            <p>${tablesStatus[i].charAt(0).toUpperCase() + tablesStatus[i].slice(1)}</p>
        `;
        
        tableDiv.onclick = function() {
            selectTable(i);
        };
        
        tablesGrid.appendChild(tableDiv);
    }
    
    // Add takeaway and delivery
    const takeawayDiv = document.createElement('div');
    takeawayDiv.className = 'table-item available';
    takeawayDiv.innerHTML = `
        <h4>Takeaway</h4>
        <p>Available</p>
    `;
    takeawayDiv.onclick = function() {
        selectTable(9);
    };
    tablesGrid.appendChild(takeawayDiv);
    
    const deliveryDiv = document.createElement('div');
    deliveryDiv.className = 'table-item available';
    deliveryDiv.innerHTML = `
        <h4>Delivery</h4>
        <p>Available</p>
    `;
    deliveryDiv.onclick = function() {
        selectTable(10);
    };
    tablesGrid.appendChild(deliveryDiv);
    
    document.getElementById('tableModal').style.display = 'flex';
}

// Select table from modal
function selectTable(tableNumber) {
    document.getElementById('tableNumber').value = tableNumber;
    
    // Update table status in modal
    if (tableNumber <= 8) {
        tablesStatus[tableNumber] = 'occupied';
    }
    
    closeTableModal();
    showMessage(`Table ${tableNumber} selected`, 'success');
}

// Close table modal
function closeTableModal() {
    document.getElementById('tableModal').style.display = 'none';
}

// Show sheet info
async function showSheetInfo() {
    if (!serverOnline) {
        showMessage('Server is offline. Cannot show sheet info.', 'error');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/get_sheet_info');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('sheetUrl').textContent = data.sheet_url || 'Not available';
            document.getElementById('totalOrdersCount').textContent = data.orders_count || 0;
            document.getElementById('sheetConnectionStatus').textContent = 'Connected';
            document.getElementById('sheetConnectionStatus').style.color = '#10b981';
            
            currentSheetUrl = data.sheet_url;
            currentSheetId = data.sheet_id;
        } else {
            document.getElementById('sheetUrl').textContent = 'Not connected';
            document.getElementById('totalOrdersCount').textContent = '0';
            document.getElementById('sheetConnectionStatus').textContent = 'Disconnected';
            document.getElementById('sheetConnectionStatus').style.color = '#ef4444';
        }
    } catch (error) {
        document.getElementById('sheetUrl').textContent = 'Error loading info';
        document.getElementById('totalOrdersCount').textContent = '0';
        document.getElementById('sheetConnectionStatus').textContent = 'Error';
        document.getElementById('sheetConnectionStatus').style.color = '#ef4444';
    }
    
    document.getElementById('sheetModal').style.display = 'flex';
}

// Open Google Sheet
function openGoogleSheet() {
    if (currentSheetUrl) {
        window.open(currentSheetUrl, '_blank');
    } else {
        showMessage('No Google Sheet URL available', 'error');
    }
    closeSheetModal();
}

// Close sheet modal
function closeSheetModal() {
    document.getElementById('sheetModal').style.display = 'none';
}

// Show message
function showMessage(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');
    
    // Remove existing classes
    statusMessage.className = 'status-message';
    
    // Add type-specific class
    switch(type) {
        case 'success':
            statusMessage.style.borderLeftColor = '#10b981';
            statusMessage.style.background = '#d1fae5';
            break;
        case 'error':
            statusMessage.style.borderLeftColor = '#ef4444';
            statusMessage.style.background = '#fee2e2';
            break;
        case 'warning':
            statusMessage.style.borderLeftColor = '#f59e0b';
            statusMessage.style.background = '#fef3c7';
            break;
        default:
            statusMessage.style.borderLeftColor = '#667eea';
            statusMessage.style.background = '#e0e7ff';
    }
    
    statusMessage.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (statusMessage.textContent === message) {
            statusMessage.textContent = 'Ready to take orders';
            statusMessage.style.borderLeftColor = '#667eea';
            statusMessage.style.background = '#e0e7ff';
        }
    }, 5000);
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // In a real app, you would clear session and redirect
        showMessage('Logged out successfully!', 'success');
        setTimeout(() => {
            alert('In a real application, this would redirect to login page.');
        }, 1000);
    }
}

// Export order data (for debugging)
function exportOrderData() {
    const orderData = {
        currentOrder: currentOrder,
        recentOrders: recentOrders,
        todaySales: todaySales,
        totalOrders: totalOrders
    };
    
    const dataStr = JSON.stringify(orderData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `restaurant-pos-data-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Initialize from localStorage on page load
function initializeFromStorage() {
    const savedOrderCounter = localStorage.getItem('orderCounter');
    if (savedOrderCounter) {
        orderCounter = parseInt(savedOrderCounter);
    }
    
    const savedTodaySales = localStorage.getItem('todaySales');
    if (savedTodaySales) {
        todaySales = parseFloat(savedTodaySales);
    }
    
    const savedTotalOrders = localStorage.getItem('totalOrders');
    if (savedTotalOrders) {
        totalOrders = parseInt(savedTotalOrders);
    }
    
    const savedRecentOrders = localStorage.getItem('recentOrders');
    if (savedRecentOrders) {
        try {
            recentOrders = JSON.parse(savedRecentOrders);
        } catch (e) {
            console.error('Error parsing saved recent orders:', e);
        }
    }
}

// Save to localStorage
function saveToStorage() {
    localStorage.setItem('orderCounter', orderCounter.toString());
    localStorage.setItem('todaySales', todaySales.toString());
    localStorage.setItem('totalOrders', totalOrders.toString());
    localStorage.setItem('recentOrders', JSON.stringify(recentOrders.slice(0, 10)));
}

// Auto-save every minute
setInterval(saveToStorage, 60000);

// Initialize from storage when page loads
initializeFromStorage();