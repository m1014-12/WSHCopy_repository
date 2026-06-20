# Hierarchical Category Management System

## Overview

The system now supports **two-level hierarchical categories** where:
- **Parent Categories**: Main categories (e.g., "Electronics", "Appliances")
- **Subcategories**: Specific types under parents (e.g., "Mobile Phones", "Laptops" under "Electronics")

## Structure Example

```
Warranty
├── Electronics (Parent)
│   ├── Mobile Phones (Subcategory)
│   ├── Laptops & Computers
│   ├── Smart Devices
│   ├── Cameras
│   └── Audio Equipment
├── Appliances (Parent)
│   ├── Kitchen Appliances
│   ├── Refrigerators
│   ├── Washing Machines
│   └── Air Conditioners
└── Furniture (Parent)
    ├── Living Room
    ├── Bedroom
    ├── Office Furniture
    └── Outdoor Furniture
```

## Database Schema

### Updated Category Model

```javascript
{
  _id: ObjectId,
  name: String,              // "Electronics" or "Mobile Phones"
  category: String,          // "warranty" | "subscription" | "homeTask"
  parentId: ObjectId | null, // null = parent category, ObjectId = subcategory
  description: String,       // Optional description
  isActive: Boolean,         // Soft delete flag
  createdBy: ObjectId,       // Admin who created it
  createdAt: Date,
  updatedAt: Date
}
```

**Key Field**: `parentId`
- `null` → This is a **parent category**
- `ObjectId` → This is a **subcategory** under that parent

## Setup Instructions

### Step 1: Seed the Database

Run the hierarchical seed script:

```bash
cd server
node seedHierarchicalCategories.js
```

This creates:
- **Warranty**: 4 parent categories with 18 subcategories
- **Subscription**: 4 parent categories with 13 subcategories  
- **Home Tasks**: 5 parent categories with 16 subcategories

**Total**: 13 parent categories + 47 subcategories

### Step 2: Start the Application

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd clint/my-wsh
npm start
```

## Admin Interface

### Adding a Category

The admin form now has three fields:

1. **Category Name** (e.g., "Electronics")
2. **Category Type** (Warranty/Subscription/Home Task)
3. **Parent Category** (Optional dropdown)
   - Leave empty → Creates a **parent category**
   - Select a parent → Creates a **subcategory**

### Example Flow

#### Creating a Parent Category:
```
Name: Electronics
Type: Warranty
Parent: None (Root Category)
Description: Electronic devices and gadgets
```

#### Creating a Subcategory:
```
Name: Mobile Phones
Type: Warranty
Parent: Electronics  ← Select from dropdown
Description: Smartphones and feature phones
```

### Category Display

Categories are shown with visual hierarchy:
- **Parent**: `Electronics`
- **Subcategory**: `↳ Mobile Phones → Electronics`

### Deleting Categories

- **Delete Parent**: Also deletes all its subcategories (soft delete)
- **Delete Subcategory**: Only deletes that subcategory

## User Interface

### How Users See Categories

In warranty/subscription/home task forms, categories appear as **grouped dropdowns**:

```
Select Category:
[Electronics]
  Electronics
  ↳ Mobile Phones
  ↳ Laptops & Computers
  ↳ Smart Devices
  ↳ Cameras
  ↳ Audio Equipment
[Appliances]
  Appliances
  ↳ Kitchen Appliances
  ↳ Refrigerators
  ...
```

Users can select either:
- The parent category (e.g., "Electronics")
- A specific subcategory (e.g., "Mobile Phones")

## API Endpoints

### Admin Endpoints

#### 1. Get All Categories (Hierarchical)
```http
GET /admin/categories
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "...",
      "name": "Electronics",
      "category": "warranty",
      "parentId": null,
      "parentName": null,
      "description": "...",
      "createdBy": "admin",
      "createdAt": "..."
    },
    {
      "id": "...",
      "name": "Mobile Phones",
      "category": "warranty",
      "parentId": "electronics_id",
      "parentName": "Electronics",
      "description": "...",
      "createdBy": "admin",
      "createdAt": "..."
    }
  ]
}
```

#### 2. Get Parent Categories Only
```http
GET /admin/parent-categories/{categoryType}
Authorization: Bearer {adminToken}
```

**Response:**
```json
{
  "success": true,
  "categories": [
    { "id": "...", "name": "Electronics" },
    { "id": "...", "name": "Appliances" },
    { "id": "...", "name": "Furniture" }
  ]
}
```

#### 3. Create Category/Subcategory
```http
POST /admin/categories
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "Mobile Phones",
  "category": "warranty",
  "parentId": "electronics_id",  // Optional - omit for parent category
  "description": "Smartphones and feature phones"
}
```

#### 4. Update Category
```http
PUT /admin/categories/{id}
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "name": "Updated Name",
  "parentId": "new_parent_id"  // Can change parent
}
```

#### 5. Delete Category
```http
DELETE /admin/categories/{id}
Authorization: Bearer {adminToken}
```

### User Endpoints

#### Get Categories with Hierarchy
```http
GET /categories/{categoryType}
```

Where `categoryType` is: `warranty`, `subscription`, or `homeTask`

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "electronics_id",
      "name": "Electronics",
      "category": "warranty",
      "description": "...",
      "subcategories": [
        {
          "id": "...",
          "name": "Mobile Phones",
          "category": "warranty",
          "parentId": "electronics_id",
          "parentName": "Electronics"
        },
        {
          "id": "...",
          "name": "Laptops & Computers",
          "category": "warranty",
          "parentId": "electronics_id",
          "parentName": "Electronics"
        }
      ]
    }
  ]
}
```

