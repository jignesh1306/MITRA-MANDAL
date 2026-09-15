import { AuditLog } from '../models/AuditLog.js';

export const createAuditLog = async ({ groupId, userId, action, entityType, entityId, oldValue, newValue }) => {
  return await AuditLog.create({
    groupId,
    userId,
    action,
    entityType,
    entityId,
    oldValue,
    newValue
  });
};
