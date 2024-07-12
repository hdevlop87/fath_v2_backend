
export const msg: any = {
  PASSWORD_UPDATE_REQUIRED: 'Please update your password to continue.',
  PASSWORD_CHANGED_SUCCESS: 'Password changed successfully.',
  USERS_RETRIEVED_SUCCESS: 'Users retrieved successfully.',
  USERS_DELETED_SUCCESS: 'All users have been deleted.',
  USER_RETRIEVED_SUCCESS: 'User retrieved successfully.',
  USER_CREATED_SUCCESS: 'User created successfully.',
  USER_UPDATED_SUCCESS: 'User updated successfully.',
  USER_DELETED_SUCCESS: 'User deleted successfully.',
  USER_LOGIN_SUCCESS: 'Login successful.',
  USER_LOGOUT_SUCCESS: 'Logout successful.',
  USER_REGISTER_SUCCESS: 'Registration successful. Welcome!',
  USER_NOT_FOUND: 'No user found with the provided information.',

  ADMIN_USER_CREATED_SUCCESS: 'Admin user created successfully',
  ADMIN_USER_ALREADY_EXISTS: 'Admin user already exists',

  // User validator
  INVALID_CREDENTIALS: 'Invalid credentials. Please try again.',
  FIELDS_MISSING: 'One or more required fields are empty. All fields are required.',
  AUTH_REQUIRED: 'Authentication required. Please login.',

  // user validator messages
  USERNAME_EXISTS: 'This username is already taken. Please choose another one.',
  EMAIL_EXISTS: 'An account with this email already exists. Please use a different email.',
  CIN_EXISTS: 'An account with this CIN already exists. Please use a different CIN.',
  PHONE_EXISTS: 'An account with this phone number already exists. Please use a different number.',
  USERNAME_MISSING: 'Username is missing. Please provide a username.',
  EMAIL_MISSING: 'Email is missing. Please provide an email address.',
  PHONE_MISSING: 'Phone number is missing. Please provide a phone number.',

  // Token messages
  ACCESS_TOKEN_GENERATED_SUCCESS: 'Access token generated successfully.',
  ACCESS_TOKEN_REFRESH_SUCCESS: 'Access token refreshed successfully.',
  ACCESS_TOKEN_EXPIRED: 'Access token has expired. Please refresh your token.',
  ACCESS_TOKEN_VERIFICATION_FAILED: 'Access token verification failed.',
  ACCESS_TOKEN_MISSING: 'Access token is missing. Please provide an access token.',
  ACCESS_TOKEN_INVALID: 'Provided access token is invalid. Please obtain a valid access',

  REFRESH_TOKEN_GENERATED_SUCCESS: 'Refresh token successfully generated.',
  REFRESH_TOKEN_REFRESH_SUCCESS: 'Refresh token successfully refreshed.',
  REFRESH_TOKEN_EXPIRED: 'Session expired. Please login again.',
  REFRESH_TOKEN_VERIFICATION_FAILED: 'Refresh token verification failed.',
  REFRESH_TOKEN_MISSING: 'Refresh token missing. Please provide a refresh token.',
  REFRESH_TOKEN_INVALID: 'Invalid refresh token. Please login again.',

  // Role messages
  ROLES_INIT_SUCCESS: 'Roles initialized successfully',
  ROLES_RETRIEVED_SUCCESS: 'All roles retrieved successfully.',
  ROLES_DELETED_SUCCESS: 'All roles have been deleted.',
  ROLE_RETRIEVED_SUCCESS: 'Role retrieved successfully.',
  ROLE_CREATED_SUCCESS: 'Role created successfully.',
  ROLE_UPDATED_SUCCESS: 'Role updated successfully.',
  ROLE_DELETED_SUCCESS: 'Role deleted successfully.',
  ROLE_EXISTS: 'Role name is already in use. Please choose another one.',
  ROLE_NOT_FOUND: 'Role not found.',

  // User_Role messages
  USER_ROLE_EXISTS: "The specified role for the user already exists.",
  USER_ROLE_NOT_FOUND: "The specified role for the user was not found.",
  ROLE_ASSIGNED_TO_USER_SUCCESS: "The role was successfully assigned to the user.",
  USER_ROLES_RETRIEVED_SUCCESS: "User roles were successfully retrieved.",
  USERS_BY_ROLE_RETRIEVED_SUCCESS: "Users for the specified role were successfully retrieved.",
  USER_ROLE_DELETED_SUCCESS: "The user role has been successfully deleted.",
  USER_PERMISSIONS_RETRIEVED_SUCCESS: "User permissions were successfully retrieved.",

  // Permission messages
  PERMISSIONS_INIT_SUCCESS: 'Permissions initialized successfully',
  PERMISSIONS_RETRIEVED_SUCCESS: 'All permissions retrieved successfully.',
  PERMISSIONS_DELETED_SUCCESS: 'All permissions have been deleted.',
  PERMISSION_RETRIEVED_SUCCESS: 'Permission retrieved successfully.',
  PERMISSION_CREATED_SUCCESS: 'Permission created successfully.',
  PERMISSION_UPDATED_SUCCESS: 'Permission updated successfully.',
  PERMISSION_DELETED_SUCCESS: 'Permission deleted successfully.',
  PERMISSION_EXISTS: 'Permission name is already in use. Please choose another one.',
  PERMISSION_NOT_FOUND: 'Permission not found.',
  AUTHORIZATION_FAILED: 'Authorization failed. You do not have the necessary permissions.',
  ACCESS_DENIED: 'Access denied. You do not have the necessary rights to access this resource.',

  // New constants for RolePermissionController actions
  ROLE_PERMISSION_ASSIGNED_SUCCESS: 'Permission successfully assigned to role.',
  ROLE_PERMISSION_REMOVED_SUCCESS: 'Permission successfully removed from role.',
  ROLE_PERMISSIONS_RETRIEVED_SUCCESS: 'Permissions for the role retrieved successfully.',
  ROLE_PERMISSION_NOT_FOUND: 'The specified permission for this role does not exist.',
  ROLE_PERMISSION_EXISTS: 'This permission is already assigned to the role.',

  // Lots messages
  LOTS_INIT_SUCCESS: 'Lots initialized successfully',
  LOTS_RETRIEVED_SUCCESS: 'ALL retrieved successfully.',
  LOTS_DELETED_SUCCESS: 'All lots have been deleted.',
  LOT_RETRIEVED_SUCCESS: 'Lot retrieved successfully.',
  LOT_CREATED_SUCCESS: 'Lot created successfully.',
  LOT_UPDATED_SUCCESS: 'Lot updated successfully.',
  LOT_DELETED_SUCCESS: 'Lot deleted successfully.',
  LOT_NOT_FOUND: 'Lot not found.',
  LOT_NOT_AVAILABLE: 'The lot is not available for sale.',
  LOT_EXISTS: 'Lot Ref is already in use. Please choose another one.',

  // Customers messages
  CUSTOMERS_INIT_SUCCESS: 'Customers initialized successfully',
  CUSTOMERS_RETRIEVED_SUCCESS: 'ALL Customers retrieved successfully.',
  CUSTOMERS_DELETED_SUCCESS: 'All Customers have been deleted.',
  CUSTOMER_RETRIEVED_SUCCESS: 'Customer retrieved successfully.',
  CUSTOMER_CREATED_SUCCESS: 'Customer created successfully.',
  CUSTOMER_UPDATED_SUCCESS: 'Customer updated successfully.',
  CUSTOMER_DELETED_SUCCESS: 'Customer deleted successfully.',
  CUSTOMER_NOT_FOUND: 'Customer not found.',
  CUSTOMER_EXISTS: 'Customer is already Exists. Please choose another one.',

  // Sales messages
  SALES_INIT_SUCCESS: 'Sales initialized successfully',
  SALES_RETRIEVED_SUCCESS: 'ALL retrieved successfully.',
  SALES_DELETED_SUCCESS: 'All sales have been deleted.',
  SALE_RETRIEVED_SUCCESS: 'Sale retrieved successfully.',
  SALE_CREATED_SUCCESS: 'Sale created successfully.',
  SALE_UPDATED_SUCCESS: 'Sale updated successfully.',
  SALE_DELETED_SUCCESS: 'Sale deleted successfully.',
  SALE_NOT_FOUND: 'Sale not found.',
  SALE_EXISTS: 'An sale with this data already exists.',

  PAYMENTS_INIT_SUCCESS: 'Payments initialized successfully',
  PAYMENTS_RETRIEVED_SUCCESS: 'ALL retrieved successfully.',
  PAYMENTS_DELETED_SUCCESS: 'All payments have been deleted.',
  PAYMENT_RETRIEVED_SUCCESS: 'Payment retrieved successfully.',
  PAYMENT_CREATED_SUCCESS: 'Payment created successfully.',
  PAYMENT_UPDATED_SUCCESS: 'Payment updated successfully.',
  PAYMENT_DELETED_SUCCESS: 'Payment deleted successfully.',
  PAYMENT_NOT_FOUND: 'Payment not found.',
  PAYMENT_NOT_AVAILABLE: 'The payment is not available for sale.',
  PAYMENT_EXISTS: 'Payment with this receipt is already in use. Please choose another receipt.',
  PAYMENT_RECEIPT_EMPTY: 'receipt cannot be empty',
  // status messages
  INITIATED: 'Initiated',
  COMPLETED: 'Completed',
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  ONGOING: 'Ongoing',
  SOLD: 'Sold',
  CANCELED: 'Canceled',
  CHEQUE: 'Cheque',
  ESPECE: 'Espece',
  CREDIT_CARD: 'CreditCard',
  BANK_TRANSFER: 'BankTransfer',
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  FAILED: 'Failed',
  PERMITS_AND_AUTHORIZATIONS: 'Permits_and_Authorizations',
  DEVELOPMENT_WORK: 'Development_Work',
  MARKETING_AND_ADVERTISING: 'Marketing_and_Advertising',
  PROPERTY_TAXES_AND_DUTIES: 'Property_Taxes_and_Duties',
  LABOR: 'Labor',
  MISCELLANEOUS: 'Miscellaneous',

  FILES_INIT_SUCCESS: 'Files initialized successfully',
  FILES_RETRIEVED_SUCCESS: 'All files retrieved successfully.',
  FILES_DELETED_SUCCESS: 'All files have been deleted.',
  FILE_RETRIEVED_SUCCESS: 'File retrieved successfully.',
  FILE_CREATED_SUCCESS: 'File created successfully.',
  FILE_UPDATED_SUCCESS: 'File updated successfully.',
  FILE_DELETED_SUCCESS: 'File deleted successfully.',
  FILE_EXISTS: 'File name is already in use. Please choose another one.',
  FILE_NOT_FOUND: 'File not found.',

  FOLDERS_INIT_SUCCESS: 'Folders initialized successfully',
  FOLDERS_RETRIEVED_SUCCESS: 'All folders retrieved successfully.',
  FOLDERS_DELETED_SUCCESS: 'All folders have been deleted.',
  FOLDER_RETRIEVED_SUCCESS: 'Folder retrieved successfully.',
  FOLDER_CREATED_SUCCESS: 'Folder created successfully.',
  FOLDER_UPDATED_SUCCESS: 'Folder updated successfully.',
  FOLDER_DELETED_SUCCESS: 'Folder deleted successfully.',
  FOLDER_EXISTS: 'Folder name is already in use. Please choose another one.',
  FOLDER_NOT_FOUND: 'Folder not found.',

  APP_INIT_COMPLETE: 'App initialization complete',
  APP_INIT_FAILED: 'App initialization failed',

  AGREEMENT_EMAIL_SUCCESS: 'The agreement document has been sent successfully',
  AGREEMENT_DOWNLOAD_SUCCESS: 'The agreement document has been successfully downloaded.',
  AGREEMENT_DELETED_SUCCESS: 'Agreement deleted successfully',
  AGREEMENTS_DELETED_SUCCESS: 'All agreements for the sale deleted successfully',
};



