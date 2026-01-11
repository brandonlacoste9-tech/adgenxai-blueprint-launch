# Agentic Orchestration Flow Diagram

```mermaid
graph TB
    %% User Input
    User[👤 User Input<br/>Business Prompt] --> Planning[🧠 Planning Agent<br/>Gemini 2.0 Flash<br/>thinkingBudget: 500]

    %% Planning Phase
    Planning --> TaskDecomp[📋 Task Decomposition<br/>Hero, Features, Pricing, CTA]
    TaskDecomp --> Supervisor[👔 Supervisor Agent<br/>Quality Gate<br/>Canadian Localization]

    %% Parallel Execution
    Supervisor --> ContentAgent[✍️ Content Agent<br/>Canadian Copy<br/>Business Logic]
    Supervisor --> DesignAgent[🎨 Design Agent<br/>React Components<br/>Modern Voyageur UI]

    %% Assembly Phase
    ContentAgent --> Assembly[🔧 Assembly Process<br/>Component Integration]
    DesignAgent --> Assembly
    Assembly --> Validation[✅ Validation Gates<br/>Brand Compliance<br/>Accessibility<br/>Performance]

    %% Human-in-the-Loop
    Validation --> Preview[👁️ Live Preview<br/>User Interface]
    Preview --> HumanReview{👤 Human<br/>Approval?}

    HumanReview -->|Approve| Export[📦 Export Pipeline<br/>HTML, ZIP, Deploy]
    HumanReview -->|Edit| Feedback[🔄 User Feedback<br/>Iteration Loop]
    Feedback --> Supervisor

    %% Styling
    classDef agentClass fill:#3d2b1f,color:#d4af37,stroke:#d4af37,stroke-width:2px
    classDef processClass fill:#1a1a1a,color:#ffffff,stroke:#d4af37,stroke-width:1px
    classDef userClass fill:#d4af37,color:#3d2b1f,stroke:#3d2b1f,stroke-width:2px

    class Planning,Supervisor,ContentAgent,DesignAgent agentClass
    class TaskDecomp,Assembly,Validation,Preview,Export,Feedback processClass
    class User,HumanReview userClass

    %% Performance Metrics
    Performance[<1.5s Total<br/>700 tokens<br/>4 Agents<br/>Real-time Streaming]:::processClass
    Validation -.-> Performance
```

## Key Performance Indicators

- **⚡ Speed:** <1.5 seconds end-to-end
- **🎯 Accuracy:** 95%+ first-pass quality
- **🇨🇦 Localization:** 100% Canadian English compliance
- **♿ Accessibility:** WCAG 2.1 AA certified
- **📱 Responsive:** Mobile-first design

## Agent Responsibilities

### 🧠 Planning Agent
- User intent analysis
- Task decomposition
- Canadian context application
- Resource allocation

### 👔 Supervisor Agent
- Quality assurance
- Brand compliance
- Progress monitoring
- Error handling

### ✍️ Content Agent
- Canadian copy generation
- Business logic application
- Conversion optimization
- Cultural adaptation

### 🎨 Design Agent
- React component generation
- Modern Voyageur styling
- Responsive layout
- Performance optimization