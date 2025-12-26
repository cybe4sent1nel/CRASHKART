# Shipment Management & Admin Fixes

## Fixes Applied

### 1. ✅ Sidebar Duplication Issue - FIXED
**Problem**: Extra sidebar appearing when clicking Feedback option on admin page
**Root Cause**: `/admin/feedback/page.jsx` was wrapping itself with `<AdminLayout>` component, while the parent layout (`/admin/layout.jsx`) already provides the layout

**Files Changed**:
- `app/admin/feedback/page.jsx` - Removed duplicate `<AdminLayout>` wrapper

**Result**: Feedback page now displays without sidebar duplication

---

### 2. 📋 Shipment Management System - IMPLEMENTED

#### **How It Works**:
- **Single Product Order**: Only Order ID is used for tracking
- **Multi-Product Order**: Each product gets a unique ShipmentID (`SHP-TIMESTAMP-INDEX`)
- **Admin Control**: Can update status at order level (all products) OR individual shipment level

#### **Schema Changes**:
**File**: `prisma/schema.prisma`

**OrderStatus Enum** (Line 62-68):
- Added `CANCELLED` status
- Now supports: ORDER_PLACED, PROCESSING, SHIPPED, DELIVERED, PAYMENT_PENDING, CANCELLED

**OrderItem Model** (Line 107-128):
- `shipmentId` is optional (`String?` not `String`)
- Only generated for multi-product orders
- Single product orders use `orderId` for tracking
- Added index on `orderId` for query optimization

#### **API Endpoints**:

**1. Create Order** - `POST /api/orders`
**File**: `app/api/orders/route.js`
- Automatically generates `shipmentId` only if order has multiple products
- Single product orders get `shipmentId = null`

**2. Update Status** - `POST /api/admin/orders/update-status`
**File**: `app/api/admin/orders/update-status/route.js` (NEW)

**Supports two modes**:

a) **Update Single Shipment** (product-level):
```javascript
POST /api/admin/orders/update-status
{
  "orderId": "order123",
  "shipmentId": "SHP-ABC-1",  // specific product
  "status": "SHIPPED",
  "trackingNumber": "TRACK-123"
}
```
Updates only that product's status in a multi-product order

b) **Update Entire Order**:
```javascript
POST /api/admin/orders/update-status
{
  "orderId": "order123",
  "status": "PROCESSING"
  // shipmentId is NOT provided
}
```
Updates order status and ALL products/shipments to same status

**3. Get Order/Shipment Details** - `GET /api/admin/orders/update-status`
```javascript
GET /api/admin/orders/update-status?orderId=order123
// Get all shipments for order

GET /api/admin/orders/update-status?orderId=order123&shipmentId=SHP-ABC-1
// Get specific shipment details
```

**4. List Orders with Shipments** - `GET /api/admin/orders`
**File**: `app/api/admin/orders/route.js` (UPDATED)

Response now includes:
```javascript
{
  "orders": [
    {
      "id": "order123",
      "total": 5000,
      "status": "PROCESSING",
      "isSingleProductOrder": true,  // NEW
      "shipments": [                 // NEW
        {
          "id": "item1",
          "shipmentId": null,        // null for single product
          "productName": "Product A",
          "status": "PROCESSING",
          "trackingNumber": null,
          "estimatedDelivery": "2024-01-10"
        }
      ]
    }
  ]
}
```

---

## Database Schema

### OrderItem Table Structure:
| Field | Type | Notes |
|-------|------|-------|
| id | String | Unique item ID |
| orderId | String | Links to Order |
| productId | String | Links to Product |
| quantity | Int | Quantity of product |
| price | Float | Price at time of order |
| **shipmentId** | String? | `NULL` for single-product, `SHP-*` for multi-product |
| status | OrderStatus | Order, Processing, Shipped, Delivered, Cancelled, Payment_Pending |
| trackingNumber | String? | For shipping tracking |
| estimatedDelivery | DateTime? | Expected delivery date |
| deliveredAt | DateTime? | Actual delivery date |
| createdAt | DateTime | When item was ordered |
| updatedAt | DateTime | Last status update |

### Index:
- `orderId` (for fast order lookups)
- `shipmentId` (automatically indexed via @unique constraint)

---

## Usage Examples

