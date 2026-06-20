# Admin Management System

## Overview
The Admin Management system allows the super admin (with access name: 'admin') to manage other administrators in the system. This includes adding, viewing, updating, and deleting admin accounts.

## Features

### 🔐 Access Control
- Only the super admin (access name: 'admin') can access the admin management page
- Super admin cannot delete themselves
- All admin management operations require super admin authentication

### 📋 Admin Management Operations

#### 1. View All Admins
- Display all administrators in a table format
- Show admin name, access name, and masked passwords/keys
- Search functionality to filter admins by name or access name
- Loading states and error handling

#### 2. Add New Admin
- Form to create new admin accounts
- Required fields: Access Name, Password, Admin Key, Admin Name
- Password and Admin Key fields have show/hide toggle
- Validation for required fields and duplicate access names

#### 3. Update Admin
- Edit existing admin information
- Pre-populate form with current admin data
- Update any field including password (will be hashed)
- Cancel edit functionality

#### 4. Delete Admin
- Remove admin accounts (except super admin)
- Confirmation dialog before deletion
- Super admin delete button is disabled

## API Endpoints

### Backend Endpoints (Server)

#### GET `/admin/admins`
- **Description**: Get all admins
- **Access**: Super admin only
- **Response**: List of admin objects (without sensitive data)

#### POST `/admin/admins`
- **Description**: Add new admin
- **Access**: Super admin only
- **Body**: `{ accessName, password, adminKey, adminName }`
- **Response**: Created admin object

#### PUT `/admin/admins/:id`
- **Description**: Update admin
- **Access**: Super admin only
- **Body**: `{ accessName, password, adminKey, adminName }`
- **Response**: Updated admin object

#### DELETE `/admin/admins/:id`
- **Description**: Delete admin
- **Access**: Super admin only
- **Response**: Success message

## Database Schema

### Admin Model
```javascript
{
  accessName: String (required, unique),
  password: String (required, hashed),
  adminKey: String (required),
  adminName: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Components

### ManageAdminPage.js
- Main admin management interface
- Form for adding/editing admins
- Table displaying all admins
- Search functionality
- Loading and error states

### adminApi.js
- API utility functions for admin management
- Axios interceptors for authentication
- Error handling and token management

## Security Features

1. **Authentication Required**: All admin management operations require valid admin JWT token
2. **Super Admin Only**: Only super admin (access name: 'admin') can manage other admins
3. **Password Hashing**: All passwords are hashed using bcrypt before storage
4. **Input Validation**: Server-side validation for all inputs
5. **Access Name Uniqueness**: Prevents duplicate access names
6. **Super Admin Protection**: Super admin cannot be deleted

## Usage Instructions

### For Super Admin:

1. **Login** with super admin credentials (access name: 'admin')
2. **Navigate** to the Admin Management page
3. **Add New Admin**:
   - Fill in the form with admin details
   - Click "Add" button
4. **Edit Admin**:
   - Click the edit button next to any admin
   - Modify the information
   - Click "Update" or "Cancel"
5. **Delete Admin**:
   - Click the delete button next to any admin (except super admin)
   - Confirm the deletion

### Error Handling:
- Access denied for non-super admin users
- Validation errors for invalid inputs
- Network error handling with retry options
- Loading states during API calls

## Testing

A test script is provided (`test-admin-management.js`) to verify all CRUD operations:

```bash
node test-admin-management.js
```

**Note**: Update the super admin credentials in the test script before running.

## Dependencies

### Backend:
- Express.js
- Mongoose
- bcrypt
- JWT

### Frontend:
- React
- Axios
- CSS3

## Future Enhancements

1. **Role-based Permissions**: Different admin roles with varying permissions
2. **Admin Activity Logs**: Track admin actions and changes
3. **Bulk Operations**: Select and manage multiple admins at once
4. **Advanced Search**: Filter by creation date, role, etc.
5. **Admin Profile Pictures**: Upload and manage admin avatars
6. **Two-Factor Authentication**: Enhanced security for admin accounts
