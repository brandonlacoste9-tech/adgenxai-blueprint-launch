# 🦾 **IRON MAN PROTOCOL - PHYSICAL COMMAND CENTER SETUP**

## **🇨🇦 AdgenXAI Physical Command Center Activation**

**Transform your desk into a sci-fi AI orchestration command center. When you present to Google, you're not just showing software - you're demonstrating the future of human-AI collaboration.**

---

## **🎥 PHASE 1: CINEMATIC BROADCAST SETUP (OBS Integration)**

### **1. Install & Configure OBS Studio**
```bash
# Download from: https://obsproject.com/
# Install plugins:
# - Browser Source (built-in)
# - StreamFX (for advanced effects)
# - Move Transition (for dynamic overlays)
```

### **2. Create AdgenXAI Scene**
1. **Add Browser Source:**
   - Name: "Mission Control Overlay"
   - URL: `http://localhost:3000/mission-control`
   - Width: 1920, Height: 1080
   - CSS: Copy from `obs-overlay.css`

2. **Positioning:**
   - Place browser source as picture-in-picture
   - Position: Bottom-right corner
   - Scale: 75%
   - Add drop shadow and glow effects

3. **Add Camera Feed:**
   - Primary camera as main source
   - Position Mission Control overlay beside you
   - Add "holographic" border effects

### **3. Advanced OBS Effects**
```css
/* Add to OBS Custom CSS for holographic effect */
.browser-source {
  filter: drop-shadow(0 0 20px rgba(212, 175, 55, 0.5));
  border: 2px solid transparent;
  background: linear-gradient(45deg, transparent, rgba(212, 175, 55, 0.1), transparent);
  animation: hologram 3s linear infinite;
}

@keyframes hologram {
  0%, 100% { border-color: transparent; }
  50% { border-color: rgba(212, 175, 55, 0.5); }
}
```

---

## **🎛️ PHASE 2: HARDWARE CONTROL SETUP (Stream Deck Integration)**

### **1. Hardware Requirements**
- **Elgato Stream Deck** (15-key model recommended)
- **Node.js** 16+
- **USB Connection** (direct to your computer)

### **2. Install Dependencies**
```bash
cd stream-deck
npm install
```

### **3. Configure Environment**
```bash
# Create .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
STREAM_DECK_MODEL=original  # 'original', 'mini', 'xl'
```

### **4. Button Configuration**
The script auto-configures these buttons:

| Button | Function | Visual | Action |
|--------|----------|--------|---------|
| **0** | 🚀 DEPLOY AGENTS | Gold | Full orchestration |
| **1** | 🔍 RESEARCH | Blue | Grounding search |
| **2** | 🎨 CREATE | Red | Brand DNA extraction |
| **3** | ⚖️ AUDIT | Orange | Compliance check |
| **4** | 💡 WAR ROOM | Green | Lighting control |
| **5** | 🎛️ MISSION CTRL | Purple | UI toggle |
| **6** | 💰 COST REPORT | Teal | Generate report |
| **7** | 🛑 EMERGENCY | Red | Stop all agents |

### **5. Launch Bridge**
```bash
cd stream-deck
npm start
```

**Demo Script:** *"I'm not clicking a mouse. I'm physically deploying AI agents with this button press."*

---

## **💡 PHASE 3: ATMOSPHERIC LIGHTING SETUP**

### **1. Choose Your System**
- **Philips Hue** (recommended for full control)
- **LIFX** (easier setup)
- **Home Assistant** (most flexible)

### **2. Philips Hue Setup**
```bash
# Install Hue Bridge on your network
# Get API key via: https://developers.meethue.com/develop/get-started-2/
export HUE_BRIDGE_IP=192.168.1.100
export HUE_API_KEY=your-api-key
export LIGHTING_SYSTEM=hue
```

### **3. Configure Lighting Scenes**

The system includes these pre-configured scenes:

- **DEFAULT**: Standard working mode
- **ORCHESTRATION_ACTIVE**: Deep cognac + gold accents
- **RESEARCH_MODE**: Cool blue for concentration
- **CREATIVE_MODE**: Warm purple for flow state
- **WAR_ROOM**: Presentation mode (gold focus)
- **SUCCESS**: Celebration mode (bright gold)
- **ALERT**: Error state (red warning)

### **4. Trigger Lighting**
```bash
# Manual trigger
node lighting-control.js scene WAR_ROOM

# Event-based (integrates with AI agents)
node lighting-control.js event orchestration_start
```

---

## **🧠 PHASE 4: RTX 4090 LOCAL AI SETUP (Ollama Integration)**

### **1. Install Ollama**
```bash
# Download from: https://ollama.ai/
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve
```

### **2. Download Models**
```bash
# Fast models for real-time interaction
ollama pull llama2:7b-chat
ollama pull codellama:7b

# High-quality models for deep reasoning
ollama pull llama2:13b-chat
ollama pull codellama:13b
```

