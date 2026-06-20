// Chatbot service with predefined responses and intelligent matching

const chatbotResponses = {
  // Greetings
  greetings: {
    patterns: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
    responses: [
      "Hello! I'm here to help you with your WHS Management System. How can I assist you today?",
      "Hi there! Welcome to WHS Support. What can I help you with?",
      "Hello! I'm your virtual assistant. Feel free to ask me anything about warranties, subscriptions, or home maintenance tasks."
    ]
  },

  // Warranty related
  warranty: {
    patterns: ['warranty', 'warranties', 'warranty document', 'warranty expiration', 'warranty reminder', 'add a warranty', 'add warranty', 'view warranty', 'view warranties', 'upload warranty', 'warranty documents'],
    responses: [
      "**Warranty Management:**\n\n• You can upload and store warranty documents\n• Add product details and images\n• Receive expiration alerts\n• Track warranty categories\n\nWould you like help with:\n- Adding a new warranty?\n- Viewing your warranties?\n- Setting up reminders?",
      "I can help you manage your warranties! You can:\n\n1. **Add Warranties**: Upload documents and add product details\n2. **Track Expiration**: Get alerts before warranties expire\n3. **Organize by Category**: Categorize warranties for easy access\n\nWhat specific warranty help do you need?",
      "For warranty management:\n\n• Go to the Warranty page from your home dashboard\n• Click 'Add New Warranty' to upload documents\n• Set expiration dates and reminder preferences\n• View all warranties sorted by expiration date\n\nNeed more details on any of these?"
    ]
  },

  // Subscription related
  subscription: {
    patterns: ['subscription', 'subscriptions', 'renewal', 'billing', 'auto renewal', 'manage subscription', 'manage subscriptions', 'add subscription', 'add a subscription', 'subscription details', 'renewal reminders'],
    responses: [
      "**Subscription Management:**\n\n• Track various subscriptions\n• Store payment details\n• Receive reminders before renewal dates\n• Manage auto-renewal settings\n• Organize by billing cycle\n\nWhat would you like to know about subscriptions?",
      "I can help with subscriptions! Features include:\n\n1. **Track Subscriptions**: Add and monitor all your subscriptions\n2. **Renewal Reminders**: Get notified before renewal dates\n3. **Auto-Renewal**: Enable/disable auto-renewal for each subscription\n4. **Billing Cycles**: Track monthly, yearly, or custom cycles\n\nNeed help setting up a subscription?",
      "Subscription management allows you to:\n\n• Add subscription details (name, category, price)\n• Set renewal dates and reminder preferences\n• Configure auto-renewal settings\n• View all subscriptions in one place\n\nHow can I assist you with subscriptions?"
    ]
  },

  // Home tasks related
  homeTasks: {
    patterns: ['home task', 'home tasks', 'maintenance', 'maintenance task', 'home maintenance', 'plumbing', 'electrical', 'create a maintenance task', 'create maintenance', 'task priority', 'mark task', 'view all tasks', 'view tasks'],
    responses: [
      "**Home Maintenance Schedule:**\n\n• Schedule and track home maintenance tasks\n• Set reminders for plumbing, electrical work, and inspections\n• Track task status and completion\n• Organize by priority and category\n• Estimate duration and cost\n\nWhat maintenance task do you need help with?",
      "Home maintenance features:\n\n1. **Task Scheduling**: Create tasks with due dates\n2. **Priority Levels**: Set high, medium, or low priority\n3. **Status Tracking**: Track pending, in-progress, or completed tasks\n4. **Categories**: Organize by type (plumbing, electrical, etc.)\n5. **Reminders**: Get notifications before due dates\n\nNeed help creating a maintenance task?",
      "For home maintenance:\n\n• Go to Home Tasks page\n• Click 'Add New Task'\n• Fill in task details (name, category, due date)\n• Set priority and estimated duration\n• Save and receive reminders\n\nWhat specific help do you need?"
    ]
  },

  // Search feature
  search: {
    patterns: ['search', 'find', 'locate', 'how to search', 'search feature', 'search for items', 'search warranties', 'find subscriptions', 'search home tasks', 'how to use search'],
    responses: [
      "**Search Feature:**\n\n• Quickly find stored documents and information\n• Smart search system supports text input\n• Search across warranties, subscriptions, and tasks\n• Filter by category, date, or status\n\nTo use search:\n1. Go to the Search page\n2. Enter keywords\n3. Filter results as needed\n\nWhat are you looking for?",
      "The search feature helps you:\n\n• Find warranties by product name or category\n• Locate subscriptions by name or billing cycle\n• Search home tasks by name or status\n• Filter results for better accuracy\n\nTry searching from the Search page in your dashboard!"
    ]
  },

  // Profile/Account
  profile: {
    patterns: ['profile', 'account', 'settings', 'change password', 'update profile', 'edit profile', 'update my profile', 'edit contact', 'contact information', 'account settings'],
    responses: [
      "**Profile Management:**\n\n• Update your username, email, or phone number\n• Change your password\n• View account information\n\nTo update your profile:\n1. Go to Profile page\n2. Click 'Edit Profile'\n3. Update information\n4. Save changes\n\nWhat would you like to update?",
      "Profile settings allow you to:\n\n• Edit personal information\n• Change password (must meet security requirements)\n• Update contact details\n• View account status\n\nNeed help with a specific profile update?"
    ]
  },

  // Notifications
  notifications: {
    patterns: ['notification', 'notifications', 'alert', 'reminder', 'reminders', 'set up reminders', 'set reminders', 'manage alerts', 'notification settings', 'view notifications'],
    responses: [
      "**Notifications & Reminders:**\n\n• Get alerts for warranty expirations\n• Receive subscription renewal reminders\n• Home task due date notifications\n• View all notifications in one place\n\nTo manage notifications:\n1. Go to Notifications page\n2. View unread notifications\n3. Mark as read or delete\n\nNeed help setting up reminders?",
      "Notification features:\n\n• Automatic reminders for warranties, subscriptions, and tasks\n• Email notifications for important events\n• In-app notification center\n• Customizable reminder preferences\n\nWhat notification help do you need?"
    ]
  },

  // Help/Support
  help: {
    patterns: ['help', 'support', 'how to', 'tutorial', 'guide', 'faq', 'how to use the system', 'faq page', 'contact support', 'view tutorials'],
    responses: [
      "**Help & Support:**\n\nI can help you with:\n\n• **Warranties**: Adding, viewing, and managing warranties\n• **Subscriptions**: Tracking and renewing subscriptions\n• **Home Tasks**: Scheduling and tracking maintenance\n• **Profile**: Updating account information\n• **Search**: Finding your documents\n\nYou can also:\n• Visit the FAQ page for common questions\n• Check Tutorials for step-by-step guides\n• Contact support via email\n\nWhat specific help do you need?",
      "Here's how to get help:\n\n1. **Chatbot** (me!): Ask questions anytime\n2. **FAQ Page**: Common questions and answers\n3. **Tutorials**: Step-by-step guides\n4. **Email Support**: support@whs.com\n5. **Live Chat**: Escalate to human support if needed\n\nWhat can I help you with right now?"
    ]
  },

  // Escalation
  escalation: {
    patterns: ['human', 'agent', 'support staff', 'talk to someone', 'escalate', 'live chat'],
    responses: [
      "I understand you'd like to speak with a support agent. For direct assistance, please use the **Live Chat** feature available in the chat button menu. Our support team is ready to help you with any issues I cannot resolve.\n\nI can still help with:\n• Warranties and documents\n• Subscriptions and renewals\n• Home maintenance tasks\n• Account settings\n• General how-to questions\n\nWould you like to continue here, or use Live Chat?",
      "For direct support from our team, please use the **Live Chat** option. Click on the chat button and select 'Live Chat' to connect with a support agent who can assist with complex issues.\n\nI'm here to help with general questions about:\n• Warranties and documents\n• Subscriptions and renewals\n• Home maintenance tasks\n• Account settings\n\nWhat would you like help with?"
    ]
  },

  // Default/Unknown
  default: {
    responses: [
      "I'm here to help! I can assist you with:\n\n• **Warranties**: Managing warranty documents and expiration dates\n• **Subscriptions**: Tracking subscriptions and renewals\n• **Home Tasks**: Scheduling and managing maintenance tasks\n• **Profile**: Updating account information\n• **Search**: Finding your documents\n• **General Help**: How to use the system\n\nCould you rephrase your question or ask about one of these topics?\n\nIf I can't solve your issue, please use the **Live Chat** option to chat directly with our support team.",
      "I want to help, but I'm not sure I understand your question. Could you try asking about:\n\n• Adding or viewing warranties\n• Managing subscriptions\n• Creating home maintenance tasks\n• Updating your profile\n• Using the search feature\n\nOr type 'help' for more options!\n\nIf you need additional assistance, please use **Live Chat** to connect with our support team.",
      "I don't have enough information to answer that specific question. However, I can help with:\n\n• Warranty management\n• Subscription tracking\n• Home maintenance scheduling\n• Account settings\n• General system usage\n\nWhat would you like to know about?\n\nFor issues I can't resolve, please use **Live Chat** to speak with our support team directly."
    ]
  }
};

