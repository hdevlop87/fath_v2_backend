const fs = require('fs');
import {PERMISSIONS} from '../lib/constants/permissions'

// Function to get descriptions based on action and entity
const getDescription = (action, entity) => {
    switch (action) {
        case 'read':
            return entity.endsWith('s')
                ? `Permission to read all ${entity.replace(/_/g, ' ')}`
                : `Permission to read a single ${entity.replace(/_/g, ' ')}'s information`;
        case 'create':
            return entity.endsWith('s')
                ? `Permission to create new ${entity.replace(/_/g, ' ')}`
                : `Permission to create a new ${entity.replace(/_/g, ' ')}`;
        case 'update':
            return `Permission to update a single ${entity.replace(/_/g, ' ')}'s information`;
        case 'delete':
            return `Permission to delete a single ${entity.replace(/_/g, ' ')}`;
        case 'post':
            return `Permission to post ${entity.replace(/_/g, ' ')}`;
        case 'download':
            return `Permission to download ${entity.replace(/_/g, ' ')}`;
        case 'send':
            return `Permission to send ${entity.replace(/_/g, ' ')}`;
        default:
            return `Permission to ${action} ${entity.replace(/_/g, ' ')}`;
    }
};

// Function to transform the permissions to JSON
const transformPermissionsToJSON = (permissions) => {
    return Object.entries(permissions).map(([key, value]:[any, any]) => {
        const [action, ...entityParts] = value?.split('_');
        const entity = entityParts.join('_');

        return {
            permissionName: value,
            description: getDescription(action, entity)
        };
    });
};

// Transform and save to JSON file
const permissionsJSON = transformPermissionsToJSON(PERMISSIONS);
fs.writeFileSync('permissions.json', JSON.stringify(permissionsJSON, null, 2));

console.log('Permissions have been transformed to JSON and saved to permissions.json');