### **3. Modify Orchestrator for Hybrid Routing**
Update `supabase/functions/adgen-orchestrator/index.ts`:

```typescript
// HYBRID CLOUD/LOCAL ROUTING
const routeToModel = (task: string) => {
  // Fast classification tasks -> Local RTX 4090
  if (isSimpleTask(task)) {
    return "http://localhost:11434/api/generate";
  }
  // Complex reasoning -> Google Vertex
  return "https://generativelanguage.googleapis.com...";
};
```

### **4. Performance Benefits**
- **0ms Latency** for simple tasks
- **Cost Savings** on basic operations
- **Offline Capability** for development
- **GPU Acceleration** for local processing

---

## **🎙️ PHASE 5: AUDIO ENGINEERING SETUP**

### **1. Microphone Configuration**
- **Shure SM7B** with Cloudlifter
- **Izotope RX** for noise reduction
- **Focusrite Scarlett** interface

### **2. OBS Audio Setup**
- **Mic/Auxiliary Audio**: SM7B input
- **Noise Suppression**: RNNoise plugin
- **Compressor**: For consistent levels
- **EQ**: High-pass filter + presence boost

### **3. Voice Processing**
```bash
# Real-time voice effects (optional)
# Add robot/AI voice modulation for dramatic effect
```

---

## **🎯 PHASE 6: PRESENTATION EXECUTION**

### **Pre-Presentation Checklist**
- [ ] **OBS Scene Ready** - Mission Control overlay positioned
- [ ] **Stream Deck Connected** - All buttons functional
- [ ] **Lighting Active** - War Room scene enabled
- [ ] **Ollama Running** - Local AI models loaded
- [ ] **Microphone Live** - Audio levels calibrated
- [ ] **Demo Data Loaded** - Aurora Coffee campaign ready

### **Live Presentation Flow**
1. **Open with Impact:** *"I'm not here to show you software. I'm here to show you the future of human-AI collaboration."*

2. **Physical Demo:** *"Watch what happens when I physically deploy AI agents."* (Press Stream Deck button 0)

3. **Lighting Integration:** *"The room itself responds to AI activity."* (Press button 4)

4. **Real-Time Orchestration:** *"The agents are thinking right now - live cost savings appearing."* (Mission Control overlay)

5. **Hardware Control:** *"This isn't a mouse click. This is physical AI orchestration."*

### **Key Demo Moments**
- **Stream Deck Press** → Instant agent deployment
- **Lighting Change** → Room transforms to "War Room"
- **Overlay Updates** → Live metrics and agent thoughts
- **Cost Savings** → Numbers incrementing in real-time

---

## **🔧 TROUBLESHOOTING & OPTIMIZATION**

### **Stream Deck Issues**
```bash
# Check USB connection
lsusb | grep Elgato

# Restart bridge
cd stream-deck && npm start

# Test button mapping
curl -X POST http://localhost:3000/api/stream-deck-test
```

### **Lighting Problems**
```bash
# Test Hue connection
node lighting-control.js scene DEFAULT

# Check Home Assistant
curl -H "Authorization: Bearer $TOKEN" http://home-assistant/api/status
```

### **OBS Performance**
- **Disable Hardware Acceleration** if experiencing lag
- **Use 30 FPS** for overlays during presentation
- **Pre-render** complex CSS animations

---

## **🏆 SUCCESS METRICS**

**Your Iron Man Protocol succeeds when:**
- [ ] Google team asks *"Can we see the hardware control?"*
- [ ] Lighting changes get audible reactions
- [ ] Stream Deck button presses feel "powerful"
- [ ] Mission Control overlay looks like sci-fi UI
- [ ] The presentation feels like a command center demo

---

## **🚀 FINAL ACTIVATION SEQUENCE**

```bash
# 1. Start all systems
ollama serve &                    # Local AI models
cd stream-deck && npm start &     # Hardware control
node lighting-control.js scene WAR_ROOM &  # Atmosphere
obs &                             # Broadcast system

# 2. Launch presentation
npm run dev                       # Start AdgenXAI
# Open http://localhost:3000/mission-control in OBS

# 3. Begin orchestration
# Press Stream Deck button 0: "DEPLOY AGENTS"
```

---

## **🇨🇦 CANADIAN COMMAND CENTER**

**This isn't just technology - it's Canadian innovation at its finest:**

- **Heritage & Modernity**: Leather & gold aesthetic meets cutting-edge AI
- **Practical Excellence**: Solving real business problems with elegant solutions
- **Human-Centered Design**: AI that augments human creativity, not replaces it
- **Environmental Consciousness**: Energy-efficient local processing where possible

---

**🎯 You now have a physical command center that makes Google say: "This isn't a startup pitch. This is a technology demonstration."**

**Welcome to the future of AI presentation. The Iron Man Protocol is active.** 🦾✨

**Show them what the future looks like when humans and AI become one command center.**