// Direct mapping for suggestion questions to ensure accurate responses
const suggestionIntentMap = {
  // Warranty suggestions
  'how do i add a warranty?': 'warranty',
  'how to add a warranty?': 'warranty',
  'view my warranties': 'warranty',
  'view warranties': 'warranty',
  'set warranty reminders': 'warranty',
  'upload warranty documents': 'warranty',
  
  // Subscription suggestions
  'how to manage subscriptions?': 'subscription',
  'manage subscriptions': 'subscription',
  'add a subscription': 'subscription',
  'add subscription': 'subscription',
  'manage auto-renewal': 'subscription',
  'view subscription details': 'subscription',
  'set renewal reminders': 'subscription',
  
  // Home tasks suggestions
  'create a home maintenance task': 'homeTasks',
  'create a maintenance task': 'homeTasks',
  'create maintenance task': 'homeTasks',
  'set task priority': 'homeTasks',
  'mark task as complete': 'homeTasks',
  'view all tasks': 'homeTasks',
  'view tasks': 'homeTasks',
  
  // Profile suggestions
  'update my profile': 'profile',
  'change password': 'profile',
  'edit contact information': 'profile',
  'view account settings': 'profile',
  
  // Search suggestions
  'how to search for items?': 'search',
  'search warranties': 'search',
  'find subscriptions': 'search',
  'search home tasks': 'search',
  'how to use search?': 'search',
  
  // Notifications suggestions
  'set up reminders': 'notifications',
  'set reminders': 'notifications',
  'view notifications': 'notifications',
  'manage alerts': 'notifications',
  'notification settings': 'notifications',
  
  // Help suggestions
  'how to use the system?': 'help',
  'where is the faq page?': 'help',
  'contact support': 'help',
  'view tutorials': 'help',
  
  // Default/General
  'help with warranties': 'warranty',
  'subscription management': 'subscription',
  'home maintenance tasks': 'homeTasks',
  'profile settings': 'profile',
  'search feature': 'search',
  'general help': 'help'
};

