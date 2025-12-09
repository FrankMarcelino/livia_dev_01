/**
 * Database Helper Types
 * Re-exporta tipos das tabelas de forma mais conveniente
 */

import type { Database } from './database';

// Re-export Database type for convenience
export type { Database };

// ============================================================================
// TABLE ROW TYPES (aliases convenientes)
// ============================================================================

export type Contact = Database['public']['Tables']['contacts']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type Agent = Database['public']['Tables']['agents']['Row'];
export type AgentPrompt = Database['public']['Tables']['agent_prompts']['Row'];
export type AgentTemplate = Database['public']['Tables']['agent_templates']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type ConversationTag = Database['public']['Tables']['conversation_tags']['Row'];
export type QuickReplyTemplate = Database['public']['Tables']['quick_reply_templates']['Row'];
export type BaseConhecimento = Database['public']['Tables']['base_conhecimentos']['Row'];
export type Neurocore = Database['public']['Tables']['neurocores']['Row'];

// ============================================================================
// ENUM TYPES
// ============================================================================

export type ConversationStatus = Database['public']['Enums']['conversation_status_enum'];
export type MessageSenderType = Database['public']['Enums']['message_sender_type_enum'];
export type MessageStatus = Database['public']['Enums']['message_status'];
export type FeedbackType = Database['public']['Enums']['feedback_type_enum'];
export type AgentTypeEnum = Database['public']['Enums']['agent_type_enum'];
export type AgentGenderEnum = Database['public']['Enums']['agent_gender_enum'];
export type AgentFunctionEnum = Database['public']['Enums']['agent_function_enum'];
export type AccessUserRole = Database['public']['Enums']['access_user_role'];
export type ContactStatusEnum = Database['public']['Enums']['contact_status_enum'];

// ============================================================================
// INSERT/UPDATE TYPES
// ============================================================================

export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];

export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];
