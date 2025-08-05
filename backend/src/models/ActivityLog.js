const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ActivityLog Model - Tracks system activities and user actions
 * 
 * This model handles:
 * - User activity logging and tracking
 * - System event logging
 * - Audit trail for security and compliance
 * - Activity analytics and reporting
 */
const ActivityLog = sequelize.define('ActivityLog', {
  // Primary identifier
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique activity log identifier'
  },

  // User who performed the action
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'User who performed the action (null for system actions)'
  },

  // Activity type
  activityType: {
    type: DataTypes.ENUM(
      'user_login',
      'user_logout',
      'user_register',
      'user_update',
      'user_delete',
      'product_create',
      'product_update',
      'product_delete',
      'order_create',
      'order_update',
      'order_cancel',
      'payment_success',
      'payment_failed',
      'review_create',
      'review_update',
      'review_delete',
      'inventory_adjustment',
      'admin_action',
      'system_event',
      'error_log',
      'security_event'
    ),
    allowNull: false,
    comment: 'Type of activity'
  },

  // Activity level
  level: {
    type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
    defaultValue: 'info',
    allowNull: false,
    comment: 'Activity severity level'
  },

  // Activity description
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Human-readable activity description'
  },

  // Activity details
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional activity details'
  },

  // IP address
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address of the user'
  },

  // User agent
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent string'
  },

  // Request information
  requestMethod: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'HTTP request method'
  },

  requestUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Request URL'
  },

  requestId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Unique request identifier'
  },

  // Session information
  sessionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Session identifier'
  },

  // Related entities
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Type of related entity (User, Product, Order, etc.)'
  },

  entityId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of related entity'
  },

  // Activity metadata
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional activity metadata'
  },

  // Activity status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
    comment: 'Activity log active status'
  },

  // Processing status
  isProcessed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Whether the activity has been processed'
  },

  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Activity processing timestamp'
  }

}, {
  // Table configuration
  tableName: 'activity_logs',
  timestamps: true,
  underscored: true,

  // Model hooks
  hooks: {
    // Before creating an activity log
    beforeCreate: async (activityLog) => {
      // Set default description if not provided
      if (!activityLog.description) {
        activityLog.description = activityLog.generateDescription();
      }
    }
  },

  // Indexes for performance
  indexes: [
    {
      fields: ['user_id'],
      name: 'activity_logs_user_id_index'
    },
    {
      fields: ['activity_type'],
      name: 'activity_logs_activity_type_index'
    },
    {
      fields: ['level'],
      name: 'activity_logs_level_index'
    },
    {
      fields: ['entity_type', 'entity_id'],
      name: 'activity_logs_entity_index'
    },
    {
      fields: ['created_at'],
      name: 'activity_logs_created_at_index'
    },
    {
      fields: ['ip_address'],
      name: 'activity_logs_ip_address_index'
    }
  ]
});

/**
 * Instance Methods
 */

// Generate activity description
ActivityLog.prototype.generateDescription = function() {
  const typeMap = {
    'user_login': 'User logged in',
    'user_logout': 'User logged out',
    'user_register': 'User registered',
    'user_update': 'User profile updated',
    'user_delete': 'User account deleted',
    'product_create': 'Product created',
    'product_update': 'Product updated',
    'product_delete': 'Product deleted',
    'order_create': 'Order created',
    'order_update': 'Order updated',
    'order_cancel': 'Order cancelled',
    'payment_success': 'Payment successful',
    'payment_failed': 'Payment failed',
    'review_create': 'Review created',
    'review_update': 'Review updated',
    'review_delete': 'Review deleted',
    'inventory_adjustment': 'Inventory adjusted',
    'admin_action': 'Admin action performed',
    'system_event': 'System event occurred',
    'error_log': 'Error logged',
    'security_event': 'Security event detected'
  };
  
  return typeMap[this.activityType] || 'Activity performed';
};

// Get activity with user details
ActivityLog.prototype.getWithUser = async function() {
  const user = await this.getUser({
    attributes: ['id', 'firstName', 'lastName', 'email']
  });
  
  return {
    ...this.toJSON(),
    user: user
  };
};

// Mark as processed
ActivityLog.prototype.markAsProcessed = async function() {
  this.isProcessed = true;
  this.processedAt = new Date();
  await this.save();
  return this;
};

// Get activity level display name
ActivityLog.prototype.getLevelDisplay = function() {
  const levelMap = {
    'info': 'Information',
    'warning': 'Warning',
    'error': 'Error',
    'critical': 'Critical'
  };
  
  return levelMap[this.level] || this.level;
};