## Predefined Categories

### Warranty Categories

1. **Electronics**
   - Mobile Phones
   - Laptops & Computers
   - Smart Devices
   - Cameras
   - Audio Equipment

2. **Appliances**
   - Kitchen Appliances
   - Refrigerators
   - Washing Machines
   - Air Conditioners
   - Small Appliances

3. **Furniture**
   - Living Room
   - Bedroom
   - Office Furniture
   - Outdoor Furniture

4. **Vehicles**
   - Cars
   - Motorcycles
   - Bicycles

### Subscription Categories

1. **Entertainment**
   - Video Streaming
   - Music Streaming
   - Gaming
   - News & Magazines

2. **Productivity**
   - Office Software
   - Cloud Storage
   - Design Tools
   - Project Management

3. **Education**
   - Online Courses
   - Language Learning
   - Skill Development

4. **Health & Fitness**
   - Fitness Apps
   - Nutrition
   - Mental Health

### Home Task Categories

1. **Electrical**
   - Lighting
   - Wiring
   - Outlets & Switches

2. **Plumbing**
   - Pipes & Drains
   - Faucets & Fixtures
   - Water Heaters

3. **HVAC**
   - Air Conditioning
   - Heating Systems
   - Ventilation

4. **Appliance Maintenance**
   - Refrigerator
   - Washing Machine
   - Dishwasher
   - Stove & Oven

5. **Home Exterior**
   - Landscaping
   - Roof Maintenance
   - Gutters
   - Painting

## Features

### ✅ Two-Level Hierarchy
- Parent categories with unlimited subcategories
- Clear visual distinction in UI

### ✅ Flexible Management
- Admins can create both parents and subcategories
- Easy to reorganize by changing parent

### ✅ Smart Validation
- Prevents duplicate names within same parent
- Ensures parent is in same category type
- Validates parent is a root category (not a subcategory of subcategory)

### ✅ Cascade Operations
- Deleting parent soft-deletes all subcategories
- Maintains data integrity

### ✅ User-Friendly Display
- Grouped dropdowns with visual hierarchy
- `optgroup` HTML elements for better UX
- Arrow indicators (`↳`) for subcategories

## Benefits

### For Admins
1. **Organized Structure**: Logical grouping of related categories
2. **Easy to Expand**: Add new subcategories under existing parents
3. **Better Control**: Manage broad and specific categories

### For Users
1. **Clear Options**: Categories grouped by type
2. **Flexibility**: Choose broad or specific categories
3. **Better Organization**: Items categorized more precisely

## Examples

### User Flow: Adding a Warranty

1. User clicks "Add Warranty"
2. Selects category from dropdown:
   ```
   [Electronics]
     Electronics
     ↳ Mobile Phones  ← User selects this
     ↳ Laptops & Computers
   ```
3. Fills warranty details
4. Saves with category "Mobile Phones"

### Admin Flow: Adding New Category

1. Admin goes to Category Management
2. Fills form:
   - Name: "Tablets"
   - Type: Warranty
   - Parent: Electronics
3. Clicks "Add Category"
4. New subcategory created under Electronics
5. Users immediately see it in warranty form

## Troubleshooting

### Categories Not Showing Hierarchy?
- Check if `parentId` is properly set
- Verify API returns nested structure
- Check browser console for errors

### Can't Select Parent Category?
- Ensure you selected category type first
- Check if any parent categories exist
- Verify admin has proper permissions

### Subcategories Not Appearing for Users?
- Confirm categories are active (`isActive: true`)
- Check API response structure
- Verify subcategories are linked to parent

## Future Enhancements

1. **Deeper Nesting**: Support 3+ levels if needed
2. **Category Icons**: Visual icons for each category
3. **Reordering**: Drag-and-drop to reorder categories
4. **Bulk Operations**: Import/export categories
5. **Statistics**: Show usage count per category

## Summary

The hierarchical category system provides:
- **Better Organization**: Two-level structure for clarity
- **Flexibility**: Admins control what users see
- **Scalability**: Easy to expand and maintain
- **User Experience**: Grouped, intuitive category selection

Start using it by running the seed script and exploring the admin interface! 🎉
