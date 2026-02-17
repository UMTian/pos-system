from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)

# Google Sheets configuration
SCOPES = [
    'https://spreadsheets.google.com/feeds',
    'https://www.googleapis.com/auth/drive'
]

# Your Google Sheet ID - Replace with your own or use this test one
SHEET_ID = '1XcSX_m5e8e9yq8QfO9vbV5pd93I8NTaM52hZF17COM4'  # Change this to your own

# Initialize Google Sheets
def init_google_sheets():
    try:
        print("Initializing Google Sheets...")
        
        # Check if credentials file exists
        if not os.path.exists('credentials.json'):
            print("ERROR: credentials.json file not found!")
            print("Please place your credentials.json file in the backend folder")
            print("Using local storage mode instead...")
            return setup_local_storage()
        
        # Load from credentials.json file
        print("Loading credentials from credentials.json...")
        creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', SCOPES)
        
        # Authorize client
        print("Authorizing with Google Sheets API...")
        client = gspread.authorize(creds)
        print("Authorization successful!")
        
        # Try to open existing spreadsheet by ID
        try:
            print(f"Opening spreadsheet by ID: {SHEET_ID}")
            spreadsheet = client.open_by_key(SHEET_ID)
            print(f"Successfully opened spreadsheet: {spreadsheet.title}")
        except Exception as e:
            print(f"Error opening spreadsheet by ID: {str(e)}")
            print("\nTrying to create new spreadsheet...")
            try:
                spreadsheet = client.create('Restaurant_POS_System')
                spreadsheet.share('', perm_type='anyone', role='writer')
                print(f"Created new Google Sheet with ID: {spreadsheet.id}")
            except Exception as create_error:
                print(f"Failed to create spreadsheet: {str(create_error)}")
                print("Using local storage mode instead...")
                return setup_local_storage()
        
        # Create worksheets if they don't exist
        worksheet_names = ['Orders', 'Order_Items']
        worksheets = {}
        
        for name in worksheet_names:
            try:
                worksheet = spreadsheet.worksheet(name)
                print(f"Found existing worksheet: {name}")
                worksheets[name] = worksheet
            except:
                print(f"Creating new worksheet: {name}")
                worksheet = spreadsheet.add_worksheet(title=name, rows=1000, cols=20)
                worksheets[name] = worksheet
                
                # Add headers
                if name == 'Orders':
                    headers = [
                        'Order_ID', 'Order_Number', 'Table_Number', 'Customer_Name',
                        'Subtotal', 'Tax', 'Total', 'Payment_Method', 'Timestamp'
                    ]
                    worksheet.append_row(headers)
                    print("Added headers to Orders sheet")
                elif name == 'Order_Items':
                    headers = [
                        'Order_ID', 'Item_Name', 'Quantity', 'Price', 'Total'
                    ]
                    worksheet.append_row(headers)
                    print("Added headers to Order_Items sheet")
        
        print("Google Sheets initialization completed successfully!")
        return {
            'client': client,
            'spreadsheet': spreadsheet,
            'worksheets': worksheets,
            'mode': 'google_sheets'
        }
        
    except Exception as e:
        print(f"ERROR initializing Google Sheets: {str(e)}")
        print("Using local storage mode instead...")
        return setup_local_storage()