// Get activity type display name
ActivityLog.prototype.getActivityTypeDisplay = function() {
  const typeMap = {
    'user_login': 'User Login',
    'user_logout': 'User Logout',
    'user_register': 'User Registration',
    'user_update': 'User Update',
    'user_delete': 'User Deletion',
    'product_create': 'Product Creation',
    'product_update': 'Product Update',
    'product_delete': 'Product Deletion',
    'order_create': 'Order Creation',
    'order_update': 'Order Update',
    'order_cancel': 'Order Cancellation',
    'payment_success': 'Payment Success',
    'payment_failed': 'Payment Failure',
    'review_create': 'Review Creation',
    'review_update': 'Review Update',
    'review_delete': 'Review Deletion',
    'inventory_adjustment': 'Inventory Adjustment',
    'admin_action': 'Admin Action',
    'system_event': 'System Event',
    'error_log': 'Error Log',
    'security_event': 'Security Event'
  };
  
  return typeMap[this.activityType] || this.activityType;
};

/**
 * Class Methods
 */

// Find activities by user
ActivityLog.findByUser = async function(userId, limit = 50, offset = 0) {
  return await this.findAndCountAll({
    where: { userId: userId },
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find activities by type
ActivityLog.findByType = async function(activityType, limit = 50, offset = 0) {
  return await this.findAndCountAll({
    where: { activityType: activityType },
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }],
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find activities by level
ActivityLog.findByLevel = async function(level, limit = 50, offset = 0) {
  return await this.findAndCountAll({
    where: { level: level },
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }],
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find activities by entity
ActivityLog.findByEntity = async function(entityType, entityId, limit = 50, offset = 0) {
  return await this.findAndCountAll({
    where: { 
      entityType: entityType,
      entityId: entityId 
    },
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }],
    limit: limit,
    offset: offset,
    order: [['createdAt', 'DESC']]
  });
};

// Find recent activities
ActivityLog.findRecentActivities = async function(limit = 20) {
  return await this.findAll({
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'firstName', 'lastName', 'email']
    }],
    limit: limit,
    order: [['createdAt', 'DESC']]
  });
};

// Find unprocessed activities
ActivityLog.findUnprocessedActivities = async function(limit = 100) {
  return await this.findAll({
    where: { isProcessed: false },
    limit: limit,
    order: [['createdAt', 'ASC']]
  });
};

// Create activity log
ActivityLog.createActivity = async function(activityData) {
  return await this.create(activityData);
};

// Create user activity
ActivityLog.createUserActivity = async function(userId, activityType, description, details = {}, level = 'info') {
  return await this.create({
    userId: userId,
    activityType: activityType,
    description: description,
    details: details,
    level: level
  });
};

// Create system activity
ActivityLog.createSystemActivity = async function(activityType, description, details = {}, level = 'info') {
  return await this.create({
    userId: null,
    activityType: activityType,
    description: description,
    details: details,
    level: level
  });
};

// Create security event
ActivityLog.createSecurityEvent = async function(userId, description, details = {}, ipAddress = null, userAgent = null) {
  return await this.create({
    userId: userId,
    activityType: 'security_event',
    description: description,
    details: details,
    level: 'warning',
    ipAddress: ipAddress,
    userAgent: userAgent
  });
};

// Create error log
ActivityLog.createErrorLog = async function(userId, error, details = {}) {
  return await this.create({
    userId: userId,
    activityType: 'error_log',
    description: error.message || 'An error occurred',
    details: {
      ...details,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    },
    level: 'error'
  });
};

// Get activity statistics
ActivityLog.getStatistics = async function(userId = null, startDate = null, endDate = null) {
  const whereClause = {};
  
  if (userId) {
    whereClause.userId = userId;
  }
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      [sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  const totalActivities = await this.count({ where: whereClause });
  
  const infoActivities = await this.count({
    where: { ...whereClause, level: 'info' }
  });
  
  const warningActivities = await this.count({
    where: { ...whereClause, level: 'warning' }
  });
  
  const errorActivities = await this.count({
    where: { ...whereClause, level: 'error' }
  });
  
  const criticalActivities = await this.count({
    where: { ...whereClause, level: 'critical' }
  });
  
  const userActivities = await this.count({
    where: { ...whereClause, userId: { [sequelize.Op.ne]: null } }
  });
  
  const systemActivities = await this.count({
    where: { ...whereClause, userId: null }
  });
  
  return {
    totalActivities,
    infoActivities,
    warningActivities,
    errorActivities,
    criticalActivities,
    userActivities,
    systemActivities
  };
};

// Clean up old activity logs
ActivityLog.cleanupOldLogs = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const deletedCount = await this.destroy({
    where: {
      createdAt: {
        [sequelize.Op.lt]: cutoffDate
      },
      level: {
        [sequelize.Op.in]: ['info', 'warning']
      }
    }
  });
  
  return deletedCount;
};

module.exports = ActivityLog;