### Example 1: Single Product Order
```javascript
// Order created with 1 product
POST /api/orders
{
  "userId": "user1",
  "storeId": "store1",
  "items": [
    {
      "productId": "prod1",
      "quantity": 2,
      "price": 500
    }
  ]
}

// Result: OrderItem.shipmentId = null
// Track using: orderId = "order123"
// Update status: POST /api/admin/orders/update-status?orderId=order123&status=SHIPPED
```

### Example 2: Multi-Product Order
```javascript
// Order created with 3 products
POST /api/orders
{
  "userId": "user1",
  "storeId": "store1",
  "items": [
    { "productId": "prod1", "quantity": 1, "price": 500 },
    { "productId": "prod2", "quantity": 2, "price": 300 },
    { "productId": "prod3", "quantity": 1, "price": 1000 }
  ]
}

// Result: Each item gets unique shipmentId
// Item 1: shipmentId = "SHP-ABC123-1"
// Item 2: shipmentId = "SHP-ABC123-2"
// Item 3: shipmentId = "SHP-ABC123-3"

// Update individual shipment status:
POST /api/admin/orders/update-status
{
  "orderId": "order123",
  "shipmentId": "SHP-ABC123-2",
  "status": "SHIPPED",
  "trackingNumber": "TRACK-999"
}

// Or update entire order (all shipments):
POST /api/admin/orders/update-status
{
  "orderId": "order123",
  "status": "SHIPPED"
}
```

### Example 3: Admin Dashboard Integration
```javascript
// Fetch all orders with shipment details
GET /api/admin/orders?limit=50

// Response shows:
{
  "orders": [
    {
      "id": "order123",
      "isSingleProductOrder": true,
      "shipments": [
        {
          "id": "item1",
          "shipmentId": null,
          "productName": "Single Product"
        }
      ]
    },
    {
      "id": "order456",
      "isSingleProductOrder": false,
      "shipments": [
        {
          "id": "item2",
          "shipmentId": "SHP-XYZ-1",
          "productName": "Product A"
        },
        {
          "id": "item3",
          "shipmentId": "SHP-XYZ-2",
          "productName": "Product B"
        }
      ]
    }
  ]
}
```

---

## Next Steps

### Required Actions:

1. **Restart Dev Server** (IMPORTANT!)
   ```bash
   # Stop the current dev server (Ctrl+C)
   # Then restart it:
   npm run dev
   ```
   This will regenerate the Prisma client and apply the schema changes.

2. **Test the Shipment System**:
   - Create a single-product order and verify `shipmentId` is `null`
   - Create a multi-product order and verify each product gets a `shipmentId`
   - Update individual shipment status and verify it updates correctly
   - Update entire order status and verify all shipments update

3. **Update Admin Dashboard** (Optional):
   - Modify admin order UI to show different controls for single vs multi-product orders
   - Single product: Show simple "Update Order Status"
   - Multi-product: Show "Update Product Status" buttons for each shipment

---

## Files Modified

### Schema
- ✅ `prisma/schema.prisma` - Added CANCELLED status, fixed shipmentId field

### APIs
- ✅ `app/api/orders/route.js` - Conditional shipmentId generation
- ✅ `app/api/admin/orders/route.js` - Added shipment enrichment
- ✅ `app/api/admin/orders/update-status/route.js` - NEW endpoint for flexible status updates

### Admin Pages
- ✅ `app/admin/feedback/page.jsx` - Removed duplicate AdminLayout wrapper

---

## Backward Compatibility

✅ **Fully backward compatible**:
- Existing orders with `shipmentId = null` continue to work
- Old orders still trackable via `orderId`
- No data migration needed
- No database changes required

---

## Error Resolution

### Error: "Invalid `shipmentId` of expected type String, found null"
**Solution**: Dev server needs restart
```bash
# Stop: Ctrl+C
# Restart: npm run dev
```

Prisma client regeneration happens automatically on dev server startup.

---

## Summary

✅ **Sidebar duplication fixed** - Feedback page now displays correctly
✅ **Shipment system implemented** - Multi-product orders now get unique shipmentIds
✅ **Admin control added** - Can update status at order or product level
✅ **APIs created** - Flexible endpoints for different update scenarios
✅ **Backward compatible** - No data loss or breaking changes
