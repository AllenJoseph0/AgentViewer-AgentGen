

-- Dumping structure for table agents.agents
CREATE TABLE IF NOT EXISTS `agents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_uuid` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `agent_type` varchar(100) DEFAULT NULL,
  `config_json` json DEFAULT NULL,
  `firm_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `views_config` json DEFAULT NULL COMMENT 'Global UI configuration for agent viewer',
  PRIMARY KEY (`id`),
  UNIQUE KEY `agent_uuid` (`agent_uuid`),
  KEY `firm_id` (`firm_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table agents.agent_chats
CREATE TABLE IF NOT EXISTS `agent_chats` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `message` text,
  `role` enum('user','agent') DEFAULT 'user',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `agent_chats_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table agents.agent_endpoints
CREATE TABLE IF NOT EXISTS `agent_endpoints` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_id` bigint NOT NULL,
  `endpoint_name` varchar(255) NOT NULL,
  `method` enum('GET','POST','PUT','DELETE') DEFAULT 'POST',
  `url` varchar(500) NOT NULL,
  `request_schema` json DEFAULT NULL,
  `response_schema` json DEFAULT NULL,
  `auth_required` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `agent_endpoints_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table agents.agent_forms
CREATE TABLE IF NOT EXISTS `agent_forms` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_id` bigint NOT NULL,
  `form_name` varchar(255) NOT NULL,
  `description` text,
  `form_schema` json DEFAULT NULL,
  `created_by_user_id` bigint NOT NULL,
  `firm_id` bigint NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `agent_forms_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table agents.agent_form_data
CREATE TABLE IF NOT EXISTS `agent_form_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_id` bigint NOT NULL,
  `form_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `firm_id` bigint NOT NULL,
  `submission_data` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `agent_id` (`agent_id`),
  KEY `form_id` (`form_id`),
  CONSTRAINT `agent_form_data_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `agent_form_data_ibfk_2` FOREIGN KEY (`form_id`) REFERENCES `agent_forms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table agents.agent_logs
CREATE TABLE IF NOT EXISTS `agent_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `firm_id` bigint NOT NULL,
  `action` varchar(255) DEFAULT NULL,
  `input_data` json DEFAULT NULL,
  `output_data` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `agent_logs_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table agents.agent_menus
CREATE TABLE IF NOT EXISTS `agent_menus` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_id` bigint NOT NULL,
  `menu_type` enum('header','sidebar','footer','floating','dashboard','chat','recommendation') DEFAULT 'sidebar',
  `label` varchar(255) NOT NULL,
  `route` varchar(255) DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `order_no` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `badge` varchar(50) DEFAULT NULL COMMENT 'Badge text (e.g., "New", "3")',
  `tooltip` varchar(255) DEFAULT NULL COMMENT 'Tooltip text for better UX',
  PRIMARY KEY (`id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `agent_menus_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table agents.agent_recommendations
CREATE TABLE IF NOT EXISTS `agent_recommendations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `recommendation_text` text,
  `category` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `agent_recommendations_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Data exporting was unselected.

-- Dumping structure for table agents.agent_views
CREATE TABLE IF NOT EXISTS `agent_views` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_id` bigint NOT NULL,
  `route` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Page route (e.g., /dashboard)',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Page title',
  `layout` enum('grid','list','form','chat','analytics','custom') COLLATE utf8mb4_unicode_ci DEFAULT 'grid' COMMENT 'Page layout type',
  `components` json NOT NULL COMMENT 'Array of UI components for the page',
  `actions` json DEFAULT NULL COMMENT 'Array of page actions (buttons, links)',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_agent_views_agent_id` (`agent_id`),
  KEY `idx_agent_views_route` (`route`),
  CONSTRAINT `agent_views_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='UI page layouts for agent viewer';

-- Data exporting was unselected.

-- Dumping structure for table agents.agent_workflows
CREATE TABLE IF NOT EXISTS `agent_workflows` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_id` bigint NOT NULL,
  `workflow_name` varchar(255) NOT NULL,
  `description` text,
  `steps_json` json DEFAULT NULL,
  `trigger_event` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `agent_id` (`agent_id`),
  CONSTRAINT `agent_workflows_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `agents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