// Function to find matching response
export function getChatbotResponse(userMessage, userId = null) {
  const message = userMessage.toLowerCase().trim();

  // First, check direct mapping for suggestions (most reliable)
  // Check exact match first
  if (suggestionIntentMap[message]) {
    const intent = suggestionIntentMap[message];
    if (intent === 'warranty' || intent === 'subscription' || intent === 'homeTasks' || 
        intent === 'search' || intent === 'profile' || intent === 'notifications' || intent === 'help') {
      return {
        response: chatbotResponses[intent].responses[
          Math.floor(Math.random() * chatbotResponses[intent].responses.length)
        ],
        intent: intent
      };
    }
  }

  // Check for partial matches in suggestion mapping (for slight variations)
  // Only match if message contains key phrases (more than 3 words match)
  for (const [key, intent] of Object.entries(suggestionIntentMap)) {
    const keyWords = key.split(' ').filter(w => w.length > 2); // Filter out short words
    const matchingWords = keyWords.filter(word => message.includes(word));
    // If at least 2 key words match, consider it a match
    if (matchingWords.length >= Math.min(2, keyWords.length)) {
      if (intent === 'warranty' || intent === 'subscription' || intent === 'homeTasks' || 
          intent === 'search' || intent === 'profile' || intent === 'notifications' || intent === 'help') {
        return {
          response: chatbotResponses[intent].responses[
            Math.floor(Math.random() * chatbotResponses[intent].responses.length)
          ],
          intent: intent
        };
      }
    }
  }

  // Check for greetings
  if (chatbotResponses.greetings.patterns.some(pattern => message.includes(pattern))) {
    return {
      response: chatbotResponses.greetings.responses[
        Math.floor(Math.random() * chatbotResponses.greetings.responses.length)
      ],
      intent: 'greeting'
    };
  }

  // Check for escalation requests
  if (chatbotResponses.escalation.patterns.some(pattern => message.includes(pattern))) {
    return {
      response: chatbotResponses.escalation.responses[
        Math.floor(Math.random() * chatbotResponses.escalation.responses.length)
      ],
      intent: 'escalation',
      shouldEscalate: true
    };
  }

  // Check other categories
  const categories = ['warranty', 'subscription', 'homeTasks', 'search', 'profile', 'notifications', 'help'];
  
  for (const category of categories) {
    if (chatbotResponses[category].patterns.some(pattern => message.includes(pattern))) {
      return {
        response: chatbotResponses[category].responses[
          Math.floor(Math.random() * chatbotResponses[category].responses.length)
        ],
        intent: category
      };
    }
  }

  // Default response
  return {
    response: chatbotResponses.default.responses[
      Math.floor(Math.random() * chatbotResponses.default.responses.length)
    ],
    intent: 'default'
  };
}

