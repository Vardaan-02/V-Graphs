export interface NodeInput {
  id: string;
  label: string;
  required: boolean;
  type: string;
}

export interface NodeOutput {
  id: string;
  label: string;
  type: string;
}

export interface WorkflowNodeData {
  id: string;
  [key: string]: unknown;
  label: string;
  nodeType: string;
  icon: React.ReactNode;
  config?: Record<string, unknown>;
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
  description: string;
}

export interface NodeTemplate {
  id: string;
  type: string;
  label: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  defaultConfig?: Record<string, unknown>;
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
}

export const nodeTemplates: NodeTemplate[] = [
  {
    id: '0',
    type: 'start',
    label: 'Start',
    description: 'Start of the workflow with initial context',
    category: 'Triggers',
    icon: '🚀',
    defaultConfig: {
      context: {
        user: {
          name: 'user',
          email: 'user@example.com',
        },
      },
    },
    inputs: [],
    outputs: [{ id: 'output', label: 'Context', type: 'object' }],
  },
  {
    id: '1',
    type: 'trigger',
    label: 'Webhook',
    description: 'Trigger workflow via HTTP webhook',
    category: 'Triggers',
    icon: '🔗',
    defaultConfig: {
    url: "https://webhook.site/your-fixed-endpoint",
    method: "POST",
    headers: {
      "Authorization": "Bearer fixed-token",
      "Content-Type": "application/json"
    },
    payload: {
      userId: "12345",
      email: "user@example.com"
    }
  },  
    inputs: [],
    outputs: [{ id: 'output', label: 'Data', type: 'object' }],
  },
  {
    id: '3',
    type: 'condition',
    label: 'Filter',
    description: 'Filter data based on conditions',
    category: 'Logic',
    icon: '🎯',
    defaultConfig: {
      defaultConfig: {
        condition: {
          field: "status",          
          operator: "==",           
          value: "approved"         
        }
      }
      
    },
    inputs: [{ id: 'input', label: 'Data', required: true, type: 'object' }],
    outputs: [
      { id: 'true', label: 'True', type: 'object' },
      { id: 'false', label: 'False', type: 'object' },
    ],
  },
  {
    id: '4',
    type: 'transform',
    label: 'Transform',
    description: 'Transform and map data',
    category: 'Processing',
    icon: '🔄',
    defaultConfig: {
      mapping: {
        fullName: 'name',
        emailAddress: 'email',
        ageInYears: 'age'
      }
    },
    inputs: [{ id: 'input', label: 'Data', required: true, type: 'object' }],
    outputs: [{ id: 'output', label: 'Transformed', type: 'object' }],
  },
  {
    id: '5',
    type: 'delay',
    label: 'Delay',
    description: 'Add delay to workflow',
    category: 'Utilities',
    icon: '⏱️',
    defaultConfig: { 
      duration: 1000,
      message: 'Delay completed',
      reason: 'Workflow timing'
    },
    inputs: [{ id: 'input', label: 'Data', required: false, type: 'object' }],
    outputs: [{ id: 'output', label: 'Data', type: 'object' }],
  },
  {
    id: '6',
    type: 'httpGet',
    label: 'HTTP GET',
    description: 'Send a GET request to an external API',
    category: 'Actions',
    icon: '🔍',
    defaultConfig: {
      url: "https://jsonplaceholder.typicode.com/posts",
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      body: null,
      useGoogleAuth: false
    },
    inputs: [{ id: 'input', label: 'Input', required: false, type: 'object' }],
    outputs: [{ id: 'output', label: 'Response', type: 'object' }],
  },
  {
    id: '7',
    type: 'httpPost',
    label: 'HTTP POST',
    description: 'Send a POST request to an external API',
    category: 'Actions',
    icon: '📤',
    defaultConfig: {
      url: "https://jsonplaceholder.typicode.com/posts",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        title: "Sample Title",
        body: "Sample content",
        userId: 1
      },
      useGoogleAuth: false
    }
    ,
    inputs: [{ id: 'input', label: 'Input', required: false, type: 'object' }],
    outputs: [{ id: 'output', label: 'Response', type: 'object' }],
  },
  {
    id: '8',
    type: 'httpPut',
    label: 'HTTP PUT',
    description: 'Send a PUT request to update data on an external API',
    category: 'Actions',
    icon: '🛠️',
    defaultConfig: {
      url: 'https://api.example.com/resource',
      method: 'PUT',
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        updatedKey: "updatedValue"
      },
      useGoogleAuth: false
    },
    inputs: [{ id: 'input', label: 'Input', required: false, type: 'object' }],
    outputs: [{ id: 'output', label: 'Response', type: 'object' }],
  },
  {
    id: '9',
    type: 'httpDelete',
    label: 'HTTP DELETE',
    description: 'Send a DELETE request to an external API',
    category: 'Actions',
    icon: '🗑️',
    defaultConfig: {
      url: 'https://api.example.com/resource/123',
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json"
      },
      body: null,
      useGoogleAuth: false
    },
    inputs: [{ id: 'input', label: 'Input', required: false, type: 'object' }],
    outputs: [{ id: 'output', label: 'Response', type: 'object' }],
  },
  {
    id: '10',
    type: 'text-generation',
    label: 'Text Generation',
    description: 'Generate text using AI model output:{{generated_text}}',
    category: 'AI',
    icon: '🤖',
    defaultConfig: { prompt: '' },
    inputs: [{ id: 'input', label: 'Prompt', required: true, type: 'string' }],
    outputs: [{ id: 'output', label: 'Generated Text', type: 'string' }],
  },
  {
    id: '11',
    type: 'summarization',
    label: 'Summarization',
    description: 'Summarize text using AI model ouptput:{{summary}}',
    category: 'AI',
    icon: '📄',
    defaultConfig: { text: '' },
    inputs: [{ id: 'input', label: 'Text', required: true, type: 'string' }],
    outputs: [{ id: 'output', label: 'Summary', type: 'string' }],
  },
  {
    id: '12',
    type: 'ai-decision',
    label: 'AI Decision',
    description: 'Make a decision using an AI model output:{{decesion}} {{confidence}} {{reasoning}}',
    category: 'AI',
    icon: '🧠',
    defaultConfig: { decision_criteria: 'Make a decesion on basis of' ,options:[],confidence_threshold:0.5},
    inputs: [{ id: 'input', label: 'Input', required: true, type: 'string' }],
    outputs: [{ id: 'output', label: 'Decision', type: 'string' }],
  },
  {
    id: '13',
    type: 'question-answer',
    label: 'Question Answer',
    description: 'Answer questions using AI model output :{{answer}}',
    category: 'AI',
    icon: '❓',
    defaultConfig: { question: '', context_text: '' },
    inputs: [
      { id: 'question', label: 'Question', required: true, type: 'string' }
    ],
    outputs: [{ id: 'output', label: 'Answer', type: 'string' }],
  },
  {
    id: '14',
    type: 'text-classification',
    label: 'Text Classification',
    description: 'Classify text using AI model output:{{classification}} {{confidence}} {{categories}}',
    category: 'AI',
    icon: '🏷️',
    defaultConfig: { text: '',catgories:[] },
    inputs: [{ id: 'input', label: 'Text', required: true, type: 'string' }],
    outputs: [{ id: 'output', label: 'Class', type: 'string' }],
  },
  {
    id: '15',
    type: 'named-entity',
    label: 'Named Entity Recognition',
    description: 'Extract named entities from text output:{{text}} {{entities}} {{entity_types}} {{num_entities}}',
    category: 'AI',
    icon: '🔖',
    defaultConfig: { text: '' ,entity_types:[]},
    inputs: [{ id: 'input', label: 'Text', required: true, type: 'string' }],
    outputs: [{ id: 'output', label: 'Entities', type: 'object' }],
  },
  {
    id: '16',
    type: 'translation',
    label: 'Translation',
    description: 'Translate text using AI model output:{{translated_text}} {{source_language}} {{target_language}}',
    category: 'AI',
    icon: '🌐',
    defaultConfig: { text: 'Any Text U Want', source_language: 'en' ,target_language:"french"},
    inputs: [
      { id: 'input', label: 'Text', required: true, type: 'string' }
    ],
    outputs: [{ id: 'output', label: 'Translated Text', type: 'string' }],
  },
  {
    id: '17',
    type: 'content-generation',
    label: 'Content Generation',
    description: 'Generate content using AI model output:{{generated_content}} {{style}} {{length}}' ,
    category: 'AI',
    icon: '✍️',
    defaultConfig: { topic:"",content_type: 'blog_post',style: 'informative',length: 'medium' },
    inputs: [{ id: 'input', label: 'Prompt', required: true, type: 'string' }],
    outputs: [{ id: 'output', label: 'Content', type: 'string' }],
  },
  {
    id: '18',
    type: 'search-agent',
    label: 'Search Agent',
    description: 'Search information using AI agent output:{{search_results}} {{answer}}',
    category: 'AI',
    icon: '🔍',
    defaultConfig: { query: '' },
    inputs: [{ id: 'input', label: 'Query', required: true, type: 'string' }],
    outputs: [{ id: 'output', label: 'Results', type: 'object' }],
  },
  {
    id: '19',
    type: 'data-analyst-agent',
    label: 'Data Analyst Agent',
    description: 'Analyze data using AI agent output:{{analysis_result}} {{visualization}} {{insight}} {{anaylsis_plan}}',
    category: 'AI',
    icon: '📊',
    defaultConfig: { data: '', analysisType: '',create_visualization:'',dataset:''},
    inputs: [
      { id: 'data', label: 'Data', required: true, type: 'object' },
      { id: 'analysisType', label: 'analysis_request', required: false, type: 'string' },
    ],
    outputs: [{ id: 'output', label: 'Analysis Result', type: 'object' }],
  },
  {
    id: '20',
    type: 'googleCalendar',
    label: 'Google Calendar',
    description: 'Create an event in Google Calendar',
    category: 'Actions',
    icon: '📅',
    defaultConfig: {
      summary: 'Team Sync Meeting',
      startTime: '27 June 2025, 10:00 AM',
      endTime: '27 June 2025, 11:00 AM',
      description: 'Weekly team sync to discuss project updates and blockers.',
      location: 'Zoom - https://zoom.us/j/1234567890',
      calendarId: 'primary',
      useGoogleAuth: true,
    },    
    inputs: [{ id: 'input', label: 'Data', required: false, type: 'object' }],
    outputs: [{ id: 'output', label: 'Calendar Event', type: 'object' }],
  },
  {
    id: '21',
    type: 'calculator',
    label: 'Calculator',
    description: 'Evaluate math expression with variables',
    category: 'Utilities',
    icon: '🧮',
    defaultConfig: {
      expression: '2 + 3 * 5',
    },
    inputs: [
      {
        id: 'input',
        label: 'Context',
        type: 'object',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'output',
        label: 'Result',
        type: 'object',
      },
    ],
  },
  {
    id: '22',
    type: 'currentTime',
    label: 'Current Time',
    description: 'Get current time in a specific time zone',
    category: 'Utilities',
    icon: '🕒',
    defaultConfig: {
      timeZone: 'Asia/Kolkata',
    },
    inputs: [],
    outputs: [
      {
        id: 'output',
        label: 'Timestamp',
        type: 'object',
      },
    ],
  },
    {
      id: '23',
      type: 'gmailSend',
      label: 'Gmail Send',
      description: 'Send emails using Gmail API',
      category: 'Gmail',
      icon: '📧',
      defaultConfig: {
        to: "primary@example.com",
        cc: "cc1@example.com, cc2@example.com",     
        bcc: "hidden1@example.com, hidden2@example.com", 
        subject: "Hello from Workflow",
        body: "This is an automated email sent from your workflow.",
        useGoogleAuth: true,
      },
      inputs: [{ id: 'input', label: 'Data', required: false, type: 'object' }],
      outputs: [{ id: 'output', label: 'Email Result', type: 'object' }],
    },
    {
      id: '24',
      type: 'gmailSearch',
      label: 'Gmail Search',
      description: 'Search emails in Gmail',
      category: 'Gmail',
      icon: '🔍',
      defaultConfig: {
        query: 'is:unread',
        maxResults: 10,
        includeSpamTrash: false,
        useGoogleAuth: true,
      },
      inputs: [{ id: 'input', label: 'Search Data', required: false, type: 'object' }],
      outputs: [{ id: 'output', label: 'Search Results', type: 'object' }],
    },
    {
      id: '25',
      type: 'gmailMarkRead',
      label: 'Gmail Mark Read',
      description: 'Mark Gmail messages as read or unread',
      category: 'Gmail',
      icon: '👁️',
      defaultConfig: {
        messageIds: "18c1234567890abcdef, 18cabcdef1234567890",
        markAsRead: true,
        useGoogleAuth: true
      },
      inputs: [{ id: 'input', label: 'Message Data', required: true, type: 'object' }],
      outputs: [{ id: 'output', label: 'Update Result', type: 'object' }],
    },
    {
      id: '26',
      type: 'gmailAddLabel',
      label: 'Gmail Add Label',
      description: 'Add or remove labels from Gmail messages',
      category: 'Gmail',
      icon: '🏷️',
      defaultConfig: {
        messageIds: "18c1234567890abcdef, 18cabcdef1234567890",
        labelsToAdd: "SPAM",
        labelsToRemove: "UNREAD",
        useGoogleAuth: true,
      },
      inputs: [{ id: 'input', label: 'Message Data', required: true, type: 'object' }],
      outputs: [{ id: 'output', label: 'Label Result', type: 'object' }],
    },
    {
      id: '27',
      type: 'gmailCreateDraft',
      label: 'Gmail Create Draft',
      description: 'Create a draft email in Gmail',
      category: 'Gmail',
      icon: '📝',
      defaultConfig: {
        to: "recipient@example.com",
        cc: "ccuser1@example.com, ccuser2@example.com",
        bcc: "bccuser1@example.com, bccuser2@example.com",
        subject: "Draft Subject",
        body: "This is the body of the draft email.",
        useGoogleAuth: true
      },
      inputs: [{ id: 'input', label: 'Draft Data', required: false, type: 'object' }],
      outputs: [{ id: 'output', label: 'Draft Result', type: 'object' }],
    },
    {
      id: '2',
      type: 'gmailReply',
      label: 'Gmail Reply',
      description: 'Reply to a Gmail message',
      category: 'Gmail',
      icon: '↩️',
      defaultConfig: {
        messageId: "18cabcdef1234567890",  
        replyBody: "Thank you for your email. I'll get back to you shortly.",
        replyAll: false,
        useGoogleAuth: true
      },
      inputs: [{ id: 'input', label: 'Reply Data', required: true, type: 'object' }],
      outputs: [{ id: 'output', label: 'Reply Result', type: 'object' }],
    },
    {
      id: '28',
      type: 'action',
      label: 'Send Email',
      description: 'Send email notification',
      category: 'Actions',
      icon: '📧',
      defaultConfig: {
        to: "recipient@example.com",      
        subject: "Notification Subject",  
        body: "This is the message body." 
      },
      inputs: [{ id: 'input', label: 'Data', required: true, type: 'object' }],
      outputs: [{ id: 'output', label: 'Result', type: 'object' }]
    }
  ];