# Local storage for testing (when Google Sheets is not available)
def setup_local_storage():
    print("Setting up local storage mode...")
    
    class MockSpreadsheet:
        def __init__(self):
            self.id = "LOCAL_STORAGE_MODE"
            self.title = "Local Storage"
    
    class MockWorksheet:
        def __init__(self, name):
            self.name = name
            self.data = []
            if name == 'Orders':
                self.headers = ['Order_ID', 'Order_Number', 'Table_Number', 'Customer_Name', 'Subtotal', 'Tax', 'Total', 'Payment_Method', 'Timestamp']
            else:
                self.headers = ['Order_ID', 'Item_Name', 'Quantity', 'Price', 'Total']
            self.data.append(self.headers)
        
        def append_row(self, row):
            print(f"Local Storage: Saving to {self.name}: {row}")
            self.data.append(row)
            return True
        
        def get_all_records(self):
            if len(self.data) <= 1:
                return []
            # Convert to list of dictionaries
            records = []
            for i in range(1, len(self.data)):
                record = {}
                for j in range(len(self.headers)):
                    record[self.headers[j]] = self.data[i][j]
                records.append(record)
            return records
    
    orders_sheet = MockWorksheet('Orders')
    items_sheet = MockWorksheet('Order_Items')
    
    return {
        'client': None,
        'spreadsheet': MockSpreadsheet(),
        'worksheets': {
            'Orders': orders_sheet,
            'Order_Items': items_sheet
        },
        'mode': 'local_storage'
    }

# Root route
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'Welcome to Restaurant POS System API',
        'status': 'running',
        'endpoints': {
            'test': '/test (GET)',
            'save_order': '/save_order (POST)',
            'get_recent_orders': '/get_recent_orders (GET)',
            'get_sales_stats': '/get_sales_stats (GET)',
            'get_sheet_info': '/get_sheet_info (GET)'
        },
        'instructions': 'Access frontend at http://localhost:8000'
    })

# Test endpoint
@app.route('/test', methods=['GET'])
def test():
    sheets = init_google_sheets()
    mode = sheets['mode'] if sheets else 'error'
    
    return jsonify({
        'message': 'Restaurant POS API is running!',
        'status': 'active',
        'timestamp': datetime.now().isoformat(),
        'storage_mode': mode,
        'instructions': 'The system is working in ' + mode + ' mode'
    })