// Function to format response with markdown-like formatting
export function formatResponse(text) {
  // Convert **text** to bold (for display)
  // Convert • to bullet points
  // Convert numbered lists
  return text;
}

// Function to get suggested questions based on intent
export function getSuggestions(intent = null) {
  const allSuggestions = {
    initial: [
      "How do I add a warranty?",
      "How to manage subscriptions?",
      "Create a home maintenance task",
      "Update my profile",
      "How to search for items?",
      "Set up reminders"
    ],
    warranty: [
      "How to add a warranty?",
      "View my warranties",
      "Set warranty reminders",
      "Upload warranty documents"
    ],
    subscription: [
      "Add a subscription",
      "Manage auto-renewal",
      "View subscription details",
      "Set renewal reminders"
    ],
    homeTasks: [
      "Create a maintenance task",
      "Set task priority",
      "Mark task as complete",
      "View all tasks"
    ],
    profile: [
      "Update my profile",
      "Change password",
      "Edit contact information",
      "View account settings"
    ],
    search: [
      "Search warranties",
      "Find subscriptions",
      "Search home tasks",
      "How to use search?"
    ],
    notifications: [
      "View notifications",
      "Set up reminders",
      "Manage alerts",
      "Notification settings"
    ],
    help: [
      "How to use the system?",
      "Where is the FAQ page?",
      "Contact support",
      "View tutorials"
    ],
    default: [
      "Help with warranties",
      "Subscription management",
      "Home maintenance tasks",
      "Profile settings",
      "Search feature",
      "General help"
    ]
  };

  // Return suggestions based on intent, or default suggestions
  return allSuggestions[intent] || allSuggestions.default || allSuggestions.initial;
}

