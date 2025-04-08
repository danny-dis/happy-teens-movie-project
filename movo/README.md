<div align="center">

# 🎬 Movo

### A next-generation streaming platform with advanced peer-to-peer technology

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Enabled-4285F4?style=flat-square&logo=webrtc)](https://webrtc.org/)
[![WebTorrent](https://img.shields.io/badge/WebTorrent-2.0.0-FF2D37?style=flat-square)](https://webtorrent.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

<img src="https://i.imgur.com/XYBnHUp.png" alt="Movo" width="600"/>

</div>

A modern, feature-rich streaming platform designed for both online and offline viewing with advanced peer-to-peer capabilities. Movo is a hybrid solution that combines centralized services with P2P technology, offering the best of both worlds. It features the innovative Chimera Mode that allows users to seamlessly switch between online streaming and local content, providing a consistent experience regardless of internet connectivity.

For a fully decentralized alternative with no central servers, check out our sister project [Filo](../filo).

## 🌟 Key Features

### Core Functionality
- **Chimera Mode**: Seamlessly switch between online streaming and local content with a toggle in settings
- **Dual-Mode Operation**: Two pages - local side for downloaded content and streaming side for online content
- **Netflix/Plex-like Interface**: Intuitive, responsive design optimized for all devices
- **Multi-User Profiles**: Personalized experiences with individual preferences and watch history
- **Advanced Search**: Comprehensive search with filters for genre, year, rating, and more
- **Subtitle Support**: Multi-language subtitles with customizable appearance
- **Auto-Skip Intro/Outro**: Automatically skip opening and closing credits

### Advanced P2P Streaming
- **WebRTC-Based P2P Network**: Stream content directly from other users for faster playback and reduced server load
- **4K Resolution Support**: High-quality streaming optimized through distributed bandwidth
- **Adaptive Multi-Peer Streaming**: Dynamically fetch content from multiple peers simultaneously
- **Intelligent Bandwidth Management**: Optimize upload/download based on network conditions
- **Geographic Peer Optimization**: Connect to nearby peers for lower latency
- **Enhanced Security**: End-to-end encryption and content verification

### Analytics and Management
- **Content Analytics Dashboard**: Detailed viewing statistics and trends
- **Download Manager**: Background downloading with queue management
- **P2P Network Visualization**: Real-time visualization of peer connections
- **Bandwidth Monitoring**: Track upload/download usage with detailed metrics

### Social Features
- **Content Sharing**: Share recommendations with friends
- **Social Integration**: Share activity on social platforms
- **Rating System**: Rate and review content

### Experimental Features
- **Extended Reality**: VR cinema experience and AR content overlays
- **AI-Generated Content**: Personalized recaps, custom trailers, and content summarization
- **Light Field Video**: Support for volumetric video with perspective manipulation
- **Quantum-Resistant Cryptography**: Future-proof security against quantum computing attacks
- **Neural Rendering**: AI-enhanced upscaling and frame interpolation for smoother playback

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (for user data and metadata storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/zophlic/movo.git
cd movo
```

2. Install dependencies for both server and client:
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
API_KEY=your_movie_api_key
PORT=5000
```

4. Start the development servers:
```bash
# Start the backend server
npm start

# In a separate terminal, start the client
cd client
npm start
```

## 🔧 P2P Configuration

The platform includes advanced P2P streaming capabilities that can be configured through the user interface:

1. **Enable/Disable P2P**: Toggle P2P functionality in the settings menu
2. **Bandwidth Limits**: Set upload and download speed limits
3. **Connection Limits**: Control the maximum number of peer connections
4. **Network Preferences**: Configure P2P to only work on Wi-Fi or unrestricted networks
5. **Content Sharing Duration**: Set how long to share content after downloading

## 📱 Supported Platforms

- **Web Browsers**: Chrome, Firefox, Edge, Safari (with WebRTC support)
- **Mobile Devices**: Responsive design works on iOS and Android devices
- **Smart TVs**: Optimized interface for large screens and remote controls
- **Tablets**: Adaptive layout for various tablet sizes

## 🛠️ Technology Stack

### Frontend
- React.js with hooks for UI components
- Redux for state management
- React Router for navigation
- WebRTC and WebTorrent for P2P streaming
- Recharts for analytics visualization

### Backend
- Node.js with Express
- MongoDB for database
- JWT for authentication
- WebSocket for real-time communication

### P2P Technologies
- WebTorrent for torrent-based P2P streaming
- Simple-Peer for WebRTC connections
- CryptoJS for secure communications

## 🔄 P2P Architecture

Our advanced P2P implementation uses a hybrid approach combining WebTorrent and WebRTC technologies:

### Core Components

1. **Distributed Hash Table (DHT)**: Enables peer discovery without centralized trackers
2. **WebRTC Data Channels**: Provides direct peer-to-peer connections with NAT traversal
3. **Chunk-Based Content Delivery**: Splits content into small pieces that can be fetched from multiple peers
4. **Adaptive Bitrate Selection**: Dynamically adjusts quality based on available bandwidth
5. **Geographic Peer Optimization**: Prioritizes connections to nearby peers for lower latency

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Peer A    │◄────┤   Tracker   │────►│   Peer C    │
│  (Seeder)   │     │   Network   │     │  (Leecher)  │
└──────┬──────┘     └─────────────┘     └──────▲──────┘
       │                                        │
       │           ┌─────────────┐              │
       └──────────►│   Peer B    │──────────────┘
                   │  (Seeder)   │
                   └─────────────┘
```

### Security Measures

- **End-to-End Encryption**: All peer communications are encrypted using AES-256
- **Content Verification**: SHA-256 hashing ensures content integrity
- **Rotating Peer IDs**: Periodically changes peer identifiers for enhanced privacy
- **Permission-Based Sharing**: Granular control over what content is shared

### Performance Optimizations

- **Predictive Piece Selection**: Intelligently requests the most critical pieces first
- **Connection Pooling**: Maintains a pool of peer connections for faster startup
- **Parallel Downloads**: Simultaneously downloads different chunks from multiple peers
- **WebAssembly Acceleration**: Performance-critical parts use WASM for efficiency

## 🔐 Privacy and Security

The platform prioritizes user privacy and content security:

- **End-to-End Encryption**: All peer communications are encrypted
- **Content Verification**: Ensures integrity of downloaded content
- **Rotating Identifiers**: Periodically rotates user identifiers for enhanced privacy
- **Network Awareness**: Respects user preferences for metered connections
- **Secure Metadata**: Protects information about viewing habits
- **Zero-Knowledge Verification**: Verify content without revealing what's being accessed
- **Plausible Deniability**: Technical measures ensure users can't determine exactly what others are sharing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🧪 Experimental Features

Movo includes several cutting-edge experimental features that can be enabled in the settings:

- **Extended Reality**: VR cinema experience, AR content overlays, and spatial audio features
- **AI-Generated Content**: Personalized recaps, custom trailer creation, and content summarization
- **Next-Gen Content Formats**: Support for 8K HDR, high frame rate content, and advanced color spaces
- **Quantum-Resistant Cryptography**: Future-proof encryption algorithms designed to withstand quantum computing attacks
- **Neural Enhancement**: Real-time video quality enhancement, upscaling, and color grading
- **Spatial Audio**: 3D audio that adapts to your position and viewing environment
- **Dynamic Adaptation**: AI-powered content adaptation for different aspect ratios and devices
- **Real-Time Translation**: AI-powered translation and voice synthesis for global content
- **Light Field Video**: Volumetric video that allows changing perspective after recording (developed by zophlic)
- **Neural Rendering**: AI-enhanced upscaling and frame interpolation for smoother playback

## 🔮 Future Roadmap

- **WebAssembly Acceleration**: Port performance-critical code to WASM for 2-3x speed improvements
- **Machine Learning Enhancements**: AI-driven peer selection and content recommendations
- **Decentralized Content Mesh**: Multi-protocol support (IPFS, Hypercore) for maximum content availability
- **Zero-Knowledge Privacy Framework**: Enhanced privacy-preserving content sharing
- **Distributed Edge Acceleration**: Edge node integration for improved performance
- **Real-Time Collaborative Viewing**: Synchronized playback with chat functionality

## 📞 Contact

For questions or support, please open an issue in the GitHub repository or contact the maintainers directly.

---

*Movo - Bringing the future of streaming to your devices today. Developed with ❤️ by zophlic. All experimental features curated and implemented by zophlic. © 2023 zophlic*