# Save order
@app.route('/save_order', methods=['POST'])
def save_order():
    try:
        data = request.json
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        print(f"Saving order #{data.get('order_number')} for table {data.get('table_number')}")
        
        # Initialize storage
        sheets = init_google_sheets()
        if not sheets:
            return jsonify({'success': False, 'error': 'Failed to initialize storage'}), 500
        
        orders_sheet = sheets['worksheets']['Orders']
        order_items_sheet = sheets['worksheets']['Order_Items']
        
        # Get next Order ID
        try:
            all_orders = orders_sheet.get_all_records()
            order_id = len(all_orders) + 1
        except:
            order_id = 1
        
        # Get current timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Prepare order data
        order_data = [
            order_id,
            data.get('order_number', ''),
            data.get('table_number', ''),
            data.get('customer_name', 'Walk-in'),
            data.get('subtotal', 0),
            data.get('tax', 0),
            data.get('total', 0),
            data.get('payment_method', 'pending'),
            timestamp
        ]
        
        # Add order to sheet
        orders_sheet.append_row(order_data)
        print(f"Order #{order_id} saved successfully")
        
        # Add order items
        items = data.get('items', [])
        for item in items:
            item_data = [
                order_id,
                item.get('name', ''),
                item.get('quantity', 0),
                item.get('price', 0),
                item.get('total', 0)
            ]
            order_items_sheet.append_row(item_data)
        
        # Get spreadsheet URL if in Google Sheets mode
        sheet_url = None
        if sheets['mode'] == 'google_sheets':
            sheet_url = f"https://docs.google.com/spreadsheets/d/{sheets['spreadsheet'].id}"
            print(f"Google Sheet URL: {sheet_url}")
        else:
            sheet_url = "Local storage mode - data saved locally"
        
        return jsonify({
            'success': True,
            'message': 'Order saved successfully',
            'order_id': order_id,
            'sheet_url': sheet_url,
            'storage_mode': sheets['mode']
        })
        
    except Exception as e:
        print(f"ERROR saving order: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Get recent orders
@app.route('/get_recent_orders', methods=['GET'])
def get_recent_orders():
    try:
        sheets = init_google_sheets()
        if not sheets:
            return jsonify({'success': False, 'error': 'Failed to initialize storage'}), 500
        
        orders_sheet = sheets['worksheets']['Orders']
        
        try:
            all_orders = orders_sheet.get_all_records()
            # Get last 10 orders, most recent first
            recent_orders = all_orders[-10:][::-1] if len(all_orders) > 0 else []
            
            return jsonify({
                'success': True,
                'orders': recent_orders,
                'count': len(recent_orders)
            })
        except Exception as e:
            print(f"Error getting recent orders: {str(e)}")
            return jsonify({'success': True, 'orders': [], 'count': 0})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Get sales statistics
@app.route('/get_sales_stats', methods=['GET'])
def get_sales_stats():
    try:
        sheets = init_google_sheets()
        if not sheets:
            return jsonify({'success': False, 'error': 'Failed to initialize storage'}), 500
        
        orders_sheet = sheets['worksheets']['Orders']
        
        try:
            all_orders = orders_sheet.get_all_records()
        except:
            all_orders = []
        
        # Calculate today's sales
        today = datetime.now().strftime('%Y-%m-%d')
        today_sales = 0
        today_orders = 0
        
        for order in all_orders:
            order_date = str(order.get('Timestamp', '')).split(' ')[0]
            if order_date == today:
                total = order.get('Total', 0)
                if isinstance(total, str):
                    total = float(total.replace('$', '').replace(',', '')) if total else 0
                today_sales += float(total)
                today_orders += 1
        
        return jsonify({
            'success': True,
            'today_sales': today_sales,
            'total_orders': today_orders,
            'average_order': today_sales / today_orders if today_orders > 0 else 0,
            'storage_mode': sheets['mode']
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Get sheet info
@app.route('/get_sheet_info', methods=['GET'])
def get_sheet_info():
    try:
        sheets = init_google_sheets()
        if not sheets:
            return jsonify({'success': False, 'error': 'Failed to initialize storage'}), 500
        
        orders_sheet = sheets['worksheets']['Orders']
        
        try:
            all_orders = orders_sheet.get_all_records()
            orders_count = len(all_orders)
        except:
            orders_count = 0
        
        mode = sheets['mode']
        
        if mode == 'google_sheets':
            sheet_url = f"https://docs.google.com/spreadsheets/d/{sheets['spreadsheet'].id}"
            sheet_id = sheets['spreadsheet'].id
            message = 'Connected to Google Sheets'
        else:
            sheet_url = 'Local storage mode'
            sheet_id = 'N/A'
            message = 'Using local storage (Google Sheets not available)'
        
        return jsonify({
            'success': True,
            'sheet_url': sheet_url,
            'sheet_id': sheet_id,
            'orders_count': orders_count,
            'storage_mode': mode,
            'message': message
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("RESTAURANT POS SYSTEM - BACKEND SERVER")
    print("=" * 60)
    
    # Check for credentials file
    if os.path.exists('credentials.json'):
        print("✓ Found credentials.json file")
    else:
        print("⚠ credentials.json file not found")
        print("  The system will run in LOCAL STORAGE mode")
        print("  To use Google Sheets, download credentials.json from Google Cloud Console")
    
    print(f"\nServer will start on:")
    print(f"  • http://localhost:5000")
    print(f"  • http://127.0.0.1:5000")
    
    print(f"\nFrontend should be accessed at:")
    print(f"  • http://localhost:8000")
    
    print(f"\nAPI Endpoints:")
    print(f"  • GET  /                 - API information")
    print(f"  • GET  /test             - Test server status")
    print(f"  • POST /save_order       - Save order")
    print(f"  • GET  /get_recent_orders - Get recent orders")
    print(f"  • GET  /get_sales_stats  - Get sales statistics")
    print(f"  • GET  /get_sheet_info   - Get storage info")
    
    print(f"\n" + "=" * 60)
    print(f"Starting server...")
    print(f"=" * 60)
    
    app.run(debug=True, port=5000, host='0.0.0.0')